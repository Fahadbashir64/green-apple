import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly supportedLanguages = ['de', 'en'];

  constructor(private readonly translate: TranslateService) {
    this.translate.addLangs(this.supportedLanguages);
    this.translate.setDefaultLang('de');

    const browserLanguage = this.translate.getBrowserLang();
    const initialLanguage =
      browserLanguage && this.supportedLanguages.includes(browserLanguage) ? browserLanguage : 'de';

    this.translate.use(initialLanguage);
  }

  get currentLanguage(): string {
    return this.translate.currentLang || 'de';
  }

  switchLanguage(language: string): void {
    if (this.supportedLanguages.includes(language)) {
      this.translate.use(language);
    }
  }
}


