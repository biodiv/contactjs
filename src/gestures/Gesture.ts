import { PointerManager } from "../PointerManager";
import { SinglePointerInput } from "../SinglePointerInput";
import { DualPointerInput } from "../DualPointerInput";
import { Pointer } from "../Pointer";
import { Point } from "../geometry/Point";

import { TimedParameters } from "../interfaces";

import {
  GestureState,
  PointerManagerState,
} from "../input-consts";
import { SinglePointerGestureParameters } from "./SinglePointerGesture";
import { DualPointerGestureParameters } from "./DualPointerGesture";


export type MinMaxValue = number | null;
export type MinMaxInterval = [MinMaxValue, MinMaxValue];
export type BooleanParameter = boolean | null;
export type GestureParameterValue = MinMaxValue | BooleanParameter;

type SinglePointerInputConstructor = new (...args: ConstructorParameters<typeof SinglePointerInput>) => SinglePointerInput;
type DualPointerInputConstructor = new (...args: ConstructorParameters<typeof DualPointerInput>) => DualPointerInput;

export interface GestureOptions {
  DEBUG: boolean;
  blocks: Gesture[];
  bubbles: boolean;
  supportedDirections: string[];
}

export interface GlobalGestureEventData {
  deltaX: number;
  deltaY: number;
  distance: number;
  speedX: number;
  speedY: number;
  speed: number;
  direction: string;
  scale: number;
  rotation: number;
  srcEvent: PointerEvent;
}

export interface LiveGestureEventData {
  deltaX: number;
  deltaY: number;
  distance: number;
  speedX: number;
  speedY: number;
  speed: number;
  direction: string;
  scale: number;
  rotation: number;
  center: Point;
  srcEvent: PointerEvent;
}

export interface GestureEventData extends TimedParameters {
  recognizer: Gesture,
  global: GlobalGestureEventData,
  live: LiveGestureEventData,
}

export abstract class Gesture {

  validPointerManagerState: PointerManagerState | null;
  validPointerInputConstructor: SinglePointerInputConstructor | DualPointerInputConstructor;

  options: GestureOptions;
  DEBUG: boolean;

  eventBaseName!: string;

  readonly domElement: HTMLElement;

  initialPointerEvent: PointerEvent | null;

  state: GestureState;

  constructor(domElement: HTMLElement, options?: Partial<GestureOptions>) {

    this.state = GestureState.Inactive;

    this.validPointerManagerState = null;
    this.validPointerInputConstructor = SinglePointerInput;

    this.domElement = domElement;

    this.initialPointerEvent = null;

    this.options = {
      bubbles: true,
      blocks: [],
      supportedDirections: [],
      DEBUG: false,
      ...options
    };

    this.DEBUG = true; //this.options.DEBUG;

  }

  validateGestureParameters(pointerInput: SinglePointerInput | DualPointerInput): boolean {
    throw new Error("not implemented");
  }

  validateBooleanParameter(gestureParameter: boolean | null, pointerInputValue: boolean) {
    if (gestureParameter == null){
      return true;
    } else if (gestureParameter == pointerInputValue) {

      if (this.DEBUG == true) {
        console.log(
          `validated: required value: ${gestureParameter}, current value: ${pointerInputValue}`
        );
      }

      return true;
    }

    if (this.DEBUG == true) {
      console.log(
        `dismissing ${this.eventBaseName}: required value: ${gestureParameter}, current value: ${pointerInputValue}`
      );
    }

    return false;
  }

  validateMinMaxParameter(interval: MinMaxInterval, value: MinMaxValue): boolean {

    const minValue: MinMaxValue = interval[0];
    const maxValue: MinMaxValue = interval[1];

    if (
      minValue == null &&
      maxValue == null
    ){
      return true;
    }

    if (
      minValue != null &&
      value != null &&
      value < minValue
    ) {

      if (this.DEBUG == true) {
        console.log(
          `dismissing min${this.eventBaseName}: ${minValue}, current value: ${value}`
        );
      }

      return false;
    }

    if (
      maxValue != null &&
      value != null &&
      value > maxValue
    ) {
      if (this.DEBUG == true) {
        console.log(
          `dismissing max${this.eventBaseName}: ${maxValue}, current value: ${value}`
        );
      }

      return false;
    }

    if (this.DEBUG == true) {
      console.log(
        `validated: minMax: [${minValue}, ${maxValue}] - current value: ${value}`
      );
    }

    return true;
  }

  validateGestureParameter(gestureParameter: MinMaxInterval | BooleanParameter, pointerInputValue: number | boolean | null) {

    let isValid = true;

    if (typeof gestureParameter == "boolean" || gestureParameter == null) {

      if (typeof pointerInputValue != "boolean") {
        return false;
      }

      isValid = this.validateBooleanParameter(gestureParameter, pointerInputValue);

    } else {

      const interval: MinMaxInterval = gestureParameter;

      if (typeof pointerInputValue == "boolean") {
        return false;
      }

      isValid = this.validateMinMaxParameter(
        interval,
        pointerInputValue
      );

    }

    return isValid;

  }

  validateDirection(pointerInput: SinglePointerInput | DualPointerInput): boolean {

    const currentDirection = pointerInput.getCurrentDirection();

    if (
      this.options.supportedDirections.length &&
      !this.options.supportedDirections.includes(
        currentDirection
      )
    ) {
      if (this.DEBUG == true) {
        console.log(
          `[Gestures] dismissing ${this.eventBaseName}: supported directions: ${this.options.supportedDirections}, current direction: ${currentDirection}`
        );
      }

      return false;
    }

    return true;
  }

