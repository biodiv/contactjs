import { GestureOptions } from "./Gesture";
import { SinglePointerGesture } from "./SinglePointerGesture";
import { PointerManager } from "../PointerManager";
import { SinglePointerInput } from "../SinglePointerInput";
import { GestureState } from "../input-consts";


interface PressOptions extends GestureOptions {
  minDuration: number,
  maxDistance: number,
}
/*
 * press should only be fired once
 * if global duration is below Press.initialMinMaxParameters["duration"][0], set the Press to possible
 * if global duration is above Press.initialMinMaxParameters["duration"][0] AND press already has been emitted, set Press to impossible
 *
 */
export class Press extends SinglePointerGesture {
  hasBeenEmitted: boolean;

  private static minDuration = 500;

  constructor(domElement: HTMLElement, options?: Partial<PressOptions>) {
    super(domElement, options);

    this.eventBaseName = "press";

    let globalMinDuration = 500;
    let globalMaxDistance = 10;
    let globalMaxMaximumDistance = 20;

    if (options){
      if ("minDuration" in options){
        globalMinDuration = options["minDuration"];
      }

      if ("maxDistance" in options){
        globalMaxMaximumDistance = options["maxDistance"];
        globalMaxDistance = options["maxDistance"];
      }
    }

    this.initialParameters.global.min["duration"] = globalMinDuration; // milliseconds. after a certain touch duration, it is not a TAP anymore

    this.initialParameters.global.max["distance"] = globalMaxDistance; // if the pointer moved a certain distance, Press becomes impossible
    this.initialParameters.global.max["maximumDistance"] = globalMaxMaximumDistance;
    // only Press has this parameter
    this.hasBeenEmitted = false;

  }

  recognize(pointerManager: PointerManager): void {
    const isValid = this.validate(pointerManager);

    const singlePointerInput = this.getPointerInput(pointerManager);

    // is this line really necessary? ESLint complains if it is not present, although its value is set in the constructor
    // adding Object.freeze(this.initialParameters) in the constructor did not resolve the ESLint error
    const minDuration = this.initialParameters.global.min["duration"] || Press.minDuration;

    if (singlePointerInput instanceof SinglePointerInput) {

      if (
        isValid == true &&
        this.hasBeenEmitted == false
      ) {

        this.setInitialPointerEvent(pointerManager);

        this.emit(pointerManager);

        this.hasBeenEmitted = true;
        this.state = GestureState.Active;
        this.blockGestures();

      } else if (isValid == false && this.hasBeenEmitted == true) {
        this.onEnd(pointerManager);
        this.state = GestureState.Inactive;
        this.hasBeenEmitted = false;
      } else {
        const duration = singlePointerInput.parameters.global.duration;

        if (
          this.hasBeenEmitted == true &&
          duration <= minDuration
        ) {
          this.hasBeenEmitted = false;
        }
      }
    }

    if (singlePointerInput == null) {
      this.hasBeenEmitted = false;
    }
  }
}