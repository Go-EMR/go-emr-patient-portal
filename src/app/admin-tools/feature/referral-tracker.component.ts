import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

interface Referral {
  id: string;
  specialty: string;
  provider: string;
  referredBy: string;
  date: Date;
  reason: string;
  status: 'pending' | 'approved' | 'scheduled' | 'completed' | 'cancelled';
  steps: string[];
  currentStep: number;
  appointmentDate: Date | null;
}

@Component({
  selector: 'app-referral-tracker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, CardModule, TagModule, TooltipModule],
  template: `
    <div class="referral-page">

      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-send"></i>
          </div>
          <div>
            <h1 class="page-title">Referral Tracker</h1>
            <p class="page-subtitle">Track the status of your specialist referrals from request to completion</p>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat-pill">
            <span class="stat-pill-num">{{ activeCount() }}</span>
            <span class="stat-pill-label">Active Referrals</span>
          </div>
          <div class="stat-pill">
            <span class="stat-pill-num">{{ completedCount() }}</span>
            <span class="stat-pill-label">Completed</span>
          </div>
        </div>
      </div>

      <!-- Info Banner -->
      <div class="info-banner">
        <i class="pi pi-info-circle"></i>
        <span>Referrals are processed by your care team. Contact your provider if you have questions about a pending referral.</span>
      </div>

      <!-- Referral Cards -->
      <div class="referrals-list">
        @for (ref of referrals(); track ref.id) {
          <div class="referral-card" [class]="'status-' + ref.status">

            <!-- Card Header -->
            <div class="referral-header">
              <div class="specialty-icon-wrap">
                <i [class]="getSpecialtyIcon(ref.specialty)"></i>
              </div>
              <div class="referral-title-group">
                <div class="referral-title-row">
                  <h3 class="referral-specialty">{{ ref.specialty }}</h3>
                  <p-tag
                    [value]="getStatusLabel(ref.status)"
                    [severity]="getStatusSeverity(ref.status)"
                  ></p-tag>
                </div>
                <div class="referral-id-row">
                  <span class="referral-id">{{ ref.id }}</span>
                  <span class="referral-dot">&bull;</span>
                  <span class="referral-provider">{{ ref.provider }}</span>
                </div>
              </div>
            </div>

            <!-- Stepper -->
            <div class="stepper-section">
              <div class="stepper">
                @for (step of ref.steps; track step; let i = $index) {
                  <div class="step"
                       [class.step-done]="ref.currentStep > i + 1"
                       [class.step-active]="ref.currentStep === i + 1">
                    <div class="step-circle">
                      @if (ref.currentStep > i + 1) {
                        <i class="pi pi-check"></i>
                      } @else {
                        <span>{{ i + 1 }}</span>
                      }
                    </div>
                    <div class="step-label">{{ step }}</div>
                  </div>
                  @if (i < ref.steps.length - 1) {
                    <div class="step-connector"
                         [class.connector-done]="ref.currentStep > i + 1"></div>
                  }
                }
              </div>
            </div>

            <!-- Details Grid -->
            <div class="referral-details">
              <div class="detail-item">
                <i class="pi pi-user detail-icon"></i>
                <span class="detail-label">Referred by:</span>
                <span class="detail-value">{{ ref.referredBy }}</span>
              </div>
              <div class="detail-item">
                <i class="pi pi-calendar detail-icon"></i>
                <span class="detail-label">Referred on:</span>
                <span class="detail-value">{{ formatDate(ref.date) }}</span>
              </div>
              <div class="detail-item">
                <i class="pi pi-comment detail-icon"></i>
                <span class="detail-label">Reason:</span>
                <span class="detail-value reason-text">{{ ref.reason }}</span>
              </div>
              @if (ref.appointmentDate) {
                <div class="detail-item highlight-item">
                  <i class="pi pi-calendar-plus detail-icon"></i>
                  <span class="detail-label">Appointment:</span>
                  <span class="detail-value appt-date">{{ formatDate(ref.appointmentDate) }}</span>
                </div>
              }
            </div>

            <!-- Card Footer -->
            <div class="referral-footer">
              @if (ref.status === 'scheduled' && ref.appointmentDate) {
                <div class="upcoming-notice">
                  <i class="pi pi-clock"></i>
                  Appointment in {{ daysUntil(ref.appointmentDate) }} days
                </div>
              }
              @if (ref.status === 'approved') {
                <div class="action-notice">
                  <i class="pi pi-phone"></i>
                  Contact {{ ref.provider }}'s office to schedule your appointment
                </div>
              }
              @if (ref.status === 'completed') {
                <div class="completed-notice">
                  <i class="pi pi-check-circle"></i>
                  Referral completed — results shared with {{ ref.referredBy }}
                </div>
              }
              <button
                pButton
                label="View Details"
                icon="pi pi-eye"
                class="p-button-sm p-button-outlined p-button-secondary details-btn"
                pTooltip="View full referral documentation"
                tooltipPosition="top"
              ></button>
            </div>

          </div>
        }
      </div>

      <!-- Empty State -->
      @if (referrals().length === 0) {
        <div class="empty-state">
          <i class="pi pi-send"></i>
          <h3>No Referrals</h3>
          <p>You have no specialist referrals at this time. Your provider will create referrals when needed.</p>
        </div>
      }

    </div>
  `,
  styles: [`
    /* ===== Page Layout ===== */
    .referral-page {
      max-width: 1000px;
      margin: 0 auto;
    }

    /* ===== Page Header ===== */
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

    /* ===== Info Banner ===== */
    .info-banner {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem 1.125rem;
      background: var(--blue-50, #eff6ff);
      border: 1px solid var(--blue-100, #dbeafe);
      border-radius: var(--border-radius);
      font-size: 0.83rem;
      color: var(--text-color-secondary);
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }

    .info-banner i {
      color: var(--blue-500);
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* ===== Referrals List ===== */
    .referrals-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* ===== Referral Card ===== */
    .referral-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      overflow: hidden;
      transition: box-shadow 0.15s ease;
    }

    .referral-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }

    .referral-card.status-scheduled {
      border-left: 4px solid var(--blue-400);
    }

    .referral-card.status-approved {
      border-left: 4px solid var(--green-400);
    }

    .referral-card.status-completed {
      border-left: 4px solid var(--surface-400);
      opacity: 0.85;
    }

    .referral-card.status-pending {
      border-left: 4px solid var(--orange-400);
    }

    .referral-card.status-cancelled {
      border-left: 4px solid var(--red-400);
      opacity: 0.7;
    }

    /* Card Header */
    .referral-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.25rem 1.5rem 1rem;
    }

    .specialty-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: var(--primary-50);
      color: var(--primary-600);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .referral-title-group {
      flex: 1;
      min-width: 0;
    }

    .referral-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.35rem;
      flex-wrap: wrap;
    }

    .referral-specialty {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .referral-id-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.78rem;
      color: var(--text-color-secondary);
    }

    .referral-id {
      font-family: 'Courier New', monospace;
      font-weight: 600;
      letter-spacing: 0.04em;
    }

    .referral-dot {
      opacity: 0.5;
    }

    /* ===== Stepper ===== */
    .stepper-section {
      padding: 0 1.5rem 1rem;
    }

    .stepper {
      display: flex;
      align-items: center;
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
      font-weight: 600;
    }

    .step-connector {
      flex: 1;
      height: 2px;
      background: var(--surface-border);
      margin-bottom: 20px;
      min-width: 20px;
    }

    .step-connector.connector-done {
      background: var(--primary-color);
    }

    /* ===== Details Grid ===== */
    .referral-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: var(--surface-ground);
      border-top: 1px solid var(--surface-border);
    }

    .detail-item {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      font-size: 0.83rem;
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
      min-width: 80px;
    }

    .detail-value {
      color: var(--text-color);
      font-weight: 500;
    }

    .reason-text {
      font-style: italic;
      font-weight: 400;
    }

    .highlight-item {
      background: var(--primary-50);
      border: 1px solid var(--primary-100);
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      margin-top: 0.25rem;
    }

    .appt-date {
      color: var(--primary-700);
      font-weight: 700;
    }

    /* ===== Card Footer ===== */
    .referral-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.875rem 1.5rem;
      border-top: 1px solid var(--surface-border);
      flex-wrap: wrap;
    }

    .upcoming-notice,
    .action-notice,
    .completed-notice {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .upcoming-notice {
      color: var(--blue-600);
    }

    .action-notice {
      color: var(--orange-600);
    }

    .completed-notice {
      color: var(--green-600);
    }

    .details-btn {
      margin-left: auto;
    }

    /* ===== Empty State ===== */
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
      gap: 0.75rem;
    }

    .empty-state i {
      font-size: 3rem;
      opacity: 0.2;
    }

    .empty-state h3 {
      margin: 0;
      color: var(--text-color);
    }

    .empty-state p {
      margin: 0;
      font-size: 0.875rem;
      max-width: 400px;
    }

    /* ===== Responsive ===== */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .stepper {
        overflow-x: auto;
        padding-bottom: 0.25rem;
      }

      .step-label {
        display: none;
      }

      .referral-footer {
        flex-direction: column;
        align-items: flex-start;
      }

      .details-btn {
        margin-left: 0;
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .header-stats {
        width: 100%;
      }

      .stat-pill {
        flex: 1;
      }
    }
  `]
})
export class ReferralTrackerComponent {
  referrals = signal<Referral[]>([
    {
      id: 'REF-001',
      specialty: 'Cardiology',
      provider: 'Dr. Michael Chen',
      referredBy: 'Dr. Sarah Johnson',
      date: new Date(Date.now() - 20 * 86400000),
      reason: 'Elevated cholesterol, family history of heart disease',
      status: 'scheduled',
      steps: ['Referred', 'Approved', 'Scheduled', 'Completed'],
      currentStep: 3,
      appointmentDate: new Date(Date.now() + 5 * 86400000)
    },
    {
      id: 'REF-002',
      specialty: 'Dermatology',
      provider: 'Dr. Emily Rodriguez',
      referredBy: 'Dr. Sarah Johnson',
      date: new Date(Date.now() - 10 * 86400000),
      reason: 'Suspicious mole evaluation',
      status: 'approved',
      steps: ['Referred', 'Approved', 'Scheduled', 'Completed'],
      currentStep: 2,
      appointmentDate: null
    },
    {
      id: 'REF-003',
      specialty: 'Ophthalmology',
      provider: 'Dr. Lisa Patel',
      referredBy: 'Dr. Sarah Johnson',
      date: new Date(Date.now() - 60 * 86400000),
      reason: 'Annual diabetic eye screening',
      status: 'completed',
      steps: ['Referred', 'Approved', 'Scheduled', 'Completed'],
      currentStep: 4,
      appointmentDate: null
    }
  ]);

  activeCount = computed(() =>
    this.referrals().filter(r => r.status !== 'completed' && r.status !== 'cancelled').length
  );

  completedCount = computed(() =>
    this.referrals().filter(r => r.status === 'completed').length
  );

  getStatusLabel(status: Referral['status']): string {
    const labels: Record<Referral['status'], string> = {
      pending: 'Pending',
      approved: 'Approved',
      scheduled: 'Scheduled',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return labels[status];
  }

  getStatusSeverity(status: Referral['status']): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<Referral['status'], 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      pending: 'warn',
      approved: 'info',
      scheduled: 'success',
      completed: 'secondary',
      cancelled: 'danger'
    };
    return map[status];
  }

  getSpecialtyIcon(specialty: string): string {
    const icons: Record<string, string> = {
      Cardiology: 'pi pi-heart-fill',
      Dermatology: 'pi pi-sun',
      Ophthalmology: 'pi pi-eye',
      Orthopedics: 'pi pi-wrench',
      Neurology: 'pi pi-bolt',
      Oncology: 'pi pi-shield'
    };
    return icons[specialty] ?? 'pi pi-user-plus';
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  daysUntil(date: Date): number {
    const diff = date.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  }
}
