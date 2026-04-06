import { Injectable, signal, computed, inject } from '@angular/core';
import { Appointment, Medication, LabResult, VitalRecord, VitalDisplay, MessageThread, PatientForm, HealthSummary } from '../../shared/data-access';
import { EmrSyncService } from '../../shared/data-access';
import { AuthService } from '../../auth/data-access/auth.service';

export interface HealthAlert {
  id: string;
  type: 'flagged_result' | 'missed_medication' | 'overdue_screening' | 'general';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
  dismissed: boolean;
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private readonly emrSync = inject(EmrSyncService);
  private readonly authService = inject(AuthService);

  private readonly _appointments = signal<Appointment[]>([]);
  private readonly _medications = signal<Medication[]>([]);
  private readonly _labResults = signal<LabResult[]>([]);
  private readonly _vitals = signal<VitalRecord[]>([]);
  private readonly _messages = signal<MessageThread[]>([]);
  private readonly _forms = signal<PatientForm[]>([]);
  private readonly _healthAlerts = signal<HealthAlert[]>([]);
  private readonly _isLoading = signal(false);

  readonly appointments = this._appointments.asReadonly();
  readonly medications = this._medications.asReadonly();
  readonly labResults = this._labResults.asReadonly();
  readonly vitals = this._vitals.asReadonly();
  readonly messages = this._messages.asReadonly();
  readonly forms = this._forms.asReadonly();
  readonly healthAlerts = this._healthAlerts.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  readonly activeAlerts = computed(() => this._healthAlerts().filter(a => !a.dismissed));

  readonly nextAppointment = computed(() => {
    const now = new Date();
    // Find the EARLIEST upcoming appointment (not cancelled/completed/no-show).
    const upcoming = this._appointments()
      .filter(a => new Date(a.date) >= now && a.status !== 'completed' && a.status !== 'cancelled' && a.status !== 'no-show')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming[0] ?? null;
  });
  readonly activeMedications = computed(() => this._medications().filter(m => m.status === 'active'));
  readonly newLabResults = computed(() => this._labResults().filter(l => l.isNew));
  readonly unreadMessageCount = computed(() => this._messages().reduce((sum, t) => sum + t.unreadCount, 0));
  readonly pendingForms = computed(() => this._forms().filter(f => f.status === 'pending' || f.status === 'in_progress'));

  readonly vitalsDisplay = computed<VitalDisplay[]>(() => {
    const records = this._vitals();
    const current = records[0];
    const prev = records[1];
    if (!current) return [];

    const getTrend = (c?: number, p?: number): 'up' | 'down' | 'stable' | undefined => {
      if (c === undefined || p === undefined) return undefined;
      return c > p * 1.02 ? 'up' : c < p * 0.98 ? 'down' : 'stable';
    };

    const displays: VitalDisplay[] = [];
    if (current.bloodPressure) displays.push({ id: `${current.id}-bp`, type: 'Blood Pressure', value: `${current.bloodPressure.systolic}/${current.bloodPressure.diastolic}`, unit: 'mmHg', recordedDate: current.date, trend: getTrend(current.bloodPressure.systolic, prev?.bloodPressure?.systolic) });
    if (current.heartRate) displays.push({ id: `${current.id}-hr`, type: 'Heart Rate', value: current.heartRate, unit: 'bpm', recordedDate: current.date, trend: getTrend(current.heartRate, prev?.heartRate) });
    if (current.weight) displays.push({ id: `${current.id}-wt`, type: 'Weight', value: current.weight.value, unit: current.weight.unit, recordedDate: current.date, trend: getTrend(current.weight.value, prev?.weight?.value) });
    if (current.oxygenSaturation) displays.push({ id: `${current.id}-o2`, type: 'O2 Saturation', value: current.oxygenSaturation, unit: '%', recordedDate: current.date, trend: getTrend(current.oxygenSaturation, prev?.oxygenSaturation) });
    return displays;
  });

  readonly healthSummary = computed<HealthSummary>(() => {
    const next = this.nextAppointment();
    return {
      upcomingAppointments: this._appointments().filter(a => new Date(a.date) >= new Date() && a.status !== 'completed' && a.status !== 'cancelled' && a.status !== 'no-show').length,
      upcomingAppointment: next ? { date: next.date, providerName: next.providerName, type: next.appointmentType } : undefined,
      activeMedications: this.activeMedications().length,
      allergies: [],
      recentLabResults: this.newLabResults().length,
      unreadMessages: this.unreadMessageCount(),
      pendingForms: this.pendingForms().length,
      outstandingBalance: 125.00
    };
  });

  async loadDashboardData(): Promise<void> {
    this._isLoading.set(true);

    const patientId = localStorage.getItem('portal_patient_id') || this.authService.user()?.patientId;
    const token = localStorage.getItem('portal_token');

    if (patientId && token) {
      await this.loadFromApi(patientId, token);
    }
    // When no token is present (demo/offline mode), all signals remain empty arrays.

    this._isLoading.set(false);
  }

