import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgOpenCVModule } from 'ng-open-cv';
import { AppComponent } from './app.component';
import { OpenCVOptions } from 'projects/ng-open-cv/src/public_api';
import { FormsModule } from "@angular/forms";
import { CellComponent } from './cell/cell.component';
import { FlexLayoutModule } from '@angular/flex-layout';

const openCVConfig: OpenCVOptions = {
  scriptUrl: `assets/opencv/opencv.js`,
  wasmBinaryFile: 'wasm/opencv_js.wasm',
  usingWasm: true
};
@NgModule({
  declarations: [
    AppComponent,
    CellComponent
  ],
  imports: [
    BrowserModule,
    NgOpenCVModule.forRoot(openCVConfig),
    FormsModule,
    FlexLayoutModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
