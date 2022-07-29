import {
  Gesture
} from "./gestures/Gesture";

import { Tap } from "./gestures/Tap";
import { Press } from "./gestures/Press";
import { Pan } from "./gestures/Pan";

import { PointerManager } from "./PointerManager";

/*
 * PointerListener class
 *	- implements the possibility to listen to gesture events performed on a specific DOM Element
 *	  expample: element.addEventListener("pan", function(event){});
 *	- creates the PointerManager instance
 *	- updates the PointerManager instance
 *	- uses the PointerManager instance to determine which gesture(s) are performed by passing PointerManager instances to GestureRegonizers
 *
 *	- var listener = new PointerListener(domElement, {});
 *	- domElement.addEventListener("pan", function(){});
 */

/**
 * pointerdownEvent ->  PointerListener.onPointerDown -> PointerManager.addPointer -> recognizeGestures (on move, idle, up, leave, cancel)
 * pointerupEvent -> PointerListener.onPointerUp -> PointerManager.onPointerUp -> Pointeristener.recognizeGestures
 */

type GestureConstructor = new (...args: ConstructorParameters<typeof Gesture>) => Gesture;

const ALL_GESTURE_CLASSES: GestureConstructor[] = [Tap, Press, Pan]; //, Pinch, Rotate, TwoFingerPan];

type Timer = ReturnType<typeof setInterval>;

interface PointerListenerOptions {
  DEBUG: boolean;
  DEBUG_GESTURES: boolean;
  DEBUG_POINTERMANAGER: boolean;

  bubbles: boolean;
  handleTouchEvents: boolean;
  supportedGestures: Gesture[];

  // Hooks
  pointerdown?: (event: PointerEvent, self: PointerListener) => void;
  pointermove?: (event: PointerEvent, self: PointerListener) => void;
  pointerup?: (event: PointerEvent, self: PointerListener) => void;
  pointercancel?: (event: PointerEvent, self: PointerListener) => void;
}


export class PointerListener {
  readonly options: PointerListenerOptions;
  DEBUG: boolean;

  private readonly domElement: HTMLElement;

  private readonly gestureEventHandlers: Record<string, EventListenerOrEventListenerObject[]>;
  private pointerEventHandlers: Record<string, (event: PointerEvent) => void>;
  private touchEventHandlers: Record<string, (event: TouchEvent) => void>;

  private pointerManager: PointerManager;

  private lastRecognitionTimestamp: number | null;
  private idleRecognitionIntervalId: Timer | null;

  private supportedGestures: Gesture[];

  constructor(domElement: HTMLElement, options?: Partial<PointerListenerOptions>) {
    // registry for events like "pan", "rotate", which have to be removed on this.destroy();
    this.gestureEventHandlers = {};

    this.lastRecognitionTimestamp = null;
    this.idleRecognitionIntervalId = null;

    this.pointerEventHandlers = {};
    this.touchEventHandlers = {};

    options = options || {};

    this.options = {
      DEBUG: false,
      DEBUG_GESTURES: false,
      DEBUG_POINTERMANAGER: false,
      bubbles: true,
      handleTouchEvents: true,
      supportedGestures: [],
      ...options
    };

    this.DEBUG = true; //this.options.DEBUG;

    const supportedGestures = options.supportedGestures ?? ALL_GESTURE_CLASSES;

    // instantiate gesture classes on domElement and add them to this.options
    const instantiatedGestures = supportedGestures.map(GestureClass => {
      if (typeof GestureClass === "function") {
        const gestureOptions = {
          bubbles: this.options.bubbles,
          DEBUG: this.options.DEBUG_GESTURES,
        };

        return new GestureClass(domElement, gestureOptions);
      }

      if (typeof GestureClass === "object") {
        return GestureClass;
      }

      throw new Error(`unsupported gesture type: ${typeof GestureClass}`);
    });

    // this.supportedGestures have to be instantiated gestures
    this.supportedGestures = instantiatedGestures;

    this.domElement = domElement;

    this.pointerManager = new PointerManager();

    // disable context menu on long taps - this kills pointermove
    /*domElement.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      return false;
    });*/

    this.addPointerEventListeners();

    this.addTouchEventListeners();

  }

