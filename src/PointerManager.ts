import { PointerManagerState } from "./input-consts";
import { Pointer } from "./Pointer";
import { SinglePointerInput } from "./SinglePointerInput";
import { DualPointerInput } from "./DualPointerInput";

/*
 * At the time the user touches the surface it is not known which gesture he will perform. He can also add or remove touches.
 * The contact phenomenon starts when the user initially touches the surface, and ends when no more touches are present.
 * During the contact phenonmenon between human being and artificial surface, different gestures can be detected.
 * According to the gesture definitions, a gesture can be possible or impossible at a given time.
 */

/*
*	PointerManager
*	- keeps track of added and removed pointers
*	- decides if the current gesture is SinglePointerInput or DualPointerInput
*		becomes activeSinglePointerInput
*/
export class PointerManager {

  DEBUG: boolean;

  activePointerInput: SinglePointerInput | DualPointerInput | null;

  // this pointer is not on the surface any more - some gestures are detected after a pointer has been released
  lastRemovedPointer: Pointer | null;

  lastInputSessionPointerCount: number;

  private pointerAllocation: Record<number, SinglePointerInput | DualPointerInput>; // map pointerId to the *PointerInput the Pointer is currently used for
  private unusedPointers: Record<number, Pointer>; // on the surface, but not used for gesture recognition, eg a third pointer
  private onSurfacePointers: Record<number, Pointer>; // covers active and unused Pointers

  state: PointerManagerState;

  constructor() {
    this.DEBUG = true;

    this.state = PointerManagerState.NoPointer;
    this.activePointerInput = null;
    this.lastRemovedPointer = null;
    this.lastInputSessionPointerCount = 0;
    this.pointerAllocation = {};
    this.unusedPointers = {}; // pointers on the surface that are not interpreted right now
    this.onSurfacePointers = {};

  }

  addPointer(pointerdownEvent: PointerEvent): void {

    if (this.DEBUG == true) {
      console.log(`[PointerManager] adding Pointer #${pointerdownEvent.pointerId.toString()}`);
    }

    const pointer = new Pointer(pointerdownEvent);

    this.onSurfacePointers[pointer.pointerId] = pointer;

    if (this.activePointerInput == null) {
      this.setActiveSinglePointerInput(pointer);
    }
    else if (this.activePointerInput instanceof Pointer) {
      this.setActiveDualPointerInput(this.activePointerInput, pointer);
    }
    else if (this.activePointerInput instanceof DualPointerInput) {
      this.unusedPointers[pointer.pointerId] = pointer;
    }

    this.lastInputSessionPointerCount = this.currentPointerCount();

  }

  /**
   * called on the following events: pointerup, pointerleave(?), pointercancel
   * 1 -> 0 : SinglePointerInput -> null
   * 2 -> 1 : DualPointerInput -> SinglePointerInput
   * 3 -> 2 : DualPointerInput -> DualPointerInput (new combination or no change)
   */
  removePointer(pointerId: number): void {

    if (this.DEBUG == true) {
      console.log(`[PointerManager] removing Pointer #${pointerId}`);
    }

    const pointer: Pointer = this.onSurfacePointers[pointerId];
    this.lastRemovedPointer = pointer;

    // remove from registries
    delete this.onSurfacePointers[pointerId];

    if (pointerId in this.unusedPointers) {
      delete this.unusedPointers[pointerId];
    }

    // set this.activePointerInput to null if the Pointer was part of it
    // DualPointerInput -> SinglePointerInput
    // OR DualPointerInput -> new DualPointerInput
    if (this.activePointerInput instanceof DualPointerInput) {
      if (pointerId in this.activePointerInput.pointerIds) {
        const remainingPointer = this.activePointerInput.removePointer(pointerId);
        this.activePointerInput = null;

        // remainingPointer should be used for the next this.activePointerInput
        const unusedPointerInput = this.getUnusedPointer();
        if (unusedPointerInput instanceof Pointer) {
          this.setActiveDualPointerInput(remainingPointer, unusedPointerInput);
        }
        else {
          this.setActiveSinglePointerInput(remainingPointer);
        }

      }
      else {
        // a 3rd pointer which has not been part of DualPointerInput has been removed
      }
    } else if (this.activePointerInput instanceof SinglePointerInput) {
      this.activePointerInput = null;
      this.state = PointerManagerState.NoPointer;
      // this should not be necessary
      if (Object.keys(this.unusedPointers).length > 0) {
        this.unusedPointers = {};
        throw new Error("[PointerManager] found unused Pointers although there should not be any");
      }
      if (Object.keys(this.onSurfacePointers).length > 0) {
        this.onSurfacePointers = {};
        throw new Error("[PointerManager] found onSurfacePointers although there should not be any");
      }

    }

    if (this.DEBUG == true) {
      console.log(`[PointerManager] state: ${this.state}`);
    }

  }

