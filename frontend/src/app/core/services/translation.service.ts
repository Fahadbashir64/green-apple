import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly supportedLanguages = ['de', 'en'];
  private readonly storageKey = 'ga_lang';

  constructor(private readonly translate: TranslateService) {
    this.translate.addLangs(this.supportedLanguages);
    this.translate.setDefaultLang('de');

    const saved = localStorage.getItem(this.storageKey);
    const initialLanguage =
      saved && this.supportedLanguages.includes(saved) ? saved : 'de';

    this.translate.use(initialLanguage);
  }

  get currentLanguage(): string {
    return this.translate.currentLang || 'de';
  }

  switchLanguage(language: string): void {
    if (this.supportedLanguages.includes(language)) {
      this.translate.use(language);
      localStorage.setItem(this.storageKey, language);
    }
  }
}


