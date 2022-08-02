import { Vector } from "./geometry/Vector";
import { Point } from "./geometry/Point";

export interface TimedParameters {
  global: {},
  live: {},
}

export interface MinMaxInterval {
  min: {},
  max: {},
}

export interface TimedMinMaxParameters extends TimedParameters {
  global: MinMaxInterval,
  live: MinMaxInterval,
}

export interface PointerGlobalParameters {
  duration: number, // ms
  currentSpeed: number, // px/s
  averageSpeed: number, // px/s
  finalSpeed: number, // px/s
  distance: number, // px
  maximumDistance: number, //px
  // additional parameters for the GestureEvent
  startX: number,
  startY: number,
  vector: Vector,
  deltaX: number,
  deltaY: number,
  startTimestampUTC: number,
  startTimestamp: number,
  currentTimestamp: number,
  endTimestamp: number | null,
  maximumSpeed: number,
  traveledDistance: number,
  hasBeenMoved: boolean,
}

export interface PointerLiveParameters {
  duration: number, // ms
  speed: number,
  vector: Vector,
  distance: number,
  isMoving: boolean,
}

export interface PointerParameters extends TimedParameters {
  global: PointerGlobalParameters,
  live: PointerLiveParameters,
}

/**
 * Intervals for which a single pointer gesture is valid
 */
export interface SinglePointerGestureParameters extends TimedMinMaxParameters {
  global: {
    min: Partial<PointerGlobalParameters>,
    max: Partial<PointerGlobalParameters>,
    boolean: Partial<PointerGlobalParameters>,
  },
  live: {
    min: Partial<PointerLiveParameters>,
    max: Partial<PointerLiveParameters>,
    boolean: Partial<PointerLiveParameters>,
  }
}

export interface DualPointerInputGlobalParameters {
  duration: number,
  center: Point,
  centerHasBeenMoved: boolean,
  centerMovementDistance: number,
  centerMovementVector: Vector,
  absolutePointerDistanceChange: number, // px
  relativePointerDistanceChange: number, // %
  rotationAngle: number,
  absoluteRotationAngle: number,
  vectorAngle: number,
  absoluteVectorAngle: number,
}

export interface DualPointerInputLiveParameters {
  center: Point,
  centerIsMoving: boolean,
  centerMovementDistance: number,
  centerMovementVector: Vector,
  absolutePointerDistanceChange: number,
  relativePointerDistanceChange: number,
  rotationAngle: number,
  absoluteRotationAngle: number,
  vectorAngle: number,
  absoluteVectorAngle: number,
}

export interface DualPointerInputParameters extends TimedParameters {
  global: DualPointerInputGlobalParameters,
  live: DualPointerInputLiveParameters,
}

/**
 * Intervals for which a dual pointer gesture is valid
 */
export interface DualPointerGestureParameters extends TimedMinMaxParameters{
  global: {
    min: Partial<DualPointerInputGlobalParameters>,
    max: Partial<DualPointerInputGlobalParameters>,
    boolean: Partial<DualPointerInputGlobalParameters>,
  }
  live: {
    min: Partial<DualPointerInputLiveParameters>,
    max: Partial<DualPointerInputLiveParameters>,
    boolean: Partial<DualPointerInputLiveParameters>,
  }
}