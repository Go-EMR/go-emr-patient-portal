import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { ToggleButtonModule } from 'primeng/togglebutton';

interface HealthDocument {
  id: string;
  type: string;
  title: string;
  date: string;
  provider: string;
  facility: string;
  size: string;
  isShared: boolean;
}

interface AccessHistoryItem {
  date: string;
  accessor: string;
  accessorType: string;
  reason: string;
  location: string;
}

@Component({
  selector: 'app-my-health-record',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CardModule, ButtonModule, TagModule, TableModule, DividerModule, ToggleButtonModule],
  template: `
    <div class="mhr-page">
      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-heart-fill"></i>
          </div>
          <div>
            <h1>My Health Record</h1>
            <p>Australian Government My Health Record - Your national digital health record</p>
          </div>
        </div>
      </header>

      <!-- Connection Status Card -->
      <div class="connection-banner">
        <div class="connection-left">
          <div class="connection-indicator">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="connection-info">
            <span class="connection-title">Connected to My Health Record</span>
            <div class="ihi-row">
              <span class="ihi-label">IHI (Individual Healthcare Identifier):</span>
              <span class="ihi-value">8003 6080 0000 0001</span>
            </div>
            <span class="connection-provider">Medicare: 2123 45670 1 | DVA: N/A</span>
          </div>
        </div>
        <div class="connection-right">
          <p-tag value="Connected" severity="success" icon="pi pi-wifi"></p-tag>
        </div>
      </div>

      <!-- Privacy Controls -->
      <p-card header="Privacy and Access Controls" styleClass="privacy-card">
        <div class="privacy-controls">
          <div class="privacy-item">
            <div class="privacy-label-group">
              <i class="pi pi-lock"></i>
              <div>
                <span class="privacy-title">Access Setting</span>
                <span class="privacy-desc">Control who can see your record (Open / Limited Access)</span>
              </div>
            </div>
            <p-toggleButton
              [(ngModel)]="openAccess"
              onLabel="Open Access"
              offLabel="Limited Access"
              onIcon="pi pi-unlock"
              offIcon="pi pi-lock"
            ></p-toggleButton>
          </div>
          <div class="privacy-item">
            <div class="privacy-label-group">
              <i class="pi pi-exclamation-triangle"></i>
              <div>
                <span class="privacy-title">Emergency Access</span>
                <span class="privacy-desc">Allow clinicians to access your record in an emergency</span>
              </div>
            </div>
            <p-toggleButton
              [(ngModel)]="emergencyAccess"
              onLabel="Enabled"
              offLabel="Disabled"
              onIcon="pi pi-check"
              offIcon="pi pi-times"
            ></p-toggleButton>
          </div>
        </div>
        <div class="privacy-actions">
          <button pButton label="Manage Privacy Settings" icon="pi pi-cog" class="p-button-outlined p-button-sm"></button>
          <button pButton label="View Advance Care Plan" icon="pi pi-file" class="p-button-outlined p-button-sm p-button-secondary"></button>
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- Shared Health Documents -->
      <p-card header="Shared Health Documents" styleClass="documents-card">
        <p-table
          [value]="healthDocuments()"
          styleClass="p-datatable-sm p-datatable-striped"
          [tableStyle]="{ 'min-width': '100%' }"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>Document Type</th>
              <th>Title</th>
              <th>Date</th>
              <th>Provider / Facility</th>
              <th>Size</th>
              <th>Shared</th>
              <th style="width: 80px">View</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-doc>
            <tr>
              <td>
                <div class="doc-type-cell">
                  <i [class]="'pi ' + getDocIcon(doc.type)"></i>
                  <span>{{ doc.type }}</span>
                </div>
              </td>
              <td class="doc-title">{{ doc.title }}</td>
              <td class="date-cell">{{ doc.date }}</td>
              <td>
                <div class="provider-cell">
                  <span class="provider-name">{{ doc.provider }}</span>
                  <span class="facility-name">{{ doc.facility }}</span>
                </div>
              </td>
              <td class="size-cell">{{ doc.size }}</td>
              <td>
                <p-tag
                  [value]="doc.isShared ? 'Shared' : 'Private'"
                  [severity]="doc.isShared ? 'success' : 'info'"
                ></p-tag>
              </td>
              <td>
                <button pButton icon="pi pi-eye" class="p-button-text p-button-sm"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
        <div class="doc-actions">
          <button pButton label="Download All Documents" icon="pi pi-download" class="p-button-outlined"></button>
          <button pButton label="Upload Document" icon="pi pi-upload" class="p-button-outlined p-button-secondary"></button>
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- Access History -->
      <p-card header="Access History" styleClass="access-card">
        <p class="card-description">Healthcare providers and services that have accessed your My Health Record.</p>
        <p-table
          [value]="accessHistory()"
          styleClass="p-datatable-sm"
          [tableStyle]="{ 'min-width': '100%' }"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>Date &amp; Time</th>
              <th>Accessor</th>
              <th>Type</th>
              <th>Reason</th>
              <th>Location</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr>
              <td class="date-cell">{{ item.date }}</td>
              <td>{{ item.accessor }}</td>
              <td>
                <p-tag [value]="item.accessorType" severity="info"></p-tag>
              </td>
              <td class="reason-cell">{{ item.reason }}</td>
              <td>{{ item.location }}</td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>

      <p-divider></p-divider>

      <!-- Info Banner -->
      <div class="info-banner">
        <i class="pi pi-info-circle"></i>
        <div>
          <strong>About My Health Record</strong>
          <p>
            My Health Record is Australia's national digital health record system, operated by
            the Australian Digital Health Agency (ADHA). It gives you and your healthcare providers
            secure access to your health information, including summaries, prescriptions, Medicare
            and PBS records, immunisation history, and more. You are always in control of what
            goes in and who can see it.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mhr-page { max-width: 1100px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .header-content { display: flex; align-items: center; gap: 1rem; }
    .header-icon { width: 52px; height: 52px; background: var(--blue-100); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .header-icon i { font-size: 1.5rem; color: var(--blue-600); }
    .header-content h1 { margin: 0; font-size: 1.6rem; }
    .header-content p { margin: 0.2rem 0 0; color: var(--text-color-secondary); font-size: 0.9rem; }
    .connection-banner { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; background: var(--green-50); border: 1px solid var(--green-200); border-radius: var(--border-radius); margin-bottom: 1.5rem; }
    .connection-left { display: flex; align-items: center; gap: 0.875rem; }
    .connection-indicator { width: 44px; height: 44px; background: var(--green-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .connection-indicator i { font-size: 1.3rem; color: var(--green-600); }
    .connection-info { display: flex; flex-direction: column; gap: 0.2rem; }
    .connection-title { font-weight: 600; color: var(--green-700); font-size: 0.95rem; }
    .ihi-row { display: flex; align-items: center; gap: 0.5rem; }
    .ihi-label { font-size: 0.8rem; color: var(--text-color-secondary); }
    .ihi-value { font-size: 0.875rem; font-weight: 600; font-family: monospace; color: var(--text-color); }
    .connection-provider { font-size: 0.8rem; color: var(--text-color-secondary); }
    .privacy-controls { display: flex; flex-direction: column; gap: 0.875rem; margin-bottom: 1rem; }
    .privacy-item { display: flex; justify-content: space-between; align-items: center; padding: 0.875rem 1rem; background: var(--surface-ground); border-radius: var(--border-radius); border: 1px solid var(--surface-border); }
    .privacy-label-group { display: flex; align-items: center; gap: 0.75rem; }
    .privacy-label-group i { font-size: 1.1rem; color: var(--primary-400); }
    .privacy-title { display: block; font-weight: 500; font-size: 0.9rem; }
    .privacy-desc { display: block; font-size: 0.8rem; color: var(--text-color-secondary); }
    .privacy-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 0.5rem; }
    .doc-type-cell { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; }
    .doc-type-cell i { color: var(--primary-400); }
    .doc-title { font-size: 0.85rem; font-weight: 500; }
    .date-cell { font-size: 0.85rem; white-space: nowrap; }
    .provider-cell { display: flex; flex-direction: column; }
    .provider-name { font-size: 0.85rem; }
    .facility-name { font-size: 0.75rem; color: var(--text-color-secondary); }
    .size-cell { font-size: 0.8rem; color: var(--text-color-secondary); }
    .doc-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1rem; }
    .card-description { font-size: 0.875rem; color: var(--text-color-secondary); margin: 0 0 1rem; }
    .reason-cell { font-size: 0.85rem; color: var(--text-color-secondary); }
    .info-banner { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.25rem; background: var(--blue-50); border: 1px solid var(--blue-200); border-radius: var(--border-radius); font-size: 0.875rem; color: var(--blue-800); }
    .info-banner i { font-size: 1.1rem; color: var(--blue-500); flex-shrink: 0; margin-top: 0.1rem; }
    .info-banner strong { display: block; margin-bottom: 0.25rem; }
    .info-banner p { margin: 0; line-height: 1.55; }
    @media (max-width: 768px) {
      .connection-banner { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
    }
  `]
})
export class MyHealthRecordComponent {
  openAccess = true;
  emergencyAccess = true;

