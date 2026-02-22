// =============================================================================
// Completeness Tracker Component — Task 17
// Sidebar widget showing family history completeness progress
// =============================================================================

import {
  Component,
  Input,
  inject,
  computed,
  signal,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';

import { FamilyMember } from '../data-access/family.models';
import {
  calculateCompleteness,
  CompletenessResult,
  CompletenessStatus,
} from '../utils/completeness.util';

@Component({
  selector: 'app-completeness-tracker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ProgressBarModule,
    ButtonModule,
    DialogModule,
    DividerModule,
  ],
  template: `
    <div class="completeness-widget">
      <div class="widget-header">
        <i class="pi pi-chart-bar widget-icon"></i>
        <span class="widget-title">History Completeness</span>
      </div>

      <!-- Progress Bar -->
      <div class="progress-section">
        <div class="progress-label-row">
          <span class="progress-pct">{{ result().percentage }}%</span>
          <span class="progress-caption">
            {{ result().totalComplete }} complete,
            {{ result().totalPartial }} partial,
            {{ result().totalMissing }} missing
          </span>
        </div>
        <p-progressBar
          [value]="result().percentage"
          [showValue]="false"
          styleClass="completeness-bar"
        ></p-progressBar>
      </div>

      <p-divider></p-divider>

      <!-- Checklist -->
      <div class="checklist">
        @for (item of result().items; track item.label) {
          <div class="checklist-item" (click)="handleItemClick(item)">
            <div class="item-icon-wrap">
              @if (item.status === 'complete') {
                <span class="status-icon complete-icon" title="Complete">
                  <i class="pi pi-check-circle"></i>
                </span>
              } @else if (item.status === 'partial') {
                <span class="status-icon partial-icon" title="Exists but no conditions entered">
                  <i class="pi pi-circle"></i>
                </span>
              } @else {
                <span class="status-icon missing-icon" title="Missing — click to add">
                  <i class="pi pi-times-circle"></i>
                </span>
              }
            </div>
            <div class="item-info">
              <span class="item-label">{{ item.label }}</span>
              @if (item.memberName) {
                <span class="item-member">{{ item.memberName }}</span>
              } @else {
                <span class="item-action">Click to add</span>
              }
            </div>
            @if (item.status !== 'complete') {
              <i class="pi pi-chevron-right item-arrow"></i>
            }
          </div>
        }
      </div>

      <p-divider></p-divider>

      <!-- Action Buttons -->
      <div class="widget-actions">
        <p-button
          label="Generate Report"
          icon="pi pi-print"
          severity="secondary"
          [outlined]="true"
          styleClass="action-btn"
          (onClick)="generateReport()"
        ></p-button>
        <p-button
          label="Share with Doctor"
          icon="pi pi-share-alt"
          styleClass="action-btn"
          (onClick)="showShareDialog = true"
        ></p-button>
      </div>
    </div>

    <!-- Share Dialog -->
    <p-dialog
      header="Share with Doctor"
      [(visible)]="showShareDialog"
      [modal]="true"
      [style]="{ width: '420px' }"
      [closable]="true"
    >
      <div class="share-dialog-body">
        <p class="share-intro">
          Share your family health history with your care team using this secure link.
          The link expires in 48 hours.
        </p>
        <div class="share-link-box">
          <code class="share-link">{{ mockShareLink }}</code>
          <p-button
            icon="pi pi-copy"
            severity="secondary"
            [outlined]="true"
            title="Copy link"
            (onClick)="copyShareLink()"
          ></p-button>
        </div>
        @if (linkCopied()) {
          <p class="copy-confirm">
            <i class="pi pi-check-circle"></i> Link copied to clipboard
          </p>
        }
        <p class="share-note">
          <i class="pi pi-shield"></i>
          This link is encrypted and HIPAA-compliant. Recipients can view but not edit your data.
        </p>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="Close" severity="secondary" [outlined]="true" (onClick)="showShareDialog = false"></p-button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .completeness-widget {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1rem;
    }

    .widget-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.875rem;
    }

    .widget-icon {
      color: var(--primary-color);
      font-size: 1rem;
    }

    .widget-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .progress-section {
      margin-bottom: 0.25rem;
    }

    .progress-label-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .progress-pct {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--primary-color);
    }

    .progress-caption {
      font-size: 0.7rem;
      color: var(--text-color-secondary);
    }

    :host ::ng-deep .completeness-bar .p-progressbar-value {
      background: linear-gradient(90deg, var(--primary-400), var(--primary-600));
    }

    /* Checklist */
    .checklist {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .checklist-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.5rem 0.25rem;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .checklist-item:hover {
      background: var(--surface-hover);
    }

    .item-icon-wrap {
      flex-shrink: 0;
      width: 22px;
      text-align: center;
    }

    .status-icon {
      font-size: 1rem;
    }

    .complete-icon { color: var(--green-500); }
    .partial-icon  { color: var(--yellow-500); }
    .missing-icon  { color: var(--red-500); }

    .item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }

    .item-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .item-member {
      font-size: 0.72rem;
      color: var(--text-color-secondary);
    }

    .item-action {
      font-size: 0.72rem;
      color: var(--primary-color);
      font-weight: 500;
    }

    .item-arrow {
      font-size: 0.7rem;
      color: var(--text-color-secondary);
      flex-shrink: 0;
    }

    /* Action Buttons */
    .widget-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    :host ::ng-deep .action-btn {
      width: 100%;
      justify-content: center;
    }

    /* Share dialog */
    .share-dialog-body {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .share-intro {
      font-size: 0.85rem;
      color: var(--text-color-secondary);
      margin: 0;
      line-height: 1.5;
    }

    .share-link-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--surface-ground);
      border: 1px solid var(--surface-border);
      border-radius: 6px;
      padding: 0.625rem 0.75rem;
    }

    .share-link {
      flex: 1;
      font-family: monospace;
      font-size: 0.78rem;
      color: var(--text-color);
      word-break: break-all;
    }

    .copy-confirm {
      font-size: 0.8rem;
      color: var(--green-600);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .share-note {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      margin: 0;
      display: flex;
      align-items: flex-start;
      gap: 0.375rem;
      line-height: 1.5;
    }

    .share-note i {
      color: var(--blue-500);
      flex-shrink: 0;
      margin-top: 1px;
    }
  `],
})
export class CompletenessTrackerComponent implements OnChanges {
  @Input() members: FamilyMember[] = [];

