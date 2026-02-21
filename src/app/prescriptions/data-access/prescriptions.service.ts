import { Injectable, signal, computed } from '@angular/core';

export interface Prescription {
  id: string;
  medicationName: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  route: string;
  prescribedBy: string;
  prescribedDate: Date;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'discontinued' | 'completed';
  refillsRemaining: number;
  refillsTotal: number;
  lastFilledDate?: Date;
  preferredPharmacyId?: string;
  pharmacyName?: string;
  instructions: string;
  isControlled: boolean;
  canRequestRefill: boolean;
  hasInteractionWarning: boolean;
  interactionNote?: string;
}

export interface RefillRequest {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  pharmacyId: string;
  pharmacy: string;
  pharmacyAddress: string;
  status: 'requested' | 'processing' | 'ready' | 'picked-up';
  requestedAt: Date;
  estimatedReady?: Date;
  notes?: string;
}

export interface PharmacyInfo {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  hours: string;
  distance: string;
  isPreferred: boolean;
}

export type RefillStep = 'select-med' | 'select-pharmacy' | 'confirm' | 'tracking';

// ─── Mock date helper ────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date(2026, 1, 21);
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date(2026, 1, 21);
  d.setDate(d.getDate() + n);
  return d;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-001',
    medicationName: 'Metformin HCl',
    genericName: 'Metformin',
    dosage: '500 mg',
    frequency: 'Twice daily with meals',
    route: 'Oral',
    prescribedBy: 'Dr. Sarah Chen',
    prescribedDate: new Date(2025, 3, 10),
    startDate: new Date(2025, 3, 12),
    status: 'active',
    refillsRemaining: 2,
    refillsTotal: 5,
    lastFilledDate: daysAgo(28),
    preferredPharmacyId: 'ph-001',
    pharmacyName: 'CVS Pharmacy - Main St',
    instructions: 'Take with meals to reduce stomach upset. Do not crush or chew.',
    isControlled: false,
    canRequestRefill: true,
    hasInteractionWarning: false
  },
  {
    id: 'rx-002',
    medicationName: 'Lisinopril',
    genericName: 'Lisinopril',
    dosage: '10 mg',
    frequency: 'Once daily',
    route: 'Oral',
    prescribedBy: 'Dr. Sarah Chen',
    prescribedDate: new Date(2025, 1, 5),
    startDate: new Date(2025, 1, 6),
    status: 'active',
    refillsRemaining: 4,
    refillsTotal: 6,
    lastFilledDate: daysAgo(14),
    preferredPharmacyId: 'ph-001',
    pharmacyName: 'CVS Pharmacy - Main St',
    instructions: 'Take at the same time each day. May cause dizziness when standing — rise slowly.',
    isControlled: false,
    canRequestRefill: true,
    hasInteractionWarning: true,
    interactionNote: 'Potential interaction with potassium supplements. Consult your pharmacist.'
  },
  {
    id: 'rx-003',
    medicationName: 'Atorvastatin',
    genericName: 'Atorvastatin calcium',
    dosage: '20 mg',
    frequency: 'Once daily at bedtime',
    route: 'Oral',
    prescribedBy: 'Dr. James Patel',
    prescribedDate: new Date(2025, 0, 18),
    startDate: new Date(2025, 0, 20),
    status: 'active',
    refillsRemaining: 1,
    refillsTotal: 3,
    lastFilledDate: daysAgo(60),
    preferredPharmacyId: 'ph-002',
    pharmacyName: 'Walgreens - Oak Ave',
    instructions: 'Take in the evening. Avoid large amounts of grapefruit juice.',
    isControlled: false,
    canRequestRefill: true,
    hasInteractionWarning: true,
    interactionNote: 'Avoid grapefruit — can increase statin levels in your blood significantly.'
  },
  {
    id: 'rx-004',
    medicationName: 'Sertraline',
    genericName: 'Sertraline HCl',
    dosage: '50 mg',
    frequency: 'Once daily in the morning',
    route: 'Oral',
    prescribedBy: 'Dr. Maria Gonzalez',
    prescribedDate: new Date(2024, 9, 3),
    startDate: new Date(2024, 9, 5),
    status: 'active',
    refillsRemaining: 3,
    refillsTotal: 6,
    lastFilledDate: daysAgo(20),
    preferredPharmacyId: 'ph-001',
    pharmacyName: 'CVS Pharmacy - Main St',
    instructions: 'Take in the morning with or without food. May take 4-6 weeks for full effect.',
    isControlled: false,
    canRequestRefill: true,
    hasInteractionWarning: false
  },
  {
    id: 'rx-005',
    medicationName: 'Albuterol Inhaler',
    genericName: 'Albuterol sulfate',
    dosage: '90 mcg/actuation',
    frequency: 'As needed for breathing',
    route: 'Inhalation',
    prescribedBy: 'Dr. Sarah Chen',
    prescribedDate: new Date(2025, 5, 22),
    startDate: new Date(2025, 5, 22),
    status: 'active',
    refillsRemaining: 5,
    refillsTotal: 5,
    lastFilledDate: daysAgo(90),
    preferredPharmacyId: 'ph-003',
    pharmacyName: 'Rite Aid - Center Plaza',
    instructions: '1-2 puffs every 4-6 hours as needed. Shake well before each use.',
    isControlled: false,
    canRequestRefill: true,
    hasInteractionWarning: false
  },
  {
    id: 'rx-006',
    medicationName: 'Omeprazole',
    genericName: 'Omeprazole',
    dosage: '20 mg',
    frequency: 'Once daily before breakfast',
    route: 'Oral',
    prescribedBy: 'Dr. James Patel',
    prescribedDate: new Date(2025, 7, 11),
    startDate: new Date(2025, 7, 12),
    status: 'active',
    refillsRemaining: 0,
    refillsTotal: 2,
    lastFilledDate: daysAgo(35),
    preferredPharmacyId: 'ph-002',
    pharmacyName: 'Walgreens - Oak Ave',
    instructions: 'Take 30-60 minutes before eating. Swallow capsule whole — do not crush.',
    isControlled: false,
    canRequestRefill: false,
    hasInteractionWarning: false
  }
];

