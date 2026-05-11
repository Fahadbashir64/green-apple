import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-terms-and-conditions-page',
  imports: [TranslatePipe],
  templateUrl: './terms-and-conditions-page.component.html',
  styleUrl: './terms-and-conditions-page.component.scss'
})
export class TermsAndConditionsPageComponent {}
