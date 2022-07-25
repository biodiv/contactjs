import {
  Gesture,
  GestureOptions,
  MinMaxInterval,
  BooleanParameter,
} from "./Gesture";

import {
  GestureState,
  PointerManagerState,
} from "../input-consts";

import { Point } from "../geometry/Point";
import { Vector } from "../geometry/Vector";

import { PointerManager } from "../PointerManager";
import { PointerInput } from "../PointerInput";

/**
 * GestureParameters are the PointerInputParameters a gesture is valid for
 * Keys match those of PointerInput.parameters.global
 */
interface SinglePointerGestureGlobalParameters {
  duration: MinMaxInterval,
  distance: MinMaxInterval,
  maximumDistance: MinMaxInterval,
  averageSpeed: MinMaxInterval,
  finalSpeed: MinMaxInterval,
  hasBeenMoved: BooleanParameter,
}

/**
 * keys match those of PointerInput.parameters.live
 */
interface SinglePointerGestureLiveParameters {
  speed: MinMaxInterval,
  distance: MinMaxInterval,
  isMoving: BooleanParameter,
}

interface SinglePointerGestureParameters {
  global: SinglePointerGestureGlobalParameters,
  live: SinglePointerGestureLiveParameters,
}

interface GlobalSinglePointerEventData {
  deltaX: number;
  deltaY: number;
  distance: number;
  speedX: number;
  speedY: number;
  speed: number;
  direction: string;
  scale: number;
  rotation: number;
  srcEvent: PointerEvent;
}

interface LiveSinglePointerEventData {
  deltaX: number;
  deltaY: number;
  distance: number;
  speedX: number;
  speedY: number;
  speed: number;
  direction: string;
  scale: number;
  rotation: number;
  center: Point;
  srcEvent: PointerEvent;
}

interface SinglePointerGestureEventData {
  recognizer: Gesture,
  global: GlobalSinglePointerEventData,
  live: LiveSinglePointerEventData,
}


export abstract class SinglePointerGesture extends Gesture {

  initialPointerEvent: PointerEvent | null;

  initialParameters: SinglePointerGestureParameters;
  activeStateParameters: SinglePointerGestureParameters;

  constructor(domElement: HTMLElement, options?: Partial<GestureOptions>) {
    super(domElement, options);
    this.initialPointerEvent = null;
    this.validPointerManagerState = PointerManagerState.SinglePointer;

    var nullRecognitionParameters: SinglePointerGestureParameters = {
      global: {
        duration: [null, null], // ms
        distance: [null, null],
        maximumDistance: [null, null],
        averageSpeed: [null, null], // px/s
        finalSpeed: [null, null], // px/s
        hasBeenMoved : null,
      },

      live: {
        speed: [null, null], // px/s
        distance: [null, null], // px
        isMoving: null,
      }
    };

    this.initialParameters = { ...nullRecognitionParameters };
    // a deep copy of the parameters is needed as they can have different values
    this.activeStateParameters = JSON.parse(JSON.stringify({...nullRecognitionParameters}));

  }

  validateBooleanParameter (gestureParameter: boolean | null, pointerInputValue: boolean) {
    if (gestureParameter == null || gestureParameter == pointerInputValue){

      if (this.DEBUG == true) {
        console.log(
          `validated: required value: ${gestureParameter}, current value: ${pointerInputValue}`
        );
      }

      return true;
    }

    if (this.DEBUG == true) {
      console.log(
        `dismissing ${this.eventBaseName}: required value: ${gestureParameter}, current value: ${pointerInputValue}`
      );
    }

    return false;
  }

  validateMinMaxParameter(interval: [number | null, number | null], value: number | null): boolean {
    
    const minValue = interval[0];
    const maxValue = interval[1];

    if (minValue != null && value != null && value < minValue) {
      if (this.DEBUG == true) {
        console.log(
          `dismissing min${this.eventBaseName}: ${minValue}, current value: ${value}`
        );
      }

      return false;
    }

    if (maxValue != null && value != null && value > maxValue) {
      if (this.DEBUG == true) {
        console.log(
          `dismissing max${this.eventBaseName}: ${maxValue}, current value: ${value}`
        );
      }

      return false;
    }

    if (this.DEBUG == true) {
      console.log(
        `validated: minMax: [${minValue}, ${maxValue}] - current value: ${value}`
      );
    }

    return true;
  }