  setActiveSinglePointerInput(pointer: Pointer): void {
    pointer.reset();
    const singlePointerInput = new SinglePointerInput(pointer);
    this.activePointerInput = singlePointerInput;

    this.pointerAllocation[pointer.pointerId] = singlePointerInput;
    delete this.unusedPointers[pointer.pointerId];

    this.state = PointerManagerState.SinglePointer;

    if (this.DEBUG == true) {
      console.log(`[PointerManager] state: ${this.state}`);
    }
  }

  setActiveDualPointerInput(pointer_1: Pointer, pointer_2: Pointer): void {
    pointer_1.reset();
    pointer_2.reset();
    const dualPointerInput = new DualPointerInput(pointer_1, pointer_2);
    this.activePointerInput = dualPointerInput;

    this.pointerAllocation[pointer_1.pointerId] = dualPointerInput;
    this.pointerAllocation[pointer_2.pointerId] = dualPointerInput;
    delete this.unusedPointers[pointer_1.pointerId];
    delete this.unusedPointers[pointer_2.pointerId];

    this.state = PointerManagerState.DualPointer;

    if (this.DEBUG == true) {
      console.log(`[PointerManager] state: ${this.state}`);
    }
  }

  hasPointersOnSurface(): Boolean {
    if (Object.keys(this.onSurfacePointers).length > 0) {
      return true;
    }

    return false;
  }

  currentPointerCount(): number {
    return Object.keys(this.onSurfacePointers).length;
  }

  getUnusedPointer(): Pointer | null {
    if (Object.keys(this.unusedPointers).length > 0) {
      const pointer: Pointer = Object.values(this.unusedPointers)[0];
      return pointer;
    }
    return null
  }

  getPointerFromId(pointerId: number): Pointer | null {
    if (pointerId in this.onSurfacePointers) {
      return this.onSurfacePointers[pointerId];
    }
    return null;
  }

  getlastRemovedPointerInput(): SinglePointerInput | DualPointerInput | null {
    if (this.lastRemovedPointer instanceof Pointer) {
      return this.pointerAllocation[this.lastRemovedPointer.pointerId];
    }
    return null;
  }

  onIdle(): void {
    for (const pointerId in this.onSurfacePointers) {
      const pointer: Pointer = this.onSurfacePointers[pointerId];
      pointer.onIdle();
    };

    this.activePointerInput?.onIdle();

  }

  /**
   * PointerEvent handlers
   * - the Pointer is always updated firs
   * - afterwards, the current activePointerInput is updated
   */
  onPointerMove(pointermoveEvent: PointerEvent): void {
    const pointer = this.getPointerFromId(pointermoveEvent.pointerId);
    if (pointer instanceof Pointer) {
      pointer.onPointerMove(pointermoveEvent);
    }
    this.activePointerInput?.onPointerMove(pointermoveEvent);
  }

  onPointerUp(pointerupEvent: PointerEvent): void {
    const pointer = this.getPointerFromId(pointerupEvent.pointerId);
    if (pointer instanceof Pointer) {
      pointer.onPointerUp(pointerupEvent);
    }
    this.activePointerInput?.onPointerUp(pointerupEvent);
    this.removePointer(pointerupEvent.pointerId);
  }

  onPointerOver(pointeroverEvent: PointerEvent): void {

  }

  onPointerLeave(pointerleaveEvent: PointerEvent): void {
    const pointer = this.getPointerFromId(pointerleaveEvent.pointerId);
    if (pointer instanceof Pointer) {
      pointer.onPointerLeave(pointerleaveEvent);
    }
    this.activePointerInput?.onPointerLeave(pointerleaveEvent);
    // pointerleave does not mean th pointer left the surface
    // the pointer left the bound element
    this.removePointer(pointerleaveEvent.pointerId);
  }
  onPointerCancel(pointercancelEvent: PointerEvent): void {
    const pointer = this.getPointerFromId(pointercancelEvent.pointerId);
    if (pointer instanceof Pointer) {
      pointer.onPointerCancel(pointercancelEvent);
    }
    this.activePointerInput?.onPointerCancel(pointercancelEvent);
    this.removePointer(pointercancelEvent.pointerId);
  }

}