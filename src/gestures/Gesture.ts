import { PointerManager } from "../PointerManager";
import { SinglePointerInput } from "../SinglePointerInput";
import { DualPointerInput } from "../DualPointerInput";
import { Pointer } from "../Pointer";
import { Point } from "../geometry/Point";
import { Vector } from "../geometry/Vector";

import {
  TimedParameters,
  TimedMinMaxParameters,
  SinglePointerGestureParameters,
  DualPointerGestureParameters,
} from "../interfaces";

import {
  GestureState,
  PointerManagerState,
  Direction,
} from "../input-consts";


type GestureParameterValue = number | boolean | null | Vector;

type SinglePointerInputConstructor = new (...args: ConstructorParameters<typeof SinglePointerInput>) => SinglePointerInput;
type DualPointerInputConstructor = new (...args: ConstructorParameters<typeof DualPointerInput>) => DualPointerInput;

export const GestureEvent = CustomEvent<GestureEventData>;

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
  direction: Direction;
  scale: number;
  rotation: number;
  center: Point;
  srcEvent: PointerEvent;
}

export interface LiveGestureEventData {
  deltaX: number;
  deltaY: number;
  distance: number;
  speedX: number;
  speedY: number;
  speed: number;
  direction: Direction;
  scale: number;
  rotation: number;
  center: Point;
  srcEvent: PointerEvent;
}

export interface GestureEventData extends TimedParameters {
  recognizer: Gesture,
  global: GlobalGestureEventData,
  live: LiveGestureEventData,
  pointerManager: PointerManager,
}

export abstract class Gesture {

  validPointerManagerState: PointerManagerState | null;
  validPointerInputConstructor: SinglePointerInputConstructor | DualPointerInputConstructor;

  options: GestureOptions;
  DEBUG: boolean;

  eventBaseName!: string;

  readonly domElement: HTMLElement;

  initialPointerEvent: PointerEvent | null;

  initialParameters: SinglePointerGestureParameters | DualPointerGestureParameters | null;
  activeStateParameters: SinglePointerGestureParameters | DualPointerGestureParameters | null;

  state: GestureState;

  constructor(domElement: HTMLElement, options?: Partial<GestureOptions>) {

    this.state = GestureState.Inactive;

    this.validPointerManagerState = null;
    this.validPointerInputConstructor = SinglePointerInput;

    this.domElement = domElement;

    this.initialPointerEvent = null;

    this.initialParameters = null;
    this.activeStateParameters = null;

    this.options = {
      bubbles: true,
      blocks: [],
      supportedDirections: [],
      DEBUG: false,
      ...options
    };

    this.DEBUG = this.options.DEBUG;

  }

  getEmptyGestureParameters(): TimedMinMaxParameters {
    const nullRecognitionParameters: TimedMinMaxParameters = {
      global: {
        min: {},
        max: {},
        boolean: {},
      },

      live: {
        min: {},
        max: {},
        boolean: {},
      }
    };

    return nullRecognitionParameters;
  }

  getGestureParameters(): SinglePointerGestureParameters | DualPointerGestureParameters {
    let gestureParameters;

    if (this.state == GestureState.Active) {
      gestureParameters = this.activeStateParameters;
      if (this.DEBUG == true) {
        console.log(
          `[${this.eventBaseName}] validating using activeStateParameters`
        );
        console.log(gestureParameters);
      }
    } else {
      if (this.DEBUG == true) {
        console.log(
          `[${this.eventBaseName}] validating using initialParameters`
        );
      }
      gestureParameters = this.initialParameters;
    }

    if (gestureParameters == null) {
      throw new Error("[Gesture] no gesture parameters found. Do not call .getGestureParameters on abstract class Gesture");
    }

    return gestureParameters;
  }

