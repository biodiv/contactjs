"use strict";

const DIRECTION_NONE = "0";
const DIRECTION_LEFT = "left";
const DIRECTION_RIGHT = "right";
const DIRECTION_UP = "up";
const DIRECTION_DOWN = "down";
const DIRECTION_CLOCKWISE = 1;
const DIRECTION_COUNTER_CLOCKWISE = -1;

const DIRECTION_HORIZONTAL = [DIRECTION_LEFT, DIRECTION_RIGHT];
const DIRECTION_VERTICAL = [DIRECTION_UP, DIRECTION_DOWN];
const DIRECTION_ALL = [DIRECTION_LEFT, DIRECTION_RIGHT, DIRECTION_UP, DIRECTION_DOWN];

const GESTURE_STATE_POSSIBLE = "possible";
const GESTURE_STATE_BLOCKED = "blocked";

/*
* contact-js uses pointer events, which combine touch and mouse events (and more)
* for readability, "touch" is used in comments
*/

/*
* At the time the user touches the surface it is not known which gesture he will perform. He can also add or remove touches.
* The contact phenomenon starts when the user initially touches the surface, and ends when no more touches are present.
* During the contact phenonmenon between human being and artificial surface, different gestures can be detected.
* According to the gesture definitions, a gesture can be possible or impossible at a given time. When a gesture has been rendered impossible, it can not become possible during the current contact phenomenon.
*/


/*
* The Contact Prototype represents the contact phenomenon. It starts with the first pointerdown event and ends when the last pointer has become inactive (pointerup event).
* Therefore, the first pointerdownEvent is the point in time where Contact becomes alive. It dies with the last pointerup event
* Contact collects data of the interaction with the surface, but does not decide if a gesture has been detected.
*/
class Contact {

	constructor (pointerdownEvent, options) {
	
		this.DEBUG = false;
	
		// a map of all active PointerInput instances
		this.pointerInputs = {};
		this.activePointerInputs = {};
		
		this.primaryPointerId = pointerdownEvent.pointerId;
		
		this.currentPointerEvent = pointerdownEvent;
		
		this.addPointer(pointerdownEvent);
		
		this.isActive = true;
		
		// global timings
		this.startTimestamp = pointerdownEvent.timeStamp;
		this.currentTimestamp = this.startTimestamp;
		this.endTimestamp = null;
		
		// multipointer parameters
		this.multipointer = {
			liveParameters : {
				centerMovement : null,
				centerMovementVector : null,
				distanceChange : null, // px
				relativeDistanceChange : null, // %
				rotationAngle : null //deg ccw[0,360], cw[0,-360] 
			},
			globalParameters : {
				centerMovement : null,
				centerMovementVector : null,
				distanceChange : null,
				relativeDistanceChange: null,
				rotationAngle : null
			}
		};
	
	}
	
	// add more pointers
	addPointer (pointerdownEvent) {
		
		this.currentPointerEvent = pointerdownEvent;
	
		var pointerInput = new PointerInput(pointerdownEvent);
		this.pointerInputs[pointerdownEvent.pointerId] = pointerInput;
		this.activePointerInputs[pointerdownEvent.pointerId] = pointerInput;
	}
	
	removePointer (pointerId) {
	
		delete this.activePointerInputs[pointerId];
	
	}
	
	// return a specific pointer input by its identifier
	getPointerInput (pointerId) {
	
		if (this.pointers.hasOwnProperty(pointerId)){
				
			let pointerInput = this.pointers[pointerId];
			
			return pointerInput;
		}
		
		else {
			let msg = "invalid pointerId: " + pointerId + ". Pointer not found in Contact.pointers"
			throw new Error(msg);
		}
	}
	
	// return the pointer input which started this specific contact phenomenon
	getPrimaryPointerInput () {
		return this.pointerInputs[this.primaryPointerId];
	}
	
	
	// pointermove contains only one single pointer, not multiple like on touch events (touches, changedTouches,...)
	onPointerMove (pointermoveEvent) {
	
		this.currentPointerEvent = pointermoveEvent;
		this.currentTimestamp = pointermoveEvent.timeStamp;
	
		var movedPointer = this.pointerInputs[pointermoveEvent.pointerId];
		movedPointer.onMove(pointermoveEvent);
		
		if (this.DEBUG === true) {
			console.log(this.pointerInputs);
		}
			
		this.updateState();
	
	}
	
	// pointerup event: finger released, or mouse button released
	onPointerUp (pointerupEvent) {
	
		var pointerId = pointerupEvent.pointerId;
	
		this.currentPointerEvent = pointerupEvent;
	
		this.currentTimestamp = pointerupEvent.timeStamp;
	
		var removedPointer = this.pointerInputs[pointerId];
		removedPointer.onUp(pointerupEvent);
		
		this.removePointer(pointerId);
		
		this.updateState();
	
	}
	
	onPointerCancel (pointercancelEvent) {
	
		this.onPointerUp(pointerupEvent);
		
		if (this.DEBUG == true){
			console.log("[Contact] pointercancel detected");
		}
		
	}
	
	// also covers pointerleave
	onPointerOut (pointeroutEvent){
	
		this.onPointerUp(pointeroutEvent);
	
		if (this.DEBUG == true){
			console.log("[Contact] pointerout detected");
		}
	}
	
	// update this contact instance. invoked on pointermove, pointerup and pointercancel events
	updateState () {
	
		var isActive = false;
		
		if (Object.keys(this.activePointerInputs).length > 0){
			isActive = true;
		}
		
		this.isActive = isActive;
		
		if ( this.isActive == false ) {
			this.endTimestamp = this.currentTimestamp;
		}
		else if (Object.keys(this.activePointerInputs).length >= 2){
			this.updateMultipointerParameters();
		}

	}
	
