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

    this.initialParameters.live["centerMovement"] = [0, 50];
    this.initialParameters.live["distanceChange"] = [null, 50];
    this.initialParameters.live["rotationAngle"] = [5, null];
  }
}