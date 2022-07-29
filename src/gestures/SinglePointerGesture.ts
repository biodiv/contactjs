import {
  Gesture,
  GestureOptions,
  MinMaxInterval,
  BooleanParameter,
  GestureParameterValue,
  LiveGestureEventData,
  GlobalGestureEventData,
  GestureEventData,
} from "./Gesture";

import {
  GestureState,
  PointerManagerState,
} from "../input-consts";

import { PointerGlobalParameters } from "../Pointer";
import { TimedParameters } from "../interfaces";

import { Point } from "../geometry/Point";
import { Vector } from "../geometry/Vector";
import { SinglePointerInput } from "../SinglePointerInput";

/**
 * GestureParameters are the PointerParameters a gesture is valid for
 * Keys match those of SinglePointerInput.parameters.global
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
 * keys match those of SinglePointerInput.parameters.live
 */
interface SinglePointerGestureLiveParameters {
  speed: MinMaxInterval,
  distance: MinMaxInterval,
  isMoving: BooleanParameter,
}

export interface SinglePointerGestureParameters extends TimedParameters {
  global: SinglePointerGestureGlobalParameters,
  live: SinglePointerGestureLiveParameters,
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
        hasBeenMoved: null,
      },

      live: {
        speed: [null, null], // px/s
        distance: [null, null], // px
        isMoving: null,
      }
    };

    this.initialParameters = { ...nullRecognitionParameters };
    // a deep copy of the parameters is needed as they can have different values
    this.activeStateParameters = JSON.parse(JSON.stringify({ ...nullRecognitionParameters }));

  }

  getPointerInputGlobalValue(
    pointerInput: SinglePointerInput,
    parameterName: keyof SinglePointerGestureGlobalParameters
  ): GestureParameterValue {
    const pointerInputValue = pointerInput.parameters.global[parameterName];
    return pointerInputValue;
  }

  getPointerInputLiveValue(
    pointerInput: SinglePointerInput,
    parameterName: keyof SinglePointerGestureLiveParameters
  ): GestureParameterValue {
    const pointerInputValue = pointerInput.parameters.live[parameterName];
    return pointerInputValue;
  }

  validateGestureParameters(pointerInput: SinglePointerInput): boolean {

    var gestureParameters: SinglePointerGestureParameters;

    let isValid: boolean = true;

    if (this.state == GestureState.Active) {
      gestureParameters = this.activeStateParameters;
      if (this.DEBUG == true) {
        console.log(`[${this.eventBaseName}] validating using activeStateParameters`);
        console.log(gestureParameters);
      }
    } else {
      if (this.DEBUG == true) {
        console.log(`[${this.eventBaseName}] validating using initialParameters`);
      }
      gestureParameters = this.initialParameters;
    }

    let timespan: keyof TimedParameters;
    for (timespan in gestureParameters){
      const timedGestureParameters = gestureParameters[timespan]; // .global or .live
      let parameterName: keyof typeof timedGestureParameters;
      for (parameterName in timedGestureParameters){

        if (this.DEBUG == true) {
          console.log(
            `[${this.eventBaseName}] validating ${timespan} parameter ${parameterName}:`
          );
        }

        const gestureParameter = timedGestureParameters[parameterName];

        var pointerInputValue: GestureParameterValue;

        if (timespan == "global"){
          pointerInputValue = this.getPointerInputGlobalValue(pointerInput, parameterName);
          isValid = this.validateGestureParameter(gestureParameter, pointerInputValue);
        }
        else if (timespan == "live"){
          pointerInputValue = this.getPointerInputLiveValue(pointerInput, parameterName);
          isValid = this.validateGestureParameter(gestureParameter, pointerInputValue);
        }
        else {
          isValid = false;
        }

        if (isValid == false){
          return false;
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