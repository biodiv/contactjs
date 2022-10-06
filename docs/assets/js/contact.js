let $a2188ba8c266b376$export$cacd6541cfeeb6c1;
(function(Direction) {
    Direction["None"] = "0";
    Direction["Left"] = "left";
    Direction["Right"] = "right";
    Direction["Up"] = "up";
    Direction["Down"] = "down";
})($a2188ba8c266b376$export$cacd6541cfeeb6c1 || ($a2188ba8c266b376$export$cacd6541cfeeb6c1 = {}));
const $a2188ba8c266b376$export$86ae6e8ac17a67c6 = Object.freeze({
    Horizontal: [
        $a2188ba8c266b376$export$cacd6541cfeeb6c1.Left,
        $a2188ba8c266b376$export$cacd6541cfeeb6c1.Right
    ],
    Vertical: [
        $a2188ba8c266b376$export$cacd6541cfeeb6c1.Up,
        $a2188ba8c266b376$export$cacd6541cfeeb6c1.Down
    ],
    All: [
        $a2188ba8c266b376$export$cacd6541cfeeb6c1.Left,
        $a2188ba8c266b376$export$cacd6541cfeeb6c1.Right,
        $a2188ba8c266b376$export$cacd6541cfeeb6c1.Up,
        $a2188ba8c266b376$export$cacd6541cfeeb6c1.Down,
        $a2188ba8c266b376$export$cacd6541cfeeb6c1.None, 
    ]
});
let $a2188ba8c266b376$export$a1d3109c03b1d511;
(function(GestureState) {
    GestureState["Inactive"] = "inactive";
    GestureState["Active"] = "active";
    GestureState["Blocked"] = "blocked";
})($a2188ba8c266b376$export$a1d3109c03b1d511 || ($a2188ba8c266b376$export$a1d3109c03b1d511 = {}));
let $a2188ba8c266b376$export$b8339a9622c147c0;
(function(PointerManagerState) {
    PointerManagerState["NoPointer"] = "nopointer";
    PointerManagerState["SinglePointer"] = "singlepointer";
    PointerManagerState["DualPointer"] = "dualpointer";
})($a2188ba8c266b376$export$b8339a9622c147c0 || ($a2188ba8c266b376$export$b8339a9622c147c0 = {}));
let $a2188ba8c266b376$export$2fb579dd5dfdbea;
(function(PointerListenerState) {
    PointerListenerState["NoActiveGesture"] = "noactivegesture";
    PointerListenerState["ActiveGesture"] = "activegesture";
})($a2188ba8c266b376$export$2fb579dd5dfdbea || ($a2188ba8c266b376$export$2fb579dd5dfdbea = {}));


class $07c7ab2351895186$export$baf26146a414f24a {
    constructor(x, y){
        this.x = x;
        this.y = y;
    }
}



class $c0ee1a209fd4fc8d$export$9b781de7bf37bf48 {
    // vector between 2 points: START(x,y) and END(x,y)
    constructor(startPoint, endPoint){
        this.startPoint = startPoint;
        this.endPoint = endPoint;
        this.direction = (0, $a2188ba8c266b376$export$cacd6541cfeeb6c1).None;
        this.deltaX = this.endPoint.x - this.startPoint.x;
        this.deltaY = this.endPoint.y - this.startPoint.y;
        this.x = this.deltaX;
        this.y = this.deltaY;
        // determine length
        this.vectorLength = Math.sqrt(Math.pow(this.deltaX, 2) + Math.pow(this.deltaY, 2));
        // determine direction
        if (Math.abs(this.deltaX) > Math.abs(this.deltaY)) {
            // left or right
            if (this.startPoint.x < this.endPoint.x) this.direction = (0, $a2188ba8c266b376$export$cacd6541cfeeb6c1).Right;
            else if (this.startPoint.x > this.endPoint.x) this.direction = (0, $a2188ba8c266b376$export$cacd6541cfeeb6c1).Left;
        } else {
            // up or down
            if (this.startPoint.y < this.endPoint.y) this.direction = (0, $a2188ba8c266b376$export$cacd6541cfeeb6c1).Down;
            else if (this.startPoint.y > this.endPoint.y) this.direction = (0, $a2188ba8c266b376$export$cacd6541cfeeb6c1).Up;
        }
    }
}


