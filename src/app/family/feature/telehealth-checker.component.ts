import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { RulesetService } from '../data-access/ruleset.service';
import {
  SupportedCountry,
  TelehealthJurisdictionResult,
} from '../data-access/ruleset.models';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

interface CountryOption {
  label: string;
  value: SupportedCountry;
}

interface StateOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-telehealth-checker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    SelectModule,
    ButtonModule,
    CardModule,
    TagModule,
    DividerModule,
    MessageModule
],
  template: `
    <div class="telehealth-checker p-4">
      <div class="page-header mb-4">
        <h1 class="text-2xl font-bold text-gray-800 m-0">
          <i class="pi pi-video mr-2 text-blue-600"></i>Telehealth Jurisdiction Checker
        </h1>
        <p class="text-gray-500 mt-1 mb-0">
          Verify whether a telehealth session can legally proceed given the patient and provider locations.
        </p>
      </div>

      <p-card styleClass="mb-4">
        <div class="checker-layout grid">
          <!-- Patient Location -->
          <div class="col-12 md:col-5">
            <div class="location-panel p-4 border-round border-2 border-blue-200 surface-ground">
              <div class="flex align-items-center gap-2 mb-3">
                <div class="icon-circle bg-blue-100 border-round-xl p-2">
                  <i class="pi pi-user text-blue-600 text-xl"></i>
                </div>
                <div>
                  <p class="font-bold text-gray-800 mb-0">Patient Location</p>
                  <p class="text-xs text-gray-400 mb-0">Where the patient is located</p>
                </div>
              </div>

              <div class="mb-3">
                <label class="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <p-select
                  [options]="countryOptions"
                  [(ngModel)]="patientCountry"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select country..."
                  styleClass="w-full"
                  (onChange)="onPatientCountryChange()"
                  appendTo="body">
                </p-select>
              </div>

              @if (patientCountry === 'US') {
                <div class="mb-2 animate-fadein">
                  <label class="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <p-select
                    [options]="usStateOptions()"
                    [(ngModel)]="patientState"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select state..."
                    [filter]="true"
                    filterPlaceholder="Search..."
                    styleClass="w-full"
                    appendTo="body">
                  </p-select>
                </div>
              }

              @if (patientCountry) {
                <div class="mt-3 p-2 surface-50 border-round text-xs text-gray-600">
                  <i class="pi pi-map-marker mr-1 text-blue-500"></i>
                  <strong>Selected:</strong> {{ getCountryLabel(patientCountry) }}
                  @if (patientCountry === 'US' && patientState) { — {{ patientState }} }
                </div>
              }
            </div>
          </div>

          <!-- Check button in center -->
          <div class="col-12 md:col-2 flex align-items-center justify-content-center">
            <div class="text-center">
              <div class="connector-line d-none md:block mb-2"></div>
              <p-button
                label="Check"
                icon="pi pi-sync"
                [disabled]="!canCheck()"
                (onClick)="checkCompatibility()"
                styleClass="check-btn">
              </p-button>
              <p class="text-xs text-gray-400 mt-2">Compatibility</p>
            </div>
          </div>

          <!-- Doctor Location -->
          <div class="col-12 md:col-5">
            <div class="location-panel p-4 border-round border-2 border-green-200 surface-ground">
              <div class="flex align-items-center gap-2 mb-3">
                <div class="icon-circle bg-green-100 border-round-xl p-2">
                  <i class="pi pi-user-plus text-green-700 text-xl"></i>
                </div>
                <div>
                  <p class="font-bold text-gray-800 mb-0">Provider Location</p>
                  <p class="text-xs text-gray-400 mb-0">Where the provider is licensed/located</p>
                </div>
              </div>

              <div class="mb-3">
                <label class="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <p-select
                  [options]="countryOptions"
                  [(ngModel)]="doctorCountry"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select country..."
                  styleClass="w-full"
                  (onChange)="onDoctorCountryChange()"
                  appendTo="body">
                </p-select>
              </div>

              @if (doctorCountry === 'US') {
                <div class="mb-2 animate-fadein">
                  <label class="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <p-select
                    [options]="usStateOptions()"
                    [(ngModel)]="doctorState"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select state..."
                    [filter]="true"
                    filterPlaceholder="Search..."
                    styleClass="w-full"
                    appendTo="body">
                  </p-select>
                </div>
              }

              @if (doctorCountry) {
                <div class="mt-3 p-2 surface-50 border-round text-xs text-gray-600">
                  <i class="pi pi-map-marker mr-1 text-green-600"></i>
                  <strong>Selected:</strong> {{ getCountryLabel(doctorCountry) }}
                  @if (doctorCountry === 'US' && doctorState) { — {{ doctorState }} }
                </div>
              }
            </div>
          </div>
        </div>
      </p-card>

      <!-- Result section -->
      @if (result()) {
        @let res = result()!;
        <div class="result-section animate-fadein">
          <!-- Result card -->
          <div class="result-card p-4 border-round border-2 mb-4" [class]="getResultCardClass(res.status)">
            <div class="flex align-items-start gap-3">
              <i [class]="getResultIcon(res.status) + ' text-3xl flex-shrink-0'"></i>
              <div class="flex-1">
                <div class="flex align-items-center gap-2 mb-2">
                  <h3 class="text-lg font-bold m-0">{{ getResultTitle(res.status) }}</h3>
                  <p-tag
                    [value]="getStatusTagLabel(res.status)"
                    [severity]="getStatusTagSeverity(res.status)">
                  </p-tag>
                </div>
                <p class="text-sm mb-0" [class]="getResultTextClass(res.status)">{{ res.message }}</p>
              </div>
            </div>
          </div>

          <div class="grid">
            <!-- Requirements -->
            @if (res.requirements.length > 0) {
              <div class="col-12 md:col-6">
                <p-card>
                  <ng-template pTemplate="title">
                    <span class="text-base font-semibold">
                      <i class="pi pi-list-check mr-2 text-blue-500"></i>Requirements
                    </span>
                  </ng-template>
                  <ul class="m-0 pl-4">
                    @for (req of res.requirements; track req) {
                      <li class="text-sm text-gray-700 mb-2">{{ req }}</li>
                    }
                  </ul>
                </p-card>
              </div>
            }

            <!-- Licensure notes -->
            <div class="col-12 md:col-6">
              <p-card>
                <ng-template pTemplate="title">
                  <span class="text-base font-semibold">
                    <i class="pi pi-id-card mr-2 text-purple-500"></i>Licensure Notes
                  </span>
                </ng-template>
                <p class="text-sm text-gray-700 mb-0">{{ res.licensureNotes }}</p>
              </p-card>
            </div>
          </div>

          <!-- IMLC compact info when applicable -->
          @if (patientCountry === 'US' && doctorCountry === 'US') {
            <div class="mt-3">
              <p-message
                severity="info"
                styleClass="w-full"
                text="US interstate telehealth compatibility is determined by IMLC (Interstate Medical Licensure Compact) membership. Both states must be IMLC members for compact license acceptance.">
              </p-message>
            </div>
          }

          <div class="mt-3 flex gap-2">
            <p-button
              label="Check Another"
              icon="pi pi-refresh"
              severity="secondary"
              [outlined]="true"
              (onClick)="resetChecker()">
            </p-button>
          </div>
        </div>
      }

      @if (!result() && checkedOnce()) {
        <p-message
          severity="warn"
          styleClass="w-full"
          text="Please select both patient and provider locations to check compatibility.">
        </p-message>
      }
    </div>
  `,
  styles: [`
    .telehealth-checker {
      max-width: 1100px;
      margin: 0 auto;
    }
    .location-panel {
      min-height: 200px;
    }
    .icon-circle {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .result-card {
      transition: all 0.3s ease;
    }
    .result-card-green {
      background: #f0fdf4;
      border-color: #86efac;
    }
    .result-card-yellow {
      background: #fffbeb;
      border-color: #fde68a;
    }
    .result-card-red {
      background: #fef2f2;
      border-color: #fca5a5;
    }
    .result-card-gray {
      background: #f9fafb;
      border-color: #d1d5db;
    }
    :host ::ng-deep .check-btn {
      min-width: 90px;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadein {
      animation: fadeIn 0.25s ease;
    }
  `],
})
export class TelehealthCheckerComponent {
  private readonly rulesetService = inject(RulesetService);

