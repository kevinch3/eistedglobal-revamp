import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.body.classList.remove('dark-theme');

    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('should default to light theme when no localStorage value', () => {
    service.init();
    expect(service.currentTheme()).toBe('light');
    expect(document.body.classList.contains('dark-theme')).toBeFalse();
  });

  it('should restore dark theme from localStorage', () => {
    localStorage.setItem('eistedglobal_theme', 'dark');
    service.init();
    expect(service.currentTheme()).toBe('dark');
    expect(document.body.classList.contains('dark-theme')).toBeTrue();
  });

  it('should toggle from light to dark', () => {
    service.init();
    service.toggle();
    expect(service.currentTheme()).toBe('dark');
    expect(document.body.classList.contains('dark-theme')).toBeTrue();
    expect(localStorage.getItem('eistedglobal_theme')).toBe('dark');
  });

  it('should toggle from dark to light', () => {
    localStorage.setItem('eistedglobal_theme', 'dark');
    service.init();
    service.toggle();
    expect(service.currentTheme()).toBe('light');
    expect(document.body.classList.contains('dark-theme')).toBeFalse();
    expect(localStorage.getItem('eistedglobal_theme')).toBe('light');
  });

  it('should persist theme to localStorage', () => {
    service.init();
    service.toggle();
    expect(localStorage.getItem('eistedglobal_theme')).toBe('dark');
    service.toggle();
    expect(localStorage.getItem('eistedglobal_theme')).toBe('light');
  });

  it('should handle invalid localStorage values gracefully', () => {
    localStorage.setItem('eistedglobal_theme', 'garbage');
    service.init();
    expect(service.currentTheme()).toBe('light');
    expect(document.body.classList.contains('dark-theme')).toBeFalse();
  });
});
