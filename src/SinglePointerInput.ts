import { Pointer } from "./Pointer";
import { PointerParameters } from "./interfaces";

export class SinglePointerInput {

  pointer: Pointer;
  readonly parameters: PointerParameters;

  constructor(pointer: Pointer) {
    this.pointer = pointer;
    this.parameters = pointer.parameters;
  }

  getTarget(): EventTarget | null {
    return this.pointer.initialPointerEvent.target;
  }

  getCurrentPointerEvent(): PointerEvent {
    return this.pointer.currentPointerEvent;
  }

  // string is not good, it should be Direction
  getCurrentDirection() : string {
    return this.parameters.live.vector.direction;
  }

  onIdle(): void { }

  onPointerMove(pointermoveEvent: PointerEvent): void { }

  onPointerUp(pointerupEvent: PointerEvent): void { }

  onPointerLeave(pointerleaveEvent: PointerEvent): void { }

  onPointerCancel(pointercancelEvent: PointerEvent): void { }
}