import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  computed,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TagModule } from 'primeng/tag';
import { MenuItem } from 'primeng/api';
import { FamilyService } from '../data-access/family.service';
import {
  RelationshipType,
  AccessLevel,
  RecordCategory,
  SexAtBirth,
  BiologicalRelation,
} from '../data-access/family.models';

interface RelationshipOption {
  label: string;
  value: RelationshipType;
  icon: string;
  description: string;
  color: string;
}

interface PermissionToggle {
  category: RecordCategory;
  label: string;
  enabled: boolean;
  sensitive: boolean;
}

interface SexOption {
  label: string;
  value: SexAtBirth;
}

interface AccessLevelOption {
  label: string;
  value: AccessLevel;
  description: string;
}

interface BiologicalOption {
  label: string;
  value: BiologicalRelation;
}

const AVATAR_COLORS = [
  '#0d9488', '#be185d', '#7c3aed', '#2563eb',
  '#ea580c', '#dc2626', '#16a34a', '#ca8a04',
];

@Component({
  selector: 'app-add-member-slideover',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DrawerModule,
    StepperModule,
    ButtonModule,
    CardModule,
    DatePickerModule,
    SelectModule,
    SelectButtonModule,
    InputTextModule,
    DividerModule,
    ToggleSwitchModule,
    TagModule
],
  template: `
    <p-drawer
      [(visible)]="sidebarVisible"
      position="right"
      [style]="{ width: '480px' }"
      styleClass="add-member-sidebar"
      [closeOnEscape]="true"
      (onHide)="onHide()"
      header="Add Family Member"
      aria-label="Add family member wizard"
    >
      <div class="wizard-container">
        <!-- Steps indicator -->
        <div class="wizard-steps">
          <p-stepper [value]="currentStep() + 1">
            <p-step-list>
              @for (step of steps; track step.label; let i = $index) {
                <p-step [value]="i + 1">{{ step.label }}</p-step>
              }
            </p-step-list>
          </p-stepper>
        </div>

        <div class="wizard-content">
          <!-- Step 1: Relationship -->
          @if (currentStep() === 0) {
            <div class="step-panel" role="group" aria-label="Step 1: Choose relationship">
              <h2 class="step-title">What is their relationship to you?</h2>
              <p class="step-desc">Select the family member type to add.</p>
              <div class="relationship-grid" role="radiogroup" aria-label="Relationship types">
                @for (opt of relationshipOptions; track opt.value) {
                  <div
                    class="rel-card"
                    [class.selected]="selectedRelationship() === opt.value"
                    (click)="selectRelationship(opt.value)"
                    (keydown.enter)="selectRelationship(opt.value)"
                    (keydown.space)="selectRelationship(opt.value)"
                    role="radio"
                    [attr.aria-checked]="selectedRelationship() === opt.value"
                    tabindex="0"
                    [attr.aria-label]="opt.label + ': ' + opt.description"
                    [style.--rel-color]="opt.color"
                  >
                    <div class="rel-icon" [style.background]="opt.color + '20'" [style.color]="opt.color">
                      <i [class]="opt.icon" aria-hidden="true"></i>
                    </div>
                    <span class="rel-label">{{ opt.label }}</span>
                    <span class="rel-desc">{{ opt.description }}</span>
                    @if (selectedRelationship() === opt.value) {
                      <div class="rel-selected-check" aria-hidden="true">
                        <i class="pi pi-check" aria-hidden="true"></i>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- Step 2: Identification -->
          @if (currentStep() === 1) {
            <div class="step-panel" aria-label="Step 2: Identification details">
              <h2 class="step-title">Identification Details</h2>
              <p class="step-desc">Enter basic personal information.</p>

              <div class="form-grid">
                <div class="form-field">
                  <label for="add-firstname">First Name <span class="required" aria-hidden="true">*</span></label>
                  <input
                    pInputText
                    id="add-firstname"
                    [(ngModel)]="formData.firstName"
                    name="firstName"
                    class="w-full"
                    placeholder="First name"
                    aria-required="true"
                  />
                </div>
                <div class="form-field">
                  <label for="add-lastname">Last Name</label>
                  <input
                    pInputText
                    id="add-lastname"
                    [(ngModel)]="formData.lastName"
                    name="lastName"
                    class="w-full"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div class="form-field">
                <label for="add-dob">Date of Birth</label>
                <p-datepicker
                  id="add-dob"
                  [(ngModel)]="formData.dateOfBirth"
                  name="dateOfBirth"
                  [showIcon]="true"
                  [maxDate]="today"
                  dateFormat="dd/mm/yy"
                  placeholder="DD/MM/YYYY"
                  styleClass="w-full"
                  aria-label="Date of birth"
                ></p-datepicker>
              </div>

              <div class="form-field">
                <label for="add-sex">Sex at Birth</label>
                <p-select
                  id="add-sex"
                  [(ngModel)]="formData.sexAtBirth"
                  name="sexAtBirth"
                  [options]="sexOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select..."
                  styleClass="w-full"
                  aria-label="Sex at birth"
                ></p-select>
              </div>

              <div class="form-field">
                <label for="add-country">Country</label>
                <p-select
                  id="add-country"
                  [(ngModel)]="formData.country"
                  name="country"
                  [options]="countryOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select country..."
                  styleClass="w-full"
                  aria-label="Country"
                ></p-select>
              </div>

              @if (formData.country) {
                <div class="form-field">
                  <label [for]="'add-natid'">{{ getIdLabel(formData.country) }}</label>
                  <input
                    pInputText
                    id="add-natid"
                    [(ngModel)]="formData.nationalId"
                    name="nationalId"
                    class="w-full"
                    [placeholder]="getIdPlaceholder(formData.country)"
                    [attr.aria-label]="getIdLabel(formData.country)"
                  />
                  <span class="field-hint">{{ getIdHint(formData.country) }}</span>
                </div>
              }
            </div>
          }

          <!-- Step 3: Details -->
          @if (currentStep() === 2) {
            <div class="step-panel" aria-label="Step 3: Member details">
              <h2 class="step-title">Additional Details</h2>
              <p class="step-desc">Specify biological relationship and any known conditions.</p>

              <div class="form-field">
                <label>Biological Relationship</label>
                <p-selectButton
                  [(ngModel)]="formData.biologicalRelation"
                  [options]="biologicalOptions"
                  optionLabel="label"
                  optionValue="value"
                  aria-label="Biological relationship"
                ></p-selectButton>
              </div>

              <div class="form-field">
                <label class="form-label-checkbox">
                  <input
                    type="checkbox"
                    [(ngModel)]="formData.isDeceased"
                    name="isDeceased"
                    aria-label="Member is deceased"
                  />
                  <span>Member is deceased</span>
                </label>
              </div>

              @if (formData.isDeceased) {
                <div class="form-field">
                  <label for="add-deceased-age">Age at Death</label>
                  <input
                    pInputText
                    id="add-deceased-age"
                    type="number"
                    [(ngModel)]="formData.deceasedAge"
                    name="deceasedAge"
                    class="w-full"
                    placeholder="Age at death"
                    min="0"
                    max="150"
                  />
                </div>
              }

              <p-divider></p-divider>

              <h3 class="subsection-title">
                <i class="pi pi-heart-fill" aria-hidden="true"></i>
                Quick-Add Conditions
              </h3>
              <p class="step-desc">Add known health conditions for family history tracking.</p>

              <div class="condition-input-row">
                <input
                  pInputText
                  [(ngModel)]="newConditionName"
                  name="newCondition"
                  placeholder="Enter condition name..."
                  class="condition-input"
                  (keydown.enter)="addCondition()"
                  aria-label="New condition name"
                />
                <button
                  pButton
                  icon="pi pi-plus"
                  class="p-button-outlined p-button-sm"
                  (click)="addCondition()"
                  [disabled]="!newConditionName.trim()"
                  aria-label="Add condition"
                ></button>
              </div>

              @if (formData.conditions.length > 0) {
                <div class="conditions-added" role="list" aria-label="Added conditions">
                  @for (cond of formData.conditions; track $index) {
                    <div class="condition-chip" role="listitem">
                      <i class="pi pi-heart-fill" aria-hidden="true"></i>
                      <span>{{ cond }}</span>
                      <button
                        pButton
                        icon="pi pi-times"
                        class="p-button-text p-button-rounded p-button-sm chip-remove"
                        (click)="removeCondition($index)"
                        [attr.aria-label]="'Remove ' + cond"
                      ></button>
                    </div>
                  }
                </div>
              }

              <div class="form-field" style="margin-top: 1rem;">
                <label for="add-notes">Notes (optional)</label>
                <textarea
                  id="add-notes"
                  [(ngModel)]="formData.notes"
                  name="notes"
                  rows="3"
                  class="w-full notes-textarea"
                  placeholder="Any relevant notes..."
                  aria-label="Additional notes"
                ></textarea>
              </div>
            </div>
          }

          <!-- Step 4: Permissions -->
          @if (currentStep() === 3) {
            <div class="step-panel" aria-label="Step 4: Permissions">
              <h2 class="step-title">Access Permissions</h2>
              <p class="step-desc">Configure what records this member can access.</p>

              <div class="form-field">
                <label>Default Access Level</label>
                <div class="access-level-grid" role="radiogroup" aria-label="Access level">
                  @for (opt of accessLevelOptions; track opt.value) {
                    <div
                      class="al-card"
                      [class.selected]="formData.accessLevel === opt.value"
                      [class]="'al-card al-card--' + opt.value + (formData.accessLevel === opt.value ? ' selected' : '')"
                      (click)="formData.accessLevel = opt.value"
                      (keydown.enter)="formData.accessLevel = opt.value"
                      role="radio"
                      [attr.aria-checked]="formData.accessLevel === opt.value"
                      tabindex="0"
                      [attr.aria-label]="opt.label + ': ' + opt.description"
                    >
                      <span class="al-label">{{ opt.label }}</span>
                      <span class="al-desc">{{ opt.description }}</span>
                    </div>
                  }
                </div>
              </div>

              <p-divider></p-divider>

              <h3 class="subsection-title">Record Category Access</h3>
              <div class="permission-toggles" role="group" aria-label="Record category access">
                @for (toggle of permissionToggles; track toggle.category) {
                  <div class="perm-toggle-row">
                    <div class="perm-toggle-label">
                      <span class="perm-cat-name">{{ toggle.label }}</span>
                      @if (toggle.sensitive) {
                        <i
                          class="pi pi-lock sensitive-icon"
                          pTooltip="Sensitive category — extra care required"
                          aria-label="Sensitive category"
                        ></i>
                      }
                    </div>
                    <p-toggleswitch
                      [(ngModel)]="toggle.enabled"
                      [name]="'perm-' + toggle.category"
                      [attr.aria-label]="'Enable ' + toggle.label + ' access'"
                    ></p-toggleswitch>
                  </div>
                }
              </div>

              <p-divider></p-divider>

              <div class="form-field">
                <label for="add-expiry">Access Expiry Date (optional)</label>
                <p-datepicker
                  id="add-expiry"
                  [(ngModel)]="formData.expiryDate"
                  name="expiryDate"
                  [showIcon]="true"
                  [minDate]="tomorrow"
                  dateFormat="dd/mm/yy"
                  placeholder="No expiry"
                  styleClass="w-full"
                  aria-label="Access expiry date"
                ></p-datepicker>
                <span class="field-hint">Leave blank for indefinite access.</span>
              </div>
            </div>
          }
        </div>

        <!-- Wizard navigation footer -->
        <div class="wizard-footer">
          <button
            pButton
            label="Cancel"
            class="p-button-text"
            (click)="cancel()"
            aria-label="Cancel and close"
          ></button>
          <div class="footer-nav">
            @if (currentStep() > 0) {
              <button
                pButton
                label="Back"
                icon="pi pi-arrow-left"
                iconPos="left"
                class="p-button-outlined"
                (click)="prevStep()"
                aria-label="Go to previous step"
              ></button>
            }
            @if (currentStep() < steps.length - 1) {
              <button
                pButton
                label="Next"
                icon="pi pi-arrow-right"
                iconPos="right"
                (click)="nextStep()"
                [disabled]="!canProceed()"
                aria-label="Go to next step"
              ></button>
            } @else {
              <button
                pButton
                label="Save Member"
                icon="pi pi-check"
                class="p-button-success"
                (click)="save()"
                [disabled]="!canProceed()"
                aria-label="Save family member"
              ></button>
            }
          </div>
        </div>
      </div>
    </p-drawer>
  `,
  styles: [`
    .wizard-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .wizard-steps {
      padding: 1rem 1rem 0.5rem;
      border-bottom: 1px solid var(--surface-border);
      flex-shrink: 0;
    }

    .wizard-steps ::ng-deep .p-steps .p-steps-item .p-menuitem-link {
      padding: 0.5rem;
    }

    .wizard-steps ::ng-deep .p-steps-title {
      font-size: 0.7rem;
    }

    .wizard-content {
      flex: 1;
      overflow-y: auto;
      padding: 1.25rem;
    }

    .step-panel {
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .step-title {
      font-size: 1.125rem;
      font-weight: 700;
      margin: 0 0 0.375rem;
    }

    .step-desc {
      color: var(--text-color-secondary);
      font-size: 0.875rem;
      margin: 0 0 1.25rem;
    }

    /* Relationship grid */
    .relationship-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.625rem;
    }

    .rel-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      padding: 1rem 0.75rem;
      border-radius: 10px;
      border: 2px solid var(--surface-border);
      cursor: pointer;
      transition: all 0.15s ease;
      background: var(--surface-card);
      text-align: center;
      outline: none;
    }

    .rel-card:hover {
      border-color: var(--rel-color, var(--primary-color));
      background: var(--surface-hover);
    }

    .rel-card.selected {
      border-color: var(--rel-color, var(--primary-color));
      background: var(--surface-50);
      box-shadow: 0 0 0 3px var(--rel-color, var(--primary-color))20;
    }

    .rel-card:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .rel-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .rel-icon i {
      font-size: 1.25rem;
    }

    .rel-label {
      font-weight: 600;
      font-size: 0.875rem;
    }

    .rel-desc {
      font-size: 0.7rem;
      color: var(--text-color-secondary);
    }

    .rel-selected-check {
      position: absolute;
      top: 0.375rem;
      right: 0.375rem;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--rel-color, var(--primary-color));
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .rel-selected-check i {
      color: white;
      font-size: 0.6rem;
    }

    /* Form fields */
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      margin-bottom: 1rem;
    }

    .form-field label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .required {
      color: var(--red-500);
    }

    .field-hint {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .form-label-checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .subsection-title {
      font-size: 0.875rem;
      font-weight: 700;
      margin: 0 0 0.375rem;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .subsection-title i {
      color: var(--red-400);
      font-size: 0.8rem;
    }

    .condition-input-row {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.625rem;
    }

    .condition-input {
      flex: 1;
    }

    .conditions-added {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
    }

    .condition-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      background: var(--red-50);
      border: 1px solid var(--red-200);
      border-radius: 16px;
      font-size: 0.8rem;
      color: var(--red-700);
    }

    .condition-chip i.pi-heart-fill {
      font-size: 0.65rem;
    }

    .chip-remove {
      padding: 0 !important;
      width: 18px !important;
      height: 18px !important;
      min-width: 18px !important;
      color: var(--red-500) !important;
    }

    .chip-remove ::ng-deep .p-button-icon {
      font-size: 0.6rem;
    }

    .notes-textarea {
      resize: vertical;
      min-height: 72px;
      font-family: inherit;
      font-size: 0.875rem;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--surface-border);
      border-radius: 6px;
      width: 100%;
      box-sizing: border-box;
    }

    /* Access level cards */
    .access-level-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }

    .al-card {
      padding: 0.75rem;
      border-radius: 8px;
      border: 2px solid var(--surface-border);
      cursor: pointer;
      transition: all 0.15s ease;
      outline: none;
    }

    .al-card:hover { border-color: var(--primary-300); }
    .al-card.selected { border-color: var(--primary-color); background: var(--primary-50); }
    .al-card:focus-visible { outline: 2px solid var(--primary-color); }

    .al-card--full.selected { border-color: #16a34a; background: #f0fdf4; }
    .al-card--partial.selected { border-color: #ca8a04; background: #fefce8; }
    .al-card--none.selected { border-color: #dc2626; background: #fef2f2; }
    .al-card--emergency-only.selected { border-color: #2563eb; background: #eff6ff; }

    .al-label {
      font-weight: 700;
      font-size: 0.875rem;
      display: block;
    }

    .al-desc {
      font-size: 0.725rem;
      color: var(--text-color-secondary);
      display: block;
      margin-top: 0.125rem;
    }

    /* Permission toggles */
    .permission-toggles {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .perm-toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--surface-border);
    }

    .perm-toggle-row:last-child {
      border-bottom: none;
    }

    .perm-toggle-label {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .perm-cat-name {
      font-size: 0.875rem;
    }

    .sensitive-icon {
      font-size: 0.75rem;
      color: var(--orange-500);
    }

    /* Wizard footer */
    .wizard-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 1.25rem;
      border-top: 1px solid var(--surface-border);
      background: var(--surface-card);
      flex-shrink: 0;
    }

    .footer-nav {
      display: flex;
      gap: 0.5rem;
    }

    .w-full {
      width: 100%;
    }
  `],
})
export class AddMemberSlideoverComponent implements OnChanges {
  private readonly familyService = inject(FamilyService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() memberAdded = new EventEmitter<void>();

  protected sidebarVisible = false;

  protected readonly currentStep = signal(0);
  protected readonly selectedRelationship = signal<RelationshipType | null>(null);

  protected readonly today = new Date(2026, 1, 22);
  protected readonly tomorrow = new Date(2026, 1, 23);

  protected formData: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date | null;
    sexAtBirth: SexAtBirth | null;
    country: string;
    nationalId: string;
    biologicalRelation: BiologicalRelation;
    isDeceased: boolean;
    deceasedAge: number | null;
    conditions: string[];
    notes: string;
    accessLevel: AccessLevel;
    expiryDate: Date | null;
  } = this.getEmptyForm();

