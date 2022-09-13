import { DualPointerGesture } from "./DualPointerGesture";
import { GestureOptions } from "./Gesture";

/*
 * ROTATE DEFINITION
 * - 2 fingers touch the surface
 * - 1 or 2 fingers are moved in a circular motion. the center is between the 2 fingers
 */

export class Rotate extends DualPointerGesture {
  constructor(domElement: HTMLElement, options?: Partial<GestureOptions>) {
    super(domElement, options);

    this.eventBaseName = "rotate";

    this.initialParameters.live.min["centerMovementDistance"] = 0;
    this.initialParameters.live.max["centerMovementDistance"] = 50;
    this.initialParameters.live.max["absolutePointerDistanceChange"] = 50;
    this.initialParameters.live.min["absoluteRotationAngle"] = 5;

    this.activeStateParameters.live.min["absoluteRotationAngle"] = 0;
  }
}