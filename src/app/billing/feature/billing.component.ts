import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { Statement } from '../../shared/data-access';

interface Claim {
  id: string;
  claimNumber: string;
  serviceDate: Date;
  provider: string;
  description: string;
  chargedAmount: number;
  insurancePaid: number;
  patientResponsibility: number;
  status: 'submitted' | 'processing' | 'approved' | 'denied' | 'appealed';
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TabViewModule, TableModule, TagModule, DialogModule],
  template: `
    <div class="billing-page">
      <header class="page-header"><h1>Billing & Payments</h1><p>Manage your statements, claims, and payments</p></header>
      <p-tabView>
        <p-tabPanel header="Overview">
          <div class="billing-summary">
            <div class="summary-card balance"><div class="summary-icon"><i class="pi pi-wallet"></i></div><div class="summary-content"><span class="label">Current Balance</span><span class="value">{{ totalBalance | currency }}</span></div><button pButton label="Pay Now" icon="pi pi-credit-card" (click)="showPayDialog = true"></button></div>
            <div class="summary-card"><div class="summary-icon pending"><i class="pi pi-clock"></i></div><div class="summary-content"><span class="label">Pending Claims</span><span class="value">{{ pendingClaimsCount }}</span></div></div>
            <div class="summary-card"><div class="summary-icon insurance"><i class="pi pi-shield"></i></div><div class="summary-content"><span class="label">Insurance</span><span class="value">Active</span></div></div>
          </div>
          <div class="insurance-card"><div class="insurance-header"><h3>BlueCross BlueShield</h3><p-tag value="Primary" severity="info"></p-tag></div><div class="insurance-details"><p><strong>Member ID:</strong> XYZ123456</p><p><strong>Group #:</strong> GRP789</p><p><strong>Plan:</strong> PPO</p></div><button pButton label="Update Insurance" icon="pi pi-pencil" class="p-button-outlined"></button></div>
        </p-tabPanel>
        <p-tabPanel header="Statements">
          <p-table [value]="statements()" styleClass="p-datatable-sm">
            <ng-template pTemplate="header"><tr><th>Statement #</th><th>Date</th><th>Due Date</th><th>Amount</th><th>Status</th><th></th></tr></ng-template>
            <ng-template pTemplate="body" let-stmt><tr><td>{{ stmt.statementNumber }}</td><td>{{ stmt.statementDate | date:'MMM d, y' }}</td><td>{{ stmt.dueDate | date:'MMM d, y' }}</td><td>{{ stmt.balanceDue | currency }}</td><td><p-tag [value]="stmt.status" [severity]="getStatusSeverity(stmt.status)"></p-tag></td><td><button pButton icon="pi pi-eye" class="p-button-text" pTooltip="View Details"></button><button pButton icon="pi pi-download" class="p-button-text" pTooltip="Download PDF"></button></td></tr></ng-template>
          </p-table>
        </p-tabPanel>
        <p-tabPanel header="Claims">
          <p-table [value]="claims()" styleClass="p-datatable-sm">
            <ng-template pTemplate="header"><tr><th>Claim #</th><th>Service Date</th><th>Provider</th><th>Description</th><th>Charged</th><th>Insurance Paid</th><th>Your Cost</th><th>Status</th></tr></ng-template>
            <ng-template pTemplate="body" let-claim><tr>
              <td>{{ claim.claimNumber }}</td>
              <td>{{ claim.serviceDate | date:'MMM d, y' }}</td>
              <td>{{ claim.provider }}</td>
              <td>{{ claim.description }}</td>
              <td>{{ claim.chargedAmount | currency }}</td>
              <td>{{ claim.insurancePaid | currency }}</td>
              <td>{{ claim.patientResponsibility | currency }}</td>
              <td><p-tag [value]="claim.status" [severity]="getClaimSeverity(claim.status)"></p-tag></td>
            </tr></ng-template>
            <ng-template pTemplate="emptymessage"><tr><td colspan="8" class="empty-table">No claims found</td></tr></ng-template>
          </p-table>
        </p-tabPanel>
      </p-tabView>
      <p-dialog header="Make a Payment" [(visible)]="showPayDialog" [modal]="true" [style]="{width: '450px'}">
        <div class="pay-form"><p class="pay-amount">Amount Due: <strong>{{ totalBalance | currency }}</strong></p><p class="pay-note">You will be redirected to our secure payment processor.</p></div>
        <ng-template pTemplate="footer"><button pButton label="Cancel" class="p-button-text" (click)="showPayDialog = false"></button><button pButton label="Continue to Payment" icon="pi pi-external-link"></button></ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .billing-page { max-width: 1200px; margin: 0 auto; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { margin: 0; }
    .page-header p { color: var(--text-color-secondary); margin: 0.5rem 0 0; }
    .billing-summary { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
    .summary-card { display: flex; align-items: center; gap: 1rem; padding: 1.5rem; background: var(--surface-card); border-radius: var(--border-radius); box-shadow: var(--card-shadow); }
    .summary-card.balance { background: linear-gradient(135deg, var(--primary-500), var(--primary-700)); color: white; }
    .summary-card.balance .summary-icon { background: rgba(255,255,255,0.2); }
    .summary-card.balance button { background: white; color: var(--primary-700); border: none; }
    .summary-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; background: var(--primary-50); color: var(--primary-500); }
    .summary-icon.pending { background: var(--orange-50); color: var(--orange-500); }
    .summary-icon.insurance { background: var(--green-50); color: var(--green-500); }
    .summary-content { flex: 1; }
    .summary-content .label { display: block; font-size: 0.875rem; opacity: 0.8; }
    .summary-content .value { display: block; font-size: 1.5rem; font-weight: 700; }
    .empty-table { text-align: center; padding: 2rem; color: var(--text-color-secondary); }
    .insurance-card { padding: 1.5rem; background: var(--surface-card); border-radius: var(--border-radius); max-width: 400px; box-shadow: var(--card-shadow); }
    .insurance-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .insurance-header h3 { margin: 0; }
    .insurance-details p { margin: 0.5rem 0; }
    .pay-form { text-align: center; padding: 1rem; }
    .pay-amount { font-size: 1.25rem; }
    .pay-note { color: var(--text-color-secondary); }
  `]
})
export class BillingComponent {
  showPayDialog = false;
  totalBalance = 125.00;
  pendingClaimsCount = 2;

