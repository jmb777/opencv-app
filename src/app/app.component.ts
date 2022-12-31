import { Component, OnInit, ViewChild, AfterViewInit, ElementRef, Input } from '@angular/core';
import { NgOpenCVService, OpenCVLoadResult } from 'ng-open-cv';
import { tap, switchMap, filter, map } from 'rxjs/operators';
import { forkJoin, Observable, empty, fromEvent, BehaviorSubject, observable } from 'rxjs';
import { Line } from './line';
// import { CloneVisitor } from '@angular/compiler/src/i18n/i18n_ast';
import { Coord } from './coord.class';
import { createWorker } from 'tesseract.js';
import { Rectangle } from './rectangle';
import * as Tesseract from 'tesseract.js';
// import { FormsModule } from '@angular/forms';
// import { CellComponent } from './cell/cell.component';
import { CellOption } from './classes/cellOption';
import { GridAlignColumnsDirective } from '@angular/flex-layout';
// import { Killer } from './classes/killer';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'opencv-app';

  private classifiersLoaded = new BehaviorSubject<boolean>(false);
  classifiersLoaded$ = this.classifiersLoaded.asObservable();

  imageUrl = 'assets/images/IMG_3351.png';
  // HTML Element references
  @ViewChild('fileInput')
  fileInput: ElementRef;
  @ViewChild('canvasInput')
  canvasInput: ElementRef;
  @ViewChild('canvasOutput') canvasOutput: ElementRef;
  @ViewChild('canvasTest') canvasTest: ElementRef;
  ocrResult: any;
  data: boolean[][] = [];
  @Input() selRow = 0;
  @Input() selCol = 0;
  grid: Coord[][] = [];
  @ViewChild('elOutput') elOutput: ElementRef;
  ocrOutput: string;
  gridContents: CellOption[] = [];
  rows = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  // killerPuzzle: CellOption[][] = [];

  showGrid = false;
  // streaming = false;
  // mainView = true;
  cameraView = false;
  @ViewChild('canvasVideo') canvasVideo: ElementRef;
  @ViewChild('canvasVideoRaw') canvasVideoRaw: ElementRef;
  video: HTMLVideoElement = document.getElementById('videoInput') as HTMLVideoElement;
  localStream: MediaStream;
  // cameraText = '';
  videoRunning = false;
  gridFound = false;
  // recognitionComplete = false;
  // attemptNumber = 0;
  txt = '';
  // canvasInputWidth: any;
  videoElementHidden = true;
  canvasInputHidden = true;
  detectedSquareSize: number;
  logText = '';
  // videoId = '';
  // videoCapture: any;

  constructor(private ngOpenCVService: NgOpenCVService) { }
  ngOnInit() {


    this.gridContents = [];

    for (let index = 0; index < 81; index++) {
      this.gridContents.push(new CellOption([1, 2, 3, 4, 5, 6, 7, 8, 9], index));

    }



  }

  ngAfterViewInit(): void {
    // Here we just load our example image to the canvas
    this.ngOpenCVService.isReady$
      .pipe(
        filter((result: OpenCVLoadResult) => result.ready),
        tap((result: OpenCVLoadResult) => {
          this.ngOpenCVService.loadImageToHTMLCanvas(this.imageUrl, this.canvasInput.nativeElement).subscribe();
          // this.videoCapture = new cv.VideoCapture(document.getElementById('videoInput'));
        })
      )
      .subscribe(() => { });
  }

  openFile() {
    this.videoRunning = false;
    this.localStream.getTracks().forEach(track => track.stop());
    this.videoElementHidden = true;
    console.log('button clicked');
    document.getElementById('fileInput').click();
  }

  readDataUrl(event: any) {

    if (event.target.files.length) {
      this.showGrid = false;
      const reader = new FileReader();
      const load$ = fromEvent(reader, 'load');
      let cv1 = cv;
      load$
        .pipe(


          switchMap(() => {

            let txt = `${reader.result}`;
            let img = new Image();
            img.src = txt;
            console.log(img.width);

            return this.loadImageToHTMLCanvas(txt, this.canvasInput.nativeElement);
          })

        )
        .subscribe({
          next: () => { },
          error: err => {
            console.log('Error loading image', err);
          },
          complete: () => { }
        }


        );

      this.ocrResult = 'Loading file';
      reader.readAsDataURL(event.target.files[0]);



    }
  }

  loadImageToHTMLCanvas(imageUrl: string, canvas: HTMLCanvasElement): Observable<any> {
    return new Observable(observer => {
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        console.log(`Image resizing ${img.width}`);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let h = 400;
        let w = img.width * h / img.height;




        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        this.canvasInputHidden = false;
        await this.showEl('grid');
        observer.next();

        observer.complete();
      };
      img.src = imageUrl;
      this.ocrResult = 'Finding grid';
    });
  }

  // canvasInputChange() {
  //   console.log('Canvas event');

  // }

  test() {
    let src = cv.imread('canvasInput');
    let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
    let lines = new cv.Mat();
    let color = new cv.Scalar(255, 0, 0, 255);
    let anchor = new cv.Point(-1, -1);
    let M = cv.Mat.ones(2, 2, cv.CV_8U);
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    // cv.threshold(dst, dst, 50 , 255, cv.THRESH_OTSU)
    // cv.medianBlur(dst, dst, 5);
    // const adapt_type = cv.ADAPTIVE_THRESH_GAUSSIAN_C
    // const thresh_type = cv.THRESH_BINARY_INV
    // cv.adaptiveThreshold(dst, dst, 255, adapt_type, thresh_type, 11, 2)

    cv.Canny(src, src, 50, 200, 3);
    cv.dilate(src, src, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    // You can try more different parameters
    // cv.HoughLinesP(src, lines, 1, Math.PI / 180, 2,0,0);
    // draw lines
    for (let i = 0; i < lines.rows; ++i) {
      let rho = lines.data32F[i * 2];
      let theta = lines.data32F[i * 2 + 1];
      let a = Math.cos(theta);
      let b = Math.sin(theta);
      let x0 = a * rho;
      let y0 = b * rho;
      // let startPoint = {x: x0 - 1000 * b, y: y0 + 1000 * a};
      // let endPoint = {x: x0 + 1000 * b, y: y0 - 1000 * a};
      // let startPoint = new cv.Point(lines.data32S[i * 4], lines.data32S[i * 4?
      let startPoint = new cv.Point(lines.data32S[i * 4], lines.data32S[i * 4 + 1]);
      let endPoint = new cv.Point(lines.data32S[i * 4 + 2], lines.data32S[i * 4 + 3]);
      // cv.line(dst, startPoint, endPoint, color);
      cv.circle(dst, startPoint, 1, color, -1);
    }
    // cv.dilate(dst, dst, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    // let x = this.getMask(10, 1, 'tr');
    
    this.detectCorners(src, dst, 75, 20, 10);
    cv.imshow('canvasTest', dst);
    src.delete(); dst.delete(); lines.delete();

  }
  findCorner(srcMat: any, shortLength: number, longLength: number, width: number, sensitivity: number, location: string) {
    const left = (location.substring(1, 2) == 'l') ? true : false;
    const top = (location.substring(0, 1) == 't') ? true : false;

    for (let i = shortLength; i < srcMat.rows - shortLength + 1; i++) {
      for (let j = shortLength; j < srcMat.cols - shortLength + 1; j++) {
        let counter = 0;
        if (top) {
          for (let col = j - width; col < j + width + 1; col++) {
            for (let row = i - shortLength; row < i + 1; row++) {
              if (srcMat.ucharAt(row, col * srcMat.channels()) == 0) { counter++; }
            }
            for (let row = i; row < i + longLength + 1; row++) {
              if (srcMat.ucharAt(row, col * srcMat.channels()) > 0) { counter++; }
            }
          }

        } else {
          for (let col = j - width; col < j + width + 1; col++) {
            for (let row = i - longLength; row < i + 1; row++) {
              if (srcMat.ucharAt(row, col * srcMat.channels()) > 0) { counter++; }
            }
            for (let row = i; row < i + shortLength + 1; row++) {
              if (srcMat.ucharAt(row, col * srcMat.channels()) == 0) { counter++; }
            }
          }

        }
        if (left) {
          for (let row = i - width; row < i + width + 1; row++) {
            for (let col = j - shortLength; col < j; col++) {
              if (srcMat.ucharAt(row, col * srcMat.channels()) == 0) { counter++; }
            }
            for (let col = j; col < j + longLength + 1; col++) {
              if (srcMat.ucharAt(row, col * srcMat.channels()) > 0) { counter++; }
            }
          }
        } else {
          for (let row = i - width; row < i + width + 1; row++) {
            for (let col = j - longLength; col < j; col++) {
              if (srcMat.ucharAt(row, col * srcMat.channels()) > 0) { counter++; }
            }
            for (let col = j; col < j + shortLength + 1; col++) {
              if (srcMat.ucharAt(row, col * srcMat.channels()) == 0) { counter++; }
            }
          }
        }
        if (counter > (2 * width + 1) * (shortLength + longLength + 1) * sensitivity) {
          console.log(`${location} corner found at row ${i} column ${j}`);
        }
      }
    }

  }
  getMask(length: number, thickness: number, location: string) {
    const dim = length * 2 + 1;
    const xoff = (location.substring(1, 2) == 'l') ? length : 0;
    const yoff = (location.substring(0, 1) == 't') ? length : 0;

    let M = cv.Mat.zeros(dim, dim, cv.CV_8U);

    for (let i = yoff; i < yoff + length + 1; i++) {
      for (let j = length - thickness; j < length + 1 + thickness; j++) {

        M.data[i * M.rows + j] = 255;
      }
    }
    for (let j = xoff; j < xoff + length + 1; j++) {
      for (let i = length - thickness; i < length + 1 + thickness; i++) {

        M.data[i * M.rows + j] = 255;
      }
    }

    return M;
  }

  findContours(): boolean {

    let src = cv.imread(this.canvasInput.nativeElement.id);
    let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
    let dst1 = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);


    let lines = new cv.Mat();
    let color = new cv.Scalar(255, 255, 255);


    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);

    let contours = new cv.MatVector();

    let anchor = new cv.Point(-1, -1);
    let M = cv.Mat.ones(4, 4, cv.CV_8U);
    cv.Canny(dst, dst, 50, 100, 3, true);


    cv.dilate(dst, dst, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());

    // const rho = 2;
    // const theta = Math.PI/180;
    // const thresh =  400;
    // lines = cv.HoughLines(dst, rho, theta, thresh);
    cv.imshow(this.canvasTest.nativeElement.id, dst);


    cv.imshow(this.canvasOutput.nativeElement.id, src);
    this.grid = this.detectCorners(dst, src, 75, 20, 10);




    if (this.grid.length == 0) {
      return false;
    }
    return true;

  }

  detectCorners(srcData: any, outData: any, length: number, width: number, sensitivity: number) {
    let coords: Coord[][] = [];
    let topLeftCoords: Coord[] = [];
    let topRightCoords: Coord[] = [];
    let bottomLeftCoords: Coord[] = [];
    let bottomRightCoords: Coord[] = [];
    if (width % 2 == 0) { width++ }
    const offset = Math.floor(width / 2);
    let color = new cv.Scalar(255, 0, 0, 255);
    let color1 = new cv.Scalar(255, 255, 0, 255);



    for (let i = 0; i < srcData.rows; i++) {

      this.data[i] = [];

      for (let j = 0; j < srcData.cols; j++) {

        this.data[i][j] = (srcData.ucharAt(i, j * srcData.channels() + 1) > 0) ? true : false;

      }
    }



    for (let i = 10; i < srcData.rows - 10; i++) {
      for (let j = 10; j < srcData.cols - 10; j++) {

        let longRight = this.linePresent(this.data, i, j, length, sensitivity, 'right');
        let longLeft = this.linePresent(this.data, i, j, length, sensitivity, 'left');
        let longUp = this.linePresent(this.data, i, j, length, sensitivity, 'up');
        let longDown = this.linePresent(this.data, i, j, length, sensitivity, 'down');
        let shortLeft = (longLeft) ? longLeft : this.linePresent(this.data, i, j, sensitivity, sensitivity, 'left');
        let shortRight = (longRight) ? longRight : this.linePresent(this.data, i, j, sensitivity, sensitivity, 'right');
        let shortUp = (longUp) ? longUp : this.linePresent(this.data, i, j, sensitivity, sensitivity, 'up');
        let shortDown = (longDown) ? longDown : this.linePresent(this.data, i, j, sensitivity, sensitivity, 'down');


        if (longRight && longDown && !shortLeft && !shortUp) {

          topLeftCoords.push(new Coord(i, j));
          console.log('Top left found');
          let p = new cv.Point(i,j);
          cv.circle(outData,p, 2, color, -1);
          // console.log('Top left' + (longRight && longDown && !shortLeft && !shortUp));
          // console.log('long left ' + this.linePresent(this.data, i, j, length, sensitivity, 'left'));
        }
        if (longLeft && longDown && !shortRight && !shortUp) {

          topRightCoords.push(new Coord(i, j));
          console.log('Top right found');
          let p = new cv.Point(i,j);
          cv.circle(outData,p, 2, color1, -1);
        }

        if (longLeft && longUp && !shortRight && !shortDown) {

          bottomRightCoords.push(new Coord(i, j));
          console.log('Bottom right found');
        }
        if (longRight && longUp && !shortLeft && !shortDown) {

          bottomLeftCoords.push(new Coord(i, j));
          console.log('Bottom left found');
        }

      }
    }

    let points: Coord[] = this.findSquare(topLeftCoords, topRightCoords, bottomLeftCoords, bottomRightCoords, 10);
    if (points.length == 4) {

      for (let i = 0; i < 10; i++) {
        coords[i] = [];
        for (let j = 0; j < 10; j++) {
          coords[i][j] = new Coord(0, 0);
        }
      }
      this.findROIs(points, coords);
      let p0 = new cv.Point(points[0].col, points[0].row);
      let p1 = new cv.Point(points[1].col, points[1].row);
      let p2 = new cv.Point(points[2].col, points[2].row);
      let p3 = new cv.Point(points[3].col, points[3].row);

      let color = new cv.Scalar(255, 0, 255);
      // cv.line(outData, p0, p1, color);
      // cv.line(outData, p2, p3, color);
      // cv.line(outData, p0, p2, color);
      // cv.line(outData, p1, p3, color);
      let color1 = new cv.Scalar(255, 0, 0);
      for (let row = 0; row < coords.length - 1; row++) {
        for (let col = 0; col < coords.length - 1; col++) {
          let pt = new cv.Point(Math.floor(coords[row][col].col), Math.floor(coords[row][col].row));
          let pb = new cv.Point(Math.floor(coords[row + 1][col + 1].col), Math.floor(coords[row + 1][col + 1].row));
          // cv.rectangle(srcData, pt, pb, color1);
        }
      }


    }



    return coords;

  }
  findROIs(points: Coord[], coords: Coord[][]) {
    let width = (points[1].col - points[0].col) / 9;
    let row0 = points[0].row;
    let col0 = points[0].col;
    let grad = (points[1].row - points[0].row) / 9;
    for (let col = 0; col < 10; col++) {
      coords[0][col].row = row0 + col * grad;
      coords[0][col].col = col0 + col * width;
    }
    width = (points[3].col - points[2].col) / 9;
    row0 = points[2].row;
    col0 = points[2].col;
    grad = (points[3].row - points[2].row) / 9;
    for (let col = 0; col < 10; col++) {
      coords[9][col].row = row0 + col * grad;
      coords[9][col].col = col0 + col * width;
    }
    for (let col = 0; col < 10; col++) {
      let row0 = coords[0][col].row;
      let col0 = coords[0][col].col;
      let grad = (coords[9][col].col - coords[0][col].col) / 9;
      let height = (coords[9][col].row - coords[0][col].row) / 9;
      for (let row = 1; row < 9; row++) {
        coords[row][col].row = row0 + row * height;
        coords[row][col].col = col0 + row * grad;

      }

    }
  }

  linePresent(data: boolean[][], row: number, col: number, length: number, width: number, dir: string): boolean {
    let linePresent = true;
    let count = 0;
    const offset = Math.floor(width / 2);
    switch (dir) {
      case 'up':
      case 'down':

        while (linePresent && Math.abs(count) < length + 1) {
          linePresent = false;
          for (let c = this.checkRange(col - offset, data[row].length - 1); c < this.checkRange(col + offset + 1, data[row].length - 1); c++) {
            if (data[this.checkRange(row + count, data.length - 1)][c]) {
              linePresent = true;
            }
          }
          if (dir == 'down') { count++; } else { count--; };
        }
        if (linePresent) {
          let color1 = new cv.Scalar(255, 0, 0);
          let p0 = new cv.Point(col, row + count);
          let p1 = new cv.Point(col, row);
          // console.log(`Vertical line at row ${row}, col ${col}: length ${count} `)
        }

        break;


      case 'right':
      case 'left':
        while (linePresent && Math.abs(count) < length + 1) {
          linePresent = false;
          for (let r = this.checkRange(row - offset, data.length - 1); r < this.checkRange(row + offset + 1, data.length - 1); r++) {
            if (data[r][this.checkRange(col + count, data[row].length - 1)]) { linePresent = true; }
          }
          if (dir == 'right') { count++; } else { count--; };
        }
        if (linePresent) {
          let color1 = new cv.Scalar(255, 0, 0);
          let p0 = new cv.Point(col, row + count);
          let p1 = new cv.Point(col, row);
          // console.log(`Horizontal line at row ${row}, col ${col}: length ${count} `)
        }
        break;





      default:
        break;
    }

    return linePresent;

  }
  checkRange(n: number, max: number) {
    if (n < 0) { n = 0; }
    return (n > max) ? max : n;
  }
  findSquare(topLeftCoords: Coord[], topRightCoords: Coord[], bottomLeftCoords: Coord[], bottomRightCoords: Coord[], sensitivity: number): Coord[] {
    if (topLeftCoords.length == 0 || topRightCoords.length == 0 || bottomLeftCoords.length == 0 || bottomRightCoords.length == 0) {
      return [];
    }
    let topLeftGrouped: Coord[] = this.groupCoords(topLeftCoords, sensitivity);
    let topRightGrouped: Coord[] = this.groupCoords(topRightCoords, sensitivity);
    let bottomLeftGrouped: Coord[] = this.groupCoords(bottomLeftCoords, sensitivity);
    let bottomRightGrouped: Coord[] = this.groupCoords(bottomRightCoords, sensitivity);
    let topLines: Line[] = this.findLines(topLeftGrouped, topRightGrouped, sensitivity, 'horiz');
    let bottomLines: Line[] = this.findLines(bottomLeftGrouped, bottomRightGrouped, sensitivity, 'horiz');
    let leftLines: Line[] = this.findLines(topLeftGrouped, bottomLeftGrouped, sensitivity, 'vert');
    let rightLines: Line[] = this.findLines(topRightGrouped, bottomRightGrouped, sensitivity, 'vert');
    let squareExists = 0;
    let topLeft: Coord;
    let topRight: Coord;
    let bottomLeft: Coord;
    let bottomRight: Coord;
    topLines.forEach(a => {
      bottomLines.forEach(b => {
        leftLines.forEach(c => {
          rightLines.forEach(d => {
            if (Math.abs(a.length() - b.length()) < 2 * sensitivity
              && Math.abs(c.length() - d.length()) < 2 * sensitivity
              && Math.abs(a.length() - d.length()) < 2 * sensitivity) {
              squareExists++;
              topLeft = a.p1;
              topRight = a.p2;
              bottomLeft = b.p1;
              bottomRight = b.p2;
            }
          });
        });
      });
    });
    if (squareExists == 1) {
      console.log(topLeft.row - bottomLeft.row)
      this.detectedSquareSize = bottomLeft.row - topLeft.row;
      this.logText = `Top left: ${topLeft.row}, ${topLeft.col} Bottom right: ${bottomRight.row}, ${bottomRight.col}`;
      return [topLeft, topRight, bottomLeft, bottomRight];
    } else {
      return [];
    }
  }
  findLines(list1: Coord[], list2: Coord[], sensitivity: number, dir: string): Line[] {
    let list: Line[] = [];
    list1.forEach(c => {
      list2.forEach(d => {

        switch (dir) {
          case 'horiz':
            if (Math.abs(c.row - d.row) < sensitivity) { list.push(new Line(c, d)) }
            break;

          case 'vert':
            if (Math.abs(c.col - d.col) < sensitivity) { list.push(new Line(c, d)) }
            break;

          default:
            break;
        }

      });
    });
    return list;
  }
  groupCoords(coords: Coord[], sensitivity: number): Coord[] {
    let list: Coord[] = [];
    coords.sort((a, b) => {
      return (a.row - b.row > 0) ? 1 : (a.row = b.row) ? 0 : -1;
    });
    let rowSum = coords[0].row;
    let colSum = coords[0].col;
    let count = 1;
    let lastRow = coords[0].row;
    let lastCol = coords[0].col;
    for (let i = 1; i < coords.length; i++) {
      if (Math.abs(coords[i].row - lastRow) < sensitivity && Math.abs(coords[i].col - lastCol) < sensitivity) {
        rowSum = rowSum + coords[i].row;
        colSum = colSum + coords[i].col;
        count++;
      } else {
        list.push(new Coord(Math.floor(rowSum / count), Math.floor(colSum / count)));
        count = 1;
        rowSum = coords[i].row;
        lastRow = coords[i].row;
        colSum = coords[i].col;
        lastCol = coords[i].col;
      }
    }
    list.push(new Coord(Math.floor(rowSum / count), Math.floor(colSum / count)));
    return list;
  }
  checkMinus(n: number): number {
    return (n < 0) ? 0 : n;
  }



  async doOCR(scope) {
    this.gridContents = [];
    for (let index = 0; index < 81; index++) {
      this.gridContents.push(new CellOption([1, 2, 3, 4, 5, 6, 7, 8, 9], index));

    }


    const worker = createWorker({
      // logger: m => console.log(m),
    });

    await worker.load();
    await worker.loadLanguage('eng');

    await worker.initialize('eng');
    await worker.setParameters({
      tessedit_char_whitelist: '123456789'
    });
    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_CHAR
    });

    if (scope == 'grid') {
      let chars: string[] = [];
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          let img = this.getElementData(row, col);
          if (img) {
            try {
              let { data: { text, confidence, symbols } } = await worker.recognize(img);
              this.txt = 'after recognise';
              symbols.sort((s1, s2) => s2.confidence - s1.confidence);
              text = symbols[0].text;
              chars.push(text);
            } catch (error) {
              chars.push('');
            }



          }
          else {
            chars.push('');
          }

        }
      }

      chars.forEach((value, index) => {
        if (value !== '') {
          this.gridContents[index].values = [Number(value)];
          this.gridContents[index].uniqueValue = Number(value);
        }

      });
    }

    if (scope == 'cell') {
      if (this.getElementData(this.selRow, this.selCol)) {
        let { data: { text, confidence, symbols } } = await worker.recognize(this.getElementData(this.selRow, this.selCol));


        symbols.sort((s1, s2) => s2.confidence - s1.confidence);
        text = symbols[0].text;
        this.gridContents[Number(this.selRow * 9) + Number(this.selCol)].values = [Number(text)];
        this.gridContents[Number(this.selRow * 9) + Number(this.selCol)].uniqueValue = Number(text);



      }


    }

    this.showGrid = true;
    this.ocrResult = 'Analysis complete';

    await worker.terminate();



  }
  imgInfo(dst: any) {
    let midRow = Math.floor(dst.rows / 2);

    let max = dst.ucharAt(midRow, Math.floor(dst.cols / 10) * dst.channels());
    let min = dst.ucharAt(midRow, Math.floor(dst.cols / 10) * dst.channels());;

    for (let col = Math.floor(dst.cols / 10); col < dst.cols - Math.floor(dst.cols / 10); col++) {

      if (dst.ucharAt(midRow, col * dst.channels()) > max) { max = dst.ucharAt(midRow, col * dst.channels()); }
      if (dst.ucharAt(midRow, col * dst.channels()) < min) { min = dst.ucharAt(midRow, col * dst.channels()); }
    }

    return ((max - min) > 50);
  }


  getElementData(row: number, col: number) {
    try {
      let src = cv.imread('canvasOutput');
      let dst = new cv.Mat();
      let r = new Rectangle(this.grid[row][col], this.grid[Number(row) + 1][Number(col) + 1]);
      let rect = new cv.Rect(r.left + 3, r.top + 3, r.width - 6, r.height - 6);
      dst = src.roi(rect);
      if (this.imgInfo(dst)) {

        let canvas = <HTMLCanvasElement>document.getElementById('elOutput');
        cv.imshow(this.elOutput.nativeElement.id, dst);

        return canvas.toDataURL('image/png');
      } else {
        return null;
      };
    } catch (error) {
      return null;
    }





  }

  backgroundColour(i, j) {
    const iEven = ((Math.floor(i / 3) + 1) % 2 == 0) ? true : false;
    const jEven = ((Math.floor(j / 3) + 1) % 2 == 0) ? true : false;
    if (iEven == jEven) {
      return 'silver';
    } else {
      return 'white';
    }


  }
  async showEl(scope) {
    try {
      if (!this.findContours()) {
        this.ocrResult = 'Unable to detect grid';
        return;
      } else {
        this.ocrResult = 'Grid found....    Analysing content';
      }
    } catch (error) {
      this.ocrResult = 'Unable to detect grid';
      return;
    }


    try {

      await this.doOCR(scope);

    } catch (error) {
      console.log(error);
    }


  }



  scanInputCanvas() {
    let findContours = this.findContours();
    function scan() {
      if (findContours) {
        return;
      } else {
        setTimeout(scan, 10);
      }
    }
    setTimeout(scan, 0);
  }

  startVideo(action: boolean) {

    if (this.videoRunning) {

      this.videoRunning = false;
      this.localStream.getTracks().forEach(track => track.stop());
      this.videoElementHidden = true;

      document.getElementById('videoBtn').innerText = 'Scan puzzle';

      return;
    }

    document.getElementById('videoBtn').innerText = 'Cancel';
    this.ocrResult = 'Align grid with rectangle';
    this.showGrid = false;
    this.canvasInputHidden = true;
    this.videoElementHidden = false;


    let video = document.getElementById('videoInput') as HTMLVideoElement;

    var ref = this;
    this.videoRunning = true;
    const videoConstraints = {
      facingMode: 'environment',
      width: 320
    };
    navigator.mediaDevices.enumerateDevices().then(
      devices => devices.forEach(d => console.log(d.label))
    );
    navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false })
      .then(async function (stream) {

        ref.localStream = stream;

        video.srcObject = stream;

        console.log(stream.id);

        await video.play();

        video.height = video.videoHeight;
        video.width = video.videoWidth;
        let canvas = document.getElementById('canvasVideo') as HTMLCanvasElement;
        canvas.height = video.height;
        canvas.width = video.width;
        let ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const squareSize = (video.height > video.width) ? video.width - 40 : video.height - 40;
        ctx.beginPath();
        ctx.lineWidth = 6;
        ctx.strokeStyle = "red";
        console.log(`canvas height ${canvas.height}`);
        ctx.rect(Math.trunc((video.width - squareSize) / 2), Math.trunc((video.height - squareSize) / 2), squareSize, squareSize);
        ctx.stroke();

        canvas = document.getElementById('canvasInput') as HTMLCanvasElement;
        ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let srcMat = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);

        let cap = new cv.VideoCapture(video);




        canvas.width = video.width;
        canvas.height = video.height;




        async function processVideo() {
          if (!ref.videoRunning) { return; }

          cap.read(srcMat);


          cv.imshow('canvasInput', srcMat);
          let gridFound = ref.findContours();

          console.log(`Gridfound = ${gridFound}`);
          if (gridFound) {
            if (ref.detectedSquareSize > squareSize * 0.9) {

              ref.ocrOutput = 'Grid found....processing';
              try {
                await ref.doOCR('grid');
                ref.videoRunning = false;
                ref.videoElementHidden = true;

                document.getElementById('videoBtn').innerText = 'Scan puzzle';
                stream.getTracks().forEach(track => track.stop());
              } catch (error) {
                gridFound = false;
              }

            } else {
              gridFound = false;
            }


          }
          if (!gridFound) { setTimeout(processVideo, 10) };

        }

        setTimeout(processVideo, 0);




      });
  }

}