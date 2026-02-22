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
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { FamilyService } from '../data-access/family.service';
import { FamilyMember, AccessLevel, RecordCategory } from '../data-access/family.models';
import { AddMemberSlideoverComponent } from './add-member-slideover.component';
import { FamilyChartComponent } from './family-chart.component';

interface ViewModeOption {
  label: string;
  value: 'list' | 'grid';
  icon: string;
}

@Component({
  selector: 'app-family-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    CardModule,
    AvatarModule,
    TagModule,
    TabsModule,
    SelectButtonModule,
    InputTextModule,
    DividerModule,
    BadgeModule,
    TooltipModule,
    AddMemberSlideoverComponent,
    FamilyChartComponent,
  ],
  template: `
    <div class="family-dashboard">
      <!-- Top toolbar -->
      <div class="family-toolbar">
        <div class="toolbar-left">
          <h1 class="page-title">
            <i class="pi pi-users" aria-hidden="true"></i>
            Family Management
          </h1>
          <span class="family-name">{{ familyGroup().name }}</span>
        </div>
        <div class="toolbar-actions">
          <p-selectButton
            [options]="viewModeOptions"
            [(ngModel)]="viewMode"
            optionLabel="label"
            optionValue="value"
            aria-label="View mode"
          >
            <ng-template pTemplate="item" let-opt>
              <i [class]="opt.icon" aria-hidden="true"></i>
            </ng-template>
          </p-selectButton>
          <button
            pButton
            label="Manage Permissions"
            icon="pi pi-lock"
            class="p-button-outlined p-button-secondary"
            routerLink="/family/permissions"
            aria-label="Manage family permissions"
          ></button>
          <button
            pButton
            label="Add Member"
            icon="pi pi-user-plus"
            class="p-button-primary"
            (click)="openAddMember()"
            aria-label="Add a new family member"
          ></button>
        </div>
      </div>

      <!-- Three-panel layout -->
      <div class="family-layout">
        <!-- Left sidebar: member list -->
        <aside class="family-sidebar" aria-label="Family members">
          <div class="sidebar-search">
            <span class="p-input-icon-left search-wrapper">
              <i class="pi pi-search" aria-hidden="true"></i>
              <input
                pInputText
                type="text"
                placeholder="Search members..."
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearch($event)"
                class="w-full"
                aria-label="Search family members"
              />
            </span>
          </div>

          <div class="member-list" role="list">
            @for (member of filteredMembers(); track member.id) {
              <div
                class="member-card"
                [class.selected]="selectedMemberId() === member.id"
                (click)="selectMember(member.id)"
                (keydown.enter)="selectMember(member.id)"
                (keydown.space)="selectMember(member.id)"
                role="button"
                tabindex="0"
                [attr.aria-label]="member.firstName + ' ' + member.lastName + ', ' + member.relationship"
                [attr.aria-pressed]="selectedMemberId() === member.id"
              >
                <div class="member-card-inner">
                  <div class="member-avatar-wrapper">
                    <p-avatar
                      [label]="getInitials(member)"
                      shape="circle"
                      size="large"
                      [style]="{
                        'background-color': member.avatarColor + '20',
                        'color': member.avatarColor,
                        'border': '2px solid ' + member.avatarColor
                      }"
                      aria-hidden="true"
                    ></p-avatar>
                    @if (member.isDeceased) {
                      <span class="deceased-badge" title="Deceased" aria-label="Deceased">
                        <i class="pi pi-moon" aria-hidden="true"></i>
                      </span>
                    }
                  </div>
                  <div class="member-info">
                    <div class="member-name-row">
                      <span class="member-name">
                        {{ member.firstName }} {{ member.lastName }}
                        @if (member.isProband) {
                          <i class="pi pi-star-fill proband-icon" pTooltip="Primary account holder" aria-label="Primary account holder"></i>
                        }
                      </span>
                    </div>
                    <div class="member-meta-row">
                      <p-tag
                        [value]="formatRelationship(member.relationship)"
                        [severity]="getRelationshipSeverity(member.relationship)"
                        styleClass="member-relationship-tag"
                      ></p-tag>
                      @if (member.dateOfBirth) {
                        <span class="member-age">{{ calculateAge(member.dateOfBirth) }} yrs</span>
                      }
                    </div>
                    <div class="member-access-row">
                      <span
                        class="access-badge"
                        [class]="'access-badge--' + member.accessLevel"
                      >
                        <i [class]="getAccessIcon(member.accessLevel)" aria-hidden="true"></i>
                        {{ formatAccessLevel(member.accessLevel) }}
                      </span>
                    </div>
                  </div>
                </div>
                @if (member.conditions.length > 0) {
                  <div class="member-conditions-preview">
                    <i class="pi pi-heart-fill" aria-hidden="true"></i>
                    {{ member.conditions.length }} condition{{ member.conditions.length !== 1 ? 's' : '' }}
                  </div>
                }
              </div>
            }

            @if (filteredMembers().length === 0) {
              <div class="empty-list">
                <i class="pi pi-search" aria-hidden="true"></i>
                <p>No members found</p>
              </div>
            }
          </div>

          <!-- Pets section -->
          @if (pets().length > 0) {
            <p-divider></p-divider>
            <div class="pets-section">
              <h3 class="pets-heading">
                <i class="pi pi-heart" aria-hidden="true"></i>
                Pets ({{ pets().length }})
              </h3>
              @for (pet of pets(); track pet.id) {
                <div class="pet-card" role="listitem">
                  <p-avatar
                    [label]="pet.name[0]"
                    shape="circle"
                    [style]="{
                      'background-color': pet.avatarColor + '20',
                      'color': pet.avatarColor,
                      'border': '2px solid ' + pet.avatarColor
                    }"
                    aria-hidden="true"
                  ></p-avatar>
                  <div class="pet-info">
                    <span class="pet-name">{{ pet.name }}</span>
                    <span class="pet-species">{{ pet.species | titlecase }} &middot; {{ pet.breed }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </aside>

        <!-- Center content -->
        <main class="family-center" id="family-main">
          @if (!selectedMember()) {
            <!-- Overview when no member selected: stat cards + embedded pedigree chart -->
            <div class="family-overview">
              <div class="overview-cards">
                <div class="overview-card overview-card--members">
                  <div class="oc-icon">
                    <i class="pi pi-users" aria-hidden="true"></i>
                  </div>
                  <div class="oc-content">
                    <span class="oc-value">{{ humanMembers().length }}</span>
                    <span class="oc-label">Family Members</span>
                  </div>
                </div>

                <div class="overview-card overview-card--conditions">
                  <div class="oc-icon">
                    <i class="pi pi-heart-fill" aria-hidden="true"></i>
                  </div>
                  <div class="oc-content">
                    <span class="oc-value">{{ familyConditions().length }}</span>
                    <span class="oc-label">Tracked Conditions</span>
                  </div>
                </div>

                <div class="overview-card overview-card--pets">
                  <div class="oc-icon">
                    <i class="pi pi-heart" aria-hidden="true"></i>
                  </div>
                  <div class="oc-content">
                    <span class="oc-value">{{ pets().length }}</span>
                    <span class="oc-label">Pets</span>
                  </div>
                </div>

                <div class="overview-card overview-card--genetic">
                  <div class="oc-icon">
                    <i class="pi pi-sliders-h" aria-hidden="true"></i>
                  </div>
                  <div class="oc-content">
                    <span class="oc-value">{{ membersWithGeneticTests().length }}</span>
                    <span class="oc-label">Genetic Tests</span>
                  </div>
                </div>
              </div>

              <!-- Condition summary -->
              @if (uniqueConditionNames().length > 0) {
                <div class="conditions-summary">
                  <h3>Conditions in Family History</h3>
                  <div class="condition-tags">
                    @for (condition of uniqueConditionNames(); track condition) {
                      <p-tag [value]="condition" severity="secondary" styleClass="condition-tag"></p-tag>
                    }
                  </div>
                </div>
              }

              <!-- Embedded pedigree chart -->
              <div class="chart-embed-container">
                <div class="chart-embed-header">
                  <h2 class="overview-title">Family Pedigree</h2>
                  <div class="chart-embed-actions">
                    <button
                      pButton
                      label="Full Screen"
                      icon="pi pi-external-link"
                      class="p-button-outlined p-button-sm"
                      routerLink="/family/chart"
                      aria-label="Open full-screen pedigree chart"
                    ></button>
                  </div>
                </div>
                <div class="chart-embed-canvas">
                  <app-family-chart
                    [embedded]="true"
                    (nodeSelected)="selectMember($event)"
                  ></app-family-chart>
                </div>
              </div>
            </div>
          } @else {
            <!-- Member summary when selected -->
            <div class="member-summary">
              <div class="member-summary-header">
                <p-avatar
                  [label]="getInitials(selectedMember()!)"
                  shape="circle"
                  size="xlarge"
                  [style]="{
                    'background-color': selectedMember()!.avatarColor + '20',
                    'color': selectedMember()!.avatarColor,
                    'border': '3px solid ' + selectedMember()!.avatarColor
                  }"
                  aria-hidden="true"
                ></p-avatar>
                <div class="member-summary-meta">
                  <h2>{{ selectedMember()!.firstName }} {{ selectedMember()!.lastName }}</h2>
                  <div class="member-summary-tags">
                    <p-tag
                      [value]="formatRelationship(selectedMember()!.relationship)"
                      [severity]="getRelationshipSeverity(selectedMember()!.relationship)"
                    ></p-tag>
                    @if (selectedMember()!.dateOfBirth) {
                      <p-tag
                        [value]="calculateAge(selectedMember()!.dateOfBirth!) + ' years old'"
                        severity="secondary"
                      ></p-tag>
                    }
                    @if (selectedMember()!.isDeceased) {
                      <p-tag value="Deceased" severity="danger"></p-tag>
                    }
                  </div>
                  <div class="member-summary-source">
                    <i class="pi pi-info-circle" aria-hidden="true"></i>
                    Source: {{ formatSource(selectedMember()!.source) }}
                    @if (selectedMember()!.linkedPatientId) {
                      &middot; Portal Linked
                    }
                  </div>
                </div>
                <button
                  pButton
                  icon="pi pi-times"
                  class="p-button-text p-button-rounded close-detail-btn"
                  (click)="clearSelection()"
                  aria-label="Close member detail"
                ></button>
              </div>

              @if (selectedMember()!.notes) {
                <div class="member-notes">
                  <i class="pi pi-info-circle" aria-hidden="true"></i>
                  {{ selectedMember()!.notes }}
                </div>
              }

              <!-- Quick stats -->
              <div class="member-quick-stats">
                <div class="quick-stat">
                  <span class="qs-value">{{ selectedMember()!.conditions.length }}</span>
                  <span class="qs-label">Conditions</span>
                </div>
                <div class="quick-stat">
                  <span class="qs-value">{{ selectedMember()!.geneticTests.length }}</span>
                  <span class="qs-label">Genetic Tests</span>
                </div>
                <div class="quick-stat">
                  <span class="qs-value">{{ selectedMember()!.identifiers.length }}</span>
                  <span class="qs-label">IDs on File</span>
                </div>
              </div>
            </div>
          }
        </main>

        <!-- Right detail panel -->
        @if (selectedMember()) {
          <aside class="family-detail-panel" aria-label="Member details">
            <p-tabs [value]="0">
              <p-tablist>
                <p-tab [value]="0"><i class="pi pi-heart-fill" aria-hidden="true"></i> Health</p-tab>
                <p-tab [value]="1"><i class="pi pi-lock" aria-hidden="true"></i> Access</p-tab>
                <p-tab [value]="2"><i class="pi pi-history" aria-hidden="true"></i> History</p-tab>
                <p-tab [value]="3"><i class="pi pi-pencil" aria-hidden="true"></i> Edit</p-tab>
              </p-tablist>
              <p-tabpanels>
                <!-- Panel 0: Health -->
                <p-tabpanel [value]="0">
                  <div class="tab-content">
                    <h3 class="tab-section-title">Conditions</h3>
                    @if (selectedMember()!.conditions.length > 0) {
                      <div class="conditions-list" role="list">
                        @for (condition of selectedMember()!.conditions; track condition.id) {
                          <div class="condition-item" role="listitem">
                            <div class="ci-header">
                              <span class="ci-name">{{ condition.conditionName }}</span>
                              <p-tag
                                [value]="condition.status"
                                [severity]="getConditionSeverity(condition.status)"
                                styleClass="ci-status-tag"
                              ></p-tag>
                            </div>
                            <div class="ci-meta">
                              <span class="ci-category">{{ condition.category }}</span>
                              @if (condition.onsetAge) {
                                <span class="ci-onset">Onset: age {{ condition.onsetAge }}</span>
                              }
                              @if (condition.contributedToDeath) {
                                <span class="ci-death">
                                  <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
                                  Contributed to death
                                </span>
                              }
                            </div>
                            @if (condition.notes) {
                              <p class="ci-notes">{{ condition.notes }}</p>
                            }
                          </div>
                        }
                      </div>
                    } @else {
                      <p class="empty-tab-text">No conditions recorded.</p>
                    }

                    @if (selectedMember()!.geneticTests.length > 0) {
                      <p-divider></p-divider>
                      <h3 class="tab-section-title">Genetic Tests</h3>
                      <div class="genetic-tests-list" role="list">
                        @for (test of selectedMember()!.geneticTests; track test.id) {
                          <div class="genetic-test-item" role="listitem">
                            <div class="gt-header">
                              <span class="gt-name">{{ test.testName }}</span>
                              <p-tag
                                [value]="test.classification"
                                [severity]="getGeneticSeverity(test.classification)"
                              ></p-tag>
                            </div>
                            <div class="gt-meta">
                              <span>{{ test.geneName }}</span>
                              @if (test.variant) {
                                <span class="gt-variant">{{ test.variant }}</span>
                              }
                              <span class="gt-lab">{{ test.lab }}</span>
                              <span class="gt-date">{{ test.testDate | date:'mediumDate' }}</span>
                            </div>
                            <p class="gt-summary">{{ test.resultSummary }}</p>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </p-tabpanel>

                <!-- Panel 1: Access -->
                <p-tabpanel [value]="1">
                  <div class="tab-content">
                    <h3 class="tab-section-title">Permission Levels</h3>
                    @if (getMemberPermissions(selectedMember()!.id).length > 0) {
                      <div class="permission-list" role="list">
                        @for (perm of getMemberPermissions(selectedMember()!.id); track perm.category) {
                          <div class="perm-item" role="listitem">
                            <span class="perm-category">{{ formatCategory(perm.category) }}</span>
                            <span class="perm-level" [class]="'perm-level--' + perm.level">
                              <i [class]="getAccessIcon(perm.level)" aria-hidden="true"></i>
                              {{ formatAccessLevel(perm.level) }}
                            </span>
                          </div>
                        }
                      </div>
                    } @else {
                      <p class="empty-tab-text">No permissions configured.</p>
                    }
                    <p-divider></p-divider>
                    <button
                      pButton
                      label="Edit Permissions"
                      icon="pi pi-pencil"
                      class="p-button-outlined w-full"
                      routerLink="/family/permissions"
                      aria-label="Edit permissions for this member"
                    ></button>
                  </div>
                </p-tabpanel>

                <!-- Panel 2: History -->
                <p-tabpanel [value]="2">
                  <div class="tab-content">
                    <h3 class="tab-section-title">Audit Log</h3>
                    @if (getMemberAuditLog(selectedMember()!.id).length > 0) {
                      <div class="audit-log-list" role="list">
                        @for (entry of getMemberAuditLog(selectedMember()!.id); track entry.id) {
                          <div class="audit-item" role="listitem">
                            <div class="ai-icon">
                              <i [class]="getAuditIcon(entry.action)" aria-hidden="true"></i>
                            </div>
                            <div class="ai-content">
                              <span class="ai-action">{{ formatAction(entry.action) }}</span>
                              <p class="ai-details">{{ entry.details }}</p>
                              <span class="ai-time">{{ entry.timestamp | date:'medium' }}</span>
                            </div>
                          </div>
                        }
                      </div>
                    } @else {
                      <p class="empty-tab-text">No audit history available.</p>
                    }
                  </div>
                </p-tabpanel>

                <!-- Panel 3: Edit -->
                <p-tabpanel [value]="3">
                  <div class="tab-content">
                    <h3 class="tab-section-title">Edit Member Details</h3>
                    <form class="edit-form" (ngSubmit)="saveEdit()">
                      <div class="form-field">
                        <label for="edit-firstname">First Name</label>
                        <input
                          pInputText
                          id="edit-firstname"
                          [(ngModel)]="editFirstName"
                          name="firstName"
                          class="w-full"
                        />
                      </div>
                      <div class="form-field">
                        <label for="edit-lastname">Last Name</label>
                        <input
                          pInputText
                          id="edit-lastname"
                          [(ngModel)]="editLastName"
                          name="lastName"
                          class="w-full"
                        />
                      </div>
                      <div class="form-field">
                        <label for="edit-notes">Notes</label>
                        <textarea
                          pInputText
                          id="edit-notes"
                          [(ngModel)]="editNotes"
                          name="notes"
                          rows="4"
                          class="w-full edit-notes-area"
                          aria-label="Notes for this member"
                        ></textarea>
                      </div>
                      <button
                        pButton
                        type="submit"
                        label="Save Changes"
                        icon="pi pi-check"
                        class="p-button-success w-full"
                        aria-label="Save member changes"
                      ></button>
                    </form>
                  </div>
                </p-tabpanel>
              </p-tabpanels>
            </p-tabs>
          </aside>
        }
      </div>
    </div>

    <!-- Add Member Slide-over -->
    <app-add-member-slideover
      [(visible)]="addMemberVisible"
      (memberAdded)="onMemberAdded()"
    ></app-add-member-slideover>
  `,
  styles: [`
    .family-dashboard {
      padding: 0;
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }

    .family-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      background: var(--surface-card);
      border-bottom: 1px solid var(--surface-border);
      gap: 1rem;
      flex-wrap: wrap;
    }

    .toolbar-left {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-color);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .page-title i {
      color: var(--primary-color);
    }

    .family-name {
      font-size: 0.85rem;
      color: var(--text-color-secondary);
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .family-layout {
      display: grid;
      grid-template-columns: 260px 1fr 340px;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    /* Collapse right panel when no member selected */
    .family-layout:not(:has(.family-detail-panel)) {
      grid-template-columns: 260px 1fr;
    }

    /* ── Left Sidebar ─────────────────────────── */
    .family-sidebar {
      border-right: 1px solid var(--surface-border);
      background: var(--surface-card);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .sidebar-search {
      padding: 0.75rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .search-wrapper {
      display: flex;
      align-items: center;
      width: 100%;
    }

    .search-wrapper i {
      position: absolute;
      left: 0.75rem;
      color: var(--text-color-secondary);
      z-index: 1;
    }

    .search-wrapper input {
      padding-left: 2rem;
      width: 100%;
    }

    .member-list {
      flex: 1;
      padding: 0.5rem;
    }

    .member-card {
      padding: 0.75rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
      margin-bottom: 0.25rem;
      border: 2px solid transparent;
      outline: none;
    }

    .member-card:hover {
      background: var(--surface-hover);
    }

    .member-card.selected {
      background: var(--primary-50);
      border-color: var(--primary-300);
    }

    .member-card:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .member-card-inner {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
    }

    .member-avatar-wrapper {
      position: relative;
      flex-shrink: 0;
    }

    .deceased-badge {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 16px;
      height: 16px;
      background: var(--surface-500);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .deceased-badge i {
      font-size: 0.6rem;
      color: white;
    }

    .member-info {
      flex: 1;
      min-width: 0;
    }

    .member-name-row {
      margin-bottom: 0.25rem;
    }

    .member-name {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .proband-icon {
      color: var(--yellow-500);
      font-size: 0.7rem;
    }

    .member-meta-row {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      margin-bottom: 0.25rem;
    }

    .member-age {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .member-access-row {
      margin-top: 0.25rem;
    }

    .access-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.125rem 0.5rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .access-badge--full {
      background: #dcfce7;
      color: #16a34a;
    }

    .access-badge--partial {
      background: #fef9c3;
      color: #ca8a04;
    }

    .access-badge--none {
      background: #fee2e2;
      color: #dc2626;
    }

    .access-badge--emergency-only {
      background: #dbeafe;
      color: #2563eb;
    }

    .member-conditions-preview {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.7rem;
      color: var(--text-color-secondary);
      margin-top: 0.375rem;
      padding-top: 0.375rem;
      border-top: 1px solid var(--surface-border);
    }

    .member-conditions-preview i {
      color: var(--red-400);
      font-size: 0.65rem;
    }

    .empty-list {
      text-align: center;
      padding: 2rem 1rem;
      color: var(--text-color-secondary);
    }

    .empty-list i {
      font-size: 1.5rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    .pets-section {
      padding: 0.5rem 0.75rem;
    }

    .pets-heading {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-color-secondary);
      margin: 0 0 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .pet-card {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem;
      border-radius: 6px;
      margin-bottom: 0.25rem;
    }

    .pet-info {
      display: flex;
      flex-direction: column;
    }

    .pet-name {
      font-size: 0.8rem;
      font-weight: 600;
    }

    .pet-species {
      font-size: 0.7rem;
      color: var(--text-color-secondary);
    }

    /* ── Center Content ─────────────────────────── */
    .family-center {
      background: var(--surface-ground);
      overflow: hidden;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .family-overview {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }

    .overview-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
    }

    .overview-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .overview-card {
      background: var(--surface-card);
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border: 1px solid var(--surface-border);
    }

    .oc-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .oc-icon i {
      font-size: 1.25rem;
    }

    .overview-card--members .oc-icon { background: var(--primary-50); }
    .overview-card--members .oc-icon i { color: var(--primary-600); }
    .overview-card--conditions .oc-icon { background: #fee2e2; }
    .overview-card--conditions .oc-icon i { color: var(--red-600); }
    .overview-card--pets .oc-icon { background: #fef9c3; }
    .overview-card--pets .oc-icon i { color: var(--yellow-600); }
    .overview-card--genetic .oc-icon { background: #f3e8ff; }
    .overview-card--genetic .oc-icon i { color: #9333ea; }

    .oc-content {
      display: flex;
      flex-direction: column;
    }

    .oc-value {
      font-size: 1.75rem;
      font-weight: 700;
      line-height: 1;
    }

    .oc-label {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      margin-top: 0.125rem;
    }

    .conditions-summary {
      background: var(--surface-card);
      border-radius: 10px;
      padding: 1rem;
      margin-bottom: 1.5rem;
      border: 1px solid var(--surface-border);
    }

    .conditions-summary h3 {
      font-size: 0.875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-color-secondary);
      margin: 0 0 0.75rem;
    }

    .condition-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    /* ── Chart Embed ──────────────────────────────── */
    .chart-embed-container {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 400px;
    }

    .chart-embed-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .chart-embed-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .chart-embed-canvas {
      flex: 1;
      min-height: 0;
      border-radius: 8px;
      overflow: hidden;
    }

    /* Member Summary */
    .member-summary {
      background: var(--surface-card);
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid var(--surface-border);
    }

    .member-summary-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .member-summary-meta {
      flex: 1;
    }

    .member-summary-meta h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 0.5rem;
    }

    .member-summary-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .member-summary-source {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .close-detail-btn {
      flex-shrink: 0;
    }

    .member-notes {
      background: var(--primary-50);
      border-left: 4px solid var(--primary-300);
      padding: 0.75rem 1rem;
      border-radius: 0 8px 8px 0;
      font-size: 0.875rem;
      color: var(--text-color);
      margin-bottom: 1rem;
      display: flex;
      gap: 0.5rem;
    }

    .member-notes i {
      color: var(--primary-color);
      flex-shrink: 0;
      margin-top: 0.1rem;
    }

    .member-quick-stats {
      display: flex;
      gap: 1.5rem;
    }

    .quick-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .qs-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary-color);
      line-height: 1;
    }

    .qs-label {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      margin-top: 0.25rem;
    }

    /* ── Right Detail Panel ─────────────────────── */
    .family-detail-panel {
      border-left: 1px solid var(--surface-border);
      background: var(--surface-card);
      overflow-y: auto;
    }

    .family-detail-panel ::ng-deep .p-tabs {
      height: 100%;
    }

    .family-detail-panel ::ng-deep .p-tabpanels {
      padding: 0;
    }

    .tab-content {
      padding: 1rem;
    }

    .tab-section-title {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-color-secondary);
      margin: 0 0 0.75rem;
    }

    .empty-tab-text {
      color: var(--text-color-secondary);
      font-size: 0.875rem;
      text-align: center;
      padding: 1rem 0;
    }

    /* Conditions */
    .conditions-list, .genetic-tests-list, .audit-log-list, .permission-list {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .condition-item {
      background: var(--surface-ground);
      border-radius: 8px;
      padding: 0.75rem;
      border: 1px solid var(--surface-border);
    }

    .ci-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.375rem;
    }

    .ci-name {
      font-weight: 600;
      font-size: 0.875rem;
    }

    .ci-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .ci-death {
      color: var(--red-500);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .ci-notes {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      margin: 0.375rem 0 0;
      line-height: 1.4;
    }

    /* Genetic tests */
    .genetic-test-item {
      background: var(--surface-ground);
      border-radius: 8px;
      padding: 0.75rem;
      border: 1px solid var(--surface-border);
    }

    .gt-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.375rem;
    }

    .gt-name {
      font-weight: 600;
      font-size: 0.875rem;
    }

    .gt-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      margin-bottom: 0.375rem;
    }

    .gt-variant {
      font-family: monospace;
      font-size: 0.7rem;
      background: var(--surface-200);
      padding: 0.1rem 0.375rem;
      border-radius: 4px;
    }

    .gt-summary {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      margin: 0;
      line-height: 1.4;
    }

    /* Permissions */
    .perm-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--surface-border);
    }

    .perm-item:last-child {
      border-bottom: none;
    }

    .perm-category {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .perm-level {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.125rem 0.5rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .perm-level--full { background: #dcfce7; color: #16a34a; }
    .perm-level--partial { background: #fef9c3; color: #ca8a04; }
    .perm-level--none { background: #fee2e2; color: #dc2626; }
    .perm-level--emergency-only { background: #dbeafe; color: #2563eb; }

    /* Audit */
    .audit-item {
      display: flex;
      gap: 0.625rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--surface-border);
    }

    .audit-item:last-child {
      border-bottom: none;
    }

    .ai-icon {
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

    .ai-icon i {
      font-size: 0.75rem;
      color: var(--primary-color);
    }

    .ai-content {
      flex: 1;
    }

    .ai-action {
      font-size: 0.8rem;
      font-weight: 600;
      display: block;
    }

    .ai-details {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      margin: 0.125rem 0;
    }

    .ai-time {
      font-size: 0.7rem;
      color: var(--text-color-secondary);
    }

    /* Edit form */
    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .form-field label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-color-secondary);
    }

    .edit-notes-area {
      resize: vertical;
      min-height: 80px;
      font-family: inherit;
      font-size: 0.875rem;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--surface-border);
      border-radius: 6px;
    }

    .w-full {
      width: 100%;
    }

    @media (max-width: 1200px) {
      .family-layout {
        grid-template-columns: 240px 1fr;
      }

      .family-detail-panel {
        display: none;
      }

      .overview-cards {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .family-layout {
        grid-template-columns: 1fr;
      }

      .family-sidebar {
        display: none;
      }

      .overview-cards {
        grid-template-columns: 1fr 1fr;
      }
    }
  `],
})
export class FamilyDashboardComponent {
  protected readonly familyService = inject(FamilyService);

