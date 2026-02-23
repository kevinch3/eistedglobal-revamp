import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';

export type SupportedLang = 'es' | 'en' | 'cy';

const STORAGE_KEY = 'eistedglobal_lang';
const SUPPORTED: readonly SupportedLang[] = ['es', 'en', 'cy'];
const DEFAULT_LANG: SupportedLang = 'es';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  readonly currentLang = signal<SupportedLang>(DEFAULT_LANG);

  /**
   * Reads the persisted language, applies it, and returns a Promise that
   * resolves once the translation bundle has finished loading.
   * Intended for use with APP_INITIALIZER.
   */
  init(): Promise<void> {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLang | null;
    const lang: SupportedLang = SUPPORTED.includes(saved as SupportedLang) ? (saved as SupportedLang) : DEFAULT_LANG;
    this.currentLang.set(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    return lastValueFrom(this.translate.use(lang)).then(() => undefined);
  }

  setLanguage(lang: SupportedLang): void {
    this.currentLang.set(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    this.translate.use(lang);
  }
}
