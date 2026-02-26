import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { WaitlistService } from '../data-access/waitlist.service';
import { WaitlistEntry } from '../../shared/data-access/models';

@Component({
  selector: 'app-waitlist',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    BadgeModule,
    DialogModule,
    DividerModule,
    ToggleSwitchModule,
    SelectModule,
    ProgressBarModule,
    TooltipModule,
    SkeletonModule,
    ConfirmDialogModule,
    ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="wl-page" role="main" aria-label="Appointment Waitlist">
      <p-toast position="top-right" />
      <p-confirmDialog />

      <!-- Header -->
      <header class="wl-header">
        <div class="wl-header-text">
          <h1 class="wl-title">
            <i class="pi pi-hourglass wl-title-icon" aria-hidden="true"></i>
            Appointment Waitlist
          </h1>
          <p class="wl-subtitle">Track your position on provider waitlists and accept openings</p>
        </div>
        <p-button
          label="Join a Waitlist"
          icon="pi pi-plus"
          (onClick)="openJoinDialog()"
          aria-label="Join a new waitlist"
        />
      </header>

      <!-- Slot Available Alert Banner -->
      @for (slot of service.slotsAvailable(); track slot.id) {
        <div class="wl-slot-alert" role="alert" aria-live="assertive">
          <div class="wl-slot-alert-icon" aria-hidden="true">
            <i class="pi pi-bell"></i>
          </div>
          <div class="wl-slot-alert-content">
            <div class="wl-slot-alert-title">
              Appointment Slot Available!
            </div>
            <p class="wl-slot-alert-desc">
              <strong>{{ slot.providerName }}</strong> ({{ slot.providerSpecialty }}) has an opening:
              {{ slot.slotOfferedTime }}
            </p>
            @if (slot.slotOfferExpiresAt) {
              <p class="wl-slot-expires">
                <i class="pi pi-clock" aria-hidden="true"></i>
                Offer expires: {{ formatExpiry(slot.slotOfferExpiresAt) }}
                <span class="wl-slot-countdown" [attr.aria-label]="'Time remaining: ' + getTimeRemaining(slot.slotOfferExpiresAt)">
                  ({{ getTimeRemaining(slot.slotOfferExpiresAt) }} remaining)
                </span>
              </p>
            }
          </div>
          <div class="wl-slot-alert-actions">
            <p-button
              label="Accept Appointment"
              icon="pi pi-check"
              (onClick)="acceptSlot(slot)"
              [style]="{ background: '#fff', color: '#0d9488', border: '2px solid #fff' }"
              aria-label="Accept the appointment slot"
            />
            <p-button
              label="Decline"
              icon="pi pi-times"
              severity="secondary"
              [text]="true"
              (onClick)="declineSlot(slot)"
              [style]="{ color: 'rgba(255,255,255,0.85)' }"
              aria-label="Decline the appointment slot"
            />
          </div>
        </div>
      }

      <!-- Loading -->
      @if (service.loading()) {
        <div class="wl-skeleton-grid" aria-busy="true">
          @for (i of [1,2,3]; track i) {
            <div class="wl-skeleton-card">
              <p-skeleton height="1.25rem" width="55%" styleClass="mb-2" />
              <p-skeleton height="0.875rem" width="35%" styleClass="mb-3" />
              <p-skeleton height="0.625rem" width="80%" />
            </div>
          }
        </div>
      }

      @if (!service.loading()) {
        <!-- Active Waitlist -->
        <section class="wl-section" aria-label="Active waitlist entries">
          <div class="wl-section-header">
            <h2 class="wl-section-title">
              Active Waitlist
              <span class="wl-section-count">{{ service.activeEntries().length }}</span>
            </h2>
          </div>

          @if (service.activeEntries().length === 0) {
            <div class="wl-empty" role="status">
              <i class="pi pi-hourglass wl-empty-icon" aria-hidden="true"></i>
              <h3>Not on any waitlists</h3>
              <p>Join a provider waitlist to be notified when an earlier appointment opens up.</p>
              <p-button
                label="Join a Waitlist"
                icon="pi pi-plus"
                severity="secondary"
                [outlined]="true"
                (onClick)="openJoinDialog()"
                styleClass="mt-3"
              />
            </div>
          } @else {
            <div class="wl-cards-grid" role="list">
              @for (entry of service.activeEntries(); track entry.id) {
                <article
                  class="wl-card"
                  [class.wl-card--slot-available]="entry.status === 'slot-available'"
                  [class.wl-card--urgent]="entry.priority === 'urgent'"
                  role="listitem"
                  [attr.aria-label]="'Waitlist: ' + entry.providerName + ', ' + entry.providerSpecialty"
                >
                  <!-- Card Header -->
                  <div class="wl-card-header">
                    <div class="wl-card-header-left">
                      <div class="wl-provider-avatar" aria-hidden="true">
                        {{ getInitials(entry.providerName) }}
                      </div>
                      <div>
                        <h3 class="wl-provider-name">{{ entry.providerName }}</h3>
                        <p class="wl-provider-specialty">{{ entry.providerSpecialty }}</p>
                      </div>
                    </div>
                    <div class="wl-card-header-right">
                      <p-tag
                        [value]="getStatusLabel(entry.status)"
                        [severity]="getStatusSeverity(entry.status)"
                        [rounded]="true"
                      />
                      @if (entry.priority === 'urgent') {
                        <p-tag value="Urgent" severity="danger" [rounded]="true" />
                      }
                    </div>
                  </div>

                  <!-- Appointment Type -->
                  <div class="wl-card-type">
                    <i class="pi pi-calendar-plus" aria-hidden="true"></i>
                    <span>{{ entry.appointmentType }}</span>
                  </div>

                  <!-- Slot Available Banner (within card) -->
                  @if (entry.status === 'slot-available') {
                    <div class="wl-slot-mini-banner" role="status">
                      <div class="wl-slot-mini-content">
                        <i class="pi pi-check-circle" aria-hidden="true"></i>
                        <div>
                          <p class="wl-slot-mini-title">Slot Available!</p>
                          <p class="wl-slot-mini-time">{{ entry.slotOfferedTime }}</p>
                          @if (entry.slotOfferExpiresAt) {
                            <p class="wl-slot-mini-expire">
                              Respond by: {{ entry.slotOfferExpiresAt | date:'h:mm a, MMM d' }}
                            </p>
                          }
                        </div>
                      </div>
                    </div>
                  }

                  <!-- Position & Wait Info -->
                  @if (entry.status === 'waiting' && entry.position) {
                    <div class="wl-position-section" [attr.aria-label]="'Queue position: ' + entry.position + ' of ' + entry.totalInQueue">
                      <div class="wl-position-header">
                        <span class="wl-position-label">Queue Position</span>
                        <span class="wl-position-value">
                          <span class="wl-position-num">{{ entry.position }}</span>
                          <span class="wl-position-of"> of {{ entry.totalInQueue }}</span>
                        </span>
                      </div>
                      <p-progressBar
                        [value]="getPositionProgress(entry)"
                        [showValue]="false"
                        [style]="{ height: '6px' }"
                        styleClass="wl-position-bar"
                        [attr.aria-label]="'Approximately ' + (100 - getPositionProgress(entry)) + '% through queue'"
                      />
                      <p class="wl-estimated-wait">
                        <i class="pi pi-clock" aria-hidden="true"></i>
                        Estimated wait: ~{{ entry.estimatedWaitWeeks }}
                        {{ entry.estimatedWaitWeeks === 1 ? 'week' : 'weeks' }}
                      </p>
                    </div>
                  }

                  <!-- Date Added -->
                  <div class="wl-card-meta">
                    <div class="wl-meta-item">
                      <i class="pi pi-calendar" aria-hidden="true"></i>
                      <span>Added {{ entry.dateAdded | date:'MMM d, yyyy' }}</span>
                    </div>
                    @if (entry.notes) {
                      <div class="wl-meta-item wl-meta-item--note">
                        <i class="pi pi-info-circle" aria-hidden="true"></i>
                        <span>{{ entry.notes }}</span>
                      </div>
                    }
                  </div>

                  <!-- Notification Preferences -->
                  <div class="wl-notifications" [attr.aria-label]="'Notification preferences for ' + entry.providerName">
                    <p class="wl-notif-label">Notify me via:</p>
                    <div class="wl-notif-toggles">
                      <label class="wl-notif-toggle" [attr.aria-label]="'Email notifications ' + (entry.notificationPreferences.email ? 'on' : 'off')">
                        <p-toggleswitch
                          [(ngModel)]="entry.notificationPreferences.email"
                          (ngModelChange)="onNotifChange(entry)"
                          inputId="email-{{ entry.id }}"
                        />
                        <span>Email</span>
                      </label>
                      <label class="wl-notif-toggle" [attr.aria-label]="'SMS notifications ' + (entry.notificationPreferences.sms ? 'on' : 'off')">
                        <p-toggleswitch
                          [(ngModel)]="entry.notificationPreferences.sms"
                          (ngModelChange)="onNotifChange(entry)"
                          inputId="sms-{{ entry.id }}"
                        />
                        <span>SMS</span>
                      </label>
                      <label class="wl-notif-toggle" [attr.aria-label]="'Push notifications ' + (entry.notificationPreferences.push ? 'on' : 'off')">
                        <p-toggleswitch
                          [(ngModel)]="entry.notificationPreferences.push"
                          (ngModelChange)="onNotifChange(entry)"
                          inputId="push-{{ entry.id }}"
                        />
                        <span>Push</span>
                      </label>
                    </div>
                  </div>

                  <!-- Card Actions -->
                  <div class="wl-card-actions">
                    @if (entry.status === 'slot-available') {
                      <p-button
                        label="Accept Appointment"
                        icon="pi pi-check"
                        severity="success"
                        (onClick)="acceptSlot(entry)"
                        aria-label="Accept appointment slot"
                      />
                      <p-button
                        label="Decline Slot"
                        icon="pi pi-times"
                        severity="secondary"
                        [outlined]="true"
                        (onClick)="declineSlot(entry)"
                        aria-label="Decline appointment slot"
                      />
                    } @else {
                      <p-button
                        label="Cancel Waitlist Entry"
                        icon="pi pi-trash"
                        severity="danger"
                        [text]="true"
                        size="small"
                        (onClick)="confirmCancel(entry)"
                        aria-label="Cancel waitlist entry for {{ entry.providerName }}"
                      />
                    }
                  </div>
                </article>
              }
            </div>
          }
        </section>

        <!-- History -->
        @if (service.historyEntries().length > 0) {
          <section class="wl-section" aria-label="Waitlist history">
            <p-divider />
            <div class="wl-section-header">
              <h2 class="wl-section-title">
                History
                <span class="wl-section-count wl-section-count--muted">{{ service.historyEntries().length }}</span>
              </h2>
            </div>
            <div class="wl-history-list" role="list">
              @for (entry of service.historyEntries(); track entry.id) {
                <div class="wl-history-item" role="listitem" [attr.aria-label]="entry.providerName + ' — ' + entry.status">
                  <div class="wl-history-left">
                    <div class="wl-history-avatar" aria-hidden="true">
                      {{ getInitials(entry.providerName) }}
                    </div>
                    <div>
                      <p class="wl-history-provider">{{ entry.providerName }}</p>
                      <p class="wl-history-specialty">{{ entry.providerSpecialty }}</p>
                      <p class="wl-history-type">{{ entry.appointmentType }}</p>
                    </div>
                  </div>
                  <div class="wl-history-right">
                    <p-tag
                      [value]="getStatusLabel(entry.status)"
                      [severity]="getStatusSeverity(entry.status)"
                      [rounded]="true"
                    />
                    @if (entry.completedDate) {
                      <p class="wl-history-date">{{ entry.completedDate | date:'MMM d, yyyy' }}</p>
                    }
                  </div>
                </div>
              }
            </div>
          </section>
        }
      }

      <!-- Join Waitlist Dialog -->
      <p-dialog
        [(visible)]="joinDialogVisible"
        [modal]="true"
        [draggable]="false"
        [resizable]="false"
        header="Join a Waitlist"
        [style]="{ width: '520px', maxWidth: '95vw' }"
        role="dialog"
        aria-label="Join a new waitlist"
      >
        <div class="wl-join-form">
          <p class="wl-join-intro">
            Select a specialty and provider to join their appointment waitlist. You'll be notified when an earlier slot opens up.
          </p>
          <div class="wl-form-field">
            <label class="wl-form-label" for="specialty-select">Specialty</label>
            <p-select
              inputId="specialty-select"
              [options]="specialtyOptions"
              [(ngModel)]="joinForm.specialty"
              optionLabel="label"
              optionValue="value"
              placeholder="Select specialty"
              styleClass="w-full"
            />
          </div>
          <div class="wl-form-field">
            <label class="wl-form-label" for="appt-type-select">Appointment Type</label>
            <p-select
              inputId="appt-type-select"
              [options]="appointmentTypeOptions"
              [(ngModel)]="joinForm.appointmentType"
              optionLabel="label"
              optionValue="value"
              placeholder="Select type"
              styleClass="w-full"
            />
          </div>
          <div class="wl-form-field">
            <label class="wl-form-label">Notify me via</label>
            <div class="wl-notif-toggles wl-notif-toggles--form">
              <label class="wl-notif-toggle">
                <p-toggleswitch [(ngModel)]="joinForm.email" />
                <span>Email</span>
              </label>
              <label class="wl-notif-toggle">
                <p-toggleswitch [(ngModel)]="joinForm.sms" />
                <span>SMS</span>
              </label>
              <label class="wl-notif-toggle">
                <p-toggleswitch [(ngModel)]="joinForm.push" />
                <span>Push</span>
              </label>
            </div>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <p-button label="Cancel" severity="secondary" [text]="true" (onClick)="joinDialogVisible = false" />
          <p-button
            label="Join Waitlist"
            icon="pi pi-plus"
            (onClick)="submitJoin()"
            [disabled]="!joinForm.specialty || !joinForm.appointmentType"
          />
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .wl-page {
      padding: 2rem;
      max-width: 960px;
      margin: 0 auto;
    }

    /* Header */
    .wl-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.75rem;
      flex-wrap: wrap;
    }
    .wl-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--surface-900);
      margin: 0 0 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }
    .wl-title-icon { color: var(--primary-color); font-size: 1.5rem; }
    .wl-subtitle { color: var(--surface-500); margin: 0; font-size: 0.9375rem; }

    /* Slot Alert Banner */
    .wl-slot-alert {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.25rem 1.5rem;
      background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
      border-radius: 0.875rem;
      margin-bottom: 1.75rem;
      animation: slide-in-alert 0.4s ease;
      flex-wrap: wrap;
    }
    @keyframes slide-in-alert {
      from { opacity: 0; transform: translateY(-12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .wl-slot-alert-icon {
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.375rem;
      color: #fff;
      flex-shrink: 0;
      animation: ring-bell 1.5s ease-in-out infinite;
    }
    @keyframes ring-bell {
      0%, 100% { transform: rotate(0); }
      15% { transform: rotate(15deg); }
      30% { transform: rotate(-15deg); }
      45% { transform: rotate(10deg); }
      60% { transform: rotate(-10deg); }
      75% { transform: rotate(0); }
    }
    .wl-slot-alert-content { flex: 1; }
    .wl-slot-alert-title {
      font-size: 1.0625rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.25rem;
    }
    .wl-slot-alert-desc {
      font-size: 0.9rem;
      color: rgba(255,255,255,0.9);
      margin: 0 0 0.375rem;
    }
    .wl-slot-expires {
      font-size: 0.8125rem;
      color: rgba(255,255,255,0.8);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      flex-wrap: wrap;
    }
    .wl-slot-countdown {
      font-weight: 700;
      color: #fef08a;
    }
    .wl-slot-alert-actions {
      display: flex;
      gap: 0.625rem;
      flex-shrink: 0;
      flex-wrap: wrap;
    }

    /* Skeleton */
    .wl-skeleton-grid { display: flex; flex-direction: column; gap: 1rem; }
    .wl-skeleton-card {
      background: var(--surface-0);
      border: 1px solid var(--surface-200);
      border-radius: 0.875rem;
      padding: 1.5rem;
    }

    /* Section */
    .wl-section { margin-bottom: 2rem; }
    .wl-section-header { margin-bottom: 1rem; }
    .wl-section-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--surface-700);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .wl-section-count {
      background: var(--primary-color);
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.1rem 0.5rem;
      border-radius: 1rem;
      letter-spacing: 0;
    }
    .wl-section-count--muted {
      background: var(--surface-200);
      color: var(--surface-600);
    }

    /* Empty */
    .wl-empty {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--surface-0);
      border: 1px dashed var(--surface-300);
      border-radius: 0.875rem;
      color: var(--surface-400);
    }
    .wl-empty-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
    .wl-empty h3 { margin: 0 0 0.5rem; color: var(--surface-600); }
    .wl-empty p { margin: 0; }

    /* Cards Grid */
    .wl-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.25rem;
    }

    /* Waitlist Card */
    .wl-card {
      background: var(--surface-0);
      border: 1px solid var(--surface-200);
      border-radius: 0.875rem;
      padding: 1.375rem;
      transition: box-shadow 0.2s ease, transform 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .wl-card:hover {
      box-shadow: 0 6px 20px rgba(0,0,0,0.07);
      transform: translateY(-1px);
    }
    .wl-card--slot-available {
      border: 2px solid #0d9488;
      background: linear-gradient(to bottom, #f0fdfa 0%, var(--surface-0) 10%);
      box-shadow: 0 4px 16px rgba(13,148,136,0.12);
      animation: pulse-card 2.5s ease-in-out infinite;
    }
    @keyframes pulse-card {
      0%, 100% { box-shadow: 0 4px 16px rgba(13,148,136,0.12); }
      50% { box-shadow: 0 4px 24px rgba(13,148,136,0.25); }
    }
    .wl-card--urgent {
      border-left: 4px solid #ef4444;
    }

    /* Card Header */
    .wl-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .wl-card-header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .wl-provider-avatar {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--teal-600) 0%, var(--primary-color) 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9375rem;
      flex-shrink: 0;
    }
    .wl-provider-name {
      font-size: 1rem;
      font-weight: 700;
      color: var(--surface-900);
      margin: 0 0 0.15rem;
    }
    .wl-provider-specialty {
      font-size: 0.8125rem;
      color: var(--surface-500);
      margin: 0;
    }
    .wl-card-header-right {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      align-items: flex-end;
    }

    /* Appointment Type */
    .wl-card-type {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--surface-600);
    }
    .wl-card-type i { color: var(--primary-color); flex-shrink: 0; margin-top: 0.1rem; }

    /* Slot Mini Banner */
    .wl-slot-mini-banner {
      background: linear-gradient(135deg, #ccfbf1 0%, #e0f2fe 100%);
      border: 1px solid #5eead4;
      border-radius: 0.625rem;
      padding: 0.875rem 1rem;
    }
    .wl-slot-mini-content {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }
    .wl-slot-mini-content > i {
      font-size: 1.25rem;
      color: #0d9488;
      flex-shrink: 0;
    }
    .wl-slot-mini-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: #0d9488;
      margin: 0 0 0.2rem;
    }
    .wl-slot-mini-time {
      font-size: 0.875rem;
      color: #0f766e;
      font-weight: 600;
      margin: 0 0 0.15rem;
    }
    .wl-slot-mini-expire {
      font-size: 0.8rem;
      color: #0891b2;
      margin: 0;
    }

    /* Position Section */
    .wl-position-section {
      background: var(--surface-50);
      border: 1px solid var(--surface-200);
      border-radius: 0.625rem;
      padding: 0.875rem 1rem;
    }
    .wl-position-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .wl-position-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--surface-500);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .wl-position-value { display: flex; align-items: baseline; gap: 0.1rem; }
    .wl-position-num {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--primary-color);
      line-height: 1;
    }
    .wl-position-of {
      font-size: 0.875rem;
      color: var(--surface-400);
      font-weight: 400;
    }
    :host ::ng-deep .wl-position-bar .p-progressbar-value {
      background: linear-gradient(90deg, var(--surface-200) 0%, var(--primary-200) 100%);
      border-radius: 1rem;
    }
    :host ::ng-deep .wl-position-bar { border-radius: 1rem; overflow: hidden; margin-bottom: 0.5rem; }
    .wl-estimated-wait {
      font-size: 0.8125rem;
      color: var(--surface-500);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }
    .wl-estimated-wait i { font-size: 0.75rem; }

    /* Meta */
    .wl-card-meta {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
    .wl-meta-item {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--surface-500);
    }
    .wl-meta-item i { flex-shrink: 0; margin-top: 0.1rem; }
    .wl-meta-item--note { font-style: italic; }

    /* Notifications */
    .wl-notifications {
      background: var(--surface-50);
      border: 1px solid var(--surface-100);
      border-radius: 0.625rem;
      padding: 0.75rem 1rem;
    }
    .wl-notif-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--surface-400);
      margin: 0 0 0.625rem;
    }
    .wl-notif-toggles {
      display: flex;
      gap: 1.25rem;
      flex-wrap: wrap;
    }
    .wl-notif-toggles--form { margin-top: 0.375rem; }
    .wl-notif-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--surface-600);
      font-weight: 500;
    }

    /* Card Actions */
    .wl-card-actions {
      display: flex;
      gap: 0.625rem;
      flex-wrap: wrap;
      padding-top: 0.25rem;
      border-top: 1px solid var(--surface-100);
    }

    /* History */
    .wl-history-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .wl-history-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--surface-0);
      border: 1px solid var(--surface-200);
      border-radius: 0.75rem;
      opacity: 0.75;
      flex-wrap: wrap;
    }
    .wl-history-left { display: flex; align-items: center; gap: 0.875rem; }
    .wl-history-avatar {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      background: var(--surface-200);
      color: var(--surface-500);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .wl-history-provider { font-size: 0.9rem; font-weight: 600; color: var(--surface-700); margin: 0 0 0.1rem; }
    .wl-history-specialty { font-size: 0.8rem; color: var(--surface-500); margin: 0 0 0.1rem; }
    .wl-history-type { font-size: 0.8rem; color: var(--surface-400); margin: 0; }
    .wl-history-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; }
    .wl-history-date { font-size: 0.8rem; color: var(--surface-400); margin: 0; }

    /* Join Form */
    .wl-join-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .wl-join-intro {
      font-size: 0.9375rem;
      color: var(--surface-600);
      line-height: 1.6;
      margin: 0;
    }
    .wl-form-field { display: flex; flex-direction: column; gap: 0.375rem; }
    .wl-form-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--surface-600);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    @media (max-width: 640px) {
      .wl-page { padding: 1rem; }
      .wl-slot-alert { flex-direction: column; }
      .wl-cards-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class WaitlistComponent {
  readonly service = inject(WaitlistService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  joinDialogVisible = false;
  joinForm = {
    specialty: '',
    appointmentType: '',
    email: true,
    sms: true,
    push: false
  };

  readonly specialtyOptions = [
    { label: 'Cardiology', value: 'Cardiology' },
    { label: 'Dermatology', value: 'Dermatology' },
    { label: 'Allergy & Immunology', value: 'Allergy & Immunology' },
    { label: 'Orthopedics', value: 'Orthopedics' },
    { label: 'Neurology', value: 'Neurology' },
    { label: 'Gastroenterology', value: 'Gastroenterology' },
    { label: 'Endocrinology', value: 'Endocrinology' },
    { label: 'Pulmonology', value: 'Pulmonology' },
  ];

  readonly appointmentTypeOptions = [
    { label: 'New Patient Consultation', value: 'New Patient Consultation' },
    { label: 'Follow-Up Visit', value: 'Follow-Up Visit' },
    { label: 'Annual Exam', value: 'Annual Exam' },
    { label: 'Procedure Consultation', value: 'Procedure Consultation' },
    { label: 'Second Opinion', value: 'Second Opinion' },
  ];

  openJoinDialog(): void {
    this.joinForm = { specialty: '', appointmentType: '', email: true, sms: true, push: false };
    this.joinDialogVisible = true;
  }

  submitJoin(): void {
    this.joinDialogVisible = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Added to Waitlist',
      detail: `You've been added to the ${this.joinForm.specialty} waitlist. We'll notify you when a slot opens.`,
      life: 5000
    });
  }

  acceptSlot(entry: WaitlistEntry): void {
    this.service.acceptSlot(entry.id);
    this.messageService.add({
      severity: 'success',
      summary: 'Appointment Confirmed!',
      detail: `Your appointment with ${entry.providerName} has been confirmed. Check your appointments for details.`,
      life: 6000
    });
  }

  declineSlot(entry: WaitlistEntry): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to decline this slot with ${entry.providerName}? You will remain on the waitlist for the next available opening.`,
      header: 'Decline Appointment Slot?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, Decline',
      rejectLabel: 'Keep Slot',
      accept: () => {
        this.service.declineSlot(entry.id);
        this.messageService.add({
          severity: 'info',
          summary: 'Slot Declined',
          detail: `Slot declined. You've been removed from the ${entry.providerSpecialty} waitlist.`,
          life: 4000
        });
      }
    });
  }

  confirmCancel(entry: WaitlistEntry): void {
    this.confirmationService.confirm({
      message: `Remove yourself from the waitlist for ${entry.providerName} (${entry.providerSpecialty})?`,
      header: 'Cancel Waitlist Entry?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, Remove Me',
      rejectLabel: 'Keep My Spot',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.cancelEntry(entry.id);
        this.messageService.add({
          severity: 'info',
          summary: 'Removed from Waitlist',
          detail: `You've been removed from the ${entry.providerSpecialty} waitlist.`,
          life: 4000
        });
      }
    });
  }

  onNotifChange(entry: WaitlistEntry): void {
    this.service.updateNotificationPreferences(entry.id, entry.notificationPreferences);
  }

  getPositionProgress(entry: WaitlistEntry): number {
    if (!entry.position || !entry.totalInQueue) return 0;
    return Math.round(((entry.totalInQueue - entry.position) / entry.totalInQueue) * 100);
  }

  formatExpiry(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      + ' at '
      + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  getTimeRemaining(expiresAt: Date): string {
    const diff = expiresAt.getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} minutes`;
  }

  getInitials(name: string): string {
    return name.replace('Dr. ', '').split(' ').map(n => n[0]).slice(0, 2).join('');
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'waiting': 'Waiting',
      'slot-available': 'Slot Available!',
      'completed': 'Seen',
      'cancelled': 'Cancelled',
      'expired': 'Expired'
    };
    return map[status] ?? status;
  }

  getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' | undefined {
    const map: Record<string, 'success' | 'warn' | 'danger' | 'secondary'> = {
      'waiting': 'secondary',
      'slot-available': 'success',
      'completed': 'success',
      'cancelled': 'secondary',
      'expired': 'warn'
    };
    return map[status];
  }
}
