import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const snackBar = inject(MatSnackBar);
  const translate = inject(TranslateService);
  const token = auth.token();

  const headers: Record<string, string> = {
    'X-API-Key': environment.apiKey,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  req = req.clone({ setHeaders: headers });

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/login')) {
        auth.logout();
        snackBar.open(
          translate.instant('auth.sessionExpired'),
          translate.instant('common.ok'),
          { duration: 5000 },
        );
      }
      return throwError(() => err);
    }),
  );
};
