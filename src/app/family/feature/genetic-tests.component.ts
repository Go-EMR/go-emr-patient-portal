// =============================================================================
// Genetic Tests Management Component — Task 15
// Route: /health/genetic-tests
// Table + sidebar form + GDPR/GINA compliance notices
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
import { TableModule } from 'primeng/table';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';

import { FamilyService } from '../data-access/family.service';
import { RulesetService } from '../data-access/ruleset.service';
import { GeneticTestResult, GeneticClassification } from '../data-access/family.models';
import { CURATED_GENES, CuratedGene } from '../data-access/gene-list.data';

interface GeneticTestRow {
  testId: string;
  testName: string;
  geneName: string;
  variant: string;
  classification: GeneticClassification;
  testDate: Date;
  lab: string;
  memberName: string;
  memberId: string;
}

interface GeneSuggestion {
  label: string;
  fullName: string;
}

@Component({
  selector: 'app-genetic-tests',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    DrawerModule,
    ButtonModule,
    TagModule,
    SelectModule,
    DatePickerModule,
    AutoCompleteModule,
    InputTextModule,
    Textarea,
    CheckboxModule,
    DialogModule,
    MessageModule,
    DividerModule,
  ],
  template: `
    <div class="gt-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon"><i class="pi pi-dna"></i></div>
          <div>
            <h1 class="page-title">Genetic Tests</h1>
            <p class="page-subtitle">Manage and review genetic test results across family members</p>
          </div>
        </div>
        <div class="header-actions">
          <p-button label="Export CSV" icon="pi pi-download" severity="secondary" [outlined]="true" (onClick)="exportCsv()"></p-button>
          <p-button label="Print" icon="pi pi-print" severity="secondary" [outlined]="true" (onClick)="printTable()"></p-button>
          <p-button label="Add Test" icon="pi pi-plus" (onClick)="openAddSidebar()"></p-button>
        </div>
      </div>

      <!-- GINA Notice (US) -->
      @if (jurisdiction() === 'US') {
        <p-message
          severity="info"
          styleClass="gina-notice"
        >
          <ng-template pTemplate="messageicon">
            <i class="pi pi-shield" style="font-size:1.1rem"></i>
          </ng-template>
          <span>
            <strong>GINA Notice:</strong> The Genetic Information Nondiscrimination Act (GINA) prohibits health insurers and employers
            from discriminating based on genetic information. Your genetic data is protected by federal law.
          </span>
        </p-message>
      }

      <!-- Data Table -->
      <p-table
        #dt
        [value]="tableRows()"
        [sortField]="'testDate'"
        [sortOrder]="-1"
        [paginator]="true"
        [rows]="10"
        [rowsPerPageOptions]="[5, 10, 25]"
        [globalFilterFields]="['testName', 'geneName', 'memberName', 'lab']"
        [tableStyle]="{ 'min-width': '60rem' }"
        [stripedRows]="true"
        styleClass="p-datatable-sm"
      >
        <ng-template pTemplate="caption">
          <div class="table-caption">
            <span class="total-label">{{ tableRows().length }} result{{ tableRows().length !== 1 ? 's' : '' }}</span>
            <input
              pInputText
              type="text"
              (input)="dt.filterGlobal($any($event.target).value, 'contains')"
              placeholder="Search results..."
              class="table-search"
            />
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="testName">Test Name <p-sortIcon field="testName"></p-sortIcon></th>
            <th pSortableColumn="geneName">Gene <p-sortIcon field="geneName"></p-sortIcon></th>
            <th>Variant</th>
            <th pSortableColumn="classification">Classification <p-sortIcon field="classification"></p-sortIcon></th>
            <th pSortableColumn="testDate">Date <p-sortIcon field="testDate"></p-sortIcon></th>
            <th>Lab</th>
            <th pSortableColumn="memberName">Member <p-sortIcon field="memberName"></p-sortIcon></th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-row>
          <tr>
            <td class="test-name-cell">{{ row.testName }}</td>
            <td><span class="gene-badge">{{ row.geneName }}</span></td>
            <td><code class="variant-code">{{ row.variant || '—' }}</code></td>
            <td>
              <p-tag
                [value]="classificationLabel(row.classification)"
                [severity]="classificationSeverity(row.classification)"
                [style]="classificationStyle(row.classification)"
              ></p-tag>
            </td>
            <td>{{ row.testDate | date:'mediumDate' }}</td>
            <td class="lab-cell">{{ row.lab }}</td>
            <td>{{ row.memberName }}</td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" class="empty-cell">
              <div class="empty-state">
                <i class="pi pi-dna empty-icon"></i>
                <p>No genetic test results recorded yet.</p>
                <p-button label="Add First Test" icon="pi pi-plus" size="small" (onClick)="openAddSidebar()"></p-button>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Add Test Sidebar -->
    <p-drawer
      [(visible)]="sidebarVisible"
      position="right"
      [style]="{ width: '440px' }"
      header="Add Genetic Test"
    >
      <div class="sidebar-form">

        <!-- Member selector -->
        <div class="field">
          <label class="field-label">Family Member *</label>
          <p-select
            [(ngModel)]="form.memberId"
            [options]="memberOptions()"
            optionLabel="label"
            optionValue="value"
            placeholder="Select member..."
            styleClass="w-full"
          ></p-select>
        </div>

        <!-- Test name -->
        <div class="field">
          <label class="field-label">Test Name *</label>
          <input pInputText [(ngModel)]="form.testName" placeholder="e.g. BRCA1/2 Panel" style="width:100%" />
        </div>

        <!-- Gene name autocomplete -->
        <div class="field">
          <label class="field-label">Gene Name *</label>
          <p-autoComplete
            [(ngModel)]="form.geneSuggestion"
            [suggestions]="geneSuggestions()"
            (completeMethod)="searchGenes($event)"
            field="label"
            [dropdown]="true"
            placeholder="Search genes..."
            (onSelect)="onGeneSelect($event)"
            styleClass="w-full"
          ></p-autoComplete>
        </div>

        <!-- Variant -->
        <div class="field">
          <label class="field-label">Variant</label>
          <input pInputText [(ngModel)]="form.variant" placeholder="e.g. c.5946delT" style="width:100%" />
        </div>

        <!-- Classification -->
        <div class="field">
          <label class="field-label">Classification *</label>
          <p-select
            [(ngModel)]="form.classification"
            [options]="classificationOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select..."
            styleClass="w-full"
          ></p-select>
        </div>

        <!-- Test date + lab -->
        <div class="field-row-2">
          <div class="field">
            <label class="field-label">Test Date</label>
            <p-datepicker [(ngModel)]="form.testDate" dateFormat="mm/dd/yy" styleClass="w-full" [showIcon]="true"></p-datepicker>
          </div>
          <div class="field">
            <label class="field-label">Lab</label>
            <input pInputText [(ngModel)]="form.lab" placeholder="Lab name" style="width:100%" />
          </div>
        </div>

        <!-- Result summary -->
        <div class="field">
          <label class="field-label">Result Summary</label>
          <textarea
            pInputTextarea
            [(ngModel)]="form.resultSummary"
            rows="3"
            placeholder="Clinical interpretation..."
            style="width:100%"
          ></textarea>
        </div>

        <!-- Consent -->
        <div class="field-row consent-row">
          <p-checkbox [(ngModel)]="form.consentGiven" [binary]="true" inputId="consent-chk"></p-checkbox>
          <label for="consent-chk" class="consent-label">
            Patient has provided informed consent for genetic testing and data storage.
          </label>
        </div>

        <p-divider></p-divider>

        <div class="sidebar-actions">
          <p-button label="Cancel" severity="secondary" [outlined]="true" (onClick)="sidebarVisible = false"></p-button>
          <p-button
            label="Save Test"
            icon="pi pi-check"
            [disabled]="!form.memberId || !form.testName || !form.geneName"
            (onClick)="saveTest()"
          ></p-button>
        </div>
      </div>
    </p-drawer>

    <!-- GDPR Consent Gate (Romania) -->
    <p-dialog
      header="Data Protection Consent Required"
      [(visible)]="gdprDialogVisible"
      [modal]="true"
      [closable]="false"
      [style]="{ width: '500px' }"
    >
      <div class="gdpr-body">
        <div class="gdpr-icon"><i class="pi pi-shield"></i></div>
        <p>
          Under <strong>GDPR Article 9</strong> and Romanian data protection law, genetic data is classified as
          <strong>Special Category Data</strong>. Explicit informed consent is required before accessing or storing
          genetic test results.
        </p>
        <p>
          By proceeding, you confirm that the data subject has provided explicit written consent for:
        </p>
        <ul>
          <li>Collection and storage of genetic test data</li>
          <li>Processing for health management purposes</li>
          <li>Sharing with authorised healthcare providers</li>
        </ul>
        <div class="field-row consent-row">
          <p-checkbox [(ngModel)]="gdprConsent" [binary]="true" inputId="gdpr-chk"></p-checkbox>
          <label for="gdpr-chk" class="consent-label">
            I confirm explicit consent has been obtained as required by GDPR.
          </label>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="Cancel" severity="secondary" [outlined]="true" (onClick)="gdprDialogVisible = false"></p-button>
        <p-button label="Proceed" icon="pi pi-check" [disabled]="!gdprConsent" (onClick)="grantGdprAccess()"></p-button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .gt-page {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding-bottom: 2rem;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-content {
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

    .header-actions {
      display: flex;
      gap: 0.625rem;
      align-items: center;
      flex-wrap: wrap;
    }

    /* GINA notice */
    .gina-notice {
      border-left: 4px solid var(--blue-500);
    }

    /* Table */
    .table-caption {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .total-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-color-secondary);
    }

    .table-search {
      width: 220px;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--surface-border);
      border-radius: 6px;
      font-size: 0.85rem;
    }

    .test-name-cell {
      font-weight: 600;
    }

    .gene-badge {
      background: var(--primary-100);
      color: var(--primary-800);
      font-size: 0.8rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
      font-family: monospace;
    }

    .variant-code {
      font-size: 0.78rem;
      color: var(--text-color-secondary);
    }

    .lab-cell {
      font-size: 0.82rem;
    }

    .empty-cell { padding: 0; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
      color: var(--text-color-secondary);
    }

    .empty-icon {
      font-size: 3rem;
      opacity: 0.25;
    }

    /* Sidebar form */
    .sidebar-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 0.5rem 0;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .field-label {
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-color-secondary);
    }

    .field-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .field-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .consent-row {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      background: var(--surface-50);
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      padding: 0.75rem;
    }

    .consent-label {
      font-size: 0.8rem;
      color: var(--text-color);
      line-height: 1.5;
      cursor: pointer;
    }

    .sidebar-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    /* GDPR dialog */
    .gdpr-body {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .gdpr-icon {
      text-align: center;
      font-size: 2.5rem;
      color: var(--blue-500);
    }

    .gdpr-body p {
      font-size: 0.875rem;
      color: var(--text-color);
      line-height: 1.6;
      margin: 0;
    }

    .gdpr-body ul {
      margin: 0;
      padding-left: 1.25rem;
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }

    .gdpr-body ul li { margin-bottom: 0.25rem; }
  `],
})
export class GeneticTestsComponent {
  readonly familyService = inject(FamilyService);
  private readonly rulesetService = inject(RulesetService);

