import {
  Gesture,
  GestureOptions,
  LiveGestureEventData,
  GlobalGestureEventData,
  GestureEventData,
} from "./Gesture";

import { PointerManagerState } from "../input-consts";
import { SinglePointerGestureParameters } from "../interfaces";
import { Point } from "../geometry/Point";
import { Vector } from "../geometry/Vector";
import { SinglePointerInput } from "../SinglePointerInput";
import { PointerManager } from "../PointerManager";

export abstract class SinglePointerGesture extends Gesture {

  initialPointerEvent: PointerEvent | null;

  initialParameters: SinglePointerGestureParameters;
  activeStateParameters: SinglePointerGestureParameters;

  constructor(domElement: HTMLElement, options?: Partial<GestureOptions>) {
    super(domElement, options);
    this.initialPointerEvent = null;
    this.validPointerManagerState = PointerManagerState.SinglePointer;

    const nullRecognitionParameters = this.getEmptyGestureParameters() as SinglePointerGestureParameters;

    this.initialParameters = { ...nullRecognitionParameters };
    // a deep copy of the parameters is needed as they can have different values
    this.activeStateParameters = JSON.parse(JSON.stringify({ ...nullRecognitionParameters }));
  }

  getEventData(singlePointerInput: SinglePointerInput, pointerManager: PointerManager): GestureEventData {
    // provide short-cuts to the values collected in the Contact object
    // match this to the event used by hammer.js

    const globalParameters = singlePointerInput.parameters.live;
    const liveParameters = singlePointerInput.parameters.live;

    let globalVector: Vector = globalParameters.vector;
    let globalDuration: number = globalParameters.duration;

    // gesture specific - dependant on the beginning of the gesture (when the gesture has initially been recognized)
    if (this.initialPointerEvent != null) {
      const globalStartPoint = new Point(
        this.initialPointerEvent.clientX,
        this.initialPointerEvent.clientY
      );
      const globalEndPoint = new Point(
        singlePointerInput.pointer.currentPointerEvent.clientX,
        singlePointerInput.pointer.currentPointerEvent.clientY
      );
      globalVector = new Vector(globalStartPoint, globalEndPoint);
      globalDuration =
        singlePointerInput.pointer.currentPointerEvent.timeStamp -
        this.initialPointerEvent.timeStamp;
    }

    // global: global for this recognizer, not the Contact object
    const globalGestureEventData: GlobalGestureEventData = {
      deltaX: globalVector.x,
      deltaY: globalVector.y,
      distance: globalVector.vectorLength,
      speedX: globalVector.x / globalDuration,
      speedY: globalVector.y / globalDuration,
      speed: globalVector.vectorLength / globalDuration,
      direction: globalVector.direction,
      scale: 1,
      rotation: 0,
      center: {
        x: globalParameters.vector.endPoint.x,
        y: globalParameters.vector.endPoint.y,
      },
      srcEvent: singlePointerInput.pointer.currentPointerEvent,
    };

    const liveGestureEventData: LiveGestureEventData = {
      deltaX: liveParameters.vector.x,
      deltaY: liveParameters.vector.y,
      distance: liveParameters.vector.vectorLength,
      speedX:
        liveParameters.vector.x / singlePointerInput.pointer.vectorTimespan,
      speedY:
        liveParameters.vector.y / singlePointerInput.pointer.vectorTimespan,
      speed: liveParameters.speed,
      direction: liveParameters.vector.direction,
      scale: 1,
      rotation: 0,
      center: {
        x: liveParameters.vector.endPoint.x,
        y: liveParameters.vector.endPoint.y,
      },
      srcEvent: singlePointerInput.pointer.currentPointerEvent /*,
      target : primaryPointerInput.touch.target,
      pointerType : ,
      eventType : ,
      isFirst : ,
      isFinal :,
      pointers : ,*/,
    };

    const eventData: GestureEventData = {
      recognizer: this,
      global: globalGestureEventData,
      live: liveGestureEventData,
      pointerManager: pointerManager,
    };

    return eventData;
  }

}