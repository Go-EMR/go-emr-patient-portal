import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { Appointment } from '../../shared/data-access';

@Component({
  selector: 'app-appointment-card',
  standalone: true,
  imports: [CommonModule, ButtonModule, AvatarModule, TagModule],
  template: `
    @if (appointment) {
      <div class="appointment-detail">
        <div class="date-badge">
          <span class="month">{{ appointment.date | date:'MMM' }}</span>
          <span class="day">{{ appointment.date | date:'d' }}</span>
          <span class="time">{{ appointment.startTime }}</span>
        </div>
        <div class="info">
          <h3>{{ appointment.appointmentType }}</h3>
          <div class="provider">
            <p-avatar [label]="getInitials(appointment.providerName)" shape="circle" [style]="{ 'background-color': 'var(--teal-100)', color: 'var(--teal-700)' }"></p-avatar>
            <div>
              <span class="name">{{ appointment.providerName }}</span>
              <span class="specialty">{{ appointment.providerSpecialty }}</span>
            </div>
          </div>
          <div class="location">
            <i class="pi" [class.pi-video]="appointment.telehealth" [class.pi-map-marker]="!appointment.telehealth"></i>
            <span>{{ appointment.telehealth ? 'Video Visit' : appointment.locationName }}</span>
          </div>
          @if (appointment.telehealth) { <p-tag value="Telehealth" icon="pi pi-video" severity="info"></p-tag> }
        </div>
        <div class="actions">
          @if (appointment.telehealth) {
            <button pButton label="Join Video" icon="pi pi-video" class="p-button-success" (click)="joinVideo.emit()"></button>
          } @else {
            <button pButton label="Check In" icon="pi pi-check" class="p-button-success" (click)="checkIn.emit()"></button>
          }
          <button pButton label="Reschedule" icon="pi pi-calendar" class="p-button-outlined" (click)="reschedule.emit()"></button>
        </div>
      </div>
    } @else {
      <div class="empty">
        <i class="pi pi-calendar-plus"></i>
        <p>No upcoming appointments</p>
        <button pButton label="Book Now" icon="pi pi-plus" (click)="bookNew.emit()"></button>
      </div>
    }
  `,
  styles: [`
    .appointment-detail { display: flex; gap: 1.5rem; align-items: flex-start; }
    .date-badge { display: flex; flex-direction: column; align-items: center; padding: 1rem; background: var(--primary-50); border-radius: var(--border-radius); min-width: 80px; }
    .date-badge .month { font-size: 0.75rem; text-transform: uppercase; color: var(--primary-600); font-weight: 600; }
    .date-badge .day { font-size: 2rem; font-weight: 700; color: var(--primary-700); line-height: 1; }
    .date-badge .time { font-size: 0.875rem; color: var(--primary-600); margin-top: 0.25rem; }
    .info { flex: 1; }
    .info h3 { margin: 0 0 0.75rem; font-size: 1.125rem; font-weight: 600; }
    .provider { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .provider .name { display: block; font-weight: 500; }
    .provider .specialty { display: block; font-size: 0.875rem; color: var(--text-color-secondary); }
    .location { display: flex; align-items: center; gap: 0.5rem; color: var(--text-color-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; }
    .actions { display: flex; flex-direction: column; gap: 0.5rem; }
    .empty { display: flex; flex-direction: column; align-items: center; padding: 3rem 2rem; text-align: center; }
    .empty i { font-size: 3rem; color: var(--surface-300); margin-bottom: 1rem; }
    .empty p { color: var(--text-color-secondary); margin: 0 0 1rem; }
  `]
})
export class AppointmentCardComponent {
  @Input() appointment: Appointment | null = null;
  @Output() joinVideo = new EventEmitter<void>();
  @Output() checkIn = new EventEmitter<void>();
  @Output() reschedule = new EventEmitter<void>();
  @Output() bookNew = new EventEmitter<void>();

  getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  }
}
