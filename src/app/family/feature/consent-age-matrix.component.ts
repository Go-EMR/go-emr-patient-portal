import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { RulesetService } from '../data-access/ruleset.service';
import { ConsentAgeRule, SupportedCountry } from '../data-access/ruleset.models';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

interface AgeRange {
  label: string;
  min: number;
  max: number;
}

interface CellStatus {
  color: 'green' | 'yellow' | 'red' | 'gray';
  label: string;
  notes: string;
}

interface AuditRow {
  timestamp: Date;
  action: string;
  country: string;
  category: string;
  changedBy: string;
}

const AGE_RANGES: AgeRange[] = [
  { label: '0–11', min: 0, max: 11 },
  { label: '12–13', min: 12, max: 13 },
  { label: '14–15', min: 14, max: 15 },
  { label: '16–17', min: 16, max: 17 },
  { label: '18+', min: 18, max: 150 },
];

const RECORD_CATEGORIES = [
  { key: 'appointments', label: 'Appointments' },
  { key: 'medications', label: 'Medications' },
  { key: 'lab-results', label: 'Lab Results' },
  { key: 'immunizations', label: 'Immunizations' },
  { key: 'allergies', label: 'Allergies' },
  { key: 'mental-health', label: 'Mental Health' },
  { key: 'reproductive', label: 'Reproductive' },
  { key: 'sti', label: 'STI Services' },
  { key: 'genetic', label: 'Genetic Testing' },
  { key: 'billing', label: 'Billing' },
];

const MOCK_AUDIT: AuditRow[] = [
  {
    timestamp: new Date(2026, 0, 15),
    action: 'Ruleset Updated',
    country: 'US',
    category: 'mental-health',
    changedBy: 'System (v2026.1)',
  },
  {
    timestamp: new Date(2025, 11, 1),
    action: 'Consent Age Revised',
    country: 'AU',
    category: 'reproductive',
    changedBy: 'Admin (policy update)',
  },
  {
    timestamp: new Date(2025, 9, 20),
    action: 'New Rule Added',
    country: 'RO',
    category: 'sti',
    changedBy: 'System (EU directive)',
  },
];

@Component({
  selector: 'app-consent-age-matrix',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    SelectButtonModule,
    DropdownModule,
    TableModule,
    TagModule,
    ButtonModule,
    DividerModule,
    TooltipModule,
    CardModule,
  ],
  template: `
    <div class="consent-age-matrix p-4">
      <div class="page-header mb-4">
        <h1 class="text-2xl font-bold text-gray-800 m-0">
          <i class="pi pi-shield mr-2 text-purple-600"></i>Consent Age Matrix
        </h1>
        <p class="text-gray-500 mt-1 mb-0">
          Age-based consent rules for each health record category by jurisdiction.
        </p>
      </div>

      <!-- Country selector -->
      <p-card styleClass="mb-4">
        <div class="flex flex-wrap align-items-center gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Jurisdiction</label>
            <p-selectButton
              [options]="countryOptions"
              [(ngModel)]="selectedCountry"
              optionLabel="label"
              optionValue="value"
              (onChange)="onCountryChange()">
            </p-selectButton>
          </div>

          @if (selectedCountry() === 'US') {
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">State Override</label>
              <p-dropdown
                [options]="usStateOptions()"
                [(ngModel)]="selectedState"
                optionLabel="label"
                optionValue="value"
                placeholder="Select state..."
                [showClear]="true"
                appendTo="body"
                [style]="{'min-width': '200px'}">
              </p-dropdown>
            </div>
          }

          <div class="ml-auto">
            <p-button
              label="Export PDF"
              icon="pi pi-file-pdf"
              severity="secondary"
              [outlined]="true"
              (onClick)="exportMatrix()">
            </p-button>
          </div>
        </div>

        @if (selectedCountry() === 'US' && selectedState()) {
          <div class="state-override-banner mt-3 p-3 bg-yellow-50 border-round border-1 border-yellow-300">
            <i class="pi pi-info-circle text-yellow-600 mr-2"></i>
            <span class="text-sm text-yellow-800">
              Showing state-specific overrides for <strong>{{ getStateName(selectedState()!) }}</strong>.
              State rules may be more permissive than federal defaults for mental health, STI, and reproductive categories.
            </span>
          </div>
        }
      </p-card>

      <!-- Legend -->
      <div class="legend flex flex-wrap gap-3 mb-4">
        <span class="text-sm font-medium text-gray-600">Legend:</span>
        <div class="flex align-items-center gap-1">
          <div class="legend-dot bg-green-500"></div>
          <span class="text-xs">Self-consent (independent)</span>
        </div>
        <div class="flex align-items-center gap-1">
          <div class="legend-dot bg-yellow-400"></div>
          <span class="text-xs">Assent + Parental consent required</span>
        </div>
        <div class="flex align-items-center gap-1">
          <div class="legend-dot bg-red-500"></div>
          <span class="text-xs">Parental consent only</span>
        </div>
        <div class="flex align-items-center gap-1">
          <div class="legend-dot bg-gray-300"></div>
          <span class="text-xs">N/A</span>
        </div>
      </div>

      <!-- Matrix table -->
      <p-card styleClass="mb-4">
        <div class="overflow-x-auto">
          <table class="consent-matrix-table w-full" aria-label="Consent Age Matrix">
            <thead>
              <tr>
                <th class="category-header">Record Category</th>
                @for (range of ageRanges; track range.label) {
                  <th class="age-header text-center">{{ range.label }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (category of recordCategories; track category.key) {
                <tr>
                  <td class="category-cell font-medium text-sm">{{ category.label }}</td>
                  @for (range of ageRanges; track range.label) {
                    @let cell = getCellStatus(category.key, range);
                    <td
                      [class]="'matrix-cell text-center cell-' + cell.color"
                      [pTooltip]="cell.notes"
                      tooltipPosition="top">
                      <div class="cell-content">
                        <span class="cell-label text-xs font-medium">{{ cell.label }}</span>
                      </div>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- Audit log -->
      <div class="audit-section">
        <h2 class="text-lg font-semibold text-gray-800 mb-3">
          <i class="pi pi-history mr-2 text-gray-500"></i>Ruleset Audit Log
        </h2>
        <p-table
          [value]="auditLog"
          [paginator]="true"
          [rows]="5"
          styleClass="p-datatable-sm p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Country</th>
              <th>Category</th>
              <th>Changed By</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr>
              <td class="text-sm">{{ row.timestamp | date:'medium' }}</td>
              <td class="text-sm">{{ row.action }}</td>
              <td>
                <p-tag [value]="row.country" severity="info"></p-tag>
              </td>
              <td class="text-sm">{{ row.category }}</td>
              <td class="text-sm text-gray-600">{{ row.changedBy }}</td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    .consent-age-matrix {
      max-width: 1200px;
      margin: 0 auto;
    }
    .legend-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .consent-matrix-table {
      border-collapse: collapse;
    }
    .consent-matrix-table th,
    .consent-matrix-table td {
      border: 1px solid #e5e7eb;
      padding: 0;
    }
    .category-header {
      background: #f3f4f6;
      font-size: 0.8rem;
      font-weight: 600;
      color: #374151;
      padding: 10px 12px;
      min-width: 130px;
      text-align: left;
    }
    .age-header {
      background: #f3f4f6;
      font-size: 0.8rem;
      font-weight: 600;
      color: #374151;
      padding: 10px 8px;
      min-width: 90px;
    }
    .category-cell {
      padding: 8px 12px;
      background: #fafafa;
      font-size: 0.82rem;
    }
    .matrix-cell {
      padding: 8px 4px;
      cursor: help;
      transition: opacity 0.15s;
    }
    .matrix-cell:hover {
      opacity: 0.85;
    }
    .cell-content {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 36px;
    }
    .cell-label {
      line-height: 1.2;
    }
    .cell-green {
      background: #dcfce7;
      color: #166534;
    }
    .cell-yellow {
      background: #fef9c3;
      color: #854d0e;
    }
    .cell-red {
      background: #fee2e2;
      color: #991b1b;
    }
    .cell-gray {
      background: #f3f4f6;
      color: #6b7280;
    }
  `],
})
export class ConsentAgeMatrixComponent {
  private readonly rulesetService = inject(RulesetService);

