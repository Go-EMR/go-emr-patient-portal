import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { RulesetService } from '../data-access/ruleset.service';
import { DrugScheduleEntry, SupportedCountry } from '../data-access/ruleset.models';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

interface CountryTabConfig {
  country: SupportedCountry;
  label: string;
  flag: string;
  scheduleKey: keyof DrugScheduleEntry;
  systemDescription: string;
  systemDetails: string;
}

@Component({
  selector: 'app-medication-schedule',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TabViewModule,
    TableModule,
    TagModule,
    InputTextModule,
    MessageModule,
    TooltipModule,
    CardModule,
  ],
  template: `
    <div class="medication-schedule p-4">
      <div class="page-header mb-4">
        <h1 class="text-2xl font-bold text-gray-800 m-0">
          <i class="pi pi-list mr-2 text-blue-600"></i>Medication Schedule Reference
        </h1>
        <p class="text-gray-500 mt-1 mb-0">
          Drug scheduling classifications and telehealth prescribing rules by jurisdiction.
        </p>
      </div>

      <p-tabView>
        @for (tab of countryTabs; track tab.country) {
          <p-tabPanel [header]="tab.flag + ' ' + tab.label">

            <!-- Country schedule system callout -->
            <p-message
              severity="info"
              styleClass="w-full mb-4"
              [text]="tab.systemDescription">
            </p-message>

            <div class="surface-50 border-round border-1 surface-border p-3 mb-4 text-sm text-gray-700">
              {{ tab.systemDetails }}
            </div>

            <!-- Search input -->
            <div class="mb-3 flex align-items-center gap-2">
              <i class="pi pi-search text-gray-400"></i>
              <input
                pInputText
                type="text"
                [(ngModel)]="searchTerms[tab.country]"
                [placeholder]="'Search drugs in ' + tab.label + '...'"
                class="w-full md:w-20rem"
                (input)="onSearch()" />
            </div>

            <!-- Drug table -->
            <p-table
              [value]="getFilteredDrugs(tab.country)"
              [paginator]="true"
              [rows]="8"
              [rowsPerPageOptions]="[8, 15, 30]"
              [showCurrentPageReport]="true"
              currentPageReportTemplate="Showing {first} to {last} of {totalRecords} drugs"
              styleClass="p-datatable-sm p-datatable-striped"
              [globalFilterFields]="['drugName', 'genericName']">

              <ng-template pTemplate="header">
                <tr>
                  <th pSortableColumn="drugName" style="min-width: 150px">
                    Drug Name <p-sortIcon field="drugName"></p-sortIcon>
                  </th>
                  <th style="min-width: 160px">Generic Name</th>
                  <th style="width: 130px">Schedule Code</th>
                  <th style="width: 140px">Telehealth</th>
                  <th>Notes</th>
                </tr>
              </ng-template>

              <ng-template pTemplate="body" let-drug>
                <tr>
                  <td class="font-semibold">{{ drug.drugName }}</td>
                  <td class="text-gray-500 text-sm italic">{{ drug.genericName }}</td>
                  <td>
                    <p-tag
                      [value]="getScheduleCode(drug, tab.country)"
                      [severity]="getScheduleSeverity(drug, tab.country)"
                      [pTooltip]="getScheduleTooltip(drug, tab.country)"
                      tooltipPosition="top">
                    </p-tag>
                  </td>
                  <td>
                    <div class="flex align-items-center gap-1">
                      @let teleStatus = getTelehealthStatus(drug, tab.country);
                      @if (teleStatus === true) {
                        <i class="pi pi-check-circle text-green-600 text-lg"
                           pTooltip="Telehealth prescribing allowed"
                           tooltipPosition="top"></i>
                        <span class="text-xs text-green-700">Allowed</span>
                      } @else if (teleStatus === false) {
                        <i class="pi pi-times-circle text-red-500 text-lg"
                           pTooltip="Telehealth prescribing not permitted"
                           tooltipPosition="top"></i>
                        <span class="text-xs text-red-600">Not Allowed</span>
                      } @else {
                        <i class="pi pi-exclamation-triangle text-orange-500 text-lg"
                           pTooltip="Allowed with conditions — see notes"
                           tooltipPosition="top"></i>
                        <span class="text-xs text-orange-700">Conditional</span>
                      }
                    </div>
                  </td>
                  <td class="text-sm text-gray-600" style="max-width: 280px; white-space: normal; line-height: 1.4">
                    {{ drug.notes[tab.country] }}
                  </td>
                </tr>
              </ng-template>

              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="5" class="text-center py-4 text-gray-400">
                    <i class="pi pi-search mr-2"></i>No drugs match your search.
                  </td>
                </tr>
              </ng-template>
            </p-table>

            <!-- Legend -->
            <div class="legend mt-4 flex flex-wrap gap-3">
              <span class="text-xs text-gray-500 font-medium">Schedule legend:</span>
              <div class="flex align-items-center gap-1">
                <p-tag value="Controlled" severity="danger" styleClass="text-xs"></p-tag>
                <span class="text-xs text-gray-500">Controlled substance</span>
              </div>
              <div class="flex align-items-center gap-1">
                <p-tag value="Rx" severity="warn" styleClass="text-xs"></p-tag>
                <span class="text-xs text-gray-500">Prescription only</span>
              </div>
              <div class="flex align-items-center gap-1">
                <p-tag value="OTC" severity="success" styleClass="text-xs"></p-tag>
                <span class="text-xs text-gray-500">Over the counter</span>
              </div>
            </div>
          </p-tabPanel>
        }
      </p-tabView>
    </div>
  `,
  styles: [`
    .medication-schedule {
      max-width: 1200px;
      margin: 0 auto;
    }
    :host ::ng-deep .p-tag {
      font-size: 0.75rem;
    }
  `],
})
export class MedicationScheduleComponent {
  private readonly rulesetService = inject(RulesetService);

