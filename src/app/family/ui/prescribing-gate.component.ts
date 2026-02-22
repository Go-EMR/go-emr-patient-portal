import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { RulesetService } from '../data-access/ruleset.service';
import {
  DrugScheduleEntry,
  PrescribingCheckResult,
  SupportedCountry,
} from '../data-access/ruleset.models';

type ProviderType = 'physician' | 'nurse-practitioner' | 'physician-assistant';

type MessageSeverity = 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast' | undefined;

interface ProviderOption {
  label: string;
  value: ProviderType;
  description: string;
}

@Component({
  selector: 'app-prescribing-gate',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    AutoCompleteModule,
    RadioButtonModule,
    ToggleSwitchModule,
    ButtonModule,
    MessageModule,
    CardModule,
    DividerModule,
  ],
  template: `
    <div class="prescribing-gate">
      <p-card>
        <ng-template pTemplate="title">
          <div class="flex align-items-center gap-2">
            <i class="pi pi-shield text-blue-600 text-xl"></i>
            <span class="text-lg font-semibold">Pre-Booking Prescribing Check</span>
          </div>
        </ng-template>
        <ng-template pTemplate="subtitle">
          <span class="text-sm text-gray-500">
            Verify prescribing eligibility before booking a telehealth or in-person appointment.
          </span>
        </ng-template>

        <!-- Step 1: Provider Type -->
        <div class="step-section mb-4">
          <div class="step-header flex align-items-center gap-2 mb-3">
            <div class="step-number">1</div>
            <span class="font-semibold text-gray-800">Provider Type</span>
          </div>
          <div class="flex flex-wrap gap-3">
            @for (opt of providerOptions; track opt.value) {
              <div
                class="provider-option p-3 border-round border-1 cursor-pointer flex-1"
                [class.selected-option]="selectedProviderType() === opt.value"
                [class.surface-border]="selectedProviderType() !== opt.value"
                [class.border-blue-400]="selectedProviderType() === opt.value"
                [class.surface-50]="selectedProviderType() !== opt.value"
                [class.bg-blue-50]="selectedProviderType() === opt.value"
                (click)="selectedProviderType.set(opt.value)"
                style="min-width: 140px">
                <div class="flex align-items-center gap-2">
                  <p-radioButton
                    [name]="'providerType'"
                    [value]="opt.value"
                    [(ngModel)]="selectedProviderTypeModel"
                    (onClick)="selectedProviderType.set(opt.value)">
                  </p-radioButton>
                  <div>
                    <p class="font-semibold text-sm text-gray-800 mb-0">{{ opt.label }}</p>
                    <p class="text-xs text-gray-500 mb-0">{{ opt.description }}</p>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <p-divider></p-divider>

        <!-- Step 2: Drug Search -->
        <div class="step-section mb-4">
          <div class="step-header flex align-items-center gap-2 mb-3">
            <div class="step-number">2</div>
            <span class="font-semibold text-gray-800">Drug to Prescribe</span>
          </div>
          <div class="mb-2">
            <label class="block text-sm text-gray-600 mb-2">
              Search by drug name or generic name
            </label>
            <p-autoComplete
              [(ngModel)]="selectedDrug"
              [suggestions]="drugSuggestions()"
              (completeMethod)="searchDrugs($event)"
              (onSelect)="onDrugSelect()"
              (onClear)="clearResult()"
              field="drugName"
              [dropdown]="true"
              placeholder="e.g. Alprazolam, Metformin..."
              styleClass="w-full md:w-25rem"
              [forceSelection]="false"
              appendTo="body">
              <ng-template let-drug pTemplate="item">
                <div class="drug-option">
                  <p class="font-semibold text-sm m-0">{{ drug.drugName }}</p>
                  <p class="text-xs text-gray-400 m-0 italic">{{ drug.genericName }}</p>
                </div>
              </ng-template>
            </p-autoComplete>
          </div>
          @if (selectedDrug && selectedDrug.drugName) {
            <div class="selected-drug-info mt-3 p-3 surface-50 border-round border-1 surface-border">
              <p class="text-sm font-semibold text-gray-700 mb-1">{{ selectedDrug.drugName }}</p>
              <p class="text-xs text-gray-500 mb-1 italic">{{ selectedDrug.genericName }}</p>
              <div class="flex flex-wrap gap-2 mt-2">
                <span class="text-xs bg-gray-100 border-round px-2 py-1">
                  <strong>IN:</strong> {{ selectedDrug.scheduleIN ?? 'N/A' }}
                </span>
                <span class="text-xs bg-gray-100 border-round px-2 py-1">
                  <strong>RO:</strong> {{ selectedDrug.scheduleRO ?? 'N/A' }}
                </span>
                <span class="text-xs bg-gray-100 border-round px-2 py-1">
                  <strong>AU:</strong> {{ selectedDrug.scheduleAU ?? 'N/A' }}
                </span>
                <span class="text-xs bg-gray-100 border-round px-2 py-1">
                  <strong>US:</strong> {{ selectedDrug.scheduleUS ?? 'N/A' }}
                </span>
              </div>
            </div>
          }
        </div>

        <p-divider></p-divider>

        <!-- Step 3: Toggles -->
        <div class="step-section mb-4">
          <div class="step-header flex align-items-center gap-2 mb-3">
            <div class="step-number">3</div>
            <span class="font-semibold text-gray-800">Session Details</span>
          </div>
          <div class="flex flex-column gap-3">
            <div class="flex align-items-center justify-content-between p-3 surface-50 border-round border-1 surface-border">
              <div>
                <p class="font-medium text-sm text-gray-800 mb-0">Telehealth Session</p>
                <p class="text-xs text-gray-500 mb-0">Is this appointment via telehealth / video / phone?</p>
              </div>
              <p-toggleswitch [(ngModel)]="isTelehealth" (onChange)="clearResult()"></p-toggleswitch>
            </div>
            <div class="flex align-items-center justify-content-between p-3 surface-50 border-round border-1 surface-border">
              <div>
                <p class="font-medium text-sm text-gray-800 mb-0">First Prescription</p>
                <p class="text-xs text-gray-500 mb-0">Is this the first time prescribing this drug for this patient?</p>
              </div>
              <p-toggleswitch [(ngModel)]="isFirstPrescription" (onChange)="clearResult()"></p-toggleswitch>
            </div>
          </div>
        </div>

        <p-divider></p-divider>

        <!-- Check button + Jurisdiction context -->
        <div class="mb-4 flex align-items-center justify-content-between flex-wrap gap-3">
          <div class="text-sm text-gray-500">
            <i class="pi pi-globe mr-1"></i>
            Checking against:
            <strong>{{ jurisdictionLabel() }}</strong>
            <span class="ml-2 text-xs text-gray-400">(v{{ rulesetService.jurisdiction().version }})</span>
          </div>
          <p-button
            label="Check Prescribing Eligibility"
            icon="pi pi-search"
            [disabled]="!canCheck()"
            (onClick)="performCheck()">
          </p-button>
        </div>

        <!-- Result banner -->
        @if (checkResult()) {
          @let res = checkResult()!;
          <div class="result-section animate-fadein">

            <!-- Primary message -->
            <p-message
              [severity]="getOutcomeSeverity(res.outcome)"
              styleClass="w-full mb-3"
              [text]="res.message">
            </p-message>

            <div class="grid">
              <!-- Requirements -->
              @if (res.requirements.length > 0) {
                <div class="col-12 md:col-6">
                  <div class="result-detail p-3 border-round border-1 surface-border mb-3">
                    <p class="text-sm font-semibold text-gray-700 mb-2">
                      <i class="pi pi-list mr-1 text-blue-500"></i>Requirements
                    </p>
                    <ul class="m-0 pl-4">
                      @for (req of res.requirements; track req) {
                        <li class="text-sm text-gray-700 mb-1">{{ req }}</li>
                      }
                    </ul>
                  </div>
                </div>
              }

              <!-- Documentation needed -->
              @if (res.documentationNeeded.length > 0) {
                <div class="col-12 md:col-6">
                  <div class="result-detail p-3 border-round border-1 surface-border mb-3">
                    <p class="text-sm font-semibold text-gray-700 mb-2">
                      <i class="pi pi-file mr-1 text-orange-500"></i>Documentation Needed
                    </p>
                    <ul class="m-0 pl-4">
                      @for (doc of res.documentationNeeded; track doc) {
                        <li class="text-sm text-gray-700 mb-1">{{ doc }}</li>
                      }
                    </ul>
                  </div>
                </div>
              }

              <!-- Alternative actions -->
              @if (res.alternativeActions && res.alternativeActions.length > 0) {
                <div class="col-12">
                  <div class="result-detail p-3 border-round border-1 surface-border bg-blue-50">
                    <p class="text-sm font-semibold text-blue-700 mb-2">
                      <i class="pi pi-info-circle mr-1"></i>Alternative Actions
                    </p>
                    <ul class="m-0 pl-4">
                      @for (action of res.alternativeActions; track action) {
                        <li class="text-sm text-blue-700 mb-1">{{ action }}</li>
                      }
                    </ul>
                  </div>
                </div>
              }
            </div>

            <div class="mt-3 flex gap-2">
              <p-button
                label="Reset Check"
                icon="pi pi-refresh"
                severity="secondary"
                [outlined]="true"
                size="small"
                (onClick)="resetForm()">
              </p-button>
            </div>
          </div>
        }
      </p-card>
    </div>
  `,
  styles: [`
    .prescribing-gate {
      max-width: 900px;
    }
    .step-number {
      width: 28px;
      height: 28px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .provider-option {
      transition: all 0.15s;
    }
    .provider-option:hover {
      border-color: #93c5fd;
    }
    .selected-option {
      box-shadow: 0 0 0 1px #3b82f6;
    }
    .drug-option {
      padding: 2px 0;
    }
    .result-detail {
      background: #fafafa;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadein {
      animation: fadeIn 0.25s ease;
    }
  `],
})
export class PrescribingGateComponent {
  readonly rulesetService = inject(RulesetService);