	// functions for multi pointer gestures, currently only 2 pointers are supported
	updateMultipointerParameters () {
	
		var pointerId_1 = Object.keys(this.activePointerInputs)[0];
		var pointerInput_1 = this.activePointerInputs[pointerId_1];
		
		
		var pointerId_2 = Object.keys(this.activePointerInputs)[1];
		var pointerInput_2 = this.activePointerInputs[pointerId_2];
		
		var vector_1 = pointerInput_1.liveParameters.vector;
		var vector_2 = pointerInput_2.liveParameters.vector;
		
		if (vector_1 != null && vector_2 != null){
		
			var currentCenter = getCenter(vector_1.startPoint, vector_2.startPoint);
			this.multipointer.liveParameters.center = currentCenter;

			var centerMovementVector = this.calculateCenterMovement(vector_1, vector_2);
			this.multipointer.liveParameters.centerMovementVector = centerMovementVector;
			this.multipointer.liveParameters.centerMovement = centerMovementVector.vectorLength;
			
			var liveDistanceChange = this.calculateDistanceChange(vector_1, vector_2);
			this.multipointer.liveParameters.distanceChange = liveDistanceChange.absolute;
			this.multipointer.liveParameters.relativeDistanceChange = liveDistanceChange.relative;
			
			
			// calculate rotation angle. imagine the user turning a wheel with 2 fingers
			var liveAngle = this.calculateAngle(vector_1, vector_2);
			this.multipointer.liveParameters.rotationAngle = liveAngle;
			
		}		
		
		// global distance change and rotation
		var globalVector_1 = pointerInput_1.globalParameters.vector;
		var globalVector_2 = pointerInput_2.globalParameters.vector;
		
		if (globalVector_1 != null && globalVector_2 != null){
		
			var globalCenter = getCenter(globalVector_1.startPoint, globalVector_2.startPoint);
			this.multipointer.globalParameters.center = globalCenter;

			var globalCenterMovementVector = this.calculateCenterMovement(globalVector_1, globalVector_2);
			this.multipointer.globalParameters.centerMovementVector = globalCenterMovementVector;
			this.multipointer.globalParameters.centerMovement = globalCenterMovementVector.vectorLength;

			var globalDistanceChange = this.calculateDistanceChange(globalVector_1, globalVector_2);
			this.multipointer.globalParameters.distanceChange = globalDistanceChange.absolute;
			this.multipointer.globalParameters.relativeDistanceChange = globalDistanceChange.relative;
			
			
			var globalAngle = this.calculateAngle(globalVector_1, globalVector_2);
			this.multipointer.globalParameters.rotationAngle = globalAngle;
			
		}
		
		if (this.DEBUG === true){
			console.log("[Contact] 2 fingers: centerMovement between pointer #" + pointerId_1 + " and pointer #" + pointerId_2 + " : " + this.multipointer.liveParameters.centerMovement + "px");
			console.log("[Contact] 2 fingers: distanceChange: between pointer #" + pointerId_1 + " and pointer #" + pointerId_2 + " : "  + this.multipointer.liveParameters.distanceChange + "px");
			console.log("[Contact] 2 fingers live angle: " + this.multipointer.liveParameters.rotationAngle + "deg");
			console.log("[Contact] 2 fingers global angle: " + this.multipointer.globalParameters.rotationAngle + "deg");
		}
		
	}
	
	calculateCenterMovement (vector_1, vector_2){
	
		// start point is the center between the starting points of the 2 vectors
		var startPoint = getCenter(vector_1.startPoint, vector_2.startPoint);
				
		// center between the end points of the vectors
		var endPoint = getCenter(vector_1.endPoint, vector_2.endPoint);

		var vectorBetweenCenterPoints = new Vector(startPoint, endPoint);
		
		return vectorBetweenCenterPoints;
	
	}
	
	calculateDistanceChange (vector_1, vector_2) {
	
		var vectorBetweenStartPoints = new Vector(vector_1.startPoint, vector_2.startPoint);
		var vectorBetweenEndPoints = new Vector(vector_1.endPoint, vector_2.endPoint);
		
		var absoluteDistanceChange = vectorBetweenEndPoints.vectorLength - vectorBetweenStartPoints.vectorLength;
		var relativeDistanceChange = vectorBetweenEndPoints.vectorLength / vectorBetweenStartPoints.vectorLength;
		
		var distanceChange = {
			absolute : absoluteDistanceChange,
			relative : relativeDistanceChange
		};
		
		return distanceChange;
	}
	