  readonly jurisdiction = computed(() => this.rulesetService.jurisdiction().country);

  // GDPR access control
  readonly gdprConsentGranted = signal(false);
  gdprDialogVisible = false;
  gdprConsent = false;

  // Sidebar state
  sidebarVisible = false;

  // Gene autocomplete
  readonly geneSuggestions = signal<GeneSuggestion[]>([]);
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Form model
  form = {
    memberId: '',
    testName: '',
    geneName: '',
    geneSuggestion: null as GeneSuggestion | null,
    variant: '',
    classification: 'vus' as GeneticClassification,
    testDate: new Date(2026, 1, 22),
    lab: '',
    resultSummary: '',
    consentGiven: false,
  };

  readonly classificationOptions = [
    { label: 'Pathogenic',        value: 'pathogenic'       },
    { label: 'Likely Pathogenic', value: 'likely-pathogenic'},
    { label: 'VUS',               value: 'vus'              },
    { label: 'Likely Benign',     value: 'likely-benign'    },
    { label: 'Benign',            value: 'benign'           },
  ];

  // Compute flat list of all genetic tests across members
  readonly tableRows = computed<GeneticTestRow[]>(() => {
    const members = this.familyService.humanMembers();
    const rows: GeneticTestRow[] = [];
    for (const m of members) {
      for (const t of m.geneticTests) {
        rows.push({
          testId: t.id,
          testName: t.testName,
          geneName: t.geneName,
          variant: t.variant ?? '',
          classification: t.classification,
          testDate: t.testDate,
          lab: t.lab,
          memberName: `${m.firstName} ${m.lastName}`,
          memberId: m.id,
        });
      }
    }
    return rows;
  });

