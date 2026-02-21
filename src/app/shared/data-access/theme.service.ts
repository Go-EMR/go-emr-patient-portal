import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'classic' | 'beach';

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

  toggleTheme(): void {
    this._activeTheme.update(t => t === 'classic' ? 'beach' : 'classic');
  }

  setTheme(theme: ThemeMode): void {
    this._activeTheme.set(theme);
  }

  private loadTheme(): ThemeMode {
    const stored = localStorage.getItem('portal_theme');
    if (stored === 'beach' || stored === 'classic') {
      return stored;
    }
    return 'classic';
  }

  private applyTheme(theme: ThemeMode): void {
    if (theme === 'beach') {
      document.body.classList.add('beach-theme');
    } else {
      document.body.classList.remove('beach-theme');
    }
  }
}
