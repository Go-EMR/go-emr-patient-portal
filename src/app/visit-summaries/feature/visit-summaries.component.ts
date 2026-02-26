import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { AccordionModule } from 'primeng/accordion';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { VisitSummariesService } from '../data-access/visit-summaries.service';
import { VisitSummary } from '../../shared/data-access/models';

@Component({
  selector: 'app-visit-summaries',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    DialogModule,
    DividerModule,
    AccordionModule,
    TooltipModule,
    SelectModule,
    SkeletonModule,
  ],
  template: `
    <div class="vs-page" role="main" aria-label="Visit Summaries">
      <!-- Page Header -->
      <header class="vs-header">
        <div class="vs-header-text">
          <h1 class="vs-title">
            <i class="pi pi-file-check vs-title-icon" aria-hidden="true"></i>
            Visit Summaries
          </h1>
          <p class="vs-subtitle">Your after-visit summaries from recent clinical encounters</p>
        </div>
        @if (service.newVisitsCount() > 0) {
          <div class="vs-new-badge" role="status" [attr.aria-label]="service.newVisitsCount() + ' new visit summaries'">
            <i class="pi pi-bell" aria-hidden="true"></i>
            {{ service.newVisitsCount() }} new {{ service.newVisitsCount() === 1 ? 'summary' : 'summaries' }}
          </div>
        }
      </header>

      <!-- Filters -->
      <div class="vs-filters" role="search" aria-label="Filter visit summaries">
        <div class="vs-filter-group">
          <label class="vs-filter-label" for="provider-filter">Filter by Provider</label>
          <p-select
            inputId="provider-filter"
            [options]="providerOptions()"
            [(ngModel)]="selectedProvider"
            optionLabel="label"
            optionValue="value"
            placeholder="All Providers"
            [showClear]="true"
            styleClass="vs-select"
            aria-label="Filter by provider"
          />
        </div>
        <div class="vs-filter-group">
          <label class="vs-filter-label" for="status-filter">Filter by Status</label>
          <p-select
            inputId="status-filter"
            [options]="statusOptions"
            [(ngModel)]="selectedStatus"
            optionLabel="label"
            optionValue="value"
            placeholder="All Statuses"
            [showClear]="true"
            styleClass="vs-select"
            aria-label="Filter by status"
          />
        </div>
        <div class="vs-filter-actions">
          <p-button
            label="Clear Filters"
            icon="pi pi-filter-slash"
            severity="secondary"
            [text]="true"
            (onClick)="clearFilters()"
            [disabled]="!selectedProvider && !selectedStatus"
            aria-label="Clear all filters"
          />
        </div>
      </div>

      <!-- Results Count -->
      <div class="vs-results-meta" aria-live="polite">
        <span>Showing {{ filteredVisits().length }} of {{ service.visits().length }} visits</span>
      </div>

      <!-- Loading Skeletons -->
      @if (service.loading()) {
        <div class="vs-skeleton-grid" aria-busy="true" aria-label="Loading visit summaries">
          @for (i of [1,2,3]; track i) {
            <div class="vs-skeleton-card">
              <p-skeleton height="2rem" width="60%" styleClass="mb-2" />
              <p-skeleton height="1rem" width="40%" styleClass="mb-3" />
              <p-skeleton height="1rem" width="80%" />
            </div>
          }
        </div>
      }

      <!-- Visit Cards -->
      @if (!service.loading()) {
        @if (filteredVisits().length === 0) {
          <div class="vs-empty" role="status">
            <i class="pi pi-file-check vs-empty-icon" aria-hidden="true"></i>
            <h3>No visit summaries found</h3>
            <p>Try adjusting your filters or check back after your next appointment.</p>
          </div>
        } @else {
          <div class="vs-cards-grid" role="list" aria-label="Visit summaries list">
            @for (visit of filteredVisits(); track visit.id) {
              <article
                class="vs-card"
                [class.vs-card--new]="visit.status === 'new'"
                role="listitem"
                [attr.aria-label]="'Visit summary: ' + visit.visitType + ' with ' + visit.providerName + ' on ' + (visit.visitDate | date:'longDate')"
              >
                <!-- Card Header -->
                <div class="vs-card-header">
                  <div class="vs-card-header-left">
                    <div class="vs-provider-avatar" aria-hidden="true">
                      {{ getInitials(visit.providerName) }}
                    </div>
                    <div class="vs-card-info">
                      <h2 class="vs-visit-type">{{ visit.visitType }}</h2>
                      <p class="vs-provider-name">{{ visit.providerName }}</p>
                      <p class="vs-provider-specialty">{{ visit.providerSpecialty }}</p>
                    </div>
                  </div>
                  <div class="vs-card-header-right">
                    <p-tag
                      [value]="visit.status === 'new' ? 'New' : 'Reviewed'"
                      [severity]="visit.status === 'new' ? 'warn' : 'secondary'"
                      [rounded]="true"
                      [attr.aria-label]="'Status: ' + visit.status"
                    />
                  </div>
                </div>

                <!-- Card Meta -->
                <div class="vs-card-meta">
                  <div class="vs-meta-item">
                    <i class="pi pi-calendar" aria-hidden="true"></i>
                    <span>{{ visit.visitDate | date:'MMMM d, yyyy' }}</span>
                  </div>
                  <div class="vs-meta-item">
                    <i class="pi pi-clock" aria-hidden="true"></i>
                    <span>{{ visit.durationMinutes }} min</span>
                  </div>
                  <div class="vs-meta-item">
                    <i class="pi pi-map-marker" aria-hidden="true"></i>
                    <span>{{ visit.locationName }}</span>
                  </div>
                </div>

                <!-- Chief Complaint -->
                <p class="vs-chief-complaint">
                  <strong>Reason:</strong> {{ visit.chiefComplaint }}
                </p>

                <!-- Quick Diagnosis Pills -->
                <div class="vs-diagnoses-preview" aria-label="Diagnoses">
                  @for (dx of visit.diagnoses.slice(0, 2); track dx.icdCode) {
                    <span class="vs-dx-pill" [class.vs-dx-pill--primary]="dx.type === 'primary'">
                      {{ dx.icdCode }}: {{ dx.plainLanguage }}
                    </span>
                  }
                  @if (visit.diagnoses.length > 2) {
                    <span class="vs-dx-pill vs-dx-pill--more">+{{ visit.diagnoses.length - 2 }} more</span>
                  }
                </div>

                <!-- Card Actions -->
                <div class="vs-card-actions">
                  <p-button
                    label="View Summary"
                    icon="pi pi-eye"
                    [outlined]="true"
                    size="small"
                    (onClick)="openDetail(visit)"
                    [attr.aria-label]="'View full summary for ' + visit.visitType + ' on ' + (visit.visitDate | date:'longDate')"
                  />
                  <p-button
                    icon="pi pi-print"
                    severity="secondary"
                    [text]="true"
                    size="small"
                    pTooltip="Print summary"
                    tooltipPosition="top"
                    (onClick)="printVisit(visit)"
                    aria-label="Print visit summary"
                  />
                  <p-button
                    icon="pi pi-download"
                    severity="secondary"
                    [text]="true"
                    size="small"
                    pTooltip="Download PDF"
                    tooltipPosition="top"
                    (onClick)="downloadVisit(visit)"
                    aria-label="Download visit summary as PDF"
                  />
                </div>
              </article>
            }
          </div>
        }
      }

      <!-- Detail Dialog -->
      <p-dialog
        [(visible)]="detailVisible"
        [modal]="true"
        [draggable]="false"
        [resizable]="false"
        [closable]="true"
        styleClass="vs-dialog"
        [style]="{ width: '860px', maxWidth: '95vw' }"
        [header]="selectedVisit()?.visitType || 'Visit Summary'"
        role="dialog"
        [attr.aria-label]="selectedVisit()?.visitType + ' details'"
        (onHide)="closeDetail()"
      >
        @if (selectedVisit(); as visit) {
          <div class="vs-detail">

            <!-- Visit Info Banner -->
            <div class="vs-detail-banner">
              <div class="vs-banner-provider">
                <div class="vs-provider-avatar vs-provider-avatar--lg" aria-hidden="true">
                  {{ getInitials(visit.providerName) }}
                </div>
                <div>
                  <p class="vs-banner-name">{{ visit.providerName }}</p>
                  <p class="vs-banner-specialty">{{ visit.providerSpecialty }}</p>
                </div>
              </div>
              <div class="vs-banner-details">
                <div class="vs-banner-item">
                  <span class="vs-banner-label">Date</span>
                  <span class="vs-banner-value">{{ visit.visitDate | date:'EEEE, MMMM d, yyyy' }}</span>
                </div>
                <div class="vs-banner-item">
                  <span class="vs-banner-label">Duration</span>
                  <span class="vs-banner-value">{{ visit.durationMinutes }} minutes</span>
                </div>
                <div class="vs-banner-item">
                  <span class="vs-banner-label">Location</span>
                  <span class="vs-banner-value">{{ visit.locationName }}</span>
                </div>
              </div>
            </div>

            <p-accordion [multiple]="true" [value]="['vitals','diagnoses','treatment','meds','labs','followup','referrals']">

              <!-- Vitals -->
              <p-accordion-panel value="vitals">
                <p-accordion-header>
                  <span class="vs-acc-header"><i class="pi pi-heart" aria-hidden="true"></i> Vitals Recorded</span>
                </p-accordion-header>
                <p-accordion-content>
                  <div class="vs-vitals-grid">
                    @if (visit.vitals.bloodPressure) {
                      <div class="vs-vital-card">
                        <i class="pi pi-heart-fill vs-vital-icon" aria-hidden="true"></i>
                        <span class="vs-vital-value">{{ visit.vitals.bloodPressure }}</span>
                        <span class="vs-vital-label">Blood Pressure</span>
                      </div>
                    }
                    @if (visit.vitals.heartRate) {
                      <div class="vs-vital-card">
                        <i class="pi pi-wave-pulse vs-vital-icon" aria-hidden="true"></i>
                        <span class="vs-vital-value">{{ visit.vitals.heartRate }} bpm</span>
                        <span class="vs-vital-label">Heart Rate</span>
                      </div>
                    }
                    @if (visit.vitals.temperature) {
                      <div class="vs-vital-card">
                        <i class="pi pi-sun vs-vital-icon" aria-hidden="true"></i>
                        <span class="vs-vital-value">{{ visit.vitals.temperature }}</span>
                        <span class="vs-vital-label">Temperature</span>
                      </div>
                    }
                    @if (visit.vitals.weight) {
                      <div class="vs-vital-card">
                        <i class="pi pi-user vs-vital-icon" aria-hidden="true"></i>
                        <span class="vs-vital-value">{{ visit.vitals.weight }}</span>
                        <span class="vs-vital-label">Weight</span>
                      </div>
                    }
                    @if (visit.vitals.oxygenSaturation) {
                      <div class="vs-vital-card">
                        <i class="pi pi-wifi vs-vital-icon" aria-hidden="true"></i>
                        <span class="vs-vital-value">{{ visit.vitals.oxygenSaturation }}%</span>
                        <span class="vs-vital-label">O₂ Saturation</span>
                      </div>
                    }
                    @if (visit.vitals.bmi) {
                      <div class="vs-vital-card">
                        <i class="pi pi-chart-bar vs-vital-icon" aria-hidden="true"></i>
                        <span class="vs-vital-value">{{ visit.vitals.bmi }}</span>
                        <span class="vs-vital-label">BMI</span>
                      </div>
                    }
                  </div>
                </p-accordion-content>
              </p-accordion-panel>

              <!-- Diagnoses -->
              <p-accordion-panel value="diagnoses">
                <p-accordion-header>
                  <span class="vs-acc-header"><i class="pi pi-clipboard" aria-hidden="true"></i> Diagnoses</span>
                </p-accordion-header>
                <p-accordion-content>
                  <div class="vs-dx-list" role="list">
                    @for (dx of visit.diagnoses; track dx.icdCode) {
                      <div class="vs-dx-item" role="listitem">
                        <div class="vs-dx-code-row">
                          <span class="vs-dx-code">{{ dx.icdCode }}</span>
                          <p-tag [value]="dx.type === 'primary' ? 'Primary' : 'Secondary'"
                                 [severity]="dx.type === 'primary' ? undefined : 'secondary'"
                                 [rounded]="true" />
                        </div>
                        <p class="vs-dx-clinical">{{ dx.description }}</p>
                        <p class="vs-dx-plain">
                          <i class="pi pi-info-circle" aria-hidden="true"></i>
                          {{ dx.plainLanguage }}
                        </p>
                      </div>
                    }
                  </div>
                </p-accordion-content>
              </p-accordion-panel>

              <!-- Treatment Plan -->
              <p-accordion-panel value="treatment">
                <p-accordion-header>
                  <span class="vs-acc-header"><i class="pi pi-check-square" aria-hidden="true"></i> Treatment Plan</span>
                </p-accordion-header>
                <p-accordion-content>
                  <p class="vs-treatment-text">{{ visit.treatmentPlan }}</p>
                </p-accordion-content>
              </p-accordion-panel>

              <!-- Medications -->
              @if (visit.medicationChanges.length > 0) {
                <p-accordion-panel value="meds">
                  <p-accordion-header>
                    <span class="vs-acc-header">
                      <i class="pi pi-box" aria-hidden="true"></i> Medication Changes
                      <span class="vs-acc-count">{{ visit.medicationChanges.length }}</span>
                    </span>
                  </p-accordion-header>
                  <p-accordion-content>
                    <div class="vs-med-list" role="list">
                      @for (med of visit.medicationChanges; track med.name) {
                        <div class="vs-med-item" role="listitem">
                          <div class="vs-med-header">
                            <span class="vs-med-name">{{ med.name }}</span>
                            <p-tag
                              [value]="getMedChangeLabel(med.changeType)"
                              [severity]="getMedChangeSeverity(med.changeType)"
                              [rounded]="true"
                            />
                          </div>
                          <div class="vs-med-details">
                            <span><strong>Dose:</strong> {{ med.dosage }}</span>
                            <span><strong>Frequency:</strong> {{ med.frequency }}</span>
                          </div>
                          <p class="vs-med-instructions">{{ med.instructions }}</p>
                        </div>
                      }
                    </div>
                  </p-accordion-content>
                </p-accordion-panel>
              }

              <!-- Lab Orders -->
              @if (visit.labOrders.length > 0) {
                <p-accordion-panel value="labs">
                  <p-accordion-header>
                    <span class="vs-acc-header">
                      <i class="pi pi-flask" aria-hidden="true"></i> Lab Orders
                      <span class="vs-acc-count">{{ visit.labOrders.length }}</span>
                    </span>
                  </p-accordion-header>
                  <p-accordion-content>
                    <div class="vs-lab-list" role="list">
                      @for (lab of visit.labOrders; track lab.testName) {
                        <div class="vs-lab-item" role="listitem">
                          <div class="vs-lab-header">
                            <span class="vs-lab-name">{{ lab.testName }}</span>
                            <p-tag
                              [value]="getLabStatusLabel(lab.status)"
                              [severity]="getLabStatusSeverity(lab.status)"
                              [rounded]="true"
                            />
                          </div>
                          <p class="vs-lab-reason">{{ lab.reason }}</p>
                        </div>
                      }
                    </div>
                  </p-accordion-content>
                </p-accordion-panel>
              }

              <!-- Follow-Up Instructions -->
              <p-accordion-panel value="followup">
                <p-accordion-header>
                  <span class="vs-acc-header"><i class="pi pi-calendar-plus" aria-hidden="true"></i> Follow-Up Instructions</span>
                </p-accordion-header>
                <p-accordion-content>
                  <p class="vs-followup-text">{{ visit.followUpInstructions }}</p>
                  @if (visit.warningSignsToWatch.length > 0) {
                    <div class="vs-warning-box" role="alert">
                      <div class="vs-warning-header">
                        <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
                        <strong>Warning Signs — Call Us or Seek Care If You Experience:</strong>
                      </div>
                      <ul class="vs-warning-list">
                        @for (sign of visit.warningSignsToWatch; track sign) {
                          <li>{{ sign }}</li>
                        }
                      </ul>
                    </div>
                  }
                </p-accordion-content>
              </p-accordion-panel>

              <!-- Referrals -->
              @if (visit.referrals.length > 0) {
                <p-accordion-panel value="referrals">
                  <p-accordion-header>
                    <span class="vs-acc-header">
                      <i class="pi pi-directions" aria-hidden="true"></i> Referrals
                      <span class="vs-acc-count">{{ visit.referrals.length }}</span>
                    </span>
                  </p-accordion-header>
                  <p-accordion-content>
                    <div class="vs-referral-list" role="list">
                      @for (ref of visit.referrals; track ref.specialty) {
                        <div class="vs-referral-item" role="listitem">
                          <div class="vs-referral-header">
                            <span class="vs-referral-specialty">{{ ref.specialty }}</span>
                            <div class="vs-referral-tags">
                              <p-tag
                                [value]="ref.urgency"
                                [severity]="ref.urgency === 'urgent' ? 'danger' : ref.urgency === 'emergent' ? 'danger' : 'secondary'"
                                [rounded]="true"
                              />
                              <p-tag
                                [value]="ref.status"
                                [severity]="ref.status === 'completed' ? 'success' : ref.status === 'scheduled' ? undefined : 'warn'"
                                [rounded]="true"
                              />
                            </div>
                          </div>
                          @if (ref.providerName) {
                            <p class="vs-referral-provider">To: {{ ref.providerName }}</p>
                          }
                          <p class="vs-referral-reason">{{ ref.reason }}</p>
                        </div>
                      }
                    </div>
                  </p-accordion-content>
                </p-accordion-panel>
              }

            </p-accordion>

            <!-- Dialog Footer Actions -->
            <div class="vs-detail-actions">
              <p-button
                label="Print Summary"
                icon="pi pi-print"
                severity="secondary"
                [outlined]="true"
                (onClick)="printVisit(visit)"
                aria-label="Print this visit summary"
              />
              <p-button
                label="Download PDF"
                icon="pi pi-download"
                (onClick)="downloadVisit(visit)"
                aria-label="Download this visit summary as PDF"
              />
            </div>
          </div>
        }
      </p-dialog>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .vs-page {
      padding: 2rem;
      max-width: 1100px;
      margin: 0 auto;
    }

    /* Header */
    .vs-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    .vs-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--surface-900);
      margin: 0 0 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }
    .vs-title-icon {
      color: var(--primary-color);
      font-size: 1.5rem;
    }
    .vs-subtitle {
      color: var(--surface-500);
      margin: 0;
      font-size: 0.9375rem;
    }
    .vs-new-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: #fff;
      border-radius: 2rem;
      font-weight: 600;
      font-size: 0.875rem;
      animation: pulse-badge 2s ease-in-out infinite;
      white-space: nowrap;
    }
    @keyframes pulse-badge {
      0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); }
      50% { box-shadow: 0 0 0 8px rgba(245,158,11,0); }
    }

    /* Filters */
    .vs-filters {
      display: flex;
      align-items: flex-end;
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 1.25rem 1.5rem;
      background: var(--surface-0);
      border: 1px solid var(--surface-200);
      border-radius: 0.75rem;
      flex-wrap: wrap;
    }
    .vs-filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      flex: 1;
      min-width: 200px;
    }
    .vs-filter-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--surface-600);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .vs-filter-actions {
      margin-left: auto;
      padding-bottom: 0.1rem;
    }
    :host ::ng-deep .vs-select { width: 100%; }

    /* Results meta */
    .vs-results-meta {
      font-size: 0.875rem;
      color: var(--surface-500);
      margin-bottom: 1rem;
    }

    /* Skeleton */
    .vs-skeleton-grid {
      display: grid;
      gap: 1rem;
    }
    .vs-skeleton-card {
      background: var(--surface-0);
      border: 1px solid var(--surface-200);
      border-radius: 0.75rem;
      padding: 1.5rem;
    }

    /* Empty */
    .vs-empty {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--surface-400);
    }
    .vs-empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      display: block;
    }
    .vs-empty h3 { margin: 0 0 0.5rem; color: var(--surface-600); }
    .vs-empty p { margin: 0; }

    /* Cards Grid */
    .vs-cards-grid {
      display: grid;
      gap: 1.25rem;
    }

    .vs-card {
      background: var(--surface-0);
      border: 1px solid var(--surface-200);
      border-radius: 0.875rem;
      padding: 1.5rem;
      transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
    }
    .vs-card:hover {
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      border-color: var(--primary-200);
      transform: translateY(-1px);
    }
    .vs-card--new {
      border-left: 4px solid var(--primary-color);
      background: linear-gradient(to right, var(--primary-50) 0%, var(--surface-0) 5%);
    }

    .vs-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .vs-card-header-left {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
    }
    .vs-provider-avatar {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--teal-600) 0%, var(--primary-color) 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9375rem;
      flex-shrink: 0;
    }
    .vs-provider-avatar--lg {
      width: 3.5rem;
      height: 3.5rem;
      font-size: 1.125rem;
    }
    .vs-visit-type {
      font-size: 1.0625rem;
      font-weight: 700;
      margin: 0 0 0.2rem;
      color: var(--surface-900);
    }
    .vs-provider-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--primary-color);
      margin: 0 0 0.1rem;
    }
    .vs-provider-specialty {
      font-size: 0.8125rem;
      color: var(--surface-500);
      margin: 0;
    }

    .vs-card-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem 1.5rem;
      margin-bottom: 0.875rem;
    }
    .vs-meta-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      color: var(--surface-500);
    }
    .vs-meta-item i { font-size: 0.8rem; }

    .vs-chief-complaint {
      font-size: 0.875rem;
      color: var(--surface-600);
      margin: 0 0 0.875rem;
      line-height: 1.5;
    }

    .vs-diagnoses-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1.125rem;
    }
    .vs-dx-pill {
      font-size: 0.75rem;
      padding: 0.25rem 0.625rem;
      border-radius: 1rem;
      background: var(--surface-100);
      color: var(--surface-600);
      border: 1px solid var(--surface-200);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 280px;
    }
    .vs-dx-pill--primary {
      background: var(--primary-50);
      color: var(--primary-700);
      border-color: var(--primary-200);
    }
    .vs-dx-pill--more {
      font-weight: 600;
      background: var(--surface-200);
      color: var(--surface-700);
    }

    .vs-card-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--surface-100);
    }

    /* Detail Dialog */
    :host ::ng-deep .vs-dialog .p-dialog-header {
      padding: 1.25rem 1.5rem 0.75rem;
      border-bottom: 1px solid var(--surface-100);
    }
    :host ::ng-deep .vs-dialog .p-dialog-content {
      padding: 0;
    }
    .vs-detail {
      padding: 0;
    }

    /* Banner */
    .vs-detail-banner {
      display: flex;
      align-items: center;
      gap: 2rem;
      padding: 1.25rem 1.5rem;
      background: linear-gradient(135deg, var(--primary-50) 0%, var(--surface-0) 100%);
      border-bottom: 1px solid var(--surface-100);
      flex-wrap: wrap;
    }
    .vs-banner-provider {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .vs-banner-name {
      font-size: 1rem;
      font-weight: 700;
      color: var(--surface-900);
      margin: 0 0 0.2rem;
    }
    .vs-banner-specialty {
      font-size: 0.875rem;
      color: var(--primary-color);
      font-weight: 600;
      margin: 0;
    }
    .vs-banner-details {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
    }
    .vs-banner-item {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .vs-banner-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--surface-400);
    }
    .vs-banner-value {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--surface-700);
    }

    /* Accordion */
    :host ::ng-deep .vs-detail .p-accordion {
      border-radius: 0;
    }
    :host ::ng-deep .vs-detail .p-accordion-panel {
      border-bottom: 1px solid var(--surface-100);
    }
    :host ::ng-deep .vs-detail .p-accordion-header-link {
      padding: 1rem 1.5rem;
    }
    :host ::ng-deep .vs-detail .p-accordion-content {
      padding: 0 1.5rem 1.25rem;
    }
    .vs-acc-header {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      font-weight: 600;
      color: var(--surface-700);
    }
    .vs-acc-header i { color: var(--primary-color); }
    .vs-acc-count {
      background: var(--primary-100);
      color: var(--primary-700);
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.1rem 0.5rem;
      border-radius: 1rem;
      margin-left: 0.25rem;
    }

    /* Vitals Grid */
    .vs-vitals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.875rem;
    }
    .vs-vital-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      padding: 1rem 0.75rem;
      background: var(--surface-50);
      border: 1px solid var(--surface-200);
      border-radius: 0.75rem;
      text-align: center;
      transition: border-color 0.2s;
    }
    .vs-vital-card:hover { border-color: var(--primary-300); }
    .vs-vital-icon { font-size: 1.25rem; color: var(--primary-color); }
    .vs-vital-value { font-size: 1rem; font-weight: 700; color: var(--surface-800); }
    .vs-vital-label { font-size: 0.75rem; color: var(--surface-500); }

    /* Diagnoses */
    .vs-dx-list { display: flex; flex-direction: column; gap: 0.875rem; }
    .vs-dx-item {
      padding: 1rem;
      background: var(--surface-50);
      border: 1px solid var(--surface-200);
      border-radius: 0.625rem;
    }
    .vs-dx-code-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.375rem;
    }
    .vs-dx-code {
      font-family: 'Courier New', monospace;
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--primary-color);
      background: var(--primary-50);
      padding: 0.15rem 0.5rem;
      border-radius: 0.375rem;
    }
    .vs-dx-clinical {
      font-size: 0.875rem;
      color: var(--surface-600);
      margin: 0 0 0.375rem;
    }
    .vs-dx-plain {
      font-size: 0.875rem;
      color: var(--surface-700);
      margin: 0;
      display: flex;
      gap: 0.375rem;
      align-items: flex-start;
    }
    .vs-dx-plain i { color: var(--primary-color); flex-shrink: 0; margin-top: 0.1rem; }

    /* Treatment */
    .vs-treatment-text {
      font-size: 0.9375rem;
      line-height: 1.7;
      color: var(--surface-700);
      margin: 0;
    }

    /* Medications */
    .vs-med-list { display: flex; flex-direction: column; gap: 0.875rem; }
    .vs-med-item {
      padding: 1rem;
      background: var(--surface-50);
      border: 1px solid var(--surface-200);
      border-radius: 0.625rem;
    }
    .vs-med-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }
    .vs-med-name { font-weight: 700; color: var(--surface-800); font-size: 0.9375rem; }
    .vs-med-details {
      display: flex;
      gap: 1.5rem;
      font-size: 0.8125rem;
      color: var(--surface-600);
      margin-bottom: 0.375rem;
      flex-wrap: wrap;
    }
    .vs-med-instructions {
      font-size: 0.8125rem;
      color: var(--surface-500);
      margin: 0;
      font-style: italic;
    }

    /* Labs */
    .vs-lab-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .vs-lab-item {
      padding: 0.875rem 1rem;
      background: var(--surface-50);
      border: 1px solid var(--surface-200);
      border-radius: 0.625rem;
    }
    .vs-lab-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.375rem;
      flex-wrap: wrap;
    }
    .vs-lab-name { font-weight: 600; color: var(--surface-800); }
    .vs-lab-reason { font-size: 0.8125rem; color: var(--surface-500); margin: 0; }

    /* Follow-up */
    .vs-followup-text {
      font-size: 0.9375rem;
      line-height: 1.7;
      color: var(--surface-700);
      margin: 0 0 1rem;
    }
    .vs-warning-box {
      background: #fffbeb;
      border: 1px solid #fcd34d;
      border-left: 4px solid #f59e0b;
      border-radius: 0.625rem;
      padding: 1rem 1.125rem;
    }
    .vs-warning-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      color: #92400e;
      font-size: 0.9rem;
    }
    .vs-warning-header i { color: #f59e0b; }
    .vs-warning-list {
      margin: 0;
      padding-left: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
    .vs-warning-list li {
      font-size: 0.875rem;
      color: #78350f;
      line-height: 1.5;
    }

    /* Referrals */
    .vs-referral-list { display: flex; flex-direction: column; gap: 0.875rem; }
    .vs-referral-item {
      padding: 1rem;
      background: var(--surface-50);
      border: 1px solid var(--surface-200);
      border-radius: 0.625rem;
    }
    .vs-referral-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.375rem;
      flex-wrap: wrap;
    }
    .vs-referral-specialty { font-weight: 700; color: var(--surface-800); font-size: 0.9375rem; }
    .vs-referral-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .vs-referral-provider { font-size: 0.875rem; color: var(--primary-color); margin: 0 0 0.25rem; font-weight: 600; }
    .vs-referral-reason { font-size: 0.875rem; color: var(--surface-600); margin: 0; }

    /* Dialog Footer */
    .vs-detail-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--surface-100);
      background: var(--surface-50);
    }

    @media (max-width: 640px) {
      .vs-page { padding: 1rem; }
      .vs-filters { flex-direction: column; }
      .vs-filter-group { min-width: 100%; }
      .vs-banner-details { gap: 1rem; }
    }
  `]
})
export class VisitSummariesComponent {
  readonly service = inject(VisitSummariesService);

