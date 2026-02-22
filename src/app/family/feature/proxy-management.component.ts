import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { Textarea } from 'primeng/inputtextarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { BadgeModule } from 'primeng/badge';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;
type ProxyStatus = 'pending-upload' | 'pending-verification' | 'verified' | 'active' | 'revoked';

interface ProxyDocument {
  name: string;
  type: string;
  uploadedAt: Date;
  url?: string;
}

interface AuditEvent {
  date: Date;
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface ProxyAccount {
  id: string;
  memberName: string;
  memberMrn: string;
  proxyFor: string;
  proxyForMrn: string;
  relationship: string;
  status: ProxyStatus;
  documents: ProxyDocument[];
  createdDate: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  notes?: string;
  auditTrail: AuditEvent[];
}

function daysAgo(n: number): Date {
  const d = new Date(2026, 1, 22);
  d.setDate(d.getDate() - n);
  return d;
}

const MOCK_PROXY_ACCOUNTS: ProxyAccount[] = [
  {
    id: 'proxy-001',
    memberName: 'Alex Johnson',
    memberMrn: 'MRN-20240001',
    proxyFor: 'Lily Johnson',
    proxyForMrn: 'MRN-20240003',
    relationship: 'Parent/Guardian',
    status: 'active',
    documents: [
      { name: 'Birth Certificate - Lily Johnson.pdf', type: 'Birth Certificate', uploadedAt: daysAgo(85) },
      { name: 'Court Order - Minor Guardianship.pdf', type: 'Court Order', uploadedAt: daysAgo(85) },
    ],
    createdDate: daysAgo(90),
    reviewedBy: 'Admin — Sarah Chen',
    reviewedAt: daysAgo(83),
    notes: 'Parental proxy verified. Both documents authenticated.',
    auditTrail: [
      { date: daysAgo(90), title: 'Account Created', description: 'Proxy request submitted by Alex Johnson.', icon: 'pi pi-plus', color: '#6366f1' },
      { date: daysAgo(87), title: 'Documents Uploaded', description: 'Birth certificate and court order uploaded.', icon: 'pi pi-upload', color: '#0ea5e9' },
      { date: daysAgo(83), title: 'Verified', description: 'Documents reviewed and verified by Admin Sarah Chen.', icon: 'pi pi-check', color: '#22c55e' },
      { date: daysAgo(82), title: 'Activated', description: 'Proxy access activated for Lily Johnson records.', icon: 'pi pi-user-plus', color: '#22c55e' },
    ],
  },
  {
    id: 'proxy-002',
    memberName: 'Maria Johnson',
    memberMrn: 'MRN-20240002',
    proxyFor: 'Marcus Johnson',
    proxyForMrn: 'MRN-20240004',
    relationship: 'Parent/Guardian',
    status: 'active',
    documents: [
      { name: 'Birth Certificate - Marcus Johnson.pdf', type: 'Birth Certificate', uploadedAt: daysAgo(55) },
    ],
    createdDate: daysAgo(60),
    reviewedBy: 'Admin — James Wright',
    reviewedAt: daysAgo(52),
    notes: 'Teen proxy — partial access per patient preference.',
    auditTrail: [
      { date: daysAgo(60), title: 'Account Created', description: 'Proxy request submitted by Maria Johnson.', icon: 'pi pi-plus', color: '#6366f1' },
      { date: daysAgo(55), title: 'Document Uploaded', description: 'Birth certificate uploaded.', icon: 'pi pi-upload', color: '#0ea5e9' },
      { date: daysAgo(52), title: 'Activated', description: 'Verified and activated by Admin James Wright.', icon: 'pi pi-check', color: '#22c55e' },
    ],
  },
  {
    id: 'proxy-003',
    memberName: 'Elena Vasquez',
    memberMrn: 'MRN-20250010',
    proxyFor: 'Carlos Vasquez',
    proxyForMrn: 'MRN-20250011',
    relationship: 'Spouse/POA',
    status: 'pending-verification',
    documents: [
      { name: 'Power of Attorney - Carlos Vasquez.pdf', type: 'Power of Attorney', uploadedAt: daysAgo(3) },
      { name: 'Marriage Certificate.pdf', type: 'Marriage Certificate', uploadedAt: daysAgo(3) },
    ],
    createdDate: daysAgo(7),
    notes: '',
    auditTrail: [
      { date: daysAgo(7), title: 'Account Created', description: 'Proxy request submitted by Elena Vasquez.', icon: 'pi pi-plus', color: '#6366f1' },
      { date: daysAgo(3), title: 'Documents Uploaded', description: 'POA and marriage certificate uploaded.', icon: 'pi pi-upload', color: '#0ea5e9' },
      { date: daysAgo(3), title: 'Pending Review', description: 'Documents queued for admin verification.', icon: 'pi pi-clock', color: '#f59e0b' },
    ],
  },
  {
    id: 'proxy-004',
    memberName: 'Thomas Kim',
    memberMrn: 'MRN-20250020',
    proxyFor: 'Angela Kim',
    proxyForMrn: 'MRN-20250021',
    relationship: 'Adult Child POA',
    status: 'pending-upload',
    documents: [],
    createdDate: daysAgo(2),
    notes: '',
    auditTrail: [
      { date: daysAgo(2), title: 'Account Created', description: 'Proxy request submitted. Awaiting document upload.', icon: 'pi pi-plus', color: '#6366f1' },
    ],
  },
  {
    id: 'proxy-005',
    memberName: 'Rebecca Torres',
    memberMrn: 'MRN-20240050',
    proxyFor: 'Michael Torres',
    proxyForMrn: 'MRN-20240051',
    relationship: 'Healthcare Proxy',
    status: 'revoked',
    documents: [
      { name: 'Healthcare Proxy Form.pdf', type: 'Healthcare Proxy', uploadedAt: daysAgo(200) },
    ],
    createdDate: daysAgo(210),
    reviewedBy: 'Admin — Sarah Chen',
    reviewedAt: daysAgo(195),
    notes: 'Revoked per patient request on 2025-08-05.',
    auditTrail: [
      { date: daysAgo(210), title: 'Account Created', description: 'Proxy request submitted.', icon: 'pi pi-plus', color: '#6366f1' },
      { date: daysAgo(195), title: 'Activated', description: 'Verified and activated.', icon: 'pi pi-check', color: '#22c55e' },
      { date: daysAgo(30), title: 'Revoked', description: 'Proxy access revoked per patient written request.', icon: 'pi pi-ban', color: '#ef4444' },
    ],
  },
];

@Component({
  selector: 'app-proxy-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    SidebarModule,
    ButtonModule,
    TagModule,
    TimelineModule,
    Textarea,
    ConfirmDialogModule,
    BadgeModule,
    CardModule,
    DividerModule,
    TooltipModule,
    ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="proxy-management p-4">
      <div class="page-header mb-4 flex align-items-center justify-content-between flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 m-0">
            <i class="pi pi-users mr-2 text-blue-600"></i>Proxy Account Management
          </h1>
          <p class="text-gray-500 mt-1 mb-0">
            Review, verify, and manage patient proxy access requests.
          </p>
        </div>
        <div class="flex gap-2">
          <p-button
            label="Export CSV"
            icon="pi pi-file-excel"
            severity="secondary"
            [outlined]="true"
            (onClick)="exportCsv()">
          </p-button>
        </div>
      </div>

      <!-- Summary stats -->
      <div class="summary-grid grid mb-4">
        @for (stat of summaryStats(); track stat.label) {
          <div class="col-6 md:col-3">
            <div class="stat-card p-3 surface-50 border-round border-1 surface-border text-center">
              <p class="text-2xl font-bold m-0" [style.color]="stat.color">{{ stat.count }}</p>
              <p class="text-xs text-gray-500 mt-1 mb-0">{{ stat.label }}</p>
            </div>
          </div>
        }
      </div>

      <!-- Proxy accounts table -->
      <p-card>
        <p-table
          [value]="proxyAccounts()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 20, 50]"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="{first}–{last} of {totalRecords} proxy accounts"
          styleClass="p-datatable-sm"
          selectionMode="single"
          [(selection)]="selectedAccount"
          (onRowSelect)="onRowSelect($event)"
          [rowHover]="true">

          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="memberName">Member <p-sortIcon field="memberName"></p-sortIcon></th>
              <th pSortableColumn="proxyFor">Proxy For <p-sortIcon field="proxyFor"></p-sortIcon></th>
              <th>Relationship</th>
              <th pSortableColumn="status">Status <p-sortIcon field="status"></p-sortIcon></th>
              <th>Documents</th>
              <th pSortableColumn="createdDate">Created <p-sortIcon field="createdDate"></p-sortIcon></th>
              <th style="width: 120px">Actions</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-account>
            <tr [pSelectableRow]="account" style="cursor: pointer">
              <td>
                <div>
                  <p class="font-semibold text-sm m-0">{{ account.memberName }}</p>
                  <p class="text-xs text-gray-400 m-0">{{ account.memberMrn }}</p>
                </div>
              </td>
              <td>
                <div>
                  <p class="text-sm m-0">{{ account.proxyFor }}</p>
                  <p class="text-xs text-gray-400 m-0">{{ account.proxyForMrn }}</p>
                </div>
              </td>
              <td class="text-sm">{{ account.relationship }}</td>
              <td>
                <p-tag
                  [value]="getStatusLabel(account.status)"
                  [severity]="getStatusSeverity(account.status)"
                  [pTooltip]="getStatusTooltip(account.status)"
                  tooltipPosition="top">
                </p-tag>
              </td>
              <td>
                <div class="flex align-items-center gap-1">
                  <i class="pi pi-file text-gray-400 text-sm"></i>
                  <span class="text-sm">{{ account.documents.length }}</span>
                  @if (account.status === 'pending-upload') {
                    <i class="pi pi-exclamation-circle text-orange-500 text-sm ml-1"
                       pTooltip="Documents required"
                       tooltipPosition="top"></i>
                  }
                </div>
              </td>
              <td class="text-sm text-gray-500">{{ account.createdDate | date:'mediumDate' }}</td>
              <td>
                <div class="flex gap-1">
                  <p-button
                    icon="pi pi-eye"
                    [rounded]="true"
                    [text]="true"
                    size="small"
                    pTooltip="Review"
                    (onClick)="openReview(account); $event.stopPropagation()">
                  </p-button>
                  @if (account.status === 'pending-verification') {
                    <p-button
                      icon="pi pi-check"
                      [rounded]="true"
                      [text]="true"
                      severity="success"
                      size="small"
                      pTooltip="Verify"
                      (onClick)="quickVerify(account); $event.stopPropagation()">
                    </p-button>
                  }
                  @if (account.status === 'active') {
                    <p-button
                      icon="pi pi-ban"
                      [rounded]="true"
                      [text]="true"
                      severity="danger"
                      size="small"
                      pTooltip="Revoke"
                      (onClick)="confirmRevoke(account); $event.stopPropagation()">
                    </p-button>
                  }
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7" class="text-center py-6 text-gray-400">
                <i class="pi pi-users text-4xl block mb-2"></i>
                No proxy accounts found.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>

    <!-- Review Sidebar -->
    <p-sidebar
      [(visible)]="sidebarVisible"
      position="right"
      [style]="{ width: '480px' }"
      [blockScroll]="true">

      @if (reviewAccount()) {
        @let account = reviewAccount()!;
        <div class="review-sidebar">
          <!-- Header -->
          <div class="mb-4">
            <div class="flex align-items-center justify-content-between mb-2">
              <h2 class="text-lg font-bold text-gray-800 m-0">Proxy Review</h2>
              <p-tag
                [value]="getStatusLabel(account.status)"
                [severity]="getStatusSeverity(account.status)">
              </p-tag>
            </div>
            <p class="text-sm text-gray-500 mb-0">
              <i class="pi pi-calendar mr-1"></i>Created {{ account.createdDate | date:'mediumDate' }}
            </p>
          </div>

          <!-- Member details -->
          <div class="detail-section p-3 surface-50 border-round border-1 surface-border mb-4">
            <h3 class="text-sm font-semibold text-gray-600 uppercase tracking-widest mb-2">Member Details</h3>
            <div class="grid text-sm">
              <div class="col-6">
                <p class="text-xs text-gray-400 mb-0">Proxy Holder</p>
                <p class="font-semibold text-gray-800 mb-1">{{ account.memberName }}</p>
                <p class="text-xs text-gray-500 mb-0">{{ account.memberMrn }}</p>
              </div>
              <div class="col-6">
                <p class="text-xs text-gray-400 mb-0">Proxy For</p>
                <p class="font-semibold text-gray-800 mb-1">{{ account.proxyFor }}</p>
                <p class="text-xs text-gray-500 mb-0">{{ account.proxyForMrn }}</p>
              </div>
              <div class="col-12 mt-2">
                <p class="text-xs text-gray-400 mb-0">Relationship</p>
                <p class="font-medium text-gray-700 mb-0">{{ account.relationship }}</p>
              </div>
              @if (account.reviewedBy) {
                <div class="col-12 mt-2">
                  <p class="text-xs text-gray-400 mb-0">Reviewed By</p>
                  <p class="font-medium text-gray-700 mb-0">
                    {{ account.reviewedBy }} on {{ account.reviewedAt | date:'mediumDate' }}
                  </p>
                </div>
              }
            </div>
          </div>

          <!-- Documents -->
          <div class="mb-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-2">
              <i class="pi pi-paperclip mr-1"></i>Uploaded Documents
              <span class="ml-1 text-gray-400 font-normal">({{ account.documents.length }})</span>
            </h3>
            @if (account.documents.length > 0) {
              <div class="document-list">
                @for (doc of account.documents; track doc.name) {
                  <div class="doc-item flex align-items-center gap-2 p-2 border-round border-1 surface-border mb-2">
                    <i class="pi pi-file-pdf text-red-500 text-xl flex-shrink-0"></i>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-800 mb-0 truncate" style="max-width: 220px">{{ doc.name }}</p>
                      <p class="text-xs text-gray-400 mb-0">{{ doc.type }} — {{ doc.uploadedAt | date:'mediumDate' }}</p>
                    </div>
                    <p-button
                      icon="pi pi-download"
                      [rounded]="true"
                      [text]="true"
                      size="small"
                      pTooltip="Download">
                    </p-button>
                  </div>
                }
              </div>
            } @else {
              <div class="text-center py-3 text-gray-400 border-round border-1 border-dashed surface-border">
                <i class="pi pi-upload block mb-1"></i>
                <span class="text-sm">No documents uploaded yet.</span>
              </div>
            }
          </div>

          <!-- Notes -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
            <textarea
              pInputTextarea
              [(ngModel)]="reviewNotes"
              rows="3"
              class="w-full"
              placeholder="Add notes about this proxy request...">
            </textarea>
          </div>

          <!-- Action buttons -->
          @if (account.status === 'pending-verification' || account.status === 'pending-upload') {
            <div class="flex gap-2 mb-4">
              <p-button
                label="Verify & Activate"
                icon="pi pi-check-circle"
                severity="success"
                styleClass="flex-1"
                (onClick)="verifyAccount(account)">
              </p-button>
              <p-button
                label="Reject"
                icon="pi pi-times-circle"
                severity="danger"
                [outlined]="true"
                styleClass="flex-1"
                (onClick)="rejectAccount(account)">
              </p-button>
            </div>
          }
          @if (account.status === 'active') {
            <div class="mb-4">
              <p-button
                label="Revoke Access"
                icon="pi pi-ban"
                severity="danger"
                [outlined]="true"
                styleClass="w-full"
                (onClick)="confirmRevoke(account)">
              </p-button>
            </div>
          }

          <p-divider></p-divider>

          <!-- Audit trail -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700 mb-3">
              <i class="pi pi-history mr-1"></i>Audit Trail
            </h3>
            <p-timeline [value]="account.auditTrail">
              <ng-template pTemplate="marker" let-event>
                <div
                  class="timeline-marker flex align-items-center justify-content-center border-circle"
                  [style.background]="event.color"
                  style="width: 28px; height: 28px;">
                  <i [class]="event.icon + ' text-white'" style="font-size: 0.75rem"></i>
                </div>
              </ng-template>
              <ng-template pTemplate="content" let-event>
                <div class="pb-3">
                  <p class="text-sm font-semibold text-gray-800 mb-0">{{ event.title }}</p>
                  <p class="text-xs text-gray-500 mb-0">{{ event.date | date:'medium' }}</p>
                  <p class="text-xs text-gray-600 mt-1 mb-0">{{ event.description }}</p>
                </div>
              </ng-template>
            </p-timeline>
          </div>
        </div>
      }
    </p-sidebar>
  `,
  styles: [`
    .proxy-management {
      max-width: 1200px;
      margin: 0 auto;
    }
    .stat-card {
      transition: box-shadow 0.2s;
    }
    .stat-card:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .review-sidebar {
      padding: 0 0.5rem;
    }
    :host ::ng-deep .p-sidebar-content {
      padding: 1rem 1.25rem;
    }
    :host ::ng-deep .p-timeline-event-content {
      line-height: 1.4;
    }
  `],
})
export class ProxyManagementComponent {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly proxyAccounts = signal<ProxyAccount[]>(MOCK_PROXY_ACCOUNTS);
  sidebarVisible = false;
  selectedAccount: ProxyAccount | null = null;
  reviewAccount = signal<ProxyAccount | null>(null);
  reviewNotes = '';

  readonly summaryStats = computed(() => {
    const accounts = this.proxyAccounts();
    return [
      { label: 'Active', count: accounts.filter(a => a.status === 'active').length, color: '#22c55e' },
      { label: 'Pending Verification', count: accounts.filter(a => a.status === 'pending-verification').length, color: '#f59e0b' },
      { label: 'Pending Upload', count: accounts.filter(a => a.status === 'pending-upload').length, color: '#9ca3af' },
      { label: 'Revoked', count: accounts.filter(a => a.status === 'revoked').length, color: '#ef4444' },
    ];
  });

  getStatusLabel(status: ProxyStatus): string {
    const labels: Record<ProxyStatus, string> = {
      'pending-upload': 'Pending Upload',
      'pending-verification': 'Pending Review',
      'verified': 'Verified',
      'active': 'Active',
      'revoked': 'Revoked',
    };
    return labels[status];
  }

  getStatusSeverity(status: ProxyStatus): TagSeverity {
    const severities: Record<ProxyStatus, TagSeverity> = {
      'pending-upload': 'secondary',
      'pending-verification': 'warn',
      'verified': 'info',
      'active': 'success',
      'revoked': 'danger',
    };
    return severities[status];
  }

  getStatusTooltip(status: ProxyStatus): string {
    const tooltips: Record<ProxyStatus, string> = {
      'pending-upload': 'Required documents have not been uploaded yet.',
      'pending-verification': 'Documents uploaded and awaiting admin review.',
      'verified': 'Documents verified; awaiting activation.',
      'active': 'Proxy access is active and in use.',
      'revoked': 'Proxy access has been revoked.',
    };
    return tooltips[status];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRowSelect(event: any): void {
    if (event.data && !Array.isArray(event.data)) {
      this.openReview(event.data as ProxyAccount);
    }
  }

  openReview(account: ProxyAccount): void {
    this.reviewAccount.set(account);
    this.reviewNotes = account.notes ?? '';
    this.sidebarVisible = true;
  }

  quickVerify(account: ProxyAccount): void {
    this.openReview(account);
  }

  verifyAccount(account: ProxyAccount): void {
    const now = new Date();
    this.proxyAccounts.update(accounts =>
      accounts.map(a =>
        a.id === account.id
          ? {
              ...a,
              status: 'active' as ProxyStatus,
              reviewedBy: 'Admin (Current User)',
              reviewedAt: now,
              notes: this.reviewNotes,
              auditTrail: [
                ...a.auditTrail,
                {
                  date: now,
                  title: 'Verified & Activated',
                  description: `Proxy access activated. Notes: ${this.reviewNotes || 'None.'}`,
                  icon: 'pi pi-check',
                  color: '#22c55e',
                },
              ],
            }
          : a
      )
    );
    this.reviewAccount.set(null);
    this.sidebarVisible = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Proxy Activated',
      detail: `${account.memberName}'s proxy access for ${account.proxyFor} has been activated.`,
      life: 4000,
    });
  }

  rejectAccount(account: ProxyAccount): void {
    const now = new Date();
    this.proxyAccounts.update(accounts =>
      accounts.map(a =>
        a.id === account.id
          ? {
              ...a,
              status: 'revoked' as ProxyStatus,
              notes: this.reviewNotes,
              auditTrail: [
                ...a.auditTrail,
                {
                  date: now,
                  title: 'Rejected',
                  description: `Proxy request rejected. Reason: ${this.reviewNotes || 'Not specified.'}`,
                  icon: 'pi pi-times',
                  color: '#ef4444',
                },
              ],
            }
          : a
      )
    );
    this.sidebarVisible = false;
    this.messageService.add({
      severity: 'warn',
      summary: 'Proxy Rejected',
      detail: `Proxy request for ${account.memberName} has been rejected.`,
      life: 4000,
    });
  }

  confirmRevoke(account: ProxyAccount): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to revoke proxy access for <strong>${account.memberName}</strong> (proxy for ${account.proxyFor})?`,
      header: 'Confirm Revocation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, Revoke',
      rejectLabel: 'Cancel',
      accept: () => {
        const now = new Date();
        this.proxyAccounts.update(accounts =>
          accounts.map(a =>
            a.id === account.id
              ? {
                  ...a,
                  status: 'revoked' as ProxyStatus,
                  auditTrail: [
                    ...a.auditTrail,
                    {
                      date: now,
                      title: 'Revoked',
                      description: 'Proxy access revoked by admin.',
                      icon: 'pi pi-ban',
                      color: '#ef4444',
                    },
                  ],
                }
              : a
          )
        );
        this.sidebarVisible = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Access Revoked',
          detail: `Proxy access for ${account.memberName} has been revoked.`,
          life: 4000,
        });
      },
    });
  }

  exportCsv(): void {
    const rows = this.proxyAccounts().map(a => ({
      'Member Name': a.memberName,
      'Member MRN': a.memberMrn,
      'Proxy For': a.proxyFor,
      'Proxy For MRN': a.proxyForMrn,
      'Relationship': a.relationship,
      'Status': this.getStatusLabel(a.status),
      'Documents': a.documents.length,
      'Created': a.createdDate.toLocaleDateString(),
    }));
    const headers = Object.keys(rows[0] ?? {}).join(',');
    const csv = [headers, ...rows.map(r => Object.values(r).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'proxy-accounts.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