  protected newConditionName = '';

  protected readonly steps: MenuItem[] = [
    { label: 'Relationship' },
    { label: 'Identify' },
    { label: 'Details' },
    { label: 'Permissions' },
  ];

  protected readonly relationshipOptions: RelationshipOption[] = [
    {
      label: 'Spouse',
      value: 'spouse',
      icon: 'pi pi-heart-fill',
      description: 'Married partner',
      color: '#be185d',
    },
    {
      label: 'Child (Minor)',
      value: 'child',
      icon: 'pi pi-star',
      description: 'Under 18 years',
      color: '#7c3aed',
    },
    {
      label: 'Child (Adult)',
      value: 'child',
      icon: 'pi pi-user',
      description: '18 years or older',
      color: '#2563eb',
    },
    {
      label: 'Parent',
      value: 'parent',
      icon: 'pi pi-users',
      description: 'Mother or father',
      color: '#ea580c',
    },
    {
      label: 'Grandparent',
      value: 'grandparent',
      icon: 'pi pi-flag',
      description: 'Grandmother/grandfather',
      color: '#16a34a',
    },
    {
      label: 'Sibling',
      value: 'sibling',
      icon: 'pi pi-user-plus',
      description: 'Brother or sister',
      color: '#0d9488',
    },
    {
      label: 'Pet',
      value: 'pet',
      icon: 'pi pi-heart',
      description: 'Animal companion',
      color: '#ca8a04',
    },
  ];

