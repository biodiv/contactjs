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
  TimedParameters,
  DualPointerGestureParameters,
} from "../interfaces";

import { DualPointerInput } from "../DualPointerInput";

import {
  GestureState,
  PointerManagerState
} from "../input-consts";

export abstract class DualPointerGesture extends Gesture {

  initialPointerEvent_1: PointerEvent | null;
  initialPointerEvent_2: PointerEvent | null;

  initialParameters: DualPointerGestureParameters;
  activeStateParameters: DualPointerGestureParameters;

  constructor(domElement: HTMLElement, options?: Partial<GestureOptions>) {
    super(domElement, options);
    this.initialPointerEvent_1 = null;
    this.initialPointerEvent_2 = null;
    this.validPointerManagerState = PointerManagerState.DualPointer;
    this.validPointerInputConstructor = DualPointerInput;

    var nullRecognitionParameters: DualPointerGestureParameters = {
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
    this.activeStateParameters = JSON.parse(JSON.stringify({ ...nullRecognitionParameters }));
  }

  
  validateGestureParameters(pointerInput: DualPointerInput): boolean {

    var gestureParameters: DualPointerGestureParameters;

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

          if (typeof gestureParameter == "boolean" && typeof pointerInputValue == "boolean"){
            isValid = this.validateBooleanParameter(gestureParameter, pointerInputValue);
          }
          else if (typeof gestureParameter == "number" && typeof pointerInputValue == "number"){
            isValid = this.validateMinMaxParameter(gestureParameter, pointerInputValue, minOrMaxOrBoolean);
          }

        }
      }
    }

    return true;

  }


  getEventData(dualPointerInput: DualPointerInput): GestureEventData {
    // provide short-cuts to the values collected in the Contact object
    // match this to the event used by hammer.js

    const globalParameters = dualPointerInput.parameters.global;
    const liveParameters = dualPointerInput.parameters.live;

    const globalGestureEventData: GlobalGestureEventData = {
      deltaX: globalParameters.centerMovementVector.x,
      deltaY: globalParameters.centerMovementVector.y,
      distance: globalParameters.centerMovementDistance,
      speedX: globalParameters.centerMovementVector.x / globalParameters.duration,
      speedY: globalParameters.centerMovementVector.y / globalParameters.duration,
      speed:
        globalParameters.centerMovementVector.vectorLength / globalParameters.duration,
      direction: globalParameters.centerMovementVector.direction,
      scale: globalParameters.relativePointerDistanceChange,
      rotation: globalParameters.rotationAngle,
      srcEvent: dualPointerInput.currentPointerEvent,
    };

    const liveGestureEventData: LiveGestureEventData = {
      deltaX: liveParameters.centerMovementVector.x,
      deltaY: liveParameters.centerMovementVector.y,
      distance: liveParameters.centerMovementDistance,
      speedX: liveParameters.centerMovementVector.x / globalParameters.duration,
      speedY: liveParameters.centerMovementVector.y / globalParameters.duration,
      speed: liveParameters.centerMovementVector.vectorLength / globalParameters.duration,
      direction: liveParameters.centerMovementVector.direction,
      scale: liveParameters.relativePointerDistanceChange,
      rotation: liveParameters.rotationAngle,
      center: {
        x: liveParameters.centerMovementVector.startPoint.x,
        y: liveParameters.centerMovementVector.startPoint.y,
      },
      srcEvent: dualPointerInput.currentPointerEvent,
    };

    const gestureEventData: GestureEventData = {
      recognizer: this,
      global: globalGestureEventData,
      live: liveGestureEventData
    }

    return gestureEventData;
  }

}