  validateGestureParameter (gestureParameter: MinMaxInterval | BooleanParameter, pointerInputValue: number | boolean | null) {
    
    let isValid = true;
    
    if (typeof gestureParameter == "boolean" || gestureParameter == null){

      if (typeof pointerInputValue != "boolean"){
        return false;
      }

      isValid = this.validateBooleanParameter(gestureParameter, pointerInputValue);

    } else {

      const interval = gestureParameter;
      
      if (typeof pointerInputValue == "boolean"){
        return false;
      }

      isValid = this.validateMinMaxParameter(
        interval,
        pointerInputValue
      );

    }

    return isValid;

  }

  validateGestureParameters(pointerInput: PointerInput): boolean {

    var gestureParameters: SinglePointerGestureParameters;

    let isValid: boolean = true;

    if (this.state == GestureState.Active) {
      gestureParameters = this.activeStateParameters;
      if (this.DEBUG == true){
        console.log(`[${this.eventBaseName}] validating using activeStateParameters`);
        console.log(gestureParameters);
      }
    } else {
      if (this.DEBUG == true){
        console.log(`[${this.eventBaseName}] validating using initialParameters`);
      }
      gestureParameters = this.initialParameters;
    }

    // maybe somehow combine global and live into one loop - how?
    let globalParameterName: keyof SinglePointerGestureGlobalParameters;
    for (globalParameterName in gestureParameters.global) {

      if (this.DEBUG == true) {
        console.log(
          `[${this.eventBaseName}] validating global parameter ${globalParameterName}:`
        );
      }

      const gestureParameter = gestureParameters.global[globalParameterName];
      const pointerInputValue = pointerInput.parameters.global[globalParameterName];

      isValid = this.validateGestureParameter(gestureParameter, pointerInputValue);

      if (isValid == false){
        return false;
      }
      
    }

    let liveParameterName: keyof SinglePointerGestureLiveParameters;
    for (liveParameterName in gestureParameters.live) {

      if (this.DEBUG == true) {
        console.log(
          `validating live parameter ${liveParameterName}:`
        );
      }

      const gestureParameter = gestureParameters.live[liveParameterName];
      const pointerInputValue = pointerInput.parameters.live[liveParameterName];

      isValid = this.validateGestureParameter(gestureParameter, pointerInputValue);

      if (isValid == false){
        return false;
      }
    }

    return true;

  }

  validate(pointerManager: PointerManager): boolean {
    var isValid = super.validate(pointerManager);

    if (isValid === true) {
      var pointerInput = pointerManager.activePointerInput; // cannot be a DualPointerInput

      if (pointerInput instanceof PointerInput) {

        isValid = this.validateGestureParameters(pointerInput)

      }
      else {
        isValid = false;
      }

    }

    return isValid;
  }

  // recognize depends on PointerInput
  recognize(pointerManager: PointerManager): void {

    const isValid = this.validate(pointerManager);

    const pointerInput = this.getPointerInput(pointerManager);

    if (pointerInput instanceof PointerInput){
      if (
        isValid == true &&
        this.state == GestureState.Inactive
      ) {
  
        this.onStart(pointerManager);
  
      }
  
      if (
        isValid == true &&
        this.state == GestureState.Active
      ) {
  
        if (this.initialPointerEvent == null){
          this.setInitialPointerEvent(pointerManager);
        }
  
        this.emit(pointerManager);
  
      } else if (this.state == GestureState.Active && isValid == false) {
  
        this.onEnd(pointerManager);
  
      }
    }
    else {
      console.log(`not firing event ${this.eventBaseName}. No PointerInput found`);
    }

  }

