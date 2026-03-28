import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from '../../auth/data-access/auth.service';

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
  controlledSubstance: boolean;
  canRequestRefill: boolean;
  hasInteractionWarning: boolean;
  interactionNote?: string;
  sideEffects?: { common: string[]; serious: string[]; rare: string[] };
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

export interface AdherenceEntry {
  date: Date;
  medications: { medicationId: string; medicationName: string; taken: boolean }[];
}

export type RefillStep = 'select-med' | 'select-pharmacy' | 'confirm' | 'tracking';

// ─── Feature 11.1: Drug Interaction types ────────────────────────────────────

export type InteractionSeverity = 'HIGH' | 'MODERATE' | 'LOW';

export interface DrugInteraction {
  id: string;
  drugA: string;
  drugB: string;
  severity: InteractionSeverity;
  description: string;
}

// ─── Feature 11.3: PBS Active Script types ───────────────────────────────────

export type PBSAuthorityStatus = 'General' | 'Authority Required';

export interface PBSScript {
  scriptNumber: string;
  drugName: string;
  pbsItemCode: string;
  authorityStatus: PBSAuthorityStatus;
  repeatsRemaining: number;
  expiryDate: Date;
}

// ─── Reference data: Pharmacies ──────────────────────────────────────────────
// TODO: Implement backend endpoint for /api/v1/portal/pharmacies

