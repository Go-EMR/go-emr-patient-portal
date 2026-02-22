import { Injectable, signal } from '@angular/core';

export type ReadingLevel = 'standard' | 'easy' | 'simple';

/**
 * ReadingLevelService
 *
 * Stores the user's preferred reading level and exposes it as a readonly Signal
 * so components can adapt content complexity reactively.
 *
 * Reading levels:
 *  - 'standard'  General adult reading level (default).  Full medical detail.
 *  - 'easy'      ~8th-grade reading level.  Simplified sentence structure,
 *                shorter explanations, common vocabulary preferred.
 *  - 'simple'    ~5th-grade reading level.  Very short sentences, basic words,
 *                concrete examples, minimal jargon.
 *
 * Usage:
 *   // In a component class
 *   readonly levelService = inject(ReadingLevelService);
 *
 *   // In a template
 *   @switch (levelService.level()) {
 *     @case ('simple')  { <p>Take this pill once every day.</p> }
 *     @case ('easy')    { <p>Take one tablet daily with water.</p> }
 *     @default          { <p>Administer 1 tablet (10 mg) orally once daily.</p> }
 *   }
 */
@Injectable({ providedIn: 'root' })
export class ReadingLevelService {
  private _level = signal<ReadingLevel>('standard');
  readonly level = this._level.asReadonly();

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Update the active reading level and persist the choice. */
  setLevel(level: ReadingLevel): void {
    this._level.set(level);
    try {
      localStorage.setItem('portal_reading_level', level);
    } catch {
      // localStorage may be unavailable in restricted environments — ignore.
    }
  }

  /** Restore the reading level persisted in a previous session. */
  restoreLevel(): void {
    try {
      const stored = localStorage.getItem('portal_reading_level') as ReadingLevel | null;
      if (stored && this.isValidLevel(stored)) {
        this._level.set(stored);
      }
    } catch {
      // Ignore
    }
  }

  /** Human-readable label for a given level. */
  labelFor(level: ReadingLevel): string {
    const labels: Record<ReadingLevel, string> = {
      standard: 'Standard',
      easy: 'Easy Read (8th grade)',
      simple: 'Very Simple (5th grade)',
    };
    return labels[level];
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private isValidLevel(value: string): value is ReadingLevel {
    return value === 'standard' || value === 'easy' || value === 'simple';
  }
}
