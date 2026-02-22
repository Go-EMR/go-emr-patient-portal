import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { DividerModule } from 'primeng/divider';

import {
  FamilyMember,
  PetProfile,
  FamilyCondition,
  AuditLogEntry,
  AccessLevel,
  RecordCategory,
} from '../data-access/family.models';
import { FamilyService } from '../data-access/family.service';

// =============================================================================
// Edit form model
// =============================================================================

interface EditForm {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  relationship: string;
  biologicalRelation: string;
  notes: string;
}

// =============================================================================
// Component
// =============================================================================

@Component({
  selector: 'app-chart-detail-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TabViewModule,
    TagModule,
    TimelineModule,
    ButtonModule,
    InputTextModule,
    CalendarModule,
    DropdownModule,
    DividerModule,
  ],
  template: `
    <div class="detail-panel" role="complementary" aria-label="Member detail panel">
      <!-- Header -->
      <div class="detail-header">
        <div class="detail-avatar" [style.background]="avatarBg()">
          {{ initials() }}
        </div>
        <div class="detail-title">
          <h3 class="detail-name">{{ displayName() }}</h3>
          <span class="detail-subtitle">{{ displaySubtitle() }}</span>
        </div>
        <button
          pButton
          type="button"
          icon="pi pi-times"
          class="p-button-text p-button-sm detail-close"
          aria-label="Close detail panel"
          (click)="onClose()"
        ></button>
      </div>

      <p-divider styleClass="my-0"></p-divider>

      <!-- No selection state -->
      <div *ngIf="!member && !pet" class="detail-empty">
        <i class="pi pi-user" style="font-size: 2rem; color: #d1d5db;"></i>
        <p>Select a member to view details</p>
      </div>

      <!-- Member detail tabs -->
      <p-tabView *ngIf="member || pet" styleClass="detail-tabs">

        <!-- ── Health Tab ─────────────────────────────────────────────────── -->
        <p-tabPanel header="Health" leftIcon="pi pi-heart">
          <div class="tab-content" *ngIf="member">

            <!-- Risk level badge -->
            <div class="health-risk-row" *ngIf="overallRisk()">
              <span class="risk-label">Overall Risk:</span>
              <p-tag
                [value]="overallRisk()"
                [severity]="riskSeverity()"
                styleClass="risk-tag"
              ></p-tag>
            </div>

            <!-- Conditions list -->
            <div class="section-header">
              <i class="pi pi-exclamation-circle"></i>
              <span>Conditions ({{ member.conditions.length }})</span>
            </div>

            <div
              *ngFor="let cond of member.conditions; trackBy: trackCondition"
              class="condition-card"
            >
              <div class="condition-top">
                <span class="condition-name">{{ cond.conditionName }}</span>
                <p-tag
                  [value]="cond.status"
                  [severity]="conditionSeverity(cond.status)"
                  styleClass="status-tag"
                ></p-tag>
              </div>
              <div class="condition-meta">
                <span class="meta-item" *ngIf="cond.onsetAge">
                  <i class="pi pi-clock"></i> Age {{ cond.onsetAge }}
                </span>
                <span class="meta-item">
                  <i class="pi pi-tag"></i> {{ cond.category }}
                </span>
                <span class="meta-item death-flag" *ngIf="cond.contributedToDeath">
                  <i class="pi pi-flag-fill"></i> Contributing cause
                </span>
              </div>
              <p class="condition-notes" *ngIf="cond.notes">{{ cond.notes }}</p>
            </div>

            <div class="empty-state" *ngIf="member.conditions.length === 0">
              <i class="pi pi-check-circle"></i>
              No conditions recorded
            </div>

            <p-divider *ngIf="member.geneticTests.length > 0"></p-divider>

            <!-- Genetic tests -->
            <div class="section-header" *ngIf="member.geneticTests.length > 0">
              <i class="pi pi-dna"></i>
              <span>Genetic Tests ({{ member.geneticTests.length }})</span>
            </div>

            <div
              *ngFor="let test of member.geneticTests; trackBy: trackTest"
              class="genetic-test-card"
            >
              <div class="test-top">
                <span class="test-name">{{ test.testName }}</span>
                <p-tag
                  [value]="test.classification"
                  [severity]="classificationSeverity(test.classification)"
                  styleClass="class-tag"
                ></p-tag>
              </div>
              <div class="test-meta">
                <span class="meta-item"><i class="pi pi-dna"></i> {{ test.geneName }}: {{ test.variant ?? '—' }}</span>
                <span class="meta-item"><i class="pi pi-building"></i> {{ test.lab }}</span>
                <span class="meta-item"><i class="pi pi-calendar"></i> {{ formatDate(test.testDate) }}</span>
              </div>
              <p class="test-summary">{{ test.resultSummary }}</p>
            </div>
          </div>

          <!-- Pet health tab -->
          <div class="tab-content" *ngIf="pet && !member">
            <div class="section-header">
              <i class="pi pi-heart"></i>
              <span>Vaccinations ({{ pet.vaccinations.length }})</span>
            </div>
            <div *ngFor="let vac of pet.vaccinations" class="condition-card">
              <div class="condition-top">
                <span class="condition-name">{{ vac.vaccineName }}</span>
                <p-tag value="vaccinated" severity="success"></p-tag>
              </div>
              <div class="condition-meta">
                <span class="meta-item"><i class="pi pi-calendar"></i> {{ formatDate(vac.administeredDate) }}</span>
                <span class="meta-item" *ngIf="vac.nextDueDate">Next: {{ formatDate(vac.nextDueDate) }}</span>
              </div>
            </div>

            <p-divider *ngIf="pet.allergies.length > 0"></p-divider>
            <div class="section-header" *ngIf="pet.allergies.length > 0">
              <i class="pi pi-exclamation-triangle"></i>
              <span>Allergies ({{ pet.allergies.length }})</span>
            </div>
            <div *ngFor="let allergy of pet.allergies" class="condition-card">
              <div class="condition-top">
                <span class="condition-name">{{ allergy.allergen }}</span>
                <p-tag [value]="allergy.severity" [severity]="allergySeverity(allergy.severity)"></p-tag>
              </div>
              <p class="condition-notes">{{ allergy.reaction }}</p>
            </div>
          </div>
        </p-tabPanel>

        <!-- ── Access Tab ─────────────────────────────────────────────────── -->
        <p-tabPanel header="Access" leftIcon="pi pi-lock" *ngIf="member">
          <div class="tab-content">
            <!-- Overall access level -->
            <div class="access-level-row">
              <span class="access-label">Access Level:</span>
              <p-tag
                [value]="member.accessLevel"
                [severity]="accessSeverity(member.accessLevel)"
              ></p-tag>
            </div>

            <p-divider></p-divider>

            <!-- Per-category permissions grid -->
            <div class="section-header">
              <i class="pi pi-table"></i>
              <span>Record Category Permissions</span>
            </div>

            <div class="permissions-grid">
              <div
                *ngFor="let entry of memberPermissions(); trackBy: trackPermission"
                class="permission-row"
              >
                <span class="perm-category">{{ formatCategory(entry.category) }}</span>
                <span class="perm-level" [class]="'perm-' + entry.level">
                  {{ entry.level }}
                </span>
              </div>
              <div class="empty-state" *ngIf="memberPermissions().length === 0">
                <i class="pi pi-info-circle"></i>
                No permissions configured
              </div>
            </div>

            <div class="proxy-status" *ngIf="member.proxyStatus">
              <i class="pi pi-shield"></i>
              Proxy Status: <strong>{{ member.proxyStatus }}</strong>
            </div>
          </div>
        </p-tabPanel>

        <!-- ── History Tab ────────────────────────────────────────────────── -->
        <p-tabPanel header="History" leftIcon="pi pi-history">
          <div class="tab-content">
            <p-timeline
              [value]="memberAuditLog()"
              styleClass="audit-timeline"
            >
              <ng-template pTemplate="marker" let-event>
                <span class="timeline-marker" [class]="'marker-' + event.category">
                  <i [class]="auditIcon(event.action)"></i>
                </span>
              </ng-template>
              <ng-template pTemplate="content" let-event>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <span class="timeline-action">{{ formatAction(event.action) }}</span>
                    <span class="timeline-date">{{ formatDateShort(event.timestamp) }}</span>
                  </div>
                  <p class="timeline-details">{{ event.details }}</p>
                  <span class="timeline-actor">by {{ event.actorName }}</span>
                </div>
              </ng-template>
            </p-timeline>

            <div class="empty-state" *ngIf="memberAuditLog().length === 0">
              <i class="pi pi-history"></i>
              No history entries
            </div>
          </div>
        </p-tabPanel>

        <!-- ── Edit Tab ───────────────────────────────────────────────────── -->
        <p-tabPanel header="Edit" leftIcon="pi pi-pencil" *ngIf="member">
          <div class="tab-content">
            <div class="edit-form" *ngIf="editForm()">
              <div class="form-row">
                <label for="edit-first-name">First Name</label>
                <input
                  id="edit-first-name"
                  pInputText
                  [(ngModel)]="editFormValue.firstName"
                  placeholder="First name"
                  class="w-full"
                />
              </div>

              <div class="form-row">
                <label for="edit-last-name">Last Name</label>
                <input
                  id="edit-last-name"
                  pInputText
                  [(ngModel)]="editFormValue.lastName"
                  placeholder="Last name"
                  class="w-full"
                />
              </div>

              <div class="form-row">
                <label for="edit-dob">Date of Birth</label>
                <p-calendar
                  id="edit-dob"
                  [(ngModel)]="editFormValue.dateOfBirth"
                  dateFormat="mm/dd/yy"
                  [showIcon]="true"
                  placeholder="MM/DD/YYYY"
                  styleClass="w-full"
                ></p-calendar>
              </div>

              <div class="form-row">
                <label for="edit-relationship">Relationship</label>
                <p-dropdown
                  id="edit-relationship"
                  [(ngModel)]="editFormValue.relationship"
                  [options]="relationshipOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select relationship"
                  styleClass="w-full"
                ></p-dropdown>
              </div>

              <div class="form-row">
                <label for="edit-bio-relation">Biological Relation</label>
                <p-dropdown
                  id="edit-bio-relation"
                  [(ngModel)]="editFormValue.biologicalRelation"
                  [options]="biologicalOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select relation type"
                  styleClass="w-full"
                ></p-dropdown>
              </div>

              <div class="form-row">
                <label for="edit-notes">Notes</label>
                <textarea
                  id="edit-notes"
                  [(ngModel)]="editFormValue.notes"
                  class="w-full edit-notes-input"
                  rows="3"
                  placeholder="Clinical notes..."
                ></textarea>
              </div>

              <div class="edit-actions">
                <button
                  pButton
                  type="button"
                  label="Save Changes"
                  icon="pi pi-check"
                  class="p-button-sm"
                  (click)="saveEdit()"
                ></button>
                <button
                  pButton
                  type="button"
                  label="Cancel"
                  icon="pi pi-times"
                  class="p-button-sm p-button-text"
                  (click)="resetEdit()"
                ></button>
              </div>
            </div>
          </div>
        </p-tabPanel>

      </p-tabView>
    </div>
  `,
  styles: [`
    .detail-panel {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #fff;
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      flex-shrink: 0;
    }

    .detail-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 700;
      font-size: 16px;
      flex-shrink: 0;
    }

    .detail-title {
      flex: 1;
      min-width: 0;
    }

    .detail-name {
      font-size: 15px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 2px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .detail-subtitle {
      font-size: 12px;
      color: #6b7280;
      text-transform: capitalize;
    }

    .detail-close {
      flex-shrink: 0;
    }

    .detail-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: #9ca3af;
      font-size: 13px;
    }

    :host ::ng-deep .detail-tabs .p-tabview-panels {
      padding: 0;
      overflow-y: auto;
      max-height: calc(100vh - 200px);
    }

    :host ::ng-deep .detail-tabs .p-tabview-nav {
      font-size: 12px;
    }

    .tab-content {
      padding: 12px 14px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 10px;
    }

    .health-risk-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .risk-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
    }

    .condition-card {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 8px;
      background: #fafafa;
    }

    .condition-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .condition-name {
      font-size: 13px;
      font-weight: 600;
      color: #111827;
    }

    .condition-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 4px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #6b7280;
    }

    .death-flag {
      color: #dc2626;
    }

    .condition-notes {
      font-size: 11px;
      color: #6b7280;
      margin: 4px 0 0 0;
      line-height: 1.5;
    }

    .genetic-test-card {
      border: 1px solid #ddd6fe;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 8px;
      background: #faf5ff;
    }

    .test-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .test-name {
      font-size: 13px;
      font-weight: 600;
      color: #111827;
    }

    .test-meta {
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin-bottom: 4px;
    }

    .test-summary {
      font-size: 11px;
      color: #6b7280;
      margin: 4px 0 0 0;
      line-height: 1.5;
    }

    .empty-state {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      color: #9ca3af;
      font-size: 12px;
      justify-content: center;
    }

    .access-level-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
    }

    .access-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
    }

    .permissions-grid {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .permission-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 5px 8px;
      border-radius: 4px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
    }

    .perm-category {
      font-size: 12px;
      color: #374151;
      text-transform: capitalize;
    }

    .perm-level {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 10px;
    }

    .perm-full     { background: #dcfce7; color: #16a34a; }
    .perm-partial  { background: #fef3c7; color: #d97706; }
    .perm-none     { background: #fee2e2; color: #dc2626; }
    .perm-emergency-only { background: #dbeafe; color: #2563eb; }

    .proxy-status {
      margin-top: 12px;
      font-size: 12px;
      color: #6b7280;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    :host ::ng-deep .audit-timeline .p-timeline-event-content {
      padding-bottom: 16px;
    }

    .timeline-marker {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      color: #374151;
    }

    .timeline-content {
      padding: 0 0 0 8px;
    }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2px;
    }

    .timeline-action {
      font-size: 12px;
      font-weight: 600;
      color: #111827;
    }

    .timeline-date {
      font-size: 10px;
      color: #9ca3af;
    }

    .timeline-details {
      font-size: 11px;
      color: #6b7280;
      margin: 2px 0;
      line-height: 1.4;
    }

    .timeline-actor {
      font-size: 10px;
      color: #9ca3af;
      font-style: italic;
    }

    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .form-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .form-row label {
      font-size: 11px;
      font-weight: 600;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .edit-notes-input {
      width: 100%;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 8px;
      font-size: 12px;
      font-family: inherit;
      resize: vertical;
    }

    .edit-actions {
      display: flex;
      gap: 8px;
      padding-top: 4px;
    }
  `],
})
export class ChartDetailPanelComponent implements OnChanges {
  @Input() member: FamilyMember | null = null;
  @Input() pet: PetProfile | null = null;
  @Output() closed = new EventEmitter<void>();

