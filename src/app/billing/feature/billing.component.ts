import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputTextModule } from 'primeng/inputtext';
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

interface PreAuthRequest {
  id: string;
  procedure: string;
  provider: string;
  submittedDate: Date;
  status: 'submitted' | 'under_review' | 'approved' | 'denied';
  refNumber: string;
  steps: string[];
  currentStep: number;
}

interface EobRecord {
  id: string;
  serviceDate: Date;
  provider: string;
  serviceDescription: string;
  plainLanguage: string;
  billedAmount: number;
  insurancePaid: number;
  adjustments: number;
  youOwe: number;
  reasonCode: string;
  reasonExplanation: string;
}

interface ServiceEstimate {
  label: string;
  value: string;
  totalCost: number;
  insuranceCoversPct: number;
  yourCost: number;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'hsa' | 'ach' | 'upi' | 'bpay';
  label: string;
  icon: string;
  saved?: boolean;
  lastFour?: string;
  cardBrand?: string;
}

interface CnasReimbursementClaim {
  id: string;
  claimNumber: string;
  service: string;
  date: Date;
  amount: number;
  currency: string;
  status: 'Approved' | 'Processing' | 'Submitted' | 'Rejected';
  rejectionReason?: string;
}

interface PmJayPackage {
  name: string;
  coveredUpTo: number;
}

interface EmpanelledHospital {
  name: string;
  distance: string;
  type: string;
}

interface DisputeForm {
  statementRef: string;
  reason: string;
  description: string;
  hasDocument: boolean;
}

