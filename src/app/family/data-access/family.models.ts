// =============================================================================
// Family Domain Models
// =============================================================================

// Enums/union types
export type RelationshipType = 'spouse' | 'partner' | 'child' | 'parent' | 'grandparent' | 'sibling' | 'aunt-uncle' | 'cousin' | 'niece-nephew' | 'pet';
export type AccessLevel = 'full' | 'partial' | 'none' | 'emergency-only';
export type BiologicalRelation = 'biological' | 'adopted' | 'step' | 'half' | 'foster' | 'none';
export type MemberSource = 'portal-linked' | 'manual-entry' | 'imported' | 'history-only';
export type ProxyStatus = 'pending-upload' | 'pending-verification' | 'verified' | 'active' | 'revoked';
export type SexAtBirth = 'male' | 'female' | 'intersex' | 'unknown';
export type ConditionStatus = 'affected' | 'carrier' | 'unaffected' | 'unknown';
export type GeneticClassification = 'pathogenic' | 'likely-pathogenic' | 'vus' | 'likely-benign' | 'benign';
export type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'fish' | 'reptile' | 'other';
export type RecordCategory = 'appointments' | 'medications' | 'lab-results' | 'immunizations' | 'allergies' | 'mental-health' | 'reproductive' | 'sti' | 'genetic' | 'billing';

// FamilyMember
export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  sexAtBirth: SexAtBirth;
  relationship: RelationshipType;
  biologicalRelation: BiologicalRelation;
  isDeceased: boolean;
  deceasedAge?: number;
  isProband: boolean;
  isPet: boolean;
  avatarUrl?: string;
  avatarColor: string;
  source: MemberSource;
  linkedPatientId?: string;
  identifiers: { type: string; value: string; country: string }[];
  accessLevel: AccessLevel;
  proxyStatus?: ProxyStatus;
  conditions: FamilyCondition[];
  geneticTests: GeneticTestResult[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// FamilyGroup
export interface FamilyGroup {
  id: string;
  name: string;
  primaryMemberId: string;
  members: FamilyMember[];
  pets: PetProfile[];
  permissionMatrix: PermissionEntry[];
  auditLog: AuditLogEntry[];
  createdAt: Date;
  updatedAt: Date;
}

// FamilyCondition
export interface FamilyCondition {
  id: string;
  memberId: string;
  snomedCode?: string;
  conditionName: string;
  category: string;
  status: ConditionStatus;
  onsetAge?: number;
  contributedToDeath: boolean;
  notes?: string;
}

// GeneticTestResult
export interface GeneticTestResult {
  id: string;
  memberId: string;
  testName: string;
  geneName: string;
  variant?: string;
  classification: GeneticClassification;
  testDate: Date;
  lab: string;
  resultSummary: string;
  consentGiven: boolean;
  consentDate?: Date;
}

// PetProfile
export interface PetProfile {
  id: string;
  familyGroupId: string;
  name: string;
  species: PetSpecies;
  breed?: string;
  dateOfBirth?: Date;
  weight?: number;
  weightUnit: 'kg' | 'lbs';
  avatarUrl?: string;
  avatarColor: string;
  vaccinations: PetVaccination[];
  medications: PetMedication[];
  allergies: PetAllergy[];
  weightHistory: PetWeightEntry[];
  vetVisits: VetVisit[];
  zoonoticFlags: { [key: string]: boolean };
}

// PetVaccination
export interface PetVaccination {
  id: string;
  vaccineName: string;
  administeredDate: Date;
  nextDueDate?: Date;
  veterinarian: string;
  batchNumber?: string;
}

// PetMedication
export interface PetMedication {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  status: 'active' | 'completed' | 'discontinued';
}

// PetAllergy
export interface PetAllergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
}

// PetWeightEntry
export interface PetWeightEntry {
  date: Date;
  weight: number;
  unit: 'kg' | 'lbs';
}

// VetVisit
export interface VetVisit {
  id: string;
  date: Date;
  reason: string;
  veterinarian: string;
  clinic: string;
  notes?: string;
  followUpDate?: Date;
}

// PermissionEntry
export interface PermissionEntry {
  memberId: string;
  targetMemberId: string;
  category: RecordCategory;
  level: AccessLevel;
  expiresAt?: Date;
  setBy: string;
  setAt: Date;
}

// PermissionMatrix (convenience type)
export interface PermissionMatrix {
  memberId: string;
  memberName: string;
  permissions: Record<RecordCategory, AccessLevel>;
}

// AuditLogEntry
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  actorId: string;
  actorName: string;
  action: string;
  targetMemberId?: string;
  targetMemberName?: string;
  details: string;
  category: string;
}

// HeredityRiskCard
export interface HeredityRiskCard {
  conditionName: string;
  riskLevel: 'high' | 'moderate' | 'low' | 'unknown';
  riskPercentage?: number;
  inheritancePattern: string;
  affectedRelatives: string[];
  screeningRecommendation: string;
  countrySpecificNotes?: Record<string, string>;
  summary: string;
}