  private readonly familyService = inject(FamilyService);

  // ── Edit form state ─────────────────────────────────────────────────────
  readonly editForm = signal<boolean>(true);

  editFormValue: EditForm = {
    firstName: '',
    lastName: '',
    dateOfBirth: null,
    relationship: '',
    biologicalRelation: '',
    notes: '',
  };

  readonly relationshipOptions = [
    { label: 'Spouse',         value: 'spouse'      },
    { label: 'Partner',        value: 'partner'     },
    { label: 'Child',          value: 'child'       },
    { label: 'Parent',         value: 'parent'      },
    { label: 'Grandparent',    value: 'grandparent' },
    { label: 'Sibling',        value: 'sibling'     },
    { label: 'Aunt / Uncle',   value: 'aunt-uncle'  },
    { label: 'Cousin',         value: 'cousin'      },
  ];

  readonly biologicalOptions = [
    { label: 'Biological', value: 'biological' },
    { label: 'Adopted',    value: 'adopted'    },
    { label: 'Step',       value: 'step'       },
    { label: 'Half',       value: 'half'       },
    { label: 'Foster',     value: 'foster'     },
    { label: 'None',       value: 'none'       },
  ];

  // ── Computed display helpers ─────────────────────────────────────────────

  readonly displayName = computed<string>(() => {
    if (this.member) return `${this.member.firstName} ${this.member.lastName}`;
    if (this.pet)    return this.pet.name;
    return 'No selection';
  });