	/*
	* CALCULATE ROTATION
	* this is not a trivial problem
	* required output is: angle and direction (cw //ccw)
	* direction is relative to the first touch with two fingers, not absolute to the screens default coordinate system
	* to determine rotation direction, 3 points on the circle - with timestamps - are required
	* imagine a steering wheel
	* - initial state is 0 deg (0)
	* - if the wheel has been turned ccw, its state has a negative angle
	* - if the wheel has been turned cw, its state has a positive angle
	* - possible values for the angle: [-360,360]
	*/
	calculateAngle (vector_1, vector_2) {
	
		// vector_ are vectors between 2 points in time, same finger
		// angleAector_ are vectors between 2 fingers
		var angleVector_1 = new Vector(vector_1.startPoint, vector_2.startPoint); // in time: occured first
		var angleVector_2 = new Vector(vector_1.endPoint, vector_2.endPoint); // in time: occured second
	
		var origin = new Point(0,0);
		
		// translate the points of the vector, so that their startPoints are attached to (0,0)
		/*
		
						^
					   /
					  /
					 /	
					x	
					0			

		*/
		var translationVector_1 = new Vector(angleVector_1.startPoint, origin);
		var translatedEndPoint_1 = translatePoint(angleVector_1.endPoint, translationVector_1);
		
		var v_1_translated = new Vector(origin, translatedEndPoint_1);
		
		var translationVector_2 = new Vector(angleVector_2.startPoint, origin);
		var translatedEndPoint_2 = translatePoint(angleVector_2.endPoint, translationVector_2);
		
		var v2_translated = new Vector(origin, translatedEndPoint_2);
		
		
		// rotate the first angle vector so its y-coordinate becomes 0
		/*
				
				x------->
				0
				
		*/
		var rotationAngle = calcAngleRad(translatedEndPoint_1) * (-1);
		
		// rottation matrix
		var x_1_rotated =  ( translatedEndPoint_1.x * Math.cos(rotationAngle) ) - ( translatedEndPoint_1.y * Math.sin(rotationAngle) );
		var y_1_rotated = Math.round(( translatedEndPoint_1.x * Math.sin(rotationAngle) ) + ( translatedEndPoint_1.y * Math.cos(rotationAngle) )); // should be 0
		
		var v_1_rotated = new Vector(origin, new Point(x_1_rotated, y_1_rotated));
		
		
		// rotate the second vector (in time: after 1st)
		var x_2_rotated =  ( translatedEndPoint_2.x * Math.cos(rotationAngle) ) - ( translatedEndPoint_2.y * Math.sin(rotationAngle) );
		var y_2_rotated = Math.round(( translatedEndPoint_2.x * Math.sin(rotationAngle) ) + ( translatedEndPoint_2.y * Math.cos(rotationAngle) ));
		
		var v_2_rotated = new Vector(origin, new Point(x_2_rotated, y_2_rotated));
		
		// calculate the angle between v_1 and v_2
		
		var angleDeg = Math.atan2(y_2_rotated, x_2_rotated) * 180 / Math.PI;
		
		return angleDeg;
	
	}

}


/*********************************************************************************************
	PointerInput

	- contains data about one single finger / active pointer
	- there are "live" parameters and "global" parameters
	- "live" parameters are caluclated using liveTimespan
	- "global" parameters are calculated using the whole timespan of this pointerdown
	- the current vector. The vector should be calculated "live" and not over the whole pointerdown duration. The user expects the pointer input to be in sync with his current finger movement on the screen, not with something a second ago. 
	- start and end coordinates
	- start and end timestamps
	- speeds and distances
**********************************************************************************************/

class PointerInput {

	constructor (pointerdownEvent, options) {
	
		this.DEBUG = false;
		
		var options = options || {};
		

		this.pointerId = pointerdownEvent.pointerId;
		this.vectorTimespan = options.hasOwnProperty("vectorTimespan") ? options.vectorTimespan : 100; // milliseconds

		// events used for vector calculation
		this.initialPointerEvent = pointerdownEvent;
		this.currentPointerEvent = pointerdownEvent;
		this.recognizedEvents = [pointerdownEvent];
		
		
		this.canceled = false;
		this.isActive = true;
		
		// parameters within this.vectorTimespan
		this.liveParameters = {
			vector : null, // provides the traveled distance as length
			speed : 0, // length of the vector
			isMoving : false
		};
		
		// parameters that span across the whole pointerdown duration
		this.globalParameters = {
			startX : this.initialPointerEvent.clientX,
			startY : this.initialPointerEvent.clientY,
			vector : null,
			deltaX : 0,
			deltaY : 0,
			startTimestamp : this.initialPointerEvent.timeStamp,
			currentTimestamp : this.initialPointerEvent.timeStamp,
			endTimestamp : null,
			maximumSpeed : 0,
			averageSpeed : 0,
			finalSpeed : null,
			traveledDistance : 0,
			hasBeenMoved : false,
			duration: 0
		};
	
	}
	
	onMove (pointermoveEvent) {
	
		this.globalParameters.hasBeenMoved = true;
		this.liveParameters.isMoving = true;
	
		this.update(pointermoveEvent, true);
		
	}
	
	onUp (pointerupEvent) {
	
		this.globalParameters.finalSpeed = this.liveParameters.speed;
		
		this.liveParameters.currentSpeed = 0;
		
		this.liveParameters.isMoving = false;
		this.isActive = false;
		
		this.globalParameters.endTimestamp = pointerupEvent.timeStamp;
		
		this.update(pointerupEvent);
		
		if (this.DEBUG === true){
			console.log("[Contact] pointerdown ended. pointerdown duration: " + this.globalParameters.duration + "ms");
		}
	
	}
	
	onCancel (pointercancelEvent) {
	
		this.update(pointercancelEvent);
		
		this.liveParameters.speed = 0;
		
		this.canceled = true;
		
		this.liveParameters.isMoving = false;
		this.isActive = false;
		
		this.globalParameters.endTimestamp = pointercancelEvent.timeStamp;
		
		if (this.DEBUG === true){
			console.log("[Contact] canceled, pointerdown duration:" + this.duration);
		}
	
	}
	