  emit(pointerManager: PointerManager, eventName?: string): void {
    
    // fire general event like "tap", "press", "pan"
    eventName = eventName || this.eventBaseName;

    if (this.DEBUG === true) {
      console.log(`[Gestures] detected and firing event ${eventName}`);
    }

    const pointerInput = this.getPointerInput(pointerManager);

    if (pointerInput instanceof PointerInput) {

      const target = pointerInput.getTarget();

      if (target instanceof EventTarget){

        const eventData = this.getEventData(pointerInput);

        const eventOptions = {
          detail: eventData,
          bubbles: this.options.bubbles,
        };

        const event = new CustomEvent(eventName, eventOptions);

        if (eventOptions.bubbles == true) {
          target.dispatchEvent(event);
        } else {
          this.domElement.dispatchEvent(event);
        }

        // fire direction specific events
        const currentDirection = eventData.live!.direction;

        const hasSupportedDirections = !!this.options.supportedDirections;
        // do not fire events like "panendleft"
        // only fire directional events if eventName == this.eventBaseName 
        if (hasSupportedDirections == true && eventName == this.eventBaseName) {
          for (let d = 0; d < this.options.supportedDirections!.length; d++) {
            const direction = this.options.supportedDirections![d];

            if (direction == currentDirection) {
              const directionEventName = eventName + direction;

              if (this.DEBUG == true) {
                console.log(
                  `[Gestures] detected and firing event ${directionEventName}`
                );
              }

              const directionEvent = new CustomEvent(
                directionEventName,
                eventOptions
              );

              if (eventOptions.bubbles == true) {
                target.dispatchEvent(directionEvent);
              } else {
                this.domElement.dispatchEvent(directionEvent);
              }
            }
          }
        }
      }      
    }
  }

  getEventData(pointerInput: PointerInput): SinglePointerGestureEventData {
    // provide short-cuts to the values collected in the Contact object
    // match this to the event used by hammer.js

    // gesture specific - dependant on the beginning of the gesture (when the gesture has initially been recognized)
    const globalStartPoint = new Point(
      this.initialPointerEvent!.clientX,
      this.initialPointerEvent!.clientY
    );
    const globalEndPoint = new Point(
      pointerInput.currentPointerEvent.clientX,
      pointerInput.currentPointerEvent.clientY
    );
    const globalVector = new Vector(globalStartPoint, globalEndPoint);
    const globalDuration =
      pointerInput.currentPointerEvent.timeStamp -
      this.initialPointerEvent!.timeStamp;

    // global: global for this recognizer, not the Contact object
    const globalEventData: GlobalSinglePointerEventData = {
      deltaX: globalVector.x,
      deltaY: globalVector.y,
      distance: globalVector.vectorLength,
      speedX: globalVector.x / globalDuration,
      speedY: globalVector.y / globalDuration,
      speed: globalVector.vectorLength / globalDuration,
      direction: globalVector.direction,
      scale: 1,
      rotation: 0,
      srcEvent: pointerInput.currentPointerEvent,
    };

    const liveEventData: LiveSinglePointerEventData = {
      deltaX: pointerInput.parameters.live.vector!.x,
      deltaY: pointerInput.parameters.live.vector!.y,
      distance: pointerInput.parameters.live.vector!.vectorLength,
      speedX:
        pointerInput.parameters.live.vector!.x / pointerInput.vectorTimespan,
      speedY:
        pointerInput.parameters.live.vector!.y / pointerInput.vectorTimespan,
      speed: pointerInput.parameters.live.speed,
      direction: pointerInput.parameters.live.vector!.direction,
      scale: 1,
      rotation: 0,
      center: {
        x: pointerInput.parameters.live.vector!.endPoint.x,
        y: pointerInput.parameters.live.vector!.endPoint.y,
      },
      srcEvent: pointerInput.currentPointerEvent /*,
      target : primaryPointerInput.touch.target,
      pointerType : ,
      eventType : ,
      isFirst : ,
      isFinal :,
      pointers : ,*/,
    };

    const eventData: SinglePointerGestureEventData = {
      recognizer: this,
      global: globalEventData,
      live: liveEventData,
    }

    return eventData;
  }

  setInitialPointerEvent(pointerManager: PointerManager) : void {
    const pointerInput = this.getPointerInput(pointerManager);
    if (pointerInput instanceof PointerInput){
      const pointerEvent: PointerEvent = pointerInput.currentPointerEvent;
      this.initialPointerEvent = pointerEvent;
    }
  }


  /*
   * The PointerInput for recognition has to be pointerManager.lastRemovedPointerInput if there is no active pointer left
   */
  getPointerInput (pointerManager: PointerManager) : PointerInput | null {
    
    if (pointerManager.hasPointersOnSurface() == true && pointerManager && pointerManager.activePointerInput instanceof PointerInput){
      return pointerManager.activePointerInput;
    }
    else if (pointerManager.lastRemovedPointerInput instanceof PointerInput) {
      return pointerManager.lastRemovedPointerInput;
    }

    return null;
  }
  
}