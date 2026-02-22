import { Injectable, signal, computed } from '@angular/core';
import {
  FamilyGroup,
  FamilyMember,
  FamilyCondition,
  GeneticTestResult,
  PetProfile,
  PermissionEntry,
  PermissionMatrix,
  AuditLogEntry,
  RecordCategory,
  AccessLevel,
} from './family.models';

// =============================================================================
// Date Helper
// =============================================================================

function daysAgo(n: number): Date {
  const d = new Date(2026, 1, 22);
  d.setDate(d.getDate() - n);
  return d;
}

// =============================================================================
// Mock Conditions
// =============================================================================

const CONDITIONS_PATRICIA: FamilyCondition[] = [
  {
    id: 'fc-001',
    memberId: 'fm-005',
    snomedCode: '254837009',
    conditionName: 'Breast Cancer',
    category: 'Oncology',
    status: 'affected',
    onsetAge: 52,
    contributedToDeath: false,
    notes: 'Stage II, hormone receptor positive. Currently in remission after lumpectomy and adjuvant therapy.',
  },
  {
    id: 'fc-002',
    memberId: 'fm-005',
    snomedCode: '44054006',
    conditionName: 'Type 2 Diabetes',
    category: 'Endocrinology',
    status: 'affected',
    onsetAge: 58,
    contributedToDeath: false,
    notes: 'Well-controlled on oral agents.',
  },
];

const CONDITIONS_ROBERT: FamilyCondition[] = [
  {
    id: 'fc-003',
    memberId: 'fm-006',
    snomedCode: '44054006',
    conditionName: 'Type 2 Diabetes',
    category: 'Endocrinology',
    status: 'affected',
    onsetAge: 54,
    contributedToDeath: false,
    notes: 'Managed with Metformin and lifestyle changes.',
  },
  {
    id: 'fc-004',
    memberId: 'fm-006',
    snomedCode: '38341003',
    conditionName: 'Hypertension',
    category: 'Cardiology',
    status: 'affected',
    onsetAge: 50,
    contributedToDeath: false,
    notes: 'Controlled on ACE inhibitor.',
  },
  {
    id: 'fc-005',
    memberId: 'fm-006',
    snomedCode: '53741008',
    conditionName: 'Coronary Artery Disease',
    category: 'Cardiology',
    status: 'affected',
    onsetAge: 60,
    contributedToDeath: false,
    notes: 'Stent placed 2020. On dual antiplatelet therapy.',
  },
];

const CONDITIONS_ELENA: FamilyCondition[] = [
  {
    id: 'fc-006',
    memberId: 'fm-007',
    snomedCode: '254837009',
    conditionName: 'Breast Cancer',
    category: 'Oncology',
    status: 'affected',
    onsetAge: 62,
    contributedToDeath: true,
    notes: 'Metastatic breast cancer. Primary cause of death.',
  },
];

const CONDITIONS_WILLIAM: FamilyCondition[] = [
  {
    id: 'fc-007',
    memberId: 'fm-008',
    snomedCode: '26929004',
    conditionName: "Alzheimer's Disease",
    category: 'Neurology',
    status: 'affected',
    onsetAge: 80,
    contributedToDeath: false,
    notes: 'Moderate stage. Currently in memory care facility.',
  },
  {
    id: 'fc-008',
    memberId: 'fm-008',
    snomedCode: '38341003',
    conditionName: 'Hypertension',
    category: 'Cardiology',
    status: 'affected',
    onsetAge: 60,
    contributedToDeath: false,
  },
];

const CONDITIONS_DAVID: FamilyCondition[] = [
  {
    id: 'fc-009',
    memberId: 'fm-009',
    snomedCode: '40108008',
    conditionName: 'Beta-Thalassemia Trait',
    category: 'Hematology',
    status: 'carrier',
    onsetAge: undefined,
    contributedToDeath: false,
    notes: 'Incidentally found on CBC. Genetic counseling completed.',
  },
];

const CONDITIONS_JAMES: FamilyCondition[] = [
  {
    id: 'fc-010',
    memberId: 'fm-010',
    snomedCode: '363406005',
    conditionName: 'Colon Cancer',
    category: 'Oncology',
    status: 'affected',
    onsetAge: 53,
    contributedToDeath: true,
    notes: 'Stage IV at diagnosis. Died 2 years post-diagnosis.',
  },
];

// =============================================================================
// Mock Genetic Tests
// =============================================================================

