import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { SidebarModule } from 'primeng/sidebar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { CardModule } from 'primeng/card';
import { FamilyService } from '../data-access/family.service';
import {
  AccessLevel,
  RecordCategory,
  FamilyMember,
  AuditLogEntry,
} from '../data-access/family.models';

interface AccessOption {
  label: string;
  value: AccessLevel;
  styleClass: string;
}

interface AuditDrawerContext {
  member: FamilyMember;
  category: RecordCategory;
  entries: AuditLogEntry[];
}

const ALL_CATEGORIES: RecordCategory[] = [
  'appointments',
  'medications',
  'lab-results',
  'immunizations',
  'allergies',
  'mental-health',
  'reproductive',
  'sti',
  'genetic',
  'billing',
];

const SENSITIVE_CATEGORIES: Set<RecordCategory> = new Set([
  'mental-health',
  'reproductive',
  'sti',
  'genetic',
]);

const CATEGORY_LABELS: Record<RecordCategory, string> = {
  appointments: 'Appointments',
  medications: 'Medications',
  'lab-results': 'Lab Results',
  immunizations: 'Immunizations',
  allergies: 'Allergies',
  'mental-health': 'Mental Health',
  reproductive: 'Reproductive',
  sti: 'STI',
  genetic: 'Genetic',
  billing: 'Billing',
};