const MOCK_PHARMACIES: PharmacyInfo[] = [
  {
    id: 'ph-001',
    name: 'CVS Pharmacy',
    address: '1422 Main Street',
    city: 'Springfield, IL 62701',
    phone: '(217) 555-0124',
    hours: 'Mon–Fri 8am–10pm, Sat–Sun 9am–6pm',
    distance: '0.4 mi',
    isPreferred: true
  },
  {
    id: 'ph-002',
    name: 'Walgreens',
    address: '804 Oak Avenue',
    city: 'Springfield, IL 62702',
    phone: '(217) 555-0187',
    hours: 'Open 24 hours',
    distance: '1.1 mi',
    isPreferred: false
  },
  {
    id: 'ph-003',
    name: 'Rite Aid',
    address: '55 Center Plaza, Suite 100',
    city: 'Springfield, IL 62703',
    phone: '(217) 555-0231',
    hours: 'Mon–Sat 9am–9pm, Sun 10am–6pm',
    distance: '2.3 mi',
    isPreferred: false
  }
];

const MOCK_REFILL_REQUESTS: RefillRequest[] = [
  {
    id: 'rr-001',
    medicationId: 'rx-001',
    medicationName: 'Metformin HCl 500 mg',
    dosage: '500 mg',
    pharmacyId: 'ph-001',
    pharmacy: 'CVS Pharmacy',
    pharmacyAddress: '1422 Main Street, Springfield, IL 62701',
    status: 'ready',
    requestedAt: daysAgo(3),
    estimatedReady: daysAgo(1),
    notes: 'Ready for pickup at the pharmacy counter.'
  },
  {
    id: 'rr-002',
    medicationId: 'rx-004',
    medicationName: 'Sertraline 50 mg',
    dosage: '50 mg',
    pharmacyId: 'ph-001',
    pharmacy: 'CVS Pharmacy',
    pharmacyAddress: '1422 Main Street, Springfield, IL 62701',
    status: 'processing',
    requestedAt: daysAgo(1),
    estimatedReady: daysFromNow(1),
    notes: 'Being processed by the pharmacy.'
  }
];

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class PrescriptionsService {
  private readonly _prescriptions = signal<Prescription[]>(MOCK_PRESCRIPTIONS);
  private readonly _pharmacies = signal<PharmacyInfo[]>(MOCK_PHARMACIES);
  private readonly _refillRequests = signal<RefillRequest[]>(MOCK_REFILL_REQUESTS);
  private readonly _selectedMedicationId = signal<string | null>(null);
  private readonly _selectedPharmacyId = signal<string | null>(null);
  private readonly _refillStep = signal<RefillStep>('select-med');
  private readonly _dialogOpen = signal<boolean>(false);

  readonly prescriptions = this._prescriptions.asReadonly();
  readonly pharmacies = this._pharmacies.asReadonly();
  readonly refillRequests = this._refillRequests.asReadonly();
  readonly selectedMedicationId = this._selectedMedicationId.asReadonly();
  readonly selectedPharmacyId = this._selectedPharmacyId.asReadonly();
  readonly refillStep = this._refillStep.asReadonly();
  readonly dialogOpen = this._dialogOpen.asReadonly();

  readonly activeMedications = computed(() =>
    this._prescriptions().filter(rx => rx.status === 'active')
  );

  readonly pendingRefills = computed(() =>
    this._refillRequests().filter(rr => rr.status !== 'picked-up')
  );

  readonly selectedMedication = computed(() => {
    const id = this._selectedMedicationId();
    return id ? this._prescriptions().find(rx => rx.id === id) ?? null : null;
  });

  readonly selectedPharmacy = computed(() => {
    const id = this._selectedPharmacyId();
    return id ? this._pharmacies().find(ph => ph.id === id) ?? null : null;
  });

  readonly interactionWarnings = computed(() =>
    this._prescriptions().filter(rx => rx.hasInteractionWarning && rx.status === 'active')
  );

  openRefillDialog(medicationId: string): void {
    this._selectedMedicationId.set(medicationId);
    const med = this._prescriptions().find(rx => rx.id === medicationId);
    this._selectedPharmacyId.set(med?.preferredPharmacyId ?? null);
    this._refillStep.set('select-pharmacy');
    this._dialogOpen.set(true);
  }

  closeRefillDialog(): void {
    this._dialogOpen.set(false);
    this._selectedMedicationId.set(null);
    this._selectedPharmacyId.set(null);
    this._refillStep.set('select-med');
  }

  selectPharmacy(pharmacyId: string): void {
    this._selectedPharmacyId.set(pharmacyId);
  }

  goToConfirm(): void {
    if (this._selectedPharmacyId()) {
      this._refillStep.set('confirm');
    }
  }

  goBackToPharmacy(): void {
    this._refillStep.set('select-pharmacy');
  }

  confirmRefill(): void {
    const med = this.selectedMedication();
    const pharmacy = this.selectedPharmacy();
    if (!med || !pharmacy) return;

    const newRequest: RefillRequest = {
      id: `rr-${Date.now()}`,
      medicationId: med.id,
      medicationName: `${med.medicationName} ${med.dosage}`,
      dosage: med.dosage,
      pharmacyId: pharmacy.id,
      pharmacy: pharmacy.name,
      pharmacyAddress: `${pharmacy.address}, ${pharmacy.city}`,
      status: 'requested',
      requestedAt: new Date(2026, 1, 21),
      estimatedReady: daysFromNow(2),
      notes: 'Refill request submitted. You will be notified when ready.'
    };

    this._refillRequests.update(requests => [newRequest, ...requests]);

    this._prescriptions.update(rxs =>
      rxs.map(rx =>
        rx.id === med.id
          ? { ...rx, refillsRemaining: Math.max(0, rx.refillsRemaining - 1) }
          : rx
      )
    );

    this.closeRefillDialog();
  }

  getRefillProgress(status: RefillRequest['status']): number {
    const map: Record<RefillRequest['status'], number> = {
      'requested': 1,
      'processing': 2,
      'ready': 3,
      'picked-up': 4
    };
    return map[status];
  }

  getStatusLabel(status: RefillRequest['status']): string {
    const labels: Record<RefillRequest['status'], string> = {
      'requested': 'Requested',
      'processing': 'Processing',
      'ready': 'Ready for Pickup',
      'picked-up': 'Picked Up'
    };
    return labels[status];
  }

  getStatusSeverity(status: RefillRequest['status']): 'success' | 'info' | 'warning' | 'danger' {
    const map: Record<RefillRequest['status'], 'success' | 'info' | 'warning' | 'danger'> = {
      'requested': 'info',
      'processing': 'warning',
      'ready': 'success',
      'picked-up': 'success'
    };
    return map[status];
  }

  getRefillBarWidth(refillsRemaining: number, refillsTotal: number): number {
    if (refillsTotal === 0) return 0;
    return Math.round((refillsRemaining / refillsTotal) * 100);
  }

  getRefillBarClass(refillsRemaining: number): string {
    if (refillsRemaining === 0) return 'bar-empty';
    if (refillsRemaining === 1) return 'bar-low';
    return 'bar-ok';
  }
}