  validateGestureParameters(pointerInput: SinglePointerInput | DualPointerInput): boolean {

    const gestureParameters = this.getGestureParameters();

    let isValid = true;
    let timespan: keyof typeof gestureParameters;
    for (timespan in gestureParameters) {

      const timedGestureParameters = gestureParameters[timespan];
      const timedPointerInputValues = pointerInput.parameters[timespan] as Record<string, any>;

      let minOrMaxOrBoolean: keyof typeof timedGestureParameters;

      for (minOrMaxOrBoolean in timedGestureParameters) {
        const evaluationParameters = timedGestureParameters[minOrMaxOrBoolean] as Record<string, GestureParameterValue>;
        let gestureParameterName: string;
        for (gestureParameterName in evaluationParameters) {
          const gestureParameter = evaluationParameters[gestureParameterName];

          const pointerInputValue = timedPointerInputValues[gestureParameterName];

          if (this.DEBUG == true) {
            console.log(
              `[${this.eventBaseName}] validating ${timespan} ${minOrMaxOrBoolean}: required: ${gestureParameter}, pointer: ${pointerInputValue}`
            );
          }

          if (typeof gestureParameter == "boolean" && typeof pointerInputValue == "boolean") {
            isValid = this.validateBooleanParameter(gestureParameter, pointerInputValue);
          }
          else if (typeof gestureParameter == "number" && typeof pointerInputValue == "number") {
            isValid = this.validateMinMaxParameter(gestureParameter, pointerInputValue, minOrMaxOrBoolean);
          }

          if (isValid == false) {
            if (this.DEBUG == true) {
              console.log(`[${this.eventBaseName}] invalidated `);
            }
            return false;
          }

        }
      }
    }

    return true;
  }

  validateBooleanParameter(gestureParameter: boolean, pointerInputValue: boolean): boolean {
    if (gestureParameter == null) {
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

  validateMinMaxParameter(gestureParameter: number, pointerInputValue: number, minOrMax: string): boolean {
    if (minOrMax == "min") {
      if (pointerInputValue >= gestureParameter) {
        return true;
      }
    }
    else if (minOrMax == "max") {
      if (pointerInputValue <= gestureParameter) {
        return true;
      }
    }

    return false;
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
        `[Gesture] PointerManagerState invalidated ${this.eventBaseName}: ${pointerManager.state}`
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
        `[Gesture] PointerInputConstructor invalidated ${this.eventBaseName}: ${this.validPointerInputConstructor}`
      );
    }

    return false;
  }

  // validate pointerCount and GestureState.Blocked
  validate(pointerManager: PointerManager): boolean {

    let isValid = this.validateGestureState();

    if (isValid == true) {
      isValid = this.validatePointerManagerState(pointerManager);
    }

    const pointerInput = pointerManager.activePointerInput;

    if (
      isValid == true &&
      pointerInput != null
    ) {
      isValid = this.validatePointerInputConstructor(pointerInput);

      if (isValid == true) {
        isValid = this.validateDirection(pointerInput);
      }

      if (isValid == true) {
        isValid = this.validateGestureParameters(pointerInput);
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
      if (pointerInput instanceof this.validPointerInputConstructor) {
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

    if (pointerInput != null) {

      const target = pointerInput.getTarget();

      if (target instanceof EventTarget) {

        const eventData = this.getEventData(pointerInput, pointerManager);

        const eventOptions = {
          detail: eventData,
          bubbles: this.options.bubbles,
        };

        if (this.DEBUG === true) {
          console.log(eventOptions);
        }

        const event = new GestureEvent(eventName, eventOptions);

        if (eventOptions.bubbles == true) {
          target.dispatchEvent(event);
        } else {
          this.domElement.dispatchEvent(event);
        }

        // fire direction specific events
        const currentDirection = eventData.live.direction;

        const hasSupportedDirections = !!this.options.supportedDirections;
        // do not fire events like "panendleft"
        // only fire directional events if eventName == this.eventBaseName
        if (hasSupportedDirections == true && currentDirection != Direction.None && (eventName == this.eventBaseName || eventName == "swipe")) {
          for (let d = 0; d < this.options.supportedDirections.length; d++) {
            const direction = this.options.supportedDirections[d];

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
    this.blockGestures();

    this.state = GestureState.Active;
    this.setInitialPointerEvent(pointerManager);
    const eventName = `${this.eventBaseName}start`;
    this.emit(pointerManager, eventName);
  }

  onEnd(pointerManager: PointerManager): void {
    this.unblockGestures();

    if (this.DEBUG == true) {
      console.log(`[${this.eventBaseName}] ended. Setting ${this.eventBaseName}.state = ${GestureState.Inactive}`);
    }
    this.state = GestureState.Inactive;

    const eventName = `${this.eventBaseName}end`;
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

  getEventData(pointerInput: SinglePointerInput | DualPointerInput, pointerManager: PointerManager): GestureEventData {
    throw new Error("Gesture subclasses require a getEventData method()");
  }

}
