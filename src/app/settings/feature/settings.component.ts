import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DropdownModule } from 'primeng/dropdown';
import { DividerModule } from 'primeng/divider';
import { AuthService } from '../../auth/data-access';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, InputTextModule, InputSwitchModule, DropdownModule, DividerModule],
  template: `
    <div class="settings-page">
      <header class="page-header"><h1>Settings</h1><p>Manage your account and preferences</p></header>

      <!-- Patient Digital Card -->
      <div class="patient-card-wrapper">
        <div class="patient-card">
          <!-- Ocean section (top) -->
          <div class="pc-ocean">
            <div class="pc-bubble" style="top:8px;left:8%;width:5px;height:5px;background:rgba(200,245,240,0.42);border:1px solid rgba(255,255,255,0.55);animation-duration:3.4s;"></div>
            <div class="pc-bubble" style="top:6px;left:32%;width:7px;height:7px;background:rgba(200,245,240,0.28);border:1.5px solid rgba(255,255,255,0.42);animation-duration:4.0s;animation-delay:0.9s;"></div>
            <div class="pc-bubble" style="top:9px;left:60%;width:5px;height:5px;background:rgba(200,245,240,0.38);border:1px solid rgba(255,255,255,0.5);animation-duration:3.1s;animation-delay:0.5s;"></div>
            <div class="pc-bubble" style="top:7px;left:83%;width:6px;height:6px;background:rgba(200,245,240,0.34);border:1px solid rgba(255,255,255,0.48);animation-duration:2.8s;animation-delay:1.3s;"></div>
            <div class="pc-bubble" style="top:26px;left:17%;width:8px;height:8px;background:rgba(160,230,225,0.25);border:1.5px solid rgba(255,255,255,0.38);animation-duration:3.7s;animation-delay:0.4s;"></div>
            <div class="pc-bubble" style="top:24px;left:48%;width:5px;height:5px;background:rgba(160,230,225,0.36);border:1px solid rgba(255,255,255,0.48);animation-duration:2.6s;animation-delay:1.7s;"></div>
            <div class="pc-bubble" style="top:27px;left:74%;width:9px;height:9px;background:rgba(160,230,225,0.2);border:1.5px solid rgba(255,255,255,0.35);animation-duration:4.2s;animation-delay:0.7s;"></div>
            <div class="pc-bubble" style="top:25px;left:89%;width:4px;height:4px;background:rgba(160,230,225,0.44);border:1px solid rgba(255,255,255,0.56);animation-duration:2.9s;animation-delay:1.1s;"></div>
            <!-- GoEMR brand + NFC -->
            <div class="pc-brand-row">
              <div class="pc-brand-left">
                <div class="pc-brand-icon"><i class="pi pi-building" style="font-size:12px;color:white;"></i></div>
                <div>
                  <div class="pc-brand-title">GoEMR</div>
                  <div class="pc-brand-sub">PATIENT PORTAL</div>
                </div>
              </div>
              <div class="pc-nfc">
                <div class="pc-nfc-arc pc-nfc-1"></div>
                <div class="pc-nfc-arc pc-nfc-2"></div>
                <div class="pc-nfc-arc pc-nfc-3"></div>
              </div>
            </div>
            <!-- Avatar + patient info -->
            <div class="pc-profile-row">
              <div class="pc-avatar">
                @if (avatarUrl()) {
                  <img [src]="avatarUrl()" alt="Avatar" />
                } @else {
                  <i class="pi pi-user" style="font-size:24px;color:white;"></i>
                }
              </div>
              <div>
                <div class="pc-fullname">{{ firstName }} {{ lastName }}</div>
                <div class="pc-demographics">{{ gender }} &middot; {{ dob }}</div>
                <div class="pc-blood-badge">{{ bloodType }} Blood</div>
              </div>
            </div>
          </div>
          <!-- Wave transition -->
          <div class="pc-wave-zone">
            <svg viewBox="0 0 300 42" preserveAspectRatio="none" class="pc-wave-layer">
              <path d="M0,8 C40,0 80,18 128,8 C172,0 215,16 260,6 C276,2 290,8 300,6 L300,42 L0,42 Z" fill="#5EDFD4" opacity="0.5"/>
            </svg>
            <svg viewBox="0 0 300 42" preserveAspectRatio="none" class="pc-wave-layer">
              <path d="M0,16 C36,4 78,28 125,14 C170,2 218,24 264,12 C280,7 292,14 300,12 L300,30 L0,30 Z" fill="rgba(255,255,255,0.94)"/>
            </svg>
            <svg viewBox="0 0 300 42" preserveAspectRatio="none" class="pc-wave-layer">
              <path d="M0,24 C44,14 92,36 152,22 C202,10 254,32 300,22 L300,42 L0,42 Z" fill="#E8C87A"/>
            </svg>
          </div>
          <!-- Sand section (bottom) -->
          <div class="pc-sand">
            <div class="pc-sand-dot" style="top:14px;left:7%;"></div>
            <div class="pc-sand-dot" style="top:10px;left:21%;width:4px;height:4px;"></div>
            <div class="pc-sand-dot" style="top:16px;left:37%;"></div>
            <div class="pc-sand-dot" style="top:12px;left:53%;width:5px;height:5px;opacity:0.18;"></div>
            <div class="pc-sand-dot" style="top:15px;left:69%;"></div>
            <div class="pc-sand-dot" style="top:11px;left:85%;width:4px;height:4px;"></div>
            <div class="pc-details-grid">
              <div class="pc-detail">
                <div class="pc-detail-label">Patient ID</div>
                <div class="pc-detail-value">{{ patientId }}</div>
              </div>
              <div class="pc-detail" style="text-align:center;">
                <div class="pc-detail-label">Insurance</div>
                <div class="pc-detail-value">{{ insurance }}</div>
              </div>
              <div class="pc-detail" style="text-align:right;">
                <div class="pc-detail-label">Valid Until</div>
                <div class="pc-detail-value">{{ validUntil }}</div>
              </div>
            </div>
            <div class="pc-hipaa-footer">GoEMR &middot; HIPAA SECURED</div>
          </div>
        </div>
        <div class="pc-shadow-blur"></div>
      </div>

      <!-- Quick Navigation Links -->
      <div class="quick-links">
        <div class="quick-link" (click)="navigateTo('/emergency-contacts')">
          <i class="pi pi-phone"></i>
          <span>Emergency Contacts</span>
          <i class="pi pi-angle-right"></i>
        </div>
        <div class="quick-link" (click)="navigateTo('/consent-management')">
          <i class="pi pi-check-circle"></i>
          <span>Consent Management</span>
          <i class="pi pi-angle-right"></i>
        </div>
        <div class="quick-link" (click)="navigateTo('/data-management')">
          <i class="pi pi-database"></i>
          <span>Data Management</span>
          <i class="pi pi-angle-right"></i>
        </div>
        <div class="quick-link" (click)="navigateTo('/privacy-policy')">
          <i class="pi pi-lock"></i>
          <span>Privacy Policy</span>
          <i class="pi pi-angle-right"></i>
        </div>
      </div>

      <div class="settings-grid">
        <p-card header="Profile Information" styleClass="settings-card">
          <div class="form-grid">
            <div class="field"><label>First Name</label><input type="text" pInputText [(ngModel)]="firstName" /></div>
            <div class="field"><label>Last Name</label><input type="text" pInputText [(ngModel)]="lastName" /></div>
            <div class="field full"><label>Email</label><input type="email" pInputText [(ngModel)]="email" /></div>
            <div class="field full"><label>Phone</label><input type="tel" pInputText [(ngModel)]="phone" /></div>
          </div>
          <p-divider></p-divider>
          <button pButton label="Save Changes" icon="pi pi-check"></button>
        </p-card>
        <p-card header="Security" styleClass="settings-card">
          <div class="security-item"><div><h4>Two-Factor Authentication</h4><p>Add an extra layer of security</p></div><p-inputSwitch [(ngModel)]="mfaEnabled"></p-inputSwitch></div>
          <p-divider></p-divider>
          <div class="security-item"><div><h4>Change Password</h4><p>Last changed 90 days ago</p></div><button pButton label="Change" class="p-button-outlined"></button></div>
          <p-divider></p-divider>
          <div class="security-item"><div><h4>Trusted Devices</h4><p>2 devices registered</p></div><button pButton label="Manage" class="p-button-outlined"></button></div>
        </p-card>
        <p-card header="Notifications" styleClass="settings-card">
          <div class="notification-item"><div><h4>Email Notifications</h4><p>Receive updates via email</p></div><p-inputSwitch [(ngModel)]="emailNotifications"></p-inputSwitch></div>
          <p-divider></p-divider>
          <div class="notification-item"><div><h4>SMS Notifications</h4><p>Receive text message alerts</p></div><p-inputSwitch [(ngModel)]="smsNotifications"></p-inputSwitch></div>
          <p-divider></p-divider>
          <div class="notification-item"><div><h4>Appointment Reminders</h4><p>Get reminded before appointments</p></div><p-inputSwitch [(ngModel)]="appointmentReminders"></p-inputSwitch></div>
        </p-card>
        <p-card header="Preferences" styleClass="settings-card">
          <div class="field"><label>Language</label><p-dropdown [options]="languages" [(ngModel)]="selectedLanguage" [style]="{width:'100%'}"></p-dropdown></div>
          <div class="field"><label>Time Zone</label><p-dropdown [options]="timezones" [(ngModel)]="selectedTimezone" [style]="{width:'100%'}"></p-dropdown></div>
          <p-divider></p-divider>
          <div class="notification-item"><div><h4>Paperless Statements</h4><p>Receive statements electronically</p></div><p-inputSwitch [(ngModel)]="paperless"></p-inputSwitch></div>
        </p-card>
      </div>

      <!-- Version Footer -->
      <div class="version-footer">
        <span>GoHealth Patient Portal v1.0.0</span>
        <span>Built with Angular 19 & PrimeNG</span>
      </div>
    </div>
  `,
  styles: [`
    .settings-page { max-width: 1200px; margin: 0 auto; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { margin: 0; }
    .page-header p { color: var(--text-color-secondary); margin: 0.5rem 0 0; }

    /* Patient Digital Card — CR80 standard (85.6×53.98mm ≈ 1.586:1) */
    .patient-card-wrapper { margin-bottom: 1.5rem; max-width: 420px; }
    .patient-card { border-radius: 14px; position: relative; overflow: hidden; box-shadow: 0 10px 28px rgba(30,139,139,0.30), 0 2px 8px rgba(0,0,0,0.14); aspect-ratio: 85.6 / 53.98; width: 100%; }
    .pc-ocean { position: absolute; top: 0; left: 0; right: 0; height: 56%; background: linear-gradient(180deg, #0A4040 0%, #0E6060 25%, #1A9090 55%, #2EC4B6 82%, #5EDFD4 100%); }
    .pc-bubble { position: absolute; border-radius: 50%; animation: pcbubble ease-in-out infinite; }
    @keyframes pcbubble { 0%,100%{transform:translateY(0) scale(1);opacity:0.6;} 40%{transform:translateY(-6px) scale(1.05);opacity:1;} 70%{transform:translateY(-3px) scale(0.97);opacity:0.8;} }
    .pc-brand-row { position: absolute; top: 0; left: 0; right: 0; padding: 12px 14px 0; z-index: 5; display: flex; justify-content: space-between; align-items: flex-start; }
    .pc-brand-left { display: flex; align-items: center; gap: 7px; }
    .pc-brand-icon { width: 26px; height: 26px; background: rgba(255,255,255,0.2); border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 13px; border: 1px solid rgba(255,255,255,0.3); }
    .pc-brand-title { font-family: 'Nunito', sans-serif; font-size: 11px; font-weight: 900; color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.35); }
    .pc-brand-sub { font-size: 7.5px; color: rgba(255,255,255,0.7); letter-spacing: 0.8px; font-weight: 600; }
    .pc-nfc { display: flex; flex-direction: column; gap: 2px; align-items: flex-end; opacity: 0.65; margin-top: 3px; }
    .pc-nfc-arc { border: 2px solid white; border-left: none; }
    .pc-nfc-1 { width: 14px; height: 9px; border-radius: 0 5px 5px 0; }
    .pc-nfc-2 { width: 10px; height: 7px; border-radius: 0 3px 3px 0; }
    .pc-nfc-3 { width: 6px; height: 4px; border-radius: 0 2px 2px 0; border-width: 1.5px; }
    .pc-profile-row { position: absolute; bottom: 14px; left: 0; right: 0; padding: 0 14px; z-index: 5; display: flex; align-items: center; gap: 12px; }
    .pc-avatar { width: 52px; height: 52px; border-radius: 50%; background: rgba(255,255,255,0.22); border: 2.5px solid rgba(255,255,255,0.65); display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 12px rgba(0,0,0,0.22); overflow: hidden; flex-shrink: 0; }
    .pc-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .pc-fullname { font-family: 'Nunito', sans-serif; font-size: 17px; font-weight: 900; color: white; line-height: 1.1; text-shadow: 0 2px 5px rgba(0,0,0,0.35); }
    .pc-demographics { font-size: 10.5px; color: rgba(255,255,255,0.85); margin-top: 2px; font-weight: 500; text-shadow: 0 1px 3px rgba(0,0,0,0.25); }
    .pc-blood-badge { display: inline-block; margin-top: 5px; background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.45); border-radius: 100px; padding: 2px 9px; font-size: 9.5px; font-weight: 800; color: white; }
    .pc-wave-zone { position: absolute; top: 48%; left: 0; right: 0; height: 16%; z-index: 4; }
    .pc-wave-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    .pc-sand { position: absolute; bottom: 0; left: 0; right: 0; height: 40%; background: linear-gradient(180deg, #E8C87A 0%, #D8B655 30%, #C9A840 65%, #D2AF58 100%); }
    .pc-sand-dot { position: absolute; width: 3px; height: 3px; border-radius: 50%; background: rgba(140,90,0,0.24); }
    .pc-details-grid { position: absolute; top: 0; left: 0; right: 0; bottom: 0; padding: 20px 14px 10px; z-index: 5; display: flex; justify-content: space-between; align-items: flex-start; }
    .pc-detail-label { font-size: 7.5px; color: rgba(70,38,0,0.6); letter-spacing: 0.9px; text-transform: uppercase; font-weight: 800; margin-bottom: 2px; }
    .pc-detail-value { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: #3A1E00; font-weight: 700; letter-spacing: 0.2px; }
    .pc-hipaa-footer { position: absolute; bottom: 8px; left: 14px; right: 14px; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 7.5px; color: rgba(70,38,0,0.38); letter-spacing: 0.6px; z-index: 5; }
    .pc-shadow-blur { height: 6px; margin: 0 14px; background: rgba(30,139,139,0.16); border-radius: 0 0 14px 14px; filter: blur(5px); }

    .quick-links { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .quick-link { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.25rem; background: var(--surface-card); border-radius: var(--border-radius); box-shadow: var(--card-shadow); cursor: pointer; transition: all 0.15s; }
    .quick-link:hover { background: var(--primary-50); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .quick-link i:first-child { font-size: 1.25rem; color: var(--primary-600); }
    .quick-link span { flex: 1; font-weight: 500; }
    .quick-link i:last-child { color: var(--text-color-secondary); }

    .settings-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 0.5rem; }
    .field.full { grid-column: span 2; }
    .field label { font-weight: 500; }
    .field input { width: 100%; }
    .security-item, .notification-item { display: flex; justify-content: space-between; align-items: center; }
    .security-item h4, .notification-item h4 { margin: 0; }
    .security-item p, .notification-item p { margin: 0.25rem 0 0; font-size: 0.875rem; color: var(--text-color-secondary); }

    .version-footer { text-align: center; padding: 2rem 0 1rem; color: var(--text-color-secondary); font-size: 0.75rem; display: flex; justify-content: center; gap: 2rem; margin-top: 2rem; border-top: 1px solid var(--surface-border); }

    @media (max-width: 1024px) { .settings-grid { grid-template-columns: 1fr; } .quick-links { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) { .quick-links { grid-template-columns: 1fr; } .dc-details { flex-direction: column; gap: 0.5rem; } }
  `]
})
export class SettingsComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  firstName = this.authService.user()?.firstName || '';
  lastName = this.authService.user()?.lastName || '';
  email = this.authService.user()?.email || '';
  phone = this.authService.user()?.phone || '';
  patientId = this.authService.user()?.patientId || 'PAT-001';
  dob = '14 Mar 1990';
  gender = 'Female';
  bloodType = 'O+';
  insurance = 'Apollo Health';
  validUntil = '12/2027';
  mfaEnabled = this.authService.user()?.mfaEnabled || false;
  emailNotifications = true;
  smsNotifications = true;
  appointmentReminders = true;
  paperless = true;
  selectedLanguage = 'en';
  selectedTimezone = 'America/New_York';
  languages = [{ label: 'English', value: 'en' }, { label: 'Spanish', value: 'es' }];
  timezones = [{ label: 'Eastern Time', value: 'America/New_York' }, { label: 'Central Time', value: 'America/Chicago' }, { label: 'Pacific Time', value: 'America/Los_Angeles' }];

  avatarUrl = signal<string | null>(null);

  get userInitials(): string {
    return `${this.firstName[0] || ''}${this.lastName[0] || ''}`;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.avatarUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(input.files[0]);
    }
  }
}
