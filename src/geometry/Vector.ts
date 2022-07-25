import { Point } from "./Point";
import { Direction } from "../input-consts";

/*
* important notice regarding the coordinate system on the screen:
* - origin is the top-left corner
* - downards from the origin on the y-axis are positive values
*/
export class Vector {
  public readonly vectorLength: number;

  public readonly startPoint: Point;
  public readonly endPoint: Point;

  public readonly direction: string;

  public readonly deltaX: number;
  public readonly deltaY: number;

  public readonly x: number;
  public readonly y: number;

  // vector between 2 points: START(x,y) and END(x,y)
  public constructor(startPoint: Point, endPoint: Point) {
    this.startPoint = startPoint;
    this.endPoint = endPoint;

    this.direction = Direction.None;

    this.deltaX = this.endPoint.x - this.startPoint.x;
    this.deltaY = this.endPoint.y - this.startPoint.y;

    this.x = this.deltaX;
    this.y = this.deltaY;

    // determine length
    this.vectorLength = Math.sqrt(
      Math.pow(this.deltaX, 2) + Math.pow(this.deltaY, 2)
    );

    // determine direction
    if (Math.abs(this.deltaX) > Math.abs(this.deltaY)) {
      // left or right
      if (this.startPoint.x < this.endPoint.x) {
        this.direction = Direction.Right;
      } else if (this.startPoint.x > this.endPoint.x) {
        this.direction = Direction.Left;
      }
    } else {
      // up or down
      if (this.startPoint.y < this.endPoint.y) {
        this.direction = Direction.Down;
      } else if (this.startPoint.y > this.endPoint.y) {
        this.direction = Direction.Up;
      }
    }
  }
}