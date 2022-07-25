export enum Direction {
	None = "0",
	Left = "left",
	Right = "right",
	Up = "up",
	Down = "down"
}

export const Directions = Object.freeze({
	Horizontal: [
		Direction.Left,
		Direction.Right
	],
	Vertical: [
		Direction.Up,
		Direction.Down
	],
	All: [
		Direction.Left,
		Direction.Right,
		Direction.Up,
		Direction.Down,
	]
});

export enum GestureState {
	Inactive = "inactive",
	Active = "active",
	Blocked = "blocked"
}

export enum PointerManagerState {
	NoPointer = "nopointer",
	SinglePointer = "singlepointer",
	DualPointer = "dualpointer",
}