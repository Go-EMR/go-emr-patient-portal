import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';

import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TriageService, TriageCategory } from '../data-access';

@Component({
  selector: 'app-triage',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, TagModule],
  template: `
    <div class="triage-page">

      <!-- ==================== PAGE HEADER ==================== -->
      <div class="triage-header">
        <div class="header-icon">
          <i class="pi pi-heart-fill"></i>
        </div>
        <h1 class="header-title">What do you need help with?</h1>
        <p class="header-subtitle">Choose a category to get started</p>
      </div>

      <!-- ==================== CATEGORY GRID ==================== -->
      <div class="category-grid">
        @for (cat of nonEmergencyCategories; track cat.id) {
          <button
            class="category-tile"
            [class]="'tile-' + cat.color"
            (click)="handleCategoryClick(cat)"
            [attr.aria-label]="cat.label + ': ' + cat.description"
          >
            <div class="tile-icon-wrap" [class]="'icon-wrap-' + cat.color">
              <i class="pi" [class]="cat.icon"></i>
            </div>

            <div class="tile-body">
              <span class="tile-label">{{ cat.label }}</span>
              <span class="tile-desc">{{ cat.description }}</span>
            </div>

            @if (cat.urgency === 'medium' || cat.urgency === 'high') {
              <div class="tile-badge-wrap">
                <span class="urgency-badge" [class]="'badge-' + cat.urgency">
                  {{ cat.urgency === 'medium' ? 'Moderate' : 'High' }}
                </span>
              </div>
            }

            <i class="pi pi-arrow-right tile-arrow"></i>
          </button>
        }
      </div>

      <!-- ==================== EMERGENCY TILE ==================== -->
      <button
        class="emergency-tile"
        (click)="openEmergency()"
        aria-label="EMERGENCY: Chest pain, stroke, severe injury - open emergency guidance"
      >
        <div class="emergency-inner">
          <div class="emergency-icon-wrap">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <div class="emergency-text">
            <span class="emergency-label">EMERGENCY</span>
            <span class="emergency-desc">Chest pain, stroke, severe injury</span>
          </div>
          <div class="emergency-pulse">
            <span class="pulse-ring"></span>
            <span class="pulse-ring delay"></span>
          </div>
        </div>
      </button>

      <!-- ==================== EMERGENCY OVERLAY ==================== -->
      @if (emergencyStep() > 0) {
        <div
          class="emergency-overlay"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="overlayAriaLabel()"
        >
          <div class="overlay-backdrop" (click)="closeEmergency()"></div>

          <div class="overlay-panel">

            <!-- ===== STEP 1: Confirm ===== -->
            @if (emergencyStep() === 1) {
              <div class="step-content step-confirm">
                <div class="step-icon-ring warning">
                  <i class="pi pi-question-circle"></i>
                </div>
                <h2 class="step-title">Are you experiencing a medical emergency?</h2>
                <p class="step-body">
                  A medical emergency includes chest pain, difficulty breathing, signs
                  of stroke (face drooping, arm weakness, speech difficulty), severe
                  bleeding, or loss of consciousness.
                </p>
                <div class="step-actions">
                  <button
                    class="btn-emergency-confirm"
                    (click)="emergencyStep.set(2)"
                    aria-label="Yes, this is an emergency - proceed to emergency guidance"
                  >
                    <i class="pi pi-exclamation-triangle"></i>
                    Yes, this is an emergency
                  </button>
                  <button
                    class="btn-emergency-cancel"
                    (click)="closeEmergency()"
                    aria-label="No, go back to category selection"
                  >
                    <i class="pi pi-arrow-left"></i>
                    No, go back
                  </button>
                </div>
              </div>
            }

            <!-- ===== STEP 2: Call 911 ===== -->
            @if (emergencyStep() === 2) {
              <div class="step-content step-call">
                <div class="step-icon-ring danger">
                  <i class="pi pi-phone"></i>
                </div>
                <h2 class="step-title">Call 911 immediately</h2>
                <p class="step-body">
                  Do not wait. Emergency services can begin treatment faster than
                  driving to the hospital. Stay calm and stay on the line.
                </p>

                <div class="phone-display" aria-label="Emergency number 911">
                  <span class="phone-number">9-1-1</span>
                </div>

                <div class="step-actions">
                  <a
                    href="tel:911"
                    class="btn-call-911"
                    aria-label="Tap to call 911 from this device"
                  >
                    <i class="pi pi-phone"></i>
                    Call 911
                  </a>
                  <button
                    class="btn-other-help"
                    (click)="emergencyStep.set(3)"
                    aria-label="I need other help - show alternative emergency resources"
                  >
                    I need other help
                  </button>
                </div>

                <p class="step-disclaimer">
                  If you cannot speak, stay on the line — dispatchers are trained to
                  help silent callers.
                </p>
              </div>
            }

            <!-- ===== STEP 3: Alternative Resources ===== -->
            @if (emergencyStep() === 3) {
              <div class="step-content step-resources">
                <div class="step-icon-ring info">
                  <i class="pi pi-info-circle"></i>
                </div>
                <h2 class="step-title">Alternative Emergency Resources</h2>
                <p class="step-body">
                  If your situation is not immediately life-threatening, one of these
                  resources may be right for you.
                </p>

                <div class="resources-grid">
                  <a href="tel:18002221222" class="resource-card" aria-label="Poison Control: 1-800-222-1222">
                    <div class="resource-icon poison">
                      <i class="pi pi-exclamation-circle"></i>
                    </div>
                    <div class="resource-info">
                      <span class="resource-name">Poison Control</span>
                      <span class="resource-number">1-800-222-1222</span>
                      <span class="resource-desc">24/7 for poisoning emergencies</span>
                    </div>
                    <i class="pi pi-arrow-right resource-arrow"></i>
                  </a>

                  <a href="tel:988" class="resource-card" aria-label="Crisis Hotline: 988">
                    <div class="resource-icon crisis">
                      <i class="pi pi-heart"></i>
                    </div>
                    <div class="resource-info">
                      <span class="resource-name">Crisis Hotline</span>
                      <span class="resource-number">988</span>
                      <span class="resource-desc">Suicide &amp; crisis lifeline</span>
                    </div>
                    <i class="pi pi-arrow-right resource-arrow"></i>
                  </a>

                  <a href="tel:18004275747" class="resource-card" aria-label="Nurse Hotline available 24/7">
                    <div class="resource-icon nurse">
                      <i class="pi pi-user"></i>
                    </div>
                    <div class="resource-info">
                      <span class="resource-name">Nurse Hotline</span>
                      <span class="resource-number">1-800-427-5747</span>
                      <span class="resource-desc">Speak with a registered nurse 24/7</span>
                    </div>
                    <i class="pi pi-arrow-right resource-arrow"></i>
                  </a>
                </div>

                <div class="resources-footer">
                  <button
                    class="btn-return-portal"
                    (click)="returnToPortal()"
                    aria-label="Return to Patient Portal"
                  >
                    <i class="pi pi-home"></i>
                    Return to Portal
                  </button>
                  <button
                    class="btn-back-911"
                    (click)="emergencyStep.set(2)"
                    aria-label="Go back to call 911 screen"
                  >
                    <i class="pi pi-arrow-left"></i>
                    Back to Call 911
                  </button>
                </div>
              </div>
            }

            <!-- Close button (all steps) -->
            <button
              class="overlay-close"
              (click)="closeEmergency()"
              aria-label="Close emergency overlay"
            >
              <i class="pi pi-times"></i>
            </button>

          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    /* ============================================================
       PAGE LAYOUT
    ============================================================ */
    .triage-page {
      max-width: 960px;
      margin: 0 auto;
      padding: 2rem 1.5rem 4rem;
    }

    /* ============================================================
       HEADER
    ============================================================ */
    .triage-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .header-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      border-radius: 18px;
      background: linear-gradient(135deg, var(--primary-100), var(--primary-50));
      margin-bottom: 1.25rem;
    }

    .header-icon i {
      font-size: 1.75rem;
      color: var(--primary-600);
    }

    .header-title {
      margin: 0 0 0.5rem;
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-color);
      line-height: 1.25;
    }

    .header-subtitle {
      margin: 0;
      font-size: 1.05rem;
      color: var(--text-color-secondary);
    }

    /* ============================================================
       CATEGORY GRID  (3-col desktop / 2-col tablet / 1-col mobile)
    ============================================================ */
    .category-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
      margin-bottom: 1.25rem;
    }

    @media (max-width: 900px) {
      .category-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 540px) {
      .category-grid {
        grid-template-columns: 1fr;
      }
    }

    /* ============================================================
       CATEGORY TILE  — base
    ============================================================ */
    .category-tile {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.875rem;
      padding: 1.5rem;
      background: var(--surface-card);
      border: 1.5px solid var(--surface-border);
      border-radius: 16px;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }

    .category-tile:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .category-tile:focus-visible {
      outline: 3px solid var(--primary-color);
      outline-offset: 2px;
    }

    .tile-body {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      flex: 1;
    }

    .tile-label {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-color);
      line-height: 1.3;
    }

    .tile-desc {
      font-size: 0.825rem;
      color: var(--text-color-secondary);
      line-height: 1.4;
    }

    .tile-arrow {
      position: absolute;
      bottom: 1.25rem;
      right: 1.25rem;
      font-size: 0.8rem;
      opacity: 0;
      transform: translateX(-4px);
      transition: opacity 0.18s ease, transform 0.18s ease;
      color: var(--text-color-secondary);
    }

    .category-tile:hover .tile-arrow {
      opacity: 1;
      transform: translateX(0);
    }

    .tile-badge-wrap {
      margin-top: auto;
    }

    .urgency-badge {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 20px;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    .badge-medium {
      background: var(--orange-50);
      color: var(--orange-700);
    }

    .badge-high {
      background: var(--red-50);
      color: var(--red-700);
    }

    /* ============================================================
       COLORED ICON CIRCLES
    ============================================================ */
    .tile-icon-wrap {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .tile-icon-wrap i {
      font-size: 1.35rem;
    }

    /* Teal */
    .icon-wrap-teal { background: var(--teal-50); }
    .icon-wrap-teal i { color: var(--teal-600); }
    .tile-teal:hover { border-color: var(--teal-300); }

    /* Blue */
    .icon-wrap-blue { background: var(--blue-50); }
    .icon-wrap-blue i { color: var(--blue-600); }
    .tile-blue:hover { border-color: var(--blue-300); }

    /* Green */
    .icon-wrap-green { background: var(--green-50); }
    .icon-wrap-green i { color: var(--green-600); }
    .tile-green:hover { border-color: var(--green-300); }

    /* Indigo */
    .icon-wrap-indigo { background: #eef2ff; }
    .icon-wrap-indigo i { color: #4338ca; }
    .tile-indigo:hover { border-color: #a5b4fc; }

    /* Orange */
    .icon-wrap-orange { background: var(--orange-50); }
    .icon-wrap-orange i { color: var(--orange-600); }
    .tile-orange:hover { border-color: var(--orange-300); }

    /* Purple */
    .icon-wrap-purple { background: var(--purple-50); }
    .icon-wrap-purple i { color: var(--purple-600); }
    .tile-purple:hover { border-color: var(--purple-300); }

    /* Cyan */
    .icon-wrap-cyan { background: var(--cyan-50); }
    .icon-wrap-cyan i { color: var(--cyan-600); }
    .tile-cyan:hover { border-color: var(--cyan-300); }

    /* ============================================================
       EMERGENCY TILE  — full-width, red, prominent
    ============================================================ */
    .emergency-tile {
      display: block;
      width: 100%;
      padding: 0;
      border: none;
      border-radius: 16px;
      cursor: pointer;
      font-family: inherit;
      background: linear-gradient(135deg, #dc2626, #991b1b);
      box-shadow: 0 4px 20px rgba(220, 38, 38, 0.35);
      transition: transform 0.18s ease, box-shadow 0.18s ease;
      overflow: hidden;
    }

    .emergency-tile:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(220, 38, 38, 0.45);
    }

    .emergency-tile:focus-visible {
      outline: 3px solid #fca5a5;
      outline-offset: 3px;
    }

    .emergency-inner {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1.75rem 2rem;
      position: relative;
      overflow: hidden;
    }

    .emergency-icon-wrap {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 2px solid rgba(255, 255, 255, 0.25);
    }

    .emergency-icon-wrap i {
      font-size: 1.75rem;
      color: #fff;
    }

    .emergency-text {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      flex: 1;
    }

    .emergency-label {
      font-size: 1.4rem;
      font-weight: 800;
      color: #fff;
      letter-spacing: 0.04em;
    }

    .emergency-desc {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
    }

    /* Decorative pulsing rings on the emergency tile */
    .emergency-pulse {
      position: absolute;
      right: 2.5rem;
      top: 50%;
      transform: translateY(-50%);
      width: 60px;
      height: 60px;
    }

    .pulse-ring {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.4);
      animation: em-pulse 2s ease-out infinite;
    }

    .pulse-ring.delay {
      width: 60px;
      height: 60px;
      animation-delay: 0.6s;
    }

    @keyframes em-pulse {
      0%   { transform: translate(-50%, -50%) scale(0.7); opacity: 0.7; }
      100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
    }

    @media (max-width: 540px) {
      .emergency-pulse { display: none; }
      .emergency-inner { gap: 1rem; padding: 1.5rem; }
      .emergency-label { font-size: 1.2rem; }
    }

    /* ============================================================
       EMERGENCY OVERLAY
    ============================================================ */
    .emergency-overlay {
      position: fixed;
      inset: 0;
      z-index: 1100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .overlay-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(10, 10, 20, 0.75);
      backdrop-filter: blur(4px);
    }

    .overlay-panel {
      position: relative;
      background: var(--surface-card);
      border-radius: 20px;
      width: 100%;
      max-width: 520px;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      animation: panel-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes panel-in {
      from { opacity: 0; transform: scale(0.92) translateY(16px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    .overlay-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: var(--surface-100);
      color: var(--text-color-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      transition: background 0.15s;
      z-index: 10;
    }

    .overlay-close:hover {
      background: var(--surface-200);
    }

    .overlay-close:focus-visible {
      outline: 2px solid var(--primary-color);
    }

    /* ============================================================
       STEP CONTENT — shared
    ============================================================ */
    .step-content {
      padding: 2.5rem 2rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .step-icon-ring {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
      flex-shrink: 0;
    }

    .step-icon-ring i {
      font-size: 2rem;
    }

    .step-icon-ring.warning {
      background: var(--orange-50);
      border: 2px solid var(--orange-200);
    }
    .step-icon-ring.warning i { color: var(--orange-600); }

    .step-icon-ring.danger {
      background: #fee2e2;
      border: 2px solid #fca5a5;
    }
    .step-icon-ring.danger i { color: #dc2626; }

    .step-icon-ring.info {
      background: var(--blue-50);
      border: 2px solid var(--blue-200);
    }
    .step-icon-ring.info i { color: var(--blue-600); }

    .step-title {
      margin: 0 0 0.875rem;
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--text-color);
      line-height: 1.3;
    }

    .step-body {
      margin: 0 0 1.75rem;
      font-size: 0.9rem;
      color: var(--text-color-secondary);
      line-height: 1.6;
      max-width: 400px;
    }

    .step-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      width: 100%;
    }

    /* ============================================================
       STEP 1 — Confirm buttons
    ============================================================ */
    .btn-emergency-confirm {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #dc2626, #991b1b);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.15s;
      width: 100%;
    }

    .btn-emergency-confirm:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }

    .btn-emergency-confirm:focus-visible {
      outline: 3px solid #fca5a5;
    }

    .btn-emergency-cancel {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: var(--surface-100);
      color: var(--text-color-secondary);
      border: 1.5px solid var(--surface-border);
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.15s;
      width: 100%;
    }

    .btn-emergency-cancel:hover {
      background: var(--surface-200);
    }

    /* ============================================================
       STEP 2 — Call 911
    ============================================================ */
    .phone-display {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fee2e2;
      border: 2px solid #fca5a5;
      border-radius: 16px;
      padding: 1rem 3rem;
      margin-bottom: 1.75rem;
      width: 100%;
    }

    .phone-number {
      font-size: 3rem;
      font-weight: 900;
      color: #dc2626;
      letter-spacing: 0.1em;
      font-variant-numeric: tabular-nums;
    }

    .btn-call-911 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #dc2626, #991b1b);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 1.05rem;
      font-weight: 700;
      font-family: inherit;
      text-decoration: none;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.15s;
      width: 100%;
    }

    .btn-call-911:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }

    .btn-call-911:focus-visible {
      outline: 3px solid #fca5a5;
    }

    .btn-other-help {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.625rem 1rem;
      background: transparent;
      color: var(--primary-color);
      border: none;
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 3px;
      transition: opacity 0.15s;
    }

    .btn-other-help:hover {
      opacity: 0.75;
    }

    .step-disclaimer {
      margin: 1.25rem 0 0;
      font-size: 0.78rem;
      color: var(--text-color-secondary);
      font-style: italic;
      line-height: 1.5;
    }

    /* ============================================================
       STEP 3 — Resource cards
    ============================================================ */
    .resources-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      width: 100%;
      margin-bottom: 1.5rem;
    }

    .resource-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--surface-50);
      border: 1.5px solid var(--surface-border);
      border-radius: 12px;
      text-decoration: none;
      color: var(--text-color);
      transition: background 0.15s, border-color 0.15s, transform 0.15s;
    }

    .resource-card:hover {
      background: var(--surface-100);
      border-color: var(--primary-300);
      transform: translateX(3px);
    }

    .resource-card:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .resource-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .resource-icon i {
      font-size: 1.2rem;
    }

    .resource-icon.poison {
      background: var(--orange-50);
    }
    .resource-icon.poison i { color: var(--orange-600); }

    .resource-icon.crisis {
      background: var(--purple-50);
    }
    .resource-icon.crisis i { color: var(--purple-600); }

    .resource-icon.nurse {
      background: var(--teal-50);
    }
    .resource-icon.nurse i { color: var(--teal-600); }

    .resource-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      flex: 1;
      text-align: left;
    }

    .resource-name {
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--text-color);
    }

    .resource-number {
      font-size: 1rem;
      font-weight: 800;
      color: var(--primary-700);
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.02em;
    }

    .resource-desc {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .resource-arrow {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      flex-shrink: 0;
    }

    .resources-footer {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      width: 100%;
    }

    .btn-return-portal {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: var(--primary-color);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.15s;
      width: 100%;
    }

    .btn-return-portal:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .btn-back-911 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: transparent;
      color: var(--text-color-secondary);
      border: 1.5px solid var(--surface-border);
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.15s;
      width: 100%;
    }

    .btn-back-911:hover {
      background: var(--surface-100);
    }

    /* ============================================================
       RESPONSIVE — overlay panel
    ============================================================ */
    @media (max-width: 540px) {
      .triage-page {
        padding: 1.5rem 1rem 3rem;
      }

      .header-title {
        font-size: 1.5rem;
      }

      .overlay-panel {
        border-radius: 16px;
      }

      .step-content {
        padding: 2rem 1.25rem 1.5rem;
      }

      .phone-number {
        font-size: 2.25rem;
      }
    }
  `]
})
export class TriageComponent {
  private readonly router = inject(Router);
  readonly triage = inject(TriageService);

  /** Signal controlling which emergency overlay step is displayed (0 = hidden). */
  readonly emergencyStep = signal<0 | 1 | 2 | 3>(0);

  /** All categories except the emergency tile, which is rendered separately. */
  get nonEmergencyCategories(): TriageCategory[] {
    return this.triage.categories.filter(c => c.urgency !== 'emergency');
  }

  /** Accessible label for the overlay dialog, changes per step. */
  overlayAriaLabel(): string {
    const labels: Record<number, string> = {
      1: 'Emergency confirmation dialog',
      2: 'Call 911 guidance dialog',
      3: 'Alternative emergency resources dialog'
    };
    return labels[this.emergencyStep()] ?? 'Emergency dialog';
  }

  handleCategoryClick(cat: TriageCategory): void {
    this.triage.selectCategory(cat);
    this.router.navigate([cat.route]);
  }

  openEmergency(): void {
    this.emergencyStep.set(1);
  }

  closeEmergency(): void {
    this.emergencyStep.set(0);
  }

  returnToPortal(): void {
    this.closeEmergency();
    this.router.navigate(['/dashboard']);
  }
}
