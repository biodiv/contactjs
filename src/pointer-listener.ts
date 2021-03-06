import {
  Tap,
  Press,
  Pan,
  Pinch,
  Rotate,
  TwoFingerPan,
  Gesture
} from "./gestures";

import { Contact } from "./contact";

/*
 * PointerListener class
 *	- implements the possibility to listen to gesture events performed on a specific DOM Element
 *	  expample: element.addEventListener("pan", function(event){});
 *	- creates and destroys Contact instances
 *	- updates the Contact instances
 *	- uses the Contact instances to determine which gesture(s) are performed by passing Contact instances to GestureRegonizers
 *
 *	- var listener = new PointerListener(domElement, {});
 *	- domElement.addEventListener("pan", function(){});
 */

type GestureConstructor = new (...args: ConstructorParameters<typeof Gesture>) => Gesture;

const ALL_GESTURE_CLASSES: GestureConstructor[] = [Tap, Press, Pan, Pinch, Rotate, TwoFingerPan];

type Timer = ReturnType<typeof setInterval>;

interface PointerListenerOptionsInit {
  DEBUG: boolean;
  DEBUG_GESTURES: boolean;
  DEBUG_CONTACT: boolean;

  bubbles: boolean;
  handleTouchEvents: boolean;
  supportedGestures: (Gesture | GestureConstructor)[];

  // Hooks
  pointerdown?: (event: PointerEvent, self: PointerListener) => void;
  pointermove?: (event: PointerEvent, self: PointerListener) => void;
  pointerup?: (event: PointerEvent, self: PointerListener) => void;
  pointercancel?: (event: PointerEvent, self: PointerListener) => void;
}

interface PointerListenerOptions extends PointerListenerOptionsInit {
  // All supported gestures are instanitated when the PointerListener
  // constructor runs.
  supportedGestures: Gesture[];
}

export class PointerListener {
  options: PointerListenerOptions;
  DEBUG: boolean;

  readonly domElement: HTMLElement;

  private readonly eventHandlers: Record<string, EventListenerOrEventListenerObject[]>;
  private pointerEventHandlers: Record<string, (event: PointerEvent) => void>;
  private touchEventHandlers: Record<string, (event: TouchEvent) => void>;

  contact: Contact | null;

  lastRecognitionTimestamp: number | null;
  idleRecognitionIntervalId: Timer | null;

  constructor(domElement: HTMLElement, options?: Partial<PointerListenerOptionsInit>) {
    // registry for events like "pan", "rotate", which have to be removed on this.destroy();
    this.eventHandlers = {};

    this.lastRecognitionTimestamp = null;
    this.idleRecognitionIntervalId = null;

    this.pointerEventHandlers = {};
    this.touchEventHandlers = {};

    options = options || {};

    this.options = {
      bubbles: true,
      handleTouchEvents: true,
      DEBUG: false,
      DEBUG_GESTURES: false,
      DEBUG_CONTACT: false,
    } as PointerListenerOptions;

    this.DEBUG = this.options.DEBUG;

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

    // add instantiatedGestures to options.supportedGestures
    this.options.supportedGestures = instantiatedGestures;

    this.domElement = domElement;

    // the Contact instance - only active during an active pointerdown
    this.contact = null;

    // disable context menu on long taps - this kills pointermove
    /*domElement.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      return false;
    });*/

    this.addPointerListeners();

    this.addTouchListeners();
  }