interface PaymentPlanOption {
  months: number;
  monthlyPayment: number;
  totalAmount: number;
  fee: number;
  label: string;
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TabsModule,
    TableModule,
    TagModule,
    DialogModule,
    TooltipModule,
    SelectModule,
    Textarea,
    RadioButtonModule,
    InputTextModule
  ],
  template: `
    <div class="billing-page">
      <header class="page-header">
        <h1>Billing &amp; Payments</h1>
        <p>Manage your statements, claims, and payments</p>
      </header>

      <!-- Invoice Status Dashboard -->
      <div class="status-dashboard">
        <button
          type="button"
          class="status-tile status-tile--paid"
          [class.status-tile--active]="statusFilter() === 'paid'"
          (click)="toggleStatusFilter('paid')"
          aria-label="Filter by paid statements"
        >
          <div class="status-tile__icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <span class="status-tile__count">{{ paidCount() }}</span>
          <span class="status-tile__label">Paid</span>
        </button>

        <button
          type="button"
          class="status-tile status-tile--unpaid"
          [class.status-tile--active]="statusFilter() === 'unpaid'"
          (click)="toggleStatusFilter('unpaid')"
          aria-label="Filter by unpaid statements"
        >
          <div class="status-tile__icon">
            <i class="pi pi-exclamation-circle"></i>
          </div>
          <span class="status-tile__count">{{ unpaidCount() }}</span>
          <span class="status-tile__label">Unpaid</span>
        </button>

        <button
          type="button"
          class="status-tile status-tile--pending"
          [class.status-tile--active]="statusFilter() === 'insurance'"
          (click)="toggleStatusFilter('insurance')"
          aria-label="Filter by pending insurance claims"
        >
          <div class="status-tile__icon">
            <i class="pi pi-shield"></i>
          </div>
          <span class="status-tile__count">{{ pendingInsuranceCount() }}</span>
          <span class="status-tile__label">Pending Insurance</span>
        </button>

        <button
          type="button"
          class="status-tile status-tile--disputed"
          [class.status-tile--active]="statusFilter() === 'disputed'"
          (click)="toggleStatusFilter('disputed')"
          aria-label="Filter by disputed claims"
        >
          <div class="status-tile__icon">
            <i class="pi pi-times-circle"></i>
          </div>
          <span class="status-tile__count">{{ disputedCount() }}</span>
          <span class="status-tile__label">Disputed</span>
        </button>
      </div>

      @if (statusFilter()) {
        <div class="filter-banner">
          <i class="pi pi-filter"></i>
          <span>Filtering by: <strong>{{ filterLabel() }}</strong></span>
          <button
            type="button"
            pButton
            icon="pi pi-times"
            class="p-button-text p-button-sm filter-clear-btn"
            (click)="toggleStatusFilter(statusFilter()!)"
            pTooltip="Clear filter"
          ></button>
        </div>
      }

      <p-tabs [value]="0">
        <p-tablist>
          <p-tab [value]="0">Overview</p-tab>
          <p-tab [value]="1">Statements</p-tab>
          <p-tab [value]="2">Claims</p-tab>
          <p-tab [value]="3">Cost Estimator</p-tab>
          <p-tab [value]="4">EOB</p-tab>
          <p-tab [value]="5">CNAS Reimbursement</p-tab>
          <p-tab [value]="6">Ayushman Bharat</p-tab>
        </p-tablist>
        <p-tabpanels>
        <!-- ══════════════════════════════════════════════════════
             Overview Tab
        ══════════════════════════════════════════════════════ -->
        <p-tabpanel [value]="0">
          <div class="billing-summary">
            <div class="summary-card balance">
              <div class="summary-icon"><i class="pi pi-wallet"></i></div>
              <div class="summary-content">
                <span class="label">Current Balance</span>
                <span class="value">{{ totalBalance | currency }}</span>
              </div>
              <div class="balance-actions">
                <button pButton label="Pay Now" icon="pi pi-credit-card" (click)="openPayDialog()"></button>
                @if (totalBalance > 100) {
                  <button pButton label="Payment Plan" icon="pi pi-calendar" class="p-button-outlined pay-plan-btn" (click)="showPayPlanDialog = true"></button>
                }
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-icon pending"><i class="pi pi-clock"></i></div>
              <div class="summary-content">
                <span class="label">Pending Claims</span>
                <span class="value">{{ pendingClaimsCount }}</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-icon insurance"><i class="pi pi-shield"></i></div>
              <div class="summary-content">
                <span class="label">Insurance</span>
                <span class="value">Active</span>
              </div>
            </div>
          </div>
          <div class="insurance-card">
            <div class="insurance-header">
              <h3>BlueCross BlueShield</h3>
              <p-tag value="Primary" severity="info"></p-tag>
            </div>
            <div class="insurance-details">
              <p><strong>Member ID:</strong> XYZ123456</p>
              <p><strong>Group #:</strong> GRP789</p>
              <p><strong>Plan:</strong> PPO</p>
            </div>
            <button pButton label="Update Insurance" icon="pi pi-pencil" class="p-button-outlined"></button>
          </div>

          <!-- Deductible Progress -->
          <div class="deductible-section">
            <h3 class="section-title"><i class="pi pi-chart-bar"></i> Deductible &amp; Out-of-Pocket Status</h3>
            <div class="deductible-grid">
              <div class="deductible-card">
                <div class="deductible-label">Annual Deductible</div>
                <div class="deductible-amounts">
                  <span class="met">$350 met</span>
                  <span class="separator">/</span>
                  <span class="total">$500</span>
                </div>
                <div class="progress-bar-wrap">
                  <div class="progress-bar" style="width: 70%"></div>
                </div>
                <div class="deductible-remaining"><strong>$150 remaining</strong></div>
              </div>
              <div class="deductible-card">
                <div class="deductible-label">Out-of-Pocket Maximum</div>
                <div class="deductible-amounts">
                  <span class="met">$425 used</span>
                  <span class="separator">/</span>
                  <span class="total">$3,000</span>
                </div>
                <div class="progress-bar-wrap">
                  <div class="progress-bar progress-bar--oop" style="width: 14.2%"></div>
                </div>
                <div class="deductible-remaining"><strong>$2,575 remaining</strong></div>
              </div>
            </div>
          </div>
        </p-tabpanel>

        <!-- ══════════════════════════════════════════════════════
             Statements Tab
        ══════════════════════════════════════════════════════ -->
        <p-tabpanel [value]="1">
          @if (filteredStatements().length === 0) {
            <div class="empty-state">
              <i class="pi pi-file-o"></i>
              <p>No statements match the current filter.</p>
              @if (statusFilter()) {
                <button pButton label="Clear Filter" class="p-button-outlined p-button-sm" (click)="toggleStatusFilter(statusFilter()!)"></button>
              }
            </div>
          } @else {
            <p-table [value]="filteredStatements()" styleClass="p-datatable-sm statements-table" dataKey="id">
              <ng-template pTemplate="header">
                <tr>
                  <th style="width: 3rem"></th>
                  <th>Statement #</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Total Charges</th>
                  <th>Insurance Paid</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-stmt>
                <tr class="statement-row" [class.statement-row--expanded]="isExpanded(stmt.id)">
                  <td>
                    <button
                      type="button"
                      class="expand-btn"
                      [class.expand-btn--open]="isExpanded(stmt.id)"
                      (click)="toggleStatement(stmt.id)"
                      [pTooltip]="isExpanded(stmt.id) ? 'Collapse line items' : 'Expand line items'"
                      [attr.aria-expanded]="isExpanded(stmt.id)"
                      [attr.aria-label]="'Toggle line items for ' + stmt.statementNumber"
                    >
                      <i class="pi pi-chevron-right"></i>
                    </button>
                  </td>
                  <td><strong>{{ stmt.statementNumber }}</strong></td>
                  <td>{{ stmt.statementDate | date:'MMM d, y' }}</td>
                  <td [class.overdue-date]="isOverdue(stmt.dueDate, stmt.status)">
                    {{ stmt.dueDate | date:'MMM d, y' }}
                    @if (isOverdue(stmt.dueDate, stmt.status)) {
                      <span class="overdue-badge">Overdue</span>
                    }
                  </td>
                  <td>{{ stmt.totalCharges | currency }}</td>
                  <td>{{ stmt.insurancePayments | currency }}</td>
                  <td><strong>{{ stmt.balanceDue | currency }}</strong></td>
                  <td><p-tag [value]="stmt.status" [severity]="getStatusSeverity(stmt.status)"></p-tag></td>
                  <td>
                    <div class="action-btns">
                      <button pButton icon="pi pi-download" class="p-button-text p-button-sm" pTooltip="Download PDF"></button>
                      @if (stmt.balanceDue > 0) {
                        <button pButton icon="pi pi-credit-card" class="p-button-text p-button-sm" pTooltip="Pay this statement" (click)="openPayDialog()"></button>
                      }
                      <button
                        pButton
                        icon="pi pi-flag"
                        class="p-button-text p-button-sm p-button-warning"
                        pTooltip="Dispute this statement"
                        (click)="openDisputeDialog(stmt.statementNumber)"
                      ></button>
                    </div>
                  </td>
                </tr>
                @if (isExpanded(stmt.id)) {
                  <tr class="line-items-row">
                    <td colspan="9" class="line-items-cell">
                      <div class="line-items-container">
                        <div class="line-items-header">
                          <i class="pi pi-list"></i>
                          <span>Itemized Line Items — {{ stmt.lineItems.length }} service(s)</span>
                        </div>
                        @if (stmt.lineItems.length === 0) {
                          <p class="no-line-items">No itemized details available for this statement.</p>
                        } @else {
                          <table class="line-items-table" role="table" [attr.aria-label]="'Line items for ' + stmt.statementNumber">
                            <thead>
                              <tr>
                                <th>Service Date</th>
                                <th>Description</th>
                                <th>CPT Code</th>
                                <th>Provider</th>
                                <th class="amount-col">Charges</th>
                                <th class="amount-col">Insurance Paid</th>
                                <th class="amount-col">Adjustments</th>
                                <th class="amount-col">Your Cost</th>
                              </tr>
                            </thead>
                            <tbody>
                              @for (item of stmt.lineItems; track item.id) {
                                <tr class="line-item">
                                  <td>{{ item.serviceDate | date:'MMM d, y' }}</td>
                                  <td>{{ item.description }}</td>
                                  <td>
                                    @if (item.cptCode) {
                                      <span class="cpt-badge">{{ item.cptCode }}</span>
                                    } @else {
                                      <span class="text-muted">—</span>
                                    }
                                  </td>
                                  <td>{{ item.providerName }}</td>
                                  <td class="amount-col">{{ item.charges | currency }}</td>
                                  <td class="amount-col credit-amount">{{ item.insurancePaid | currency }}</td>
                                  <td class="amount-col credit-amount">{{ item.adjustments | currency }}</td>
                                  <td class="amount-col patient-cost">
                                    <strong>{{ item.patientResponsibility | currency }}</strong>
                                  </td>
                                </tr>
                              }
                            </tbody>
                            <tfoot>
                              <tr class="line-items-totals">
                                <td colspan="4"><strong>Totals</strong></td>
                                <td class="amount-col">
                                  <strong>{{ stmtTotal(stmt, 'charges') | currency }}</strong>
                                </td>
                                <td class="amount-col credit-amount">
                                  <strong>{{ stmtTotal(stmt, 'insurancePaid') | currency }}</strong>
                                </td>
                                <td class="amount-col credit-amount">
                                  <strong>{{ stmtTotal(stmt, 'adjustments') | currency }}</strong>
                                </td>
                                <td class="amount-col patient-cost">
                                  <strong>{{ stmtTotal(stmt, 'patientResponsibility') | currency }}</strong>
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr><td colspan="9" class="empty-table">No statements found</td></tr>
              </ng-template>
            </p-table>
          }
        </p-tabpanel>

        <!-- ══════════════════════════════════════════════════════
             Claims Tab
        ══════════════════════════════════════════════════════ -->
        <p-tabpanel [value]="2">
          @if (filteredClaims().length === 0) {
            <div class="empty-state">
              <i class="pi pi-file-o"></i>
              <p>No claims match the current filter.</p>
              @if (statusFilter()) {
                <button pButton label="Clear Filter" class="p-button-outlined p-button-sm" (click)="toggleStatusFilter(statusFilter()!)"></button>
              }
            </div>
          } @else {
            <p-table [value]="filteredClaims()" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>Claim #</th>
                  <th>Service Date</th>
                  <th>Provider</th>
                  <th>Description</th>
                  <th>Charged</th>
                  <th>Insurance Paid</th>
                  <th>Your Cost</th>
                  <th>Status</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-claim>
                <tr>
                  <td>{{ claim.claimNumber }}</td>
                  <td>{{ claim.serviceDate | date:'MMM d, y' }}</td>
                  <td>{{ claim.provider }}</td>
                  <td>{{ claim.description }}</td>
                  <td>{{ claim.chargedAmount | currency }}</td>
                  <td>{{ claim.insurancePaid | currency }}</td>
                  <td>{{ claim.patientResponsibility | currency }}</td>
                  <td><p-tag [value]="claim.status" [severity]="getClaimSeverity(claim.status)"></p-tag></td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr><td colspan="8" class="empty-table">No claims found</td></tr>
              </ng-template>
            </p-table>
          }

          <!-- Pre-Authorization Tracker -->
          <div class="preauth-section">
            <div class="section-header">
              <h3 class="section-title"><i class="pi pi-verified"></i> Pre-Authorizations</h3>
              <span class="section-subtitle">Track the status of your prior authorization requests</span>
            </div>
            @for (pa of preAuthRequests(); track pa.id) {
              <div class="preauth-card" [class.preauth-card--approved]="pa.status === 'approved'" [class.preauth-card--denied]="pa.status === 'denied'">
                <div class="preauth-card__header">
                  <div class="preauth-card__info">
                    <div class="preauth-procedure">{{ pa.procedure }}</div>
                    <div class="preauth-meta">
                      <span><i class="pi pi-user-md"></i> {{ pa.provider }}</span>
                      <span><i class="pi pi-calendar"></i> Submitted {{ pa.submittedDate | date:'MMM d, y' }}</span>
                      <span><i class="pi pi-tag"></i> Ref: {{ pa.refNumber }}</span>
                    </div>
                  </div>
                  <p-tag
                    [value]="pa.status === 'approved' ? 'Approved' : pa.status === 'denied' ? 'Denied' : 'Under Review'"
                    [severity]="pa.status === 'approved' ? 'success' : pa.status === 'denied' ? 'danger' : 'warn'"
                  ></p-tag>
                </div>
                <!-- Step Progress -->
                <div class="stepper" [attr.aria-label]="'Progress for ' + pa.procedure">
                  @for (step of pa.steps; track step; let i = $index) {
                    <div class="stepper__step">
                      <div
                        class="stepper__dot"
                        [class.stepper__dot--done]="i < pa.currentStep"
                        [class.stepper__dot--active]="i === pa.currentStep - 1"
                        [class.stepper__dot--denied]="pa.status === 'denied' && i === pa.currentStep - 1"
                      >
                        @if (i < pa.currentStep - 1) {
                          <i class="pi pi-check"></i>
                        } @else if (i === pa.currentStep - 1 && pa.status === 'approved') {
                          <i class="pi pi-check"></i>
                        } @else if (i === pa.currentStep - 1 && pa.status === 'denied') {
                          <i class="pi pi-times"></i>
                        } @else {
                          <span>{{ i + 1 }}</span>
                        }
                      </div>
                      <div class="stepper__label" [class.stepper__label--active]="i < pa.currentStep">{{ step }}</div>
                      @if (i < pa.steps.length - 1) {
                        <div class="stepper__line" [class.stepper__line--done]="i < pa.currentStep - 1"></div>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </p-tabpanel>

        <!-- ══════════════════════════════════════════════════════
             Cost Estimator Tab (Feature 5.1)
        ══════════════════════════════════════════════════════ -->
        <p-tabpanel [value]="3">
          <div class="estimator-container">
            <div class="estimator-header">
              <div class="estimator-icon"><i class="pi pi-calculator"></i></div>
              <div>
                <h3>Coverage Check &amp; Cost Estimator</h3>
                <p>See your estimated out-of-pocket cost before scheduling a service.</p>
              </div>
            </div>

            <div class="estimator-search">
              <label for="service-select" class="estimator-label">Select a Service</label>
              <p-select
                inputId="service-select"
                [options]="serviceOptions"
                [(ngModel)]="selectedService"
                optionLabel="label"
                placeholder="Choose a service..."
                [style]="{width: '100%'}"
                (onChange)="onServiceSelect()"
              ></p-select>
            </div>

            @if (currentEstimate()) {
              <div class="estimate-result">
                <div class="estimate-result__title">
                  <i class="pi pi-info-circle"></i>
                  Estimated Cost Breakdown — {{ selectedService?.label }}
                </div>
                <div class="estimate-grid">
                  <div class="estimate-tile estimate-tile--total">
                    <div class="estimate-tile__icon"><i class="pi pi-dollar"></i></div>
                    <div class="estimate-tile__label">Estimated Total Cost</div>
                    <div class="estimate-tile__value">{{ currentEstimate()!.totalCost | currency }}</div>
                  </div>
                  <div class="estimate-tile estimate-tile--insurance">
                    <div class="estimate-tile__icon"><i class="pi pi-shield"></i></div>
                    <div class="estimate-tile__label">Insurance Covers (est.)</div>
                    <div class="estimate-tile__value">{{ currentEstimate()!.insuranceCoversPct }}%</div>
                    <div class="estimate-tile__sub">{{ currentEstimate()!.totalCost * currentEstimate()!.insuranceCoversPct / 100 | currency }}</div>
                  </div>
                  <div class="estimate-tile estimate-tile--oop">
                    <div class="estimate-tile__icon"><i class="pi pi-wallet"></i></div>
                    <div class="estimate-tile__label">Your Estimated Cost</div>
                    <div class="estimate-tile__value">{{ currentEstimate()!.yourCost | currency }}</div>
                  </div>
                </div>

                <!-- Deductible & OOP Status -->
                <div class="estimate-benefits">
                  <div class="benefit-row">
                    <div class="benefit-label"><i class="pi pi-chart-bar"></i> Deductible Status</div>
                    <div class="benefit-bar-wrap">
                      <div class="benefit-bar">
                        <div class="benefit-bar__fill benefit-bar__fill--ded" style="width: 70%"></div>
                      </div>
                      <span class="benefit-numbers">$350 met of $500 &mdash; <strong>$150 remaining</strong></span>
                    </div>
                  </div>
                  <div class="benefit-row">
                    <div class="benefit-label"><i class="pi pi-chart-line"></i> Out-of-Pocket Max</div>
                    <div class="benefit-bar-wrap">
                      <div class="benefit-bar">
                        <div class="benefit-bar__fill benefit-bar__fill--oop" style="width: 14.2%"></div>
                      </div>
                      <span class="benefit-numbers">$425 used of $3,000 &mdash; <strong>$2,575 remaining</strong></span>
                    </div>
                  </div>
                </div>

                <div class="estimate-disclaimer">
                  <i class="pi pi-exclamation-triangle"></i>
                  This is an estimate only. Actual costs may vary based on the specific services rendered, provider network status, and your plan details. Contact your insurance carrier for exact figures.
                </div>
              </div>
            }
          </div>
        </p-tabpanel>

        <!-- ══════════════════════════════════════════════════════
             EOB Tab (Feature 5.3)
        ══════════════════════════════════════════════════════ -->
        <p-tabpanel [value]="4">
          <div class="eob-container">
            <div class="eob-info-banner">
              <div class="eob-info-banner__icon"><i class="pi pi-info-circle"></i></div>
              <div class="eob-info-banner__content">
                <strong>What is an Explanation of Benefits (EOB)?</strong>
                <p>An EOB is a statement from your insurance company that explains what they paid for a medical service and what you owe. It is <em>not</em> a bill — it's a summary of how your claim was processed. Review it to ensure your benefits were applied correctly.</p>
              </div>
            </div>

            @for (eob of eobRecords(); track eob.id) {
              <div class="eob-card">
                <div class="eob-card__header">
                  <div class="eob-card__title">
                    <i class="pi pi-file-pdf eob-doc-icon"></i>
                    <div>
                      <div class="eob-service-desc">{{ eob.serviceDescription }}</div>
                      <div class="eob-meta">
                        <span><i class="pi pi-calendar"></i> {{ eob.serviceDate | date:'MMM d, y' }}</span>
                        <span><i class="pi pi-user"></i> {{ eob.provider }}</span>
                      </div>
                    </div>
                  </div>
                  <button pButton icon="pi pi-download" label="Download EOB" class="p-button-outlined p-button-sm" pTooltip="Download PDF"></button>
                </div>

                <div class="eob-plain-language">
                  <i class="pi pi-comment"></i>
                  <em>{{ eob.plainLanguage }}</em>
                </div>

                <div class="eob-financials">
                  <div class="eob-fin-item">
                    <span class="eob-fin-label">Amount Billed</span>
                    <span class="eob-fin-value">{{ eob.billedAmount | currency }}</span>
                  </div>
                  <div class="eob-fin-divider">-</div>
                  <div class="eob-fin-item eob-fin-item--credit">
                    <span class="eob-fin-label">Insurance Paid</span>
                    <span class="eob-fin-value">{{ eob.insurancePaid | currency }}</span>
                  </div>
                  <div class="eob-fin-divider">-</div>
                  <div class="eob-fin-item eob-fin-item--credit">
                    <span class="eob-fin-label">Adjustments</span>
                    <span class="eob-fin-value">{{ eob.adjustments | currency }}</span>
                  </div>
                  <div class="eob-fin-divider">=</div>
                  <div class="eob-fin-item eob-fin-item--owe">
                    <span class="eob-fin-label">You Owe</span>
                    <span class="eob-fin-value eob-owe-amount">{{ eob.youOwe | currency }}</span>
                  </div>
                </div>

                <div class="eob-reason">
                  <span class="eob-reason-code">{{ eob.reasonCode }}</span>
                  <span class="eob-reason-text">{{ eob.reasonExplanation }}</span>
                </div>
              </div>
            }
          </div>
        </p-tabpanel>

        <!-- ══════════════════════════════════════════════════════
             CNAS Reimbursement Tab (Feature 13.3)
        ══════════════════════════════════════════════════════ -->
        <p-tabpanel [value]="5">
          <div class="cnas-container">
            <!-- Header -->
            <div class="cnas-header">
              <div class="cnas-flag-accent">
                <span class="cnas-flag-stripe cnas-flag-blue"></span>
                <span class="cnas-flag-stripe cnas-flag-yellow"></span>
                <span class="cnas-flag-stripe cnas-flag-red"></span>
              </div>
              <div>
                <h3 class="cnas-title">CNAS Reimbursement Tracker</h3>
                <p class="cnas-subtitle">Casa Nationala de Asigurari de Sanatate — National Health Insurance House</p>
              </div>
            </div>

            <!-- Summary Tiles -->
            <div class="cnas-summary-grid">
              <div class="cnas-summary-tile">
                <div class="cnas-summary-icon cnas-icon-total"><i class="pi pi-file-edit"></i></div>
                <div class="cnas-summary-content">
                  <span class="cnas-summary-label">Total Claimed</span>
                  <span class="cnas-summary-value">885 RON</span>
                </div>
              </div>
              <div class="cnas-summary-tile">
                <div class="cnas-summary-icon cnas-icon-approved"><i class="pi pi-check-circle"></i></div>
                <div class="cnas-summary-content">
                  <span class="cnas-summary-label">Total Approved</span>
                  <span class="cnas-summary-value cnas-val-approved">150 RON</span>
                </div>
              </div>
              <div class="cnas-summary-tile">
                <div class="cnas-summary-icon cnas-icon-pending"><i class="pi pi-clock"></i></div>
                <div class="cnas-summary-content">
                  <span class="cnas-summary-label">Pending</span>
                  <span class="cnas-summary-value cnas-val-pending">535 RON</span>
                </div>
              </div>
              <div class="cnas-summary-tile">
                <div class="cnas-summary-icon cnas-icon-rejected"><i class="pi pi-times-circle"></i></div>
                <div class="cnas-summary-content">
                  <span class="cnas-summary-label">Rejected</span>
                  <span class="cnas-summary-value cnas-val-rejected">200 RON</span>
                </div>
              </div>
            </div>

            <!-- Claims Table -->
            <p-table [value]="cnasReimbursementClaims()" styleClass="p-datatable-sm cnas-table">
              <ng-template pTemplate="header">
                <tr>
                  <th>Claim Number</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-claim>
                <tr>
                  <td><strong class="cnas-claim-number">{{ claim.claimNumber }}</strong></td>
                  <td>{{ claim.service }}</td>
                  <td>{{ claim.date | date:'MMM d, y' }}</td>
                  <td><strong>{{ claim.amount }} {{ claim.currency }}</strong></td>
                  <td>
                    <div class="cnas-status-cell">
                      <span
                        class="cnas-status-badge"
                        [class.cnas-status-badge--approved]="claim.status === 'Approved'"
                        [class.cnas-status-badge--processing]="claim.status === 'Processing'"
                        [class.cnas-status-badge--submitted]="claim.status === 'Submitted'"
                        [class.cnas-status-badge--rejected]="claim.status === 'Rejected'"
                      >{{ claim.status }}</span>
                      @if (claim.status === 'Rejected' && claim.rejectionReason) {
                        <i
                          class="pi pi-info-circle cnas-rejection-info"
                          [pTooltip]="claim.rejectionReason"
                          tooltipPosition="left"
                        ></i>
                      }
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>

            <!-- Processing Note -->
            <div class="cnas-processing-note">
              <i class="pi pi-info-circle"></i>
              <span>Claims are processed by <strong>Casa Nationala de Asigurari de Sanatate</strong>. Processing time: <strong>15-30 business days</strong>.</span>
            </div>
          </div>
        </p-tabpanel>

        <!-- ══════════════════════════════════════════════════════
             Ayushman Bharat PM-JAY Tab (Feature 13.4)
        ══════════════════════════════════════════════════════ -->
        <p-tabpanel [value]="6">
          <div class="pmjay-container">

            <!-- Beneficiary Status Card -->
            <div class="pmjay-status-card">
              <div class="pmjay-card-header">
                <div class="pmjay-logo-area">
                  <div class="pmjay-logo-badge">
                    <span class="pmjay-logo-ab">AB</span>
                    <span class="pmjay-logo-text">PM-JAY</span>
                  </div>
                  <div>
                    <div class="pmjay-scheme-name">Ayushman Bharat — Pradhan Mantri Jan Arogya Yojana</div>
                    <div class="pmjay-scheme-sub">Government of India — National Health Authority</div>
                  </div>
                </div>
                <span class="pmjay-active-badge">
                  <i class="pi pi-check-circle"></i> Active Beneficiary
                </span>
              </div>

              <div class="pmjay-details-grid">
                <div class="pmjay-detail-item">
                  <span class="pmjay-detail-label">PM-JAY ID</span>
                  <span class="pmjay-detail-value pmjay-id-value">PMJAY-MH-2024-987654</span>
                </div>
                <div class="pmjay-detail-item">
                  <span class="pmjay-detail-label">Family ID</span>
                  <span class="pmjay-detail-value">FAM-MH-12345</span>
                </div>
                <div class="pmjay-detail-item">
                  <span class="pmjay-detail-label">Covered Members</span>
                  <span class="pmjay-detail-value">4 Family Members</span>
                </div>
                <div class="pmjay-detail-item">
                  <span class="pmjay-detail-label">Annual Coverage</span>
                  <span class="pmjay-detail-value pmjay-coverage-value">&#8377;5,00,000</span>
                </div>
              </div>

              <!-- Coverage Progress -->
              <div class="pmjay-coverage-progress">
                <div class="pmjay-progress-header">
                  <span class="pmjay-progress-label">Coverage Used This Year</span>
                  <span class="pmjay-progress-amounts">
                    <strong>&#8377;45,000</strong> used of <strong>&#8377;5,00,000</strong>
                    <span class="pmjay-pct-badge">9% used</span>
                  </span>
                </div>
                <div class="pmjay-progress-bar-wrap">
                  <div class="pmjay-progress-bar" style="width: 9%"></div>
                </div>
                <div class="pmjay-progress-remaining">
                  <i class="pi pi-shield"></i>
                  <strong>&#8377;4,55,000 remaining</strong> coverage available
                </div>
              </div>
            </div>

            <!-- Eligible Packages -->
            <div class="pmjay-section">
              <h4 class="pmjay-section-title"><i class="pi pi-list"></i> Eligible Health Packages</h4>
              <div class="pmjay-packages-grid">
                @for (pkg of pmJayPackages; track pkg.name) {
                  <div class="pmjay-package-card">
                    <div class="pmjay-package-icon"><i class="pi pi-heart-fill"></i></div>
                    <div class="pmjay-package-info">
                      <div class="pmjay-package-name">{{ pkg.name }}</div>
                      <div class="pmjay-package-coverage">Covered up to <strong>&#8377;{{ pkg.coveredUpTo | number }}</strong></div>
                    </div>
                    <span class="pmjay-package-tag">Covered</span>
                  </div>
                }
              </div>
            </div>

            <!-- Hospital Empanelment Check -->
            <div class="pmjay-section">
              <h4 class="pmjay-section-title"><i class="pi pi-map-marker"></i> Find Empanelled Hospitals</h4>
              <p class="pmjay-hospital-desc">Search for PM-JAY empanelled hospitals near you for cashless treatment.</p>
              <div class="pmjay-hospital-search">
                <input
                  pInputText
                  [(ngModel)]="pmJayHospitalSearch"
                  placeholder="Enter city, pincode, or hospital name..."
                  class="pmjay-search-input"
                  (keyup.enter)="searchEmpanelledHospitals()"
                />
                <button pButton label="Search" icon="pi pi-search" (click)="searchEmpanelledHospitals()"></button>
              </div>

              @if (pmJaySearchPerformed) {
                <div class="pmjay-hospital-results">
                  @for (hospital of pmJaySearchResults; track hospital.name) {
                    <div class="pmjay-hospital-card">
                      <div class="pmjay-hospital-icon"><i class="pi pi-building"></i></div>
                      <div class="pmjay-hospital-info">
                        <div class="pmjay-hospital-name">{{ hospital.name }}</div>
                        <div class="pmjay-hospital-meta">
                          <span><i class="pi pi-map-marker"></i> {{ hospital.distance }}</span>
                          <span class="pmjay-hospital-type">{{ hospital.type }}</span>
                        </div>
                      </div>
                      <span class="pmjay-empanelled-badge"><i class="pi pi-verified"></i> Empanelled</span>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Scheme Note -->
            <div class="pmjay-scheme-note">
              <i class="pi pi-info-circle"></i>
              <span><strong>Ayushman Bharat PM-JAY</strong> provides cashless and paperless coverage at empanelled hospitals across India. Present your PM-JAY ID or Aadhaar at the hospital's Ayushman Mitra desk for admission.</span>
            </div>

          </div>
        </p-tabpanel>

        </p-tabpanels>
      </p-tabs>

      <!-- ════════════════════════════════════════════════════════
           Payment Dialog — Feature 5.6 (Payment Method Selection)
      ════════════════════════════════════════════════════════ -->
      <p-dialog header="Make a Payment" [(visible)]="showPayDialog" [modal]="true" [style]="{width: '520px'}" [draggable]="false">
        @if (!paySuccess) {
          <div class="pay-form">
            <p class="pay-amount">Amount Due: <strong>{{ totalBalance | currency }}</strong></p>

            <!-- Saved Methods -->
            <div class="pay-section-label">Saved Payment Methods</div>
            @for (pm of savedPaymentMethods; track pm.id) {
              <label class="pay-method-row pay-method-row--saved" [class.pay-method-row--selected]="selectedPaymentMethod === pm.id">
                <input type="radio" name="paymentMethod" [value]="pm.id" [(ngModel)]="selectedPaymentMethod" class="sr-only">
                <div class="pay-method-icon"><i class="{{ pm.icon }}"></i></div>
                <div class="pay-method-info">
                  <div class="pay-method-label">{{ pm.label }}</div>
                  @if (pm.lastFour) {
                    <div class="pay-method-sub">{{ pm.cardBrand }} ending in {{ pm.lastFour }}</div>
                  }
                </div>
                <i class="pi pi-check-circle pay-method-check" [class.pay-method-check--visible]="selectedPaymentMethod === pm.id"></i>
              </label>
            }

            <!-- New Payment Methods -->
            <div class="pay-section-label">Pay With</div>
            @for (pm of newPaymentMethods; track pm.id) {
              <label class="pay-method-row" [class.pay-method-row--selected]="selectedPaymentMethod === pm.id">
                <input type="radio" name="paymentMethod" [value]="pm.id" [(ngModel)]="selectedPaymentMethod" class="sr-only">
                <div class="pay-method-icon">
                  @if (pm.type === 'upi') {
                    <span class="upi-badge">UPI</span>
                  } @else if (pm.type === 'bpay') {
                    <span class="bpay-badge">BPAY</span>
                  } @else {
                    <i class="{{ pm.icon }}"></i>
                  }
                </div>
                <div class="pay-method-info">
                  <div class="pay-method-label">{{ pm.label }}</div>
                  @if (pm.type === 'upi') {
                    <div class="pay-method-sub">Instant payment via PhonePe, GPay, Paytm &amp; more</div>
                  } @else if (pm.type === 'bpay') {
                    <div class="pay-method-sub">Pay via your Australian banking app or online banking</div>
                  }
                </div>
                <i class="pi pi-check-circle pay-method-check" [class.pay-method-check--visible]="selectedPaymentMethod === pm.id"></i>
              </label>
            }

            <!-- Conditional Fields -->
            @if (selectedPaymentMethod === 'new-card' || selectedPaymentMethod === 'hsa') {
              <div class="card-fields">
                <div class="card-field-group">
                  <label class="card-field-label">Card Number</label>
                  <input pInputText placeholder="1234 5678 9012 3456" class="card-input" maxlength="19" />
                </div>
                <div class="card-field-row">
                  <div class="card-field-group">
                    <label class="card-field-label">Expiry</label>
                    <input pInputText placeholder="MM / YY" class="card-input" maxlength="7" />
                  </div>
                  <div class="card-field-group">
                    <label class="card-field-label">CVV</label>
                    <input pInputText placeholder="CVV" class="card-input" maxlength="4" type="password" />
                  </div>
                </div>
                <div class="card-field-group">
                  <label class="card-field-label">Name on Card</label>
                  <input pInputText placeholder="Jane Doe" class="card-input" />
                </div>
              </div>
            }

            @if (selectedPaymentMethod === 'paypal') {
              <div class="paypal-note">
                <i class="pi pi-external-link"></i>
                You will be redirected to PayPal to complete your payment securely.
              </div>
            }

            @if (selectedPaymentMethod === 'ach') {
              <div class="card-fields ach-fields">
                <div class="ach-header-row">
                  <i class="pi pi-building ach-bank-icon"></i>
                  <div>
                    <div class="ach-header-title">Direct Debit / ACH Bank Transfer</div>
                    <div class="ach-header-sub">Authorize a direct debit from your bank account</div>
                  </div>
                </div>
                <div class="card-field-group">
                  <label class="card-field-label">Bank Name</label>
                  <input pInputText [(ngModel)]="achBankName" name="achBankName" placeholder="e.g. Chase, Bank of America" class="card-input" />
                </div>
                <div class="card-field-group">
                  <label class="card-field-label">BSB / Routing Number</label>
                  <input pInputText [(ngModel)]="achRoutingNumber" name="achRoutingNumber" placeholder="9-digit routing number" class="card-input" maxlength="9" />
                </div>
                <div class="card-field-group">
                  <label class="card-field-label">Account Number</label>
                  <input pInputText [(ngModel)]="achAccountNumber" name="achAccountNumber" placeholder="Account number" class="card-input" />
                </div>
                <div class="ach-consent-row">
                  <input type="checkbox" id="ach-consent" [(ngModel)]="achConsentChecked" name="achConsent" class="ach-consent-checkbox" />
                  <label for="ach-consent" class="ach-consent-label">
                    I authorize recurring payments from this account
                  </label>
                </div>
                <button
                  pButton
                  label="Authorize Direct Debit"
                  icon="pi pi-building"
                  class="ach-authorize-btn"
                  [disabled]="!achBankName || !achRoutingNumber || !achAccountNumber || !achConsentChecked"
                  (click)="authorizeDirectDebit()"
                ></button>
                <div class="ach-processing-note">
                  <i class="pi pi-clock"></i>
                  Direct debit payments are processed within 3–5 business days.
                </div>
              </div>
            }

            <!-- UPI Fields (Feature 13.1) -->
            @if (selectedPaymentMethod === 'upi') {
              <div class="card-fields upi-fields">
                @if (upiState === 'idle') {
                  <div class="upi-intro">
                    <div class="upi-intro-icon">
                      <span class="upi-badge-large">UPI</span>
                    </div>
                    <p class="upi-intro-text">Enter your UPI ID to initiate an instant payment request directly to your registered UPI app.</p>
                  </div>
                  <div class="card-field-group">
                    <label class="card-field-label">UPI ID</label>
                    <input
                      pInputText
                      [(ngModel)]="upiId"
                      placeholder="username&#64;upi (e.g. john&#64;okaxis)"
                      class="card-input"
                      name="upiId"
                    />
                    <span class="upi-hint">Accepted: &#64;okaxis, &#64;oksbi, &#64;okicici, &#64;paytm, &#64;gpay and more</span>
                  </div>
                  <button
                    pButton
                    label="Verify &amp; Pay"
                    icon="pi pi-mobile"
                    [disabled]="!upiId || upiId.trim().length < 5"
                    (click)="initiateUpiPayment()"
                    class="upi-pay-btn"
                  ></button>
                } @else if (upiState === 'pending') {
                  <div class="upi-pending">
                    <div class="upi-pending-icon">
                      <i class="pi pi-spin pi-spinner"></i>
                    </div>
                    <p class="upi-pending-title">Payment Request Sent</p>
                    <p class="upi-pending-msg">Payment request sent to your UPI app. Please approve on your phone.</p>
                    <p class="upi-pending-id">UPI ID: <strong>{{ upiId }}</strong></p>
                  </div>
                } @else if (upiState === 'success') {
                  <div class="upi-success">
                    <div class="upi-success-icon"><i class="pi pi-check-circle"></i></div>
                    <p class="upi-success-title">UPI Payment Approved!</p>
                    <p class="upi-success-msg">Your payment of <strong>{{ totalBalance | currency }}</strong> was successfully authorized via UPI.</p>
                    <p class="upi-ref">Transaction Ref: <strong>UPI{{ upiTxnRef }}</strong></p>
                  </div>
                }
              </div>
            }

            <!-- BPAY Fields (Feature 13.2) -->
            @if (selectedPaymentMethod === 'bpay') {
              <div class="card-fields bpay-fields">
                <div class="bpay-header-row">
                  <span class="bpay-badge-large">BPAY</span>
                  <span class="bpay-tagline">Pay via your banking app or online banking</span>
                </div>
                <div class="bpay-details-grid">
                  <div class="bpay-detail-item">
                    <span class="bpay-detail-label">Biller Code</span>
                    <div class="bpay-detail-value-row">
                      <strong class="bpay-code-value">12345</strong>
                      <span class="bpay-readonly-badge">Read-only</span>
                    </div>
                  </div>
                  <div class="bpay-detail-item">
                    <span class="bpay-detail-label">Reference Number</span>
                    <strong class="bpay-code-value">{{ bpayReferenceNumber }}</strong>
                  </div>
                  <div class="bpay-detail-item">
                    <span class="bpay-detail-label">Amount</span>
                    <strong class="bpay-code-value">{{ totalBalance | currency:'AUD':'symbol':'1.2-2' }}</strong>
                  </div>
                </div>
                <div class="bpay-instructions">
                  <i class="pi pi-info-circle"></i>
                  Use these details in your banking app or online banking to complete payment via BPAY.
                </div>
                <button
                  pButton
                  [label]="bpayCopied ? 'Copied!' : 'Copy Biller Code + Reference'"
                  [icon]="bpayCopied ? 'pi pi-check' : 'pi pi-copy'"
                  class="p-button-outlined bpay-copy-btn"
                  (click)="copyBpayDetails()"
                ></button>
                <div class="bpay-processing-note">
                  <i class="pi pi-clock"></i>
                  BPAY payments typically take <strong>1-2 business days</strong> to process.
                </div>
              </div>
            }

            <div class="pay-secure-note">
              <i class="pi pi-lock"></i> Payments are processed securely via 256-bit SSL encryption.
            </div>
          </div>
          <ng-template pTemplate="footer">
            <button pButton label="Cancel" class="p-button-text" (click)="showPayDialog = false"></button>
            @if (selectedPaymentMethod !== 'upi') {
              <button
                pButton
                [label]="selectedPaymentMethod === 'bpay' ? 'I Have Paid via BPAY' : 'Submit Payment'"
                icon="pi pi-check"
                [disabled]="!selectedPaymentMethod"
                (click)="submitPayment()"
              ></button>
            }
          </ng-template>
        } @else {
          <div class="pay-success">
            <div class="pay-success__icon"><i class="pi pi-check-circle"></i></div>
            <h3>Payment Submitted!</h3>
            <p>Your payment of <strong>{{ totalBalance | currency }}</strong> has been received.</p>
            <p class="pay-success__ref">Confirmation #: <strong>PAY-{{ payConfirmRef }}</strong></p>
          </div>
          <ng-template pTemplate="footer">
            <button pButton label="Close" (click)="closePayDialog()"></button>
          </ng-template>
        }
      </p-dialog>

      <!-- ════════════════════════════════════════════════════════
           Dispute Dialog — Feature 5.4
      ════════════════════════════════════════════════════════ -->
      <p-dialog header="Dispute a Statement" [(visible)]="showDisputeDialog" [modal]="true" [style]="{width: '480px'}" [draggable]="false">
        @if (!disputeSuccess) {
          <div class="dispute-form">
            <div class="dispute-ref-row">
              <i class="pi pi-file-edit"></i>
              <span>Statement Reference: <strong>{{ disputeStatementRef }}</strong></span>
            </div>

            <div class="form-field">
              <label class="form-label">Dispute Reason <span class="required">*</span></label>
              <p-select
                [options]="disputeReasonOptions"
                [(ngModel)]="disputeForm.reason"
                placeholder="Select a reason..."
                [style]="{width: '100%'}"
              ></p-select>
            </div>

            <div class="form-field">
              <label class="form-label">Description <span class="required">*</span></label>
              <textarea
                pInputTextarea
                [(ngModel)]="disputeForm.description"
                rows="4"
                placeholder="Please describe the issue in detail..."
                style="width: 100%"
              ></textarea>
            </div>

            <div class="form-field">
              <label class="form-label">Supporting Documents (optional)</label>
              <div class="upload-zone" (click)="disputeForm.hasDocument = !disputeForm.hasDocument">
                @if (!disputeForm.hasDocument) {
                  <i class="pi pi-upload"></i>
                  <span>Click to attach files (EOB, receipts, etc.)</span>
                } @else {
                  <i class="pi pi-file-check" style="color: var(--green-600)"></i>
                  <span style="color: var(--green-700)">document_evidence.pdf attached</span>
                }
              </div>
            </div>

            <div class="dispute-note">
              <i class="pi pi-info-circle"></i>
              We will review your dispute within 5–7 business days and contact you via your portal messages.
            </div>
          </div>
          <ng-template pTemplate="footer">
            <button pButton label="Cancel" class="p-button-text" (click)="showDisputeDialog = false"></button>
            <button
              pButton
              label="Submit Dispute"
              icon="pi pi-send"
              [disabled]="!disputeForm.reason || !disputeForm.description"
              (click)="submitDispute()"
            ></button>
          </ng-template>
        } @else {
          <div class="pay-success">
            <div class="pay-success__icon" style="background: var(--orange-50); color: var(--orange-600)"><i class="pi pi-check-circle"></i></div>
            <h3>Dispute Submitted</h3>
            <p>Your dispute for <strong>{{ disputeStatementRef }}</strong> has been received.</p>
            <p class="pay-success__ref">Dispute Reference: <strong>DISP-{{ disputeConfirmRef }}</strong></p>
            <p style="font-size: 0.875rem; color: var(--text-color-secondary)">Our billing team will review and respond within 5–7 business days.</p>
          </div>
          <ng-template pTemplate="footer">
            <button pButton label="Close" (click)="closeDisputeDialog()"></button>
          </ng-template>
        }
      </p-dialog>

      <!-- ════════════════════════════════════════════════════════
           Payment Plan Dialog — Feature 5.5
      ════════════════════════════════════════════════════════ -->
      <p-dialog header="Set Up a Payment Plan" [(visible)]="showPayPlanDialog" [modal]="true" [style]="{width: '480px'}" [draggable]="false">
        @if (!payPlanSuccess) {
          <div class="payplan-form">
            <p class="payplan-intro">Split your balance of <strong>{{ totalBalance | currency }}</strong> into affordable monthly installments.</p>

            <div class="payplan-options">
              @for (plan of paymentPlanOptions; track plan.months) {
                <label class="payplan-option" [class.payplan-option--selected]="selectedPlanMonths === plan.months">
                  <input type="radio" name="payplan" [value]="plan.months" [(ngModel)]="selectedPlanMonths" class="sr-only">
                  <div class="payplan-option__header">
                    <span class="payplan-months">{{ plan.months }} Months</span>
                    <span class="payplan-badge" [class.payplan-badge--free]="plan.fee === 0">{{ plan.fee === 0 ? 'No Fee' : '+' + (plan.fee | currency) + ' fee' }}</span>
                  </div>
                  <div class="payplan-option__monthly">{{ plan.monthlyPayment | currency }}<span class="payplan-per">/mo</span></div>
                  <div class="payplan-option__total">Total: {{ plan.totalAmount | currency }}</div>
                  <i class="pi pi-check-circle payplan-check" [class.payplan-check--visible]="selectedPlanMonths === plan.months"></i>
                </label>
              }
            </div>

            <div class="payplan-note">
              <i class="pi pi-info-circle"></i>
              Your first payment will be charged today. Subsequent payments will be automatically charged on the same day each month.
            </div>
          </div>
          <ng-template pTemplate="footer">
            <button pButton label="Cancel" class="p-button-text" (click)="showPayPlanDialog = false"></button>
            <button
              pButton
              label="Confirm Payment Plan"
              icon="pi pi-check"
              [disabled]="!selectedPlanMonths"
              (click)="submitPaymentPlan()"
            ></button>
          </ng-template>
        } @else {
          <div class="pay-success">
            <div class="pay-success__icon" style="background: var(--blue-50); color: var(--blue-600)"><i class="pi pi-check-circle"></i></div>
            <h3>Payment Plan Activated!</h3>
            <p>Your <strong>{{ selectedPlanMonths }}-month plan</strong> has been set up successfully.</p>
            @if (selectedPlanOption()) {
              <p>You will be charged <strong>{{ selectedPlanOption()!.monthlyPayment | currency }}/month</strong> starting today.</p>
            }
            <p class="pay-success__ref">Plan Reference: <strong>PLAN-{{ payPlanRef }}</strong></p>
          </div>
          <ng-template pTemplate="footer">
            <button pButton label="Close" (click)="closePayPlanDialog()"></button>
          </ng-template>
        }
      </p-dialog>
    </div>
  `,
  styles: [`
    /* ─── Page Layout ─────────────────────────────────────────────── */
    .billing-page { max-width: 1200px; margin: 0 auto; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { margin: 0; }
    .page-header p { color: var(--text-color-secondary); margin: 0.5rem 0 0; }

    /* ─── Status Dashboard Tiles ──────────────────────────────────── */
    .status-dashboard {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .status-tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.25rem 1rem;
      background: var(--surface-card);
      border-radius: var(--border-radius);
      box-shadow: var(--card-shadow, 0 1px 4px rgba(0,0,0,.08));
      border: 2px solid transparent;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
      text-align: center;
      font-family: inherit;
    }

    .status-tile:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,.14);
    }

    .status-tile__icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .status-tile__count {
      font-size: 2rem;
      font-weight: 700;
      line-height: 1;
    }

    .status-tile__label {
      font-size: 0.8125rem;
      color: var(--text-color-secondary);
      font-weight: 500;
      letter-spacing: 0.01em;
    }

    /* Paid — green */
    .status-tile--paid .status-tile__icon { background: var(--green-50, #f0fdf4); color: var(--green-600, #16a34a); }
    .status-tile--paid .status-tile__count { color: var(--green-700, #15803d); }
    .status-tile--paid.status-tile--active {
      border-color: var(--green-500, #22c55e);
      background: var(--green-50, #f0fdf4);
    }

    /* Unpaid — orange */
    .status-tile--unpaid .status-tile__icon { background: var(--orange-50, #fff7ed); color: var(--orange-600, #ea580c); }
    .status-tile--unpaid .status-tile__count { color: var(--orange-700, #c2410c); }
    .status-tile--unpaid.status-tile--active {
      border-color: var(--orange-500, #f97316);
      background: var(--orange-50, #fff7ed);
    }

    /* Pending Insurance — blue */
    .status-tile--pending .status-tile__icon { background: var(--blue-50, #eff6ff); color: var(--blue-600, #2563eb); }
    .status-tile--pending .status-tile__count { color: var(--blue-700, #1d4ed8); }
    .status-tile--pending.status-tile--active {
      border-color: var(--blue-500, #3b82f6);
      background: var(--blue-50, #eff6ff);
    }

    /* Disputed — red */
    .status-tile--disputed .status-tile__icon { background: var(--red-50, #fef2f2); color: var(--red-600, #dc2626); }
    .status-tile--disputed .status-tile__count { color: var(--red-700, #b91c1c); }
    .status-tile--disputed.status-tile--active {
      border-color: var(--red-500, #ef4444);
      background: var(--red-50, #fef2f2);
    }

    /* ─── Filter Banner ───────────────────────────────────────────── */
    .filter-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: var(--blue-50, #eff6ff);
      border: 1px solid var(--blue-200, #bfdbfe);
      border-radius: var(--border-radius);
      margin-bottom: 1rem;
      font-size: 0.875rem;
      color: var(--blue-800, #1e40af);
    }
    .filter-clear-btn { margin-left: auto; }

    /* ─── Overview / Summary ──────────────────────────────────────── */
    .billing-summary { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
    .summary-card { display: flex; align-items: center; gap: 1rem; padding: 1.5rem; background: var(--surface-card); border-radius: var(--border-radius); box-shadow: var(--card-shadow); }
    .summary-card.balance { background: linear-gradient(135deg, var(--primary-500), var(--primary-700)); color: white; }
    .summary-card.balance .summary-icon { background: rgba(255,255,255,0.3); color: white; }
    .summary-card.balance .summary-icon i { color: white; font-size: 1.5rem; }
    .summary-card.balance button { background: white; color: var(--primary-700); border: none; }
    .summary-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; background: var(--primary-50); color: var(--primary-500); }
    .summary-icon.pending { background: var(--orange-50); color: var(--orange-500); }
    .summary-icon.insurance { background: var(--green-50); color: var(--green-500); }
    .summary-content { flex: 1; }
    .summary-content .label { display: block; font-size: 0.875rem; opacity: 0.8; }
    .summary-content .value { display: block; font-size: 1.5rem; font-weight: 700; }

    .balance-actions { display: flex; flex-direction: column; gap: 0.5rem; }
    .pay-plan-btn { background: rgba(255,255,255,0.15) !important; border-color: rgba(255,255,255,0.5) !important; color: white !important; }
    .pay-plan-btn:hover { background: rgba(255,255,255,0.25) !important; }

    .insurance-card { padding: 1.5rem; background: var(--surface-card); border-radius: var(--border-radius); max-width: 400px; box-shadow: var(--card-shadow); margin-bottom: 2rem; }
    .insurance-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .insurance-header h3 { margin: 0; }
    .insurance-details p { margin: 0.5rem 0; }

    /* ─── Deductible Section ──────────────────────────────────────── */
    .deductible-section { margin-top: 1.5rem; }
    .section-title { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; font-weight: 600; margin: 0 0 1rem; color: var(--text-color); }
    .deductible-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; max-width: 700px; }
    .deductible-card { background: var(--surface-card); border-radius: var(--border-radius); padding: 1.25rem; box-shadow: var(--card-shadow); }
    .deductible-label { font-size: 0.875rem; color: var(--text-color-secondary); font-weight: 500; margin-bottom: 0.5rem; }
    .deductible-amounts { font-size: 0.9375rem; margin-bottom: 0.625rem; }
    .deductible-amounts .met { color: var(--primary-600, #4f46e5); font-weight: 600; }
    .deductible-amounts .separator { color: var(--text-color-secondary); margin: 0 0.25rem; }
    .deductible-amounts .total { color: var(--text-color-secondary); }
    .progress-bar-wrap { background: var(--surface-border); border-radius: 999px; height: 8px; overflow: hidden; margin-bottom: 0.5rem; }
    .progress-bar { height: 100%; background: var(--primary-500); border-radius: 999px; }
    .progress-bar--oop { background: var(--blue-400, #60a5fa); }
    .deductible-remaining { font-size: 0.8125rem; color: var(--text-color-secondary); }

    /* ─── Statements Table ────────────────────────────────────────── */
    .action-btns { display: flex; align-items: center; gap: 0.125rem; }

    .expand-btn {
      background: none;
      border: 1px solid var(--surface-border);
      border-radius: 6px;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s, transform 0.2s;
      color: var(--text-color-secondary);
    }
    .expand-btn:hover { background: var(--surface-hover); color: var(--primary-color); }
    .expand-btn i { transition: transform 0.2s ease; font-size: 0.75rem; }
    .expand-btn--open i { transform: rotate(90deg); }

    .statement-row--expanded td { background: var(--surface-ground) !important; }
    .overdue-date { color: var(--red-600, #dc2626); }
    .overdue-badge {
      display: inline-block;
      font-size: 0.6875rem;
      background: var(--red-100, #fee2e2);
      color: var(--red-700, #b91c1c);
      padding: 1px 6px;
      border-radius: 999px;
      margin-left: 6px;
      font-weight: 600;
      vertical-align: middle;
    }

    /* ─── Line Items Sub-table ────────────────────────────────────── */
    .line-items-row > td { padding: 0 !important; }
    .line-items-cell { padding: 0 !important; }

    .line-items-container {
      background: var(--surface-ground);
      border-top: 2px solid var(--primary-200, #a5b4fc);
      padding: 1rem 1.5rem 1.25rem;
    }

    .line-items-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--primary-700, #3730a3);
      margin-bottom: 0.875rem;
    }

    .line-items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }

    .line-items-table thead tr { background: var(--surface-section, #f8fafc); }

    .line-items-table thead th {
      padding: 0.5rem 0.75rem;
      text-align: left;
      font-weight: 600;
      color: var(--text-color-secondary);
      border-bottom: 1px solid var(--surface-border);
      white-space: nowrap;
    }

    .line-items-table thead th.amount-col,
    .line-items-table tbody td.amount-col,
    .line-items-table tfoot td.amount-col {
      text-align: right;
    }

    .line-item td {
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--surface-border);
      vertical-align: middle;
    }

    .line-item:last-of-type td { border-bottom: none; }

    .line-items-totals td {
      padding: 0.5rem 0.75rem;
      border-top: 2px solid var(--surface-border);
      background: var(--surface-section, #f8fafc);
    }

    .cpt-badge {
      display: inline-block;
      font-size: 0.75rem;
      background: var(--blue-50, #eff6ff);
      color: var(--blue-700, #1d4ed8);
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      letter-spacing: 0.03em;
      border: 1px solid var(--blue-200, #bfdbfe);
    }

    .credit-amount { color: var(--green-700, #15803d); }
    .patient-cost { color: var(--text-color); }
    .text-muted { color: var(--text-color-secondary); }

    .no-line-items {
      text-align: center;
      padding: 1rem;
      color: var(--text-color-secondary);
      font-style: italic;
    }

    /* ─── Pre-Authorization Tracker ───────────────────────────────── */
    .preauth-section {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--surface-border);
    }

    .section-header { margin-bottom: 1.25rem; }
    .section-header .section-title { margin-bottom: 0.25rem; }
    .section-subtitle { font-size: 0.875rem; color: var(--text-color-secondary); }

    .preauth-card {
      background: var(--surface-card);
      border-radius: var(--border-radius);
      border: 1px solid var(--surface-border);
      padding: 1.25rem 1.5rem;
      margin-bottom: 1rem;
      box-shadow: var(--card-shadow);
    }
    .preauth-card--approved { border-left: 4px solid var(--green-500, #22c55e); }
    .preauth-card--denied { border-left: 4px solid var(--red-500, #ef4444); }

    .preauth-card__header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; gap: 1rem; }
    .preauth-procedure { font-size: 1rem; font-weight: 600; color: var(--text-color); margin-bottom: 0.375rem; }
    .preauth-meta { display: flex; flex-wrap: wrap; gap: 0.75rem 1.25rem; font-size: 0.8125rem; color: var(--text-color-secondary); }
    .preauth-meta span { display: flex; align-items: center; gap: 0.3rem; }

    /* Stepper */
    .stepper { display: flex; align-items: flex-start; gap: 0; }
    .stepper__step { display: flex; align-items: center; flex: 1; }
    .stepper__step:last-child { flex: none; }

    .stepper__dot {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid var(--surface-border);
      background: var(--surface-ground);
      color: var(--text-color-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8125rem;
      font-weight: 600;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
    }

    .stepper__dot--done {
      background: var(--primary-500);
      border-color: var(--primary-500);
      color: white;
    }

    .stepper__dot--active {
      background: var(--primary-500);
      border-color: var(--primary-500);
      color: white;
      box-shadow: 0 0 0 4px var(--primary-100, #e0e7ff);
    }

    .stepper__dot--denied {
      background: var(--red-500, #ef4444);
      border-color: var(--red-500, #ef4444);
      box-shadow: 0 0 0 4px var(--red-100, #fee2e2);
    }

    .stepper__line {
      flex: 1;
      height: 2px;
      background: var(--surface-border);
      margin: 0 0;
      position: relative;
      top: -0.5rem;
      align-self: flex-start;
      margin-top: 1rem;
    }
    .stepper__line--done { background: var(--primary-500); }

    .stepper__label {
      position: absolute;
      top: 2.25rem;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.6875rem;
      white-space: nowrap;
      color: var(--text-color-secondary);
      font-weight: 500;
    }
    .stepper__label--active { color: var(--primary-700, #3730a3); font-weight: 600; }

    .stepper__step { position: relative; padding-bottom: 1.75rem; }

    /* ─── Cost Estimator ──────────────────────────────────────────── */
    .estimator-container { max-width: 760px; }

    .estimator-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.75rem;
    }
    .estimator-icon {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      background: var(--primary-50);
      color: var(--primary-600);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    .estimator-header h3 { margin: 0 0 0.25rem; }
    .estimator-header p { margin: 0; color: var(--text-color-secondary); font-size: 0.9375rem; }

    .estimator-search { margin-bottom: 1.75rem; }
    .estimator-label { display: block; font-weight: 600; font-size: 0.9375rem; margin-bottom: 0.5rem; }

    .estimate-result {
      background: var(--surface-card);
      border-radius: var(--border-radius);
      border: 1px solid var(--surface-border);
      padding: 1.5rem;
      box-shadow: var(--card-shadow);
      animation: fadeIn 0.25s ease;
    }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

    .estimate-result__title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--primary-700, #3730a3);
      margin-bottom: 1.25rem;
    }

    .estimate-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .estimate-tile {
      border-radius: var(--border-radius);
      padding: 1.125rem;
      text-align: center;
      border: 1px solid var(--surface-border);
    }
    .estimate-tile--total { background: var(--surface-ground); }
    .estimate-tile--insurance { background: var(--green-50, #f0fdf4); border-color: var(--green-200, #bbf7d0); }
    .estimate-tile--oop { background: var(--orange-50, #fff7ed); border-color: var(--orange-200, #fed7aa); }

    .estimate-tile__icon { font-size: 1.25rem; margin-bottom: 0.375rem; color: var(--text-color-secondary); }
    .estimate-tile--insurance .estimate-tile__icon { color: var(--green-600, #16a34a); }
    .estimate-tile--oop .estimate-tile__icon { color: var(--orange-600, #ea580c); }

    .estimate-tile__label { font-size: 0.75rem; color: var(--text-color-secondary); font-weight: 500; margin-bottom: 0.5rem; }
    .estimate-tile__value { font-size: 1.625rem; font-weight: 700; color: var(--text-color); }
    .estimate-tile--insurance .estimate-tile__value { color: var(--green-700, #15803d); }
    .estimate-tile--oop .estimate-tile__value { color: var(--orange-700, #c2410c); }
    .estimate-tile__sub { font-size: 0.8125rem; color: var(--green-600, #16a34a); margin-top: 0.25rem; }

    .estimate-benefits { margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.875rem; }
    .benefit-row { display: flex; align-items: center; gap: 1rem; }
    .benefit-label { font-size: 0.8125rem; font-weight: 600; color: var(--text-color-secondary); display: flex; align-items: center; gap: 0.35rem; white-space: nowrap; min-width: 165px; }
    .benefit-bar-wrap { flex: 1; }
    .benefit-bar { background: var(--surface-border); border-radius: 999px; height: 8px; overflow: hidden; margin-bottom: 0.25rem; }
    .benefit-bar__fill { height: 100%; border-radius: 999px; }
    .benefit-bar__fill--ded { background: var(--primary-500); }
    .benefit-bar__fill--oop { background: var(--blue-400, #60a5fa); }
    .benefit-numbers { font-size: 0.75rem; color: var(--text-color-secondary); }

    .estimate-disclaimer {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
      font-size: 0.8125rem;
      color: var(--text-color-secondary);
      background: var(--yellow-50, #fefce8);
      border: 1px solid var(--yellow-200, #fef08a);
      border-radius: 6px;
      padding: 0.75rem 1rem;
    }
    .estimate-disclaimer i { color: var(--yellow-600, #ca8a04); flex-shrink: 0; margin-top: 0.1rem; }

    /* ─── EOB Viewer ──────────────────────────────────────────────── */
    .eob-container { max-width: 840px; }

    .eob-info-banner {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--blue-50, #eff6ff);
      border: 1px solid var(--blue-200, #bfdbfe);
      border-radius: var(--border-radius);
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
    }
    .eob-info-banner__icon { color: var(--blue-600, #2563eb); font-size: 1.25rem; flex-shrink: 0; padding-top: 0.1rem; }
    .eob-info-banner__content strong { display: block; margin-bottom: 0.25rem; color: var(--blue-800, #1e40af); }
    .eob-info-banner__content p { margin: 0; color: var(--blue-700, #1d4ed8); line-height: 1.5; }

    .eob-card {
      background: var(--surface-card);
      border-radius: var(--border-radius);
      border: 1px solid var(--surface-border);
      padding: 1.25rem 1.5rem;
      margin-bottom: 1rem;
      box-shadow: var(--card-shadow);
    }

    .eob-card__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.875rem;
      gap: 1rem;
    }
    .eob-card__title { display: flex; align-items: flex-start; gap: 0.875rem; }
    .eob-doc-icon { font-size: 1.5rem; color: var(--red-500, #ef4444); margin-top: 0.125rem; flex-shrink: 0; }
    .eob-service-desc { font-size: 1rem; font-weight: 600; color: var(--text-color); margin-bottom: 0.25rem; }
    .eob-meta { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; font-size: 0.8125rem; color: var(--text-color-secondary); }
    .eob-meta span { display: flex; align-items: center; gap: 0.3rem; }

    .eob-plain-language {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      background: var(--surface-ground);
      border-radius: 6px;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      margin-bottom: 1rem;
      line-height: 1.5;
    }
    .eob-plain-language i { color: var(--primary-400); flex-shrink: 0; margin-top: 0.1rem; }

    .eob-financials {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      padding: 0.875rem 1rem;
      background: var(--surface-section, #f8fafc);
      border-radius: 6px;
      margin-bottom: 0.875rem;
    }
    .eob-fin-item { text-align: center; }
    .eob-fin-label { font-size: 0.6875rem; color: var(--text-color-secondary); font-weight: 500; display: block; margin-bottom: 0.2rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .eob-fin-value { font-size: 1rem; font-weight: 600; color: var(--text-color); }
    .eob-fin-item--credit .eob-fin-value { color: var(--green-700, #15803d); }
    .eob-fin-item--owe .eob-fin-value { color: var(--orange-700, #c2410c); }
    .eob-owe-amount { font-size: 1.125rem; }
    .eob-fin-divider { font-size: 1.25rem; color: var(--text-color-secondary); font-weight: 300; align-self: flex-end; padding-bottom: 0.125rem; }

    .eob-reason {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      font-size: 0.8125rem;
    }
    .eob-reason-code {
      background: var(--surface-border);
      border-radius: 4px;
      padding: 2px 8px;
      font-weight: 600;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      white-space: nowrap;
    }
    .eob-reason-text { color: var(--text-color-secondary); }

    /* ─── Empty State ─────────────────────────────────────────────── */
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-color-secondary);
    }
    .empty-state i { font-size: 3rem; display: block; margin-bottom: 1rem; opacity: 0.4; }
    .empty-state p { margin: 0 0 1rem; }
    .empty-table { text-align: center; padding: 2rem; color: var(--text-color-secondary); }

    /* ─── Payment Dialog ──────────────────────────────────────────── */
    .pay-form { padding: 0.5rem 0; }
    .pay-amount { font-size: 1.25rem; margin: 0 0 1rem; }

    .pay-section-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-color-secondary);
      margin: 1rem 0 0.5rem;
    }

    .pay-method-row {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.75rem 1rem;
      border: 1.5px solid var(--surface-border);
      border-radius: var(--border-radius);
      margin-bottom: 0.5rem;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .pay-method-row:hover { border-color: var(--primary-300); background: var(--surface-hover); }
    .pay-method-row--selected { border-color: var(--primary-500) !important; background: var(--primary-50) !important; }
    .pay-method-row--saved { background: var(--surface-ground); }

    .pay-method-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: var(--surface-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.125rem;
      color: var(--text-color-secondary);
      flex-shrink: 0;
    }
    .pay-method-row--selected .pay-method-icon { background: var(--primary-100); color: var(--primary-600); }

    .pay-method-info { flex: 1; }
    .pay-method-label { font-weight: 600; font-size: 0.9375rem; color: var(--text-color); }
    .pay-method-sub { font-size: 0.8125rem; color: var(--text-color-secondary); }

    .pay-method-check { color: var(--surface-border); font-size: 1.125rem; transition: color 0.15s; }
    .pay-method-check--visible { color: var(--primary-500); }

    .card-fields { margin-top: 1rem; padding: 1rem; background: var(--surface-ground); border-radius: var(--border-radius); display: flex; flex-direction: column; gap: 0.75rem; }
    .card-field-group { display: flex; flex-direction: column; gap: 0.3rem; }
    .card-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .card-field-label { font-size: 0.8125rem; font-weight: 600; color: var(--text-color-secondary); }
    .card-input { width: 100% !important; }

    .paypal-note {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      margin-top: 1rem;
      padding: 0.875rem 1rem;
      background: var(--blue-50, #eff6ff);
      border: 1px solid var(--blue-200, #bfdbfe);
      border-radius: var(--border-radius);
      font-size: 0.9rem;
      color: var(--blue-700, #1d4ed8);
    }

    .pay-secure-note {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      font-size: 0.8125rem;
      color: var(--text-color-secondary);
    }

    /* ─── Dispute Dialog ──────────────────────────────────────────── */
    .dispute-form { padding: 0.5rem 0; display: flex; flex-direction: column; gap: 1rem; }
    .dispute-ref-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.75rem 1rem;
      background: var(--surface-ground);
      border-radius: 6px;
      font-size: 0.9375rem;
      color: var(--text-color-secondary);
    }
    .form-field { display: flex; flex-direction: column; gap: 0.375rem; }
    .form-label { font-size: 0.875rem; font-weight: 600; color: var(--text-color); }
    .required { color: var(--red-500, #ef4444); }

    .upload-zone {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;
      padding: 1.25rem;
      border: 2px dashed var(--surface-border);
      border-radius: var(--border-radius);
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .upload-zone:hover { border-color: var(--primary-400); background: var(--primary-50); }

    .dispute-note {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
      font-size: 0.8125rem;
      color: var(--text-color-secondary);
      background: var(--surface-ground);
      border-radius: 6px;
      padding: 0.75rem 1rem;
    }

    /* ─── Payment Plan Dialog ─────────────────────────────────────── */
    .payplan-form { padding: 0.5rem 0; }
    .payplan-intro { font-size: 0.9375rem; color: var(--text-color-secondary); margin: 0 0 1.25rem; }
    .payplan-options { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.25rem; }

    .payplan-option {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 1rem 1.25rem;
      border: 1.5px solid var(--surface-border);
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .payplan-option:hover { border-color: var(--primary-300); background: var(--surface-hover); }
    .payplan-option--selected { border-color: var(--primary-500) !important; background: var(--primary-50) !important; }

    .payplan-option__header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem; }
    .payplan-months { font-weight: 700; font-size: 1rem; color: var(--text-color); }
    .payplan-badge {
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--orange-100, #fed7aa);
      color: var(--orange-700, #c2410c);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .payplan-badge--free { background: var(--green-100, #dcfce7); color: var(--green-700, #15803d); }
    .payplan-option__monthly { font-size: 1.5rem; font-weight: 700; color: var(--primary-600, #4f46e5); }
    .payplan-per { font-size: 1rem; font-weight: 400; color: var(--text-color-secondary); }
    .payplan-option__total { font-size: 0.8125rem; color: var(--text-color-secondary); }

    .payplan-check { position: absolute; top: 1rem; right: 1.25rem; font-size: 1.125rem; color: var(--surface-border); transition: color 0.15s; }
    .payplan-check--visible { color: var(--primary-500); }

    .payplan-note {
      display: flex;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--text-color-secondary);
      background: var(--surface-ground);
      border-radius: 6px;
      padding: 0.75rem 1rem;
    }

    /* ─── Success / Confirmation States ───────────────────────────── */
    .pay-success {
      text-align: center;
      padding: 1.5rem 1rem;
    }
    .pay-success__icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--green-50, #f0fdf4);
      color: var(--green-600, #16a34a);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin: 0 auto 1rem;
    }
    .pay-success h3 { margin: 0 0 0.5rem; font-size: 1.25rem; }
    .pay-success p { margin: 0.375rem 0; color: var(--text-color-secondary); }
    .pay-success__ref { font-size: 0.9375rem; }

    /* ─── Screen-reader only ───────────────────────────────────────── */
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }

    /* ═══════════════════════════════════════════════════════════════
       UPI Payment Method Styles (Feature 13.1)
    ═══════════════════════════════════════════════════════════════ */
    .upi-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #5f259f, #00a3e0);
      color: white;
      font-size: 0.625rem;
      font-weight: 900;
      letter-spacing: 0.05em;
      border-radius: 4px;
      padding: 2px 5px;
      line-height: 1.2;
    }

    .upi-fields { gap: 1rem; }

    .upi-intro {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 0.75rem 0;
    }
    .upi-intro-icon { flex-shrink: 0; }
    .upi-badge-large {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #5f259f, #00a3e0);
      color: white;
      font-size: 0.75rem;
      font-weight: 900;
      letter-spacing: 0.06em;
      border-radius: 6px;
      padding: 4px 10px;
      min-width: 48px;
    }
    .upi-intro-text { font-size: 0.875rem; color: var(--text-color-secondary); line-height: 1.5; margin: 0; }
    .upi-hint { font-size: 0.75rem; color: var(--text-color-secondary); margin-top: 0.25rem; display: block; }

    .upi-pay-btn { width: 100%; justify-content: center; margin-top: 0.25rem; }

    .upi-pending {
      text-align: center;
      padding: 1rem 0;
    }
    .upi-pending-icon {
      font-size: 2.5rem;
      color: var(--orange-500, #f97316);
      margin-bottom: 0.75rem;
    }
    .upi-pending-title { font-size: 1.0625rem; font-weight: 700; margin: 0 0 0.375rem; color: var(--text-color); }
    .upi-pending-msg { font-size: 0.9rem; color: var(--text-color-secondary); margin: 0 0 0.5rem; }
    .upi-pending-id { font-size: 0.875rem; color: var(--text-color-secondary); margin: 0; }

    .upi-success {
      text-align: center;
      padding: 0.75rem 0;
    }
    .upi-success-icon {
      font-size: 2.5rem;
      color: var(--green-500, #22c55e);
      margin-bottom: 0.75rem;
    }
    .upi-success-title { font-size: 1.0625rem; font-weight: 700; margin: 0 0 0.375rem; color: var(--green-700, #15803d); }
    .upi-success-msg { font-size: 0.9rem; color: var(--text-color-secondary); margin: 0 0 0.375rem; }
    .upi-ref { font-size: 0.8125rem; color: var(--text-color-secondary); margin: 0; }

    /* ═══════════════════════════════════════════════════════════════
       BPAY Payment Method Styles (Feature 13.2)
    ═══════════════════════════════════════════════════════════════ */
    .bpay-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #003087;
      color: white;
      font-size: 0.625rem;
      font-weight: 900;
      letter-spacing: 0.05em;
      border-radius: 4px;
      padding: 2px 5px;
      line-height: 1.2;
    }

    .bpay-fields { gap: 1rem; }

    .bpay-header-row {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--surface-border);
    }
    .bpay-badge-large {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #003087;
      color: white;
      font-size: 0.875rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      border-radius: 6px;
      padding: 6px 14px;
      min-width: 58px;
      flex-shrink: 0;
    }
    .bpay-tagline { font-size: 0.875rem; color: var(--text-color-secondary); }

    .bpay-details-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.875rem;
      background: var(--surface-section, #f8fafc);
      border-radius: 8px;
      padding: 1rem;
      border: 1px solid var(--surface-border);
    }
    .bpay-detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .bpay-detail-label { font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-color-secondary); }
    .bpay-code-value { font-size: 1.125rem; font-weight: 700; color: #003087; }
    .bpay-detail-value-row { display: flex; align-items: center; gap: 0.5rem; }
    .bpay-readonly-badge { font-size: 0.6rem; background: var(--surface-border); color: var(--text-color-secondary); padding: 1px 5px; border-radius: 3px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }

    .bpay-instructions {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--blue-700, #1d4ed8);
      background: var(--blue-50, #eff6ff);
      border: 1px solid var(--blue-200, #bfdbfe);
      border-radius: 6px;
      padding: 0.75rem 1rem;
      line-height: 1.5;
    }
    .bpay-instructions i { flex-shrink: 0; margin-top: 0.1rem; }

    .bpay-copy-btn { width: 100%; justify-content: center; }

    .bpay-processing-note {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--text-color-secondary);
      padding: 0.5rem 0;
    }
    .bpay-processing-note i { color: var(--orange-500, #f97316); }

    /* ═══════════════════════════════════════════════════════════════
       CNAS Reimbursement Styles (Feature 13.3)
    ═══════════════════════════════════════════════════════════════ */
    .cnas-container { max-width: 900px; }

    .cnas-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .cnas-flag-accent {
      display: flex;
      gap: 0;
      border-radius: 4px;
      overflow: hidden;
      flex-shrink: 0;
      box-shadow: 0 1px 4px rgba(0,0,0,0.15);
    }
    .cnas-flag-stripe { width: 10px; height: 52px; }
    .cnas-flag-blue { background: #002B7F; }
    .cnas-flag-yellow { background: #FCD116; }
    .cnas-flag-red { background: #CE1126; }

    .cnas-title { margin: 0 0 0.25rem; font-size: 1.125rem; font-weight: 700; color: var(--text-color); }
    .cnas-subtitle { margin: 0; font-size: 0.875rem; color: var(--text-color-secondary); }

    .cnas-summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .cnas-summary-tile {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      background: var(--surface-card);
      border-radius: var(--border-radius);
      border: 1px solid var(--surface-border);
      padding: 1rem 1.125rem;
      box-shadow: var(--card-shadow);
    }
    .cnas-summary-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.125rem;
      flex-shrink: 0;
    }
    .cnas-icon-total { background: var(--primary-50); color: var(--primary-600); }
    .cnas-icon-approved { background: var(--green-50, #f0fdf4); color: var(--green-600, #16a34a); }
    .cnas-icon-pending { background: var(--orange-50, #fff7ed); color: var(--orange-600, #ea580c); }
    .cnas-icon-rejected { background: var(--red-50, #fef2f2); color: var(--red-600, #dc2626); }

    .cnas-summary-content { display: flex; flex-direction: column; gap: 0.125rem; }
    .cnas-summary-label { font-size: 0.75rem; color: var(--text-color-secondary); font-weight: 500; }
    .cnas-summary-value { font-size: 1.0625rem; font-weight: 700; color: var(--text-color); }
    .cnas-val-approved { color: var(--green-700, #15803d); }
    .cnas-val-pending { color: var(--orange-700, #c2410c); }
    .cnas-val-rejected { color: var(--red-700, #b91c1c); }

    .cnas-claim-number { font-family: monospace; font-size: 0.875rem; color: var(--primary-700, #3730a3); }

    .cnas-status-cell { display: flex; align-items: center; gap: 0.5rem; }

    .cnas-status-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 10px;
      border-radius: 999px;
      letter-spacing: 0.02em;
    }
    .cnas-status-badge--approved { background: var(--green-100, #dcfce7); color: var(--green-800, #166534); }
    .cnas-status-badge--processing { background: var(--orange-100, #ffedd5); color: var(--orange-800, #9a3412); }
    .cnas-status-badge--submitted { background: var(--blue-100, #dbeafe); color: var(--blue-800, #1e40af); }
    .cnas-status-badge--rejected { background: var(--red-100, #fee2e2); color: var(--red-800, #991b1b); }

    .cnas-rejection-info { color: var(--red-500, #ef4444); cursor: help; font-size: 0.9375rem; }

    .cnas-processing-note {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      margin-top: 1.25rem;
      padding: 0.875rem 1rem;
      background: var(--surface-ground);
      border-radius: 8px;
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      border: 1px solid var(--surface-border);
      line-height: 1.5;
    }
    .cnas-processing-note i { color: var(--blue-500, #3b82f6); flex-shrink: 0; margin-top: 0.1rem; }

    /* ═══════════════════════════════════════════════════════════════
       PM-JAY / Ayushman Bharat Styles (Feature 13.4)
    ═══════════════════════════════════════════════════════════════ */
    .pmjay-container { max-width: 900px; display: flex; flex-direction: column; gap: 1.5rem; }

    .pmjay-status-card {
      background: var(--surface-card);
      border-radius: var(--border-radius);
      border: 1px solid var(--surface-border);
      box-shadow: var(--card-shadow);
      overflow: hidden;
    }

    .pmjay-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: linear-gradient(135deg, #FF9933 0%, #FF6600 35%, #138808 65%, #000080 100%);
      background: linear-gradient(135deg, #f97316 0%, #ea580c 40%, #16a34a 70%, #1e40af 100%);
    }

    .pmjay-logo-area {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .pmjay-logo-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(255,255,255,0.95);
      border-radius: 8px;
      padding: 4px 8px;
      min-width: 52px;
      flex-shrink: 0;
    }
    .pmjay-logo-ab {
      font-size: 0.625rem;
      font-weight: 800;
      color: #16a34a;
      letter-spacing: 0.05em;
    }
    .pmjay-logo-text {
      font-size: 0.875rem;
      font-weight: 900;
      color: #1e40af;
      letter-spacing: 0.04em;
    }
    .pmjay-scheme-name { font-size: 0.9375rem; font-weight: 700; color: white; margin-bottom: 0.2rem; }
    .pmjay-scheme-sub { font-size: 0.75rem; color: rgba(255,255,255,0.8); }

    .pmjay-active-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      background: rgba(255,255,255,0.95);
      color: var(--green-700, #15803d);
      font-size: 0.8125rem;
      font-weight: 700;
      padding: 0.375rem 0.875rem;
      border-radius: 999px;
      flex-shrink: 0;
      white-space: nowrap;
    }

    .pmjay-details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1px;
      background: var(--surface-border);
      border-bottom: 1px solid var(--surface-border);
    }
    .pmjay-detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 1rem 1.5rem;
      background: var(--surface-card);
    }
    .pmjay-detail-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; color: var(--text-color-secondary); }
    .pmjay-detail-value { font-size: 0.9375rem; font-weight: 600; color: var(--text-color); }
    .pmjay-id-value { font-family: monospace; color: var(--primary-700, #3730a3); }
    .pmjay-coverage-value { color: var(--green-700, #15803d); font-size: 1.0625rem; }

    .pmjay-coverage-progress { padding: 1.25rem 1.5rem; }
    .pmjay-progress-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.625rem; }
    .pmjay-progress-label { font-size: 0.875rem; font-weight: 600; color: var(--text-color-secondary); }
    .pmjay-progress-amounts { font-size: 0.875rem; color: var(--text-color-secondary); display: flex; align-items: center; gap: 0.5rem; }
    .pmjay-pct-badge { background: var(--green-100, #dcfce7); color: var(--green-700, #15803d); font-size: 0.6875rem; font-weight: 700; padding: 1px 7px; border-radius: 999px; }
    .pmjay-progress-bar-wrap { background: var(--surface-border); border-radius: 999px; height: 10px; overflow: hidden; margin-bottom: 0.625rem; }
    .pmjay-progress-bar { height: 100%; background: linear-gradient(90deg, var(--green-500, #22c55e), var(--green-400, #4ade80)); border-radius: 999px; }
    .pmjay-progress-remaining { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8125rem; color: var(--green-700, #15803d); }
    .pmjay-progress-remaining i { font-size: 0.875rem; }

    .pmjay-section { background: var(--surface-card); border-radius: var(--border-radius); border: 1px solid var(--surface-border); padding: 1.25rem 1.5rem; box-shadow: var(--card-shadow); }
    .pmjay-section-title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9375rem; font-weight: 700; margin: 0 0 1rem; color: var(--text-color); }

    .pmjay-packages-grid { display: flex; flex-direction: column; gap: 0.625rem; }

    .pmjay-package-card {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.875rem 1rem;
      background: var(--surface-ground);
      border-radius: 8px;
      border: 1px solid var(--surface-border);
      transition: background 0.15s;
    }
    .pmjay-package-card:hover { background: var(--surface-hover); }
    .pmjay-package-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: var(--green-50, #f0fdf4);
      color: var(--green-600, #16a34a);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
    }
    .pmjay-package-info { flex: 1; }
    .pmjay-package-name { font-size: 0.9rem; font-weight: 600; color: var(--text-color); margin-bottom: 0.15rem; }
    .pmjay-package-coverage { font-size: 0.8125rem; color: var(--text-color-secondary); }
    .pmjay-package-coverage strong { color: var(--green-700, #15803d); }
    .pmjay-package-tag {
      font-size: 0.6875rem;
      font-weight: 700;
      background: var(--green-100, #dcfce7);
      color: var(--green-700, #15803d);
      padding: 2px 8px;
      border-radius: 999px;
      white-space: nowrap;
    }

    .pmjay-hospital-desc { font-size: 0.875rem; color: var(--text-color-secondary); margin: 0 0 0.875rem; }

    .pmjay-hospital-search {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .pmjay-search-input { flex: 1; }

    .pmjay-hospital-results { display: flex; flex-direction: column; gap: 0.625rem; margin-top: 0.5rem; }

    .pmjay-hospital-card {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.875rem 1rem;
      background: var(--surface-ground);
      border-radius: 8px;
      border: 1px solid var(--surface-border);
    }
    .pmjay-hospital-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: var(--blue-50, #eff6ff);
      color: var(--blue-600, #2563eb);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
    }
    .pmjay-hospital-info { flex: 1; }
    .pmjay-hospital-name { font-size: 0.9rem; font-weight: 600; color: var(--text-color); margin-bottom: 0.15rem; }
    .pmjay-hospital-meta { display: flex; align-items: center; gap: 0.75rem; font-size: 0.8125rem; color: var(--text-color-secondary); }
    .pmjay-hospital-type {
      background: var(--surface-border);
      border-radius: 4px;
      padding: 1px 7px;
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--text-color-secondary);
    }
    .pmjay-empanelled-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.6875rem;
      font-weight: 700;
      background: var(--green-100, #dcfce7);
      color: var(--green-700, #15803d);
      padding: 3px 9px;
      border-radius: 999px;
      white-space: nowrap;
    }

    .pmjay-scheme-note {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      padding: 1rem 1.25rem;
      background: var(--blue-50, #eff6ff);
      border: 1px solid var(--blue-200, #bfdbfe);
      border-radius: 8px;
      font-size: 0.875rem;
      color: var(--blue-700, #1d4ed8);
      line-height: 1.5;
    }
    .pmjay-scheme-note i { flex-shrink: 0; margin-top: 0.1rem; color: var(--blue-600, #2563eb); }

    /* ─── Screen-reader only ───────────────────────────────────────── */
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }

    /* ─── Responsive ──────────────────────────────────────────────── */
    @media (max-width: 768px) {
      .status-dashboard { grid-template-columns: repeat(2, 1fr); }
      .billing-summary { grid-template-columns: 1fr; }
      .estimate-grid { grid-template-columns: 1fr; }
      .deductible-grid { grid-template-columns: 1fr; }
      .eob-financials { gap: 0.5rem; }
      .cnas-summary-grid { grid-template-columns: repeat(2, 1fr); }
      .bpay-details-grid { grid-template-columns: 1fr; }
      .pmjay-details-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 480px) {
      .status-dashboard { grid-template-columns: repeat(2, 1fr); }
      .line-items-container { padding: 0.75rem; overflow-x: auto; }
      .card-field-row { grid-template-columns: 1fr; }
      .cnas-summary-grid { grid-template-columns: 1fr 1fr; }
      .pmjay-card-header { flex-direction: column; }
      .pmjay-hospital-search { flex-direction: column; }
    }

    /* ═══════════════════════════════════════════════════════════════
       Direct Debit / ACH Styles
    ═══════════════════════════════════════════════════════════════ */
    .ach-fields { gap: 1rem; }

    .ach-header-row {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--surface-border);
    }
    .ach-bank-icon {
      font-size: 1.5rem;
      color: var(--primary-500);
      flex-shrink: 0;
      margin-top: 0.1rem;
    }
    .ach-header-title { font-size: 0.9375rem; font-weight: 700; color: var(--text-color); margin-bottom: 0.15rem; }
    .ach-header-sub { font-size: 0.8rem; color: var(--text-color-secondary); }

    .ach-consent-row {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      padding: 0.75rem;
      background: var(--surface-section, #f8fafc);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
    }
    .ach-consent-checkbox { margin-top: 0.1rem; cursor: pointer; accent-color: var(--primary-500); }
    .ach-consent-label { font-size: 0.875rem; color: var(--text-color); cursor: pointer; line-height: 1.4; }

    .ach-authorize-btn { width: 100%; justify-content: center; }

    .ach-processing-note {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--text-color-secondary);
      padding: 0.5rem 0;
    }
    .ach-processing-note i { color: var(--orange-500, #f97316); }
  `]
})
export class BillingComponent {
  // ── Dialog visibility ──────────────────────────────────────────────────
  showPayDialog = false;
  showDisputeDialog = false;
  showPayPlanDialog = false;