class $1f7944f1763e45ce$export$2db6c17465f94a2 {
    static getVector(startPointerEvent, endPointerEvent) {
        const startPoint = new (0, $07c7ab2351895186$export$baf26146a414f24a)(startPointerEvent.clientX, startPointerEvent.clientY);
        const endPoint = new (0, $07c7ab2351895186$export$baf26146a414f24a)(endPointerEvent.clientX, endPointerEvent.clientY);
        const vector = new (0, $c0ee1a209fd4fc8d$export$9b781de7bf37bf48)(startPoint, endPoint);
        return vector;
    }
    // update speed. speed = distance / time
    static getSpeed(vector, startTimestamp, endTimestamp) {
        let speed = 0;
        const timespan_ms = endTimestamp - startTimestamp;
        const timespan_s = timespan_ms / 1000;
        if (vector != null && timespan_s != 0) // px/s
        speed = vector.vectorLength / timespan_s;
        return speed;
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
  */ static calculateRotationAngle(vector_1, vector_2) {
        // vector_ are vectors between 2 points in time, same finger
        // angleAector_ are vectors between 2 fingers
        const angleVector_1 = new (0, $c0ee1a209fd4fc8d$export$9b781de7bf37bf48)(vector_1.startPoint, vector_2.startPoint); // in time: occured first
        const angleVector_2 = new (0, $c0ee1a209fd4fc8d$export$9b781de7bf37bf48)(vector_1.endPoint, vector_2.endPoint); // in time: occured second
        const origin = new (0, $07c7ab2351895186$export$baf26146a414f24a)(0, 0);
        // translate the points of the vector, so that their startPoints are attached to (0,0)
        /*

          ^
         /
        /
         /
        x
        0

    */ const translationVector_1 = new (0, $c0ee1a209fd4fc8d$export$9b781de7bf37bf48)(angleVector_1.startPoint, origin);
        const translatedEndPoint_1 = this.translatePoint(angleVector_1.endPoint, translationVector_1);
        //var v_1_translated = new Vector(origin, translatedEndPoint_1);
        const translationVector_2 = new (0, $c0ee1a209fd4fc8d$export$9b781de7bf37bf48)(angleVector_2.startPoint, origin);
        const translatedEndPoint_2 = this.translatePoint(angleVector_2.endPoint, translationVector_2);
        //var v2_translated = new Vector(origin, translatedEndPoint_2);
        // rotate the first angle vector so its y-coordinate becomes 0
        /*

      x------->
      0

    */ const rotationAngle = this.calcAngleRad(translatedEndPoint_1) * -1;
        // rottation matrix
        //var x_1_rotated =  ( translatedEndPoint_1.x * Math.cos(rotationAngle) ) - ( translatedEndPoint_1.y * Math.sin(rotationAngle) );
        //var y_1_rotated = Math.round(( translatedEndPoint_1.x * Math.sin(rotationAngle) ) + ( translatedEndPoint_1.y * Math.cos(rotationAngle) )); // should be 0
        //var v_1_rotated = new Vector(origin, new Point(x_1_rotated, y_1_rotated));
        // rotate the second vector (in time: after 1st)
        const x_2_rotated = translatedEndPoint_2.x * Math.cos(rotationAngle) - translatedEndPoint_2.y * Math.sin(rotationAngle);
        const y_2_rotated = Math.round(translatedEndPoint_2.x * Math.sin(rotationAngle) + translatedEndPoint_2.y * Math.cos(rotationAngle));
        //var v_2_rotated = new Vector(origin, new Point(x_2_rotated, y_2_rotated));
        // calculate the angle between v_1 and v_2
        const angleDeg = Math.atan2(y_2_rotated, x_2_rotated) * 180 / Math.PI;
        return angleDeg;
    }
    static calculateVectorAngle(vector_1, vector_2) {
        let angleDeg = 0;
        if (vector_1.vectorLength > 0 && vector_2.vectorLength > 0) {
            const cos = (vector_1.x * vector_2.x + vector_1.y * vector_2.y) / (vector_1.vectorLength * vector_2.vectorLength);
            const angleRad = Math.acos(cos);
            angleDeg = this.rad2deg(angleRad);
        }
        return angleDeg;
    }
    static translatePoint(point, vector) {
        const newX = point.x + vector.x;
        const newY = point.y + vector.y;
        const translatedPoint = new (0, $07c7ab2351895186$export$baf26146a414f24a)(newX, newY);
        return translatedPoint;
    }
    // return the counter-clockwise angle between the positive x-axis and a point.
    // from 0 degrees to 360 degrees
    // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan2
    static calcAngleDegrees(point) {
        // angle in degrees between -180 and 180
        let angle = Math.atan2(point.y, point.x) * 180 / Math.PI;
        if (angle < 0) angle = 360 + angle;
        return angle;
    }
    static calcAngleRad(point) {
        let angle = Math.atan2(point.y, point.x); // [-PI, PI]
        if (angle < 0) angle = 2 * Math.PI + angle;
        return angle;
    }
    static deg2rad(angleDeg) {
        const rad = Math.PI / 180 * angleDeg;
        return rad;
    }
    static rad2deg(angleRad) {
        const deg = angleRad / (Math.PI / 180);
        return deg;
    }
    // DualPointerInput calculations
    // center between start points
    static getCenter(pointA, pointB) {
        const centerX = (pointA.x + pointB.x) / 2;
        const centerY = (pointA.y + pointB.y) / 2;
        const center = new (0, $07c7ab2351895186$export$baf26146a414f24a)(centerX, centerY);
        return center;
    }
    static getCenterMovementVector(vector_1, vector_2) {
        // start point is the center between the starting points of the 2 vectors
        const startPoint = this.getCenter(vector_1.startPoint, vector_2.startPoint);
        // center between the end points of the vectors
        const endPoint = this.getCenter(vector_1.endPoint, vector_2.endPoint);
        const vectorBetweenCenterPoints = new (0, $c0ee1a209fd4fc8d$export$9b781de7bf37bf48)(startPoint, endPoint);
        return vectorBetweenCenterPoints;
    }
    static calculateDistanceChange(vector_1, vector_2) {
        const vectorBetweenStartPoints = new (0, $c0ee1a209fd4fc8d$export$9b781de7bf37bf48)(vector_1.startPoint, vector_2.startPoint);
        const vectorBetweenEndPoints = new (0, $c0ee1a209fd4fc8d$export$9b781de7bf37bf48)(vector_1.endPoint, vector_2.endPoint);
        const distanceChange = vectorBetweenEndPoints.vectorLength - vectorBetweenStartPoints.vectorLength;
        return distanceChange;
    }
    static calculateAbsoluteDistanceChange(vector_1, vector_2) {
        const distanceChange = this.calculateDistanceChange(vector_1, vector_2);
        const absoluteDistanceChange = Math.abs(distanceChange);
        return absoluteDistanceChange;
    }
    static calculateRelativeDistanceChange(vector_1, vector_2) {
        const vectorBetweenStartPoints = new (0, $c0ee1a209fd4fc8d$export$9b781de7bf37bf48)(vector_1.startPoint, vector_2.startPoint);
        const vectorBetweenEndPoints = new (0, $c0ee1a209fd4fc8d$export$9b781de7bf37bf48)(vector_1.endPoint, vector_2.endPoint);
        const relativeDistanceChange = vectorBetweenEndPoints.vectorLength / vectorBetweenStartPoints.vectorLength;
        return relativeDistanceChange;
    }
}


class $5fe7e4b452e08fad$export$bbcc47898202c6b8 {
    constructor(pointer){
        this.pointer = pointer;
        this.parameters = pointer.parameters;
    }
    getTarget() {
        return this.pointer.initialPointerEvent.target;
    }
    getCurrentPointerEvent() {
        return this.pointer.currentPointerEvent;
    }
    // string is not good, it should be Direction
    getCurrentDirection() {
        return this.parameters.live.vector.direction;
    }
    onIdle() {}
    onPointerMove(pointermoveEvent) {}
    onPointerUp(pointerupEvent) {}
    onPointerLeave(pointerleaveEvent) {}
    onPointerCancel(pointercancelEvent) {}
}



let $d25d2392b002d8dc$var$PointerState;
(function(PointerState) {
    PointerState["Active"] = "active";
    PointerState["Removed"] = "removed";
    PointerState["Canceled"] = "canceled";
})($d25d2392b002d8dc$var$PointerState || ($d25d2392b002d8dc$var$PointerState = {}));
class $d25d2392b002d8dc$export$b56007f12edf0c17 {
    constructor(pointerEvent, options){
        this.options = {
            DEBUG: false,
            ...options
        };
        this.DEBUG = this.options.DEBUG;
        const now = new Date().getTime();
        this.pointerId = pointerEvent.pointerId;
        this.vectorTimespan = this.options.vectorTimespan ?? 100; // milliseconds
        this.initialPointerEvent = pointerEvent;
        this.currentPointerEvent = pointerEvent;
        this.recognizedEvents = [
            pointerEvent
        ];
        this.state = $d25d2392b002d8dc$var$PointerState.Active;
        const nullVector = (0, $1f7944f1763e45ce$export$2db6c17465f94a2).getVector(pointerEvent, pointerEvent);
        const globalParameters = {
            startX: this.initialPointerEvent.clientX,
            startY: this.initialPointerEvent.clientY,
            vector: nullVector,
            deltaX: 0,
            deltaY: 0,
            startTimestampUTC: now,
            startTimestamp: this.initialPointerEvent.timeStamp,
            currentTimestamp: this.initialPointerEvent.timeStamp,
            endTimestamp: null,
            maximumSpeed: 0,
            currentSpeed: 0,
            distance: 0,
            maximumDistance: 0,
            averageSpeed: 0,
            finalSpeed: 0,
            traveledDistance: 0,
            hasBeenMoved: false,
            duration: 0
        };
        const liveParameters = {
            duration: 0,
            speed: 0,
            vector: nullVector,
            distance: 0,
            isMoving: false
        };
        const parameters = {
            global: globalParameters,
            live: liveParameters
        };
        this.parameters = parameters;
    }
    getTarget() {
        return this.initialPointerEvent.target;
    }
    reset() {}
    onIdle() {
        const now = new Date().getTime();
        // currentTimestamp is not an UTC millisecond timestamp.
        // this.globalParameters.currentTimestamp = now;
        const duration = now - this.parameters.global.startTimestampUTC;
        this.parameters.global.duration = duration;
    }
    onPointerMove(pointermoveEvent) {
        this.parameters.global.hasBeenMoved = true;
        this.parameters.live.isMoving = true;
        this.update(pointermoveEvent);
    }
    onPointerUp(pointerupEvent) {
        this.parameters.global.finalSpeed = this.parameters.live.speed;
        this.parameters.live.speed = 0;
        this.parameters.live.isMoving = false;
        this.state = $d25d2392b002d8dc$var$PointerState.Removed;
        this.parameters.global.endTimestamp = pointerupEvent.timeStamp;
        this.update(pointerupEvent);
        if (this.DEBUG === true) console.log(`[PointerInput] pointerdown ended. pointerdown duration: ${this.parameters.global.duration}ms`);
    }
    onPointerLeave(pointerleaveEvent) {
        this.onPointerUp(pointerleaveEvent);
    }
    onPointerCancel(pointercancelEvent) {
        this.update(pointercancelEvent);
        this.parameters.live.speed = 0;
        this.state = $d25d2392b002d8dc$var$PointerState.Canceled;
        this.parameters.live.isMoving = false;
        this.parameters.global.endTimestamp = pointercancelEvent.timeStamp;
        if (this.DEBUG === true) console.log(`[PointerInput] canceled, pointerdown duration:${this.parameters.global.duration}ms`);
    }
    update(pointerEvent) {
        // update general parameters
        this.currentPointerEvent = pointerEvent;
        this.recognizedEvents.push(pointerEvent);
        // update liveParameters
        // maybe check if clientX and clientY are present
        const timedPointerEvents = this.getTimedPointerEvents();
        const liveVector = (0, $1f7944f1763e45ce$export$2db6c17465f94a2).getVector(timedPointerEvents[0], timedPointerEvents[1]);
        this.parameters.live.vector = liveVector;
        this.parameters.live.distance = liveVector.vectorLength;
        this.parameters.live.speed = (0, $1f7944f1763e45ce$export$2db6c17465f94a2).getSpeed(liveVector, timedPointerEvents[0].timeStamp, timedPointerEvents[1].timeStamp);
        // update global parameters
        if (this.parameters.live.speed > this.parameters.global.maximumSpeed) this.parameters.global.maximumSpeed = this.parameters.live.speed;
        this.parameters.global.currentTimestamp = pointerEvent.timeStamp;
        this.parameters.global.duration = pointerEvent.timeStamp - this.parameters.global.startTimestamp;
        this.parameters.global.deltaX = liveVector.endPoint.x - this.parameters.global.startX;
        this.parameters.global.deltaY = liveVector.endPoint.y - this.parameters.global.startY;
        const globalVector = (0, $1f7944f1763e45ce$export$2db6c17465f94a2).getVector(this.initialPointerEvent, this.currentPointerEvent);
        this.parameters.global.vector = globalVector;
        this.parameters.global.distance = globalVector.vectorLength;
        if (globalVector.vectorLength > this.parameters.global.maximumDistance) this.parameters.global.maximumDistance = globalVector.vectorLength;
        if (this.DEBUG === true) {
            console.log(`[PointerInput] current speed: ${this.parameters.live.speed}px/s`);
            console.log(`[PointerInput] pointerdown duration: ${this.parameters.global.duration}ms`);
            console.log(`[PointerInput] live vector length within vectorTimespan: ${this.parameters.live.vector.vectorLength}px`);
        }
    }
    /*
   * Get the two events which are necessary for vector calculation. This is based on this.vectorTimespan.
   * vectorTimespan defines the timespan which actually defines the "live" vector
   */ getTimedPointerEvents() {
        // if the duration is lower than the vectorTimespan, startPointerEvent would be null
        // if so, use this.initialPointerEvent as a fallback
        let startPointerEvent = this.initialPointerEvent;
        const endPointerEvent = this.recognizedEvents[this.recognizedEvents.length - 1];
        let startIndex = this.recognizedEvents.length - 1;
        let elapsedTime = 0;
        const endTimeStamp = endPointerEvent.timeStamp;
        while(elapsedTime < this.vectorTimespan){
            startIndex = startIndex - 1;
            if (startIndex < 0) break;
            startPointerEvent = this.recognizedEvents[startIndex];
            elapsedTime = endTimeStamp - startPointerEvent.timeStamp;
        }
        const pointerEvents = [
            startPointerEvent,
            endPointerEvent
        ];
        this.recognizedEvents = this.recognizedEvents.slice(-20);
        return pointerEvents;
    }
}



const $24f1c062f8ef0b30$var$window = globalThis["window"];
let $24f1c062f8ef0b30$export$9d2aa32114ab0612;
if ($24f1c062f8ef0b30$var$window?.CustomEvent) // If we're in a browser environment forward the existing CustomEvent ctor
$24f1c062f8ef0b30$export$9d2aa32114ab0612 = $24f1c062f8ef0b30$var$window.CustomEvent;
else // eslint-disable-next-line @typescript-eslint/no-explicit-any
$24f1c062f8ef0b30$export$9d2aa32114ab0612 = class _ extends Event {
    constructor(type, eventInitDict){
        super(type, eventInitDict);
        this.detail = eventInitDict?.detail;
    }
    initCustomEvent() {
        throw new Error("Unsupported deprecated method");
    }
};


class $f752273e736c5336$export$6e9c3b1e1fa2b597 extends (0, $24f1c062f8ef0b30$export$9d2aa32114ab0612) {
}
class $f752273e736c5336$export$61ce360501d38a6f {
    constructor(domElement, options){
        this.state = (0, $a2188ba8c266b376$export$a1d3109c03b1d511).Inactive;
        this.validPointerManagerState = null;
        this.validPointerInputConstructor = (0, $5fe7e4b452e08fad$export$bbcc47898202c6b8);
        this.domElement = domElement;
        this.initialPointerEvent = null;
        this.initialParameters = null;
        this.activeStateParameters = null;
        this.options = {
            bubbles: true,
            blocks: [],
            supportedDirections: [],
            DEBUG: false,
            ...options
        };
        this.DEBUG = this.options.DEBUG;
    }
    getEmptyGestureParameters() {
        const nullRecognitionParameters = {
            global: {
                min: {},
                max: {},
                boolean: {}
            },
            live: {
                min: {},
                max: {},
                boolean: {}
            }
        };
        return nullRecognitionParameters;
    }
    getGestureParameters() {
        let gestureParameters;
        if (this.state == (0, $a2188ba8c266b376$export$a1d3109c03b1d511).Active) {
            gestureParameters = this.activeStateParameters;
            if (this.DEBUG == true) {
                console.log(`[${this.eventBaseName}] validating using activeStateParameters`);
                console.log(gestureParameters);
            }
        } else {
            if (this.DEBUG == true) console.log(`[${this.eventBaseName}] validating using initialParameters`);
            gestureParameters = this.initialParameters;
        }
        if (gestureParameters == null) throw new Error("[Gesture] no gesture parameters found. Do not call .getGestureParameters on abstract class Gesture");
        return gestureParameters;
    }
    validateGestureParameters(pointerInput) {
        const gestureParameters = this.getGestureParameters();
        let isValid = true;
        let timespan;
        for(timespan in gestureParameters){
            const timedGestureParameters = gestureParameters[timespan];
            const timedPointerInputValues = pointerInput.parameters[timespan];
            let minOrMaxOrBoolean;
            for(minOrMaxOrBoolean in timedGestureParameters){
                const evaluationParameters = timedGestureParameters[minOrMaxOrBoolean];
                let gestureParameterName;
                for(gestureParameterName in evaluationParameters){
                    const gestureParameter = evaluationParameters[gestureParameterName];
                    const pointerInputValue = timedPointerInputValues[gestureParameterName];
                    if (this.DEBUG == true) console.log(`[${this.eventBaseName}] validating ${timespan} ${minOrMaxOrBoolean}: required: ${gestureParameter}, pointer: ${pointerInputValue}`);
                    if (typeof gestureParameter == "boolean" && typeof pointerInputValue == "boolean") isValid = this.validateBooleanParameter(gestureParameter, pointerInputValue);
                    else if (typeof gestureParameter == "number" && typeof pointerInputValue == "number") isValid = this.validateMinMaxParameter(gestureParameter, pointerInputValue, minOrMaxOrBoolean);
                    if (isValid == false) {
                        if (this.DEBUG == true) console.log(`[${this.eventBaseName}] invalidated `);
                        return false;
                    }
                }
            }
        }
        return true;
    }
    validateBooleanParameter(gestureParameter, pointerInputValue) {
        if (gestureParameter == null) return true;
        else if (gestureParameter == pointerInputValue) {
            if (this.DEBUG == true) console.log(`validated: required value: ${gestureParameter}, current value: ${pointerInputValue}`);
            return true;
        }
        if (this.DEBUG == true) console.log(`dismissing ${this.eventBaseName}: required value: ${gestureParameter}, current value: ${pointerInputValue}`);
        return false;
    }
    validateMinMaxParameter(gestureParameter, pointerInputValue, minOrMax) {
        if (minOrMax == "min") {
            if (pointerInputValue >= gestureParameter) return true;
        } else if (minOrMax == "max") {
            if (pointerInputValue <= gestureParameter) return true;
        }
        return false;
    }
    validateDirection(pointerInput) {
        const currentDirection = pointerInput.getCurrentDirection();
        if (this.options.supportedDirections.length && !this.options.supportedDirections.includes(currentDirection)) {
            if (this.DEBUG == true) console.log(`[Gestures] dismissing ${this.eventBaseName}: supported directions: ${this.options.supportedDirections}, current direction: ${currentDirection}`);
            return false;
        }
        return true;
    }
    validateGestureState() {
        if (this.state == (0, $a2188ba8c266b376$export$a1d3109c03b1d511).Blocked) return false;
        return true;
    }
    validatePointerManagerState(pointerManager) {
        if (pointerManager.state == this.validPointerManagerState) return true;
        if (this.DEBUG == true) console.log(`[Gesture] PointerManagerState invalidated ${this.eventBaseName}: ${pointerManager.state}`);
        return false;
    }
    validatePointerInputConstructor(pointerInput) {
        if (pointerInput instanceof this.validPointerInputConstructor) return true;
        if (this.DEBUG == true) console.log(`[Gesture] PointerInputConstructor invalidated ${this.eventBaseName}: ${this.validPointerInputConstructor}`);
        return false;
    }
    // validate pointerCount and GestureState.Blocked
    validate(pointerManager) {
        let isValid = this.validateGestureState();
        if (isValid == true) isValid = this.validatePointerManagerState(pointerManager);
        const pointerInput = pointerManager.activePointerInput;
        if (isValid == true && pointerInput != null) {
            isValid = this.validatePointerInputConstructor(pointerInput);
            if (isValid == true) isValid = this.validateDirection(pointerInput);
            if (isValid == true) isValid = this.validateGestureParameters(pointerInput);
        }
        return isValid;
    }
    recognize(pointerManager) {
        const isValid = this.validate(pointerManager);
        if (isValid == true && this.state == (0, $a2188ba8c266b376$export$a1d3109c03b1d511).Inactive) this.onStart(pointerManager);
        if (isValid == true && this.state == (0, $a2188ba8c266b376$export$a1d3109c03b1d511).Active) {
            if (this.initialPointerEvent == null) this.setInitialPointerEvent(pointerManager);
            this.emit(pointerManager);
        } else if (this.state == (0, $a2188ba8c266b376$export$a1d3109c03b1d511).Active && isValid == false) this.onEnd(pointerManager);
        else if (this.DEBUG == true) console.log(`not firing event ${this.eventBaseName}. No SinglePointerInput found`);
    }
    /*
   * The PointerInput for recognition has to be pointerManager.lastRemovedPointer if there is no active pointer left
   */ getPointerInput(pointerManager) {
        if (pointerManager.hasPointersOnSurface() == true && pointerManager.activePointerInput instanceof this.validPointerInputConstructor) return pointerManager.activePointerInput;
        else if (pointerManager.lastRemovedPointer instanceof (0, $d25d2392b002d8dc$export$b56007f12edf0c17)) {
            const pointerInput = pointerManager.getlastRemovedPointerInput();
            if (pointerInput instanceof this.validPointerInputConstructor) return pointerInput;
        }
        return null;
    }
    setInitialPointerEvent(pointerManager) {
        const pointerInput = this.getPointerInput(pointerManager);
        if (pointerInput instanceof this.validPointerInputConstructor) {
            const pointerEvent = pointerInput.getCurrentPointerEvent();
            this.initialPointerEvent = pointerEvent;
        }
    }
    emit(pointerManager, eventName) {
        // fire general event like "tap", "press", "pan"
        eventName = eventName || this.eventBaseName;
        if (this.DEBUG === true) console.log(`[Gestures] detected and firing event ${eventName}`);
        const pointerInput = this.getPointerInput(pointerManager);
        if (pointerInput != null) {
            const target = pointerInput.getTarget();
            if (target instanceof EventTarget) {
                const eventData = this.getEventData(pointerInput, pointerManager);
                const eventOptions = {
                    detail: eventData,
                    bubbles: this.options.bubbles
                };
                if (this.DEBUG === true) console.log(eventOptions);
                const event = new $f752273e736c5336$export$6e9c3b1e1fa2b597(eventName, eventOptions);
                if (eventOptions.bubbles == true) target.dispatchEvent(event);
                else this.domElement.dispatchEvent(event);
                // fire direction specific events
                const currentDirection = eventData.live.direction;
                const hasSupportedDirections = !!this.options.supportedDirections;
                // do not fire events like "panendleft"
                // only fire directional events if eventName == this.eventBaseName
                if (hasSupportedDirections == true && currentDirection != (0, $a2188ba8c266b376$export$cacd6541cfeeb6c1).None && (eventName == this.eventBaseName || eventName == "swipe")) for(let d = 0; d < this.options.supportedDirections.length; d++){
                    const direction = this.options.supportedDirections[d];
                    if (direction == currentDirection) {
                        const directionEventName = eventName + direction;
                        if (this.DEBUG == true) console.log(`[Gestures] detected and firing event ${directionEventName}`);
                        const directionEvent = new $f752273e736c5336$export$6e9c3b1e1fa2b597(directionEventName, eventOptions);
                        if (eventOptions.bubbles == true) target.dispatchEvent(directionEvent);
                        else this.domElement.dispatchEvent(directionEvent);
                    }
                }
            }
        }
    }
    onStart(pointerManager) {
        this.blockGestures();
        this.state = (0, $a2188ba8c266b376$export$a1d3109c03b1d511).Active;
        this.setInitialPointerEvent(pointerManager);
        const eventName = `${this.eventBaseName}start`;
        this.emit(pointerManager, eventName);
    }
    onEnd(pointerManager) {
        this.unblockGestures();
        if (this.DEBUG == true) console.log(`[${this.eventBaseName}] ended. Setting ${this.eventBaseName}.state = ${(0, $a2188ba8c266b376$export$a1d3109c03b1d511).Inactive}`);
        this.state = (0, $a2188ba8c266b376$export$a1d3109c03b1d511).Inactive;
        const eventName = `${this.eventBaseName}end`;
        this.emit(pointerManager, eventName);
    }
    // provide the ability to react (eg block) to touch events
    /* eslint-disable @typescript-eslint/no-unused-vars */ onTouchStart(event) {}
    onTouchMove(event) {}
    onTouchEnd(event) {}
    onTouchCancel(event) {}
    /* eslint-enable @typescript-eslint/no-unused-vars */ block(gesture) {
        if (this.options.blocks.indexOf(gesture) == -1) this.options.blocks.push(gesture);
    }
    unblock(gesture) {
        if (this.options.blocks.indexOf(gesture) != -1) this.options.blocks.splice(this.options.blocks.indexOf(gesture), 1);
    }
    blockGestures() {
        for(let g = 0; g < this.options.blocks.length; g++){
            const gesture = this.options.blocks[g];
            if (gesture.state == (0, $a2188ba8c266b376$export$a1d3109c03b1d511).Inactive) {
                if (this.DEBUG == false) console.log(`[Gesture] blocking ${gesture.eventBaseName}`);
                gesture.state = (0, $a2188ba8c266b376$export$a1d3109c03b1d511).Blocked;
            }
        }
    }
    unblockGestures() {
        for(let g = 0; g < this.options.blocks.length; g++){
            const gesture = this.options.blocks[g];
            gesture.state = (0, $a2188ba8c266b376$export$a1d3109c03b1d511).Inactive;
        }
    }
    getEventData(pointerInput, pointerManager) {
        throw new Error("Gesture subclasses require a getEventData method()");
    }
}





class $e8978caba4d46d00$export$718b85c80185d86e extends (0, $f752273e736c5336$export$61ce360501d38a6f) {
    constructor(domElement, options){
        super(domElement, options);
        this.initialPointerEvent = null;
        this.validPointerManagerState = (0, $a2188ba8c266b376$export$b8339a9622c147c0).SinglePointer;
        const nullRecognitionParameters = this.getEmptyGestureParameters();
        this.initialParameters = {
            ...nullRecognitionParameters
        };
        // a deep copy of the parameters is needed as they can have different values
        this.activeStateParameters = JSON.parse(JSON.stringify({
            ...nullRecognitionParameters
        }));
    }
    getEventData(singlePointerInput, pointerManager) {
        // provide short-cuts to the values collected in the Contact object
        // match this to the event used by hammer.js
        const globalParameters = singlePointerInput.parameters.live;
        const liveParameters = singlePointerInput.parameters.live;
        let globalVector = globalParameters.vector;
        let globalDuration = globalParameters.duration;
        // gesture specific - dependant on the beginning of the gesture (when the gesture has initially been recognized)
        if (this.initialPointerEvent != null) {
            const globalStartPoint = new (0, $07c7ab2351895186$export$baf26146a414f24a)(this.initialPointerEvent.clientX, this.initialPointerEvent.clientY);
            const globalEndPoint = new (0, $07c7ab2351895186$export$baf26146a414f24a)(singlePointerInput.pointer.currentPointerEvent.clientX, singlePointerInput.pointer.currentPointerEvent.clientY);
            globalVector = new (0, $c0ee1a209fd4fc8d$export$9b781de7bf37bf48)(globalStartPoint, globalEndPoint);
            globalDuration = singlePointerInput.pointer.currentPointerEvent.timeStamp - this.initialPointerEvent.timeStamp;
        }
        // global: global for this recognizer, not the Contact object
        const globalGestureEventData = {
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
                y: globalParameters.vector.endPoint.y
            },
            srcEvent: singlePointerInput.pointer.currentPointerEvent
        };
        const liveGestureEventData = {
            deltaX: liveParameters.vector.x,
            deltaY: liveParameters.vector.y,
            distance: liveParameters.vector.vectorLength,
            speedX: liveParameters.vector.x / singlePointerInput.pointer.vectorTimespan,
            speedY: liveParameters.vector.y / singlePointerInput.pointer.vectorTimespan,
            speed: liveParameters.speed,
            direction: liveParameters.vector.direction,
            scale: 1,
            rotation: 0,
            center: {
                x: liveParameters.vector.endPoint.x,
                y: liveParameters.vector.endPoint.y
            },
            srcEvent: singlePointerInput.pointer.currentPointerEvent /*,
      target : primaryPointerInput.touch.target,
      pointerType : ,
      eventType : ,
      isFirst : ,
      isFinal :,
      pointers : ,*/ 
        };
        const eventData = {
            recognizer: this,
            global: globalGestureEventData,
            live: liveGestureEventData,
            pointerManager: pointerManager
        };
        return eventData;
    }
}