  private async loadFromApi(patientId: string, token: string): Promise<void> {
    const headers: Record<string, string> = { 'Authorization': `Bearer ${token}` };

    // --- Appointments ---
    try {
      const aptResp = await fetch(
        `/api/v1/portal/patients/${patientId}/appointments?page=1&page_size=20`,
        { headers }
      );
      if (aptResp.ok) {
        const data: {
          appointments: Array<{
            id: string;
            patient_id: string;
            provider_id: string;
            provider_name: string;
            appointment_type: string;
            facility_name: string;
            is_telehealth: boolean;
            status: string;
            reason: string;
            notes: string;
            start_time: string;
            end_time: string;
          }>;
        } = await aptResp.json();
        const now = new Date();
        const mapped: Appointment[] = (data.appointments ?? []).map(a => {
          const start = new Date(a.start_time);
          const end = new Date(a.end_time);
          const isPast = start < now;
          return {
            id: a.id,
            providerId: a.provider_id || '',
            providerName: a.provider_name || '',
            providerSpecialty: '',
            locationId: '',
            locationName: a.facility_name || '',
            locationAddress: '',
            date: start,
            startTime: start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            endTime: end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            appointmentType: a.appointment_type || a.reason || 'Appointment',
            status: this.mapApiAppointmentStatus(a.status, isPast),
            confirmationRequired: a.status === 'booked' && !isPast,
            canCancel: !isPast && a.status !== 'cancelled' && a.status !== 'fulfilled',
            canReschedule: !isPast && a.status === 'booked',
            telehealth: a.is_telehealth ?? false,
            formsRequired: []
          };
        });
        this._appointments.set(mapped);
      }
    } catch { /* leave as empty array */ }

    // --- Vitals ---
    try {
      const vitalsResp = await fetch(
        `/api/v1/portal/patients/${patientId}/vitals?page=1&page_size=50`,
        { headers }
      );
      if (vitalsResp.ok) {
        const data: {
          vitals: Array<{
            id: string;
            type: string;
            value: string;
            unit: string;
            recorded_at: string;
          }>;
        } = await vitalsResp.json();
        const records = this.groupVitalRows(data.vitals ?? []);
        if (records.length > 0) {
          this._vitals.set(records);
        }
      }
    } catch { /* leave as empty array */ }

    // --- Medications ---
    try {
      const medsResp = await fetch(
        `/api/v1/portal/patients/${patientId}/medications?page=1&page_size=50`,
        { headers }
      );
      if (medsResp.ok) {
        const data: {
          medications: Array<{
            id: string;
            name: string;
            dosage: string;
            frequency: string;
            prescriber: string;
            pharmacy: string;
            status: string;
            refills_left: number;
            created_at: string;
          }>;
        } = await medsResp.json();
        const mapped: Medication[] = (data.medications ?? []).map(m => ({
          id: m.id,
          medicationName: m.name || 'Medication',
          genericName: '',
          dosage: m.dosage || '',
          frequency: m.frequency || '',
          route: '',
          prescribedDate: new Date(m.created_at),
          prescribedBy: m.prescriber || '',
          startDate: new Date(m.created_at),
          status: (m.status as Medication['status']) || 'active',
          refillsRemaining: m.refills_left ?? 0,
          refillsTotal: m.refills_left ?? 0,
          lastFilledDate: undefined,
          pharmacy: m.pharmacy || '',
          instructions: '',
          isControlled: false,
          canRequestRefill: (m.refills_left ?? 0) > 0
        }));
        this._medications.set(mapped);
      }
    } catch { /* leave as empty array */ }

    // --- Lab Results ---
    try {
      const labsResp = await fetch(
        `/api/v1/portal/patients/${patientId}/labs?page=1&page_size=50`,
        { headers }
      );
      if (labsResp.ok) {
        const data: {
          labs: Array<{
            id: string;
            order_id: string;
            test_name: string;
            order_date: string;
            result_date?: string;
            ordered_by: string;
            status: string;
            has_abnormal: boolean;
            is_new: boolean;
          }>;
        } = await labsResp.json();
        const mapped: LabResult[] = (data.labs ?? []).map(l => ({
          id: l.id,
          orderId: l.order_id,
          testName: l.test_name,
          orderDate: new Date(l.order_date),
          resultDate: l.result_date ? new Date(l.result_date) : undefined,
          orderedBy: l.ordered_by,
          status: (l.status as LabResult['status']) || 'pending',
          hasAbnormal: l.has_abnormal ?? false,
          isNew: l.is_new ?? false
        }));
        this._labResults.set(mapped);
      }
    } catch { /* leave as empty array */ }

    // --- Messages ---
    try {
      const msgResp = await fetch(
        `/api/v1/portal/patients/${patientId}/messages?page=1&page_size=20`,
        { headers }
      );
      if (msgResp.ok) {
        const data: {
          threads: Array<{
            id: string;
            subject: string;
            provider_id: string;
            provider_name: string;
            patient_name: string;
            unread_count: number;
            status: string;
            created_at: string;
            updated_at: string;
          }>;
        } = await msgResp.json();
        const mapped: MessageThread[] = (data.threads ?? []).map(t => ({
          id: t.id,
          subject: t.subject || 'Message',
          category: 'general' as MessageThread['category'],
          participants: [
            { id: '', name: t.patient_name || '', type: 'patient' as const },
            { id: t.provider_id || '', name: t.provider_name || '', type: 'provider' as const },
          ],
          lastMessageAt: new Date(t.updated_at || t.created_at),
          lastMessagePreview: t.subject || '',
          unreadCount: t.unread_count ?? 0,
          status: (t.status as MessageThread['status']) || 'open',
          createdAt: new Date(t.created_at)
        }));
        this._messages.set(mapped);
      }
    } catch { /* leave as empty array */ }

    // --- Forms ---
    try {
      const formsResp = await fetch(
        `/api/v1/portal/patients/${patientId}/forms?page=1&page_size=20`,
        { headers }
      );
      if (formsResp.ok) {
        const data: {
          forms: Array<{
            id: string;
            title: string;
            description: string;
            type: string;
            status: string;
            due_date?: string;
            appointment_id?: string;
            progress: number;
          }>;
        } = await formsResp.json();
        const mapped: PatientForm[] = (data.forms ?? []).map(f => ({
          id: f.id,
          title: f.title,
          description: f.description ?? '',
          type: (f.type as PatientForm['type']) || 'intake',
          status: (f.status as PatientForm['status']) || 'pending',
          dueDate: f.due_date ? new Date(f.due_date) : undefined,
          appointmentId: f.appointment_id,
          progress: f.progress ?? 0
        }));
        this._forms.set(mapped);
      }
    } catch { /* leave as empty array */ }

    // Health alerts are derived locally from the loaded data rather than a
    // separate API call; no backend endpoint exists yet.
    // TODO: Implement backend endpoint for /api/v1/portal/patients/{id}/alerts
    this._healthAlerts.set([]);
  }

