import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader, provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideTranslateService } from '@ngx-translate/core';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { LanguageService } from './core/services/language.service';
import { ThemeService } from './core/services/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    ...provideTranslateService({
      defaultLanguage: 'es',
      loader: {
        provide: TranslateLoader,
        useClass: TranslateHttpLoader,
      },
    }),
    ...provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
    provideAppInitializer(() => inject(LanguageService).init()),
    provideAppInitializer(() => inject(ThemeService).init()),
  ],
};