  patientCountry: SupportedCountry | null = null;
  patientState: string | null = null;
  doctorCountry: SupportedCountry | null = null;
  doctorState: string | null = null;

  readonly result = signal<TelehealthJurisdictionResult | null>(null);
  readonly checkedOnce = signal(false);

  readonly countryOptions: CountryOption[] = [
    { label: '🇮🇳 India', value: 'IN' },
    { label: '🇷🇴 Romania', value: 'RO' },
    { label: '🇦🇺 Australia', value: 'AU' },
    { label: '🇺🇸 United States', value: 'US' },
  ];

  readonly usStateOptions = computed(() =>
    this.rulesetService.getUSStates().map((s): StateOption => ({
      label: s.stateName,
      value: s.stateCode,
    }))
  );

  canCheck(): boolean {
    if (!this.patientCountry || !this.doctorCountry) return false;
    if (this.patientCountry === 'US' && !this.patientState) return false;
    if (this.doctorCountry === 'US' && !this.doctorState) return false;
    return true;
  }

  getCountryLabel(country: SupportedCountry): string {
    return this.countryOptions.find(o => o.value === country)?.label ?? country;
  }

  onPatientCountryChange(): void {
    this.patientState = null;
    this.result.set(null);
  }

  onDoctorCountryChange(): void {
    this.doctorState = null;
    this.result.set(null);
  }

