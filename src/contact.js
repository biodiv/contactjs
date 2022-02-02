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
	
		options = options || {};

		this.options = {
			"DEBUG" : false
		};
		
		for (let key in options){
			this.options[key] = options[key];
		}

		this.DEBUG = this.options.DEBUG;
		
		this.id = new Date().getTime();
	
		// a map of all active PointerInput instances
		this.pointerInputs = {};
		this.activePointerInputs = {};
		
		this.primaryPointerId = pointerdownEvent.pointerId;
		
		// initialPointerEvent holds the correct event.target for bubbling if pointerListener is bound to a "ancestor element"
		this.initialPointerEvent = pointerdownEvent;
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
				rotationAngle : null, //deg ccw[0,360], cw[0,-360] 
				vectorAngle : null // angle between the 2 vectors performed by the pointer. This differs from rotationAngle
			},
			globalParameters : {
				centerMovement : null,
				centerMovementVector : null,
				distanceChange : null,
				relativeDistanceChange: null,
				rotationAngle : null,
				vectorAngle : null
			}
		};
	
	}
	
	// add more pointers
	addPointer (pointerdownEvent) {
		
		this.currentPointerEvent = pointerdownEvent;

		var pointerInputOptions = {
			"DEBUG" : this.DEBUG
		};
	
		var pointerInput = new PointerInput(pointerdownEvent, pointerInputOptions);
		this.pointerInputs[pointerdownEvent.pointerId] = pointerInput;
		this.activePointerInputs[pointerdownEvent.pointerId] = pointerInput;
	}
	
	removePointer (pointerId) {
	
		delete this.activePointerInputs[pointerId];
	
	}
	
	// return a specific pointer input by its identifier
	getPointerInput (pointerId) {

		var hasPointerId = Object.prototype.hasOwnProperty.call(this.pointers, pointerId);
	
		if (hasPointerId){
				
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
	
	// currently, on 2 Inputs are supported
	getMultiPointerInputs () {
	
		var pointerId_1 = Object.keys(this.activePointerInputs)[0];
		var pointerInput_1 = this.activePointerInputs[pointerId_1];
		
		
		var pointerId_2 = Object.keys(this.activePointerInputs)[1];
		var pointerInput_2 = this.activePointerInputs[pointerId_2];
		
		var multiPointerInputs = [pointerInput_1, pointerInput_2];
		
		return multiPointerInputs;
	
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
	
		this.onPointerUp(pointercancelEvent);
		
		if (this.DEBUG == true){
			console.log("[Contact] pointercancel detected");
		}
		
	}
	
	// also covers pointerleave
	// not necessary - using element.setPointerCapture and element.releasePointerCapture instead
	onPointerLeave (pointerleaveEvent){
	
		this.onPointerUp(pointerleaveEvent);
	
		if (this.DEBUG == true){
			console.log("[Contact] pointerleave detected");
		}
	}
	
	
	// if the contact idles (no Momvement), the time still passes
	// therefore, the pointerInput has to be updated
	onIdle () {

		for (let pointerInputId in this.activePointerInputs){
		
			let activePointer = this.activePointerInputs[pointerInputId];
			activePointer.onIdle();
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
	
		var multiPointerInputs = this.getMultiPointerInputs()

		var pointerInput_1 = multiPointerInputs[0];
		var pointerInput_2 = multiPointerInputs[1];
		
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
			var liveRotationAngle = this.calculateRotationAngle(vector_1, vector_2);
			this.multipointer.liveParameters.rotationAngle = liveRotationAngle;
			
			// calculate the simple vectorAngle for determining if the fingers moved into the same direction
			var liveVectorAngle = this.calculateVectorAngle(vector_1, vector_2)
			this.multipointer.liveParameters.vectorAngle = liveVectorAngle;
			
			
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
			
			
			var globalRotationAngle = this.calculateRotationAngle(globalVector_1, globalVector_2);
			this.multipointer.globalParameters.rotationAngle = globalRotationAngle;
			
			var globalVectorAngle = this.calculateVectorAngle(globalVector_1, globalVector_2)
			this.multipointer.liveParameters.vectorAngle = globalVectorAngle;
			
		}
		
		if (this.DEBUG === true){
			console.log("[Contact] 2 fingers: centerMovement between pointer #" + pointerInput_1.pointerId + " and pointer #" + pointerInput_2.pointerId + " : " + this.multipointer.liveParameters.centerMovement + "px");
			console.log("[Contact] 2 fingers: distanceChange: between pointer #" + pointerInput_1.pointerId + " and pointer #" + pointerInput_2.pointerId + " : "  + this.multipointer.liveParameters.distanceChange + "px");
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
	calculateRotationAngle (vector_1, vector_2) {
	
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
		
		//var v_1_translated = new Vector(origin, translatedEndPoint_1);
		
		var translationVector_2 = new Vector(angleVector_2.startPoint, origin);
		var translatedEndPoint_2 = translatePoint(angleVector_2.endPoint, translationVector_2);
		
		//var v2_translated = new Vector(origin, translatedEndPoint_2);
		
		
		// rotate the first angle vector so its y-coordinate becomes 0
		/*
				
				x------->
				0
				
		*/
		var rotationAngle = calcAngleRad(translatedEndPoint_1) * (-1);
		
		// rottation matrix
		//var x_1_rotated =  ( translatedEndPoint_1.x * Math.cos(rotationAngle) ) - ( translatedEndPoint_1.y * Math.sin(rotationAngle) );
		//var y_1_rotated = Math.round(( translatedEndPoint_1.x * Math.sin(rotationAngle) ) + ( translatedEndPoint_1.y * Math.cos(rotationAngle) )); // should be 0
		
		//var v_1_rotated = new Vector(origin, new Point(x_1_rotated, y_1_rotated));
		
		
		// rotate the second vector (in time: after 1st)
		var x_2_rotated =  ( translatedEndPoint_2.x * Math.cos(rotationAngle) ) - ( translatedEndPoint_2.y * Math.sin(rotationAngle) );
		var y_2_rotated = Math.round(( translatedEndPoint_2.x * Math.sin(rotationAngle) ) + ( translatedEndPoint_2.y * Math.cos(rotationAngle) ));
		
		//var v_2_rotated = new Vector(origin, new Point(x_2_rotated, y_2_rotated));
		
		// calculate the angle between v_1 and v_2
		
		var angleDeg = Math.atan2(y_2_rotated, x_2_rotated) * 180 / Math.PI;
		
		return angleDeg;
	
	}
	
	calculateVectorAngle (vector_1, vector_2) {
	
		var angleDeg = null;
	
		if (vector_1.vectorLength > 0 && vector_2.vectorLength > 0){
		
			var cos = ( (vector_1.x * vector_2.x) + (vector_1.y * vector_2.y) ) / (vector_1.vectorLength * vector_2.vectorLength);

			var angleRad = Math.acos(cos);
			angleDeg = rad2deg(angleRad);
		
		}
		
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
	
		options = options || {};

		this.options = {
			"DEBUG" : false
		};

		for (let key in options){
			this.options[key] = options[key];
		}

		this.DEBUG = this.options.DEBUG;
		
		var now = new Date().getTime();

		this.pointerId = pointerdownEvent.pointerId;
		var hasVectorTimespan = Object.prototype.hasOwnProperty.call(this.options, "vectorTimespan");
		this.vectorTimespan = hasVectorTimespan == true ? this.options.vectorTimespan : 100; // milliseconds

		// events used for vector calculation
		this.initialPointerEvent = pointerdownEvent;
		this.currentPointerEvent = pointerdownEvent;
		this.recognizedEvents = [pointerdownEvent];
		
		
		this.canceled = false;
		this.isActive = true;
		
		// start with the NullVector to support idle
		var nullVector = this.getVector(pointerdownEvent, pointerdownEvent);
		
		// parameters within this.vectorTimespan
		this.liveParameters = {
			vector : nullVector, // provides the traveled distance as length
			speed : 0, // length of the vector
			isMoving : false
		};
		
		// parameters that span across the whole pointerdown duration
		this.globalParameters = {
			startX : this.initialPointerEvent.clientX,
			startY : this.initialPointerEvent.clientY,
			vector : nullVector,
			deltaX : 0,
			deltaY : 0,
			startTimestampUTC : now,
			startTimestamp : this.initialPointerEvent.timeStamp, // unfortunately, FF (linux) does not provide UTC, but elapsed time since the window Object was created
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
	
	// do not update vector, only update time
	onIdle () {
	
		var now = new Date().getTime();
		
		// currentTimestamp is not an UTC millisecond timestamp.
		// this.globalParameters.currentTimestamp = now;
		
		let duration = now - this.globalParameters.startTimestampUTC;
		this.globalParameters.duration = duration;

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
		
		var liveVector = this.getVector(timedPointerEvents[0], timedPointerEvents[1]);
		
		this.liveParameters.vector = liveVector;
		
		if (liveVector != null){
	
			this.liveParameters.speed = this.getSpeed(liveVector, timedPointerEvents[0].timeStamp, timedPointerEvents[1].timeStamp);
		
			// update global parameters
			if (this.liveParameters.speed > this.globalParameters.maximumSpeed){
				this.globalParameters.maximumSpeed = this.liveParameters.speed;
			}
			this.globalParameters.currentTimestamp = pointerEvent.timeStamp;
			this.globalParameters.duration = pointerEvent.timeStamp - this.globalParameters.startTimestamp;
			
			this.globalParameters.deltaX = liveVector.endPoint.x - this.globalParameters.startX;
			this.globalParameters.deltaY = liveVector.endPoint.y - this.globalParameters.startY;
			
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
		
		var startIndex = this.recognizedEvents.length - 1;
		
		var elapsedTime = 0;
		var endTimeStamp = endPointerEvent.timeStamp;
		
		while (elapsedTime < this.vectorTimespan) {
			
			startIndex = startIndex -1;
						
			if (startIndex < 0){
				
				break;
			}
			
			startPointerEvent = this.recognizedEvents[startIndex];
						
			elapsedTime = endTimeStamp - startPointerEvent.timeStamp;
		
		}
		
		var pointerEvents = [startPointerEvent, endPointerEvent];
		
		this.recognizedEvents = this.recognizedEvents.slice(-20);

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
		this.vectorLength = Math.sqrt( Math.pow(this.deltaX, 2) + Math.pow(this.deltaY, 2) );
		
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
			if (this.startPoint.y < this.endPoint.y){
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
