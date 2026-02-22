import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

type FeedbackStatus = 'Submitted' | 'Under Review' | 'Resolved';
type Priority = 'Low' | 'Medium' | 'High';

interface FeedbackEntry {
  id: string;
  category: string;
  subject: string;
  priority: Priority;
  submittedOn: Date;
  status: FeedbackStatus;
  lastUpdate: Date;
}

@Component({
  selector: 'app-feedback',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TagModule,
    DropdownModule,
    InputTextModule,
    TextareaModule
  ],
  template: `
    <div class="feedback-page">

      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-megaphone"></i>
          </div>
          <div>
            <h1 class="page-title">Feedback Portal</h1>
            <p class="page-subtitle">Submit complaints, suggestions, or compliments about your care experience</p>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat-pill">
            <span class="stat-pill-num">{{ previousEntries().length }}</span>
            <span class="stat-pill-label">Total Submissions</span>
          </div>
          <div class="stat-pill">
            <span class="stat-pill-num">{{ openCount() }}</span>
            <span class="stat-pill-label">Open</span>
          </div>
        </div>
      </div>

      <!-- Page Body -->
      <div class="page-layout">

        <!-- Feedback Form -->
        <div class="form-panel">

          <!-- Success State -->
          @if (submitted()) {
            <div class="success-state">
              <div class="success-state-icon">
                <i class="pi pi-check-circle"></i>
              </div>
              <h3 class="success-title">Feedback Submitted</h3>
              <p class="success-sub">Your feedback has been received. Reference number:</p>
              <div class="ref-badge">{{ referenceNumber() }}</div>
              <p class="success-sub">Our patient relations team will review your submission within 2–3 business days.</p>
              <button
                pButton
                label="Submit Another"
                icon="pi pi-plus"
                class="p-button-outlined"
                (click)="resetForm()"
              ></button>
            </div>
          }

          @if (!submitted()) {
            <div class="form-panel-header">
              <i class="pi pi-plus-circle"></i>
              <h2 class="form-panel-title">New Feedback Submission</h2>
            </div>

            <div class="form-body">

              <!-- Category & Priority Row -->
              <div class="form-row-2col">
                <div class="form-field">
                  <label class="field-label">Category <span class="required">*</span></label>
                  <p-dropdown
                    [(ngModel)]="selectedCategory"
                    [options]="categoryOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select category"
                    styleClass="w-full"
                  ></p-dropdown>
                </div>
                <div class="form-field">
                  <label class="field-label">Priority</label>
                  <div class="priority-options">
                    @for (p of priorityOptions; track p.value) {
                      <button
                        class="priority-btn"
                        [class.selected]="selectedPriority === p.value"
                        [class]="'priority-btn priority-btn-' + p.value.toLowerCase() + (selectedPriority === p.value ? ' selected' : '')"
                        (click)="selectedPriority = p.value"
                      >
                        <i [class]="p.icon"></i>
                        {{ p.value }}
                      </button>
                    }
                  </div>
                </div>
              </div>

              <!-- Subject -->
              <div class="form-field">
                <label class="field-label">Subject <span class="required">*</span></label>
                <input
                  pInputText
                  [(ngModel)]="subject"
                  placeholder="Brief summary of your feedback..."
                  class="w-full"
                  [maxlength]="120"
                />
                <div class="char-hint">{{ subject.length }}/120</div>
              </div>

              <!-- Description -->
              <div class="form-field">
                <label class="field-label">Description <span class="required">*</span></label>
                <textarea
                  pTextarea
                  [(ngModel)]="description"
                  rows="5"
                  placeholder="Please describe your experience in detail. Include dates, staff names, or department if relevant..."
                  class="w-full desc-area"
                ></textarea>
              </div>

              <!-- Privacy Notice -->
              <div class="privacy-notice">
                <i class="pi pi-lock"></i>
                <span>Your feedback is confidential. It will only be reviewed by authorized patient relations staff.</span>
              </div>

              <!-- Actions -->
              <div class="form-actions">
                <button
                  pButton
                  label="Clear Form"
                  icon="pi pi-refresh"
                  class="p-button-outlined p-button-secondary"
                  (click)="resetForm()"
                ></button>
                <button
                  pButton
                  label="Submit Feedback"
                  icon="pi pi-send"
                  [disabled]="!isFormValid()"
                  (click)="submitFeedback()"
                ></button>
              </div>

            </div>
          }

        </div>

        <!-- Track Your Feedback -->
        <div class="track-panel">
          <div class="track-panel-header">
            <i class="pi pi-list-check"></i>
            <h2 class="track-panel-title">Track Your Feedback</h2>
          </div>

          <div class="track-list">
            @for (entry of previousEntries(); track entry.id) {
              <div class="track-card" [class]="'priority-border-' + entry.priority.toLowerCase()">
                <div class="track-card-top">
                  <div class="track-id-group">
                    <span class="track-id">{{ entry.id }}</span>
                    <span class="track-category">{{ entry.category }}</span>
                  </div>
                  <p-tag
                    [value]="entry.status"
                    [severity]="getStatusSeverity(entry.status)"
                  ></p-tag>
                </div>

                <p class="track-subject">{{ entry.subject }}</p>

                <div class="track-meta">
                  <div class="track-meta-item">
                    <i class="pi pi-flag"></i>
                    <span class="priority-dot" [class]="'dot-' + entry.priority.toLowerCase()"></span>
                    {{ entry.priority }} Priority
                  </div>
                  <div class="track-meta-item">
                    <i class="pi pi-calendar"></i>
                    Submitted {{ formatDate(entry.submittedOn) }}
                  </div>
                  <div class="track-meta-item">
                    <i class="pi pi-refresh"></i>
                    Updated {{ formatDate(entry.lastUpdate) }}
                  </div>
                </div>

                @if (entry.status === 'Resolved') {
                  <div class="resolved-notice">
                    <i class="pi pi-check-circle"></i>
                    This issue has been resolved. Thank you for your feedback.
                  </div>
                }
              </div>
            } @empty {
              <div class="empty-track">
                <i class="pi pi-inbox"></i>
                <p>No previous submissions</p>
              </div>
            }
          </div>

          <!-- Quick Stats -->
          <div class="quick-stats">
            @for (stat of statusStats(); track stat.label) {
              <div class="quick-stat">
                <span class="quick-stat-label">{{ stat.label }}</span>
                <span class="quick-stat-num" [class]="'stat-' + stat.color">{{ stat.count }}</span>
              </div>
            }
          </div>

        </div>

      </div>

    </div>
  `,
  styles: [`
    /* ===== Page ===== */
    .feedback-page {
      max-width: 1100px;
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
      background: linear-gradient(135deg, #8b5cf6, #6d28d9);
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
      min-width: 90px;
    }

    .stat-pill-num {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--primary-color);
      line-height: 1;
    }

    .stat-pill-label {
      font-size: 0.68rem;
      color: var(--text-color-secondary);
      margin-top: 0.2rem;
      text-align: center;
    }

    /* ===== Page Layout ===== */
    .page-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 1.5rem;
      align-items: start;
    }

    /* ===== Form Panel ===== */
    .form-panel {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    .form-panel-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.125rem 1.5rem;
      border-bottom: 1px solid var(--surface-border);
      background: var(--surface-ground);
    }

    .form-panel-header i {
      color: var(--primary-color);
      font-size: 1.1rem;
    }

    .form-panel-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .form-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.125rem;
    }

    /* ===== Form Fields ===== */
    .form-row-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
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

    .char-hint {
      font-size: 0.7rem;
      color: var(--text-color-secondary);
      text-align: right;
    }

    .desc-area {
      resize: vertical;
      font-family: inherit;
      font-size: 0.875rem;
    }

    /* ===== Priority Buttons ===== */
    .priority-options {
      display: flex;
      gap: 0.5rem;
    }

    .priority-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      padding: 0.5rem 0.5rem;
      border: 2px solid var(--surface-border);
      border-radius: 8px;
      background: var(--surface-card);
      cursor: pointer;
      font-family: inherit;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-color-secondary);
      transition: all 0.15s ease;
    }

    .priority-btn-low.selected {
      border-color: var(--green-500);
      background: var(--green-50, #f0fdf4);
      color: var(--green-700);
    }

    .priority-btn-medium.selected {
      border-color: var(--orange-400);
      background: #fff7ed;
      color: var(--orange-700);
    }

    .priority-btn-high.selected {
      border-color: var(--red-400);
      background: var(--red-50, #fef2f2);
      color: var(--red-700);
    }

    /* ===== Privacy Notice ===== */
    .privacy-notice {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: var(--blue-50, #eff6ff);
      border: 1px solid var(--blue-100, #dbeafe);
      border-radius: 8px;
      font-size: 0.78rem;
      color: var(--text-color-secondary);
    }

    .privacy-notice i {
      color: var(--blue-500);
      flex-shrink: 0;
    }

    /* ===== Form Actions ===== */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 0.375rem;
    }

    /* ===== Success State ===== */
    .success-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2.5rem 2rem;
      text-align: center;
      gap: 0.875rem;
    }

    .success-state-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--green-50, #f0fdf4);
      color: var(--green-500);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
    }

    .success-title {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .success-sub {
      margin: 0;
      font-size: 0.85rem;
      color: var(--text-color-secondary);
      max-width: 380px;
    }

    .ref-badge {
      font-family: 'Courier New', monospace;
      font-weight: 700;
      font-size: 1.1rem;
      padding: 0.5rem 1.25rem;
      background: var(--primary-50);
      border: 1px solid var(--primary-200, #a5b4fc);
      border-radius: 8px;
      color: var(--primary-700);
      letter-spacing: 0.05em;
    }

    /* ===== Track Panel ===== */
    .track-panel {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    .track-panel-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.125rem 1.25rem;
      border-bottom: 1px solid var(--surface-border);
      background: var(--surface-ground);
    }

    .track-panel-header i {
      color: var(--primary-color);
    }

    .track-panel-title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .track-list {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .track-card {
      border: 1px solid var(--surface-border);
      border-radius: 10px;
      padding: 1rem;
      background: var(--surface-ground);
    }

    .track-card.priority-border-low {
      border-left: 3px solid var(--green-400);
    }

    .track-card.priority-border-medium {
      border-left: 3px solid var(--orange-400);
    }

    .track-card.priority-border-high {
      border-left: 3px solid var(--red-400);
    }

    .track-card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .track-id-group {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }

    .track-id {
      font-family: 'Courier New', monospace;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-color-secondary);
      letter-spacing: 0.04em;
    }

    .track-category {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--primary-600);
    }

    .track-subject {
      margin: 0 0 0.625rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-color);
      line-height: 1.4;
    }

    .track-meta {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .track-meta-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.72rem;
      color: var(--text-color-secondary);
    }

    .track-meta-item i {
      font-size: 0.65rem;
      width: 12px;
    }

    .priority-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .dot-low { background: var(--green-500); }
    .dot-medium { background: var(--orange-400); }
    .dot-high { background: var(--red-500); }

    .resolved-notice {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      margin-top: 0.625rem;
      padding: 0.5rem 0.75rem;
      background: var(--green-50, #f0fdf4);
      border-radius: 8px;
      font-size: 0.72rem;
      color: var(--green-700);
    }

    .resolved-notice i {
      font-size: 0.8rem;
    }

    .empty-track {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      color: var(--text-color-secondary);
      gap: 0.5rem;
      font-size: 0.85rem;
    }

    .empty-track i {
      font-size: 2rem;
      opacity: 0.25;
    }

    .empty-track p {
      margin: 0;
    }

    /* Quick Stats */
    .quick-stats {
      display: flex;
      border-top: 1px solid var(--surface-border);
    }

    .quick-stat {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.875rem 0.5rem;
      border-right: 1px solid var(--surface-border);
      gap: 0.2rem;
    }

    .quick-stat:last-child {
      border-right: none;
    }

    .quick-stat-label {
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-color-secondary);
      text-align: center;
    }

    .quick-stat-num {
      font-size: 1.25rem;
      font-weight: 700;
    }

    .stat-warn { color: var(--orange-500); }
    .stat-info { color: var(--blue-500); }
    .stat-success { color: var(--green-600); }

    /* ===== Utility ===== */
    .w-full { width: 100%; }

    /* ===== Responsive ===== */
    @media (max-width: 1000px) {
      .page-layout {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 600px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .form-row-2col {
        grid-template-columns: 1fr;
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
export class FeedbackComponent {
  selectedCategory: string = '';
  selectedPriority: Priority = 'Medium';
  subject: string = '';
  description: string = '';

  submitted = signal(false);
  referenceNumber = signal('');

  categoryOptions = [
    { label: 'Billing', value: 'Billing' },
    { label: 'Wait Time', value: 'Wait Time' },
    { label: 'Staff', value: 'Staff' },
    { label: 'Facility', value: 'Facility' },
    { label: 'Treatment', value: 'Treatment' },
    { label: 'Other', value: 'Other' }
  ];

  priorityOptions: { value: Priority; icon: string }[] = [
    { value: 'Low', icon: 'pi pi-arrow-down' },
    { value: 'Medium', icon: 'pi pi-minus' },
    { value: 'High', icon: 'pi pi-arrow-up' }
  ];

  previousEntries = signal<FeedbackEntry[]>([
    {
      id: 'FB-2025-0042',
      category: 'Wait Time',
      subject: 'Extended wait time at morning check-in',
      priority: 'Medium',
      submittedOn: new Date(Date.now() - 14 * 86400000),
      status: 'Under Review',
      lastUpdate: new Date(Date.now() - 7 * 86400000)
    },
    {
      id: 'FB-2024-0118',
      category: 'Billing',
      subject: 'Incorrect charge on October statement',
      priority: 'High',
      submittedOn: new Date(Date.now() - 90 * 86400000),
      status: 'Resolved',
      lastUpdate: new Date(Date.now() - 60 * 86400000)
    },
    {
      id: 'FB-2024-0094',
      category: 'Staff',
      subject: 'Compliment for front desk team',
      priority: 'Low',
      submittedOn: new Date(Date.now() - 120 * 86400000),
      status: 'Resolved',
      lastUpdate: new Date(Date.now() - 115 * 86400000)
    }
  ]);

  openCount = computed(() =>
    this.previousEntries().filter(e => e.status !== 'Resolved').length
  );

  statusStats = computed(() => [
    {
      label: 'Submitted',
      count: this.previousEntries().filter(e => e.status === 'Submitted').length,
      color: 'info'
    },
    {
      label: 'Under Review',
      count: this.previousEntries().filter(e => e.status === 'Under Review').length,
      color: 'warn'
    },
    {
      label: 'Resolved',
      count: this.previousEntries().filter(e => e.status === 'Resolved').length,
      color: 'success'
    }
  ]);

  isFormValid(): boolean {
    return !!this.selectedCategory && !!this.subject.trim() && !!this.description.trim();
  }

  submitFeedback(): void {
    if (!this.isFormValid()) return;
    const num = String(Math.floor(Math.random() * 9000 + 1000)).padStart(4, '0');
    const year = new Date().getFullYear();
    this.referenceNumber.set(`FB-${year}-${num}`);
    this.submitted.set(true);
  }

  resetForm(): void {
    this.selectedCategory = '';
    this.selectedPriority = 'Medium';
    this.subject = '';
    this.description = '';
    this.submitted.set(false);
    this.referenceNumber.set('');
  }

  getStatusSeverity(status: FeedbackStatus): 'success' | 'info' | 'warn' | 'secondary' {
    const map: Record<FeedbackStatus, 'success' | 'info' | 'warn' | 'secondary'> = {
      'Submitted': 'info',
      'Under Review': 'warn',
      'Resolved': 'success'
    };
    return map[status];
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