  readonly memberOptions = computed(() =>
    this.familyService.humanMembers().map(m => ({
      label: `${m.firstName} ${m.lastName} (${m.relationship})`,
      value: m.id,
    }))
  );

  // ── Classification helpers ────────────────────────────────────────────────

  classificationLabel(c: GeneticClassification): string {
    const map: Record<GeneticClassification, string> = {
      'pathogenic':        'Pathogenic',
      'likely-pathogenic': 'Likely Pathogenic',
      'vus':               'VUS',
      'likely-benign':     'Likely Benign',
      'benign':            'Benign',
    };
    return map[c];
  }

  classificationSeverity(c: GeneticClassification): 'danger' | 'warn' | 'secondary' | 'success' | 'info' {
    if (c === 'pathogenic')        return 'danger';
    if (c === 'likely-pathogenic') return 'warn';
    if (c === 'vus')               return 'warn';
    if (c === 'likely-benign')     return 'success';
    if (c === 'benign')            return 'info';
    return 'secondary';
  }

  classificationStyle(c: GeneticClassification): Record<string, string> {
    const styles: Record<GeneticClassification, Record<string, string>> = {
      'pathogenic':        { background: '#dc2626', color: 'white' },
      'likely-pathogenic': { background: '#ea580c', color: 'white' },
      'vus':               { background: '#ca8a04', color: 'white' },
      'likely-benign':     { background: '#16a34a', color: 'white' },
      'benign':            { background: '#2563eb', color: 'white' },
    };
    return styles[c] ?? {};
  }

