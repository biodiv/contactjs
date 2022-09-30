import {
  Gesture,
  GestureOptions,
  LiveGestureEventData,
  GlobalGestureEventData,
  GestureEventData,
} from "./Gesture";

import {
  DualPointerGestureParameters,
} from "../interfaces";

import { DualPointerInput } from "../DualPointerInput";

import {
  PointerManagerState
} from "../input-consts";
import { PointerManager } from "../PointerManager";

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

    const nullRecognitionParameters = this.getEmptyGestureParameters() as DualPointerGestureParameters;

    this.initialParameters = { ...nullRecognitionParameters };
    this.activeStateParameters = JSON.parse(JSON.stringify({ ...nullRecognitionParameters }));
  }

  getEventData(dualPointerInput: DualPointerInput, pointerManager: PointerManager): GestureEventData {
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
      center: globalParameters.center,
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
      live: liveGestureEventData,
      pointerManager: pointerManager,
    };

    return gestureEventData;
  }

}