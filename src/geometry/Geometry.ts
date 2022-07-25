import { Point } from "./Point";
import { Vector } from "./Vector";

export class Geometry {

	static getVector (startPointerEvent: PointerEvent, endPointerEvent: PointerEvent): Vector {

		const startPoint = new Point(
			startPointerEvent.clientX,
			startPointerEvent.clientY
		);

		const endPoint = new Point(
			endPointerEvent.clientX,
			endPointerEvent.clientY
		);

		var vector = new Vector(startPoint, endPoint);

		return vector;
	}

	// update speed. speed = distance / time
	static getSpeed(vector: Vector, startTimestamp: number, endTimestamp: number): number {

		let speed = 0;

		const timespan_ms = endTimestamp - startTimestamp;
		const timespan_s = timespan_ms / 1000;

		if (vector != null && timespan_s != 0) {
			// px/s
			speed = vector.vectorLength / timespan_s;
		}

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
	*/
	static calculateRotationAngle(vector_1: Vector, vector_2: Vector): number {
		// vector_ are vectors between 2 points in time, same finger
		// angleAector_ are vectors between 2 fingers
		const angleVector_1 = new Vector(vector_1.startPoint, vector_2.startPoint); // in time: occured first
		const angleVector_2 = new Vector(vector_1.endPoint, vector_2.endPoint); // in time: occured second
	
		const origin = new Point(0, 0);
	
		// translate the points of the vector, so that their startPoints are attached to (0,0)
		/*
	
				  ^
				 /
				/
			   /
			  x
			  0
	
		*/
		const translationVector_1 = new Vector(angleVector_1.startPoint, origin);
		const translatedEndPoint_1 = this.translatePoint(
		  angleVector_1.endPoint,
		  translationVector_1
		);
	
		//var v_1_translated = new Vector(origin, translatedEndPoint_1);
	
		const translationVector_2 = new Vector(angleVector_2.startPoint, origin);
		const translatedEndPoint_2 = this.translatePoint(
		  angleVector_2.endPoint,
		  translationVector_2
		);
	
		//var v2_translated = new Vector(origin, translatedEndPoint_2);
	
		// rotate the first angle vector so its y-coordinate becomes 0
		/*
	
			x------->
			0
	
		*/
		const rotationAngle = this.calcAngleRad(translatedEndPoint_1) * -1;
	
		// rottation matrix
		//var x_1_rotated =  ( translatedEndPoint_1.x * Math.cos(rotationAngle) ) - ( translatedEndPoint_1.y * Math.sin(rotationAngle) );
		//var y_1_rotated = Math.round(( translatedEndPoint_1.x * Math.sin(rotationAngle) ) + ( translatedEndPoint_1.y * Math.cos(rotationAngle) )); // should be 0
	
		//var v_1_rotated = new Vector(origin, new Point(x_1_rotated, y_1_rotated));
	
		// rotate the second vector (in time: after 1st)
		const x_2_rotated =
		  translatedEndPoint_2.x * Math.cos(rotationAngle) -
		  translatedEndPoint_2.y * Math.sin(rotationAngle);
		const y_2_rotated = Math.round(
		  translatedEndPoint_2.x * Math.sin(rotationAngle) +
		  translatedEndPoint_2.y * Math.cos(rotationAngle)
		);
	
		//var v_2_rotated = new Vector(origin, new Point(x_2_rotated, y_2_rotated));
	
		// calculate the angle between v_1 and v_2
	
		const angleDeg = (Math.atan2(y_2_rotated, x_2_rotated) * 180) / Math.PI;
	
		return angleDeg;
	}
	
	static calculateVectorAngle(vector_1: Vector, vector_2: Vector): number | null {
		let angleDeg = null;
	
		if (vector_1.vectorLength > 0 && vector_2.vectorLength > 0) {
		  const cos =
			(vector_1.x * vector_2.x + vector_1.y * vector_2.y) /
			(vector_1.vectorLength * vector_2.vectorLength);
	
		  const angleRad = Math.acos(cos);
		  angleDeg = this.rad2deg(angleRad);
		}
	
		return angleDeg;
	}

	static getCenter(pointA: Point, pointB: Point): Point {
		const centerX = (pointA.x + pointB.x) / 2;
		const centerY = (pointA.y + pointB.y) / 2;
	  
		const center = new Point(centerX, centerY);
		return center;
	}

	static translatePoint(point: Point, vector: Vector): Point {
		const newX = point.x + vector.x;
		const newY = point.y + vector.y;
	  
		const translatedPoint = new Point(newX, newY);
		return translatedPoint;
	}

	// return the counter-clockwise angle between the positive x-axis and a point.
	// from 0 degrees to 360 degrees
	// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan2
	static calcAngleDegrees(point: Point): number {
		// angle in degrees between -180 and 180
		let angle = (Math.atan2(point.y, point.x) * 180) / Math.PI;

		if (angle < 0) {
			angle = 360 + angle;
		}

		return angle;
	}

	static calcAngleRad(point: Point): number {
		let angle = Math.atan2(point.y, point.x); // [-PI, PI]

		if (angle < 0) {
			angle = 2 * Math.PI + angle;
		}

		return angle;
	}


	static deg2rad(angleDeg: number): number {
		const rad = (Math.PI / 180) * angleDeg;
		return rad;
	}
	  
	static rad2deg(angleRad: number): number {
		const deg = angleRad / (Math.PI / 180);
		return deg;
	}

}