const GENETIC_TESTS_PATRICIA: GeneticTestResult[] = [
  {
    id: 'gt-001',
    memberId: 'fm-005',
    testName: 'BRCA1/2 Panel',
    geneName: 'BRCA2',
    variant: 'c.5946delT (p.Ser1982ArgfsTer22)',
    classification: 'pathogenic',
    testDate: new Date(2024, 3, 15),
    lab: 'Myriad Genetics',
    resultSummary: 'Pathogenic BRCA2 variant identified. Significantly elevated lifetime risk for breast and ovarian cancer.',
    consentGiven: true,
    consentDate: new Date(2024, 2, 28),
  },
];

const GENETIC_TESTS_DAVID: GeneticTestResult[] = [
  {
    id: 'gt-002',
    memberId: 'fm-009',
    testName: 'Hemoglobinopathy Panel',
    geneName: 'HBB',
    variant: 'c.92+5G>C',
    classification: 'pathogenic',
    testDate: new Date(2023, 8, 10),
    lab: 'Quest Diagnostics',
    resultSummary: 'Carrier for beta-thalassemia. Reproductive counseling recommended if partner carrier status unknown.',
    consentGiven: true,
    consentDate: new Date(2023, 7, 22),
  },
];

// =============================================================================
// Mock Permission Entries
// =============================================================================

const MOCK_PERMISSIONS: PermissionEntry[] = [
  // Maria (spouse) → Alex: full access to all categories
  { memberId: 'fm-002', targetMemberId: 'fm-001', category: 'appointments', level: 'full', setBy: 'fm-001', setAt: daysAgo(120) },
  { memberId: 'fm-002', targetMemberId: 'fm-001', category: 'medications', level: 'full', setBy: 'fm-001', setAt: daysAgo(120) },
  { memberId: 'fm-002', targetMemberId: 'fm-001', category: 'lab-results', level: 'full', setBy: 'fm-001', setAt: daysAgo(120) },
  { memberId: 'fm-002', targetMemberId: 'fm-001', category: 'immunizations', level: 'full', setBy: 'fm-001', setAt: daysAgo(120) },
  { memberId: 'fm-002', targetMemberId: 'fm-001', category: 'allergies', level: 'full', setBy: 'fm-001', setAt: daysAgo(120) },
  { memberId: 'fm-002', targetMemberId: 'fm-001', category: 'mental-health', level: 'partial', setBy: 'fm-001', setAt: daysAgo(120) },
  { memberId: 'fm-002', targetMemberId: 'fm-001', category: 'reproductive', level: 'none', setBy: 'fm-002', setAt: daysAgo(90) },
  { memberId: 'fm-002', targetMemberId: 'fm-001', category: 'billing', level: 'full', setBy: 'fm-001', setAt: daysAgo(120) },
  { memberId: 'fm-002', targetMemberId: 'fm-001', category: 'genetic', level: 'partial', setBy: 'fm-001', setAt: daysAgo(60) },
  { memberId: 'fm-002', targetMemberId: 'fm-001', category: 'sti', level: 'none', setBy: 'fm-002', setAt: daysAgo(90) },
  // Marcus (teen) → Alex: partial
  { memberId: 'fm-004', targetMemberId: 'fm-001', category: 'appointments', level: 'full', setBy: 'fm-001', setAt: daysAgo(60) },
  { memberId: 'fm-004', targetMemberId: 'fm-001', category: 'medications', level: 'partial', setBy: 'fm-001', setAt: daysAgo(60) },
  { memberId: 'fm-004', targetMemberId: 'fm-001', category: 'mental-health', level: 'none', setBy: 'fm-004', setAt: daysAgo(30) },
];

// =============================================================================
// Mock Audit Log
// =============================================================================

const MOCK_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: 'al-001',
    timestamp: daysAgo(2),
    actorId: 'fm-001',
    actorName: 'Alex Johnson',
    action: 'PERMISSION_UPDATED',
    targetMemberId: 'fm-002',
    targetMemberName: 'Maria Johnson',
    details: 'Updated mental-health access level from "full" to "partial".',
    category: 'permissions',
  },
  {
    id: 'al-002',
    timestamp: daysAgo(7),
    actorId: 'fm-001',
    actorName: 'Alex Johnson',
    action: 'MEMBER_ADDED',
    targetMemberId: 'fm-010',
    targetMemberName: 'James Johnson',
    details: 'Added history-only record for paternal uncle James Johnson (deceased).',
    category: 'member-management',
  },
  {
    id: 'al-003',
    timestamp: daysAgo(14),
    actorId: 'fm-001',
    actorName: 'Alex Johnson',
    action: 'CONDITION_ADDED',
    targetMemberId: 'fm-005',
    targetMemberName: 'Patricia Johnson',
    details: 'Added condition "Type 2 Diabetes" for Patricia Johnson.',
    category: 'health-records',
  },
  {
    id: 'al-004',
    timestamp: daysAgo(21),
    actorId: 'fm-001',
    actorName: 'Alex Johnson',
    action: 'PET_ADDED',
    details: 'Added pet profile for Buddy (Golden Retriever).',
    category: 'pet-management',
  },
  {
    id: 'al-005',
    timestamp: daysAgo(45),
    actorId: 'fm-001',
    actorName: 'Alex Johnson',
    action: 'GENETIC_TEST_LINKED',
    targetMemberId: 'fm-005',
    targetMemberName: 'Patricia Johnson',
    details: 'Linked BRCA2 pathogenic variant test result from Myriad Genetics.',
    category: 'health-records',
  },
  {
    id: 'al-006',
    timestamp: daysAgo(90),
    actorId: 'fm-001',
    actorName: 'Alex Johnson',
    action: 'FAMILY_GROUP_CREATED',
    details: 'Family group "Johnson Family" created with Alex Johnson as primary member.',
    category: 'member-management',
  },
];

