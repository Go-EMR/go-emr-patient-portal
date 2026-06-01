import { Injectable, signal, computed } from '@angular/core';

export interface CheckInAppointment {
  id: string;
  providerName: string;
  providerSpecialty: string;
  providerInitials: string;
  date: Date;
  startTime: string;
  endTime: string;
  locationName: string;
  locationAddress: string;
  appointmentType: string;
  department: string;
}

export interface DemographicsData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
}

export interface InsuranceData {
  planName: string;
  memberId: string;
  groupNumber: string;
  policyHolder: string;
  copay: string;
  needsUpdate: boolean;
}

export interface ConsentData {
  treatmentConsent: boolean;
  hipaaConsent: boolean;
  telemedConsent: boolean;
  financialConsent: boolean;
}

export interface ArrivalData {
  estimatedArrivalTime: string;
  specialNeeds: string;
  parkingNeeds: boolean;
  wheelchairNeeds: boolean;
  interpreterNeeds: boolean;
  interpreterLanguage: string;
}

export interface CheckInResult {
  tokenNumber: string;
  estimatedWait: string;
  checkInTime: Date;
}

@Injectable({ providedIn: 'root' })
export class CheckInService {
  private readonly _appointment = signal<CheckInAppointment | null>(null);
  private readonly _demographics = signal<DemographicsData>({
    firstName: 'Alex',
    lastName: 'Johnson',
    dateOfBirth: '1985-06-15',
    address: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'IL',
    zip: '62701',
    phone: '(217) 555-0147',
    email: 'alex.johnson@email.com',
  });
  private readonly _insurance = signal<InsuranceData>({
    planName: 'BlueCross BlueShield PPO',
    memberId: 'BCB-0047-2891',
    groupNumber: 'GRP-58302',
    policyHolder: 'Alex Johnson',
    copay: '$25',
    needsUpdate: false,
  });
  private readonly _consent = signal<ConsentData>({
    treatmentConsent: false,
    hipaaConsent: false,
    telemedConsent: false,
    financialConsent: false,
  });
  private readonly _arrival = signal<ArrivalData>({
    estimatedArrivalTime: '',
    specialNeeds: '',
    parkingNeeds: false,
    wheelchairNeeds: false,
    interpreterNeeds: false,
    interpreterLanguage: '',
  });
  private readonly _isLoading = signal(false);
  private readonly _checkInResult = signal<CheckInResult | null>(null);

  readonly appointment = this._appointment.asReadonly();
  readonly demographics = this._demographics.asReadonly();
  readonly insurance = this._insurance.asReadonly();
  readonly consent = this._consent.asReadonly();
  readonly arrival = this._arrival.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly checkInResult = this._checkInResult.asReadonly();

  readonly allConsentsGiven = computed(() => {
    const c = this._consent();
    return c.treatmentConsent && c.hipaaConsent && c.financialConsent;
  });

  loadAppointment(appointmentId: string): void {
    // Mock appointment matching the appointments service data
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    this._appointment.set({
      id: appointmentId,
      providerName: 'Dr. Sarah Johnson',
      providerSpecialty: 'Internal Medicine',
      providerInitials: 'SJ',
      date: tomorrow,
      startTime: '10:00',
      endTime: '10:30',
      locationName: 'AuraHealth Main Clinic',
      locationAddress: '123 Medical Drive, Suite 200, Springfield, IL 62701',
      appointmentType: 'Annual Physical',
      department: 'General Medicine',
    });
  }

  updateDemographics(data: Partial<DemographicsData>): void {
    this._demographics.update(d => ({ ...d, ...data }));
  }

  updateInsurance(data: Partial<InsuranceData>): void {
    this._insurance.update(i => ({ ...i, ...data }));
  }

  updateConsent(data: Partial<ConsentData>): void {
    this._consent.update(c => ({ ...c, ...data }));
  }

  updateArrival(data: Partial<ArrivalData>): void {
    this._arrival.update(a => ({ ...a, ...data }));
  }

  async submitCheckIn(): Promise<CheckInResult> {
    this._isLoading.set(true);
    await new Promise(r => setTimeout(r, 1500));

    const result: CheckInResult = {
      tokenNumber: 'A-' + String(Math.floor(Math.random() * 900) + 100),
      estimatedWait: '15-20 minutes',
      checkInTime: new Date(),
    };

    this._checkInResult.set(result);
    this._isLoading.set(false);
    return result;
  }
}
