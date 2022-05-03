import { Coord } from "./coord.class";

export class Rectangle {
    left: number;
    top: number;
    width: number;
    height: number;
    constructor(p1: Coord, p2: Coord) {
        this.left = Math.floor(p1.col);
        this.top = Math.floor(p1.row);
        this.width = Math.floor(p2.col - p1.col);
        this.height = Math.floor(p2.row - p1.row);
    }
}