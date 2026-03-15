import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let authSpy: { logout: ReturnType<typeof vi.fn>; token: ReturnType<typeof vi.fn> };
  let snackBarSpy: { open: ReturnType<typeof vi.fn> };
  let translateSpy: { instant: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authSpy = { logout: vi.fn(), token: vi.fn().mockReturnValue('fake-token') };
    snackBarSpy = { open: vi.fn() };
    translateSpy = { instant: vi.fn((key: string) => key) };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: TranslateService, useValue: translateSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should add Authorization header when token exists', () => {
    http.get('/api/participants').subscribe();
    const req = httpTesting.expectOne('/api/participants');
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');
    req.flush([]);
  });

  it('should add X-API-Key header', () => {
    http.get('/api/participants').subscribe();
    const req = httpTesting.expectOne('/api/participants');
    expect(req.request.headers.has('X-API-Key')).toBe(true);
    req.flush([]);
  });

  it('should call logout and show snackbar on 401 for non-login endpoints', () => {
    http.get('/api/participants').subscribe({ error: () => {} });
    const req = httpTesting.expectOne('/api/participants');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authSpy.logout).toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'auth.sessionExpired',
      'common.ok',
      expect.objectContaining({ duration: 5000 }),
    );
  });

  it('should NOT call logout on 401 for the login endpoint', () => {
    http.post('/api/auth/login', {}).subscribe({ error: () => {} });
    const req = httpTesting.expectOne('/api/auth/login');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authSpy.logout).not.toHaveBeenCalled();
    expect(snackBarSpy.open).not.toHaveBeenCalled();
  });

  it('should pass through non-401 errors without calling logout', () => {
    http.get('/api/participants').subscribe({ error: () => {} });
    const req = httpTesting.expectOne('/api/participants');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(authSpy.logout).not.toHaveBeenCalled();
  });

  it('should re-throw the error after handling 401', () => {
    let receivedError: any;
    http.get('/api/participants').subscribe({
      error: (err) => (receivedError = err),
    });
    const req = httpTesting.expectOne('/api/participants');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(receivedError).toBeTruthy();
    expect(receivedError.status).toBe(401);
  });

  it('should not add Authorization header when no token exists', () => {
    authSpy.token.mockReturnValue(null);
    http.get('/api/participants').subscribe();
    const req = httpTesting.expectOne('/api/participants');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });
});