  // ── Payment dialog state ───────────────────────────────────────────────
  paySuccess = false;
  payConfirmRef = '';
  selectedPaymentMethod = '';

  // ── Dispute dialog state ───────────────────────────────────────────────
  disputeSuccess = false;
  disputeConfirmRef = '';
  disputeStatementRef = '';
  disputeForm: DisputeForm = { statementRef: '', reason: '', description: '', hasDocument: false };

  // ── Payment plan dialog state ──────────────────────────────────────────
  payPlanSuccess = false;
  payPlanRef = '';
  selectedPlanMonths: number | null = null;

  // ── UPI payment state (Feature 13.1) ──────────────────────────────────
  upiId = '';
  upiState: 'idle' | 'pending' | 'success' = 'idle';
  upiTxnRef = '';

  // ── BPAY payment state (Feature 13.2) ─────────────────────────────────
  bpayReferenceNumber = 'REF-' + Math.floor(100000000 + Math.random() * 900000000).toString();
  bpayCopied = false;

  // ── Direct Debit / ACH payment state ──────────────────────────────────
  achBankName = '';
  achRoutingNumber = '';
  achAccountNumber = '';
  achConsentChecked = false;

  // ── Core billing data ──────────────────────────────────────────────────
  totalBalance = 125.00;
  pendingClaimsCount = 2;

