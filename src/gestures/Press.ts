import { GestureOptions } from "./Gesture";
import { SinglePointerGesture } from "./SinglePointerGesture";
import { PointerManager } from "../PointerManager";
import { PointerInput } from "../PointerInput";

/*
 * press should only be fired once
 * if global duration is below Press.initialMinMaxParameters["duration"][0], set the Press to possible
 * if global duration is above Press.initialMinMaxParameters["duration"][0] AND press already has been emitted, set Press to impossible
 *
 */
export class Press extends SinglePointerGesture {
  hasBeenEmitted: boolean;

  constructor(domElement: HTMLElement, options?: Partial<GestureOptions>) {
    super(domElement, options);

    this.eventBaseName = "press";

    this.initialParameters.global["duration"] = [600, null]; // milliseconds. after a certain touch duration, it is not a TAP anymore

    this.initialParameters.global["distance"] = [null, 10]; // if the pointer moved a certain distance, Press becomes impossible
    this.initialParameters.global["maximumDistance"] = [null, 20];
    // only Press has this parameter
    this.hasBeenEmitted = false;

  }

  recognize(pointerManager: PointerManager): void {
    const isValid = this.validate(pointerManager);

    const pointerInput = this.getPointerInput(pointerManager);

    if (pointerInput instanceof PointerInput) {

      if (
        isValid == true &&
        this.hasBeenEmitted == false
      ) {

        this.setInitialPointerEvent(pointerManager);

        this.emit(pointerManager);

        this.hasBeenEmitted = true;
      } else {
        const duration = pointerInput.parameters.global.duration;

        if (
          this.hasBeenEmitted == true &&
          duration <= this.initialParameters.global["duration"][0]!
        ) {
          this.hasBeenEmitted = false;
        }
      }
    }

    if (pointerInput == null) {
      this.hasBeenEmitted = false;
    }
  }
}