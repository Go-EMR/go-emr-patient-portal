import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';

interface AuditEntry {
  id: string;
  timestamp: Date;
  userSystem: string;
  userType: 'provider' | 'system' | 'patient' | 'insurance' | 'lab';
  action: 'Viewed' | 'Exported' | 'Printed' | 'Shared' | 'Updated';
  record: string;
  ipAddress: string;
  details: string;
}

interface SessionEntry {
  id: string;
  dateTime: Date;
  device: string;
  browser: string;
  ipAddress: string;
  location: string;
  status: 'Active' | 'Expired';
  duration: string;
  isCurrent: boolean;
}

interface DropdownOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-audit-log',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, CardModule, ButtonModule, TagModule,
    TableModule, SelectModule, DatePickerModule, DividerModule,
    TabsModule, TooltipModule, InputTextModule
  ],
  template: `
    <div class="audit-page">
      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-shield-check"></i>
          </div>
          <div>
            <h1>Access Audit Log</h1>
            <p>Complete record of who accessed your health information</p>
          </div>
        </div>
        <div class="header-badges">
          <span class="compliance-badge">
            <i class="pi pi-check-circle"></i> HIPAA Compliant
          </span>
          <span class="compliance-badge gdpr-badge">
            <i class="pi pi-check-circle"></i> GDPR Article 15
          </span>
        </div>
      </header>

      <p-tabs [value]="0">
        <p-tablist>
          <p-tab [value]="0"><i class="pi pi-list" style="margin-right:0.4rem"></i>Access Log</p-tab>
          <p-tab [value]="1"><i class="pi pi-desktop" style="margin-right:0.4rem"></i>Session History</p-tab>
        </p-tablist>
        <p-tabpanels>
        <!-- TAB 1: Access Audit Log -->
        <p-tabpanel [value]="0">

          <!-- Filter Bar -->
          <div class="filter-bar">
            <div class="filter-group">
              <label class="filter-label">Date Range</label>
              <p-datepicker
                [(ngModel)]="filterDateFrom"
                placeholder="From"
                dateFormat="mm/dd/yy"
                [showIcon]="true"
                inputStyleClass="filter-calendar-input"
                styleClass="filter-calendar"
              ></p-datepicker>
              <span class="filter-sep">to</span>
              <p-datepicker
                [(ngModel)]="filterDateTo"
                placeholder="To"
                dateFormat="mm/dd/yy"
                [showIcon]="true"
                inputStyleClass="filter-calendar-input"
                styleClass="filter-calendar"
              ></p-datepicker>
            </div>
            <div class="filter-group">
              <label class="filter-label">User / System</label>
              <p-select
                [options]="userFilterOptions"
                [(ngModel)]="selectedUserFilter"
                placeholder="All Users"
                optionLabel="label"
                optionValue="value"
                [style]="{ minWidth: '180px' }"
              ></p-select>
            </div>
            <div class="filter-group">
              <label class="filter-label">Action Type</label>
              <p-select
                [options]="actionFilterOptions"
                [(ngModel)]="selectedActionFilter"
                placeholder="All Actions"
                optionLabel="label"
                optionValue="value"
                [style]="{ minWidth: '160px' }"
              ></p-select>
            </div>
            <div class="filter-actions">
              <button pButton label="Apply Filters" icon="pi pi-filter" class="p-button-sm" (click)="applyFilters()"></button>
              <button pButton label="Clear" icon="pi pi-times" class="p-button-text p-button-sm" (click)="clearFilters()"></button>
            </div>
          </div>

          <!-- Summary Stats -->
          <div class="audit-stats">
            <div class="stat-card">
              <span class="stat-number">{{ filteredAuditEntries().length }}</span>
              <span class="stat-label">Total Events</span>
            </div>
            <div class="stat-card">
              <span class="stat-number viewed-color">{{ countByAction('Viewed') }}</span>
              <span class="stat-label">Views</span>
            </div>
            <div class="stat-card">
              <span class="stat-number exported-color">{{ countByAction('Exported') }}</span>
              <span class="stat-label">Exports</span>
            </div>
            <div class="stat-card">
              <span class="stat-number shared-color">{{ countByAction('Shared') }}</span>
              <span class="stat-label">Shares</span>
            </div>
            <div class="stat-card">
              <span class="stat-number updated-color">{{ countByAction('Updated') }}</span>
              <span class="stat-label">Updates</span>
            </div>
          </div>

          <!-- Audit Table -->
          <div class="table-wrapper">
            <p-table
              [value]="pagedAuditEntries()"
              styleClass="p-datatable-sm p-datatable-striped audit-table"
              [tableStyle]="{ 'min-width': '900px' }"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th style="width:160px">Timestamp</th>
                  <th style="width:200px">User / System</th>
                  <th style="width:110px">Action</th>
                  <th style="width:160px">Record Accessed</th>
                  <th style="width:130px">IP Address</th>
                  <th>Details</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-entry>
                <tr>
                  <td class="timestamp-cell">
                    <span class="ts-date">{{ entry.timestamp | date:'MMM d, yyyy' }}</span>
                    <span class="ts-time">{{ entry.timestamp | date:'h:mm:ss a' }}</span>
                  </td>
                  <td>
                    <div class="user-cell">
                      <span class="user-icon" [class]="'user-icon-' + entry.userType">
                        <i [class]="getUserIcon(entry.userType)"></i>
                      </span>
                      <span class="user-name">{{ entry.userSystem }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="action-badge" [class]="'action-' + entry.action.toLowerCase()">
                      {{ entry.action }}
                    </span>
                  </td>
                  <td class="record-cell">
                    <i class="pi pi-file record-icon"></i>
                    {{ entry.record }}
                  </td>
                  <td class="ip-cell">{{ entry.ipAddress }}</td>
                  <td class="details-cell">{{ entry.details }}</td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="6" class="empty-msg">
                    <i class="pi pi-search" style="font-size:1.5rem;color:var(--text-color-secondary)"></i>
                    <p>No audit entries match your filters.</p>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>

          <!-- Pagination -->
          <div class="pagination-bar">
            <span class="pagination-info">
              Showing {{ paginationStart() }}–{{ paginationEnd() }} of {{ filteredAuditEntries().length }} events
            </span>
            <div class="pagination-controls">
              <button pButton icon="pi pi-angle-double-left" class="p-button-text p-button-sm p-button-rounded"
                      [disabled]="currentPage() === 1" (click)="goToPage(1)" pTooltip="First page"></button>
              <button pButton icon="pi pi-angle-left" class="p-button-text p-button-sm p-button-rounded"
                      [disabled]="currentPage() === 1" (click)="prevPage()" pTooltip="Previous page"></button>
              @for (page of pageNumbers(); track page) {
                <button
                  class="page-btn"
                  [class.active]="page === currentPage()"
                  (click)="goToPage(page)"
                >{{ page }}</button>
              }
              <button pButton icon="pi pi-angle-right" class="p-button-text p-button-sm p-button-rounded"
                      [disabled]="currentPage() === totalPages()" (click)="nextPage()" pTooltip="Next page"></button>
              <button pButton icon="pi pi-angle-double-right" class="p-button-text p-button-sm p-button-rounded"
                      [disabled]="currentPage() === totalPages()" (click)="goToPage(totalPages())" pTooltip="Last page"></button>
            </div>
          </div>

          <div class="download-row">
            <button pButton label="Download Audit Report (CSV)" icon="pi pi-download" class="p-button-outlined p-button-sm"
                    (click)="downloadAuditReport()"></button>
            <span class="audit-note">
              <i class="pi pi-info-circle"></i>
              Audit logs are retained for 6 years per HIPAA requirements.
            </span>
          </div>
        </p-tabpanel>

        <!-- TAB 2: Session History -->
        <p-tabpanel [value]="1">

          <div class="session-header-row">
            <div>
              <h3 class="session-section-title">Recent Login Sessions</h3>
              <p class="session-section-desc">Review all recent login activity to your patient portal account</p>
            </div>
            <button
              pButton
              label="Sign Out All Other Sessions"
              icon="pi pi-sign-out"
              class="p-button-outlined p-button-danger p-button-sm"
              (click)="signOutAllSessions()"
            ></button>
          </div>

          @if (signOutAllSuccess()) {
            <div class="success-banner">
              <i class="pi pi-check-circle"></i>
              All other sessions have been signed out successfully.
            </div>
          }

          <div class="session-list">
            @for (session of sessionEntries(); track session.id) {
              <div class="session-card" [class.current-session]="session.isCurrent">
                <div class="session-device-icon" [class.current-icon]="session.isCurrent">
                  <i [class]="getDeviceIcon(session.device)"></i>
                </div>
                <div class="session-info">
                  <div class="session-top-row">
                    <span class="session-device-name">{{ session.device }} - {{ session.browser }}</span>
                    @if (session.isCurrent) {
                      <span class="current-badge">
                        <i class="pi pi-check-circle"></i> Current Session
                      </span>
                    }
                    <span class="session-status-badge" [class]="'session-status-' + session.status.toLowerCase()">
                      {{ session.status }}
                    </span>
                  </div>
                  <div class="session-meta">
                    <span><i class="pi pi-calendar"></i> {{ session.dateTime | date:'MMM d, yyyy, h:mm a' }}</span>
                    <span><i class="pi pi-map-marker"></i> {{ session.location }}</span>
                    <span><i class="pi pi-desktop"></i> {{ session.ipAddress }}</span>
                    <span><i class="pi pi-clock"></i> Duration: {{ session.duration }}</span>
                  </div>
                </div>
                @if (!session.isCurrent) {
                  <button
                    pButton
                    icon="pi pi-sign-out"
                    label="Sign Out"
                    class="p-button-text p-button-danger p-button-sm session-signout-btn"
                    (click)="signOutSession(session.id)"
                    [pTooltip]="'Sign out this session'"
                  ></button>
                }
              </div>
            }
          </div>

          <div class="session-note">
            <i class="pi pi-info-circle"></i>
            <span>If you notice any unrecognized sessions, sign out immediately and contact support. Session data is retained for 90 days.</span>
          </div>
        </p-tabpanel>
        </p-tabpanels>
      </p-tabs>
    </div>
  `,
  styles: [`
    .audit-page { max-width: 1100px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
    .header-content { display: flex; align-items: center; gap: 1rem; }
    .header-icon { width: 52px; height: 52px; border-radius: 12px; background: var(--primary-50); color: var(--primary-600); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
    .page-header h1 { margin: 0; font-size: 1.5rem; }
    .page-header p { color: var(--text-color-secondary); margin: 0.25rem 0 0; font-size: 0.9rem; }
    .header-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: flex-start; }
    .compliance-badge { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; background: var(--green-50); color: var(--green-700); border: 1px solid var(--green-200); }
    .gdpr-badge { background: var(--blue-50); color: var(--blue-700); border-color: var(--blue-200); }

    /* Filter Bar */
    .filter-bar { display: flex; align-items: flex-end; gap: 1rem; flex-wrap: wrap; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); padding: 1rem 1.25rem; margin-bottom: 1.25rem; }
    .filter-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .filter-label { font-size: 0.775rem; font-weight: 600; color: var(--text-color-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    .filter-sep { font-size: 0.85rem; color: var(--text-color-secondary); padding-bottom: 0.5rem; }
    .filter-group.date-range { flex-direction: row; align-items: flex-end; gap: 0.5rem; }
    .filter-actions { display: flex; gap: 0.5rem; align-items: flex-end; }

    /* Stats */
    .audit-stats { display: flex; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .stat-card { flex: 1; min-width: 90px; background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: var(--border-radius); padding: 0.875rem 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
    .stat-number { font-size: 1.5rem; font-weight: 700; color: var(--text-color); }
    .stat-label { font-size: 0.75rem; color: var(--text-color-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    .viewed-color { color: var(--primary-600); }
    .exported-color { color: var(--green-600); }
    .shared-color { color: var(--orange-600); }
    .updated-color { color: var(--purple-600); }

    /* Table */
    .table-wrapper { overflow-x: auto; border: 1px solid var(--surface-border); border-radius: var(--border-radius); }
    .timestamp-cell { display: flex; flex-direction: column; gap: 0.1rem; }
    .ts-date { font-size: 0.8rem; font-weight: 600; color: var(--text-color); }
    .ts-time { font-size: 0.75rem; color: var(--text-color-secondary); }
    .user-cell { display: flex; align-items: center; gap: 0.5rem; }
    .user-icon { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; flex-shrink: 0; }
    .user-icon-provider { background: var(--blue-50); color: var(--blue-600); }
    .user-icon-system { background: var(--surface-100); color: var(--text-color-secondary); }
    .user-icon-patient { background: var(--teal-50); color: var(--teal-600); }
    .user-icon-insurance { background: var(--orange-50); color: var(--orange-600); }
    .user-icon-lab { background: var(--purple-50); color: var(--purple-600); }
    .user-name { font-size: 0.85rem; font-weight: 500; }
    .action-badge { display: inline-block; padding: 0.2rem 0.65rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .action-viewed { background: var(--primary-50); color: var(--primary-700); }
    .action-exported { background: var(--green-50); color: var(--green-700); }
    .action-printed { background: var(--surface-100); color: var(--text-color-secondary); }
    .action-shared { background: var(--orange-50); color: var(--orange-700); }
    .action-updated { background: #f3e8ff; color: #7e22ce; }
    .record-cell { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; }
    .record-icon { color: var(--primary-400); font-size: 0.85rem; }
    .ip-cell { font-size: 0.8rem; color: var(--text-color-secondary); font-family: monospace; }
    .details-cell { font-size: 0.82rem; color: var(--text-color-secondary); max-width: 220px; }
    .empty-msg { text-align: center; padding: 2.5rem; color: var(--text-color-secondary); display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }

    /* Pagination */
    .pagination-bar { display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 0; flex-wrap: wrap; gap: 0.75rem; }
    .pagination-info { font-size: 0.825rem; color: var(--text-color-secondary); }
    .pagination-controls { display: flex; align-items: center; gap: 0.25rem; }
    .page-btn { min-width: 32px; height: 32px; padding: 0; border: 1px solid var(--surface-border); border-radius: 6px; background: var(--surface-card); color: var(--text-color); font-size: 0.8rem; cursor: pointer; font-family: inherit; transition: all 0.15s; }
    .page-btn:hover { background: var(--surface-hover); }
    .page-btn.active { background: var(--primary-500); color: white; border-color: var(--primary-500); font-weight: 600; }

    .download-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; padding-top: 0.75rem; }
    .audit-note { font-size: 0.8rem; color: var(--text-color-secondary); display: flex; align-items: center; gap: 0.35rem; }
    .audit-note i { color: var(--primary-400); }

    /* Session Tab */
    .session-header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .session-section-title { margin: 0 0 0.25rem; font-size: 1.05rem; }
    .session-section-desc { margin: 0; font-size: 0.875rem; color: var(--text-color-secondary); }
    .success-banner { display: flex; align-items: center; gap: 0.5rem; padding: 0.875rem 1rem; background: var(--green-50); border: 1px solid var(--green-200); border-radius: var(--border-radius); color: var(--green-700); font-size: 0.875rem; margin-bottom: 1rem; }
    .success-banner i { font-size: 1rem; }
    .session-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.25rem; }
    .session-card { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: var(--border-radius); transition: border-color 0.2s; }
    .session-card.current-session { border-color: var(--green-300); background: var(--green-50); }
    .session-device-icon { width: 44px; height: 44px; border-radius: 10px; background: var(--surface-100); color: var(--text-color-secondary); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
    .session-device-icon.current-icon { background: var(--green-100); color: var(--green-600); }
    .session-info { flex: 1; min-width: 0; }
    .session-top-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.4rem; }
    .session-device-name { font-weight: 600; font-size: 0.9rem; }
    .current-badge { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.15rem 0.5rem; background: var(--green-100); color: var(--green-700); border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
    .session-status-badge { padding: 0.15rem 0.5rem; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
    .session-status-active { background: var(--green-50); color: var(--green-700); border: 1px solid var(--green-200); }
    .session-status-expired { background: var(--surface-100); color: var(--text-color-secondary); border: 1px solid var(--surface-border); }
    .session-meta { display: flex; flex-wrap: wrap; gap: 0.4rem 1rem; font-size: 0.8rem; color: var(--text-color-secondary); }
    .session-meta span { display: flex; align-items: center; gap: 0.3rem; }
    .session-meta i { font-size: 0.8rem; }
    .session-signout-btn { flex-shrink: 0; }
    .session-note { display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.875rem 1rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); font-size: 0.825rem; color: var(--text-color-secondary); line-height: 1.5; }
    .session-note i { color: var(--primary-400); flex-shrink: 0; margin-top: 0.1rem; }

    @media (max-width: 768px) {
      .filter-bar { flex-direction: column; align-items: stretch; }
      .audit-stats { gap: 0.5rem; }
      .stat-card { min-width: 70px; }
      .page-header { flex-direction: column; }
    }
  `]
})
export class AuditLogComponent {
  // Filter state
  filterDateFrom: Date | null = null;
  filterDateTo: Date | null = null;
  selectedUserFilter = '';
  selectedActionFilter = '';
  signOutAllSuccess = signal(false);