  readonly displaySubtitle = computed<string>(() => {
    if (this.member) {
      const rel = this.member.relationship;
      const deceased = this.member.isDeceased ? ' (deceased)' : '';
      return `${rel}${deceased}`;
    }
    if (this.pet) return `${this.pet.species}${this.pet.breed ? ` — ${this.pet.breed}` : ''}`;
    return '';
  });

  readonly avatarBg = computed<string>(() => {
    if (this.member) return this.member.avatarColor;
    if (this.pet)    return this.pet.avatarColor;
    return '#9ca3af';
  });

  readonly initials = computed<string>(() => {
    if (this.member) {
      return `${this.member.firstName[0] ?? '?'}${this.member.lastName[0] ?? ''}`.toUpperCase();
    }
    if (this.pet) return this.pet.name[0]?.toUpperCase() ?? '?';
    return '?';
  });

  readonly overallRisk = computed<string>(() => {
    if (!this.member) return '';
    const affected = this.member.conditions.filter(c => c.status === 'affected');
    if (affected.length >= 3) return 'High';
    if (affected.length >= 1) return 'Moderate';
    return '';
  });

  readonly riskSeverity = computed<string>(() => {
    const r = this.overallRisk();
    if (r === 'High')     return 'danger';
    if (r === 'Moderate') return 'warning';
    return 'success';
  });

