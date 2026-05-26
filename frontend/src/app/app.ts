import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';

import { ToastContainerComponent } from './shared/ui/toast-container/toast-container.component';

const APP_TITLE = 'Green Apple';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  constructor() {
    inject(Title).setTitle(APP_TITLE);
  }
}