  /**
   * Groups flat vital rows (one per measurement type per encounter) into
   * VitalRecord objects (one per encounter date), matching the shape that
   * vitalsDisplay computed signal expects.
   */
  private groupVitalRows(rows: Array<{ id: string; type: string; value: string; unit: string; recorded_at: string }>): VitalRecord[] {
    const byEncounter = new Map<string, { date: Date; rows: typeof rows }>();

    for (const row of rows) {
      const dashIdx = row.id.lastIndexOf('-');
      const encKey = dashIdx > 0 ? row.id.slice(0, dashIdx) : row.id;
      if (!byEncounter.has(encKey)) {
        byEncounter.set(encKey, { date: new Date(row.recorded_at), rows: [] });
      }
      byEncounter.get(encKey)!.rows.push(row);
    }

    const records: VitalRecord[] = [];
    let idx = 0;
    for (const [encKey, enc] of byEncounter) {
      const rec: VitalRecord = { id: encKey || `V${idx}`, date: enc.date };

      for (const row of enc.rows) {
        const type = row.type.toLowerCase();
        const val = row.value;
        const unit = row.unit || '';

        if (type === 'blood_pressure' || type === 'bloodpressure') {
          const parts = val.split('/');
          if (parts.length === 2) {
            rec.bloodPressure = { systolic: parseFloat(parts[0]), diastolic: parseFloat(parts[1]) };
          }
        } else if (type === 'heart_rate' || type === 'heartrate' || type === 'pulse') {
          rec.heartRate = parseFloat(val);
        } else if (type === 'weight') {
          rec.weight = { value: parseFloat(val), unit: unit || 'kg' };
        } else if (type === 'height') {
          rec.height = { value: parseFloat(val), unit: unit || 'cm' };
        } else if (type === 'bmi') {
          rec.bmi = parseFloat(val);
        } else if (type === 'oxygen_saturation' || type === 'spo2' || type === 'oxygensaturation') {
          rec.oxygenSaturation = parseFloat(val);
        } else if (type === 'temperature') {
          rec.temperature = { value: parseFloat(val), unit: unit || 'C' };
        } else if (type === 'respiratory_rate' || type === 'respiratoryrate') {
          rec.respiratoryRate = parseFloat(val);
        }
      }
      records.push(rec);
      idx++;
    }
    return records;
  }

  private mapApiAppointmentStatus(
    apiStatus: string,
    isPast: boolean
  ): Appointment['status'] {
    switch (apiStatus) {
      case 'booked': return isPast ? 'completed' : 'confirmed';
      case 'checked-in':
      case 'in-progress': return 'checked-in';
      case 'fulfilled': return 'completed';
      case 'cancelled': return 'cancelled';
      case 'noshow': return 'no-show';
      default: return isPast ? 'completed' : 'scheduled';
    }
  }

  dismissAlert(id: string): void {
    this._healthAlerts.update(alerts => alerts.map(a => a.id === id ? { ...a, dismissed: true } : a));
  }

  async requestRefill(medicationId: string): Promise<boolean> {
    return (await this.emrSync.requestRefill(medicationId)).success;
  }

  markLabResultViewed(labId: string): void {
    this._labResults.update(results => results.map(r => r.id === labId ? { ...r, isNew: false } : r));
  }

  markMessageRead(threadId: string): void {
    this._messages.update(threads => threads.map(t => t.id === threadId ? { ...t, unreadCount: 0 } : t));
  }
}