// =============================================================================
// Mock Pets
// =============================================================================

const MOCK_PETS: PetProfile[] = [
  {
    id: 'pet-001',
    familyGroupId: 'fg-001',
    name: 'Buddy',
    species: 'dog',
    breed: 'Golden Retriever',
    dateOfBirth: new Date(2021, 3, 10),
    weight: 32.5,
    weightUnit: 'kg',
    avatarColor: '#ca8a04',
    vaccinations: [
      {
        id: 'pv-001',
        vaccineName: 'Rabies',
        administeredDate: daysAgo(365),
        nextDueDate: daysAgo(-365),
        veterinarian: 'Dr. Janet Moore, DVM',
        batchNumber: 'RB-2025-44821',
      },
      {
        id: 'pv-002',
        vaccineName: 'DHPP (Distemper/Hepatitis/Parvovirus/Parainfluenza)',
        administeredDate: daysAgo(365),
        nextDueDate: daysAgo(-730),
        veterinarian: 'Dr. Janet Moore, DVM',
        batchNumber: 'DHPP-2025-31104',
      },
      {
        id: 'pv-003',
        vaccineName: 'Bordetella (Kennel Cough)',
        administeredDate: daysAgo(180),
        nextDueDate: daysAgo(-185),
        veterinarian: 'Dr. Janet Moore, DVM',
      },
      {
        id: 'pv-004',
        vaccineName: 'Leptospirosis',
        administeredDate: daysAgo(365),
        nextDueDate: daysAgo(-365),
        veterinarian: 'Dr. Janet Moore, DVM',
        batchNumber: 'LEPTO-2025-88302',
      },
    ],
    medications: [
      {
        id: 'pm-001',
        medicationName: 'Simparica Trio',
        dosage: '48 mg (20-40 kg range)',
        frequency: 'Once monthly',
        startDate: new Date(2024, 0, 1),
        prescribedBy: 'Dr. Janet Moore, DVM',
        status: 'active',
      },
    ],
    allergies: [],
    weightHistory: [
      { date: daysAgo(365), weight: 30.2, unit: 'kg' },
      { date: daysAgo(270), weight: 31.0, unit: 'kg' },
      { date: daysAgo(180), weight: 31.8, unit: 'kg' },
      { date: daysAgo(90), weight: 32.1, unit: 'kg' },
      { date: daysAgo(30), weight: 32.5, unit: 'kg' },
    ],
    vetVisits: [
      {
        id: 'vv-001',
        date: daysAgo(30),
        reason: 'Annual wellness exam and vaccinations',
        veterinarian: 'Dr. Janet Moore, DVM',
        clinic: 'Riverside Animal Hospital',
        notes: 'Good overall health. Slight tartar buildup — dental cleaning recommended in 6 months. Weight stable.',
        followUpDate: daysAgo(-180),
      },
    ],
    zoonoticFlags: {
      rabiesVaccinated: true,
      regularFleaTick: true,
      recentTravel: false,
      contactWithWildlife: false,
    },
  },
  {
    id: 'pet-002',
    familyGroupId: 'fg-001',
    name: 'Whiskers',
    species: 'cat',
    breed: 'Domestic Shorthair',
    dateOfBirth: new Date(2023, 5, 3),
    weight: 4.2,
    weightUnit: 'kg',
    avatarColor: '#be185d',
    vaccinations: [
      {
        id: 'pv-005',
        vaccineName: 'Rabies',
        administeredDate: daysAgo(200),
        nextDueDate: daysAgo(-165),
        veterinarian: 'Dr. Samuel Park, DVM',
        batchNumber: 'RB-2025-72931',
      },
      {
        id: 'pv-006',
        vaccineName: 'FVRCP (Feline Viral Rhinotracheitis/Calicivirus/Panleukopenia)',
        administeredDate: daysAgo(200),
        nextDueDate: daysAgo(-1095),
        veterinarian: 'Dr. Samuel Park, DVM',
        batchNumber: 'FVRCP-2025-50417',
      },
    ],
    medications: [],
    allergies: [
      {
        id: 'pa-001',
        allergen: 'Fish-based cat food',
        reaction: 'Vomiting, gastrointestinal upset',
        severity: 'moderate',
      },
      {
        id: 'pa-002',
        allergen: 'Certain plastic food bowls',
        reaction: 'Facial dermatitis around chin',
        severity: 'mild',
      },
    ],
    weightHistory: [
      { date: daysAgo(200), weight: 3.8, unit: 'kg' },
      { date: daysAgo(120), weight: 4.0, unit: 'kg' },
      { date: daysAgo(30), weight: 4.2, unit: 'kg' },
    ],
    vetVisits: [
      {
        id: 'vv-002',
        date: daysAgo(200),
        reason: 'Initial wellness exam, vaccinations, and spay procedure',
        veterinarian: 'Dr. Samuel Park, DVM',
        clinic: 'Paws & Claws Veterinary Clinic',
        notes: 'Healthy young adult cat. Spayed uneventfully. Discuss food allergies on next visit.',
        followUpDate: daysAgo(-165),
      },
    ],
    zoonoticFlags: {
      rabiesVaccinated: true,
      indoorOnly: true,
      regularFleaTick: false,
      recentTravel: false,
    },
  },
];

