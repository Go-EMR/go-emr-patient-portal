import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';

interface DataRecord {
  type: string;
  count: number;
  size: string;
}

interface DeletionReason {
  label: string;
  value: string;
}

@Component({
  selector: 'app-data-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, TagModule, DialogModule, TableModule, DropdownModule, DividerModule, ProgressBarModule],
  template: `
    <div class="data-mgmt-page">
      <header class="page-header">
        <h1>Data Management</h1>
        <p>View, export, and manage your health data</p>
      </header>

      <!-- Data Summary -->
      <p-card header="Your Health Data Summary" styleClass="summary-card">
        <p class="card-description">
          An overview of the health records stored in your portal account.
        </p>
        <p-table [value]="dataRecords()" styleClass="p-datatable-sm p-datatable-striped" [tableStyle]="{ 'min-width': '100%' }">
          <ng-template pTemplate="header">
            <tr>
              <th>Record Type</th>
              <th class="text-right">Count</th>
              <th class="text-right">Size</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-record>
            <tr>
              <td>
                <span class="record-type-cell">
                  <i class="pi pi-file record-icon"></i>
                  {{ record.type }}
                </span>
              </td>
              <td class="text-right">
                <strong>{{ record.count }}</strong>
              </td>
              <td class="text-right text-secondary">{{ record.size }}</td>
            </tr>
          </ng-template>
          <ng-template pTemplate="footer">
            <tr>
              <td><strong>Total</strong></td>
              <td class="text-right"><strong>{{ totalCount() }}</strong></td>
              <td class="text-right"><strong>{{ totalSize }}</strong></td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>

      <p-divider></p-divider>

      <!-- FHIR Export -->
      <p-card styleClass="export-card">
        <ng-template pTemplate="header">
          <div class="card-header-content">
            <div class="card-header-text">
              <h3>Export Health Records (FHIR R4)</h3>
              <p-tag value="FHIR R4" severity="info"></p-tag>
            </div>
          </div>
        </ng-template>
        <p class="card-description">
          Download a complete, portable copy of your health records in FHIR R4 format.
          This file is compatible with most electronic health record systems and personal health applications.
          Exports include clinical notes, lab results, medications, allergies, immunizations, and more.
        </p>
        <div class="export-features">
          <span><i class="pi pi-check-circle"></i> FHIR R4 JSON bundle</span>
          <span><i class="pi pi-check-circle"></i> End-to-end encrypted download</span>
          <span><i class="pi pi-check-circle"></i> Includes all record types</span>
          <span><i class="pi pi-check-circle"></i> Valid for 24 hours after generation</span>
        </div>

        @if (exportProgress() > 0) {
          <div class="export-progress">
            <div class="progress-label">
              @if (exportProgress() < 100) {
                <span>Preparing your export... {{ exportProgress() }}%</span>
              } @else {
                <span class="export-done"><i class="pi pi-check-circle"></i> Export ready for download</span>
              }
            </div>
            <p-progressBar [value]="exportProgress()" [showValue]="false" styleClass="export-progress-bar"></p-progressBar>
          </div>
        }

        <div class="card-actions">
          @if (exportProgress() === 100) {
            <button
              pButton
              label="Download Export"
              icon="pi pi-download"
              class="p-button-success"
            ></button>
            <button
              pButton
              label="Request New Export"
              icon="pi pi-refresh"
              class="p-button-outlined"
              (click)="startExport()"
            ></button>
          } @else {
            <button
              pButton
              label="Request Export"
              icon="pi pi-upload"
              [disabled]="exportProgress() > 0 && exportProgress() < 100"
              (click)="startExport()"
            ></button>
          }
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- Account Deletion -->
      <p-card styleClass="deletion-card">
        <ng-template pTemplate="header">
          <div class="card-header-content danger-header">
            <div class="card-header-text">
              <h3>Request Account Deletion</h3>
              <p-tag value="Irreversible" severity="danger"></p-tag>
            </div>
          </div>
        </ng-template>
        <div class="danger-banner">
          <i class="pi pi-exclamation-triangle"></i>
          <div>
            <strong>Warning:</strong> Account deletion is a permanent action and cannot be undone.
            All portal access will be revoked immediately. Your underlying medical records are retained
            by your healthcare provider as required by law and are not deleted through this request.
          </div>
        </div>
        <div class="deletion-form">
          <div class="field">
            <label for="deletion-reason">Reason for deletion request</label>
            <p-dropdown
              inputId="deletion-reason"
              [options]="deletionReasons"
              [(ngModel)]="selectedDeletionReason"
              placeholder="Select a reason"
              [style]="{ width: '100%', maxWidth: '400px' }"
            ></p-dropdown>
          </div>
        </div>
        <div class="card-actions">
          <button
            pButton
            label="Request Account Deletion"
            icon="pi pi-trash"
            class="p-button-danger p-button-outlined"
            [disabled]="!selectedDeletionReason"
            (click)="showDeletionDialog.set(true)"
          ></button>
        </div>
      </p-card>

      <!-- Compliance Notes -->
      <div class="compliance-grid">
        <div class="compliance-item">
          <i class="pi pi-shield"></i>
          <div>
            <strong>GDPR Compliance</strong>
            <p>You have the right to access, correct, delete, and port your personal data under the General Data Protection Regulation (EU) 2016/679.</p>
          </div>
        </div>
        <div class="compliance-item">
          <i class="pi pi-shield"></i>
          <div>
            <strong>CCPA Compliance</strong>
            <p>California residents have the right to know what personal information is collected, request deletion, and opt out of the sale of personal information.</p>
          </div>
        </div>
      </div>

      <!-- Deletion Confirmation Dialog -->
      <p-dialog
        header="Confirm Account Deletion Request"
        [(visible)]="showDeletionDialog"
        [modal]="true"
        [style]="{ width: '500px' }"
        [draggable]="false"
        [resizable]="false"
      >
        <div class="deletion-dialog-body">
          <div class="dialog-warning-icon">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <h3>Are you absolutely sure?</h3>
          <p>
            You are about to submit a request to permanently delete your GoHealth patient portal account.
            This action <strong>cannot be undone</strong>.
          </p>
          <ul class="deletion-consequences">
            <li>Your portal account and login credentials will be permanently removed</li>
            <li>You will lose access to your portal message history and e-documents</li>
            <li>Scheduled appointment reminders will be cancelled</li>
            <li>Your clinical records will be retained by your provider as required by HIPAA and applicable state law</li>
            <li>You may request paper records from your provider after deletion</li>
          </ul>
          <p class="deletion-reason-summary">
            <strong>Stated reason:</strong> {{ selectedDeletionReasonLabel() }}
          </p>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="showDeletionDialog.set(false)"></button>
          <button
            pButton
            label="Yes, Delete My Account"
            icon="pi pi-trash"
            class="p-button-danger"
            (click)="showDeletionDialog.set(false)"
          ></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .data-mgmt-page { max-width: 900px; margin: 0 auto; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { margin: 0; }
    .page-header p { color: var(--text-color-secondary); margin: 0.25rem 0 0; }
    .card-description { color: var(--text-color-secondary); margin: 0 0 1.25rem; font-size: 0.9rem; line-height: 1.6; }
    .record-type-cell { display: flex; align-items: center; gap: 0.5rem; }
    .record-icon { color: var(--primary-400); font-size: 0.875rem; }
    .text-right { text-align: right; }
    .text-secondary { color: var(--text-color-secondary); }
    .card-header-content { padding: 1rem 1rem 0; }
    .card-header-text { display: flex; align-items: center; gap: 0.75rem; }
    .card-header-text h3 { margin: 0; font-size: 1.05rem; }
    .danger-header h3 { color: var(--red-600); }
    .export-features { display: flex; flex-wrap: wrap; gap: 0.75rem 1.5rem; margin-bottom: 1.25rem; }
    .export-features span { display: flex; align-items: center; gap: 0.4rem; font-size: 0.875rem; color: var(--green-700); }
    .export-features i { font-size: 0.875rem; }
    .export-progress { margin: 1rem 0; }
    .progress-label { font-size: 0.875rem; margin-bottom: 0.5rem; color: var(--text-color-secondary); }
    .export-done { color: var(--green-600); display: flex; align-items: center; gap: 0.4rem; }
    .export-done i { font-size: 0.875rem; }
    .export-progress-bar { height: 8px; }
    .card-actions { margin-top: 1.25rem; display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .danger-banner { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.25rem; background: var(--red-50); border: 1px solid var(--red-200); border-radius: var(--border-radius); margin-bottom: 1.25rem; color: var(--red-800); font-size: 0.875rem; line-height: 1.5; }
    .danger-banner i { color: var(--red-500); font-size: 1.1rem; flex-shrink: 0; margin-top: 0.1rem; }
    .deletion-form { margin-bottom: 0.5rem; }
    .field { display: flex; flex-direction: column; gap: 0.5rem; }
    .field label { font-weight: 500; font-size: 0.9rem; }
    .compliance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem; }
    .compliance-item { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.25rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); font-size: 0.85rem; }
    .compliance-item i { color: var(--primary-500); font-size: 1rem; flex-shrink: 0; margin-top: 0.15rem; }
    .compliance-item strong { display: block; margin-bottom: 0.3rem; }
    .compliance-item p { margin: 0; color: var(--text-color-secondary); line-height: 1.5; }
    .deletion-dialog-body { text-align: center; padding: 0.5rem 0 1rem; }
    .dialog-warning-icon { font-size: 3rem; color: var(--red-500); margin-bottom: 1rem; }
    .dialog-warning-icon i { font-size: 3rem; }
    .deletion-dialog-body h3 { margin: 0 0 1rem; }
    .deletion-dialog-body p { color: var(--text-color-secondary); margin: 0 0 1rem; line-height: 1.5; text-align: left; }
    .deletion-consequences { text-align: left; margin: 0 0 1rem; padding-left: 1.5rem; color: var(--text-color-secondary); line-height: 1.8; font-size: 0.875rem; }
    .deletion-reason-summary { background: var(--surface-ground); border-radius: var(--border-radius); padding: 0.75rem 1rem; font-size: 0.875rem; }
    @media (max-width: 640px) {
      .compliance-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DataManagementComponent {
  showDeletionDialog = signal(false);
  exportProgress = signal(0);
  selectedDeletionReason: string | null = null;

  readonly dataRecords = signal<DataRecord[]>([
    { type: 'Medical Records', count: 47, size: '2.3 MB' },
    { type: 'Lab Results', count: 23, size: '1.1 MB' },
    { type: 'Imaging', count: 5, size: '15.2 MB' },
    { type: 'Messages', count: 128, size: '0.8 MB' },
    { type: 'Documents', count: 12, size: '4.5 MB' }
  ]);

  readonly deletionReasons: DeletionReason[] = [
    { label: 'No longer need the portal', value: 'no_longer_need' },
    { label: 'Switching providers', value: 'switching_providers' },
    { label: 'Privacy concerns', value: 'privacy_concerns' },
    { label: 'Other', value: 'other' }
  ];

  readonly totalSize = '23.9 MB';

  totalCount(): number {
    return this.dataRecords().reduce((sum, r) => sum + r.count, 0);
  }

  selectedDeletionReasonLabel(): string {
    return this.deletionReasons.find(r => r.value === this.selectedDeletionReason)?.label ?? '';
  }

  startExport(): void {
    this.exportProgress.set(0);
    const steps = [10, 25, 40, 60, 75, 88, 95, 100];
    let i = 0;
    const advance = (): void => {
      if (i < steps.length) {
        this.exportProgress.set(steps[i]);
        i++;
        setTimeout(advance, 350);
      }
    };
    setTimeout(advance, 200);
  }
}