  // ── Expanded row tracking ──────────────────────────────────────────────
  expandedStatements = signal<Set<string>>(new Set());

  // ── Status filter ──────────────────────────────────────────────────────
  statusFilter = signal<string | null>(null);

  // ── Statements with full line items ───────────────────────────────────
  statements = signal<Statement[]>([
    {
      id: 'S1',
      statementNumber: 'STMT-2024-001',
      statementDate: new Date(Date.now() - 30 * 86400000),
      dueDate: new Date(Date.now() + 15 * 86400000),
      totalCharges: 450,
      insurancePayments: 325,
      adjustments: 0,
      patientPayments: 0,
      balanceDue: 125,
      status: 'pending',
      lineItems: [
        {
          id: 'LI1',
          serviceDate: new Date(Date.now() - 45 * 86400000),
          description: 'Office Visit - Established Patient',
          providerName: 'Dr. Sarah Johnson',
          cptCode: '99214',
          charges: 250,
          insurancePaid: 200,
          adjustments: 0,
          patientResponsibility: 50
        },
        {
          id: 'LI2',
          serviceDate: new Date(Date.now() - 45 * 86400000),
          description: 'Comprehensive Metabolic Panel',
          providerName: 'City Lab Services',
          cptCode: '80053',
          charges: 120,
          insurancePaid: 85,
          adjustments: 0,
          patientResponsibility: 35
        },
        {
          id: 'LI3',
          serviceDate: new Date(Date.now() - 45 * 86400000),
          description: 'Lipid Panel',
          providerName: 'City Lab Services',
          cptCode: '80061',
          charges: 80,
          insurancePaid: 40,
          adjustments: 0,
          patientResponsibility: 40
        }
      ]
    },
    {
      id: 'S2',
      statementNumber: 'STMT-2024-002',
      statementDate: new Date(Date.now() - 90 * 86400000),
      dueDate: new Date(Date.now() - 45 * 86400000),
      totalCharges: 350,
      insurancePayments: 280,
      adjustments: 20,
      patientPayments: 50,
      balanceDue: 0,
      status: 'paid',
      lineItems: [
        {
          id: 'LI4',
          serviceDate: new Date(Date.now() - 100 * 86400000),
          description: 'Annual Physical Exam',
          providerName: 'Dr. Sarah Johnson',
          cptCode: '99395',
          charges: 350,
          insurancePaid: 280,
          adjustments: 20,
          patientResponsibility: 50
        }
      ]
    }
  ]);

