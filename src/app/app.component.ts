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
import { PointJoin } from './classes/pointJoin';
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
    let canvas1 = document.getElementById('canvasTest') as HTMLCanvasElement;

    let ctx1 = canvas1.getContext('2d');
    ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
    canvas1 = document.getElementById('canvasTest1') as HTMLCanvasElement;

    ctx1 = canvas1.getContext('2d');
    ctx1.clearRect(0, 0, canvas1.width, canvas1.height);

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
      img.onload = () => {
        console.log(`Image resizing ${img.width}`);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let h = 400;
        let w = img.width * h / img.height;




        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        // this.canvasInputHidden = false;

        // await this.showEl('grid');
        observer.next();


        observer.complete();
      };
      img.src = imageUrl;

      // this.ocrResult = 'Finding grid';
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
    let color1 = new cv.Scalar(255, 255, 0, 255);
    let anchor = new cv.Point(-1, -1);
    let M = cv.Mat.ones(3, 3, cv.CV_8U);
    let startTime = Date.now();
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    cv.Canny(src, src, 50, 200, 3);
    cv.dilate(src, src, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    // cv.erode(src, src, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    // cv.dilate(src, src, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    // cv.erode(src, src, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    // cv.dilate(src, src, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    // cv.erode(src, src, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    // cv.dilate(src, src, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    // cv.erode(src, src, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    // cv.dilate(src, src, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    // cv.erode(src, src, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    // cv.bitwise_not(src, src);
    // cv.adaptiveThreshold(src, src, 255, cv.ADAPTIVE_THRESH_MEAN_C,cv.THRESH_BINARY, 15, -2);
    // let horizSize = src.cols / 60;
    // let hoizontalStructure = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(horizSize, 1));
    // cv.erode(src, src, hoizontalStructure);
    // cv.dilate(src, src, hoizontalStructure);
    // horizSize = src.cols / 30;
    // hoizontalStructure = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(horizSize, 1));
    // cv.erode(src, src, hoizontalStructure);
    // cv.dilate(src, src, hoizontalStructure);
    // cv.threshold(src, src, 50 , 255, cv.THRESH_OTSU)
    // cv.medianBlur(src, src, 5);
    // const adapt_type = cv.ADAPTIVE_THRESH_GAUSSIAN_C
    // const thresh_type = cv.THRESH_BINARY_INV
    // cv.adaptiveThreshold(src, src, 255, adapt_type, thresh_type, 11, 2)

    // cv.Canny(src, src, 50, 200, 3);
    // cv.dilate(src, src, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    // You can try more different parameters

    // cv.erode(src, src, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    // cv.erode(src, src, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());


    // let x = this.getMask(10, 1, 'tr');
    dst = cv.imread('canvasInput');
    cv.HoughLinesP(src, lines, 2, Math.PI / 90, 200, 50, 1);
    // draw lines
    console.log(`HoughlinesP rows ${lines.rows}`);
    // let overlap: number[][] = [];
    // for (let i = 0; i < dst.cols; i++) {
    //   overlap[i] = [];
    //   for (let j = 0; j < dst.rows; j++) {
    //     overlap[i][j] = 0;
    //   }
    // }

    let horizLines: Line[] = [];
    let vertLines: Line[] = [];
    for (let i = 0; i < lines.rows; ++i) {
      // let rho = lines.data32F[i * 2];
      // let theta = lines.data32F[i * 2 + 1];
      // let a = Math.cos(theta);
      // let b = Math.sin(theta);
      // let x0 = a * rho;
      // let y0 = b * rho;
      // let startPoint = {x: x0 - 1000 * b, y: y0 + 1000 * a};
      // let endPoint = {x: x0 + 1000 * b, y: y0 - 1000 * a};
      // let startPoint = new cv.Point(lines.data32S[i * 4], lines.data32S[i * 4?

      let dx = lines.data32S[i * 4] - lines.data32S[i * 4 + 2];
      let dy = lines.data32S[i * 4 + 1] - lines.data32S[i * 4 + 3];
      let slope = Math.abs(dx / dy);
      let vert = Math.abs(Math.tan((Math.PI / 180) * 10));
      let horiz = Math.abs(Math.tan((Math.PI / 180) * 80));
      let startPoint = new cv.Point(lines.data32S[i * 4], lines.data32S[i * 4 + 1]);
      let endPoint = new cv.Point(lines.data32S[i * 4 + 2], lines.data32S[i * 4 + 3]);
      let row1 = lines.data32S[i * 4 + 1];
      let row2 = lines.data32S[i * 4 + 3];
      let col1 = lines.data32S[i * 4];
      let col2 = lines.data32S[i * 4 + 2];

      // cv.line(dst, startPoint, endPoint, color);
      if (slope < vert) {
        let l: Line = new Line(new Coord(lines.data32S[i * 4 + 1], lines.data32S[i * 4]),
          new Coord(lines.data32S[i * 4 + 3], lines.data32S[i * 4 + 2]));
        // cv.line(dst, startPoint, endPoint, color);
        vertLines.push(l);

        // cv.putText(dst,x,startPoint, cv.FONT_HERSHEY_TRIPLEX,1,  color,1, cv.LINE_AA);
        // cv.circle(dst, startPoint, 5, color, -1);
        // cv.circle(dst, endPoint, 1, color1, -1);
        // cv.circle(dst, startPoint, 1, color1, -1);
        // overlap[col1][row1]++;
        // overlap[col2][row2]++;
        // console.debug(`Vertical line ${i} slope ${slope} arctan ${vert}`);
      }
      if (slope > horiz) {
        // cv.line(dst, startPoint, endPoint, color1);
        let l: Line = new Line(new Coord(lines.data32S[i * 4 + 1], lines.data32S[i * 4]),
          new Coord(lines.data32S[i * 4 + 3], lines.data32S[i * 4 + 2]));
        horizLines.push(l);
        // cv.circle(dst, startPoint, 2, color, -1);
        // cv.circle(dst, endPoint, 2, color, -1);
        // overlap[col1][row1]++;
        // overlap[col2][row2]++;
      }



      // for (let i = 0; i < dst.cols; i++) {

      //   for (let j = 0; j < dst.rows; j++) {
      //     if(overlap[i][j] > 1) {
      //       startPoint = new cv.Point(i, j);
      //       // cv.circle(dst, startPoint, 4, color1, -1);
      //     }
      //   }
      // }


    }
    const sensitivity = 8;
    // horizLines.sort((a, b) => {
    //   return ((a.p1.col - b.p1.col) > 0) ? 1 : ((a.p1.col - b.p1.col) == 0) ? 0 : -1;
    // });

    // vertLines.sort((a, b) => {
    //   return ((a.p1.row - b.p1.row) > 0) ? 1 : ((a.p1.row - b.p1.row) == 0) ? 0 : -1;
    // });

    vertLines.forEach(vL => {
      this.findCornerAt(vertLines, horizLines, vL.p1, 8, dst);
      this.findCornerAt(vertLines, horizLines, vL.p2, 8, dst);
    });

    // let intersects: Coord[] = [];
    // horizLines.forEach(h => {

    //   vertLines.forEach(v => {
    //     let start1: Coord = new Coord(lines.data32S[h * 4 + 1], lines.data32S[h * 4]);
    //     let end1: Coord = new Coord(lines.data32S[h * 4 + 3], lines.data32S[h * 4 + 2]);
    //     let start2: Coord = new Coord(lines.data32S[v * 4 + 1], lines.data32S[v * 4]);
    //     let end2: Coord = new Coord(lines.data32S[v * 4 + 3], lines.data32S[v * 4 + 2]);
    //     if (Math.abs(start1.row - start2.row) < sensitivity && Math.abs(start1.col - start2.col) < sensitivity) {
    //       intersects.push(new Coord((start1.row + start2.row) / 2, (start1.col + start2.col) / 2))
    //     }
    //     if (Math.abs(start1.row - end2.row) < sensitivity && Math.abs(start1.col - end2.col) < sensitivity) {
    //       intersects.push(new Coord((start1.row + end2.row) / 2, (start1.col + end2.col) / 2))
    //     }
    //     if (Math.abs(end1.row - start2.row) < sensitivity && Math.abs(end1.col - start2.col) < sensitivity) {
    //       intersects.push(new Coord((end1.row + start2.row) / 2, (end1.col + start2.col) / 2))
    //     }
    //     if (Math.abs(end1.row - end2.row) < sensitivity && Math.abs(end1.col - end2.col) < sensitivity) {
    //       intersects.push(new Coord((end1.row + end2.row) / 2, (end1.col + end2.col) / 2))
    //     }
    //   })
    // });

    // intersects.forEach(inx => {
    //   let p = new cv.Point(inx.col, inx.row);
    //   cv.circle(dst, p, 4, color1, -1);
    // });


    // console.log(intersects);
    // this.findSquareCoords(intersects, dst.rows, dst.cols, 40);
    cv.imshow('canvasTest1', src);
    // this.detectCorners(src, dst, 40, 2, 10);
    // this.showContours(src, dst);
    let groupedCoordsList: Coord[][] = this.groupHCoords(dst.rows, horizLines, 'h');
    horizLines = [];
    groupedCoordsList.forEach(g => {
      horizLines.push(this.drawLine(g, dst, 'h'));

    });
    groupedCoordsList = this.groupHCoords(dst.cols, vertLines, 'v');
    vertLines = [];
    groupedCoordsList.forEach(g => {
      vertLines.push(this.drawLine(g, dst, 'v'));
    });
    this.showCorners(dst, horizLines, vertLines, 20);
    cv.imshow('canvasTest', dst);
    src.delete(); dst.delete(); lines.delete();

    console.log(Date.now() - startTime)

  }
  showCorners(dst: any, horizLines: Line[], vertLines: Line[], sensitivity: number) {
    let corners: Coord[][] = [];
    corners[0] = [];
    corners[1] = [];
    corners[2] = [];
    corners[3] = [];   
    horizLines.forEach(h => {
      vertLines.forEach(v => {
        if (Math.abs(h.p1.row - v.p1.row) < sensitivity && Math.abs(h.p1.col - v.p1.col) < sensitivity)
         { corners[0].push(new Coord(h.p1.row, v.p1.col)); }
        if (Math.abs(h.p2.row - v.p1.row) < sensitivity && Math.abs(h.p2.col - v.p1.col) < sensitivity)
         { corners[1].push(new Coord(h.p2.row, v.p1.col)); }
        if (Math.abs(h.p2.row - v.p2.row) < sensitivity && Math.abs(h.p2.col - v.p2.col) < sensitivity)
         { corners[2].push(new Coord(h.p2.row, v.p2.col)); }
        if (Math.abs(h.p1.row - v.p2.row) < sensitivity && Math.abs(h.p1.col - v.p2.col) < sensitivity)
         { corners[3].push(new Coord(h.p1.row, v.p2.col)); }
      });
    });
    corners.forEach((side , index)=> {
      console.log(`Corner ${index}`);
      side.forEach(c => {
        let p1 = new cv.Point(c.col, c.row)
        console.log(`Row ${c.row}, col ${c.col}`);
        cv.circle(dst, p1, 4, [0, 255, 0, 255], -1);
      });
    });
    
    let topDistances: any[] = [];
    let bottomDistances: number[];
    corners[0].forEach((a, ai) =>{
      corners[1].forEach((b, bi) =>{
        let joinDetails = {a: ai, b: bi, d: b.col - a.col} ; 

        topDistances.push(joinDetails)
      });
    });
  }
  drawLine(g: Coord[], dst: any, dir: string): Line {
    if (g.length == 0) { return null; }
    let sX = 0;
    let sY = 0;
    let sXY = 0;
    let sX2 = 0;
    let sY2 = 0;
    let n = g.length;
    let m = 0;
    let c = 0;
    let xMin = g[0].col;
    let xMax = g[0].col;
    let yMin = g[0].row;
    let yMax = g[0].row;
    let p1: any;
    let p2: any;
    let c1: Coord;
    let c2: Coord;
    if (dir == 'h') {
      g.forEach(c => {
        sX = sX + c.col;
        sY = sY + c.row;
        sXY = sXY + (c.col * c.row);
        sX2 = sX2 + c.col ** 2;
        sY2 = sY2 + c.row ** 2;
        if (c.col < xMin) { xMin = c.col; }
        if (c.col > xMax) { xMax = c.col; }
      });
      m = (n * sXY - sX * sY) / (n * sX2 - sX ** 2);
      c = (sY * sX2 - sX * sXY) / (n * sX2 - sX ** 2);
      p1 = new cv.Point(xMin, m * xMin + c);
      p2 = new cv.Point(xMax, xMax * m + c);
      c1 = new Coord(m * xMin + c, xMin);
      c2 = new Coord(m * xMax + c, xMax);
      cv.line(dst, p1, p2, [0, 255, 0, 255], 1);
    }
    if (dir == 'v') {
      g.forEach(c => {
        sX = sX + c.col;
        sY = sY + c.row;
        sXY = sXY + (c.col * c.row);
        sX2 = sX2 + c.col ** 2;
        sY2 = sY2 + c.row ** 2;
        if (c.row < yMin) { yMin = c.row; }
        if (c.row > yMax) { yMax = c.row; }
      });
      // m = (n * sXY - sX * sY) / (n * sX2 - sX ** 2);
      // c = (sY * sX2 - sX * sXY) / (n * sX2 - sX ** 2);
      m = (n * sXY - sX * sY) / (n * sY2 - sY ** 2);
      c = (sX * sY2 - sY * sXY) / (n * sY2 - sY ** 2);

      p1 = new cv.Point(m * yMin + c, yMin);
      p2 = new cv.Point(yMax * m + c, yMax);
      c1 = new Coord(yMin, m * yMin + c);
      c2 = new Coord(yMax, m * yMax + c);
      cv.line(dst, p1, p2, [0, 255, 0, 255], 1);

    }
    return new Line(c1, c2);
  }
  groupHCoords(length: number, hLines: Line[], dir: string): Coord[][] {

    const groupLimit = 10;
    let coordsByLine: Coord[][] = [];
    let groupedCoords: Coord[] = [];
    let groupedCoordsList: Coord[][] = [];
    let runningIndex = 0;
    for (let index = 0; index < length; index++) {
      coordsByLine.push([]);
    }
    if (dir == 'h') {
      hLines.forEach(h => {
        coordsByLine[h.p1.row].push(h.p1);
        coordsByLine[h.p2.row].push(h.p2);
      });
    }
    if (dir == 'v') {
      hLines.forEach(h => {
        coordsByLine[h.p1.col].push(h.p1);
        coordsByLine[h.p2.col].push(h.p2);
      });
    }

    for (let index = 0; index < length; index++) {
      runningIndex++;
      if (coordsByLine[index].length > 0) {
        if (runningIndex > groupLimit) {
          groupedCoordsList.push(groupedCoords);
          groupedCoords = [];
        }
        coordsByLine[index].forEach(c => {
          groupedCoords.push(c);
        });
        runningIndex = 0;
      }

    }
    if (groupedCoords.length > 0) { groupedCoordsList.push(groupedCoords); }
    if (groupedCoordsList[0].length == 0) { groupedCoordsList.splice(0, 1); }
    return groupedCoordsList;
  }
  findCornerAt(vertLines: Line[], horizLines: Line[], thisCoord: Coord, sensitivity: number, dst) {
    let color1 = new cv.Scalar(255, 255, 0, 255);
    let col = thisCoord.col;
    let row = thisCoord.row;
    let upLine = false;
    let downLine = false;

    let rightLine = false;
    let leftLine = false;
    let filteredHorizLines: Line[] = horizLines.filter(hLine => {
      if ((Math.abs(hLine.p1.row - row) < sensitivity || Math.abs(hLine.p2.row - row) < sensitivity)) { return true }
      return false;
    }
    );
    let filteredVertLines: Line[] = vertLines.filter(vLine => {
      if ((Math.abs(vLine.p1.col - col) < sensitivity || Math.abs(vLine.p2.col - col) < sensitivity)) { return true }
      return false;
    }
    );
    // console.log(`filtered horiz lines length ${filteredHorizLines.length}`);


    horizLines.forEach(hL => {
      let isCorner = true;

      filteredHorizLines.forEach(line => {
        if ((line.p1.col < col - sensitivity && line.p2.col > col + sensitivity)
          || (line.p2.col < col - sensitivity && line.p1.col > col + sensitivity)) {
          isCorner = false;
        }
      });

      filteredVertLines.forEach(line => {
        if ((line.p1.row < row - sensitivity && line.p2.row > row + sensitivity)
          || (line.p2.row < row - sensitivity && line.p1.row > row + sensitivity)) {
          isCorner = false;
        }
      });

      if (Math.abs(hL.p1.row - row) < sensitivity && Math.abs(hL.p1.col - col) < sensitivity) {

        if (isCorner) {
          let p = new cv.Point(col, row);
          // cv.circle(dst, p, 4, color1, -1);
        }

      }
      if (Math.abs(hL.p2.row - row) < sensitivity && Math.abs(hL.p2.col - col) < sensitivity) {

        if (isCorner) {
          let p = new cv.Point(col, row);
          // cv.circle(dst, p, 4, color1, -1);
        }

      }



    });



    return [upLine, downLine, leftLine, rightLine];
  }

  findSquareCoords(intersects: Coord[], rows: number, cols: number, sensitivity: number) {
    let topLeft: Coord[] = [];
    let topRight: Coord[] = [];
    let bottomLeft: Coord[] = [];
    let bottomRight: Coord[] = [];
    let tl = 0;
    let tr = 0;
    let bl = 0;
    let br = 0;
    let found = false;
    let squareCoords: Coord[][] = [];



    intersects.forEach(ix => {
      if (ix.row < rows / 2) {
        if (ix.col < cols / 2) {
          topLeft.push(ix);
        } else {
          topRight.push(ix);
        }
      } else {
        if (ix.col < cols / 2) {
          bottomLeft.push(ix);
        } else {
          bottomRight.push(ix);
        }
      }
    });


    let topJoins: PointJoin[] = [];
    let rightJoins: PointJoin[] = [];
    let bottomJoins: PointJoin[] = [];
    let leftJoins: PointJoin[] = [];

    topJoins = this.findJoins(topLeft, topRight, topJoins, 'h', 10);
    rightJoins = this.findJoins(topRight, bottomRight, rightJoins, 'v', 10);
    bottomJoins = this.findJoins(bottomRight, bottomLeft, bottomJoins, 'h', 10);
    leftJoins = this.findJoins(bottomLeft, topLeft, leftJoins, 'v', 10);

    for (let p = 0; p < topJoins.length; p++) {
      let topJoin = topJoins[p];
      let tl = topLeft[p];
      for (let q = 0; q < topJoin.joins.length; q++) {
        let rightJoin = rightJoins[topJoin.joins[q]];
        let tr = topRight[topJoin.joins[q]];
        for (let r = 0; r < rightJoin.joins.length; r++) {
          let bottomJoin = bottomJoins[rightJoin.joins[r]];
          let br = bottomRight[rightJoin.joins[r]];
          for (let s = 0; s < bottomJoin.joins.length; s++) {
            let leftJoin = leftJoins[bottomJoin.joins[s]];
            let bl = bottomLeft[bottomJoin.joins[s]];

            if (leftJoin.joins.indexOf(topJoin.index)) {
              console.debug(`Square found: top left: ${topLeft[p].row}, ${topLeft[p].col} ; ${topRight[q].row}, ${topRight[q].col}  ${bottomRight[r].row}, ${bottomRight[r].col} ; ${bottomLeft[s].row}, ${bottomLeft[s].col} `);
            }


          }
        }
      }
    }
    console.debug(squareCoords);
  }
  findJoins(coordsFrom: Coord[], coordsTo: Coord[], joins: PointJoin[], dir: string, sensitivity: number): PointJoin[] {
    joins = [];
    for (let i = 0; i < coordsFrom.length; i++) {
      // let d0 = coordsFrom[i].row;
      let d0 = (dir == 'h') ? coordsFrom[i].row : coordsFrom[i].col;
      let thisJoin = new PointJoin(i);
      for (let j = 0; j < coordsTo.length; j++) {
        let d1 = (dir == 'h') ? coordsTo[j].row : coordsTo[j].col;
        if (Math.abs(d0 - d1) < sensitivity) {
          thisJoin.joins.push(j);
        }
      }
      joins.push(thisJoin);
    }
    return joins;
  }
  showContours(src: any, dst: any) {
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    let color = new cv.Scalar(255, 0, 0, 255);
    // You can try more different parameters
    cv.findContours(src, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    // draw contours with random Scalar

    for (let i = 0; i < contours.size(); ++i) {
      // let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
      //   Math.round(Math.random() * 255));
      cv.drawContours(dst, contours, i, color, 1, cv.LINE_8, hierarchy, 100);
      let cnt = contours.get(i);
      // You can try more different parameters
      let perimeter = cv.arcLength(cnt, false);
      console.debug(`Contour ${i} perimeter ${perimeter}; vertices: ${cnt.step.length}`);
    }

    contours.delete(); hierarchy.delete();
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
          // console.log(`${location} corner found at row ${i} column ${j}`);
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
    let M = cv.Mat.ones(6, 6, cv.CV_8U);
    // cv.Canny(dst, dst, 50, 100, 3, true);


    cv.dilate(dst, dst, M, anchor, 2, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());


    cv.imshow(this.canvasTest.nativeElement.id, dst);


    cv.imshow(this.canvasOutput.nativeElement.id, src);
    // this.grid = this.detectCorners(dst, dst, 75, 1, 10);


    src.delete();
    dst.delete();
    dst1.delete();
    lines.delete();
    contours.delete();
    M.delete();


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
    let color2 = new cv.Scalar(255, 0, 255, 255);
    let color3 = new cv.Scalar(0, 255, 0, 255);


    for (let i = 0; i < srcData.rows; i++) {

      this.data[i] = [];

      for (let j = 0; j < srcData.cols; j++) {

        this.data[i][j] = (srcData.ucharAt(i, j * srcData.channels() + 1) > 0) ? true : false;

      }
    }



    for (let i = 2; i < srcData.rows - 2; i++) {
      for (let j = 2; j < srcData.cols - 2; j++) {
        // if(this.data[i][j]){
        //   let p = new cv.Point(j, i);
        //   cv.circle(outData,p,1,color,-1);
        // }


        let longRight = this.linePresent(this.data, i, j, length, width, 'right');
        let longLeft = this.linePresent(this.data, i, j, length, width, 'left');
        let longUp = this.linePresent(this.data, i, j, length, width, 'up');
        let longDown = this.linePresent(this.data, i, j, length, width, 'down');
        let margin = 10;
        if (longRight && longDown && !longLeft && !longUp) {

          if (this.includeCoord(i, j, margin)) {
            topLeftCoords.push(new Coord(i, j));
            let p = new cv.Point(j, i);
            let p1 = new cv.Point(j + length, i);
            cv.circle(outData, p, 1, color, -1);
            // console.debug(`Top left corner at ${i},${j}`);
          }


        }
        if (longLeft && longDown && !longRight && !longUp) {

          // let p = new cv.Point(j, i);
          // let p1 = new cv.Point(j + length, i);
          // cv.circle(outData, p, 1, color, -1);
          // console.debug(`Top right corner at ${j},${i} ${longLeft} ${longDown} ${longUp} ${longRight}`);
          if (this.includeCoord(i, j, margin)) {
            topRightCoords.push(new Coord(i, j));
            let p = new cv.Point(j, i);
            let p1 = new cv.Point(j + length, i);
            cv.circle(outData, p, 1, color1, -1);
          }


        }
        if (longUp && longRight && !longDown && !longLeft) {


          if (this.includeCoord(i, j, margin)) {
            bottomLeftCoords.push(new Coord(i, j));
            let p = new cv.Point(j, i);
            let p1 = new cv.Point(j + length, i);
            cv.circle(outData, p, 1, color2, -1);
          }
        }
        if (longUp && longLeft && !longDown && !longRight) {
          if (this.includeCoord(i, j, margin)) {
            bottomRightCoords.push(new Coord(i, j));
            let p = new cv.Point(j, i);
            let p1 = new cv.Point(j + length, i);
            cv.circle(outData, p, 1, color3, -1);
          }



          // console.debug(`Bottom right corner at ${i},${j}`);
        }
        // let coord = this.groupCoords(topLeftCoords, sensitivity)[0];
        // let p = new cv.Point(coord.col, coord.row);
        // cv.circle(outData, p, 1, color, -1);
        // let shortLeft = (longLeft) ? longLeft : this.linePresent(this.data, i, j, sensitivity, sensitivity, 'left');
        // let shortRight = (longRight) ? longRight : this.linePresent(this.data, i, j, sensitivity, sensitivity, 'right');
        // let shortUp = (longUp) ? longUp : this.linePresent(this.data, i, j, sensitivity, sensitivity, 'up');
        // let shortDown = (longDown) ? longDown : this.linePresent(this.data, i, j, sensitivity, sensitivity, 'down');


        // if (longRight && longDown && !shortLeft && !shortUp) {

        //   topLeftCoords.push(new Coord(i, j));
        //   console.log('Top left found');
        //   let p = new cv.Point(i,j);
        //   cv.circle(outData,p, 2, color, -1);
        //   // console.log('Top left' + (longRight && longDown && !shortLeft && !shortUp));
        //   // console.log('long left ' + this.linePresent(this.data, i, j, length, sensitivity, 'left'));
        // }
        // if (longLeft && longDown && !shortRight && !shortUp) {

        //   topRightCoords.push(new Coord(i, j));
        //   console.log('Top right found');
        //   let p = new cv.Point(i,j);
        //   cv.circle(outData,p, 2, color1, -1);
        // }

        // if (longLeft && longUp && !shortRight && !shortDown) {

        //   bottomRightCoords.push(new Coord(i, j));
        //   console.log('Bottom right found');
        // }
        // if (longRight && longUp && !shortLeft && !shortDown) {

        //   bottomLeftCoords.push(new Coord(i, j));
        //   console.log('Bottom left found');
        // }

      }
    }

    let topL: Coord[] = this.groupCoords(topLeftCoords, 20);
    // topL = this.groupCoords(topL, 20);

    topL.sort((a, b) => this.distanceFromCorner(a, b, 0, 0));
    console.log(topL);
    // const squareCoords: Coord[] = this.getSquareCoords(this.groupCoords(topLeftCoords, 6),
    //   this.groupCoords(topRightCoords, 6),
    //   this.groupCoords(bottomLeftCoords, 6),
    //   this.groupCoords(bottomRightCoords, 6), 20);
    // let point: Coord[] = this.groupCoords(topLeftCoords, 6);
    // let p = new cv.Point(squareCoords[0].col, squareCoords[0].row);

    // cv.circle(outData, p, 3, color, -1);
    // point = this.groupCoords(topRightCoords, 6);
    // p = new cv.Point(squareCoords[1].col, squareCoords[1].row);
    // cv.circle(outData, p, 3, color, -1);
    // point = this.groupCoords(bottomLeftCoords, 6);
    // p = new cv.Point(squareCoords[2].col, squareCoords[2].row);
    // cv.circle(outData, p, 3, color, -1);
    // point = this.groupCoords(bottomRightCoords, 6);
    // p = new cv.Point(squareCoords[3].col, squareCoords[3].row);
    // cv.circle(outData, p, 3, color, -1);



    // let points: Coord[] = this.findSquare(topLeftCoords, topRightCoords, bottomLeftCoords, bottomRightCoords, 10);
    // if (points.length == 4) {

    //   for (let i = 0; i < 10; i++) {
    //     coords[i] = [];
    //     for (let j = 0; j < 10; j++) {
    //       coords[i][j] = new Coord(0, 0);
    //     }
    //   }
    //   this.findROIs(points, coords);
    //   let p0 = new cv.Point(points[0].col, points[0].row);
    //   let p1 = new cv.Point(points[1].col, points[1].row);
    //   let p2 = new cv.Point(points[2].col, points[2].row);
    //   let p3 = new cv.Point(points[3].col, points[3].row);

    //   let color = new cv.Scalar(255, 0, 255);
    //   // cv.line(outData, p0, p1, color);
    //   // cv.line(outData, p2, p3, color);
    //   // cv.line(outData, p0, p2, color);
    //   // cv.line(outData, p1, p3, color);
    //   let color1 = new cv.Scalar(255, 0, 0);
    //   for (let row = 0; row < coords.length - 1; row++) {
    //     for (let col = 0; col < coords.length - 1; col++) {
    //       let pt = new cv.Point(Math.floor(coords[row][col].col), Math.floor(coords[row][col].row));
    //       let pb = new cv.Point(Math.floor(coords[row + 1][col + 1].col), Math.floor(coords[row + 1][col + 1].row));
    //       // cv.rectangle(srcData, pt, pb, color1);
    //     }
    //   }


    // }



    return coords;

  }
  distanceFromCorner(a: Coord, b: Coord, x0: number, y0: number): number {
    const r0 = Math.sqrt((x0 - a.col) ^ 2 + (y0 - a.row) ^ 2);
    const r1 = Math.sqrt((x0 - b.col) ^ 2 + (y0 - b.row) ^ 2);
    return (r0 > r1) ? 1 : (r0 == r1) ? 0 : -1;
  }
  includeCoord(i: number, j: number, margin: number): boolean {
    return (i > margin && j > margin) ? true : false;
  }
  getSquareCoords(topLeftCoords: Coord[], topRightCoords: Coord[], bottomLeftCoords: Coord[], bottomRightCoords: Coord[], sensitivity: number): Coord[] {
    const depth = 3
    const tLMax = (topLeftCoords.length < depth) ? depth : topLeftCoords.length;
    const tRMax = (topRightCoords.length < depth) ? depth : topRightCoords.length;
    const bLMax = (bottomLeftCoords.length < depth) ? depth : bottomLeftCoords.length;
    const bRMax = (bottomRightCoords.length < depth) ? depth : bottomRightCoords.length;
    let squareCoords: Coord[] = [];
    for (let tR = 0; tR < tRMax; tR++) {
      for (let tL = 0; tL < tLMax; tL++) {
        for (let bR = 0; bR < bRMax; bR++) {
          for (let bL = 0; bL < bLMax; bL++) {
            if (Math.abs(topLeftCoords[tL].col - bottomLeftCoords[bL].col) < sensitivity &&
              Math.abs(topLeftCoords[tL].row - topRightCoords[tR].row) < sensitivity &&
              Math.abs(bottomRightCoords[bR].row - bottomLeftCoords[bL].row) < sensitivity &&
              Math.abs(bottomRightCoords[bR].col - topRightCoords[tR].col) < sensitivity) {
              squareCoords[0] = topLeftCoords[tL];
              squareCoords[1] = topRightCoords[tR];
              squareCoords[2] = bottomLeftCoords[bL];
              squareCoords[3] = bottomRightCoords[bR];
            }
          }
        }
      }
    }

    return squareCoords;
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
    let linePresent = (data[row][col]) ? true : false;
    let count = 0;
    const offset = Math.floor(width / 2);
    const skew = 0.2;
    switch (dir) {
      case 'up':
      case 'down':

        while (linePresent && Math.abs(count) < length + 1 && this.inRange(row, count, data.length)) {
          linePresent = false;
          const off = Math.floor(Math.abs(count * skew)) + 3;
          for (let c = col - off; c < col + off + 1; c++) {
            if (c > -1 && c < data[row].length) {
              if (data[row + count][c]) {
                linePresent = true;
              }

            }

          }
          if (dir == 'down') { count++; } else { count--; };
        }


        break;


      case 'right':
      case 'left':

        while (linePresent && Math.abs(count) < length + 1 && this.inRange(col, count, data[row].length)) {
          linePresent = false;
          const off = Math.floor(Math.abs(count * skew)) + 3;
          for (let r = row - off; r < row + off; r++) {
            if (r > -1 && r < data.length) {
              if (data[r][col + count]) { linePresent = true; }

            }

          }

          if (dir == 'right') { count++; } else { count--; };
        }

        break;





      default:
        break;
    }

    return linePresent;

  }
  inRange(row: number, count: number, size: number): boolean {
    return (row + count > -1 && row + count < size);
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
    let order: number[][] = [];
    coords.sort((a, b) => {
      return (a.row - b.row > 0) ? 1 : (a.row = b.row) ? 0 : -1;
    });
    let rowSum = coords[0].row;
    let colSum = coords[0].col;
    let count = 1;
    let lastRow = coords[0].row;
    let lastCol = coords[0].col;
    let groupNumber = 0;
    for (let i = 1; i < coords.length; i++) {
      if (Math.abs(coords[i].row - lastRow) < sensitivity && Math.abs(coords[i].col - lastCol) < sensitivity) {
        rowSum = rowSum + coords[i].row;
        colSum = colSum + coords[i].col;
        count++;
      } else {
        list.push(new Coord(Math.floor(rowSum / count), Math.floor(colSum / count)));
        order.push([count, groupNumber]);
        count = 1;
        groupNumber++;
        rowSum = coords[i].row;
        lastRow = coords[i].row;
        colSum = coords[i].col;
        lastCol = coords[i].col;
      }
    }
    list.push(new Coord(Math.floor(rowSum / count), Math.floor(colSum / count)));
    order.push([count, groupNumber]);
    order.sort((a, b) => b[0] - a[0]);
    let rtnList: Coord[] = [];
    for (let i = 0; i < order.length; i++) { rtnList.push(list[order[i][1]]) }
    return rtnList;
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