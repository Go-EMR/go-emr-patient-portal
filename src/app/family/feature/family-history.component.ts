// =============================================================================
// Family History Component — Task 13
// Route: /health/family-history
// Split-pane embedded D3 chart (left) + condition entry form (right)
// =============================================================================

import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';

import { FamilyService } from '../data-access/family.service';
import { FamilyMember, FamilyCondition, RelationshipType, SexAtBirth } from '../data-access/family.models';
import { SNOMED_CONDITIONS, CONDITION_CATEGORIES } from '../data-access/snomed-conditions.data';
import { ConditionEntryComponent } from '../ui/condition-entry.component';
import { CompletenessTrackerComponent } from '../ui/completeness-tracker.component';
import { FamilyChartComponent } from './family-chart.component';

@Component({
  selector: 'app-family-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    AutoCompleteModule,
    SelectModule,
    SelectButtonModule,
    InputNumberModule,
    ToggleSwitchModule,
    DividerModule,
    InputTextModule,
    TagModule,
    DialogModule,
    ConditionEntryComponent,
    CompletenessTrackerComponent,
    FamilyChartComponent,
  ],
  template: `
    <div class="fh-page">
      <!-- Page header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon"><i class="pi pi-sitemap"></i></div>
          <div>
            <h1 class="page-title">Family History</h1>
            <p class="page-subtitle">Document hereditary conditions across generations to support clinical risk assessment</p>
          </div>
        </div>
        <p-button
          label="Add History-Only Member"
          icon="pi pi-user-plus"
          severity="secondary"
          [outlined]="true"
          (onClick)="showAddMemberDialog = true"
        ></p-button>
      </div>

      <!-- Three-column layout: tree | form | tracker -->
      <div class="fh-layout">

        <!-- LEFT: Family Tree (embedded D3 pedigree chart) -->
        <div class="tree-pane">
          <div class="tree-pane-header">Family Tree</div>
          <div class="chart-embed-wrap">
            <app-family-chart
              [embedded]="true"
              (nodeSelected)="onChartNodeSelected($event)"
            ></app-family-chart>
          </div>
        </div>

        <!-- MIDDLE: Right pane - member detail + condition entry -->
        <div class="detail-pane">
          @if (selectedMember(); as m) {
            <div class="member-header">
              <div
                class="member-avatar"
                [style.background]="m.avatarColor"
                [class.female-avatar]="m.sexAtBirth === 'female'"
              >{{ getInitials(m) }}</div>
              <div class="member-header-info">
                <h2 class="member-name">{{ m.firstName }} {{ m.lastName }}</h2>
                <p class="member-meta">
                  {{ m.relationship | titlecase }}
                  @if (m.isDeceased) { &nbsp;&bull;&nbsp;<span class="deceased-badge">Deceased</span> }
                  @if (m.dateOfBirth) { &nbsp;&bull;&nbsp;b. {{ m.dateOfBirth | date:'yyyy' }} }
                </p>
              </div>
            </div>

            <p-divider></p-divider>

            <!-- Existing conditions -->
            <div class="conditions-section">
              <div class="section-header">
                <span class="section-title">Conditions</span>
                <p-button
                  label="Add Condition"
                  icon="pi pi-plus"
                  size="small"
                  (onClick)="showConditionForm.set(!showConditionForm())"
                ></p-button>
              </div>

              @if (showConditionForm()) {
                <app-condition-entry
                  [memberId]="m.id"
                  (conditionSaved)="onConditionSaved()"
                  (cancelled)="showConditionForm.set(false)"
                ></app-condition-entry>
                <p-divider></p-divider>
              }

              @if (m.conditions.length === 0) {
                <p class="empty-text">No conditions recorded for {{ m.firstName }}.</p>
              } @else {
                @for (cond of m.conditions; track cond.id) {
                  <div class="condition-card">
                    <div class="cond-top">
                      <span class="cond-name">{{ cond.conditionName }}</span>
                      <div class="cond-actions">
                        <p-tag
                          [value]="cond.status | titlecase"
                          [severity]="condStatusSeverity(cond.status)"
                        ></p-tag>
                        <p-button
                          icon="pi pi-trash"
                          severity="danger"
                          [text]="true"
                          size="small"
                          title="Remove condition"
                          (onClick)="removeCondition(m.id, cond.id)"
                        ></p-button>
                      </div>
                    </div>
                    <div class="cond-meta">
                      <span class="cond-category">{{ cond.category }}</span>
                      @if (cond.onsetAge) { <span>Onset: age {{ cond.onsetAge }}</span> }
                      @if (cond.contributedToDeath) {
                        <span class="death-flag"><i class="pi pi-exclamation-circle"></i> Contributed to death</span>
                      }
                    </div>
                    @if (cond.notes) {
                      <p class="cond-notes">{{ cond.notes }}</p>
                    }
                  </div>
                }
              }
            </div>

          } @else {
            <div class="select-prompt">
              <i class="pi pi-sitemap prompt-icon"></i>
              <p>Select a family member from the tree to view and edit their conditions.</p>
            </div>
          }
        </div>

        <!-- RIGHT: Completeness tracker -->
        <div class="tracker-pane">
          <app-completeness-tracker
            [members]="familyService.humanMembers()"
          ></app-completeness-tracker>
        </div>

      </div>
    </div>

    <!-- Add History-Only Member Dialog -->
    <p-dialog
      header="Add History-Only Member"
      [(visible)]="showAddMemberDialog"
      [modal]="true"
      [style]="{ width: '480px' }"
      [closable]="true"
    >
      <div class="add-member-form">
        <div class="form-row">
          <div class="field">
            <label class="field-label">First Name *</label>
            <input pInputText [(ngModel)]="newMember.firstName" placeholder="First name" style="width:100%" />
          </div>
          <div class="field">
            <label class="field-label">Last Name</label>
            <input pInputText [(ngModel)]="newMember.lastName" placeholder="Last name" style="width:100%" />
          </div>
        </div>

        <div class="form-row">
          <div class="field">
            <label class="field-label">Relationship *</label>
            <p-select
              [(ngModel)]="newMember.relationship"
              [options]="relationshipOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select..."
              styleClass="w-full"
            ></p-select>
          </div>
          <div class="field">
            <label class="field-label">Sex at Birth</label>
            <p-select
              [(ngModel)]="newMember.sexAtBirth"
              [options]="sexOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select..."
              styleClass="w-full"
            ></p-select>
          </div>
        </div>

        <div class="field">
          <label class="field-label">Notes</label>
          <input pInputText [(ngModel)]="newMember.notes" placeholder="Optional notes..." style="width:100%" />
        </div>

        <div class="field field-row">
          <label class="field-label">Deceased</label>
          <p-toggleswitch [(ngModel)]="newMember.isDeceased"></p-toggleswitch>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <p-button label="Cancel" severity="secondary" [outlined]="true" (onClick)="showAddMemberDialog = false"></p-button>
        <p-button label="Add Member" icon="pi pi-check" (onClick)="addHistoryMember()"></p-button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .fh-page {
      max-width: 1400px;
      margin: 0 auto;
      padding-bottom: 2rem;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      gap: 1rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      width: 48px; height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
      color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.35rem;
      flex-shrink: 0;
    }

    .page-title { margin: 0 0 0.2rem; font-size: 1.5rem; font-weight: 700; color: var(--text-color); }
    .page-subtitle { margin: 0; font-size: 0.875rem; color: var(--text-color-secondary); }

    /* Three-column layout */
    .fh-layout {
      display: grid;
      grid-template-columns: 260px 1fr 240px;
      gap: 1.25rem;
      align-items: start;
    }

    /* ── Tree pane ── */
    .tree-pane {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1rem;
      height: calc(100vh - 200px);
      min-height: 450px;
    }

    .tree-pane-header {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-color-secondary);
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .chart-embed-wrap {
      height: calc(100% - 40px);
      min-height: 350px;
    }

    /* ── Detail pane ── */
    .detail-pane {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1.25rem;
      min-height: 500px;
    }

    .member-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .member-avatar {
      width: 52px; height: 52px;
      border-radius: 4px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
      font-weight: 800;
      color: white;
      flex-shrink: 0;
    }

    .member-avatar.female-avatar { border-radius: 50%; }

    .member-name { margin: 0 0 0.2rem; font-size: 1.2rem; font-weight: 700; color: var(--text-color); }

    .member-meta {
      margin: 0;
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      display: flex; align-items: center; flex-wrap: wrap; gap: 0.25rem;
    }

    .deceased-badge {
      background: var(--surface-300);
      color: var(--text-color-secondary);
      font-size: 0.7rem;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 10px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.875rem;
    }

    .section-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-color);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Condition cards */
    .condition-card {
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      padding: 0.875rem;
      margin-bottom: 0.625rem;
      background: var(--surface-50);
    }

    .cond-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.375rem;
    }

    .cond-name {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .cond-actions {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .cond-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .cond-category {
      background: var(--surface-200);
      padding: 1px 6px;
      border-radius: 10px;
      font-weight: 600;
    }

    .death-flag {
      color: var(--red-600);
      display: flex; align-items: center; gap: 0.25rem;
    }

    .cond-notes {
      font-size: 0.78rem;
      color: var(--text-color-secondary);
      margin: 0.5rem 0 0;
      line-height: 1.5;
    }

    .empty-text {
      color: var(--text-color-secondary);
      font-style: italic;
      font-size: 0.875rem;
      padding: 1rem 0;
    }

    .select-prompt {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400px;
      text-align: center;
      color: var(--text-color-secondary);
      gap: 1rem;
    }

    .prompt-icon {
      font-size: 3.5rem;
      opacity: 0.2;
    }

    /* Add member dialog */
    .add-member-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.875rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .field-row {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }

    .field-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    @media (max-width: 1100px) {
      .fh-layout { grid-template-columns: 220px 1fr; }
      .tracker-pane { display: none; }
    }

    @media (max-width: 768px) {
      .fh-layout { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; align-items: flex-start; }
    }
  `],
})
export class FamilyHistoryComponent {
  readonly familyService = inject(FamilyService);
  private readonly router = inject(Router);