  protected readonly familyGroup = this.familyService.familyGroup;
  protected readonly humanMembers = this.familyService.humanMembers;
  protected readonly pets = this.familyService.pets;
  protected readonly filteredMembers = this.familyService.filteredMembers;
  protected readonly selectedMember = this.familyService.selectedMember;
  protected readonly selectedMemberId = this.familyService.selectedMemberId;
  protected readonly familyConditions = this.familyService.familyConditions;
  protected readonly uniqueConditionNames = this.familyService.uniqueConditionNames;
  protected readonly membersWithGeneticTests = this.familyService.membersWithGeneticTests;
  protected readonly auditLog = this.familyService.auditLog;
  protected readonly permissionMatrix = this.familyService.permissionMatrix;
  protected readonly membersByGeneration = this.familyService.membersByGeneration;

  viewMode: 'list' | 'grid' = 'list';
  searchTerm = '';
  addMemberVisible = false;

  editFirstName = '';
  editLastName = '';
  editNotes = '';

  readonly viewModeOptions: ViewModeOption[] = [
    { label: 'List', value: 'list', icon: 'pi pi-list' },
    { label: 'Grid', value: 'grid', icon: 'pi pi-th-large' },
  ];

  protected readonly generationGroupEntries = computed(() => {
    const groups = this.membersByGeneration();
    return [
      { key: 'grandparents' as const, members: groups['grandparents'] },
      { key: 'parents' as const, members: groups['parents'] },
      { key: 'self-siblings' as const, members: groups['self-siblings'] },
      { key: 'children' as const, members: groups['children'] },
    ];
  });