  addPointerListeners(): void {
    const domElement = this.domElement;

    // javascript fires the events "pointerdown", "pointermove", "pointerup" and "pointercancel"
    // on each of these events, the contact instance is updated and GestureRecognizers of this.supported_events are run
    const onPointerDown = (event: PointerEvent) => {
      if (this.DEBUG == true) {
        console.log("[PointerListener] pointerdown event detected");
      }

      // re-target all pointerevents to the current element
      // see https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture
      domElement.setPointerCapture(event.pointerId);

      if (this.contact == null || this.contact.isActive == false) {
        const contactOptions = {
          DEBUG: this.options.DEBUG_CONTACT,
        };
        this.contact = new Contact(event, contactOptions);
      } else {
        // use existing contact instance if a second pointer becomes present
        this.contact.addPointer(event);
      }

      this.options.pointerdown?.(event, this);

      // before starting a new interval, make sure the old one is stopped if present
      if (this.idleRecognitionIntervalId != null) {
        this.clearIdleRecognitionInterval();
      }

      this.idleRecognitionIntervalId = setInterval(() => {
        this.onIdle();
      }, 100);
    };

    const onPointerMove = (event: PointerEvent) => {
      // pointermove is also firing if the mouse button is not pressed

      if (this.contact != null && this.contact.isActive == true) {
        // this would disable vertical scrolling - which should only be disabled if a panup/down or swipeup/down listener has been triggered
        // event.preventDefault();

        this.contact.onPointerMove(event);
        this.recognizeGestures();

        this.options.pointermove?.(event, this);
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (this.DEBUG == true) {
        console.log("[PointerListener] pointerup event detected");
      }

      domElement.releasePointerCapture(event.pointerId);

      if (this.contact != null && this.contact.isActive == true) {
        // use css: touch-action: none instead of js to disable scrolling
        //self.domElement.classList.remove("disable-scrolling");

        this.contact.onPointerUp(event);
        this.recognizeGestures();

        this.options.pointerup?.(event, this);
      }

      this.clearIdleRecognitionInterval();
    };

    /*
     * case: user presses mouse button and moves element. while moving, the cursor leaves the element (fires pointerout)
     *		while outside the element, the mouse button is released. pointerup is not fired.
     *		during pan, pan should not end if the pointer leaves the element.
     * MDN: Pointer capture allows events for a particular pointer event (PointerEvent) to be re-targeted to a particular element instead of the normal (or hit test) target at a pointer's location. This can be used to ensure that an element continues to receive pointer events even if the pointer device's contact moves off the element (such as by scrolling or panning).
     */
    const onPointerLeave = (event: PointerEvent) => {
      if (this.DEBUG == true) {
        console.log("[PointerListener] pointerleave detected");
      }

      if (this.contact != null && this.contact.isActive == true) {
        this.contact.onPointerLeave(event);
        this.recognizeGestures();
      }

      this.clearIdleRecognitionInterval();
    };

    const onPointerCancel = (event: PointerEvent) => {
      domElement.releasePointerCapture(event.pointerId);

      if (this.DEBUG == true) {
        console.log("[PointerListener] pointercancel detected");
      }

      //self.domElement.classList.remove("disable-scrolling");

      this.contact!.onPointerCancel(event);
      this.recognizeGestures();

      this.clearIdleRecognitionInterval();

      this.options.pointercancel?.(event, this);
    };

    domElement.addEventListener("pointerdown", onPointerDown, {
      passive: true,
    });
    domElement.addEventListener("pointermove", onPointerMove, {
      passive: true,
    });
    domElement.addEventListener("pointerup", onPointerUp, { passive: true });
    domElement.addEventListener("pointerleave", onPointerLeave, {
      passive: true,
    });
    domElement.addEventListener("pointercancel", onPointerCancel, {
      passive: true,
    });

    this.pointerEventHandlers = {
      pointerdown: onPointerDown,
      pointermove: onPointerMove,
      pointerup: onPointerUp,
      pointerleave: onPointerLeave,
      pointercancel: onPointerCancel,
    };
  }

  removePointerListeners(): void {
    for (const event in this.pointerEventHandlers) {
      const handler = this.pointerEventHandlers[event];
      this.domElement.removeEventListener(event, handler as EventListener);
    }
  }

  // provide the ability to interact/prevent touch events
  // scrolling (touchmove event) results in pointerCancel event, stopping horizontal panning if user scrolls vertically
  // the better solution is using eg css: touch-action: pan-y;
  addTouchListeners(): void {
    if (this.options.handleTouchEvents == true) {
      const onTouchMove = (event: TouchEvent) => {
        // fire onTouchMove for all gestures
        for (let g = 0; g < this.options.supportedGestures.length; g++) {
          const gesture = this.options.supportedGestures[g];

          gesture.onTouchMove(event);
        }
      };

      this.domElement.addEventListener("touchmove", onTouchMove);

      this.touchEventHandlers = {
        touchmove: onTouchMove,
      };

      /*this.domElement.addEventListener("touchstart", (event) => {

      });*/

      /*this.domElement.addEventListener("touchend", (event) => {
      });

      this.domElement.addEventListener("touchcancel", (event) => {
      });*/
    }
  }

  removeTouchListeners(): void {
    for (const event in this.touchEventHandlers) {
      const handler = this.touchEventHandlers[event];
      this.domElement.removeEventListener(event, handler as EventListener);
    }
  }

  // to recognize Press, recognition has to be run if the user does nothing while having contact with the surfave (no pointermove, no pointerup, no pointercancel)
  onIdle(): void {
    if (this.contact == null || this.contact.isActive == false) {
      this.clearIdleRecognitionInterval();
    } else {
      const now = new Date().getTime();
      let timedelta = null;

      if (this.lastRecognitionTimestamp != null) {
        timedelta = now - this.lastRecognitionTimestamp;
      }

      if (timedelta == null || timedelta > 100) {
        this.contact.onIdle();

        if (this.DEBUG == true) {
          console.log("[PointerListener] onIdle - running idle recognition");
        }

        this.recognizeGestures();
      }
    }
  }

  clearIdleRecognitionInterval(): void {
    if (this.idleRecognitionIntervalId != null) {
      clearInterval(this.idleRecognitionIntervalId);
      this.idleRecognitionIntervalId = null;
    }
  }

  // run all configured recognizers
  recognizeGestures(): void {
    this.lastRecognitionTimestamp = new Date().getTime();

    for (let g = 0; g < this.options.supportedGestures.length; g++) {
      const gesture = this.options.supportedGestures[g];

      gesture.recognize(this.contact!);
    }
  }

  /*
   *	handler management
   *	eventsString: one or more events: "tap" or "pan twofingerpan pinchend"
   *	currently, it is not supported to add the same handlerReference twice (once with useCapture = true, and once with useCapture = false)
   *	useCapture defaults to false
   */
  parseEventsString(eventsString: string): string[] {
    return eventsString.trim().split(/\s+/g);
  }

  on(eventsString: string, handlerReference: EventListenerOrEventListenerObject): void {
    const eventTypes = this.parseEventsString(eventsString);

    for (let e = 0; e < eventTypes.length; e++) {
      const eventType = eventTypes[e];

      if (!(eventType in this.eventHandlers)) {
        this.eventHandlers[eventType] = [];
      }

      if (this.eventHandlers[eventType].indexOf(handlerReference) == -1) {
        this.eventHandlers[eventType].push(handlerReference);
      }

      this.domElement.addEventListener(eventType, handlerReference, false);
    }
  }

  off(eventsString: string, handlerReference: EventListenerOrEventListenerObject): void {
    const eventTypes = this.parseEventsString(eventsString);

    for (let e = 0; e < eventTypes.length; e++) {
      const eventType = eventTypes[e];

      if (eventType in this.eventHandlers) {
        const handlerReferences = this.eventHandlers[eventType];

        const index = handlerReferences.indexOf(handlerReference);

        if (index >= 0) {
          handlerReferences.splice(index, 1);

          this.eventHandlers[eventType] = handlerReferences;
        }

        this.domElement.removeEventListener(eventType, handlerReference, false);
      }
    }
  }

  destroy(): void {
    // remove all EventListeners from self.domElement
    for (const event in this.eventHandlers) {
      const handlerList = this.eventHandlers[event];
      for (let h = 0; h < handlerList.length; h++) {
        const handler = handlerList[h];
        this.domElement.removeEventListener(event, handler);
      }

      delete this.eventHandlers[event];
    }

    this.removePointerListeners();
    this.removeTouchListeners();
  }
}
