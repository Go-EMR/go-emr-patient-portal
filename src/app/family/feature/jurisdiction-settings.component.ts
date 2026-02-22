import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DropdownModule } from 'primeng/dropdown';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RulesetService } from '../data-access/ruleset.service';
import { SupportedCountry } from '../data-access/ruleset.models';

interface CountryOption {
  label: string;
  value: SupportedCountry;
}

@Component({
  selector: 'app-jurisdiction-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    SelectButtonModule,
    DropdownModule,
    DividerModule,
    MessageModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <div class="jurisdiction-settings p-4">
      <div class="page-header mb-4">
        <h1 class="text-2xl font-bold text-gray-800 m-0">
          <i class="pi pi-globe mr-2 text-blue-600"></i>Jurisdiction Settings
        </h1>
        <p class="text-gray-500 mt-1 mb-0">
          Configure the regulatory jurisdiction that governs consent rules, prescribing schedules, and telehealth policies.
        </p>
      </div>

      <div class="grid">
        <!-- Main settings card -->
        <div class="col-12 lg:col-8">
          <p-card styleClass="mb-4">
            <ng-template pTemplate="title">
              <span class="text-lg font-semibold">
                <i class="pi pi-map-marker mr-2"></i>Select Jurisdiction
              </span>
            </ng-template>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <p-selectButton
                [options]="countryOptions"
                [(ngModel)]="selectedCountry"
                optionLabel="label"
                optionValue="value"
                (onChange)="onCountryChange()"
                styleClass="w-full">
              </p-selectButton>
            </div>

            @if (selectedCountry() === 'US') {
              <div class="mb-4 animate-fadein">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  State <span class="text-red-500">*</span>
                </label>
                <p-dropdown
                  [options]="usStateOptions()"
                  [(ngModel)]="selectedState"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select a state..."
                  [filter]="true"
                  filterPlaceholder="Search states..."
                  styleClass="w-full"
                  appendTo="body">
                </p-dropdown>
                @if (selectedState()) {
                  <div class="state-info mt-3 p-3 border-round surface-50 border-1 surface-border">
                    <p class="text-sm font-semibold text-gray-700 mb-1">
                      {{ getStateName(selectedState()!) }} — State Details
                    </p>
                    @let stateData = getStateData(selectedState()!);
                    @if (stateData) {
                      <div class="grid text-sm text-gray-600">
                        <div class="col-6">
                          <span class="font-medium">General Consent Age:</span> {{ stateData.consentAge }}
                        </div>
                        <div class="col-6">
                          <span class="font-medium">IMLC Member:</span>
                          @if (stateData.isIMLCMember) {
                            <i class="pi pi-check-circle ml-1 text-green-600"></i> Yes
                          } @else {
                            <i class="pi pi-times-circle ml-1 text-red-500"></i> No
                          }
                        </div>
                        @if (stateData.mentalHealthConsentAge) {
                          <div class="col-6">
                            <span class="font-medium">Mental Health Age:</span> {{ stateData.mentalHealthConsentAge }}
                          </div>
                        }
                        @if (stateData.stiConsentAge) {
                          <div class="col-6">
                            <span class="font-medium">STI Consent Age:</span> {{ stateData.stiConsentAge }}
                          </div>
                        }
                      </div>
                      @if (stateData.telehealthRestrictions.length > 0) {
                        <p class="text-xs font-medium text-gray-500 mt-2 mb-1">Telehealth Restrictions:</p>
                        <ul class="m-0 pl-4">
                          @for (restriction of stateData.telehealthRestrictions; track restriction) {
                            <li class="text-xs text-gray-600 mb-1">{{ restriction }}</li>
                          }
                        </ul>
                      }
                    }
                  </div>
                }
              </div>
            }

            <!-- Current version info -->
            <div class="version-info p-3 surface-50 border-round border-1 surface-border mb-4">
              <div class="flex align-items-center gap-3">
                <i class="pi pi-info-circle text-blue-500 text-xl"></i>
                <div>
                  <p class="text-sm font-semibold text-gray-700 mb-0">
                    Current Ruleset Version: {{ jurisdiction().version }}
                  </p>
                  <p class="text-xs text-gray-500 mb-0">
                    Last Updated: {{ jurisdiction().lastUpdated | date:'mediumDate' }}
                  </p>
                  <p class="text-xs text-gray-500 mb-0">
                    Active Jurisdiction: {{ countryLabel(jurisdiction().country) }}
                    @if (jurisdiction().state) { — {{ jurisdiction().state }} }
                  </p>
                </div>
              </div>
            </div>

            <div class="flex justify-content-end gap-2">
              <p-button
                label="Reset"
                icon="pi pi-refresh"
                severity="secondary"
                [outlined]="true"
                (onClick)="resetForm()">
              </p-button>
              <p-button
                label="Save Jurisdiction"
                icon="pi pi-save"
                (onClick)="saveJurisdiction()"
                [disabled]="selectedCountry() === 'US' && !selectedState()">
              </p-button>
            </div>
          </p-card>
        </div>

        <!-- Info panel -->
        <div class="col-12 lg:col-4">
          <p-card styleClass="mb-4">
            <ng-template pTemplate="title">
              <span class="text-lg font-semibold">
                <i class="pi pi-book mr-2"></i>What Changes by Jurisdiction
              </span>
            </ng-template>

            <div class="jurisdiction-info">
              @for (item of jurisdictionInfoItems(); track item.title) {
                <div class="info-item mb-3">
                  <div class="flex align-items-center gap-2 mb-1">
                    <i [class]="item.icon + ' text-blue-500'"></i>
                    <span class="font-semibold text-sm text-gray-800">{{ item.title }}</span>
                  </div>
                  <p class="text-xs text-gray-600 ml-4 mb-0">{{ item.description }}</p>
                </div>
                <p-divider styleClass="my-2"></p-divider>
              }
            </div>
          </p-card>

          <!-- Country-specific notice -->
          @if (selectedCountry()) {
            <p-card>
              <ng-template pTemplate="title">
                <span class="font-semibold text-base">{{ countryLabel(selectedCountry()) }} Overview</span>
              </ng-template>
              <div class="country-notice text-sm text-gray-700">
                @switch (selectedCountry()) {
                  @case ('IN') {
                    <p><i class="pi pi-info-circle mr-1 text-orange-500"></i>India follows the <strong>Indian Medical Council Act</strong> and <strong>NDPS Act</strong> for controlled substances. Consent age is 18.</p>
                    <p class="mb-0">Telehealth governed by <strong>MoHFW Telemedicine Guidelines 2020</strong>.</p>
                  }
                  @case ('RO') {
                    <p><i class="pi pi-info-circle mr-1 text-blue-500"></i>Romania operates under the <strong>CNAS</strong> (National Health Insurance) gatekeeper system. GP referral is required for specialist access.</p>
                    <p class="mb-0">GDPR applies to all health data. Consent age is 18.</p>
                  }
                  @case ('AU') {
                    <p><i class="pi pi-info-circle mr-1 text-green-600"></i>Australia uses AHPRA national registration. Telehealth is nationally governed with MBS item numbers.</p>
                    <p class="mb-0">Gillick competence applies for mature minors. Consent age is 18.</p>
                  }
                  @case ('US') {
                    <p><i class="pi pi-info-circle mr-1 text-indigo-500"></i>US rules vary by state. IMLC governs interstate telehealth. DEA registration required for controlled substances.</p>
                    <p class="mb-0">HIPAA applies to all health data. General consent age is 18, with state-specific exceptions.</p>
                  }
                }
              </div>
            </p-card>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .jurisdiction-settings {
      max-width: 1200px;
      margin: 0 auto;
    }
    .info-item:last-child + p-divider {
      display: none;
    }
    .state-info {
      animation: fadeIn 0.2s ease-in;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class JurisdictionSettingsComponent {
  private readonly rulesetService = inject(RulesetService);
  private readonly messageService = inject(MessageService);

  readonly jurisdiction = this.rulesetService.jurisdiction;

  selectedCountry = signal<SupportedCountry>(this.rulesetService.jurisdiction().country);
  selectedState = signal<string | undefined>(this.rulesetService.jurisdiction().state);

  readonly countryOptions: CountryOption[] = [
    { label: '🇮🇳 India', value: 'IN' },
    { label: '🇷🇴 Romania', value: 'RO' },
    { label: '🇦🇺 Australia', value: 'AU' },
    { label: '🇺🇸 United States', value: 'US' },
  ];

  readonly usStateOptions = computed(() =>
    this.rulesetService.getUSStates().map(s => ({
      label: s.stateName,
      value: s.stateCode,
    }))
  );

  readonly jurisdictionInfoItems = computed(() => [
    {
      icon: 'pi pi-users',
      title: 'Consent Ages',
      description: 'Minimum age for self-consent varies by country and record category (mental health, STI, reproductive).',
    },
    {
      icon: 'pi pi-list',
      title: 'Drug Schedules',
      description: 'Controlled substance classifications differ: US uses CII-CV, Australia uses S2-S8, India uses H/H1/NRx, Romania uses PRF/P-6L.',
    },
    {
      icon: 'pi pi-video',
      title: 'Telehealth Rules',
      description: 'Prescribing via telehealth for controlled substances has strict country-specific requirements and restrictions.',
    },
    {
      icon: 'pi pi-shield',
      title: 'Provider Scope',
      description: 'NP prescribing authority varies: full in most US states, restricted in India and Romania, limited formulary in Australia.',
    },
    {
      icon: 'pi pi-building',
      title: 'Insurance Pathways',
      description: 'CNAS (Romania), Medicare (AU), PMJAY (India), and US insurers each have unique credentialing and billing requirements.',
    },
  ]);

  countryLabel(country: SupportedCountry): string {
    return this.countryOptions.find(o => o.value === country)?.label ?? country;
  }

  getStateName(code: string): string {
    return this.rulesetService.getUSStates().find(s => s.stateCode === code)?.stateName ?? code;
  }

  getStateData(code: string) {
    return this.rulesetService.getUSStates().find(s => s.stateCode === code) ?? null;
  }

  onCountryChange(): void {
    if (this.selectedCountry() !== 'US') {
      this.selectedState.set(undefined);
    }
  }

  saveJurisdiction(): void {
    const country = this.selectedCountry();
    const state = country === 'US' ? this.selectedState() : undefined;
    this.rulesetService.setJurisdiction(country, state);
    this.messageService.add({
      severity: 'success',
      summary: 'Jurisdiction Saved',
      detail: `Active jurisdiction set to ${this.countryLabel(country)}${state ? ' — ' + state : ''}.`,
      life: 3000,
    });
  }

  resetForm(): void {
    const current = this.rulesetService.jurisdiction();
    this.selectedCountry.set(current.country);
    this.selectedState.set(current.state);
  }
}
