import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface DataRight {
  id: number;
  icon: string;
  title: string;
  description: string;
  regulation: string;
}

interface ComplianceItem {
  id: number;
  name: string;
  status: 'Compliant' | 'In Progress' | 'Pending';
  lastAudited: string;
  details: string;
}

@Component({
  selector: 'app-cures-act',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardModule, ButtonModule, TagModule, DividerModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="cures-page">
      <p-toast></p-toast>

      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-verified"></i>
          </div>
          <div>
            <h1>21st Century Cures Act — Your Data Rights</h1>
            <p>ONC Information Blocking Rule &amp; USCDI — Federal patient data rights under the 21st Century Cures Act (2020)</p>
          </div>
        </div>
      </header>

      <!-- Compliance Status Banner -->
      <div class="compliance-banner">
        <div class="compliance-icon">
          <i class="pi pi-verified"></i>
        </div>
        <div class="compliance-info">
          <strong>This portal is fully compliant with the 21st Century Cures Act</strong>
          <p>
            GoHealth Patient Portal meets all ONC Health IT Certification Program requirements under
            45 CFR Part 170. We support USCDI v5 data classes, SMART on FHIR API access, and
            OpenID Connect. Information blocking is strictly prohibited.
          </p>
        </div>
        <div class="compliance-badges">
          <p-tag value="ONC Certified" severity="success" icon="pi pi-check-circle"></p-tag>
          <p-tag value="USCDI v5" severity="info" icon="pi pi-file"></p-tag>
        </div>
      </div>

      <!-- Compliance Checklist -->
      <p-card header="Compliance Status" styleClass="checklist-card">
        <div class="checklist">
          @for (item of complianceItems(); track item.id) {
            <div class="checklist-item">
              <div class="check-icon" [class]="'check-' + item.status.toLowerCase().replace(' ', '-')">
                <i [class]="'pi ' + getComplianceIcon(item.status)"></i>
              </div>
              <div class="check-content">
                <div class="check-header">
                  <span class="check-name">{{ item.name }}</span>
                  <p-tag [value]="item.status" [severity]="getComplianceSeverity(item.status)"></p-tag>
                  <span class="check-audited">Last audited: {{ item.lastAudited }}</span>
                </div>
                <p class="check-details">{{ item.details }}</p>
              </div>
            </div>
          }
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- Your Rights List -->
      <p-card header="Your Rights Under the 21st Century Cures Act" styleClass="rights-card">
        <div class="rights-list">
          @for (right of dataRights(); track right.id) {
            <div class="right-item">
              <div class="right-icon">
                <i [class]="'pi ' + right.icon"></i>
              </div>
              <div class="right-content">
                <div class="right-header">
                  <strong>{{ right.title }}</strong>
                  <span class="right-regulation">{{ right.regulation }}</span>
                </div>
                <p>{{ right.description }}</p>
              </div>
            </div>
          }
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- Request Data Section -->
      <p-card header="Request or Share Your Health Data" styleClass="request-card">
        <div class="request-options">
          <div class="request-option">
            <div class="request-icon">
              <i class="pi pi-download"></i>
            </div>
            <div class="request-text">
              <h3>Request Your Complete Health Record</h3>
              <p>
                Under the Cures Act, you have the right to receive your complete electronic health
                information without delay, at no cost, in a readable format. Your data is provided
                in FHIR R4 (HL7 bulk export) format.
              </p>
              <button pButton label="Request Complete Health Record" icon="pi pi-download" (click)="requestHealthRecord()"></button>
            </div>
          </div>
          <p-divider></p-divider>
          <div class="request-option">
            <div class="request-icon">
              <i class="pi pi-share-alt"></i>
            </div>
            <div class="request-text">
              <h3>Authorize a Third-Party App</h3>
              <p>
                You have the right to share your health data with any SMART on FHIR-compatible
                health app or service of your choosing. GoHealth uses OAuth 2.0 to ensure secure,
                patient-authorized access.
              </p>
              <button pButton label="Manage App Authorizations" icon="pi pi-cog" class="p-button-outlined" (click)="manageApps()"></button>
            </div>
          </div>
          <p-divider></p-divider>
          <div class="request-option report">
            <div class="request-icon report-icon">
              <i class="pi pi-flag"></i>
            </div>
            <div class="request-text">
              <h3>Report Suspected Information Blocking</h3>
              <p>
                If you believe a healthcare provider, health IT developer, or health information
                network is interfering with your right to access or share your health data,
                you can report it to the ONC.
              </p>
              <a
                pButton
                label="Report Information Blocking to ONC"
                icon="pi pi-external-link"
                class="p-button-outlined p-button-danger"
                href="https://healthit.gov/topic/information-blocking"
                target="_blank"
                rel="noopener noreferrer"
              ></a>
            </div>
          </div>
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- FHIR API Access Info -->
      <div class="api-banner">
        <i class="pi pi-code"></i>
        <div>
          <strong>Standardized FHIR API Access</strong>
          <p>
            GoHealth provides a public-facing FHIR R4 API endpoint compliant with the ONC Cures Act
            Final Rule (45 CFR 170.315(g)(10)). Developers and patients can access health data
            programmatically using SMART on FHIR and HL7 C-CDA formats.
          </p>
          <div class="api-details">
            <span class="api-endpoint">
              <strong>FHIR Base URL:</strong>
              <code>https://api.gohealth.example/fhir/r4</code>
            </span>
            <span class="api-spec">
              <strong>Supported:</strong> US Core IG 6.1, USCDI v5, SMART App Launch 2.0
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cures-page { max-width: 1000px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .header-content { display: flex; align-items: center; gap: 1rem; }
    .header-icon { width: 52px; height: 52px; background: var(--purple-100); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .header-icon i { font-size: 1.5rem; color: var(--purple-600); }
    .header-content h1 { margin: 0; font-size: 1.5rem; }
    .header-content p { margin: 0.2rem 0 0; color: var(--text-color-secondary); font-size: 0.9rem; }
    .compliance-banner { display: flex; align-items: flex-start; gap: 1rem; padding: 1rem 1.25rem; background: var(--green-50); border: 1px solid var(--green-300); border-radius: var(--border-radius); margin-bottom: 1.5rem; }
    .compliance-icon { width: 48px; height: 48px; background: var(--green-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .compliance-icon i { font-size: 1.4rem; color: var(--green-700); }
    .compliance-info { flex: 1; }
    .compliance-info strong { display: block; margin-bottom: 0.35rem; color: var(--green-800); font-size: 0.95rem; }
    .compliance-info p { margin: 0; font-size: 0.875rem; color: var(--green-800); line-height: 1.55; }
    .compliance-badges { display: flex; flex-direction: column; gap: 0.4rem; align-self: center; flex-shrink: 0; }
    .checklist { display: flex; flex-direction: column; gap: 0.875rem; }
    .checklist-item { display: flex; align-items: flex-start; gap: 0.875rem; }
    .check-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 0.1rem; }
    .check-icon.check-compliant { background: var(--green-100); color: var(--green-700); }
    .check-icon.check-in-progress { background: var(--orange-100); color: var(--orange-700); }
    .check-icon.check-pending { background: var(--surface-200); color: var(--text-color-secondary); }
    .check-content { flex: 1; }
    .check-header { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.25rem; }
    .check-name { font-weight: 600; font-size: 0.9rem; }
    .check-audited { font-size: 0.75rem; color: var(--text-color-secondary); }
    .check-details { margin: 0; font-size: 0.82rem; color: var(--text-color-secondary); line-height: 1.5; }
    .rights-list { display: flex; flex-direction: column; gap: 0.875rem; }
    .right-item { display: flex; align-items: flex-start; gap: 0.875rem; padding: 0.875rem 1rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-left: 3px solid var(--purple-400); border-radius: var(--border-radius); }
    .right-icon { width: 38px; height: 38px; background: var(--purple-50); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .right-icon i { color: var(--purple-600); font-size: 1.1rem; }
    .right-content { flex: 1; }
    .right-header { display: flex; align-items: baseline; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.25rem; }
    .right-header strong { font-size: 0.9rem; }
    .right-regulation { font-size: 0.72rem; background: var(--purple-50); color: var(--purple-700); border: 1px solid var(--purple-100); padding: 0.1rem 0.4rem; border-radius: 4px; font-family: monospace; }
    .right-content p { margin: 0; font-size: 0.83rem; color: var(--text-color-secondary); line-height: 1.55; }
    .request-options { display: flex; flex-direction: column; gap: 0; }
    .request-option { display: flex; align-items: flex-start; gap: 1rem; padding: 0.75rem 0; }
    .request-option.report { }
    .request-icon { width: 48px; height: 48px; background: var(--purple-50); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .request-icon i { color: var(--purple-600); font-size: 1.25rem; }
    .report-icon { background: #fce4ec; }
    .report-icon i { color: #c2185b; }
    .request-text { flex: 1; }
    .request-text h3 { margin: 0 0 0.35rem; font-size: 0.95rem; }
    .request-text p { margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--text-color-secondary); line-height: 1.55; }
    .api-banner { display: flex; align-items: flex-start; gap: 0.875rem; padding: 1rem 1.25rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); font-size: 0.875rem; }
    .api-banner i { font-size: 1.25rem; color: var(--primary-500); flex-shrink: 0; margin-top: 0.1rem; }
    .api-banner strong { display: block; margin-bottom: 0.35rem; }
    .api-banner p { margin: 0 0 0.75rem; color: var(--text-color-secondary); line-height: 1.55; }
    .api-details { display: flex; flex-direction: column; gap: 0.35rem; }
    .api-endpoint, .api-spec { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; }
    .api-endpoint code { font-family: monospace; background: var(--surface-200); padding: 0.1rem 0.5rem; border-radius: 4px; color: var(--primary-700); font-size: 0.82rem; }
    @media (max-width: 640px) {
      .compliance-banner { flex-direction: column; }
      .compliance-badges { flex-direction: row; }
      .request-option { flex-direction: column; }
      .api-endpoint, .api-spec { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class CuresActComponent {
  private readonly messageService: MessageService;

  constructor(messageService: MessageService) {
    this.messageService = messageService;
  }

  readonly dataRights = signal<DataRight[]>([
    {
      id: 1,
      icon: 'pi-clock',
      title: 'Access Within 1 Business Day',
      description: 'You have the right to receive electronic copies of your complete electronic health information (EHI) within 1 business day, at no cost and without special effort.',
      regulation: '45 CFR 170.315(e)(1)'
    },
    {
      id: 2,
      icon: 'pi-ban',
      title: 'No Information Blocking',
      description: 'Healthcare providers, health IT developers, and health information networks are prohibited from interfering with access, exchange, or use of your EHI.',
      regulation: '45 CFR Part 171'
    },
    {
      id: 3,
      icon: 'pi-code',
      title: 'Standardized API Access',
      description: 'You can access your health data via FHIR R4 APIs using any SMART on FHIR-compatible app, without needing special permission from your provider.',
      regulation: '45 CFR 170.315(g)(10)'
    },
    {
      id: 4,
      icon: 'pi-mobile',
      title: 'Right to Choose Your Own Health Apps',
      description: 'You can authorize any patient-facing application to access your health data. Providers cannot block or discourage use of your chosen health apps.',
      regulation: '45 CFR 171.301'
    },
    {
      id: 5,
      icon: 'pi-copy',
      title: 'Electronic Copies of Your Records',
      description: 'You have the right to electronic copies of all EHI defined by the USCDI, including clinical notes, lab results, imaging reports, and visit summaries.',
      regulation: 'USCDI v5 / 45 CFR 170.213'
    }
  ]);

  readonly complianceItems = signal<ComplianceItem[]>([
    {
      id: 1,
      name: 'FHIR R4 API (SMART on FHIR) — Certified',
      status: 'Compliant',
      lastAudited: 'Jan 15, 2026',
      details: 'ONC 2015 Edition Cures Update Health IT certification achieved. Supports US Core 6.1 IG, USCDI v5, and SMART App Launch 2.0.'
    },
    {
      id: 2,
      name: 'Information Blocking Policy',
      status: 'Compliant',
      lastAudited: 'Feb 01, 2026',
      details: 'All exceptions documented under 45 CFR Part 171. No verified information blocking reports. Patient data requests fulfilled within 1 business day.'
    },
    {
      id: 3,
      name: 'Clinical Notes Access (OpenNotes)',
      status: 'Compliant',
      lastAudited: 'Jan 20, 2026',
      details: 'All 8 USCDI note types available without delay: progress notes, consultation notes, discharge summaries, history & physical, imaging narratives, lab reports, pathology reports, and procedure notes.'
    },
    {
      id: 4,
      name: 'Electronic Health Record Export',
      status: 'Compliant',
      lastAudited: 'Jan 28, 2026',
      details: 'Bulk FHIR export (NDJSON) and individual FHIR document export available. C-CDA export also supported for legacy interoperability.'
    },
    {
      id: 5,
      name: 'Patient Matching & Identity',
      status: 'In Progress',
      lastAudited: 'Feb 10, 2026',
      details: 'TEFCA-aligned patient matching (UDI-based) implementation in progress. Expected completion Q2 2026.'
    }
  ]);

  getComplianceIcon(status: string): string {
    const icons: Record<string, string> = {
      Compliant: 'pi-check-circle',
      'In Progress': 'pi-spinner',
      Pending: 'pi-circle'
    };
    return icons[status] ?? 'pi-circle';
  }

  getComplianceSeverity(status: string): 'success' | 'warn' | 'info' | 'danger' {
    const map: Record<string, 'success' | 'warn' | 'info' | 'danger'> = {
      Compliant: 'success',
      'In Progress': 'warn',
      Pending: 'info'
    };
    return map[status] ?? 'info';
  }

  requestHealthRecord(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Record Request Submitted',
      detail: 'Your complete electronic health record (FHIR R4 format) will be available for download within 1 business day.'
    });
  }

  manageApps(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'App Authorizations',
      detail: 'Navigate to Settings > App Authorizations to manage which third-party apps can access your health data.'
    });
  }
}
