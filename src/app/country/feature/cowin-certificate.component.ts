import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface VaccineDose {
  dose: string;
  vaccine: string;
  date: string;
  batch: string;
  vaccinationCenter: string;
  verifier: string;
}

@Component({
  selector: 'app-cowin-certificate',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardModule, ButtonModule, TagModule, DividerModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="cowin-page">
      <p-toast></p-toast>

      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-verified"></i>
          </div>
          <div>
            <h1>CoWIN Vaccination Certificate</h1>
            <p>Ministry of Health & Family Welfare, Government of India — Official COVID-19 vaccination record</p>
          </div>
        </div>
      </header>

      <!-- Government Verified Banner -->
      <div class="gov-banner">
        <i class="pi pi-shield"></i>
        <div>
          <strong>Government Verified Certificate</strong>
          <p>
            This vaccination certificate is issued by the Ministry of Health & Family Welfare, Government
            of India under the CoWIN platform. It is digitally signed and can be verified using the QR code.
          </p>
        </div>
        <div class="gov-verify">
          <a href="#" class="verify-link" (click)="verifyCertificate($event)">
            <i class="pi pi-external-link"></i> Verify Certificate
          </a>
        </div>
      </div>

      <!-- Vaccination Certificate Card -->
      <p-card styleClass="cert-container">
        <div class="certificate-card">
          <!-- Certificate Header -->
          <div class="cert-header">
            <div class="cert-logo-row">
              <div class="india-emblem">
                <i class="pi pi-star-fill"></i>
                <span>Ministry of Health &amp; Family Welfare</span>
                <span class="gov-india">Government of India</span>
              </div>
              <div class="cowin-badge">
                <i class="pi pi-verified"></i>
                <span>CoWIN</span>
              </div>
            </div>
            <h2 class="cert-title">COVID-19 Vaccination Certificate</h2>
          </div>

          <!-- Beneficiary Details -->
          <div class="cert-beneficiary">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Beneficiary Name</span>
                <span class="detail-value">Raj Kumar Sharma</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Age / Gender</span>
                <span class="detail-value">41 Years / Male</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Beneficiary Reference ID</span>
                <span class="detail-value ref-id">23456789012345</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Certificate ID</span>
                <span class="detail-value ref-id">{{ certificateId() }}</span>
              </div>
            </div>
          </div>

          <div class="cert-divider"></div>

          <!-- Vaccination Doses -->
          <div class="cert-doses">
            <h3 class="doses-title">Vaccination Details</h3>
            <div class="doses-grid">
              @for (dose of vaccineDoses(); track dose.dose) {
                <div class="dose-card" [class.booster]="dose.dose === 'Booster'">
                  <div class="dose-badge">{{ dose.dose }}</div>
                  <div class="dose-info">
                    <div class="dose-vaccine">{{ dose.vaccine }}</div>
                    <div class="dose-date">
                      <i class="pi pi-calendar"></i>
                      <span>{{ dose.date }}</span>
                    </div>
                    <div class="dose-batch">
                      <i class="pi pi-tag"></i>
                      <span>Batch: {{ dose.batch }}</span>
                    </div>
                    <div class="dose-center">
                      <i class="pi pi-map-marker"></i>
                      <span>{{ dose.vaccinationCenter }}</span>
                    </div>
                    <div class="dose-verifier">
                      <i class="pi pi-user-md"></i>
                      <span>Verifier: {{ dose.verifier }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="cert-divider"></div>

          <!-- QR Code Section -->
          <div class="cert-qr-section">
            <div class="qr-block">
              <svg width="110" height="110" viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg">
                <rect width="110" height="110" fill="white"/>
                <rect x="4" y="4" width="28" height="28" fill="none" stroke="#1a237e" stroke-width="4"/>
                <rect x="9" y="9" width="18" height="18" fill="#1a237e"/>
                <rect x="78" y="4" width="28" height="28" fill="none" stroke="#1a237e" stroke-width="4"/>
                <rect x="83" y="9" width="18" height="18" fill="#1a237e"/>
                <rect x="4" y="78" width="28" height="28" fill="none" stroke="#1a237e" stroke-width="4"/>
                <rect x="9" y="83" width="18" height="18" fill="#1a237e"/>
                <rect x="36" y="4" width="6" height="6" fill="#1a237e"/>
                <rect x="46" y="4" width="6" height="6" fill="#1a237e"/>
                <rect x="60" y="4" width="6" height="6" fill="#1a237e"/>
                <rect x="36" y="14" width="6" height="6" fill="#1a237e"/>
                <rect x="52" y="14" width="6" height="6" fill="#1a237e"/>
                <rect x="66" y="14" width="6" height="6" fill="#1a237e"/>
                <rect x="42" y="24" width="6" height="6" fill="#1a237e"/>
                <rect x="58" y="24" width="6" height="6" fill="#1a237e"/>
                <rect x="4" y="36" width="6" height="6" fill="#1a237e"/>
                <rect x="14" y="36" width="6" height="6" fill="#1a237e"/>
                <rect x="26" y="36" width="6" height="6" fill="#1a237e"/>
                <rect x="40" y="36" width="6" height="6" fill="#1a237e"/>
                <rect x="54" y="36" width="6" height="6" fill="#1a237e"/>
                <rect x="68" y="36" width="6" height="6" fill="#1a237e"/>
                <rect x="78" y="36" width="6" height="6" fill="#1a237e"/>
                <rect x="96" y="36" width="6" height="6" fill="#1a237e"/>
                <rect x="4" y="50" width="6" height="6" fill="#1a237e"/>
                <rect x="20" y="50" width="6" height="6" fill="#1a237e"/>
                <rect x="36" y="50" width="6" height="6" fill="#1a237e"/>
                <rect x="50" y="50" width="6" height="6" fill="#1a237e"/>
                <rect x="64" y="50" width="6" height="6" fill="#1a237e"/>
                <rect x="80" y="50" width="6" height="6" fill="#1a237e"/>
                <rect x="96" y="50" width="6" height="6" fill="#1a237e"/>
                <rect x="10" y="64" width="6" height="6" fill="#1a237e"/>
                <rect x="24" y="64" width="6" height="6" fill="#1a237e"/>
                <rect x="40" y="64" width="6" height="6" fill="#1a237e"/>
                <rect x="56" y="64" width="6" height="6" fill="#1a237e"/>
                <rect x="72" y="64" width="6" height="6" fill="#1a237e"/>
                <rect x="86" y="64" width="6" height="6" fill="#1a237e"/>
                <rect x="36" y="78" width="6" height="6" fill="#1a237e"/>
                <rect x="50" y="78" width="6" height="6" fill="#1a237e"/>
                <rect x="64" y="78" width="6" height="6" fill="#1a237e"/>
                <rect x="78" y="78" width="6" height="6" fill="#1a237e"/>
                <rect x="92" y="78" width="6" height="6" fill="#1a237e"/>
                <rect x="36" y="90" width="6" height="6" fill="#1a237e"/>
                <rect x="52" y="90" width="6" height="6" fill="#1a237e"/>
                <rect x="68" y="90" width="6" height="6" fill="#1a237e"/>
                <rect x="84" y="90" width="6" height="6" fill="#1a237e"/>
                <rect x="100" y="90" width="6" height="6" fill="#1a237e"/>
              </svg>
              <p class="qr-label">Scan to verify</p>
            </div>
            <div class="cert-status">
              <p-tag value="Fully Vaccinated" severity="success" icon="pi pi-check-circle"></p-tag>
              <p-tag value="Booster Received" severity="info" icon="pi pi-verified"></p-tag>
            </div>
          </div>
        </div>
      </p-card>

      <!-- Actions -->
      <div class="cert-actions">
        <button
          pButton
          label="Download Certificate"
          icon="pi pi-download"
          class="p-button-primary"
          (click)="downloadCertificate()"
        ></button>
        <button
          pButton
          label="Share Certificate"
          icon="pi pi-share-alt"
          class="p-button-outlined"
          (click)="shareCertificate()"
        ></button>
        <button
          pButton
          label="Verify Certificate"
          icon="pi pi-verified"
          class="p-button-outlined p-button-secondary"
          (click)="verifyCertificate($event)"
        ></button>
      </div>
    </div>
  `,
  styles: [`
    .cowin-page { max-width: 900px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .header-content { display: flex; align-items: center; gap: 1rem; }
    .header-icon { width: 52px; height: 52px; background: #e8f5e9; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .header-icon i { font-size: 1.5rem; color: #388e3c; }
    .header-content h1 { margin: 0; font-size: 1.6rem; }
    .header-content p { margin: 0.2rem 0 0; color: var(--text-color-secondary); font-size: 0.9rem; }
    .gov-banner { display: flex; align-items: flex-start; gap: 0.875rem; padding: 1rem 1.25rem; background: #e8f5e9; border: 1px solid #a5d6a7; border-radius: var(--border-radius); margin-bottom: 1.5rem; font-size: 0.875rem; color: #1b5e20; }
    .gov-banner i { font-size: 1.25rem; color: #388e3c; flex-shrink: 0; margin-top: 0.1rem; }
    .gov-banner strong { display: block; margin-bottom: 0.3rem; }
    .gov-banner p { margin: 0; line-height: 1.55; flex: 1; }
    .gov-verify { flex-shrink: 0; align-self: center; }
    .verify-link { display: flex; align-items: center; gap: 0.35rem; color: #388e3c; font-size: 0.85rem; font-weight: 500; text-decoration: none; }
    .verify-link:hover { text-decoration: underline; }
    .cert-container { margin-bottom: 1.5rem; }
    .certificate-card { background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%); border: 2px solid #a5d6a7; border-radius: 12px; padding: 1.5rem; }
    .cert-header { margin-bottom: 1.25rem; }
    .cert-logo-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
    .india-emblem { display: flex; flex-direction: column; align-items: flex-start; gap: 0.1rem; }
    .india-emblem i { font-size: 1.25rem; color: #f57f17; }
    .india-emblem span { font-size: 0.8rem; font-weight: 700; color: #1b5e20; }
    .gov-india { font-size: 0.7rem !important; font-weight: 600 !important; color: #33691e !important; }
    .cowin-badge { display: flex; align-items: center; gap: 0.4rem; background: #1b5e20; color: white; padding: 0.4rem 0.875rem; border-radius: 20px; font-size: 0.85rem; font-weight: 700; }
    .cowin-badge i { font-size: 1rem; }
    .cert-title { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1b5e20; text-align: center; }
    .cert-beneficiary { padding: 1rem; background: rgba(255,255,255,0.6); border-radius: 8px; margin-bottom: 1rem; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.15rem; }
    .detail-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: #558b2f; }
    .detail-value { font-size: 0.9rem; font-weight: 600; color: #1b5e20; }
    .ref-id { font-family: monospace; font-size: 0.82rem; }
    .cert-divider { border-top: 1px dashed #a5d6a7; margin: 1rem 0; }
    .doses-title { margin: 0 0 0.875rem; font-size: 0.95rem; font-weight: 600; color: #1b5e20; }
    .doses-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
    .dose-card { background: white; border: 1px solid #c8e6c9; border-radius: 8px; padding: 0.875rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .dose-card.booster { border-color: #ff8f00; background: #fff8e1; }
    .dose-badge { display: inline-flex; align-self: flex-start; background: #1b5e20; color: white; font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 12px; text-transform: uppercase; }
    .dose-card.booster .dose-badge { background: #f57f17; }
    .dose-vaccine { font-size: 0.9rem; font-weight: 700; color: #1b5e20; }
    .dose-card.booster .dose-vaccine { color: #e65100; }
    .dose-info { display: flex; flex-direction: column; gap: 0.25rem; }
    .dose-date, .dose-batch, .dose-center, .dose-verifier { display: flex; align-items: flex-start; gap: 0.35rem; font-size: 0.78rem; color: #33691e; }
    .dose-date i, .dose-batch i, .dose-center i, .dose-verifier i { font-size: 0.7rem; flex-shrink: 0; margin-top: 0.1rem; }
    .cert-qr-section { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; }
    .qr-block { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; }
    .qr-block svg { border: 3px solid #a5d6a7; border-radius: 6px; }
    .qr-label { font-size: 0.72rem; color: #558b2f; margin: 0; text-align: center; }
    .cert-status { display: flex; flex-direction: column; gap: 0.5rem; }
    .cert-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    @media (max-width: 640px) {
      .doses-grid { grid-template-columns: 1fr; }
      .detail-grid { grid-template-columns: 1fr; }
      .cert-qr-section { flex-direction: column; gap: 1rem; }
      .gov-banner { flex-direction: column; }
      .cert-actions { flex-direction: column; }
    }
  `]
})
export class CowinCertificateComponent {
  private readonly messageService: MessageService;

  constructor(messageService: MessageService) {
    this.messageService = messageService;
  }

  readonly certificateId = signal('IN-MH-2023-0081234-BOOST');

  readonly vaccineDoses = signal<VaccineDose[]>([
    {
      dose: 'Dose 1',
      vaccine: 'Covishield (AZ-Oxford)',
      date: '15 Jan 2021',
      batch: 'AZ-2021-0034781',
      vaccinationCenter: 'Bandra BKC Vaccination Centre, Mumbai',
      verifier: 'Dr. N. Singh'
    },
    {
      dose: 'Dose 2',
      vaccine: 'Covishield (AZ-Oxford)',
      date: '10 Apr 2021',
      batch: 'AZ-2021-0098342',
      vaccinationCenter: 'KEM Hospital, Mumbai',
      verifier: 'Dr. A. Patel'
    },
    {
      dose: 'Booster',
      vaccine: 'Covaxin (Bharat Biotech)',
      date: '20 Jan 2023',
      batch: 'BB-2023-0012456',
      vaccinationCenter: 'AuraHealth Clinic, Andheri West',
      verifier: 'Dr. R. Mehta'
    }
  ]);

  downloadCertificate(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Downloading',
      detail: 'Your CoWIN vaccination certificate PDF is being prepared for download.'
    });
  }

  shareCertificate(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Share Certificate',
      detail: 'Certificate sharing link copied to clipboard.'
    });
  }

  verifyCertificate(event: Event): void {
    event.preventDefault();
    this.messageService.add({
      severity: 'success',
      summary: 'Certificate Verified',
      detail: 'Certificate ID ' + this.certificateId() + ' is authentic and verified on CoWIN platform.'
    });
  }
}