  // Pagination
  currentPage = signal(1);
  readonly pageSize = 8;

  readonly userFilterOptions: DropdownOption[] = [
    { label: 'All Users', value: '' },
    { label: 'Dr. Sarah Johnson', value: 'Dr. Sarah Johnson' },
    { label: 'Dr. Michael Chen', value: 'Dr. Michael Chen' },
    { label: 'Lab System', value: 'Lab System' },
    { label: 'Insurance Portal', value: 'Insurance Portal' },
    { label: 'Patient (You)', value: 'Patient (You)' },
    { label: 'Pharmacy System', value: 'Pharmacy System' },
  ];

  readonly actionFilterOptions: DropdownOption[] = [
    { label: 'All Actions', value: '' },
    { label: 'Viewed', value: 'Viewed' },
    { label: 'Exported', value: 'Exported' },
    { label: 'Printed', value: 'Printed' },
    { label: 'Shared', value: 'Shared' },
    { label: 'Updated', value: 'Updated' },
  ];

  private _allAuditEntries = signal<AuditEntry[]>([
    { id: 'A001', timestamp: new Date('2026-02-22T09:14:32'), userSystem: 'Dr. Sarah Johnson', userType: 'provider', action: 'Viewed', record: 'Lab Results', ipAddress: '192.168.1.45', details: 'Reviewed CBC panel results from Feb 18' },
    { id: 'A002', timestamp: new Date('2026-02-22T08:52:11'), userSystem: 'Insurance Portal', userType: 'insurance', action: 'Viewed', record: 'Medication List', ipAddress: '10.0.5.122', details: 'BCBS pre-authorization review' },
    { id: 'A003', timestamp: new Date('2026-02-21T16:38:04'), userSystem: 'Patient (You)', userType: 'patient', action: 'Exported', record: 'Full FHIR Bundle', ipAddress: '73.145.22.89', details: 'FHIR R4 JSON export requested via portal' },
    { id: 'A004', timestamp: new Date('2026-02-21T14:22:47'), userSystem: 'Dr. Michael Chen', userType: 'provider', action: 'Viewed', record: 'Imaging Studies', ipAddress: '192.168.1.67', details: 'Reviewed chest X-ray report' },
    { id: 'A005', timestamp: new Date('2026-02-21T11:05:30'), userSystem: 'Lab System', userType: 'lab', action: 'Updated', record: 'Lab Results', ipAddress: '10.10.1.200', details: 'HbA1c results added to record' },
    { id: 'A006', timestamp: new Date('2026-02-20T15:44:19'), userSystem: 'Pharmacy System', userType: 'system', action: 'Viewed', record: 'Medication List', ipAddress: '10.0.8.55', details: 'CVS refill verification check' },
    { id: 'A007', timestamp: new Date('2026-02-20T10:31:55'), userSystem: 'Dr. Sarah Johnson', userType: 'provider', action: 'Printed', record: 'Visit Summary', ipAddress: '192.168.1.45', details: 'Printed visit summary for Feb 20 appointment' },
    { id: 'A008', timestamp: new Date('2026-02-19T14:08:22'), userSystem: 'Patient (You)', userType: 'patient', action: 'Viewed', record: 'Immunization Records', ipAddress: '73.145.22.89', details: 'Portal self-access via browser' },
    { id: 'A009', timestamp: new Date('2026-02-19T09:55:41'), userSystem: 'Insurance Portal', userType: 'insurance', action: 'Shared', record: 'Diagnostic Summary', ipAddress: '10.0.5.122', details: 'Shared with secondary insurer for coordination of benefits' },
    { id: 'A010', timestamp: new Date('2026-02-18T16:20:10'), userSystem: 'Lab System', userType: 'lab', action: 'Updated', record: 'Lab Results', ipAddress: '10.10.1.200', details: 'Lipid panel results finalized' },
    { id: 'A011', timestamp: new Date('2026-02-18T11:42:37'), userSystem: 'Dr. Emily Park', userType: 'provider', action: 'Viewed', record: 'Allergy List', ipAddress: '192.168.2.12', details: 'Pre-visit medication reconciliation' },
    { id: 'A012', timestamp: new Date('2026-02-17T15:30:05'), userSystem: 'Patient (You)', userType: 'patient', action: 'Printed', record: 'Medication List', ipAddress: '73.145.22.89', details: 'Printed medication summary for specialist visit' },
    { id: 'A013', timestamp: new Date('2026-02-17T10:14:28'), userSystem: 'Dr. Michael Chen', userType: 'provider', action: 'Viewed', record: 'Vital Signs History', ipAddress: '192.168.1.67', details: 'Blood pressure trend review' },
    { id: 'A014', timestamp: new Date('2026-02-16T14:55:12'), userSystem: 'Pharmacy System', userType: 'system', action: 'Viewed', record: 'Medication List', ipAddress: '10.0.8.55', details: 'Walgreens drug interaction check' },
    { id: 'A015', timestamp: new Date('2026-02-16T09:22:44'), userSystem: 'Dr. Sarah Johnson', userType: 'provider', action: 'Updated', record: 'Care Plan', ipAddress: '192.168.1.45', details: 'Updated diabetes management care plan' },
    { id: 'A016', timestamp: new Date('2026-02-15T16:08:33'), userSystem: 'Insurance Portal', userType: 'insurance', action: 'Viewed', record: 'Procedure Records', ipAddress: '10.0.5.122', details: 'Claims adjudication review' },
    { id: 'A017', timestamp: new Date('2026-02-15T11:37:19'), userSystem: 'Patient (You)', userType: 'patient', action: 'Exported', record: 'Lab Results', ipAddress: '73.145.22.89', details: 'Downloaded individual lab result PDF' },
    { id: 'A018', timestamp: new Date('2026-02-14T15:22:08'), userSystem: 'Lab System', userType: 'lab', action: 'Updated', record: 'Lab Results', ipAddress: '10.10.1.200', details: 'Thyroid panel (TSH) results added' },
    { id: 'A019', timestamp: new Date('2026-02-14T09:45:51'), userSystem: 'Dr. Lisa Torres', userType: 'provider', action: 'Shared', record: 'Referral Summary', ipAddress: '192.168.3.88', details: 'Shared with Dr. Chen for cardiology referral' },
    { id: 'A020', timestamp: new Date('2026-02-13T14:10:26'), userSystem: 'Patient (You)', userType: 'patient', action: 'Viewed', record: 'Billing Statements', ipAddress: '73.145.22.89', details: 'Reviewed January statement' },
  ]);

