import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';

import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule],
  template: `
    <div class="onboarding-container">
      <div class="onboarding-card">

        <!-- Slide 1: Your Health, One Place -->
        @if (currentSlide() === 0) {
          <div class="slide">
            <div class="slide-icon slide-icon--heart">
              <i class="pi pi-heart-fill"></i>
            </div>
            <h1 class="slide-title">Your Health, One Place</h1>
            <p class="slide-subtitle">
              Access your medical records, appointments, lab results, and messages &mdash;
              all in one secure portal.
            </p>
            <button
              pButton
              label="Next"
              icon="pi pi-arrow-right"
              iconPos="right"
              class="p-button-lg slide-action"
              (click)="goToSlide(1)"
            ></button>
          </div>
        }

        <!-- Slide 2: HIPAA Secure by Design -->
        @if (currentSlide() === 1) {
          <div class="slide">
            <div class="slide-icon slide-icon--shield">
              <i class="pi pi-shield"></i>
            </div>
            <h1 class="slide-title">HIPAA Secure by Design</h1>
            <div class="compliance-badges">
              <span class="badge">256-bit Encryption</span>
              <span class="badge">HIPAA Compliant</span>
              <span class="badge">SOC 2 Certified</span>
            </div>
            <p class="slide-subtitle">
              Your health information is protected with enterprise-grade security
              and strict compliance standards.
            </p>
            <button
              pButton
              label="Get Started"
              icon="pi pi-check"
              iconPos="right"
              class="p-button-lg slide-action"
              (click)="complete()"
            ></button>
          </div>
        }

        <!-- Dot indicators -->
        <div class="dot-indicators">
          <span class="dot" [class.dot--active]="currentSlide() === 0" (click)="goToSlide(0)"></span>
          <span class="dot" [class.dot--active]="currentSlide() === 1" (click)="goToSlide(1)"></span>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .onboarding-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--teal-600) 0%, var(--teal-800) 100%);
      padding: 1.5rem;
    }

    .onboarding-card {
      width: 100%;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* ---- Slide layout ---- */
    .slide {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      color: #ffffff;
      animation: fadeSlide 0.3s ease-out;
    }

    @keyframes fadeSlide {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ---- Icon ---- */
    .slide-icon {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2rem;
    }

    .slide-icon i {
      font-size: 2.75rem;
      color: #ffffff;
    }

    .slide-icon--heart {
      background: rgba(255, 255, 255, 0.2);
      box-shadow: 0 0 0 16px rgba(255, 255, 255, 0.08);
    }

    .slide-icon--shield {
      background: rgba(255, 255, 255, 0.2);
      box-shadow: 0 0 0 16px rgba(255, 255, 255, 0.08);
    }

    /* ---- Typography ---- */
    .slide-title {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 1.25rem;
      line-height: 1.2;
      color: #ffffff;
    }

    .slide-subtitle {
      font-size: 1.0625rem;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.85);
      margin: 0 0 2rem;
      max-width: 380px;
    }

    /* ---- Compliance badges ---- */
    .compliance-badges {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.625rem;
      margin-bottom: 1.5rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.375rem 1rem;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.4);
      color: #ffffff;
      font-size: 0.8125rem;
      font-weight: 500;
      letter-spacing: 0.01em;
      white-space: nowrap;
    }

    /* ---- CTA button ---- */
    .slide-action {
      min-width: 180px;
    }

    :host ::ng-deep .slide-action.p-button {
      background: #ffffff;
      border-color: #ffffff;
      color: var(--teal-700, #0f766e);
      font-weight: 600;
    }

    :host ::ng-deep .slide-action.p-button:hover {
      background: rgba(255, 255, 255, 0.92) !important;
      border-color: rgba(255, 255, 255, 0.92) !important;
    }

    /* ---- Dot indicators ---- */
    .dot-indicators {
      display: flex;
      gap: 0.625rem;
      margin-top: 2.5rem;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.35);
      cursor: pointer;
      transition: background 0.2s, transform 0.2s;
    }

    .dot--active {
      background: #ffffff;
      transform: scale(1.25);
    }

    /* ---- Responsive ---- */
    @media (max-width: 480px) {
      .slide-title { font-size: 1.625rem; }
      .slide-icon { width: 80px; height: 80px; }
      .slide-icon i { font-size: 2.25rem; }
    }
  `]
})
export class OnboardingComponent {
  private readonly router = inject(Router);

  readonly currentSlide = signal<0 | 1>(0);

  constructor() {
    if (localStorage.getItem('onboarding_complete') === 'true') {
      void this.router.navigate(['/login']);
    }
  }

  goToSlide(index: 0 | 1): void {
    this.currentSlide.set(index);
  }

  complete(): void {
    localStorage.setItem('onboarding_complete', 'true');
    void this.router.navigate(['/login']);
  }
}