  // ── Claims ─────────────────────────────────────────────────────────────
  claims = signal<Claim[]>([
    { id: 'C1', claimNumber: 'CLM-2024-0042', serviceDate: new Date(Date.now() - 45 * 86400000), provider: 'Dr. Sarah Johnson', description: 'Annual Physical Exam', chargedAmount: 350, insurancePaid: 280, patientResponsibility: 70, status: 'approved' },
    { id: 'C2', claimNumber: 'CLM-2024-0051', serviceDate: new Date(Date.now() - 20 * 86400000), provider: 'City Lab Services', description: 'Comprehensive Metabolic Panel', chargedAmount: 185, insurancePaid: 148, patientResponsibility: 37, status: 'processing' },
    { id: 'C3', claimNumber: 'CLM-2024-0058', serviceDate: new Date(Date.now() - 10 * 86400000), provider: 'Dr. Michael Chen', description: 'Cardiology Consultation', chargedAmount: 425, insurancePaid: 0, patientResponsibility: 0, status: 'submitted' },
    { id: 'C4', claimNumber: 'CLM-2024-0033', serviceDate: new Date(Date.now() - 60 * 86400000), provider: 'Main Clinic Pharmacy', description: 'Prescription Medication', chargedAmount: 120, insurancePaid: 96, patientResponsibility: 24, status: 'approved' },
    { id: 'C5', claimNumber: 'CLM-2024-0029', serviceDate: new Date(Date.now() - 75 * 86400000), provider: 'Radiology Associates', description: 'Chest X-Ray', chargedAmount: 210, insurancePaid: 0, patientResponsibility: 210, status: 'denied' }
  ]);