const REFERENCE_PHARMACIES: PharmacyInfo[] = [
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

// ─── Reference data: Drug interactions ───────────────────────────────────────
// TODO: Implement backend endpoint for /api/v1/portal/patients/{id}/drug-interactions

const REFERENCE_DRUG_INTERACTIONS: DrugInteraction[] = [
  {
    id: 'di-001',
    drugA: 'Lisinopril',
    drugB: 'Potassium Supplements',
    severity: 'HIGH',
    description: 'May cause dangerously high potassium levels (hyperkalemia). Monitor potassium levels regularly.'
  },
  {
    id: 'di-002',
    drugA: 'Metformin',
    drugB: 'Contrast Dye',
    severity: 'MODERATE',
    description: 'Hold metformin 48 hours before and after contrast imaging procedures.'
  },
  {
    id: 'di-003',
    drugA: 'Atorvastatin',
    drugB: 'Grapefruit',
    severity: 'LOW',
    description: 'Grapefruit may increase statin levels. Limit grapefruit consumption.'
  }
];

// ─── Reference data: PBS scripts ─────────────────────────────────────────────
// TODO: Implement backend endpoint for /api/v1/portal/patients/{id}/pbs-scripts

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

const REFERENCE_PBS_SCRIPTS: PBSScript[] = [
  {
    scriptNumber: 'PBS-2026-00184371',
    drugName: 'Metformin Hydrochloride 500 mg tablet',
    pbsItemCode: '8382B',
    authorityStatus: 'General',
    repeatsRemaining: 4,
    expiryDate: daysFromNow(180)
  },
  {
    scriptNumber: 'PBS-2026-00184372',
    drugName: 'Atorvastatin 20 mg tablet',
    pbsItemCode: '8560K',
    authorityStatus: 'Authority Required',
    repeatsRemaining: 2,
    expiryDate: daysFromNow(90)
  },
  {
    scriptNumber: 'PBS-2026-00184373',
    drugName: 'Omeprazole 20 mg capsule',
    pbsItemCode: '2871B',
    authorityStatus: 'General',
    repeatsRemaining: 5,
    expiryDate: daysFromNow(240)
  },
  {
    scriptNumber: 'PBS-2026-00184374',
    drugName: 'Sertraline 50 mg tablet',
    pbsItemCode: '3572N',
    authorityStatus: 'Authority Required',
    repeatsRemaining: 1,
    expiryDate: daysFromNow(60)
  }
];

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class PrescriptionsService {
  private readonly authService = inject(AuthService);

  private readonly _prescriptions = signal<Prescription[]>([]);
  private readonly _pharmacies = signal<PharmacyInfo[]>(REFERENCE_PHARMACIES);
  private readonly _refillRequests = signal<RefillRequest[]>([]);
  private readonly _selectedMedicationId = signal<string | null>(null);
  private readonly _selectedPharmacyId = signal<string | null>(null);
  private readonly _refillStep = signal<RefillStep>('select-med');
  private readonly _dialogOpen = signal<boolean>(false);
  private readonly _adherenceLog = signal<AdherenceEntry[]>([]);
  private readonly _isLoading = signal<boolean>(false);

  // ─── Feature 11.1: Drug interactions (reference data — no backend endpoint yet) ──
  private readonly _drugInteractions = signal<DrugInteraction[]>(REFERENCE_DRUG_INTERACTIONS);

  // ─── Feature 11.3: PBS scripts (reference data — no backend endpoint yet) ────────
  private readonly _pbsScripts = signal<PBSScript[]>(REFERENCE_PBS_SCRIPTS);

  readonly prescriptions = this._prescriptions.asReadonly();
  readonly pharmacies = this._pharmacies.asReadonly();
  readonly refillRequests = this._refillRequests.asReadonly();
  readonly selectedMedicationId = this._selectedMedicationId.asReadonly();
  readonly selectedPharmacyId = this._selectedPharmacyId.asReadonly();
  readonly refillStep = this._refillStep.asReadonly();
  readonly dialogOpen = this._dialogOpen.asReadonly();
  readonly adherenceLog = this._adherenceLog.asReadonly();
  readonly drugInteractions = this._drugInteractions.asReadonly();
  readonly pbsScripts = this._pbsScripts.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

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

  // ─── Feature 11.1: Computed interaction summary ──────────────────────────

  readonly interactionCountBySevertiy = computed(() => {
    const interactions = this._drugInteractions();
    return {
      high: interactions.filter(i => i.severity === 'HIGH').length,
      moderate: interactions.filter(i => i.severity === 'MODERATE').length,
      low: interactions.filter(i => i.severity === 'LOW').length,
      total: interactions.length
    };
  });

  /** Monthly adherence percentage (past days only). */
  readonly monthlyAdherencePercent = computed(() => {
    const today = new Date();
    const pastEntries = this._adherenceLog().filter(e => e.date <= today && e.medications.length > 0);
    if (pastEntries.length === 0) return 0;
    const totalDoses = pastEntries.reduce((sum, e) => sum + e.medications.length, 0);
    const takenDoses = pastEntries.reduce(
      (sum, e) => sum + e.medications.filter(m => m.taken).length,
      0
    );
    return totalDoses === 0 ? 0 : Math.round((takenDoses / totalDoses) * 100);
  });

  /**
   * Loads prescriptions/medications from the backend API.
   * Endpoint: GET /api/v1/portal/patients/{id}/medications
   */
  async loadPrescriptions(): Promise<void> {
    const patientId = localStorage.getItem('portal_patient_id') || this.authService.user()?.patientId;
    const token = localStorage.getItem('portal_token');

    if (!patientId || !token) {
      return;
    }

    this._isLoading.set(true);
    try {
      const resp = await fetch(
        `/api/v1/portal/patients/${patientId}/medications?page=1&page_size=100`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (resp.ok) {
        const data: {
          medications: Array<{
            id: string;
            medication_name: string;
            generic_name?: string;
            dosage: string;
            frequency: string;
            route: string;
            prescribed_date: string;
            prescribed_by: string;
            start_date: string;
            end_date?: string;
            status: string;
            refills_remaining: number;
            refills_total: number;
            last_filled_date?: string;
            preferred_pharmacy_id?: string;
            pharmacy_name?: string;
            instructions?: string;
            is_controlled: boolean;
            controlled_substance: boolean;
            can_request_refill: boolean;
            has_interaction_warning: boolean;
            interaction_note?: string;
            side_effects?: { common: string[]; serious: string[]; rare: string[] };
          }>;
        } = await resp.json();
        const mapped: Prescription[] = (data.medications ?? []).map(m => ({
          id: m.id,
          medicationName: m.medication_name,
          genericName: m.generic_name,
          dosage: m.dosage,
          frequency: m.frequency,
          route: m.route,
          prescribedBy: m.prescribed_by,
          prescribedDate: new Date(m.prescribed_date),
          startDate: new Date(m.start_date),
          endDate: m.end_date ? new Date(m.end_date) : undefined,
          status: (m.status as Prescription['status']) || 'active',
          refillsRemaining: m.refills_remaining ?? 0,
          refillsTotal: m.refills_total ?? 0,
          lastFilledDate: m.last_filled_date ? new Date(m.last_filled_date) : undefined,
          preferredPharmacyId: m.preferred_pharmacy_id,
          pharmacyName: m.pharmacy_name,
          instructions: m.instructions ?? '',
          isControlled: m.is_controlled ?? false,
          controlledSubstance: m.controlled_substance ?? false,
          canRequestRefill: m.can_request_refill ?? false,
          hasInteractionWarning: m.has_interaction_warning ?? false,
          interactionNote: m.interaction_note,
          sideEffects: m.side_effects
        }));
        this._prescriptions.set(mapped);
      }
      // On non-OK response: leave prescriptions as empty array
    } catch {
      // On network error: leave prescriptions as empty array
    } finally {
      this._isLoading.set(false);
    }
  }

  openRefillDialog(medicationId: string): void {
    const med = this._prescriptions().find(rx => rx.id === medicationId);
    // ─── Feature 11.2: Controlled substance triage ───────────────────────
    if (med?.controlledSubstance) {
      this._selectedMedicationId.set(medicationId);
      this._dialogOpen.set(true);
      this._refillStep.set('controlled-warning' as RefillStep);
      return;
    }
    this._selectedMedicationId.set(medicationId);
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

  // ─── Feature 11.2: Proceed past controlled warning to normal refill ──────
  proceedFromControlledWarning(): void {
    const med = this.selectedMedication();
    this._selectedPharmacyId.set(med?.preferredPharmacyId ?? null);
    this._refillStep.set('select-pharmacy');
  }

  confirmRefill(): void {
    const med = this.selectedMedication();
    const pharmacy = this.selectedPharmacy();
    if (!med || !pharmacy) return;

    const now = new Date();
    const estimatedReady = new Date(now);
    estimatedReady.setDate(now.getDate() + 2);

    const newRequest: RefillRequest = {
      id: `rr-${Date.now()}`,
      medicationId: med.id,
      medicationName: `${med.medicationName} ${med.dosage}`,
      dosage: med.dosage,
      pharmacyId: pharmacy.id,
      pharmacy: pharmacy.name,
      pharmacyAddress: `${pharmacy.address}, ${pharmacy.city}`,
      status: 'requested',
      requestedAt: now,
      estimatedReady,
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

  getStatusSeverity(status: RefillRequest['status']): 'success' | 'info' | 'warn' | 'danger' {
    const map: Record<RefillRequest['status'], 'success' | 'info' | 'warn' | 'danger'> = {
      'requested': 'info',
      'processing': 'warn',
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

  /** Returns the adherence status for a calendar day cell. */
  getDayAdherenceStatus(entry: AdherenceEntry): 'all-taken' | 'partial' | 'missed' | 'future' | 'none' {
    if (entry.medications.length === 0) return 'future';
    const taken = entry.medications.filter(m => m.taken).length;
    const total = entry.medications.length;
    if (taken === 0) return 'missed';
    if (taken === total) return 'all-taken';
    return 'partial';
  }
}
