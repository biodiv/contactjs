import { Geometry } from "./geometry/Geometry";
import {
  Pointer,
} from "./Pointer";
import {
  DualPointerInputGlobalParameters,
  DualPointerInputLiveParameters,
  DualPointerInputParameters,
} from "./interfaces";

/**
 * DualPointerInput
 * 	- For gestures like Pinch, Rotate, TwoFingerPan
 */
export class DualPointerInput {

  readonly pointerIds: Set<number>;

  readonly pointerMap: Record<number, Pointer>;

  readonly pointer_1: Pointer;
  readonly pointer_2: Pointer;

  readonly parameters: DualPointerInputParameters;

  readonly initialPointerEvent: PointerEvent;
  currentPointerEvent: PointerEvent;

  readonly startTimestamp: number;

  constructor(pointer_1: Pointer, pointer_2: Pointer) {

    this.pointerIds = new Set([pointer_1.pointerId, pointer_2.pointerId]);

    this.startTimestamp = new Date().getTime();

    this.pointerMap = {};
    this.pointerMap[pointer_1.pointerId] = pointer_1;
    this.pointerMap[pointer_2.pointerId] = pointer_2;

    this.pointer_1 = pointer_1;
    this.pointer_2 = pointer_2;

    this.initialPointerEvent = pointer_1.initialPointerEvent;
    this.currentPointerEvent = pointer_1.initialPointerEvent;

    const globalVector_1 = this.pointer_1.parameters.global.vector;
    const globalVector_2 = this.pointer_2.parameters.global.vector;
    const globalCenter = Geometry.getCenter(globalVector_1.startPoint, globalVector_2.startPoint);
    const globalCenterMovementVector = Geometry.getCenterMovementVector(globalVector_1, globalVector_2);

    const globalParameters: DualPointerInputGlobalParameters = {
      duration: 0,
      center: globalCenter,
      centerHasBeenMoved: false,
      centerMovementDistance: 0,
      centerMovementVector: globalCenterMovementVector,
      absolutePointerDistanceChange: 0,
      relativePointerDistanceChange: 0,
      rotationAngle: 0,
      absoluteRotationAngle: 0,
      vectorAngle: 0,
      absoluteVectorAngle: 0,
    };

    const liveVector_1 = this.pointer_1.parameters.live.vector;
    const liveVector_2 = this.pointer_2.parameters.live.vector;
    const liveCenter = Geometry.getCenter(liveVector_1.startPoint, liveVector_2.startPoint);
    const liveCenterMovementVector = Geometry.getCenterMovementVector(liveVector_1, liveVector_2);


    const liveParameters: DualPointerInputLiveParameters = {
      center: liveCenter,
      centerIsMoving: false,
      centerMovementDistance: 0,
      centerMovementVector: liveCenterMovementVector,
      absolutePointerDistanceChange: 0,
      relativePointerDistanceChange: 0,
      rotationAngle: 0,
      absoluteRotationAngle: 0,
      vectorAngle: 0,
      absoluteVectorAngle: 0,
    };

    const parameters: DualPointerInputParameters = {
      global: globalParameters,
      live: liveParameters,
    };

    this.parameters = parameters;
  }

  removePointer(pointerId: number): Pointer {
    if (pointerId == this.pointer_1.pointerId) {
      return this.pointer_2;
    }
    else if (pointerId == this.pointer_2.pointerId) {
      return this.pointer_1;
    }
    else {
      throw new Error(`[DualPointerInput] cannot remove Pointer #${pointerId}. The pointer is not part of this DualPointerInput`);
    }
  }

  getTarget(): EventTarget | null {
    return this.initialPointerEvent.target;
  }

