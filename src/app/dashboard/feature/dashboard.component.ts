import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DashboardDataService } from '../data-access';
import { StatCardComponent, AppointmentCardComponent, VitalsGridComponent } from '../ui';
import { AuthService } from '../../auth/data-access';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, SkeletonModule, StatCardComponent, AppointmentCardComponent, VitalsGridComponent],
  template: `
    <div class="dashboard">
      <section class="welcome-banner">
        <div class="welcome-content">
          <span class="greeting">{{ greeting }},</span>
          <h1 class="name">{{ userName() }}</h1>
          <p class="message">Here's your health summary for today</p>
        </div>
        <div class="welcome-actions">
          <button pButton label="Book Appointment" icon="pi pi-calendar-plus" class="p-button-lg" (click)="navigate('/appointments')"></button>
          <button pButton label="Send Message" icon="pi pi-envelope" class="p-button-lg p-button-outlined" (click)="navigate('/messages')"></button>
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
    .welcome-banner { display: flex; align-items: center; justify-content: space-between; background: linear-gradient(135deg, var(--primary-50) 0%, var(--surface-0) 100%); border-radius: var(--border-radius); padding: 2rem; margin-bottom: 1.5rem; }
    .greeting { font-size: 1rem; color: var(--text-color-secondary); }
    .name { font-size: 2rem; font-weight: 700; margin: 0.25rem 0; }
    .message { color: var(--text-color-secondary); margin: 0; }
    .welcome-actions { display: flex; gap: 1rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
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
    @media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } .content-grid { grid-template-columns: 1fr; } }
    @media (max-width: 768px) { .welcome-banner { flex-direction: column; text-align: center; } .welcome-actions { flex-direction: column; width: 100%; } .stats-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent implements OnInit {
  readonly dataService = inject(DashboardDataService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly summary = computed(() => this.dataService.healthSummary());
  readonly userName = computed(() => { const user = this.authService.user(); return user ? `${user.firstName} ${user.lastName}` : 'Patient'; });
  get greeting(): string { const hour = new Date().getHours(); return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'; }
  ngOnInit(): void { this.dataService.loadDashboardData(); }
  navigate(route: string): void { this.router.navigate([route]); }
  checkIn(): void { console.log('Check in'); }
  joinVideo(): void { console.log('Join video'); }
  reschedule(): void { this.navigate('/appointments'); }
  requestRefill(medId: string): void { this.dataService.requestRefill(medId); }
  openMessage(threadId: string): void { this.router.navigate(['/messages', threadId]); }
}
