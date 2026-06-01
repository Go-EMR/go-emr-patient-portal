import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

interface FeatureCard {
  icon: string;
  label: string;
  route: string;
  color: string;
}

interface TourSlide {
  id: number;
  icon: string;
  iconBg: string;
  title: string;
  subtitle: string;
  features?: FeatureCard[];
  highlights?: { icon: string; label: string; description: string }[];
  badges?: string[];
}

const TOUR_SLIDES: TourSlide[] = [
  {
    id: 0,
    icon: 'pi pi-heart-fill',
    iconBg: 'rgba(255,255,255,0.2)',
    title: 'Welcome to AuraHealth',
    subtitle: 'Your personal health hub — manage appointments, records, messages, and more in one secure, HIPAA-compliant portal.',
    badges: ['256-bit Encryption', 'HIPAA Compliant', 'SOC 2 Certified']
  },
  {
    id: 1,
    icon: 'pi pi-th-large',
    iconBg: 'rgba(255,255,255,0.15)',
    title: 'Your Health Hub',
    subtitle: 'Five powerful features designed around how you interact with your healthcare.',
    features: [
      { icon: 'pi pi-home', label: 'Dashboard', route: '/dashboard', color: '#0d9488' },
      { icon: 'pi pi-calendar', label: 'Appointments', route: '/appointments', color: '#3b82f6' },
      { icon: 'pi pi-folder', label: 'Records', route: '/records', color: '#8b5cf6' },
      { icon: 'pi pi-envelope', label: 'Messages', route: '/messages', color: '#f59e0b' },
      { icon: 'pi pi-credit-card', label: 'Billing', route: '/billing', color: '#ef4444' }
    ]
  },
  {
    id: 2,
    icon: 'pi pi-sparkles',
    iconBg: 'rgba(255,255,255,0.15)',
    title: 'Smart Features',
    subtitle: 'Powerful tools that put you in control of your health journey.',
    highlights: [
      { icon: 'pi pi-search', label: 'Quick Search (Ctrl+K)', description: 'Find any feature instantly from anywhere in the portal' },
      { icon: 'pi pi-video', label: 'Telehealth', description: 'Join secure video visits directly from your browser' },
      { icon: 'pi pi-heart', label: 'Symptom Checker', description: 'AI-guided triage to help assess your symptoms' }
    ]
  },
  {
    id: 3,
    icon: 'pi pi-users',
    iconBg: 'rgba(255,255,255,0.15)',
    title: 'Stay Connected',
    subtitle: 'Your care team is always within reach.',
    highlights: [
      { icon: 'pi pi-envelope', label: 'Secure Messaging', description: 'Communicate privately with your providers' },
      { icon: 'pi pi-users', label: 'Care Team', description: 'View your full care team and their specialties' },
      { icon: 'pi pi-bell', label: 'Notifications', description: 'Real-time alerts for appointments, lab results, and messages' },
      { icon: 'pi pi-box', label: 'Prescriptions', description: 'Request refills and track your medications' }
    ]
  },
  {
    id: 4,
    icon: 'pi pi-check-circle',
    iconBg: 'rgba(255,255,255,0.2)',
    title: "You're All Set!",
    subtitle: 'Your AuraHealth portal is ready. Explore at your own pace — everything you need is just a click away.',
    badges: ['30+ Features Available', 'Always Secure', 'Support 24/7']
  }
];