  readonly selectedProviderType = signal<ProviderType>('physician');
  // Two-way binding bridge for p-radioButton with ngModel
  get selectedProviderTypeModel(): ProviderType { return this.selectedProviderType(); }
  set selectedProviderTypeModel(v: ProviderType) { this.selectedProviderType.set(v); }

  selectedDrug: DrugScheduleEntry | null = null;
  isTelehealth = false;
  isFirstPrescription = false;

  readonly drugSuggestions = signal<DrugScheduleEntry[]>([]);
  readonly checkResult = signal<PrescribingCheckResult | null>(null);

  readonly jurisdictionLabel = computed(() => {
    const j = this.rulesetService.jurisdiction();
    const labels: Record<SupportedCountry, string> = {
      IN: '🇮🇳 India',
      RO: '🇷🇴 Romania',
      AU: '🇦🇺 Australia',
      US: '🇺🇸 United States',
    };
    return labels[j.country] + (j.state ? ` — ${j.state}` : '');
  });

  readonly providerOptions: ProviderOption[] = [
    {
      label: 'Physician',
      value: 'physician',
      description: 'MD / DO / MBBS',
    },
    {
      label: 'Nurse Practitioner',
      value: 'nurse-practitioner',
      description: 'NP / APRN',
    },
    {
      label: 'Physician Assistant',
      value: 'physician-assistant',
      description: 'PA-C',
    },
  ];

