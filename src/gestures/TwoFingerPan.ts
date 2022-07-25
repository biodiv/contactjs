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
  
      this.initialParameters.live["centerMovement"] = [3, null];
      this.initialParameters.live["distanceChange"] = [null, 50];
      this.initialParameters.live["rotationAngle"] = [null, null];
      this.initialParameters.live["vectorAngle"] = [null, 150];
    }
  }
  