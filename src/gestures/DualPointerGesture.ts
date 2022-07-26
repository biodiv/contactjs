import {
  Gesture,
  GestureOptions,
  MinMaxInterval,
  BooleanParameter,
} from "./Gesture";

import { PointerManager } from "../PointerManager";
import { PointerManagerState } from "../input-consts";
import { DualPointerInput } from "../DualPointerInput";

import { Point } from "../geometry/Point";


/**
 * GestureParameters are the PointerInputParameters a gesture is valid for
 * Keys match those of PointerInput.parameters.global
 */
interface DualPointerGestureGlobalParameters {
  duration: MinMaxInterval,
  distance: MinMaxInterval,
  maximumDistance: MinMaxInterval,
  averageSpeed: MinMaxInterval,
  finalSpeed: MinMaxInterval,
  hasBeenMoved: BooleanParameter,
  centerMovement: MinMaxInterval,
  absolutedistanceChange: MinMaxInterval, // change in distance between 2 pointers
  relativeDistanceChange: MinMaxInterval,
  rotationAngle: MinMaxInterval,
  vectorAngle: MinMaxInterval,
}

/**
 * keys match those of PointerInput.parameters.live
 */
interface DualPointerGestureLiveParameters {
  speed: MinMaxInterval,
  distance: MinMaxInterval,
  isMoving: BooleanParameter,
  centerMovement: MinMaxInterval,
  absoluteDistanceChange: MinMaxInterval,
  relativeDistanceChange: MinMaxInterval,
  rotationAngle: MinMaxInterval,
  vectorAngle: MinMaxInterval,
}

interface DualPointerGestureParameters {
  global: DualPointerGestureGlobalParameters,
  live: DualPointerGestureLiveParameters,
}


interface DualPointerGlobalEventData {
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

interface DualPointerLiveEventData {
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

interface DualPointerGestureEventData {
  global: DualPointerGlobalEventData,
  live: DualPointerLiveEventData
}

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

    var nullRecognitionParameters: DualPointerGestureParameters = {
      global: {
        duration: [null, null], // ms
        distance: [null, null],
        maximumDistance: [null, null],
        averageSpeed: [null, null], // px/s
        finalSpeed: [null, null], // px/s
        hasBeenMoved: null,
        centerMovement: [null, null],
        absolutedistanceChange: [null, null],
        relativeDistanceChange: [null, null],
        rotationAngle: [null, null],
        vectorAngle: [null, null],
      },

      live: {
        speed: [null, null], // px/s
        distance: [null, null], // px
        isMoving: null,
        centerMovement: [null, null],
        absoluteDistanceChange: [null, null],
        relativeDistanceChange: [null, null],
        rotationAngle: [null, null],
        vectorAngle: [null, null],
      }
    };

    this.initialParameters = { ...nullRecognitionParameters };
    this.activeStateParameters = { ...nullRecognitionParameters };
  }

  validate(pointerManager: PointerManager): boolean {
    var isValid = super.validate(pointerManager);

    if (isValid == true) {
      var dualPointerInput = pointerManager.activePointerInput;

      if (dualPointerInput instanceof DualPointerInput) {
        isValid = this.validateDualPointerInput(dualPointerInput);
      }
      else {
        isValid = false;
      }
    }
    return isValid;
  }

  validateDualPointerInput(dualPointerInput: DualPointerInput): boolean {
    return false;
  }

}