  private readonly router = inject(Router);

  private readonly _result = signal<CompletenessResult>({
    percentage: 0,
    items: [],
    totalExpected: 7,
    totalComplete: 0,
    totalPartial: 0,
    totalMissing: 7,
  });

  readonly result = this._result.asReadonly();

  showShareDialog = false;
  private readonly _linkCopied = signal(false);
  readonly linkCopied = this._linkCopied.asReadonly();

  readonly mockShareLink = `https://portal.gohealth.io/share/fam/${this._generateToken()}`;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['members']) {
      this._result.set(calculateCompleteness(this.members));
    }
  }

  handleItemClick(item: { status: CompletenessStatus; label: string; relationship: string }): void {
    if (item.status === 'complete') return;
    this.router.navigate(['/health/family-history']);
  }

  generateReport(): void {
    const result = this._result();
    const rows = result.items
      .map(item => {
        const icon = item.status === 'complete' ? '✓' : item.status === 'partial' ? '○' : '✗';
        const name = item.memberName ?? 'Not entered';
        return `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${icon}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600">${item.label}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-transform:capitalize">${item.status}</td>
        </tr>`;
      })
      .join('');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Family History Completeness Report</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; color: #111; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .subtitle { color: #6b7280; font-size: 0.875rem; margin-bottom: 1.5rem; }
    .summary { display: flex; gap: 2rem; margin-bottom: 1.5rem; }
    .stat { text-align: center; }
    .stat-val { font-size: 2rem; font-weight: 800; color: #6366f1; }
    .stat-lbl { font-size: 0.75rem; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 8px 12px; background: #f9fafb; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
    td { font-size: 0.875rem; }
    .footer { margin-top: 2rem; font-size: 0.75rem; color: #9ca3af; }
  </style>
</head>
<body>
  <h1>Family History Completeness Report</h1>
  <p class="subtitle">Generated ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })} — GoHealth Patient Portal</p>
  <div class="summary">
    <div class="stat"><div class="stat-val">${result.percentage}%</div><div class="stat-lbl">Complete</div></div>
    <div class="stat"><div class="stat-val">${result.totalComplete}</div><div class="stat-lbl">Full Records</div></div>
    <div class="stat"><div class="stat-val">${result.totalPartial}</div><div class="stat-lbl">Partial</div></div>
    <div class="stat"><div class="stat-val">${result.totalMissing}</div><div class="stat-lbl">Missing</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th></th>
        <th>Relative</th>
        <th>Name on Record</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    This report is for informational purposes only and does not constitute medical advice.
    Please discuss your family health history with your healthcare provider.
  </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  }

  copyShareLink(): void {
    navigator.clipboard.writeText(this.mockShareLink).catch(() => {});
    this._linkCopied.set(true);
    setTimeout(() => this._linkCopied.set(false), 3000);
  }

  private _generateToken(): string {
    return Math.random().toString(36).slice(2, 10).toUpperCase() +
      Math.random().toString(36).slice(2, 6).toUpperCase();
  }
}
