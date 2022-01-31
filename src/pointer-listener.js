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

var ALL_GESTURE_CLASSES = [Tap, Press, Pan, Pinch, Rotate, TwoFingerPan];


class PointerListener {

	constructor (domElement, options){
	
		this.DEBUG = false;
		
		// registry for events like "pan", "rotate", which have to be removed on this.destroy();
		this.eventHandlers = {}; 
		
		this.lastRecognitionTimestamp = null;
		this.idleRecognitionIntervalId = null;
		
		this.pointerEventHandlers = {};
		this.touchEventHandlers = {};
		
		options = options || {};
		
		this.options = {
			"bubbles" : true,
			"handleTouchEvents" : false
		};
		
		// add user-defined options to this.options
		for (let key in options){
			if (key == "supportedGestures"){
				continue;
			}

			this.options[key] = options[key];
		}

		// add instantiatedGestures to options.supportedGestures
		var supportedGestures = ALL_GESTURE_CLASSES;
		var instantiatedGestures = [];
		
		// instantiate gesture classes on domElement and add them to this.options
		var hasSupportedGestures = Object.prototype.hasOwnProperty.call(options, "supportedGestures");
		if (hasSupportedGestures == true){
			supportedGestures = options.supportedGestures;
		}
		
		for (let i=0; i<supportedGestures.length; i++){
	
			let gesture;
			let GestureClass = supportedGestures[i];
			let gestureOptions = {
				bubbles : this.options.bubbles
			};

			if (typeof GestureClass == "function"){
				gesture = new GestureClass(domElement, gestureOptions);
			}
			else if (typeof GestureClass == "object"){
				gesture = GestureClass;
			}
			else {
				throw new Error("unsupported gesture type: " + typeof GestureClass);
			}
			instantiatedGestures.push(gesture);
		}
		
		this.options.supportedGestures = instantiatedGestures;
		
		this.domElement = domElement;
		
		// the Contact instance - only active during an active pointerdown
		this.contact = null;
		
		// disable context menu on long taps - this kills pointermove
		/*domElement.addEventListener("contextmenu", function(event) {
			event.preventDefault();
			return false;
		});*/
		
		this.addPointerListeners();
		
		this.addTouchListeners();
	}
	
	
	addPointerListeners () {
	
		var self = this;
		
		var domElement = this.domElement;
		
		// javascript fires the events "pointerdown", "pointermove", "pointerup" and "pointercancel"
		// on each of these events, the contact instance is updated and GestureRecognizers of this.supported_events are run	
		var onPointerDown = function (event) {
			
			// re-target all pointerevents to the current element
			// see https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture
			domElement.setPointerCapture(event.pointerId);
			
			if (self.contact == null || self.contact.isActive == false) {
				self.contact = new Contact(event);
			}
			else {
				// use existing contact instance if a second pointer becomes present
				self.contact.addPointer(event);
			}
			
			var hasPointerDownHook = Object.prototype.hasOwnProperty.call(self.options, "pointerdown");
			if (hasPointerDownHook == true){
				self.options.pointerdown(event, self);
			}
			
			// before starting a new interval, make sure the old one is stopped if present
			if (self.idleRecognitionIntervalId != null){
				self.clearIdleRecognitionInterval();
			}
			
			self.idleRecognitionIntervalId = setInterval(function(){
				self.onIdle();
			}, 100);
			
		}
		
		var onPointerMove = function (event) {
		
			// pointermove is also firing if the mouse button is not pressed
		
			if (self.contact != null && self.contact.isActive == true){
		
				// this would disable vertical scrolling - which should only be disabled if a panup/down or swipeup/down listener has been triggered
				// event.preventDefault();
			
				self.contact.onPointerMove(event);
				self.recognizeGestures();
				
				var hasPointerMoveHook = Object.prototype.hasOwnProperty.call(self.options, "pointermove");
				if (hasPointerMoveHook == true){
					self.options.pointermove(event, self);
				}
			}
		
		}
		
		var onPointerUp = function (event) {
		
			domElement.releasePointerCapture(event.pointerId);
		
			if (self.contact != null && self.contact.isActive == true){
		
				// use css: touch-action: none instead of js to disable scrolling
				//self.domElement.classList.remove("disable-scrolling");
			
				self.contact.onPointerUp(event);
				self.recognizeGestures();
				
				var hasPointerUpHook = Object.prototype.hasOwnProperty.call(self.options, "pointerup");
				if (hasPointerUpHook == true){
					self.options.pointerup(event, self);
				}
			}
			
			self.clearIdleRecognitionInterval();
		
		}
		
		/*
		* case: user presses mouse button and moves element. while moving, the cursor leaves the element (fires pointerout)
		*		while outside the element, the mouse button is released. pointerup is not fired.
		*		during pan, pan should not end if the pointer leaves the element.
		* MDN: Pointer capture allows events for a particular pointer event (PointerEvent) to be re-targeted to a particular element instead of the normal (or hit test) target at a pointer's location. This can be used to ensure that an element continues to receive pointer events even if the pointer device's contact moves off the element (such as by scrolling or panning). 
		*/
		var onPointerLeave = function (event) {
		
			if (self.contact != null && self.contact.isActive == true){
				self.contact.onPointerLeave(event);
				self.recognizeGestures();
			}
			
			self.clearIdleRecognitionInterval()
		}
		
		var onPointerCancel = function (event) {
		
			domElement.releasePointerCapture(event.pointerId);
		
			if (this.DEBUG == true){
				console.log("[PointerListener] pointercancel detected");
			}
		
			//self.domElement.classList.remove("disable-scrolling");
		
			self.contact.onPointerCancel(event);
			self.recognizeGestures();
			
			self.clearIdleRecognitionInterval();
			
			var hasPointerCancelHook = Object.prototype.hasOwnProperty.call(self.options, "pointercancel");
			if (hasPointerCancelHook == true){
				self.options.pointercancel(event, self);
			}
		
		}
		
		domElement.addEventListener("pointerdown", onPointerDown, { "passive": true });
		domElement.addEventListener("pointermove", onPointerMove, { "passive": true });
		domElement.addEventListener("pointerup", onPointerUp, { "passive": true });
		domElement.addEventListener("pointerleave", onPointerLeave, {"passive": true});
		domElement.addEventListener("pointercancel", onPointerCancel, { "passive": true });
		
		this.pointerEventHandlers = {
			"pointerdown" : onPointerDown,
			"pointermove" : onPointerMove,
			"pointerup" : onPointerUp,
			"pointerleave" : onPointerLeave,
			"pointercancel" : onPointerCancel
		};
	
	}
	
