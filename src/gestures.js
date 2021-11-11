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
		
		// requiresPointerMove = false -> it does not matter if the pointer has been moved
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
		
		// fire direction specific events
		var currentDirection = eventData.live.direction;

		if (this.options.hasOwnProperty("supportedDirections")){

			for (let d=0; d<this.options.supportedDirections.length; d++){
				let direction = this.options.supportedDirections[d];
				
				if (direction == currentDirection){
				
					let directionEventName = this.constructor.name.toLowerCase() + direction;
				
					if (this.DEBUG == true){
						console.log("[Gestures] detected and firing event " + directionEventName);
					}
					
					let directionEvent = new CustomEvent(directionEventName, { detail: eventData });
		
					this.domElement.dispatchEvent(directionEvent);
					
				}
			}
		
		}
		
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
	
	emitSwipe (contact){
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
		
		this.boolParameters["requiresPointerMove"] = null;
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
		
		minMaxParameters.rotationAngle = Math.abs(contact.multipointer.liveParameters.rotationAngle);
		
		return minMaxParameters;
		
	}
	
	getEventData (contact) {
	
		// provide short-cuts to the values collected in the Contact object
		// match this to the event used by hammer.js
		var eventData = super.getEventData(contact);
		
		var globalDuration = contact.currentPointerEvent.timeStamp - this.initialPointerEvent.timeStamp;
		var globalParameters = contact.multipointer.globalParameters;
		var liveParameters = contact.multipointer.liveParameters;
		
		// global: global for this recognizer, not the Contact object
		eventData["global"] = {
			deltaX : globalParameters.centerMovementVector.x,
			deltaY : globalParameters.centerMovementVector.y,
			distance: globalParameters.centerMovement,
			speedX : globalParameters.centerMovementVector.x / globalDuration,
			speedY : globalParameters.centerMovementVector.y / globalDuration,
			speed : globalParameters.centerMovementVector.vectorLength / globalDuration,
			direction : globalParameters.centerMovementVector.direction,
			scale : globalParameters.relativeDistanceChange,
			rotation : globalParameters.rotationAngle,
			srcEvent : contact.currentPointerEvent
		};
		
		eventData["live"] = {
			deltaX : liveParameters.centerMovementVector.x,
			deltaY : liveParameters.centerMovementVector.y,
			distance: liveParameters.centerMovement,
			speedX : liveParameters.centerMovementVector.x / globalDuration,
			speedY : liveParameters.centerMovementVector.y / globalDuration,
			speed : liveParameters.centerMovementVector.vectorLength / globalDuration,
			direction : liveParameters.centerMovementVector.direction,
			scale : liveParameters.relativeDistanceChange,
			rotation : liveParameters.rotationAngle,
			center : {
				x : liveParameters.centerMovementVector.startPoint.x,
				y : liveParameters.centerMovementVector.startPoint.y
			},
			srcEvent : contact.currentPointerEvent
		};
		
		return eventData;
		
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
		
		this.initialMinMaxParameters["centerMovement"] = [0, 50]; //px
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
		
		this.initialMinMaxParameters["centerMovement"] = [0, 50];
		this.initialMinMaxParameters["distanceChange"] = [null, 50];
		this.initialMinMaxParameters["rotationAngle"] = [5, null];

	}

}


class TwoFingerPan extends TwoPointerGesture {

	constructor (domElement, options) {
	
		var options = options || {};
	
		super(domElement, options);
		
		this.initialMinMaxParameters["centerMovement"] = [5, null];
		this.initialMinMaxParameters["distanceChange"] = [null, 500];
		this.initialMinMaxParameters["rotationAngle"] = [null, null];

	}

}
