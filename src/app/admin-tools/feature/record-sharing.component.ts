import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { CalendarModule } from 'primeng/calendar';

type DurationOption = '24h' | '7d' | '30d' | 'custom';

interface ActiveShare {
  id: string;
  records: string[];
  recipient: string | null;
  createdAt: Date;
  expiresAt: Date;
  link: string;
  accessCount: number;
}

@Component({
  selector: 'app-record-sharing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TagModule,
    CheckboxModule,
    InputTextModule,
    SelectButtonModule,
    TooltipModule,
    CalendarModule
  ],
  template: `
    <div class="sharing-page">

      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-share-alt"></i>
          </div>
          <div>
            <h1 class="page-title">Record Sharing</h1>
            <p class="page-subtitle">Securely share your health records with providers, caregivers, or other organizations</p>
          </div>
        </div>
        <div class="hipaa-badge">
          <i class="pi pi-shield"></i>
          HIPAA Secure
        </div>
      </div>

      <!-- Warning Banner -->
      <div class="warn-banner">
        <i class="pi pi-exclamation-triangle"></i>
        <span>Shared links provide read-only access. Links expire automatically. Never share links via unsecured channels.</span>
      </div>

      <!-- Page Layout -->
      <div class="page-layout">

        <!-- Generate Link Form -->
        <div class="form-panel">
          <div class="form-panel-header">
            <i class="pi pi-link"></i>
            <h2 class="form-panel-title">Generate Access Link</h2>
          </div>

          <div class="form-body">

            <!-- Record Selection -->
            <div class="form-section">
              <h3 class="section-label">Select Records to Share <span class="required">*</span></h3>
              <div class="record-options">
                @for (opt of recordOptions; track opt.value) {
                  <label
                    class="record-option"
                    [class.selected]="isSelected(opt.value)"
                    [class.all-records]="opt.value === 'all'"
                  >
                    <p-checkbox
                      [binary]="true"
                      [(ngModel)]="opt.checked"
                      (ngModelChange)="onRecordToggle(opt)"
                    ></p-checkbox>
                    <div class="record-option-content">
                      <i [class]="opt.icon"></i>
                      <div class="record-option-text">
                        <span class="record-option-label">{{ opt.label }}</span>
                        @if (opt.desc) {
                          <span class="record-option-desc">{{ opt.desc }}</span>
                        }
                      </div>
                    </div>
                  </label>
                }
              </div>
            </div>

            <!-- Duration -->
            <div class="form-section">
              <h3 class="section-label">Access Duration <span class="required">*</span></h3>
              <div class="duration-options">
                @for (d of durationOptions; track d.value) {
                  <button
                    class="duration-btn"
                    [class.selected]="selectedDuration === d.value"
                    (click)="selectedDuration = d.value"
                  >
                    <i [class]="d.icon"></i>
                    <span class="duration-btn-label">{{ d.label }}</span>
                    <span class="duration-btn-sub">{{ d.sub }}</span>
                  </button>
                }
              </div>
              @if (selectedDuration === 'custom') {
                <div class="custom-date-field">
                  <label class="field-label">Custom Expiry Date</label>
                  <p-calendar
                    [(ngModel)]="customExpiryDate"
                    [showIcon]="true"
                    [minDate]="minExpiryDate"
                    placeholder="Select expiration date"
                    styleClass="w-full"
                    dateFormat="mm/dd/yy"
                  ></p-calendar>
                </div>
              }
            </div>

            <!-- Recipient Email (Optional) -->
            <div class="form-section">
              <h3 class="section-label">Recipient Email <span class="optional">(Optional)</span></h3>
              <input
                pInputText
                [(ngModel)]="recipientEmail"
                type="email"
                placeholder="recipient@example.com"
                class="w-full"
              />
              <p class="field-hint">If provided, the link will also be sent to this address.</p>
            </div>

            <!-- Generate Button -->
            <button
              pButton
              label="Generate Secure Link"
              icon="pi pi-link"
              [disabled]="!canGenerate()"
              (click)="generateLink()"
              class="generate-btn"
            ></button>

            <!-- Generated Link Display -->
            @if (generatedLink()) {
              <div class="generated-link-box">
                <div class="generated-link-header">
                  <i class="pi pi-check-circle"></i>
                  <span>Secure link generated successfully</span>
                </div>
                <div class="link-display">
                  <code class="link-text">{{ generatedLink() }}</code>
                  <button
                    pButton
                    [icon]="copied() ? 'pi pi-check' : 'pi pi-copy'"
                    [label]="copied() ? 'Copied!' : 'Copy'"
                    class="p-button-sm p-button-outlined copy-btn"
                    (click)="copyLink()"
                    pTooltip="Copy link to clipboard"
                    tooltipPosition="top"
                  ></button>
                </div>
                <div class="link-meta">
                  <span><i class="pi pi-clock"></i> Expires: {{ formatDate(linkExpiry()) }}</span>
                  <span><i class="pi pi-lock"></i> Read-only access</span>
                  <span><i class="pi pi-eye"></i> Zero access logs until first use</span>
                </div>
              </div>
            }

          </div>
        </div>

        <!-- Active Shares -->
        <div class="shares-panel">
          <div class="shares-panel-header">
            <i class="pi pi-list"></i>
            <h2 class="shares-panel-title">Active Shares</h2>
            <span class="share-count-badge">{{ activeShares().length }}</span>
          </div>

          <div class="shares-list">
            @for (share of activeShares(); track share.id) {
              <div class="share-card" [class.expiring-soon]="isExpiringSoon(share.expiresAt)">

                <div class="share-card-header">
                  <div class="share-records-list">
                    @for (rec of share.records; track rec) {
                      <span class="share-rec-tag">
                        <i class="pi pi-file"></i>
                        {{ rec }}
                      </span>
                    }
                  </div>
                  <p-tag
                    [value]="isExpiringSoon(share.expiresAt) ? 'Expiring Soon' : 'Active'"
                    [severity]="isExpiringSoon(share.expiresAt) ? 'warn' : 'success'"
                  ></p-tag>
                </div>

                <div class="share-link-row">
                  <code class="share-link-preview">{{ share.link }}</code>
                  <button
                    pButton
                    icon="pi pi-copy"
                    class="p-button-text p-button-sm"
                    pTooltip="Copy link"
                    tooltipPosition="top"
                  ></button>
                </div>

                <div class="share-meta">
                  @if (share.recipient) {
                    <div class="share-meta-item">
                      <i class="pi pi-envelope"></i>
                      <span>{{ share.recipient }}</span>
                    </div>
                  }
                  <div class="share-meta-item">
                    <i class="pi pi-calendar"></i>
                    <span>Created {{ formatDate(share.createdAt) }}</span>
                  </div>
                  <div class="share-meta-item" [class.expiry-warning]="isExpiringSoon(share.expiresAt)">
                    <i class="pi pi-clock"></i>
                    <span>Expires {{ formatDate(share.expiresAt) }} ({{ daysRemaining(share.expiresAt) }}d remaining)</span>
                  </div>
                  <div class="share-meta-item">
                    <i class="pi pi-eye"></i>
                    <span>Accessed {{ share.accessCount }} time{{ share.accessCount !== 1 ? 's' : '' }}</span>
                  </div>
                </div>

                <div class="share-footer">
                  <button
                    pButton
                    label="Revoke Access"
                    icon="pi pi-ban"
                    class="p-button-sm p-button-outlined p-button-danger"
                    (click)="revokeShare(share.id)"
                    pTooltip="Immediately invalidate this link"
                    tooltipPosition="top"
                  ></button>
                </div>

              </div>
            } @empty {
              <div class="empty-shares">
                <i class="pi pi-link"></i>
                <p>No active shares</p>
                <span>Generate a link to share records securely</span>
              </div>
            }
          </div>

          <!-- Summary Footer -->
          <div class="shares-summary">
            <span class="summary-item">
              <i class="pi pi-link"></i>
              {{ activeShares().length }} active link{{ activeShares().length !== 1 ? 's' : '' }}
            </span>
            <span class="summary-item warning" *ngIf="expiringSoonCount() > 0">
              <i class="pi pi-exclamation-triangle"></i>
              {{ expiringSoonCount() }} expiring within 24h
            </span>
          </div>

        </div>

      </div>

    </div>
  `,
  styles: [`
    /* ===== Page ===== */
    .sharing-page {
      max-width: 1100px;
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

    .hipaa-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.875rem;
      background: var(--green-50, #f0fdf4);
      color: var(--green-700);
      border: 1px solid var(--green-200, #bbf7d0);
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 700;
      white-space: nowrap;
    }

    /* ===== Warning Banner ===== */
    .warn-banner {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem 1.125rem;
      background: #fff7ed;
      border: 1px solid var(--orange-200, #fed7aa);
      border-radius: var(--border-radius);
      font-size: 0.83rem;
      color: var(--text-color-secondary);
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }

    .warn-banner i {
      color: var(--orange-500);
      flex-shrink: 0;
      margin-top: 1px;
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
      gap: 1.5rem;
    }

    /* ===== Form Sections ===== */
    .form-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .section-label {
      margin: 0;
      font-size: 0.83rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .required {
      color: var(--red-500);
    }

    .optional {
      font-size: 0.72rem;
      color: var(--text-color-secondary);
      font-weight: 400;
    }

    .field-label {
      font-size: 0.83rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .field-hint {
      margin: 0;
      font-size: 0.72rem;
      color: var(--text-color-secondary);
    }

    /* ===== Record Options ===== */
    .record-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .record-option {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.75rem 1rem;
      border: 2px solid var(--surface-border);
      border-radius: 10px;
      background: var(--surface-ground);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .record-option:hover {
      border-color: var(--primary-300);
      background: var(--surface-hover);
    }

    .record-option.selected {
      border-color: var(--primary-color);
      background: var(--primary-50);
    }

    .record-option.all-records {
      background: var(--surface-card);
      border-style: dashed;
    }

    .record-option.all-records.selected {
      border-style: solid;
      border-color: var(--primary-color);
      background: var(--primary-50);
    }

    .record-option-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .record-option-content > i {
      font-size: 1rem;
      color: var(--text-color-secondary);
      width: 18px;
      text-align: center;
    }

    .record-option.selected .record-option-content > i {
      color: var(--primary-color);
    }

    .record-option-text {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }

    .record-option-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .record-option-desc {
      font-size: 0.7rem;
      color: var(--text-color-secondary);
    }

    /* ===== Duration Options ===== */
    .duration-options {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
    }

    .duration-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3rem;
      padding: 0.75rem 0.5rem;
      border: 2px solid var(--surface-border);
      border-radius: 10px;
      background: var(--surface-ground);
      cursor: pointer;
      font-family: inherit;
      text-align: center;
      transition: all 0.15s ease;
    }

    .duration-btn:hover {
      border-color: var(--primary-300);
    }

    .duration-btn.selected {
      border-color: var(--primary-color);
      background: var(--primary-50);
    }

    .duration-btn i {
      font-size: 1rem;
      color: var(--text-color-secondary);
    }

    .duration-btn.selected i {
      color: var(--primary-color);
    }

    .duration-btn-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .duration-btn-sub {
      font-size: 0.65rem;
      color: var(--text-color-secondary);
    }

    .custom-date-field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    /* ===== Generate Button ===== */
    .generate-btn {
      width: 100%;
      justify-content: center;
    }

    /* ===== Generated Link ===== */
    .generated-link-box {
      background: var(--green-50, #f0fdf4);
      border: 1px solid var(--green-200, #bbf7d0);
      border-radius: var(--border-radius);
      padding: 1rem 1.125rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .generated-link-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--green-700);
    }

    .generated-link-header i {
      color: var(--green-500);
    }

    .link-display {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.875rem;
      background: white;
      border: 1px solid var(--green-200, #bbf7d0);
      border-radius: 8px;
    }

    .link-text {
      flex: 1;
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
      color: var(--text-color);
      word-break: break-all;
    }

    .copy-btn {
      flex-shrink: 0;
    }

    .link-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 1.25rem;
    }

    .link-meta span {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.72rem;
      color: var(--text-color-secondary);
    }

    .link-meta i {
      font-size: 0.65rem;
      color: var(--green-500);
    }

    /* ===== Shares Panel ===== */
    .shares-panel {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    .shares-panel-header {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 1.125rem 1.25rem;
      border-bottom: 1px solid var(--surface-border);
      background: var(--surface-ground);
    }

    .shares-panel-header i {
      color: var(--primary-color);
    }

    .shares-panel-title {
      margin: 0;
      flex: 1;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .share-count-badge {
      background: var(--primary-100);
      color: var(--primary-700);
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 10px;
    }

    .shares-list {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .share-card {
      border: 1px solid var(--surface-border);
      border-radius: 10px;
      background: var(--surface-ground);
      overflow: hidden;
    }

    .share-card.expiring-soon {
      border-color: var(--orange-300);
    }

    .share-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.875rem 1rem 0.5rem;
      flex-wrap: wrap;
    }

    .share-records-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .share-rec-tag {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.2rem 0.5rem;
      background: var(--primary-50);
      border: 1px solid var(--primary-100);
      border-radius: 12px;
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--primary-700);
    }

    .share-rec-tag i {
      font-size: 0.6rem;
    }

    .share-link-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--surface-card);
      border-top: 1px solid var(--surface-border);
      border-bottom: 1px solid var(--surface-border);
    }

    .share-link-preview {
      flex: 1;
      font-family: 'Courier New', monospace;
      font-size: 0.65rem;
      color: var(--text-color-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .share-meta {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.625rem 1rem;
    }

    .share-meta-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.72rem;
      color: var(--text-color-secondary);
    }

    .share-meta-item i {
      font-size: 0.65rem;
      width: 12px;
    }

    .share-meta-item.expiry-warning {
      color: var(--orange-600);
      font-weight: 600;
    }

    .share-footer {
      padding: 0.625rem 1rem;
      border-top: 1px solid var(--surface-border);
      display: flex;
      justify-content: flex-end;
    }

    .empty-shares {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2.5rem 1rem;
      color: var(--text-color-secondary);
      text-align: center;
      gap: 0.35rem;
    }

    .empty-shares i {
      font-size: 2.5rem;
      opacity: 0.2;
    }

    .empty-shares p {
      margin: 0;
      font-weight: 600;
      color: var(--text-color);
    }

    .empty-shares span {
      font-size: 0.78rem;
    }

    /* ===== Shares Summary ===== */
    .shares-summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.25rem;
      border-top: 1px solid var(--surface-border);
      background: var(--surface-ground);
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .summary-item.warning {
      color: var(--orange-600);
      font-weight: 600;
    }

    .summary-item i {
      font-size: 0.7rem;
    }

    /* ===== Utility ===== */
    .w-full { width: 100%; }

    /* ===== Responsive ===== */
    @media (max-width: 1000px) {
      .page-layout {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 600px) {
      .duration-options {
        grid-template-columns: 1fr 1fr;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class RecordSharingComponent {
  recipientEmail: string = '';
  selectedDuration: DurationOption = '7d';
  customExpiryDate: Date | null = null;
  generatedLink = signal<string>('');
  copied = signal(false);

  readonly minExpiryDate = new Date(Date.now() + 86400000);

  recordOptions: { label: string; desc: string; value: string; icon: string; checked: boolean }[] = [
    { label: 'All Records', desc: 'Share complete medical record', value: 'all', icon: 'pi pi-folder-open', checked: false },
    { label: 'Lab Results', desc: 'Blood work, urinalysis, cultures', value: 'labs', icon: 'pi pi-chart-line', checked: false },
    { label: 'Medications', desc: 'Active prescriptions and history', value: 'medications', icon: 'pi pi-box', checked: false },
    { label: 'Immunizations', desc: 'Vaccination records', value: 'immunizations', icon: 'pi pi-shield', checked: false },
    { label: 'Visit Notes', desc: 'Provider notes and summaries', value: 'notes', icon: 'pi pi-file', checked: false }
  ];

  durationOptions: { label: string; sub: string; icon: string; value: DurationOption }[] = [
    { label: '24 Hours', sub: 'Short access', icon: 'pi pi-bolt', value: '24h' },
    { label: '7 Days', sub: 'Standard', icon: 'pi pi-calendar', value: '7d' },
    { label: '30 Days', sub: 'Extended', icon: 'pi pi-calendar-plus', value: '30d' },
    { label: 'Custom', sub: 'Choose date', icon: 'pi pi-sliders-h', value: 'custom' }
  ];

  activeShares = signal<ActiveShare[]>([
    {
      id: 'SHR-001',
      records: ['Lab Results', 'Medications'],
      recipient: 'dr.chen@cardiology.com',
      createdAt: new Date(Date.now() - 3 * 86400000),
      expiresAt: new Date(Date.now() + 4 * 86400000),
      link: 'https://portal.gohealth.io/share/a7f3k9m2x',
      accessCount: 2
    }
  ]);

  selectedRecords = computed(() =>
    this.recordOptions.filter(o => o.checked).map(o => o.label)
  );

  expiringSoonCount = computed(() =>
    this.activeShares().filter(s => this.isExpiringSoon(s.expiresAt)).length
  );

  isSelected(value: string): boolean {
    return this.recordOptions.find(o => o.value === value)?.checked ?? false;
  }

  onRecordToggle(toggled: { value: string; checked: boolean }): void {
    if (toggled.value === 'all' && toggled.checked) {
      this.recordOptions.forEach(o => {
        if (o.value !== 'all') o.checked = false;
      });
    } else if (toggled.value !== 'all' && toggled.checked) {
      const allOpt = this.recordOptions.find(o => o.value === 'all');
      if (allOpt) allOpt.checked = false;
    }
  }

  canGenerate(): boolean {
    const hasRecords = this.recordOptions.some(o => o.checked);
    const hasDuration = this.selectedDuration !== 'custom' || !!this.customExpiryDate;
    return hasRecords && hasDuration;
  }

  generateLink(): void {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const token = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.generatedLink.set(`https://portal.gohealth.io/share/${token}`);
  }

  linkExpiry(): Date {
    const now = Date.now();
    const map: Record<DurationOption, number> = {
      '24h': 86400000,
      '7d': 7 * 86400000,
      '30d': 30 * 86400000,
      'custom': this.customExpiryDate
        ? this.customExpiryDate.getTime() - now
        : 7 * 86400000
    };
    return new Date(now + map[this.selectedDuration]);
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.generatedLink()).catch(() => {});
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  revokeShare(id: string): void {
    this.activeShares.update(shares => shares.filter(s => s.id !== id));
  }

  isExpiringSoon(date: Date): boolean {
    return date.getTime() - Date.now() < 2 * 86400000;
  }

  daysRemaining(date: Date): number {
    return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000));
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