	removePointerListeners () {
	
		for (let event in this.pointerEventHandlers){
			let handler = this.pointerEventHandlers[event];
			this.domElement.removeEventListener(event, handler);
		}
	
	}

	// provide the ability to interact/prevent touch events
	// scrolling (touchmove event) results in pointerCancel event, stopping horizontal panning if user scrolls vertically
	// the better solution is using eg css: touch-action: pan-y;
	addTouchListeners () {

		var self = this;

		if (self.options.handleTouchEvents == true){

			
			var onTouchMove = function (event) {
				// fire onTouchMove for all gestures
				for (let g=0; g<self.options.supportedGestures.length; g++){
			
					let gesture = self.options.supportedGestures[g];

					gesture.onTouchMove(event);
				}
			}

			this.domElement.addEventListener("touchmove", onTouchMove);
			
			this.touchEventHandlers = {
				"touchmove" : onTouchMove
			};
			
			/*this.domElement.addEventListener("touchstart", function(event){

			});*/

			/*this.domElement.addEventListener("touchend", function(event){
			});

			this.domElement.addEventListener("touchcancel", function(event){
			});*/
		}

	}
	
	removeTouchListeners () {
	
		for (let event in this.touchEventHandlers){
			let handler = this.touchEventHandlers[event];
			this.domElement.removeEventListener(event, handler);
		}
	
	}
	
	// to recognize Press, recognition has to be run if the user does nothing while having contact with the surfave (no pointermove, no pointerup, no pointercancel)
	onIdle () {
	
		if (this.DEBUG == true){
			console.log("[PointerListener] onIdle");
		}
		
		if (this.contact == null || this.contact.isActive == false){
			this.clearIdleRecognitionInterval();
		}
		else {
		
			let now = new Date().getTime();
			let timedelta = null;
			
			if (this.lastRecognitionTimestamp != null){
				timedelta = now - this.lastRecognitionTimestamp;
			}
			
			if (timedelta == null || timedelta > 100){
			
				this.contact.onIdle();
			
				if (this.DEBUG == true){
					console.log("[PointerListener] run idle recognition");
				}
			
				this.recognizeGestures();
			}
		}
		
	}
	
	clearIdleRecognitionInterval () {
	
		if (this.idleRecognitionIntervalId != null){
			clearInterval(this.idleRecognitionIntervalId);
			this.idleRecognitionIntervalId = null;
		}
	}
	
	// run all configured recognizers
	recognizeGestures (){
	
		this.lastRecognitionTimestamp = new Date().getTime();
	
		for (let g=0; g<this.options.supportedGestures.length; g++){
		
			let gesture = this.options.supportedGestures[g];
			
			gesture.recognize(this.contact);
			
		}
		
	}

	
	/*
	*	handler management
	*	eventsString: one or more events: "tap" or "pan twofingerpan pinchend"
	*	currently, it is not supported to add the same handlerReference twice (once with useCapture = true, and once with useCapture = false)
	*	useCapture defaults to false
	*/
	parseEventsString(eventsString) {
		return eventsString.trim().split(/\s+/g);
	}
	
	on (eventsString, handlerReference) {
		
		let eventTypes = this.parseEventsString(eventsString);
		
		for (let e=0; e<eventTypes.length; e++){
			let eventType = eventTypes[e];
			
			if (!(eventType in this.eventHandlers)){
				this.eventHandlers[eventType] = [];
			}
			
			if (this.eventHandlers[eventType].indexOf(handlerReference) == -1){
				this.eventHandlers[eventType].push(handlerReference);
			}
			
			this.domElement.addEventListener(eventType, handlerReference, false);
		}
		
		
	}
	
	off (eventsString, handlerReference) {
		
		let eventTypes = this.parseEventsString(eventsString);
		
		for (let e=0; e<eventTypes.length; e++){
		
			let eventType = eventTypes[e];
			
			if (eventType in this.eventHandlers){

				let handlerReferences = this.eventHandlers[eventType];

				let index = handlerReferences.indexOf(handlerReference);

				if (index >= 0) {
					handlerReferences.splice(index, 1);
					
					this.eventHandlers[eventType] = handlerReferences;
				}

				this.domElement.removeEventListener(eventType, handlerReference, false);
				
			}
			
		}
	}
	
	destroy () {
		
		// remove all EventListeners from self.domElement
		for (let event in this.eventHandlers){
			let handlerList = this.eventHandlers[event];
			for (let h=0; h<handlerList.length; h++){
				let handler = handlerList[h];
				this.domElement.removeEventListener(event, handler);
			}
			
			delete this.eventHandlers[event];
		}
		
		this.removePointerListeners();
		this.removeTouchListeners();
		
	}
	
}
