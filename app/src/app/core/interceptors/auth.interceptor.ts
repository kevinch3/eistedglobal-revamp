import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  const headers: Record<string, string> = {
    'X-API-Key': environment.apiKey,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  req = req.clone({ setHeaders: headers });
  return next(req);
};