  selectMember(id: string): void {
    this.familyService.selectMember(id);
    const member = this.familyService.members().find(m => m.id === id);
    if (member) {
      this.editFirstName = member.firstName;
      this.editLastName = member.lastName;
      this.editNotes = member.notes ?? '';
    }
  }

  clearSelection(): void {
    this.familyService.selectMember(null);
  }

  onSearch(term: string): void {
    this.familyService.search(term);
  }

  openAddMember(): void {
    this.addMemberVisible = true;
  }

  onMemberAdded(): void {
    this.addMemberVisible = false;
  }

  saveEdit(): void {
    const member = this.selectedMember();
    if (!member) return;
    this.familyService.updateMember(member.id, {
      firstName: this.editFirstName,
      lastName: this.editLastName,
      notes: this.editNotes,
    });
  }

  getMemberPermissions(memberId: string): { category: string; level: AccessLevel }[] {
    const matrix = this.permissionMatrix();
    const entry = matrix.find(m => m.memberId === memberId);
    if (!entry) return [];
    return Object.entries(entry.permissions).map(([category, level]) => ({
      category,
      level: level as AccessLevel,
    }));
  }

  getMemberAuditLog(memberId: string) {
    return this.auditLog().filter(
      e => e.targetMemberId === memberId || e.actorId === memberId
    );
  }