  // ── Permission data ──────────────────────────────────────────────────────

  readonly memberPermissions = computed<{ category: RecordCategory; level: string }[]>(() => {
    if (!this.member) return [];
    const matrix = this.familyService.permissionMatrix();
    const entry = matrix.find(m => m.memberId === this.member!.id);
    if (!entry) return [];
    return Object.entries(entry.permissions).map(([category, level]) => ({
      category: category as RecordCategory,
      level,
    }));
  });

  // ── Audit log for this member ────────────────────────────────────────────

  readonly memberAuditLog = computed<AuditLogEntry[]>(() => {
    if (!this.member) return [];
    return this.familyService.auditLog().filter(
      e => e.targetMemberId === this.member!.id
    );
  });

  // ── OnChanges: sync edit form ────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['member'] && this.member) {
      this.editFormValue = {
        firstName:        this.member.firstName,
        lastName:         this.member.lastName,
        dateOfBirth:      this.member.dateOfBirth ?? null,
        relationship:     this.member.relationship,
        biologicalRelation: this.member.biologicalRelation,
        notes:            this.member.notes ?? '',
      };
    }
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  onClose(): void {
    this.closed.emit();
  }

  saveEdit(): void {
    if (!this.member) return;
    this.familyService.updateMember(this.member.id, {
      firstName:         this.editFormValue.firstName,
      lastName:          this.editFormValue.lastName,
      dateOfBirth:       this.editFormValue.dateOfBirth ?? undefined,
      relationship:      this.editFormValue.relationship as FamilyMember['relationship'],
      biologicalRelation: this.editFormValue.biologicalRelation as FamilyMember['biologicalRelation'],
      notes:             this.editFormValue.notes,
    });
  }

  resetEdit(): void {
    if (this.member) {
      this.editFormValue = {
        firstName:        this.member.firstName,
        lastName:         this.member.lastName,
        dateOfBirth:      this.member.dateOfBirth ?? null,
        relationship:     this.member.relationship,
        biologicalRelation: this.member.biologicalRelation,
        notes:            this.member.notes ?? '',
      };
    }
  }

  // ── Template helpers ─────────────────────────────────────────────────────

  conditionSeverity(status: string): string {
    const map: Record<string, string> = {
      affected:   'danger',
      carrier:    'warning',
      unaffected: 'success',
      unknown:    'secondary',
    };
    return map[status] ?? 'secondary';
  }

  classificationSeverity(classification: string): string {
    const map: Record<string, string> = {
      pathogenic:         'danger',
      'likely-pathogenic':'warning',
      vus:                'secondary',
      'likely-benign':    'info',
      benign:             'success',
    };
    return map[classification] ?? 'secondary';
  }

  accessSeverity(level: AccessLevel): string {
    const map: Record<AccessLevel, string> = {
      full:             'success',
      partial:          'warning',
      none:             'danger',
      'emergency-only': 'info',
    };
    return map[level] ?? 'secondary';
  }

  allergySeverity(severity: string): string {
    const map: Record<string, string> = {
      mild:     'success',
      moderate: 'warning',
      severe:   'danger',
    };
    return map[severity] ?? 'secondary';
  }

  auditIcon(action: string): string {
    const map: Record<string, string> = {
      PERMISSION_UPDATED:    'pi pi-lock',
      MEMBER_ADDED:          'pi pi-user-plus',
      MEMBER_REMOVED:        'pi pi-user-minus',
      MEMBER_UPDATED:        'pi pi-pencil',
      CONDITION_ADDED:       'pi pi-plus-circle',
      CONDITION_REMOVED:     'pi pi-minus-circle',
      PET_ADDED:             'pi pi-heart',
      GENETIC_TEST_LINKED:   'pi pi-dna',
      FAMILY_GROUP_CREATED:  'pi pi-home',
    };
    return map[action] ?? 'pi pi-circle';
  }

  formatAction(action: string): string {
    return action.replace(/_/g, ' ').toLowerCase()
      .replace(/^\w/, c => c.toUpperCase());
  }

  formatDate(date: Date): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  formatDateShort(date: Date): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: '2-digit',
    });
  }

  formatCategory(category: string): string {
    return category.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase());
  }

  trackCondition(_: number, cond: FamilyCondition): string {
    return cond.id;
  }

  trackTest(_: number, test: { id: string }): string {
    return test.id;
  }

  trackPermission(_: number, entry: { category: string }): string {
    return entry.category;
  }
}