  update (pointerEvent?: PointerEvent): void {

    if (pointerEvent instanceof PointerEvent){
      this.currentPointerEvent = pointerEvent;
    }

    const now = new Date().getTime();
    this.parameters.global["duration"] = now - this.startTimestamp;

    const globalVector_1 = this.pointer_1.parameters.global.vector;
    const globalVector_2 = this.pointer_2.parameters.global.vector;
    const globalCenter = Geometry.getCenter(globalVector_1.startPoint, globalVector_2.startPoint);
    const globalCenterMovementVector = Geometry.getCenterMovementVector(globalVector_1, globalVector_2);
    const globalAbsoluteDistanceChange = Geometry.calculateAbsoluteDistanceChange(globalVector_1, globalVector_2);
    const globalRelativeDistanceChange = Geometry.calculateRelativeDistanceChange(globalVector_1, globalVector_2);
    const globalRotationAngle = Geometry.calculateRotationAngle(globalVector_1, globalVector_2);
    const globalVectorAngle = Geometry.calculateVectorAngle(globalVector_1, globalVector_2);

    this.parameters.global["center"] = globalCenter;
    this.parameters.global["centerMovementVector"] = globalCenterMovementVector;
    this.parameters.global["centerMovementDistance"] = globalCenterMovementVector.vectorLength;
    this.parameters.global["absolutePointerDistanceChange"] = globalAbsoluteDistanceChange;
    this.parameters.global["relativePointerDistanceChange"] = globalRelativeDistanceChange;
    this.parameters.global["rotationAngle"] = globalRotationAngle;
    this.parameters.global["absoluteRotationAngle"] = Math.abs(globalRotationAngle);
    this.parameters.global["vectorAngle"] = globalVectorAngle;
    this.parameters.global["absoluteVectorAngle"] = Math.abs(globalVectorAngle);

    const liveVector_1 = this.pointer_1.parameters.live.vector;
    const liveVector_2 = this.pointer_2.parameters.live.vector;
    const liveCenter = Geometry.getCenter(liveVector_1.startPoint, liveVector_2.startPoint);
    const liveCenterMovementVector = Geometry.getCenterMovementVector(liveVector_1, liveVector_2);
    const liveAbsoluteDistanceChange = Geometry.calculateAbsoluteDistanceChange(liveVector_1, liveVector_2);
    const liveRelativeDistanceChange = Geometry.calculateRelativeDistanceChange(liveVector_1, liveVector_2);
    // calculate rotation angle. imagine the user turning a wheel with 2 fingers
    const liveRotationAngle = Geometry.calculateRotationAngle(liveVector_1, liveVector_2);
    const liveVectorAngle = Geometry.calculateVectorAngle(liveVector_1, liveVector_2);

    if (liveCenterMovementVector.vectorLength > 0){
      this.parameters.live.centerIsMoving = true;
      this.parameters.global.centerHasBeenMoved = true;
    }
    else {
      this.parameters.live.centerIsMoving = false;
    }

    this.parameters.live["center"] = liveCenter;
    this.parameters.live["centerMovementDistance"] = liveCenterMovementVector.vectorLength;
    this.parameters.live["centerMovementVector"] = liveCenterMovementVector;
    this.parameters.live["absolutePointerDistanceChange"] = liveAbsoluteDistanceChange;
    this.parameters.live["relativePointerDistanceChange"] = liveRelativeDistanceChange;
    this.parameters.live["rotationAngle"] = liveRotationAngle;
    this.parameters.live["absoluteRotationAngle"] = Math.abs(liveRotationAngle);
    this.parameters.live["vectorAngle"] = liveVectorAngle;
    this.parameters.live["absoluteVectorAngle"] = Math.abs(liveVectorAngle);
  }

  onPointerMove(pointermoveEvent: PointerEvent): void {
    this.update(pointermoveEvent);
  }

  onPointerUp(pointerupEvent: PointerEvent): void {
    this.update(pointerupEvent);
  }

  onPointerLeave(pointerleaveEvent: PointerEvent): void {
    this.update(pointerleaveEvent);
  }

  onPointerCancel(pointercancelEvent: PointerEvent): void {
    this.update(pointercancelEvent);
  }

  onIdle(): void {
    this.update();
  }

  // string is not good, it should be Direction
  getCurrentDirection() : string {
    return this.parameters.live.centerMovementVector.direction;
  }

  getCurrentPointerEvent(): PointerEvent {
    return this.currentPointerEvent;
  }

}
