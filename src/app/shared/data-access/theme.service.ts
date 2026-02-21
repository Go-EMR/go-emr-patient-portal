import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'classic' | 'beach' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _activeTheme = signal<ThemeMode>(this.loadTheme());
  readonly activeTheme = this._activeTheme.asReadonly();

  constructor() {
    effect(() => {
      const theme = this._activeTheme();
      this.applyTheme(theme);
      localStorage.setItem('portal_theme', theme);
    });
  }

  setTheme(theme: ThemeMode): void {
    this._activeTheme.set(theme);
  }

  private loadTheme(): ThemeMode {
    const stored = localStorage.getItem('portal_theme');
    if (stored === 'beach' || stored === 'classic' || stored === 'dark') {
      return stored;
    }
    // System preference detection: default to dark if OS prefers dark
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'classic';
  }

  private applyTheme(theme: ThemeMode): void {
    // Remove all theme classes before applying the correct one
    document.body.classList.remove('beach-theme', 'dark-theme');

    if (theme === 'beach') {
      document.body.classList.add('beach-theme');
    } else if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    }
  }
}