class $b6ec4e8a6d9d51ec$export$4451a18ddc7083b7 extends (0, $e8978caba4d46d00$export$718b85c80185d86e) {
    constructor(domElement, options){
        super(domElement, options);
        this.validPointerManagerState = (0, $a2188ba8c266b376$export$b8339a9622c147c0).NoPointer;
        this.eventBaseName = "tap";
        let globalMaxDuration = 200;
        let liveMaxDistance = 30;
        let globalMaxDistance = 30;
        if (options) {
            if ("maxDuration" in options) globalMaxDuration = options["maxDuration"];
            if ("maxDistance" in options) {
                liveMaxDistance = options["maxDistance"];
                globalMaxDistance = options["maxDistance"];
            }
        }
        this.initialParameters.global.max["duration"] = globalMaxDuration; // milliseconds. after a certain touch duration, it is not a TAP anymore
        this.initialParameters.live.max["distance"] = liveMaxDistance; // if a certain distance is detected, TAP becomes impossible
        this.initialParameters.global.max["distance"] = globalMaxDistance; // if a certain distance is detected, TAP becomes impossible
    }
    validate(pointerManager) {
        let isValid = this.validateGestureState();
        if (isValid == true) isValid = this.validatePointerManagerState(pointerManager);
        if (isValid === true) {
            if (pointerManager.lastInputSessionPointerCount != 1) return false;
            else {
                const singlePointerInput = pointerManager.getlastRemovedPointerInput();
                if (singlePointerInput instanceof (0, $5fe7e4b452e08fad$export$bbcc47898202c6b8)) isValid = this.validateGestureParameters(singlePointerInput);
                else isValid = false;
            }
        }
        return isValid;
    }
    // do not set Tap.state = GestureState.active as Tap has no active state
    onStart(pointerManager) {
        this.setInitialPointerEvent(pointerManager);
        this.emit(pointerManager);
    }
}





