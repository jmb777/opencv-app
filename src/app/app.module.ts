import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgOpenCVModule } from 'ng-open-cv';
import { AppComponent } from './app.component';
import { OpenCVOptions } from 'projects/ng-open-cv/src/public_api';
import { FormsModule } from "@angular/forms";

const openCVConfig: OpenCVOptions = {
  scriptUrl: `assets/opencv/opencv.js`,
  wasmBinaryFile: 'wasm/opencv_js.wasm',
  usingWasm: true
};
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    NgOpenCVModule.forRoot(openCVConfig),
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
