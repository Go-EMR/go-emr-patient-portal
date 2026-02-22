import { Injectable, computed, signal } from '@angular/core';
import {
  ConsentAgeMatrix,
  ConsentAgeRule,
  ConsentCheckRequest,
  ConsentCheckResult,
  DrugScheduleEntry,
  JurisdictionConfig,
  PrescribingCheckRequest,
  PrescribingCheckResult,
  ScopeOfPracticeRule,
  SupportedCountry,
  TelehealthJurisdictionCheck,
  TelehealthJurisdictionResult,
  USStateConfig,
} from './ruleset.models';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_DRUG_SCHEDULE: DrugScheduleEntry[] = [
  {
    drugName: 'Alprazolam',
    genericName: 'alprazolam',
    scheduleIN: 'NRxP',
    scheduleRO: 'PRF',
    scheduleAU: 'S8',
    scheduleUS: 'CIV',
    telehealthAllowed: { IN: false, RO: false, AU: false, US: 'with-conditions' },
    notes: {
      IN: 'Schedule NRxP; requires psychiatrist prescription and triplicate form.',
      RO: 'Prescription-required; no telehealth dispensing permitted.',
      AU: 'Schedule 8 controlled; authority prescription mandatory.',
      US: 'CIV; DEA registration required; Ryan Haight Act applies to telehealth.',
    },
  },
  {
    drugName: 'Diazepam',
    genericName: 'diazepam',
    scheduleIN: 'NRxP',
    scheduleRO: 'PRF',
    scheduleAU: 'S8',
    scheduleUS: 'CIV',
    telehealthAllowed: { IN: false, RO: false, AU: false, US: 'with-conditions' },
    notes: {
      IN: 'Psychotropic substance; NDPS Act controls apply.',
      RO: 'PRF schedule; dispensing log mandatory at pharmacy.',
      AU: 'S8 permit required per state for prescribing.',
      US: 'CIV; requires prior in-person evaluation for new patients via telehealth.',
    },
  },
  {
    drugName: 'Codeine',
    genericName: 'codeine',
    scheduleIN: 'H1',
    scheduleRO: 'PRF',
    scheduleAU: 'S8',
    scheduleUS: 'CIII',
    telehealthAllowed: { IN: false, RO: 'with-conditions', AU: false, US: 'with-conditions' },
    notes: {
      IN: 'Schedule H1; detailed prescription with pharmacist record required.',
      RO: 'Controlled opioid; telehealth only for established patients.',
      AU: 'S8; authority script required; under-18 prescribing restricted.',
      US: 'CIII; 90-day supply limit applies for telehealth.',
    },
  },
  {
    drugName: 'Tramadol',
    genericName: 'tramadol',
    scheduleIN: 'H1',
    scheduleRO: 'PRF',
    scheduleAU: 'S4',
    scheduleUS: 'CIV',
    telehealthAllowed: { IN: false, RO: 'with-conditions', AU: true, US: 'with-conditions' },
    notes: {
      IN: 'Schedule H1 opioid analgesic; prescription record mandatory.',
      RO: 'Controlled opioid; quantity per prescription limited to 10 days.',
      AU: 'S4 prescription only; no S8 permit needed in most states.',
      US: 'CIV; telehealth prescribing allowed post-DEA 2024 rule with DEA registration.',
    },
  },
  {
    drugName: 'Metformin',
    genericName: 'metformin hydrochloride',
    scheduleIN: 'H',
    scheduleRO: 'P-RF',
    scheduleAU: 'S4',
    scheduleUS: 'Rx',
    telehealthAllowed: { IN: true, RO: true, AU: true, US: true },
    notes: {
      IN: 'Schedule H; standard prescription; widely available.',
      RO: 'Repeatable prescription; chronic disease management.',
      AU: 'S4 PBS listed; streamlined authority for T2DM.',
      US: 'Prescription-only; telehealth prescribing broadly permitted.',
    },
  },
  {
    drugName: 'Atorvastatin',
    genericName: 'atorvastatin calcium',
    scheduleIN: 'H',
    scheduleRO: 'P-RF',
    scheduleAU: 'S4',
    scheduleUS: 'Rx',
    telehealthAllowed: { IN: true, RO: true, AU: true, US: true },
    notes: {
      IN: 'Schedule H; prescription required; no special restrictions.',
      RO: 'Repeatable prescription; lipid-lowering therapy covered.',
      AU: 'S4 PBS listed; no authority required for standard doses.',
      US: 'Rx; telehealth prescribing unrestricted for chronic management.',
    },
  },
  {
    drugName: 'Omeprazole',
    genericName: 'omeprazole',
    scheduleIN: 'H',
    scheduleRO: 'OTC',
    scheduleAU: 'S3',
    scheduleUS: 'OTC',
    telehealthAllowed: { IN: true, RO: true, AU: true, US: true },
    notes: {
      IN: 'Schedule H prescription in India; not OTC at all pharmacies.',
      RO: 'OTC up to 20 mg; higher doses require prescription.',
      AU: 'S3 pharmacist-only at OTC doses; S4 Rx for higher doses.',
      US: 'OTC at standard doses; Rx for hospital-grade formulations.',
    },
  },
  {
    drugName: 'Paracetamol',
    genericName: 'acetaminophen / paracetamol',
    scheduleIN: 'OTC',
    scheduleRO: 'OTC',
    scheduleAU: 'S2',
    scheduleUS: 'OTC',
    telehealthAllowed: { IN: true, RO: true, AU: true, US: true },
    notes: {
      IN: 'OTC; widely available without prescription.',
      RO: 'OTC; hepatotoxicity counselling recommended.',
      AU: 'S2 pharmacist advice recommended; high-dose packs are S4.',
      US: 'OTC; liver warning mandatory on labelling.',
    },
  },
  {
    drugName: 'Ibuprofen',
    genericName: 'ibuprofen',
    scheduleIN: 'OTC',
    scheduleRO: 'OTC',
    scheduleAU: 'S2',
    scheduleUS: 'OTC',
    telehealthAllowed: { IN: true, RO: true, AU: true, US: true },
    notes: {
      IN: 'OTC; GI risk counselling advised.',
      RO: 'OTC; quantity per purchase limited to 10-day supply.',
      AU: 'S2 at standard doses; higher doses (600 mg+) are S4.',
      US: 'OTC; Rx versions (800 mg) require prescription.',
    },
  },
  {
    drugName: 'Amoxicillin',
    genericName: 'amoxicillin',
    scheduleIN: 'H',
    scheduleRO: 'P-6L',
    scheduleAU: 'S4',
    scheduleUS: 'Rx',
    telehealthAllowed: { IN: true, RO: 'with-conditions', AU: true, US: true },
    notes: {
      IN: 'Schedule H antibiotic; stewardship guidelines apply.',
      RO: 'P-6L; limited to 6-day course per prescription cycle.',
      AU: 'S4 PBS listed; culture sensitivity recommended before prescribing.',
      US: 'Rx; telehealth prescribing allowed; antibiotic stewardship encouraged.',
    },
  },
  {
    drugName: 'Sertraline',
    genericName: 'sertraline hydrochloride',
    scheduleIN: 'H',
    scheduleRO: 'PRF',
    scheduleAU: 'S4',
    scheduleUS: 'Rx',
    telehealthAllowed: { IN: 'with-conditions', RO: true, AU: true, US: true },
    notes: {
      IN: 'Schedule H; psychiatrist initiation preferred; GP continuation allowed.',
      RO: 'PRF; initial prescription from psychiatrist required.',
      AU: 'S4; GP can prescribe; initial mental health plan recommended.',
      US: 'Rx; widely prescribed via telehealth; FDA black-box warning for under-25s.',
    },
  },
  {
    drugName: 'Modafinil',
    genericName: 'modafinil',
    scheduleIN: 'NRx',
    scheduleRO: 'PRF',
    scheduleAU: 'S4',
    scheduleUS: 'CIV',
    telehealthAllowed: { IN: false, RO: false, AU: 'with-conditions', US: 'with-conditions' },
    notes: {
      IN: 'Schedule NRx; specialist prescription required; no telehealth.',
      RO: 'PRF; narcolepsy diagnosis mandatory; in-person consultation required.',
      AU: 'S4; authority prescription for narcolepsy; sleep physician initiation.',
      US: 'CIV; diagnosis of narcolepsy/SWSD required; DEA rules apply.',
    },
  },
];

