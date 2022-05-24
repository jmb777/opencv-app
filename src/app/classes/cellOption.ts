export class CellOption {
  values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  cellNumber: number;
  uniqueValue: number = null;
  isSelected?: boolean;
  killerBorderTop?: boolean;
  killerBorderBottom?: boolean;
  killerBorderLeft?: boolean;
  killerBorderRight?: boolean;
  killerNumber?: number;
  killerBackground?: string;
  constructor(
    values?: number[],
    cellNumber?: number
  ) {
    this.values = values || [1, 2, 3, 4, 5, 6, 7, 8, 9];
    this.cellNumber = cellNumber || 0;
    this.uniqueValue = null;
    this.isSelected = false;
    this.killerNumber = null;
    this.killerBackground = '#FFFFFF';
  }
}