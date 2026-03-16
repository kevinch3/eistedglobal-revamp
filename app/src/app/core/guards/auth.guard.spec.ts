import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let authSpy: { isLoggedIn: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(() => {
    authSpy = { isLoggedIn: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
      ],
    });

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('should return true when user is logged in', () => {
    authSpy.isLoggedIn.mockReturnValue(true);
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result).toBe(true);
  });

  it('should return false when user is not logged in', () => {
    authSpy.isLoggedIn.mockReturnValue(false);
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result).toBe(false);
  });

  it('should navigate to /login when user is not logged in', () => {
    authSpy.isLoggedIn.mockReturnValue(false);
    TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should not navigate when user is logged in', () => {
    authSpy.isLoggedIn.mockReturnValue(true);
    TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
