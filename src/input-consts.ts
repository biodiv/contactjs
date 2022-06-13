"use strict";

export const DIRECTION_NONE = "0";
export const DIRECTION_LEFT = "left";
export const DIRECTION_RIGHT = "right";
export const DIRECTION_UP = "up";
export const DIRECTION_DOWN = "down";
export const DIRECTION_CLOCKWISE = 1;
export const DIRECTION_COUNTER_CLOCKWISE = -1;

export const DIRECTION_HORIZONTAL = [DIRECTION_LEFT, DIRECTION_RIGHT];
export const DIRECTION_VERTICAL = [DIRECTION_UP, DIRECTION_DOWN];
export const DIRECTION_ALL = [
  DIRECTION_LEFT,
  DIRECTION_RIGHT,
  DIRECTION_UP,
  DIRECTION_DOWN,
];

export const GESTURE_STATE_POSSIBLE = "possible";
export const GESTURE_STATE_BLOCKED = "blocked";