// =============================================================================
// Mock Family Group
// =============================================================================

const BASE = new Date(2026, 1, 22);

function birthDate(yearsAgo: number): Date {
  const d = new Date(BASE);
  d.setFullYear(d.getFullYear() - yearsAgo);
  return d;
}

const MOCK_FAMILY_GROUP: FamilyGroup = {
  id: 'fg-001',
  name: 'Johnson Family',
  primaryMemberId: 'fm-001',
  members: [
    // ── Proband: Alex Johnson ──────────────────────────────────────────────
    {
      id: 'fm-001',
      firstName: 'Alex',
      lastName: 'Johnson',
      dateOfBirth: birthDate(35),
      sexAtBirth: 'male',
      relationship: 'sibling', // self/proband — relationship to group is proband
      biologicalRelation: 'biological',
      isDeceased: false,
      isProband: true,
      isPet: false,
      avatarColor: '#0d9488',
      source: 'portal-linked',
      linkedPatientId: 'patient-demo-001',
      identifiers: [{ type: 'MRN', value: 'MRN-20240001', country: 'US' }],
      accessLevel: 'full',
      proxyStatus: 'active',
      conditions: [],
      geneticTests: [],
      notes: 'Primary portal account holder.',
      createdAt: daysAgo(90),
      updatedAt: daysAgo(2),
    },
    // ── Spouse: Maria Johnson ──────────────────────────────────────────────
    {
      id: 'fm-002',
      firstName: 'Maria',
      lastName: 'Johnson',
      dateOfBirth: birthDate(33),
      sexAtBirth: 'female',
      relationship: 'spouse',
      biologicalRelation: 'none',
      isDeceased: false,
      isProband: false,
      isPet: false,
      avatarColor: '#be185d',
      source: 'portal-linked',
      linkedPatientId: 'patient-demo-002',
      identifiers: [{ type: 'MRN', value: 'MRN-20240002', country: 'US' }],
      accessLevel: 'partial',
      proxyStatus: 'active',
      conditions: [],
      geneticTests: [],
      notes: 'Née Garcia. Linked via GoHealth portal account.',
      createdAt: daysAgo(90),
      updatedAt: daysAgo(7),
    },
    // ── Minor child: Lily Johnson ──────────────────────────────────────────
    {
      id: 'fm-003',
      firstName: 'Lily',
      lastName: 'Johnson',
      dateOfBirth: birthDate(8),
      sexAtBirth: 'female',
      relationship: 'child',
      biologicalRelation: 'biological',
      isDeceased: false,
      isProband: false,
      isPet: false,
      avatarColor: '#7c3aed',
      source: 'manual-entry',
      identifiers: [],
      accessLevel: 'full',
      proxyStatus: 'active',
      conditions: [],
      geneticTests: [],
      notes: 'Minor — proxy access managed by parents.',
      createdAt: daysAgo(90),
      updatedAt: daysAgo(30),
    },
    // ── Teen child: Marcus Johnson ─────────────────────────────────────────
    {
      id: 'fm-004',
      firstName: 'Marcus',
      lastName: 'Johnson',
      dateOfBirth: birthDate(15),
      sexAtBirth: 'male',
      relationship: 'child',
      biologicalRelation: 'biological',
      isDeceased: false,
      isProband: false,
      isPet: false,
      avatarColor: '#2563eb',
      source: 'portal-linked',
      linkedPatientId: 'patient-demo-004',
      identifiers: [{ type: 'MRN', value: 'MRN-20240004', country: 'US' }],
      accessLevel: 'partial',
      proxyStatus: 'active',
      conditions: [],
      geneticTests: [],
      notes: 'Adolescent — some records restricted per patient preference.',
      createdAt: daysAgo(60),
      updatedAt: daysAgo(30),
    },
    // ── Mother: Patricia Johnson ───────────────────────────────────────────
    {
      id: 'fm-005',
      firstName: 'Patricia',
      lastName: 'Johnson',
      dateOfBirth: birthDate(62),
      sexAtBirth: 'female',
      relationship: 'parent',
      biologicalRelation: 'biological',
      isDeceased: false,
      isProband: false,
      isPet: false,
      avatarColor: '#ea580c',
      source: 'manual-entry',
      identifiers: [],
      accessLevel: 'partial',
      conditions: CONDITIONS_PATRICIA,
      geneticTests: GENETIC_TESTS_PATRICIA,
      notes: 'BRCA2 carrier. In remission from breast cancer (Stage II, diagnosed age 52).',
      createdAt: daysAgo(90),
      updatedAt: daysAgo(14),
    },
    // ── Father: Robert Johnson ─────────────────────────────────────────────
    {
      id: 'fm-006',
      firstName: 'Robert',
      lastName: 'Johnson',
      dateOfBirth: birthDate(64),
      sexAtBirth: 'male',
      relationship: 'parent',
      biologicalRelation: 'biological',
      isDeceased: false,
      isProband: false,
      isPet: false,
      avatarColor: '#dc2626',
      source: 'manual-entry',
      identifiers: [],
      accessLevel: 'partial',
      conditions: CONDITIONS_ROBERT,
      geneticTests: [],
      notes: 'Strong paternal history of cardiovascular disease and metabolic syndrome.',
      createdAt: daysAgo(90),
      updatedAt: daysAgo(14),
    },
    // ── Maternal grandmother: Elena Garcia ────────────────────────────────
    {
      id: 'fm-007',
      firstName: 'Elena',
      lastName: 'Garcia',
      dateOfBirth: birthDate(71),
      sexAtBirth: 'female',
      relationship: 'grandparent',
      biologicalRelation: 'biological',
      isDeceased: true,
      deceasedAge: 71,
      isProband: false,
      isPet: false,
      avatarColor: '#16a34a',
      source: 'history-only',
      identifiers: [],
      accessLevel: 'none',
      conditions: CONDITIONS_ELENA,
      geneticTests: [],
      notes: 'Maternal grandmother. Died of metastatic breast cancer. BRCA2 inheritance likely from this line.',
      createdAt: daysAgo(90),
      updatedAt: daysAgo(45),
    },
    // ── Paternal grandfather: William Johnson ──────────────────────────────
    {
      id: 'fm-008',
      firstName: 'William',
      lastName: 'Johnson',
      dateOfBirth: birthDate(88),
      sexAtBirth: 'male',
      relationship: 'grandparent',
      biologicalRelation: 'biological',
      isDeceased: false,
      isProband: false,
      isPet: false,
      avatarColor: '#ca8a04',
      source: 'history-only',
      identifiers: [],
      accessLevel: 'none',
      conditions: CONDITIONS_WILLIAM,
      geneticTests: [],
      notes: 'Paternal grandfather. Currently in memory care facility. Advanced Alzheimer\'s disease.',
      createdAt: daysAgo(90),
      updatedAt: daysAgo(45),
    },
    // ── Sibling: David Johnson ─────────────────────────────────────────────
    {
      id: 'fm-009',
      firstName: 'David',
      lastName: 'Johnson',
      dateOfBirth: birthDate(32),
      sexAtBirth: 'male',
      relationship: 'sibling',
      biologicalRelation: 'biological',
      isDeceased: false,
      isProband: false,
      isPet: false,
      avatarColor: '#0d9488',
      source: 'manual-entry',
      identifiers: [],
      accessLevel: 'partial',
      conditions: CONDITIONS_DAVID,
      geneticTests: GENETIC_TESTS_DAVID,
      notes: 'Younger brother. Beta-thalassemia carrier — genetic counseling recommended before family planning.',
      createdAt: daysAgo(90),
      updatedAt: daysAgo(21),
    },
    // ── History-only uncle: James Johnson (deceased) ───────────────────────
    {
      id: 'fm-010',
      firstName: 'James',
      lastName: 'Johnson',
      dateOfBirth: birthDate(57),
      sexAtBirth: 'male',
      relationship: 'aunt-uncle',
      biologicalRelation: 'biological',
      isDeceased: true,
      deceasedAge: 55,
      isProband: false,
      isPet: false,
      avatarColor: '#7c3aed',
      source: 'history-only',
      identifiers: [],
      accessLevel: 'none',
      conditions: CONDITIONS_JAMES,
      geneticTests: [],
      notes: 'Paternal uncle. Died of colon cancer age 55. Colonoscopy screening recommended for male relatives from age 40.',
      createdAt: daysAgo(7),
      updatedAt: daysAgo(7),
    },
  ],
  pets: MOCK_PETS,
  permissionMatrix: MOCK_PERMISSIONS,
  auditLog: MOCK_AUDIT_LOG,
  createdAt: daysAgo(90),
  updatedAt: daysAgo(2),
};

