import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface LinkedFacility {
  id: number;
  name: string;
  type: string;
  abdmId: string;
  status: 'Connected' | 'Pending' | 'Disconnected';
  lastSync: string;
  recordCount: number;
}

interface HealthRecord {
  id: string;
  type: string;
  source: string;
  date: string;
  description: string;
  size: string;
}

@Component({
  selector: 'app-abdm-health-locker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CardModule, ButtonModule, TagModule, TableModule, DividerModule, DialogModule, InputTextModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="abdm-locker-page">
      <p-toast></p-toast>

      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-database"></i>
          </div>
          <div>
            <h1>ABDM Health Locker</h1>
            <p>Ayushman Bharat Digital Mission - Your linked health records vault</p>
          </div>
        </div>
      </header>

      <!-- Info Banner -->
      <div class="info-banner">
        <i class="pi pi-info-circle"></i>
        <div>
          <strong>About ABDM Health Locker</strong>
          <p>
            ABDM Health Locker is a secure digital vault that aggregates your health records
            from multiple hospitals, clinics, and diagnostic laboratories. All records are
            linked to your ABHA ID and accessible with your consent under the National Digital
            Health Mission (NDHM) framework.
          </p>
        </div>
      </div>

      <!-- Locker Summary -->
      <div class="summary-grid">
        <div class="summary-card">
          <i class="pi pi-building"></i>
          <span class="summary-count">{{ linkedFacilities().length }}</span>
          <span class="summary-label">Linked Facilities</span>
        </div>
        <div class="summary-card">
          <i class="pi pi-file"></i>
          <span class="summary-count">{{ healthRecords().length }}</span>
          <span class="summary-label">Total Records</span>
        </div>
        <div class="summary-card">
          <i class="pi pi-check-circle"></i>
          <span class="summary-count">{{ connectedCount() }}</span>
          <span class="summary-label">Active Connections</span>
        </div>
        <div class="summary-card">
          <i class="pi pi-calendar"></i>
          <span class="summary-count">Feb 2026</span>
          <span class="summary-label">Last Sync</span>
        </div>
      </div>

      <p-divider></p-divider>

      <!-- Connected Facilities -->
      <p-card styleClass="facilities-card">
        <ng-template pTemplate="header">
          <div class="card-header-row">
            <span class="card-title">Connected Hospitals & Labs</span>
            <button
              pButton
              label="Link New Facility"
              icon="pi pi-plus"
              class="p-button-outlined p-button-sm"
              (click)="openLinkDialog()"
            ></button>
          </div>
        </ng-template>
        <div class="facilities-list">
          @for (facility of linkedFacilities(); track facility.id) {
            <div class="facility-row">
              <div class="facility-icon">
                <i class="pi pi-building"></i>
              </div>
              <div class="facility-info">
                <div class="facility-name-row">
                  <span class="facility-name">{{ facility.name }}</span>
                  <p-tag
                    [value]="facility.status"
                    [severity]="getFacilityStatusSeverity(facility.status)"
                  ></p-tag>
                </div>
                <div class="facility-meta">
                  <span class="facility-type">{{ facility.type }}</span>
                  <span class="facility-id">ABDM ID: {{ facility.abdmId }}</span>
                </div>
                <div class="facility-sync">
                  <i class="pi pi-sync"></i>
                  <span>Last sync: {{ facility.lastSync }}</span>
                  <span class="dot-sep">·</span>
                  <span>{{ facility.recordCount }} records pulled</span>
                </div>
              </div>
              <div class="facility-actions">
                <button
                  pButton
                  label="Sync Now"
                  icon="pi pi-refresh"
                  class="p-button-outlined p-button-sm"
                  [disabled]="facility.status !== 'Connected'"
                  (click)="syncFacility(facility)"
                ></button>
              </div>
            </div>
          }
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- Records Table -->
      <p-card header="Records Pulled from Linked Facilities" styleClass="records-card">
        <p-table
          [value]="healthRecords()"
          styleClass="p-datatable-sm p-datatable-striped"
          [tableStyle]="{ 'min-width': '100%' }"
          [paginator]="true"
          [rows]="6"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>Record Type</th>
              <th>Description</th>
              <th>Source Hospital / Lab</th>
              <th>Date</th>
              <th>Size</th>
              <th style="width: 80px">Action</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-record>
            <tr>
              <td>
                <div class="record-type-cell">
                  <i [class]="'pi ' + getRecordIcon(record.type)"></i>
                  <span>{{ record.type }}</span>
                </div>
              </td>
              <td class="record-desc">{{ record.description }}</td>
              <td class="record-source">{{ record.source }}</td>
              <td class="date-cell">{{ record.date }}</td>
              <td class="size-cell">{{ record.size }}</td>
              <td>
                <button
                  pButton
                  label="View"
                  icon="pi pi-eye"
                  class="p-button-text p-button-sm"
                  (click)="viewRecord(record)"
                ></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>

      <!-- Link New Facility Dialog -->
      <p-dialog
        header="Link New Facility"
        [(visible)]="showLinkDialog"
        [modal]="true"
        [style]="{ width: '440px' }"
        [draggable]="false"
      >
        <div class="dialog-content">
          <p class="dialog-description">
            Enter the facility name and ABDM Health Facility ID to request a data-sharing
            consent with that institution.
          </p>
          <div class="form-field">
            <label for="facilityName" class="field-label">Facility Name</label>
            <input
              id="facilityName"
              pInputText
              type="text"
              placeholder="e.g. Fortis Hospital, Delhi"
              [(ngModel)]="newFacilityName"
              class="field-input"
            />
          </div>
          <div class="form-field">
            <label for="abdmId" class="field-label">ABDM Facility ID</label>
            <input
              id="abdmId"
              pInputText
              type="text"
              placeholder="e.g. IN0410000634"
              [(ngModel)]="newAbdmId"
              class="field-input"
            />
          </div>
          <div class="dialog-note">
            <i class="pi pi-info-circle"></i>
            <span>A consent request will be sent to the facility. You will be notified once linked.</span>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" icon="pi pi-times" class="p-button-text" (click)="closeLinkDialog()"></button>
          <button pButton label="Send Consent Request" icon="pi pi-send" (click)="linkFacility()"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .abdm-locker-page { max-width: 1100px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .header-content { display: flex; align-items: center; gap: 1rem; }
    .header-icon { width: 52px; height: 52px; background: var(--orange-100); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .header-icon i { font-size: 1.5rem; color: var(--orange-600); }
    .header-content h1 { margin: 0; font-size: 1.6rem; }
    .header-content p { margin: 0.2rem 0 0; color: var(--text-color-secondary); font-size: 0.9rem; }
    .info-banner { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.25rem; background: var(--orange-50); border: 1px solid var(--orange-200); border-radius: var(--border-radius); margin-bottom: 1.5rem; font-size: 0.875rem; color: var(--orange-800); }
    .info-banner i { font-size: 1.1rem; color: var(--orange-500); flex-shrink: 0; margin-top: 0.1rem; }
    .info-banner strong { display: block; margin-bottom: 0.25rem; }
    .info-banner p { margin: 0; line-height: 1.55; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 0.5rem; }
    .summary-card { display: flex; flex-direction: column; align-items: center; padding: 1.25rem 1rem; background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: var(--border-radius); text-align: center; gap: 0.3rem; }
    .summary-card i { font-size: 1.5rem; color: var(--orange-500); }
    .summary-count { font-size: 1.75rem; font-weight: 700; color: var(--text-color); }
    .summary-label { font-size: 0.8rem; color: var(--text-color-secondary); }
    .card-header-row { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--surface-border); width: 100%; }
    .card-title { font-weight: 600; font-size: 1rem; }
    .facilities-list { display: flex; flex-direction: column; gap: 0.875rem; }
    .facility-row { display: flex; align-items: center; gap: 1rem; padding: 0.875rem 1rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); }
    .facility-icon { width: 44px; height: 44px; background: var(--orange-100); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .facility-icon i { color: var(--orange-600); font-size: 1.1rem; }
    .facility-info { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
    .facility-name-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .facility-name { font-weight: 600; font-size: 0.9rem; }
    .facility-meta { display: flex; gap: 1rem; font-size: 0.8rem; color: var(--text-color-secondary); }
    .facility-sync { display: flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; color: var(--text-color-secondary); }
    .facility-sync i { font-size: 0.72rem; color: var(--green-500); }
    .dot-sep { color: var(--surface-400); }
    .facility-actions { flex-shrink: 0; }
    .record-type-cell { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; }
    .record-type-cell i { color: var(--orange-500); }
    .record-desc { font-size: 0.85rem; }
    .record-source { font-size: 0.8rem; color: var(--text-color-secondary); }
    .date-cell { font-size: 0.85rem; white-space: nowrap; }
    .size-cell { font-size: 0.8rem; color: var(--text-color-secondary); }
    .dialog-content { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0; }
    .dialog-description { margin: 0; font-size: 0.875rem; color: var(--text-color-secondary); line-height: 1.55; }
    .form-field { display: flex; flex-direction: column; gap: 0.4rem; }
    .field-label { font-size: 0.875rem; font-weight: 500; }
    .field-input { width: 100%; }
    .dialog-note { display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.75rem; background: var(--blue-50); border-radius: var(--border-radius); font-size: 0.8rem; color: var(--blue-700); }
    .dialog-note i { color: var(--blue-500); flex-shrink: 0; margin-top: 0.1rem; }
    @media (max-width: 768px) {
      .summary-grid { grid-template-columns: repeat(2, 1fr); }
      .facility-row { flex-direction: column; align-items: flex-start; }
      .facility-actions { width: 100%; }
    }
  `]
})
export class AbdmHealthLockerComponent {
  showLinkDialog = false;
  newFacilityName = '';
  newAbdmId = '';

  private readonly messageService: MessageService;

  constructor(messageService: MessageService) {
    this.messageService = messageService;
  }

  readonly linkedFacilities = signal<LinkedFacility[]>([
    {
      id: 1,
      name: 'Apollo Hospital, Mumbai',
      type: 'Multi-Specialty Hospital',
      abdmId: 'IN0410002234',
      status: 'Connected',
      lastSync: '21 Feb 2026, 09:00 AM',
      recordCount: 14
    },
    {
      id: 2,
      name: 'SRL Diagnostics',
      type: 'Diagnostic Laboratory',
      abdmId: 'IN0410005678',
      status: 'Connected',
      lastSync: '18 Feb 2026, 11:30 AM',
      recordCount: 8
    },
    {
      id: 3,
      name: 'Max Healthcare, Delhi',
      type: 'Multi-Specialty Hospital',
      abdmId: 'IN0410009012',
      status: 'Pending',
      lastSync: 'Awaiting consent',
      recordCount: 0
    }
  ]);

  readonly connectedCount = signal(2);

  readonly healthRecords = signal<HealthRecord[]>([
    { id: 'REC-001', type: 'Lab Report', source: 'SRL Diagnostics', date: '18 Feb 2026', description: 'Complete Blood Count + Lipid Profile', size: '48 KB' },
    { id: 'REC-002', type: 'Discharge Summary', source: 'Apollo Hospital, Mumbai', date: '10 Feb 2026', description: 'Discharge after knee arthroscopy procedure', size: '112 KB' },
    { id: 'REC-003', type: 'Prescription', source: 'Apollo Hospital, Mumbai', date: '10 Feb 2026', description: 'Post-operative medications - 14-day course', size: '18 KB' },
    { id: 'REC-004', type: 'Imaging Report', source: 'Apollo Hospital, Mumbai', date: '05 Feb 2026', description: 'MRI Right Knee - Pre-operative assessment', size: '2.4 MB' },
    { id: 'REC-005', type: 'Lab Report', source: 'SRL Diagnostics', date: '28 Jan 2026', description: 'HbA1c, Fasting Glucose, Thyroid Profile', size: '36 KB' },
    { id: 'REC-006', type: 'OPD Note', source: 'Apollo Hospital, Mumbai', date: '15 Jan 2026', description: 'Orthopedics consultation - Dr. Pradeep Sharma', size: '24 KB' }
  ]);

  getFacilityStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    const map: Record<string, 'success' | 'warn' | 'danger' | 'info'> = {
      Connected: 'success',
      Pending: 'warn',
      Disconnected: 'danger'
    };
    return map[status] ?? 'info';
  }

  getRecordIcon(type: string): string {
    const icons: Record<string, string> = {
      'Lab Report': 'pi-chart-bar',
      'Discharge Summary': 'pi-home',
      'Prescription': 'pi-file-edit',
      'Imaging Report': 'pi-image',
      'OPD Note': 'pi-clipboard'
    };
    return icons[type] ?? 'pi-file';
  }

  openLinkDialog(): void {
    this.newFacilityName = '';
    this.newAbdmId = '';
    this.showLinkDialog = true;
  }

  closeLinkDialog(): void {
    this.showLinkDialog = false;
  }

  linkFacility(): void {
    if (!this.newFacilityName.trim() || !this.newAbdmId.trim()) return;
    this.messageService.add({
      severity: 'success',
      summary: 'Consent Request Sent',
      detail: `A consent request has been sent to ${this.newFacilityName}. You will be notified once linked.`
    });
    this.showLinkDialog = false;
  }

  syncFacility(facility: LinkedFacility): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Sync Initiated',
      detail: `Syncing records from ${facility.name}...`
    });
  }

  viewRecord(record: HealthRecord): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Opening Record',
      detail: `Loading ${record.description}...`
    });
  }
}