  getInitials(member: FamilyMember): string {
    return `${member.firstName[0] ?? ''}${member.lastName[0] ?? ''}`;
  }

  calculateAge(dob: Date): number {
    const today = new Date(2026, 1, 22);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  formatRelationship(rel: string): string {
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
      pet: 'Pet',
    };
    return map[rel] ?? rel;
  }

  getRelationshipSeverity(rel: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      spouse: 'info',
      partner: 'info',
      child: 'success',
      parent: 'warn',
      grandparent: 'warn',
      sibling: 'secondary',
      'aunt-uncle': 'secondary',
    };
    return map[rel] ?? 'secondary';
  }

  formatAccessLevel(level: AccessLevel): string {
    const map: Record<AccessLevel, string> = {
      full: 'Full',
      partial: 'Partial',
      none: 'None',
      'emergency-only': 'Emergency',
    };
    return map[level] ?? level;
  }

  getAccessIcon(level: AccessLevel): string {
    const map: Record<AccessLevel, string> = {
      full: 'pi pi-check-circle',
      partial: 'pi pi-minus-circle',
      none: 'pi pi-times-circle',
      'emergency-only': 'pi pi-exclamation-circle',
    };
    return map[level] ?? 'pi pi-circle';
  }

  formatSource(source: string): string {
    const map: Record<string, string> = {
      'portal-linked': 'Portal Linked',
      'manual-entry': 'Manual Entry',
      'imported': 'Imported',
      'history-only': 'History Only',
    };
    return map[source] ?? source;
  }

  formatCategory(cat: string): string {
    const map: Record<string, string> = {
      appointments: 'Appointments',
      medications: 'Medications',
      'lab-results': 'Lab Results',
      immunizations: 'Immunizations',
      allergies: 'Allergies',
      'mental-health': 'Mental Health',
      reproductive: 'Reproductive',
      sti: 'STI/Infections',
      genetic: 'Genetic',
      billing: 'Billing',
    };
    return map[cat] ?? cat;
  }

  getConditionSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | undefined {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      affected: 'danger',
      carrier: 'warn',
      unaffected: 'success',
      unknown: 'secondary',
    };
    return map[status] ?? 'secondary';
  }

  getGeneticSeverity(classification: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | undefined {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      pathogenic: 'danger',
      'likely-pathogenic': 'warn',
      vus: 'info',
      'likely-benign': 'secondary',
      benign: 'success',
    };
    return map[classification] ?? 'secondary';
  }

  getAuditIcon(action: string): string {
    if (action.includes('PERMISSION')) return 'pi pi-lock';
    if (action.includes('MEMBER')) return 'pi pi-user';
    if (action.includes('CONDITION')) return 'pi pi-heart';
    if (action.includes('PET')) return 'pi pi-heart';
    if (action.includes('GENETIC')) return 'pi pi-sliders-h';
    return 'pi pi-info-circle';
  }

  formatAction(action: string): string {
    return action
      .split('_')
      .map(w => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
  }

  formatGenerationLabel(key: string): string {
    const map: Record<string, string> = {
      grandparents: 'Grandparents',
      parents: 'Parents',
      'self-siblings': 'Self & Siblings',
      children: 'Children',
    };
    return map[key] ?? key;
  }
}