// =============================================================================
// All Record Categories (for permission matrix building)
// =============================================================================

const ALL_CATEGORIES: RecordCategory[] = [
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
];

// =============================================================================
// Generation Grouping Helper
// =============================================================================

type GenerationKey = 'grandparents' | 'parents' | 'self-siblings' | 'children';

function getGeneration(member: FamilyMember): GenerationKey {
  if (member.relationship === 'grandparent') return 'grandparents';
  if (member.relationship === 'parent') return 'parents';
  if (member.relationship === 'child') return 'children';
  return 'self-siblings'; // sibling, spouse, partner, proband
}

// =============================================================================
// Service
// =============================================================================

@Injectable({ providedIn: 'root' })
export class FamilyService {
  // ── Private signal state ─────────────────────────────────────────────────

  private readonly _familyGroup = signal<FamilyGroup>(MOCK_FAMILY_GROUP);
  private readonly _pets = signal<PetProfile[]>(MOCK_PETS);
  private readonly _selectedMemberId = signal<string | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _searchTerm = signal<string>('');

  // ── Public readonly signals ──────────────────────────────────────────────

  readonly familyGroup = this._familyGroup.asReadonly();
  readonly pets = this._pets.asReadonly();
  readonly selectedMemberId = this._selectedMemberId.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  // ── Computed: Member collections ─────────────────────────────────────────

