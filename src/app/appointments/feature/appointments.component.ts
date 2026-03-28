import { Component, signal, computed, OnDestroy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { TextareaModule } from 'primeng/textarea';
import { Appointment } from '../../shared/data-access';
import { exportToICal } from '../../shared/utils/ical-export';
import { AuthService } from '../../auth/data-access/auth.service';
import { AppointmentsDataService } from '../data-access/appointments-data.service';

type FilterType = 'all' | 'today' | 'this_week';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
}

// Feature 9.1 — extended appointment with linked IDs
interface ExtendedAppointment extends Appointment {
  linkedAppointmentIds?: string[];
  linkedProviders?: string[];
}

// Feature 9.2 — Group/health class session
interface HealthClass {
  id: string;
  title: string;
  instructor: string;
  date: Date;
  startTime: string;
  totalSpots: number;
  remainingSpots: number;
  description: string;
  category: string;
}

// Feature 9.6 — Past appointment
interface PastAppointment {
  id: string;
  providerName: string;
  specialty: string;
  appointmentType: string;
  date: Date;
  locationName: string;
}

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TabsModule,
    DialogModule,
    DatePickerModule,
    SelectModule,
    TooltipModule,
    TagModule,
    ProgressBarModule,
    TextareaModule
  ],
  template: `
    <div class="appointments-page">
      <header class="page-header">
        <div><h1>Appointments</h1><p>Manage your upcoming and past appointments</p></div>
        <button pButton label="Book Appointment" icon="pi pi-plus" (click)="openBookingWizard()"></button>
      </header>

      <p-tabs [value]="0">
        <p-tablist>
          <p-tab [value]="0">Upcoming</p-tab>
          <p-tab [value]="1">Past</p-tab>
          <p-tab [value]="2">Health Classes</p-tab>
        </p-tablist>
        <p-tabpanels>
        <!-- ─── Upcoming Tab ─── -->
        <p-tabpanel [value]="0">
          <div class="filter-chips">
            <button pButton
                    [class]="activeFilter() === 'all' ? 'filter-chip active' : 'filter-chip p-button-outlined'"
                    label="All" (click)="setFilter('all')"></button>
            <button pButton
                    [class]="activeFilter() === 'today' ? 'filter-chip active' : 'filter-chip p-button-outlined'"
                    label="Today" (click)="setFilter('today')"></button>
            <button pButton
                    [class]="activeFilter() === 'this_week' ? 'filter-chip active' : 'filter-chip p-button-outlined'"
                    label="This Week" (click)="setFilter('this_week')"></button>
          </div>

          <div class="appointments-list">
            @for (appt of filteredAppointments(); track appt.id) {
              <div class="appointment-card">
                <div class="date-badge">
                  <span class="month">{{ appt.date | date:'MMM' }}</span>
                  <span class="day">{{ appt.date | date:'d' }}</span>
                </div>

                <div class="info">
                  <div class="info-header">
                    <h3>{{ appt.appointmentType }}</h3>
                    @if (waitlistedAppointments().has(appt.id)) {
                      <p-tag value="Waitlisted" severity="warn" icon="pi pi-clock"></p-tag>
                    }
                  </div>
                  <p><i class="pi pi-user"></i> {{ appt.providerName }}</p>
                  <p>
                    <i [class]="appt.telehealth ? 'pi pi-video' : 'pi pi-map-marker'"></i>
                    {{ appt.telehealth ? 'Video Visit' : appt.locationName }}
                  </p>
                  <p><i class="pi pi-clock"></i> {{ appt.startTime }}</p>

                  <!-- Feature 9.1: Linked Appointments -->
                  @if (asExtended(appt).linkedAppointmentIds?.length) {
                    <div class="linked-chain">
                      <p-tag value="Part of referral chain" severity="info" icon="pi pi-link"></p-tag>
                      <span class="linked-tooltip"
                            [pTooltip]="getLinkedTooltip(asExtended(appt))"
                            tooltipPosition="top">
                        <i class="pi pi-info-circle linked-info-icon"></i>
                        {{ asExtended(appt).linkedAppointmentIds!.length }} linked appointment{{ asExtended(appt).linkedAppointmentIds!.length > 1 ? 's' : '' }}
                      </span>
                    </div>
                  }
                </div>

                <div class="actions">
                  @if (appt.telehealth) {
                    <button pButton label="Join" icon="pi pi-video" class="p-button-success"></button>
                  } @else {
                    <button pButton label="Check In" icon="pi pi-check" class="p-button-success"></button>
                  }
                  <!-- Feature 9.7: Cancel & Reschedule buttons -->
                  @if (appt.canCancel) {
                    <button pButton label="Cancel" icon="pi pi-times" class="p-button-outlined p-button-danger"
                            (click)="openCancelDialog(appt)"></button>
                  }
                  @if (appt.canReschedule) {
                    <button pButton label="Reschedule" icon="pi pi-calendar" class="p-button-outlined"
                            (click)="openRescheduleForAppt(appt)"></button>
                  }
                  <button pButton
                          icon="pi pi-download"
                          class="p-button-outlined"
                          pTooltip="Export to Calendar"
                          (click)="exportICal(appt)"></button>
                </div>
              </div>
            } @empty {
              <div class="empty">
                <i class="pi pi-calendar"></i>
                <h3>No {{ activeFilter() === 'all' ? 'upcoming' : activeFilter() === 'today' ? "today's" : "this week's" }} appointments</h3>
                <div class="empty-actions">
                  <button pButton label="Book Now" icon="pi pi-plus" (click)="openBookingWizard()"></button>
                  <button pButton label="Join Waitlist" icon="pi pi-clock" class="p-button-outlined" (click)="joinWaitlist()"></button>
                </div>
              </div>
            }
          </div>
        </p-tabpanel>

        <!-- ─── Past Tab ─── -->
        <!-- Feature 9.6: Past appointments with repeat referral -->
        <p-tabpanel [value]="1">
          <div class="appointments-list">
            @for (past of pastAppointments; track past.id) {
              <div class="appointment-card past-card">
                <div class="date-badge past-badge">
                  <span class="month">{{ past.date | date:'MMM' }}</span>
                  <span class="day">{{ past.date | date:'d' }}</span>
                  <span class="year">{{ past.date | date:'yyyy' }}</span>
                </div>

                <div class="info">
                  <div class="info-header">
                    <h3>{{ past.appointmentType }}</h3>
                    <p-tag value="Completed" severity="success" icon="pi pi-check"></p-tag>
                  </div>
                  <p><i class="pi pi-user"></i> {{ past.providerName }}</p>
                  <p><i class="pi pi-stethoscope"></i> {{ past.specialty }}</p>
                  <p><i class="pi pi-map-marker"></i> {{ past.locationName }}</p>
                </div>

                <div class="actions">
                  <button pButton label="Request Repeat Referral"
                          icon="pi pi-send"
                          class="p-button-outlined"
                          (click)="openReferralDialog(past)"></button>
                </div>
              </div>
            }
          </div>
        </p-tabpanel>

        <!-- Feature 9.2: Health Classes Tab -->
        <p-tabpanel [value]="2">
          <div class="classes-header">
            <h3>Group Health Sessions</h3>
            <p>Join educational workshops and group sessions led by our healthcare team</p>
          </div>
          <div class="classes-grid">
            @for (cls of healthClasses; track cls.id) {
              <div class="class-card">
                <div class="class-category-badge" [class]="'cat-' + cls.category">
                  <i [class]="classIcon(cls.category)"></i>
                  {{ cls.category }}
                </div>
                <h3 class="class-title">{{ cls.title }}</h3>
                <p class="class-description">{{ cls.description }}</p>
                <div class="class-meta">
                  <div class="class-meta-item">
                    <i class="pi pi-user"></i>
                    <span>{{ cls.instructor }}</span>
                  </div>
                  <div class="class-meta-item">
                    <i class="pi pi-calendar"></i>
                    <span>{{ cls.date | date:'MMM d, y' }} at {{ cls.startTime }}</span>
                  </div>
                </div>
                <div class="spots-section">
                  <div class="spots-label">
                    <span>Availability</span>
                    <span [class]="cls.remainingSpots <= 3 ? 'spots-count urgent' : 'spots-count'">
                      {{ cls.remainingSpots }} of {{ cls.totalSpots }} spots left
                    </span>
                  </div>
                  <p-progressBar
                    [value]="spotsPercent(cls)"
                    [style]="{height: '6px'}"
                    [styleClass]="cls.remainingSpots <= 3 ? 'spots-bar urgent' : 'spots-bar'">
                  </p-progressBar>
                </div>
                <button pButton
                        [label]="cls.remainingSpots === 0 ? 'Full' : 'Register'"
                        [icon]="cls.remainingSpots === 0 ? 'pi pi-times' : 'pi pi-check'"
                        [disabled]="cls.remainingSpots === 0"
                        [class]="cls.remainingSpots <= 3 && cls.remainingSpots > 0 ? 'p-button-warning register-btn' : 'register-btn'"
                        (click)="openClassRegistration(cls)">
                </button>
              </div>
            }
          </div>
        </p-tabpanel>
        </p-tabpanels>
      </p-tabs>

      <!-- ═══════════════════════════════════════════════════════════════
           BOOKING WIZARD DIALOG
           ═══════════════════════════════════════════════════════════════ -->
      <p-dialog
        [header]="bookingDialogTitle()"
        [(visible)]="showBookingDialog"
        [modal]="true"
        [style]="{width: '600px'}"
        [closable]="true"
        (onHide)="resetBooking()">

        <!-- Step Indicator -->
        <div class="step-indicator">
          @for (step of [1, 2, 3, 4]; track step) {
            <div class="step-wrapper">
              <div [class]="stepCircleClass(step)">
                @if (bookingStep() > step) {
                  <i class="pi pi-check"></i>
                } @else {
                  {{ step }}
                }
              </div>
              <span [class]="bookingStep() >= step ? 'step-label active' : 'step-label'">
                {{ stepLabels[step - 1] }}
              </span>
              @if (step < 4) {
                <div [class]="bookingStep() > step ? 'step-connector done' : 'step-connector'"></div>
              }
            </div>
          }
        </div>

        <!-- Step 1: Select Specialty -->
        @if (bookingStep() === 1) {
          <div class="wizard-step">
            <p class="step-hint">Choose a medical specialty for your appointment.</p>

            <!-- Insurance & Language Filters -->
            <div class="booking-filters">
              <div class="booking-filter-group">
                <label class="booking-filter-label" for="insurance-filter">Insurance Plan</label>
                <p-select
                  inputId="insurance-filter"
                  [options]="insuranceOptions"
                  [(ngModel)]="selectedInsuranceModel"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select your insurance"
                  [style]="{width:'100%'}"
                  (onChange)="selectedInsurance.set($event.value)">
                </p-select>
              </div>
              <div class="booking-filter-group">
                <label class="booking-filter-label" for="language-filter">Provider Language</label>
                <p-select
                  inputId="language-filter"
                  [options]="languageOptions"
                  [(ngModel)]="selectedLanguageModel"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Provider language"
                  [style]="{width:'100%'}"
                  (onChange)="selectedLanguage.set($event.value)">
                </p-select>
              </div>
            </div>

            @if (filtersApplied()) {
              <div class="filters-applied-badge">
                <i class="pi pi-filter"></i>
                <span>Filters applied</span>
                @if (selectedInsurance() !== 'Any') {
                  <span class="filter-chip-tag">{{ selectedInsurance() }}</span>
                }
                @if (selectedLanguage() !== 'Any') {
                  <span class="filter-chip-tag">{{ selectedLanguage() }}</span>
                }
              </div>
            }

            <div class="selection-grid">
              @for (spec of specialties; track spec) {
                <div
                  [class]="selectedSpecialty() === spec ? 'selection-card selected' : 'selection-card'"
                  (click)="selectedSpecialty.set(spec)">
                  <i [class]="specialtyIcon(spec)"></i>
                  <span>{{ spec }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Step 2: Select Doctor -->
        @if (bookingStep() === 2) {
          <div class="wizard-step">
            <p class="step-hint">Select a provider in <strong>{{ selectedSpecialty() }}</strong>.</p>
            <div class="doctor-list">
              @for (doc of filteredDoctors(); track doc.id) {
                <div
                  [class]="selectedDoctor() === doc.id ? 'doctor-card selected' : 'doctor-card'"
                  (click)="selectedDoctor.set(doc.id)">
                  <div class="doctor-avatar">{{ doctorInitials(doc.name) }}</div>
                  <div class="doctor-info">
                    <strong>{{ doc.name }}</strong>
                    <span>{{ doc.specialty }}</span>
                  </div>
                  @if (selectedDoctor() === doc.id) {
                    <i class="pi pi-check-circle check-icon"></i>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- Step 3: Select Location -->
        @if (bookingStep() === 3) {
          <div class="wizard-step">
            <p class="step-hint">Choose a clinic location for your visit.</p>
            <div class="location-list">
              @for (loc of locations; track loc.id) {
                <div
                  [class]="selectedLocation() === loc.id ? 'location-card selected' : 'location-card'"
                  (click)="selectedLocation.set(loc.id)">
                  <i class="pi pi-map-marker location-icon"></i>
                  <div class="location-info">
                    <strong>{{ loc.name }}</strong>
                    <span>{{ loc.address }}</span>
                  </div>
                  @if (selectedLocation() === loc.id) {
                    <i class="pi pi-check-circle check-icon"></i>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- Step 4: Select Date & Time -->
        @if (bookingStep() === 4) {
          <div class="wizard-step step-datetime">

            <!-- Booking Summary -->
            <div class="booking-summary">
              <div class="booking-summary-title">
                <i class="pi pi-list-check"></i>
                Booking Summary
              </div>
              <div class="booking-summary-grid">
                <div class="booking-summary-item">
                  <span class="booking-summary-label">Specialty</span>
                  <span class="booking-summary-value">{{ selectedSpecialty() }}</span>
                </div>
                <div class="booking-summary-item">
                  <span class="booking-summary-label">Doctor</span>
                  <span class="booking-summary-value">{{ selectedDoctorName() }}</span>
                </div>
                <div class="booking-summary-item">
                  <span class="booking-summary-label">Location</span>
                  <span class="booking-summary-value">{{ selectedLocationName() }}</span>
                </div>
                <div class="booking-summary-item">
                  <span class="booking-summary-label">Insurance</span>
                  <span class="booking-summary-value">{{ selectedInsurance() }}</span>
                </div>
                <div class="booking-summary-item">
                  <span class="booking-summary-label">Language Pref.</span>
                  <span class="booking-summary-value">{{ selectedLanguage() }}</span>
                </div>
              </div>
            </div>

            <div class="datetime-layout">
              <div class="calendar-section">
                <p class="step-hint">Select a date.</p>
                <p-datepicker
                  [(ngModel)]="selectedDate"
                  [minDate]="minDate"
                  [inline]="true"
                  [style]="{width:'100%'}"></p-datepicker>
              </div>
              <div class="slots-section">
                <p class="step-hint">Available times.</p>
                <div class="time-slots">
                  @for (slot of timeSlots; track slot) {
                    <div
                      [class]="selectedSlot() === slot ? 'time-slot selected' : 'time-slot'"
                      (click)="selectedSlot.set(slot)">
                      {{ slot }}
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Dialog Footer -->
        <ng-template pTemplate="footer">
          <div class="wizard-footer">
            <button pButton label="Cancel" class="p-button-text" (click)="showBookingDialog = false"></button>
            <div class="footer-nav">
              @if (bookingStep() > 1) {
                <button pButton label="Back" icon="pi pi-chevron-left" class="p-button-outlined" (click)="prevStep()"></button>
              }
              @if (bookingStep() < 4) {
                <button pButton label="Next" iconPos="right" icon="pi pi-chevron-right" [disabled]="!canAdvance()" (click)="nextStep()"></button>
              } @else {
                <button pButton label="Book Appointment" icon="pi pi-check" [disabled]="!canBook()" (click)="confirmBooking()"></button>
              }
            </div>
          </div>
        </ng-template>
      </p-dialog>

      <!-- ═══════════════════════════════════════════════════════════════
           WAITLIST CONFIRMATION DIALOG
           ═══════════════════════════════════════════════════════════════ -->
      <p-dialog
        header="Join Waitlist"
        [(visible)]="showWaitlistDialog"
        [modal]="true"
        [style]="{width: '420px'}">
        <div class="waitlist-body">
          <i class="pi pi-clock waitlist-icon"></i>
          <h3>You're on the waitlist!</h3>
          <p>We'll notify you as soon as an earlier appointment becomes available. You can continue managing your existing appointments in the meantime.</p>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Got It" (click)="onWaitlistConfirm()"></button>
        </ng-template>
      </p-dialog>

      <!-- ═══════════════════════════════════════════════════════════════
           Feature 9.2: HEALTH CLASS REGISTRATION DIALOG
           ═══════════════════════════════════════════════════════════════ -->
      <p-dialog
        header="Register for Health Class"
        [(visible)]="showClassDialog"
        [modal]="true"
        [style]="{width: '480px'}">
        @if (selectedClass()) {
          <div class="class-confirm-body">
            <div class="class-confirm-icon">
              <i [class]="classIcon(selectedClass()!.category)"></i>
            </div>
            <h3>{{ selectedClass()!.title }}</h3>
            <div class="class-confirm-details">
              <div class="confirm-row"><i class="pi pi-user"></i><span>{{ selectedClass()!.instructor }}</span></div>
              <div class="confirm-row"><i class="pi pi-calendar"></i><span>{{ selectedClass()!.date | date:'EEEE, MMMM d, y' }} at {{ selectedClass()!.startTime }}</span></div>
              <div class="confirm-row"><i class="pi pi-users"></i><span>{{ selectedClass()!.remainingSpots }} spots remaining</span></div>
            </div>
            <p class="confirm-note">By registering, you'll receive a confirmation email with class details and a calendar invite.</p>
          </div>
        }
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="showClassDialog = false"></button>
          <button pButton label="Confirm Registration" icon="pi pi-check" (click)="confirmClassRegistration()"></button>
        </ng-template>
      </p-dialog>

      <!-- ═══════════════════════════════════════════════════════════════
           Feature 9.6: REPEAT REFERRAL DIALOG
           ═══════════════════════════════════════════════════════════════ -->
      <p-dialog
        header="Request Repeat Referral"
        [(visible)]="showReferralDialog"
        [modal]="true"
        [style]="{width: '480px'}">
        @if (selectedPastAppt()) {
          <div class="referral-body">
            <div class="referral-info">
              <i class="pi pi-send referral-icon"></i>
              <div>
                <p class="referral-desc">Request a repeat referral to</p>
                <strong>{{ selectedPastAppt()!.providerName }}</strong>
                <span class="referral-specialty">for {{ selectedPastAppt()!.specialty }}</span>
              </div>
            </div>
            <div class="field referral-notes-field">
              <label for="referral-notes">Additional Notes (optional)</label>
              <textarea
                id="referral-notes"
                pTextarea
                [(ngModel)]="referralNotes"
                rows="4"
                placeholder="Describe your symptoms or reason for the repeat referral..."
                style="width:100%; resize: vertical;">
              </textarea>
            </div>
          </div>
        }
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="showReferralDialog = false"></button>
          <button pButton label="Submit Request" icon="pi pi-send" (click)="submitReferral()"></button>
        </ng-template>
      </p-dialog>

      <!-- ═══════════════════════════════════════════════════════════════
           Feature 9.7: CANCEL APPOINTMENT DIALOG
           ═══════════════════════════════════════════════════════════════ -->
      <p-dialog
        header="Cancel Appointment"
        [(visible)]="showCancelDialog"
        [modal]="true"
        [style]="{width: '500px'}">
        @if (cancelTargetAppt()) {
          <div class="cancel-body">
            <div class="policy-banner">
              <i class="pi pi-exclamation-triangle"></i>
              <p>Appointments cancelled less than 24 hours before the scheduled time may incur a <strong>$25 cancellation fee</strong>.</p>
            </div>

            <div class="cancel-appt-summary">
              <strong>{{ cancelTargetAppt()!.appointmentType }}</strong> with {{ cancelTargetAppt()!.providerName }}
              <br>
              <span class="cancel-appt-date">{{ cancelTargetAppt()!.date | date:'EEEE, MMMM d' }} at {{ cancelTargetAppt()!.startTime }}</span>
            </div>

            <div class="field">
              <label for="cancel-reason">Reason for cancellation <span class="required-mark">*</span></label>
              <p-select
                inputId="cancel-reason"
                [options]="cancelReasons"
                [(ngModel)]="selectedCancelReason"
                placeholder="Select a reason"
                [style]="{width:'100%'}">
              </p-select>
            </div>

            <div class="field">
              <label for="cancel-notes">Additional notes (optional)</label>
              <textarea
                id="cancel-notes"
                pTextarea
                [(ngModel)]="cancelNotes"
                rows="3"
                placeholder="Any additional information..."
                style="width:100%; resize: vertical;">
              </textarea>
            </div>
          </div>
        }
        <ng-template pTemplate="footer">
          <button pButton label="Keep Appointment" class="p-button-text" (click)="showCancelDialog = false"></button>
          <button pButton label="Cancel Appointment" icon="pi pi-times" class="p-button-danger"
                  [disabled]="!selectedCancelReason"
                  (click)="confirmCancellation()"></button>
        </ng-template>
      </p-dialog>

      <!-- ═══════════════════════════════════════════════════════════════
           Feature 9.2: CLASS REGISTRATION CONFIRMED DIALOG
           ═══════════════════════════════════════════════════════════════ -->
      <p-dialog
        header="Registration Confirmed!"
        [(visible)]="showClassConfirmedDialog"
        [modal]="true"
        [style]="{width: '400px'}">
        <div class="waitlist-body">
          <i class="pi pi-check-circle" style="color: var(--green-500); font-size: 3.5rem; margin-bottom: 1rem;"></i>
          <h3>You're registered!</h3>
          <p>A confirmation and calendar invite have been sent to your email address.</p>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Great!" (click)="showClassConfirmedDialog = false"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    /* ── Page layout ── */
    .appointments-page { max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .page-header h1 { margin: 0; }
    .page-header p { color: var(--text-color-secondary); margin: 0.5rem 0 0; }

    /* ── Filter chips ── */
    .filter-chips { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
    .filter-chip { border-radius: 20px; font-size: 0.875rem; padding: 0.5rem 1.25rem; }
    .filter-chip.active { background: var(--primary-color); border-color: var(--primary-color); color: white; }
    .filter-chip.p-button-outlined { color: var(--text-color-secondary); border-color: var(--surface-border); }
    .filter-chip.p-button-outlined:hover { background: var(--surface-hover); }

    /* ── Appointment list & cards ── */
    .appointments-list { display: flex; flex-direction: column; gap: 1rem; }
    .appointment-card { display: flex; gap: 1.5rem; padding: 1.5rem; background: var(--surface-card); border-radius: var(--border-radius); box-shadow: var(--card-shadow); align-items: flex-start; }
    .past-card { opacity: 0.85; }
    .date-badge { display: flex; flex-direction: column; align-items: center; min-width: 70px; padding: 1rem; background: var(--primary-50); border-radius: var(--border-radius); flex-shrink: 0; }
    .date-badge .month { font-size: 0.75rem; text-transform: uppercase; color: var(--primary-600); font-weight: 600; }
    .date-badge .day { font-size: 1.75rem; font-weight: 700; color: var(--primary-700); }
    .past-badge { background: var(--surface-100); }
    .past-badge .month { color: var(--text-color-secondary); }
    .past-badge .day { color: var(--text-color-secondary); }
    .date-badge .year { font-size: 0.7rem; color: var(--text-color-secondary); }
    .info { flex: 1; }
    .info-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
    .info-header h3 { margin: 0; }
    .info p { margin: 0.25rem 0; color: var(--text-color-secondary); display: flex; align-items: center; gap: 0.5rem; }
    .actions { display: flex; flex-direction: column; gap: 0.5rem; flex-shrink: 0; }

    /* ── Feature 9.1: Linked appointments ── */
    .linked-chain { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem; flex-wrap: wrap; }
    .linked-tooltip { display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: var(--primary-600); cursor: help; }
    .linked-info-icon { font-size: 0.85rem; color: var(--primary-500); }

    /* ── Empty state ── */
    .empty { text-align: center; padding: 4rem 2rem; }
    .empty i { font-size: 4rem; color: var(--surface-300); }
    .empty h3 { margin: 1rem 0 1.5rem; }
    .empty-actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }

    /* ── Feature 9.2: Health Classes ── */
    .classes-header { margin-bottom: 1.5rem; }
    .classes-header h3 { margin: 0 0 0.5rem; font-size: 1.25rem; }
    .classes-header p { margin: 0; color: var(--text-color-secondary); }
    .classes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
    .class-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      box-shadow: var(--card-shadow);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .class-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
    .class-category-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      width: fit-content;
    }
    .cat-diabetes { background: var(--blue-50); color: var(--blue-700); }
    .cat-prenatal { background: var(--pink-50); color: var(--pink-700); }
    .cat-cardiac { background: var(--red-50); color: var(--red-700); }
    .cat-wellness { background: var(--green-50); color: var(--green-700); }
    .class-title { margin: 0; font-size: 1rem; line-height: 1.3; }
    .class-description { margin: 0; font-size: 0.85rem; color: var(--text-color-secondary); line-height: 1.5; }
    .class-meta { display: flex; flex-direction: column; gap: 0.4rem; }
    .class-meta-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-color-secondary); }
    .class-meta-item i { color: var(--primary-500); font-size: 0.8rem; }
    .spots-section { display: flex; flex-direction: column; gap: 0.4rem; }
    .spots-label { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-color-secondary); }
    .spots-count { font-weight: 600; color: var(--primary-600); }
    .spots-count.urgent { color: var(--red-600); }
    .register-btn { width: 100%; justify-content: center; margin-top: auto; }

    /* ── Step indicator ── */
    .step-indicator {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 0 1rem 1.5rem;
      gap: 0;
    }
    .step-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      flex: 1;
    }
    .step-wrapper:not(:last-child)::after {
      content: '';
      position: absolute;
      top: 18px;
      left: 50%;
      width: 100%;
      height: 2px;
      background: var(--surface-border);
      z-index: 0;
    }
    .step-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
      border: 2px solid var(--surface-border);
      background: var(--surface-card);
      color: var(--text-color-secondary);
      z-index: 1;
      position: relative;
      transition: all 0.2s;
    }
    .step-circle.active {
      border-color: var(--primary-color);
      background: var(--primary-color);
      color: white;
    }
    .step-circle.completed {
      border-color: var(--green-500);
      background: var(--green-500);
      color: white;
    }
    .step-label {
      font-size: 0.7rem;
      color: var(--text-color-secondary);
      margin-top: 0.4rem;
      text-align: center;
      white-space: nowrap;
    }
    .step-label.active { color: var(--primary-color); font-weight: 600; }
    .step-connector { display: none; }

    /* ── Wizard step body ── */
    .wizard-step { padding: 0.5rem 0 1rem; min-height: 260px; }
    .step-hint { color: var(--text-color-secondary); margin: 0 0 1rem; font-size: 0.9rem; }

    /* ── Specialty grid ── */
    .selection-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }
    .selection-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.25rem 0.75rem;
      border: 2px solid var(--surface-border);
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: all 0.15s;
      background: var(--surface-card);
      text-align: center;
      font-size: 0.85rem;
      font-weight: 500;
    }
    .selection-card i { font-size: 1.5rem; color: var(--primary-color); }
    .selection-card:hover { border-color: var(--primary-color); background: var(--primary-50); }
    .selection-card.selected { border-color: var(--primary-color); background: var(--primary-50); box-shadow: 0 0 0 3px var(--primary-100); }

    /* ── Doctor cards ── */
    .doctor-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .doctor-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border: 2px solid var(--surface-border);
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: all 0.15s;
      background: var(--surface-card);
    }
    .doctor-card:hover { border-color: var(--primary-color); background: var(--primary-50); }
    .doctor-card.selected { border-color: var(--primary-color); background: var(--primary-50); box-shadow: 0 0 0 3px var(--primary-100); }
    .doctor-avatar {
      width: 44px; height: 44px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
      flex-shrink: 0;
    }
    .doctor-info { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
    .doctor-info strong { font-size: 0.95rem; }
    .doctor-info span { font-size: 0.8rem; color: var(--text-color-secondary); }
    .check-icon { color: var(--primary-color); font-size: 1.25rem; }

    /* ── Location cards ── */
    .location-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .location-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border: 2px solid var(--surface-border);
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: all 0.15s;
      background: var(--surface-card);
    }
    .location-card:hover { border-color: var(--primary-color); background: var(--primary-50); }
    .location-card.selected { border-color: var(--primary-color); background: var(--primary-50); box-shadow: 0 0 0 3px var(--primary-100); }
    .location-icon { font-size: 1.5rem; color: var(--primary-color); flex-shrink: 0; }
    .location-info { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
    .location-info strong { font-size: 0.95rem; }
    .location-info span { font-size: 0.8rem; color: var(--text-color-secondary); }

    /* ── Date & Time step ── */
    .step-datetime .datetime-layout { display: flex; gap: 1.5rem; align-items: flex-start; }
    .calendar-section { flex: 1; }
    .slots-section { width: 180px; flex-shrink: 0; }
    .time-slots { display: flex; flex-direction: column; gap: 0.5rem; max-height: 300px; overflow-y: auto; }
    .time-slot {
      padding: 0.6rem 0.75rem;
      border: 1.5px solid var(--surface-border);
      border-radius: var(--border-radius);
      cursor: pointer;
      text-align: center;
      font-size: 0.875rem;
      transition: all 0.15s;
      background: var(--surface-card);
    }
    .time-slot:hover { border-color: var(--primary-color); background: var(--primary-50); }
    .time-slot.selected { border-color: var(--primary-color); background: var(--primary-color); color: white; font-weight: 600; }

    /* ── Insurance & Language Filters ── */
    .booking-filters {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .booking-filter-group { display: flex; flex-direction: column; gap: 0.3rem; }
    .booking-filter-label { font-size: 0.8rem; font-weight: 600; color: var(--text-color-secondary); }

    .filters-applied-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.875rem;
      background: var(--primary-50);
      border: 1px solid var(--primary-200);
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--primary-700);
      margin-bottom: 0.875rem;
    }
    .filters-applied-badge i { font-size: 0.75rem; }
    .filter-chip-tag {
      padding: 0.1rem 0.5rem;
      background: var(--primary-100);
      border-radius: 12px;
      font-size: 0.75rem;
      color: var(--primary-800);
    }

    /* ── Booking Summary (Step 4) ── */
    .booking-summary {
      background: var(--surface-ground);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 0.875rem 1rem;
      margin-bottom: 1rem;
    }
    .booking-summary-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--primary-700);
      margin-bottom: 0.75rem;
    }
    .booking-summary-title i { font-size: 0.875rem; }
    .booking-summary-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.5rem;
    }
    .booking-summary-item { display: flex; flex-direction: column; gap: 0.15rem; }
    .booking-summary-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-color-secondary); }
    .booking-summary-value { font-size: 0.8rem; font-weight: 600; color: var(--text-color); }

    /* ── Wizard footer ── */
    .wizard-footer { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .footer-nav { display: flex; gap: 0.5rem; }

    /* ── Waitlist dialog ── */
    .waitlist-body { text-align: center; padding: 1.5rem 1rem; }
    .waitlist-icon { font-size: 3.5rem; color: var(--orange-500); margin-bottom: 1rem; }
    .waitlist-body h3 { margin: 0 0 0.75rem; }
    .waitlist-body p { color: var(--text-color-secondary); line-height: 1.6; margin: 0; }

    /* ── Feature 9.2: Class registration confirm dialog ── */
    .class-confirm-body { text-align: center; padding: 1rem; }
    .class-confirm-icon { font-size: 3rem; color: var(--primary-color); margin-bottom: 1rem; }
    .class-confirm-icon i { font-size: 3rem; color: var(--primary-color); }
    .class-confirm-body h3 { margin: 0 0 1.25rem; }
    .class-confirm-details { text-align: left; background: var(--surface-50); border-radius: 10px; padding: 1rem; margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.6rem; }
    .confirm-row { display: flex; align-items: center; gap: 0.6rem; font-size: 0.9rem; }
    .confirm-row i { color: var(--primary-500); width: 16px; }
    .confirm-note { font-size: 0.8rem; color: var(--text-color-secondary); margin: 0; line-height: 1.5; }

    /* ── Feature 9.6: Referral dialog ── */
    .referral-body { padding: 0.5rem 0; }
    .referral-info { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.25rem; background: var(--surface-50); border-radius: 10px; padding: 1rem; }
    .referral-icon { font-size: 2rem; color: var(--primary-500); flex-shrink: 0; }
    .referral-desc { margin: 0 0 0.25rem; font-size: 0.85rem; color: var(--text-color-secondary); }
    .referral-info strong { display: block; font-size: 1rem; }
    .referral-specialty { font-size: 0.85rem; color: var(--text-color-secondary); }
    .referral-notes-field { margin-top: 0.5rem; }
    .field { display: flex; flex-direction: column; gap: 0.5rem; }
    .field label { font-weight: 500; font-size: 0.9rem; }

    /* ── Feature 9.7: Cancel dialog ── */
    .cancel-body { display: flex; flex-direction: column; gap: 1.25rem; padding: 0.25rem 0; }
    .policy-banner { display: flex; gap: 0.75rem; align-items: flex-start; background: var(--yellow-50); border: 1px solid var(--yellow-200); border-radius: 8px; padding: 1rem; }
    .policy-banner i { color: var(--yellow-600); font-size: 1.1rem; flex-shrink: 0; margin-top: 2px; }
    .policy-banner p { margin: 0; font-size: 0.875rem; color: var(--text-color); line-height: 1.5; }
    .cancel-appt-summary { background: var(--surface-50); border-radius: 8px; padding: 0.875rem 1rem; font-size: 0.9rem; line-height: 1.6; }
    .cancel-appt-date { font-size: 0.85rem; color: var(--text-color-secondary); }
    .required-mark { color: var(--red-500); }
  `]
})
export class AppointmentsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly appointmentsData = inject(AppointmentsDataService);

  // ─── Booking dialog state ───────────────────────────────────────────────────
  showBookingDialog = false;
  selectedDate: Date | null = null;
  minDate = new Date();

  // ─── Wizard signals ─────────────────────────────────────────────────────────
  bookingStep = signal(1);
  selectedSpecialty = signal<string | null>(null);
  selectedDoctor = signal<string | null>(null);
  selectedLocation = signal<string | null>(null);
  selectedSlot = signal<string | null>(null);

  // ─── Insurance & Language filter signals (new) ───────────────────────────────
  selectedInsurance = signal<string>('Any');
  selectedLanguage = signal<string>('Any');
  // ngModel backing fields for PrimeNG dropdowns
  selectedInsuranceModel = 'Any';
  selectedLanguageModel = 'Any';

  // ─── Waitlist state ─────────────────────────────────────────────────────────
  waitlistedAppointments = signal<Set<string>>(new Set());
  showWaitlistDialog = false;

  // ─── Filter state ───────────────────────────────────────────────────────────
  activeFilter = signal<FilterType>('all');

  // ─── Feature 9.2: Health class state ────────────────────────────────────────
  selectedClass = signal<HealthClass | null>(null);
  showClassDialog = false;
  showClassConfirmedDialog = false;

  // ─── Feature 9.6: Referral state ────────────────────────────────────────────
  selectedPastAppt = signal<PastAppointment | null>(null);
  showReferralDialog = false;
  referralNotes = '';

  // ─── Feature 9.7: Cancel/Reschedule state ───────────────────────────────────
  cancelTargetAppt = signal<ExtendedAppointment | null>(null);
  showCancelDialog = false;
  selectedCancelReason: string | null = null;
  cancelNotes = '';

  readonly cancelReasons = [
    { label: 'Personal reasons', value: 'personal' },
    { label: 'Schedule conflict', value: 'conflict' },
    { label: 'Feeling better', value: 'better' },
    { label: 'Other', value: 'other' }
  ];

  // ─── Static wizard data ─────────────────────────────────────────────────────
  readonly stepLabels = ['Specialty', 'Doctor', 'Location', 'Date & Time'];

  readonly insuranceOptions = [
    { label: 'Any', value: 'Any' },
    { label: 'Aetna PPO', value: 'Aetna PPO' },
    { label: 'Blue Cross HMO', value: 'Blue Cross HMO' },
    { label: 'Medicare', value: 'Medicare' },
    { label: 'Medicaid', value: 'Medicaid' },
    { label: 'United Healthcare', value: 'United Healthcare' },
    { label: 'Self-Pay', value: 'Self-Pay' }
  ];

  readonly languageOptions = [
    { label: 'Any', value: 'Any' },
    { label: 'English', value: 'English' },
    { label: 'Spanish', value: 'Spanish' },
    { label: 'Hindi', value: 'Hindi' },
    { label: 'Mandarin', value: 'Mandarin' },
    { label: 'Arabic', value: 'Arabic' },
    { label: 'French', value: 'French' }
  ];

  readonly specialties = [
    'Internal Medicine',
    'Cardiology',
    'Dermatology',
    'Orthopedics',
    'Ophthalmology',
    'General Practice'
  ];

  readonly doctors: Doctor[] = [
    { id: 'P1', name: 'Dr. Sarah Johnson',   specialty: 'Internal Medicine' },
    { id: 'P2', name: 'Dr. Michael Chen',    specialty: 'Cardiology'        },
    { id: 'P3', name: 'Dr. Emily Rodriguez', specialty: 'Dermatology'       },
    { id: 'P4', name: 'Dr. James Williams',  specialty: 'Orthopedics'       },
    { id: 'P5', name: 'Dr. Lisa Patel',      specialty: 'Ophthalmology'     },
    { id: 'P6', name: 'Dr. Robert Kim',      specialty: 'General Practice'  }
  ];

  readonly locations: Location[] = [
    { id: 'L1', name: 'Main Clinic',     address: '123 Medical Dr, Suite 100' },
    { id: 'L2', name: 'Heart Center',    address: '456 Cardio Blvd'           },
    { id: 'L3', name: 'West Side Office', address: '789 Health Ave'           }
  ];

  readonly timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM'
  ];

  // ─── Appointments data — loaded from portal API in ngOnInit ──────────────
  appointments = signal<ExtendedAppointment[]>([]);

  // ─── Feature 9.6: Mock past appointments ────────────────────────────────────
  readonly pastAppointments: PastAppointment[] = [
    {
      id: 'PAST-001',
      providerName: 'Dr. Emily Rodriguez',
      specialty: 'Dermatology',
      appointmentType: 'Skin Check',
      date: new Date(Date.now() - 45 * 86400000),
      locationName: 'West Side Office'
    },
    {
      id: 'PAST-002',
      providerName: 'Dr. James Williams',
      specialty: 'Orthopedics',
      appointmentType: 'Knee Evaluation',
      date: new Date(Date.now() - 90 * 86400000),
      locationName: 'Main Clinic'
    },
    {
      id: 'PAST-003',
      providerName: 'Dr. Robert Kim',
      specialty: 'General Practice',
      appointmentType: 'Flu Visit',
      date: new Date(Date.now() - 120 * 86400000),
      locationName: 'Main Clinic'
    },
    {
      id: 'PAST-004',
      providerName: 'Dr. Lisa Patel',
      specialty: 'Ophthalmology',
      appointmentType: 'Vision Exam',
      date: new Date(Date.now() - 180 * 86400000),
      locationName: 'West Side Office'
    }
  ];

  // ─── Feature 9.2: Mock health classes ───────────────────────────────────────
  readonly healthClasses: HealthClass[] = [
    {
      id: 'CLS-001',
      title: 'Diabetes Education Workshop',
      instructor: 'Dr. Lisa Patel',
      date: new Date(Date.now() + 7 * 86400000),
      startTime: '10:00 AM',
      totalSpots: 12,
      remainingSpots: 3,
      description: 'A hands-on workshop covering blood sugar management, nutrition, and lifestyle strategies for diabetes patients.',
      category: 'diabetes'
    },
    {
      id: 'CLS-002',
      title: 'Prenatal Yoga Class',
      instructor: 'Nurse Williams',
      date: new Date(Date.now() + 4 * 86400000),
      startTime: '9:00 AM',
      totalSpots: 8,
      remainingSpots: 5,
      description: 'Gentle yoga and breathing exercises designed for all trimesters. Reduce stress and prepare for childbirth.',
      category: 'prenatal'
    },
    {
      id: 'CLS-003',
      title: 'Heart Health Seminar',
      instructor: 'Dr. Michael Chen',
      date: new Date(Date.now() + 14 * 86400000),
      startTime: '2:00 PM',
      totalSpots: 20,
      remainingSpots: 8,
      description: 'Learn about cardiovascular risk factors, prevention strategies, and the latest research in heart health.',
      category: 'cardiac'
    },
    {
      id: 'CLS-004',
      title: 'Stress Management Group',
      instructor: 'Dr. Rodriguez',
      date: new Date(Date.now() + 10 * 86400000),
      startTime: '11:00 AM',
      totalSpots: 10,
      remainingSpots: 2,
      description: 'Evidence-based techniques for managing stress including mindfulness, CBT strategies, and relaxation exercises.',
      category: 'wellness'
    }
  ];

  ngOnInit(): void {
    this.appointmentsData.loadAppointments().then(() => {
      const loaded = this.appointmentsData.appointments();
      if (loaded.length > 0) {
        this.appointments.set(loaded as ExtendedAppointment[]);
      }
    });
  }

  // ─── Computed ───────────────────────────────────────────────────────────────
  filteredAppointments = computed(() => {
    const filter = this.activeFilter();
    const all = this.appointments();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const weekEnd = new Date(todayStart.getTime() + 7 * 86400000);

    switch (filter) {
      case 'today':
        return all.filter(a => {
          const d = new Date(a.date);
          return d >= todayStart && d < todayEnd;
        });
      case 'this_week':
        return all.filter(a => {
          const d = new Date(a.date);
          return d >= todayStart && d < weekEnd;
        });
      default:
        return all;
    }
  });

  filtersApplied = computed(() =>
    this.selectedInsurance() !== 'Any' || this.selectedLanguage() !== 'Any'
  );

  selectedDoctorName = computed(() => {
    const id = this.selectedDoctor();
    return this.doctors.find(d => d.id === id)?.name ?? null;
  });

  selectedLocationName = computed(() => {
    const id = this.selectedLocation();
    return this.locations.find(l => l.id === id)?.name ?? null;
  });

  filteredDoctors = computed(() => {
    const spec = this.selectedSpecialty();
    if (!spec) return this.doctors;
    return this.doctors.filter(d => d.specialty === spec);
  });

  bookingDialogTitle = computed(() => {
    const titles: Record<number, string> = {
      1: 'Book Appointment — Select Specialty',
      2: 'Book Appointment — Select Doctor',
      3: 'Book Appointment — Select Location',
      4: 'Book Appointment — Select Date & Time'
    };
    return titles[this.bookingStep()] ?? 'Book Appointment';
  });

  // ─── Helper to cast Appointment to ExtendedAppointment safely ───────────────
  asExtended(appt: Appointment): ExtendedAppointment {
    return appt as ExtendedAppointment;
  }

  // ─── Methods ─────────────────────────────────────────────────────────────────

  setFilter(filter: FilterType): void {
    this.activeFilter.set(filter);
  }

  // Feature 1: iCal export
  exportICal(appt: Appointment): void {
    exportToICal(appt);
  }

  // Feature 2: Booking wizard
  openBookingWizard(): void {
    this.resetBooking();
    this.showBookingDialog = true;
  }

  resetBooking(): void {
    this.bookingStep.set(1);
    this.selectedSpecialty.set(null);
    this.selectedDoctor.set(null);
    this.selectedLocation.set(null);
    this.selectedSlot.set(null);
    this.selectedDate = null;
    this.selectedInsurance.set('Any');
    this.selectedLanguage.set('Any');
    this.selectedInsuranceModel = 'Any';
    this.selectedLanguageModel = 'Any';
  }

  canAdvance(): boolean {
    switch (this.bookingStep()) {
      case 1: return this.selectedSpecialty() !== null;
      case 2: return this.selectedDoctor() !== null;
      case 3: return this.selectedLocation() !== null;
      default: return false;
    }
  }

  canBook(): boolean {
    return this.selectedDate !== null && this.selectedSlot() !== null;
  }

  nextStep(): void {
    if (this.canAdvance() && this.bookingStep() < 4) {
      this.bookingStep.update(s => s + 1);
    }
  }

  prevStep(): void {
    if (this.bookingStep() > 1) {
      this.bookingStep.update(s => s - 1);
    }
  }

  confirmBooking(): void {
    if (!this.canBook()) return;
    this.showBookingDialog = false;
    this.resetBooking();
  }

  stepCircleClass(step: number): string {
    const current = this.bookingStep();
    if (current > step) return 'step-circle completed';
    if (current === step) return 'step-circle active';
    return 'step-circle';
  }

  specialtyIcon(specialty: string): string {
    const icons: Record<string, string> = {
      'Internal Medicine': 'pi pi-heart',
      'Cardiology':        'pi pi-heart-fill',
      'Dermatology':       'pi pi-sun',
      'Orthopedics':       'pi pi-bolt',
      'Ophthalmology':     'pi pi-eye',
      'General Practice':  'pi pi-user-plus'
    };
    return icons[specialty] ?? 'pi pi-plus-circle';
  }

  doctorInitials(name: string): string {
    return name
      .replace('Dr. ', '')
      .split(' ')
      .map(w => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  // Feature 3: Waitlist
  joinWaitlist(): void {
    this.showWaitlistDialog = true;
  }

  onWaitlistConfirm(): void {
    this.showWaitlistDialog = false;
  }

  // Feature 9.1: Linked appointment tooltip text
  getLinkedTooltip(appt: ExtendedAppointment): string {
    const providers = appt.linkedProviders;
    if (providers && providers.length > 0) {
      return 'Linked providers: ' + providers.join(', ');
    }
    return 'Linked appointments: ' + (appt.linkedAppointmentIds || []).join(', ');
  }

  // Feature 9.2: Health class methods
  classIcon(category: string): string {
    const icons: Record<string, string> = {
      diabetes: 'pi pi-chart-line',
      prenatal: 'pi pi-heart',
      cardiac:  'pi pi-heart-fill',
      wellness: 'pi pi-sun'
    };
    return icons[category] ?? 'pi pi-calendar';
  }

  spotsPercent(cls: HealthClass): number {
    return Math.round((cls.remainingSpots / cls.totalSpots) * 100);
  }

  openClassRegistration(cls: HealthClass): void {
    this.selectedClass.set(cls);
    this.showClassDialog = true;
  }

  confirmClassRegistration(): void {
    this.showClassDialog = false;
    this.showClassConfirmedDialog = true;
  }

  // Feature 9.6: Repeat referral methods
  openReferralDialog(past: PastAppointment): void {
    this.selectedPastAppt.set(past);
    this.referralNotes = '';
    this.showReferralDialog = true;
  }

  submitReferral(): void {
    console.log('Referral requested:', {
      provider: this.selectedPastAppt()?.providerName,
      specialty: this.selectedPastAppt()?.specialty,
      notes: this.referralNotes
    });
    this.showReferralDialog = false;
    this.referralNotes = '';
  }

  // Feature 9.7: Cancel/Reschedule methods
  openCancelDialog(appt: ExtendedAppointment): void {
    this.cancelTargetAppt.set(appt);
    this.selectedCancelReason = null;
    this.cancelNotes = '';
    this.showCancelDialog = true;
  }

  confirmCancellation(): void {
    if (!this.selectedCancelReason) return;
    console.log('Appointment cancelled:', {
      appointmentId: this.cancelTargetAppt()?.id,
      reason: this.selectedCancelReason,
      notes: this.cancelNotes
    });
    // Remove from the upcoming list
    const id = this.cancelTargetAppt()?.id;
    if (id) {
      this.appointments.update(list => list.filter(a => a.id !== id));
    }
    this.showCancelDialog = false;
    this.cancelTargetAppt.set(null);
    this.selectedCancelReason = null;
    this.cancelNotes = '';
  }

  openRescheduleForAppt(appt: ExtendedAppointment): void {
    // Pre-fill the booking wizard with the appointment's specialty and provider
    const doctor = this.doctors.find(d => d.id === appt.providerId);
    if (doctor) {
      this.selectedSpecialty.set(doctor.specialty);
      this.selectedDoctor.set(doctor.id);
      this.bookingStep.set(3);
    } else {
      this.resetBooking();
    }
    this.showBookingDialog = true;
  }
}
