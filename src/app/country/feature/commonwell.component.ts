import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';

type NetworkSource = 'CommonWell' | 'Carequality';
type ImportStatus = 'idle' | 'loading' | 'imported';

interface CrossProviderRecord {
  id: string;
  documentType: string;
  providerName: string;
  date: string;
  network: NetworkSource;
  importStatus: ImportStatus;
}

@Component({
  selector: 'app-commonwell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CardModule, ButtonModule, TagModule, DividerModule, InputTextModule],
  template: `
    <div class="commonwell-page">

      <!-- Page header -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-share-alt"></i>
          </div>
          <div>
            <h1>Cross-Provider Health Records</h1>
            <p>Access records from other healthcare providers via CommonWell &amp; Carequality networks</p>
          </div>
        </div>
      </header>

      <!-- Network status bar -->
      <div class="network-status-bar">
        <div class="network-status-item">
          <div class="network-dot connected"></div>
          <div class="network-info">
            <span class="network-name">CommonWell Health Alliance</span>
            <span class="network-detail">Connected — 21,000+ provider locations</span>
          </div>
          <span class="network-badge connected">Active</span>
        </div>
        <div class="network-divider"></div>
        <div class="network-status-item">
          <div class="network-dot connected"></div>
          <div class="network-info">
            <span class="network-name">Carequality Framework</span>
            <span class="network-detail">Connected — 55,000+ clinics &amp; hospitals</span>
          </div>
          <span class="network-badge connected">Active</span>
        </div>
      </div>

      <!-- Info banner -->
      <div class="info-banner">
        <i class="pi pi-info-circle"></i>
        <div>
          <strong>Your health records, wherever you've been treated</strong>
          <p>
            CommonWell and Carequality are nationwide health information networks that allow your medical
            records to follow you across providers — even if they use different EHR systems. AuraHealth
            is connected to both networks, giving you access to records from millions of providers nationwide.
          </p>
        </div>
      </div>

      <!-- Search panel -->
      <p-card header="Search for Records" styleClass="search-card">
        <div class="search-form">
          <div class="search-field-row">
            <div class="search-field">
              <label for="patient-name">Patient Name</label>
              <input
                id="patient-name"
                type="text"
                pInputText
                [(ngModel)]="patientName"
                placeholder="Enter patient name"
                class="search-input"
              />
            </div>
            <div class="search-field">
              <label for="dob">Date of Birth</label>
              <input
                id="dob"
                type="text"
                pInputText
                [(ngModel)]="dateOfBirth"
                placeholder="MM/DD/YYYY"
                class="search-input"
              />
            </div>
            <div class="search-field flex-2">
              <label for="provider-search">Provider / Organization</label>
              <input
                id="provider-search"
                type="text"
                pInputText
                [(ngModel)]="providerSearch"
                placeholder="Search by provider name or NPI..."
                class="search-input"
              />
            </div>
          </div>
          <div class="search-actions">
            <button
              pButton
              label="Search Records"
              icon="pi pi-search"
              [loading]="searching()"
              [disabled]="searching()"
              (click)="searchRecords()">
            </button>
            @if (hasSearched()) {
              <span class="search-result-count">
                <i class="pi pi-list"></i>
                {{ records().length }} records found across both networks
              </span>
            }
          </div>
        </div>
      </p-card>

      <!-- Results -->
      @if (hasSearched()) {
        <div class="results-section">
          <h2 class="results-header">
            <i class="pi pi-file-pdf"></i>
            Retrieved Records
          </h2>

          <div class="records-list">
            @for (record of records(); track record.id) {
              <div class="record-card">
                <div class="record-icon" [class]="'network-' + record.network.toLowerCase().replace(' ', '')">
                  <i [class]="getRecordIcon(record.documentType)"></i>
                </div>

                <div class="record-info">
                  <div class="record-header-row">
                    <h4 class="record-type">{{ record.documentType }}</h4>
                    <p-tag
                      [value]="record.network"
                      [severity]="record.network === 'CommonWell' ? 'info' : 'success'"
                      class="network-tag">
                    </p-tag>
                  </div>
                  <div class="record-provider">
                    <i class="pi pi-building"></i>
                    <span>{{ record.providerName }}</span>
                  </div>
                  <div class="record-date">
                    <i class="pi pi-calendar"></i>
                    <span>{{ record.date }}</span>
                  </div>
                </div>

                <div class="record-action">
                  @if (record.importStatus === 'idle') {
                    <button
                      pButton
                      label="Import"
                      icon="pi pi-download"
                      class="p-button-outlined p-button-sm"
                      (click)="importRecord(record.id)">
                    </button>
                  } @else if (record.importStatus === 'loading') {
                    <button pButton class="p-button-outlined p-button-sm" [disabled]="true">
                      <i class="pi pi-spin pi-spinner" style="margin-right:0.4rem;"></i>
                      Importing...
                    </button>
                  } @else {
                    <div class="imported-badge">
                      <i class="pi pi-check-circle"></i>
                      <a class="imported-link" href="/records" (click)="$event.preventDefault()">
                        Imported — view in Health Records
                      </a>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <p-divider></p-divider>

      <!-- About the networks -->
      <div class="networks-about-grid">
        <div class="network-about-card">
          <div class="network-about-icon cw">
            <i class="pi pi-share-alt"></i>
          </div>
          <h3>CommonWell Health Alliance</h3>
          <p>
            A not-for-profit trade association of healthcare IT companies enabling a nationwide
            health data network. Founded in 2013, CommonWell connects patients' records across
            thousands of healthcare organizations regardless of which EHR vendor they use.
          </p>
          <ul class="network-facts">
            <li><i class="pi pi-check"></i> 21,000+ provider locations</li>
            <li><i class="pi pi-check"></i> 230M+ patient records accessible</li>
            <li><i class="pi pi-check"></i> HL7 FHIR R4 compliant</li>
          </ul>
        </div>
        <div class="network-about-card">
          <div class="network-about-icon cq">
            <i class="pi pi-globe"></i>
          </div>
          <h3>Carequality Framework</h3>
          <p>
            A public-private collaborative that enables health information exchange across different
            health IT networks. Carequality creates a legal and technical framework allowing networks
            like CommonWell to interoperate seamlessly.
          </p>
          <ul class="network-facts">
            <li><i class="pi pi-check"></i> 55,000+ clinics &amp; hospitals</li>
            <li><i class="pi pi-check"></i> 1B+ clinical documents exchanged</li>
            <li><i class="pi pi-check"></i> USCDI v3 data elements</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .commonwell-page { max-width: 960px; margin: 0 auto; }

    .page-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }
    .header-content { display: flex; align-items: flex-start; gap: 1rem; }
    .header-icon { width: 52px; height: 52px; background: linear-gradient(135deg, var(--teal-100), var(--teal-50)); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .header-icon i { font-size: 1.5rem; color: var(--teal-600); }
    .header-content h1 { margin: 0; font-size: 1.6rem; }
    .header-content p { margin: 0.25rem 0 0; color: var(--text-color-secondary); font-size: 0.9rem; line-height: 1.5; }

    /* Network status */
    .network-status-bar { display: flex; align-items: center; gap: 0; padding: 1rem 1.25rem; background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: var(--border-radius); margin-bottom: 1.25rem; }
    .network-status-item { display: flex; align-items: center; gap: 0.875rem; flex: 1; }
    .network-divider { width: 1px; height: 48px; background: var(--surface-border); margin: 0 1.25rem; flex-shrink: 0; }
    .network-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .network-dot.connected { background: var(--green-500); box-shadow: 0 0 0 3px var(--green-50); }
    .network-info { display: flex; flex-direction: column; gap: 0.1rem; flex: 1; }
    .network-name { font-weight: 600; font-size: 0.9rem; }
    .network-detail { font-size: 0.78rem; color: var(--text-color-secondary); }
    .network-badge { font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 20px; letter-spacing: 0.02em; text-transform: uppercase; }
    .network-badge.connected { background: var(--green-50); color: var(--green-700); border: 1px solid var(--green-200); }

    /* Info banner */
    .info-banner { display: flex; align-items: flex-start; gap: 1rem; padding: 1rem 1.25rem; background: var(--teal-50); border: 1px solid var(--teal-100); border-radius: var(--border-radius); margin-bottom: 1.5rem; }
    .info-banner i { color: var(--teal-500); font-size: 1.1rem; flex-shrink: 0; margin-top: 0.15rem; }
    .info-banner strong { display: block; font-size: 0.95rem; margin-bottom: 0.25rem; color: var(--teal-800); }
    .info-banner p { margin: 0; font-size: 0.875rem; line-height: 1.6; color: var(--teal-900); }

    /* Search form */
    .search-form { display: flex; flex-direction: column; gap: 1rem; }
    .search-field-row { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 1rem; }
    .search-field { display: flex; flex-direction: column; gap: 0.4rem; }
    .search-field label { font-size: 0.82rem; font-weight: 600; color: var(--text-color-secondary); }
    .search-input { width: 100%; }
    .flex-2 { grid-column: span 1; }
    .search-actions { display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap; }
    .search-result-count { display: flex; align-items: center; gap: 0.4rem; font-size: 0.875rem; color: var(--text-color-secondary); }
    .search-result-count i { color: var(--primary-400); font-size: 0.875rem; }

    /* Results */
    .results-section { margin-top: 1.5rem; }
    .results-header { display: flex; align-items: center; gap: 0.6rem; font-size: 1.1rem; margin: 0 0 1rem; }
    .results-header i { color: var(--primary-500); }
    .records-list { display: flex; flex-direction: column; gap: 0.875rem; }
    .record-card { display: flex; align-items: flex-start; gap: 1rem; padding: 1rem 1.25rem; background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: var(--border-radius); box-shadow: 0 1px 4px rgba(0,0,0,0.04); transition: box-shadow 0.15s; }
    .record-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .record-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .record-icon i { font-size: 1.15rem; }
    .network-commonwell { background: var(--blue-50); }
    .network-commonwell i { color: var(--blue-600); }
    .network-carequality { background: var(--green-50); }
    .network-carequality i { color: var(--green-600); }
    .record-info { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; }
    .record-header-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .record-type { margin: 0; font-size: 0.95rem; font-weight: 600; }
    .record-provider { display: flex; align-items: center; gap: 0.35rem; font-size: 0.82rem; color: var(--text-color-secondary); }
    .record-provider i { font-size: 0.72rem; color: var(--primary-400); }
    .record-date { display: flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; color: var(--text-color-secondary); }
    .record-date i { font-size: 0.72rem; }
    .record-action { flex-shrink: 0; display: flex; align-items: center; }
    .imported-badge { display: flex; flex-direction: column; align-items: flex-end; gap: 0.2rem; }
    .imported-badge i { color: var(--green-500); font-size: 1.1rem; }
    .imported-link { font-size: 0.78rem; color: var(--primary-600); cursor: pointer; text-decoration: underline; }

    /* About networks */
    .networks-about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem; }
    .network-about-card { padding: 1.5rem; background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: var(--border-radius); }
    .network-about-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
    .network-about-icon.cw { background: var(--blue-50); }
    .network-about-icon.cw i { font-size: 1.4rem; color: var(--blue-600); }
    .network-about-icon.cq { background: var(--green-50); }
    .network-about-icon.cq i { font-size: 1.4rem; color: var(--green-600); }
    .network-about-card h3 { margin: 0 0 0.75rem; font-size: 1rem; }
    .network-about-card p { margin: 0 0 1rem; font-size: 0.875rem; color: var(--text-color-secondary); line-height: 1.6; }
    .network-facts { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 0.4rem; }
    .network-facts li { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; color: var(--text-color-secondary); }
    .network-facts li i { color: var(--green-500); font-size: 0.75rem; }

    @media (max-width: 768px) {
      .search-field-row { grid-template-columns: 1fr; }
      .network-status-bar { flex-direction: column; gap: 1rem; }
      .network-divider { display: none; }
      .networks-about-grid { grid-template-columns: 1fr; }
      .record-card { flex-direction: column; }
    }
  `]
})
export class CommonwellComponent {