  readonly members = computed(() => this._familyGroup().members);

  readonly humanMembers = computed(() =>
    this._familyGroup().members.filter(m => !m.isPet)
  );

  readonly selectedMember = computed<FamilyMember | null>(() => {
    const id = this._selectedMemberId();
    if (!id) return null;
    return this._familyGroup().members.find(m => m.id === id) ?? null;
  });

  // ── Computed: Search-filtered members ────────────────────────────────────

  readonly filteredMembers = computed<FamilyMember[]>(() => {
    const term = this._searchTerm().trim().toLowerCase();
    const humans = this.humanMembers();
    if (!term) return humans;
    return humans.filter(m => {
      const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
      const conditions = m.conditions.map(c => c.conditionName.toLowerCase()).join(' ');
      return fullName.includes(term) || conditions.includes(term);
    });
  });

  // ── Computed: Permission matrix ───────────────────────────────────────────

  readonly permissionMatrix = computed<PermissionMatrix[]>(() => {
    const group = this._familyGroup();
    const entries = group.permissionMatrix;

    return group.members
      .filter(m => !m.isProband && !m.isPet)
      .map(member => {
        const memberEntries = entries.filter(e => e.memberId === member.id);
        const permissions = ALL_CATEGORIES.reduce(
          (acc, cat) => {
            const entry = memberEntries.find(e => e.category === cat);
            acc[cat] = entry?.level ?? 'none';
            return acc;
          },
          {} as Record<RecordCategory, AccessLevel>
        );

        return {
          memberId: member.id,
          memberName: `${member.firstName} ${member.lastName}`,
          permissions,
        };
      });
  });

  // ── Computed: Audit log ───────────────────────────────────────────────────

