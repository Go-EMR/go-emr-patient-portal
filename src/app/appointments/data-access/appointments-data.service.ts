import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Appointment } from '../../shared/data-access';
import { EmrSyncService } from '../../shared/data-access';
import { AuthService } from '../../auth/data-access/auth.service';

interface EmrAppointment {
  id: string;
  status: string;
  appointmentType: string;
  start: string;
  end: string;
  duration: number;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  facilityId: string;
  facilityName: string;
  roomName?: string;
  reasonDescription: string;
  isTelehealth?: boolean;
  telehealthLink?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentsDataService {
  private readonly http = inject(HttpClient);
  private readonly emrSync = inject(EmrSyncService);
  private readonly authService = inject(AuthService);

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

    const patientId = this.authService.user()?.patientId || localStorage.getItem('portal_patient_id') || '';
    if (!patientId) {
      this._appointments.set([]);
      this._isLoading.set(false);
      return;
    }

    try {
      // Use portal API which is patient-scoped and returns correct data
      const resp = await fetch(
        `/api/v1/portal/patients/${patientId}/appointments?page_size=50`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('portal_token') || ''}` } }
      );
      if (resp.ok) {
        const data = await resp.json();
        const appointments = data.appointments ?? [];
        const mapped = appointments.map((a: any) => this.mapPortalAppointment(a));
        this._appointments.set(mapped);
      } else {
        this._appointments.set([]);
      }
    } catch {
      this._appointments.set([]);
    }

    this._isLoading.set(false);
  }

  private mapPortalAppointment(a: any): Appointment {
    const start = new Date(a.start_time);
    const end = new Date(a.end_time);
    const now = new Date();
    const isPast = start < now;

    return {
      id: a.id,
      providerId: a.provider_id || '',
      providerName: a.provider_name || '',
      providerSpecialty: a.provider_specialty || 'General Medicine',
      locationId: a.facility_id || '',
      locationName: a.facility_name || '',
      locationAddress: '',
      date: start,
      startTime: start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      endTime: end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      appointmentType: a.appointment_type || a.reason || 'Appointment',
      status: this.mapStatus(a.status, isPast),
      confirmationRequired: a.status === 'booked' && !isPast,
      canCancel: !isPast && a.status !== 'cancelled' && a.status !== 'fulfilled',
      canReschedule: !isPast && a.status === 'booked',
      telehealth: a.is_telehealth ?? false,
      telehealthUrl: a.telehealth_url,
      formsRequired: [],
    };
  }

  async confirmAppointment(appointmentId: string): Promise<boolean> {
    await this.emrSync.pushChange('Appointment', 'confirm', { appointmentId });
    this._appointments.update(appts =>
      appts.map(a => a.id === appointmentId ? { ...a, status: 'confirmed' as const, confirmationRequired: false } : a)
    );
    return true;
  }

  async cancelAppointment(appointmentId: string, reason: string): Promise<boolean> {
    try {
      await this.http.post(`/api/v1/appointments/${appointmentId}/cancel`, { reason }).toPromise();
      this._appointments.update(appts =>
        appts.map(a => a.id === appointmentId ? { ...a, status: 'cancelled' as const } : a)
      );
      return true;
    } catch {
      return false;
    }
  }

  async checkIn(appointmentId: string): Promise<boolean> {
    try {
      await this.http.post(`/api/v1/appointments/${appointmentId}/check-in`, {}).toPromise();
      this._appointments.update(appts =>
        appts.map(a => a.id === appointmentId ? { ...a, status: 'checked-in' as const } : a)
      );
      return true;
    } catch {
      return false;
    }
  }

  async bookAppointment(req: {
    patientId: string;
    providerId: string;
    startTime: string;  // ISO 8601
    reason?: string;
    notes?: string;
    facilityId?: string;
  }): Promise<boolean> {
    const token = localStorage.getItem('portal_token') || '';
    const resp = await fetch('/api/v1/portal/appointments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patient_id: req.patientId,
        provider_id: req.providerId,
        start_time: req.startTime,
        reason: req.reason || '',
        notes: req.notes || '',
        facility_id: req.facilityId || '',
      }),
    });
    if (resp.ok) {
      await this.loadAppointments();
      return true;
    }
    return false;
  }

  async loadProviders(): Promise<any[]> {
    const patientId = this.authService.user()?.patientId || localStorage.getItem('portal_patient_id') || '';
    const token = localStorage.getItem('portal_token') || '';
    const resp = await fetch(
      `/api/v1/portal/patients/${patientId}/providers`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (resp.ok) {
      const data = await resp.json();
      return data.providers ?? data ?? [];
    }
    return [];
  }

  async loadSlots(providerId: string, date: string): Promise<any[]> {
    const token = localStorage.getItem('portal_token') || '';
    const resp = await fetch(
      `/api/v1/portal/appointments/slots?provider_id=${providerId}&date=${date}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (resp.ok) {
      const data = await resp.json();
      return data.slots ?? data ?? [];
    }
    return [];
  }

  private mapPatientId(portalPatientId: string): string {
    const mapping: Record<string, string> = {
      'PAT-010': 'pat-010',
      'PAT-011': 'pat-011',
      'PAT-012': 'pat-012',
      'PAT-013': 'pat-013',
      'PAT-001': 'pat-001',
      'PAT-002': 'pat-002',
      'PAT-003': 'pat-003',
    };
    return mapping[portalPatientId] || portalPatientId.toLowerCase();
  }

  private mapToPortalAppointment(emr: EmrAppointment): Appointment {
    const startDate = new Date(emr.start);
    const endDate = new Date(emr.end);
    const now = new Date();
    const isPast = startDate < now;

    return {
      id: emr.id,
      providerId: emr.providerId,
      providerName: emr.providerName,
      providerSpecialty: this.getProviderSpecialty(emr.providerId),
      locationId: emr.facilityId,
      locationName: emr.facilityName,
      locationAddress: '100 Main Street',
      date: startDate,
      startTime: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      endTime: endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      appointmentType: this.formatAppointmentType(emr.appointmentType),
      status: this.mapStatus(emr.status, isPast),
      confirmationRequired: emr.status === 'booked' && !isPast,
      canCancel: !isPast && emr.status !== 'cancelled' && emr.status !== 'fulfilled',
      canReschedule: !isPast && emr.status === 'booked',
      telehealth: emr.isTelehealth ?? false,
      telehealthUrl: emr.telehealthLink,
      formsRequired: [],
    };
  }

  private mapStatus(emrStatus: string, isPast: boolean): Appointment['status'] {
    switch (emrStatus) {
      case 'booked': return isPast ? 'completed' : 'confirmed';
      case 'checked-in': return 'checked-in';
      case 'in-progress': return 'checked-in';
      case 'fulfilled': return 'completed';
      case 'cancelled': return 'cancelled';
      case 'noshow': return 'no-show';
      default: return 'scheduled';
    }
  }

  private getProviderSpecialty(providerId: string): string {
    const specialties: Record<string, string> = {
      'prov-001': 'Internal Medicine',
      'prov-002': 'Cardiology',
      'prov-003': 'Pediatrics',
      'prov-004': 'Psychology',
    };
    return specialties[providerId] || 'General Medicine';
  }

  private formatAppointmentType(type: string): string {
    const labels: Record<string, string> = {
      'routine': 'Routine Visit',
      'followup': 'Follow-up',
      'new-patient': 'New Patient Visit',
      'urgent': 'Urgent Care',
      'physical': 'Annual Physical',
      'wellness': 'Wellness Visit',
      'procedure': 'Procedure',
      'telehealth': 'Telehealth',
      'lab-review': 'Lab Review',
      'consultation': 'Consultation',
    };
    return labels[type] || type;
  }
}