	update (pointerEvent) {
	
		// update general parameters
		this.currentPointerEvent = pointerEvent;
		this.recognizedEvents.push(pointerEvent);
		
		// update liveParameters
		
		var timedPointerEvents = this.getTimedPointerEvents();
		
		var vector = this.getVector(timedPointerEvents[0], timedPointerEvents[1]);
		
		this.liveParameters.vector = vector;
		
		if (vector != null){
	
			this.liveParameters.speed = this.getSpeed(vector, timedPointerEvents[0].timeStamp, timedPointerEvents[1].timeStamp);
		
			// update global parameters
			if (this.liveParameters.speed > this.globalParameters.maximumSpeed){
				this.globalParameters.maximumSpeed = this.liveParameters.speed;
			}
			this.globalParameters.currentTimestamp = pointerEvent.timeStamp;
			this.globalParameters.duration = pointerEvent.timeStamp - this.globalParameters.startTimestamp;
			
			this.globalParameters.deltaX = vector.endPoint.x - this.globalParameters.startX;
			this.globalParameters.deltaY = vector.endPoint.y - this.globalParameters.startY;
			
			var globalVector = this.getVector(this.initialPointerEvent, this.currentPointerEvent);
			this.globalParameters.vector = globalVector;
			
			if (this.DEBUG === true){
				console.log("[Contact] current speed: " + this.liveParameters.speed + "px/s");
				console.log("[Contact] pointerdown duration: " + this.globalParameters.duration + "ms");
				
				console.log("[Contact] live vector length within vectorTimespan: " + this.liveParameters.vector.vectorLength + "px");
			}
			
		}
		
	}
	
	/*
	* Get the two events which are necessary for vector calculation. This is based on this.vectorTimespan.
	* vectorTimespan defines the timespan which actually defines the "live" vector
	*/
	getTimedPointerEvents () {
	
		// if the duration is lower than the vectorTimespan, startPointerEvent would be null
		// if so, use this.initialPointerEvent as a fallback
		var startPointerEvent = this.initialPointerEvent;
		var endPointerEvent = this.recognizedEvents[ this.recognizedEvents.length -1 ];
		
		// also optimize this.recognizedEvents. Remove Events older than this.vectorTimespan
		var optimizedRecognizedEvents = [];
		
		var startIndex = this.recognizedEvents.length - 1;
		
		var elapsedTime = 0;
		var endTimeStamp = endPointerEvent.timeStamp;
		
		while (elapsedTime < this.vectorTimespan) {
			
			startIndex = startIndex -1;
						
			if (startIndex < 0){
				break;
			}
			
			startPointerEvent = this.recognizedEvents[startIndex];
			
			optimizedRecognizedEvents.unshift(startPointerEvent);
						
			elapsedTime = endTimeStamp - startPointerEvent.timeStamp;
		
		}
		
		var pointerEvents = [startPointerEvent, endPointerEvent];
		
		this.recognizedEvents = optimizedRecognizedEvents;

		return pointerEvents;
	}
	
	// create and return a vector based on 2 PointerEvents
	getVector (startPointerEvent, endPointerEvent) {
	
		var vector = null;
	
		if (startPointerEvent != null && endPointerEvent != null){
		
			let startPoint = new Point(startPointerEvent.clientX, startPointerEvent.clientY);
			
			let endPoint = new Point(endPointerEvent.clientX, endPointerEvent.clientY);
			
			vector = new Vector(startPoint, endPoint);
				
		}
		
		return vector;
		
	}
	
	// update speed. speed = distance / time
	getSpeed (vector, startTimestamp, endTimestamp) {
	
		if (this.DEBUG === true){
			console.log("[PointerInput vector] " + vector);
			console.log("[PointerInput startTimestamp] " + startTimestamp);
			console.log("[PointerInput endTimestamp] " + endTimestamp);
		}
	
		var speed = 0;
		
		var timespan_ms = endTimestamp - startTimestamp;
		var timespan_s = timespan_ms / 1000;
		
		if (vector != null && timespan_s != 0){

			// px/s
			speed = vector.vectorLength / timespan_s;

		}
		
		return speed;
	}
	
}



class Point {

	constructor (x, y){
	
		this.x = x;
		this.y = y;
		
	}
	
}


class Vector {

	// vector between 2 points: START(x,y) and END(x,y)
	constructor (startPoint, endPoint) {
	
		this.startPoint = startPoint;
		this.endPoint = endPoint;
			
		this.direction = DIRECTION_NONE;
			
		this.deltaX = this.endPoint.x - this.startPoint.x;
		this.deltaY = this.endPoint.y - this.startPoint.y;
		
		this.x = this.deltaX;
		this.y = this.deltaY;

		// determine length
		this.vectorLength = Math.sqrt( Math.pow(this.deltaX,2) + Math.pow(this.deltaY, 2) );
		
		// determine direction
		if (Math.abs(this.deltaX) > Math.abs(this.deltaY)){
			// left or right
			if (this.startPoint.x < this.endPoint.x){
				this.direction = DIRECTION_RIGHT;
			}
			else {
				this.direction = DIRECTION_LEFT;
			}
		}
		else {
			// up or down
			if (this.startPoint.y > this.endPoint.y){
				this.direction = DIRECTION_UP;
			}
			else {
				this.direction = DIRECTION_DOWN;
			}
		}
		
	}
	
}


// helper functions
function deg2rad (angleDeg){

	var rad = (Math.PI/180) * angleDeg;
	
	return rad;

}

function rad2deg (angleRad){

	var deg = angleRad / (Math.PI/180);
	
	return deg
	
}

function getCenter (pointA, pointB){

	var centerX = (pointA.x + pointB.x) / 2;
	var centerY = (pointA.y + pointB.y) / 2;

	var center = new Point(centerX, centerY);
	
	return center
}


