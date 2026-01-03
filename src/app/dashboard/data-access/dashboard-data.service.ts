import { Injectable, signal, computed, inject } from '@angular/core';
import { Appointment, Medication, LabResult, VitalRecord, VitalDisplay, MessageThread, PatientForm, HealthSummary } from '../../shared/data-access';
import { EmrSyncService } from '../../shared/data-access';

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private readonly emrSync = inject(EmrSyncService);

  private readonly _appointments = signal<Appointment[]>([]);
  private readonly _medications = signal<Medication[]>([]);
  private readonly _labResults = signal<LabResult[]>([]);
  private readonly _vitals = signal<VitalRecord[]>([]);
  private readonly _messages = signal<MessageThread[]>([]);
  private readonly _forms = signal<PatientForm[]>([]);
  private readonly _isLoading = signal(false);

  readonly appointments = this._appointments.asReadonly();
  readonly medications = this._medications.asReadonly();
  readonly labResults = this._labResults.asReadonly();
  readonly vitals = this._vitals.asReadonly();
  readonly messages = this._messages.asReadonly();
  readonly forms = this._forms.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  readonly nextAppointment = computed(() => this._appointments().find(a => a.status === 'scheduled' || a.status === 'confirmed') ?? null);
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
      upcomingAppointments: this._appointments().filter(a => a.status === 'scheduled' || a.status === 'confirmed').length,
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
    await new Promise(r => setTimeout(r, 300));
    
    this._appointments.set([
      { id: 'APT-001', providerId: 'P1', providerName: 'Dr. Sarah Johnson', providerSpecialty: 'Internal Medicine', locationId: 'L1', locationName: 'Main Clinic', locationAddress: '123 Medical Dr', date: new Date(Date.now() + 13 * 86400000), startTime: '10:00', endTime: '10:30', appointmentType: 'Annual Physical', status: 'confirmed', confirmationRequired: false, canCancel: true, canReschedule: true, telehealth: false, formsRequired: ['FORM-001'] }
    ]);
    this._medications.set([
      { id: 'MED-001', medicationName: 'Lisinopril', genericName: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', route: 'Oral', prescribedDate: new Date(), prescribedBy: 'Dr. Johnson', startDate: new Date(), status: 'active', refillsRemaining: 3, refillsTotal: 6, lastFilledDate: new Date(Date.now() - 30 * 86400000), pharmacy: 'CVS', instructions: 'Take with water', isControlled: false, canRequestRefill: true },
      { id: 'MED-002', medicationName: 'Metformin', genericName: 'Metformin HCl', dosage: '500mg', frequency: 'Twice daily', route: 'Oral', prescribedDate: new Date(), prescribedBy: 'Dr. Johnson', startDate: new Date(), status: 'active', refillsRemaining: 2, refillsTotal: 6, pharmacy: 'CVS', instructions: 'Take with meals', isControlled: false, canRequestRefill: true }
    ]);
    this._labResults.set([
      { id: 'LAB-001', orderId: 'O1', testName: 'Comprehensive Metabolic Panel', orderDate: new Date(Date.now() - 7 * 86400000), resultDate: new Date(Date.now() - 5 * 86400000), orderedBy: 'Dr. Johnson', status: 'resulted', hasAbnormal: false, isNew: true },
      { id: 'LAB-002', orderId: 'O2', testName: 'Lipid Panel', orderDate: new Date(Date.now() - 7 * 86400000), resultDate: new Date(Date.now() - 5 * 86400000), orderedBy: 'Dr. Johnson', status: 'resulted', hasAbnormal: true, isNew: true }
    ]);
    this._vitals.set([
      { id: 'V1', date: new Date(Date.now() - 5 * 86400000), height: { value: 70, unit: 'in' }, weight: { value: 185, unit: 'lbs' }, bmi: 26.5, bloodPressure: { systolic: 128, diastolic: 82 }, heartRate: 72, oxygenSaturation: 98 },
      { id: 'V2', date: new Date(Date.now() - 90 * 86400000), weight: { value: 188, unit: 'lbs' }, bmi: 27.0, bloodPressure: { systolic: 132, diastolic: 85 }, heartRate: 76, oxygenSaturation: 97 }
    ]);
    this._messages.set([
      { id: 'T1', subject: 'Question about medication', category: 'prescription', participants: [{ id: 'P1', name: 'John Smith', type: 'patient' }, { id: 'D1', name: 'Dr. Sarah Johnson', type: 'provider' }], lastMessageAt: new Date(Date.now() - 86400000), lastMessagePreview: 'Some mild side effects are normal...', unreadCount: 1, status: 'open', createdAt: new Date() },
      { id: 'T2', subject: 'Lab results ready', category: 'lab_results', participants: [{ id: 'P1', name: 'John Smith', type: 'patient' }, { id: 'D1', name: 'Dr. Sarah Johnson', type: 'provider' }], lastMessageAt: new Date(Date.now() - 5 * 86400000), lastMessagePreview: 'Your lab results are ready to view...', unreadCount: 1, status: 'open', createdAt: new Date() }
    ]);
    this._forms.set([
      { id: 'FORM-001', title: 'Pre-Visit Questionnaire', description: 'Complete before your visit', type: 'intake', status: 'pending', dueDate: new Date(Date.now() + 10 * 86400000), appointmentId: 'APT-001', progress: 0 }
    ]);
    
    this._isLoading.set(false);
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
