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
      <div class="digital-card">
        <div class="dc-gradient"></div>
        <div class="dc-content">
          <div class="dc-avatar" (click)="avatarInput.click()">
            @if (avatarUrl()) {
              <img [src]="avatarUrl()" alt="Avatar" />
            } @else {
              <span class="dc-initials">{{ userInitials }}</span>
            }
            <div class="dc-avatar-overlay"><i class="pi pi-camera"></i></div>
            <input #avatarInput type="file" accept="image/*" (change)="onAvatarChange($event)" style="display:none" />
          </div>
          <div class="dc-info">
            <h2 class="dc-name">{{ firstName }} {{ lastName }}</h2>
            <div class="dc-details">
              <span><i class="pi pi-id-card"></i> {{ patientId }}</span>
              <span><i class="pi pi-calendar"></i> DOB: {{ dob }}</span>
              <span><i class="pi pi-heart"></i> Blood Type: A+</span>
              <span><i class="pi pi-shield"></i> BlueCross PPO</span>
            </div>
          </div>
        </div>
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

    .digital-card { position: relative; border-radius: var(--border-radius); overflow: hidden; margin-bottom: 1.5rem; background: var(--surface-card); box-shadow: var(--card-shadow); }
    .dc-gradient { height: 80px; background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%); }
    .dc-content { display: flex; align-items: center; gap: 1.5rem; padding: 0 2rem 1.5rem; margin-top: -40px; }
    .dc-avatar { width: 80px; height: 80px; border-radius: 50%; background: var(--surface-card); border: 4px solid var(--surface-card); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; color: var(--primary-600); cursor: pointer; position: relative; overflow: hidden; flex-shrink: 0; }
    .dc-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .dc-avatar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; color: white; font-size: 1.25rem; }
    .dc-avatar:hover .dc-avatar-overlay { opacity: 1; }
    .dc-initials { background: var(--primary-50); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    .dc-info { flex: 1; padding-top: 2.5rem; }
    .dc-name { margin: 0 0 0.5rem; font-size: 1.5rem; }
    .dc-details { display: flex; flex-wrap: wrap; gap: 1.5rem; }
    .dc-details span { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-color-secondary); }

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
  dob = '05/15/1980';
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
