import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface EhdsPhase {
  id: number;
  title: string;
  description: string;
  status: 'Active' | 'In Progress' | 'Planned 2026' | 'Planned 2027' | 'Planned 2028';
  details: string;
}

@Component({
  selector: 'app-ehds-roadmap',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardModule, ButtonModule, TagModule, DividerModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="ehds-page">
      <p-toast></p-toast>

      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-globe"></i>
          </div>
          <div>
            <h1>European Health Data Space (EHDS)</h1>
            <p>EU Regulation 2022/868 — Cross-border health data interoperability roadmap for Romania</p>
          </div>
        </div>
      </header>

      <!-- EU EHDS Banner -->
      <div class="eu-banner">
        <div class="eu-stars">
          <span class="star">&#9733;</span><span class="star">&#9733;</span><span class="star">&#9733;</span>
          <span class="star">&#9733;</span><span class="star">&#9733;</span>
        </div>
        <div class="eu-info">
          <strong>Romania is an active participant in the European Health Data Space</strong>
          <p>
            The EHDS enables secure, rights-based sharing of health data across EU member states.
            Romanian patients can access their health records in any EU country and authorize
            cross-border data transfers under the MyHealth&#64;EU framework.
          </p>
        </div>
      </div>

      <!-- Implementation Phases Stepper -->
      <p-card header="EHDS Implementation Phases — Romania" styleClass="phases-card">
        <div class="phases-stepper">
          @for (phase of phases(); track phase.id) {
            <div class="phase-step" [class]="'phase-' + getPhaseClass(phase.status)">
              <div class="phase-connector-before" [class.active]="phase.id > 1"></div>
              <div class="phase-icon-col">
                <div class="phase-circle" [class]="'circle-' + getPhaseClass(phase.status)">
                  <i [class]="'pi ' + getPhaseIcon(phase.status)"></i>
                </div>
                @if (phase.id < phases().length) {
                  <div class="phase-line" [class]="'line-' + getPhaseClass(phase.status)"></div>
                }
              </div>
              <div class="phase-content">
                <div class="phase-header">
                  <span class="phase-title">{{ phase.title }}</span>
                  <p-tag
                    [value]="phase.status"
                    [severity]="getPhaseSeverity(phase.status)"
                  ></p-tag>
                </div>
                <p class="phase-desc">{{ phase.description }}</p>
                <p class="phase-detail">{{ phase.details }}</p>
              </div>
            </div>
          }
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- Your Data Rights Under EHDS -->
      <p-card header="Your Rights Under the European Health Data Space" styleClass="rights-card">
        <div class="rights-list">
          @for (right of dataRights(); track right.icon) {
            <div class="right-item">
              <div class="right-icon">
                <i [class]="'pi ' + right.icon"></i>
              </div>
              <div class="right-content">
                <strong>{{ right.title }}</strong>
                <p>{{ right.description }}</p>
              </div>
            </div>
          }
        </div>

        <p-divider></p-divider>

        <div class="rights-actions">
          <button
            pButton
            label="Request Cross-Border Data Transfer"
            icon="pi pi-share-alt"
            class="p-button-primary"
            (click)="requestCrossBorderTransfer()"
          ></button>
          <button
            pButton
            label="Download My EHDS Data Summary"
            icon="pi pi-download"
            class="p-button-outlined"
            (click)="downloadDataSummary()"
          ></button>
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- EHDS Info -->
      <div class="info-banner">
        <i class="pi pi-info-circle"></i>
        <div>
          <strong>About EHDS</strong>
          <p>
            The European Health Data Space (EHDS) is an EU-wide framework established by Regulation
            2022/868 that gives EU citizens control over their health data and enables safe, cross-border
            sharing for healthcare, research, and policy purposes. All 27 EU member states are
            implementing EHDS under the MyHealth&#64;EU initiative.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ehds-page { max-width: 1000px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .header-content { display: flex; align-items: center; gap: 1rem; }
    .header-icon { width: 52px; height: 52px; background: #e8eaf6; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .header-icon i { font-size: 1.5rem; color: #3949ab; }
    .header-content h1 { margin: 0; font-size: 1.6rem; }
    .header-content p { margin: 0.2rem 0 0; color: var(--text-color-secondary); font-size: 0.9rem; }
    .eu-banner { display: flex; align-items: flex-start; gap: 1rem; padding: 1rem 1.25rem; background: linear-gradient(135deg, #003399 0%, #0050a0 100%); color: white; border-radius: var(--border-radius); margin-bottom: 1.5rem; }
    .eu-stars { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
    .star { color: #ffcc00; font-size: 0.9rem; line-height: 1.1; }
    .eu-info strong { display: block; margin-bottom: 0.4rem; font-size: 1rem; }
    .eu-info p { margin: 0; font-size: 0.875rem; line-height: 1.55; opacity: 0.9; }
    .phases-stepper { display: flex; flex-direction: column; gap: 0; }
    .phase-step { display: flex; gap: 0; align-items: flex-start; position: relative; }
    .phase-icon-col { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; margin-right: 1rem; }
    .phase-circle { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .circle-active { background: var(--green-100); color: var(--green-700); border: 2px solid var(--green-400); }
    .circle-progress { background: var(--orange-100); color: var(--orange-700); border: 2px solid var(--orange-400); }
    .circle-planned2026 { background: var(--blue-50); color: var(--blue-500); border: 2px dashed var(--blue-300); }
    .circle-planned2027 { background: var(--surface-100); color: var(--text-color-secondary); border: 2px dashed var(--surface-300); }
    .circle-planned2028 { background: var(--surface-100); color: var(--text-color-secondary); border: 2px dashed var(--surface-300); }
    .phase-line { width: 2px; background: var(--surface-200); flex: 1; min-height: 24px; margin: 4px 0; }
    .line-active { background: var(--green-300); }
    .line-progress { background: var(--orange-200); }
    .phase-content { padding: 0.75rem 0 1.25rem; flex: 1; }
    .phase-header { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.3rem; }
    .phase-title { font-weight: 600; font-size: 0.95rem; }
    .phase-desc { margin: 0 0 0.2rem; font-size: 0.875rem; }
    .phase-detail { margin: 0; font-size: 0.8rem; color: var(--text-color-secondary); }
    .rights-list { display: flex; flex-direction: column; gap: 0.875rem; }
    .right-item { display: flex; align-items: flex-start; gap: 0.875rem; padding: 0.875rem; background: var(--surface-ground); border-radius: var(--border-radius); border: 1px solid var(--surface-border); }
    .right-icon { width: 40px; height: 40px; background: #e8eaf6; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .right-icon i { color: #3949ab; font-size: 1.1rem; }
    .right-content { display: flex; flex-direction: column; gap: 0.2rem; }
    .right-content strong { font-size: 0.9rem; }
    .right-content p { margin: 0; font-size: 0.825rem; color: var(--text-color-secondary); line-height: 1.5; }
    .rights-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .info-banner { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.25rem; background: var(--blue-50); border: 1px solid var(--blue-200); border-radius: var(--border-radius); font-size: 0.875rem; color: var(--blue-800); }
    .info-banner i { font-size: 1.1rem; color: var(--blue-500); flex-shrink: 0; margin-top: 0.1rem; }
    .info-banner strong { display: block; margin-bottom: 0.25rem; }
    .info-banner p { margin: 0; line-height: 1.55; }
  `]
})
export class EhdsRoadmapComponent {
  private readonly messageService: MessageService;

  constructor(messageService: MessageService) {
    this.messageService = messageService;
  }

  readonly phases = signal<EhdsPhase[]>([
    {
      id: 1,
      title: 'Cross-border e-Prescription',
      description: 'Romanian patients can fill prescriptions in any EU country using ePrescription token.',
      status: 'Active',
      details: 'Operational since 2022 via MyHealth@EU. Available in 23 EU member states.'
    },
    {
      id: 2,
      title: 'Patient Summary Exchange',
      description: 'Your patient summary (allergies, medications, diagnoses) is accessible to EU healthcare providers.',
      status: 'In Progress',
      details: 'Piloting with DE, FR, NL, ES. Romanian CNAS integration in testing phase.'
    },
    {
      id: 3,
      title: 'Laboratory Results Exchange',
      description: 'Lab reports and diagnostic results will be electronically shared across EU borders.',
      status: 'Planned 2026',
      details: 'EU EHDS Regulation implementation deadline: Q4 2026. Romania on schedule.'
    },
    {
      id: 4,
      title: 'Medical Images Exchange',
      description: 'DICOM imaging data (CT, MRI, X-Ray) will be accessible to authorized EU providers.',
      status: 'Planned 2027',
      details: 'Requires FHIR R5 ImagingStudy resources. PACS integration roadmap published.'
    },
    {
      id: 5,
      title: 'Full EHR Interoperability',
      description: 'Complete electronic health record sharing across all EU member states.',
      status: 'Planned 2028',
      details: 'Final EHDS phase aligned with EU Digital Decade 2030 targets.'
    }
  ]);

  readonly dataRights = signal([
    {
      icon: 'pi-eye',
      title: 'Right to Access Your Health Data',
      description: 'You have the right to access all your health data held by healthcare providers in any EU member state, free of charge.'
    },
    {
      icon: 'pi-shield',
      title: 'Right to Data Portability',
      description: 'You can request your health data in electronic format (FHIR, HL7) and transfer it to any authorized application or provider.'
    },
    {
      icon: 'pi-times-circle',
      title: 'Right to Restrict Processing',
      description: 'You can restrict which healthcare providers can access your data for secondary use (research, policy). Primary care access remains for safety.'
    },
    {
      icon: 'pi-globe',
      title: 'Right to Cross-Border Care',
      description: 'Your data follows you when seeking care in any EU country. Providers can access your patient summary with your consent.'
    },
    {
      icon: 'pi-info-circle',
      title: 'Right to Transparency',
      description: 'You are always informed when your health data is accessed, who accessed it, and for what purpose.'
    }
  ]);

  getPhaseClass(status: string): string {
    const map: Record<string, string> = {
      'Active': 'active',
      'In Progress': 'progress',
      'Planned 2026': 'planned2026',
      'Planned 2027': 'planned2027',
      'Planned 2028': 'planned2028'
    };
    return map[status] ?? 'planned2028';
  }

  getPhaseIcon(status: string): string {
    const map: Record<string, string> = {
      'Active': 'pi-check-circle',
      'In Progress': 'pi-spinner',
      'Planned 2026': 'pi-calendar',
      'Planned 2027': 'pi-calendar',
      'Planned 2028': 'pi-calendar'
    };
    return map[status] ?? 'pi-calendar';
  }

  getPhaseSeverity(status: string): 'success' | 'warn' | 'info' | 'danger' {
    const map: Record<string, 'success' | 'warn' | 'info' | 'danger'> = {
      'Active': 'success',
      'In Progress': 'warn',
      'Planned 2026': 'info',
      'Planned 2027': 'info',
      'Planned 2028': 'info'
    };
    return map[status] ?? 'info';
  }

  requestCrossBorderTransfer(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Request Initiated',
      detail: 'Your cross-border data transfer request has been submitted to CNAS for processing.'
    });
  }

  downloadDataSummary(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Preparing Download',
      detail: 'Your EHDS patient summary (FHIR IPS format) is being generated.'
    });
  }
}