  /* PointerEvent handling */
  private addPointerEventListeners(): void {

    const domElement = this.domElement;

    // create references, so the listener can be removed at a later time
    // .bind(this): make sure that the instance of PointerListener is accessible in the EventHandler
    const onPointerDown = this.onPointerDown.bind(this);
    const onPointerMove = this.onPointerMove.bind(this);
    const onPointerUp = this.onPointerUp.bind(this);
    //const onPointerLeave = this.onPointerLeave.bind(this);
    //const onPointerOut = this.onPointerOut.bind(this);
    const onPointerCancel = this.onPointerCancel.bind(this);

    domElement.addEventListener("pointerdown", onPointerDown, { passive: true });
    domElement.addEventListener("pointermove", onPointerMove, { passive: true });
    domElement.addEventListener("pointerup", onPointerUp, { passive: true });
    /*
     * case: user presses mouse button and moves element. while moving, the cursor leaves the element (fires pointerout)
     *		while outside the element, the mouse button is released. pointerup is not fired.
     *		during pan, pan should not end if the pointer leaves the element.
     * MDN: Pointer capture allows events for a particular pointer event (PointerEvent) to be re-targeted to a particular element instead of the normal (or hit test) target at a pointer's location. This can be used to ensure that an element continues to receive pointer events even if the pointer device's contact moves off the element (such as by scrolling or panning).
     *  this problem is solved by using setPointerCapture()
     */
    //domElement.addEventListener("pointerleave", onPointerLeave, { passive: true });
    //domElement.addEventListener("pointerout", onPointerOut, { passive: true });
    domElement.addEventListener("pointercancel", onPointerCancel, { passive: true });

    this.pointerEventHandlers = {
      pointerdown: onPointerDown,
      pointermove: onPointerMove,
      pointerup: onPointerUp,
      //pointerleave: onPointerLeave,
      //pointerout: onPointerOut,
      pointercancel: onPointerCancel,
    };

  }

  // there may be more than one pointer. Each new pointer fires onPointerDown
  private onPointerDown(pointerdownEvent: PointerEvent) {
    if (this.DEBUG == true) {
      console.log(`[PointerListener] pointerdown event detected`);
    }

    // re-target all pointerevents to the current element
    // see https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture
    this.domElement.setPointerCapture(pointerdownEvent.pointerId);

    this.pointerManager.addPointer(pointerdownEvent);

    this.options.pointerdown?.(pointerdownEvent, this);

    // before starting a new interval, make sure the old one is stopped if present
    if (this.idleRecognitionIntervalId != null) {
      this.clearIdleRecognitionInterval();
    }

    this.idleRecognitionIntervalId = setInterval(() => {
      this.onIdle();
    }, 100);
  }

  private onPointerMove(pointermoveEvent: PointerEvent) {
    // pointermove is also firing if the mouse button is not pressed

    if (this.pointerManager.hasPointersOnSurface() == true) {
      // this would disable vertical scrolling - which should only be disabled if a panup/down or swipeup/down listener has been triggered
      // event.preventDefault();

      this.pointerManager.onPointerMove(pointermoveEvent);
      this.recognizeGestures();

      this.options.pointermove?.(pointermoveEvent, this);
    }
  }

  private onPointerUp(pointerupEvent: PointerEvent) {
    if (this.DEBUG == true) {
      console.log("[PointerListener] pointerup event detected");
    }

    this.domElement.releasePointerCapture(pointerupEvent.pointerId);

    if (this.pointerManager.hasPointersOnSurface() == true) {

      this.pointerManager.onPointerUp(pointerupEvent);
      this.recognizeGestures();

      this.options.pointerup?.(pointerupEvent, this);
    }

    this.clearIdleRecognitionInterval();
  }

  /*private onPointerLeave(event: PointerEvent) {
    if (this.DEBUG == true) {
      console.log("[PointerListener] pointerleave detected");
    }

    if (this.pointerManager.hasPointersOnSurface() == true) {
      this.pointerManager.onPointerLeave(event);
      this.recognizeGestures();
    }

    this.clearIdleRecognitionInterval();
  }

  private onPointerOut(pointeroutEvent: PointerEvent) {
    if (this.DEBUG == true) {
      console.log("[PointerListener] pointerout detected");
    }

    if (this.pointerManager.hasPointersOnSurface() == true) {
      this.pointerManager.onPointerOut(pointeroutEvent);
      this.recognizeGestures();
    }

    this.clearIdleRecognitionInterval();
  }*/

  private onPointerCancel(pointercancelEvent: PointerEvent) {
    this.domElement.releasePointerCapture(pointercancelEvent.pointerId);

    if (this.DEBUG == true) {
      console.log("[PointerListener] pointercancel detected");
    }

    this.pointerManager.onPointerCancel(pointercancelEvent);
    this.recognizeGestures();

    this.clearIdleRecognitionInterval();

    this.options.pointercancel?.(pointercancelEvent, this);
  }

  public removePointerEventListeners(): void {
    for (const event in this.pointerEventHandlers) {
      const handler = this.pointerEventHandlers[event];
      this.domElement.removeEventListener(event, handler as EventListener);
    }
  }

