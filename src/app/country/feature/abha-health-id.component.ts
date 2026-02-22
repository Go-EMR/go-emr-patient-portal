import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../auth/data-access';

interface AbhaProfile {
  abhaNumber: string;
  name: string;
  dob: string;
  gender: string;
  address: string;
  linkedFacility: string;
  status: string;
  createdDate: string;
}

@Component({
  selector: 'app-abha-health-id',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule, ButtonModule, TagModule, DividerModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="abha-page">
      <p-toast></p-toast>

      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-id-card"></i>
          </div>
          <div>
            <h1>ABHA Health ID</h1>
            <p>Ayushman Bharat Health Account - Your unique digital health identity</p>
          </div>
        </div>
      </header>

      <!-- Info Banner -->
      <div class="info-banner">
        <i class="pi pi-info-circle"></i>
        <div>
          <strong>About ABHA</strong>
          <p>
            ABHA (Ayushman Bharat Health Account) is a 14-digit unique health identity
            issued under India's National Digital Health Mission (NDHM). It enables citizens
            to access their health records digitally across hospitals, clinics, and labs
            linked to the Ayushman Bharat Digital Health Mission ecosystem.
          </p>
        </div>
      </div>

      <!-- ABHA Card -->
      <p-card styleClass="abha-card-container">
        <div class="abha-card">
          <div class="abha-card-header">
            <div class="abha-logo">
              <i class="pi pi-heart-fill"></i>
              <span>Ayushman Bharat</span>
            </div>
            <div class="abha-badges">
              <p-tag value="Verified" severity="success" icon="pi pi-check-circle"></p-tag>
              <p-tag value="Active" severity="info"></p-tag>
            </div>
          </div>
          <div class="abha-card-body">
            <div class="abha-number-block">
              <span class="abha-label">ABHA Number</span>
              <span class="abha-number">{{ profile().abhaNumber }}</span>
            </div>
            <div class="abha-qr-block">
              <div class="qr-container">
                <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                  <!-- QR Code mock SVG -->
                  <rect width="120" height="120" fill="white"/>
                  <!-- Position detection patterns -->
                  <rect x="4" y="4" width="30" height="30" fill="none" stroke="#1a1a1a" stroke-width="4"/>
                  <rect x="10" y="10" width="18" height="18" fill="#1a1a1a"/>
                  <rect x="86" y="4" width="30" height="30" fill="none" stroke="#1a1a1a" stroke-width="4"/>
                  <rect x="92" y="10" width="18" height="18" fill="#1a1a1a"/>
                  <rect x="4" y="86" width="30" height="30" fill="none" stroke="#1a1a1a" stroke-width="4"/>
                  <rect x="10" y="92" width="18" height="18" fill="#1a1a1a"/>
                  <!-- Data modules mock -->
                  <rect x="40" y="4" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="50" y="4" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="66" y="4" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="40" y="14" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="56" y="14" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="72" y="14" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="46" y="24" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="62" y="24" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="76" y="24" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="4" y="40" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="14" y="40" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="28" y="40" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="40" y="40" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="54" y="40" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="68" y="40" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="82" y="40" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="96" y="40" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="110" y="40" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="4" y="54" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="22" y="54" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="36" y="54" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="50" y="54" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="64" y="54" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="78" y="54" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="92" y="54" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="110" y="54" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="10" y="68" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="24" y="68" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="44" y="68" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="60" y="68" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="76" y="68" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="88" y="68" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="104" y="68" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="40" y="86" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="54" y="86" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="68" y="86" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="82" y="86" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="96" y="86" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="110" y="86" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="40" y="96" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="56" y="96" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="70" y="96" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="86" y="96" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="100" y="96" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="46" y="106" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="60" y="106" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="74" y="106" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="90" y="106" width="6" height="6" fill="#1a1a1a"/>
                  <rect x="106" y="106" width="6" height="6" fill="#1a1a1a"/>
                </svg>
                <p class="qr-label">Scan QR to share ABHA</p>
              </div>
            </div>
          </div>
          <div class="abha-card-details">
            <div class="detail-row">
              <span class="detail-label"><i class="pi pi-user"></i> Name</span>
              <span class="detail-value">{{ profile().name }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label"><i class="pi pi-calendar"></i> Date of Birth</span>
              <span class="detail-value">{{ profile().dob }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label"><i class="pi pi-info-circle"></i> Gender</span>
              <span class="detail-value">{{ profile().gender }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label"><i class="pi pi-map-marker"></i> Address</span>
              <span class="detail-value">{{ profile().address }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label"><i class="pi pi-building"></i> Linked Facility</span>
              <span class="detail-value">{{ profile().linkedFacility }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label"><i class="pi pi-clock"></i> Created</span>
              <span class="detail-value">{{ profile().createdDate }}</span>
            </div>
          </div>
        </div>
      </p-card>

      <!-- Feature 14.4: ASHA Worker Proxy Mode Banner (visible when role is 'proxy') -->
      @if (currentRole() === 'proxy') {
        <div class="asha-banner">
          <div class="asha-banner-header">
            <i class="pi pi-id-card"></i>
            <div>
              <strong>ASHA Worker Mode</strong>
              <p>You are accessing this patient's records as an authorized ASHA health worker under the Ayushman Bharat programme.</p>
            </div>
          </div>
          <div class="asha-actions">
            <button pButton label="Register for Screening" icon="pi pi-user-plus" class="p-button-outlined p-button-sm asha-btn" (click)="ashaAction('Register for Screening')"></button>
            <button pButton label="Schedule Immunization" icon="pi pi-calendar-plus" class="p-button-outlined p-button-sm asha-btn" (click)="ashaAction('Schedule Immunization')"></button>
            <button pButton label="Submit Health Report" icon="pi pi-send" class="p-button-outlined p-button-sm asha-btn" (click)="ashaAction('Submit Health Report')"></button>
          </div>
        </div>
      }

      <p-divider></p-divider>

      <!-- Actions -->
      <p-card header="Actions" styleClass="actions-card">
        <div class="actions-grid">
          <button
            pButton
            label="Download ABHA Card"
            icon="pi pi-download"
            class="p-button-primary"
            (click)="downloadCard()"
          ></button>
          <button
            pButton
            label="Share QR Code"
            icon="pi pi-qrcode"
            class="p-button-outlined"
            (click)="shareQr()"
          ></button>
          <button
            pButton
            label="Link New Facility"
            icon="pi pi-plus"
            class="p-button-outlined"
            (click)="linkFacility()"
          ></button>
          <button
            pButton
            label="Update Profile"
            icon="pi pi-user-edit"
            class="p-button-outlined p-button-secondary"
            (click)="updateProfile()"
          ></button>
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- Linked Health Records -->
      <p-card header="Linked Health Facilities" styleClass="facilities-card">
        <div class="facilities-list">
          @for (facility of linkedFacilities(); track facility.name) {
            <div class="facility-item">
              <div class="facility-icon">
                <i class="pi pi-building"></i>
              </div>
              <div class="facility-info">
                <span class="facility-name">{{ facility.name }}</span>
                <span class="facility-type">{{ facility.type }}</span>
                <span class="facility-linked">Linked since {{ facility.linkedDate }}</span>
              </div>
              <p-tag [value]="facility.status" [severity]="facility.status === 'Active' ? 'success' : 'warning'"></p-tag>
            </div>
          }
        </div>
      </p-card>
    </div>
  `,
  styles: [`
    .abha-page { max-width: 1000px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .header-content { display: flex; align-items: center; gap: 1rem; }
    .header-icon { width: 52px; height: 52px; background: var(--orange-100); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .header-icon i { font-size: 1.5rem; color: var(--orange-600); }
    .header-content h1 { margin: 0; font-size: 1.6rem; }
    .header-content p { margin: 0.2rem 0 0; color: var(--text-color-secondary); font-size: 0.9rem; }
    .info-banner { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.25rem; background: var(--blue-50); border: 1px solid var(--blue-200); border-radius: var(--border-radius); margin-bottom: 1.5rem; font-size: 0.875rem; color: var(--blue-800); }
    .info-banner i { font-size: 1.1rem; color: var(--blue-500); flex-shrink: 0; margin-top: 0.1rem; }
    .info-banner strong { display: block; margin-bottom: 0.25rem; }
    .info-banner p { margin: 0; line-height: 1.55; }
    .abha-card { background: linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffcd00 100%); border-radius: 12px; padding: 1.5rem; color: white; }
    .abha-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .abha-logo { display: flex; align-items: center; gap: 0.5rem; font-weight: 700; font-size: 1rem; }
    .abha-logo i { font-size: 1.25rem; }
    .abha-badges { display: flex; gap: 0.5rem; }
    .abha-card-body { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
    .abha-number-block { display: flex; flex-direction: column; gap: 0.4rem; }
    .abha-label { font-size: 0.75rem; opacity: 0.85; letter-spacing: 0.05em; text-transform: uppercase; }
    .abha-number { font-size: 1.5rem; font-weight: 700; letter-spacing: 0.08em; font-family: monospace; }
    .qr-container { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; }
    .qr-container svg { border-radius: 8px; border: 4px solid white; }
    .qr-label { font-size: 0.7rem; opacity: 0.85; margin: 0; text-align: center; }
    .abha-card-details { background: rgba(255,255,255,0.15); border-radius: 8px; padding: 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; }
    .detail-row { display: flex; flex-direction: column; gap: 0.15rem; }
    .detail-label { font-size: 0.7rem; opacity: 0.8; display: flex; align-items: center; gap: 0.3rem; }
    .detail-label i { font-size: 0.65rem; }
    .detail-value { font-size: 0.85rem; font-weight: 500; }
    .actions-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
    .facilities-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .facility-item { display: flex; align-items: center; gap: 1rem; padding: 0.875rem 1rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); }
    .facility-icon { width: 40px; height: 40px; background: var(--orange-100); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .facility-icon i { color: var(--orange-600); }
    .facility-info { flex: 1; display: flex; flex-direction: column; gap: 0.15rem; }
    .facility-name { font-weight: 600; font-size: 0.9rem; }
    .facility-type { font-size: 0.8rem; color: var(--text-color-secondary); }
    .facility-linked { font-size: 0.75rem; color: var(--text-color-secondary); }
    .asha-banner { background: var(--orange-50); border: 1.5px solid var(--orange-300); border-radius: var(--border-radius); padding: 1rem 1.25rem; margin-bottom: 0; }
    .asha-banner-header { display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.875rem; }
    .asha-banner-header i { font-size: 1.3rem; color: var(--orange-600); flex-shrink: 0; margin-top: 0.1rem; }
    .asha-banner-header strong { display: block; font-size: 0.95rem; color: var(--orange-800); margin-bottom: 0.2rem; }
    .asha-banner-header p { margin: 0; font-size: 0.85rem; color: var(--orange-700); line-height: 1.5; }
    .asha-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; }
    .asha-btn { border-color: var(--orange-400) !important; color: var(--orange-700) !important; }
    .asha-btn:hover { background: var(--orange-100) !important; }
    @media (max-width: 640px) {
      .abha-card-body { flex-direction: column; gap: 1rem; }
      .abha-card-details { grid-template-columns: 1fr; }
      .actions-grid { grid-template-columns: 1fr; }
      .asha-actions { flex-direction: column; }
    }
  `]
})
export class AbhaHealthIdComponent {
  private readonly authService = inject(AuthService);
  readonly currentRole = this.authService.role;

  readonly profile = signal<AbhaProfile>({
    abhaNumber: '91-1234-5678-9012',
    name: 'Raj Kumar Sharma',
    dob: '15 March 1985',
    gender: 'Male',
    address: '42, Nehru Nagar, Mumbai, MH - 400001',
    linkedFacility: 'Apollo Hospital, Mumbai',
    status: 'Active',
    createdDate: '10 Jan 2023'
  });

  readonly linkedFacilities = signal([
    { name: 'Apollo Hospital, Mumbai', type: 'Multi-Specialty Hospital', linkedDate: 'Jan 2023', status: 'Active' },
    { name: 'GoHealth Primary Care Clinic', type: 'Primary Care', linkedDate: 'Mar 2023', status: 'Active' },
    { name: 'Aarogya Diagnostic Center', type: 'Diagnostic Lab', linkedDate: 'Jun 2023', status: 'Active' },
    { name: 'City Orthopaedic Centre', type: 'Specialty Clinic', linkedDate: 'Nov 2023', status: 'Inactive' }
  ]);

  downloadCard(): void {
    // Mock download action
  }

  shareQr(): void {
    // Mock share action
  }

  linkFacility(): void {
    // Mock link facility action
  }

  updateProfile(): void {
    // Mock update action
  }

  ashaAction(action: string): void {
    // Mock ASHA worker action
  }
}