  readonly auditLog = computed(() =>
    [...this._familyGroup().auditLog].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    )
  );

  // ── Computed: Members by generation ──────────────────────────────────────

  readonly membersByGeneration = computed<Record<GenerationKey, FamilyMember[]>>(() => {
    const humans = this.humanMembers();
    const groups: Record<GenerationKey, FamilyMember[]> = {
      grandparents: [],
      parents: [],
      'self-siblings': [],
      children: [],
    };
    for (const member of humans) {
      groups[getGeneration(member)].push(member);
    }
    return groups;
  });

  // ── Computed: All conditions across family ────────────────────────────────

  readonly familyConditions = computed<FamilyCondition[]>(() =>
    this._familyGroup().members.flatMap(m => m.conditions)
  );

  // ── Computed: Unique condition names for heredity risk summary ────────────

  readonly uniqueConditionNames = computed<string[]>(() => {
    const names = this.familyConditions().map(c => c.conditionName);
    return [...new Set(names)].sort();
  });

  // ── Computed: Members with genetic tests ─────────────────────────────────

  readonly membersWithGeneticTests = computed<FamilyMember[]>(() =>
    this._familyGroup().members.filter(m => m.geneticTests.length > 0)
  );

  // ── Methods: Navigation ───────────────────────────────────────────────────

  selectMember(id: string | null): void {
    this._selectedMemberId.set(id);
  }

  search(term: string): void {
    this._searchTerm.set(term);
  }

  // ── Methods: Member CRUD ──────────────────────────────────────────────────

  addMember(member: Partial<FamilyMember>): void {
    const existingIds = this._familyGroup().members.map(m => m.id);
    const nextNum = existingIds.length + 1;
    const id = `fm-${String(nextNum).padStart(3, '0')}`;
    const now = new Date();

    const newMember: FamilyMember = {
      id,
      firstName: member.firstName ?? 'Unknown',
      lastName: member.lastName ?? '',
      dateOfBirth: member.dateOfBirth,
      sexAtBirth: member.sexAtBirth ?? 'unknown',
      relationship: member.relationship ?? 'sibling',
      biologicalRelation: member.biologicalRelation ?? 'biological',
      isDeceased: member.isDeceased ?? false,
      deceasedAge: member.deceasedAge,
      isProband: false,
      isPet: false,
      avatarColor: member.avatarColor ?? '#0d9488',
      avatarUrl: member.avatarUrl,
      source: member.source ?? 'manual-entry',
      linkedPatientId: member.linkedPatientId,
      identifiers: member.identifiers ?? [],
      accessLevel: member.accessLevel ?? 'none',
      proxyStatus: member.proxyStatus,
      conditions: member.conditions ?? [],
      geneticTests: member.geneticTests ?? [],
      notes: member.notes,
      createdAt: now,
      updatedAt: now,
    };

    this._familyGroup.update(g => ({
      ...g,
      members: [...g.members, newMember],
      updatedAt: now,
    }));

    this.addAuditEntry(
      'MEMBER_ADDED',
      `Added ${newMember.firstName} ${newMember.lastName} as ${newMember.relationship}.`,
      newMember.id
    );
  }

  removeMember(id: string): void {
    const member = this._familyGroup().members.find(m => m.id === id);
    if (!member || member.isProband) return;

    const name = `${member.firstName} ${member.lastName}`;

    this._familyGroup.update(g => ({
      ...g,
      members: g.members.filter(m => m.id !== id),
      permissionMatrix: g.permissionMatrix.filter(
        e => e.memberId !== id && e.targetMemberId !== id
      ),
      updatedAt: new Date(),
    }));

    this.addAuditEntry('MEMBER_REMOVED', `Removed family member ${name}.`);
  }

  updateMember(id: string, updates: Partial<FamilyMember>): void {
    this._familyGroup.update(g => ({
      ...g,
      members: g.members.map(m =>
        m.id === id ? { ...m, ...updates, id, updatedAt: new Date() } : m
      ),
      updatedAt: new Date(),
    }));

    this.addAuditEntry('MEMBER_UPDATED', `Updated record for member ${id}.`, id);
  }

  // ── Methods: Condition CRUD ───────────────────────────────────────────────

  addCondition(memberId: string, condition: Partial<FamilyCondition>): void {
    const allConditions = this._familyGroup().members.flatMap(m => m.conditions);
    const nextNum = allConditions.length + 1;
    const id = `fc-${String(nextNum).padStart(3, '0')}`;

    const newCondition: FamilyCondition = {
      id,
      memberId,
      snomedCode: condition.snomedCode,
      conditionName: condition.conditionName ?? 'Unknown Condition',
      category: condition.category ?? 'General',
      status: condition.status ?? 'unknown',
      onsetAge: condition.onsetAge,
      contributedToDeath: condition.contributedToDeath ?? false,
      notes: condition.notes,
    };

    this._familyGroup.update(g => ({
      ...g,
      members: g.members.map(m =>
        m.id === memberId
          ? { ...m, conditions: [...m.conditions, newCondition], updatedAt: new Date() }
          : m
      ),
      updatedAt: new Date(),
    }));

    this.addAuditEntry(
      'CONDITION_ADDED',
      `Added condition "${newCondition.conditionName}" for member ${memberId}.`,
      memberId
    );
  }

  removeCondition(memberId: string, conditionId: string): void {
    this._familyGroup.update(g => ({
      ...g,
      members: g.members.map(m =>
        m.id === memberId
          ? {
              ...m,
              conditions: m.conditions.filter(c => c.id !== conditionId),
              updatedAt: new Date(),
            }
          : m
      ),
      updatedAt: new Date(),
    }));

    this.addAuditEntry(
      'CONDITION_REMOVED',
      `Removed condition ${conditionId} from member ${memberId}.`,
      memberId
    );
  }

  // ── Methods: Permissions ──────────────────────────────────────────────────

  updatePermissions(
    memberId: string,
    category: RecordCategory,
    level: AccessLevel
  ): void {
    const now = new Date();
    const proband = this._familyGroup().members.find(m => m.isProband);
    const setBy = proband?.id ?? 'unknown';

    this._familyGroup.update(g => {
      const existing = g.permissionMatrix.find(
        e => e.memberId === memberId && e.targetMemberId === 'fm-001' && e.category === category
      );

      const updatedMatrix = existing
        ? g.permissionMatrix.map(e =>
            e.memberId === memberId && e.targetMemberId === 'fm-001' && e.category === category
              ? { ...e, level, setAt: now }
              : e
          )
        : [
            ...g.permissionMatrix,
            {
              memberId,
              targetMemberId: 'fm-001',
              category,
              level,
              setBy,
              setAt: now,
            },
          ];

      return { ...g, permissionMatrix: updatedMatrix, updatedAt: now };
    });

    this.addAuditEntry(
      'PERMISSION_UPDATED',
      `Updated ${category} access for member ${memberId} to "${level}".`,
      memberId
    );
  }

  // ── Methods: Pet CRUD ─────────────────────────────────────────────────────

  addPet(pet: Partial<PetProfile>): void {
    const existingIds = this._pets().map(p => p.id);
    const nextNum = existingIds.length + 1;
    const id = `pet-${String(nextNum).padStart(3, '0')}`;

    const newPet: PetProfile = {
      id,
      familyGroupId: this._familyGroup().id,
      name: pet.name ?? 'Unnamed Pet',
      species: pet.species ?? 'other',
      breed: pet.breed,
      dateOfBirth: pet.dateOfBirth,
      weight: pet.weight,
      weightUnit: pet.weightUnit ?? 'kg',
      avatarColor: pet.avatarColor ?? '#16a34a',
      avatarUrl: pet.avatarUrl,
      vaccinations: pet.vaccinations ?? [],
      medications: pet.medications ?? [],
      allergies: pet.allergies ?? [],
      weightHistory: pet.weightHistory ?? [],
      vetVisits: pet.vetVisits ?? [],
      zoonoticFlags: pet.zoonoticFlags ?? {},
    };

    this._pets.update(pets => [...pets, newPet]);
    this.addAuditEntry('PET_ADDED', `Added pet profile for ${newPet.name} (${newPet.species}).`);
  }

  updatePet(petId: string, updates: Partial<PetProfile>): void {
    this._pets.update(pets =>
      pets.map(p => (p.id === petId ? { ...p, ...updates, id: petId } : p))
    );
    this.addAuditEntry('PET_UPDATED', `Updated pet profile for ${petId}.`);
  }

  // ── Methods: Audit Log ────────────────────────────────────────────────────

  addAuditEntry(action: string, details: string, targetMemberId?: string): void {
    const group = this._familyGroup();
    const proband = group.members.find(m => m.isProband);
    const existingCount = group.auditLog.length;
    const id = `al-${String(existingCount + 1).padStart(3, '0')}`;

    let targetMemberName: string | undefined;
    if (targetMemberId) {
      const target = group.members.find(m => m.id === targetMemberId);
      if (target) {
        targetMemberName = `${target.firstName} ${target.lastName}`;
      }
    }

    const entry: AuditLogEntry = {
      id,
      timestamp: new Date(),
      actorId: proband?.id ?? 'system',
      actorName: proband ? `${proband.firstName} ${proband.lastName}` : 'System',
      action,
      targetMemberId,
      targetMemberName,
      details,
      category: action.toLowerCase().replace(/_/g, '-'),
    };

    this._familyGroup.update(g => ({
      ...g,
      auditLog: [entry, ...g.auditLog],
      updatedAt: new Date(),
    }));
  }
}
