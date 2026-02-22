import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { TabViewModule } from 'primeng/tabview';

interface CNASPrescription {
  id: string;
  cnasNumber: string;
  medication: string;
  dosage: string;
  prescribingDoctor: string;
  pharmacy: string;
  issuedDate: string;
  validUntil: string;
  status: 'Dispensed' | 'Pending' | 'Expired';
}

interface SickLeaveCertificate {
  id: string;
  certificateNumber: string;
  diagnosisCode: string;
  diagnosisName: string;
  periodFrom: string;
  periodTo: string;
  issuingDoctor: string;
  institution: string;
  employerNotified: boolean;
  status: 'Active' | 'Submitted' | 'Expired';
}

@Component({
  selector: 'app-cnas-prescriptions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, TagModule, TableModule, DividerModule, TabViewModule],
  template: `
    <div class="cnas-page">
      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-file-edit"></i>
          </div>
          <div>
            <h1>CNAS E-Prescriptions &amp; Sick Leave</h1>
            <p>Casa Nationala de Asigurari de Sanatate — Electronic prescriptions and medical certificates</p>
          </div>
        </div>
      </header>

      <!-- CNAS Connection Status -->
      <div class="connection-card">
        <div class="connection-status">
          <div class="status-indicator connected">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="status-info">
            <span class="status-title">Conectat la CNAS — Sistemul National de e-Prescriptie</span>
            <span class="status-detail">CID: RO-MH-2024-0081234 | CNP: 1850315****123</span>
            <span class="status-sync">Ultima sincronizare: 21 Feb 2026, 09:14</span>
          </div>
        </div>
        <div class="connection-actions">
          <a pButton label="Portal CNAS" icon="pi pi-external-link" class="p-button-outlined p-button-sm" href="https://cnas.ro" target="_blank" rel="noopener noreferrer"></a>
        </div>
      </div>

      <!-- Tab View -->
      <p-tabView>
        <!-- E-Prescriptions Tab -->
        <p-tabPanel header="E-Prescriptions Active (3)">
          <div class="prescriptions-list">
            @for (rx of prescriptions(); track rx.id) {
              <div class="rx-card">
                <div class="rx-header">
                  <div class="rx-number-row">
                    <span class="rx-number">{{ rx.cnasNumber }}</span>
                    <p-tag
                      [value]="rx.status"
                      [severity]="getRxStatusSeverity(rx.status)"
                    ></p-tag>
                  </div>
                  <div class="rx-medication">
                    <i class="pi pi-box"></i>
                    <strong>{{ rx.medication }}</strong>
                    <span class="rx-dosage">{{ rx.dosage }}</span>
                  </div>
                </div>
                <div class="rx-details">
                  <div class="rx-detail-item">
                    <i class="pi pi-user-md"></i>
                    <span>Dr. {{ rx.prescribingDoctor }}</span>
                  </div>
                  <div class="rx-detail-item">
                    <i class="pi pi-building"></i>
                    <span>{{ rx.pharmacy }}</span>
                  </div>
                  <div class="rx-detail-item">
                    <i class="pi pi-calendar"></i>
                    <span>Emisa: {{ rx.issuedDate }}</span>
                  </div>
                  <div class="rx-detail-item">
                    <i class="pi pi-clock"></i>
                    <span>Valabila pana: {{ rx.validUntil }}</span>
                  </div>
                </div>
                <div class="rx-actions">
                  <button pButton label="Download PDF" icon="pi pi-download" class="p-button-outlined p-button-sm"></button>
                  <button pButton label="Show QR" icon="pi pi-qrcode" class="p-button-text p-button-sm"></button>
                </div>
              </div>
            }
          </div>
        </p-tabPanel>

        <!-- Sick Leave Tab -->
        <p-tabPanel header="Certificate Concediu Medical (2)">
          <div class="sick-leave-list">
            @for (cert of sickLeaveCerts(); track cert.id) {
              <div class="cert-card">
                <div class="cert-header">
                  <div class="cert-number-row">
                    <span class="cert-number">{{ cert.certificateNumber }}</span>
                    <p-tag
                      [value]="cert.status"
                      [severity]="getCertStatusSeverity(cert.status)"
                    ></p-tag>
                    @if (cert.employerNotified) {
                      <span class="employer-tag">
                        <i class="pi pi-check"></i> Angajator notificat
                      </span>
                    }
                  </div>
                </div>
                <div class="cert-diagnosis">
                  <span class="icd-code">{{ cert.diagnosisCode }}</span>
                  <span class="diagnosis-name">{{ cert.diagnosisName }}</span>
                </div>
                <div class="cert-details">
                  <div class="cert-detail-item">
                    <i class="pi pi-calendar-minus"></i>
                    <span>Perioada: {{ cert.periodFrom }} — {{ cert.periodTo }}</span>
                  </div>
                  <div class="cert-detail-item">
                    <i class="pi pi-user-md"></i>
                    <span>Dr. {{ cert.issuingDoctor }}</span>
                  </div>
                  <div class="cert-detail-item">
                    <i class="pi pi-building"></i>
                    <span>{{ cert.institution }}</span>
                  </div>
                </div>
                <div class="cert-actions">
                  <button pButton label="Download Certificat" icon="pi pi-download" class="p-button-outlined p-button-sm"></button>
                  <button pButton label="Notifica Angajatorul" icon="pi pi-send" class="p-button-text p-button-sm" [disabled]="cert.employerNotified"></button>
                </div>
              </div>
            }
          </div>
        </p-tabPanel>
      </p-tabView>

      <p-divider></p-divider>

      <!-- CNAS Regulations Note -->
      <div class="cnas-note">
        <i class="pi pi-info-circle"></i>
        <div>
          <strong>Reglementari CNAS</strong>
          <ul class="regs-list">
            <li>Retetele electronice sunt valabile 30 de zile de la data emiterii (7 zile pentru stupefiante).</li>
            <li>Concediile medicale se transmit angajatorului in maximum 3 zile lucratoare de la emitere.</li>
            <li>Medicamentele compensate sunt decontate in proportie de 50-90% in functie de categoria de compensare.</li>
            <li>Pentru urgente, medicul poate emite reteta fara programare in cadrul sistemului CNAS.</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cnas-page { max-width: 1000px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .header-content { display: flex; align-items: center; gap: 1rem; }
    .header-icon { width: 52px; height: 52px; background: var(--blue-100); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .header-icon i { font-size: 1.5rem; color: var(--blue-600); }
    .header-content h1 { margin: 0; font-size: 1.6rem; }
    .header-content p { margin: 0.2rem 0 0; color: var(--text-color-secondary); font-size: 0.9rem; }
    .connection-card { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; background: var(--green-50); border: 1px solid var(--green-200); border-radius: var(--border-radius); margin-bottom: 1.5rem; }
    .connection-status { display: flex; align-items: center; gap: 0.875rem; }
    .status-indicator { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .status-indicator.connected { background: var(--green-100); color: var(--green-600); }
    .status-indicator i { font-size: 1.25rem; }
    .status-info { display: flex; flex-direction: column; gap: 0.2rem; }
    .status-title { font-weight: 600; color: var(--green-700); font-size: 0.95rem; }
    .status-detail { font-size: 0.8rem; color: var(--text-color-secondary); }
    .status-sync { font-size: 0.8rem; color: var(--text-color-secondary); }
    .prescriptions-list, .sick-leave-list { display: flex; flex-direction: column; gap: 1rem; padding-top: 0.5rem; }
    .rx-card, .cert-card { padding: 1rem 1.25rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); }
    .rx-header, .cert-header { margin-bottom: 0.75rem; }
    .rx-number-row, .cert-number-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.4rem; }
    .rx-number, .cert-number { font-family: monospace; font-size: 0.85rem; font-weight: 600; color: var(--blue-700); background: var(--blue-50); padding: 0.2rem 0.6rem; border-radius: 4px; }
    .rx-medication { display: flex; align-items: center; gap: 0.5rem; }
    .rx-medication i { color: var(--primary-400); }
    .rx-medication strong { font-size: 0.95rem; }
    .rx-dosage { font-size: 0.8rem; color: var(--text-color-secondary); }
    .rx-details, .cert-details { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem 1rem; margin-bottom: 0.75rem; }
    .rx-detail-item, .cert-detail-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; color: var(--text-color-secondary); }
    .rx-detail-item i, .cert-detail-item i { font-size: 0.75rem; color: var(--primary-400); flex-shrink: 0; }
    .rx-actions, .cert-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .cert-diagnosis { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.625rem; }
    .icd-code { background: var(--blue-100); color: var(--blue-700); font-family: monospace; font-size: 0.82rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 4px; }
    .diagnosis-name { font-size: 0.9rem; font-weight: 500; }
    .employer-tag { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; background: var(--green-50); color: var(--green-700); border: 1px solid var(--green-200); padding: 0.15rem 0.55rem; border-radius: 12px; }
    .cnas-note { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.25rem; background: var(--blue-50); border: 1px solid var(--blue-200); border-radius: var(--border-radius); font-size: 0.875rem; color: var(--blue-800); }
    .cnas-note i { font-size: 1.1rem; color: var(--blue-500); flex-shrink: 0; margin-top: 0.1rem; }
    .cnas-note strong { display: block; margin-bottom: 0.4rem; }
    .regs-list { margin: 0; padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.35rem; }
    .regs-list li { line-height: 1.5; }
    @media (max-width: 640px) {
      .connection-card { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
      .rx-details, .cert-details { grid-template-columns: 1fr; }
    }
  `]
})
export class CnasPrescriptionsComponent {
  readonly prescriptions = signal<CNASPrescription[]>([
    {
      id: '1',
      cnasNumber: 'RX-CNAS-2026-0034781',
      medication: 'Metformin 500mg',
      dosage: '2 comprimate/zi — 90 zile',
      prescribingDoctor: 'Ionescu Maria',
      pharmacy: 'Farmacia Catena, Cluj-Napoca',
      issuedDate: '18 Feb 2026',
      validUntil: '18 Mar 2026',
      status: 'Dispensed'
    },
    {
      id: '2',
      cnasNumber: 'RX-CNAS-2026-0034782',
      medication: 'Lisinopril 10mg',
      dosage: '1 comprimat/zi — 30 zile',
      prescribingDoctor: 'Ionescu Maria',
      pharmacy: 'In asteptare - neonorata inca',
      issuedDate: '18 Feb 2026',
      validUntil: '18 Mar 2026',
      status: 'Pending'
    },
    {
      id: '3',
      cnasNumber: 'RX-CNAS-2026-0028190',
      medication: 'Amoxicilina 500mg',
      dosage: '3 comprimate/zi — 7 zile',
      prescribingDoctor: 'Popa Ion',
      pharmacy: 'Farmacia Sensiblu, Floresti',
      issuedDate: '05 Jan 2026',
      validUntil: '05 Feb 2026',
      status: 'Expired'
    }
  ]);

