import { CellOption } from './cellOption';
export class Killer {

    possibleNumbers: number[] = [];
    possibleCombinations: number[][] = [];
    runningSun: number;
    combinationElements: number[][][] = [];
    combinationTotal: any[] = [];
    allPossibleCombinations: { total: number, elements: number, combinations: number[][] }[] = [];
    mustStop = false;
    letters: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    writeToGrid = false;
    hasChanged = false;
    backGroundColours = ['#00FFFF', '#00FF00', '#FFFF00', '#808080'];

    constructor() {

        for (let n = 3; n < 44; n++) {

            for (let i = 2; i < 9; i++) {
                this.possibleCombinations = [];
                this.findPossibleCombinations(n, i, [], 1);
                this.allPossibleCombinations.push({ total: n, elements: i, combinations: this.possibleCombinations });
            }


        }
    }
    test(killerPuzzle: CellOption[][]): boolean {
        this.hasChanged = false;
        this.findInsAndOuts(killerPuzzle, this.getRowIndices(0, 2));
        
        for (let i = 0; i < 9; i++) {
            this.findInsAndOuts(killerPuzzle, this.getBoxIndices(i));
        }

        for (let i = 0; i < 9; i++) {

            this.findInsAndOuts(killerPuzzle, this.getRowIndices(i, 1));

            this.findInsAndOuts(killerPuzzle, this.getColIndices(i, 1));
        }

        for (let i = 0; i < 8; i++) {

            this.findInsAndOuts(killerPuzzle, this.getRowIndices(0, i));

            this.findInsAndOuts(killerPuzzle, this.getColIndices(0, i));
        }


        for (const block of killerPuzzle) {
            this.checkCombinations1(block, block[0].killerNumber);
        }

        return this.hasChanged;

    }

    getRowIndices(n: number, rows: number): number[] {
        const indices = [];
        for (let row = 0; row < rows; row++) {
            for (let index = 0; index < 9; index++) {
                const e = n * 9 + index + row * 9;
                indices.push(e);

            }
        }

        return indices;
    }

