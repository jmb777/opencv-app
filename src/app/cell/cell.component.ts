import { Component, OnInit, Input, Output, EventEmitter, OnChanges, ViewChild, ElementRef } from '@angular/core';
import { CellOption } from '../classes/cellOption';

@Component({
  selector: 'app-cell',
  templateUrl: './cell.component.html',
  styleUrls: ['./cell.component.css']
})
export class CellComponent implements OnInit, OnChanges {
  @ViewChild('box',  {static: false}) inputElement: ElementRef;
  @Input() cellOption: CellOption;
  @Input() killerInput: boolean;
  @Input() killerBorders: {};
  @Output() newValue: EventEmitter<{ key, value }> = new EventEmitter();
  topBorder: boolean;
  bottomBorder: boolean;
  rightBorder: boolean;
  leftBorder: boolean;
  gridBorder: true;
  borderClasses = {};
  isSelected = true;
  selectionClasses = {};


  boxValue: number;
  @Output() cellSelected: EventEmitter<CellOption> = new EventEmitter();
  constructor() { }

  ngOnChanges() {
    // this.selectionClasses = {
    //   isSelected: this.isSelected
    // };
  }
  ngOnInit() {
    const row = Math.floor(this.cellOption.cellNumber / 9);
    const col = this.cellOption.cellNumber % 9;
    this.topBorder = (row % 3 === 0) ? true : false;
    this.bottomBorder = (row === 8) ? true : false;
    this.leftBorder = (col % 3 === 0) ? true : false;
    this.rightBorder = (col === 8) ? true : false;
    this.borderClasses = {
      gridBorder: true,
      topBorder: this.topBorder,
      bottomBorder: this.bottomBorder,
      leftBorder: this.leftBorder,
      rightBorder: this.rightBorder

    };

    this.selectionClasses = {
      isSelected: this.cellOption.isSelected
    };


    if (this.cellOption.values.length === 1) {
      this.cellOption.uniqueValue = this.cellOption.values[0];
    } else {
      this.cellOption.uniqueValue = null;
    }

  }



  showOptionValues() {
    let x = '';
    this.cellOption.values.forEach(e => {
      x = x + e;
    });
    return x;
  }

  setValue(v) {
    console.log(v);
    let x: number[] = [];
    if (v === '') {
      x = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    } else {
      x.push(Number(v));
    }
    this.newValue.emit({ key: this.cellOption.cellNumber, value: x });
  }

  selectCell() {
    // if (this.killerInput) {
    //   this.isSelected = !this.isSelected;
    //   this.selectionClasses = {
    //     isSelected: this.isSelected
    //   };
    // }
    this.cellSelected.emit(this.cellOption);
  }

  setKillerBorders() {
    return {isSelected: this.cellOption.isSelected,
    killerBorderRight: this.cellOption.killerBorderRight,
    killerBorderLeft: this.cellOption.killerBorderLeft,
    killerBorderTop: this.cellOption.killerBorderTop,
    killerBorderBottom: this.cellOption.killerBorderBottom,
  }
  
  }

}
