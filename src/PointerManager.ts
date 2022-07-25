import { PointerManagerState } from "./input-consts";

import { PointerInput } from "./PointerInput";

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
*	- decides if the current gesture is SinglePointer or DualPointer
* 	- if a second pointer is added, activeSinglePointerInput becomes null, activeDualPointerInput is instantiated
* 	- if one pointer is removed, activeDualPointerInoput becomes null, and the remaining PointerInput instances
*		becomes activeSinglePointerInput
*/
export class PointerManager {

  DEBUG: boolean;

	activePointerInput: PointerInput | DualPointerInput | null;

  // this pointerInput is not on the surface any more - some gestures are detected after a pointer has been released
  lastRemovedPointerInput: PointerInput | DualPointerInput | null;

  lastInputSessionPointerCount: number | null;

	private unusedPointerInputs: Record<number, PointerInput>; // on the surface, but not used for gesture recognition, eg a third pointer
	private onSurfacePointerInputs: Record<number, PointerInput>; // covers active and unused PointerInputs

	state: PointerManagerState;

	constructor () {
    this.DEBUG = true;

		this.state = PointerManagerState.NoPointer;
		this.activePointerInput = null;
    this.lastRemovedPointerInput = null;
    this.lastInputSessionPointerCount = null;
		this.unusedPointerInputs = {}; // pointers on the surface that are not interpreted right now
    this.onSurfacePointerInputs = {};

	}

	addPointer (pointerdownEvent: PointerEvent): void {

    if (this.DEBUG == true){
      console.log(`[PointerManager] adding Pointer #${pointerdownEvent.pointerId.toString()}`);
    }

		const pointerInput = new  PointerInput(pointerdownEvent);

		this.onSurfacePointerInputs[pointerInput.pointerId] = pointerInput;

		if (this.activePointerInput == null) {
      this.setActiveSinglePointerInput(pointerInput);
    }
    else if (this.activePointerInput instanceof PointerInput) {
      this.setActiveDualPointerInput(this.activePointerInput, pointerInput);
    }
    else if (this.activePointerInput instanceof DualPointerInput) {
      this.unusedPointerInputs[pointerInput.pointerId] = pointerInput;
    }

    this.lastInputSessionPointerCount = this.currentPointerCount();
		
	}

  /**
   * called on the following events: pointerup, pointerleave(?), pointercancel
   * 1 -> 0 : PointerInput -> null
   * 2 -> 1 : DualPointerInput -> PointerInput
   * 3 -> 2 : DualPointerInput -> DualPointerInput (new or keep)
   */
	removePointer (pointerId: number): void {

    if (this.DEBUG == true){
      console.log(`[PointerManager] removing Pointer #${pointerId}`);
    }

    const pointerInput: PointerInput = this.onSurfacePointerInputs[pointerId];
    this.lastRemovedPointerInput = pointerInput;

    // remove from registries
		delete this.onSurfacePointerInputs[pointerId];

		if (pointerId in this.unusedPointerInputs) {
			delete this.unusedPointerInputs[pointerId];
		}

    // set this.activePointerInput to null if the Pointer was part of it
    // DualPointerInput -> PointerInput
    // OR DualPointerInput -> new DualPointerInput
		if (this.activePointerInput instanceof DualPointerInput){
      if (pointerId in this.activePointerInput.pointerIds) {
        const remainingPointerInput = this.activePointerInput.removePointer(pointerId);
			  this.activePointerInput = null;

        // remainingPointer should be used for the next this.activePointerInput
        const unusedPointerInput = this.getUnusedPointerInput();
        if (unusedPointerInput instanceof PointerInput){
          this.setActiveDualPointerInput(remainingPointerInput, unusedPointerInput);
        }
        else {
          this.setActiveSinglePointerInput(remainingPointerInput);
        }

      }
      else {
        // a 3rd pointer which has not been part of DualPointerInput has been removed
      }
    } else if (this.activePointerInput instanceof PointerInput) {
			this.activePointerInput = null;
      this.state = PointerManagerState.NoPointer;
      // this should not be necessary
      if (Object.keys(this.unusedPointerInputs).length > 0){
        this.unusedPointerInputs = {};
        throw new Error("[PointerManager] found unused PointerInputs although there should not be any");
      }
      if (Object.keys(this.onSurfacePointerInputs).length > 0){
        this.onSurfacePointerInputs = {};
        throw new Error("[PointerManager] found onSurfacePointerInputs although there should not be any");
      }

		}

    if (this.DEBUG == true){
      console.log(`[PointerManager] state: ${this.state}`);
    }

	}

	setActiveSinglePointerInput(pointerInput: PointerInput): void {
		pointerInput.reset();
		this.activePointerInput = pointerInput;
		delete this.unusedPointerInputs[pointerInput.pointerId];

		this.state = PointerManagerState.SinglePointer;

    if (this.DEBUG == true){
      console.log(`[PointerManager] state: ${this.state}`);
    }
	}

	setActiveDualPointerInput (pointerInput_1: PointerInput, pointerInput_2: PointerInput): void{
		pointerInput_1.reset();
		pointerInput_2.reset();
		const dualPointerInput = new DualPointerInput(pointerInput_1, pointerInput_2);
		this.activePointerInput = dualPointerInput;
		delete this.unusedPointerInputs[pointerInput_1.pointerId];
		delete this.unusedPointerInputs[pointerInput_2.pointerId];

		this.state = PointerManagerState.DualPointer;

    if (this.DEBUG == true){
      console.log(`[PointerManager] state: ${this.state}`);
    }
	}

	hasPointersOnSurface(): Boolean {
		if (Object.keys(this.onSurfacePointerInputs).length >0){
			return true;
		}

		return false;
	}

  currentPointerCount() : number {
    return Object.keys(this.onSurfacePointerInputs).length;
  }

  getUnusedPointerInput () : PointerInput | null {
    if (Object.keys(this.unusedPointerInputs).length > 0) {
      const pointerInput: PointerInput = Object.values(this.unusedPointerInputs)[0];
      return pointerInput;
    }
    return null
  }

	onIdle(): void {
		this.activePointerInput?.onIdle();
	}

	onPointerMove (pointermoveEvent: PointerEvent) : void {
		this.activePointerInput?.onPointerMove(pointermoveEvent);
	}

	onPointerUp (pointerupEvent: PointerEvent) : void {
		this.activePointerInput?.onPointerUp(pointerupEvent);
    this.removePointer(pointerupEvent.pointerId);
	}

  onPointerOver (pointeroverEvent: PointerEvent) : void {
    
  }

	onPointerLeave (pointerleaveEvent: PointerEvent) : void {
		this.activePointerInput?.onPointerLeave(pointerleaveEvent);
    // pointerleave does not mean th pointer left the surface
    // the pointer left the bound element
    this.removePointer(pointerleaveEvent.pointerId);
	}
	onPointerCancel (pointercancelEvent: PointerEvent) : void {
		this.activePointerInput?.onPointerCancel(pointercancelEvent);
    this.removePointer(pointercancelEvent.pointerId);
	}

}