import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { Appointment } from '../../shared/data-access';

type FilterType = 'all' | 'today' | 'this_week';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, TabViewModule, DialogModule, CalendarModule, DropdownModule],
  template: `
    <div class="appointments-page">
      <header class="page-header">
        <div><h1>Appointments</h1><p>Manage your upcoming and past appointments</p></div>
        <button pButton label="Book Appointment" icon="pi pi-plus" (click)="showBookingDialog = true"></button>
      </header>
      <p-tabView>
        <p-tabPanel header="Upcoming">
          <div class="filter-chips">
            <button pButton [class]="activeFilter() === 'all' ? 'filter-chip active' : 'filter-chip p-button-outlined'"
                    label="All" (click)="setFilter('all')"></button>
            <button pButton [class]="activeFilter() === 'today' ? 'filter-chip active' : 'filter-chip p-button-outlined'"
                    label="Today" (click)="setFilter('today')"></button>
            <button pButton [class]="activeFilter() === 'this_week' ? 'filter-chip active' : 'filter-chip p-button-outlined'"
                    label="This Week" (click)="setFilter('this_week')"></button>
          </div>
          <div class="appointments-list">
            @for (appt of filteredAppointments(); track appt.id) {
              <div class="appointment-card">
                <div class="date-badge"><span class="month">{{ appt.date | date:'MMM' }}</span><span class="day">{{ appt.date | date:'d' }}</span></div>
                <div class="info"><h3>{{ appt.appointmentType }}</h3><p><i class="pi pi-user"></i> {{ appt.providerName }}</p><p><i [class]="appt.telehealth ? 'pi pi-video' : 'pi pi-map-marker'"></i> {{ appt.telehealth ? 'Video Visit' : appt.locationName }}</p><p><i class="pi pi-clock"></i> {{ appt.startTime }}</p></div>
                <div class="actions">
                  @if (appt.telehealth) { <button pButton label="Join" icon="pi pi-video" class="p-button-success"></button> }
                  @else { <button pButton label="Check In" icon="pi pi-check" class="p-button-success"></button> }
                  <button pButton icon="pi pi-calendar" class="p-button-outlined"></button>
                </div>
              </div>
            } @empty {
              <div class="empty"><i class="pi pi-calendar"></i><h3>No {{ activeFilter() === 'all' ? 'upcoming' : activeFilter() === 'today' ? "today's" : "this week's" }} appointments</h3><button pButton label="Book Now" icon="pi pi-plus" (click)="showBookingDialog = true"></button></div>
            }
          </div>
        </p-tabPanel>
        <p-tabPanel header="Past"><div class="empty"><i class="pi pi-history"></i><p>Past appointments will appear here</p></div></p-tabPanel>
      </p-tabView>
      <p-dialog header="Book Appointment" [(visible)]="showBookingDialog" [modal]="true" [style]="{width: '500px'}">
        <div class="form"><div class="field"><label>Visit Type</label><p-dropdown [options]="visitTypes" [(ngModel)]="selectedType" placeholder="Select type" [style]="{width:'100%'}"></p-dropdown></div><div class="field"><label>Date</label><p-calendar [(ngModel)]="selectedDate" [minDate]="minDate" [style]="{width:'100%'}"></p-calendar></div></div>
        <ng-template pTemplate="footer"><button pButton label="Cancel" class="p-button-text" (click)="showBookingDialog = false"></button><button pButton label="Find Availability" icon="pi pi-search"></button></ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .appointments-page { max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .page-header h1 { margin: 0; }
    .page-header p { color: var(--text-color-secondary); margin: 0.5rem 0 0; }
    .filter-chips { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
    .filter-chip { border-radius: 20px; font-size: 0.875rem; padding: 0.5rem 1.25rem; }
    .filter-chip.active { background: var(--primary-color); border-color: var(--primary-color); color: white; }
    .filter-chip.p-button-outlined { color: var(--text-color-secondary); border-color: var(--surface-border); }
    .filter-chip.p-button-outlined:hover { background: var(--surface-hover); }
    .appointments-list { display: flex; flex-direction: column; gap: 1rem; }
    .appointment-card { display: flex; gap: 1.5rem; padding: 1.5rem; background: var(--surface-card); border-radius: var(--border-radius); box-shadow: var(--card-shadow); }
    .date-badge { display: flex; flex-direction: column; align-items: center; min-width: 70px; padding: 1rem; background: var(--primary-50); border-radius: var(--border-radius); }
    .date-badge .month { font-size: 0.75rem; text-transform: uppercase; color: var(--primary-600); font-weight: 600; }
    .date-badge .day { font-size: 1.75rem; font-weight: 700; color: var(--primary-700); }
    .info { flex: 1; }
    .info h3 { margin: 0 0 0.5rem; }
    .info p { margin: 0.25rem 0; color: var(--text-color-secondary); display: flex; align-items: center; gap: 0.5rem; }
    .actions { display: flex; flex-direction: column; gap: 0.5rem; }
    .empty { text-align: center; padding: 4rem 2rem; }
    .empty i { font-size: 4rem; color: var(--surface-300); }
    .empty h3 { margin: 1rem 0 1.5rem; }
    .form .field { margin-bottom: 1.5rem; }
    .form label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
  `]
})
export class AppointmentsComponent {
  showBookingDialog = false;
  selectedType: string | null = null;
  selectedDate: Date | null = null;
  minDate = new Date();
  visitTypes = [{ label: 'Annual Physical', value: 'annual' }, { label: 'Follow-up', value: 'followup' }, { label: 'Sick Visit', value: 'sick' }];

  activeFilter = signal<FilterType>('all');

  appointments = signal<Appointment[]>([
    { id: 'APT-001', providerId: 'P1', providerName: 'Dr. Sarah Johnson', providerSpecialty: 'Internal Medicine', locationId: 'L1', locationName: 'Main Clinic', locationAddress: '123 Medical Dr', date: new Date(Date.now() + 13 * 86400000), startTime: '10:00 AM', endTime: '10:30 AM', appointmentType: 'Annual Physical', status: 'confirmed', confirmationRequired: false, canCancel: true, canReschedule: true, telehealth: false, formsRequired: [] },
    { id: 'APT-002', providerId: 'P2', providerName: 'Dr. Michael Chen', providerSpecialty: 'Cardiology', locationId: 'L2', locationName: 'Heart Center', locationAddress: '456 Cardio Blvd', date: new Date(Date.now() + 1 * 86400000), startTime: '2:00 PM', endTime: '2:30 PM', appointmentType: 'Follow-up', status: 'confirmed', confirmationRequired: false, canCancel: true, canReschedule: true, telehealth: true, telehealthUrl: 'https://telehealth.example.com', formsRequired: [] },
    { id: 'APT-003', providerId: 'P1', providerName: 'Dr. Sarah Johnson', providerSpecialty: 'Internal Medicine', locationId: 'L1', locationName: 'Main Clinic', locationAddress: '123 Medical Dr', date: new Date(), startTime: '11:00 AM', endTime: '11:30 AM', appointmentType: 'Lab Work', status: 'scheduled', confirmationRequired: true, canCancel: true, canReschedule: true, telehealth: false, formsRequired: [] }
  ]);

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

  setFilter(filter: FilterType): void {
    this.activeFilter.set(filter);
  }
}