class $5653a1f5fdc2db30$export$90610caf6d8d0242 extends (0, $e8978caba4d46d00$export$718b85c80185d86e) {
    static minDuration = 600;
    constructor(domElement, options){
        super(domElement, options);
        this.eventBaseName = "press";
        let globalMinDuration = 600;
        let globalMaxDistance = 10;
        let globalMaxMaximumDistance = 20;
        if (options) {
            if ("minDuration" in options) globalMinDuration = options["minDuration"];
            if ("maxDistance" in options) {
                globalMaxMaximumDistance = options["maxDistance"];
                globalMaxDistance = options["maxDistance"];
            }
        }
        this.initialParameters.global.min["duration"] = globalMinDuration; // milliseconds. after a certain touch duration, it is not a TAP anymore
        this.initialParameters.global.max["distance"] = globalMaxDistance; // if the pointer moved a certain distance, Press becomes impossible
        this.initialParameters.global.max["maximumDistance"] = globalMaxMaximumDistance;
        // only Press has this parameter
        this.hasBeenEmitted = false;
    }
    recognize(pointerManager) {
        const isValid = this.validate(pointerManager);
        const singlePointerInput = this.getPointerInput(pointerManager);
        // is this line really necessary? ESLint complains if it is not present, although its value is set in the constructor
        // adding Object.freeze(this.initialParameters) in the constructor did not resolve the ESLint error
        const minDuration = this.initialParameters.global.min["duration"] || $5653a1f5fdc2db30$export$90610caf6d8d0242.minDuration;
        if (singlePointerInput instanceof (0, $5fe7e4b452e08fad$export$bbcc47898202c6b8)) {
            if (isValid == true && this.hasBeenEmitted == false) {
                this.setInitialPointerEvent(pointerManager);
                this.emit(pointerManager);
                this.hasBeenEmitted = true;
                this.state = (0, $a2188ba8c266b376$export$a1d3109c03b1d511).Active;
                this.blockGestures();
            } else if (isValid == false && this.hasBeenEmitted == true) {
                this.onEnd(pointerManager);
                this.state = (0, $a2188ba8c266b376$export$a1d3109c03b1d511).Inactive;
                this.hasBeenEmitted = false;
            } else {
                const duration = singlePointerInput.parameters.global.duration;
                if (this.hasBeenEmitted == true && duration <= minDuration) this.hasBeenEmitted = false;
            }
        }
        if (singlePointerInput == null) this.hasBeenEmitted = false;
    }
}






