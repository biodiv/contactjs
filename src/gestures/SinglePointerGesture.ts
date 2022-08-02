import {
  Gesture,
  GestureOptions,
  LiveGestureEventData,
  GlobalGestureEventData,
  GestureEventData,
} from "./Gesture";

import {
  GestureState,
  PointerManagerState,
} from "../input-consts";

import {
  SinglePointerGestureParameters,
} from "../interfaces";

import { Point } from "../geometry/Point";
import { Vector } from "../geometry/Vector";
import { SinglePointerInput } from "../SinglePointerInput";

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
        min: {},
        max: {},
        boolean: {},
      },

      live: {
        min: {},
        max: {},
        boolean: {},
      }
    };

    this.initialParameters = { ...nullRecognitionParameters };
    // a deep copy of the parameters is needed as they can have different values
    this.activeStateParameters = JSON.parse(JSON.stringify({ ...nullRecognitionParameters }));

  }

  validateGestureParameters(pointerInput: SinglePointerInput): boolean {

    var gestureParameters: SinglePointerGestureParameters;

    let isValid: boolean = true;

    if (this.state == GestureState.Active) {
      gestureParameters = this.activeStateParameters;
      if (this.DEBUG == true) {
        console.log(
          `[${this.eventBaseName}] validating using activeStateParameters`
        );
        console.log(gestureParameters);
      }
    } else {
      if (this.DEBUG == true) {
        console.log(
          `[${this.eventBaseName}] validating using initialParameters`
        );
      }
      gestureParameters = this.initialParameters;
    }


    let timespan:keyof typeof gestureParameters;
    for (timespan in gestureParameters){
      const timedParameters = gestureParameters[timespan];
      let minOrMaxOrBoolean: keyof typeof timedParameters;
      for (minOrMaxOrBoolean in timedParameters){
        const evaluationParameters = timedParameters[minOrMaxOrBoolean];
        let gestureParameterName: keyof typeof evaluationParameters;
        for (gestureParameterName in evaluationParameters){
          const gestureParameter = evaluationParameters[gestureParameterName];
          const pointerInputValue = pointerInput.parameters[timespan][gestureParameterName];

          if (this.DEBUG == true) {
            console.log(
              `[${this.eventBaseName}] validating ${timespan} ${minOrMaxOrBoolean}: required: ${gestureParameter}, pointer: ${pointerInputValue}`
            );
          }

          if (typeof gestureParameter == "boolean" && typeof pointerInputValue == "boolean"){
            isValid = this.validateBooleanParameter(gestureParameter, pointerInputValue);
          }
          else if (typeof gestureParameter == "number" && typeof pointerInputValue == "number"){
            isValid = this.validateMinMaxParameter(gestureParameter, pointerInputValue, minOrMaxOrBoolean);
          }

          if (isValid == false){
            if (this.DEBUG == true) {
              console.log(`[${this.eventBaseName}] invalidated `);
            }
            return false;
          }

        }
      }
    }

    return true;

  }

  getEventData(singlePointerInput: SinglePointerInput): GestureEventData {
    // provide short-cuts to the values collected in the Contact object
    // match this to the event used by hammer.js

    const globalParameters = singlePointerInput.parameters.global;
    const liveParameters = singlePointerInput.parameters.live;

    // gesture specific - dependant on the beginning of the gesture (when the gesture has initially been recognized)
    const globalStartPoint = new Point(
      this.initialPointerEvent!.clientX,
      this.initialPointerEvent!.clientY
    );
    const globalEndPoint = new Point(
      singlePointerInput.pointer.currentPointerEvent.clientX,
      singlePointerInput.pointer.currentPointerEvent.clientY
    );
    const globalVector = new Vector(globalStartPoint, globalEndPoint);
    const globalDuration =
      singlePointerInput.pointer.currentPointerEvent.timeStamp -
      this.initialPointerEvent!.timeStamp;

    // global: global for this recognizer, not the Contact object
    const globalGestureEventData: GlobalGestureEventData = {
      deltaX: globalVector.x,
      deltaY: globalVector.y,
      distance: globalVector.vectorLength,
      speedX: globalVector.x / globalDuration,
      speedY: globalVector.y / globalDuration,
      speed: globalVector.vectorLength / globalDuration,
      direction: globalVector.direction,
      scale: 1,
      rotation: 0,
      srcEvent: singlePointerInput.pointer.currentPointerEvent,
    };

    const liveGestureEventData: LiveGestureEventData = {
      deltaX: liveParameters.vector.x,
      deltaY: liveParameters.vector.y,
      distance: liveParameters.vector.vectorLength,
      speedX:
        liveParameters.vector.x / singlePointerInput.pointer.vectorTimespan,
      speedY:
        liveParameters.vector.y / singlePointerInput.pointer.vectorTimespan,
      speed: liveParameters.speed,
      direction: liveParameters.vector.direction,
      scale: 1,
      rotation: 0,
      center: {
        x: liveParameters.vector.endPoint.x,
        y: liveParameters.vector.endPoint.y,
      },
      srcEvent: singlePointerInput.pointer.currentPointerEvent /*,
      target : primaryPointerInput.touch.target,
      pointerType : ,
      eventType : ,
      isFirst : ,
      isFinal :,
      pointers : ,*/,
    };

    const eventData: GestureEventData = {
      recognizer: this,
      global: globalGestureEventData,
      live: liveGestureEventData,
    }

    return eventData;
  }

}