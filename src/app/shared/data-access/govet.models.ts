/**
 * TypeScript interfaces matching the GoVet mock API JSON responses.
 * These mirror the backend schema defined in CLAUDE.md §5.
 */

// ---------------------------------------------------------------------------
// Core resources
// ---------------------------------------------------------------------------

export interface GovetPatient {
  id: string;
  clinicId: string;
  ownerId: string;
  name: string;
  species: string;            // Uppercase: 'DOG', 'CAT', etc.
  speciesOther: string | null;
  breed: string | null;
  dateOfBirth: string | null; // ISO date 'YYYY-MM-DD'
  ageYears: number | null;
  ageMonths: number | null;
  sex: string;                // 'MALE', 'FEMALE', 'MALE_NEUTERED', 'FEMALE_SPAYED', 'UNKNOWN'
  colorMarkings: string | null;
  microchipNumber: string | null;
  profilePhotoUrl: string | null;
  currentWeightKg: number | null;
  isDeceased: boolean;
  deceasedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GovetOwner {
  id: string;
  clinicId: string;
  fullName: string;
  mobile: string;
  email: string | null;
  address: string | null;
  city: string | null;
  pinCode: string | null;
  languagePref: string;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Portal list-pets enriched response
// ---------------------------------------------------------------------------

export interface GovetPortalPet extends GovetPatient {
  lastVisitDate: string | null;
  vaccinationStatus: 'UP_TO_DATE' | 'DUE';
  vaccinationCount: number;
  appointmentCount: number;
}

export interface GovetListPetsResponse {
  pets: GovetPortalPet[];
  totalSize: number;
}

// ---------------------------------------------------------------------------
// Portal pet-detail response
// ---------------------------------------------------------------------------

export interface GovetPetDetailResponse extends GovetPatient {
  clinic: {
    id: string;
    name: string;
    contactMobile: string;
  };
  vaccinationRecords: GovetVaccinationRecord[];
  recentAppointments: GovetAppointment[];
}

// ---------------------------------------------------------------------------
// Portal pet records response
// ---------------------------------------------------------------------------

export interface GovetPetRecordsResponse {
  petId: string;
  petName: string;
  consultations: GovetConsultation[];
  prescriptions: GovetPrescription[];
  vaccinationRecords: GovetVaccinationRecord[];
}

export interface GovetConsultation {
  id: string;
  date: string;
  chiefComplaint: string;
  primaryDiagnosis: string | null;
  adviceToOwner: string | null;
  followUpDate: string | null;
  veterinarianId: string;
  veterinarianName?: string;  // Enriched by portal API
}

export interface GovetPrescription {
  id: string;
  prescriptionNumber: string;
  prescribedAt: string;
  isSigned: boolean;
  itemCount: number;
  items: GovetPrescriptionItem[];
}

export interface GovetPrescriptionItem {
  drugName: string;
  doseAmount: string;
  frequency: string;          // 'SID', 'BID', 'TID', etc.
  durationDays: number | null;
  specialInstructions: string | null;
}

// ---------------------------------------------------------------------------
// Vaccination records
// ---------------------------------------------------------------------------

export interface GovetVaccinationRecord {
  id: string;
  clinicId: string;
  patientId: string;
  soapNoteId: string | null;
  vaccineName: string;
  batchNumber: string;
  manufacturer: string | null;
  administeredDate: string;   // ISO date
  nextDueDate: string | null; // ISO date
  administeredBy: string;     // User UUID
  administeredByName?: string; // Enriched by portal API
  reactionNoted: boolean;
  reactionDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export interface GovetAppointment {
  id: string;
  clinicId: string;
  patientId: string;
  ownerId: string;
  veterinarianId: string;
  appointmentType: string;    // 'CONSULTATION', 'VACCINATION', etc.
  scheduledAt: string;        // ISO datetime
  durationMinutes: number;
  status: string;             // 'SCHEDULED', 'COMPLETED', etc.
  notes: string | null;
  cancellationReason: string | null;
  checkedInAt: string | null;
  completedAt: string | null;
  bookedVia: string;
  createdAt: string;
  updatedAt: string;
  // Enriched fields from portal endpoints
  petName?: string;
  veterinarianName?: string;
  clinicName?: string;
}