@Component({
  selector: 'app-permission-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    DropdownModule,
    SidebarModule,
    TagModule,
    TooltipModule,
    TableModule,
    DividerModule,
    CardModule,
  ],
  template: `
    <div class="permissions-page">
      <!-- Page Header -->
      <div class="permissions-header">
        <div class="header-left">
          <a routerLink="/family" class="back-link" aria-label="Back to Family Dashboard">
            <i class="pi pi-arrow-left" aria-hidden="true"></i>
            Family Dashboard
          </a>
          <h1 class="page-title">
            <i class="pi pi-lock" aria-hidden="true"></i>
            Permission Management
          </h1>
          <p class="page-subtitle">
            Configure which family members can access each category of health records.
            Sensitive categories are marked with <i class="pi pi-lock" aria-hidden="true"></i>.
          </p>
        </div>
        <div class="header-actions">
          <button
            pButton
            label="Export CSV"
            icon="pi pi-download"
            class="p-button-outlined p-button-sm"
            (click)="exportCsv()"
            aria-label="Export permissions as CSV"
          ></button>
          <button
            pButton
            label="Grant Emergency Access to All"
            icon="pi pi-exclamation-circle"
            class="p-button-warning"
            (click)="grantEmergencyToAll()"
            aria-label="Grant emergency access to all family members"
          ></button>
        </div>
      </div>

      <!-- Legend -->
      <div class="permissions-legend" role="group" aria-label="Permission level legend">
        @for (opt of accessOptions; track opt.value) {
          <div class="legend-item">
            <span class="legend-dot" [class]="'legend-dot--' + opt.value" aria-hidden="true"></span>
            <span>{{ opt.label }}</span>
          </div>
        }
        <div class="legend-item legend-sensitive">
          <i class="pi pi-lock" aria-hidden="true"></i>
          <span>Sensitive category</span>
        </div>
      </div>

      <!-- Permission Matrix Table -->
      <div class="matrix-wrapper" role="region" aria-label="Permission matrix">
        <div class="matrix-scroll">
          <table class="permission-matrix" aria-label="Family member permission matrix">
            <thead>
              <tr>
                <th scope="col" class="member-col" rowspan="1">Member</th>
                @for (cat of categories; track cat) {
                  <th scope="col" class="cat-col" [class.sensitive]="isSensitive(cat)">
                    <div class="cat-header">
                      <span class="cat-label">{{ getCategoryLabel(cat) }}</span>
                      @if (isSensitive(cat)) {
                        <i
                          class="pi pi-lock sensitive-lock"
                          [pTooltip]="'Sensitive — extra privacy protections apply'"
                          tooltipPosition="top"
                          aria-label="Sensitive category"
                        ></i>
                      }
                    </div>
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              @for (member of humanMembers(); track member.id) {
                @if (!member.isProband) {
                  <tr class="member-row" [class.row-highlighted]="highlightedMemberId() === member.id">
                    <td class="member-cell">
                      <div class="member-cell-inner">
                        <div
                          class="member-avatar-dot"
                          [style.background]="member.avatarColor"
                          aria-hidden="true"
                        ></div>
                        <div class="member-cell-info">
                          <span class="member-cell-name">{{ member.firstName }} {{ member.lastName }}</span>
                          <span class="member-cell-rel">{{ formatRelationship(member.relationship) }}</span>
                        </div>
                      </div>
                    </td>
                    @for (cat of categories; track cat) {
                      <td
                        class="perm-cell"
                        [class.sensitive-cell]="isSensitive(cat)"
                        (click)="openAuditDrawer(member, cat)"
                        [pTooltip]="'Click to view audit history for ' + member.firstName + ' / ' + getCategoryLabel(cat)"
                        tooltipPosition="top"
                      >
                        <p-dropdown
                          [options]="accessOptions"
                          [ngModel]="getPermissionLevel(member.id, cat)"
                          (ngModelChange)="updatePermission(member.id, cat, $event)"
                          optionLabel="label"
                          optionValue="value"
                          styleClass="perm-dropdown"
                          [attr.aria-label]="member.firstName + ' ' + getCategoryLabel(cat) + ' access level'"
                          (click)="$event.stopPropagation()"
                        >
                          <ng-template pTemplate="selectedItem" let-opt>
                            @if (opt) {
                              <span class="perm-selected" [class]="'perm-selected--' + opt.value">
                                <span class="perm-dot" aria-hidden="true"></span>
                                {{ opt.label }}
                              </span>
                            }
                          </ng-template>
                          <ng-template pTemplate="item" let-opt>
                            <span class="perm-option" [class]="'perm-option--' + opt.value">
                              <span class="perm-dot" aria-hidden="true"></span>
                              {{ opt.label }}
                            </span>
                          </ng-template>
                        </p-dropdown>
                      </td>
                    }
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-section">
        <h2 class="summary-heading">Quick Summary</h2>
        <div class="summary-cards">
          @for (member of humanMembers(); track member.id) {
            @if (!member.isProband) {
              <div class="summary-card">
                <div class="sc-header">
                  <div class="sc-avatar" [style.background]="member.avatarColor + '20'" [style.color]="member.avatarColor">
                    {{ member.firstName[0] }}{{ member.lastName[0] }}
                  </div>
                  <div class="sc-meta">
                    <span class="sc-name">{{ member.firstName }} {{ member.lastName }}</span>
                    <span class="sc-rel">{{ formatRelationship(member.relationship) }}</span>
                  </div>
                </div>
                <div class="sc-perms">
                  @for (cat of categories; track cat) {
                    <div
                      class="sc-perm-dot"
                      [class]="'sc-perm-dot--' + getPermissionLevel(member.id, cat)"
                      [pTooltip]="getCategoryLabel(cat) + ': ' + formatAccessLevel(getPermissionLevel(member.id, cat))"
                      tooltipPosition="top"
                      [attr.aria-label]="getCategoryLabel(cat) + ': ' + formatAccessLevel(getPermissionLevel(member.id, cat))"
                    ></div>
                  }
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>

    <!-- Audit History Drawer -->
    <p-sidebar
      [(visible)]="auditDrawerVisible"
      position="right"
      [style]="{ width: '400px' }"
      styleClass="audit-drawer"
      [closeOnEscape]="true"
      aria-label="Audit history"
    >
      @if (auditContext()) {
        <div class="audit-drawer-content">
          <div class="audit-drawer-header">
            <h3>Audit History</h3>
            <p class="audit-drawer-subtitle">
              <strong>{{ auditContext()!.member.firstName }} {{ auditContext()!.member.lastName }}</strong>
              &middot; {{ getCategoryLabel(auditContext()!.category) }}
            </p>
          </div>

          <p-divider></p-divider>

          <div class="current-level">
            <span class="cl-label">Current Access:</span>
            <span
              class="cl-badge"
              [class]="'perm-badge--' + getPermissionLevel(auditContext()!.member.id, auditContext()!.category)"
            >
              {{ formatAccessLevel(getPermissionLevel(auditContext()!.member.id, auditContext()!.category)) }}
            </span>
          </div>

          <p-divider></p-divider>

          @if (auditContext()!.entries.length > 0) {
            <div class="audit-entries" role="list" aria-label="Audit history entries">
              @for (entry of auditContext()!.entries; track entry.id) {
                <div class="audit-entry" role="listitem">
                  <div class="ae-icon" aria-hidden="true">
                    <i [class]="getAuditIcon(entry.action)"></i>
                  </div>
                  <div class="ae-content">
                    <span class="ae-action">{{ formatAction(entry.action) }}</span>
                    <p class="ae-details">{{ entry.details }}</p>
                    <span class="ae-meta">
                      {{ entry.actorName }} &middot; {{ entry.timestamp | date:'medium' }}
                    </span>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="no-audit">
              <i class="pi pi-info-circle" aria-hidden="true"></i>
              <p>No audit entries found for this member and category.</p>
            </div>
          }
        </div>
      }
    </p-sidebar>
  `,
  styles: [`
    .permissions-page {
      padding: 0;
    }

    /* Header */
    .permissions-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: var(--surface-card);
      border-bottom: 1px solid var(--surface-border);
      flex-wrap: wrap;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      color: var(--primary-color);
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 0.375rem;
      transition: opacity 0.15s;
    }

    .back-link:hover {
      opacity: 0.8;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-color);
    }

    .page-title > i {
      color: var(--primary-color);
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      margin: 0;
      line-height: 1.4;
    }

    .page-subtitle i {
      font-size: 0.75rem;
    }

    .header-actions {
      display: flex;
      gap: 0.625rem;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    /* Legend */
    .permissions-legend {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 0.75rem 1.5rem;
      background: var(--surface-ground);
      border-bottom: 1px solid var(--surface-border);
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .legend-dot--full { background: #16a34a; }
    .legend-dot--partial { background: #ca8a04; }
    .legend-dot--none { background: #dc2626; }
    .legend-dot--emergency-only { background: #2563eb; }

    .legend-sensitive {
      margin-left: 0.5rem;
      padding-left: 0.875rem;
      border-left: 1px solid var(--surface-border);
      color: var(--orange-600);
    }

    .legend-sensitive i {
      font-size: 0.75rem;
    }

    /* Matrix */
    .matrix-wrapper {
      padding: 1.25rem 1.5rem;
      background: var(--surface-card);
    }

    .matrix-scroll {
      overflow-x: auto;
      border-radius: 10px;
      border: 1px solid var(--surface-border);
    }

    .permission-matrix {
      width: 100%;
      border-collapse: collapse;
      min-width: 900px;
    }

    .permission-matrix thead th {
      background: var(--surface-ground);
      padding: 0.625rem 0.5rem;
      text-align: left;
      border-bottom: 2px solid var(--surface-border);
      white-space: nowrap;
    }

    .member-col {
      min-width: 180px;
      position: sticky;
      left: 0;
      z-index: 2;
      background: var(--surface-ground) !important;
    }

    .cat-col {
      min-width: 110px;
      text-align: center !important;
    }

    .cat-col.sensitive {
      background: #fffbeb !important;
    }

    .cat-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      flex-direction: column;
    }

    .cat-label {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .sensitive-lock {
      font-size: 0.65rem;
      color: var(--orange-500);
    }

    /* Rows */
    .member-row {
      border-bottom: 1px solid var(--surface-border);
      transition: background 0.1s;
    }

    .member-row:last-child {
      border-bottom: none;
    }

    .member-row:hover {
      background: var(--surface-hover);
    }

    .member-row.row-highlighted {
      background: var(--primary-50);
    }

    .member-cell {
      padding: 0.5rem;
      position: sticky;
      left: 0;
      background: var(--surface-card);
      z-index: 1;
      border-right: 1px solid var(--surface-border);
    }

    .member-row:hover .member-cell {
      background: var(--surface-hover);
    }

    .member-cell-inner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .member-avatar-dot {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      flex-shrink: 0;
      opacity: 0.8;
    }

    .member-cell-info {
      display: flex;
      flex-direction: column;
    }

    .member-cell-name {
      font-size: 0.875rem;
      font-weight: 600;
    }

    .member-cell-rel {
      font-size: 0.7rem;
      color: var(--text-color-secondary);
    }

    /* Permission cells */
    .perm-cell {
      padding: 0.375rem 0.5rem;
      text-align: center;
      cursor: pointer;
      transition: background 0.1s;
    }

    .perm-cell:hover {
      background: rgba(0, 0, 0, 0.03);
    }

    .perm-cell.sensitive-cell {
      background: #fffbeb40;
    }

    .perm-cell ::ng-deep .p-dropdown {
      width: 100%;
      min-width: 90px;
    }

    .perm-cell ::ng-deep .p-dropdown .p-dropdown-label {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }

    .perm-cell ::ng-deep .p-dropdown-trigger {
      width: 1.5rem;
    }

    .perm-selected, .perm-option {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .perm-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .perm-selected--full .perm-dot,
    .perm-option--full .perm-dot { background: #16a34a; }
    .perm-selected--full, .perm-option--full { color: #16a34a; }

    .perm-selected--partial .perm-dot,
    .perm-option--partial .perm-dot { background: #ca8a04; }
    .perm-selected--partial, .perm-option--partial { color: #ca8a04; }

    .perm-selected--none .perm-dot,
    .perm-option--none .perm-dot { background: #dc2626; }
    .perm-selected--none, .perm-option--none { color: #dc2626; }

    .perm-selected--emergency-only .perm-dot,
    .perm-option--emergency-only .perm-dot { background: #2563eb; }
    .perm-selected--emergency-only, .perm-option--emergency-only { color: #2563eb; }

    /* Summary */
    .summary-section {
      padding: 1.25rem 1.5rem;
      background: var(--surface-ground);
    }

    .summary-heading {
      font-size: 1rem;
      font-weight: 700;
      margin: 0 0 0.875rem;
      color: var(--text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 0.8rem;
    }

    .summary-cards {
      display: flex;
      flex-wrap: wrap;
      gap: 0.875rem;
    }

    .summary-card {
      background: var(--surface-card);
      border-radius: 10px;
      padding: 0.875rem;
      border: 1px solid var(--surface-border);
      min-width: 200px;
    }

    .sc-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.625rem;
    }

    .sc-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .sc-meta {
      display: flex;
      flex-direction: column;
    }

    .sc-name {
      font-size: 0.8rem;
      font-weight: 600;
    }

    .sc-rel {
      font-size: 0.7rem;
      color: var(--text-color-secondary);
    }

    .sc-perms {
      display: flex;
      gap: 0.25rem;
      flex-wrap: wrap;
    }

    .sc-perm-dot {
      width: 14px;
      height: 14px;
      border-radius: 3px;
      cursor: default;
      transition: transform 0.1s;
    }

    .sc-perm-dot:hover {
      transform: scale(1.3);
    }

    .sc-perm-dot--full { background: #16a34a; }
    .sc-perm-dot--partial { background: #ca8a04; }
    .sc-perm-dot--none { background: #dc2626; opacity: 0.5; }
    .sc-perm-dot--emergency-only { background: #2563eb; }

    /* Audit Drawer */
    .audit-drawer-content {
      height: 100%;
      overflow-y: auto;
    }

    .audit-drawer-header {
      padding-bottom: 0;
    }

    .audit-drawer-header h3 {
      font-size: 1.125rem;
      font-weight: 700;
      margin: 0 0 0.25rem;
    }

    .audit-drawer-subtitle {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      margin: 0;
    }

    .current-level {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .cl-label {
      font-size: 0.875rem;
      font-weight: 600;
    }

    .perm-badge--full { background: #dcfce7; color: #16a34a; padding: 0.25rem 0.625rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
    .perm-badge--partial { background: #fef9c3; color: #ca8a04; padding: 0.25rem 0.625rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
    .perm-badge--none { background: #fee2e2; color: #dc2626; padding: 0.25rem 0.625rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
    .perm-badge--emergency-only { background: #dbeafe; color: #2563eb; padding: 0.25rem 0.625rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }

    /* Audit entries */
    .audit-entries {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .audit-entry {
      display: flex;
      gap: 0.625rem;
      padding: 0.625rem 0;
      border-bottom: 1px solid var(--surface-border);
    }

    .audit-entry:last-child {
      border-bottom: none;
    }

    .ae-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--primary-50);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .ae-icon i {
      font-size: 0.75rem;
      color: var(--primary-color);
    }

    .ae-content {
      flex: 1;
    }

    .ae-action {
      font-size: 0.8rem;
      font-weight: 600;
      display: block;
      margin-bottom: 0.125rem;
    }

    .ae-details {
      font-size: 0.78rem;
      color: var(--text-color-secondary);
      margin: 0 0 0.125rem;
      line-height: 1.4;
    }

    .ae-meta {
      font-size: 0.7rem;
      color: var(--text-color-secondary);
    }

    .no-audit {
      text-align: center;
      padding: 2rem 1rem;
      color: var(--text-color-secondary);
    }

    .no-audit i {
      font-size: 1.5rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    .no-audit p {
      font-size: 0.875rem;
      margin: 0;
    }
  `],
})
export class PermissionManagementComponent {
  private readonly familyService = inject(FamilyService);