  canCheck(): boolean {
    return !!(this.selectedDrug && this.selectedDrug.drugName && this.selectedProviderType());
  }

  searchDrugs(event: AutoCompleteCompleteEvent): void {
    const query = (event.query ?? '').toLowerCase().trim();
    const results = this.rulesetService.drugSchedule().filter(
      d =>
        d.drugName.toLowerCase().includes(query) ||
        d.genericName.toLowerCase().includes(query)
    );
    this.drugSuggestions.set(results);
  }

  onDrugSelect(): void {
    this.checkResult.set(null);
  }

  clearResult(): void {
    this.checkResult.set(null);
  }

  performCheck(): void {
    if (!this.selectedDrug || !this.selectedDrug.drugName) return;
    const j = this.rulesetService.jurisdiction();
    const result = this.rulesetService.checkPrescribing({
      drugName: this.selectedDrug.drugName,
      country: j.country,
      state: j.state,
      isTelehealth: this.isTelehealth,
      providerType: this.selectedProviderType(),
      isFirstPrescription: this.isFirstPrescription,
    });
    this.checkResult.set(result);
  }

  getOutcomeSeverity(outcome: PrescribingCheckResult['outcome']): MessageSeverity {
    const map: Record<PrescribingCheckResult['outcome'], MessageSeverity> = {
      'hard-stop': 'error',
      'warning': 'warn',
      'permitted-with-conditions': 'info',
      'permitted': 'success',
    };
    return map[outcome];
  }

  resetForm(): void {
    this.selectedDrug = null;
    this.isTelehealth = false;
    this.isFirstPrescription = false;
    this.selectedProviderType.set('physician');
    this.checkResult.set(null);
    this.drugSuggestions.set([]);
  }
}