  readonly sickLeaveCerts = signal<SickLeaveCertificate[]>([
    {
      id: '1',
      certificateNumber: 'CM-2026-0012345',
      diagnosisCode: 'J06.9',
      diagnosisName: 'Infectie acuta a cailor respiratorii superioare, nespecificata',
      periodFrom: '12 Ian 2026',
      periodTo: '16 Ian 2026',
      issuingDoctor: 'Popa Ion',
      institution: 'Cabinet Medical Dr. Popa, Cluj',
      employerNotified: true,
      status: 'Expired'
    },
    {
      id: '2',
      certificateNumber: 'CM-2026-0015678',
      diagnosisCode: 'M54.5',
      diagnosisName: 'Durere lombara joasa (lombalgie)',
      periodFrom: '10 Feb 2026',
      periodTo: '14 Feb 2026',
      issuingDoctor: 'Dumitrescu Andrei',
      institution: 'Spitalul Judetean Cluj-Napoca',
      employerNotified: false,
      status: 'Submitted'
    }
  ]);

  getRxStatusSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      Dispensed: 'success',
      Pending: 'warning',
      Expired: 'danger'
    };
    return map[status] ?? 'info';
  }

  getCertStatusSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      Active: 'success',
      Submitted: 'info',
      Expired: 'danger'
    };
    return map[status] ?? 'info';
  }
}
