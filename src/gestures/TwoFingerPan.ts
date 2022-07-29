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

    this.initialParameters.live["centerMovementDistance"] = [10, null];
    this.initialParameters.live["absolutePointerDistanceChange"] = [null, 50];
    this.initialParameters.live["rotationAngle"] = [null, null];
    this.initialParameters.live["absoluteVectorAngle"] = [null, 150];

    this.activeStateParameters.live["centerMovementDistance"] = [0, null];
    
  }
}