  // Search form state
  patientName = 'Sarah Johnson';
  dateOfBirth = '03/14/1990';
  providerSearch = '';

  searching = signal(false);
  hasSearched = signal(false);

  // Mock cross-provider records
  records = signal<CrossProviderRecord[]>([
    {
      id: 'REC-001',
      documentType: 'Emergency Visit Summary',
      providerName: 'City General Hospital',
      date: 'November 12, 2025',
      network: 'CommonWell',
      importStatus: 'idle'
    },
    {
      id: 'REC-002',
      documentType: 'Orthopedic Consultation',
      providerName: 'Regional Bone & Joint Center',
      date: 'September 4, 2025',
      network: 'Carequality',
      importStatus: 'idle'
    },
    {
      id: 'REC-003',
      documentType: 'Lab Results Panel',
      providerName: 'Quest Diagnostics',
      date: 'January 28, 2026',
      network: 'CommonWell',
      importStatus: 'idle'
    },
    {
      id: 'REC-004',
      documentType: 'Radiology Report',
      providerName: 'Advanced Imaging Associates',
      date: 'October 17, 2025',
      network: 'Carequality',
      importStatus: 'idle'
    },
    {
      id: 'REC-005',
      documentType: 'Medication History',
      providerName: 'CVS Pharmacy',
      date: 'February 10, 2026',
      network: 'CommonWell',
      importStatus: 'idle'
    }
  ]);

  searchRecords(): void {
    this.searching.set(true);
    setTimeout(() => {
      this.searching.set(false);
      this.hasSearched.set(true);
    }, 1500);
  }

  importRecord(id: string): void {
    // Set to loading
    this.records.update(list =>
      list.map(r => r.id === id ? { ...r, importStatus: 'loading' as ImportStatus } : r)
    );
    // Simulate async import
    setTimeout(() => {
      this.records.update(list =>
        list.map(r => r.id === id ? { ...r, importStatus: 'imported' as ImportStatus } : r)
      );
    }, 2000);
  }

  getRecordIcon(documentType: string): string {
    const lower = documentType.toLowerCase();
    if (lower.includes('lab') || lower.includes('result')) return 'pi pi-chart-bar';
    if (lower.includes('radiology') || lower.includes('imaging')) return 'pi pi-eye';
    if (lower.includes('emergency')) return 'pi pi-exclamation-triangle';
    if (lower.includes('medication') || lower.includes('pharmacy')) return 'pi pi-box';
    if (lower.includes('consultation') || lower.includes('visit')) return 'pi pi-user-plus';
    return 'pi pi-file';
  }
}
