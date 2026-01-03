// =============================================================================
// Shared Domain Models - USCDI v5 / FHIR R4 Compliant
// =============================================================================

// Appointment
export interface Appointment {
  id: string;
  providerId: string;
  providerName: string;
  providerSpecialty: string;
  providerAvatar?: string;
  locationId: string;
  locationName: string;
  locationAddress: string;
  date: Date;
  startTime: string;
  endTime: string;
  appointmentType: string;
  status: 'scheduled' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled' | 'no-show';
  confirmationRequired: boolean;
  canCancel: boolean;
  canReschedule: boolean;
  telehealth: boolean;
  telehealthUrl?: string;
  preVisitInstructions?: string;
  formsRequired: string[];
}

// Medication
export interface Medication {
  id: string;
  medicationName: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  route: string;
  prescribedDate: Date;
  prescribedBy: string;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'discontinued' | 'completed';
  refillsRemaining: number;
  refillsTotal: number;
  lastFilledDate?: Date;
  pharmacy?: string;
  instructions: string;
  isControlled: boolean;
  canRequestRefill: boolean;
}

// Lab Results
export interface LabResult {
  id: string;
  orderId: string;
  testName: string;
  orderDate: Date;
  resultDate?: Date;
  orderedBy: string;
  status: 'ordered' | 'collected' | 'processing' | 'resulted' | 'reviewed';
  hasAbnormal: boolean;
  isNew: boolean;
  components?: LabComponent[];
}

export interface LabComponent {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag?: 'normal' | 'low' | 'high' | 'critical';
}

// Allergy
export interface Allergy {
  id: string;
  allergen: string;
  type: 'drug' | 'food' | 'environmental' | 'other';
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  onsetDate?: Date;
  status: 'active' | 'inactive' | 'resolved';
  notes?: string;
}

// Vitals
export interface VitalRecord {
  id: string;
  date: Date;
  height?: { value: number; unit: string };
  weight?: { value: number; unit: string };
  bmi?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  heartRate?: number;
  temperature?: { value: number; unit: string };
  respiratoryRate?: number;
  oxygenSaturation?: number;
}

export interface VitalDisplay {
  id: string;
  type: string;
  value: string | number;
  unit?: string;
  recordedDate: Date;
  trend?: 'up' | 'down' | 'stable';
}

// Immunization
export interface Immunization {
  id: string;
  vaccineName: string;
  vaccineCode: string;
  administeredDate: Date;
  administeredBy: string;
  location: string;
  lotNumber?: string;
  manufacturer?: string;
  site?: string;
  route?: string;
  doseNumber?: number;
  seriesComplete: boolean;
  nextDoseDate?: Date;
  notes?: string;
}

// Messages
export interface MessageThread {
  id: string;
  subject: string;
  category: 'general' | 'appointment' | 'prescription' | 'lab_results' | 'billing' | 'referral';
  participants: { id: string; name: string; type: 'patient' | 'provider' | 'staff' }[];
  lastMessageAt: Date;
  lastMessagePreview: string;
  unreadCount: number;
  status: 'open' | 'closed' | 'archived';
  createdAt: Date;
}

// Forms
export interface PatientForm {
  id: string;
  title: string;
  description: string;
  type: 'intake' | 'consent' | 'medical_history' | 'hipaa' | 'financial' | 'questionnaire';
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  dueDate?: Date;
  completedAt?: Date;
  appointmentId?: string;
  appointmentDate?: Date;
  progress: number;
}

// Billing
export interface Statement {
  id: string;
  statementNumber: string;
  statementDate: Date;
  dueDate: Date;
  totalCharges: number;
  insurancePayments: number;
  adjustments: number;
  patientPayments: number;
  balanceDue: number;
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'collections';
  lineItems: StatementLineItem[];
}

export interface StatementLineItem {
  id: string;
  serviceDate: Date;
  description: string;
  providerName: string;
  cptCode?: string;
  charges: number;
  insurancePaid: number;
  adjustments: number;
  patientResponsibility: number;
}

// Documents
export interface Document {
  id: string;
  title: string;
  documentType: 'visit_summary' | 'lab_report' | 'imaging' | 'referral' | 'letter' | 'consent' | 'other';
  date: Date;
  provider?: string;
  category: string;
  fileSize: number;
  fileType: string;
  downloadUrl: string;
  isNew: boolean;
}

// Health Summary
export interface HealthSummary {
  lastVisitDate?: Date;
  upcomingAppointment?: { date: Date; providerName: string; type: string };
  upcomingAppointments: number;
  activeMedications: number;
  allergies: string[];
  recentLabResults: number;
  unreadMessages: number;
  pendingForms: number;
  outstandingBalance: number;
}

// User
export interface PatientUser {
  id: string;
  patientId: string;
  mrn: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: Date;
  photoUrl?: string;
  portalActivatedAt: Date;
  lastLogin?: Date;
  mfaEnabled: boolean;
  mfaVerified: boolean;
  preferences: { language: string; timezone: string; paperlessStatements: boolean };
}