  // provide the ability to interact/prevent touch events
  // scrolling (touchmove event) results in pointerCancel event, stopping horizontal panning if user scrolls vertically
  // the better solution is using eg css: touch-action: pan-y;
  addTouchEventListeners(): void {
    if (this.options.handleTouchEvents == true) {

      const onTouchMove = this.onTouchMove.bind(this);

      this.domElement.addEventListener("touchmove", onTouchMove);

      this.touchEventHandlers["touchmove"] = onTouchMove;

      /*this.domElement.addEventListener("touchstart", (event) => {

      });*/

      /*this.domElement.addEventListener("touchend", (event) => {
      });

      this.domElement.addEventListener("touchcancel", (event) => {
      });*/
    }
  }

  removeTouchEventListeners(): void {
    for (const event in this.touchEventHandlers) {
      const handler = this.touchEventHandlers[event];
      this.domElement.removeEventListener(event, handler as EventListener);
    }
  }

  private onTouchMove(event: TouchEvent): void {
    // fire onTouchMove for all gestures
    for (let g = 0; g < this.supportedGestures.length; g++) {
      const gesture = this.supportedGestures[g];

      gesture.onTouchMove(event);
    }
  }


  // to recognize Press, recognition has to be run if the user does nothing while having contact with the surface (no pointermove, no pointerup, no pointercancel)
  private onIdle(): void {
    if (this.pointerManager.hasPointersOnSurface() == false) {
      this.clearIdleRecognitionInterval();
    } else {
      const now = new Date().getTime();
      let timedelta = null;

      if (this.lastRecognitionTimestamp != null) {
        timedelta = now - this.lastRecognitionTimestamp;
      }

      if (timedelta == null || timedelta > 100) {
        this.pointerManager.onIdle();

        if (this.DEBUG == true) {
          console.log("[PointerListener] onIdle - running idle recognition");
        }

        this.recognizeGestures();
      }
    }
  }

  private clearIdleRecognitionInterval(): void {
    if (this.idleRecognitionIntervalId != null) {
      clearInterval(this.idleRecognitionIntervalId);
      this.idleRecognitionIntervalId = null;
    }
  }

  // recognize gestures only for the matching active pointer count
  //
  private recognizeGestures(): void {

    this.lastRecognitionTimestamp = new Date().getTime();

    for (let g = 0; g < this.supportedGestures.length; g++) {
      const gesture = this.supportedGestures[g];

      gesture.recognize(this.pointerManager!);
    }
  }

  /*
   *	handler management
   *	eventsString: one or more events: "tap" or "pan twofingerpan pinchend"
   *	currently, it is not supported to add the same handlerReference twice (once with useCapture = true, and once with useCapture = false)
   *	useCapture defaults to false
   */
  private parseEventsString(eventsString: string): string[] {
    return eventsString.trim().split(/\s+/g);
  }

  on(eventsString: string, handlerReference: EventListenerOrEventListenerObject): void {
    const eventTypes = this.parseEventsString(eventsString);

    for (let e = 0; e < eventTypes.length; e++) {
      const eventType = eventTypes[e];

      if (!(eventType in this.gestureEventHandlers)) {
        this.gestureEventHandlers[eventType] = [];
      }

      if (this.gestureEventHandlers[eventType].indexOf(handlerReference) == -1) {
        this.gestureEventHandlers[eventType].push(handlerReference);
      }

      this.domElement.addEventListener(eventType, handlerReference, false);
    }
  }

  off(eventsString: string, handlerReference: EventListenerOrEventListenerObject): void {
    const eventTypes = this.parseEventsString(eventsString);

    for (let e = 0; e < eventTypes.length; e++) {
      const eventType = eventTypes[e];

      if (eventType in this.gestureEventHandlers) {
        const handlerReferences = this.gestureEventHandlers[eventType];

        const index = handlerReferences.indexOf(handlerReference);

        if (index >= 0) {
          handlerReferences.splice(index, 1);

          this.gestureEventHandlers[eventType] = handlerReferences;
        }

        this.domElement.removeEventListener(eventType, handlerReference, false);
      }
    }
  }

  destroy(): void {
    // remove all EventListeners from self.domElement
    for (const event in this.gestureEventHandlers) {
      const handlerList = this.gestureEventHandlers[event];
      for (let h = 0; h < handlerList.length; h++) {
        const handler = handlerList[h];
        this.domElement.removeEventListener(event, handler);
      }

      delete this.gestureEventHandlers[event];
    }

    this.removePointerEventListeners();
    this.removeTouchEventListeners();
  }


}
