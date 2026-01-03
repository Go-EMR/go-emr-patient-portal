import { Injectable, signal, computed, inject } from '@angular/core';
import { Appointment } from '../../shared/data-access';
import { EmrSyncService } from '../../shared/data-access';

@Injectable({ providedIn: 'root' })
export class AppointmentsDataService {
  private readonly emrSync = inject(EmrSyncService);

  private readonly _appointments = signal<Appointment[]>([]);
  private readonly _isLoading = signal(false);

  readonly appointments = this._appointments.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  readonly upcomingAppointments = computed(() => 
    this._appointments().filter(a => a.status === 'scheduled' || a.status === 'confirmed')
  );

  readonly pastAppointments = computed(() => 
    this._appointments().filter(a => a.status === 'completed' || a.status === 'cancelled')
  );

  async loadAppointments(): Promise<void> {
    this._isLoading.set(true);
    await new Promise(r => setTimeout(r, 300));
    
    this._appointments.set([
      { id: 'APT-001', providerId: 'P1', providerName: 'Dr. Sarah Johnson', providerSpecialty: 'Internal Medicine', locationId: 'L1', locationName: 'Main Clinic', locationAddress: '123 Medical Dr', date: new Date(Date.now() + 13 * 86400000), startTime: '10:00', endTime: '10:30', appointmentType: 'Annual Physical', status: 'confirmed', confirmationRequired: false, canCancel: true, canReschedule: true, telehealth: false, formsRequired: ['FORM-001'] },
      { id: 'APT-002', providerId: 'P2', providerName: 'Dr. Michael Chen', providerSpecialty: 'Cardiology', locationId: 'L2', locationName: 'Heart Center', locationAddress: '456 Cardiac Way', date: new Date(Date.now() + 30 * 86400000), startTime: '14:00', endTime: '14:45', appointmentType: 'Follow-up', status: 'scheduled', confirmationRequired: true, canCancel: true, canReschedule: true, telehealth: true, telehealthUrl: 'https://telehealth.example.com/room/abc123', formsRequired: [] },
      { id: 'APT-003', providerId: 'P1', providerName: 'Dr. Sarah Johnson', providerSpecialty: 'Internal Medicine', locationId: 'L1', locationName: 'Main Clinic', locationAddress: '123 Medical Dr', date: new Date(Date.now() - 60 * 86400000), startTime: '09:00', endTime: '09:30', appointmentType: 'Sick Visit', status: 'completed', confirmationRequired: false, canCancel: false, canReschedule: false, telehealth: false, formsRequired: [] }
    ]);
    
    this._isLoading.set(false);
  }

  async confirmAppointment(appointmentId: string): Promise<boolean> {
    await this.emrSync.pushChange('Appointment', 'confirm', { appointmentId });
    this._appointments.update(appts => 
      appts.map(a => a.id === appointmentId ? { ...a, status: 'confirmed' as const, confirmationRequired: false } : a)
    );
    return true;
  }

  async cancelAppointment(appointmentId: string, reason: string): Promise<boolean> {
    await this.emrSync.pushChange('Appointment', 'cancel', { appointmentId, reason });
    this._appointments.update(appts => 
      appts.map(a => a.id === appointmentId ? { ...a, status: 'cancelled' as const } : a)
    );
    return true;
  }

  async checkIn(appointmentId: string): Promise<boolean> {
    await this.emrSync.pushChange('Appointment', 'check-in', { appointmentId });
    this._appointments.update(appts => 
      appts.map(a => a.id === appointmentId ? { ...a, status: 'checked-in' as const } : a)
    );
    return true;
  }
}
