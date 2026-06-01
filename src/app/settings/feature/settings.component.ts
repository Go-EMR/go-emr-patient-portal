import { Component, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../auth/data-access';
import { TranslationService, SupportedLanguage, HealthLiteracyService, ReadingLevelService, ReadingLevel, InterpreterBookingService } from '../../shared/data-access';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, CardModule, ButtonModule, InputTextModule, ToggleSwitchModule, SelectModule, DividerModule, SelectButtonModule, TagModule],
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
          <div class="security-item"><div><h4>Two-Factor Authentication</h4><p>Add an extra layer of security</p></div><p-toggleswitch [(ngModel)]="mfaEnabled"></p-toggleswitch></div>
          <p-divider></p-divider>
          <div class="security-item"><div><h4>Change Password</h4><p>Last changed 90 days ago</p></div><button pButton label="Change" class="p-button-outlined"></button></div>
          <p-divider></p-divider>
          <div class="security-item"><div><h4>Trusted Devices</h4><p>2 devices registered</p></div><button pButton label="Manage" class="p-button-outlined"></button></div>
        </p-card>
        <p-card header="Notifications" styleClass="settings-card">
          <div class="notification-item"><div><h4>Email Notifications</h4><p>Receive updates via email</p></div><p-toggleswitch [(ngModel)]="emailNotifications"></p-toggleswitch></div>
          <p-divider></p-divider>
          <div class="notification-item"><div><h4>SMS Notifications</h4><p>Receive text message alerts</p></div><p-toggleswitch [(ngModel)]="smsNotifications"></p-toggleswitch></div>
          <p-divider></p-divider>
          <div class="notification-item"><div><h4>Appointment Reminders</h4><p>Get reminded before appointments</p></div><p-toggleswitch [(ngModel)]="appointmentReminders"></p-toggleswitch></div>
        </p-card>
        <p-card header="Preferences" styleClass="settings-card">
          <div class="field">
            <label for="lang-select">Language</label>
            <p-select
              inputId="lang-select"
              [options]="languages"
              [(ngModel)]="selectedLanguage"
              [style]="{width:'100%'}"
              (onChange)="onLanguageChange($event.value)">
            </p-select>
          </div>
          <div class="field"><label>Time Zone</label><p-select [options]="timezones" [(ngModel)]="selectedTimezone" [style]="{width:'100%'}"></p-select></div>
          <p-divider></p-divider>
          <div class="notification-item"><div><h4>Paperless Statements</h4><p>Receive statements electronically</p></div><p-toggleswitch [(ngModel)]="paperless"></p-toggleswitch></div>
        </p-card>

        <!-- Feature 9.8: Notification Preferences / SMS & Email Reminders Configurator -->
        <p-card header="Notification Preferences" styleClass="settings-card">
          <div class="notification-item">
            <div>
              <h4>Email Reminders</h4>
              <p>Receive appointment reminders by email</p>
            </div>
            <p-toggleswitch [(ngModel)]="emailReminders"></p-toggleswitch>
          </div>
          <p-divider></p-divider>
          <div class="notification-item">
            <div>
              <h4>SMS Reminders</h4>
              <p>Receive appointment reminders via text message</p>
            </div>
            <p-toggleswitch [(ngModel)]="smsReminders"></p-toggleswitch>
          </div>
          <p-divider></p-divider>
          <div class="field">
            <label for="reminder-timing">Reminder Timing</label>
            <p-select
              inputId="reminder-timing"
              [options]="reminderTimingOptions"
              [(ngModel)]="selectedReminderTiming"
              [style]="{width:'100%'}">
            </p-select>
          </div>
          <p-divider></p-divider>
          <div class="reminder-save-row">
            <button pButton
                    label="Save Preferences"
                    icon="pi pi-check"
                    (click)="saveNotificationPreferences()">
            </button>
            @if (reminderSaved()) {
              <span class="reminder-saved-msg">
                <i class="pi pi-check-circle"></i> Preferences saved!
              </span>
            }
          </div>
        </p-card>

        <!-- Feature 7.5 + 7.6: Accessibility & Health Literacy -->
        <p-card header="Accessibility &amp; Health Literacy" styleClass="settings-card">
          <div class="notification-item">
            <div>
              <h4>Simple View</h4>
              <p>Show plain-language explanations for medical terms</p>
            </div>
            <p-toggleswitch
              [(ngModel)]="simpleViewEnabled"
              (ngModelChange)="onSimpleViewChange($event)"
              inputId="simple-view-toggle"
              aria-label="Toggle simple view for medical terms">
            </p-toggleswitch>
          </div>
          <p-divider></p-divider>
          <div class="field">
            <label for="reading-level-select">Reading Level</label>
            <p class="field-desc">Adjust the complexity of health information displayed</p>
            <p-select
              inputId="reading-level-select"
              [options]="readingLevelOptions"
              [(ngModel)]="selectedReadingLevel"
              [style]="{width:'100%'}"
              (onChange)="onReadingLevelChange($event.value)"
              aria-label="Select reading level for health content">
            </p-select>
          </div>
        </p-card>

        <!-- Feature 15.3: Interpreter Services -->
        <p-card styleClass="settings-card interpreter-card">
          <ng-template pTemplate="header">
            <div class="interpreter-card-header">
              <div class="interpreter-header-icon">
                <i class="pi pi-language"></i>
              </div>
              <div>
                <h3 class="interpreter-card-title">Interpreter Services</h3>
                <p class="interpreter-card-subtitle">Free language interpretation for your appointments</p>
              </div>
            </div>
          </ng-template>

          <!-- Info banner -->
          <div class="interpreter-info-banner">
            <i class="pi pi-info-circle"></i>
            <span>Need an interpreter for your next appointment? We can arrange phone, video, or in-person interpretation at no cost to you.</span>
          </div>

          <div class="interpreter-form">
            <!-- Language selection -->
            <div class="field">
              <label for="interp-lang">Preferred Language</label>
              <p-select
                inputId="interp-lang"
                [options]="interpreterLanguages"
                [(ngModel)]="interpLanguage"
                placeholder="Select your language"
                [style]="{width:'100%'}"
                optionLabel="label"
                optionValue="value">
              </p-select>
            </div>

            <!-- Appointment selection -->
            <div class="field">
              <label for="interp-appt">Appointment</label>
              <p-select
                inputId="interp-appt"
                [options]="upcomingAppointments"
                [(ngModel)]="interpAppointment"
                placeholder="Select upcoming appointment"
                [style]="{width:'100%'}"
                optionLabel="label"
                optionValue="value">
              </p-select>
            </div>

            <!-- Interpreter type toggle -->
            <div class="field">
              <label>Interpreter Type</label>
              <p-selectButton
                [options]="interpreterTypeOptions"
                [(ngModel)]="interpType"
                optionLabel="label"
                optionValue="value">
              </p-selectButton>
            </div>

            <!-- Action row -->
            <div class="interpreter-action-row">
              <button
                pButton
                label="Request Interpreter"
                icon="pi pi-calendar-plus"
                class="p-button-primary"
                [disabled]="!canRequestInterpreter()"
                (click)="requestInterpreter()">
              </button>
              <a class="tis-link" (click)="navigateTo('/tis')" tabindex="0" role="link">
                <i class="pi pi-external-link"></i>
                TIS National (Australia)
              </a>
            </div>

            <!-- Success message -->
            @if (interpreterRequested()) {
              <div class="interpreter-success" role="alert" aria-live="polite">
                <i class="pi pi-check-circle"></i>
                <div>
                  <strong>Interpreter requested successfully!</strong>
                  <p>A {{ interpTypeLabel() }} interpreter for <strong>{{ interpLanguage }}</strong> has been requested for your appointment. You will receive a confirmation shortly.</p>
                </div>
              </div>
            }
          </div>

          <!-- Active bookings summary -->
          @if (interpreterBookingService.activeBookings().length > 0) {
            <p-divider></p-divider>
            <div class="active-interpreter-bookings">
              <h5 class="active-bookings-title">
                <i class="pi pi-clock"></i>
                Active Interpreter Bookings
              </h5>
              @for (booking of interpreterBookingService.activeBookings(); track booking.id) {
                <div class="active-booking-row">
                  <div class="active-booking-info">
                    <span class="active-booking-lang">{{ booking.language }}</span>
                    <span class="active-booking-detail">{{ booking.appointmentLabel }}</span>
                    <span class="active-booking-date">{{ booking.date }} at {{ booking.time }}</span>
                  </div>
                  <p-tag
                    [value]="booking.status === 'confirmed' ? 'Confirmed' : 'Pending'"
                    [severity]="booking.status === 'confirmed' ? 'success' : 'warn'">
                  </p-tag>
                </div>
              }
            </div>
          }
        </p-card>
      </div>

      <!-- Version Footer -->
      <div class="version-footer">
        <span>AuraHealth Patient Portal v1.0.0</span>
        <span>Built with Angular 19 &amp; PrimeNG</span>
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

    .field-desc { margin: 0 0 0.5rem; font-size: 0.8rem; color: var(--text-color-secondary); }
    .reminder-save-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .reminder-saved-msg { display: flex; align-items: center; gap: 0.4rem; font-size: 0.875rem; color: var(--green-600); font-weight: 500; }
    .reminder-saved-msg i { font-size: 1rem; }
    .version-footer { text-align: center; padding: 2rem 0 1rem; color: var(--text-color-secondary); font-size: 0.75rem; display: flex; justify-content: center; gap: 2rem; margin-top: 2rem; border-top: 1px solid var(--surface-border); }

    /* ── Interpreter Services Card ── */
    .interpreter-card-header { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.25rem; border-bottom: 1px solid var(--surface-border); }
    .interpreter-header-icon { width: 42px; height: 42px; background: linear-gradient(135deg, var(--purple-100), var(--purple-50)); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .interpreter-header-icon i { font-size: 1.25rem; color: var(--purple-600); }
    .interpreter-card-title { margin: 0; font-size: 1rem; font-weight: 600; }
    .interpreter-card-subtitle { margin: 0.15rem 0 0; font-size: 0.8rem; color: var(--text-color-secondary); }
    .interpreter-info-banner { display: flex; align-items: flex-start; gap: 0.625rem; padding: 0.75rem 1rem; background: var(--blue-50); border: 1px solid var(--blue-100); border-radius: var(--border-radius); margin-bottom: 1.25rem; font-size: 0.875rem; color: var(--blue-800); line-height: 1.5; }
    .interpreter-info-banner i { color: var(--blue-500); flex-shrink: 0; margin-top: 0.1rem; font-size: 1rem; }
    .interpreter-form { display: flex; flex-direction: column; gap: 1rem; }
    .interpreter-action-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; padding-top: 0.25rem; }
    .tis-link { display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; color: var(--purple-600); cursor: pointer; text-decoration: none; }
    .tis-link:hover { text-decoration: underline; }
    .tis-link i { font-size: 0.75rem; }
    .interpreter-success { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem; background: var(--green-50); border: 1px solid var(--green-100); border-radius: var(--border-radius); color: var(--green-800); margin-top: 0.5rem; }
    .interpreter-success i { font-size: 1.25rem; color: var(--green-600); flex-shrink: 0; margin-top: 0.1rem; }
    .interpreter-success strong { display: block; margin-bottom: 0.2rem; }
    .interpreter-success p { margin: 0; font-size: 0.875rem; line-height: 1.5; }
    .active-interpreter-bookings { display: flex; flex-direction: column; gap: 0.75rem; }
    .active-bookings-title { margin: 0 0 0.5rem; font-size: 0.875rem; font-weight: 600; display: flex; align-items: center; gap: 0.4rem; color: var(--text-color-secondary); }
    .active-bookings-title i { font-size: 0.875rem; }
    .active-booking-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.625rem 0.875rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); }
    .active-booking-info { display: flex; flex-direction: column; gap: 0.1rem; }
    .active-booking-lang { font-weight: 600; font-size: 0.875rem; }
    .active-booking-detail { font-size: 0.8rem; color: var(--text-color-secondary); }
    .active-booking-date { font-size: 0.78rem; color: var(--text-color-secondary); }

    @media (max-width: 1024px) { .settings-grid { grid-template-columns: 1fr; } .quick-links { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) { .quick-links { grid-template-columns: 1fr; } .dc-details { flex-direction: column; gap: 0.5rem; } }
  `]
})
export class SettingsComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private translationService = inject(TranslationService);
  readonly literacyService = inject(HealthLiteracyService);
  readonly readingLevelService = inject(ReadingLevelService);
  readonly interpreterBookingService = inject(InterpreterBookingService);

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
  selectedLanguage: SupportedLanguage = this.translationService.currentLanguage();
  selectedTimezone = 'America/New_York';

  languages = [
    { label: 'English', value: 'en' as SupportedLanguage },
    { label: 'Español (Spanish)', value: 'es' as SupportedLanguage },
    { label: 'हिंदी (Hindi)', value: 'hi' as SupportedLanguage },
    { label: 'தமிழ் (Tamil)', value: 'ta' as SupportedLanguage },
    { label: 'বাংলা (Bengali)', value: 'bn' as SupportedLanguage },
    { label: 'తెలుగు (Telugu)', value: 'te' as SupportedLanguage },
    { label: 'मराठी (Marathi)', value: 'mr' as SupportedLanguage },
    { label: 'ಕನ್ನಡ (Kannada)', value: 'kn' as SupportedLanguage },
    { label: 'Tiếng Việt (Vietnamese)', value: 'vi' as SupportedLanguage },
    { label: '中文 (Mandarin)', value: 'zh' as SupportedLanguage },
    { label: '廣東話 (Cantonese)', value: 'yue' as SupportedLanguage },
    { label: 'Tagalog (Filipino)', value: 'tl' as SupportedLanguage },
    { label: 'Kreyòl Ayisyen (French Creole)', value: 'ht' as SupportedLanguage },
    { label: 'العربية (Arabic)', value: 'ar' as SupportedLanguage },
    { label: 'Italiano (Italian)', value: 'it' as SupportedLanguage },
    { label: 'Ελληνικά (Greek)', value: 'el' as SupportedLanguage },
  ];

  timezones = [
    { label: 'Eastern Time', value: 'America/New_York' },
    { label: 'Central Time', value: 'America/Chicago' },
    { label: 'Pacific Time', value: 'America/Los_Angeles' }
  ];

  // Feature 7.5: Simple View
  simpleViewEnabled = this.literacyService.simpleView();

  // Feature 7.6: Reading Level
  selectedReadingLevel: ReadingLevel = this.readingLevelService.level();
  readonly readingLevelOptions = [
    { label: 'Standard', value: 'standard' as ReadingLevel },
    { label: 'Easy Read (8th grade)', value: 'easy' as ReadingLevel },
    { label: 'Very Simple (5th grade)', value: 'simple' as ReadingLevel },
  ];

  avatarUrl = signal<string | null>(null);

  // Feature 9.8: Notification Preferences / SMS & Email Reminders Configurator
  emailReminders = true;
  smsReminders = false;
  selectedReminderTiming = '1 day before';
  reminderSaved = signal(false);

  readonly reminderTimingOptions = [
    { label: '1 hour before', value: '1 hour before' },
    { label: '2 hours before', value: '2 hours before' },
    { label: '1 day before', value: '1 day before' },
    { label: '2 days before', value: '2 days before' },
    { label: '1 week before', value: '1 week before' }
  ];

  // Feature 15.3: Interpreter Services
  interpLanguage = '';
  interpAppointment = '';
  interpType: 'phone' | 'video' | 'on-site' = 'phone';
  interpreterRequested = signal(false);

  readonly interpreterLanguages = [
    { label: 'Arabic', value: 'Arabic' },
    { label: 'Bengali (বাংলা)', value: 'Bengali' },
    { label: 'Cantonese', value: 'Cantonese' },
    { label: 'French Creole (Kreyòl)', value: 'French Creole' },
    { label: 'Hindi (हिंदी)', value: 'Hindi' },
    { label: 'Korean', value: 'Korean' },
    { label: 'Mandarin (普通话)', value: 'Mandarin' },
    { label: 'Portuguese', value: 'Portuguese' },
    { label: 'Russian', value: 'Russian' },
    { label: 'Somali', value: 'Somali' },
    { label: 'Spanish (Español)', value: 'Spanish' },
    { label: 'Tagalog (Filipino)', value: 'Tagalog' },
    { label: 'Tamil (தமிழ்)', value: 'Tamil' },
    { label: 'Vietnamese (Tiếng Việt)', value: 'Vietnamese' },
  ];

  readonly upcomingAppointments = [
    { label: 'Annual Physical — Dr. Michael Chen (28 Feb)', value: 'APT-001' },
    { label: 'Cardiology Consultation — Dr. Sarah Johnson (05 Mar)', value: 'APT-002' },
    { label: 'Dermatology Follow-up — Dr. Lisa Patel (12 Mar)', value: 'APT-003' },
    { label: 'Telehealth — Dr. James Wilson (18 Mar)', value: 'APT-004' },
  ];

  readonly interpreterTypeOptions = [
    { label: 'Phone', value: 'phone' as const },
    { label: 'Video', value: 'video' as const },
    { label: 'In-Person', value: 'on-site' as const },
  ];

  get userInitials(): string {
    return `${this.firstName[0] || ''}${this.lastName[0] || ''}`;
  }

  canRequestInterpreter(): boolean {
    return !!(this.interpLanguage && this.interpAppointment);
  }

  interpTypeLabel(): string {
    const map: Record<string, string> = { phone: 'phone', video: 'video', 'on-site': 'in-person' };
    return map[this.interpType] ?? this.interpType;
  }

  requestInterpreter(): void {
    const appt = this.upcomingAppointments.find(a => a.value === this.interpAppointment);
    const [label, provider] = (appt?.label ?? '').split(' — ');
    this.interpreterBookingService.bookInterpreter({
      language: this.interpLanguage,
      appointmentId: this.interpAppointment,
      appointmentLabel: label ?? appt?.label ?? '',
      providerName: provider ?? 'AuraHealth Provider',
      date: 'Upcoming',
      time: 'TBD',
      type: this.interpType,
    });
    this.interpreterRequested.set(true);
    setTimeout(() => this.interpreterRequested.set(false), 5000);
    this.interpLanguage = '';
    this.interpAppointment = '';
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

  // Feature 7.4: Language change handler
  onLanguageChange(lang: SupportedLanguage): void {
    this.translationService.setLanguage(lang);
  }

  // Feature 7.5: Simple View toggle handler
  onSimpleViewChange(enabled: boolean): void {
    this.literacyService.setSimpleView(enabled);
  }

  // Feature 7.6: Reading Level change handler
  onReadingLevelChange(level: ReadingLevel): void {
    this.readingLevelService.setLevel(level);
  }

  // Feature 9.8: Save notification preferences
  saveNotificationPreferences(): void {
    console.log('Notification preferences saved:', {
      emailReminders: this.emailReminders,
      smsReminders: this.smsReminders,
      reminderTiming: this.selectedReminderTiming
    });
    this.reminderSaved.set(true);
    setTimeout(() => this.reminderSaved.set(false), 3000);
  }
}