  // ── Pre-Authorization Requests (Feature 5.2) ───────────────────────────
  preAuthRequests = signal<PreAuthRequest[]>([
    {
      id: 'PA-001',
      procedure: 'MRI - Right Knee',
      provider: 'Imaging Center',
      submittedDate: new Date(Date.now() - 10 * 86400000),
      status: 'approved',
      refNumber: 'PA-2024-0089',
      steps: ['Submitted', 'Under Review', 'Approved'],
      currentStep: 3
    },
    {
      id: 'PA-002',
      procedure: 'Cardiology Consultation',
      provider: 'Dr. Michael Chen',
      submittedDate: new Date(Date.now() - 3 * 86400000),
      status: 'under_review',
      refNumber: 'PA-2024-0095',
      steps: ['Submitted', 'Under Review', 'Decision'],
      currentStep: 2
    }
  ]);

  // ── EOB Records (Feature 5.3) ──────────────────────────────────────────
  eobRecords = signal<EobRecord[]>([
    {
      id: 'EOB-001',
      serviceDate: new Date(Date.now() - 45 * 86400000),
      provider: 'Dr. Sarah Johnson',
      serviceDescription: 'Office Visit — Established Patient (99214)',
      plainLanguage: 'You saw Dr. Johnson for a follow-up appointment. Your BlueCross BlueShield PPO plan covered 80% of the allowed amount after your deductible was applied. The difference between what was billed and what insurance paid reflects your contracted discount.',
      billedAmount: 250,
      insurancePaid: 175,
      adjustments: 25,
      youOwe: 50,
      reasonCode: 'CO-45',
      reasonExplanation: 'Contractual adjustment — difference between billed charge and allowed amount per your plan agreement.'
    },
    {
      id: 'EOB-002',
      serviceDate: new Date(Date.now() - 45 * 86400000),
      provider: 'City Lab Services',
      serviceDescription: 'Comprehensive Metabolic Panel (80053)',
      plainLanguage: 'A blood panel was ordered to check your kidney function, liver function, and electrolytes. Lab work under your plan is subject to your deductible. Insurance paid their portion based on the in-network contracted rate.',
      billedAmount: 120,
      insurancePaid: 85,
      adjustments: 0,
      youOwe: 35,
      reasonCode: 'PR-1',
      reasonExplanation: 'Patient responsibility — deductible amount applies. You have $150 remaining on your annual deductible.'
    },
    {
      id: 'EOB-003',
      serviceDate: new Date(Date.now() - 100 * 86400000),
      provider: 'Dr. Sarah Johnson',
      serviceDescription: 'Annual Preventive Physical Exam (99395)',
      plainLanguage: 'Your annual wellness visit is covered at 100% as a preventive service under the ACA. No cost-sharing applies when received from an in-network provider. This visit was fully covered and you owe nothing.',
      billedAmount: 350,
      insurancePaid: 300,
      adjustments: 50,
      youOwe: 0,
      reasonCode: 'CO-45',
      reasonExplanation: 'Preventive care covered at 100%. Contractual adjustment reflects the difference between the billed rate and the in-network allowed amount.'
    }
  ]);

