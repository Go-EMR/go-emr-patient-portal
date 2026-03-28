import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import {
  PetProfile,
  PetVaccination,
  PetMedication,
  VetVisit,
  PetSpecies,
} from '../../family/data-access/family.models';

import {
  GovetListPetsResponse,
  GovetPortalPet,
  GovetPetRecordsResponse,
  GovetVaccinationRecord,
  GovetPrescription,
  GovetConsultation,
  GovetAppointment,
} from './govet.models';

import { GOVET_API_URL, GOVET_DEMO_CLINIC_NAME } from './govet.config';

// ---------------------------------------------------------------------------
// Frequency label mapping
// ---------------------------------------------------------------------------

const FREQUENCY_LABELS: Record<string, string> = {
  SID: 'Once daily',
  BID: 'Twice daily',
  TID: 'Three times daily',
  QID: 'Four times daily',
  SOS: 'As needed',
  EOD: 'Every other day',
};

// ---------------------------------------------------------------------------
// Species color mapping (mirrors GoVet design tokens)
// ---------------------------------------------------------------------------

const SPECIES_COLORS: Record<string, string> = {
  dog: '#0DAF96',
  cat: '#A78BFA',
  bird: '#F5C638',
  rabbit: '#F472B6',
  reptile: '#34D399',
  horse: '#A8896C',
  cattle: '#78716C',
  other: '#94A3B8',
};

@Injectable({ providedIn: 'root' })
export class GovetApiAdapter {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = GOVET_API_URL;

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Fetches all pets for a GoVet owner and maps them to PetProfile[].
   * Returns empty array on error (graceful degradation).
   */
  getOwnerPets(ownerId: string, familyGroupId: string): Observable<PetProfile[]> {
    return this.http
      .get<GovetListPetsResponse>(`${this.baseUrl}/v1/portal/owners/${ownerId}/pets`)
      .pipe(
        map(res => res.pets.map(p => this.mapPatientToPetProfile(p, familyGroupId))),
        catchError(() => of([])),
      );
  }

  /**
   * Fetches medical records for a specific pet and enriches a PetProfile
   * with vaccinations, medications, and vet visits.
   */
  getPetRecords(
    ownerId: string,
    petId: string,
    basePet: PetProfile,
  ): Observable<PetProfile> {
    return this.http
      .get<GovetPetRecordsResponse>(
        `${this.baseUrl}/v1/portal/owners/${ownerId}/pets/${petId}/records`,
      )
      .pipe(
        map(records => ({
          ...basePet,
          vaccinations: this.mapVaccinationRecords(records.vaccinationRecords),
          medications: this.mapPrescriptionsToMedications(records.prescriptions),
          vetVisits: this.mapConsultationsToVetVisits(records.consultations),
        })),
        catchError(() => of(basePet)),
      );
  }

  // -------------------------------------------------------------------------
  // Mapping: Patient → PetProfile
  // -------------------------------------------------------------------------

  private mapPatientToPetProfile(patient: GovetPortalPet, familyGroupId: string): PetProfile {
    const species = (patient.species?.toLowerCase() ?? 'other') as PetSpecies;

    return {
      id: patient.id,
      familyGroupId,
      name: patient.name,
      species: this.isValidSpecies(species) ? species : 'other',
      breed: patient.breed ?? undefined,
      dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth) : undefined,
      weight: patient.currentWeightKg ?? undefined,
      weightUnit: 'kg',
      avatarUrl: patient.profilePhotoUrl ?? undefined,
      avatarColor: SPECIES_COLORS[species] ?? SPECIES_COLORS['other'],
      vaccinations: [],   // Populated later via getPetRecords
      medications: [],
      allergies: [],       // GoVet doesn't track allergies — default empty
      weightHistory: patient.currentWeightKg
        ? [{ date: new Date(patient.updatedAt), weight: patient.currentWeightKg, unit: 'kg' as const }]
        : [],
      vetVisits: [],
      zoonoticFlags: {},   // Will be enriched from vaccination data
    };
  }

  private isValidSpecies(s: string): s is PetSpecies {
    return ['dog', 'cat', 'bird', 'rabbit', 'fish', 'reptile', 'other'].includes(s);
  }

  // -------------------------------------------------------------------------
  // Mapping: VaccinationRecord → PetVaccination
  // -------------------------------------------------------------------------

  private mapVaccinationRecords(records: GovetVaccinationRecord[]): PetVaccination[] {
    return records.map(v => ({
      id: v.id,
      vaccineName: v.vaccineName,
      administeredDate: new Date(v.administeredDate),
      nextDueDate: v.nextDueDate ? new Date(v.nextDueDate) : undefined,
      veterinarian: v.administeredByName ?? 'GoVet Veterinarian',
      batchNumber: v.batchNumber,
    }));
  }

  // -------------------------------------------------------------------------
  // Mapping: Prescriptions → PetMedication[]
  // -------------------------------------------------------------------------

  private mapPrescriptionsToMedications(prescriptions: GovetPrescription[]): PetMedication[] {
    const medications: PetMedication[] = [];
    let counter = 0;

    for (const rx of prescriptions) {
      for (const item of rx.items) {
        counter++;
        const frequencyLabel = FREQUENCY_LABELS[item.frequency] ?? item.frequency;
        const dosage = item.doseAmount + (item.specialInstructions ? ` — ${item.specialInstructions}` : '');

        medications.push({
          id: `govet-med-${counter}`,
          medicationName: item.drugName,
          dosage,
          frequency: frequencyLabel,
          startDate: new Date(rx.prescribedAt),
          endDate: item.durationDays
            ? this.addDays(new Date(rx.prescribedAt), item.durationDays)
            : undefined,
          prescribedBy: 'GoVet Veterinarian', // Will be enriched when API provides vet name
          status: this.inferMedicationStatus(rx.prescribedAt, item.durationDays),
        });
      }
    }

    return medications;
  }

  private inferMedicationStatus(
    prescribedAt: string,
    durationDays: number | null,
  ): 'active' | 'completed' | 'discontinued' {
    if (!durationDays) return 'active';
    const endDate = this.addDays(new Date(prescribedAt), durationDays);
    return endDate < new Date() ? 'completed' : 'active';
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // -------------------------------------------------------------------------
  // Mapping: Consultations → VetVisit[]
  // -------------------------------------------------------------------------

  private mapConsultationsToVetVisits(consultations: GovetConsultation[]): VetVisit[] {
    return consultations.map((c, i) => ({
      id: c.id,
      date: new Date(c.date),
      reason: c.chiefComplaint,
      veterinarian: c.veterinarianName ?? 'GoVet Veterinarian',
      clinic: GOVET_DEMO_CLINIC_NAME,
      notes: [c.primaryDiagnosis, c.adviceToOwner].filter(Boolean).join('. ') || undefined,
      followUpDate: c.followUpDate ? new Date(c.followUpDate) : undefined,
    }));
  }
}
