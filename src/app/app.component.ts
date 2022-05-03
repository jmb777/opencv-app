import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { NgOpenCVService, OpenCVLoadResult } from 'ng-open-cv';
import { tap, switchMap, filter } from 'rxjs/operators';
import { forkJoin, Observable, empty, fromEvent, BehaviorSubject } from 'rxjs';
import { Line } from './line';
import { CloneVisitor } from '@angular/compiler/src/i18n/i18n_ast';
import { Coord } from './coord.class';
import { createWorker } from 'tesseract.js';
import { Rectangle } from './rectangle';
import * as Tesseract from 'tesseract.js';
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
  @ViewChild('canvasOutput')
  canvasOutput: ElementRef;
  ocrResult:any;



  constructor(private ngOpenCVService: NgOpenCVService) { }
  ngOnInit() {
    // Always subscribe to the NgOpenCVService isReady$ observer before using a CV related function to ensure that the OpenCV has been
    // successfully loaded
    this.ngOpenCVService.isReady$
      .pipe(
        // The OpenCV library has been successfully loaded if result.ready === true
        filter((result: OpenCVLoadResult) => result.ready),
        switchMap(() => {
          // Load the face and eye classifiers files
          return this.loadClassifiers();
        })
      )
      .subscribe(() => {
        // The classifiers have been succesfully loaded
        this.classifiersLoaded.next(true);
      });
  }

  ngAfterViewInit(): void {
    // Here we just load our example image to the canvas
    this.ngOpenCVService.isReady$
      .pipe(
        filter((result: OpenCVLoadResult) => result.ready),
        tap((result: OpenCVLoadResult) => {
          this.ngOpenCVService.loadImageToHTMLCanvas(this.imageUrl, this.canvasInput.nativeElement).subscribe();
        })
      )
      .subscribe(() => { });
  }
  loadClassifiers(): Observable<any> {
    return forkJoin(
      // this.ngOpenCVService.createFileFromUrl(
      //   'haarcascade_frontalface_default.xml',
      //   `assets/opencv/data/haarcascades/haarcascade_frontalface_default.xml`
      // ),
      // this.ngOpenCVService.createFileFromUrl(
      //   'haarcascade_eye.xml',
      //   `assets/opencv/data/haarcascades/haarcascade_eye.xml`
      // )
    );

  }

  readDataUrl(event: any) {
    if (event.target.files.length) {
      const reader = new FileReader();
      const load$ = fromEvent(reader, 'load');
      load$
        .pipe(
          switchMap(() => {
            return this.ngOpenCVService.loadImageToHTMLCanvas(`${reader.result}`, this.canvasInput.nativeElement);
          })
        )
        .subscribe(
          () => { },
          err => {
            console.log('Error loading image', err);
          }
        );
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  findContours() {

    let src = cv.imread(this.canvasInput.nativeElement.id);
    let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
    let dst1 = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);


    let lines = new cv.Mat();
    let color = new cv.Scalar(255, 255, 255);


    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();




    let ksize = new cv.Size(4, 4);
    let anchor = new cv.Point(-1, -1);
    let M = cv.Mat.ones(4, 4, cv.CV_8U);
    cv.Canny(dst, dst, 50, 100, 3, true);


    cv.dilate(dst, dst, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    let grid = this.detectCorners(dst, src, 75, 5, 5);
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    // let img = 
    
    cv.imshow(this.canvasOutput.nativeElement.id, src);
    try {
      this.doOCR(grid);
    } catch (error) {
      console.log(error);
    }

    src.delete(); dst.delete(); contours.delete(); hierarchy.delete();

  }

  detectCorners(srcData: any, outData: any, length: number, width: number, sensitivity: number) {
    let coords: Coord[][] = [];
    let topLeftCoords: Coord[] = [];
    let topRightCoords: Coord[] = [];
    let bottomLeftCoords: Coord[] = [];
    let bottomRightCoords: Coord[] = [];
    if (width % 2 == 0) { width++ }
    const offset = Math.floor(width / 2);
    let data: boolean[][] = [];


    for (let i = 0; i < srcData.rows; i++) {

      data[i] = [];
 
      for (let j = 0; j < srcData.cols; j++) {

        data[i][j] = (srcData.ucharAt(i, j * srcData.channels() + 1) > 0) ? true : false;

      }
    }
 


    for (let i = 10; i < srcData.rows - 10; i++) {
      for (let j = 10; j < srcData.cols - 10; j++) {

        let longRight = this.linePresent(data, i, j, length, sensitivity, 'right');
        let longLeft = this.linePresent(data, i, j, length, sensitivity, 'left');
        let longUp = this.linePresent(data, i, j, length, sensitivity, 'up');
        let longDown = this.linePresent(data, i, j, length, sensitivity, 'down');
        let shortLeft = (longLeft) ? longLeft : this.linePresent(data, i, j, sensitivity, sensitivity, 'left');
        let shortRight = (longRight) ? longRight : this.linePresent(data, i, j, sensitivity, sensitivity, 'right');
        let shortUp = (longUp) ? longUp : this.linePresent(data, i, j, sensitivity, sensitivity, 'up');
        let shortDown = (longDown) ? longDown : this.linePresent(data, i, j, sensitivity, sensitivity, 'down');


        if (longRight && longDown && !shortLeft && !shortUp) {

          topLeftCoords.push(new Coord(i, j));
          console.log('Top left' + (longRight && longDown && !shortLeft && !shortUp));
          console.log('long left ' + this.linePresent(data, i, j, length, sensitivity, 'left'));
        }
        if (longLeft && longDown && !shortRight && !shortUp) {

          topRightCoords.push(new Coord(i, j));
        }

        if (longLeft && longUp && !shortRight && !shortDown) {

          bottomRightCoords.push(new Coord(i, j));
        }
        if (longRight && longUp && !shortLeft && !shortDown) {

          bottomLeftCoords.push(new Coord(i, j));
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
      cv.line(outData, p0, p1, color);
      // cv.line(outData, p2, p3, color);
      // cv.line(outData, p0, p2, color);
      // cv.line(outData, p1, p3, color);
      let color1 = new cv.Scalar(255, 0, 0);
      for (let row = 0; row < coords.length - 1; row++) {
        for (let col = 0; col < coords.length - 1; col++) {
          let pt = new cv.Point(Math.floor(coords[row][col].col), Math.floor(coords[row][col].row ));
          let pb = new cv.Point(Math.floor(coords[row + 1][col + 1].col ), Math.floor(coords[row + 1][col + 1].row ));
          // cv.rectangle(outData, pt, pb, color1);
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
            if (data[this.checkRange(row + count, data.length - 1)][c]) { linePresent = true; }
          }
          if (dir == 'down') { count++; } else { count--; };
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

  getCount(x: number, y: number, data: any, offset: number, length: number, dir: string): any {
    let pixelPresent = 0;
    for (let yy = y - offset; yy < y + offset + 1; yy++) {
      for (let xx = 0; xx < length + 1; xx++) {
        if (data.ucharAt(yy, (x + xx) * data.channels() + 1) > 0) {
          pixelPresent++;
        }
      }
    }
    return pixelPresent;
  }
  test() {
    console.log('clicked');
  }


  
  async doOCR(grid) {
    let canvas =<HTMLCanvasElement>document.getElementById('canvasOutput');
let ctx = canvas.getContext('2d');
let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
// for (let row = 0; row < 9; row++) {
//   for (let col = 0; col < 9; col++) {
//     let r = new Rectangle(grid[row][col], grid[row + 1][col + 1]);
//     console.log(r.top + ' ' + r.left);

//   }
// }  
this.ocrResult = "Recognising...";
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
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        let r = new Rectangle(grid[row][col], grid[row + 1][col + 1]);
        const { data: { text } } = await worker.recognize(this.imageUrl, {rectangle: r });
        console.log(r.top + ' ' + r.left + '    ' + text);
    
      }
    }  
    
    // this.ocrResult = words;
    // console.log(words);

  }
}

  // findCorners() {
  //   let src = cv.imread(this.canvasInput.nativeElement.id);
  //   let dst = cv.Mat.ones(src.rows, src.cols, cv.CV_8UC3);
  //   let corners = new cv.Mat();
  //   cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
  //   cv.cornerHarris(src, corners, 2, 3, 0.04);
  //   // cv.cvtColor(corners, corners, cv.COLOR_GRAY2RGBA);
  //   // corners.convertTo(corners, cv.CV_8U, 255);
  //   // cv.cvtColor(corners,  cv.COLOR_RGBA2GRAY);
  //   // cv.goodFeaturesToTrack(src, corners, 4, 0.5, 50);
  //   let M = cv.Mat.ones(4, 4, cv.CV_8U);
  //   let anchor = new cv.Point(-1, -1);
  //   // You can try more different parameters

  //   cv.dilate(corners, corners, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());

  //   cv.imshow(this.canvasOutput.nativeElement.id, corners);
  //   src.delete(); dst.delete(); corners.delete();

  // }
  // detectLines(data: any, bandWidth: number): Line[] {

  //   let start = new cv.Point(24, 130);
  //   let end = new cv.Point(281, 110);
  //   let color = new cv.Scalar(255, 0, 0);
  //   cv.line(data, start, end, color);
  //   start = new cv.Point(0, 45);
  //   end = new cv.Point(300, 45);
  //   cv.line(data, start, end, color);
  //   let detectedLines: Line[] = []
  //   let currLine: Line = null;
  //   const offset = Math.floor(bandWidth / 2);
  //   for (let i = offset; i < data.size().height - offset; ++i) {
  //     for (let w = 0; w < data.size().width - 1; w++) {
  //       let pixelPresent = 0;
  //       for (let j = -offset; j < offset; j++) {
  //         if (data.ucharAt(i + j, (w + 1) * data.channels() + 1) > 0) {
  //           pixelPresent = j;
  //         }
  //       }
  //       // let pixelPresent = data.ucharAt(i - 2, w * 3) > 0 || data.ucharAt(i - 1, w * 3) > 0 || data.ucharAt(i, w * 3) > 0
  //       //   || data.ucharAt(i + 1, w * 3) > 0 || data.ucharAt(i + 2, w * 3) > 0;
  //       if (!(pixelPresent == 0) && currLine) {
  //         currLine.length++;
  //         currLine.x2 = w;
  //         currLine.y2 = i + pixelPresent;
  //       } else {
  //         if (currLine) {
  //           let l = new Line()
  //           l.length = currLine.length;
  //           l.x1 = currLine.x1;
  //           l.y1 = currLine.y1;
  //           l.x2 = currLine.x2;
  //           l.y2 = currLine.y2;
  //           detectedLines.push(l);
  //           currLine = null;
  //         } else {
  //           if (!(pixelPresent == 0)) {
  //             currLine = new Line();
  //             currLine.x1 = w;
  //             currLine.y1 = i + pixelPresent;
  //           }

  //         }
  //       }

  //     }
  //     if (detectedLines.length > 1) {
  //       detectedLines.sort((a, b) => b.length - a.length);
  //       console.log('Line ' + i + ' lines ' + detectedLines.length + ' Max length ' + detectedLines[0].length
  //         + ' Coords ' + detectedLines[0].x1, detectedLines[0].y1 + ' to ' + detectedLines[0].x2, detectedLines[0].y2);

  //     }

  //     detectedLines = [];
  //   }



  //   // for (let i = 0; i < data.size().height; ++i) {
  //   //   console.log('Row ' + i);
  //   //   for (let j = 0; j < data.size().width; j++) {
  //   //     console.log(data.ucharAt(i, j * 3) + ' , ' + data.ucharAt(i, j * 3 + 1) + ' , ' + data.ucharAt(i, j * 3 + 2));
  //   //   }

  //   //   // console.log(i);
  //   // }
  //   return [];
  // }
     // for (let i = 0; i < srcData.rows; i++) {

    //   for (let j = 0; j < srcData.cols; j++) {
    //     let count = 0;
    //     let rowStart = (i - offset < 0) ? 0 : i - offset;
    //     let rowEnd = (i + offset + 1 > srcData.rows) ? srcData.rows : i + offset + 1;
    //     const colStart = j;
    //     let colEnd = (j + length > srcData.cols) ? srcData.cols : j + length;
    //     for (let m = rowStart; m < rowEnd; m++) {
    //       for (let n = colStart; n < colEnd; n++)

    //         if (data[m][n]) { count++ };

    //     }

    //   }
    // }
    // for (let j = 0; j < srcData.cols; j++) {

    //   for (let i = 0; i < srcData.rows; i++) {
    //     let count = 0;
    //     let rowStart = i;
    //     let rowEnd = (i + length > srcData.rows) ? srcData.rows : i + length;
    //     const colStart = (j - offset < 0) ? 0 : j - offset;
    //     let colEnd = (j + offset + 1 > srcData.cols) ? srcData.cols : j + offset + 1;
    //     for (let m = rowStart; m < rowEnd; m++) {
    //       for (let n = colStart; n < colEnd; n++)

    //         if (data[m][n]) { count++ };
    //     }

    //   }
    // }

    // for (let row = 0; row < srcData.rows; row++) {
    //   for (let col = 0; col < srcData.rows; col++) {
    //     let count = 0;
    //     let rowStart = (row - offset < 0) ? 0 : row - offset;
    //     let rowEnd = (row + offset + 1 > srcData.rows) ? srcData.rows : row + offset + 1;
    //     let colStart = (col - offset < 0) ? 0 : col - offset;
    //     let colEnd = (col + offset > srcData.cols) ? srcData.cols : col + offset;
    //     let pixelPresent = true;

    //     // while (pixelPresent && col + count < srcData.cols && Math.abs(count) < length) {
    //     //   pixelPresent = false;

    //     //   for (let i = rowStart; i < rowEnd; i++) {
    //     //     if (data[i][col + count]) { pixelPresent = true }
    //     //   }
    //     //   count++;
    //     // }
    //     // hRight[row][col] = count;

    //     // count = 0;
    //     // pixelPresent = true;
    //     // while (pixelPresent && row + count < srcData.rows && Math.abs(count) < length) {
    //     //   pixelPresent = false;

    //     //   for (let i = colStart; i < colEnd; i++) {
    //     //     if (data[row + count][i]) { pixelPresent = true }
    //     //   }
    //     //   count++;
    //     // }
    //     // vDown[row][col] = count;
    //   }
    // }
      // drawLine(x: number, y: number, length: number, data: any, dir: string) {


  //   let p1 = new cv.Point(x, y);
  //   let p2 = new cv.Point(x + length, y);
  //   let p3 = new cv.Point(x, y + length);
  //   let color = new cv.Scalar(255, 0, 255);
  //   if (dir == 'horiz') {
  //     p2 = new cv.Point(x + length, y);
  //     color = new cv.Scalar(255, 0, 0);
  //   }
  //   if (dir == 'vert') {
  //     p2 = new cv.Point(x, y + length);
  //     color = new cv.Scalar(255, 0, 0);
  //   }

  //   cv.line(data, p1, p2, color);
  //   if (dir == 'topLeft') {
  //     cv.line(data, p1, p3, color);
  //   }


  // }
  // makeTemp(temp: any, length: number, width: number, type: string) {

  //   let p1 = new cv.Point(length + 1, length + 1);
  //   let p2 = new cv.Point(length + 1, 2 * length + 1);
  //   let p3 = new cv.Point(2 * length + 1, length + 1);
  //   let color = new cv.Scalar(255, 255, 255);
  //   let dsize = new cv.Size(2 * length + 1, 2 * length + 1);
  //   cv.resize(temp, temp, dsize);
  //   cv.line(temp, p1, p2, color, 4);
  //   cv.line(temp, p1, p3, color, 4);


  // }
