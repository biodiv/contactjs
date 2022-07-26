import { Pointer, PointerParameters } from "./Pointer";


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

  onIdle(): void { }

  onPointerMove(pointermoveEvent: PointerEvent): void { }

  onPointerUp(pointerupEvent: PointerEvent): void { }

  onPointerLeave(pointerleaveEvent: PointerEvent): void { }

  onPointerCancel(pointercancelEvent: PointerEvent): void { }
}