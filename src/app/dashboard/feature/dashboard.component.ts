import { Component, inject, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DashboardDataService, HealthAlert } from '../data-access';
import { StatCardComponent, AppointmentCardComponent, VitalsGridComponent } from '../ui';
import { AuthService } from '../../auth/data-access';

interface ContextualAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: 'teal' | 'blue' | 'orange' | 'purple' | 'green';
  priority: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule, ButtonModule, SkeletonModule, StatCardComponent, AppointmentCardComponent, VitalsGridComponent],
  template: `
    <div class="dashboard">
      <section class="welcome-banner">
        <div class="welcome-content">
          <span class="greeting">{{ greeting }},</span>
          <h1 class="name">{{ userName() }}</h1>
          <p class="message">Here's your health summary for today</p>
          <p class="current-date"><i class="pi pi-calendar"></i> {{ todayDate | date:'EEEE, MMMM d, y' }}</p>
        </div>
        <div class="welcome-right">
          <div class="welcome-actions">
            <button pButton label="Book Appointment" icon="pi pi-calendar-plus" class="p-button-lg" (click)="navigate('/appointments')"></button>
            <button pButton label="Send Message" icon="pi pi-envelope" class="p-button-lg p-button-outlined" (click)="navigate('/messages')"></button>
          </div>
        </div>
      </section>

      @if (dataService.isLoading()) {
        <div class="stats-grid">
          @for (i of [1,2,3,4]; track i) { <p-skeleton height="100px"></p-skeleton> }
        </div>
      } @else {
        <div class="stats-grid">
          <app-stat-card [value]="summary().upcomingAppointments" label="Upcoming Appointments" icon="pi pi-calendar" variant="appointments" (clicked)="navigate('/appointments')"></app-stat-card>
          <app-stat-card [value]="summary().unreadMessages" label="Unread Messages" icon="pi pi-envelope" variant="messages" [badge]="summary().unreadMessages > 0 ? 'New' : undefined" (clicked)="navigate('/messages')"></app-stat-card>
          <app-stat-card [value]="summary().recentLabResults" label="New Lab Results" icon="pi pi-file" variant="labs" [badge]="summary().recentLabResults > 0 ? 'New' : undefined" badgeVariant="alert" (clicked)="navigate('/records')"></app-stat-card>
          <app-stat-card [value]="'$' + summary().outstandingBalance.toFixed(2)" label="Outstanding Balance" icon="pi pi-credit-card" variant="balance" (clicked)="navigate('/billing')"></app-stat-card>
        </div>
      }

      <!-- Contextual Quick Actions -->
      @if (contextualActions().length > 0) {
        <section class="quick-actions">
          <h2 class="section-title">
            <i class="pi pi-sparkles section-title-icon"></i>
            Suggested For You
          </h2>
          <div class="action-cards">
            @for (action of contextualActions(); track action.id; let idx = $index) {
              <div
                class="action-card"
                [class]="'action-card--' + action.color"
                [style.animation-delay]="(idx * 60) + 'ms'"
                (click)="navigate(action.route)"
                role="button"
                tabindex="0"
                [attr.aria-label]="action.title + ': ' + action.description"
                (keydown.enter)="navigate(action.route)"
                (keydown.space)="navigate(action.route)"
              >
                <div class="action-icon">
                  <i [class]="action.icon" aria-hidden="true"></i>
                </div>
                <div class="action-content">
                  <h3>{{ action.title }}</h3>
                  <p>{{ action.description }}</p>
                </div>
                <i class="pi pi-arrow-right action-arrow" aria-hidden="true"></i>
              </div>
            }
          </div>
        </section>
      }

      @if (activeAlerts().length > 0) {
        <section class="alerts-panel">
          <div class="alerts-header">
            <div class="alerts-title-group">
              <i class="pi pi-bell alerts-bell-icon"></i>
              <h2 class="alerts-title">Health Alerts</h2>
              <span class="alerts-badge">{{ activeAlerts().length }}</span>
            </div>
          </div>
          <div class="alerts-list">
            @for (alert of activeAlerts(); track alert.id) {
              <div class="alert-card" [class]="'alert-card--' + alert.severity">
                <div class="alert-icon-col">
                  <i class="pi"
                     [class.pi-exclamation-triangle]="alert.severity === 'critical'"
                     [class.pi-exclamation-circle]="alert.severity === 'warning'"
                     [class.pi-info-circle]="alert.severity === 'info'"
                     [class]="'alert-icon alert-icon--' + alert.severity"></i>
                </div>
                <div class="alert-body">
                  <span class="alert-title">{{ alert.title }}</span>
                  <span class="alert-message">{{ alert.message }}</span>
                </div>
                <div class="alert-actions">
                  @if (alert.actionRoute) {
                    <button pButton
                            [label]="alert.actionLabel || 'View'"
                            class="p-button-sm p-button-text"
                            [class]="'alert-action-btn alert-action-btn--' + alert.severity"
                            (click)="navigateAlert(alert.actionRoute)">
                    </button>
                  }
                  <button pButton
                          icon="pi pi-times"
                          class="p-button-sm p-button-text p-button-rounded alert-dismiss-btn"
                          aria-label="Dismiss alert"
                          (click)="dismissAlert(alert.id)">
                  </button>
                </div>
              </div>
            }
          </div>
        </section>
      }

      <div class="content-grid">
        <p-card styleClass="appointment-panel">
          <ng-template pTemplate="header"><div class="panel-header"><h2>Next Appointment</h2><button pButton label="View All" icon="pi pi-arrow-right" iconPos="right" class="p-button-text p-button-sm" (click)="navigate('/appointments')"></button></div></ng-template>
          @if (dataService.isLoading()) { <p-skeleton height="150px"></p-skeleton> }
          @else { <app-appointment-card [appointment]="dataService.nextAppointment()" (checkIn)="checkIn()" (joinVideo)="joinVideo()" (reschedule)="reschedule()" (bookNew)="navigate('/appointments')"></app-appointment-card> }
        </p-card>

        <p-card styleClass="vitals-panel">
          <ng-template pTemplate="header"><div class="panel-header"><h2>Recent Vitals</h2><button pButton label="View All" icon="pi pi-arrow-right" iconPos="right" class="p-button-text p-button-sm" (click)="navigate('/records')"></button></div></ng-template>
          @if (dataService.isLoading()) { <p-skeleton height="200px"></p-skeleton> }
          @else { <app-vitals-grid [vitals]="dataService.vitalsDisplay()"></app-vitals-grid> }
        </p-card>

        <p-card styleClass="medications-panel">
          <ng-template pTemplate="header"><div class="panel-header"><h2>Active Medications</h2><button pButton label="View All" icon="pi pi-arrow-right" iconPos="right" class="p-button-text p-button-sm" (click)="navigate('/records')"></button></div></ng-template>
          <div class="medications-list">
            @for (med of dataService.activeMedications().slice(0, 3); track med.id) {
              <div class="medication-item">
                <div class="med-info"><span class="med-name">{{ med.medicationName }}</span><span class="med-dosage">{{ med.dosage }} - {{ med.frequency }}</span></div>
                <div class="med-refills"><span class="refills-count">{{ med.refillsRemaining }} refills</span>
                  @if (med.canRequestRefill && med.refillsRemaining > 0) { <button pButton label="Refill" class="p-button-text p-button-sm" (click)="requestRefill(med.id)"></button> }
                </div>
              </div>
            } @empty { <p class="empty-state">No active medications</p> }
          </div>
        </p-card>

        <p-card styleClass="messages-panel">
          <ng-template pTemplate="header"><div class="panel-header"><h2>Recent Messages</h2><button pButton label="View All" icon="pi pi-arrow-right" iconPos="right" class="p-button-text p-button-sm" (click)="navigate('/messages')"></button></div></ng-template>
          <div class="messages-list">
            @for (thread of dataService.messages().slice(0, 3); track thread.id) {
              <div class="message-item" [class.unread]="thread.unreadCount > 0" (click)="openMessage(thread.id)">
                <div class="message-icon"><i class="pi pi-envelope"></i>@if (thread.unreadCount > 0) { <span class="unread-badge"></span> }</div>
                <div class="message-content"><span class="message-subject">{{ thread.subject }}</span><span class="message-preview">{{ thread.lastMessagePreview }}</span></div>
                <span class="message-time">{{ thread.lastMessageAt | date:'MMM d' }}</span>
              </div>
            } @empty { <p class="empty-state">No messages</p> }
          </div>
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1400px; margin: 0 auto; }

    /* Welcome Banner */
    .welcome-banner { display: flex; align-items: center; justify-content: space-between; background: linear-gradient(135deg, var(--primary-50) 0%, var(--surface-0) 100%); border-radius: var(--border-radius); padding: 2rem; margin-bottom: 1.5rem; }
    .greeting { font-size: 1rem; color: var(--text-color-secondary); }
    .name { font-size: 2rem; font-weight: 700; margin: 0.25rem 0; }
    .message { color: var(--text-color-secondary); margin: 0; }
    .current-date { color: var(--text-color-secondary); margin: 0.5rem 0 0; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem; }
    .welcome-right { display: flex; flex-direction: column; align-items: flex-end; gap: 1rem; }
    .welcome-actions { display: flex; gap: 1rem; }

    /* Stats Grid */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }

    /* Quick Actions Section */
    .quick-actions { margin-bottom: 1.5rem; }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-color);
      margin: 0 0 1rem;
    }

    .section-title-icon {
      color: #0d9488;
      font-size: 1rem;
    }

    .action-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.875rem;
    }

    .action-card {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 1rem 1.125rem;
      background: var(--surface-0);
      border: 1px solid var(--surface-border);
      border-left: 4px solid transparent;
      border-radius: 10px;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease, border-left-color 0.15s;
      animation: action-card-in 0.3s ease-out both;
      outline: none;
      position: relative;
    }

    @keyframes action-card-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .action-card:focus-visible {
      box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.3);
    }

    /* Color variants */
    .action-card--teal   { border-left-color: #0d9488; }
    .action-card--blue   { border-left-color: #3b82f6; }
    .action-card--orange { border-left-color: #f97316; }
    .action-card--purple { border-left-color: #8b5cf6; }
    .action-card--green  { border-left-color: #22c55e; }

    .action-card--teal:hover   { background: #f0fdfa; }
    .action-card--blue:hover   { background: #eff6ff; }
    .action-card--orange:hover { background: #fff7ed; }
    .action-card--purple:hover { background: #faf5ff; }
    .action-card--green:hover  { background: #f0fdf4; }

    /* Action icon circle */
    .action-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 1.125rem;
    }

    .action-card--teal   .action-icon { background: rgba(13, 148, 136, 0.1);  color: #0d9488; }
    .action-card--blue   .action-icon { background: rgba(59, 130, 246, 0.1);  color: #3b82f6; }
    .action-card--orange .action-icon { background: rgba(249, 115, 22, 0.1);  color: #f97316; }
    .action-card--purple .action-icon { background: rgba(139, 92, 246, 0.1);  color: #8b5cf6; }
    .action-card--green  .action-icon { background: rgba(34, 197, 94, 0.1);   color: #22c55e; }

    .action-content { flex: 1; min-width: 0; }

    .action-content h3 {
      font-size: 0.9rem;
      font-weight: 600;
      margin: 0 0 0.2rem;
      color: var(--text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .action-content p {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .action-arrow {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      flex-shrink: 0;
      transition: transform 0.15s;
    }

    .action-card:hover .action-arrow { transform: translateX(3px); }

    /* Content Grid */
    .content-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
    .panel-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--surface-border); }
    .panel-header h2 { margin: 0; font-size: 1.125rem; font-weight: 600; }
    .medications-list, .messages-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .medication-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--surface-50); border-radius: var(--border-radius); }
    .med-info { display: flex; flex-direction: column; }
    .med-name { font-weight: 500; }
    .med-dosage { font-size: 0.875rem; color: var(--text-color-secondary); }
    .med-refills { display: flex; align-items: center; gap: 0.5rem; }
    .refills-count { font-size: 0.875rem; color: var(--text-color-secondary); }
    .message-item { display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border-radius: var(--border-radius); cursor: pointer; transition: background 0.15s; }
    .message-item:hover { background: var(--surface-50); }
    .message-item.unread { background: var(--primary-50); }
    .message-icon { position: relative; width: 40px; height: 40px; border-radius: 50%; background: var(--surface-100); display: flex; align-items: center; justify-content: center; }
    .unread-badge { position: absolute; top: 0; right: 0; width: 10px; height: 10px; background: var(--primary-color); border-radius: 50%; }
    .message-content { flex: 1; min-width: 0; }
    .message-subject { display: block; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .message-preview { display: block; font-size: 0.875rem; color: var(--text-color-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .message-time { font-size: 0.75rem; color: var(--text-color-secondary); }
    .empty-state { text-align: center; padding: 2rem; color: var(--text-color-secondary); }

    /* Alerts Panel */
    .alerts-panel { background: var(--surface-0); border: 1px solid var(--surface-border); border-radius: var(--border-radius); margin-bottom: 1.5rem; overflow: hidden; }
    .alerts-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid var(--surface-border); background: var(--surface-50); }
    .alerts-title-group { display: flex; align-items: center; gap: 0.75rem; }
    .alerts-bell-icon { font-size: 1.125rem; color: var(--text-color-secondary); }
    .alerts-title { margin: 0; font-size: 1.125rem; font-weight: 600; }
    .alerts-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; height: 1.5rem; padding: 0 0.375rem; background: #ef4444; color: #fff; border-radius: 999px; font-size: 0.75rem; font-weight: 700; line-height: 1; }
    .alerts-list { display: flex; flex-direction: column; gap: 0; }
    .alert-card { display: flex; align-items: flex-start; gap: 1rem; padding: 1rem 1.5rem; border-bottom: 1px solid var(--surface-border); border-left: 4px solid transparent; transition: background 0.15s; }
    .alert-card:last-child { border-bottom: none; }
    .alert-card--critical { border-left-color: #ef4444; }
    .alert-card--warning { border-left-color: #f97316; }
    .alert-card--info { border-left-color: #3b82f6; }
    .alert-card--critical:hover { background: #fef2f2; }
    .alert-card--warning:hover { background: #fff7ed; }
    .alert-card--info:hover { background: #eff6ff; }
    .alert-icon-col { flex-shrink: 0; padding-top: 0.125rem; }
    .alert-icon { font-size: 1.25rem; }
    .alert-icon--critical { color: #ef4444; }
    .alert-icon--warning { color: #f97316; }
    .alert-icon--info { color: #3b82f6; }
    .alert-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.25rem; }
    .alert-title { font-weight: 600; font-size: 0.9375rem; }
    .alert-message { font-size: 0.875rem; color: var(--text-color-secondary); }
    .alert-actions { display: flex; align-items: center; gap: 0.25rem; flex-shrink: 0; }
    .alert-action-btn--critical { color: #ef4444 !important; }
    .alert-action-btn--warning { color: #f97316 !important; }
    .alert-action-btn--info { color: #3b82f6 !important; }
    .alert-dismiss-btn { color: var(--text-color-secondary) !important; }

    /* Responsive */
    @media (max-width: 1200px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .content-grid { grid-template-columns: 1fr; }
      .action-cards { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 768px) {
      .welcome-banner { flex-direction: column; text-align: center; }
      .welcome-right { align-items: center; }
      .welcome-actions { flex-direction: column; width: 100%; }
      .stats-grid { grid-template-columns: 1fr; }
      .action-cards { grid-template-columns: 1fr; }
      .alert-card { flex-wrap: wrap; }
      .alert-actions { width: 100%; justify-content: flex-end; padding-top: 0.5rem; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  readonly dataService = inject(DashboardDataService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly summary = computed(() => this.dataService.healthSummary());
  readonly userName = computed(() => {
    const user = this.authService.user();
    return user ? `${user.firstName} ${user.lastName}` : 'Patient';
  });
  readonly activeAlerts = computed(() => this.dataService.activeAlerts());
  readonly todayDate = new Date();

  readonly contextualActions = computed<ContextualAction[]>(() => {
    const actions: ContextualAction[] = [];
    const summary = this.summary();
    const nextAppt = this.dataService.nextAppointment();

    // If there's an upcoming appointment today → suggest check-in
    if (nextAppt && this.isToday(nextAppt.date)) {
      actions.push({
        id: 'checkin',
        title: "Check In for Today's Visit",
        description: `${nextAppt.providerName} at ${nextAppt.startTime}`,
        icon: 'pi pi-check-circle',
        route: `/check-in/${nextAppt.id}`,
        color: 'teal',
        priority: 1
      });
    }

    // If telehealth appointment → join video
    if (nextAppt?.telehealth) {
      actions.push({
        id: 'telehealth',
        title: 'Join Video Visit',
        description: `Telehealth with ${nextAppt.providerName}`,
        icon: 'pi pi-video',
        route: `/telehealth/${nextAppt.id}`,
        color: 'blue',
        priority: 1
      });
    }

    // If there are new lab results → view them
    if (summary.recentLabResults > 0) {
      actions.push({
        id: 'labs',
        title: 'New Lab Results Available',
        description: `${summary.recentLabResults} new result(s) ready for review`,
        icon: 'pi pi-file',
        route: '/records',
        color: 'orange',
        priority: 2
      });
    }

    // If there are unread messages
    if (summary.unreadMessages > 0) {
      actions.push({
        id: 'messages',
        title: `${summary.unreadMessages} Unread Message(s)`,
        description: 'From your care team',
        icon: 'pi pi-envelope',
        route: '/messages',
        color: 'purple',
        priority: 2
      });
    }

    // If there are pending forms
    if (summary.pendingForms > 0) {
      actions.push({
        id: 'forms',
        title: 'Forms Pending',
        description: `${summary.pendingForms} form(s) need your attention`,
        icon: 'pi pi-file-edit',
        route: '/forms',
        color: 'orange',
        priority: 3
      });
    }

    // If outstanding balance
    if (summary.outstandingBalance > 0) {
      actions.push({
        id: 'billing',
        title: 'Outstanding Balance',
        description: `$${summary.outstandingBalance.toFixed(2)} due`,
        icon: 'pi pi-credit-card',
        route: '/billing',
        color: 'orange',
        priority: 4
      });
    }

    // Always show: quick search hint
    actions.push({
      id: 'search',
      title: 'Quick Search',
      description: 'Press Ctrl+K to find any feature instantly',
      icon: 'pi pi-search',
      route: '/dashboard',
      color: 'green',
      priority: 10
    });

    return actions.sort((a, b) => a.priority - b.priority).slice(0, 4);
  });

  get greeting(): string {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  }

  ngOnInit(): void {
    this.dataService.loadDashboardData();
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  checkIn(): void {
    console.log('Check in');
  }

  joinVideo(): void {
    console.log('Join video');
  }

  reschedule(): void {
    this.navigate('/appointments');
  }

  requestRefill(medId: string): void {
    this.dataService.requestRefill(medId);
  }

  openMessage(threadId: string): void {
    this.router.navigate(['/messages', threadId]);
  }

  dismissAlert(id: string): void {
    this.dataService.dismissAlert(id);
  }

  navigateAlert(route: string): void {
    this.router.navigate([route]);
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }
}
