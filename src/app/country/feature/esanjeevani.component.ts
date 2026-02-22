import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface ConsultationSlot {
  id: number;
  doctor: string;
  qualification: string;
  specialty: string;
  date: string;
  time: string;
  language: string;
  isAvailable: boolean;
}

interface PastConsultation {
  id: string;
  date: string;
  doctor: string;
  specialty: string;
  summary: string;
  prescription: string;
}

@Component({
  selector: 'app-esanjeevani',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule, ButtonModule, TagModule, DividerModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="esanjeevani-page">
      <p-toast></p-toast>

      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-video"></i>
          </div>
          <div>
            <h1>eSanjeevani Telemedicine</h1>
            <p>Government of India's National Telemedicine Platform for free OPD consultations</p>
          </div>
        </div>
      </header>

      <!-- Connection Status Card -->
      <div class="connection-card">
        <div class="connection-status">
          <div class="status-indicator">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="status-info">
            <span class="status-title">Connected to eSanjeevani OPD Platform</span>
            <span class="status-detail">Patient ID: ESJ-MH-2024-0081234 | State: Maharashtra</span>
            <span class="status-sync">Platform status: Operational | Avg. wait: 12 minutes</span>
          </div>
        </div>
        <div class="connection-meta">
          <p-tag value="Free Service" severity="success" icon="pi pi-check"></p-tag>
        </div>
      </div>

      <!-- Free Service Banner -->
      <div class="free-banner">
        <i class="pi pi-star-fill"></i>
        <div>
          <strong>eSanjeevani is a free telemedicine service by the Government of India</strong>
          <p>
            All consultations on eSanjeevani OPD are provided at no cost to citizens. Government
            doctors across all specialties are available for video or phone consultations. A
            prescription is generated at the end of each consultation and can be redeemed at Jan
            Aushadhi Kendras.
          </p>
        </div>
      </div>

      <!-- Available Slots -->
      <p-card header="Available Consultation Slots" styleClass="slots-card">
        <div class="slots-list">
          @for (slot of availableSlots(); track slot.id) {
            <div class="slot-card">
              <div class="slot-avatar">
                <i class="pi pi-user-md"></i>
              </div>
              <div class="slot-info">
                <div class="slot-name-row">
                  <span class="slot-doctor">{{ slot.doctor }}</span>
                  <span class="slot-qual">{{ slot.qualification }}</span>
                </div>
                <span class="slot-specialty">{{ slot.specialty }}</span>
                <div class="slot-schedule">
                  <span class="slot-time"><i class="pi pi-calendar"></i> {{ slot.date }}</span>
                  <span class="slot-time"><i class="pi pi-clock"></i> {{ slot.time }}</span>
                  <span class="slot-time"><i class="pi pi-language"></i> {{ slot.language }}</span>
                </div>
              </div>
              <div class="slot-action">
                @if (slot.isAvailable) {
                  <p-tag value="Available" severity="success"></p-tag>
                  <button
                    pButton
                    label="Book"
                    icon="pi pi-calendar-plus"
                    class="p-button-sm p-button-primary"
                    (click)="bookSlot(slot)"
                  ></button>
                } @else {
                  <p-tag value="Full" severity="danger"></p-tag>
                }
              </div>
            </div>
          }
        </div>
        <div class="refresh-row">
          <button pButton label="Refresh Available Slots" icon="pi pi-refresh" class="p-button-outlined p-button-sm" (click)="refreshSlots()"></button>
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- Past Consultations -->
      <p-card header="Past eSanjeevani Consultations" styleClass="past-card">
        <div class="past-list">
          @for (consult of pastConsultations(); track consult.id) {
            <div class="past-item">
              <div class="past-icon">
                <i class="pi pi-video"></i>
              </div>
              <div class="past-info">
                <div class="past-header-row">
                  <span class="past-date">{{ consult.date }}</span>
                  <p-tag value="Completed" severity="success"></p-tag>
                </div>
                <span class="past-doctor">{{ consult.doctor }} — {{ consult.specialty }}</span>
                <p class="past-summary">{{ consult.summary }}</p>
                <div class="past-prescription">
                  <i class="pi pi-file-edit"></i>
                  <span>Prescription: {{ consult.prescription }}</span>
                </div>
              </div>
              <div class="past-actions">
                <button pButton label="Download Summary" icon="pi pi-download" class="p-button-outlined p-button-sm"></button>
              </div>
            </div>
          }
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- How It Works -->
      <p-card header="How eSanjeevani Works" styleClass="how-card">
        <div class="steps-list">
          <div class="step-item">
            <div class="step-num">1</div>
            <div class="step-desc">
              <strong>Register</strong>
              <span>Connect your ABHA ID to access eSanjeevani OPD services for free.</span>
            </div>
          </div>
          <div class="step-item">
            <div class="step-num">2</div>
            <div class="step-desc">
              <strong>Book a Slot</strong>
              <span>Choose a government doctor by specialty, date, and preferred language.</span>
            </div>
          </div>
          <div class="step-item">
            <div class="step-num">3</div>
            <div class="step-desc">
              <strong>Consult Online</strong>
              <span>Join via video call at the scheduled time — no travel required.</span>
            </div>
          </div>
          <div class="step-item">
            <div class="step-num">4</div>
            <div class="step-desc">
              <strong>Get Prescription</strong>
              <span>Receive a digitally signed e-prescription, redeemable at Jan Aushadhi Kendras.</span>
            </div>
          </div>
        </div>
        <div class="external-link-row">
          <a pButton label="Visit eSanjeevani Portal" icon="pi pi-external-link" class="p-button-outlined" href="https://esanjeevani.mohfw.gov.in" target="_blank" rel="noopener noreferrer"></a>
        </div>
      </p-card>
    </div>
  `,
  styles: [`
    .esanjeevani-page { max-width: 1000px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .header-content { display: flex; align-items: center; gap: 1rem; }
    .header-icon { width: 52px; height: 52px; background: var(--teal-100); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .header-icon i { font-size: 1.5rem; color: var(--teal-600); }
    .header-content h1 { margin: 0; font-size: 1.6rem; }
    .header-content p { margin: 0.2rem 0 0; color: var(--text-color-secondary); font-size: 0.9rem; }
    .connection-card { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; background: var(--green-50); border: 1px solid var(--green-200); border-radius: var(--border-radius); margin-bottom: 1.25rem; }
    .connection-status { display: flex; align-items: center; gap: 0.875rem; }
    .status-indicator { width: 40px; height: 40px; border-radius: 50%; background: var(--green-100); color: var(--green-600); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .status-indicator i { font-size: 1.25rem; }
    .status-info { display: flex; flex-direction: column; gap: 0.2rem; }
    .status-title { font-weight: 600; color: var(--green-700); font-size: 0.95rem; }
    .status-detail { font-size: 0.8rem; color: var(--text-color-secondary); }
    .status-sync { font-size: 0.8rem; color: var(--text-color-secondary); }
    .free-banner { display: flex; align-items: flex-start; gap: 0.875rem; padding: 1rem 1.25rem; background: var(--teal-50); border: 1px solid var(--teal-200); border-radius: var(--border-radius); margin-bottom: 1.5rem; font-size: 0.875rem; color: var(--teal-800); }
    .free-banner i { font-size: 1.25rem; color: var(--teal-600); flex-shrink: 0; margin-top: 0.1rem; }
    .free-banner strong { display: block; margin-bottom: 0.3rem; }
    .free-banner p { margin: 0; line-height: 1.55; }
    .slots-list { display: flex; flex-direction: column; gap: 0.875rem; }
    .slot-card { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); }
    .slot-avatar { width: 48px; height: 48px; background: var(--teal-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .slot-avatar i { font-size: 1.3rem; color: var(--teal-600); }
    .slot-info { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
    .slot-name-row { display: flex; align-items: baseline; gap: 0.5rem; }
    .slot-doctor { font-weight: 600; font-size: 0.95rem; }
    .slot-qual { font-size: 0.75rem; color: var(--text-color-secondary); }
    .slot-specialty { font-size: 0.85rem; color: var(--teal-700); font-weight: 500; }
    .slot-schedule { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.25rem; }
    .slot-time { display: flex; align-items: center; gap: 0.3rem; font-size: 0.8rem; color: var(--text-color-secondary); }
    .slot-time i { font-size: 0.72rem; color: var(--teal-500); }
    .slot-action { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; flex-shrink: 0; }
    .refresh-row { margin-top: 1rem; display: flex; justify-content: flex-end; }
    .past-list { display: flex; flex-direction: column; gap: 1rem; }
    .past-item { display: flex; gap: 1rem; align-items: flex-start; padding: 1rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); }
    .past-icon { width: 42px; height: 42px; background: var(--teal-100); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .past-icon i { color: var(--teal-600); font-size: 1.1rem; }
    .past-info { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
    .past-header-row { display: flex; align-items: center; gap: 0.75rem; }
    .past-date { font-weight: 600; font-size: 0.9rem; }
    .past-doctor { font-size: 0.85rem; color: var(--text-color-secondary); }
    .past-summary { margin: 0.3rem 0 0; font-size: 0.85rem; line-height: 1.5; }
    .past-prescription { display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: var(--teal-700); margin-top: 0.25rem; }
    .past-prescription i { font-size: 0.75rem; }
    .past-actions { flex-shrink: 0; }
    .steps-list { display: flex; flex-direction: column; gap: 0.875rem; margin-bottom: 1rem; }
    .step-item { display: flex; align-items: flex-start; gap: 0.875rem; }
    .step-num { width: 32px; height: 32px; border-radius: 50%; background: var(--teal-600); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 700; flex-shrink: 0; margin-top: 0.1rem; }
    .step-desc { display: flex; flex-direction: column; gap: 0.15rem; }
    .step-desc strong { font-size: 0.9rem; }
    .step-desc span { font-size: 0.85rem; color: var(--text-color-secondary); }
    .external-link-row { margin-top: 0.5rem; }
    @media (max-width: 640px) {
      .connection-card { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
      .slot-card { flex-direction: column; align-items: flex-start; }
      .past-item { flex-direction: column; }
      .slot-schedule { gap: 0.5rem; }
    }
  `]
})
export class EsanjeevaniComponent {
  private readonly messageService: MessageService;

  constructor(messageService: MessageService) {
    this.messageService = messageService;
  }

  readonly availableSlots = signal<ConsultationSlot[]>([
    {
      id: 1,
      doctor: 'Dr. Anjali Verma',
      qualification: 'MBBS, MD (General Medicine)',
      specialty: 'General Medicine',
      date: '22 Feb 2026',
      time: '10:30 AM – 11:00 AM',
      language: 'Hindi, English',
      isAvailable: true
    },
    {
      id: 2,
      doctor: 'Dr. Suresh Nair',
      qualification: 'MBBS, MS (Orthopaedics)',
      specialty: 'Orthopaedics',
      date: '22 Feb 2026',
      time: '02:00 PM – 02:30 PM',
      language: 'Malayalam, English',
      isAvailable: true
    },
    {
      id: 3,
      doctor: 'Dr. Priya Mehta',
      qualification: 'MBBS, MD (Pediatrics)',
      specialty: 'Pediatrics',
      date: '23 Feb 2026',
      time: '09:00 AM – 09:30 AM',
      language: 'Gujarati, Hindi, English',
      isAvailable: true
    },
    {
      id: 4,
      doctor: 'Dr. Ramesh Yadav',
      qualification: 'MBBS, MD (Psychiatry)',
      specialty: 'Psychiatry / Mental Health',
      date: '23 Feb 2026',
      time: '11:30 AM – 12:00 PM',
      language: 'Hindi',
      isAvailable: false
    }
  ]);

  readonly pastConsultations = signal<PastConsultation[]>([
    {
      id: 'ESJ-001',
      date: '10 Jan 2026',
      doctor: 'Dr. Kavita Singh',
      specialty: 'General Medicine',
      summary: 'Consulted for persistent cough and mild fever. Diagnosed with upper respiratory tract infection. Advised rest and increased fluid intake.',
      prescription: 'Amoxicillin 500mg x 5 days, Paracetamol 650mg SOS, Cetirizine 10mg at night'
    },
    {
      id: 'ESJ-002',
      date: '15 Nov 2025',
      doctor: 'Dr. Arun Sharma',
      specialty: 'Dermatology',
      summary: 'Follow-up for chronic eczema on forearms. Condition improving with prescribed topical steroids. Advised continuation of moisturization routine.',
      prescription: 'Hydrocortisone cream 1% BD x 2 weeks, Cetaphil moisturizer daily'
    }
  ]);

  bookSlot(slot: ConsultationSlot): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Consultation Booked',
      detail: `Your consultation with ${slot.doctor} on ${slot.date} at ${slot.time} has been confirmed.`
    });
  }

  refreshSlots(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Refreshing',
      detail: 'Fetching the latest available slots from eSanjeevani...'
    });
  }
}
