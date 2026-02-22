import { Component } from '@angular/core';

/**
 * SkipLinkComponent
 *
 * Renders a visually-hidden "Skip to main content" anchor that becomes visible
 * when it receives keyboard focus. Place this as the very first element inside
 * the root shell template so keyboard-only users can bypass repeated navigation.
 *
 * The target element must have id="main-content" (added to the <main> element
 * in the shell component).
 *
 * Usage:
 *   <app-skip-link></app-skip-link>
 */
@Component({
  selector: 'app-skip-link',
  standalone: true,
  template: `<a class="skip-link" href="#main-content">Skip to main content</a>`,
  styles: [
    `
      .skip-link {
        position: absolute;
        top: -100px;
        left: 0;
        background: var(--primary-color, #0d9488);
        color: #ffffff;
        padding: 0.5rem 1rem;
        z-index: 10000;
        transition: top 0.2s ease;
        font-size: 0.875rem;
        font-weight: 600;
        text-decoration: none;
        border-radius: 0 0 var(--border-radius, 8px) 0;
        outline-offset: 2px;
      }

      .skip-link:focus {
        top: 0;
        outline: 3px solid #ffffff;
        outline-offset: 3px;
      }
    `,
  ],
})
export class SkipLinkComponent {}