  // ── Sidebar actions ───────────────────────────────────────────────────────

  openAddSidebar(): void {
    // Romania requires GDPR consent gate
    if (this.jurisdiction() === 'RO' && !this.gdprConsentGranted()) {
      this.gdprDialogVisible = true;
      return;
    }
    this.sidebarVisible = true;
  }

  grantGdprAccess(): void {
    this.gdprConsentGranted.set(true);
    this.gdprDialogVisible = false;
    this.sidebarVisible = true;
  }

  searchGenes(event: { query: string }): void {
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      const q = event.query.toLowerCase();
      const results = CURATED_GENES
        .filter(g => g.name.toLowerCase().includes(q) || g.fullName.toLowerCase().includes(q))
        .slice(0, 15)
        .map(g => ({ label: `${g.name} — ${g.fullName}`, fullName: g.fullName, gene: g }));
      this.geneSuggestions.set(results);
    }, 200);
  }

  onGeneSelect(event: AutoCompleteSelectEvent): void {
    const suggestion = event.value as GeneSuggestion;
    // Extract gene name (before the dash)
    this.form.geneName = suggestion.label.split(' — ')[0].trim();
  }

  saveTest(): void {
    const member = this.familyService.members().find(m => m.id === this.form.memberId);
    if (!member) return;

    const allTests = this.familyService.humanMembers().flatMap(m => m.geneticTests);
    const id = `gt-${String(allTests.length + 1).padStart(3, '0')}`;

    const newTest: GeneticTestResult = {
      id,
      memberId: this.form.memberId,
      testName: this.form.testName,
      geneName: this.form.geneName,
      variant: this.form.variant || undefined,
      classification: this.form.classification,
      testDate: this.form.testDate,
      lab: this.form.lab || 'Unknown Lab',
      resultSummary: this.form.resultSummary,
      consentGiven: this.form.consentGiven,
      consentDate: this.form.consentGiven ? new Date(2026, 1, 22) : undefined,
    };

    this.familyService.updateMember(this.form.memberId, {
      geneticTests: [...member.geneticTests, newTest],
    });

    this.familyService.addAuditEntry(
      'GENETIC_TEST_LINKED',
      `Added ${this.form.testName} for ${member.firstName} ${member.lastName}.`,
      this.form.memberId,
    );

    this.sidebarVisible = false;
    this._resetForm();
  }

  // ── Export / Print ────────────────────────────────────────────────────────

  exportCsv(): void {
    const headers = ['Test Name', 'Gene', 'Variant', 'Classification', 'Date', 'Lab', 'Member'];
    const rows = this.tableRows().map(r => [
      r.testName, r.geneName, r.variant,
      this.classificationLabel(r.classification),
      r.testDate.toLocaleDateString('en-US'),
      r.lab, r.memberName,
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'genetic-tests.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  printTable(): void {
    window.print();
  }

  private _resetForm(): void {
    this.form = {
      memberId: '',
      testName: '',
      geneName: '',
      geneSuggestion: null,
      variant: '',
      classification: 'vus',
      testDate: new Date(2026, 1, 22),
      lab: '',
      resultSummary: '',
      consentGiven: false,
    };
  }
}