function translatePoint (point, vector){

	var newX = point.x + vector.x;
	var newY = point.y + vector.y;
	
	var translatedPoint = new Point(newX, newY);
	
	return translatedPoint;
}


// return the counter-clockwise angle between the positive x-axis and a point.
// from 0 degrees to 360 degrees
// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan2
function calcAngleDegrees(point) {
	// angle in degrees between -180 and 180
	var angle = Math.atan2(point.y, point.x) * 180 / Math.PI;
  
	if (angle < 0){
		angle = 360 + angle;
	}
	
	return angle
}

function calcAngleRad (point) {

	var angle = Math.atan2(point.y, point.x); // [-PI, PI]
	
	if (angle < 0){
		angle = 2 * Math.PI + angle;
	}
	
	return angle

}

// single finger gestures
class Gesture {

	constructor (domElement, options){
	
		this.DEBUG = false;
		
		this.domElement = domElement;
		
		this.isActive = false;
		
		this.state = GESTURE_STATE_POSSIBLE;
		
		// the PointerEvent when the gesture has been recognized, used for some global calculations
		// it is not always reasonable to use contact.pointerdownEvent, because the user could first rotate and object, and after some time perform a pinch
		// the starting point of the pinch then is not contact.pointerdownEvent
		this.initialPointerEvent = null;
		
		this.boolParameters = {
			requiresPointerMove : null,
			requiresActivePointer : null
		}
		
		// intervals before a gesture is detected for the first time
		this.initialMinMaxParameters = {
			pointerCount : [null, null], // minimum number of fingers currently on the surface
			duration : [null, null], // ms
			currentSpeed : [null, null], // px/s
			averageSpeed : [null, null], // px/s
			finalSpeed : [null, null], // px/s
			distance : [null, null] // px
		};
		
		// intervals to use if the gesture is active
		this.activeStateMinMaxParameters = {
			pointerCount : [null, null], // minimum number of fingers currently on the surface
			duration : [null, null], // ms
			currentSpeed : [null, null], // px/s
			averageSpeed : [null, null], // px/s
			finalSpeed : [null, null], // px/s
			distance : [null, null] // px
		}
		
		
		
		this.possibleEvents = []; // a list of currently possible events: ["panleft", "pan"]
		
		this.options = options || {};
	
	}
	
	validateMinMax (minMaxParameters, parameterName, value){
	
		var minValue = minMaxParameters[parameterName][0];;
		var maxValue = minMaxParameters[parameterName][1];

		
		if (this.DEBUG == true){
			console.log("[Gestures] checking " + parameterName + "[isActive: " + this.isActive.toString() + "]" +  " minValue: " + minValue + ", maxValue: " + maxValue + ", current value: " + value);
		}
	
		if (minValue != null && value != null && value < minValue){
		
			if (this.DEBUG == true){
				console.log("dismissing min" + this.constructor.name + ": required " + parameterName + ": " + minValue + ", current value: " + value);
			}
		
			return false;
		}
		
		if (maxValue != null && value != null && value > maxValue){
		
			if (this.DEBUG == true){
				console.log("dismissing max" + this.constructor.name + ": required " + parameterName + ": " + maxValue + ", current value: " + value);
			}
		
			return false;
		}
		
		return true;
	
	}
	
	validateBool (parameterName, value) {
	
		var requiredValue = this.boolParameters[parameterName];
		
		if (requiredValue != null && value != null && requiredValue === value){
			return true;
		}
		else if (requiredValue == null){
			return true;
		}
		
		if (this.DEBUG == true){
			console.log("[Gestures] dismissing " + this.constructor.name + ": " + parameterName + " required: " + requiredValue + ", actual value: " + value);
		}
		
		return false;
		
	}
	
	getMinMaxParameters (contact) {
	
		var primaryPointerInput = contact.getPrimaryPointerInput();
	
		var minMaxParameters = {
			pointerCount : Object.keys(contact.activePointerInputs).length, 
			duration : primaryPointerInput.globalParameters.duration,
			currentSpeed : primaryPointerInput.liveParameters.speed,
			averageSpeed : primaryPointerInput.globalParameters.averageSpeed,
			finalSpeed : primaryPointerInput.globalParameters.finalSpeed,
			distance : primaryPointerInput.liveParameters.vector.vectorLength
		};
		
		return minMaxParameters;
	
	}
	
	
	getBoolParameters (contact) {
	
		var primaryPointerInput = contact.getPrimaryPointerInput();
	
		var boolParameters = {
			requiresPointerUp : primaryPointerInput.isActive === false,
			requiresActivePointer : primaryPointerInput.isActive === true,
			requiresPointerMove : primaryPointerInput.globalParameters.hasBeenMoved === true
		};
		
		return boolParameters;
	
	}
	