  // ── Cost Estimator (Feature 5.1) ───────────────────────────────────────
  serviceOptions = [
    { label: 'Office Visit', value: 'office_visit' },
    { label: 'Lab Work', value: 'lab_work' },
    { label: 'X-Ray', value: 'xray' },
    { label: 'MRI', value: 'mri' },
    { label: 'CT Scan', value: 'ct_scan' },
    { label: 'Physical Therapy', value: 'physical_therapy' },
    { label: 'Specialist Visit', value: 'specialist_visit' },
    { label: 'Minor Surgery', value: 'minor_surgery' }
  ];

  serviceEstimates: Record<string, ServiceEstimate> = {
    office_visit:     { label: 'Office Visit',         value: 'office_visit',     totalCost: 250,  insuranceCoversPct: 80, yourCost: 50 },
    lab_work:         { label: 'Lab Work',              value: 'lab_work',         totalCost: 185,  insuranceCoversPct: 75, yourCost: 46 },
    xray:             { label: 'X-Ray',                 value: 'xray',             totalCost: 210,  insuranceCoversPct: 70, yourCost: 63 },
    mri:              { label: 'MRI',                   value: 'mri',              totalCost: 1800, insuranceCoversPct: 80, yourCost: 360 },
    ct_scan:          { label: 'CT Scan',               value: 'ct_scan',          totalCost: 1200, insuranceCoversPct: 80, yourCost: 240 },
    physical_therapy: { label: 'Physical Therapy',      value: 'physical_therapy', totalCost: 150,  insuranceCoversPct: 70, yourCost: 45 },
    specialist_visit: { label: 'Specialist Visit',      value: 'specialist_visit', totalCost: 425,  insuranceCoversPct: 75, yourCost: 106 },
    minor_surgery:    { label: 'Minor Surgery',         value: 'minor_surgery',    totalCost: 2800, insuranceCoversPct: 80, yourCost: 560 }
  };