  protected readonly humanMembers = this.familyService.humanMembers;
  protected readonly permissionMatrix = this.familyService.permissionMatrix;
  protected readonly auditLog = this.familyService.auditLog;

  protected readonly categories = ALL_CATEGORIES;

  protected readonly highlightedMemberId = signal<string | null>(null);
  protected auditDrawerVisible = false;
  protected readonly auditContext = signal<AuditDrawerContext | null>(null);

  protected readonly accessOptions: AccessOption[] = [
    { label: 'Full', value: 'full', styleClass: 'opt-full' },
    { label: 'Partial', value: 'partial', styleClass: 'opt-partial' },
    { label: 'None', value: 'none', styleClass: 'opt-none' },
    { label: 'Emergency', value: 'emergency-only', styleClass: 'opt-emergency' },
  ];

  protected getPermissionLevel(memberId: string, category: RecordCategory): AccessLevel {
    const matrix = this.permissionMatrix();
    const entry = matrix.find(m => m.memberId === memberId);
    return entry?.permissions[category] ?? 'none';
  }

  protected updatePermission(memberId: string, category: RecordCategory, level: AccessLevel): void {
    this.familyService.updatePermissions(memberId, category, level);
    this.highlightedMemberId.set(memberId);
    setTimeout(() => this.highlightedMemberId.set(null), 1200);
  }

