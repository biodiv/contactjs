import { DualPointerGesture } from "./DualPointerGesture";
import { GestureOptions } from "./Gesture";

/*
 * TWOFINGERPAN DEFINITION
 * 2 fingers are moved across the surface, in the same direction
 */
export class TwoFingerPan extends DualPointerGesture {
  constructor(domElement: HTMLElement, options?: Partial<GestureOptions>) {
    super(domElement, options);

    this.eventBaseName = "twofingerpan";

    this.initialParameters.live.min["centerMovementDistance"] = 10;
    this.initialParameters.live.max["absolutePointerDistanceChange"] = 50;
    this.initialParameters.live.max["absoluteVectorAngle"] = 150;

    this.activeStateParameters.live.min["centerMovementDistance"] = 0;

  }
}
