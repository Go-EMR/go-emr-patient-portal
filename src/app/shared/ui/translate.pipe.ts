import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../data-access/translation.service';

/**
 * TranslatePipe
 *
 * Transforms a translation key into the localised string for the current
 * language.  The pipe is intentionally impure (`pure: false`) so it reacts
 * to language changes triggered via TranslationService.setLanguage() without
 * requiring any additional wiring in each component.
 *
 * Performance note: Angular only calls impure pipes when change detection runs,
 * so the overhead is bounded.  For high-frequency pipes consider combining with
 * a toSignal wrapper in components that need maximum performance.
 *
 * Usage in templates:
 *   {{ 'nav.dashboard' | translate }}
 *   {{ 'common.save'   | translate }}
 */
@Pipe({
  name: 'translate',
  standalone: true,
  pure: true,
})
export class TranslatePipe implements PipeTransform {
  private translationService = inject(TranslationService);

  /**
   * Pure pipe: pass the current language as second arg so Angular re-evaluates
   * when the language changes.  Usage:
   *   {{ 'key' | translate : currentLanguage() }}
   * or simply {{ 'key' | translate }} (won't auto-update on language switch).
   */
  transform(key: string, _lang?: string): string {
    return this.translationService.translate(key);
  }
}