	validate (contact){
	
		var isValid = false;
		
		var primaryPointerInput = contact.getPrimaryPointerInput();
	
		this.possibleEvents = [];
	
		if (this.DEBUG == true){
			console.log("[Gestures] running recognition for " + this.constructor.name);
		}
		
		
		var contactBoolParameters = this.getBoolParameters(contact);
		
		for (let boolParameterName in this.boolParameters){
			let boolValue = contactBoolParameters[boolParameterName];
			isValid = this.validateBool(boolParameterName, boolValue);
			if (isValid == false){
				return false;
				break;
			}
		}
		
		var contactMinMaxParameters = this.getMinMaxParameters(contact);
		var minMaxParameters;
		
		// check duration
		if (this.isActive == true){
			minMaxParameters = this.activeStateMinMaxParameters;
		}
		else {
			minMaxParameters = this.initialMinMaxParameters;
		}
		for (let minMaxParameterName in minMaxParameters){

			let value = contactMinMaxParameters[minMaxParameterName];
			isValid = this.validateMinMax(minMaxParameters, minMaxParameterName, value);
			if (isValid == false){
				return false;
				break;
			}
		}
		
		// check direction
		if (this.options.hasOwnProperty("supportedDirections") && this.options.supportedDirections.length > 0){
			if (this.options.supportedDirections.indexOf(primaryPointerInput.liveParameters.vector.direction) == -1){
			
				if (this.DEBUG == true){
					console.log("[Gestures] dismissing " + this.constructor.name + ": supported directions: " + this.options.supportedDirections + ", current direction: " + primaryPointerInput.liveParameters.vector.direction);
				}
				
				return false;
			
			}
		}
		
		let eventName = this.constructor.name.toLowerCase();
		this.possibleEvents.push(eventName);
		
		// add direction specific events to possible events
		if (this.options.hasOwnProperty("supportedDirections") && this.options.supportedDirections.length > 0){
			if (this.options.supportedDirections.indexOf(primaryPointerInput.liveParameters.vector.direction) >= 0){
				let subeventName = eventName + primaryPointerInput.liveParameters.vector.direction;
				this.possibleEvents.push(subeventName);
			}
		}
		
		return true;
	
	}
	
	recognize (contact) {
	
		var isValid = this.validate(contact);
		
		if (isValid == true && this.isActive == false){
			this.onStart(contact);
		}
		
		if (isValid == true && this.state == GESTURE_STATE_POSSIBLE){
			this.emit(contact);
		}
		else if (this.isActive == true && isValid == false){
		
			this.onEnd(contact);
		}
		
	}
	
	getEventData (contact) {
	
		// provide short-cuts to the values collected in the Contact object
		// match this to the event used by hammer.js
		var eventData = {

			contact : contact,
			recognizer : this
			
		};
		
		return eventData;
		
	}
	
	// fire events
	emit (contact) {
	
		// fire general event like "pan" , "pinch", "rotate"
		var eventName = this.constructor.name.toLowerCase();
		
		if (this.DEBUG === true){
			console.log("[Gestures] detected and firing event " + eventName);
		}
		
		var eventData = this.getEventData(contact);
		
		var event = new CustomEvent(eventName, { detail: eventData });
		
		this.domElement.dispatchEvent(event);
		
	}
	
	onStart (contact) {
	
		this.isActive = true;
		
		this.initialPointerEvent = contact.currentPointerEvent;
		
		var eventName = "" + this.constructor.name.toLowerCase() + "start";
		
		if (this.DEBUG === true) {
			console.log("[Gestures] firing event: " + eventName);
		}
		
		// fire gestureend event
		var eventData = this.getEventData(contact);
		
		var event = new CustomEvent(eventName, { detail: eventData });
		
		this.domElement.dispatchEvent(event);
	
	}

	
	onEnd (contact) {
	
		this.isActive = false;
	
		var eventName = "" + this.constructor.name.toLowerCase() + "end";
		
		if (this.DEBUG === true) {
			console.log("[Gestures] firing event: " + eventName);
		}
		
		// fire gestureend event
		let eventData = this.getEventData(contact);
		
		var event = new CustomEvent(eventName, { detail: eventData });
		
		this.domElement.dispatchEvent(event);
	
	}

}


class SinglePointerGesture extends Gesture {

	constructor (domElement, options) {
	
		var options = options || {};
	
		super(domElement, options);
	
	}	
	
	getEventData (contact) {
	
		// provide short-cuts to the values collected in the Contact object
		// match this to the event used by hammer.js
		var eventData = super.getEventData(contact);
		
		// this should be optimized in the future, not using primaryPointerInput, but something like currentPointerInput
		var primaryPointerInput = contact.getPrimaryPointerInput();
		
		// gesture specific - dependant on the beginning of the gesture (when the gesture has initially been recognized)
		var globalStartPoint = new Point(this.initialPointerEvent.clientX, this.initialPointerEvent.clientY);
		var globalEndPoint = new Point(contact.currentPointerEvent.clientX, contact.currentPointerEvent.clientY);
		var globalVector = new Vector(globalStartPoint, globalEndPoint);
		var globalDuration = contact.currentPointerEvent.timeStamp - this.initialPointerEvent.timeStamp;
		
		// global: global for this recognizer, not the Contact object
		eventData["global"] = {
			deltaX : globalVector.x,
			deltaY : globalVector.y,
			distance: globalVector.vectorLength,
			speedX : globalVector.x / globalDuration,
			speedY : globalVector.y / globalDuration,
			speed : globalVector.vectorLength / globalDuration,
			direction : globalVector.direction,
			scale : 1,
			rotation : 0,
			srcEvent : contact.currentPointerEvent
		};
		
		eventData["live"] = {
			deltaX : primaryPointerInput.liveParameters.vector.x,
			deltaY : primaryPointerInput.liveParameters.vector.y,
			distance : primaryPointerInput.liveParameters.vector.vectorLength,
			speedX : primaryPointerInput.liveParameters.vector.x / contact.vectorTimespan,
			speedY : primaryPointerInput.liveParameters.vector.y / contact.vectorTimespan,
			speed : primaryPointerInput.liveParameters.speed,
			direction : primaryPointerInput.liveParameters.vector.direction,
			scale : 1,
			rotation : 0,
			center : {
				x : primaryPointerInput.liveParameters.vector.endPoint.x,
				y : primaryPointerInput.liveParameters.vector.endPoint.y
			},
			srcEvent : contact.currentPointerEvent/*,
			target : primaryPointerInput.touch.target,
			pointerType : ,
			eventType : ,
			isFirst : ,
			isFinal :,
			pointers : ,*/
		};
		
		return eventData;
		
	}

}

