import { DualPointerGesture } from "./DualPointerGesture";
import { GestureOptions } from "./Gesture";

/*
 * PINCH DEFINITION
 * - 2 fingers touch the surface
 * - those fongers are moved towards each other, or away from each other
 * - 2 fingers define a circle: center=middle between two touches, diameter = distance
 * - the center between the 2 fingers stays at the same coordinates
 * - the distance between the 2 start points and the two end points is reduces (diameter shrinks)
 */
export class Pinch extends DualPointerGesture {
  constructor(domElement: HTMLElement, options?: Partial<GestureOptions>) {
    super(domElement, options);

    this.eventBaseName = "pinch";

    this.initialParameters.live["centerMovementDistance"] = [0, 50]; //px
    this.initialParameters.live["absolutePointerDistanceChange"] = [5, null]; // distance between 2 fingers
    this.initialParameters.live["absoluteRotationAngle"] = [null, 20];
    this.initialParameters.live["absoluteVectorAngle"] = [10, null];
  }
}