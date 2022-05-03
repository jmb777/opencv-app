import { Coord } from "./coord.class";

export class Line {
    p1: Coord;
    p2: Coord;
    constructor(p1: Coord, p2: Coord) {
        this.p1 = p1;
        this.p2 = p2;
    }

    length(): number {
        return Math.sqrt((this.p1.row - this.p2.row) ** 2 + (this.p1.col - this.p2.col) ** 2);
    }
    
}