  selectedService: { label: string; value: string } | null = null;

  currentEstimate = computed<ServiceEstimate | null>(() => {
    if (!this.selectedService) return null;
    return this.serviceEstimates[this.selectedService.value] ?? null;
  });

  // ── Payment Methods (Feature 5.6) ─────────────────────────────────────
  savedPaymentMethods: PaymentMethod[] = [
    { id: 'saved-visa-4242', type: 'card', label: 'Visa ending in 4242', icon: 'pi pi-credit-card', saved: true, lastFour: '4242', cardBrand: 'Visa' }
  ];

  newPaymentMethods: PaymentMethod[] = [
    { id: 'new-card', type: 'card',   label: 'Credit / Debit Card',    icon: 'pi pi-credit-card' },
    { id: 'paypal',   type: 'paypal', label: 'PayPal',                  icon: 'pi pi-paypal' },
    { id: 'hsa',      type: 'hsa',    label: 'HSA / FSA Card',          icon: 'pi pi-heart' },
    { id: 'ach',      type: 'ach',    label: 'Direct Debit / ACH',       icon: 'pi pi-building' },
    { id: 'upi',      type: 'upi',    label: 'UPI (India)',              icon: 'pi pi-mobile' },
    { id: 'bpay',     type: 'bpay',   label: 'BPAY (Australia)',         icon: 'pi pi-credit-card' }
  ];

  // ── Dispute reasons (Feature 5.4) ─────────────────────────────────────
  disputeReasonOptions = [
    'Incorrect Amount',
    'Service Not Received',
    'Insurance Should Cover',
    'Duplicate Charge',
    'Other'
  ];

  // ── Payment plan options (Feature 5.5) ────────────────────────────────
  paymentPlanOptions: PaymentPlanOption[] = [
    { months: 3,  monthlyPayment: 41.67, totalAmount: 125.00, fee: 0,    label: '3 Months' },
    { months: 6,  monthlyPayment: 21.25, totalAmount: 127.50, fee: 2.50, label: '6 Months' },
    { months: 12, monthlyPayment: 11.00, totalAmount: 132.00, fee: 7.00, label: '12 Months' }
  ];

  // ── CNAS Reimbursement Claims (Feature 13.3) ───────────────────────────
  cnasReimbursementClaims = signal<CnasReimbursementClaim[]>([
    {
      id: 'CNS-1',
      claimNumber: 'CNS-2024-001',
      service: 'General Consultation',
      date: new Date('2026-01-15'),
      amount: 150,
      currency: 'RON',
      status: 'Approved'
    },
    {
      id: 'CNS-2',
      claimNumber: 'CNS-2024-002',
      service: 'Blood Panel',
      date: new Date('2026-02-01'),
      amount: 85,
      currency: 'RON',
      status: 'Processing'
    },
    {
      id: 'CNS-3',
      claimNumber: 'CNS-2024-003',
      service: 'MRI Scan',
      date: new Date('2026-02-10'),
      amount: 450,
      currency: 'RON',
      status: 'Submitted'
    },
    {
      id: 'CNS-4',
      claimNumber: 'CNS-2024-004',
      service: 'Specialist Referral',
      date: new Date('2026-02-18'),
      amount: 200,
      currency: 'RON',
      status: 'Rejected',
      rejectionReason: 'Service not covered under current CNAS contract. Specialist consultation requires primary care referral form CN-14. Please resubmit with the required documentation.'
    }
  ]);

  // ── PM-JAY / Ayushman Bharat Data (Feature 13.4) ──────────────────────
  pmJayPackages: PmJayPackage[] = [
    { name: 'Cardiac Bypass Surgery',    coveredUpTo: 170000 },
    { name: 'Joint Replacement',          coveredUpTo: 80000  },
    { name: 'Cataract Surgery',           coveredUpTo: 30000  },
    { name: 'Dialysis (per session)',      coveredUpTo: 2000   },
    { name: 'Cancer Treatment',           coveredUpTo: 200000 }
  ];

  pmJayHospitalSearch = '';
  pmJaySearchPerformed = false;
  pmJaySearchResults: EmpanelledHospital[] = [];

  private readonly allEmpanelledHospitals: EmpanelledHospital[] = [
    { name: 'Apollo Hospital',                   distance: '2.3 km',  type: 'Multi-specialty' },
    { name: 'Fortis Medical Centre',             distance: '4.1 km',  type: 'Multi-specialty' },
    { name: 'Government Civil Hospital',          distance: '1.8 km',  type: 'Government' },
    { name: 'Kokilaben Dhirubhai Ambani Hospital', distance: '6.2 km', type: 'Multi-specialty' },
    { name: 'District Government Hospital',       distance: '3.5 km',  type: 'Government' }
  ];

  selectedPlanOption = computed<PaymentPlanOption | null>(() => {
    if (!this.selectedPlanMonths) return null;
    return this.paymentPlanOptions.find(p => p.months === this.selectedPlanMonths) ?? null;
  });

  // ── Status dashboard counts ────────────────────────────────────────────
  paidCount = computed(() =>
    this.statements().filter(s => s.status === 'paid').length
  );

  unpaidCount = computed(() =>
    this.statements().filter(s => s.status === 'pending' || s.status === 'overdue').length
  );

  pendingInsuranceCount = computed(() =>
    this.claims().filter(c => c.status === 'processing' || c.status === 'submitted').length
  );

  disputedCount = computed(() =>
    this.claims().filter(c => c.status === 'denied' || c.status === 'appealed').length
  );

  // ── Filtered collections ───────────────────────────────────────────────
  filteredStatements = computed(() => {
    const filter = this.statusFilter();
    if (!filter) return this.statements();
    if (filter === 'paid') return this.statements().filter(s => s.status === 'paid');
    if (filter === 'unpaid') return this.statements().filter(s => s.status === 'pending' || s.status === 'overdue');
    return this.statements();
  });

  filteredClaims = computed(() => {
    const filter = this.statusFilter();
    if (!filter) return this.claims();
    if (filter === 'insurance') return this.claims().filter(c => c.status === 'processing' || c.status === 'submitted');
    if (filter === 'disputed') return this.claims().filter(c => c.status === 'denied' || c.status === 'appealed');
    return this.claims();
  });

  filterLabel = computed(() => {
    const map: Record<string, string> = {
      paid: 'Paid Statements',
      unpaid: 'Unpaid Statements',
      insurance: 'Pending Insurance Claims',
      disputed: 'Disputed Claims'
    };
    return map[this.statusFilter() ?? ''] ?? '';
  });

  // ── Methods ────────────────────────────────────────────────────────────

  toggleStatement(id: string): void {
    const current = new Set(this.expandedStatements());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.expandedStatements.set(current);
  }

  isExpanded(id: string): boolean {
    return this.expandedStatements().has(id);
  }

  toggleStatusFilter(key: string): void {
    this.statusFilter.set(this.statusFilter() === key ? null : key);
  }

  isOverdue(dueDate: Date, status: string): boolean {
    return status !== 'paid' && new Date(dueDate) < new Date();
  }

  stmtTotal(stmt: Statement, field: 'charges' | 'insurancePaid' | 'adjustments' | 'patientResponsibility'): number {
    return stmt.lineItems.reduce((sum, item) => sum + item[field], 0);
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'warn' | 'danger' | 'info'> = {
      paid: 'success',
      pending: 'warn',
      overdue: 'danger',
      partial: 'info'
    };
    return map[status];
  }

  getClaimSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'warn' | 'danger' | 'info' | 'secondary'> = {
      approved: 'success',
      processing: 'info',
      submitted: 'warn',
      denied: 'danger',
      appealed: 'secondary'
    };
    return map[status];
  }

  onServiceSelect(): void {
    // computed signal picks up the selectedService reference change automatically
  }

  // ── Payment dialog actions (Feature 5.6) ──────────────────────────────
  openPayDialog(): void {
    this.paySuccess = false;
    this.payConfirmRef = '';
    this.selectedPaymentMethod = '';
    this.upiId = '';
    this.upiState = 'idle';
    this.upiTxnRef = '';
    this.bpayCopied = false;
    this.achBankName = '';
    this.achRoutingNumber = '';
    this.achAccountNumber = '';
    this.achConsentChecked = false;
    this.showPayDialog = true;
  }

  authorizeDirectDebit(): void {
    this.payConfirmRef = 'ACH-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    this.paySuccess = true;
  }

  submitPayment(): void {
    this.payConfirmRef = Math.random().toString(36).substring(2, 9).toUpperCase();
    this.paySuccess = true;
  }

  closePayDialog(): void {
    this.showPayDialog = false;
    this.paySuccess = false;
  }

  // ── Dispute dialog actions (Feature 5.4) ──────────────────────────────
  openDisputeDialog(statementNumber: string): void {
    this.disputeStatementRef = statementNumber;
    this.disputeForm = { statementRef: statementNumber, reason: '', description: '', hasDocument: false };
    this.disputeSuccess = false;
    this.disputeConfirmRef = '';
    this.showDisputeDialog = true;
  }

  submitDispute(): void {
    this.disputeConfirmRef = Math.random().toString(36).substring(2, 9).toUpperCase();
    this.disputeSuccess = true;
  }

  closeDisputeDialog(): void {
    this.showDisputeDialog = false;
    this.disputeSuccess = false;
  }

  // ── Payment plan dialog actions (Feature 5.5) ─────────────────────────
  submitPaymentPlan(): void {
    this.payPlanRef = Math.random().toString(36).substring(2, 9).toUpperCase();
    this.payPlanSuccess = true;
  }

  closePayPlanDialog(): void {
    this.showPayPlanDialog = false;
    this.payPlanSuccess = false;
    this.selectedPlanMonths = null;
  }

  // ── UPI payment actions (Feature 13.1) ────────────────────────────────
  initiateUpiPayment(): void {
    this.upiState = 'pending';
    setTimeout(() => {
      this.upiTxnRef = Math.random().toString(36).substring(2, 9).toUpperCase();
      this.upiState = 'success';
      // Auto-close the dialog after showing success briefly
      setTimeout(() => {
        this.paySuccess = true;
        this.payConfirmRef = 'UPI' + this.upiTxnRef;
      }, 1500);
    }, 2000);
  }

  // ── BPAY payment actions (Feature 13.2) ───────────────────────────────
  copyBpayDetails(): void {
    const details = `Biller Code: 12345\nReference: ${this.bpayReferenceNumber}\nAmount: AUD ${this.totalBalance.toFixed(2)}`;
    // Mock clipboard copy — in a real app use navigator.clipboard.writeText
    try {
      navigator.clipboard.writeText(details);
    } catch {
      // Clipboard not available in all environments; silently ignore
    }
    this.bpayCopied = true;
    setTimeout(() => { this.bpayCopied = false; }, 2500);
  }

  // ── PM-JAY hospital search (Feature 13.4) ─────────────────────────────
  searchEmpanelledHospitals(): void {
    this.pmJaySearchPerformed = true;
    // Mock: return all hospitals regardless of query (simulates a real search)
    this.pmJaySearchResults = this.allEmpanelledHospitals;
  }
}