  checkCompatibility(): void {
    if (!this.patientCountry || !this.doctorCountry) return;
    this.checkedOnce.set(true);

    const res = this.rulesetService.checkTelehealthJurisdiction({
      patientCountry: this.patientCountry,
      patientState: this.patientState ?? undefined,
      doctorCountry: this.doctorCountry,
      doctorState: this.doctorState ?? undefined,
    });

    this.result.set(res);
  }

  resetChecker(): void {
    this.patientCountry = null;
    this.patientState = null;
    this.doctorCountry = null;
    this.doctorState = null;
    this.result.set(null);
    this.checkedOnce.set(false);
  }

  getResultCardClass(status: TelehealthJurisdictionResult['status']): string {
    const map: Record<TelehealthJurisdictionResult['status'], string> = {
      'fully-compatible': 'result-card-green',
      'partially-compatible': 'result-card-yellow',
      'incompatible': 'result-card-red',
      'unknown': 'result-card-gray',
    };
    return map[status];
  }

  getResultIcon(status: TelehealthJurisdictionResult['status']): string {
    const map: Record<TelehealthJurisdictionResult['status'], string> = {
      'fully-compatible': 'pi pi-check-circle text-green-600',
      'partially-compatible': 'pi pi-exclamation-triangle text-yellow-600',
      'incompatible': 'pi pi-times-circle text-red-600',
      'unknown': 'pi pi-question-circle text-gray-500',
    };
    return map[status];
  }

  getResultTitle(status: TelehealthJurisdictionResult['status']): string {
    const map: Record<TelehealthJurisdictionResult['status'], string> = {
      'fully-compatible': 'Telehealth Session Can Proceed',
      'partially-compatible': 'Allowed With Restrictions',
      'incompatible': 'Cross-Border Telehealth Not Permitted',
      'unknown': 'Insufficient Data — Manual Review Required',
    };
    return map[status];
  }

  getResultTextClass(status: TelehealthJurisdictionResult['status']): string {
    const map: Record<TelehealthJurisdictionResult['status'], string> = {
      'fully-compatible': 'text-green-800',
      'partially-compatible': 'text-yellow-800',
      'incompatible': 'text-red-800',
      'unknown': 'text-gray-700',
    };
    return map[status];
  }

  getStatusTagLabel(status: TelehealthJurisdictionResult['status']): string {
    const map: Record<TelehealthJurisdictionResult['status'], string> = {
      'fully-compatible': 'Compatible',
      'partially-compatible': 'Partial',
      'incompatible': 'Incompatible',
      'unknown': 'Unknown',
    };
    return map[status];
  }

  getStatusTagSeverity(status: TelehealthJurisdictionResult['status']): TagSeverity {
    const map: Record<TelehealthJurisdictionResult['status'], TagSeverity> = {
      'fully-compatible': 'success',
      'partially-compatible': 'warn',
      'incompatible': 'danger',
      'unknown': 'secondary',
    };
    return map[status];
  }
}