class $7a0f7fd2f33d0212$export$f86166cd6057c2d1 extends (0, $e8978caba4d46d00$export$718b85c80185d86e) {
    constructor(domElement, options){
        super(domElement, options);
        this.validPointerManagerState = (0, $a2188ba8c266b376$export$b8339a9622c147c0).SinglePointer;
        this.eventBaseName = "pan";
        this.initialParameters.global.min["duration"] = 0;
        this.initialParameters.live.min["distance"] = 10;
        this.initialParameters.global.boolean["hasBeenMoved"] = true;
        this.swipeFinalSpeed = 600;
        this.isSwipe = false;
        this.options.supportedDirections = options?.supportedDirections ?? (0, $a2188ba8c266b376$export$86ae6e8ac17a67c6).All;
        this.initialSupportedDirections = this.options.supportedDirections;
    }
    validate(pointerManager) {
        // on second recognition allow all directions. otherwise, the "pan" mode would end if the finger was moved right and then down during "panleft" mode
        if (this.state == (0, $a2188ba8c266b376$export$a1d3109c03b1d511).Active) this.options.supportedDirections = (0, $a2188ba8c266b376$export$86ae6e8ac17a67c6).All;
        const isValid = super.validate(pointerManager);
        return isValid;
    }
    onStart(pointerManager) {
        this.isSwipe = false;
        super.onStart(pointerManager);
    }
    // check if it was a swipe
    onEnd(pointerManager) {
        const singlePointerInput = pointerManager.getlastRemovedPointerInput();
        if (singlePointerInput instanceof (0, $5fe7e4b452e08fad$export$bbcc47898202c6b8)) {
            if (this.swipeFinalSpeed < singlePointerInput.parameters.global.finalSpeed && singlePointerInput.parameters.live.vector.direction != (0, $a2188ba8c266b376$export$cacd6541cfeeb6c1).None) {
                this.isSwipe = true;
                this.emit(pointerManager, "swipe");
            } else if (this.DEBUG == true) {
                if (singlePointerInput.parameters.global.finalSpeed < this.swipeFinalSpeed) console.log(`[Pan] dismissing swipe. Final speed: ${singlePointerInput.parameters.global.finalSpeed} < ${this.swipeFinalSpeed}`);
                else console.log(`[Pan] dismissing swipe. Direction: ${singlePointerInput.parameters.live.vector.direction}`);
            }
        }
        super.onEnd(pointerManager);
        this.options.supportedDirections = this.initialSupportedDirections;
    }
    onTouchMove(event) {
        if (this.state == (0, $a2188ba8c266b376$export$a1d3109c03b1d511).Active) {
            if (this.DEBUG == true) console.log("[Pan] preventing touchmove default");
            event.preventDefault();
            event.stopPropagation();
        }
    }
}




class $ba0aae203ff6b3f9$export$bdba51b3ce92d5f1 {
    constructor(pointer_1, pointer_2){
        this.pointerIds = new Set([
            pointer_1.pointerId,
            pointer_2.pointerId
        ]);
        this.startTimestamp = new Date().getTime();
        this.pointerMap = {};
        this.pointerMap[pointer_1.pointerId] = pointer_1;
        this.pointerMap[pointer_2.pointerId] = pointer_2;
        this.pointer_1 = pointer_1;
        this.pointer_2 = pointer_2;
        this.initialPointerEvent = pointer_1.initialPointerEvent;
        this.currentPointerEvent = pointer_1.initialPointerEvent;
        const globalVector_1 = this.pointer_1.parameters.global.vector;
        const globalVector_2 = this.pointer_2.parameters.global.vector;
        const globalCenter = (0, $1f7944f1763e45ce$export$2db6c17465f94a2).getCenter(globalVector_1.startPoint, globalVector_2.startPoint);
        const globalCenterMovementVector = (0, $1f7944f1763e45ce$export$2db6c17465f94a2).getCenterMovementVector(globalVector_1, globalVector_2);
        const globalParameters = {
            duration: 0,
            center: globalCenter,
            centerHasBeenMoved: false,
            centerMovementDistance: 0,
            centerMovementVector: globalCenterMovementVector,
            absolutePointerDistanceChange: 0,
            relativePointerDistanceChange: 0,
            rotationAngle: 0,
            absoluteRotationAngle: 0,
            vectorAngle: 0,
            absoluteVectorAngle: 0
        };
        const liveVector_1 = this.pointer_1.parameters.live.vector;
        const liveVector_2 = this.pointer_2.parameters.live.vector;
        const liveCenter = (0, $1f7944f1763e45ce$export$2db6c17465f94a2).getCenter(liveVector_1.startPoint, liveVector_2.startPoint);
        const liveCenterMovementVector = (0, $1f7944f1763e45ce$export$2db6c17465f94a2).getCenterMovementVector(liveVector_1, liveVector_2);
        const liveParameters = {
            center: liveCenter,
            centerIsMoving: false,
            centerMovementDistance: 0,
            centerMovementVector: liveCenterMovementVector,
            absolutePointerDistanceChange: 0,
            relativePointerDistanceChange: 0,
            rotationAngle: 0,
            absoluteRotationAngle: 0,
            vectorAngle: 0,
            absoluteVectorAngle: 0
        };
        const parameters = {
            global: globalParameters,
            live: liveParameters
        };
        this.parameters = parameters;
    }
    removePointer(pointerId) {
        if (pointerId == this.pointer_1.pointerId) return this.pointer_2;
        else if (pointerId == this.pointer_2.pointerId) return this.pointer_1;
        else throw new Error(`[DualPointerInput] cannot remove Pointer #${pointerId}. The pointer is not part of this DualPointerInput`);
    }
    getTarget() {
        return this.initialPointerEvent.target;
    }
    update(pointerEvent) {
        if (pointerEvent instanceof PointerEvent) this.currentPointerEvent = pointerEvent;
        const now = new Date().getTime();
        this.parameters.global["duration"] = now - this.startTimestamp;
        const globalVector_1 = this.pointer_1.parameters.global.vector;
        const globalVector_2 = this.pointer_2.parameters.global.vector;
        const globalCenter = (0, $1f7944f1763e45ce$export$2db6c17465f94a2).getCenter(globalVector_1.startPoint, globalVector_2.startPoint);
        const globalCenterMovementVector = (0, $1f7944f1763e45ce$export$2db6c17465f94a2).getCenterMovementVector(globalVector_1, globalVector_2);
        const globalAbsoluteDistanceChange = (0, $1f7944f1763e45ce$export$2db6c17465f94a2).calculateAbsoluteDistanceChange(globalVector_1, globalVector_2);
        const globalRelativeDistanceChange = (0, $1f7944f1763e45ce$export$2db6c17465f94a2).calculateRelativeDistanceChange(globalVector_1, globalVector_2);
        const globalRotationAngle = (0, $1f7944f1763e45ce$export$2db6c17465f94a2).calculateRotationAngle(globalVector_1, globalVector_2);
        const globalVectorAngle = (0, $1f7944f1763e45ce$export$2db6c17465f94a2).calculateVectorAngle(globalVector_1, globalVector_2);
        this.parameters.global["center"] = globalCenter;
        this.parameters.global["centerMovementVector"] = globalCenterMovementVector;
        this.parameters.global["centerMovementDistance"] = globalCenterMovementVector.vectorLength;
        this.parameters.global["absolutePointerDistanceChange"] = globalAbsoluteDistanceChange;
        this.parameters.global["relativePointerDistanceChange"] = globalRelativeDistanceChange;
        this.parameters.global["rotationAngle"] = globalRotationAngle;
        this.parameters.global["absoluteRotationAngle"] = Math.abs(globalRotationAngle);
        this.parameters.global["vectorAngle"] = globalVectorAngle;
        this.parameters.global["absoluteVectorAngle"] = Math.abs(globalVectorAngle);
        const liveVector_1 = this.pointer_1.parameters.live.vector;
        const liveVector_2 = this.pointer_2.parameters.live.vector;
        const liveCenter = (0, $1f7944f1763e45ce$export$2db6c17465f94a2).getCenter(liveVector_1.startPoint, liveVector_2.startPoint);
        const liveCenterMovementVector = (0, $1f7944f1763e45ce$export$2db6c17465f94a2).getCenterMovementVector(liveVector_1, liveVector_2);
        const liveAbsoluteDistanceChange = (0, $1f7944f1763e45ce$export$2db6c17465f94a2).calculateAbsoluteDistanceChange(liveVector_1, liveVector_2);
        const liveRelativeDistanceChange = (0, $1f7944f1763e45ce$export$2db6c17465f94a2).calculateRelativeDistanceChange(liveVector_1, liveVector_2);
        // calculate rotation angle. imagine the user turning a wheel with 2 fingers
        const liveRotationAngle = (0, $1f7944f1763e45ce$export$2db6c17465f94a2).calculateRotationAngle(liveVector_1, liveVector_2);
        const liveVectorAngle = (0, $1f7944f1763e45ce$export$2db6c17465f94a2).calculateVectorAngle(liveVector_1, liveVector_2);
        if (liveCenterMovementVector.vectorLength > 0) {
            this.parameters.live.centerIsMoving = true;
            this.parameters.global.centerHasBeenMoved = true;
        } else this.parameters.live.centerIsMoving = false;
        this.parameters.live["center"] = liveCenter;
        this.parameters.live["centerMovementDistance"] = liveCenterMovementVector.vectorLength;
        this.parameters.live["centerMovementVector"] = liveCenterMovementVector;
        this.parameters.live["absolutePointerDistanceChange"] = liveAbsoluteDistanceChange;
        this.parameters.live["relativePointerDistanceChange"] = liveRelativeDistanceChange;
        this.parameters.live["rotationAngle"] = liveRotationAngle;
        this.parameters.live["absoluteRotationAngle"] = Math.abs(liveRotationAngle);
        this.parameters.live["vectorAngle"] = liveVectorAngle;
        this.parameters.live["absoluteVectorAngle"] = Math.abs(liveVectorAngle);
    }
    onPointerMove(pointermoveEvent) {
        this.update(pointermoveEvent);
    }
    onPointerUp(pointerupEvent) {
        this.update(pointerupEvent);
    }
    onPointerLeave(pointerleaveEvent) {
        this.update(pointerleaveEvent);
    }
    onPointerCancel(pointercancelEvent) {
        this.update(pointercancelEvent);
    }
    onIdle() {
        this.update();
    }
    // string is not good, it should be Direction
    getCurrentDirection() {
        return this.parameters.live.centerMovementVector.direction;
    }
    getCurrentPointerEvent() {
        return this.currentPointerEvent;
    }
}



