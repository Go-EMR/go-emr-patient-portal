import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface MedicareClaim {
  id: string;
  date: string;
  claimType: 'Part A' | 'Part B' | 'Part D';
  provider: string;
  service: string;
  totalCharged: number;
  medicarePaid: number;
  patientResponsibility: number;
  status: 'Processed' | 'Pending' | 'Denied';
}

@Component({
  selector: 'app-blue-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule, ButtonModule, TagModule, TableModule, DividerModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="blue-button-page">
      <p-toast></p-toast>

      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-cloud-download"></i>
          </div>
          <div>
            <h1>Medicare Blue Button 2.0</h1>
            <p>CMS Blue Button API — Access your Medicare claims data in one place</p>
          </div>
        </div>
      </header>

      <!-- CMS Connection Status -->
      <div class="connection-card">
        <div class="connection-status">
          <div class="status-indicator">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="status-info">
            <span class="status-title">Connected to CMS Blue Button 2.0 API</span>
            <span class="status-detail">Medicare Beneficiary ID: 1SG9-J55-FE63 | Medicare Advantage: N/A</span>
            <span class="status-sync">Last synchronized: Feb 21, 2026 at 12:00 AM ET</span>
          </div>
        </div>
        <div class="connection-actions">
          <button pButton label="Sync Latest Claims" icon="pi pi-refresh" class="p-button-outlined p-button-sm" (click)="syncClaims()"></button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card charges">
          <i class="pi pi-file-edit"></i>
          <span class="summary-value">\${{ totalCharged().toFixed(2) }}</span>
          <span class="summary-label">Total Charges</span>
          <span class="summary-period">All claims shown</span>
        </div>
        <div class="summary-card medicare">
          <i class="pi pi-shield"></i>
          <span class="summary-value">\${{ totalMedicarePaid().toFixed(2) }}</span>
          <span class="summary-label">Medicare Paid</span>
          <span class="summary-period">All claims shown</span>
        </div>
        <div class="summary-card patient">
          <i class="pi pi-credit-card"></i>
          <span class="summary-value">\${{ totalPatientResponsibility().toFixed(2) }}</span>
          <span class="summary-label">Your Cost</span>
          <span class="summary-period">All claims shown</span>
        </div>
        <div class="summary-card claims-count">
          <i class="pi pi-list"></i>
          <span class="summary-value">{{ claims().length }}</span>
          <span class="summary-label">Total Claims</span>
          <span class="summary-period">2026 YTD</span>
        </div>
      </div>

      <p-divider></p-divider>

      <!-- Claims Table -->
      <p-card header="Medicare Claims Data" styleClass="claims-card">
        <div class="claim-type-legend">
          <span class="legend-item">
            <span class="type-badge part-a">Part A</span>
            Hospital / Inpatient
          </span>
          <span class="legend-item">
            <span class="type-badge part-b">Part B</span>
            Medical / Outpatient
          </span>
          <span class="legend-item">
            <span class="type-badge part-d">Part D</span>
            Prescription Drugs
          </span>
        </div>
        <p-table
          [value]="claims()"
          styleClass="p-datatable-sm p-datatable-striped"
          [tableStyle]="{ 'min-width': '100%' }"
          [paginator]="true"
          [rows]="5"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Provider</th>
              <th>Service</th>
              <th>Total Charged</th>
              <th>Medicare Paid</th>
              <th>Your Cost</th>
              <th style="width: 90px">Status</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-claim>
            <tr>
              <td class="date-cell">{{ claim.date }}</td>
              <td>
                <span class="type-badge" [class]="'part-' + claim.claimType.replace('Part ', '').toLowerCase()">
                  {{ claim.claimType }}
                </span>
              </td>
              <td class="provider-cell">{{ claim.provider }}</td>
              <td class="service-cell">{{ claim.service }}</td>
              <td class="fee-cell">\${{ claim.totalCharged.toFixed(2) }}</td>
              <td class="paid-cell">\${{ claim.medicarePaid.toFixed(2) }}</td>
              <td>
                @if (claim.patientResponsibility === 0) {
                  <span class="cost-zero">$0.00</span>
                } @else {
                  <span class="cost-amount">\${{ claim.patientResponsibility.toFixed(2) }}</span>
                }
              </td>
              <td>
                <p-tag
                  [value]="claim.status"
                  [severity]="getClaimStatusSeverity(claim.status)"
                ></p-tag>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="footer">
            <tr>
              <td colspan="4" class="totals-row-label"><strong>Totals</strong></td>
              <td class="fee-cell"><strong>\${{ totalCharged().toFixed(2) }}</strong></td>
              <td class="paid-cell"><strong>\${{ totalMedicarePaid().toFixed(2) }}</strong></td>
              <td colspan="2" class="cost-amount"><strong>\${{ totalPatientResponsibility().toFixed(2) }}</strong></td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>

      <p-divider></p-divider>

      <!-- Actions -->
      <div class="page-actions">
        <button pButton label="Sync Latest Claims" icon="pi pi-refresh" class="p-button-primary" (click)="syncClaims()"></button>
        <button pButton label="Download All Claims (FHIR)" icon="pi pi-download" class="p-button-outlined" (click)="downloadFhir()"></button>
        <button pButton label="Share with My Provider" icon="pi pi-share-alt" class="p-button-outlined p-button-secondary" (click)="shareWithProvider()"></button>
      </div>

      <p-divider></p-divider>

      <!-- Info Banner -->
      <div class="info-banner">
        <i class="pi pi-info-circle"></i>
        <div>
          <strong>About CMS Blue Button 2.0</strong>
          <p>
            The CMS Blue Button 2.0 API gives Medicare beneficiaries access to their Part A, Part B,
            and Part D claims data in FHIR R4 format. This information helps you and your healthcare
            providers make more informed decisions. Data is updated monthly after claims are processed
            by Medicare. For questions, visit MyMedicare.gov or call 1-800-MEDICARE.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .blue-button-page { max-width: 1100px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .header-content { display: flex; align-items: center; gap: 1rem; }
    .header-icon { width: 52px; height: 52px; background: #e3f2fd; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .header-icon i { font-size: 1.5rem; color: #1565c0; }
    .header-content h1 { margin: 0; font-size: 1.6rem; }
    .header-content p { margin: 0.2rem 0 0; color: var(--text-color-secondary); font-size: 0.9rem; }
    .connection-card { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; background: var(--green-50); border: 1px solid var(--green-200); border-radius: var(--border-radius); margin-bottom: 1.5rem; gap: 1rem; }
    .connection-status { display: flex; align-items: center; gap: 0.875rem; }
    .status-indicator { width: 40px; height: 40px; border-radius: 50%; background: var(--green-100); color: var(--green-600); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .status-indicator i { font-size: 1.25rem; }
    .status-info { display: flex; flex-direction: column; gap: 0.2rem; }
    .status-title { font-weight: 600; color: var(--green-700); font-size: 0.95rem; }
    .status-detail { font-size: 0.8rem; color: var(--text-color-secondary); }
    .status-sync { font-size: 0.8rem; color: var(--text-color-secondary); }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 0.5rem; }
    .summary-card { display: flex; flex-direction: column; align-items: center; padding: 1.25rem 1rem; border-radius: var(--border-radius); border: 1px solid var(--surface-border); text-align: center; gap: 0.25rem; }
    .summary-card i { font-size: 1.4rem; margin-bottom: 0.25rem; }
    .summary-value { font-size: 1.5rem; font-weight: 700; }
    .summary-label { font-size: 0.85rem; font-weight: 500; }
    .summary-period { font-size: 0.72rem; color: var(--text-color-secondary); }
    .summary-card.charges { background: #fce4ec; border-color: #f48fb1; }
    .summary-card.charges i { color: #c2185b; }
    .summary-card.charges .summary-value { color: #c2185b; }
    .summary-card.medicare { background: #e8f5e9; border-color: #a5d6a7; }
    .summary-card.medicare i { color: #2e7d32; }
    .summary-card.medicare .summary-value { color: #2e7d32; }
    .summary-card.patient { background: #fff3e0; border-color: #ffcc80; }
    .summary-card.patient i { color: #e65100; }
    .summary-card.patient .summary-value { color: #e65100; }
    .summary-card.claims-count { background: #e3f2fd; border-color: #90caf9; }
    .summary-card.claims-count i { color: #1565c0; }
    .summary-card.claims-count .summary-value { color: #1565c0; }
    .claim-type-legend { display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .legend-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: var(--text-color-secondary); }
    .type-badge { display: inline-flex; align-items: center; font-size: 0.75rem; font-weight: 700; padding: 0.15rem 0.55rem; border-radius: 12px; }
    .part-a { background: #fce4ec; color: #c2185b; }
    .part-b { background: #e3f2fd; color: #1565c0; }
    .part-d { background: #f3e5f5; color: #6a1b9a; }
    .date-cell { font-size: 0.85rem; white-space: nowrap; }
    .provider-cell { font-size: 0.85rem; }
    .service-cell { font-size: 0.82rem; color: var(--text-color-secondary); }
    .fee-cell { font-size: 0.875rem; }
    .paid-cell { font-size: 0.875rem; color: var(--green-700); font-weight: 500; }
    .cost-zero { color: var(--green-600); font-weight: 600; font-size: 0.875rem; }
    .cost-amount { color: var(--orange-700); font-weight: 600; font-size: 0.875rem; }
    .totals-row-label { font-size: 0.875rem; }
    .page-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .info-banner { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.25rem; background: var(--blue-50); border: 1px solid var(--blue-200); border-radius: var(--border-radius); font-size: 0.875rem; color: var(--blue-800); }
    .info-banner i { font-size: 1.1rem; color: var(--blue-500); flex-shrink: 0; margin-top: 0.1rem; }
    .info-banner strong { display: block; margin-bottom: 0.25rem; }
    .info-banner p { margin: 0; line-height: 1.55; }
    @media (max-width: 768px) {
      .summary-grid { grid-template-columns: repeat(2, 1fr); }
      .connection-card { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class BlueButtonComponent {
  private readonly messageService: MessageService;

  constructor(messageService: MessageService) {
    this.messageService = messageService;
  }

  readonly claims = signal<MedicareClaim[]>([
    {
      id: 'CLM-001',
      date: 'Feb 18, 2026',
      claimType: 'Part B',
      provider: 'GoHealth Primary Care — Dr. Emily Chen',
      service: 'Office/Outpatient Visit, New Patient (99204)',
      totalCharged: 280.00,
      medicarePaid: 196.00,
      patientResponsibility: 49.00,
      status: 'Processed'
    },
    {
      id: 'CLM-002',
      date: 'Feb 10, 2026',
      claimType: 'Part B',
      provider: 'Quest Diagnostics',
      service: 'Comprehensive Metabolic Panel (80053)',
      totalCharged: 155.00,
      medicarePaid: 116.25,
      patientResponsibility: 0,
      status: 'Processed'
    },
    {
      id: 'CLM-003',
      date: 'Jan 20, 2026',
      claimType: 'Part D',
      provider: 'CVS Pharmacy',
      service: 'Metformin 500mg × 90 tablets',
      totalCharged: 48.90,
      medicarePaid: 41.57,
      patientResponsibility: 7.33,
      status: 'Processed'
    },
    {
      id: 'CLM-004',
      date: 'Dec 02, 2025',
      claimType: 'Part B',
      provider: 'City Heart Specialists — Dr. Michael Torres',
      service: 'Cardiology Consultation — New Patient (99245)',
      totalCharged: 520.00,
      medicarePaid: 364.00,
      patientResponsibility: 91.00,
      status: 'Processed'
    },
    {
      id: 'CLM-005',
      date: 'Mar 22, 2025',
      claimType: 'Part A',
      provider: 'Memorial Hospital',
      service: 'Inpatient Hospital Stay (2 days — DRG 193)',
      totalCharged: 8450.00,
      medicarePaid: 8450.00,
      patientResponsibility: 0,
      status: 'Processed'
    }
  ]);

  readonly totalCharged = computed(() => this.claims().reduce((s, c) => s + c.totalCharged, 0));
  readonly totalMedicarePaid = computed(() => this.claims().reduce((s, c) => s + c.medicarePaid, 0));
  readonly totalPatientResponsibility = computed(() => this.claims().reduce((s, c) => s + c.patientResponsibility, 0));

  getClaimStatusSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      Processed: 'success',
      Pending: 'warning',
      Denied: 'danger'
    };
    return map[status] ?? 'info';
  }

  syncClaims(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Syncing Claims',
      detail: 'Connecting to CMS Blue Button 2.0 API to fetch your latest Medicare claims...'
    });
  }

  downloadFhir(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Download Initiated',
      detail: 'Your Medicare claims data (FHIR R4 format) is being prepared for download.'
    });
  }

  shareWithProvider(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Share Claims Data',
      detail: 'A secure sharing link for your claims data has been generated and is ready to send to your provider.'
    });
  }
}