  protected grantEmergencyToAll(): void {
    const members = this.humanMembers().filter(m => !m.isProband);
    for (const member of members) {
      for (const cat of this.categories) {
        const current = this.getPermissionLevel(member.id, cat);
        if (current === 'none') {
          this.familyService.updatePermissions(member.id, cat, 'emergency-only');
        }
      }
    }
  }

  protected openAuditDrawer(member: FamilyMember, category: RecordCategory): void {
    const entries = this.auditLog().filter(
      e =>
        e.targetMemberId === member.id &&
        (e.details.toLowerCase().includes(category) ||
          e.action.includes('PERMISSION'))
    );
    this.auditContext.set({ member, category, entries });
    this.auditDrawerVisible = true;
  }

  protected exportCsv(): void {
    const matrix = this.permissionMatrix();
    const headers = ['Member', 'Relationship', ...this.categories.map(c => CATEGORY_LABELS[c])];
    const rows = matrix.map(entry => {
      const member = this.humanMembers().find(m => m.id === entry.memberId);
      return [
        entry.memberName,
        member ? this.formatRelationship(member.relationship) : '',
        ...this.categories.map(cat => entry.permissions[cat] ?? 'none'),
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'family-permissions.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  protected isSensitive(cat: RecordCategory): boolean {
    return SENSITIVE_CATEGORIES.has(cat);
  }

  protected getCategoryLabel(cat: RecordCategory): string {
    return CATEGORY_LABELS[cat] ?? cat;
  }

  protected formatRelationship(rel: string): string {
    const map: Record<string, string> = {
      spouse: 'Spouse',
      partner: 'Partner',
      child: 'Child',
      parent: 'Parent',
      grandparent: 'Grandparent',
      sibling: 'Sibling',
      'aunt-uncle': 'Aunt/Uncle',
      cousin: 'Cousin',
      'niece-nephew': 'Niece/Nephew',
    };
    return map[rel] ?? rel;
  }

  protected formatAccessLevel(level: AccessLevel): string {
    const map: Record<AccessLevel, string> = {
      full: 'Full',
      partial: 'Partial',
      none: 'None',
      'emergency-only': 'Emergency',
    };
    return map[level] ?? level;
  }

  protected getAuditIcon(action: string): string {
    if (action.includes('PERMISSION')) return 'pi pi-lock';
    if (action.includes('MEMBER')) return 'pi pi-user';
    if (action.includes('CONDITION')) return 'pi pi-heart';
    if (action.includes('GENETIC')) return 'pi pi-sliders-h';
    return 'pi pi-info-circle';
  }

  protected formatAction(action: string): string {
    return action
      .split('_')
      .map(w => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
  }
}