class $a1a4c2869495e604$export$f9d89efe4b7795e7 extends (0, $f752273e736c5336$export$61ce360501d38a6f) {
    constructor(domElement, options){
        super(domElement, options);
        this.initialPointerEvent_1 = null;
        this.initialPointerEvent_2 = null;
        this.validPointerManagerState = (0, $a2188ba8c266b376$export$b8339a9622c147c0).DualPointer;
        this.validPointerInputConstructor = (0, $ba0aae203ff6b3f9$export$bdba51b3ce92d5f1);
        const nullRecognitionParameters = this.getEmptyGestureParameters();
        this.initialParameters = {
            ...nullRecognitionParameters
        };
        this.activeStateParameters = JSON.parse(JSON.stringify({
            ...nullRecognitionParameters
        }));
    }
    getEventData(dualPointerInput, pointerManager) {
        // provide short-cuts to the values collected in the Contact object
        // match this to the event used by hammer.js
        const globalParameters = dualPointerInput.parameters.global;
        const liveParameters = dualPointerInput.parameters.live;
        const globalGestureEventData = {
            deltaX: globalParameters.centerMovementVector.x,
            deltaY: globalParameters.centerMovementVector.y,
            distance: globalParameters.centerMovementDistance,
            speedX: globalParameters.centerMovementVector.x / globalParameters.duration,
            speedY: globalParameters.centerMovementVector.y / globalParameters.duration,
            speed: globalParameters.centerMovementVector.vectorLength / globalParameters.duration,
            direction: globalParameters.centerMovementVector.direction,
            scale: globalParameters.relativePointerDistanceChange,
            rotation: globalParameters.rotationAngle,
            center: globalParameters.center,
            srcEvent: dualPointerInput.currentPointerEvent
        };
        const liveGestureEventData = {
            deltaX: liveParameters.centerMovementVector.x,
            deltaY: liveParameters.centerMovementVector.y,
            distance: liveParameters.centerMovementDistance,
            speedX: liveParameters.centerMovementVector.x / globalParameters.duration,
            speedY: liveParameters.centerMovementVector.y / globalParameters.duration,
            speed: liveParameters.centerMovementVector.vectorLength / globalParameters.duration,
            direction: liveParameters.centerMovementVector.direction,
            scale: liveParameters.relativePointerDistanceChange,
            rotation: liveParameters.rotationAngle,
            center: {
                x: liveParameters.centerMovementVector.startPoint.x,
                y: liveParameters.centerMovementVector.startPoint.y
            },
            srcEvent: dualPointerInput.currentPointerEvent
        };
        const gestureEventData = {
            recognizer: this,
            global: globalGestureEventData,
            live: liveGestureEventData,
            pointerManager: pointerManager
        };
        return gestureEventData;
    }
}


class $ed7931f1d96d5294$export$826ae541ddf1527b extends (0, $a1a4c2869495e604$export$f9d89efe4b7795e7) {
    constructor(domElement, options){
        super(domElement, options);
        this.eventBaseName = "pinch";
        this.initialParameters.live.min["centerMovementDistance"] = 0;
        this.initialParameters.live.max["centerMovementDistance"] = 50; //px
        this.initialParameters.live.min["absolutePointerDistanceChange"] = 5; // distance between 2 fingers
        this.initialParameters.live.max["absoluteRotationAngle"] = 20;
        this.initialParameters.live.min["absoluteVectorAngle"] = 10;
    }
}



class $9fe2bb90b337f66c$export$152db69a76b6b79e extends (0, $a1a4c2869495e604$export$f9d89efe4b7795e7) {
    constructor(domElement, options){
        super(domElement, options);
        this.eventBaseName = "rotate";
        this.initialParameters.live.min["centerMovementDistance"] = 0;
        this.initialParameters.live.max["centerMovementDistance"] = 50;
        this.initialParameters.live.max["absolutePointerDistanceChange"] = 50;
        this.initialParameters.live.min["absoluteRotationAngle"] = 5;
        this.activeStateParameters.live.min["absoluteRotationAngle"] = 0;
    }
}



class $59226122237c359c$export$8847187e02a498e8 extends (0, $a1a4c2869495e604$export$f9d89efe4b7795e7) {
    constructor(domElement, options){
        super(domElement, options);
        this.eventBaseName = "twofingerpan";
        this.initialParameters.live.min["centerMovementDistance"] = 10;
        this.initialParameters.live.max["absolutePointerDistanceChange"] = 50;
        this.initialParameters.live.max["absoluteVectorAngle"] = 150;
        this.activeStateParameters.live.min["centerMovementDistance"] = 0;
    }
}






class $4f5a7b355079efa2$export$af6d1be017a420a {
    constructor(options){
        options = options || {};
        this.options = {
            DEBUG: false,
            ...options
        };
        this.DEBUG = this.options.DEBUG;
        this.state = (0, $a2188ba8c266b376$export$b8339a9622c147c0).NoPointer;
        this.activePointerInput = null;
        this.lastRemovedPointer = null;
        this.lastInputSessionPointerCount = 0;
        this.pointerAllocation = {};
        this.unusedPointers = {}; // pointers on the surface that are not interpreted right now
        this.onSurfacePointers = {};
    }
    addPointer(pointerdownEvent) {
        if (this.DEBUG == true) console.log(`[PointerManager] adding Pointer #${pointerdownEvent.pointerId.toString()}`);
        const pointerOptions = {
            DEBUG: this.DEBUG
        };
        const pointer = new (0, $d25d2392b002d8dc$export$b56007f12edf0c17)(pointerdownEvent, pointerOptions);
        this.onSurfacePointers[pointer.pointerId] = pointer;
        if (this.activePointerInput == null) this.setActiveSinglePointerInput(pointer);
        else if (this.activePointerInput instanceof (0, $5fe7e4b452e08fad$export$bbcc47898202c6b8)) this.setActiveDualPointerInput(this.activePointerInput.pointer, pointer);
        else if (this.activePointerInput instanceof (0, $ba0aae203ff6b3f9$export$bdba51b3ce92d5f1)) this.unusedPointers[pointer.pointerId] = pointer;
        this.lastInputSessionPointerCount = this.currentPointerCount();
    }
    /**
   * called on the following events: pointerup, pointerleave(?), pointercancel
   * 1 -> 0 : SinglePointerInput -> null
   * 2 -> 1 : DualPointerInput -> SinglePointerInput
   * 3 -> 2 : DualPointerInput -> DualPointerInput (new combination or no change)
   */ removePointer(pointerId) {
        if (this.DEBUG == true) {
            console.log(`[PointerManager] starting to remove Pointer #${pointerId}`);
            console.log(`[PointerManager] state: ${this.state}`);
        }
        const pointer = this.onSurfacePointers[pointerId];
        this.lastRemovedPointer = pointer;
        // remove from registries
        delete this.onSurfacePointers[pointerId];
        if (pointerId in this.unusedPointers) delete this.unusedPointers[pointerId];
        // set this.activePointerInput to null if the Pointer was part of it
        // DualPointerInput -> SinglePointerInput
        // OR DualPointerInput -> new DualPointerInput
        if (this.activePointerInput instanceof (0, $ba0aae203ff6b3f9$export$bdba51b3ce92d5f1)) {
            if (this.activePointerInput.pointerIds.has(pointerId)) {
                if (this.DEBUG == true) console.log(`[PointerManager] removing Pointer #${pointerId} from DualPointerInput`);
                const remainingPointer = this.activePointerInput.removePointer(pointerId);
                this.activePointerInput = null;
                // remainingPointer should be used for the next this.activePointerInput
                const unusedPointerInput = this.getUnusedPointer();
                if (unusedPointerInput instanceof (0, $d25d2392b002d8dc$export$b56007f12edf0c17)) this.setActiveDualPointerInput(remainingPointer, unusedPointerInput);
                else this.setActiveSinglePointerInput(remainingPointer);
            }
        // a 3rd pointer which has not been part of DualPointerInput has been removed
        } else if (this.activePointerInput instanceof (0, $5fe7e4b452e08fad$export$bbcc47898202c6b8)) {
            if (this.DEBUG == true) console.log(`[PointerManager] removing Pointer #${pointerId} from SinglePointerInput`);
            this.activePointerInput = null;
            this.state = (0, $a2188ba8c266b376$export$b8339a9622c147c0).NoPointer;
            // this should not be necessary
            if (Object.keys(this.unusedPointers).length > 0) {
                this.unusedPointers = {};
                throw new Error("[PointerManager] found unused Pointers although there should not be any");
            }
            if (Object.keys(this.onSurfacePointers).length > 0) {
                this.onSurfacePointers = {};
                throw new Error("[PointerManager] found onSurfacePointers although there should not be any");
            }
        }
        if (this.DEBUG == true) console.log(`[PointerManager] state: ${this.state}`);
    }
    setActiveSinglePointerInput(pointer) {
        pointer.reset();
        const singlePointerInput = new (0, $5fe7e4b452e08fad$export$bbcc47898202c6b8)(pointer);
        this.activePointerInput = singlePointerInput;
        this.pointerAllocation[pointer.pointerId] = singlePointerInput;
        delete this.unusedPointers[pointer.pointerId];
        this.state = (0, $a2188ba8c266b376$export$b8339a9622c147c0).SinglePointer;
        if (this.DEBUG == true) console.log(`[PointerManager] state: ${this.state}`);
    }
    setActiveDualPointerInput(pointer_1, pointer_2) {
        pointer_1.reset();
        pointer_2.reset();
        const dualPointerInput = new (0, $ba0aae203ff6b3f9$export$bdba51b3ce92d5f1)(pointer_1, pointer_2);
        this.activePointerInput = dualPointerInput;
        this.pointerAllocation[pointer_1.pointerId] = dualPointerInput;
        this.pointerAllocation[pointer_2.pointerId] = dualPointerInput;
        delete this.unusedPointers[pointer_1.pointerId];
        delete this.unusedPointers[pointer_2.pointerId];
        this.state = (0, $a2188ba8c266b376$export$b8339a9622c147c0).DualPointer;
        if (this.DEBUG == true) console.log(`[PointerManager] state: ${this.state}`);
    }
    hasPointersOnSurface() {
        if (Object.keys(this.onSurfacePointers).length > 0) return true;
        return false;
    }
    currentPointerCount() {
        return Object.keys(this.onSurfacePointers).length;
    }
    getUnusedPointer() {
        if (Object.keys(this.unusedPointers).length > 0) {
            const pointer = Object.values(this.unusedPointers)[0];
            return pointer;
        }
        return null;
    }
    getPointerFromId(pointerId) {
        if (pointerId in this.onSurfacePointers) return this.onSurfacePointers[pointerId];
        return null;
    }
    getlastRemovedPointerInput() {
        if (this.lastRemovedPointer instanceof (0, $d25d2392b002d8dc$export$b56007f12edf0c17)) return this.pointerAllocation[this.lastRemovedPointer.pointerId];
        return null;
    }
    onIdle() {
        for(const pointerId in this.onSurfacePointers){
            const pointer = this.onSurfacePointers[pointerId];
            pointer.onIdle();
        }
        this.activePointerInput?.onIdle();
    }
    /**
   * PointerEvent handlers
   * - the Pointer is always updated firs
   * - afterwards, the current activePointerInput is updated
   */ onPointerMove(pointermoveEvent) {
        const pointer = this.getPointerFromId(pointermoveEvent.pointerId);
        if (pointer instanceof (0, $d25d2392b002d8dc$export$b56007f12edf0c17)) pointer.onPointerMove(pointermoveEvent);
        this.activePointerInput?.onPointerMove(pointermoveEvent);
    }
    onPointerUp(pointerupEvent) {
        if (this.DEBUG == true) console.log("[PointerManager] pointerup detected");
        const pointer = this.getPointerFromId(pointerupEvent.pointerId);
        if (pointer instanceof (0, $d25d2392b002d8dc$export$b56007f12edf0c17)) pointer.onPointerUp(pointerupEvent);
        this.activePointerInput?.onPointerUp(pointerupEvent);
        this.removePointer(pointerupEvent.pointerId);
    }
    /*onPointerOver(pointeroverEvent: PointerEvent): void {

  }

  onPointerLeave(pointerleaveEvent: PointerEvent): void {
    if (this.DEBUG == true) {
      console.log(`[PointerManager] pointerLeave detected`);
    }
    const pointer = this.getPointerFromId(pointerleaveEvent.pointerId);
    if (pointer instanceof Pointer) {
      pointer.onPointerLeave(pointerleaveEvent);
    }
    this.activePointerInput?.onPointerLeave(pointerleaveEvent);
    // pointerleave does not mean th pointer left the surface
    // the pointer left the bound element
    this.removePointer(pointerleaveEvent.pointerId);
  }

  onPointerOut(pointeroutEvent: PointerEvent): void {
    if (this.DEBUG == true) {
      console.log(`[PointerManager] pointerout detected`);
    }
    const pointer = this.getPointerFromId(pointeroutEvent.pointerId);
    if (pointer instanceof Pointer) {
      pointer.onPointerLeave(pointeroutEvent);
    }
    this.activePointerInput?.onPointerLeave(pointeroutEvent);
    // pointerleave does not mean th pointer left the surface
    // the pointer left the bound element
    this.removePointer(pointeroutEvent.pointerId);
  }*/ onPointerCancel(pointercancelEvent) {
        if (this.DEBUG == true) console.log("[PointerManager] pointercancel detected");
        const pointer = this.getPointerFromId(pointercancelEvent.pointerId);
        if (pointer instanceof (0, $d25d2392b002d8dc$export$b56007f12edf0c17)) pointer.onPointerCancel(pointercancelEvent);
        this.activePointerInput?.onPointerCancel(pointercancelEvent);
        this.removePointer(pointercancelEvent.pointerId);
    }
}



