import { Geometry } from "./geometry/Geometry";
import { Point } from "./geometry/Point";
import { Vector } from "./geometry/Vector";
import { Pointer } from "./Pointer";


interface DualPointerInputGlobalParameters {
  center: Point,
  centerMovement: number, // px
  centerMovementVector: Vector,
  absoluteDistanceChange: number, // px
  relativeDistanceChange: number, // %
  rotationAngle: number,
  vectorAngle: number,
  duration: number,
}

interface DualPointerInputLiveParameters {
  center: Point,
  centerMovement: number,
  centerMovementVector: Vector,
  absoluteDistanceChange: number,
  relativeDistanceChange: number,
  rotationAngle: number,
  vectorAngle: number,
}

interface DualPointerInputParameters {
  global: DualPointerInputGlobalParameters,
  live: DualPointerInputLiveParameters,
}

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

    const globalVector_1 = this.pointer_1.parameters.global.vector;
    const globalVector_2 = this.pointer_2.parameters.global.vector;
    const globalCenter = Geometry.getCenter(globalVector_1.startPoint, globalVector_2.startPoint);
    const globalCenterMovementVector = Geometry.getCenterMovementVector(globalVector_1, globalVector_2);

    var globalParameters: DualPointerInputGlobalParameters = {
      center: globalCenter,
      centerMovement: 0,
      centerMovementVector: globalCenterMovementVector,
      absoluteDistanceChange: 0,
      relativeDistanceChange: 0,
      rotationAngle: 0,
      vectorAngle: 0,
      duration: 0,
    };

    const liveVector_1 = this.pointer_1.parameters.live.vector;
    const liveVector_2 = this.pointer_2.parameters.live.vector;
    const liveCenter = Geometry.getCenter(liveVector_1.startPoint, liveVector_2.startPoint);
    const liveCenterMovementVector = Geometry.getCenterMovementVector(liveVector_1, liveVector_2);


    var liveParameters: DualPointerInputLiveParameters = {
      center: liveCenter,
      centerMovement: 0,
      centerMovementVector: liveCenterMovementVector,
      absoluteDistanceChange: 0,
      relativeDistanceChange: 0,
      rotationAngle: 0,
      vectorAngle: 0,
    };

    var parameters: DualPointerInputParameters = {
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
      throw new Error("[DualPointerInput] cannot remove Pointer #${pointerId}. The pointer is not part of this DualPointerInput");
    }
  }

  getTarget(): EventTarget | null {
    return this.initialPointerEvent.target;
  }

  update (): void {

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
    this.parameters.global["absoluteDistanceChange"] = globalAbsoluteDistanceChange;
    this.parameters.global["relativeDistanceChange"] = globalRelativeDistanceChange;
    this.parameters.global["rotationAngle"] = globalRotationAngle;
    this.parameters.global["vectorAngle"] = globalVectorAngle;

    const liveVector_1 = this.pointer_1.parameters.live.vector;
    const liveVector_2 = this.pointer_2.parameters.live.vector;
    const liveCenter = Geometry.getCenter(liveVector_1.startPoint, liveVector_2.startPoint);
    const liveCenterMovementVector = Geometry.getCenterMovementVector(liveVector_1, liveVector_2);
    const liveAbsoluteDistanceChange = Geometry.calculateAbsoluteDistanceChange(liveVector_1, liveVector_2);
    const liveRelativeDistanceChange = Geometry.calculateRelativeDistanceChange(liveVector_1, liveVector_2);
    // calculate rotation angle. imagine the user turning a wheel with 2 fingers
    const liveRotationAngle = Geometry.calculateRotationAngle(liveVector_1, liveVector_2);
    const liveVectorAngle = Geometry.calculateVectorAngle(liveVector_1, liveVector_2);

    this.parameters.live["center"] = liveCenter;
    this.parameters.live["centerMovementVector"] = liveCenterMovementVector;
    this.parameters.live["absoluteDistanceChange"] = liveAbsoluteDistanceChange;
    this.parameters.live["relativeDistanceChange"] = liveRelativeDistanceChange;
    this.parameters.live["rotationAngle"] = liveRotationAngle;
    this.parameters.live["vectorAngle"] = liveVectorAngle;
  }

  onPointerMove(pointermoveEvent: PointerEvent): void {
    this.update();
  }

  onPointerUp(pointerupEvent: PointerEvent): void {
    this.update();
  }

  onPointerLeave(pointerleaveEvent: PointerEvent): void {
    this.update();
  }

  onPointerCancel(pointercancelEvent: PointerEvent): void {
    this.update();
  }

  onIdle(): void {
    this.update();
  }

}