  statements = signal<Statement[]>([
    { id: 'S1', statementNumber: 'STMT-2024-001', statementDate: new Date(Date.now() - 30 * 86400000), dueDate: new Date(Date.now() + 15 * 86400000), totalCharges: 250, insurancePayments: 125, adjustments: 0, patientPayments: 0, balanceDue: 125, status: 'pending', lineItems: [] }
  ]);

  claims = signal<Claim[]>([
    { id: 'C1', claimNumber: 'CLM-2024-0042', serviceDate: new Date(Date.now() - 45 * 86400000), provider: 'Dr. Sarah Johnson', description: 'Annual Physical Exam', chargedAmount: 350, insurancePaid: 280, patientResponsibility: 70, status: 'approved' },
    { id: 'C2', claimNumber: 'CLM-2024-0051', serviceDate: new Date(Date.now() - 20 * 86400000), provider: 'City Lab Services', description: 'Comprehensive Metabolic Panel', chargedAmount: 185, insurancePaid: 148, patientResponsibility: 37, status: 'processing' },
    { id: 'C3', claimNumber: 'CLM-2024-0058', serviceDate: new Date(Date.now() - 10 * 86400000), provider: 'Dr. Michael Chen', description: 'Cardiology Consultation', chargedAmount: 425, insurancePaid: 0, patientResponsibility: 0, status: 'submitted' },
    { id: 'C4', claimNumber: 'CLM-2024-0033', serviceDate: new Date(Date.now() - 60 * 86400000), provider: 'Main Clinic Pharmacy', description: 'Prescription Medication', chargedAmount: 120, insurancePaid: 96, patientResponsibility: 24, status: 'approved' }
  ]);

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'warn' | 'danger' | 'info'> = { paid: 'success', pending: 'warn', overdue: 'danger', partial: 'info' };
    return map[status];
  }

  getClaimSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'warn' | 'danger' | 'info' | 'secondary'> = { approved: 'success', processing: 'info', submitted: 'warn', denied: 'danger', appealed: 'secondary' };
    return map[status];
  }
}
