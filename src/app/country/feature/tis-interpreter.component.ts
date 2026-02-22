import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface TisBooking {
  id: string;
  language: string;
  date: string;
  time: string;
  type: string;
  appointment: string;
  provider: string;
  status: 'Confirmed' | 'Pending' | 'Completed';
}

@Component({
  selector: 'app-tis-interpreter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CardModule, ButtonModule, TagModule, DividerModule, SelectModule, SelectButtonModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="tis-page">
      <p-toast></p-toast>

      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-language"></i>
          </div>
          <div>
            <h1>TIS National Interpreter Service</h1>
            <p>Free interpreting services for medical appointments — available 24 hours, 7 days a week</p>
          </div>
        </div>
      </header>

      <!-- TIS National Info Banner -->
      <div class="tis-banner">
        <div class="tis-logo">
          <i class="pi pi-language"></i>
          <span>TIS National</span>
        </div>
        <div class="tis-info">
          <strong>TIS National provides free interpreting services for medical appointments</strong>
          <p>
            The Translating and Interpreting Service (TIS National) is funded by the Australian
            Government. If you do not speak English well, you can request an interpreter for your
            medical appointment at no cost. Available in over 160 languages.
          </p>
        </div>
      </div>

      <!-- Book an Interpreter -->
      <p-card header="Book an Interpreter" styleClass="booking-card">
        <div class="booking-form">
          <!-- Language Selection -->
          <div class="form-group">
            <label class="form-label">
              <i class="pi pi-language"></i>
              Select Language
            </label>
            <p-select
              [options]="languages"
              [(ngModel)]="selectedLanguage"
              optionLabel="label"
              optionValue="value"
              placeholder="Choose your language"
              [style]="{ width: '100%', maxWidth: '360px' }"
            ></p-select>
          </div>

          <!-- Appointment Date/Time -->
          <div class="form-group">
            <label class="form-label">
              <i class="pi pi-calendar"></i>
              Appointment Date &amp; Time
            </label>
            <div class="datetime-row">
              <input
                type="date"
                class="date-input"
                [(ngModel)]="appointmentDate"
                [min]="minDate"
              />
              <input
                type="time"
                class="time-input"
                [(ngModel)]="appointmentTime"
              />
            </div>
          </div>

          <!-- Interpreter Type -->
          <div class="form-group">
            <label class="form-label">
              <i class="pi pi-video"></i>
              Interpreting Type
            </label>
            <p-selectButton
              [options]="interpreterTypes"
              [(ngModel)]="selectedType"
              optionLabel="label"
              optionValue="value"
            ></p-selectButton>
          </div>

          <!-- Appointment Context -->
          <div class="form-group">
            <label class="form-label">
              <i class="pi pi-building"></i>
              Healthcare Provider / Appointment Type
            </label>
            <input
              type="text"
              class="text-input"
              placeholder="e.g. GoHealth Bondi Junction — GP Consultation"
              [(ngModel)]="appointmentContext"
            />
          </div>

          <div class="booking-actions">
            <button
              pButton
              label="Book TIS Interpreter"
              icon="pi pi-calendar-plus"
              class="p-button-primary"
              [disabled]="!canBook()"
              (click)="bookInterpreter()"
            ></button>
            <span class="booking-note">
              <i class="pi pi-info-circle"></i>
              Booking requests are typically confirmed within 2 business hours
            </span>
          </div>
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- Current Bookings -->
      <p-card header="Your Interpreter Bookings" styleClass="bookings-card">
        @if (bookings().length > 0) {
          <div class="bookings-list">
            @for (booking of bookings(); track booking.id) {
              <div class="booking-item">
                <div class="booking-icon">
                  <i [class]="'pi ' + getBookingIcon(booking.type)"></i>
                </div>
                <div class="booking-info">
                  <div class="booking-header-row">
                    <span class="booking-language">{{ booking.language }}</span>
                    <p-tag [value]="booking.status" [severity]="getBookingStatusSeverity(booking.status)"></p-tag>
                  </div>
                  <div class="booking-details">
                    <span class="booking-detail"><i class="pi pi-calendar"></i> {{ booking.date }}</span>
                    <span class="booking-detail"><i class="pi pi-clock"></i> {{ booking.time }}</span>
                    <span class="booking-detail"><i class="pi pi-video"></i> {{ booking.type }}</span>
                  </div>
                  <div class="booking-appointment">
                    <i class="pi pi-building"></i>
                    <span>{{ booking.appointment }} — {{ booking.provider }}</span>
                  </div>
                </div>
                <div class="booking-actions-col">
                  <button pButton label="Details" icon="pi pi-eye" class="p-button-text p-button-sm"></button>
                  <button pButton icon="pi pi-times" class="p-button-text p-button-sm p-button-danger" pTooltip="Cancel booking"></button>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-bookings">
            <i class="pi pi-language"></i>
            <p>No current interpreter bookings. Use the form above to book a TIS interpreter for your next appointment.</p>
          </div>
        }
      </p-card>

      <p-divider></p-divider>

      <!-- Supported Languages Info -->
      <p-card header="Popular Languages Available" styleClass="languages-card">
        <div class="lang-grid">
          @for (lang of popularLanguages; track lang) {
            <div class="lang-chip">
              <i class="pi pi-check-circle"></i>
              <span>{{ lang }}</span>
            </div>
          }
        </div>
        <div class="lang-note">
          <i class="pi pi-info-circle"></i>
          <span>TIS National supports 160+ languages. If your language is not listed, please call <strong>131 450</strong> to arrange an interpreter directly.</span>
        </div>
      </p-card>
    </div>
  `,
  styles: [`
    .tis-page { max-width: 900px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .header-content { display: flex; align-items: center; gap: 1rem; }
    .header-icon { width: 52px; height: 52px; background: var(--purple-100); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .header-icon i { font-size: 1.5rem; color: var(--purple-600); }
    .header-content h1 { margin: 0; font-size: 1.6rem; }
    .header-content p { margin: 0.2rem 0 0; color: var(--text-color-secondary); font-size: 0.9rem; }
    .tis-banner { display: flex; align-items: flex-start; gap: 1rem; padding: 1rem 1.25rem; background: linear-gradient(135deg, #6a1b9a 0%, #4527a0 100%); color: white; border-radius: var(--border-radius); margin-bottom: 1.5rem; }
    .tis-logo { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; flex-shrink: 0; }
    .tis-logo i { font-size: 1.75rem; }
    .tis-logo span { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
    .tis-info strong { display: block; margin-bottom: 0.4rem; font-size: 1rem; }
    .tis-info p { margin: 0; font-size: 0.875rem; line-height: 1.55; opacity: 0.9; }
    .booking-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-label { display: flex; align-items: center; gap: 0.4rem; font-weight: 500; font-size: 0.875rem; }
    .form-label i { font-size: 0.85rem; color: var(--purple-500); }
    .datetime-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .date-input, .time-input, .text-input { padding: 0.625rem 0.75rem; border: 1px solid var(--surface-border); border-radius: var(--border-radius); background: var(--surface-card); color: var(--text-color); font-family: inherit; font-size: 0.875rem; }
    .date-input { width: 200px; }
    .time-input { width: 130px; }
    .text-input { width: 100%; max-width: 500px; }
    .booking-actions { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; padding-top: 0.25rem; }
    .booking-note { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: var(--text-color-secondary); }
    .booking-note i { color: var(--purple-400); font-size: 0.875rem; }
    .bookings-list { display: flex; flex-direction: column; gap: 0.875rem; }
    .booking-item { display: flex; gap: 1rem; align-items: flex-start; padding: 0.875rem 1rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); }
    .booking-icon { width: 42px; height: 42px; background: var(--purple-100); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .booking-icon i { color: var(--purple-600); font-size: 1.1rem; }
    .booking-info { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; }
    .booking-header-row { display: flex; align-items: center; gap: 0.75rem; }
    .booking-language { font-weight: 600; font-size: 0.95rem; }
    .booking-details { display: flex; gap: 1rem; flex-wrap: wrap; }
    .booking-detail { display: flex; align-items: center; gap: 0.3rem; font-size: 0.82rem; color: var(--text-color-secondary); }
    .booking-detail i { font-size: 0.72rem; color: var(--purple-400); }
    .booking-appointment { display: flex; align-items: center; gap: 0.35rem; font-size: 0.82rem; color: var(--text-color-secondary); }
    .booking-appointment i { font-size: 0.72rem; }
    .booking-actions-col { display: flex; flex-direction: column; gap: 0.25rem; flex-shrink: 0; }
    .empty-bookings { display: flex; flex-direction: column; align-items: center; padding: 2rem 1rem; text-align: center; gap: 0.75rem; color: var(--text-color-secondary); }
    .empty-bookings i { font-size: 2rem; color: var(--surface-400); }
    .empty-bookings p { margin: 0; max-width: 400px; font-size: 0.875rem; }
    .lang-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.5rem; margin-bottom: 1rem; }
    .lang-chip { display: flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.75rem; background: var(--purple-50); border: 1px solid var(--purple-100); border-radius: 20px; font-size: 0.8rem; color: var(--purple-700); }
    .lang-chip i { font-size: 0.72rem; }
    .lang-note { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.82rem; color: var(--text-color-secondary); }
    .lang-note i { color: var(--purple-400); flex-shrink: 0; margin-top: 0.1rem; }
    @media (max-width: 640px) {
      .tis-banner { flex-direction: column; }
      .datetime-row { flex-direction: column; }
      .date-input, .time-input { width: 100%; }
      .booking-item { flex-direction: column; }
    }
  `]
})
export class TisInterpreterComponent {
  selectedLanguage = '';
  appointmentDate = '';
  appointmentTime = '';
  selectedType = 'Phone';
  appointmentContext = '';
  readonly minDate = new Date().toISOString().split('T')[0];

  private readonly messageService: MessageService;

  constructor(messageService: MessageService) {
    this.messageService = messageService;
  }

  readonly languages = [
    { label: 'Arabic (Egyptian)', value: 'Arabic (Egyptian)' },
    { label: 'Arabic (Modern Standard)', value: 'Arabic (Modern Standard)' },
    { label: 'Cantonese', value: 'Cantonese' },
    { label: 'Croatian', value: 'Croatian' },
    { label: 'Dari', value: 'Dari' },
    { label: 'Dinka', value: 'Dinka' },
    { label: 'Greek', value: 'Greek' },
    { label: 'Hindi', value: 'Hindi' },
    { label: 'Indonesian', value: 'Indonesian' },
    { label: 'Italian', value: 'Italian' },
    { label: 'Karen', value: 'Karen' },
    { label: 'Khmer (Cambodian)', value: 'Khmer (Cambodian)' },
    { label: 'Korean', value: 'Korean' },
    { label: 'Macedonian', value: 'Macedonian' },
    { label: 'Mandarin', value: 'Mandarin' },
    { label: 'Nepali', value: 'Nepali' },
    { label: 'Persian (Farsi)', value: 'Persian (Farsi)' },
    { label: 'Punjabi', value: 'Punjabi' },
    { label: 'Serbian', value: 'Serbian' },
    { label: 'Somali', value: 'Somali' },
    { label: 'Spanish', value: 'Spanish' },
    { label: 'Tamil', value: 'Tamil' },
    { label: 'Turkish', value: 'Turkish' },
    { label: 'Vietnamese', value: 'Vietnamese' }
  ];

  readonly interpreterTypes = [
    { label: 'Phone', value: 'Phone' },
    { label: 'Video', value: 'Video' },
    { label: 'On-site', value: 'On-site' }
  ];

  readonly popularLanguages = [
    'Mandarin', 'Cantonese', 'Arabic', 'Vietnamese', 'Hindi',
    'Punjabi', 'Italian', 'Greek', 'Spanish', 'Korean',
    'Tamil', 'Persian (Farsi)', 'Turkish', 'Indonesian', 'Nepali',
    'Somali', 'Dari', 'Serbian', 'Khmer', 'Macedonian'
  ];

  readonly bookings = signal<TisBooking[]>([
    {
      id: 'TIS-001',
      language: 'Mandarin',
      date: '25 Feb 2026',
      time: '10:30 AM',
      type: 'Phone',
      appointment: 'GP Consultation',
      provider: 'GoHealth Bondi Junction',
      status: 'Confirmed'
    },
    {
      id: 'TIS-002',
      language: 'Arabic (Egyptian)',
      date: '10 Feb 2026',
      time: '02:00 PM',
      type: 'Video',
      appointment: 'Cardiology Consultation',
      provider: 'Sydney Heart Specialists',
      status: 'Completed'
    }
  ]);

  canBook(): boolean {
    return !!(this.selectedLanguage && this.appointmentDate && this.appointmentTime);
  }

  bookInterpreter(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Interpreter Booked',
      detail: `A ${this.selectedType} interpreter for ${this.selectedLanguage} has been requested for ${this.appointmentDate} at ${this.appointmentTime}. Confirmation will be sent shortly.`
    });
    this.selectedLanguage = '';
    this.appointmentDate = '';
    this.appointmentTime = '';
    this.appointmentContext = '';
  }

  getBookingIcon(type: string): string {
    const icons: Record<string, string> = {
      Phone: 'pi-phone',
      Video: 'pi-video',
      'On-site': 'pi-building'
    };
    return icons[type] ?? 'pi-language';
  }

  getBookingStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
      Confirmed: 'success',
      Pending: 'warn',
      Completed: 'info'
    };
    return map[status] ?? 'info';
  }
}
