import {
    Vector,
} from "./geometry/Vector";

import {
    PointerInput,
} from "./PointerInput";

interface DualPointerInputParameters {
	centerMovement: number | null,
    centerMovementVector: Vector,
    distanceChange: number | null,
    relativeDistanceChange: number | null,
    rotationAngle: number | null,
    vectorAngle: number | null,
}


/**
 * DualPointerInput
 * 	- For gestures like Pinch, Rotate, TwoFingerPan
 */
 export class DualPointerInput {

	readonly pointerIds: Set<number>;

	readonly pointerInput_1: PointerInput;
	readonly pointerInput_2: PointerInput;

  readonly initialPointerEvent: PointerEvent;

	constructor (pointerInput_1: PointerInput, pointerInput_2: PointerInput){

		this.pointerInput_1 = pointerInput_1;
		this.pointerInput_2 = pointerInput_2;

    this.initialPointerEvent = pointerInput_1.initialPointerEvent;

		this.pointerIds = new Set([pointerInput_1.pointerId, pointerInput_2.pointerId]);
	}

	removePointer(pointerId: number): PointerInput {
		if (pointerId == this.pointerInput_1.pointerId){
			return this.pointerInput_2;
		}
		else if (pointerId == this.pointerInput_2.pointerId){
			return this.pointerInput_1;
		}
		else {
			throw new Error("[DualPointerInput] cannot remove Pointer #${pointerId}. The pointer is not part of this DualPointerInput");
		}
	}

  getTarget(): EventTarget | null {
    return this.initialPointerEvent.target;
  }

	onPointerMove (pointermoveEvent: PointerEvent): void {

	}

	onPointerUp (pointerupEvent: PointerEvent): void {
		
	}

	onPointerLeave (pointerleaveEvent: PointerEvent): void {

	}

	onPointerCancel (pointercancelEvent: PointerEvent): void {
		
	}

	onIdle(): void {

	}

}
