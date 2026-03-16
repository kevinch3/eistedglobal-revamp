import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;
  let translateSpy: { use: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.clear();
    translateSpy = { use: vi.fn().mockReturnValue(of({})) };

    TestBed.configureTestingModule({
      providers: [{ provide: TranslateService, useValue: translateSpy }],
    });
    service = TestBed.inject(LanguageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to "es" when no saved preference', async () => {
    await service.init();
    expect(service.currentLang()).toBe('es');
    expect(translateSpy.use).toHaveBeenCalledWith('es');
  });

  it('should restore saved language from localStorage', async () => {
    localStorage.setItem('eistedglobal_lang', 'en');
    await service.init();
    expect(service.currentLang()).toBe('en');
    expect(translateSpy.use).toHaveBeenCalledWith('en');
  });

  it('should restore "cy" from localStorage', async () => {
    localStorage.setItem('eistedglobal_lang', 'cy');
    await service.init();
    expect(service.currentLang()).toBe('cy');
  });

  it('should fall back to "es" for invalid saved value', async () => {
    localStorage.setItem('eistedglobal_lang', 'xx');
    await service.init();
    expect(service.currentLang()).toBe('es');
  });

  it('should persist lang to localStorage on init', async () => {
    await service.init();
    expect(localStorage.getItem('eistedglobal_lang')).toBe('es');
  });

  it('should update language on setLanguage()', () => {
    service.setLanguage('en');
    expect(service.currentLang()).toBe('en');
    expect(localStorage.getItem('eistedglobal_lang')).toBe('en');
    expect(translateSpy.use).toHaveBeenCalledWith('en');
  });

  it('should switch language multiple times', () => {
    service.setLanguage('cy');
    expect(service.currentLang()).toBe('cy');
    service.setLanguage('es');
    expect(service.currentLang()).toBe('es');
  });
});