  detailVisible = false;
  selectedProvider = '';
  selectedStatus = '';

  readonly statusOptions = [
    { label: 'New', value: 'new' },
    { label: 'Reviewed', value: 'reviewed' }
  ];

  readonly providerOptions = computed(() => {
    const providers = [...new Set(this.service.visits().map(v => v.providerName))];
    return providers.map(p => ({ label: p, value: p }));
  });

  readonly filteredVisits = computed(() => {
    return this.service.visits().filter(v => {
      const providerMatch = !this.selectedProvider || v.providerName === this.selectedProvider;
      const statusMatch = !this.selectedStatus || v.status === this.selectedStatus;
      return providerMatch && statusMatch;
    });
  });

  readonly selectedVisit = this.service.selectedVisit;

  openDetail(visit: VisitSummary): void {
    this.service.selectVisit(visit.id);
    this.detailVisible = true;
  }

  closeDetail(): void {
    this.detailVisible = false;
  }

  clearFilters(): void {
    this.selectedProvider = '';
    this.selectedStatus = '';
  }

  getInitials(name: string): string {
    return name.replace('Dr. ', '').split(' ').map(n => n[0]).slice(0, 2).join('');
  }

  getMedChangeLabel(type: string): string {
    const map: Record<string, string> = {
      'new': 'New',
      'modified': 'Modified',
      'discontinued': 'Stopped',
      'continued': 'Continued'
    };
    return map[type] ?? type;
  }

  getMedChangeSeverity(type: string): 'success' | 'warn' | 'danger' | 'secondary' | undefined {
    const map: Record<string, 'success' | 'warn' | 'danger' | 'secondary'> = {
      'new': 'success',
      'modified': 'warn',
      'discontinued': 'danger',
      'continued': 'secondary'
    };
    return map[type];
  }

  getLabStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'ordered': 'Ordered',
      'collected': 'Collected',
      'resulted': 'Results Available'
    };
    return map[status] ?? status;
  }

  getLabStatusSeverity(status: string): 'success' | 'warn' | 'secondary' | undefined {
    const map: Record<string, 'success' | 'warn' | 'secondary'> = {
      'ordered': 'secondary',
      'collected': 'warn',
      'resulted': 'success'
    };
    return map[status];
  }

  printVisit(visit: VisitSummary): void {
    console.log('Print visit:', visit.id);
    window.print();
  }

  downloadVisit(visit: VisitSummary): void {
    console.log('Download visit PDF:', visit.id);
  }
}
