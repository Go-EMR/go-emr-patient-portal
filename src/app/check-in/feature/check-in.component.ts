import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { CheckInService } from '../data-access/check-in.service';

@Component({
  selector: 'app-check-in',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, RouterModule,
    CardModule, ButtonModule, InputTextModule,
    CheckboxModule, TextareaModule, TagModule
  ],
  template: `
    <div class="checkin-page" role="main" aria-labelledby="checkin-title">

      <!-- Appointment Header Banner -->
      @if (svc.appointment()) {
        <div class="appt-banner" role="banner" aria-label="Appointment information">
          <div class="appt-avatar" aria-hidden="true">{{ svc.appointment()!.providerInitials }}</div>
          <div class="appt-info">
            <div class="appt-provider">{{ svc.appointment()!.providerName }}</div>
            <div class="appt-meta">
              <span><i class="pi pi-calendar" aria-hidden="true"></i> {{ formatDate(svc.appointment()!.date) }}</span>
              <span><i class="pi pi-clock" aria-hidden="true"></i> {{ svc.appointment()!.startTime }} – {{ svc.appointment()!.endTime }}</span>
              <span><i class="pi pi-map-marker" aria-hidden="true"></i> {{ svc.appointment()!.locationName }}</span>
            </div>
          </div>
          <p-tag [value]="svc.appointment()!.appointmentType" severity="info" styleClass="appt-type-tag"></p-tag>
        </div>
      }

      <div class="checkin-layout">

        <!-- Step Progress -->
        <div class="stepper-track" role="navigation" aria-label="Check-in steps">
          @for (step of steps; track step.num; let i = $index) {
            <div
              class="step-node"
              [class.active]="currentStep() === step.num"
              [class.completed]="currentStep() > step.num"
              [attr.aria-current]="currentStep() === step.num ? 'step' : null"
              [attr.aria-label]="'Step ' + step.num + ': ' + step.label + (currentStep() > step.num ? ', completed' : currentStep() === step.num ? ', current' : '')">
              <div class="step-circle">
                @if (currentStep() > step.num) {
                  <i class="pi pi-check" aria-hidden="true"></i>
                } @else {
                  <span aria-hidden="true">{{ step.num }}</span>
                }
              </div>
              <span class="step-label">{{ step.label }}</span>
              @if (i < steps.length - 1) {
                <div class="step-connector" [class.completed]="currentStep() > step.num" aria-hidden="true"></div>
              }
            </div>
          }
        </div>

        <!-- Step Content -->
        <div class="step-content" [attr.aria-label]="'Step ' + currentStep() + ' of 5'">

          <!-- Step 1: Demographics -->
          @if (currentStep() === 1) {
            <div class="step-panel" role="region" aria-labelledby="step1-heading">
              <h2 id="step1-heading" class="step-heading">
                <i class="pi pi-user" aria-hidden="true"></i>
                Verify Your Information
              </h2>
              <p class="step-description">Please review and update your details if anything has changed.</p>

              <div class="form-grid">
                <div class="field">
                  <label for="d-fname">First Name</label>
                  <input id="d-fname" type="text" pInputText
                    [ngModel]="svc.demographics().firstName"
                    (ngModelChange)="svc.updateDemographics({ firstName: $event })"
                    class="w-full" autocomplete="given-name" aria-required="true" />
                </div>
                <div class="field">
                  <label for="d-lname">Last Name</label>
                  <input id="d-lname" type="text" pInputText
                    [ngModel]="svc.demographics().lastName"
                    (ngModelChange)="svc.updateDemographics({ lastName: $event })"
                    class="w-full" autocomplete="family-name" aria-required="true" />
                </div>
                <div class="field">
                  <label for="d-dob">Date of Birth</label>
                  <input id="d-dob" type="date" pInputText
                    [ngModel]="svc.demographics().dateOfBirth"
                    (ngModelChange)="svc.updateDemographics({ dateOfBirth: $event })"
                    class="w-full" autocomplete="bday" aria-required="true" />
                </div>
                <div class="field">
                  <label for="d-phone">Phone Number</label>
                  <input id="d-phone" type="tel" pInputText
                    [ngModel]="svc.demographics().phone"
                    (ngModelChange)="svc.updateDemographics({ phone: $event })"
                    class="w-full" autocomplete="tel" />
                </div>
                <div class="field col-span-2">
                  <label for="d-address">Address</label>
                  <input id="d-address" type="text" pInputText
                    [ngModel]="svc.demographics().address"
                    (ngModelChange)="svc.updateDemographics({ address: $event })"
                    class="w-full" autocomplete="street-address" />
                </div>
                <div class="field">
                  <label for="d-city">City</label>
                  <input id="d-city" type="text" pInputText
                    [ngModel]="svc.demographics().city"
                    (ngModelChange)="svc.updateDemographics({ city: $event })"
                    class="w-full" autocomplete="address-level2" />
                </div>
                <div class="field">
                  <label for="d-state">State</label>
                  <input id="d-state" type="text" pInputText
                    [ngModel]="svc.demographics().state"
                    (ngModelChange)="svc.updateDemographics({ state: $event })"
                    class="w-full" maxlength="2" autocomplete="address-level1" />
                </div>
                <div class="field">
                  <label for="d-email">Email</label>
                  <input id="d-email" type="email" pInputText
                    [ngModel]="svc.demographics().email"
                    (ngModelChange)="svc.updateDemographics({ email: $event })"
                    class="w-full" autocomplete="email" />
                </div>
              </div>
            </div>
          }

          <!-- Step 2: Insurance -->
          @if (currentStep() === 2) {
            <div class="step-panel" role="region" aria-labelledby="step2-heading">
              <h2 id="step2-heading" class="step-heading">
                <i class="pi pi-id-card" aria-hidden="true"></i>
                Insurance Verification
              </h2>
              <p class="step-description">Review your insurance on file. Contact us if updates are needed.</p>

              <div class="insurance-card" role="group" aria-label="Current insurance details">
                <div class="ins-header">
                  <i class="pi pi-shield" aria-hidden="true"></i>
                  <div>
                    <div class="ins-plan-name">{{ svc.insurance().planName }}</div>
                    <div class="ins-sub">Primary Insurance</div>
                  </div>
                  <p-tag value="Active" severity="success"></p-tag>
                </div>
                <div class="ins-details">
                  <div class="ins-detail-item">
                    <span class="ins-detail-label">Member ID</span>
                    <span class="ins-detail-value">{{ svc.insurance().memberId }}</span>
                  </div>
                  <div class="ins-detail-item">
                    <span class="ins-detail-label">Group Number</span>
                    <span class="ins-detail-value">{{ svc.insurance().groupNumber }}</span>
                  </div>
                  <div class="ins-detail-item">
                    <span class="ins-detail-label">Policy Holder</span>
                    <span class="ins-detail-value">{{ svc.insurance().policyHolder }}</span>
                  </div>
                  <div class="ins-detail-item">
                    <span class="ins-detail-label">Copay</span>
                    <span class="ins-detail-value copay-value">{{ svc.insurance().copay }}</span>
                  </div>
                </div>
              </div>

              <div class="ins-update-toggle">
                <p-checkbox
                  [(ngModel)]="insuranceNeedsUpdate"
                  [binary]="true"
                  inputId="ins-update"
                  aria-label="My insurance information has changed">
                </p-checkbox>
                <label for="ins-update">My insurance information has changed</label>
              </div>

              @if (insuranceNeedsUpdate) {
                <div class="ins-update-note" role="alert">
                  <i class="pi pi-info-circle" aria-hidden="true"></i>
                  <span>Please bring your updated insurance card to the appointment. A staff member will update your records.</span>
                </div>
              }
            </div>
          }

          <!-- Step 3: Consent & Forms -->
          @if (currentStep() === 3) {
            <div class="step-panel" role="region" aria-labelledby="step3-heading">
              <h2 id="step3-heading" class="step-heading">
                <i class="pi pi-file-edit" aria-hidden="true"></i>
                Consent & Authorization
              </h2>
              <p class="step-description">Please review and accept the required consents to continue.</p>

              <div class="consent-list" role="group" aria-label="Required consents">
                <div class="consent-item" [class.accepted]="svc.consent().treatmentConsent">
                  <div class="consent-checkbox-row">
                    <p-checkbox
                      [ngModel]="svc.consent().treatmentConsent"
                      (ngModelChange)="svc.updateConsent({ treatmentConsent: $event })"
                      [binary]="true"
                      inputId="consent-treatment"
                      aria-required="true">
                    </p-checkbox>
                    <label for="consent-treatment" class="consent-label">
                      <strong>Consent to Treatment</strong>
                      <span class="required-badge">Required</span>
                    </label>
                  </div>
                  <p class="consent-text">I authorize AuraHealth Medical Group to provide medical treatment deemed necessary by my healthcare providers.</p>
                </div>

                <div class="consent-item" [class.accepted]="svc.consent().hipaaConsent">
                  <div class="consent-checkbox-row">
                    <p-checkbox
                      [ngModel]="svc.consent().hipaaConsent"
                      (ngModelChange)="svc.updateConsent({ hipaaConsent: $event })"
                      [binary]="true"
                      inputId="consent-hipaa"
                      aria-required="true">
                    </p-checkbox>
                    <label for="consent-hipaa" class="consent-label">
                      <strong>HIPAA Privacy Notice</strong>
                      <span class="required-badge">Required</span>
                    </label>
                  </div>
                  <p class="consent-text">I acknowledge receipt of the Notice of Privacy Practices and authorize use of my health information as described.</p>
                </div>

                <div class="consent-item" [class.accepted]="svc.consent().telemedConsent">
                  <div class="consent-checkbox-row">
                    <p-checkbox
                      [ngModel]="svc.consent().telemedConsent"
                      (ngModelChange)="svc.updateConsent({ telemedConsent: $event })"
                      [binary]="true"
                      inputId="consent-telemed">
                    </p-checkbox>
                    <label for="consent-telemed" class="consent-label">
                      <strong>Telemedicine Consent</strong>
                      <span class="optional-badge">Optional</span>
                    </label>
                  </div>
                  <p class="consent-text">I consent to the use of telemedicine technologies for virtual consultations if applicable to my care.</p>
                </div>

                <div class="consent-item" [class.accepted]="svc.consent().financialConsent">
                  <div class="consent-checkbox-row">
                    <p-checkbox
                      [ngModel]="svc.consent().financialConsent"
                      (ngModelChange)="svc.updateConsent({ financialConsent: $event })"
                      [binary]="true"
                      inputId="consent-financial"
                      aria-required="true">
                    </p-checkbox>
                    <label for="consent-financial" class="consent-label">
                      <strong>Financial Responsibility</strong>
                      <span class="required-badge">Required</span>
                    </label>
                  </div>
                  <p class="consent-text">I agree to be responsible for any charges not covered by my insurance, including copays and deductibles.</p>
                </div>
              </div>

              @if (!svc.allConsentsGiven()) {
                <div class="consent-warning" role="alert" aria-live="polite">
                  <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
                  Please accept all required consents to proceed.
                </div>
              }
            </div>
          }

          <!-- Step 4: Arrival Info -->
          @if (currentStep() === 4) {
            <div class="step-panel" role="region" aria-labelledby="step4-heading">
              <h2 id="step4-heading" class="step-heading">
                <i class="pi pi-map-marker" aria-hidden="true"></i>
                Arrival Information
              </h2>
              <p class="step-description">Help us prepare for your visit by sharing your estimated arrival time.</p>

              <div class="field">
                <label for="arrival-time">Estimated Arrival Time</label>
                <input
                  id="arrival-time"
                  type="time"
                  pInputText
                  [ngModel]="svc.arrival().estimatedArrivalTime"
                  (ngModelChange)="svc.updateArrival({ estimatedArrivalTime: $event })"
                  class="w-full"
                  aria-describedby="arrival-hint" />
                <small id="arrival-hint" class="field-hint">Your appointment is at {{ svc.appointment()?.startTime }}</small>
              </div>

              <div class="field">
                <label for="special-needs">Special Needs or Accommodations</label>
                <textarea
                  id="special-needs"
                  pTextarea
                  [ngModel]="svc.arrival().specialNeeds"
                  (ngModelChange)="svc.updateArrival({ specialNeeds: $event })"
                  rows="3"
                  placeholder="Let us know if you need any special assistance..."
                  class="w-full"
                  aria-describedby="needs-hint">
                </textarea>
                <small id="needs-hint" class="field-hint">Optional — our team will be notified before your arrival.</small>
              </div>

              <div class="accommodation-options" role="group" aria-label="Accommodation needs">
                <div class="accom-option">
                  <p-checkbox
                    [ngModel]="svc.arrival().parkingNeeds"
                    (ngModelChange)="svc.updateArrival({ parkingNeeds: $event })"
                    [binary]="true"
                    inputId="accom-parking">
                  </p-checkbox>
                  <label for="accom-parking">
                    <i class="pi pi-car" aria-hidden="true"></i>
                    I need accessible parking
                  </label>
                </div>
                <div class="accom-option">
                  <p-checkbox
                    [ngModel]="svc.arrival().wheelchairNeeds"
                    (ngModelChange)="svc.updateArrival({ wheelchairNeeds: $event })"
                    [binary]="true"
                    inputId="accom-wheelchair">
                  </p-checkbox>
                  <label for="accom-wheelchair">
                    <i class="pi pi-user" aria-hidden="true"></i>
                    I need wheelchair assistance
                  </label>
                </div>
                <div class="accom-option">
                  <p-checkbox
                    [ngModel]="svc.arrival().interpreterNeeds"
                    (ngModelChange)="svc.updateArrival({ interpreterNeeds: $event })"
                    [binary]="true"
                    inputId="accom-interpreter">
                  </p-checkbox>
                  <label for="accom-interpreter">
                    <i class="pi pi-language" aria-hidden="true"></i>
                    I need a language interpreter
                  </label>
                </div>
              </div>

              @if (svc.arrival().interpreterNeeds) {
                <div class="field" style="margin-top: 1rem;">
                  <label for="interp-lang">Interpreter Language</label>
                  <input id="interp-lang" type="text" pInputText
                    [ngModel]="svc.arrival().interpreterLanguage"
                    (ngModelChange)="svc.updateArrival({ interpreterLanguage: $event })"
                    class="w-full"
                    placeholder="e.g. Spanish, Mandarin..."
                    aria-required="true" />
                </div>
              }
            </div>
          }

          <!-- Step 5: Confirmation -->
          @if (currentStep() === 5) {
            <div class="step-panel confirmation-panel" role="region" aria-labelledby="step5-heading">
              @if (!svc.checkInResult()) {
                <div class="confirm-summary">
                  <h2 id="step5-heading" class="step-heading">
                    <i class="pi pi-clipboard" aria-hidden="true"></i>
                    Review & Submit
                  </h2>
                  <p class="step-description">Please review your check-in summary before submitting.</p>

                  <div class="summary-grid">
                    <div class="summary-section">
                      <h3>Demographics</h3>
                      <div class="summary-row">
                        <span class="summary-label">Name</span>
                        <span>{{ svc.demographics().firstName }} {{ svc.demographics().lastName }}</span>
                      </div>
                      <div class="summary-row">
                        <span class="summary-label">Date of Birth</span>
                        <span>{{ svc.demographics().dateOfBirth }}</span>
                      </div>
                      <div class="summary-row">
                        <span class="summary-label">Phone</span>
                        <span>{{ svc.demographics().phone }}</span>
                      </div>
                    </div>
                    <div class="summary-section">
                      <h3>Insurance</h3>
                      <div class="summary-row">
                        <span class="summary-label">Plan</span>
                        <span>{{ svc.insurance().planName }}</span>
                      </div>
                      <div class="summary-row">
                        <span class="summary-label">Member ID</span>
                        <span>{{ svc.insurance().memberId }}</span>
                      </div>
                    </div>
                    <div class="summary-section">
                      <h3>Consents</h3>
                      <div class="summary-row">
                        <span class="summary-label">Treatment</span>
                        <span class="consent-status" [class.given]="svc.consent().treatmentConsent">
                          <i [class]="svc.consent().treatmentConsent ? 'pi pi-check' : 'pi pi-times'" aria-hidden="true"></i>
                          {{ svc.consent().treatmentConsent ? 'Accepted' : 'Not accepted' }}
                        </span>
                      </div>
                      <div class="summary-row">
                        <span class="summary-label">HIPAA</span>
                        <span class="consent-status" [class.given]="svc.consent().hipaaConsent">
                          <i [class]="svc.consent().hipaaConsent ? 'pi pi-check' : 'pi pi-times'" aria-hidden="true"></i>
                          {{ svc.consent().hipaaConsent ? 'Accepted' : 'Not accepted' }}
                        </span>
                      </div>
                    </div>
                    <div class="summary-section">
                      <h3>Arrival</h3>
                      <div class="summary-row">
                        <span class="summary-label">Est. Arrival</span>
                        <span>{{ svc.arrival().estimatedArrivalTime || 'Not specified' }}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    pButton
                    label="Complete Check-In"
                    icon="pi pi-check-circle"
                    iconPos="right"
                    class="w-full complete-btn"
                    [loading]="svc.isLoading()"
                    (click)="submitCheckIn()"
                    aria-label="Submit your check-in">
                  </button>
                </div>
              } @else {
                <!-- Success screen -->
                <div class="success-screen" role="status" aria-live="assertive">
                  <div class="success-circle" aria-hidden="true">
                    <i class="pi pi-check"></i>
                  </div>
                  <h2 id="step5-heading" class="success-title">You're Checked In!</h2>
                  <p class="success-subtitle">Please take a seat and we'll call you shortly.</p>

                  <div class="token-display" aria-label="Your queue token number">
                    <div class="token-label">Your Token Number</div>
                    <div class="token-number" aria-live="polite">{{ svc.checkInResult()!.tokenNumber }}</div>
                    <div class="token-sub">Show this to clinic staff when called</div>
                  </div>

                  <div class="success-details">
                    <div class="success-detail-item">
                      <i class="pi pi-clock" aria-hidden="true"></i>
                      <div>
                        <div class="detail-label">Estimated Wait</div>
                        <div class="detail-value">{{ svc.checkInResult()!.estimatedWait }}</div>
                      </div>
                    </div>
                    <div class="success-detail-item">
                      <i class="pi pi-calendar" aria-hidden="true"></i>
                      <div>
                        <div class="detail-label">Appointment</div>
                        <div class="detail-value">{{ svc.appointment()?.appointmentType }}</div>
                      </div>
                    </div>
                    <div class="success-detail-item">
                      <i class="pi pi-user" aria-hidden="true"></i>
                      <div>
                        <div class="detail-label">Provider</div>
                        <div class="detail-value">{{ svc.appointment()?.providerName }}</div>
                      </div>
                    </div>
                  </div>

                  <a routerLink="/queue-status" class="view-queue-link" aria-label="View your position in the queue">
                    <i class="pi pi-list" aria-hidden="true"></i>
                    View Queue Status
                  </a>
                </div>
              }
            </div>
          }
        </div>

        <!-- Navigation Buttons -->
        @if (!svc.checkInResult()) {
          <div class="step-nav" role="group" aria-label="Navigation controls">
            <button
              pButton
              label="Back"
              icon="pi pi-arrow-left"
              class="p-button-outlined nav-back"
              (click)="prevStep()"
              [disabled]="currentStep() === 1"
              aria-label="Go to previous step">
            </button>
            <div class="step-counter" aria-hidden="true">{{ currentStep() }} of 5</div>
            @if (currentStep() < 5) {
              <button
                pButton
                label="Next"
                icon="pi pi-arrow-right"
                iconPos="right"
                class="nav-next"
                (click)="nextStep()"
                [disabled]="!canProceed()"
                aria-label="Go to next step">
              </button>
            }
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .checkin-page {
      max-width: 860px;
      margin: 0 auto;
    }

    /* Appointment Banner */
    .appt-banner {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      padding: 1rem 1.5rem;
      margin-bottom: 1.75rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .appt-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--teal-500), var(--teal-700));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .appt-info {
      flex: 1;
      min-width: 0;
    }

    .appt-provider {
      font-weight: 600;
      font-size: 1rem;
      color: var(--text-color);
      margin-bottom: 0.25rem;
    }

    .appt-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem 1.25rem;
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }

    .appt-meta span {
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    /* Stepper track */
    .stepper-track {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0;
      margin-bottom: 2rem;
      padding: 0 0.5rem;
      position: relative;
    }

    .step-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      position: relative;
      min-width: 0;
    }

    .step-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 2px solid var(--surface-border);
      background: var(--surface-card);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-color-secondary);
      transition: all 0.25s ease;
      z-index: 1;
      position: relative;
    }

    .step-node.active .step-circle {
      border-color: var(--teal-600);
      background: var(--teal-600);
      color: white;
      box-shadow: 0 0 0 4px var(--teal-100);
    }

    .step-node.completed .step-circle {
      border-color: var(--teal-600);
      background: var(--teal-600);
      color: white;
    }

    .step-label {
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--text-color-secondary);
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 80px;
      transition: color 0.25s ease;
    }

    .step-node.active .step-label {
      color: var(--teal-700);
      font-weight: 700;
    }

    .step-node.completed .step-label {
      color: var(--teal-600);
    }

    .step-connector {
      position: absolute;
      top: 18px;
      left: calc(50% + 18px);
      right: calc(-50% + 18px);
      height: 2px;
      background: var(--surface-border);
      transition: background 0.3s ease;
    }

    .step-connector.completed {
      background: var(--teal-500);
    }

    /* Step content */
    .step-content {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    .step-panel {
      padding: 1.75rem;
      animation: stepIn 0.25s ease;
    }

    @keyframes stepIn {
      from { opacity: 0; transform: translateX(12px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    .step-heading {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      font-size: 1.2rem;
      color: var(--text-color);
      margin: 0 0 0.375rem;
    }

    .step-heading i {
      color: var(--teal-600);
    }

    .step-description {
      color: var(--text-color-secondary);
      font-size: 0.875rem;
      margin: 0 0 1.5rem;
    }

    /* Form grid */
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem 1.25rem;
    }

    .col-span-2 { grid-column: 1 / -1; }

    .field { display: flex; flex-direction: column; gap: 0.375rem; }
    .field label { font-weight: 500; font-size: 0.875rem; color: var(--text-color); }
    .w-full { width: 100%; }
    .field-hint { font-size: 0.775rem; color: var(--text-color-secondary); }

    /* Insurance card */
    .insurance-card {
      border: 1px solid var(--teal-200);
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 1.25rem;
    }

    .ins-header {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 1rem 1.25rem;
      background: linear-gradient(135deg, var(--teal-50), var(--teal-100));
      border-bottom: 1px solid var(--teal-200);
    }

    .ins-header i {
      font-size: 1.75rem;
      color: var(--teal-600);
    }

    .ins-plan-name {
      font-weight: 700;
      font-size: 1rem;
      color: var(--teal-900);
    }

    .ins-sub {
      font-size: 0.75rem;
      color: var(--teal-700);
    }

    .ins-header p-tag {
      margin-left: auto;
    }

    .ins-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      background: var(--surface-card);
    }

    .ins-detail-item {
      padding: 0.875rem 1.25rem;
      border-right: 1px solid var(--surface-border);
      border-bottom: 1px solid var(--surface-border);
    }

    .ins-detail-item:nth-child(2n) { border-right: none; }
    .ins-detail-item:nth-last-child(-n+2) { border-bottom: none; }

    .ins-detail-label {
      display: block;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-color-secondary);
      margin-bottom: 0.25rem;
    }

    .ins-detail-value {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-color);
    }

    .copay-value {
      color: var(--teal-700);
      font-weight: 700;
    }

    .ins-update-toggle {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .ins-update-toggle label {
      font-size: 0.9rem;
      cursor: pointer;
    }

    .ins-update-note {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      background: var(--blue-50);
      border: 1px solid var(--blue-200);
      color: var(--blue-800);
      padding: 0.875rem;
      border-radius: 8px;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .ins-update-note i { flex-shrink: 0; margin-top: 0.1rem; }

    /* Consent list */
    .consent-list {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      margin-bottom: 1rem;
    }

    .consent-item {
      border: 1px solid var(--surface-border);
      border-radius: 10px;
      padding: 1rem 1.125rem;
      transition: border-color 0.2s ease, background 0.2s ease;
    }

    .consent-item.accepted {
      border-color: var(--teal-300);
      background: var(--teal-50);
    }

    .consent-checkbox-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .consent-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .required-badge {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--red-700);
      background: var(--red-50);
      border: 1px solid var(--red-200);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }

    .optional-badge {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-color-secondary);
      background: var(--surface-100);
      border: 1px solid var(--surface-border);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }

    .consent-text {
      margin: 0;
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      line-height: 1.5;
      padding-left: 1.75rem;
    }

    .consent-warning {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--orange-50);
      border: 1px solid var(--orange-200);
      color: var(--orange-800);
      padding: 0.75rem;
      border-radius: 8px;
      font-size: 0.85rem;
    }

    /* Arrival / accommodations */
    .accommodation-options {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem 1.125rem;
      background: var(--surface-50);
      border: 1px solid var(--surface-border);
      border-radius: 10px;
    }

    .accom-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .accom-option label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      cursor: pointer;
    }

    .accom-option i {
      color: var(--teal-600);
    }

    /* Summary grid */
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-section {
      background: var(--surface-50);
      border: 1px solid var(--surface-border);
      border-radius: 10px;
      padding: 1rem;
    }

    .summary-section h3 {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--text-color-secondary);
      margin: 0 0 0.75rem;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.85rem;
      padding: 0.25rem 0;
    }

    .summary-label {
      color: var(--text-color-secondary);
      flex-shrink: 0;
    }

    .consent-status {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      color: var(--text-color-secondary);
      font-size: 0.8rem;
    }

    .consent-status.given {
      color: var(--green-700);
    }

    .complete-btn {
      background: linear-gradient(135deg, var(--teal-500), var(--teal-700));
      border: none;
    }

    /* Success screen */
    .success-screen {
      text-align: center;
      padding: 1rem 0;
      animation: fadeIn 0.4s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .success-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--teal-500), var(--teal-700));
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
      animation: popIn 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes popIn {
      from { transform: scale(0.4); opacity: 0; }
      to   { transform: scale(1);   opacity: 1; }
    }

    .success-circle i {
      font-size: 2.25rem;
      color: white;
    }

    .success-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-color);
      margin: 0 0 0.5rem;
    }

    .success-subtitle {
      color: var(--text-color-secondary);
      font-size: 0.95rem;
      margin: 0 0 1.75rem;
    }

    .token-display {
      background: linear-gradient(135deg, var(--teal-600), var(--teal-800));
      border-radius: 16px;
      padding: 1.5rem 2rem;
      margin-bottom: 1.5rem;
      color: white;
    }

    .token-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      opacity: 0.8;
      margin-bottom: 0.5rem;
    }

    .token-number {
      font-size: 3.5rem;
      font-weight: 900;
      letter-spacing: 0.05em;
      line-height: 1;
      margin-bottom: 0.5rem;
      font-variant-numeric: tabular-nums;
    }

    .token-sub {
      font-size: 0.8rem;
      opacity: 0.75;
    }

    .success-details {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-bottom: 1.5rem;
    }

    .success-detail-item {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      text-align: left;
    }

    .success-detail-item > i {
      color: var(--teal-600);
      font-size: 1.1rem;
      margin-top: 0.15rem;
    }

    .detail-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-color-secondary);
      margin-bottom: 0.2rem;
    }

    .detail-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .view-queue-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--teal-600);
      font-weight: 600;
      font-size: 0.9rem;
      text-decoration: none;
      padding: 0.625rem 1.25rem;
      border: 2px solid var(--teal-300);
      border-radius: 8px;
      transition: all 0.15s ease;
    }

    .view-queue-link:hover {
      background: var(--teal-50);
      border-color: var(--teal-500);
    }

    .view-queue-link:focus-visible {
      outline: 2px solid var(--teal-600);
      outline-offset: 2px;
    }

    /* Navigation buttons */
    .step-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--surface-border);
    }

    .step-counter {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }

    .nav-back { min-width: 100px; }
    .nav-next { min-width: 100px; }

    @media (max-width: 640px) {
      .form-grid { grid-template-columns: 1fr; }
      .col-span-2 { grid-column: auto; }
      .summary-grid { grid-template-columns: 1fr; }
      .success-details { flex-direction: column; gap: 1rem; align-items: flex-start; }
      .stepper-track { padding: 0; }
      .step-label { display: none; }
      .appt-banner { flex-wrap: wrap; }
    }
  `]
})
export class CheckInComponent implements OnInit {
  readonly svc = inject(CheckInService);
  private readonly route = inject(ActivatedRoute);

  currentStep = signal(1);
  insuranceNeedsUpdate = false;

  readonly steps = [
    { num: 1, label: 'Demographics' },
    { num: 2, label: 'Insurance' },
    { num: 3, label: 'Consents' },
    { num: 4, label: 'Arrival' },
    { num: 5, label: 'Confirm' },
  ];

  canProceed = computed(() => {
    switch (this.currentStep()) {
      case 1: {
        const d = this.svc.demographics();
        return !!(d.firstName.trim() && d.lastName.trim() && d.dateOfBirth);
      }
      case 3:
        return this.svc.allConsentsGiven();
      default:
        return true;
    }
  });

  ngOnInit(): void {
    const appointmentId = this.route.snapshot.paramMap.get('appointmentId') || 'APT-001';
    this.svc.loadAppointment(appointmentId);
  }

  nextStep(): void {
    if (this.currentStep() < 5) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  async submitCheckIn(): Promise<void> {
    await this.svc.submitCheckIn();
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }
}
