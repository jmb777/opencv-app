import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { NgOpenCVService, OpenCVLoadResult } from 'ng-open-cv';
import { tap, switchMap, filter } from 'rxjs/operators';
import { forkJoin, Observable, empty, fromEvent, BehaviorSubject } from 'rxjs';
import { Line } from './line';
import { CloneVisitor } from '@angular/compiler/src/i18n/i18n_ast';
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

  findCorners() {
    let src = cv.imread(this.canvasInput.nativeElement.id);
    let dst = cv.Mat.ones(src.rows, src.cols, cv.CV_8UC3);
    let corners = new cv.Mat();
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
    cv.cornerHarris(src,corners,2,3,0.04);
    // cv.cvtColor(corners, corners, cv.COLOR_GRAY2RGBA);
    // corners.convertTo(corners, cv.CV_8U, 255);
    // cv.cvtColor(corners,  cv.COLOR_RGBA2GRAY);
    // cv.goodFeaturesToTrack(src, corners, 4, 0.5, 50);
    let M = cv.Mat.ones(5, 5, cv.CV_8U);
    let anchor = new cv.Point(-1, -1);
    // You can try more different parameters
    
    cv.dilate(corners, corners, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
   
    cv.imshow(this.canvasOutput.nativeElement.id, corners);
    src.delete(); dst.delete(); corners.delete();

  }
  findContours() {

    let src = cv.imread(this.canvasInput.nativeElement.id);
    let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
    let dst1 = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
  
    
    let lines = new cv.Mat();
    let color = new cv.Scalar(255, 255, 255);
    

    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();


   

    let ksize = new cv.Size(5, 5);
    let anchor = new cv.Point(-1, -1);
    let M = cv.Mat.ones(2, 2, cv.CV_8U);
    cv.Canny(src, src, 50, 100, 3, true);
    // cv.HoughLinesP(src, lines, 1, Math.PI / 180, 2, 0, 0);
    // cv.HoughLinesP(src, lines, 1, Math.PI / 180, 2, 1, 2);
    // console.log('Lines:' + lines.rows);

    cv.dilate(src, dst, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());

  this.detectCorners(dst, dst1,12,1,0.9);
    cv.imshow(this.canvasOutput.nativeElement.id, dst1);
 
    src.delete(); dst.delete(); contours.delete(); hierarchy.delete();
  }
  makeTemp(temp: any, length: number, width: number, type: string) {
    
    let p1 = new cv.Point(length + 1, length +1);
    let p2 = new cv.Point(length + 1, 2 * length + 1);
    let p3 = new cv.Point(2 * length + 1, length + 1);
    let color = new cv.Scalar(255, 255, 255);
    let dsize = new cv.Size(2 * length + 1, 2 * length + 1);
    cv.resize(temp, temp, dsize);
    cv.line(temp, p1, p2, color,4);
    cv.line(temp, p1, p3, color, 4);

   
  }
  detectCorners(srcData: any, outData: any,  length: number, width: number, sensitivity: number) {
    if (width % 2 == 0){width++}
    const offset = Math.floor( width / 2);
    let horizLines: number[][] = [];
    let vertLines: number[][] = [];
    for (let i = 0; i < srcData.rows; i++){
      horizLines[i] = [];
      vertLines[i] = [];
      for (let j = 0; j < srcData.cols; j++){
        horizLines[i][j] = (srcData.ucharAt(i, j * srcData.channels() + 1) > 0)? 1 : 0;
        vertLines[i][j] = (srcData.ucharAt(i, j * srcData.channels() + 1) > 0)? 1 : 0;
      }
    }
    for (let i = 0; i < srcData.rows; i++){
      
      for (let j = 0; j < srcData.cols; j++){
        let count = 0;
        let rowStart = (i - offset < 0)? 0 : i - offset;
        let rowEnd = (i + offset + 1 > srcData.rows)? srcData.rows : i + offset + 1;
        const colStart = j;
        let colEnd = (j + length  > srcData.cols)? srcData.cols : j + length ;
        for (let m = rowStart; m < rowEnd; m++) {
          for (let n = colStart; n < colEnd; n++)
          count = count + horizLines[m][n];
         
        }
        horizLines[i][j] = count;
      }
    }
    for (let j = 0; j < srcData.cols; j++){
      
      for (let i = 0; i < srcData.rows; i++){
        let count = 0;
        let rowStart = i;
        let rowEnd = (i + length  > srcData.rows)? srcData.rows : i + length ;
        const colStart = (j - offset < 0)? 0 : j - offset;
        let colEnd = (j + offset + 1 > srcData.cols) ? srcData.cols : j + offset + 1;
        for (let m = rowStart; m < rowEnd; m++) {
          for (let n = colStart; n < colEnd; n++)
          count = count + vertLines[m][n];
          
        }
        vertLines[i][j] = count;
      }
    }

    for (let i = 0; i < srcData.rows; i++){
      
      for (let j = 0; j < srcData.cols; j++){
        let jj = (j - length - 1 < 0)? 0 : j - length;
        if (horizLines[i][j] >  width * length * sensitivity) {
          this.drawLine(j, i, length, outData, 'horiz')
        }
        if (vertLines[i][j] >  width * length * sensitivity) {
          this.drawLine(j, i, length, outData, 'vert')
        }
        
      }
    }
    
    for (let i = length; i < srcData.rows - length; i++){
      for (let j = length; j < srcData.cols - length; j++) {
        if ((horizLines[i][j] - horizLines[i][j - length] + vertLines[i][j] - vertLines[i - length][j]) > 2 * width * length * sensitivity){
          this.drawLine(j, i, length, outData, 'topLeft')
        }
      }
    }
    
    // for (let y = offset; y < srcData.size().height - offset; y++){
    //     for (let x = offset; x < srcData.size().width  - length; x++) {
    //       let n = this.getCount(x, y, srcData, offset, length, 'right');
    //       // console.log( n);
    //       if (n > width * length * sensitivity ) {
    //         this.drawLine(x, y, outData, 'right')
    //       }
    //     }
    // }

    console.log(width);
  }
  drawLine(x: number, y: number, length: number, data: any, dir: string) {
    
      
      let p1  = new cv.Point(x, y);
      let p2 =  new cv.Point(x + length, y);
      let p3 = new cv.Point(x , y + length);
      let color = new cv.Scalar(255, 0, 255);
      if (dir == 'horiz') {
        p2 = new cv.Point(x + length, y);
        color = new cv.Scalar(255, 0, 0);
      }
      if (dir == 'vert') {
        p2 = new cv.Point(x , y + length);
        color = new cv.Scalar(255, 0, 0);
      }
      
      cv.line(data, p1, p2, color);
      if (dir == 'topLeft'){
        cv.line(data, p1, p3, color);
      }
      
    
  }
  getCount(x: number, y: number, data: any, offset: number, length: number, dir: string): any {
    let pixelPresent = 0;
    for (let yy = y - offset; yy < y + offset + 1; yy++ ){
      for (let xx = 0; xx < length + 1; xx++){
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


  detectLines(data: any, bandWidth: number): Line[] {
    
      let start = new cv.Point(24, 130);
      let end = new cv.Point(281, 110);
      let color = new cv.Scalar(255, 0, 0);
      cv.line(data, start, end, color);
       start = new cv.Point(0, 45);
       end = new cv.Point(300, 45);
       cv.line(data, start, end, color);
    let detectedLines: Line[] = []
    let currLine: Line = null;
    const offset = Math.floor( bandWidth / 2);
    for (let i = offset; i < data.size().height - offset; ++i) {
      for (let w = 0; w < data.size().width - 1; w++) {
        let pixelPresent = 0;
        for (let j = -offset; j < offset; j++){
          if (data.ucharAt(i+j, (w + 1) * data.channels() + 1) > 0) {
            pixelPresent = j;
          }
        }
        // let pixelPresent = data.ucharAt(i - 2, w * 3) > 0 || data.ucharAt(i - 1, w * 3) > 0 || data.ucharAt(i, w * 3) > 0
        //   || data.ucharAt(i + 1, w * 3) > 0 || data.ucharAt(i + 2, w * 3) > 0;
        if (!(pixelPresent == 0) && currLine) {
          currLine.length++;
          currLine.x2 = w;
              currLine.y2 = i + pixelPresent;
        } else {
          if (currLine) {
            let l = new Line()
            l.length = currLine.length;
            l.x1 = currLine.x1;
            l.y1 = currLine.y1;
            l.x2 = currLine.x2;
            l.y2 = currLine.y2;
            detectedLines.push(l);
            currLine = null;
          } else {
            if (!(pixelPresent == 0)) {
              currLine = new Line();
              currLine.x1 = w;
              currLine.y1 = i + pixelPresent;
            }

          }
        }

      }
      if (detectedLines.length > 1) {
        detectedLines.sort((a,b) => b.length - a.length);
      console.log('Line ' + i + ' lines ' + detectedLines.length + ' Max length ' + detectedLines[0].length
         + ' Coords ' + detectedLines[0].x1, detectedLines[0].y1  + ' to ' + detectedLines[0].x2, detectedLines[0].y2);
     
      }
      
      detectedLines = [];
    }



    // for (let i = 0; i < data.size().height; ++i) {
    //   console.log('Row ' + i);
    //   for (let j = 0; j < data.size().width; j++) {
    //     console.log(data.ucharAt(i, j * 3) + ' , ' + data.ucharAt(i, j * 3 + 1) + ' , ' + data.ucharAt(i, j * 3 + 2));
    //   }

    //   // console.log(i);
    // }
    return [];
  }

}
