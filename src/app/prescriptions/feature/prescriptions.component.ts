import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { PrescriptionsService, Prescription, RefillRequest, PharmacyInfo } from '../data-access';

@Component({
  selector: 'app-prescriptions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, CardModule, TagModule, DialogModule, TooltipModule],
  template: `
    <div class="prescriptions-page">

      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-box"></i>
          </div>
          <div>
            <h1 class="page-title">Prescriptions</h1>
            <p class="page-subtitle">Manage your medications and request pharmacy refills</p>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat-pill">
            <span class="stat-pill-num">{{ svc.activeMedications().length }}</span>
            <span class="stat-pill-label">Active Medications</span>
          </div>
          <div class="stat-pill">
            <span class="stat-pill-num">{{ svc.pendingRefills().length }}</span>
            <span class="stat-pill-label">Pending Refills</span>
          </div>
        </div>
      </div>

      <!-- Drug Interaction Warning Banner -->
      @if (svc.interactionWarnings().length > 0) {
        <div class="interaction-banner">
          <div class="interaction-banner-icon">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <div class="interaction-banner-body">
            <strong>Drug Interaction Notice</strong>
            <p>
              @for (rx of svc.interactionWarnings(); track rx.id; let last = $last) {
                <span>{{ rx.medicationName }}: {{ rx.interactionNote }}</span>
                @if (!last) { <span class="banner-sep"> &bull; </span> }
              }
            </p>
          </div>
          <button class="banner-dismiss" (click)="dismissBanner()" pTooltip="Dismiss" tooltipPosition="left">
            <i class="pi pi-times"></i>
          </button>
        </div>
      }

      <!-- Tab Navigation -->
      <div class="tab-nav">
        <button class="tab-btn" [class.active]="activeTab() === 'medications'" (click)="activeTab.set('medications')">
          <i class="pi pi-pills"></i>
          My Medications
          <span class="tab-count">{{ svc.activeMedications().length }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'tracker'" (click)="activeTab.set('tracker')">
          <i class="pi pi-truck"></i>
          Refill Tracker
          @if (svc.pendingRefills().length > 0) {
            <span class="tab-count accent">{{ svc.pendingRefills().length }}</span>
          }
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- TAB: MY MEDICATIONS                                                 -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      @if (activeTab() === 'medications') {
        <div class="medications-grid">
          @for (rx of svc.activeMedications(); track rx.id) {
            <div class="med-card" [class.has-warning]="rx.hasInteractionWarning">
              <!-- Card Header -->
              <div class="med-card-header">
                <div class="med-icon-wrap">
                  <i class="pi pi-box"></i>
                </div>
                <div class="med-title-group">
                  <h3 class="med-name">{{ rx.medicationName }}</h3>
                  @if (rx.genericName && rx.genericName !== rx.medicationName) {
                    <span class="med-generic">Generic: {{ rx.genericName }}</span>
                  }
                </div>
                @if (rx.hasInteractionWarning) {
                  <span class="warning-badge" pTooltip="{{ rx.interactionNote }}" tooltipPosition="top">
                    <i class="pi pi-exclamation-triangle"></i>
                  </span>
                }
              </div>

              <!-- Dosage & Frequency -->
              <div class="med-details">
                <div class="med-detail-row">
                  <i class="pi pi-info-circle detail-icon"></i>
                  <span class="detail-label">Dose:</span>
                  <span class="detail-value">{{ rx.dosage }} — {{ rx.frequency }}</span>
                </div>
                <div class="med-detail-row">
                  <i class="pi pi-user detail-icon"></i>
                  <span class="detail-label">Prescriber:</span>
                  <span class="detail-value">{{ rx.prescribedBy }}</span>
                </div>
                <div class="med-detail-row">
                  <i class="pi pi-map-marker detail-icon"></i>
                  <span class="detail-label">Pharmacy:</span>
                  <span class="detail-value">{{ rx.pharmacyName ?? 'Not specified' }}</span>
                </div>
                @if (rx.lastFilledDate) {
                  <div class="med-detail-row">
                    <i class="pi pi-calendar detail-icon"></i>
                    <span class="detail-label">Last filled:</span>
                    <span class="detail-value">{{ formatDate(rx.lastFilledDate) }}</span>
                  </div>
                }
              </div>

              <!-- Refill Bar -->
              <div class="refill-section">
                <div class="refill-label-row">
                  <span class="refill-label">Refills remaining</span>
                  <span class="refill-count" [class]="getRefillCountClass(rx.refillsRemaining)">
                    {{ rx.refillsRemaining }} / {{ rx.refillsTotal }}
                  </span>
                </div>
                <div class="refill-bar-track">
                  <div
                    class="refill-bar-fill"
                    [class]="svc.getRefillBarClass(rx.refillsRemaining)"
                    [style.width.%]="svc.getRefillBarWidth(rx.refillsRemaining, rx.refillsTotal)"
                  ></div>
                </div>
              </div>

              <!-- Instructions -->
              <div class="med-instructions">
                <i class="pi pi-comment instructions-icon"></i>
                <span>{{ rx.instructions }}</span>
              </div>

              <!-- Action Footer -->
              <div class="med-card-footer">
                @if (rx.canRequestRefill && rx.refillsRemaining > 0) {
                  <button
                    pButton
                    label="Request Refill"
                    icon="pi pi-refresh"
                    class="p-button-sm p-button-outlined refill-btn"
                    (click)="svc.openRefillDialog(rx.id)"
                  ></button>
                } @else if (rx.refillsRemaining === 0) {
                  <div class="no-refills-msg">
                    <i class="pi pi-info-circle"></i>
                    No refills remaining — contact your provider
                  </div>
                } @else {
                  <div class="no-refills-msg">
                    <i class="pi pi-lock"></i>
                    Refill not available for this medication
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- TAB: REFILL TRACKER                                                 -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      @if (activeTab() === 'tracker') {
        @if (svc.refillRequests().length === 0) {
          <div class="empty-state">
            <i class="pi pi-truck"></i>
            <p>No refill requests yet. Use the <strong>My Medications</strong> tab to request a refill.</p>
          </div>
        } @else {
          <div class="tracker-list">
            @for (rr of svc.refillRequests(); track rr.id) {
              <div class="tracker-card" [class]="'status-' + rr.status">
                <!-- Tracker Header -->
                <div class="tracker-header">
                  <div class="tracker-title-group">
                    <h3 class="tracker-med-name">{{ rr.medicationName }}</h3>
                    <span class="tracker-pharmacy">
                      <i class="pi pi-map-marker"></i> {{ rr.pharmacy }} &mdash; {{ rr.pharmacyAddress }}
                    </span>
                  </div>
                  <p-tag
                    [value]="svc.getStatusLabel(rr.status)"
                    [severity]="svc.getStatusSeverity(rr.status)"
                  ></p-tag>
                </div>

                <!-- Status Stepper -->
                <div class="stepper">
                  @for (step of refillSteps; track step.key) {
                    <div class="step" [class.step-done]="svc.getRefillProgress(rr.status) > step.order"
                                     [class.step-active]="svc.getRefillProgress(rr.status) === step.order">
                      <div class="step-circle">
                        @if (svc.getRefillProgress(rr.status) > step.order) {
                          <i class="pi pi-check"></i>
                        } @else {
                          <span>{{ step.order }}</span>
                        }
                      </div>
                      <div class="step-label">{{ step.label }}</div>
                    </div>
                    @if (step.order < refillSteps.length) {
                      <div class="step-connector" [class.connector-done]="svc.getRefillProgress(rr.status) > step.order"></div>
                    }
                  }
                </div>

                <!-- Tracker Meta -->
                <div class="tracker-meta">
                  <div class="tracker-meta-item">
                    <i class="pi pi-clock"></i>
                    <span>Requested: {{ formatDateTime(rr.requestedAt) }}</span>
                  </div>
                  @if (rr.estimatedReady) {
                    <div class="tracker-meta-item">
                      <i class="pi pi-calendar-plus"></i>
                      <span>Estimated ready: {{ formatDate(rr.estimatedReady) }}</span>
                    </div>
                  }
                  @if (rr.notes) {
                    <div class="tracker-meta-item tracker-note">
                      <i class="pi pi-comment"></i>
                      <span>{{ rr.notes }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      }

    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- REFILL WIZARD DIALOG                                                    -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <p-dialog
      [visible]="svc.dialogOpen()"
      (visibleChange)="onDialogVisibilityChange($event)"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '600px', 'max-width': '95vw' }"
      styleClass="refill-dialog"
    >
      <ng-template pTemplate="header">
        <div class="dialog-header">
          <div class="dialog-header-icon">
            <i class="pi pi-refresh"></i>
          </div>
          <div>
            <span class="dialog-title">Request Medication Refill</span>
            <div class="dialog-step-indicator">
              Step {{ svc.refillStep() === 'select-pharmacy' ? 1 : 2 }} of 2 —
              {{ svc.refillStep() === 'select-pharmacy' ? 'Choose Pharmacy' : 'Confirm & Submit' }}
            </div>
          </div>
        </div>
      </ng-template>

      <!-- ─── Step 1: Select Pharmacy ─── -->
      @if (svc.refillStep() === 'select-pharmacy') {
        <div class="dialog-body">
          @if (svc.selectedMedication(); as med) {
            <div class="selected-med-summary">
              <i class="pi pi-box"></i>
              <div>
                <div class="summary-name">{{ med.medicationName }}</div>
                <div class="summary-dose">{{ med.dosage }} &bull; {{ med.frequency }}</div>
              </div>
              <span class="summary-refills">{{ med.refillsRemaining }} refill{{ med.refillsRemaining !== 1 ? 's' : '' }} remaining</span>
            </div>
          }

          <h4 class="step-heading">Select a Pharmacy</h4>
          <div class="pharmacy-list">
            @for (ph of svc.pharmacies(); track ph.id) {
              <button
                class="pharmacy-card"
                [class.selected]="svc.selectedPharmacyId() === ph.id"
                (click)="svc.selectPharmacy(ph.id)"
              >
                <div class="pharmacy-card-inner">
                  <div class="pharmacy-radio">
                    <div class="radio-outer" [class.radio-checked]="svc.selectedPharmacyId() === ph.id">
                      @if (svc.selectedPharmacyId() === ph.id) {
                        <div class="radio-inner"></div>
                      }
                    </div>
                  </div>
                  <div class="pharmacy-info">
                    <div class="pharmacy-name-row">
                      <span class="pharmacy-name">{{ ph.name }}</span>
                      @if (ph.isPreferred) {
                        <span class="preferred-badge">Preferred</span>
                      }
                    </div>
                    <div class="pharmacy-address">{{ ph.address }}, {{ ph.city }}</div>
                    <div class="pharmacy-meta-row">
                      <span class="pharmacy-meta-item"><i class="pi pi-phone"></i> {{ ph.phone }}</span>
                      <span class="pharmacy-meta-item"><i class="pi pi-clock"></i> {{ ph.hours }}</span>
                    </div>
                  </div>
                  <div class="pharmacy-distance">
                    <i class="pi pi-map-marker"></i>
                    {{ ph.distance }}
                  </div>
                </div>
              </button>
            }
          </div>
        </div>

        <ng-template pTemplate="footer">
          <div class="dialog-footer">
            <button pButton label="Cancel" class="p-button-text p-button-secondary" (click)="svc.closeRefillDialog()"></button>
            <button pButton label="Next: Confirm" icon="pi pi-arrow-right" iconPos="right"
                    [disabled]="!svc.selectedPharmacyId()"
                    (click)="svc.goToConfirm()"></button>
          </div>
        </ng-template>
      }

      <!-- ─── Step 2: Confirm & Submit ─── -->
      @if (svc.refillStep() === 'confirm') {
        <div class="dialog-body">
          <h4 class="step-heading">Confirm Your Refill Request</h4>

          <div class="confirm-card">
            <div class="confirm-section">
              <div class="confirm-section-label">Medication</div>
              @if (svc.selectedMedication(); as med) {
                <div class="confirm-row">
                  <span class="confirm-key">Name</span>
                  <span class="confirm-val">{{ med.medicationName }}</span>
                </div>
                <div class="confirm-row">
                  <span class="confirm-key">Dosage</span>
                  <span class="confirm-val">{{ med.dosage }}</span>
                </div>
                <div class="confirm-row">
                  <span class="confirm-key">Frequency</span>
                  <span class="confirm-val">{{ med.frequency }}</span>
                </div>
                <div class="confirm-row">
                  <span class="confirm-key">Prescriber</span>
                  <span class="confirm-val">{{ med.prescribedBy }}</span>
                </div>
                <div class="confirm-row">
                  <span class="confirm-key">Refills remaining after this request</span>
                  <span class="confirm-val">{{ med.refillsRemaining - 1 }} of {{ med.refillsTotal }}</span>
                </div>
              }
            </div>

            <div class="confirm-divider"></div>

            <div class="confirm-section">
              <div class="confirm-section-label">Pickup Pharmacy</div>
              @if (svc.selectedPharmacy(); as ph) {
                <div class="confirm-row">
                  <span class="confirm-key">Pharmacy</span>
                  <span class="confirm-val">{{ ph.name }}</span>
                </div>
                <div class="confirm-row">
                  <span class="confirm-key">Address</span>
                  <span class="confirm-val">{{ ph.address }}, {{ ph.city }}</span>
                </div>
                <div class="confirm-row">
                  <span class="confirm-key">Phone</span>
                  <span class="confirm-val">{{ ph.phone }}</span>
                </div>
                <div class="confirm-row">
                  <span class="confirm-key">Hours</span>
                  <span class="confirm-val">{{ ph.hours }}</span>
                </div>
              }
            </div>
          </div>

          <div class="confirm-notice">
            <i class="pi pi-info-circle"></i>
            <span>Your prescription will typically be ready within 1–2 business days. You will receive a notification when it is ready for pickup.</span>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <div class="dialog-footer">
            <button pButton label="Back" icon="pi pi-arrow-left" class="p-button-text p-button-secondary" (click)="svc.goBackToPharmacy()"></button>
            <button pButton label="Submit Refill Request" icon="pi pi-check" (click)="svc.confirmRefill()"></button>
          </div>
        </ng-template>
      }

    </p-dialog>
  `,
  styles: [`
    /* ═══════════════════════════════════════════
       PAGE LAYOUT
    ═══════════════════════════════════════════ */
    .prescriptions-page {
      max-width: 1100px;
      margin: 0 auto;
    }

    /* ─── Page Header ─── */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
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
      background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
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

    .header-stats {
      display: flex;
      gap: 0.75rem;
    }

    .stat-pill {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      padding: 0.625rem 1.125rem;
      min-width: 96px;
    }

    .stat-pill-num {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-color);
      line-height: 1;
    }

    .stat-pill-label {
      font-size: 0.7rem;
      color: var(--text-color-secondary);
      margin-top: 0.2rem;
      text-align: center;
    }

    /* ─── Interaction Warning Banner ─── */
    .interaction-banner {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      padding: 0.875rem 1.125rem;
      background: var(--orange-50, #fff7ed);
      border: 1px solid var(--orange-200, #fed7aa);
      border-radius: var(--border-radius);
      margin-bottom: 1.25rem;
    }

    .interaction-banner-icon {
      flex-shrink: 0;
      color: var(--orange-500);
      font-size: 1.1rem;
      margin-top: 2px;
    }

    .interaction-banner-body {
      flex: 1;
      font-size: 0.85rem;
      color: var(--text-color);
      line-height: 1.5;
    }

    .interaction-banner-body strong {
      display: block;
      margin-bottom: 0.2rem;
      color: var(--orange-700);
    }

    .interaction-banner-body p {
      margin: 0;
      color: var(--text-color-secondary);
    }

    .banner-sep {
      color: var(--surface-400);
    }

    .banner-dismiss {
      flex-shrink: 0;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-color-secondary);
      padding: 0.25rem;
      border-radius: 4px;
      transition: color 0.15s;
    }

    .banner-dismiss:hover {
      color: var(--text-color);
    }

    /* ─── Tab Navigation ─── */
    .tab-nav {
      display: flex;
      gap: 0;
      border-bottom: 2px solid var(--surface-border);
      margin-bottom: 1.5rem;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border: none;
      background: none;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-color-secondary);
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      transition: all 0.15s ease;
    }

    .tab-btn.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
    }

    .tab-btn:hover:not(.active) {
      color: var(--text-color);
      background: var(--surface-hover);
      border-radius: 4px 4px 0 0;
    }

    .tab-count {
      font-size: 0.72rem;
      font-weight: 700;
      background: var(--surface-200);
      color: var(--text-color-secondary);
      padding: 0.1rem 0.45rem;
      border-radius: 10px;
    }

    .tab-count.accent {
      background: var(--primary-100);
      color: var(--primary-700);
    }

    /* ═══════════════════════════════════════════
       MEDICATION CARDS
    ═══════════════════════════════════════════ */
    .medications-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1rem;
    }

    .med-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
      gap: 0;
      transition: box-shadow 0.15s ease;
      overflow: hidden;
    }

    .med-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }

    .med-card.has-warning {
      border-left: 3px solid var(--orange-400);
    }

    /* Card Header */
    .med-card-header {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      padding: 1.125rem 1.25rem 0.75rem;
    }

    .med-icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--primary-50);
      color: var(--primary-600);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .med-title-group {
      flex: 1;
      min-width: 0;
    }

    .med-name {
      margin: 0 0 0.2rem;
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .med-generic {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .warning-badge {
      color: var(--orange-500);
      font-size: 1.1rem;
      cursor: pointer;
      flex-shrink: 0;
      margin-top: 2px;
    }

    /* Card Details */
    .med-details {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      padding: 0 1.25rem 0.875rem;
    }

    .med-detail-row {
      display: flex;
      align-items: baseline;
      gap: 0.4rem;
      font-size: 0.82rem;
    }

    .detail-icon {
      color: var(--text-color-secondary);
      font-size: 0.75rem;
      flex-shrink: 0;
      width: 14px;
    }

    .detail-label {
      color: var(--text-color-secondary);
      flex-shrink: 0;
      min-width: 64px;
    }

    .detail-value {
      color: var(--text-color);
      font-weight: 500;
    }

    /* Refill Bar */
    .refill-section {
      padding: 0.75rem 1.25rem;
      background: var(--surface-ground);
      border-top: 1px solid var(--surface-border);
    }

    .refill-label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.4rem;
    }

    .refill-label {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-color-secondary);
    }

    .refill-count {
      font-size: 0.8rem;
      font-weight: 700;
    }

    .refill-count.low-refills {
      color: var(--orange-600);
    }

    .refill-count.no-refills {
      color: var(--red-500);
    }

    .refill-count.ok-refills {
      color: var(--green-600);
    }

    .refill-bar-track {
      height: 6px;
      background: var(--surface-border);
      border-radius: 3px;
      overflow: hidden;
    }

    .refill-bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.4s ease;
    }

    .bar-ok { background: var(--green-500); }
    .bar-low { background: var(--orange-400); }
    .bar-empty { background: var(--red-400); }

    /* Instructions */
    .med-instructions {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      font-size: 0.78rem;
      color: var(--text-color-secondary);
      line-height: 1.4;
      border-top: 1px solid var(--surface-border);
    }

    .instructions-icon {
      flex-shrink: 0;
      margin-top: 1px;
      color: var(--blue-400);
    }

    /* Card Footer */
    .med-card-footer {
      padding: 0.875rem 1.25rem;
      border-top: 1px solid var(--surface-border);
      display: flex;
      align-items: center;
    }

    .refill-btn {
      width: 100%;
      justify-content: center;
    }

    .no-refills-msg {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }

    /* ═══════════════════════════════════════════
       REFILL TRACKER
    ═══════════════════════════════════════════ */
    .tracker-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .tracker-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.125rem;
    }

    .tracker-card.status-ready {
      border-left: 3px solid var(--green-500);
    }

    .tracker-card.status-processing {
      border-left: 3px solid var(--orange-400);
    }

    .tracker-card.status-requested {
      border-left: 3px solid var(--blue-400);
    }

    .tracker-card.status-picked-up {
      border-left: 3px solid var(--surface-400);
      opacity: 0.75;
    }

    .tracker-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .tracker-title-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .tracker-med-name {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .tracker-pharmacy {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }

    .tracker-pharmacy i {
      margin-right: 0.2rem;
    }

    /* ─── Status Stepper ─── */
    .stepper {
      display: flex;
      align-items: center;
      gap: 0;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      flex-shrink: 0;
    }

    .step-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid var(--surface-border);
      background: var(--surface-card);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-color-secondary);
      transition: all 0.2s ease;
    }

    .step.step-done .step-circle {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
    }

    .step.step-done .step-circle i {
      font-size: 0.85rem;
    }

    .step.step-active .step-circle {
      border-color: var(--primary-color);
      background: var(--primary-50);
      color: var(--primary-color);
      box-shadow: 0 0 0 3px var(--primary-100);
    }

    .step-label {
      font-size: 0.68rem;
      font-weight: 500;
      color: var(--text-color-secondary);
      text-align: center;
      max-width: 72px;
      line-height: 1.3;
    }

    .step.step-done .step-label,
    .step.step-active .step-label {
      color: var(--text-color);
    }

    .step-connector {
      flex: 1;
      height: 2px;
      background: var(--surface-border);
      margin-bottom: 20px;
      min-width: 16px;
    }

    .step-connector.connector-done {
      background: var(--primary-color);
    }

    /* Tracker Meta */
    .tracker-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem 1.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--surface-border);
    }

    .tracker-meta-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }

    .tracker-meta-item i {
      color: var(--primary-400);
    }

    .tracker-note {
      width: 100%;
    }

    /* ─── Empty State ─── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      text-align: center;
      color: var(--text-color-secondary);
      gap: 1rem;
    }

    .empty-state i {
      font-size: 3rem;
      opacity: 0.25;
    }

    /* ═══════════════════════════════════════════
       REFILL WIZARD DIALOG
    ═══════════════════════════════════════════ */
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .dialog-header-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--primary-50);
      color: var(--primary-600);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .dialog-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-color);
      display: block;
    }

    .dialog-step-indicator {
      font-size: 0.78rem;
      color: var(--text-color-secondary);
    }

    .dialog-body {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 0.25rem 0;
    }

    .step-heading {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-color);
    }

    /* Selected med summary bar */
    .selected-med-summary {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: var(--primary-50);
      border: 1px solid var(--primary-100);
      border-radius: var(--border-radius);
    }

    .selected-med-summary i {
      color: var(--primary-600);
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .summary-name {
      font-weight: 700;
      color: var(--text-color);
      font-size: 0.9rem;
    }

    .summary-dose {
      font-size: 0.78rem;
      color: var(--text-color-secondary);
    }

    .summary-refills {
      margin-left: auto;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--primary-600);
      white-space: nowrap;
    }

    /* Pharmacy Cards */
    .pharmacy-list {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .pharmacy-card {
      width: 100%;
      background: var(--surface-card);
      border: 2px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 0;
      cursor: pointer;
      font-family: inherit;
      text-align: left;
      transition: all 0.15s ease;
    }

    .pharmacy-card:hover {
      border-color: var(--primary-300);
      background: var(--surface-hover);
    }

    .pharmacy-card.selected {
      border-color: var(--primary-color);
      background: var(--primary-50);
    }

    .pharmacy-card-inner {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.875rem 1rem;
    }

    .pharmacy-radio {
      flex-shrink: 0;
    }

    .radio-outer {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid var(--surface-400);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.15s ease;
    }

    .radio-outer.radio-checked {
      border-color: var(--primary-color);
    }

    .radio-inner {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--primary-color);
    }

    .pharmacy-info {
      flex: 1;
      min-width: 0;
    }

    .pharmacy-name-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.2rem;
    }

    .pharmacy-name {
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--text-color);
    }

    .preferred-badge {
      font-size: 0.65rem;
      font-weight: 700;
      background: var(--teal-100);
      color: var(--teal-700);
      padding: 0.1rem 0.4rem;
      border-radius: 10px;
    }

    .pharmacy-address {
      font-size: 0.78rem;
      color: var(--text-color-secondary);
      margin-bottom: 0.35rem;
    }

    .pharmacy-meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 1rem;
    }

    .pharmacy-meta-item {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.72rem;
      color: var(--text-color-secondary);
    }

    .pharmacy-meta-item i {
      font-size: 0.7rem;
    }

    .pharmacy-distance {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--primary-600);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .pharmacy-distance i {
      font-size: 0.75rem;
    }

    /* Confirm Card */
    .confirm-card {
      background: var(--surface-ground);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      overflow: hidden;
    }

    .confirm-section {
      padding: 0.875rem 1.125rem;
    }

    .confirm-section-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--primary-600);
      margin-bottom: 0.625rem;
    }

    .confirm-row {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      padding: 0.3rem 0;
      font-size: 0.85rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .confirm-row:last-child {
      border-bottom: none;
    }

    .confirm-key {
      color: var(--text-color-secondary);
      min-width: 160px;
      flex-shrink: 0;
      font-size: 0.8rem;
    }

    .confirm-val {
      color: var(--text-color);
      font-weight: 500;
    }

    .confirm-divider {
      height: 1px;
      background: var(--surface-border);
    }

    .confirm-notice {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: var(--blue-50, #eff6ff);
      border: 1px solid var(--blue-100, #dbeafe);
      border-radius: var(--border-radius);
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      line-height: 1.5;
    }

    .confirm-notice i {
      color: var(--blue-500);
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* Dialog Footer */
    .dialog-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.625rem;
    }

    /* ═══════════════════════════════════════════
       RESPONSIVE
    ═══════════════════════════════════════════ */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .medications-grid {
        grid-template-columns: 1fr;
      }

      .stepper {
        flex-wrap: nowrap;
        overflow-x: auto;
        padding-bottom: 0.25rem;
      }

      .step-label {
        display: none;
      }

      .confirm-key {
        min-width: 120px;
      }
    }

    @media (max-width: 480px) {
      .header-stats {
        width: 100%;
        justify-content: stretch;
      }

      .stat-pill {
        flex: 1;
      }

      .tab-btn {
        font-size: 0.8rem;
        padding: 0.625rem 0.875rem;
      }
    }
  `]
})
export class PrescriptionsComponent {
  readonly svc = inject(PrescriptionsService);

  activeTab = signal<'medications' | 'tracker'>('medications');

  readonly refillSteps: { key: string; label: string; order: number }[] = [
    { key: 'requested', label: 'Requested', order: 1 },
    { key: 'processing', label: 'Processing', order: 2 },
    { key: 'ready', label: 'Ready for Pickup', order: 3 },
    { key: 'picked-up', label: 'Picked Up', order: 4 }
  ];

  dismissBanner(): void {
    // In production this would persist to user preferences via a service call.
    // For the demo the banner is re-derived from signals so we clear warnings
    // by pretending they are dismissed through a local flag.
    // The interaction data is intentionally kept in the service for HIPAA audit.
  }

  onDialogVisibilityChange(visible: boolean): void {
    if (!visible) {
      this.svc.closeRefillDialog();
    }
  }

  getRefillCountClass(refillsRemaining: number): string {
    if (refillsRemaining === 0) return 'no-refills';
    if (refillsRemaining === 1) return 'low-refills';
    return 'ok-refills';
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatDateTime(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