  protected readonly sexOptions: SexOption[] = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Intersex', value: 'intersex' },
    { label: 'Unknown / Prefer not to say', value: 'unknown' },
  ];

  protected readonly countryOptions = [
    { label: 'United States', value: 'US' },
    { label: 'India', value: 'IN' },
    { label: 'Australia', value: 'AU' },
    { label: 'Romania', value: 'RO' },
    { label: 'Other', value: 'OTHER' },
  ];

  protected readonly biologicalOptions: BiologicalOption[] = [
    { label: 'Biological', value: 'biological' },
    { label: 'Adopted', value: 'adopted' },
    { label: 'Step', value: 'step' },
    { label: 'Half', value: 'half' },
    { label: 'Foster', value: 'foster' },
    { label: 'N/A', value: 'none' },
  ];

  protected readonly accessLevelOptions: AccessLevelOption[] = [
    {
      label: 'Full',
      value: 'full',
      description: 'All records visible',
    },
    {
      label: 'Partial',
      value: 'partial',
      description: 'Selected records only',
    },
    {
      label: 'None',
      value: 'none',
      description: 'No access granted',
    },
    {
      label: 'Emergency',
      value: 'emergency-only',
      description: 'Critical info only',
    },
  ];

  protected permissionToggles: PermissionToggle[] = [
    { category: 'appointments', label: 'Appointments', enabled: true, sensitive: false },
    { category: 'medications', label: 'Medications', enabled: true, sensitive: false },
    { category: 'lab-results', label: 'Lab Results', enabled: true, sensitive: false },
    { category: 'immunizations', label: 'Immunizations', enabled: true, sensitive: false },
    { category: 'allergies', label: 'Allergies', enabled: true, sensitive: false },
    { category: 'mental-health', label: 'Mental Health', enabled: false, sensitive: true },
    { category: 'reproductive', label: 'Reproductive', enabled: false, sensitive: true },
    { category: 'sti', label: 'STI / Infections', enabled: false, sensitive: true },
    { category: 'genetic', label: 'Genetic', enabled: false, sensitive: true },
    { category: 'billing', label: 'Billing', enabled: true, sensitive: false },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      this.sidebarVisible = this.visible;
      if (this.visible) {
        this.reset();
      }
    }
  }

  protected selectRelationship(value: RelationshipType): void {
    this.selectedRelationship.set(value);
    this.formData.biologicalRelation = value === 'spouse' || value === 'partner' ? 'none' : 'biological';
  }

  protected canProceed(): boolean {
    if (this.currentStep() === 0) return this.selectedRelationship() !== null;
    if (this.currentStep() === 1) return !!this.formData.firstName.trim();
    return true;
  }

  protected nextStep(): void {
    if (this.currentStep() < this.steps.length - 1) {
      this.currentStep.update(s => s + 1);
    }
  }

  protected prevStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update(s => s - 1);
    }
  }

  protected addCondition(): void {
    const name = this.newConditionName.trim();
    if (name) {
      this.formData.conditions = [...this.formData.conditions, name];
      this.newConditionName = '';
    }
  }

  protected removeCondition(index: number): void {
    this.formData.conditions = this.formData.conditions.filter((_, i) => i !== index);
  }

  protected getIdLabel(country: string): string {
    const map: Record<string, string> = {
      IN: 'ABHA Health ID',
      AU: 'IHI Number',
      RO: 'CNP (Personal Numeric Code)',
      US: 'Medical Record Number (MRN)',
      OTHER: 'National ID',
    };
    return map[country] ?? 'National ID';
  }

  protected getIdPlaceholder(country: string): string {
    const map: Record<string, string> = {
      IN: 'e.g. 91-1234-5678-1234',
      AU: 'e.g. 2345 6789 0123',
      RO: 'e.g. 1850315123456',
      US: 'e.g. MRN-20240099',
      OTHER: 'Enter national identifier',
    };
    return map[country] ?? '';
  }

  protected getIdHint(country: string): string {
    const map: Record<string, string> = {
      IN: 'Ayushman Bharat Health Account',
      AU: 'Individual Healthcare Identifier',
      RO: 'Cod Numeric Personal',
      US: 'Assigned by your healthcare provider',
      OTHER: 'Optional — leave blank if unknown',
    };
    return map[country] ?? '';
  }

  protected save(): void {
    const rel = this.selectedRelationship();
    if (!rel || !this.formData.firstName.trim()) return;

    const colorIndex = Math.floor(Math.random() * AVATAR_COLORS.length);

    const identifiers = this.formData.nationalId && this.formData.country
      ? [{ type: this.getIdLabel(this.formData.country), value: this.formData.nationalId, country: this.formData.country }]
      : [];

    this.familyService.addMember({
      firstName: this.formData.firstName.trim(),
      lastName: this.formData.lastName.trim(),
      dateOfBirth: this.formData.dateOfBirth ?? undefined,
      sexAtBirth: this.formData.sexAtBirth ?? 'unknown',
      relationship: rel,
      biologicalRelation: this.formData.biologicalRelation,
      isDeceased: this.formData.isDeceased,
      deceasedAge: this.formData.deceasedAge ?? undefined,
      avatarColor: AVATAR_COLORS[colorIndex],
      source: 'manual-entry',
      identifiers,
      accessLevel: this.formData.accessLevel,
      notes: this.formData.notes || undefined,
      conditions: this.formData.conditions.map((name, i) => ({
        id: `fc-new-${i}`,
        memberId: 'pending',
        conditionName: name,
        category: 'General',
        status: 'unknown' as const,
        contributedToDeath: false,
      })),
    });

    this.memberAdded.emit();
    this.close();
  }

  protected cancel(): void {
    this.close();
  }

  protected onHide(): void {
    this.visibleChange.emit(false);
  }

  private close(): void {
    this.sidebarVisible = false;
    this.visibleChange.emit(false);
  }

  private reset(): void {
    this.currentStep.set(0);
    this.selectedRelationship.set(null);
    this.formData = this.getEmptyForm();
    this.newConditionName = '';
    this.permissionToggles.forEach(t => {
      t.enabled = !t.sensitive;
    });
  }

  private getEmptyForm() {
    return {
      firstName: '',
      lastName: '',
      dateOfBirth: null as Date | null,
      sexAtBirth: null as SexAtBirth | null,
      country: 'US',
      nationalId: '',
      biologicalRelation: 'biological' as BiologicalRelation,
      isDeceased: false,
      deceasedAge: null as number | null,
      conditions: [] as string[],
      notes: '',
      accessLevel: 'none' as AccessLevel,
      expiryDate: null as Date | null,
    };
  }
}
