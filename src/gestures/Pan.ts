import { GestureOptions } from "./Gesture";
import { SinglePointerGesture } from "./SinglePointerGesture";
import { PointerManager } from "../PointerManager";
import { PointerInput } from "../PointerInput";

import { 
  Directions,
  PointerManagerState,
  GestureState,
} from "../input-consts";

/*
 * PAN DEFINITION:
 *	- user touches surface with only one finger, or presses the mouse down
 *	- user moves this one finger into different directions while staying on the surface, this movement is required
 *	- the start of a pan is defined by a minimum pointerdown/touch duration and a minimum distance
 *	- pan ends when the user removes the finger from the surface
 *	- to detect a "swipe", the final speed is used
 *	- a SWIPE is a pan that ended with a high speed (velocity without direction)
 *	- Pan supports directions. options["supportedDirections"] = []
 */

 export class Pan extends SinglePointerGesture {
  swipeFinalSpeed: number;
  isSwipe: boolean;
  initialSupportedDirections: string[];

  constructor(domElement: HTMLElement, options?: Partial<GestureOptions>) {
    super(domElement, options);

    this.validPointerManagerState = PointerManagerState.SinglePointer;

    this.eventBaseName = "pan";

    this.initialParameters.global["duration"] = [0, null];
    this.initialParameters.live["distance"] = [10, null];
    this.initialParameters.global["hasBeenMoved"] = true;

    this.swipeFinalSpeed = 600;

    this.isSwipe = false;

    this.options.supportedDirections = options?.supportedDirections ?? Directions.All;
    this.initialSupportedDirections = this.options.supportedDirections;
  }

  validate(pointerManager: PointerManager): boolean {
    // on second recognition allow all directions. otherwise, the "pan" mode would end if the finger was moved right and then down during "panleft" mode
    if (this.state == GestureState.Active) {
      this.options.supportedDirections = Directions.All;
    }

    const isValid = super.validate(pointerManager);

    return isValid;
  }

  onStart(pointerManager: PointerManager): void {
    this.isSwipe = false;

    super.onStart(pointerManager);
  }

  // check if it was a swipe
  onEnd(pointerManager: PointerManager): void {
    const pointerInput = pointerManager.activePointerInput;

    if (pointerInput instanceof PointerInput){
      if (
        this.swipeFinalSpeed < pointerInput.parameters.global.finalSpeed!
      ) {
        this.isSwipe = true;
        this.emit(pointerManager, "swipe");
      }
    }

    super.onEnd(pointerManager);

    this.options.supportedDirections = this.initialSupportedDirections;
  }

  onTouchMove(event: TouchEvent): void {
    if (this.state == GestureState.Active) {
      if (this.DEBUG == true) {
        console.log("[Pan] preventing touchmove default");
      }

      event.preventDefault();
      event.stopPropagation();
    }
  }
}
