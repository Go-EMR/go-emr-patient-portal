import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Input,
  OnChanges,
  signal,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { Accordion, AccordionPanel, AccordionHeader, AccordionContent } from 'primeng/accordion';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { RulesetService } from '../data-access/ruleset.service';
import { ScopeOfPracticeRule, SupportedCountry } from '../data-access/ruleset.models';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

interface CountryContent {
  title: string;
  flag: string;
  systemOverview: string;
  keyFeatures: string[];
  gatekeeperNote: string;
}

const COUNTRY_CONTENT: Record<SupportedCountry, CountryContent> = {
  IN: {
    title: 'India — Healthcare System',
    flag: '🇮🇳',
    systemOverview:
      'India operates a mixed public-private healthcare system. Patients may self-refer to most specialists in the private sector without requiring a GP referral. The Ayushman Bharat (PMJAY) scheme provides government-funded coverage for eligible beneficiaries.',
    keyFeatures: [
      'Self-referral allowed in private sector — no GP gatekeeper requirement.',
      'Ayushman Bharat (PMJAY) covers secondary and tertiary care for eligible families.',
      'ABDM (Ayushman Bharat Digital Mission) enables digital health ID and PHR access.',
      'Telemedicine governed by MoHFW Telemedicine Practice Guidelines 2020.',
    ],
    gatekeeperNote:
      'There is no mandatory GP gatekeeper in India\'s private system. Patients can book specialist appointments directly.',
  },
  RO: {
    title: 'Romania — Healthcare System',
    flag: '🇷🇴',
    systemOverview:
      'Romania uses the CNAS (National Health Insurance) system which requires a GP referral (bilet de trimitere) for specialist access under public insurance. Private consultations can bypass this requirement but are out-of-pocket.',
    keyFeatures: [
      'CNAS gatekeeper: GP referral (bilet de trimitere) required for specialist under insurance.',
      'Private sector allows direct specialist access without referral.',
      'CMR (Colegiul Medicilor) registration mandatory for prescribing.',
      'Telehealth requires CNAS contract for reimbursement; GDPR applies.',
    ],
    gatekeeperNote:
      'GP is the mandatory gatekeeper for CNAS-reimbursed specialist care. Private payers may bypass this.',
  },
  AU: {
    title: 'Australia — Healthcare System',
    flag: '🇦🇺',
    systemOverview:
      'Australia\'s Medicare system uses GPs as gatekeepers for specialist referrals required for Medicare rebates. AHPRA provides national registration. Telehealth is nationally governed with MBS item numbers.',
    keyFeatures: [
      'Medicare rebate for specialist requires valid GP referral (12-month validity).',
      'AHPRA registration is national — no separate state licensing required.',
      'MBS telehealth item numbers available; GP HealthPathways criteria apply.',
      'Patients with established practice relationship can access some services directly.',
    ],
    gatekeeperNote:
      'GP is the Medicare gatekeeper for specialist referrals. Rebates are not available for self-referrals to most specialists.',
  },
  US: {
    title: 'United States — Healthcare System',
    flag: '🇺🇸',
    systemOverview:
      'The US has insurance-type dependent referral requirements. HMO plans require PCP gatekeeper referrals; PPO plans allow direct specialist access with higher cost-sharing; HDHP plans follow PPO-like rules. Medicare and Medicaid have their own rules.',
    keyFeatures: [
      'HMO: PCP gatekeeper required for specialist referrals (except emergencies).',
      'PPO: Direct specialist access permitted, higher out-of-network cost sharing.',
      'HDHP: Similar to PPO; patient pays more until deductible met.',
      'Medicare: Self-referral allowed for most specialists; some require GP coordination.',
    ],
    gatekeeperNote:
      'Referral requirements depend on insurance type. Always verify patient\'s plan before booking specialist appointments.',
  },
};