  selectedCountry = signal<SupportedCountry>('US');
  selectedState = signal<string | undefined>(undefined);

  readonly ageRanges = AGE_RANGES;
  readonly recordCategories = RECORD_CATEGORIES;
  readonly auditLog = MOCK_AUDIT;

  readonly countryOptions = [
    { label: '🇮🇳 India', value: 'IN' as SupportedCountry },
    { label: '🇷🇴 Romania', value: 'RO' as SupportedCountry },
    { label: '🇦🇺 Australia', value: 'AU' as SupportedCountry },
    { label: '🇺🇸 United States', value: 'US' as SupportedCountry },
  ];

  readonly usStateOptions = computed(() =>
    this.rulesetService.getUSStates().map(s => ({
      label: s.stateName,
      value: s.stateCode,
    }))
  );

  readonly matrixRules = computed(() =>
    this.rulesetService.getConsentAgeMatrix(this.selectedCountry()).rules
  );

  onCountryChange(): void {
    this.selectedState.set(undefined);
  }

  getStateName(code: string): string {
    return this.rulesetService.getUSStates().find(s => s.stateCode === code)?.stateName ?? code;
  }

  getCellStatus(category: string, range: AgeRange): CellStatus {
    const rules = this.matrixRules();
    const matchingRule = rules.find(
      (r: ConsentAgeRule) =>
        r.category === category &&
        r.minAge <= range.min &&
        r.maxAge >= range.max
    );

    if (!matchingRule) {
      // Check for partial overlap
      const partialRule = rules.find(
        (r: ConsentAgeRule) =>
          r.category === category &&
          r.minAge <= range.max &&
          r.maxAge >= range.min
      );

      if (!partialRule) {
        return { color: 'gray', label: 'N/A', notes: 'No specific rule defined for this age range.' };
      }

      return this.buildCellStatus(partialRule);
    }

    return this.buildCellStatus(matchingRule);
  }

  private buildCellStatus(rule: ConsentAgeRule): CellStatus {
    if (!rule.requiresParentalConsent && !rule.requiresMinorAssent) {
      return {
        color: 'green',
        label: 'Self-consent',
        notes: rule.notes,
      };
    }
    if (rule.requiresMinorAssent && rule.requiresParentalConsent) {
      return {
        color: 'yellow',
        label: 'Assent + Parent',
        notes: rule.notes,
      };
    }
    if (rule.requiresMinorAssent && !rule.requiresParentalConsent) {
      return {
        color: 'yellow',
        label: 'Minor Assent',
        notes: rule.notes,
      };
    }
    return {
      color: 'red',
      label: 'Parental Only',
      notes: rule.notes,
    };
  }

  exportMatrix(): void {
    // Export placeholder — would trigger PDF generation in production
    console.log('Export matrix for', this.selectedCountry());
  }
}
