import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { BadgeModule } from 'primeng/badge';

interface DesRecord {
  id: string;
  type: string;
  typeKey: 'prescription' | 'referral' | 'medical_leave' | 'consultation' | 'lab';
  date: string;
  provider: string;
  institution: string;
  status: 'active' | 'expired' | 'used' | 'pending';
  description: string;
}

@Component({
  selector: 'app-des-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardModule, ButtonModule, TagModule, TableModule, DividerModule, BadgeModule],
  template: `
    <div class="des-page">
      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-database"></i>
          </div>
          <div>
            <h1>DES - Dosar Electronic de Sanatate</h1>
            <p>Romanian Electronic Health Record - Integrated health document management</p>
          </div>
        </div>
      </header>

      <!-- Connection Status -->
      <div class="connection-card">
        <div class="connection-status">
          <div class="status-indicator connected">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="status-info">
            <span class="status-title">Connected to DES Portal</span>
            <span class="status-detail">CNP: 1850315****123 | CID: RO-MH-2024-0081234</span>
            <span class="status-sync">Last synchronized: {{ lastSync() }}</span>
          </div>
        </div>
        <div class="connection-actions">
          <button
            pButton
            label="Sync Now"
            icon="pi pi-refresh"
            class="p-button-outlined p-button-sm"
            [disabled]="isSyncing()"
            (click)="syncNow()"
          ></button>
          <a
            pButton
            label="Open DES Portal"
            icon="pi pi-external-link"
            class="p-button-outlined p-button-sm p-button-secondary"
            href="https://des.cnas.ro"
            target="_blank"
            rel="noopener noreferrer"
          ></a>
        </div>
      </div>

      @if (isSyncing()) {
        <div class="sync-banner">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Synchronizing records from DES portal...</span>
        </div>
      }

      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card">
          <i class="pi pi-file-edit"></i>
          <span class="summary-count">{{ prescriptionCount() }}</span>
          <span class="summary-label">Prescriptions</span>
        </div>
        <div class="summary-card">
          <i class="pi pi-send"></i>
          <span class="summary-count">{{ referralCount() }}</span>
          <span class="summary-label">Referrals</span>
        </div>
        <div class="summary-card">
          <i class="pi pi-briefcase"></i>
          <span class="summary-count">{{ leaveCount() }}</span>
          <span class="summary-label">Medical Leave</span>
        </div>
        <div class="summary-card">
          <i class="pi pi-clipboard"></i>
          <span class="summary-count">{{ consultationCount() }}</span>
          <span class="summary-label">Consultations</span>
        </div>
      </div>

      <p-divider></p-divider>

      <!-- DES Records Table -->
      <p-card header="DES Records" styleClass="records-card">
        <p-table
          [value]="desRecords()"
          styleClass="p-datatable-sm p-datatable-striped"
          [tableStyle]="{ 'min-width': '100%' }"
          [paginator]="true"
          [rows]="8"
        >
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 80px">Type</th>
              <th>Description</th>
              <th>Date</th>
              <th>Provider</th>
              <th>Institution</th>
              <th style="width: 90px">Status</th>
              <th style="width: 80px">Action</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-record>
            <tr>
              <td>
                <div class="type-cell">
                  <i [class]="'pi ' + getTypeIcon(record.typeKey)"></i>
                  <span class="type-label">{{ record.type }}</span>
                </div>
              </td>
              <td>
                <span class="record-description">{{ record.description }}</span>
              </td>
              <td class="date-cell">{{ record.date }}</td>
              <td>{{ record.provider }}</td>
              <td class="institution-cell">{{ record.institution }}</td>
              <td>
                <p-tag
                  [value]="getStatusLabel(record.status)"
                  [severity]="getStatusSeverity(record.status)"
                ></p-tag>
              </td>
              <td>
                <button
                  pButton
                  icon="pi pi-eye"
                  class="p-button-text p-button-sm"
                  pTooltip="View document"
                ></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>

      <p-divider></p-divider>

      <!-- Info Banner -->
      <div class="info-banner">
        <i class="pi pi-info-circle"></i>
        <div>
          <strong>About DES (Dosarul Electronic de Sanatate)</strong>
          <p>
            DES is Romania's national electronic health record system, managed by CNAS (Casa
            Nationala de Asigurari de Sanatate). It centralizes your prescriptions, referrals,
            medical leave certificates, and consultation records. Access is available to
            authorized healthcare providers and to you as the patient.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .des-page { max-width: 1100px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .header-content { display: flex; align-items: center; gap: 1rem; }
    .header-icon { width: 52px; height: 52px; background: var(--blue-100); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .header-icon i { font-size: 1.5rem; color: var(--blue-600); }
    .header-content h1 { margin: 0; font-size: 1.6rem; }
    .header-content p { margin: 0.2rem 0 0; color: var(--text-color-secondary); font-size: 0.9rem; }
    .connection-card { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; background: var(--green-50); border: 1px solid var(--green-200); border-radius: var(--border-radius); margin-bottom: 1.25rem; }
    .connection-status { display: flex; align-items: center; gap: 0.875rem; }
    .status-indicator { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .status-indicator.connected { background: var(--green-100); color: var(--green-600); }
    .status-indicator i { font-size: 1.25rem; }
    .status-info { display: flex; flex-direction: column; gap: 0.2rem; }
    .status-title { font-weight: 600; color: var(--green-700); font-size: 0.95rem; }
    .status-detail { font-size: 0.8rem; color: var(--text-color-secondary); }
    .status-sync { font-size: 0.8rem; color: var(--text-color-secondary); }
    .connection-actions { display: flex; gap: 0.5rem; }
    .sync-banner { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: var(--blue-50); border: 1px solid var(--blue-200); border-radius: var(--border-radius); margin-bottom: 1rem; font-size: 0.875rem; color: var(--blue-700); }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 0.5rem; }
    .summary-card { display: flex; flex-direction: column; align-items: center; padding: 1.25rem 1rem; background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: var(--border-radius); text-align: center; gap: 0.3rem; }
    .summary-card i { font-size: 1.5rem; color: var(--primary-400); }
    .summary-count { font-size: 1.75rem; font-weight: 700; color: var(--text-color); }
    .summary-label { font-size: 0.8rem; color: var(--text-color-secondary); }
    .type-cell { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; }
    .type-cell i { font-size: 1rem; color: var(--primary-400); }
    .type-label { font-size: 0.65rem; color: var(--text-color-secondary); text-align: center; }
    .record-description { font-size: 0.85rem; }
    .date-cell { font-size: 0.85rem; white-space: nowrap; }
    .institution-cell { font-size: 0.8rem; color: var(--text-color-secondary); }
    .info-banner { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.25rem; background: var(--blue-50); border: 1px solid var(--blue-200); border-radius: var(--border-radius); font-size: 0.875rem; color: var(--blue-800); }
    .info-banner i { font-size: 1.1rem; color: var(--blue-500); flex-shrink: 0; margin-top: 0.1rem; }
    .info-banner strong { display: block; margin-bottom: 0.25rem; }
    .info-banner p { margin: 0; line-height: 1.55; }
    @media (max-width: 768px) {
      .connection-card { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
      .summary-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class DesViewerComponent {
  readonly lastSync = signal('21 Feb 2026, 09:14 AM');
  readonly isSyncing = signal(false);

  readonly desRecords = signal<DesRecord[]>([
    { id: 'RX-2026-001', type: 'Prescription', typeKey: 'prescription', date: '18 Feb 2026', provider: 'Dr. Ionescu', institution: 'Spitalul Judetean Cluj', status: 'active', description: 'Metformin 500mg, Lisinopril 10mg' },
    { id: 'RX-2026-002', type: 'Prescription', typeKey: 'prescription', date: '05 Jan 2026', provider: 'Dr. Popa', institution: 'Cabinet Medical Dr. Popa', status: 'used', description: 'Amoxicilina 500mg - 14 zile' },
    { id: 'REF-2026-001', type: 'Referral', typeKey: 'referral', date: '10 Feb 2026', provider: 'Dr. Ionescu', institution: 'Spitalul Judetean Cluj', status: 'pending', description: 'Trimitere cardiologie - Consult periodic' },
    { id: 'REF-2025-003', type: 'Referral', typeKey: 'referral', date: '14 Nov 2025', provider: 'Dr. Dumitrescu', institution: 'CMI Dr. Dumitrescu', status: 'used', description: 'Trimitere endocrinologie' },
    { id: 'ML-2026-001', type: 'Medical Leave', typeKey: 'medical_leave', date: '12 Jan 2026', provider: 'Dr. Popa', institution: 'Cabinet Medical Dr. Popa', status: 'expired', description: 'Concediu medical 5 zile - Infectie respiratorie acuta' },
    { id: 'CON-2026-001', type: 'Consultation', typeKey: 'consultation', date: '18 Feb 2026', provider: 'Dr. Ionescu', institution: 'Spitalul Judetean Cluj', status: 'active', description: 'Consultatie medicina interna - Control periodic DZ tip 2' },
    { id: 'CON-2025-008', type: 'Consultation', typeKey: 'consultation', date: '28 Oct 2025', provider: 'Dr. Vlad', institution: 'Clinica Polisano', status: 'active', description: 'Consultatie cardiologie - EKG normal' },
    { id: 'LAB-2026-001', type: 'Lab Results', typeKey: 'lab', date: '15 Feb 2026', provider: 'Lab Synevo Cluj', institution: 'Synevo Romania', status: 'active', description: 'Hemoleucograma completa, glicemie, creatinina' },
  ]);

  readonly prescriptionCount = signal(2);
  readonly referralCount = signal(2);
  readonly leaveCount = signal(1);
  readonly consultationCount = signal(3);

  getTypeIcon(typeKey: string): string {
    const icons: Record<string, string> = {
      prescription: 'pi-file-edit',
      referral: 'pi-send',
      medical_leave: 'pi-briefcase',
      consultation: 'pi-clipboard',
      lab: 'pi-chart-bar'
    };
    return icons[typeKey] ?? 'pi-file';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Active',
      expired: 'Expired',
      used: 'Used',
      pending: 'Pending'
    };
    return labels[status] ?? status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
      active: 'success',
      expired: 'danger',
      used: 'info',
      pending: 'warn'
    };
    return severities[status] ?? 'info';
  }

  syncNow(): void {
    this.isSyncing.set(true);
    setTimeout(() => {
      this.isSyncing.set(false);
      this.lastSync.set('21 Feb 2026, ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' AM');
    }, 2500);
  }
}
