import { inject, Injectable, OnDestroy, DOCUMENT } from '@angular/core';


/**
 * AriaAnnouncerService
 *
 * Provides a programmatic way to send messages to screen readers via an
 * off-screen ARIA live region.  Used throughout the app to announce:
 *  - Route/page-title changes
 *  - Form submission results (success / error)
 *  - Dynamic content updates (lab results loaded, appointment booked, etc.)
 *
 * Uses two separate live regions (polite + assertive) so the correct
 * politeness level is always honoured without re-creating DOM nodes.
 *
 * Example:
 *   this.announcer.announce('Appointment booked for Monday 3 March');
 *   this.announcer.announce('Session expiring in 60 seconds', 'assertive');
 */
@Injectable({ providedIn: 'root' })
export class AriaAnnouncerService implements OnDestroy {
  private document = inject(DOCUMENT);

  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;

  /** Timeout handles so we can cancel them on destroy. */
  private clearTimers: ReturnType<typeof setTimeout>[] = [];

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Announce a message via the screen reader.
   *
   * @param message     Text to be read aloud.
   * @param politeness  'polite' (default) waits for the reader to finish the
   *                    current utterance; 'assertive' interrupts immediately.
   */
  announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
    const region =
      politeness === 'assertive'
        ? this.ensureRegion('assertive')
        : this.ensureRegion('polite');

    // Clearing then re-setting the text ensures the announcement fires even when
    // the same string is repeated (screen readers skip identical text otherwise).
    region.textContent = '';

    // Defer the update by one tick so the DOM mutation is detected reliably.
    const timerId = setTimeout(() => {
      region.textContent = message;

      // Automatically clear the region after 3 seconds so old announcements
      // are not re-read when the virtual cursor passes over the element.
      const clearId = setTimeout(() => {
        region.textContent = '';
      }, 3000);

      this.clearTimers.push(clearId);
    }, 50);

    this.clearTimers.push(timerId);
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnDestroy(): void {
    this.clearTimers.forEach((id) => clearTimeout(id));
    this.politeRegion?.remove();
    this.assertiveRegion?.remove();
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private ensureRegion(politeness: 'polite' | 'assertive'): HTMLElement {
    if (politeness === 'assertive') {
      if (!this.assertiveRegion) {
        this.assertiveRegion = this.createLiveRegion('assertive');
      }
      return this.assertiveRegion;
    }

    if (!this.politeRegion) {
      this.politeRegion = this.createLiveRegion('polite');
    }
    return this.politeRegion;
  }

  /**
   * Creates a visually hidden <div> appended to <body> that acts as the live
   * region.  The element is off-screen but fully accessible to screen readers.
   */
  private createLiveRegion(politeness: 'polite' | 'assertive'): HTMLElement {
    const el = this.document.createElement('div');

    el.setAttribute('aria-live', politeness);
    el.setAttribute('aria-atomic', 'true');
    el.setAttribute('aria-relevant', 'additions text');
    el.setAttribute('role', politeness === 'assertive' ? 'alert' : 'status');

    // Visually hidden but accessible (clip pattern, not display:none or
    // visibility:hidden which would hide from AT as well).
    el.style.cssText = [
      'position: absolute',
      'width: 1px',
      'height: 1px',
      'padding: 0',
      'overflow: hidden',
      'clip: rect(0 0 0 0)',
      'clip-path: inset(50%)',
      'white-space: nowrap',
      'border: 0',
    ].join(';');

    this.document.body.appendChild(el);
    return el;
  }
}