    getColIndices(n: number, cols: number): number[] {
        const indices = [];
        for (let col = 0; col < cols; col++) {
            for (let index = 0; index < 9; index++) {
                const e = index * 9 + col + n;
                indices.push(e);

            }
        }

        return indices;
    }
    getBoxIndices(n: number): number[] {
        const indices: number[] = [];
        const row = Math.floor(n / 3);
        const col = n % 3;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                indices.push(row * 27 + r * 9 + col * 3 + c);
            }
        }
        return indices;
    }
    getCellFromIndex(killerPuzzle: CellOption[][], index: number): CellOption {
        let returnVal: CellOption = null;
        killerPuzzle.forEach(cells => {
            cells.forEach(cell => {
                if (cell.cellNumber === index) { returnVal = cell; }
            });
        });
        return returnVal;
    }
    findInsAndOuts(killerPuzzle: CellOption[][], blockIndices: number[]) {
        class Block {
            killerSum: number;

            cellsInBlock: CellOption[] = [];
            cellsOutBlock: CellOption[] = [];
            constructor(killerSum: number) {
                this.killerSum = Number(killerSum);

            }
        }

        let killerBlocks: Block[] = [];
        // console.log('Finding ins and outs from ' + this.getCoords(blockIndices[0])
            // + ' to ' + this.getCoords(blockIndices[blockIndices.length - 1]));
        killerPuzzle.forEach(killerCells => {
            const killerBlock = new Block(killerCells[0].killerNumber);
            let inBlock = 0;
            let outBlock = 0;
            killerCells.forEach(cell => {
                if (blockIndices.includes(cell.cellNumber)) {
                    inBlock++;
                    killerBlock.cellsInBlock.push(cell);
                } else {
                    outBlock++;
                    killerBlock.cellsOutBlock.push(cell);
                }
            });

            killerBlocks.push(killerBlock);
        });
        const allInBlocks: Block[] = killerBlocks.filter(v => v.cellsOutBlock.length === 0);
        const transgressingBlocks: Block[] = killerBlocks.filter(v => v.cellsInBlock.length > 0 && v.cellsOutBlock.length > 0);
        let killerTotalIn = 0;
        allInBlocks.forEach(v => killerTotalIn = killerTotalIn + v.killerSum);

        if (transgressingBlocks.length === 1) {
            this.checkCombinations1(transgressingBlocks[0].cellsInBlock, 45 * blockIndices.length / 9 - killerTotalIn);
            this.checkCombinations1(transgressingBlocks[0].cellsOutBlock, 
                transgressingBlocks[0].killerSum - ( 45 * blockIndices.length / 9 - killerTotalIn));
        }
        let killerTotalOut = 0;
        let cellsToCheck: CellOption[] = [];
        transgressingBlocks.forEach(v => killerTotalOut = killerTotalOut + v.killerSum);
        if (allInBlocks.length > 0) {
            // blockIndices.forEach(index => cellsToCheck.push(this.getCellFromIndex(killerPuzzle, index)));
            transgressingBlocks.forEach(cells => {
                cells.cellsInBlock.forEach(cell => {
                    cellsToCheck.push(cell);
                });
            });
            if (cellsToCheck.length < 6 && cellsToCheck.length > 0) { this.checkCombinations1(cellsToCheck, 45 * blockIndices.length / 9 - killerTotalIn); }
            // allInCells.forEach(cells => {
            //     cells.cellsInBlock.forEach(cell => {
            //         if (cellsToCheck.includes(cell)) { cellsToCheck.splice(cellsToCheck.indexOf(cell), 1); }
            //     });
            // });
            // if (cellsToCheck.length < 6) { this.checkCombinations1(cellsToCheck, 45 * blockIndices.length / 9 - killerTotalIn); }


        }

        cellsToCheck = [];
        if (transgressingBlocks.length > 0) {
            let total = 0;
            transgressingBlocks.forEach(cells => {
                cells.cellsOutBlock.forEach(cell => {
                    cellsToCheck.push(cell);
                    total = total + cells.killerSum;
                });
            });
            let areInSameBlock = false;
            const row = Math.floor(cellsToCheck[0].cellNumber / 9);
            const col = cellsToCheck[0].cellNumber % 9;
            const box = row * 3 + Math.floor(col / 3);
            if (cellsToCheck.every(cell => Math.floor(cell.cellNumber / 9) === row)) { areInSameBlock = true; }
            if (cellsToCheck.every(cell => cell.cellNumber % 9 === col)) { areInSameBlock = true; }
            if (cellsToCheck.every(
                cell =>
                    Math.floor(cell.cellNumber / 9) * 3 + Math.floor((cell.cellNumber % 9) / 3) === box)
            ) { areInSameBlock = true; }
            if (areInSameBlock || transgressingBlocks.length === 1) {
                // this.checkCombinations1(cellsToCheck, killerTotalIn + killerTotalOut - (45 * blockIndices.length / 9));
                // if (this.mustStop) { return; }
            }
        }


    }

    setCellValuesToCombination(cells: CellOption[]) {
        cells.forEach(c => {
            for (let i = c.values.length - 1; i >= 0; i--) {
                if (!this.possibleNumbers.includes(c.values[i])) {
                    c.values.splice(c.values.indexOf(c.values[i]), 1);
                }
            }

        });
    }
    findPossibleCombinations(total: number, length: number, used: number[], min: number): void {
        if (length === 0) {
            let sum = 0;
            used.forEach(v => sum = sum + v);
            if (sum === total) {
                // console.log('Sum...' + used);
                used.sort((i, j) => i > j ? 1 : -1);
                let found = false;
                this.possibleCombinations.forEach(comb => {
                    if (comb.every((v, i) => v === used[i])) { found = true; }
                });
                if (!found) {
                    const v = [...used];
                    this.possibleCombinations.push(v);
                }

                used.forEach(v => {
                    if (!this.possibleNumbers.includes(v)) {
                        this.possibleNumbers.push(v);
                    }
                });
            }

        } else {

            for (let i = min; i < 10; i++) {

                if (!used.includes(i)) {
                    used.push(i);
                    this.findPossibleCombinations(total, length - 1, used, i);
                    used.pop();
                }

            }
        }
    }
    checkCombinations(block: CellOption[]) {
        let runningSum = block[0].killerNumber;
        let isPossible = false;
        let selected: number[] = [];
        function isPossibleCombination(innerBlock: CellOption[], used: number[]) {
            if (innerBlock.length === 1) {

                if (innerBlock[0].values.includes(runningSum)) {
                    if (!used.includes(runningSum)) {
                        isPossible = true;

                    }
                }
            } else {
                for (const cell of block) {
                    for (let i = cell.values.length - 1; i >= 0; i--) {
                        const v = cell.values[i];
                        if (!used.includes(v)) {
                            runningSum = runningSum - v;
                            const cellPosition = block.indexOf(cell);
                            innerBlock.splice(cellPosition, 1);
                            used.push(v);
                            isPossibleCombination(innerBlock, used);
                            innerBlock.splice(cellPosition, 0, cell);
                            runningSum = runningSum + v;
                            used.pop();
                        }

                    }
                }
            }


        }
        for (const cell of block) {
            runningSum = block[0].killerNumber;

            for (let i = cell.values.length - 1; i >= 0; i--) {
                isPossible = false;
                const cellPosition = block.indexOf(cell);
                const v = cell.values[i];
                selected = [v];
                runningSum = runningSum - v;
                block.splice(cellPosition, 1);
                isPossibleCombination(block, selected);
                if (!isPossible) {
                    cell.values.splice(cell.values.indexOf(v), 1);
                }
                runningSum = runningSum + v;
                block.splice(cellPosition, 0, cell);
                isPossible = false;
            }


        }


    }
    getCombinations(total: number, n: number): number[][] {
        if (n === 1 ) {
            return [[total]];
        }
        const o = this.allPossibleCombinations.filter(c => c.total === Number(total) && c.elements === Number(n))[0];
        return o.combinations;
    }
    checkCombinations1(block: CellOption[], total: number) {
        this.possibleNumbers = [];
        this.possibleCombinations = [];
        // this.findPossibleCombinations(total, block.length, [], 1);
        this.possibleCombinations = this.getCombinations(total, block.length);
        const requiredNumbers: number[][] = [];
        block.forEach(b => requiredNumbers.push([]));

        this.possibleCombinations.forEach(combination => {
            this.setRequiredNumbers(block, requiredNumbers, combination, []);

        });

        this.setGridValues(block, requiredNumbers);
    }
    setRequiredNumbers(block: CellOption[], requiredNumbers: number[][], combination: number[], used: number[]) {
        if (combination.length === 1) {
            // let lastNumber = -1;
            // combination.forEach(v => {
            //     if (!used.includes(v)) { lastNumber = v; }
            // });
            if (block[used.length].values.includes(combination[0])) {
                used.push(combination[0]);
                for (let i = 0; i < used.length; i++) {
                    requiredNumbers[i].push(used[i]);
                }
                used.pop();

            }

        } else {
            const remainingCombination: number[] = [];
            combination.forEach(v => {
                if (!used.includes(v)) {
                    remainingCombination.push(v);
                }
            });
            for (const v of remainingCombination) {
                if (block[used.length].values.includes(v)) {
                    used.push(v);
                    const index = remainingCombination.indexOf(v);
                    remainingCombination.splice(index, 1);
                    this.setRequiredNumbers(block, requiredNumbers, remainingCombination, used);
                    used.pop();
                    remainingCombination.splice(index, 0, v);
                }
            }
        }
    }
    setGridValues(block: CellOption[], requiredNumbers: number[][]) {
        for (let i = block.length - 1; i >= 0; i--) {
            for (let j = block[i].values.length - 1; j >= 0; j--) {
                const v = block[i].values[j];
                if (!requiredNumbers[i].includes(v)) {
                    // if (this.writeToGrid) { block[i].values.splice(block[i].values.indexOf(v), 1); }
                    block[i].values.splice(block[i].values.indexOf(v), 1);
                    // console.log('Removing ' + v + ' from cell ' + this.getCoords(block[i].cellNumber));
                    // this.mustStop = true;
                    if (block[i].values.length === 1) { block[i].uniqueValue = block[i].values[0]; }
                    this.hasChanged = true;
                }
            }

        }
        if (this.mustStop) { this.writeToGrid = !this.writeToGrid; }
    }
    getCoords(n: number) {
        const row = Math.floor(n / 9);
        const col = n % 9 + 1;
        return this.letters[row] + col;
    }
    setColours(killerPuzzle: CellOption[][], gridContents: CellOption[]) {
        for (const cell of gridContents) {
            cell.killerBackground = '#FFFFFF';
        }
       

        for (let block of killerPuzzle) {
            const usedColours = [];
            const nextCells: CellOption[] = [];
            for (let cell of block) {

                if (this.getCell(cell.cellNumber, 'left', gridContents)) {
                    nextCells.push(this.getCell(cell.cellNumber, 'left', gridContents));
                }
                if (this.getCell(cell.cellNumber, 'right', gridContents)) {
                    nextCells.push(this.getCell(cell.cellNumber, 'right', gridContents));
                }
                if (this.getCell(cell.cellNumber, 'top', gridContents)) {
                    nextCells.push(this.getCell(cell.cellNumber, 'top', gridContents));
                }
                if (this.getCell(cell.cellNumber, 'bottom', gridContents)) {
                    nextCells.push(this.getCell(cell.cellNumber, 'bottom', gridContents));
                }
                for (const c of nextCells) {
                    if (c.killerBackground !== '#FFFFFF') {
                        if (!usedColours.includes(c.killerBackground)) { usedColours.push(c.killerBackground); }
                    }
                }

            }
            for (const colour of this.backGroundColours) {
                if (!usedColours.includes(colour)) {
                    for (const cell of block) {
                        cell.killerBackground = colour;
                       
                    }
                    break;
                }
            }
        }
    }
    getCell(cellNumber: number, side: string, gridContents: CellOption[]): CellOption {
        let cell: CellOption;
        switch (side) {
            case 'left':
                if (cellNumber % 9 === 0) {
                    cell = null;
                } else {
                    cell = gridContents[cellNumber - 1];
                }
                break;
            case 'right':
                if (cellNumber % 9 === 8) {
                    cell = null;
                } else {
                    cell = gridContents[cellNumber + 1];
                }
                break;
            case 'top':
                if (cellNumber < 9) {
                    cell = null;
                } else {
                    cell = gridContents[cellNumber - 9];
                }
                break;
            case 'bottom':
                if (cellNumber > 72) {
                    cell = null;
                } else {
                    cell = gridContents[cellNumber + 9];
                }
                break;

                break;
        }
        return cell;
    }
}