  private readonly _selectedId = signal<string | null>(null);
  readonly selectedMemberId = this._selectedId.asReadonly();
  readonly selectedMember = computed<FamilyMember | null>(() => {
    const id = this._selectedId();
    if (!id) return null;
    return this.familyService.members().find(m => m.id === id) ?? null;
  });

  readonly showConditionForm = signal(false);

  // Add member dialog
  showAddMemberDialog = false;
  newMember = {
    firstName: '',
    lastName: '',
    relationship: 'parent' as RelationshipType,
    sexAtBirth: 'unknown' as SexAtBirth,
    isDeceased: false,
    notes: '',
  };

  readonly relationshipOptions = [
    { label: 'Parent',       value: 'parent'     },
    { label: 'Grandparent',  value: 'grandparent'},
    { label: 'Sibling',      value: 'sibling'    },
    { label: 'Aunt / Uncle', value: 'aunt-uncle' },
    { label: 'Child',        value: 'child'      },
    { label: 'Cousin',       value: 'cousin'     },
  ];

  readonly sexOptions = [
    { label: 'Male',    value: 'male'    },
    { label: 'Female',  value: 'female'  },
    { label: 'Unknown', value: 'unknown' },
  ];

  selectMember(m: FamilyMember): void {
    this._selectedId.set(m.id);
    this.showConditionForm.set(false);
  }