@Component({
  selector: 'app-onboarding',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="onboarding-container">
      <!-- Progress bar -->
      <div class="progress-bar-wrap" role="progressbar" [attr.aria-valuenow]="progressPercent()" aria-valuemin="0" aria-valuemax="100" [attr.aria-label]="'Step ' + (currentSlide() + 1) + ' of ' + totalSlides">
        <div class="progress-bar-fill" [style.width.%]="progressPercent()"></div>
      </div>

      <!-- Skip button -->
      <button class="skip-btn" (click)="skip()" type="button" aria-label="Skip onboarding tour">
        Skip Tour
        <i class="pi pi-arrow-right" aria-hidden="true"></i>
      </button>

      <!-- Slide container -->
      <div class="onboarding-card">

        <!-- Slide 0: Welcome -->
        @if (currentSlide() === 0) {
          <div class="slide" @if>
            <div class="slide-icon" [style.background]="currentSlideData().iconBg">
              <i [class]="currentSlideData().icon"></i>
            </div>
            <h1 class="slide-title">{{ currentSlideData().title }}</h1>
            <p class="slide-subtitle">{{ currentSlideData().subtitle }}</p>
            @if (currentSlideData().badges) {
              <div class="badge-row">
                @for (badge of currentSlideData().badges!; track badge) {
                  <span class="badge">{{ badge }}</span>
                }
              </div>
            }
          </div>
        }

        <!-- Slide 1: Health Hub with clickable feature cards -->
        @if (currentSlide() === 1) {
          <div class="slide">
            <div class="slide-icon" [style.background]="currentSlideData().iconBg">
              <i [class]="currentSlideData().icon"></i>
            </div>
            <h1 class="slide-title">{{ currentSlideData().title }}</h1>
            <p class="slide-subtitle">{{ currentSlideData().subtitle }}</p>
            @if (currentSlideData().features) {
              <div class="feature-cards">
                @for (feature of currentSlideData().features!; track feature.route; let i = $index) {
                  <div
                    class="feature-card"
                    [style.animation-delay]="(i * 80) + 'ms'"
                    (click)="navigateToFeature(feature.route)"
                    role="button"
                    tabindex="0"
                    [attr.aria-label]="'Go to ' + feature.label"
                    (keydown.enter)="navigateToFeature(feature.route)"
                    (keydown.space)="navigateToFeature(feature.route)"
                  >
                    <div class="feature-card-icon" [style.background]="feature.color + '22'" [style.color]="feature.color">
                      <i [class]="feature.icon" aria-hidden="true"></i>
                    </div>
                    <span class="feature-card-label">{{ feature.label }}</span>
                    <i class="pi pi-arrow-right feature-card-arrow" aria-hidden="true"></i>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Slide 2: Smart Features -->
        @if (currentSlide() === 2) {
          <div class="slide">
            <div class="slide-icon" [style.background]="currentSlideData().iconBg">
              <i [class]="currentSlideData().icon"></i>
            </div>
            <h1 class="slide-title">{{ currentSlideData().title }}</h1>
            <p class="slide-subtitle">{{ currentSlideData().subtitle }}</p>
            @if (currentSlideData().highlights) {
              <div class="highlights-list">
                @for (item of currentSlideData().highlights!; track item.label; let i = $index) {
                  <div class="highlight-item" [style.animation-delay]="(i * 100) + 'ms'">
                    <div class="highlight-icon">
                      <i [class]="item.icon" aria-hidden="true"></i>
                    </div>
                    <div class="highlight-body">
                      <span class="highlight-label">{{ item.label }}</span>
                      <span class="highlight-desc">{{ item.description }}</span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Slide 3: Stay Connected -->
        @if (currentSlide() === 3) {
          <div class="slide">
            <div class="slide-icon" [style.background]="currentSlideData().iconBg">
              <i [class]="currentSlideData().icon"></i>
            </div>
            <h1 class="slide-title">{{ currentSlideData().title }}</h1>
            <p class="slide-subtitle">{{ currentSlideData().subtitle }}</p>
            @if (currentSlideData().highlights) {
              <div class="highlights-grid">
                @for (item of currentSlideData().highlights!; track item.label; let i = $index) {
                  <div class="highlight-grid-item" [style.animation-delay]="(i * 80) + 'ms'">
                    <div class="highlight-grid-icon">
                      <i [class]="item.icon" aria-hidden="true"></i>
                    </div>
                    <span class="highlight-grid-label">{{ item.label }}</span>
                    <span class="highlight-grid-desc">{{ item.description }}</span>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Slide 4: All Set (celebration) -->
        @if (currentSlide() === 4) {
          <div class="slide slide--final">
            <!-- Confetti dots -->
            <div class="confetti" aria-hidden="true">
              @for (dot of confettiDots; track dot.id) {
                <span
                  class="confetti-dot"
                  [style.left.%]="dot.x"
                  [style.top.%]="dot.y"
                  [style.background]="dot.color"
                  [style.width.px]="dot.size"
                  [style.height.px]="dot.size"
                  [style.animation-delay]="dot.delay + 'ms'"
                ></span>
              }
            </div>
            <div class="final-check">
              <i class="pi pi-check" aria-hidden="true"></i>
            </div>
            <h1 class="slide-title">{{ currentSlideData().title }}</h1>
            <p class="slide-subtitle">{{ currentSlideData().subtitle }}</p>
            @if (currentSlideData().badges) {
              <div class="badge-row">
                @for (badge of currentSlideData().badges!; track badge) {
                  <span class="badge">{{ badge }}</span>
                }
              </div>
            }
            <button
              pButton
              label="Go to Dashboard"
              icon="pi pi-home"
              iconPos="right"
              class="p-button-lg slide-action final-cta"
              (click)="complete()"
            ></button>
          </div>
        }

        <!-- Navigation -->
        <div class="slide-nav">
          @if (currentSlide() > 0 && currentSlide() < 4) {
            <button
              pButton
              label="Back"
              icon="pi pi-arrow-left"
              class="p-button-text slide-back-btn"
              (click)="prev()"
              type="button"
              aria-label="Go to previous step"
            ></button>
          } @else {
            <span></span>
          }

          @if (currentSlide() < 4) {
            <button
              pButton
              [label]="currentSlide() === 0 ? 'Get Started' : 'Next'"
              icon="pi pi-arrow-right"
              iconPos="right"
              class="p-button-lg slide-action"
              (click)="next()"
              type="button"
              [attr.aria-label]="currentSlide() === 0 ? 'Begin the tour' : 'Go to next step'"
            ></button>
          }
        </div>

        <!-- Dot indicators -->
        <div class="dot-indicators" role="tablist" aria-label="Tour steps">
          @for (slide of slides; track slide.id) {
            <button
              class="dot"
              [class.dot--active]="currentSlide() === slide.id"
              [class.dot--visited]="slide.id < currentSlide()"
              (click)="goToSlide(slide.id)"
              role="tab"
              [attr.aria-selected]="currentSlide() === slide.id"
              [attr.aria-label]="'Step ' + (slide.id + 1)"
              type="button"
            ></button>
          }
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ---- Container ---- */
    .onboarding-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f766e 0%, #0d4f6c 60%, #1e1b4b 100%);
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
    }

    /* Subtle background pattern */
    .onboarding-container::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        radial-gradient(circle at 20% 20%, rgba(255,255,255,0.04) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(255,255,255,0.04) 0%, transparent 50%);
      pointer-events: none;
    }

    /* ---- Progress Bar ---- */
    .progress-bar-wrap {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: rgba(255,255,255,0.2);
      z-index: 100;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #5eead4, #22d3ee);
      border-radius: 0 2px 2px 0;
      transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* ---- Skip button ---- */
    .skip-btn {
      position: fixed;
      top: 1rem;
      right: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      color: rgba(255,255,255,0.85);
      padding: 0.4rem 0.875rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      z-index: 101;
      font-family: inherit;
    }

    .skip-btn:hover {
      background: rgba(255,255,255,0.25);
      color: #ffffff;
    }

    .skip-btn:focus-visible {
      outline: 2px solid rgba(255,255,255,0.6);
      outline-offset: 2px;
    }

    /* ---- Card ---- */
    .onboarding-card {
      width: 100%;
      max-width: 520px;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      z-index: 1;
    }

    /* ---- Slide layout ---- */
    .slide {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      color: #ffffff;
      width: 100%;
      animation: fadeSlide 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes fadeSlide {
      from { opacity: 0; transform: translateX(20px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    /* ---- Icon ---- */
    .slide-icon {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.75rem;
      box-shadow: 0 0 0 16px rgba(255,255,255,0.06);
    }

    .slide-icon i {
      font-size: 2.75rem;
      color: #ffffff;
    }

    /* ---- Typography ---- */
    .slide-title {
      font-size: 1.875rem;
      font-weight: 700;
      margin: 0 0 1rem;
      line-height: 1.2;
      color: #ffffff;
    }

    .slide-subtitle {
      font-size: 1rem;
      line-height: 1.65;
      color: rgba(255,255,255,0.8);
      margin: 0 0 1.75rem;
      max-width: 400px;
    }

    /* ---- Badges ---- */
    .badge-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 1.75rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.35rem 0.875rem;
      border-radius: 9999px;
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      color: #ffffff;
      font-size: 0.8125rem;
      font-weight: 500;
      white-space: nowrap;
    }

    /* ---- Feature Cards (Slide 1) ---- */
    .feature-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      width: 100%;
      margin-bottom: 1.5rem;
    }

    .feature-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 0.75rem;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.15s, transform 0.15s;
      animation: card-pop-in 0.3s ease-out both;
      position: relative;
    }

    @keyframes card-pop-in {
      from { opacity: 0; transform: scale(0.9); }
      to   { opacity: 1; transform: scale(1); }
    }

    .feature-card:hover {
      background: rgba(255,255,255,0.18);
      transform: translateY(-2px);
    }

    .feature-card:focus-visible {
      outline: 2px solid rgba(255,255,255,0.6);
      outline-offset: 2px;
    }

    .feature-card-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .feature-card-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: rgba(255,255,255,0.95);
    }

    .feature-card-arrow {
      font-size: 0.6875rem;
      color: rgba(255,255,255,0.5);
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
    }

    /* ---- Highlights list (Slide 2) ---- */
    .highlights-list {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      width: 100%;
      margin-bottom: 1.5rem;
      text-align: left;
    }

    .highlight-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 12px;
      animation: fadeSlide 0.3s ease-out both;
    }

    .highlight-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(255,255,255,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.125rem;
      color: #5eead4;
      flex-shrink: 0;
    }

    .highlight-body {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .highlight-label {
      font-weight: 600;
      font-size: 0.9375rem;
      color: #ffffff;
    }

    .highlight-desc {
      font-size: 0.8125rem;
      color: rgba(255,255,255,0.7);
      line-height: 1.4;
    }

    /* ---- Highlights grid (Slide 3) ---- */
    .highlights-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.875rem;
      width: 100%;
      margin-bottom: 1.5rem;
    }

    .highlight-grid-item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.4rem;
      padding: 1rem;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 12px;
      text-align: left;
      animation: card-pop-in 0.3s ease-out both;
    }

    .highlight-grid-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: rgba(255,255,255,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      color: #5eead4;
      margin-bottom: 0.25rem;
    }

    .highlight-grid-label {
      font-weight: 600;
      font-size: 0.875rem;
      color: #ffffff;
    }

    .highlight-grid-desc {
      font-size: 0.75rem;
      color: rgba(255,255,255,0.65);
      line-height: 1.4;
    }

    /* ---- Final Slide ---- */
    .slide--final {
      position: relative;
    }

    .confetti {
      position: absolute;
      inset: -40px;
      pointer-events: none;
      overflow: hidden;
    }

    .confetti-dot {
      position: absolute;
      border-radius: 50%;
      opacity: 0;
      animation: confetti-fall 2s ease-out forwards;
    }

    @keyframes confetti-fall {
      0%   { opacity: 0; transform: translateY(-20px) rotate(0deg); }
      20%  { opacity: 1; }
      80%  { opacity: 0.6; }
      100% { opacity: 0; transform: translateY(60px) rotate(180deg); }
    }

    .final-check {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      box-shadow: 0 0 0 16px rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.75rem;
      animation: check-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes check-pop {
      from { transform: scale(0); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }

    .final-check i {
      font-size: 2.75rem;
      color: #5eead4;
    }

    .final-cta {
      margin-top: 0.5rem;
    }

    /* ---- Navigation row ---- */
    .slide-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      margin-top: 0.5rem;
      gap: 1rem;
    }

    /* ---- CTA buttons ---- */
    .slide-action {
      min-width: 160px;
    }

    :host ::ng-deep .slide-action.p-button {
      background: #ffffff;
      border-color: #ffffff;
      color: #0f766e;
      font-weight: 600;
    }

    :host ::ng-deep .slide-action.p-button:hover {
      background: rgba(255,255,255,0.92) !important;
      border-color: rgba(255,255,255,0.92) !important;
    }

    :host ::ng-deep .slide-back-btn.p-button {
      color: rgba(255,255,255,0.8) !important;
      border: 1px solid rgba(255,255,255,0.3) !important;
      background: transparent !important;
    }

    :host ::ng-deep .slide-back-btn.p-button:hover {
      background: rgba(255,255,255,0.1) !important;
      color: #ffffff !important;
    }

    /* ---- Dot indicators ---- */
    .dot-indicators {
      display: flex;
      gap: 0.5rem;
      margin-top: 2rem;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: none;
      padding: 0;
      background: rgba(255,255,255,0.3);
      cursor: pointer;
      transition: background 0.2s, transform 0.2s, width 0.2s;
    }

    .dot--active {
      background: #ffffff;
      transform: scale(1.3);
      width: 24px;
      border-radius: 5px;
    }

    .dot--visited {
      background: rgba(255,255,255,0.6);
    }

    .dot:focus-visible {
      outline: 2px solid rgba(255,255,255,0.6);
      outline-offset: 2px;
    }

    /* ---- Responsive ---- */
    @media (max-width: 480px) {
      .slide-title { font-size: 1.5rem; }
      .slide-icon, .final-check { width: 80px; height: 80px; }
      .slide-icon i, .final-check i { font-size: 2.25rem; }
      .feature-cards { grid-template-columns: repeat(2, 1fr); }
      .highlights-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class OnboardingComponent implements OnInit {
  private readonly router = inject(Router);

  readonly slides = TOUR_SLIDES;
  readonly totalSlides = TOUR_SLIDES.length;
  readonly currentSlide = signal<number>(0);

  readonly progressPercent = computed(() =>
    ((this.currentSlide() + 1) / this.totalSlides) * 100
  );

  readonly currentSlideData = computed(() =>
    TOUR_SLIDES[this.currentSlide()] ?? TOUR_SLIDES[0]
  );

  // Deterministic confetti dots for the final slide
  readonly confettiDots = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: (i * 37 + 11) % 100,
    y: (i * 23 + 7) % 60,
    color: ['#5eead4', '#22d3ee', '#f9a8d4', '#fde68a', '#a5b4fc', '#86efac'][i % 6],
    size: 6 + (i % 4) * 3,
    delay: (i * 80) % 1200
  }));

  ngOnInit(): void {
    if (localStorage.getItem('onboarding_completed') === 'true') {
      void this.router.navigate(['/dashboard']);
    }
  }

  goToSlide(index: number): void {
    this.currentSlide.set(index);
  }

  next(): void {
    const next = this.currentSlide() + 1;
    if (next < this.totalSlides) {
      this.currentSlide.set(next);
    }
  }

  prev(): void {
    const prev = this.currentSlide() - 1;
    if (prev >= 0) {
      this.currentSlide.set(prev);
    }
  }

  skip(): void {
    localStorage.setItem('onboarding_completed', 'true');
    void this.router.navigate(['/dashboard']);
  }

  complete(): void {
    localStorage.setItem('onboarding_completed', 'true');
    void this.router.navigate(['/dashboard']);
  }

  navigateToFeature(route: string): void {
    localStorage.setItem('onboarding_completed', 'true');
    void this.router.navigate([route]);
  }
}
