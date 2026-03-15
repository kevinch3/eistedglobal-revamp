import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let router: Router;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    service = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should read token from localStorage on creation', () => {
    localStorage.setItem('eistedglobal_token', 'stored-token');
    localStorage.setItem('eistedglobal_user', JSON.stringify({ name: 'Test', username: 'test' }));

    // Re-create the service so it reads from localStorage
    const freshService = new AuthService(
      TestBed.inject(HttpTestingController) as any,
      router,
    );
    // The signal reads localStorage at construction time, but since AuthService uses
    // DI HttpClient we need to test via TestBed
    // Instead, test the default TestBed instance after setting localStorage before creation
    TestBed.resetTestingModule();
    localStorage.setItem('eistedglobal_token', 'stored-token');
    localStorage.setItem('eistedglobal_user', JSON.stringify({ name: 'Test', username: 'test' }));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    const svc = TestBed.inject(AuthService);
    expect(svc.token()).toBe('stored-token');
    expect(svc.isLoggedIn()).toBeTrue();
    expect(svc.currentUser()).toEqual({ name: 'Test', username: 'test' });
  });

  it('should clear state on logout', () => {
    localStorage.setItem('eistedglobal_token', 'some-token');
    localStorage.setItem('eistedglobal_user', JSON.stringify({ name: 'A', username: 'a' }));

    TestBed.resetTestingModule();
    localStorage.setItem('eistedglobal_token', 'some-token');
    localStorage.setItem('eistedglobal_user', JSON.stringify({ name: 'A', username: 'a' }));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    const svc = TestBed.inject(AuthService);
    const rtr = TestBed.inject(Router);
    spyOn(rtr, 'navigate');

    svc.logout();

    expect(svc.token()).toBeNull();
    expect(svc.currentUser()).toBeNull();
    expect(svc.isLoggedIn()).toBeFalse();
    expect(localStorage.getItem('eistedglobal_token')).toBeNull();
    expect(localStorage.getItem('eistedglobal_user')).toBeNull();
  });

  it('should navigate to /login on logout', () => {
    spyOn(router, 'navigate');
    service.logout();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should store token and user on successful login', () => {
    service.login('admin', 'pass').subscribe();

    const req = httpTesting.expectOne(r => r.url.includes('/auth/login'));
    req.flush({ token: 'new-token', name: 'Admin', username: 'admin' });

    expect(service.token()).toBe('new-token');
    expect(service.isLoggedIn()).toBeTrue();
    expect(service.currentUser()).toEqual({ name: 'Admin', username: 'admin' });
    expect(localStorage.getItem('eistedglobal_token')).toBe('new-token');
  });
});