  onChartNodeSelected(memberId: string): void {
    const member = this.familyService.members().find(m => m.id === memberId);
    if (member) {
      this.selectMember(member);
    }
  }

  getInitials(m: FamilyMember): string {
    return (m.firstName[0] ?? '') + (m.lastName[0] ?? '');
  }

  condStatusSeverity(status: string): 'danger' | 'warn' | 'success' | 'secondary' {
    if (status === 'affected') return 'danger';
    if (status === 'carrier')  return 'warn';
    if (status === 'unaffected') return 'success';
    return 'secondary';
  }

  removeCondition(memberId: string, conditionId: string): void {
    this.familyService.removeCondition(memberId, conditionId);
  }

  onConditionSaved(): void {
    this.showConditionForm.set(false);
  }

  addHistoryMember(): void {
    if (!this.newMember.firstName) return;
    this.familyService.addMember({
      firstName: this.newMember.firstName,
      lastName: this.newMember.lastName,
      relationship: this.newMember.relationship,
      sexAtBirth: this.newMember.sexAtBirth,
      isDeceased: this.newMember.isDeceased,
      notes: this.newMember.notes || undefined,
      source: 'history-only',
      biologicalRelation: 'biological',
    });
    this.showAddMemberDialog = false;
    this.newMember = {
      firstName: '', lastName: '',
      relationship: 'parent', sexAtBirth: 'unknown',
      isDeceased: false, notes: '',
    };
  }
}