  readonly allDrugs = this.rulesetService.drugSchedule;

  searchTerms: Record<SupportedCountry, string> = {
    IN: '',
    RO: '',
    AU: '',
    US: '',
  };

  readonly countryTabs: CountryTabConfig[] = [
    {
      country: 'IN',
      label: 'India',
      flag: '🇮🇳',
      scheduleKey: 'scheduleIN',
      systemDescription: 'India — Drug Schedule System (Drugs and Cosmetics Act, 1940)',
      systemDetails: 'India classifies drugs under Schedules G, H, H1, X, and NRx. Schedule H requires a prescription, H1 covers controlled psychotropics requiring detailed records, NRx/NRxP requires specialist prescriptions. OTC drugs are freely available. NDPS Act governs narcotics separately.',
    },
    {
      country: 'RO',
      label: 'Romania',
      flag: '🇷🇴',
      scheduleKey: 'scheduleRO',
      systemDescription: 'Romania — Drug Schedule System (ANMDM / EU Harmonised)',
      systemDetails: 'Romania follows EU-harmonised scheduling. PRF (prescriptie repetabila cu fond) requires a repeatable prescription. P-6L limits dispensing to 6-day courses. P-RF is a repeatable prescription. OTC drugs are available without prescription. CNAS reimburses select medications with a valid prescription.',
    },
    {
      country: 'AU',
      label: 'Australia',
      flag: '🇦🇺',
      scheduleKey: 'scheduleAU',
      systemDescription: 'Australia — Poisons Standard (Standard for the Uniform Scheduling of Medicines and Poisons)',
      systemDetails: 'Australia uses a numerical scheduling system (S1–S9). S2 (pharmacy medicine), S3 (pharmacist-only), S4 (prescription only), S8 (controlled drug requiring state permit), S9 (prohibited). PBS listing determines government subsidy. AHPRA registration is required for prescribers.',
    },
    {
      country: 'US',
      label: 'United States',
      flag: '🇺🇸',
      scheduleKey: 'scheduleUS',
      systemDescription: 'United States — DEA Controlled Substance Schedules (Controlled Substances Act)',
      systemDetails: 'The DEA classifies controlled substances CII (highest abuse potential) through CV (lowest). Rx indicates prescription-only non-controlled drugs. OTC drugs are available without prescription. Telehealth prescribing of CII–CIV substances is governed by the Ryan Haight Act and DEA 2024 telemedicine rules.',
    },
  ];

  getFilteredDrugs(country: SupportedCountry): DrugScheduleEntry[] {
    const term = (this.searchTerms[country] ?? '').toLowerCase().trim();
    return this.allDrugs().filter(drug => {
      if (!term) return true;
      return (
        drug.drugName.toLowerCase().includes(term) ||
        drug.genericName.toLowerCase().includes(term)
      );
    });
  }

  onSearch(): void {
    // Signal-based filtering — triggers computed re-evaluation via getFilteredDrugs
  }

  getScheduleCode(drug: DrugScheduleEntry, country: SupportedCountry): string {
    const key = `schedule${country}` as keyof DrugScheduleEntry;
    return (drug[key] as string | undefined) ?? 'N/A';
  }

  getScheduleSeverity(drug: DrugScheduleEntry, country: SupportedCountry): TagSeverity {
    const code = this.getScheduleCode(drug, country);
    const controlled = ['CII', 'CIII', 'CIV', 'CV', 'H1', 'NRx', 'NRxP', 'S8', 'PRF', 'P-6L'];
    const prescription = ['H', 'Rx', 'S4', 'S3', 'P-RF'];
    const otc = ['OTC', 'S2'];
    if (controlled.includes(code)) return 'danger';
    if (otc.includes(code)) return 'success';
    if (prescription.includes(code)) return 'warn';
    return 'secondary';
  }

  getScheduleTooltip(drug: DrugScheduleEntry, country: SupportedCountry): string {
    const code = this.getScheduleCode(drug, country);
    const tooltips: Record<string, string> = {
      CII: 'Schedule CII — High abuse potential, accepted medical use',
      CIII: 'Schedule CIII — Moderate abuse potential',
      CIV: 'Schedule CIV — Lower abuse potential',
      CV: 'Schedule CV — Lowest controlled abuse potential',
      H: 'Schedule H — Prescription required (India)',
      H1: 'Schedule H1 — Controlled psychotropic, detailed records required (India)',
      NRx: 'Schedule NRx — Specialist prescription required (India)',
      NRxP: 'Schedule NRxP — Specialist prescription + triplicate form (India)',
      PRF: 'PRF — Repeatable controlled prescription (Romania)',
      'P-6L': 'P-6L — Limited to 6-day course per prescription (Romania)',
      'P-RF': 'P-RF — Repeatable prescription (Romania)',
      OTC: 'Over the counter — No prescription required',
      Rx: 'Prescription only — Non-controlled (USA)',
      S2: 'S2 — Pharmacy medicine (pharmacist advice recommended)',
      S3: 'S3 — Pharmacist-only medicine (Australia)',
      S4: 'S4 — Prescription medicine (Australia)',
      S8: 'S8 — Controlled drug, authority prescription required (Australia)',
    };
    return tooltips[code] ?? code;
  }

  getTelehealthStatus(drug: DrugScheduleEntry, country: SupportedCountry): boolean | 'with-conditions' {
    return drug.telehealthAllowed[country];
  }
}
