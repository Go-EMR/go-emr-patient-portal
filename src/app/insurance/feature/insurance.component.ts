import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { InsuranceService, InsuranceCard, InsuranceType } from '../data-access';

@Component({
  selector: 'app-insurance',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, CardModule, TagModule],
  template: `
    <div class="insurance-page">

      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-id-card"></i>
          </div>
          <div>
            <h1 class="page-title">Insurance Wallet</h1>
            <p class="page-subtitle">Your digital insurance cards and benefits — always available, ready to show at any provider</p>
          </div>
        </div>
        <div class="header-meta">
          <span class="active-badge">
            <i class="pi pi-check-circle"></i>
            {{ service.activeCards().length }} Active Plans
          </span>
        </div>
      </div>

      <!-- Card Carousel -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Your Insurance Cards</h2>
          <p class="section-subtitle">Tap a card to select it, then flip to see copay and pharmacy details</p>
        </div>

        <div class="cards-grid">
          @for (card of service.cards(); track card.id) {
            <div
              class="card-wrapper"
              [class.selected]="service.selectedCardId() === card.id"
              (click)="service.selectCard(card.id)"
            >
              <div class="card-scene">
                <div class="insurance-card" [class.flipped]="card.isFlipped" [class]="'card-type-' + card.type">

                  <!-- Card Front -->
                  <div class="card-face card-front">
                    <div class="card-front-inner">
                      <!-- Chip decoration -->
                      <div class="card-chip">
                        <div class="chip-inner"></div>
                      </div>

                      <!-- Card Type Badge -->
                      <div class="card-type-badge">
                        <i [class]="getTypeIcon(card.type)"></i>
                        {{ getTypeLabel(card.type) }}
                      </div>

                      <!-- Carrier area -->
                      <div class="carrier-area">
                        <div class="carrier-logo-text">{{ getCarrierAbbrev(card.carrier) }}</div>
                        <div class="carrier-full">{{ card.carrier }}</div>
                      </div>

                      <!-- Plan name -->
                      <div class="plan-name">{{ card.planName }}</div>

                      <!-- Member details row -->
                      <div class="member-row">
                        <div class="member-field">
                          <span class="field-label">Member ID</span>
                          <span class="field-value mono">{{ card.memberId }}</span>
                        </div>
                        <div class="member-field">
                          <span class="field-label">Group #</span>
                          <span class="field-value mono">{{ card.groupNumber }}</span>
                        </div>
                      </div>

                      <!-- Subscriber -->
                      <div class="subscriber-row">
                        <div class="member-field">
                          <span class="field-label">Subscriber</span>
                          <span class="field-value">{{ card.subscriberName }}</span>
                        </div>
                        <div class="member-field">
                          <span class="field-label">Valid Thru</span>
                          <span class="field-value">{{ formatShortDate(card.expirationDate) }}</span>
                        </div>
                      </div>

                      <!-- Flip button -->
                      <button class="flip-btn" (click)="onFlip($event, card.id)">
                        <i class="pi pi-sync"></i> Show Details
                      </button>
                    </div>
                  </div>

                  <!-- Card Back -->
                  <div class="card-face card-back">
                    <div class="card-back-inner">
                      <div class="back-header">
                        <span class="back-carrier">{{ card.carrier }}</span>
                        <span class="back-type">{{ getTypeLabel(card.type) }}</span>
                      </div>

                      <div class="back-section">
                        <div class="back-section-title">Copay Schedule</div>
                        <div class="copay-grid">
                          <div class="copay-item">
                            <span class="copay-label">Primary Care</span>
                            <span class="copay-value">\${{ card.copay.primaryCare }}</span>
                          </div>
                          <div class="copay-item">
                            <span class="copay-label">Specialist</span>
                            <span class="copay-value">\${{ card.copay.specialist }}</span>
                          </div>
                          <div class="copay-item">
                            <span class="copay-label">Urgent Care</span>
                            <span class="copay-value">\${{ card.copay.urgentCare }}</span>
                          </div>
                          <div class="copay-item">
                            <span class="copay-label">Emergency</span>
                            <span class="copay-value">\${{ card.copay.emergency }}</span>
                          </div>
                        </div>
                      </div>

                      @if (card.rxBin) {
                        <div class="back-section">
                          <div class="back-section-title">Pharmacy (Rx)</div>
                          <div class="rx-grid">
                            <div class="rx-item">
                              <span class="rx-label">BIN</span>
                              <span class="rx-value mono">{{ card.rxBin }}</span>
                            </div>
                            <div class="rx-item">
                              <span class="rx-label">PCN</span>
                              <span class="rx-value mono">{{ card.rxPcn }}</span>
                            </div>
                            <div class="rx-item">
                              <span class="rx-label">Group</span>
                              <span class="rx-value mono">{{ card.rxGroup }}</span>
                            </div>
                          </div>
                        </div>
                      }

                      <div class="back-phones">
                        <div class="phone-item">
                          <i class="pi pi-phone"></i>
                          <span>Member Services: {{ card.phone }}</span>
                        </div>
                        @if (card.providerPhone !== card.phone) {
                          <div class="phone-item">
                            <i class="pi pi-phone"></i>
                            <span>Provider Line: {{ card.providerPhone }}</span>
                          </div>
                        }
                      </div>

                      <button class="flip-btn flip-btn-back" (click)="onFlip($event, card.id)">
                        <i class="pi pi-arrow-left"></i> Back to Card
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              <!-- Card selection indicator -->
              @if (service.selectedCardId() === card.id) {
                <div class="selected-indicator">
                  <i class="pi pi-check-circle"></i> Selected
                </div>
              }
            </div>
          }
        </div>
      </section>

      <!-- Benefits Summary for Selected Card -->
      @if (service.selectedCard(); as card) {
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">Benefits Summary</h2>
            <p class="section-subtitle">{{ card.planName }} — {{ card.carrier }}</p>
          </div>

          <div class="benefits-grid">

            <!-- Deductible Progress -->
            <div class="benefit-panel">
              <div class="benefit-panel-header">
                <div class="benefit-icon benefit-icon-blue">
                  <i class="pi pi-shield"></i>
                </div>
                <div>
                  <div class="benefit-panel-title">Individual Deductible</div>
                  <div class="benefit-panel-subtitle">Annual deductible progress</div>
                </div>
              </div>
              <div class="progress-section">
                <div class="progress-amounts">
                  <span class="progress-met">\${{ card.deductible.met.toLocaleString() }} met</span>
                  <span class="progress-total">of \${{ card.deductible.individual.toLocaleString() }}</span>
                </div>
                <div class="progress-bar-track">
                  <div
                    class="progress-bar-fill progress-fill-blue"
                    [style.width.%]="getPercent(card.deductible.met, card.deductible.individual)"
                  ></div>
                </div>
                <div class="progress-remaining">
                  \${{ (card.deductible.individual - card.deductible.met).toLocaleString() }} remaining
                  ({{ getPercent(card.deductible.met, card.deductible.individual).toFixed(0) }}% met)
                </div>
              </div>
            </div>

            <!-- Out-of-Pocket Max Progress -->
            <div class="benefit-panel">
              <div class="benefit-panel-header">
                <div class="benefit-icon benefit-icon-teal">
                  <i class="pi pi-wallet"></i>
                </div>
                <div>
                  <div class="benefit-panel-title">Out-of-Pocket Maximum</div>
                  <div class="benefit-panel-subtitle">Individual annual limit</div>
                </div>
              </div>
              <div class="progress-section">
                <div class="progress-amounts">
                  <span class="progress-met">\${{ card.outOfPocketMax.met.toLocaleString() }} spent</span>
                  <span class="progress-total">of \${{ card.outOfPocketMax.individual.toLocaleString() }}</span>
                </div>
                <div class="progress-bar-track">
                  <div
                    class="progress-bar-fill progress-fill-teal"
                    [style.width.%]="getPercent(card.outOfPocketMax.met, card.outOfPocketMax.individual)"
                  ></div>
                </div>
                <div class="progress-remaining">
                  \${{ (card.outOfPocketMax.individual - card.outOfPocketMax.met).toLocaleString() }} remaining until fully covered
                </div>
              </div>
            </div>

            <!-- Copay Quick Reference -->
            <div class="benefit-panel copay-panel">
              <div class="benefit-panel-header">
                <div class="benefit-icon benefit-icon-purple">
                  <i class="pi pi-dollar"></i>
                </div>
                <div>
                  <div class="benefit-panel-title">Copay Reference</div>
                  <div class="benefit-panel-subtitle">Your cost per visit</div>
                </div>
              </div>
              <div class="copay-reference-grid">
                <div class="copay-ref-item">
                  <i class="pi pi-user-plus copay-ref-icon icon-green"></i>
                  <div class="copay-ref-details">
                    <span class="copay-ref-label">Primary Care</span>
                    <span class="copay-ref-amount">\${{ card.copay.primaryCare }}</span>
                  </div>
                </div>
                <div class="copay-ref-item">
                  <i class="pi pi-heart copay-ref-icon icon-blue"></i>
                  <div class="copay-ref-details">
                    <span class="copay-ref-label">Specialist</span>
                    <span class="copay-ref-amount">\${{ card.copay.specialist }}</span>
                  </div>
                </div>
                <div class="copay-ref-item">
                  <i class="pi pi-clock copay-ref-icon icon-orange"></i>
                  <div class="copay-ref-details">
                    <span class="copay-ref-label">Urgent Care</span>
                    <span class="copay-ref-amount">\${{ card.copay.urgentCare }}</span>
                  </div>
                </div>
                <div class="copay-ref-item">
                  <i class="pi pi-exclamation-triangle copay-ref-icon icon-red"></i>
                  <div class="copay-ref-details">
                    <span class="copay-ref-label">Emergency</span>
                    <span class="copay-ref-amount">\${{ card.copay.emergency }}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        <!-- Benefit Usage Breakdown -->
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">Benefit Usage</h2>
            <p class="section-subtitle">Year-to-date utilization across service categories</p>
          </div>

          <div class="usage-panel">
            @for (item of service.benefitUsage(); track item.category) {
              <div class="usage-row">
                <div class="usage-category">
                  <i [class]="getCategoryIcon(item.category)"></i>
                  <span class="usage-category-name">{{ item.category }}</span>
                </div>
                <div class="usage-bar-area">
                  <div class="usage-bar-track">
                    <div
                      class="usage-bar-fill"
                      [style.width.%]="getPercent(item.used, item.total)"
                      [class]="'usage-fill-' + getCategoryColor(item.category)"
                    ></div>
                  </div>
                </div>
                <div class="usage-counts">
                  <span class="usage-used">{{ item.used }}</span>
                  <span class="usage-divider">/</span>
                  <span class="usage-total">{{ item.total }} {{ item.unit }}</span>
                </div>
                <div class="usage-pct">{{ getPercent(item.used, item.total).toFixed(0) }}%</div>
              </div>
            }
          </div>
        </section>

        <!-- QR Code Section -->
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">Show at Provider's Office</h2>
            <p class="section-subtitle">Present this QR code or your digital card to verify coverage instantly</p>
          </div>

          <div class="qr-section">
            <div class="qr-card">
              <div class="qr-left">
                <div class="qr-wrapper">
                  <svg class="qr-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                    <!-- Outer finder patterns -->
                    <!-- Top-left finder -->
                    <rect x="4" y="4" width="34" height="34" rx="3" fill="none" stroke="currentColor" stroke-width="4"/>
                    <rect x="12" y="12" width="18" height="18" rx="1" fill="currentColor"/>
                    <!-- Top-right finder -->
                    <rect x="82" y="4" width="34" height="34" rx="3" fill="none" stroke="currentColor" stroke-width="4"/>
                    <rect x="90" y="12" width="18" height="18" rx="1" fill="currentColor"/>
                    <!-- Bottom-left finder -->
                    <rect x="4" y="82" width="34" height="34" rx="3" fill="none" stroke="currentColor" stroke-width="4"/>
                    <rect x="12" y="90" width="18" height="18" rx="1" fill="currentColor"/>
                    <!-- Data modules - timing and data cells -->
                    <!-- Timing row H -->
                    <rect x="42" y="40" width="4" height="4" fill="currentColor"/>
                    <rect x="50" y="40" width="4" height="4" fill="currentColor"/>
                    <rect x="58" y="40" width="4" height="4" fill="currentColor"/>
                    <rect x="66" y="40" width="4" height="4" fill="currentColor"/>
                    <rect x="74" y="40" width="4" height="4" fill="currentColor"/>
                    <!-- Timing col V -->
                    <rect x="40" y="42" width="4" height="4" fill="currentColor"/>
                    <rect x="40" y="50" width="4" height="4" fill="currentColor"/>
                    <rect x="40" y="58" width="4" height="4" fill="currentColor"/>
                    <rect x="40" y="66" width="4" height="4" fill="currentColor"/>
                    <rect x="40" y="74" width="4" height="4" fill="currentColor"/>
                    <!-- Data area cells (simulated pattern) -->
                    <rect x="48" y="48" width="4" height="4" fill="currentColor"/>
                    <rect x="56" y="48" width="4" height="4" fill="currentColor"/>
                    <rect x="72" y="48" width="4" height="4" fill="currentColor"/>
                    <rect x="48" y="56" width="4" height="4" fill="currentColor"/>
                    <rect x="64" y="56" width="4" height="4" fill="currentColor"/>
                    <rect x="80" y="56" width="4" height="4" fill="currentColor"/>
                    <rect x="56" y="64" width="4" height="4" fill="currentColor"/>
                    <rect x="64" y="64" width="4" height="4" fill="currentColor"/>
                    <rect x="72" y="64" width="4" height="4" fill="currentColor"/>
                    <rect x="48" y="72" width="4" height="4" fill="currentColor"/>
                    <rect x="60" y="72" width="4" height="4" fill="currentColor"/>
                    <rect x="76" y="72" width="4" height="4" fill="currentColor"/>
                    <rect x="54" y="80" width="4" height="4" fill="currentColor"/>
                    <rect x="68" y="80" width="4" height="4" fill="currentColor"/>
                    <rect x="80" y="80" width="4" height="4" fill="currentColor"/>
                    <rect x="48" y="88" width="4" height="4" fill="currentColor"/>
                    <rect x="60" y="88" width="4" height="4" fill="currentColor"/>
                    <rect x="72" y="88" width="4" height="4" fill="currentColor"/>
                    <rect x="56" y="96" width="4" height="4" fill="currentColor"/>
                    <rect x="72" y="96" width="4" height="4" fill="currentColor"/>
                    <rect x="80" y="96" width="4" height="4" fill="currentColor"/>
                    <rect x="48" y="104" width="4" height="4" fill="currentColor"/>
                    <rect x="64" y="104" width="4" height="4" fill="currentColor"/>
                    <rect x="76" y="104" width="4" height="4" fill="currentColor"/>
                    <!-- Additional data cells top-right area -->
                    <rect x="48" y="4" width="4" height="4" fill="currentColor"/>
                    <rect x="56" y="4" width="4" height="4" fill="currentColor"/>
                    <rect x="68" y="4" width="4" height="4" fill="currentColor"/>
                    <rect x="76" y="4" width="4" height="4" fill="currentColor"/>
                    <rect x="48" y="12" width="4" height="4" fill="currentColor"/>
                    <rect x="60" y="12" width="4" height="4" fill="currentColor"/>
                    <rect x="76" y="12" width="4" height="4" fill="currentColor"/>
                    <rect x="56" y="20" width="4" height="4" fill="currentColor"/>
                    <rect x="68" y="20" width="4" height="4" fill="currentColor"/>
                    <rect x="48" y="28" width="4" height="4" fill="currentColor"/>
                    <rect x="60" y="28" width="4" height="4" fill="currentColor"/>
                    <rect x="72" y="28" width="4" height="4" fill="currentColor"/>
                    <!-- Bottom-right additional -->
                    <rect x="88" y="48" width="4" height="4" fill="currentColor"/>
                    <rect x="100" y="48" width="4" height="4" fill="currentColor"/>
                    <rect x="88" y="60" width="4" height="4" fill="currentColor"/>
                    <rect x="96" y="60" width="4" height="4" fill="currentColor"/>
                    <rect x="108" y="60" width="4" height="4" fill="currentColor"/>
                    <rect x="92" y="68" width="4" height="4" fill="currentColor"/>
                    <rect x="104" y="68" width="4" height="4" fill="currentColor"/>
                    <rect x="88" y="76" width="4" height="4" fill="currentColor"/>
                    <rect x="100" y="76" width="4" height="4" fill="currentColor"/>
                    <rect x="108" y="76" width="4" height="4" fill="currentColor"/>
                    <rect x="92" y="84" width="4" height="4" fill="currentColor"/>
                    <rect x="88" y="92" width="4" height="4" fill="currentColor"/>
                    <rect x="100" y="92" width="4" height="4" fill="currentColor"/>
                    <rect x="4" y="48" width="4" height="4" fill="currentColor"/>
                    <rect x="16" y="48" width="4" height="4" fill="currentColor"/>
                    <rect x="28" y="48" width="4" height="4" fill="currentColor"/>
                    <rect x="8" y="56" width="4" height="4" fill="currentColor"/>
                    <rect x="24" y="56" width="4" height="4" fill="currentColor"/>
                    <rect x="4" y="64" width="4" height="4" fill="currentColor"/>
                    <rect x="20" y="64" width="4" height="4" fill="currentColor"/>
                    <rect x="32" y="64" width="4" height="4" fill="currentColor"/>
                    <rect x="12" y="72" width="4" height="4" fill="currentColor"/>
                    <rect x="28" y="72" width="4" height="4" fill="currentColor"/>
                  </svg>
                </div>
                <p class="qr-hint">Scan to verify coverage</p>
              </div>

              <div class="qr-right">
                <div class="qr-card-info">
                  <div class="qr-carrier">{{ card.carrier }}</div>
                  <div class="qr-plan">{{ card.planName }}</div>
                  <div class="qr-detail-rows">
                    <div class="qr-detail-row">
                      <span class="qr-detail-label">Member ID</span>
                      <span class="qr-detail-value mono">{{ card.memberId }}</span>
                    </div>
                    <div class="qr-detail-row">
                      <span class="qr-detail-label">Group</span>
                      <span class="qr-detail-value mono">{{ card.groupNumber }}</span>
                    </div>
                    <div class="qr-detail-row">
                      <span class="qr-detail-label">Subscriber</span>
                      <span class="qr-detail-value">{{ card.subscriberName }}</span>
                    </div>
                    <div class="qr-detail-row">
                      <span class="qr-detail-label">Valid Through</span>
                      <span class="qr-detail-value">{{ formatLongDate(card.expirationDate) }}</span>
                    </div>
                    @if (card.dependents.length > 0) {
                      <div class="qr-detail-row">
                        <span class="qr-detail-label">Dependents</span>
                        <span class="qr-detail-value">{{ card.dependents.join(', ') }}</span>
                      </div>
                    }
                  </div>
                </div>

                <div class="qr-actions">
                  <button class="qr-action-btn qr-action-primary">
                    <i class="pi pi-download"></i>
                    Save to Device
                  </button>
                  <button class="qr-action-btn">
                    <i class="pi pi-share-alt"></i>
                    Share Card
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      }

    </div>
  `,
  styles: [`
    /* ===== Page Layout ===== */
    .insurance-page {
      max-width: 1200px;
      margin: 0 auto;
    }

    /* ===== Page Header ===== */
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 2rem;
      gap: 1rem;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--blue-500), var(--blue-700));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      flex-shrink: 0;
    }

    .page-title {
      margin: 0 0 0.2rem;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .page-subtitle {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }

    .active-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.875rem;
      background: var(--green-50, #f0fdf4);
      color: var(--green-700);
      border: 1px solid var(--green-200, #bbf7d0);
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
    }

    /* ===== Section ===== */
    .section {
      margin-bottom: 2rem;
    }

    .section-header {
      margin-bottom: 1.25rem;
    }

    .section-title {
      margin: 0 0 0.25rem;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .section-subtitle {
      margin: 0;
      font-size: 0.825rem;
      color: var(--text-color-secondary);
    }

    /* ===== Insurance Cards Grid ===== */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    .card-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      cursor: pointer;
    }

    .selected-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary-700);
      padding: 0.25rem 0;
    }

    /* ===== Card Flip Scene ===== */
    .card-scene {
      perspective: 1000px;
      width: 100%;
      height: 220px;
    }

    .insurance-card {
      width: 100%;
      height: 100%;
      position: relative;
      transform-style: preserve-3d;
      transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.12);
    }

    .insurance-card.flipped {
      transform: rotateY(180deg);
    }

    .card-wrapper.selected .insurance-card {
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.22), 0 0 0 3px var(--primary-400), 0 2px 8px rgba(0, 0, 0, 0.12);
    }

    .card-face {
      position: absolute;
      inset: 0;
      border-radius: 16px;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      overflow: hidden;
    }

    .card-back {
      transform: rotateY(180deg);
    }

    /* ===== Card Type Gradients ===== */
    .card-type-medical .card-front {
      background: linear-gradient(135deg, #1a56a4 0%, #0f3a7a 40%, #1e4d9e 70%, #1a3a8f 100%);
    }

    .card-type-dental .card-front {
      background: linear-gradient(135deg, #0d7a74 0%, #065f5a 40%, #0e8080 70%, #0a6b6b 100%);
    }

    .card-type-vision .card-front {
      background: linear-gradient(135deg, #5a3b9e 0%, #3d2070 40%, #6b4db5 70%, #4a2d8f 100%);
    }

    .card-type-medical .card-back {
      background: linear-gradient(160deg, #1042a4 0%, #0c2f6e 100%);
    }

    .card-type-dental .card-back {
      background: linear-gradient(160deg, #0b706b 0%, #055050 100%);
    }

    .card-type-vision .card-back {
      background: linear-gradient(160deg, #4e2f9a 0%, #321860 100%);
    }

    /* ===== Card Front ===== */
    .card-front-inner {
      padding: 1.125rem 1.25rem 1rem;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
      color: white;
    }

    /* Decorative holographic shimmer overlay */
    .card-front::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        105deg,
        transparent 20%,
        rgba(255,255,255,0.05) 40%,
        rgba(255,255,255,0.12) 50%,
        rgba(255,255,255,0.05) 60%,
        transparent 80%
      );
      pointer-events: none;
    }

    /* Decorative circle in corner */
    .card-front::after {
      content: '';
      position: absolute;
      top: -30px;
      right: -30px;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: rgba(255,255,255,0.06);
      pointer-events: none;
    }

    .card-chip {
      width: 32px;
      height: 24px;
      background: linear-gradient(135deg, #e0b84a, #c9a23c);
      border-radius: 4px;
      margin-bottom: 0.625rem;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .chip-inner {
      width: 20px;
      height: 14px;
      border: 1.5px solid rgba(0,0,0,0.2);
      border-radius: 2px;
      background: linear-gradient(135deg, #d4a83a, #b8912e);
    }

    .card-type-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.9);
      background: rgba(255,255,255,0.15);
      padding: 0.25rem 0.5rem;
      border-radius: 20px;
      backdrop-filter: blur(4px);
    }

    .carrier-area {
      margin-bottom: 0.375rem;
    }

    .carrier-logo-text {
      font-size: 1.25rem;
      font-weight: 900;
      letter-spacing: -0.02em;
      color: white;
      line-height: 1;
      margin-bottom: 0.125rem;
    }

    .carrier-full {
      font-size: 0.65rem;
      color: rgba(255,255,255,0.7);
      letter-spacing: 0.04em;
    }

    .plan-name {
      font-size: 0.8rem;
      font-weight: 600;
      color: rgba(255,255,255,0.85);
      margin-bottom: auto;
      padding-bottom: 0.375rem;
    }

    .member-row,
    .subscriber-row {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .member-field {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .field-label {
      font-size: 0.55rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.6);
    }

    .field-value {
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
    }

    .mono {
      font-family: 'Courier New', Courier, monospace;
      letter-spacing: 0.04em;
    }

    /* ===== Flip Button ===== */
    .flip-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.3rem 0.75rem;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 20px;
      background: rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.9);
      font-size: 0.7rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
      align-self: flex-start;
      margin-top: 0.25rem;
      backdrop-filter: blur(4px);
    }

    .flip-btn:hover {
      background: rgba(255,255,255,0.22);
      border-color: rgba(255,255,255,0.5);
    }

    /* ===== Card Back ===== */
    .card-back-inner {
      padding: 0.875rem 1.125rem;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      color: white;
      overflow: hidden;
    }

    .back-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.125rem;
    }

    .back-carrier {
      font-size: 0.75rem;
      font-weight: 700;
      color: rgba(255,255,255,0.9);
    }

    .back-type {
      font-size: 0.6rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.6);
      background: rgba(255,255,255,0.12);
      padding: 0.15rem 0.4rem;
      border-radius: 10px;
    }

    .back-section {
      flex: 1;
    }

    .back-section-title {
      font-size: 0.55rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.55);
      margin-bottom: 0.3rem;
    }

    .copay-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.2rem 0.75rem;
    }

    .copay-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .copay-label {
      font-size: 0.65rem;
      color: rgba(255,255,255,0.65);
    }

    .copay-value {
      font-size: 0.7rem;
      font-weight: 700;
      color: white;
    }

    .rx-grid {
      display: flex;
      gap: 1rem;
    }

    .rx-item {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }

    .rx-label {
      font-size: 0.55rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.55);
    }

    .rx-value {
      font-size: 0.7rem;
      font-weight: 700;
      color: white;
    }

    .back-phones {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .phone-item {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.62rem;
      color: rgba(255,255,255,0.7);
    }

    .phone-item i {
      font-size: 0.6rem;
      opacity: 0.7;
    }

    .flip-btn-back {
      margin-top: auto;
    }

    /* ===== Benefits Grid ===== */
    .benefits-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1.25rem;
    }

    .benefit-panel {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1.25rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .benefit-panel-header {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      margin-bottom: 1.125rem;
    }

    .benefit-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .benefit-icon-blue {
      background: var(--blue-50, #eff6ff);
      color: var(--blue-600);
    }

    .benefit-icon-teal {
      background: var(--teal-50, #f0fdfa);
      color: var(--teal-600);
    }

    .benefit-icon-purple {
      background: #f5f0ff;
      color: #7c3aed;
    }

    .benefit-panel-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-color);
      margin-bottom: 0.15rem;
    }

    .benefit-panel-subtitle {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .progress-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .progress-amounts {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .progress-met {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .progress-total {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .progress-bar-track {
      width: 100%;
      height: 10px;
      background: var(--surface-200, #e2e8f0);
      border-radius: 10px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: 10px;
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .progress-fill-blue {
      background: linear-gradient(90deg, var(--blue-400), var(--blue-600));
    }

    .progress-fill-teal {
      background: linear-gradient(90deg, var(--teal-400), var(--teal-600));
    }

    .progress-remaining {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    /* ===== Copay Reference Panel ===== */
    .copay-reference-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .copay-ref-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.625rem;
      background: var(--surface-ground);
      border-radius: 8px;
    }

    .copay-ref-icon {
      font-size: 1rem;
      flex-shrink: 0;
    }

    .icon-green { color: var(--green-600); }
    .icon-blue { color: var(--blue-600); }
    .icon-orange { color: var(--orange-500); }
    .icon-red { color: var(--red-500); }

    .copay-ref-details {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }

    .copay-ref-label {
      font-size: 0.7rem;
      color: var(--text-color-secondary);
    }

    .copay-ref-amount {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-color);
    }

    /* ===== Benefit Usage ===== */
    .usage-panel {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1.25rem 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .usage-row {
      display: grid;
      grid-template-columns: 200px 1fr 130px 50px;
      align-items: center;
      gap: 1rem;
    }

    .usage-category {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .usage-category i {
      font-size: 0.9rem;
      color: var(--text-color-secondary);
      width: 16px;
      text-align: center;
    }

    .usage-category-name {
      white-space: nowrap;
    }

    .usage-bar-area {
      flex: 1;
    }

    .usage-bar-track {
      width: 100%;
      height: 8px;
      background: var(--surface-200, #e2e8f0);
      border-radius: 8px;
      overflow: hidden;
    }

    .usage-bar-fill {
      height: 100%;
      border-radius: 8px;
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .usage-fill-blue { background: linear-gradient(90deg, var(--blue-400), var(--blue-600)); }
    .usage-fill-green { background: linear-gradient(90deg, var(--green-400), var(--green-600)); }
    .usage-fill-purple { background: linear-gradient(90deg, #8b5cf6, #6d28d9); }
    .usage-fill-orange { background: linear-gradient(90deg, var(--orange-400), var(--orange-600)); }
    .usage-fill-teal { background: linear-gradient(90deg, var(--teal-400), var(--teal-600)); }

    .usage-counts {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      justify-content: flex-end;
      white-space: nowrap;
    }

    .usage-used {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .usage-divider {
      color: var(--surface-400, #94a3b8);
    }

    .usage-total {
      font-size: 0.75rem;
    }

    .usage-pct {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-color-secondary);
      text-align: right;
    }

    /* ===== QR Section ===== */
    .qr-card {
      display: flex;
      gap: 2rem;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1.75rem 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      align-items: flex-start;
    }

    .qr-left {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .qr-wrapper {
      width: 140px;
      height: 140px;
      padding: 12px;
      background: white;
      border-radius: 12px;
      border: 2px solid var(--surface-border);
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }

    .qr-svg {
      width: 100%;
      height: 100%;
      color: #111;
    }

    .qr-hint {
      margin: 0;
      font-size: 0.7rem;
      color: var(--text-color-secondary);
      text-align: center;
    }

    .qr-right {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .qr-carrier {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-color);
      margin-bottom: 0.125rem;
    }

    .qr-plan {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      margin-bottom: 0.75rem;
    }

    .qr-detail-rows {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.625rem 1.5rem;
    }

    .qr-detail-row {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .qr-detail-label {
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-color-secondary);
    }

    .qr-detail-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .qr-actions {
      display: flex;
      gap: 0.75rem;
    }

    .qr-action-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 1.125rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
      border: 1px solid var(--surface-border);
      background: var(--surface-ground);
      color: var(--text-color);
    }

    .qr-action-btn:hover {
      background: var(--surface-hover);
    }

    .qr-action-primary {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }

    .qr-action-primary:hover {
      background: var(--primary-700);
      border-color: var(--primary-700);
    }

    /* ===== Responsive ===== */
    @media (max-width: 1100px) {
      .cards-grid {
        grid-template-columns: 1fr 1fr;
      }

      .benefits-grid {
        grid-template-columns: 1fr 1fr;
      }

      .copay-panel {
        grid-column: 1 / -1;
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .cards-grid {
        grid-template-columns: 1fr;
        max-width: 380px;
      }

      .benefits-grid {
        grid-template-columns: 1fr;
      }

      .usage-row {
        grid-template-columns: 1fr 1fr;
        grid-template-rows: auto auto;
      }

      .usage-category {
        grid-column: 1 / -1;
      }

      .usage-bar-area {
        grid-column: 1 / 3;
        grid-row: 2;
      }

      .usage-counts {
        grid-column: 1;
        grid-row: 3;
        justify-content: flex-start;
      }

      .usage-pct {
        grid-column: 2;
        grid-row: 3;
      }

      .qr-card {
        flex-direction: column;
        align-items: center;
      }

      .qr-detail-rows {
        grid-template-columns: 1fr;
      }

      .qr-actions {
        flex-direction: column;
      }
    }
  `]
})
export class InsuranceComponent {
  readonly service = inject(InsuranceService);

