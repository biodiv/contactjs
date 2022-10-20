import { GestureOptions } from "./Gesture";
import { SinglePointerGesture } from "./SinglePointerGesture";
import { PointerManager } from "../PointerManager";
import { SinglePointerInput } from "../SinglePointerInput";
import { PointerManagerState } from "../input-consts";


interface TapOptions extends GestureOptions {
  maxDuration: number;
  maxDistance: number;
}

/*
 * TAP DEFINITION
 * - user touches the screen with one finger or presses the mouse button down
 * - the finger does not move for x ms
 * - no additional fingers are added
 * - the finger is released, Tap is no recognized
 */
export class Tap extends SinglePointerGesture {

  constructor(domElement: HTMLElement, options?: Partial<TapOptions>) {
    super(domElement, options);

    this.validPointerManagerState = PointerManagerState.NoPointer;

    this.eventBaseName = "tap";

    let globalMaxDuration = 200;
    let liveMaxDistance = 30;
    let globalMaxDistance = 30;

    if (options){
      if ("maxDuration" in options){
        globalMaxDuration = options["maxDuration"];
      }

      if ("maxDistance" in options){
        liveMaxDistance = options["maxDistance"];
        globalMaxDistance = options["maxDistance"];
      }
    }

    this.initialParameters.global.max["duration"] = globalMaxDuration; // milliseconds. after a certain touch duration, it is not a TAP anymore

    this.initialParameters.live.max["distance"] = liveMaxDistance; // if a certain distance is detected, TAP becomes impossible
    this.initialParameters.global.max["distance"] = globalMaxDistance; // if a certain distance is detected, TAP becomes impossible

  }

  validateButton(pointerManager: PointerManager): boolean {

    if (this.options.supportedButtons.length > 0){

      const lastRemovedPointer = pointerManager.lastRemovedPointer;

      if (lastRemovedPointer != null) {
        const pointerEvent = lastRemovedPointer.currentPointerEvent;
      
        // pointerEvent.button instead of pointerEvent.buttons
        if (pointerEvent.pointerType == "mouse" && this.options.supportedButtons.indexOf(pointerEvent.button) == -1) {

          if (this.DEBUG == true) {
            console.log(
              `dismissing ${this.eventBaseName}: supportedButtons: ${this.options.supportedButtons.toString()}, poinerEvent.button: ${pointerEvent.button}`
            );
          }

          return false;
        }
      }
    }

    return true;
  }

  validate(pointerManager: PointerManager): boolean {

    let isValid = this.validateGestureState();

    if (isValid == true){
      isValid = this.validatePointerManagerState(pointerManager);
    }

    if (isValid == true){
      isValid = this.validateButton(pointerManager);
    }

    if (isValid === true) {

      if (pointerManager.lastInputSessionPointerCount != 1) {
        return false;
      }
      else {

        const singlePointerInput = pointerManager.getlastRemovedPointerInput();

        if (singlePointerInput instanceof SinglePointerInput) {

          isValid = this.validateGestureParameters(singlePointerInput);

        }
        else {
          isValid = false;
        }
      }

    }

    return isValid;
  }

  // do not set Tap.state = GestureState.active as Tap has no active state
  onStart(pointerManager: PointerManager): void {
    this.setInitialPointerEvent(pointerManager);
    this.emit(pointerManager);
  }

}