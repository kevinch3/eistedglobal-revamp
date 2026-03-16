import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let httpTesting: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TranslateService, useValue: { instant: (k: string) => k, use: vi.fn(), get: vi.fn(), onTranslationChange: { subscribe: vi.fn() }, onLangChange: { subscribe: vi.fn() }, onDefaultLangChange: { subscribe: vi.fn() } } },
        ThemeService,
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpTesting.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form initially', () => {
    expect(component.form.invalid).toBe(true);
  });

  it('should not submit when form is invalid', () => {
    vi.spyOn(router, 'navigate');
    component.onSubmit();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });

  it('should set loading to true on submit', () => {
    component.form.setValue({ username: 'admin', password: 'pass' });
    component.onSubmit();
    expect(component.loading()).toBe(true);
    // flush the pending request
    httpTesting.expectOne((r) => r.url.includes('/auth/login')).flush({ token: 't', name: 'A', username: 'admin' });
  });

  it('should navigate to /dashboard on successful login', () => {
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.form.setValue({ username: 'admin', password: 'pass' });
    component.onSubmit();
    httpTesting.expectOne((r) => r.url.includes('/auth/login')).flush({ token: 't', name: 'Admin', username: 'admin' });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should set error on failed login', () => {
    component.form.setValue({ username: 'admin', password: 'wrong' });
    component.onSubmit();
    httpTesting.expectOne((r) => r.url.includes('/auth/login')).flush({ error: 'Bad creds' }, { status: 401, statusText: 'Unauthorized' });
    expect(component.error()).toBe('Bad creds');
    expect(component.loading()).toBe(false);
  });

  it('should default hidePass to true', () => {
    expect(component.hidePass()).toBe(true);
  });
});
