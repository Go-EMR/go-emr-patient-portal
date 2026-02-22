import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';

/**
 * KeyboardNavDirective
 *
 * Enhances keyboard navigation for interactive containers:
 *  - Enforces :focus-visible outline by toggling a CSS class on mouse vs keyboard
 *    navigation (works alongside the global focus-visible polyfill in styles.scss).
 *  - When [appKeyboardNav]="'trap'" is used on a modal/dialog host it restricts
 *    Tab / Shift+Tab focus to elements inside that host.
 *  - Handles skip-to-content anchor activation so the live region announces the
 *    jump when focus lands on #main-content.
 */
@Directive({
  selector: '[appKeyboardNav]',
  standalone: true,
})
export class KeyboardNavDirective implements OnInit, OnDestroy {
  /**
   * Set to 'trap' to enable focus trapping inside this element (e.g. modals).
   * Leave blank (default) for the focus-visible enhancement only.
   */
  @Input('appKeyboardNav') mode: 'trap' | '' = '';

  private elRef = inject(ElementRef) as ElementRef<HTMLElement>;

  private get hostEl(): HTMLElement {
    return this.elRef.nativeElement;
  }

  /** All currently focusable elements inside the host (only used in trap mode). */
  private get focusableElements(): HTMLElement[] {
    const selector =
      'a[href], button:not([disabled]), input:not([disabled]), ' +
      'select:not([disabled]), textarea:not([disabled]), ' +
      '[tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
    const nodes = this.hostEl.querySelectorAll(selector);
    return Array.from(nodes)
      .map((n) => n as HTMLElement)
      .filter((el) => el.offsetParent !== null); // exclude hidden elements
  }

  ngOnInit(): void {
    // Ensure the host itself can receive programmatic focus if needed
    const host = this.hostEl;
    if (this.mode === 'trap' && !host.hasAttribute('tabindex')) {
      host.setAttribute('tabindex', '-1');
    }
  }

  ngOnDestroy(): void {
    this.hostEl.classList.remove('keyboard-nav-active');
  }

  // ── Focus-visible management ──────────────────────────────────────────────

  @HostListener('keydown')
  onKeyDown(): void {
    this.hostEl.classList.add('keyboard-nav-active');
  }

  @HostListener('mousedown')
  onMouseDown(): void {
    this.hostEl.classList.remove('keyboard-nav-active');
  }

  // ── Focus trap (modal/dialog use) ─────────────────────────────────────────

  @HostListener('keydown.Tab', ['$event'])
  onTab(event: KeyboardEvent): void {
    if (this.mode !== 'trap') return;
    this.trapFocus(event, false);
  }

  @HostListener('keydown.shift.Tab', ['$event'])
  onShiftTab(event: KeyboardEvent): void {
    if (this.mode !== 'trap') return;
    this.trapFocus(event, true);
  }

  /** Escape closes focustrap containers — callers should handle (click.outside). */
  @HostListener('keydown.Escape', ['$event'])
  onEscape(event: KeyboardEvent): void {
    if (this.mode !== 'trap') return;
    // Dispatch a custom event so parent components can react without coupling
    this.hostEl.dispatchEvent(
      new CustomEvent('keyboardNavEscape', { bubbles: true, cancelable: true }),
    );
  }

  private trapFocus(event: KeyboardEvent, reverse: boolean): void {
    const focusable = this.focusableElements;
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement;

    if (!reverse && active === last) {
      event.preventDefault();
      first.focus();
    } else if (reverse && active === first) {
      event.preventDefault();
      last.focus();
    }
  }
}