  private _activeFilters = signal({ user: '', action: '', dateFrom: null as Date | null, dateTo: null as Date | null });

  readonly filteredAuditEntries = computed(() => {
    const f = this._activeFilters();
    return this._allAuditEntries().filter(e => {
      if (f.user && e.userSystem !== f.user) return false;
      if (f.action && e.action !== f.action) return false;
      if (f.dateFrom && e.timestamp < f.dateFrom) return false;
      if (f.dateTo) {
        const toEnd = new Date(f.dateTo);
        toEnd.setHours(23, 59, 59, 999);
        if (e.timestamp > toEnd) return false;
      }
      return true;
    });
  });

  readonly totalPages = computed(() => Math.ceil(this.filteredAuditEntries().length / this.pageSize) || 1);

  readonly pagedAuditEntries = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    return this.filteredAuditEntries().slice(start, start + this.pageSize);
  });

  readonly paginationStart = computed(() => {
    const total = this.filteredAuditEntries().length;
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize + 1;
  });

  readonly paginationEnd = computed(() => {
    return Math.min(this.currentPage() * this.pageSize, this.filteredAuditEntries().length);
  });

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const maxButtons = 5;
    let start = Math.max(1, current - Math.floor(maxButtons / 2));
    const end = Math.min(total, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  readonly sessionEntries = signal<SessionEntry[]>([
    {
      id: 'S001', dateTime: new Date('2026-02-22T08:45:00'), device: 'Desktop', browser: 'Chrome 122',
      ipAddress: '73.145.22.89', location: 'Boston, MA, USA', status: 'Active', duration: 'Ongoing', isCurrent: true
    },
    {
      id: 'S002', dateTime: new Date('2026-02-21T19:30:00'), device: 'Mobile', browser: 'Safari 17',
      ipAddress: '73.145.22.91', location: 'Boston, MA, USA', status: 'Expired', duration: '42 min', isCurrent: false
    },
    {
      id: 'S003', dateTime: new Date('2026-02-20T14:15:00'), device: 'Desktop', browser: 'Firefox 123',
      ipAddress: '73.145.22.89', location: 'Boston, MA, USA', status: 'Expired', duration: '1h 18min', isCurrent: false
    },
    {
      id: 'S004', dateTime: new Date('2026-02-19T10:00:00'), device: 'Tablet', browser: 'Chrome 122',
      ipAddress: '192.168.0.105', location: 'Cambridge, MA, USA', status: 'Expired', duration: '25 min', isCurrent: false
    },
    {
      id: 'S005', dateTime: new Date('2026-02-17T09:22:00'), device: 'Desktop', browser: 'Edge 122',
      ipAddress: '73.145.22.89', location: 'Boston, MA, USA', status: 'Expired', duration: '2h 5min', isCurrent: false
    },
    {
      id: 'S006', dateTime: new Date('2026-02-15T16:45:00'), device: 'Mobile', browser: 'Chrome 122',
      ipAddress: '96.55.111.74', location: 'Somerville, MA, USA', status: 'Expired', duration: '15 min', isCurrent: false
    },
  ]);

  countByAction(action: string): number {
    return this.filteredAuditEntries().filter(e => e.action === action).length;
  }

  getUserIcon(userType: string): string {
    const icons: Record<string, string> = {
      provider: 'pi pi-user-plus',
      system: 'pi pi-cog',
      patient: 'pi pi-user',
      insurance: 'pi pi-id-card',
      lab: 'pi pi-chart-bar',
    };
    return icons[userType] ?? 'pi pi-user';
  }

  getDeviceIcon(device: string): string {
    if (device === 'Mobile') return 'pi pi-mobile';
    if (device === 'Tablet') return 'pi pi-tablet';
    return 'pi pi-desktop';
  }

  applyFilters(): void {
    this._activeFilters.set({
      user: this.selectedUserFilter,
      action: this.selectedActionFilter,
      dateFrom: this.filterDateFrom,
      dateTo: this.filterDateTo,
    });
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.selectedUserFilter = '';
    this.selectedActionFilter = '';
    this.filterDateFrom = null;
    this.filterDateTo = null;
    this._activeFilters.set({ user: '', action: '', dateFrom: null, dateTo: null });
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  prevPage(): void {
    this.currentPage.update(p => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.currentPage.update(p => Math.min(this.totalPages(), p + 1));
  }

  downloadAuditReport(): void {
    // Mock: in production this would generate a CSV file
    console.log('Downloading audit report CSV...');
  }

  signOutSession(sessionId: string): void {
    this.sessionEntries.update(entries =>
      entries.filter(s => s.id !== sessionId)
    );
  }

  signOutAllSessions(): void {
    this.sessionEntries.update(entries =>
      entries.filter(s => s.isCurrent)
    );
    this.signOutAllSuccess.set(true);
    setTimeout(() => this.signOutAllSuccess.set(false), 4000);
  }
}