const $03c52e54621b9b86$var$ALL_GESTURE_CLASSES = [
    (0, $b6ec4e8a6d9d51ec$export$4451a18ddc7083b7),
    (0, $5653a1f5fdc2db30$export$90610caf6d8d0242),
    (0, $7a0f7fd2f33d0212$export$f86166cd6057c2d1),
    (0, $ed7931f1d96d5294$export$826ae541ddf1527b),
    (0, $9fe2bb90b337f66c$export$152db69a76b6b79e),
    (0, $59226122237c359c$export$8847187e02a498e8)
];
class $03c52e54621b9b86$export$9371bd96776f4e82 {
    constructor(domElement, options){
        this.state = (0, $a2188ba8c266b376$export$2fb579dd5dfdbea).NoActiveGesture;
        this.activeGestures = [];
        this.hadActiveGestureDuringCurrentContact = false;
        // registry for events like "pan", "rotate", which have to be removed on this.destroy();
        this.gestureEventHandlers = {};
        this.lastRecognitionTimestamp = null;
        this.idleRecognitionIntervalId = null;
        this.pointerEventHandlers = {};
        this.touchEventHandlers = {};
        options = options || {};
        this.options = {
            DEBUG: false,
            DEBUG_GESTURES: false,
            DEBUG_POINTERMANAGER: false,
            bubbles: true,
            handleTouchEvents: true,
            consecutiveGestures: true,
            simultaneousGestures: true,
            supportedGestures: [],
            ...options
        };
        this.DEBUG = this.options.DEBUG;
        const supportedGestures = options.supportedGestures ?? $03c52e54621b9b86$var$ALL_GESTURE_CLASSES;
        // instantiate gesture classes on domElement and add them to this.options
        const instantiatedGestures = supportedGestures.map((GestureClass)=>{
            if (typeof GestureClass === "function") {
                const gestureOptions = {
                    bubbles: this.options.bubbles,
                    DEBUG: this.options.DEBUG_GESTURES
                };
                return new GestureClass(domElement, gestureOptions);
            }
            if (typeof GestureClass === "object") return GestureClass;
            throw new Error(`unsupported gesture type: ${typeof GestureClass}`);
        });
        // this.supportedGestures have to be instantiated gestures
        this.supportedGestures = instantiatedGestures;
        this.domElement = domElement;
        const pointerManagerOptions = {
            DEBUG: this.options.DEBUG_POINTERMANAGER
        };
        this.pointerManager = new (0, $4f5a7b355079efa2$export$af6d1be017a420a)(pointerManagerOptions);
        // disable context menu on long taps - this kills pointermove
        /*domElement.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      return false;
    });*/ this.addPointerEventListeners();
        this.addTouchEventListeners();
    }
    /* PointerEvent handling */ addPointerEventListeners() {
        const domElement = this.domElement;
        // create references, so the listener can be removed at a later time
        // .bind(this): make sure that the instance of PointerListener is accessible in the EventHandler
        const onPointerDown = this.onPointerDown.bind(this);
        const onPointerMove = this.onPointerMove.bind(this);
        const onPointerUp = this.onPointerUp.bind(this);
        //const onPointerLeave = this.onPointerLeave.bind(this);
        //const onPointerOut = this.onPointerOut.bind(this);
        const onPointerCancel = this.onPointerCancel.bind(this);
        domElement.addEventListener("pointerdown", onPointerDown, {
            passive: true
        });
        domElement.addEventListener("pointermove", onPointerMove, {
            passive: true
        });
        domElement.addEventListener("pointerup", onPointerUp, {
            passive: true
        });
        /*
     * case: user presses mouse button and moves element. while moving, the cursor leaves the element (fires pointerout)
     *		while outside the element, the mouse button is released. pointerup is not fired.
     *		during pan, pan should not end if the pointer leaves the element.
     * MDN: Pointer capture allows events for a particular pointer event (PointerEvent) to be re-targeted to a particular element instead of the normal (or hit test) target at a pointer's location. This can be used to ensure that an element continues to receive pointer events even if the pointer device's contact moves off the element (such as by scrolling or panning).
     *  this problem is solved by using setPointerCapture()
     */ //domElement.addEventListener("pointerleave", onPointerLeave, { passive: true });
        //domElement.addEventListener("pointerout", onPointerOut, { passive: true });
        domElement.addEventListener("pointercancel", onPointerCancel, {
            passive: true
        });
        this.pointerEventHandlers = {
            pointerdown: onPointerDown,
            pointermove: onPointerMove,
            pointerup: onPointerUp,
            //pointerleave: onPointerLeave,
            //pointerout: onPointerOut,
            pointercancel: onPointerCancel
        };
    }
    // there may be more than one pointer. Each new pointer fires onPointerDown
    onPointerDown(pointerdownEvent) {
        if (this.DEBUG == true) console.log("[PointerListener] pointerdown event detected");
        // re-target all pointerevents to the current element
        // see https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture
        this.domElement.setPointerCapture(pointerdownEvent.pointerId);
        this.pointerManager.addPointer(pointerdownEvent);
        this.options.pointerdown?.(pointerdownEvent, this);
        // before starting a new interval, make sure the old one is stopped if present
        if (this.idleRecognitionIntervalId != null) this.clearIdleRecognitionInterval();
        this.idleRecognitionIntervalId = setInterval(()=>{
            this.onIdle();
        }, 100);
    }
    onPointerMove(pointermoveEvent) {
        // pointermove is also firing if the mouse button is not pressed
        if (this.pointerManager.hasPointersOnSurface() == true) {
            // this would disable vertical scrolling - which should only be disabled if a panup/down or swipeup/down listener has been triggered
            // event.preventDefault();
            this.pointerManager.onPointerMove(pointermoveEvent);
            this.recognizeGestures();
            this.options.pointermove?.(pointermoveEvent, this);
        }
    }
    onPointerUp(pointerupEvent) {
        if (this.DEBUG == true) console.log("[PointerListener] pointerup event detected");
        this.domElement.releasePointerCapture(pointerupEvent.pointerId);
        if (this.pointerManager.hasPointersOnSurface() == true) {
            this.pointerManager.onPointerUp(pointerupEvent);
            this.recognizeGestures();
            this.options.pointerup?.(pointerupEvent, this);
        }
        this.clearIdleRecognitionInterval();
    }
    /*private onPointerLeave(event: PointerEvent) {
    if (this.DEBUG == true) {
      console.log("[PointerListener] pointerleave detected");
    }

    if (this.pointerManager.hasPointersOnSurface() == true) {
      this.pointerManager.onPointerLeave(event);
      this.recognizeGestures();
    }

    this.clearIdleRecognitionInterval();
  }

  private onPointerOut(pointeroutEvent: PointerEvent) {
    if (this.DEBUG == true) {
      console.log("[PointerListener] pointerout detected");
    }

    if (this.pointerManager.hasPointersOnSurface() == true) {
      this.pointerManager.onPointerOut(pointeroutEvent);
      this.recognizeGestures();
    }

    this.clearIdleRecognitionInterval();
  }*/ onPointerCancel(pointercancelEvent) {
        this.domElement.releasePointerCapture(pointercancelEvent.pointerId);
        if (this.DEBUG == true) console.log("[PointerListener] pointercancel detected");
        this.pointerManager.onPointerCancel(pointercancelEvent);
        this.recognizeGestures();
        this.clearIdleRecognitionInterval();
        this.options.pointercancel?.(pointercancelEvent, this);
    }
    removePointerEventListeners() {
        for(const event in this.pointerEventHandlers){
            const handler = this.pointerEventHandlers[event];
            this.domElement.removeEventListener(event, handler);
        }
    }
    // provide the ability to interact/prevent touch events
    // scrolling (touchmove event) results in pointerCancel event, stopping horizontal panning if user scrolls vertically
    // the better solution is using eg css: touch-action: pan-y;
    addTouchEventListeners() {
        if (this.options.handleTouchEvents == true) {
            const onTouchMove = this.onTouchMove.bind(this);
            // do NOT make the touchmove listener passive, as this listener might block touch events from
            // interfering with pan/swipe. Passive listeners make the promise not to block scrolling.
            this.domElement.addEventListener("touchmove", onTouchMove);
            this.touchEventHandlers["touchmove"] = onTouchMove;
        /*this.domElement.addEventListener("touchstart", (event) => {

      }, { passive: true });*/ /*this.domElement.addEventListener("touchend", (event) => {
      }, { passive: true });

      this.domElement.addEventListener("touchcancel", (event) => {
      }, { passive: true });*/ }
    }
    removeTouchEventListeners() {
        for(const event in this.touchEventHandlers){
            const handler = this.touchEventHandlers[event];
            this.domElement.removeEventListener(event, handler);
        }
    }
    onTouchMove(event) {
        // fire onTouchMove for all gestures
        for(let g = 0; g < this.supportedGestures.length; g++){
            const gesture = this.supportedGestures[g];
            gesture.onTouchMove(event);
        }
    }
    // to recognize Press, recognition has to be run if the user does nothing while having contact with the surface (no pointermove, no pointerup, no pointercancel)
    onIdle() {
        if (this.pointerManager.hasPointersOnSurface() == false) this.clearIdleRecognitionInterval();
        else {
            const now = new Date().getTime();
            let timedelta = null;
            if (this.lastRecognitionTimestamp != null) timedelta = now - this.lastRecognitionTimestamp;
            if (timedelta == null || timedelta > 100) {
                this.pointerManager.onIdle();
                if (this.DEBUG == true) console.log("[PointerListener] onIdle - running idle recognition");
                this.recognizeGestures();
            }
        }
    }
    clearIdleRecognitionInterval() {
        if (this.idleRecognitionIntervalId != null) {
            clearInterval(this.idleRecognitionIntervalId);
            this.idleRecognitionIntervalId = null;
        }
    }
    /**
   * respect the options "consecutiveGestures" and "simultaneousGestures"
   */ recognizeGestures() {
        this.lastRecognitionTimestamp = new Date().getTime();
        let gesturesForRecognition = this.supportedGestures;
        if (this.options.simultaneousGestures == false && this.state == (0, $a2188ba8c266b376$export$2fb579dd5dfdbea).ActiveGesture) gesturesForRecognition = [
            this.activeGestures[0]
        ];
        else if (this.options.consecutiveGestures == false && this.state == (0, $a2188ba8c266b376$export$2fb579dd5dfdbea).ActiveGesture) gesturesForRecognition = [
            this.activeGestures[0]
        ];
        else if (this.options.consecutiveGestures == false && this.state == (0, $a2188ba8c266b376$export$2fb579dd5dfdbea).NoActiveGesture) {
            if (this.hadActiveGestureDuringCurrentContact == true && this.pointerManager.hasPointersOnSurface() == true) gesturesForRecognition = [];
        }
        for(let g = 0; g < gesturesForRecognition.length; g++){
            const gesture = gesturesForRecognition[g];
            gesture.recognize(this.pointerManager);
            this.updateActiveGestures(gesture);
            if (this.options.simultaneousGestures == false && this.state == (0, $a2188ba8c266b376$export$2fb579dd5dfdbea).ActiveGesture) break;
        }
        if (this.DEBUG == true) console.log(`[PointerListener] hadActiveGestureDuringCurrentContact: ${this.hadActiveGestureDuringCurrentContact}`);
        if (this.pointerManager.hasPointersOnSurface() == false) this.hadActiveGestureDuringCurrentContact = false;
    }
    updateActiveGestures(gesture) {
        if (gesture.state == (0, $a2188ba8c266b376$export$a1d3109c03b1d511).Active) {
            this.hadActiveGestureDuringCurrentContact = true;
            if (this.activeGestures.indexOf(gesture) < 0) this.activeGestures.push(gesture);
        } else {
            // remove from active gestures
            const index = this.activeGestures.indexOf(gesture);
            if (index >= 0) this.activeGestures.splice(index, 1);
        }
        if (this.activeGestures.length > 0) this.state = (0, $a2188ba8c266b376$export$2fb579dd5dfdbea).ActiveGesture;
        else this.state = (0, $a2188ba8c266b376$export$2fb579dd5dfdbea).NoActiveGesture;
    }
    /*
   *	handler management
   *	eventsString: one or more events: "tap" or "pan twofingerpan pinchend"
   *	currently, it is not supported to add the same handlerReference twice (once with useCapture = true, and once with useCapture = false)
   *	useCapture defaults to false
   */ parseEventsString(eventsString) {
        return eventsString.trim().split(/\s+/g);
    }
    on(eventsString, handlerReference) {
        const eventTypes = this.parseEventsString(eventsString);
        for(let e = 0; e < eventTypes.length; e++){
            const eventType = eventTypes[e];
            if (!(eventType in this.gestureEventHandlers)) this.gestureEventHandlers[eventType] = [];
            if (this.gestureEventHandlers[eventType].indexOf(handlerReference) == -1) this.gestureEventHandlers[eventType].push(handlerReference);
            this.domElement.addEventListener(eventType, handlerReference, {
                capture: false,
                passive: true
            });
        }
    }
    off(eventsString, handlerReference) {
        const eventTypes = this.parseEventsString(eventsString);
        if (this.DEBUG == true) {
            console.log(`[PointerListener] turning off events: ${eventsString}`);
            console.log(this.gestureEventHandlers);
        }
        for(let e = 0; e < eventTypes.length; e++){
            const eventType = eventTypes[e];
            if (eventType in this.gestureEventHandlers) {
                const handlerList = this.gestureEventHandlers[eventType];
                const index = handlerList.indexOf(handlerReference);
                if (this.DEBUG == true) console.log(`[PointerListener] turning off ${eventType}. Index on handlerList: ${index}`);
                if (index >= 0) {
                    handlerList.splice(index, 1);
                    this.gestureEventHandlers[eventType] = handlerList;
                }
                this.domElement.removeEventListener(eventType, handlerReference, false);
            }
        }
    }
    destroy() {
        // remove all EventListeners from this.domElement
        for(const eventType in this.gestureEventHandlers){
            const handlerList = this.gestureEventHandlers[eventType];
            for(let h = 0; h < handlerList.length; h++){
                const handler = handlerList[h];
                this.domElement.removeEventListener(eventType, handler);
            }
            delete this.gestureEventHandlers[eventType];
        }
        this.removePointerEventListeners();
        this.removeTouchEventListeners();
    }
}











export {$a2188ba8c266b376$export$cacd6541cfeeb6c1 as Direction, $a2188ba8c266b376$export$86ae6e8ac17a67c6 as Directions, $a2188ba8c266b376$export$a1d3109c03b1d511 as GestureState, $1f7944f1763e45ce$export$2db6c17465f94a2 as Geometry, $03c52e54621b9b86$export$9371bd96776f4e82 as PointerListener, $f752273e736c5336$export$6e9c3b1e1fa2b597 as GestureEvent, $b6ec4e8a6d9d51ec$export$4451a18ddc7083b7 as Tap, $5653a1f5fdc2db30$export$90610caf6d8d0242 as Press, $7a0f7fd2f33d0212$export$f86166cd6057c2d1 as Pan, $59226122237c359c$export$8847187e02a498e8 as TwoFingerPan, $ed7931f1d96d5294$export$826ae541ddf1527b as Pinch, $9fe2bb90b337f66c$export$152db69a76b6b79e as Rotate};
//# sourceMappingURL=contact.js.map