/*
* PAN DEFINITION:
*	- user touches surface with only one finger, or presses the mouse down
*	- user moves this one finger into different directions while staying on the surface, this movement is required
*	- the start of a pan is defined by a minimum pointerdown/touch duration and a minimum distance
*	- pan ends when the user removes the finger from the surface
*	- to detect a "swipe", the final speed is used
*	- a SWIPE is a pan that ended with a high speed (velocity without direction)
*	- Pan supports directions. options["supportedDirections"] = []
*/
class Pan extends SinglePointerGesture {
	
	constructor (domElement, options){
	
		var options = options || {};
	
		super(domElement, options);
		
		this.initialMinMaxParameters["pointerCount"] = [1,1]; // 1: no pan recognized at the pointerup event. 0: pan recognized at pointerup
		this.initialMinMaxParameters["duration"] = [0, null];
		this.initialMinMaxParameters["distance"] = [10, null]; 
		
		this.activeStateMinMaxParameters["pointerCount"] = [1,1];
		
		this.boolParameters["requiresPointerMove"] = true;
		this.boolParameters["requiresActivePointer"] = true;
		
		this.swipeFinalSpeed = 600;
		
		this.isSwipe = false;
		
		if (!options.hasOwnProperty("supportedDirections")){
			this.options.supportedDirections = DIRECTION_ALL;
		}
	}
	
	validate (contact) {
		
		// on second recognition allow all directions. otherwise, the "pan" mode would end if the finger was moved right and then down during "panleft" mode
		if (this.isActive == true){
			this.options.supportedDirections = DIRECTION_ALL;
		}
		
		var isValid = super.validate(contact);
		
		return isValid;
	}
	
	onStart (contact) {
	
		this.isSwipe = false;

		super.onStart(contact);

	}
	
	// check if it was a swipe
	onEnd (contact) {
	
		var primaryPointerInput = contact.getPrimaryPointerInput();

		if (this.swipeFinalSpeed < primaryPointerInput.globalParameters.finalSpeed){
			console.log("swipe")
			this.isSwipe = true;
		}
		
		super.onEnd(contact);
		
	}
}

/*
* TAP DEFINITION
* - user touches the screen with one finger or presses the mouse button down
* - the finger does not move for x ms
* - the finger is released, Tap is no recognized
*/
class Tap extends SinglePointerGesture {

	constructor (domElement, options) {
	
		var options = options || {};
	
		super(domElement, options);
		
		this.initialMinMaxParameters["pointerCount"] = [0,0]; // count of fingers touching the surface. a tap is fired AFTER the user removed his finger
		this.initialMinMaxParameters["duration"] = [0, 200]; // milliseconds. after a certain touch duration, it is not a TAP anymore
		
		this.initialMinMaxParameters["distance"] = [null, 30]; // if a certain distance is detected, TAP becomes impossible
		
		this.boolParameters["requiresPointerMove"] = false;
		this.boolParameters["requiresActivePointer"] = false;

	}
	
	onStart (contact) {
		// no onStart event for tap
		this.initialPointerEvent = contact.currentPointerEvent;
	}

}

class MultiPointerGesture extends Gesture {

	
	constructor (domElement, options) {
	
		var options = options || {};
	
		super(domElement, options);
		
		this.boolParameters = {
			requiresPointerMove : null,
			requiresActivePointer : null
		}
	
		this.initialMinMaxParameters = {
			pointerCount : [2, null]
		};
		
		this.activeStateMinMaxParameters = {
			pointerCount : [2, null]
		};
		
		this.possibleEvents = []; // a list of currently possible events: ["panleft", "pan"]
		
		this.options = options || {};
	
	}
	
}

class TwoPointerGesture extends MultiPointerGesture {

	constructor (domElement, options) {
	
		var options = options || {};
	
		super(domElement, options);
		
		this.boolParameters.requiresPointerMove = true;
		this.boolParameters.requiresActivePointer = true;
	
		this.initialMinMaxParameters["pointerCount"] = [2, 2]; // minimum number of fingers currently on the surface
		this.initialMinMaxParameters["centerMovement"] = [null,null]; //px
		this.initialMinMaxParameters["distanceChange"] = [null, null]; //px - distance between 2 fingers
		this.initialMinMaxParameters["rotationAngle"] = [null, null]; // degrees: positive = clockwise, negative = counter-clockwise (js convention, not mathematical convention)
		
		this.activeStateMinMaxParameters["pointerCount"] = [2, 2]; 
		this.activeStateMinMaxParameters["centerMovement"] = [null,null];
		this.activeStateMinMaxParameters["distanceChange"] = [null, null];
		this.activeStateMinMaxParameters["rotationAngle"] = [null, null];
	
	}
	
	getMinMaxParameters (contact) {
	
		var minMaxParameters = super.getMinMaxParameters(contact);
		
		minMaxParameters.centerMovement = contact.multipointer.liveParameters.centerMovement;
		// negative distance change: distance was decreased, positive: distance was increased.
		minMaxParameters.distanceChange = Math.abs(contact.multipointer.liveParameters.distanceChange);
		
		minMaxParameters.rotationAngle = Math.abs(contact.multipointer.globalParameters.rotationAngle);
		
		return minMaxParameters;
		
	}	

}

