import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'eistedglobal_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly currentTheme = signal<Theme>('light');

  init(): void {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    this.applyTheme(saved === 'dark' ? 'dark' : 'light');
  }

  toggle(): void {
    this.applyTheme(this.currentTheme() === 'light' ? 'dark' : 'light');
  }

  private applyTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    localStorage.setItem(STORAGE_KEY, theme);
    document.body.classList.toggle('dark-theme', theme === 'dark');
  }
}
