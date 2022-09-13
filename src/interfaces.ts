import { Vector } from "./geometry/Vector";
import { Point } from "./geometry/Point";

export interface TimedParameters {
  global: Record<string, any>,
  live: Record<string, any>,
}

export interface MinMaxIntervalBool {
  min: Record<string, any>,
  max: Record<string, any>,
  boolean: Record<string, any>,
}

export interface TimedMinMaxParameters extends TimedParameters {
  global: MinMaxIntervalBool,
  live: MinMaxIntervalBool,
}

export interface PointerGlobalNumberParameters {
  duration: number, // ms
  currentSpeed: number, // px/s
  averageSpeed: number, // px/s
  finalSpeed: number, // px/s
  distance: number, // px
  maximumDistance: number, //px
  // additional parameters for the GestureEvent
  startX: number,
  startY: number,
  deltaX: number,
  deltaY: number,
  startTimestampUTC: number,
  startTimestamp: number,
  currentTimestamp: number,
  endTimestamp: number | null,
  maximumSpeed: number,
  traveledDistance: number,
}

export interface GeometricParameters {
  vector: Vector,
}

export interface PointerGlobalBooleanParameters {
  hasBeenMoved: boolean,
}

export interface PointerGlobalParameters extends
  PointerGlobalNumberParameters,
  GeometricParameters,
  PointerGlobalBooleanParameters {}

/*
export interface PointerGlobalParameters {
  vector: Vector,
  duration: number, // ms
  currentSpeed: number, // px/s
  averageSpeed: number, // px/s
  finalSpeed: number, // px/s
  distance: number, // px
  maximumDistance: number, //px
  // additional parameters for the GestureEvent
  startX: number,
  startY: number,
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
*/

export interface PointerLiveNumberParameters {
  duration: number, // ms
  speed: number,
  distance: number,
}

export interface PointerLiveBooleanParameters {
  isMoving: boolean,
}


export interface PointerLiveParameters extends
  PointerLiveNumberParameters,
  GeometricParameters,
  PointerLiveBooleanParameters {}

/*
export interface PointerLiveParameters {
  duration: number, // ms
  speed: number,
  distance: number,
  vector: Vector,
  isMoving: boolean,
}*/

export interface PointerParameters extends TimedParameters {
  global: PointerGlobalParameters,
  live: PointerLiveParameters,
}

/**
 * Intervals for which a single pointer gesture is valid
 */
export interface SinglePointerGestureParameters extends TimedMinMaxParameters {
  global: {
    min: Partial<PointerGlobalNumberParameters>,
    max: Partial<PointerGlobalNumberParameters>,
    boolean: PointerGlobalBooleanParameters,
  },
  live: {
    min: Partial<PointerLiveNumberParameters>,
    max: Partial<PointerLiveNumberParameters>,
    boolean: Partial<PointerLiveBooleanParameters>,
  }
}



/**
 * Dual Pointer interfaces
 */
export interface DualPointerInputGlobalNumberParameters {
  duration: number,
  centerMovementDistance: number,
  absolutePointerDistanceChange: number, // px
  relativePointerDistanceChange: number, // %
  rotationAngle: number,
  absoluteRotationAngle: number,
  vectorAngle: number,
  absoluteVectorAngle: number,
}

export interface DualPointerInputGlobalBooleanParameters {
  centerHasBeenMoved: boolean,
}

export interface DualPointerInputGeometricParameters {
  centerMovementVector: Vector,
  center: Point,
}

export interface DualPointerInputGlobalParameters extends
  DualPointerInputGlobalNumberParameters,
  DualPointerInputGlobalBooleanParameters,
  DualPointerInputGeometricParameters {}


/*export interface DualPointerInputGlobalParameters {
  duration: number,
  centerMovementDistance: number,
  absolutePointerDistanceChange: number, // px
  relativePointerDistanceChange: number, // %
  rotationAngle: number,
  absoluteRotationAngle: number,
  vectorAngle: number,
  absoluteVectorAngle: number,
  centerMovementVector: Vector,
  center: Point,
  centerHasBeenMoved: boolean,
}*/

export interface DualPointerInputLiveNumberParameters {
  centerMovementDistance: number,
  centerMovementVector: Vector,
  absolutePointerDistanceChange: number,
  relativePointerDistanceChange: number,
  rotationAngle: number,
  absoluteRotationAngle: number,
  vectorAngle: number,
  absoluteVectorAngle: number,
}

export interface DualPointerInputLiveBooleanParameters {
  centerIsMoving: boolean,
}

export interface DualPointerInputLiveParameters extends
  DualPointerInputLiveNumberParameters,
  DualPointerInputLiveBooleanParameters,
  DualPointerInputGeometricParameters {}

/*
export interface DualPointerInputLiveParameters {
  centerMovementDistance: number,
  absolutePointerDistanceChange: number,
  relativePointerDistanceChange: number,
  rotationAngle: number,
  absoluteRotationAngle: number,
  vectorAngle: number,
  absoluteVectorAngle: number,
  centerMovementVector: Vector,
  center: Point,
  centerIsMoving: boolean,
}*/

export interface DualPointerInputParameters extends TimedParameters {
  global: DualPointerInputGlobalParameters,
  live: DualPointerInputLiveParameters,
}

/**
 * Intervals for which a dual pointer gesture is valid
 */
export interface DualPointerGestureParameters extends TimedMinMaxParameters{
  global: {
    min: Partial<DualPointerInputGlobalNumberParameters>,
    max: Partial<DualPointerInputGlobalNumberParameters>,
    boolean: Partial<DualPointerInputGlobalBooleanParameters>,
  }
  live: {
    min: Partial<DualPointerInputLiveNumberParameters>,
    max: Partial<DualPointerInputLiveNumberParameters>,
    boolean: Partial<DualPointerInputLiveBooleanParameters>,
  }
}