import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TextareaModule } from 'primeng/textarea';
import { SelectButtonModule } from 'primeng/selectbutton';

interface PreviousRequest {
  id: string;
  dateRange: string;
  reason: string;
  delivery: string;
  submittedOn: Date;
  status: 'processing' | 'ready' | 'delivered';
}

@Component({
  selector: 'app-sick-note-request',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TagModule,
    CalendarModule,
    DropdownModule,
    TextareaModule,
    SelectButtonModule
  ],
  template: `
    <div class="sick-note-page">

      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-file-edit"></i>
          </div>
          <div>
            <h1 class="page-title">Sick Note Request</h1>
            <p class="page-subtitle">Request a medical certificate or sick note from your provider</p>
          </div>
        </div>
      </div>

      <!-- Success Message -->
      @if (submitted()) {
        <div class="success-banner">
          <div class="success-icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="success-body">
            <strong>Request Submitted Successfully</strong>
            <p>Your sick note request has been submitted. Reference number: <span class="ref-number">{{ referenceNumber() }}</span></p>
            <p class="success-sub">Your provider will review and issue the note within 1–2 business days. You will be notified via your selected delivery method.</p>
          </div>
          <button
            pButton
            label="New Request"
            icon="pi pi-plus"
            class="p-button-sm p-button-outlined"
            (click)="resetForm()"
          ></button>
        </div>
      }

      <!-- Form + Previous Requests -->
      <div class="page-layout">

        <!-- Request Form -->
        @if (!submitted()) {
          <div class="form-card">
            <div class="form-card-header">
              <i class="pi pi-plus-circle"></i>
              <h2 class="form-card-title">New Sick Note Request</h2>
            </div>

            <div class="form-body">

              <!-- Date Range -->
              <div class="form-section">
                <h3 class="form-section-title">Absence Period</h3>
                <div class="date-row">
                  <div class="form-field">
                    <label class="field-label">From Date <span class="required">*</span></label>
                    <p-calendar
                      [(ngModel)]="dateFrom"
                      [showIcon]="true"
                      [maxDate]="dateTo ?? undefined"
                      placeholder="Select start date"
                      styleClass="w-full"
                      dateFormat="mm/dd/yy"
                    ></p-calendar>
                  </div>
                  <div class="date-separator">
                    <i class="pi pi-arrow-right"></i>
                  </div>
                  <div class="form-field">
                    <label class="field-label">To Date <span class="required">*</span></label>
                    <p-calendar
                      [(ngModel)]="dateTo"
                      [showIcon]="true"
                      [minDate]="dateFrom ?? undefined"
                      placeholder="Select end date"
                      styleClass="w-full"
                      dateFormat="mm/dd/yy"
                    ></p-calendar>
                  </div>
                </div>
                @if (dateFrom && dateTo) {
                  <div class="duration-badge">
                    <i class="pi pi-calendar"></i>
                    {{ absenceDays() }} day{{ absenceDays() !== 1 ? 's' : '' }} of absence
                  </div>
                }
              </div>

              <!-- Reason -->
              <div class="form-section">
                <h3 class="form-section-title">Reason for Absence</h3>
                <div class="form-field">
                  <label class="field-label">Category <span class="required">*</span></label>
                  <p-dropdown
                    [(ngModel)]="selectedReason"
                    [options]="reasonOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select a reason"
                    styleClass="w-full"
                  ></p-dropdown>
                </div>
                <div class="form-field">
                  <label class="field-label">Additional Notes</label>
                  <textarea
                    pTextarea
                    [(ngModel)]="additionalNotes"
                    rows="3"
                    placeholder="Any additional details for your provider (optional)..."
                    class="w-full notes-area"
                  ></textarea>
                </div>
              </div>

              <!-- Delivery Method -->
              <div class="form-section">
                <h3 class="form-section-title">Delivery Method</h3>
                <div class="delivery-options">
                  @for (opt of deliveryOptions; track opt.value) {
                    <button
                      class="delivery-btn"
                      [class.selected]="selectedDelivery === opt.value"
                      (click)="selectedDelivery = opt.value"
                    >
                      <i [class]="opt.icon"></i>
                      <div class="delivery-btn-text">
                        <span class="delivery-btn-label">{{ opt.label }}</span>
                        <span class="delivery-btn-desc">{{ opt.desc }}</span>
                      </div>
                      @if (selectedDelivery === opt.value) {
                        <i class="pi pi-check-circle check-mark"></i>
                      }
                    </button>
                  }
                </div>
              </div>

              <!-- Actions -->
              <div class="form-actions">
                <button
                  pButton
                  label="Reset Form"
                  icon="pi pi-refresh"
                  class="p-button-outlined p-button-secondary"
                  (click)="resetForm()"
                ></button>
                <button
                  pButton
                  label="Submit Request"
                  icon="pi pi-send"
                  [disabled]="!isFormValid()"
                  (click)="submitForm()"
                ></button>
              </div>

            </div>
          </div>
        }

        <!-- Previous Requests -->
        <div class="previous-section">
          <div class="section-header">
            <h2 class="section-title">Previous Requests</h2>
            <span class="section-count">{{ previousRequests().length }} request{{ previousRequests().length !== 1 ? 's' : '' }}</span>
          </div>

          <div class="previous-list">
            @for (req of previousRequests(); track req.id) {
              <div class="prev-card">
                <div class="prev-card-header">
                  <div class="prev-icon">
                    <i class="pi pi-file"></i>
                  </div>
                  <div class="prev-title-group">
                    <span class="prev-id">{{ req.id }}</span>
                    <span class="prev-range">{{ req.dateRange }}</span>
                  </div>
                  <p-tag
                    [value]="getStatusLabel(req.status)"
                    [severity]="getStatusSeverity(req.status)"
                  ></p-tag>
                </div>
                <div class="prev-meta">
                  <span class="prev-reason">
                    <i class="pi pi-tag"></i>
                    {{ req.reason }}
                  </span>
                  <span class="prev-delivery">
                    <i class="pi pi-send"></i>
                    {{ req.delivery }}
                  </span>
                  <span class="prev-submitted">
                    <i class="pi pi-clock"></i>
                    Submitted {{ formatDate(req.submittedOn) }}
                  </span>
                </div>
                @if (req.status === 'ready') {
                  <div class="prev-actions">
                    <button pButton label="Download" icon="pi pi-download" class="p-button-sm p-button-outlined"></button>
                  </div>
                }
              </div>
            } @empty {
              <div class="empty-previous">
                <i class="pi pi-inbox"></i>
                <p>No previous requests</p>
              </div>
            }
          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    /* ===== Page Layout ===== */
    .sick-note-page {
      max-width: 1000px;
      margin: 0 auto;
    }

    /* ===== Page Header ===== */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
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
      background: linear-gradient(135deg, var(--teal-500), var(--teal-700));
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

    /* ===== Success Banner ===== */
    .success-banner {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: var(--green-50, #f0fdf4);
      border: 1px solid var(--green-200, #bbf7d0);
      border-radius: var(--border-radius);
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .success-icon {
      font-size: 1.75rem;
      color: var(--green-500);
      flex-shrink: 0;
    }

    .success-body {
      flex: 1;
    }

    .success-body strong {
      display: block;
      color: var(--green-700);
      font-size: 1rem;
      margin-bottom: 0.375rem;
    }

    .success-body p {
      margin: 0 0 0.25rem;
      font-size: 0.85rem;
      color: var(--text-color-secondary);
    }

    .ref-number {
      font-family: 'Courier New', monospace;
      font-weight: 700;
      color: var(--green-700);
      background: var(--green-100, #dcfce7);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }

    .success-sub {
      font-size: 0.78rem !important;
      margin-top: 0.375rem !important;
    }

    /* ===== Page Layout ===== */
    .page-layout {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 1.5rem;
      align-items: start;
    }

    /* ===== Form Card ===== */
    .form-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    .form-card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--surface-border);
      background: var(--surface-ground);
    }

    .form-card-header i {
      font-size: 1.1rem;
      color: var(--primary-color);
    }

    .form-card-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .form-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* ===== Form Sections ===== */
    .form-section {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .form-section-title {
      margin: 0;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-color-secondary);
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .field-label {
      font-size: 0.83rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .required {
      color: var(--red-500);
    }

    .date-row {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: end;
      gap: 0.75rem;
    }

    .date-separator {
      display: flex;
      align-items: center;
      justify-content: center;
      padding-bottom: 0.5rem;
      color: var(--text-color-secondary);
    }

    .duration-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.875rem;
      background: var(--primary-50);
      border: 1px solid var(--primary-100);
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--primary-700);
    }

    .notes-area {
      resize: vertical;
      font-family: inherit;
      font-size: 0.875rem;
    }

    /* ===== Delivery Options ===== */
    .delivery-options {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .delivery-btn {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.875rem 1rem;
      border: 2px solid var(--surface-border);
      border-radius: var(--border-radius);
      background: var(--surface-card);
      cursor: pointer;
      font-family: inherit;
      text-align: left;
      transition: all 0.15s ease;
      width: 100%;
    }

    .delivery-btn:hover {
      border-color: var(--primary-300);
      background: var(--surface-hover);
    }

    .delivery-btn.selected {
      border-color: var(--primary-color);
      background: var(--primary-50);
    }

    .delivery-btn > i:first-child {
      font-size: 1.1rem;
      color: var(--text-color-secondary);
      width: 20px;
      text-align: center;
      flex-shrink: 0;
    }

    .delivery-btn.selected > i:first-child {
      color: var(--primary-color);
    }

    .delivery-btn-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }

    .delivery-btn-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .delivery-btn-desc {
      font-size: 0.72rem;
      color: var(--text-color-secondary);
    }

    .check-mark {
      color: var(--primary-color);
      font-size: 1rem;
      flex-shrink: 0;
    }

    /* ===== Form Actions ===== */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--surface-border);
    }

    /* ===== Previous Requests ===== */
    .previous-section {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .section-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .section-count {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .previous-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .prev-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
      overflow: hidden;
    }

    .prev-card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
    }

    .prev-icon {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: var(--surface-ground);
      color: var(--text-color-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .prev-title-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .prev-id {
      font-size: 0.75rem;
      font-family: 'Courier New', monospace;
      font-weight: 700;
      color: var(--text-color-secondary);
    }

    .prev-range {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .prev-meta {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      padding: 0.625rem 1rem;
      background: var(--surface-ground);
      border-top: 1px solid var(--surface-border);
    }

    .prev-reason,
    .prev-delivery,
    .prev-submitted {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .prev-reason i,
    .prev-delivery i,
    .prev-submitted i {
      font-size: 0.7rem;
      width: 12px;
      color: var(--primary-400);
    }

    .prev-actions {
      padding: 0.625rem 1rem;
      border-top: 1px solid var(--surface-border);
      display: flex;
      justify-content: flex-end;
    }

    .empty-previous {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      color: var(--text-color-secondary);
      font-size: 0.875rem;
      gap: 0.5rem;
    }

    .empty-previous i {
      font-size: 2rem;
      opacity: 0.25;
    }

    .empty-previous p {
      margin: 0;
    }

    /* ===== Utilities ===== */
    .w-full {
      width: 100%;
    }

    /* ===== Responsive ===== */
    @media (max-width: 900px) {
      .page-layout {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 600px) {
      .date-row {
        grid-template-columns: 1fr;
      }

      .date-separator {
        display: none;
      }

      .form-actions {
        flex-direction: column-reverse;
      }

      .form-actions button {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class SickNoteRequestComponent {
  dateFrom: Date | null = null;
  dateTo: Date | null = null;
  selectedReason: string = '';
  additionalNotes: string = '';
  selectedDelivery: string = 'email';

  submitted = signal(false);
  referenceNumber = signal('');

  reasonOptions = [
    { label: 'Illness', value: 'Illness' },
    { label: 'Surgery Recovery', value: 'Surgery Recovery' },
    { label: 'Medical Appointment', value: 'Medical Appointment' },
    { label: 'Other', value: 'Other' }
  ];

  deliveryOptions = [
    { label: 'Email', desc: 'Sent to your registered email address', icon: 'pi pi-envelope', value: 'email' },
    { label: 'Portal Download', desc: 'Available in your portal documents section', icon: 'pi pi-download', value: 'portal' },
    { label: 'Fax to Employer', desc: 'Faxed directly to your employer\'s HR department', icon: 'pi pi-print', value: 'fax' }
  ];

  previousRequests = signal<PreviousRequest[]>([
    {
      id: 'SN-2025-0031',
      dateRange: 'Jan 14 – Jan 16, 2025',
      reason: 'Illness',
      delivery: 'Email',
      submittedOn: new Date(Date.now() - 35 * 86400000),
      status: 'delivered'
    },
    {
      id: 'SN-2025-0018',
      dateRange: 'Dec 2 – Dec 3, 2024',
      reason: 'Medical Appointment',
      delivery: 'Portal Download',
      submittedOn: new Date(Date.now() - 80 * 86400000),
      status: 'delivered'
    }
  ]);

  absenceDays = computed(() => {
    if (!this.dateFrom || !this.dateTo) return 0;
    const diff = this.dateTo.getTime() - this.dateFrom.getTime();
    return Math.max(1, Math.round(diff / 86400000) + 1);
  });

  isFormValid(): boolean {
    return !!this.dateFrom && !!this.dateTo && !!this.selectedReason && !!this.selectedDelivery;
  }

  submitForm(): void {
    if (!this.isFormValid()) return;
    const num = Math.floor(Math.random() * 9000 + 1000);
    this.referenceNumber.set(`SN-2026-${num}`);
    this.submitted.set(true);
  }

  resetForm(): void {
    this.dateFrom = null;
    this.dateTo = null;
    this.selectedReason = '';
    this.additionalNotes = '';
    this.selectedDelivery = 'email';
    this.submitted.set(false);
    this.referenceNumber.set('');
  }

  getStatusLabel(status: PreviousRequest['status']): string {
    const labels: Record<PreviousRequest['status'], string> = {
      processing: 'Processing',
      ready: 'Ready',
      delivered: 'Delivered'
    };
    return labels[status];
  }

  getStatusSeverity(status: PreviousRequest['status']): 'success' | 'info' | 'warn' | 'secondary' {
    const map: Record<PreviousRequest['status'], 'success' | 'info' | 'warn' | 'secondary'> = {
      processing: 'warn',
      ready: 'info',
      delivered: 'success'
    };
    return map[status];
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
