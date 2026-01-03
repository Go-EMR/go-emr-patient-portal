import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
    </div>
  `,
  styles: [`.settings-page{max-width:1200px;margin:0 auto}.page-header{margin-bottom:2rem}.page-header h1{margin:0}.page-header p{color:var(--text-color-secondary);margin:0.5rem 0 0}.settings-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1.5rem}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.field{display:flex;flex-direction:column;gap:0.5rem}.field.full{grid-column:span 2}.field label{font-weight:500}.field input{width:100%}.security-item,.notification-item{display:flex;justify-content:space-between;align-items:center}.security-item h4,.notification-item h4{margin:0}.security-item p,.notification-item p{margin:0.25rem 0 0;font-size:0.875rem;color:var(--text-color-secondary)}@media(max-width:1024px){.settings-grid{grid-template-columns:1fr}}`]
})
export class SettingsComponent {
  private authService = inject(AuthService);
  firstName = this.authService.user()?.firstName || '';
  lastName = this.authService.user()?.lastName || '';
  email = this.authService.user()?.email || '';
  phone = this.authService.user()?.phone || '';
  mfaEnabled = this.authService.user()?.mfaEnabled || false;
  emailNotifications = true;
  smsNotifications = true;
  appointmentReminders = true;
  paperless = true;
  selectedLanguage = 'en';
  selectedTimezone = 'America/New_York';
  languages = [{ label: 'English', value: 'en' }, { label: 'Spanish', value: 'es' }];
  timezones = [{ label: 'Eastern Time', value: 'America/New_York' }, { label: 'Central Time', value: 'America/Chicago' }, { label: 'Pacific Time', value: 'America/Los_Angeles' }];
}