/*
* PINCH DEFINITION
* - 2 fingers touch the surface
* - those fongers are moved towards each other, or away from each other
* - 2 fingers define a circle: center=middle between two touches, diameter = distance
* - the center between the 2 fingers stays at the same coordinates
* - the distance between the 2 start points and the two end points is reduces (diameter shrinks)
*/
class Pinch extends TwoPointerGesture {

	constructor (domElement, options) {
	
		var options = options || {};
	
		super(domElement, options);
		
		this.initialMinMaxParameters["centerMovement"] = [0, 500]; //px
		this.initialMinMaxParameters["distanceChange"] = [5, null]; // distance between 2 fingers
		this.initialMinMaxParameters["rotationAngle"] = [null, 20]; // distance between 2 fingers
		
	}

}


/*
* ROTATE DEFINITION
* - 2 fingers touch the surface
* - 1 or 2 fingers are moved in a circular motion. the center is between the 2 fingers
*/

class Rotate extends TwoPointerGesture {

	constructor (domElement, options) {
	
		var options = options || {};
	
		super(domElement, options);
		
		this.initialMinMaxParameters["centerMovement"] = [0, 500];
		this.initialMinMaxParameters["distanceChange"] = [null, 500];
		this.initialMinMaxParameters["rotationAngle"] = [5, null];

	}

}


class TwoFingerPan extends TwoPointerGesture {

	constructor (domElement, options) {
	
		var options = options || {};
	
		super(domElement, options);
		
		this.initialMinMaxParameters["centerMovement"] = [10, null];
		this.initialMinMaxParameters["distanceChange"] = [null, 5];
		this.initialMinMaxParameters["rotationAngle"] = [null, null];

	}

}

/*
* PointerListener class
*	- implements the possibility to listen to gesture events performed on a specific DOM Element
*	  expample: element.addEventListener("pan", function(event){});
*	- creates and destroys Contact instances
*	- updates the Contact instances
*	- uses the Contact instances to determine which gesture(s) are performed by passing Contact instances to GestureRegonizers
*
*	- var listener = new PointerListener(domElement, {});
*	- domElement.addEventListener("pan", function(){});
*/

var ALL_GESTURE_CLASSES = [Tap, Pan, Pinch, Rotate, TwoFingerPan];

class PointerListener {

	constructor (domElement, options){
	
		this.DEBUG = false;
	
		var self = this;
		var supportedGestures = ALL_GESTURE_CLASSES;
		
		this.options = {
			supportedGestures : []
		};
		
		if (options.hasOwnProperty("supportedGestures")){
			supportedGestures = options.supportedGestures;
		}
		
			
		for (let i=0; i<supportedGestures.length; i++){
			let GestureClass = supportedGestures[i];
			let gesture = new GestureClass(domElement);
			this.options.supportedGestures.push(gesture);
		}
		
		
		this.domElement = domElement;
		
		// the Contact instance - only active during an active pointerdown
		this.contact = null;
		
		// disable context menu on long taps - this kills pointermove
		/*domElement.addEventListener("contextmenu", function(event) {
			event.preventDefault();
			return false;
		});*/
		
		// javascript fires the events "pointerdown", "pointermove", "pointerup" and "pointercancel"
		// on each of these events, the contact instance is updated and GestureRecognizers of this.supported_events are run		
		domElement.addEventListener("pointerdown", function(event){
			
			if (self.contact == null || self.contact.isActive == false) {
				self.contact = new Contact(event);
			}
			else {
				// use existing contact instance if a second pointer becomes present
				self.contact.addPointer(event);
			}
					
			if (self.options.hasOwnProperty("pointerdown")){
				self.options.pointerdown(event, self);
			}
			
		}, { "passive": true });
		
		domElement.addEventListener("pointermove", function(event){
		
			// pointermove is also firing if the mouse button is not pressed
		
			if (self.contact != null && self.contact.isActive == true){
		
				// this would disable vertical scrolling - which should only be disabled if a panup/down or swipeup/down listener has been triggered
				// event.preventDefault();
			
				self.contact.onPointerMove(event);
				self.recognizeGestures();
				
				if (self.options.hasOwnProperty("pointermove")){
					self.options.pointermove(event, self);
				}
			}
			
		}, { "passive": true });
		
		domElement.addEventListener("pointerup", function(event){
		
			if (self.contact != null && self.contact.isActive == true){
		
				// use css: touch-action: none instead of js to disable scrolling
				//self.domElement.classList.remove("disable-scrolling");
			
				self.contact.onPointerUp(event);
				self.recognizeGestures();
				
				if (self.options.hasOwnProperty("pointerup")){
					self.options.pointerup(event, self);
				}
			}
		});
		
		/*
		* stylus and mouse : respect pointerout and pointerleave
		*/
		domElement.addEventListener("pointerout", function(event){
			
			if (self.contact != null && self.contact.isActive == true){
				self.contact.onPointerOut(event);
				self.recognizeGestures();
			}		
		});
		
		
		domElement.addEventListener("pointercancel", function(event){
		
			//self.domElement.classList.remove("disable-scrolling");
		
			self.contact.onPointerCancel(event);
			self.recognizeGestures();
			
			if (self.options.hasOwnProperty("pointercancel")){
				self.options.pointercancel(event, self);
			}
			
			
		}, { "passive": true });
		
	
	}
	
	// run all configured recognizers
	recognizeGestures (){
	
		for (let g=0; g<this.options.supportedGestures.length; g++){
		
			let gesture = this.options.supportedGestures[g];
			
			gesture.recognize(this.contact);
			
		}
		
	}
	
}