  readonly healthDocuments = signal<HealthDocument[]>([
    { id: '1', type: 'Health Summary', title: 'Shared Health Summary', date: '18 Feb 2026', provider: 'Dr. Sarah Mitchell', facility: 'AuraHealth Bondi Junction', size: '42 KB', isShared: true },
    { id: '2', type: 'Event Summary', title: 'Annual Health Check 2025', date: '14 Nov 2025', provider: 'Dr. Sarah Mitchell', facility: 'AuraHealth Bondi Junction', size: '38 KB', isShared: true },
    { id: '3', type: 'Discharge Summary', title: 'Day Surgery - Arthroscopy', date: '02 Aug 2025', provider: 'Dr. James Nguyen', facility: 'Prince of Wales Hospital', size: '88 KB', isShared: true },
    { id: '4', type: 'Prescription', title: 'Prescription Records (PBS)', date: '18 Feb 2026', provider: 'Dr. Sarah Mitchell', facility: 'AuraHealth Bondi Junction', size: '12 KB', isShared: true },
    { id: '5', type: 'Medicare Overview', title: 'Medicare Claims Overview 2026', date: '21 Feb 2026', provider: 'Medicare Australia', facility: 'Services Australia', size: '25 KB', isShared: true },
    { id: '6', type: 'Pathology Report', title: 'Blood Panel - February 2026', date: '10 Feb 2026', provider: 'Dr. Priya Sharma', facility: 'Sullivan Nicolaides Pathology', size: '55 KB', isShared: false },
    { id: '7', type: 'Specialist Letter', title: 'Cardiology Consultation Report', date: '20 Jan 2026', provider: 'Dr. Michael Torres', facility: 'Sydney Heart Specialists', size: '62 KB', isShared: false }
  ]);

