import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { PrescriptionsService, Prescription, RefillRequest, PharmacyInfo, AdherenceEntry, DrugInteraction, PBSScript } from '../data-access';

@Component({
  selector: 'app-prescriptions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, CardModule, TagModule, DialogModule, TooltipModule],
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
      @if (svc.interactionWarnings().length > 0 && !bannerDismissed()) {
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
        <button class="tab-btn" [class.active]="activeTab() === 'adherence'" (click)="activeTab.set('adherence')">
          <i class="pi pi-calendar-check"></i>
          Adherence Log
        </button>
        <!-- Feature 11.1: Drug Interactions tab -->
        <button class="tab-btn" [class.active]="activeTab() === 'interactions'" (click)="activeTab.set('interactions')">
          <i class="pi pi-shield"></i>
          Interactions
          @if (svc.drugInteractions().length > 0) {
            <span class="tab-count accent-red">{{ svc.drugInteractions().length }}</span>
          }
        </button>
        <!-- Feature 11.3: PBS Active Scripts tab -->
        <button class="tab-btn" [class.active]="activeTab() === 'pbs'" (click)="activeTab.set('pbs')">
          <i class="pi pi-id-card"></i>
          Active Scripts (PBS)
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
                @if (rx.controlledSubstance) {
                  <span class="controlled-badge" pTooltip="Schedule II-IV Controlled Substance" tooltipPosition="top">
                    <i class="pi pi-lock"></i> C-IV
                  </span>
                }
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

              <!-- ─── Feature 2.5: Side Effects Section ─── -->
              @if (rx.sideEffects) {
                <div class="side-effects-section">
                  <button
                    class="side-effects-toggle"
                    (click)="toggleSideEffects(rx.id)"
                    [attr.aria-expanded]="isSideEffectsExpanded(rx.id)"
                  >
                    <i class="pi pi-shield"></i>
                    <span>Side Effects</span>
                    <i class="pi toggle-chevron"
                       [class.pi-chevron-down]="!isSideEffectsExpanded(rx.id)"
                       [class.pi-chevron-up]="isSideEffectsExpanded(rx.id)"></i>
                  </button>

                  @if (isSideEffectsExpanded(rx.id)) {
                    <div class="side-effects-body">
                      <!-- Common -->
                      <div class="se-group se-common">
                        <div class="se-group-header">
                          <i class="pi pi-info-circle"></i>
                          <span>Common</span>
                        </div>
                        <ul class="se-list">
                          @for (item of rx.sideEffects.common; track item) {
                            <li>{{ item }}</li>
                          }
                        </ul>
                      </div>
                      <!-- Serious -->
                      <div class="se-group se-serious">
                        <div class="se-group-header">
                          <i class="pi pi-exclamation-circle"></i>
                          <span>Serious — Seek Medical Attention</span>
                        </div>
                        <ul class="se-list">
                          @for (item of rx.sideEffects.serious; track item) {
                            <li>{{ item }}</li>
                          }
                        </ul>
                      </div>
                      <!-- Rare -->
                      <div class="se-group se-rare">
                        <div class="se-group-header">
                          <i class="pi pi-question-circle"></i>
                          <span>Rare</span>
                        </div>
                        <ul class="se-list">
                          @for (item of rx.sideEffects.rare; track item) {
                            <li>{{ item }}</li>
                          }
                        </ul>
                      </div>
                      <p class="se-disclaimer">This is not a complete list. Consult your pharmacist or prescriber for full information.</p>
                    </div>
                  }
                </div>
              }

              <!-- Action Footer -->
              <div class="med-card-footer">
                <!-- QR Code Button (Feature 2.7) -->
                <button
                  pButton
                  label="QR Code"
                  icon="pi pi-qrcode"
                  class="p-button-sm p-button-text qr-btn"
                  pTooltip="Show pharmacy QR code"
                  tooltipPosition="top"
                  (click)="openQRDialog(rx)"
                ></button>

                @if (rx.canRequestRefill && rx.refillsRemaining > 0) {
                  <button
                    pButton
                    label="Request Refill"
                    icon="pi pi-refresh"
                    class="p-button-sm p-button-outlined refill-btn"
                    [class.p-button-warning]="rx.controlledSubstance"
                    (click)="handleRefillRequest(rx)"
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

      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- TAB: ADHERENCE LOG (Feature 2.6)                                    -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      @if (activeTab() === 'adherence') {
        <div class="adherence-tab">

          <!-- Adherence Header -->
          <div class="adherence-header">
            <div class="adherence-pct-card">
              <div class="adherence-pct-value">{{ svc.monthlyAdherencePercent() }}%</div>
              <div class="adherence-pct-label">Monthly Adherence</div>
              <div class="adherence-pct-sub">February 2026</div>
            </div>
            <div class="adherence-legend">
              <div class="legend-title">Legend</div>
              <div class="legend-items">
                <div class="legend-item">
                  <span class="legend-dot dot-all-taken"></span>
                  All medications taken
                </div>
                <div class="legend-item">
                  <span class="legend-dot dot-partial"></span>
                  Partial (some missed)
                </div>
                <div class="legend-item">
                  <span class="legend-dot dot-missed"></span>
                  All missed
                </div>
                <div class="legend-item">
                  <span class="legend-dot dot-future"></span>
                  Future / not yet due
                </div>
              </div>
            </div>
          </div>

          <!-- Calendar Grid -->
          <div class="cal-container">
            <!-- Day-of-week header -->
            <div class="cal-grid cal-header-row">
              @for (day of weekDays; track day) {
                <div class="cal-day-header">{{ day }}</div>
              }
            </div>

            <!-- Calendar cells -->
            <div class="cal-grid cal-body">
              <!-- Leading empty cells for the month start (Feb 2026 starts on Sunday = 0) -->
              @for (blank of calendarLeadingBlanks; track $index) {
                <div class="cal-cell cal-blank"></div>
              }
              @for (entry of svc.adherenceLog(); track entry.date.getTime()) {
                <div
                  class="cal-cell"
                  [class]="'cal-' + svc.getDayAdherenceStatus(entry)"
                  pTooltip="{{ buildDayTooltip(entry) }}"
                  tooltipPosition="top"
                >
                  <span class="cal-day-num">{{ entry.date.getDate() }}</span>
                  @if (svc.getDayAdherenceStatus(entry) !== 'future') {
                    <div class="cal-pills">
                      @for (med of entry.medications; track med.medicationId) {
                        <span
                          class="cal-pill"
                          [class.pill-taken]="med.taken"
                          [class.pill-missed]="!med.taken"
                          pTooltip="{{ med.medicationName }}: {{ med.taken ? 'Taken' : 'Missed' }}"
                          tooltipPosition="top"
                        >
                          <i class="pi" [class.pi-check-circle]="med.taken" [class.pi-times-circle]="!med.taken"></i>
                        </span>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Per-medication breakdown -->
          <div class="adherence-breakdown">
            <h3 class="breakdown-title">Per-Medication Breakdown</h3>
            <div class="breakdown-list">
              @for (rx of svc.activeMedications(); track rx.id) {
                <div class="breakdown-row">
                  <span class="breakdown-med-name">{{ rx.medicationName }}</span>
                  <div class="breakdown-bar-wrap">
                    <div class="breakdown-bar-track">
                      <div
                        class="breakdown-bar-fill"
                        [style.width.%]="getMedAdherencePercent(rx.id)"
                        [class]="getMedAdherenceBarClass(rx.id)"
                      ></div>
                    </div>
                    <span class="breakdown-pct">{{ getMedAdherencePercent(rx.id) }}%</span>
                  </div>
                </div>
              }
            </div>
          </div>

        </div>
      }

      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- TAB: DRUG INTERACTIONS (Feature 11.1)                               -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      @if (activeTab() === 'interactions') {
        <div class="interactions-tab">

          <!-- Analysis Header -->
          <div class="interactions-header">
            <div class="interactions-header-icon">
              <i class="pi pi-shield"></i>
            </div>
            <div class="interactions-header-text">
              <h2 class="interactions-title">Drug Interaction Analysis</h2>
              <p class="interactions-subtitle">Based on your current active medication list</p>
            </div>
          </div>

          <!-- Summary Banner -->
          <div class="interactions-summary">
            <div class="interactions-summary-total">
              <i class="pi pi-exclamation-triangle"></i>
              <strong>{{ svc.interactionCountBySevertiy().total }} potential interaction{{ svc.interactionCountBySevertiy().total !== 1 ? 's' : '' }} found</strong>
            </div>
            <div class="interactions-summary-counts">
              @if (svc.interactionCountBySevertiy().high > 0) {
                <span class="severity-chip chip-high">
                  {{ svc.interactionCountBySevertiy().high }} High
                </span>
              }
              @if (svc.interactionCountBySevertiy().moderate > 0) {
                <span class="severity-chip chip-moderate">
                  {{ svc.interactionCountBySevertiy().moderate }} Moderate
                </span>
              }
              @if (svc.interactionCountBySevertiy().low > 0) {
                <span class="severity-chip chip-low">
                  {{ svc.interactionCountBySevertiy().low }} Low
                </span>
              }
            </div>
          </div>

          <!-- Interaction Cards -->
          <div class="interaction-cards-list">
            @for (interaction of svc.drugInteractions(); track interaction.id) {
              <div class="interaction-card" [class]="'interaction-' + interaction.severity.toLowerCase()">
                <div class="interaction-card-header">
                  <div class="interaction-drugs">
                    <span class="drug-name-pill">{{ interaction.drugA }}</span>
                    <span class="interaction-arrow">
                      <i class="pi pi-arrows-h"></i>
                    </span>
                    <span class="drug-name-pill">{{ interaction.drugB }}</span>
                  </div>
                  <span class="interaction-severity-badge" [class]="'severity-badge-' + interaction.severity.toLowerCase()">
                    <i class="pi" [class.pi-times-circle]="interaction.severity === 'HIGH'"
                                 [class.pi-exclamation-circle]="interaction.severity === 'MODERATE'"
                                 [class.pi-info-circle]="interaction.severity === 'LOW'"></i>
                    {{ interaction.severity }}
                  </span>
                </div>
                <p class="interaction-description">{{ interaction.description }}</p>
                <div class="interaction-card-footer">
                  <a href="#" class="learn-more-link" (click)="$event.preventDefault()">
                    <i class="pi pi-external-link"></i>
                    Learn More
                  </a>
                </div>
              </div>
            }
          </div>

          <!-- No-interaction green notice -->
          <div class="no-interactions-notice">
            <i class="pi pi-check-circle"></i>
            <span>All other medication combinations in your active list have no known interactions.</span>
          </div>

          <p class="interactions-disclaimer">
            This analysis is provided for informational purposes only and does not replace professional medical advice.
            Always consult your pharmacist or prescriber before starting, stopping, or changing any medication.
          </p>
        </div>
      }

      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- TAB: PBS ACTIVE SCRIPTS (Feature 11.3)                             -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      @if (activeTab() === 'pbs') {
        <div class="pbs-tab">

          <!-- PBS Header -->
          <div class="pbs-header">
            <div class="pbs-header-icon">
              <i class="pi pi-shield"></i>
            </div>
            <div class="pbs-header-text">
              <h2 class="pbs-title">PBS Active Script List</h2>
              <p class="pbs-subtitle">Pharmaceutical Benefits Scheme — Commonwealth of Australia</p>
            </div>
          </div>

          <!-- PBS Table -->
          <div class="pbs-table-wrap">
            <table class="pbs-table">
              <thead>
                <tr>
                  <th>Script Number</th>
                  <th>Drug Name</th>
                  <th>PBS Item Code</th>
                  <th>Authority Status</th>
                  <th>Repeats Remaining</th>
                  <th>Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                @for (script of svc.pbsScripts(); track script.scriptNumber) {
                  <tr class="pbs-row">
                    <td class="pbs-script-num">{{ script.scriptNumber }}</td>
                    <td class="pbs-drug-name">{{ script.drugName }}</td>
                    <td>
                      <span class="pbs-item-code">{{ script.pbsItemCode }}</span>
                    </td>
                    <td>
                      <span class="pbs-authority-badge"
                            [class.authority-general]="script.authorityStatus === 'General'"
                            [class.authority-required]="script.authorityStatus === 'Authority Required'">
                        {{ script.authorityStatus }}
                      </span>
                    </td>
                    <td>
                      <span class="pbs-repeats" [class.repeats-low]="script.repeatsRemaining <= 1">
                        {{ script.repeatsRemaining }} repeat{{ script.repeatsRemaining !== 1 ? 's' : '' }}
                      </span>
                    </td>
                    <td class="pbs-expiry">{{ formatDate(script.expiryDate) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- PBS Disclaimer -->
          <div class="pbs-disclaimer">
            <i class="pi pi-info-circle"></i>
            <span>
              Data sourced from the Australian Pharmaceutical Benefits Scheme (PBS).
              Contact Services Australia on 132 290 for discrepancies or visit
              <strong>servicesaustralia.gov.au</strong>.
            </span>
          </div>
        </div>
      }

    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- CONTROLLED SUBSTANCE TRIAGE DIALOG (Feature 11.2)                      -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <p-dialog
      [visible]="isControlledWarningOpen()"
      (visibleChange)="onControlledDialogVisibilityChange($event)"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '520px', 'max-width': '95vw' }"
      styleClass="controlled-dialog"
    >
      <ng-template pTemplate="header">
        <div class="dialog-header">
          <div class="dialog-header-icon controlled-dialog-icon">
            <i class="pi pi-lock"></i>
          </div>
          <div>
            <span class="dialog-title">Controlled Substance Refill Notice</span>
            <div class="dialog-step-indicator">Schedule II–IV Controlled Substance</div>
          </div>
        </div>
      </ng-template>

      <div class="dialog-body">
        @if (svc.selectedMedication(); as med) {
          <div class="controlled-med-summary">
            <i class="pi pi-box"></i>
            <div>
              <div class="summary-name">{{ med.medicationName }} {{ med.dosage }}</div>
              <div class="summary-dose">Prescribed by {{ med.prescribedBy }}</div>
            </div>
          </div>
        }
        <div class="controlled-warning-body">
          <div class="controlled-warning-icon-wrap">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <p class="controlled-warning-text">
            Refills for controlled substances (Schedule II–IV) require an appointment with your
            prescribing physician. Electronic refill requests cannot be processed for this
            medication class under DEA regulations.
          </p>
          <p class="controlled-warning-text">
            Would you like to schedule an appointment with your prescriber to obtain a new
            prescription for this controlled substance?
          </p>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <button pButton label="Cancel" class="p-button-text p-button-secondary" (click)="svc.closeRefillDialog()"></button>
          <button pButton label="Schedule Appointment" icon="pi pi-calendar-plus" (click)="onScheduleAppointmentForControlled()"></button>
        </div>
      </ng-template>
    </p-dialog>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- REFILL WIZARD DIALOG                                                    -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <p-dialog
      [visible]="isRefillWizardOpen()"
      (visibleChange)="onRefillWizardVisibilityChange($event)"
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

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- QR CODE DIALOG (Feature 2.7)                                            -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <p-dialog
      [visible]="showQRDialog()"
      (visibleChange)="onQRDialogVisibilityChange($event)"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '420px', 'max-width': '95vw' }"
      styleClass="qr-dialog"
    >
      <ng-template pTemplate="header">
        <div class="dialog-header">
          <div class="dialog-header-icon qr-dialog-icon">
            <i class="pi pi-qrcode"></i>
          </div>
          <div>
            <span class="dialog-title">E-Prescription QR Code</span>
            <div class="dialog-step-indicator">Scan at any participating pharmacy</div>
          </div>
        </div>
      </ng-template>

      @if (selectedQRMedication(); as rx) {
        <div class="qr-dialog-body">
          <div class="qr-med-name">{{ rx.medicationName }}</div>
          <div class="qr-med-dose">{{ rx.dosage }} &bull; {{ rx.frequency }}</div>

          <!-- Mock QR Code SVG -->
          <div class="qr-code-wrap">
            <svg
              class="qr-svg"
              viewBox="0 0 210 210"
              xmlns="http://www.w3.org/2000/svg"
              [attr.aria-label]="'QR code for ' + rx.medicationName"
            >
              <!-- White background -->
              <rect width="210" height="210" fill="white"/>

              <!-- Top-left position detection pattern -->
              <rect x="10" y="10" width="60" height="60" fill="black"/>
              <rect x="18" y="18" width="44" height="44" fill="white"/>
              <rect x="26" y="26" width="28" height="28" fill="black"/>

              <!-- Top-right position detection pattern -->
              <rect x="140" y="10" width="60" height="60" fill="black"/>
              <rect x="148" y="18" width="44" height="44" fill="white"/>
              <rect x="156" y="26" width="28" height="28" fill="black"/>

              <!-- Bottom-left position detection pattern -->
              <rect x="10" y="140" width="60" height="60" fill="black"/>
              <rect x="18" y="148" width="44" height="44" fill="white"/>
              <rect x="26" y="156" width="28" height="28" fill="black"/>

              <!-- Timing patterns (horizontal) -->
              <rect x="78" y="80" width="8" height="8" fill="black"/>
              <rect x="94" y="80" width="8" height="8" fill="black"/>
              <rect x="110" y="80" width="8" height="8" fill="black"/>
              <rect x="126" y="80" width="8" height="8" fill="black"/>

              <!-- Timing patterns (vertical) -->
              <rect x="80" y="78" width="8" height="8" fill="black"/>
              <rect x="80" y="94" width="8" height="8" fill="black"/>
              <rect x="80" y="110" width="8" height="8" fill="black"/>
              <rect x="80" y="126" width="8" height="8" fill="black"/>

              <!-- Data modules — top-right quadrant data area -->
              <rect x="78" y="10" width="8" height="8" fill="black"/>
              <rect x="94" y="10" width="8" height="8" fill="black"/>
              <rect x="78" y="26" width="8" height="8" fill="black"/>
              <rect x="110" y="18" width="8" height="8" fill="black"/>
              <rect x="110" y="34" width="8" height="8" fill="black"/>
              <rect x="94" y="42" width="8" height="8" fill="black"/>
              <rect x="126" y="10" width="8" height="8" fill="black"/>
              <rect x="126" y="34" width="8" height="8" fill="black"/>

              <!-- Data modules — bottom-right quadrant -->
              <rect x="140" y="96" width="8" height="8" fill="black"/>
              <rect x="156" y="96" width="8" height="8" fill="black"/>
              <rect x="172" y="96" width="8" height="8" fill="black"/>
              <rect x="188" y="96" width="8" height="8" fill="black"/>
              <rect x="140" y="112" width="8" height="8" fill="black"/>
              <rect x="172" y="112" width="8" height="8" fill="black"/>
              <rect x="156" y="128" width="8" height="8" fill="black"/>
              <rect x="188" y="128" width="8" height="8" fill="black"/>
              <rect x="140" y="144" width="8" height="8" fill="black"/>
              <rect x="156" y="144" width="8" height="8" fill="black"/>
              <rect x="172" y="144" width="8" height="8" fill="black"/>
              <rect x="140" y="160" width="8" height="8" fill="black"/>
              <rect x="188" y="160" width="8" height="8" fill="black"/>
              <rect x="156" y="176" width="8" height="8" fill="black"/>
              <rect x="172" y="176" width="8" height="8" fill="black"/>
              <rect x="188" y="176" width="8" height="8" fill="black"/>

              <!-- Data modules — middle area -->
              <rect x="94" y="96" width="8" height="8" fill="black"/>
              <rect x="110" y="96" width="8" height="8" fill="black"/>
              <rect x="94" y="112" width="8" height="8" fill="black"/>
              <rect x="126" y="112" width="8" height="8" fill="black"/>
              <rect x="110" y="128" width="8" height="8" fill="black"/>
              <rect x="94" y="128" width="8" height="8" fill="black"/>

              <!-- Data modules — bottom-left data area -->
              <rect x="78" y="96" width="8" height="8" fill="black"/>
              <rect x="78" y="112" width="8" height="8" fill="black"/>
              <rect x="78" y="144" width="8" height="8" fill="black"/>
              <rect x="78" y="160" width="8" height="8" fill="black"/>
              <rect x="94" y="144" width="8" height="8" fill="black"/>
              <rect x="110" y="160" width="8" height="8" fill="black"/>
              <rect x="126" y="144" width="8" height="8" fill="black"/>
              <rect x="110" y="176" width="8" height="8" fill="black"/>
              <rect x="126" y="176" width="8" height="8" fill="black"/>
              <rect x="78" y="176" width="8" height="8" fill="black"/>
              <rect x="94" y="176" width="8" height="8" fill="black"/>

              <!-- Additional scattered data modules for realistic density -->
              <rect x="78" y="58" width="8" height="8" fill="black"/>
              <rect x="94" y="58" width="8" height="8" fill="black"/>
              <rect x="110" y="50" width="8" height="8" fill="black"/>
              <rect x="126" y="58" width="8" height="8" fill="black"/>
              <rect x="78" y="66" width="8" height="8" fill="black"/>
              <rect x="110" y="66" width="8" height="8" fill="black"/>
              <rect x="10" y="96" width="8" height="8" fill="black"/>
              <rect x="26" y="96" width="8" height="8" fill="black"/>
              <rect x="42" y="96" width="8" height="8" fill="black"/>
              <rect x="58" y="96" width="8" height="8" fill="black"/>
              <rect x="10" y="112" width="8" height="8" fill="black"/>
              <rect x="42" y="112" width="8" height="8" fill="black"/>
              <rect x="58" y="112" width="8" height="8" fill="black"/>
              <rect x="26" y="128" width="8" height="8" fill="black"/>
              <rect x="58" y="128" width="8" height="8" fill="black"/>
            </svg>
            <div class="qr-watermark">
              <i class="pi pi-shield"></i>
              GoHealth
            </div>
          </div>

          <div class="qr-scan-note">Scan at any participating pharmacy</div>

          <div class="qr-expiry-badge">
            <i class="pi pi-clock"></i>
            Valid for 24 hours
          </div>

          <div class="qr-rx-details">
            <div class="qr-detail-row">
              <span class="qr-detail-key">Medication</span>
              <span class="qr-detail-val">{{ rx.medicationName }}</span>
            </div>
            <div class="qr-detail-row">
              <span class="qr-detail-key">Dosage</span>
              <span class="qr-detail-val">{{ rx.dosage }}</span>
            </div>
            <div class="qr-detail-row">
              <span class="qr-detail-key">Frequency</span>
              <span class="qr-detail-val">{{ rx.frequency }}</span>
            </div>
            <div class="qr-detail-row">
              <span class="qr-detail-key">Prescriber</span>
              <span class="qr-detail-val">{{ rx.prescribedBy }}</span>
            </div>
            <div class="qr-detail-row">
              <span class="qr-detail-key">Refills remaining</span>
              <span class="qr-detail-val">{{ rx.refillsRemaining }}</span>
            </div>
          </div>

          <div class="qr-hipaa-note">
            <i class="pi pi-lock"></i>
            This QR code is encrypted and HIPAA-compliant. Do not share a screenshot with untrusted parties.
          </div>
        </div>
      }

      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <button pButton label="Close" class="p-button-text p-button-secondary" (click)="closeQRDialog()"></button>
        </div>
      </ng-template>
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
      flex-wrap: wrap;
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

    .tab-count.accent-red {
      background: #fee2e2;
      color: #b91c1c;
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

    /* Feature 11.2: Controlled substance badge */
    .controlled-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      font-size: 0.65rem;
      font-weight: 700;
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
      padding: 0.2rem 0.5rem;
      border-radius: 10px;
      flex-shrink: 0;
      cursor: default;
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

    /* ─── Feature 2.5: Side Effects ─── */
    .side-effects-section {
      border-top: 1px solid var(--surface-border);
    }

    .side-effects-toggle {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      background: none;
      border: none;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-color-secondary);
      text-align: left;
      transition: background 0.15s;
    }

    .side-effects-toggle:hover {
      background: var(--surface-hover);
      color: var(--text-color);
    }

    .side-effects-toggle .pi-shield {
      color: var(--primary-400);
      font-size: 0.85rem;
    }

    .toggle-chevron {
      margin-left: auto;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .side-effects-body {
      padding: 0 1.25rem 0.875rem;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .se-group {
      border-radius: 6px;
      padding: 0.5rem 0.75rem;
    }

    .se-common {
      background: #fefce8;
      border: 1px solid #fef08a;
    }

    .se-serious {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }

    .se-rare {
      background: var(--surface-ground);
      border: 1px solid var(--surface-border);
    }

    .se-group-header {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.375rem;
    }

    .se-common .se-group-header {
      color: #854d0e;
    }

    .se-serious .se-group-header {
      color: #b91c1c;
    }

    .se-rare .se-group-header {
      color: var(--text-color-secondary);
    }

    .se-common .se-group-header i {
      color: #ca8a04;
    }

    .se-serious .se-group-header i {
      color: #ef4444;
    }

    .se-rare .se-group-header i {
      color: var(--surface-500);
    }

    .se-list {
      margin: 0;
      padding-left: 1.25rem;
      font-size: 0.78rem;
      line-height: 1.6;
    }

    .se-common .se-list {
      color: #78350f;
    }

    .se-serious .se-list {
      color: #991b1b;
    }

    .se-rare .se-list {
      color: var(--text-color-secondary);
    }

    .se-disclaimer {
      margin: 0;
      font-size: 0.68rem;
      color: var(--text-color-secondary);
      font-style: italic;
      line-height: 1.4;
    }

    /* Card Footer */
    .med-card-footer {
      padding: 0.875rem 1.25rem;
      border-top: 1px solid var(--surface-border);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .qr-btn {
      flex-shrink: 0;
      color: var(--primary-600) !important;
    }

    .refill-btn {
      flex: 1;
      justify-content: center;
    }

    .no-refills-msg {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      flex: 1;
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
       FEATURE 2.6: ADHERENCE LOG
    ═══════════════════════════════════════════ */
    .adherence-tab {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Adherence Header */
    .adherence-header {
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .adherence-pct-card {
      background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
      color: white;
      border-radius: 16px;
      padding: 1.25rem 2rem;
      text-align: center;
      min-width: 160px;
      flex-shrink: 0;
    }

    .adherence-pct-value {
      font-size: 2.5rem;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 0.25rem;
    }

    .adherence-pct-label {
      font-size: 0.82rem;
      font-weight: 600;
      opacity: 0.9;
    }

    .adherence-pct-sub {
      font-size: 0.72rem;
      opacity: 0.75;
      margin-top: 0.2rem;
    }

    .adherence-legend {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1rem 1.25rem;
      flex: 1;
      min-width: 220px;
    }

    .legend-title {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-color-secondary);
      margin-bottom: 0.625rem;
    }

    .legend-items {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: var(--text-color);
    }

    .legend-dot {
      width: 14px;
      height: 14px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .dot-all-taken { background: #22c55e; }
    .dot-partial   { background: #eab308; }
    .dot-missed    { background: #ef4444; }
    .dot-future    { background: var(--surface-300); }

    /* Calendar */
    .cal-container {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      overflow: hidden;
    }

    .cal-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
    }

    .cal-header-row {
      background: var(--surface-ground);
      border-bottom: 1px solid var(--surface-border);
    }

    .cal-day-header {
      padding: 0.5rem 0;
      text-align: center;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-color-secondary);
    }

    .cal-body {
      gap: 1px;
      background: var(--surface-border);
    }

    .cal-cell {
      background: var(--surface-card);
      min-height: 72px;
      padding: 0.375rem 0.4rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      cursor: default;
      position: relative;
      transition: opacity 0.1s;
    }

    .cal-blank {
      background: var(--surface-ground);
      min-height: 72px;
    }

    .cal-day-num {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-color-secondary);
      line-height: 1;
    }

    /* Heatmap colors */
    .cal-all-taken  { background: #f0fdf4; border-top: 3px solid #22c55e; }
    .cal-partial    { background: #fefce8; border-top: 3px solid #eab308; }
    .cal-missed     { background: #fef2f2; border-top: 3px solid #ef4444; }
    .cal-future     { background: var(--surface-ground); opacity: 0.6; }
    .cal-none       { background: var(--surface-ground); opacity: 0.4; }

    .cal-all-taken .cal-day-num  { color: #15803d; }
    .cal-partial .cal-day-num    { color: #854d0e; }
    .cal-missed .cal-day-num     { color: #991b1b; }

    /* Pill indicators in calendar */
    .cal-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 2px;
    }

    .cal-pill {
      font-size: 0.6rem;
      line-height: 1;
    }

    .pill-taken i  { color: #22c55e; }
    .pill-missed i { color: #ef4444; }

    /* Per-medication breakdown */
    .adherence-breakdown {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1.25rem;
    }

    .breakdown-title {
      margin: 0 0 1rem;
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .breakdown-list {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .breakdown-row {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .breakdown-med-name {
      font-size: 0.8rem;
      color: var(--text-color);
      min-width: 160px;
      flex-shrink: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .breakdown-bar-wrap {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .breakdown-bar-track {
      flex: 1;
      height: 8px;
      background: var(--surface-border);
      border-radius: 4px;
      overflow: hidden;
    }

    .breakdown-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.4s ease;
    }

    .breakdown-bar-green  { background: #22c55e; }
    .breakdown-bar-yellow { background: #eab308; }
    .breakdown-bar-red    { background: #ef4444; }

    .breakdown-pct {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text-color);
      min-width: 36px;
      text-align: right;
    }

    /* ═══════════════════════════════════════════
       FEATURE 11.1: DRUG INTERACTIONS TAB
    ═══════════════════════════════════════════ */
    .interactions-tab {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .interactions-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .interactions-header-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      flex-shrink: 0;
    }

    .interactions-title {
      margin: 0 0 0.2rem;
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .interactions-subtitle {
      margin: 0;
      font-size: 0.85rem;
      color: var(--text-color-secondary);
    }

    /* Summary Banner */
    .interactions-summary {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.875rem 1.25rem;
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: var(--border-radius);
      flex-wrap: wrap;
    }

    .interactions-summary-total {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      color: #92400e;
    }

    .interactions-summary-total i {
      color: #f59e0b;
      font-size: 1.1rem;
    }

    .interactions-summary-counts {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-left: auto;
    }

    .severity-chip {
      display: inline-flex;
      align-items: center;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.625rem;
      border-radius: 12px;
    }

    .chip-high {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
    }

    .chip-moderate {
      background: #fff7ed;
      color: #c2410c;
      border: 1px solid #fdba74;
    }

    .chip-low {
      background: #fefce8;
      color: #854d0e;
      border: 1px solid #fde047;
    }

    /* Interaction Cards */
    .interaction-cards-list {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .interaction-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1rem 1.25rem;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }

    .interaction-high {
      border-left: 4px solid #ef4444;
    }

    .interaction-moderate {
      border-left: 4px solid #f97316;
    }

    .interaction-low {
      border-left: 4px solid #eab308;
    }

    .interaction-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }

    .interaction-drugs {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
    }

    .drug-name-pill {
      display: inline-block;
      background: var(--primary-50);
      color: var(--primary-700);
      border: 1px solid var(--primary-100);
      border-radius: 8px;
      padding: 0.25rem 0.75rem;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .interaction-arrow {
      color: var(--text-color-secondary);
      font-size: 1.1rem;
    }

    .interaction-severity-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      flex-shrink: 0;
    }

    .severity-badge-high {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fca5a5;
    }

    .severity-badge-moderate {
      background: #fff7ed;
      color: #ea580c;
      border: 1px solid #fdba74;
    }

    .severity-badge-low {
      background: #fefce8;
      color: #ca8a04;
      border: 1px solid #fde047;
    }

    .interaction-description {
      margin: 0 0 0.75rem;
      font-size: 0.85rem;
      color: var(--text-color);
      line-height: 1.5;
    }

    .interaction-card-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    .learn-more-link {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--primary-600);
      text-decoration: none;
      transition: color 0.15s;
    }

    .learn-more-link:hover {
      color: var(--primary-800);
      text-decoration: underline;
    }

    /* No-interaction notice */
    .no-interactions-notice {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.875rem 1.25rem;
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: var(--border-radius);
      font-size: 0.875rem;
      color: #15803d;
    }

    .no-interactions-notice i {
      color: #22c55e;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .interactions-disclaimer {
      margin: 0;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      font-style: italic;
      line-height: 1.5;
      padding: 0.625rem 1rem;
      background: var(--surface-ground);
      border-radius: var(--border-radius);
      border: 1px solid var(--surface-border);
    }

    /* ═══════════════════════════════════════════
       FEATURE 11.3: PBS ACTIVE SCRIPTS TAB
    ═══════════════════════════════════════════ */
    .pbs-tab {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .pbs-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .pbs-header-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: linear-gradient(135deg, #1e40af, #1d4ed8);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      flex-shrink: 0;
    }

    .pbs-title {
      margin: 0 0 0.2rem;
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .pbs-subtitle {
      margin: 0;
      font-size: 0.85rem;
      color: var(--text-color-secondary);
    }

    .pbs-table-wrap {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      overflow: hidden;
      overflow-x: auto;
    }

    .pbs-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    .pbs-table thead tr {
      background: var(--surface-ground);
      border-bottom: 2px solid var(--surface-border);
    }

    .pbs-table th {
      padding: 0.75rem 1rem;
      text-align: left;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-color-secondary);
      white-space: nowrap;
    }

    .pbs-table td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--surface-border);
      color: var(--text-color);
      vertical-align: middle;
    }

    .pbs-row:last-child td {
      border-bottom: none;
    }

    .pbs-row:hover td {
      background: var(--surface-hover);
    }

    .pbs-script-num {
      font-family: monospace;
      font-size: 0.78rem;
      color: var(--text-color-secondary);
    }

    .pbs-drug-name {
      font-weight: 600;
    }

    .pbs-item-code {
      display: inline-block;
      background: var(--surface-ground);
      border: 1px solid var(--surface-border);
      border-radius: 6px;
      padding: 0.15rem 0.5rem;
      font-family: monospace;
      font-size: 0.8rem;
      color: var(--primary-700);
    }

    .pbs-authority-badge {
      display: inline-flex;
      align-items: center;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.2rem 0.625rem;
      border-radius: 12px;
    }

    .authority-general {
      background: #f0fdf4;
      color: #15803d;
      border: 1px solid #86efac;
    }

    .authority-required {
      background: #fff7ed;
      color: #c2410c;
      border: 1px solid #fdba74;
    }

    .pbs-repeats {
      font-weight: 600;
      color: var(--text-color);
    }

    .pbs-repeats.repeats-low {
      color: #dc2626;
    }

    .pbs-expiry {
      font-size: 0.82rem;
      color: var(--text-color-secondary);
    }

    .pbs-disclaimer {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      padding: 0.875rem 1.25rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: var(--border-radius);
      font-size: 0.82rem;
      color: #1e40af;
      line-height: 1.5;
    }

    .pbs-disclaimer i {
      color: #3b82f6;
      font-size: 1rem;
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* ═══════════════════════════════════════════
       FEATURE 11.2: CONTROLLED SUBSTANCE DIALOG
    ═══════════════════════════════════════════ */
    .controlled-dialog-icon {
      background: #fef2f2;
      color: #dc2626;
    }

    .controlled-med-summary {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--border-radius);
      margin-bottom: 0.5rem;
    }

    .controlled-med-summary i {
      color: #dc2626;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .controlled-warning-body {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: var(--border-radius);
    }

    .controlled-warning-icon-wrap {
      display: flex;
      justify-content: center;
    }

    .controlled-warning-icon-wrap i {
      font-size: 2rem;
      color: #f59e0b;
    }

    .controlled-warning-text {
      margin: 0;
      font-size: 0.875rem;
      color: #92400e;
      line-height: 1.6;
      text-align: center;
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

    .qr-dialog-icon {
      background: #f0fdf4;
      color: #16a34a;
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
       FEATURE 2.7: QR CODE DIALOG
    ═══════════════════════════════════════════ */
    .qr-dialog-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.875rem;
      padding: 0.25rem 0 0.5rem;
    }

    .qr-med-name {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--text-color);
      text-align: center;
    }

    .qr-med-dose {
      font-size: 0.82rem;
      color: var(--text-color-secondary);
      margin-top: -0.5rem;
    }

    .qr-code-wrap {
      position: relative;
      width: 200px;
      height: 200px;
      border: 3px solid var(--surface-border);
      border-radius: 12px;
      padding: 4px;
      background: white;
      box-shadow: 0 4px 20px rgba(0,0,0,0.12);
    }

    .qr-svg {
      width: 100%;
      height: 100%;
      display: block;
      border-radius: 6px;
    }

    .qr-watermark {
      position: absolute;
      bottom: 8px;
      right: 8px;
      font-size: 0.55rem;
      font-weight: 700;
      color: var(--primary-400);
      display: flex;
      align-items: center;
      gap: 2px;
      opacity: 0.6;
    }

    .qr-scan-note {
      font-size: 0.85rem;
      color: var(--text-color-secondary);
      text-align: center;
    }

    .qr-expiry-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      background: #fef9c3;
      border: 1px solid #fde047;
      color: #854d0e;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 0.35rem 0.875rem;
      border-radius: 20px;
    }

    .qr-expiry-badge i {
      font-size: 0.75rem;
    }

    .qr-rx-details {
      width: 100%;
      background: var(--surface-ground);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      overflow: hidden;
    }

    .qr-detail-row {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      padding: 0.4rem 0.875rem;
      font-size: 0.82rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .qr-detail-row:last-child {
      border-bottom: none;
    }

    .qr-detail-key {
      color: var(--text-color-secondary);
      min-width: 130px;
      flex-shrink: 0;
      font-size: 0.78rem;
    }

    .qr-detail-val {
      color: var(--text-color);
      font-weight: 600;
    }

    .qr-hipaa-note {
      display: flex;
      align-items: flex-start;
      gap: 0.375rem;
      font-size: 0.7rem;
      color: var(--text-color-secondary);
      text-align: center;
      line-height: 1.4;
      max-width: 320px;
    }

    .qr-hipaa-note i {
      color: var(--green-500);
      flex-shrink: 0;
      margin-top: 1px;
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

      .adherence-header {
        flex-direction: column;
      }

      .adherence-pct-card {
        width: 100%;
      }

      .breakdown-med-name {
        min-width: 110px;
      }

      .cal-cell {
        min-height: 52px;
        padding: 0.25rem;
      }

      .pbs-table th,
      .pbs-table td {
        padding: 0.625rem 0.75rem;
        font-size: 0.78rem;
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

      .cal-pills {
        display: none;
      }

      .interactions-summary-counts {
        margin-left: 0;
      }
    }
  `]
})
export class PrescriptionsComponent {
  readonly svc = inject(PrescriptionsService);

  activeTab = signal<'medications' | 'tracker' | 'adherence' | 'interactions' | 'pbs'>('medications');

  // Feature 2.5: Side effects toggle
  expandedSideEffects = signal<Set<string>>(new Set());

  // Feature 2.7: QR code dialog
  showQRDialog = signal(false);
  selectedQRMedication = signal<Prescription | null>(null);

  // Banner dismissed flag
  bannerDismissed = signal(false);

  readonly refillSteps: { key: string; label: string; order: number }[] = [
    { key: 'requested', label: 'Requested', order: 1 },
    { key: 'processing', label: 'Processing', order: 2 },
    { key: 'ready', label: 'Ready for Pickup', order: 3 },
    { key: 'picked-up', label: 'Picked Up', order: 4 }
  ];

  // February 2026 starts on Sunday (0)
  readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly calendarLeadingBlanks: number[] = [];  // Feb 1 2026 = Sunday, no leading blanks needed

  // ─── Feature 11.2: Controlled substance triage ────────────────────────────

  /**
   * True when the refill dialog is open for a controlled substance at the
   * warning step specifically.
   */
  readonly isControlledWarningOpen = computed(() =>
    this.svc.dialogOpen() && (this.svc.refillStep() as string) === 'controlled-warning'
  );

  /**
   * True when the normal refill wizard (pharmacy select / confirm) is open.
   */
  readonly isRefillWizardOpen = computed(() =>
    this.svc.dialogOpen() &&
    (this.svc.refillStep() === 'select-pharmacy' || this.svc.refillStep() === 'confirm')
  );

  handleRefillRequest(rx: Prescription): void {
    this.svc.openRefillDialog(rx.id);
  }

  onControlledDialogVisibilityChange(visible: boolean): void {
    if (!visible) {
      this.svc.closeRefillDialog();
    }
  }

  onRefillWizardVisibilityChange(visible: boolean): void {
    if (!visible) {
      this.svc.closeRefillDialog();
    }
  }

  onScheduleAppointmentForControlled(): void {
    // In production this would navigate to the appointments booking flow.
    // For the demo we close the dialog and show a toast-like feedback.
    this.svc.closeRefillDialog();
    // Future: router.navigate(['/appointments/new'])
  }

  // ─── Feature 2.5: Side effects ────────────────────────────────────────────

  toggleSideEffects(id: string): void {
    this.expandedSideEffects.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  isSideEffectsExpanded(id: string): boolean {
    return this.expandedSideEffects().has(id);
  }

  // ─── Feature 2.6: Adherence helpers ───────────────────────────────────────

  buildDayTooltip(entry: AdherenceEntry): string {
    if (entry.medications.length === 0) return 'Future date';
    const taken = entry.medications.filter(m => m.taken).length;
    const total = entry.medications.length;
    const dateStr = entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${dateStr}: ${taken}/${total} medications taken`;
  }

  getMedAdherencePercent(medicationId: string): number {
    const today = new Date(2026, 1, 21);
    const pastEntries = this.svc.adherenceLog().filter(e => e.date <= today && e.medications.length > 0);
    if (pastEntries.length === 0) return 0;
    const relevant = pastEntries.filter(e => e.medications.some(m => m.medicationId === medicationId));
    if (relevant.length === 0) return 0;
    const taken = relevant.reduce(
      (sum, e) => sum + (e.medications.find(m => m.medicationId === medicationId)?.taken ? 1 : 0),
      0
    );
    return Math.round((taken / relevant.length) * 100);
  }

  getMedAdherenceBarClass(medicationId: string): string {
    const pct = this.getMedAdherencePercent(medicationId);
    if (pct >= 85) return 'breakdown-bar-green';
    if (pct >= 65) return 'breakdown-bar-yellow';
    return 'breakdown-bar-red';
  }

  // ─── Feature 2.7: QR code dialog ──────────────────────────────────────────

  openQRDialog(rx: Prescription): void {
    this.selectedQRMedication.set(rx);
    this.showQRDialog.set(true);
  }

  closeQRDialog(): void {
    this.showQRDialog.set(false);
    this.selectedQRMedication.set(null);
  }

  onQRDialogVisibilityChange(visible: boolean): void {
    if (!visible) {
      this.closeQRDialog();
    }
  }

  // ─── Existing helpers ─────────────────────────────────────────────────────

  dismissBanner(): void {
    this.bannerDismissed.set(true);
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
