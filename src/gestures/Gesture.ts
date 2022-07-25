import { PointerManager } from "../PointerManager";
import { PointerInput } from "../PointerInput";
import { DualPointerInput } from "../DualPointerInput";

import {
  GestureState,
  PointerManagerState,
} from "../input-consts";

export type MinMaxInterval = [number | null, number | null];
export type BooleanParameter = boolean | null;


export interface GestureOptions {
  DEBUG: boolean;
  blocks: Gesture[];
  bubbles: boolean;
  supportedDirections?: string[];
}


export abstract class Gesture {

  validPointerManagerState: PointerManagerState | null;

  options: GestureOptions;
  DEBUG: boolean;

  eventBaseName!: string;

  readonly domElement: HTMLElement;

  initialPointerEvent: PointerEvent | null;

  state: GestureState;

  constructor(domElement: HTMLElement, options?: Partial<GestureOptions>) {

    this.state = GestureState.Inactive;

    this.validPointerManagerState = null;

    this.domElement = domElement;

    this.initialPointerEvent = null;

    this.options = {
      bubbles: true,
      blocks: [],
      DEBUG: false,
      ...options
    };

    this.DEBUG = true; //this.options.DEBUG;

  }

  validateDirection(pointerInput: PointerInput): boolean {
    // check direction
    const hasSupportedDirections = !!this.options.supportedDirections;
    if (
      hasSupportedDirections &&
      !this.options.supportedDirections!.includes(
        pointerInput.parameters.live.vector!.direction
      )
    ) {
      if (this.DEBUG == true) {
        console.log(
          `[Gestures] dismissing ${this.eventBaseName}: supported directions: ${this.options.supportedDirections}, current direction: ${pointerInput.parameters.live.vector!.direction}`
        );
      }

      return false;
    }

    return true;
  }

  // validate pointerCount and GestureState.Blocked
  validate(pointerManager: PointerManager): boolean {

    if (this.state == GestureState.Blocked) {
      return false;
    }

    if (pointerManager.state != this.validPointerManagerState) {

      if (this.DEBUG == true) {
        console.log(
          `[Gesture] PointerManagerState invalidated: ${pointerManager.state}`
        );
      }

      return false;
    }

    if (this.DEBUG == true) {
      console.log(
        `[Gesture] PointerManagerState validated: ${pointerManager.state}`
      );
    }

    return true;
  }

  // implementation differs for SinglePointerGesture and DualPointerGesture
  getPointerInput(pointerManager: PointerManager): PointerInput | DualPointerInput | null {
    throw new Error("[Gesture] Gesture subclasses require a .getPointerInput() method");
  }

  recognize(pointerManager: PointerManager): void {
    throw new Error("[Gesture] Gesture subclasses require a .recognize() method");
  }

  emit(pointerManager: PointerManager, eventName?: string): void {
    throw new Error("[Gesture] Gesture subclasses require a .emit() method");
  }

  setInitialPointerEvent(pointerManager: PointerManager): void {
    throw new Error("[Gesture] Gesture subclasses require a .setInitialPointerEvent() method");
  }

  onStart(pointerManager: PointerManager): void {
    this.state = GestureState.Active;
    this.setInitialPointerEvent(pointerManager);
    const eventName: string = `${this.eventBaseName}start`;
    this.emit(pointerManager, eventName);
  }

  onEnd(pointerManager: PointerManager): void {
    if (this.DEBUG == true) {
      console.log(`[${this.eventBaseName}] ended. Setting ${this.eventBaseName}.state = ${GestureState.Inactive}`);
    }
    this.state = GestureState.Inactive;

    const eventName: string = `${this.eventBaseName}end`;
    this.emit(pointerManager, eventName);

  }

  // provide the ability to react (eg block) to touch events
  /* eslint-disable @typescript-eslint/no-unused-vars */
  onTouchStart(event: TouchEvent): void { /* empty */ }
  onTouchMove(event: TouchEvent): void { /* empty */ }
  onTouchEnd(event: TouchEvent): void { /* empty */ }
  onTouchCancel(event: TouchEvent): void { /* empty */ }
  /* eslint-enable @typescript-eslint/no-unused-vars */

  block(gesture: Gesture): void {
    if (this.options.blocks.indexOf(gesture) == -1) {
      this.options.blocks.push(gesture);
    }
  }

  unblock(gesture: Gesture): void {
    if (this.options.blocks.indexOf(gesture) != -1) {
      this.options.blocks.splice(this.options.blocks.indexOf(gesture), 1);
    }
  }

  blockGestures(): void {
    for (let g = 0; g < this.options.blocks.length; g++) {
      const gesture = this.options.blocks[g];
      if (gesture.state == GestureState.Inactive) {
        if (this.DEBUG == false) {
          console.log(`[Gesture] blocking ${gesture.eventBaseName}`);
        }
        gesture.state = GestureState.Blocked;
      }
    }
  }

  unblockGestures(): void {
    for (let g = 0; g < this.options.blocks.length; g++) {
      const gesture = this.options.blocks[g];
      gesture.state = GestureState.Inactive;
    }
  }
}