  onFlip(event: Event, id: string): void {
    event.stopPropagation();
    this.service.flipCard(id);
  }

  getTypeIcon(type: InsuranceType): string {
    const icons: Record<InsuranceType, string> = {
      medical: 'pi pi-heart-fill',
      dental: 'pi pi-star-fill',
      vision: 'pi pi-eye'
    };
    return icons[type];
  }

  getTypeLabel(type: InsuranceType): string {
    const labels: Record<InsuranceType, string> = {
      medical: 'Medical',
      dental: 'Dental',
      vision: 'Vision'
    };
    return labels[type];
  }

  getCarrierAbbrev(carrier: string): string {
    const words = carrier.split(' ');
    if (words.length >= 3) {
      return words.slice(0, 3).map(w => w[0]).join('');
    }
    if (words.length === 2) {
      return words.map(w => w.slice(0, 4)).join(' ');
    }
    return carrier.slice(0, 6).toUpperCase();
  }

  getPercent(used: number, total: number): number {
    if (total === 0) return 0;
    return Math.min(100, (used / total) * 100);
  }

  formatShortDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' });
  }

  formatLongDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Office Visits': 'pi pi-building',
      'Lab Work': 'pi pi-flask',
      'Prescriptions': 'pi pi-box',
      'Physical Therapy': 'pi pi-user',
      'Mental Health': 'pi pi-heart'
    };
    return icons[category] ?? 'pi pi-circle';
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'Office Visits': 'blue',
      'Lab Work': 'green',
      'Prescriptions': 'purple',
      'Physical Therapy': 'orange',
      'Mental Health': 'teal'
    };
    return colors[category] ?? 'blue';
  }
}
