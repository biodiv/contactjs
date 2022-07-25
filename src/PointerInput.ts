import { Geometry } from "./geometry/Geometry";
import { Vector } from "./geometry/Vector";

/*********************************************************************************************************************
  PointerInput

  - contains data about one single finger / pointer
  - there are "live" parameters and "global" parameters
  - "live" parameters are caluclated using liveTimespan
  - "global" parameters are calculated using the whole timespan of this pointerdown
  - the current vector. The vector should be calculated "live" and not over the whole pointerdown duration.
    The user expects the pointer input to be in sync with his current finger movement on the screen,
    not with something a second ago.
  - start and end coordinates
  - start and end timestamps
  - speeds and distances
********************************************************************************************************************/

// parameters for recognizing the gesture
interface PointerInputGlobalParameters {
	duration: number, // ms
	currentSpeed: number, // px/s
	averageSpeed: number, // px/s
	finalSpeed: number | null, // px/s
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

interface PointerInputLiveParameters {
	duration: number, // ms
	speed: number,
	vector: Vector,
	distance: number,
	isMoving: boolean,
}

interface PointerInputParameters {
	live: PointerInputLiveParameters,
	global: PointerInputGlobalParameters,
}



interface PointerInputOptions {
	DEBUG: boolean;
	vectorTimespan?: number;
}

enum PointerInputState {
	Active = "active", // on the surface
	Removed = "removed", // removed from surface
	Canceled = "canceled",
}


export class PointerInput {
	readonly options: PointerInputOptions;
	DEBUG: boolean;
	vectorTimespan: number;

	readonly pointerId: number;

	readonly parameters: PointerInputParameters;

	readonly initialPointerEvent: PointerEvent;
	currentPointerEvent: PointerEvent;
	recognizedEvents: PointerEvent[];

	state: PointerInputState;

	constructor (pointerEvent: PointerEvent, options?: PointerInputOptions) {

		this.options = {
			DEBUG: false,
			...options,
		};
	  
		this.DEBUG = this.options.DEBUG;

		const now = new Date().getTime();

		this.pointerId = pointerEvent.pointerId;
		this.vectorTimespan = this.options.vectorTimespan ?? 100; // milliseconds

		this.initialPointerEvent = pointerEvent;
		this.currentPointerEvent = pointerEvent;
		this.recognizedEvents = [pointerEvent];

		this.state = PointerInputState.Active;

		const nullVector = Geometry.getVector(pointerEvent, pointerEvent);

		var globalParameters: PointerInputGlobalParameters = {
			startX: this.initialPointerEvent.clientX,
			startY: this.initialPointerEvent.clientY,
			vector: nullVector,
			deltaX: 0,
			deltaY: 0,
			startTimestampUTC: now,
			startTimestamp: this.initialPointerEvent.timeStamp, // unfortunately, FF (linux) does not provide UTC, but elapsed time since the window Object was created
			currentTimestamp: this.initialPointerEvent.timeStamp,
			endTimestamp: null,
			maximumSpeed: 0,
			currentSpeed: 0,
			distance: 0,
      maximumDistance: 0,
			averageSpeed: 0,
			finalSpeed: null,
			traveledDistance: 0,
			hasBeenMoved: false,
			duration: 0,
		};

		var liveParameters: PointerInputLiveParameters = {
			duration: 0, // ms
			speed: 0,
			vector: nullVector,
			distance: 0,
			isMoving: false,
		};

		var parameters: PointerInputParameters = {

			global:  globalParameters,
			live: liveParameters,
			
		};

		this.parameters = parameters;

	}

  getTarget(): EventTarget | null {
    return this.initialPointerEvent.target;
  }

	onIdle (): void {
		const now = new Date().getTime();

		// currentTimestamp is not an UTC millisecond timestamp.
		// this.globalParameters.currentTimestamp = now;

		const duration = now - this.parameters.global.startTimestampUTC;
		this.parameters.global.duration = duration;
	}

	reset(): void {
		
	}

	onPointerMove (pointermoveEvent: PointerEvent): void {

		this.parameters.global.hasBeenMoved = true;
		this.parameters.live.isMoving = true;

		this.update(pointermoveEvent);
	}