@Component({
  selector: 'app-scope-of-practice-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardModule,
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    TagModule,
    DividerModule,
  ],
  template: `
    <div class="scope-panel">
      @if (country) {
        @let content = countryContent();
        @let physicianScope = physicianRule();
        @let npScope = npRule();

        <p-card>
          <ng-template pTemplate="title">
            <div class="flex align-items-center gap-2">
              <span class="text-xl">{{ content.flag }}</span>
              <span class="text-base font-semibold text-gray-800">{{ content.title }}</span>
            </div>
          </ng-template>

          <!-- System overview -->
          <p class="text-sm text-gray-700 mb-4">{{ content.systemOverview }}</p>

          <!-- Gatekeeper badge -->
          <div class="gatekeeper-notice flex align-items-center gap-2 p-3 surface-50 border-round border-1 surface-border mb-4">
            <i class="pi pi-info-circle text-blue-500"></i>
            <p class="text-sm text-gray-700 mb-0">
              <strong>Referral Model:</strong> {{ content.gatekeeperNote }}
            </p>
          </div>

          <!-- Key features accordion -->
          <p-accordion value="0">
            <!-- System features -->
            <p-accordion-panel value="0">
              <p-accordion-header>Key System Features</p-accordion-header>
              <p-accordion-content>
                <ul class="m-0 pl-4">
                  @for (feature of content.keyFeatures; track feature) {
                    <li class="text-sm text-gray-700 mb-2">{{ feature }}</li>
                  }
                </ul>
              </p-accordion-content>
            </p-accordion-panel>

            <!-- Physician scope -->
            @if (physicianScope) {
              <p-accordion-panel value="1">
                <p-accordion-header>
                  <div class="flex align-items-center gap-2 w-full">
                    <i class="pi pi-user text-blue-600"></i>
                    <span class="font-semibold text-sm">Physician (MD/DO) Scope</span>
                    <div class="ml-auto flex gap-1">
                      <p-tag
                        [value]="physicianScope.canPrescribe ? 'Can Prescribe' : 'No Rx'"
                        [severity]="physicianScope.canPrescribe ? 'success' : 'danger'"
                        styleClass="text-xs">
                      </p-tag>
                      <p-tag
                        [value]="physicianScope.canReferWithoutGP ? 'Direct Refer' : 'GP Required'"
                        [severity]="physicianScope.canReferWithoutGP ? 'success' : 'warn'"
                        styleClass="text-xs">
                      </p-tag>
                    </div>
                  </div>
                </p-accordion-header>
                <p-accordion-content>
                  <div class="mb-3">
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Special Notes</p>
                    <ul class="m-0 pl-4">
                      @for (note of physicianScope.specialNotes; track note) {
                        <li class="text-sm text-gray-700 mb-1">{{ note }}</li>
                      }
                    </ul>
                  </div>

                  <p-divider styleClass="my-2"></p-divider>

                  <div>
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Insurance Requirements</p>
                    <p class="text-sm text-gray-700 mb-0">{{ physicianScope.insuranceRequirements }}</p>
                  </div>
                </p-accordion-content>
              </p-accordion-panel>
            }

            <!-- NP scope -->
            @if (npScope) {
              <p-accordion-panel value="2">
                <p-accordion-header>
                  <div class="flex align-items-center gap-2 w-full">
                    <i class="pi pi-user-plus text-purple-600"></i>
                    <span class="font-semibold text-sm">Nurse Practitioner (NP) Scope</span>
                    <div class="ml-auto flex gap-1">
                      <p-tag
                        [value]="npScope.canPrescribe ? 'Can Prescribe' : 'No Rx'"
                        [severity]="npScope.canPrescribe ? 'success' : 'danger'"
                        styleClass="text-xs">
                      </p-tag>
                      <p-tag
                        [value]="npScope.canReferWithoutGP ? 'Independent' : 'Supervised'"
                        [severity]="npScope.canReferWithoutGP ? 'info' : 'warn'"
                        styleClass="text-xs">
                      </p-tag>
                    </div>
                  </div>
                </p-accordion-header>
                <p-accordion-content>
                  <div class="mb-3">
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Special Notes</p>
                    <ul class="m-0 pl-4">
                      @for (note of npScope.specialNotes; track note) {
                        <li class="text-sm text-gray-700 mb-1">{{ note }}</li>
                      }
                    </ul>
                  </div>

                  <p-divider styleClass="my-2"></p-divider>

                  <div>
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Insurance / Billing Requirements</p>
                    <p class="text-sm text-gray-700 mb-0">{{ npScope.insuranceRequirements }}</p>
                  </div>
                </p-accordion-content>
              </p-accordion-panel>
            }

            <!-- Insurance types (US only) -->
            @if (country === 'US') {
              <p-accordion-panel value="3">
                <p-accordion-header>Insurance Plan Types (US)</p-accordion-header>
                <p-accordion-content>
                  <div class="grid text-sm">
                    <div class="col-12 mb-3">
                      <div class="insurance-card p-3 border-round border-1 border-blue-200 bg-blue-50">
                        <p class="font-semibold text-blue-800 mb-1">HMO (Health Maintenance Organization)</p>
                        <p class="text-blue-700 mb-0 text-xs">Requires PCP designation and specialist referrals. Lower premiums, restricted network. No out-of-network coverage except emergencies.</p>
                      </div>
                    </div>
                    <div class="col-12 mb-3">
                      <div class="insurance-card p-3 border-round border-1 border-green-200 bg-green-50">
                        <p class="font-semibold text-green-800 mb-1">PPO (Preferred Provider Organization)</p>
                        <p class="text-green-700 mb-0 text-xs">No referral required. Larger network. Higher premiums. Out-of-network care covered at lower rate.</p>
                      </div>
                    </div>
                    <div class="col-12 mb-3">
                      <div class="insurance-card p-3 border-round border-1 border-orange-200 bg-orange-50">
                        <p class="font-semibold text-orange-800 mb-1">HDHP (High Deductible Health Plan)</p>
                        <p class="text-orange-700 mb-0 text-xs">Lower premiums, high deductible. Works with HSA. PPO-style referral flexibility. Patient responsible until deductible met.</p>
                      </div>
                    </div>
                  </div>
                </p-accordion-content>
              </p-accordion-panel>
            }

            <!-- AU Medicare info -->
            @if (country === 'AU') {
              <p-accordion-panel value="3">
                <p-accordion-header>Medicare &amp; PBS Pathways</p-accordion-header>
                <p-accordion-content>
                  <div class="text-sm">
                    <p class="text-gray-700 mb-2">
                      <strong>Medicare:</strong> GP referral required for MBS specialist rebate.
                      Referrals are valid for 12 months for most specialists (3 months for psychiatrists and some others).
                    </p>
                    <p class="text-gray-700 mb-2">
                      <strong>PBS:</strong> Pharmaceutical Benefits Scheme subsidises medicines.
                      S4 authority prescriptions require PBS approval form for certain medications.
                    </p>
                    <p class="text-gray-700 mb-0">
                      <strong>Telehealth MBS:</strong> Item numbers available for GP and specialist teleconsultations.
                      Patients must have an existing relationship with the practice for most items.
                    </p>
                  </div>
                </p-accordion-content>
              </p-accordion-panel>
            }

            <!-- IN Ayushman Bharat info -->
            @if (country === 'IN') {
              <p-accordion-panel value="3">
                <p-accordion-header>Ayushman Bharat (PMJAY) Details</p-accordion-header>
                <p-accordion-content>
                  <div class="text-sm text-gray-700">
                    <p class="mb-2">
                      <strong>Eligibility:</strong> Lower-income families identified via SECC data.
                      Approximately 50 crore beneficiaries covered.
                    </p>
                    <p class="mb-2">
                      <strong>Coverage:</strong> Hospitalisation costs up to ₹5 lakh per family per year.
                      Covers secondary and tertiary care at empanelled hospitals.
                    </p>
                    <p class="mb-2">
                      <strong>ABDM Integration:</strong> Ayushman Bharat Digital Mission provides ABHA (health ID),
                      linked health records, and interoperable PHR apps.
                    </p>
                    <p class="mb-0">
                      <strong>Empanelment:</strong> Providers must be empanelled with PMJAY for government-scheme billing.
                    </p>
                  </div>
                </p-accordion-content>
              </p-accordion-panel>
            }

            <!-- RO CNAS info -->
            @if (country === 'RO') {
              <p-accordion-panel value="3">
                <p-accordion-header>CNAS Insurance System Details</p-accordion-header>
                <p-accordion-content>
                  <div class="text-sm text-gray-700">
                    <p class="mb-2">
                      <strong>CNAS Contract:</strong> Providers must have an active CNAS contract to bill publicly insured patients.
                      Private practice is permitted without CNAS contract but is fully out-of-pocket.
                    </p>
                    <p class="mb-2">
                      <strong>Bilet de trimitere:</strong> GP referral form required for CNAS-covered specialist access.
                      Valid for 3 months. Annual budget limits apply per specialty.
                    </p>
                    <p class="mb-0">
                      <strong>GDPR:</strong> All patient health data processing must comply with EU GDPR.
                      Romanian DPA (ANSPDCP) has enforcement authority.
                    </p>
                  </div>
                </p-accordion-content>
              </p-accordion-panel>
            }
          </p-accordion>
        </p-card>
      } @else {
        <div class="empty-state text-center py-6 text-gray-400">
          <i class="pi pi-globe text-4xl block mb-2"></i>
          <p class="text-sm">Select a jurisdiction to view scope of practice guidance.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .scope-panel {
      max-width: 800px;
    }
    .gatekeeper-notice {
      background: #f8fafc;
    }
    .insurance-card {
      transition: box-shadow 0.15s;
    }
    .insurance-card:hover {
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
    }
    :host ::ng-deep .p-accordion-header-link {
      padding: 0.75rem 1rem;
    }
  `],
})
export class ScopeOfPracticePanelComponent implements OnChanges {
  private readonly rulesetService = inject(RulesetService);

  @Input() country!: SupportedCountry;

  readonly physicianRule = signal<ScopeOfPracticeRule | null>(null);
  readonly npRule = signal<ScopeOfPracticeRule | null>(null);

  readonly countryContent = computed<CountryContent>(() => {
    return COUNTRY_CONTENT[this.country] ?? COUNTRY_CONTENT['US'];
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['country'] && this.country) {
      this.physicianRule.set(
        this.rulesetService.getScopeOfPractice(this.country, 'physician')
      );
      this.npRule.set(
        this.rulesetService.getScopeOfPractice(this.country, 'nurse-practitioner')
      );
    }
  }
}