  validateGestureState(): boolean {
    if (this.state == GestureState.Blocked) {
      return false;
    }
    return true;
  }

  validatePointerManagerState(pointerManager: PointerManager): boolean {
    if (pointerManager.state == this.validPointerManagerState) {
      return true;
    }

    if (this.DEBUG == true) {
      console.log(
        `[Gesture] PointerManagerState invalidated: ${pointerManager.state}`
      );
    }

    return false;
  }

  validatePointerInputConstructor(pointerInput: SinglePointerInput | DualPointerInput): boolean {
    if (pointerInput instanceof this.validPointerInputConstructor) {
      return true;
    }

    if (this.DEBUG == true) {
      console.log(
        `[Gesture] PointerInputConstructor invalidated: ${this.validPointerInputConstructor}`
      );
    }

    return false;
  }

  // validate pointerCount and GestureState.Blocked
  validate(pointerManager: PointerManager): boolean {

    let isValid = this.validateGestureState();

    if (isValid == true){
      isValid = this.validatePointerManagerState(pointerManager);
    }

    var pointerInput = pointerManager.activePointerInput;

    if (
      isValid == true &&
      pointerInput != null
    ) {
      isValid = this.validatePointerInputConstructor(pointerInput);

      if (isValid == true){
        isValid = this.validateDirection(pointerInput);
      }

      if (isValid == true) {
        isValid = this.validateGestureParameters(pointerInput)
      }
    }

    return isValid;
  }

  recognize(pointerManager: PointerManager): void {
    const isValid = this.validate(pointerManager);

    if (
      isValid == true &&
      this.state == GestureState.Inactive
    ) {
      this.onStart(pointerManager);
    }

    if (
      isValid == true &&
      this.state == GestureState.Active
    ) {

      if (this.initialPointerEvent == null) {
        this.setInitialPointerEvent(pointerManager);
      }

      this.emit(pointerManager);

    } else if (this.state == GestureState.Active && isValid == false) {

      this.onEnd(pointerManager);


    }
    else {
      if (this.DEBUG == true) {
        console.log(
          `not firing event ${this.eventBaseName}. No SinglePointerInput found`
        );
      }
    }
  }

  /*
   * The PointerInput for recognition has to be pointerManager.lastRemovedPointer if there is no active pointer left
   */
  getPointerInput(pointerManager: PointerManager): SinglePointerInput | DualPointerInput | null {

    if (pointerManager.hasPointersOnSurface() == true && pointerManager.activePointerInput instanceof this.validPointerInputConstructor) {
      return pointerManager.activePointerInput;
    }
    else if (pointerManager.lastRemovedPointer instanceof Pointer) {
      const pointerInput = pointerManager.getlastRemovedPointerInput();
      if (pointerInput instanceof this.validPointerInputConstructor){
        return pointerInput;
      }
    }

    return null;
  }

  setInitialPointerEvent(pointerManager: PointerManager): void {
    const pointerInput = this.getPointerInput(pointerManager);
    if (pointerInput instanceof this.validPointerInputConstructor) {
      const pointerEvent: PointerEvent = pointerInput.getCurrentPointerEvent();
      this.initialPointerEvent = pointerEvent;
    }
  }

  emit(pointerManager: PointerManager, eventName?: string): void {

    // fire general event like "tap", "press", "pan"
    eventName = eventName || this.eventBaseName;

    if (this.DEBUG === true) {
      console.log(`[Gestures] detected and firing event ${eventName}`);
    }

    const pointerInput = this.getPointerInput(pointerManager);

    if (pointerInput != null){

      const target = pointerInput.getTarget();

      if (target instanceof EventTarget) {

        const eventData = this.getEventData(pointerInput);

        const eventOptions = {
          detail: eventData,
          bubbles: this.options.bubbles,
        };

        const event = new CustomEvent(eventName, eventOptions);

        if (eventOptions.bubbles == true) {
          target.dispatchEvent(event);
        } else {
          this.domElement.dispatchEvent(event);
        }

        // fire direction specific events
        const currentDirection = eventData.live!.direction;

        const hasSupportedDirections = !!this.options.supportedDirections;
        // do not fire events like "panendleft"
        // only fire directional events if eventName == this.eventBaseName 
        if (hasSupportedDirections == true && eventName == this.eventBaseName) {
          for (let d = 0; d < this.options.supportedDirections!.length; d++) {
            const direction = this.options.supportedDirections![d];

            if (direction == currentDirection) {
              const directionEventName = eventName + direction;

              if (this.DEBUG == true) {
                console.log(
                  `[Gestures] detected and firing event ${directionEventName}`
                );
              }

              const directionEvent = new CustomEvent(
                directionEventName,
                eventOptions
              );

              if (eventOptions.bubbles == true) {
                target.dispatchEvent(directionEvent);
              } else {
                this.domElement.dispatchEvent(directionEvent);
              }
            }
          }
        }
      }
    }
    
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
          console.log(
            `[Gesture] blocking ${gesture.eventBaseName}`
          );
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

  getEventData(pointerInput: SinglePointerInput | DualPointerInput): GestureEventData {
    throw new Error("Gesture subclasses require a getEventData method()")
  }

}