	onPointerUp (pointerupEvent: PointerEvent): void {
		this.parameters.global.finalSpeed = this.parameters.live.speed;

		this.parameters.live.speed = 0;

		this.parameters.live.isMoving = false;
		this.state = PointerInputState.Removed;

		this.parameters.global.endTimestamp = pointerupEvent.timeStamp;

		this.update(pointerupEvent);

		if (this.DEBUG === true) {
			console.log(
				`[PointerInput] pointerdown ended. pointerdown duration: ${this.parameters.global.duration}ms`
			);
		}
	}

	onPointerLeave (pointerleaveEvent: PointerEvent): void {
		this.onPointerUp(pointerleaveEvent);
	}

	onPointerCancel (pointercancelEvent: PointerEvent): void {
		this.update(pointercancelEvent);

		this.parameters.live.speed = 0;

		this.state = PointerInputState.Canceled

		this.parameters.live.isMoving = false;

		this.parameters.global.endTimestamp = pointercancelEvent.timeStamp;

		if (this.DEBUG === true) {
			console.log(`[PointerInput] canceled, pointerdown duration:${this.parameters.global.duration}ms`);
		}
	}

	update(pointerEvent: PointerEvent): void {
		// update general parameters
		this.currentPointerEvent = pointerEvent;
		this.recognizedEvents.push(pointerEvent);

		// update liveParameters
		// maybe check if clientX and clientY are present

		const timedPointerEvents = this.getTimedPointerEvents();

		const liveVector = Geometry.getVector(
			timedPointerEvents[0],
			timedPointerEvents[1]
		);

		this.parameters.live.vector = liveVector;
    this.parameters.live.distance = liveVector.vectorLength;
		
		this.parameters.live.speed = Geometry.getSpeed(
			liveVector,
			timedPointerEvents[0].timeStamp,
			timedPointerEvents[1].timeStamp
		)

		// update global parameters
		if (this.parameters.live.speed > this.parameters.global.maximumSpeed) {
			this.parameters.global.maximumSpeed = this.parameters.live.speed;
		}
		this.parameters.global.currentTimestamp = pointerEvent.timeStamp;
		this.parameters.global.duration = pointerEvent.timeStamp - this.parameters.global.startTimestamp;

		this.parameters.global.deltaX = liveVector.endPoint.x - this.parameters.global.startX;
		this.parameters.global.deltaY = liveVector.endPoint.y - this.parameters.global.startY;

		const globalVector = Geometry.getVector(
			this.initialPointerEvent,
			this.currentPointerEvent
		);
		this.parameters.global.vector = globalVector;

    this.parameters.global.distance = globalVector.vectorLength;
    if (globalVector.vectorLength > this.parameters.global.maximumDistance){
      this.parameters.global.maximumDistance = globalVector.vectorLength;
    }

		if (this.DEBUG === true) {
			console.log(
				`[PointerInput] current speed: ${this.parameters.live.speed}px/s`
			);
			console.log(
				`[PointerInput] pointerdown duration: ${this.parameters.global.duration}ms`
			);

			console.log(
				`[PointerInput] live vector length within vectorTimespan: ${this.parameters.live.vector.vectorLength}px`
			);
		}
		
	}

	/*
	 * Get the two events which are necessary for vector calculation. This is based on this.vectorTimespan.
   * vectorTimespan defines the timespan which actually defines the "live" vector
   */
	private getTimedPointerEvents(): PointerEvent[] {
		// if the duration is lower than the vectorTimespan, startPointerEvent would be null
		// if so, use this.initialPointerEvent as a fallback
		let startPointerEvent = this.initialPointerEvent;
		const endPointerEvent =
		  this.recognizedEvents[this.recognizedEvents.length - 1];
	
		let startIndex = this.recognizedEvents.length - 1;
	
		let elapsedTime = 0;
		const endTimeStamp = endPointerEvent.timeStamp;
	
		while (elapsedTime < this.vectorTimespan) {
		  startIndex = startIndex - 1;
	
		  if (startIndex < 0) {
			break;
		  }
	
		  startPointerEvent = this.recognizedEvents[startIndex];
	
		  elapsedTime = endTimeStamp - startPointerEvent.timeStamp;
		}
	
		const pointerEvents = [startPointerEvent, endPointerEvent];
	
		this.recognizedEvents = this.recognizedEvents.slice(-20);
	
		return pointerEvents;
	}

}