  readonly accessHistory = signal<AccessHistoryItem[]>([
    { date: '21 Feb 2026, 10:14 AM', accessor: 'AuraHealth Bondi Junction', accessorType: 'GP', reason: 'Routine Consultation', location: 'Bondi Junction, NSW' },
    { date: '18 Feb 2026, 09:30 AM', accessor: 'Sullivan Nicolaides Pathology', accessorType: 'Pathology', reason: 'Test Results Upload', location: 'Bondi, NSW' },
    { date: '10 Feb 2026, 02:15 PM', accessor: 'Sydney Heart Specialists', accessorType: 'Specialist', reason: 'Cardiology Referral', location: 'Sydney CBD, NSW' },
    { date: '21 Feb 2026, 12:00 AM', accessor: 'Services Australia (Medicare)', accessorType: 'Government', reason: 'Automated Medicare Update', location: 'National' },
    { date: '02 Aug 2025, 11:00 AM', accessor: 'Prince of Wales Hospital', accessorType: 'Hospital', reason: 'Surgical Admission', location: 'Randwick, NSW' }
  ]);

  getDocIcon(type: string): string {
    const icons: Record<string, string> = {
      'Health Summary': 'pi-heart',
      'Event Summary': 'pi-calendar',
      'Discharge Summary': 'pi-home',
      'Prescription': 'pi-file-edit',
      'Medicare Overview': 'pi-shield',
      'Pathology Report': 'pi-chart-bar',
      'Specialist Letter': 'pi-envelope'
    };
    return icons[type] ?? 'pi-file';
  }
}
