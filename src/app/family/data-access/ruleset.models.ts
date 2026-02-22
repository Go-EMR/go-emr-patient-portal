// Supported countries
export type SupportedCountry = 'IN' | 'RO' | 'AU' | 'US';

// Jurisdiction configuration
export interface JurisdictionConfig {
  country: SupportedCountry;
  state?: string;
  version: string;
  lastUpdated: Date;
}

// Drug schedule types per country
export type DrugScheduleIN = 'H' | 'H1' | 'X' | 'NRx' | 'NRxP' | 'OTC';
export type DrugScheduleRO = 'PRF' | 'P-6L' | 'P-RF' | 'OTC';
export type DrugScheduleAU = 'S2' | 'S3' | 'S4' | 'S8' | 'OTC';
export type DrugScheduleUS = 'CII' | 'CIII' | 'CIV' | 'CV' | 'Rx' | 'OTC';

export interface DrugScheduleEntry {
  drugName: string;
  genericName: string;
  scheduleIN?: DrugScheduleIN;
  scheduleRO?: DrugScheduleRO;
  scheduleAU?: DrugScheduleAU;
  scheduleUS?: DrugScheduleUS;
  telehealthAllowed: Record<SupportedCountry, boolean | 'with-conditions'>;
  notes: Record<SupportedCountry, string>;
}

// Prescribing check
export interface PrescribingCheckRequest {
  drugName: string;
  country: SupportedCountry;
  state?: string;
  isTelehealth: boolean;
  providerType: 'physician' | 'nurse-practitioner' | 'physician-assistant';
  isFirstPrescription: boolean;
}

export interface PrescribingCheckResult {
  allowed: boolean;
  outcome: 'permitted' | 'permitted-with-conditions' | 'warning' | 'hard-stop';
  message: string;
  requirements: string[];
  documentationNeeded: string[];
  alternativeActions?: string[];
}

// Consent check
export interface ConsentCheckRequest {
  patientAge: number;
  country: SupportedCountry;
  state?: string;
  category: string;
  parentalConsentGiven: boolean;
}

export interface ConsentCheckResult {
  canAccess: boolean;
  requiresParentalConsent: boolean;
  requiresMinorConsent: boolean;
  ageOfConsent: number;
  notes: string;
}

// Telehealth jurisdiction check
export interface TelehealthJurisdictionCheck {
  patientCountry: SupportedCountry;
  patientState?: string;
  doctorCountry: SupportedCountry;
  doctorState?: string;
}

export interface TelehealthJurisdictionResult {
  compatible: boolean;
  status: 'fully-compatible' | 'partially-compatible' | 'incompatible' | 'unknown';
  message: string;
  requirements: string[];
  licensureNotes: string;
}

// Consent age rules
export interface ConsentAgeRule {
  country: SupportedCountry;
  state?: string;
  category: string;
  minAge: number;
  maxAge: number;
  requiresParentalConsent: boolean;
  requiresMinorAssent: boolean;
  notes: string;
}

// Consent age matrix
export interface ConsentAgeMatrix {
  country: SupportedCountry;
  rules: ConsentAgeRule[];
}

// US State IMLC (Interstate Medical Licensure Compact)
export interface USStateConfig {
  stateCode: string;
  stateName: string;
  isIMLCMember: boolean;
  consentAge: number;
  mentalHealthConsentAge?: number;
  reproductiveConsentAge?: number;
  stiConsentAge?: number;
  telehealthRestrictions: string[];
}

// Scope of practice
export interface ScopeOfPracticeRule {
  country: SupportedCountry;
  providerType: string;
  canPrescribe: boolean;
  canReferWithoutGP: boolean;
  specialNotes: string[];
  insuranceRequirements: string;
}