const CONSENT_CATEGORIES = [
  'appointments',
  'medications',
  'lab-results',
  'immunizations',
  'allergies',
  'mental-health',
  'reproductive',
  'sti',
  'genetic',
  'billing',
] as const;

const MOCK_CONSENT_AGE_RULES: ConsentAgeRule[] = [
  // --- United States ---
  { country: 'US', category: 'appointments',   minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Parent/guardian authorises routine appointments.' },
  { country: 'US', category: 'appointments',   minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult; self-consent applies.' },
  { country: 'US', category: 'medications',    minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Parental consent required except emancipated minors.' },
  { country: 'US', category: 'medications',    minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent.' },
  { country: 'US', category: 'lab-results',    minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Results released to guardian; minor assent encouraged for 14+.' },
  { country: 'US', category: 'lab-results',    minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult access unrestricted.' },
  { country: 'US', category: 'immunizations',  minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Parental consent required per state school mandates.' },
  { country: 'US', category: 'immunizations',  minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent.' },
  { country: 'US', category: 'allergies',      minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Parental/guardian management of allergy records.' },
  { country: 'US', category: 'allergies',      minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent.' },
  { country: 'US', category: 'mental-health',  minAge: 12, maxAge: 17, requiresParentalConsent: false, requiresMinorAssent: true,  notes: 'Minors 12+ may consent to outpatient mental health in many states.' },
  { country: 'US', category: 'mental-health',  minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent.' },
  { country: 'US', category: 'reproductive',   minAge: 12, maxAge: 17, requiresParentalConsent: false, requiresMinorAssent: true,  notes: 'Minor may consent to contraceptive services in most states.' },
  { country: 'US', category: 'reproductive',   minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent.' },
  { country: 'US', category: 'sti',            minAge: 12, maxAge: 17, requiresParentalConsent: false, requiresMinorAssent: true,  notes: 'Minor may consent to STI testing/treatment in all 50 states.' },
  { country: 'US', category: 'sti',            minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent.' },
  { country: 'US', category: 'genetic',        minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: true,  notes: 'Parental consent + minor assent (14+) recommended for predictive testing.' },
  { country: 'US', category: 'genetic',        minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'GINA protections apply; adult self-consent.' },
  { country: 'US', category: 'billing',        minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Billing responsibility rests with parent/guardian.' },
  { country: 'US', category: 'billing',        minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult financial responsibility.' },
  // --- India ---
  { country: 'IN', category: 'appointments',   minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Guardian consent per Indian Medical Council Act.' },
  { country: 'IN', category: 'appointments',   minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult; self-consent under Indian Majority Act.' },
  { country: 'IN', category: 'medications',    minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Parental consent required for all prescriptions.' },
  { country: 'IN', category: 'medications',    minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent.' },
  { country: 'IN', category: 'lab-results',    minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Reports disclosed to guardian.' },
  { country: 'IN', category: 'lab-results',    minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult access.' },
  { country: 'IN', category: 'immunizations',  minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'UIP schedule managed by guardian.' },
  { country: 'IN', category: 'immunizations',  minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent.' },
  { country: 'IN', category: 'allergies',      minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Parental management.' },
  { country: 'IN', category: 'allergies',      minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent.' },
  { country: 'IN', category: 'mental-health',  minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: true,  notes: 'Mental Healthcare Act 2017; nominated representative required under 18.' },
  { country: 'IN', category: 'mental-health',  minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Advance directive permitted; adult self-consent.' },
  { country: 'IN', category: 'reproductive',   minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Parental consent required; POCSO provisions apply.' },
  { country: 'IN', category: 'reproductive',   minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent; MTP Act applies to termination.' },
  { country: 'IN', category: 'sti',            minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Guardian consent generally required; no explicit minor-consent statute.' },
  { country: 'IN', category: 'sti',            minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent; DPDPA data protection applies.' },
  { country: 'IN', category: 'genetic',        minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: true,  notes: 'DNA Technology Act guidance; parental consent + minor assent (15+).' },
  { country: 'IN', category: 'genetic',        minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent; pre-test counselling required.' },
  { country: 'IN', category: 'billing',        minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Financial responsibility on guardian.' },
  { country: 'IN', category: 'billing',        minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult financial responsibility.' },
  // --- Romania ---
  { country: 'RO', category: 'appointments',   minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Romanian Civil Code art. 483; parental authority required.' },
  { country: 'RO', category: 'appointments',   minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent under Romanian law.' },
  { country: 'RO', category: 'medications',    minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Parental consent required for all prescribed therapies.' },
  { country: 'RO', category: 'medications',    minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent.' },
  { country: 'RO', category: 'lab-results',    minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Results released to legal guardian.' },
  { country: 'RO', category: 'lab-results',    minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult access; GDPR applies to health data.' },
  { country: 'RO', category: 'immunizations',  minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'National immunisation programme; parental consent form required.' },
  { country: 'RO', category: 'immunizations',  minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent.' },
  { country: 'RO', category: 'allergies',      minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Parental management of allergy records.' },
  { country: 'RO', category: 'allergies',      minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent.' },
  { country: 'RO', category: 'mental-health',  minAge: 16, maxAge: 17, requiresParentalConsent: false, requiresMinorAssent: true,  notes: 'Romanian Mental Health Law 487/2002; minors 16+ can co-consent.' },
  { country: 'RO', category: 'mental-health',  minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent.' },
  { country: 'RO', category: 'reproductive',   minAge: 16, maxAge: 17, requiresParentalConsent: false, requiresMinorAssent: true,  notes: 'Contraceptive counselling allowed from age 16 without parental consent.' },
  { country: 'RO', category: 'reproductive',   minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent.' },
  { country: 'RO', category: 'sti',            minAge: 16, maxAge: 17, requiresParentalConsent: false, requiresMinorAssent: true,  notes: 'STI testing from 16 without parental consent; confidentiality upheld.' },
  { country: 'RO', category: 'sti',            minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent; GDPR data minimisation.' },
  { country: 'RO', category: 'genetic',        minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: true,  notes: 'Council of Europe Biomedicine Convention; parental consent + minor assent.' },
  { country: 'RO', category: 'genetic',        minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent; pre-test counselling mandatory.' },
  { country: 'RO', category: 'billing',        minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Legal guardian holds financial responsibility.' },
  { country: 'RO', category: 'billing',        minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult financial responsibility; CNAS insurance coverage.' },
  // --- Australia ---
  { country: 'AU', category: 'appointments',   minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Parental consent generally required under Australian common law (Gillick competence exception).' },
  { country: 'AU', category: 'appointments',   minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent.' },
  { country: 'AU', category: 'medications',    minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Parental consent; Gillick competence may apply for mature minors.' },
  { country: 'AU', category: 'medications',    minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent.' },
  { country: 'AU', category: 'lab-results',    minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Results to parent/guardian unless Gillick competent.' },
  { country: 'AU', category: 'lab-results',    minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult access; My Health Record Act applies.' },
  { country: 'AU', category: 'immunizations',  minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'ACIR records; parental consent on immunisation consent form.' },
  { country: 'AU', category: 'immunizations',  minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent; AIR record updated.' },
  { country: 'AU', category: 'allergies',      minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Parental management; ASCIA action plan involves guardian.' },
  { country: 'AU', category: 'allergies',      minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent.' },
  { country: 'AU', category: 'mental-health',  minAge: 14, maxAge: 17, requiresParentalConsent: false, requiresMinorAssent: true,  notes: 'Gillick competent minors (typically 14+) may consent to mental health care.' },
  { country: 'AU', category: 'mental-health',  minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent; Mental Health Act (state-specific) applies.' },
  { country: 'AU', category: 'reproductive',   minAge: 14, maxAge: 17, requiresParentalConsent: false, requiresMinorAssent: true,  notes: 'Mature minor doctrine applies; confidential contraceptive advice from ~14.' },
  { country: 'AU', category: 'reproductive',   minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent.' },
  { country: 'AU', category: 'sti',            minAge: 14, maxAge: 17, requiresParentalConsent: false, requiresMinorAssent: true,  notes: 'Gillick competent minors may seek STI care confidentially.' },
  { country: 'AU', category: 'sti',            minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent.' },
  { country: 'AU', category: 'genetic',        minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: true,  notes: 'NHMRC genetic testing guidelines; parental consent + minor assent from 12.' },
  { country: 'AU', category: 'genetic',        minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult self-consent; pre/post counselling recommended.' },
  { country: 'AU', category: 'billing',        minAge: 0,  maxAge: 17, requiresParentalConsent: true,  requiresMinorAssent: false, notes: 'Medicare card under guardian; billing responsibility on parent.' },
  { country: 'AU', category: 'billing',        minAge: 18, maxAge: 150, requiresParentalConsent: false, requiresMinorAssent: false, notes: 'Adult Medicare card holder; self-responsible.' },
];

const MOCK_US_STATES: USStateConfig[] = [
  {
    stateCode: 'CA', stateName: 'California', isIMLCMember: false, consentAge: 18,
    mentalHealthConsentAge: 12, reproductiveConsentAge: 12, stiConsentAge: 12,
    telehealthRestrictions: ['Audio-only requires informed consent documentation', 'Prescribing controlled substances via telehealth requires prior CURES check'],
  },
  {
    stateCode: 'TX', stateName: 'Texas', isIMLCMember: true, consentAge: 18,
    mentalHealthConsentAge: 16, reproductiveConsentAge: 18, stiConsentAge: 14,
    telehealthRestrictions: ['Telehealth platform must be HIPAA-compliant', 'Controlled substance prescribing follows DEA telehealth rules'],
  },
  {
    stateCode: 'NY', stateName: 'New York', isIMLCMember: true, consentAge: 18,
    mentalHealthConsentAge: 16, reproductiveConsentAge: 18, stiConsentAge: 12,
    telehealthRestrictions: ['Provider must be licensed in NY to treat NY patients', 'Audio-only telehealth permitted under Medicaid with documentation'],
  },
  {
    stateCode: 'FL', stateName: 'Florida', isIMLCMember: true, consentAge: 18,
    mentalHealthConsentAge: 13, reproductiveConsentAge: 18, stiConsentAge: 13,
    telehealthRestrictions: ['Telehealth provider registration with DOH required', 'No prescribing via telehealth without established patient relationship for CII'],
  },
  {
    stateCode: 'IL', stateName: 'Illinois', isIMLCMember: true, consentAge: 18,
    mentalHealthConsentAge: 12, reproductiveConsentAge: 18, stiConsentAge: 12,
    telehealthRestrictions: ['Illinois Telehealth Act requires real-time audio/video for initial visit'],
  },
  {
    stateCode: 'PA', stateName: 'Pennsylvania', isIMLCMember: true, consentAge: 18,
    mentalHealthConsentAge: 14, reproductiveConsentAge: 18, stiConsentAge: 14,
    telehealthRestrictions: ['PA license required; IMLC compact license accepted', 'Prescribing via telehealth subject to standard PA pharmacy law'],
  },
  {
    stateCode: 'OH', stateName: 'Ohio', isIMLCMember: true, consentAge: 18,
    mentalHealthConsentAge: 14, reproductiveConsentAge: 18, stiConsentAge: 14,
    telehealthRestrictions: ['Ohio telehealth law effective 2023; no in-person requirement for new patients'],
  },
  {
    stateCode: 'GA', stateName: 'Georgia', isIMLCMember: true, consentAge: 18,
    mentalHealthConsentAge: 12, reproductiveConsentAge: 18, stiConsentAge: 12,
    telehealthRestrictions: ['Telehealth provider must hold valid GA license', 'CII substances cannot be initiated via telehealth'],
  },
  {
    stateCode: 'NC', stateName: 'North Carolina', isIMLCMember: true, consentAge: 18,
    mentalHealthConsentAge: 16, reproductiveConsentAge: 18, stiConsentAge: 16,
    telehealthRestrictions: ['NCMB requires informed consent for telehealth services', 'Practice standard same as in-person care'],
  },
  {
    stateCode: 'WA', stateName: 'Washington', isIMLCMember: true, consentAge: 18,
    mentalHealthConsentAge: 13, reproductiveConsentAge: 18, stiConsentAge: 14,
    telehealthRestrictions: ['Telehealth parity law in effect; insurers must cover telehealth', 'Prescribing controlled substances via telehealth allowed under DEA exceptions'],
  },
];

const MOCK_SCOPE_RULES: ScopeOfPracticeRule[] = [
  {
    country: 'US', providerType: 'physician', canPrescribe: true, canReferWithoutGP: true,
    specialNotes: [
      'Full prescribing authority for schedules CII–CV with DEA registration.',
      'Can initiate specialist referrals without GP gateway.',
      'Telemedicine prescribing subject to Ryan Haight Act and DEA 2024 rule.',
    ],
    insuranceRequirements: 'Must be enrolled in Medicare/Medicaid and hold state license; credentialing by insurer required.',
  },
  {
    country: 'US', providerType: 'nurse-practitioner', canPrescribe: true, canReferWithoutGP: true,
    specialNotes: [
      'Full practice authority (FPA) granted in 27+ states; restricted in others.',
      'DEA registration needed for controlled substance prescribing.',
      'May refer specialists independently in FPA states.',
    ],
    insuranceRequirements: 'Medicare Part B billing as independent provider in FPA states; collaborative agreement may be required elsewhere.',
  },
  {
    country: 'IN', providerType: 'physician', canPrescribe: true, canReferWithoutGP: true,
    specialNotes: [
      'MBBS + registration with State Medical Council grants full prescribing rights.',
      'Schedule H and H1 prescriptions require printed letterhead with MCI number.',
      'Specialist referral does not require GP gateway in private sector.',
    ],
    insuranceRequirements: 'Empanelment with PMJAY/Ayushman Bharat for government scheme billing; private insurer TPA credentialing required.',
  },
  {
    country: 'IN', providerType: 'nurse-practitioner', canPrescribe: false, canReferWithoutGP: false,
    specialNotes: [
      'Nurse Practitioner scope not formally recognised under Indian law as of 2026.',
      'NPs working under physician supervision may administer medications but cannot independently prescribe.',
      'NP scope expansion under NMC deliberation; watch for regulatory updates.',
    ],
    insuranceRequirements: 'Billing only permissible under supervising physician; independent NP billing not supported by Indian TPAs.',
  },
  {
    country: 'RO', providerType: 'physician', canPrescribe: true, canReferWithoutGP: true,
    specialNotes: [
      'CMR (Colegiul Medicilor) registration mandatory for prescribing authority.',
      'Controlled substance prescriptions require triplicate form per ANMDM regulation.',
      'Specialist referral via Bilet de trimitere; GP gateway required for CNAS reimbursement.',
    ],
    insuranceRequirements: 'Contract with CNAS required for reimbursed services; private practice allowed without CNAS contract.',
  },
  {
    country: 'RO', providerType: 'nurse-practitioner', canPrescribe: false, canReferWithoutGP: false,
    specialNotes: [
      'Romanian nursing law does not grant independent prescribing authority.',
      'Nurses may administer medications under physician order.',
      'Referrals must be initiated by a physician; nurses cannot issue bilet de trimitere.',
    ],
    insuranceRequirements: 'CNAS does not recognise independent NP billing; all services billed under responsible physician.',
  },
  {
    country: 'AU', providerType: 'physician', canPrescribe: true, canReferWithoutGP: true,
    specialNotes: [
      'AHPRA registration and Medicare provider number required.',
      'S8 authority prescriptions require state permit in most jurisdictions.',
      'Specialist referral from GP required for Medicare rebate; specialists can self-refer patients in some pathways.',
    ],
    insuranceRequirements: 'Medicare Benefits Schedule (MBS) billing requires valid provider number; private health insurer billing varies.',
  },
  {
    country: 'AU', providerType: 'nurse-practitioner', canPrescribe: true, canReferWithoutGP: false,
    specialNotes: [
      'AHPRA endorsement as Nurse Practitioner required; limited prescribing formulary.',
      'Cannot prescribe S8 controlled substances independently in most states.',
      'Referrals to specialists require collaborative arrangement with supervising medical practitioner.',
    ],
    insuranceRequirements: 'MBS item numbers available for NP consultations since 2020; collaborative arrangement documentation required for claiming.',
  },
];

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class RulesetService {
  // --- Private signal state ---

  private readonly _jurisdiction = signal<JurisdictionConfig>({
    country: 'US',
    state: 'CA',
    version: '2026.1',
    lastUpdated: new Date(2026, 0, 15),
  });

  private readonly _drugSchedule = signal<DrugScheduleEntry[]>(MOCK_DRUG_SCHEDULE);

  private readonly _selectedDrugName = signal<string | null>(null);

  // --- Public readonly signals ---

  readonly jurisdiction = this._jurisdiction.asReadonly();
  readonly drugSchedule = this._drugSchedule.asReadonly();

  readonly selectedDrug = computed(() => {
    const name = this._selectedDrugName();
    if (name === null) return null;
    return this._drugSchedule().find(d => d.drugName === name) ?? null;
  });

  readonly currentCountrySchedule = computed(() => {
    const country = this._jurisdiction().country;
    return this._drugSchedule().filter(d => {
      const key = `schedule${country}` as keyof DrugScheduleEntry;
      return d[key] !== undefined;
    });
  });

  readonly consentAgeRules = computed(() => {
    const country = this._jurisdiction().country;
    return MOCK_CONSENT_AGE_RULES.filter(r => r.country === country);
  });

  readonly currentUSState = computed(() => {
    const { country, state } = this._jurisdiction();
    if (country !== 'US' || !state) return null;
    return MOCK_US_STATES.find(s => s.stateCode === state) ?? null;
  });

  // --- Mutation methods ---

  setJurisdiction(country: SupportedCountry, state?: string): void {
    this._jurisdiction.set({
      country,
      state,
      version: '2026.1',
      lastUpdated: new Date(2026, 0, 15),
    });
  }

  selectDrug(name: string | null): void {
    this._selectedDrugName.set(name);
  }

  // --- Business logic methods ---

  checkPrescribing(request: PrescribingCheckRequest): PrescribingCheckResult {
    const entry = this._drugSchedule().find(
      d => d.drugName.toLowerCase() === request.drugName.toLowerCase(),
    );

    if (!entry) {
      return {
        allowed: false,
        outcome: 'hard-stop',
        message: `Drug "${request.drugName}" not found in the formulary for ${request.country}.`,
        requirements: [],
        documentationNeeded: [],
        alternativeActions: ['Verify the drug name and resubmit.', 'Contact formulary management.'],
      };
    }

    const scheduleKey = `schedule${request.country}` as keyof DrugScheduleEntry;
    const schedule = entry[scheduleKey] as string | undefined;

    if (!schedule) {
      return {
        allowed: false,
        outcome: 'hard-stop',
        message: `${entry.drugName} has no schedule classification for ${request.country}.`,
        requirements: [],
        documentationNeeded: [],
        alternativeActions: ['Consult a local pharmacist or regulatory authority.'],
      };
    }

    const telehealthStatus = entry.telehealthAllowed[request.country];
    const countryNote = entry.notes[request.country];

    // Nurse practitioners cannot prescribe in IN or RO.
    if (
      request.providerType === 'nurse-practitioner' &&
      (request.country === 'IN' || request.country === 'RO')
    ) {
      return {
        allowed: false,
        outcome: 'hard-stop',
        message: `Nurse practitioners do not have independent prescribing authority in ${request.country}.`,
        requirements: ['Supervising physician must issue the prescription.'],
        documentationNeeded: ['Collaborative practice agreement', 'Physician co-signature'],
        alternativeActions: ['Request supervising physician to prescribe directly.'],
      };
    }

    // Telehealth-specific checks.
    if (request.isTelehealth) {
      if (telehealthStatus === false) {
        return {
          allowed: false,
          outcome: 'hard-stop',
          message: `${entry.drugName} (${schedule}) cannot be prescribed via telehealth in ${request.country}.`,
          requirements: ['In-person consultation required before prescribing this substance.'],
          documentationNeeded: ['In-person visit record', 'Physical examination notes'],
          alternativeActions: [
            'Schedule an in-person appointment.',
            'Consider an alternative non-controlled medication.',
          ],
        };
      }

      if (telehealthStatus === 'with-conditions') {
        const requirements: string[] = [countryNote];
        const documentation: string[] = [];

        if (request.country === 'US') {
          requirements.push('DEA registration with telemedicine prescribing designation required.');
          documentation.push('DEA registration certificate', 'Telemedicine patient consent form');
          if (request.isFirstPrescription) {
            requirements.push('New patient: verify identity and complete risk assessment.');
            documentation.push('Patient identity verification record', 'PDMP / CURES query result');
          }
        }

        if (request.country === 'AU') {
          requirements.push('AHPRA registration; S8 authority if applicable.');
          documentation.push('Authority prescription number', 'State S8 permit');
        }

        return {
          allowed: true,
          outcome: 'permitted-with-conditions',
          message: `${entry.drugName} may be prescribed via telehealth in ${request.country} subject to conditions.`,
          requirements,
          documentationNeeded: documentation,
        };
      }
    }

    // Controlled substance first-prescription caution.
    const isControlled = ['CII', 'CIII', 'CIV', 'CV', 'H1', 'NRx', 'NRxP', 'S8', 'PRF'].includes(
      schedule,
    );

    if (isControlled && request.isFirstPrescription) {
      return {
        allowed: true,
        outcome: 'warning',
        message: `${entry.drugName} (${schedule}) is a controlled substance. First prescription requires additional verification.`,
        requirements: [
          'Complete patient history and physical examination.',
          'Check prescription monitoring programme before issuing.',
          countryNote,
        ],
        documentationNeeded: [
          'Signed informed consent / treatment agreement',
          'PMP/PDMP query result',
          'Diagnosis supporting controlled substance use',
        ],
      };
    }

    return {
      allowed: true,
      outcome: 'permitted',
      message: `${entry.drugName} (${schedule}) may be prescribed in ${request.country}.`,
      requirements: [countryNote],
      documentationNeeded: isControlled ? ['Prescription monitoring programme query'] : [],
    };
  }

  checkConsent(request: ConsentCheckRequest): ConsentCheckResult {
    const rules = MOCK_CONSENT_AGE_RULES.filter(
      r =>
        r.country === request.country &&
        r.category === request.category &&
        request.patientAge >= r.minAge &&
        request.patientAge <= r.maxAge,
    );

    if (rules.length === 0) {
      // Default conservative fallback.
      const isAdult = request.patientAge >= 18;
      return {
        canAccess: isAdult || request.parentalConsentGiven,
        requiresParentalConsent: !isAdult,
        requiresMinorConsent: false,
        ageOfConsent: 18,
        notes: `No specific rule found for "${request.category}" in ${request.country}. Defaulting to age 18 standard.`,
      };
    }

    const rule = rules[0];
    const requiresParental = rule.requiresParentalConsent;
    const requiresMinorAssent = rule.requiresMinorAssent;
    const consentSatisfied = requiresParental ? request.parentalConsentGiven : true;

    return {
      canAccess: consentSatisfied,
      requiresParentalConsent: requiresParental,
      requiresMinorConsent: requiresMinorAssent,
      ageOfConsent: rule.minAge,
      notes: rule.notes,
    };
  }

  checkTelehealthJurisdiction(
    check: TelehealthJurisdictionCheck,
  ): TelehealthJurisdictionResult {
    const sameCountry = check.patientCountry === check.doctorCountry;

    // Cross-border international telehealth.
    if (!sameCountry) {
      return {
        compatible: false,
        status: 'incompatible',
        message: `Cross-border telehealth between ${check.patientCountry} and ${check.doctorCountry} is not supported without specific bilateral agreements.`,
        requirements: [
          'Doctor must hold a valid license in the patient\'s jurisdiction.',
          'Obtain legal opinion on cross-border practice legality.',
          'Review bilateral healthcare recognition treaties if any.',
        ],
        licensureNotes: `No automatic licensure recognition between ${check.doctorCountry} and ${check.patientCountry}. Separate registration may be required in the patient's country.`,
      };
    }

    // US intra-country: check IMLC.
    if (check.patientCountry === 'US' && check.patientState && check.doctorState) {
      const patientState = MOCK_US_STATES.find(s => s.stateCode === check.patientState);
      const doctorState = MOCK_US_STATES.find(s => s.stateCode === check.doctorState);

      if (check.patientState === check.doctorState) {
        return {
          compatible: true,
          status: 'fully-compatible',
          message: `Intrastate telehealth within ${check.patientState} is fully compatible.`,
          requirements: [
            'Doctor must hold active state license.',
            'Standard telehealth consent and platform requirements apply.',
          ],
          licensureNotes: `Single state license sufficient for ${check.patientState}.`,
        };
      }

      const bothImlc = patientState?.isIMLCMember && doctorState?.isIMLCMember;

      if (bothImlc) {
        return {
          compatible: true,
          status: 'fully-compatible',
          message: `Interstate Medical Licensure Compact (IMLC) covers both ${check.doctorState} (provider) and ${check.patientState} (patient).`,
          requirements: [
            'Verify IMLC compact license is active and includes patient state.',
            'Comply with patient state telehealth platform and prescribing rules.',
          ],
          licensureNotes: `IMLC compact license from ${check.doctorState} is valid for practice in ${check.patientState}.`,
        };
      }

      const patientNotImlc = patientState && !patientState.isIMLCMember;
      const doctorNotImlc = doctorState && !doctorState.isIMLCMember;

      if (patientNotImlc || doctorNotImlc) {
        const nonMember = patientNotImlc ? check.patientState : check.doctorState;
        return {
          compatible: false,
          status: 'incompatible',
          message: `${nonMember} is not an IMLC member state. A separate full license in ${check.patientState} is required.`,
          requirements: [
            `Obtain a full medical license in ${check.patientState}.`,
            'Or refer the patient to a provider licensed in their state.',
          ],
          licensureNotes: `IMLC compact license does not cover ${nonMember}. State-specific licensing process applies.`,
        };
      }
    }

    // Australia: same-country, no state restriction for telehealth.
    if (check.patientCountry === 'AU') {
      return {
        compatible: true,
        status: 'fully-compatible',
        message: 'Australian telehealth is nationally governed; AHPRA registration valid across all states and territories.',
        requirements: [
          'Valid AHPRA registration required.',
          'MBS telehealth item numbers apply; GP must meet HealthPathways criteria.',
          'Patients must be established with practice for some MBS items.',
        ],
        licensureNotes: 'AHPRA registration is national; no separate state license required for telehealth.',
      };
    }

    // India: same-country telehealth.
    if (check.patientCountry === 'IN') {
      return {
        compatible: true,
        status: 'partially-compatible',
        message: 'Telemedicine Practice Guidelines 2020 (MoHFW) apply. Cross-state telehealth is permitted within India.',
        requirements: [
          'Doctor must be registered with a State Medical Council or NMC.',
          'Explicit patient consent for teleconsultation required.',
          'Follow MoHFW Telemedicine Practice Guidelines for prescribing restrictions.',
        ],
        licensureNotes: 'State Medical Council registration valid nationally for teleconsultation under 2020 guidelines.',
      };
    }

    // Romania: same-country telehealth.
    if (check.patientCountry === 'RO') {
      return {
        compatible: true,
        status: 'partially-compatible',
        message: 'Romanian telehealth is governed by CMR guidelines and EU cross-border directive.',
        requirements: [
          'CMR (Colegiul Medicilor) registration mandatory.',
          'CNAS contract required for reimbursed teleconsultations.',
          'Telehealth platform must meet GDPR and Romanian DPA requirements.',
        ],
        licensureNotes: 'National CMR registration covers all regions; no sub-national licensing required.',
      };
    }

    return {
      compatible: false,
      status: 'unknown',
      message: 'Unable to determine telehealth compatibility for the provided jurisdiction combination.',
      requirements: ['Consult local regulatory authority for guidance.'],
      licensureNotes: 'Jurisdiction rules could not be resolved; manual review required.',
    };
  }

  getConsentAgeMatrix(country: SupportedCountry): ConsentAgeMatrix {
    return {
      country,
      rules: MOCK_CONSENT_AGE_RULES.filter(r => r.country === country),
    };
  }

  getUSStates(): USStateConfig[] {
    return MOCK_US_STATES;
  }

  getScopeOfPractice(
    country: SupportedCountry,
    providerType: string,
  ): ScopeOfPracticeRule | null {
    return (
      MOCK_SCOPE_RULES.find(
        r => r.country === country && r.providerType === providerType,
      ) ?? null
    );
  }
}
