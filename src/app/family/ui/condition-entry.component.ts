// =============================================================================
// Condition Entry Component — Task 14
// Reusable component for adding/editing a condition on a family member
// =============================================================================

import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextarea } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';

import { FamilyService } from '../data-access/family.service';
import { FamilyCondition } from '../data-access/family.models';
import {
  SNOMED_CONDITIONS,
  CONDITION_CATEGORIES,
  SnomedCondition,
} from '../data-access/snomed-conditions.data';

interface ConditionSuggestion {
  label: string;
  code: string;
  category: string;
}

@Component({
  selector: 'app-condition-entry',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    AutoCompleteModule,
    SelectButtonModule,
    InputNumberModule,
    InputSwitchModule,
    InputTextarea,
    ButtonModule,
    ChipModule,
    DividerModule,
  ],
  template: `
    <div class="condition-entry">
      <!-- AutoComplete search -->
      <div class="field">
        <label class="field-label">Search Condition</label>
        <p-autoComplete
          [(ngModel)]="selectedConditionObj"
          [suggestions]="suggestions()"
          (completeMethod)="searchConditions($event)"
          field="label"
          [dropdown]="true"
          placeholder="Type condition name..."
          (onSelect)="onConditionSelect($event)"
          styleClass="w-full"
        ></p-autoComplete>
      </div>

      <!-- Quick-add chips by category -->
      <p-divider align="left">
        <span style="font-size:0.75rem;color:var(--text-color-secondary);font-weight:600;text-transform:uppercase;letter-spacing:0.05em">
          Quick Add
        </span>
      </p-divider>

      <div class="quick-categories">
        @for (cat of conditionCategories; track cat) {
          <div class="quick-cat">
            <div class="cat-label">{{ cat }}</div>
            <div class="chip-row">
              @for (cond of getTopByCategory(cat); track cond.code) {
                <p-chip
                  [label]="cond.name"
                  [styleClass]="selectedConditionObj?.code === cond.code ? 'chip-selected' : 'chip-item'"
                  (click)="selectFromChip(cond)"
                ></p-chip>
              }
            </div>
          </div>
        }
      </div>

      @if (form.conditionName) {
        <p-divider></p-divider>

        <!-- Status selector -->
        <div class="field">
          <label class="field-label">Status</label>
          <p-selectButton
            [(ngModel)]="form.status"
            [options]="statusOptions"
            optionLabel="label"
            optionValue="value"
          ></p-selectButton>
        </div>

        <!-- Onset Age -->
        <div class="field">
          <label class="field-label">Onset Age (years)</label>
          <p-inputNumber
            [(ngModel)]="form.onsetAge"
            [min]="0"
            [max]="120"
            placeholder="Leave blank if unknown"
            styleClass="w-full"
          ></p-inputNumber>
        </div>

        <!-- Contributed to death -->
        <div class="field field-row">
          <label class="field-label">Contributed to death</label>
          <p-inputSwitch [(ngModel)]="form.contributedToDeath"></p-inputSwitch>
        </div>

        <!-- Notes -->
        <div class="field">
          <label class="field-label">Notes</label>
          <textarea
            pInputTextarea
            [(ngModel)]="form.notes"
            rows="3"
            placeholder="Optional clinical notes..."
            style="width:100%"
          ></textarea>
        </div>

        <!-- Actions -->
        <div class="entry-actions">
          <p-button
            label="Cancel"
            icon="pi pi-times"
            severity="secondary"
            [outlined]="true"
            (onClick)="cancel()"
          ></p-button>
          <p-button
            label="Save Condition"
            icon="pi pi-check"
            (onClick)="save()"
            [disabled]="!form.conditionName"
          ></p-button>
        </div>
      }
    </div>
  `,
  styles: [`
    .condition-entry {
      display: flex;
      flex-direction: column;
      gap: 1rem;
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
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .quick-categories {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: 260px;
      overflow-y: auto;
    }

    .quick-cat {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .cat-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--primary-color);
    }

    .chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    :host ::ng-deep .chip-item .p-chip {
      background: var(--surface-100);
      color: var(--text-color);
      font-size: 0.75rem;
      cursor: pointer;
      transition: background 0.15s;
    }

    :host ::ng-deep .chip-item .p-chip:hover {
      background: var(--primary-100);
    }

    :host ::ng-deep .chip-selected .p-chip {
      background: var(--primary-color);
      color: white;
      font-size: 0.75rem;
    }

    .entry-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }
  `],
})
export class ConditionEntryComponent implements OnInit {
  @Input() memberId = '';
  @Output() conditionSaved = new EventEmitter<Partial<FamilyCondition>>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly familyService = inject(FamilyService);

  readonly conditionCategories = CONDITION_CATEGORIES;

  readonly suggestions = signal<ConditionSuggestion[]>([]);

  selectedConditionObj: ConditionSuggestion | null = null;

  form = {
    conditionName: '',
    snomedCode: '',
    category: '',
    status: 'affected' as FamilyCondition['status'],
    onsetAge: undefined as number | undefined,
    contributedToDeath: false,
    notes: '',
  };

  readonly statusOptions = [
    { label: 'Affected',   value: 'affected'   },
    { label: 'Carrier',    value: 'carrier'     },
    { label: 'Unaffected', value: 'unaffected'  },
    { label: 'Unknown',    value: 'unknown'     },
  ];

  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {}

  getTopByCategory(category: string): SnomedCondition[] {
    return SNOMED_CONDITIONS.filter(c => c.category === category).slice(0, 5);
  }

  searchConditions(event: { query: string }): void {
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      const q = event.query.toLowerCase();
      const results = SNOMED_CONDITIONS
        .filter(c => c.name.toLowerCase().includes(q))
        .slice(0, 20)
        .map(c => ({ label: c.name, code: c.code, category: c.category }));
      this.suggestions.set(results);
    }, 300);
  }

  onConditionSelect(event: AutoCompleteSelectEvent): void {
    const suggestion = event.value as ConditionSuggestion;
    this.form.conditionName = suggestion.label;
    this.form.snomedCode = suggestion.code;
    this.form.category = suggestion.category;
  }

  selectFromChip(cond: SnomedCondition): void {
    this.selectedConditionObj = { label: cond.name, code: cond.code, category: cond.category };
    this.form.conditionName = cond.name;
    this.form.snomedCode = cond.code;
    this.form.category = cond.category;
  }

  save(): void {
    if (!this.form.conditionName) return;
    const condition: Partial<FamilyCondition> = {
      conditionName: this.form.conditionName,
      snomedCode: this.form.snomedCode || undefined,
      category: this.form.category || 'General',
      status: this.form.status,
      onsetAge: this.form.onsetAge,
      contributedToDeath: this.form.contributedToDeath,
      notes: this.form.notes || undefined,
    };

    if (this.memberId) {
      this.familyService.addCondition(this.memberId, condition);
    }

    this.conditionSaved.emit(condition);
    this._resetForm();
  }

  cancel(): void {
    this._resetForm();
    this.cancelled.emit();
  }

  private _resetForm(): void {
    this.form = {
      conditionName: '',
      snomedCode: '',
      category: '',
      status: 'affected',
      onsetAge: undefined,
      contributedToDeath: false,
      notes: '',
    };
    this.selectedConditionObj = null;
    this.suggestions.set([]);
  }
}
