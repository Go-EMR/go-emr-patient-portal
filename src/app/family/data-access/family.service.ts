import { Injectable, inject, signal, computed } from '@angular/core';
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
import { GovetApiAdapter } from '../../shared/data-access/govet-api.adapter';
import { GOVET_ENABLED, GOVET_DEMO_OWNER_ID } from '../../shared/data-access/govet.config';
import { AuthService } from '../../auth/data-access/auth.service';
import { forkJoin } from 'rxjs';

// TODO: Implement backend endpoint for GET /api/v1/portal/patients/{id}/family
// TODO: Implement backend endpoint for POST /api/v1/portal/patients/{id}/family/members
// TODO: Implement backend endpoint for PUT /api/v1/portal/patients/{id}/family/members/{memberId}
// TODO: Implement backend endpoint for DELETE /api/v1/portal/patients/{id}/family/members/{memberId}

// =============================================================================
// Empty family group seed (used when no API data is available)
// =============================================================================

function makeEmptyFamilyGroup(patientId: string): FamilyGroup {
  const now = new Date();
  return {
    id: `fg-${patientId}`,
    name: 'My Family',
    primaryMemberId: `fm-self`,
    members: [],
    pets: [],
    permissionMatrix: [],
    auditLog: [],
    createdAt: now,
    updatedAt: now,
  };
}

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
  private readonly govetAdapter = inject(GovetApiAdapter);
  private readonly authService = inject(AuthService);

  // ── Private signal state ─────────────────────────────────────────────────

  private readonly _familyGroup = signal<FamilyGroup>(
    makeEmptyFamilyGroup(localStorage.getItem('portal_patient_id') ?? 'unknown')
  );
  private readonly _pets = signal<PetProfile[]>([]);
  private readonly _selectedMemberId = signal<string | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _searchTerm = signal<string>('');
  private readonly _govetLoaded = signal<boolean>(false);

  constructor() {
    if (GOVET_ENABLED) {
      this.loadPetsFromGovet();
    }
  }

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

  // ── Methods: Load from API ────────────────────────────────────────────────

  /**
   * Loads family group data from the backend API.
   * TODO: Implement backend endpoint GET /api/v1/portal/patients/{id}/family
   */
  async loadFamilyGroup(): Promise<void> {
    const patientId = localStorage.getItem('portal_patient_id') || this.authService.user()?.patientId;
    const token = localStorage.getItem('portal_token');

    if (!patientId || !token) {
      return;
    }

    this._isLoading.set(true);
    try {
      const resp = await fetch(
        `/api/v1/portal/patients/${patientId}/family`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (resp.ok) {
        const data: { family_group: FamilyGroup } = await resp.json();
        if (data.family_group) {
          // Rehydrate Date objects that arrive as ISO strings
          const group = this.rehydrateFamilyGroup(data.family_group);
          this._familyGroup.set(group);
          if (!GOVET_ENABLED) {
            this._pets.set(group.pets);
          }
        }
      }
      // On non-OK response: leave as empty family group
    } catch {
      // On network error: leave as empty family group
    } finally {
      this._isLoading.set(false);
    }
  }

  /** Converts ISO date strings back to Date instances after JSON parse. */
  private rehydrateFamilyGroup(group: FamilyGroup): FamilyGroup {
    return {
      ...group,
      createdAt: new Date(group.createdAt),
      updatedAt: new Date(group.updatedAt),
      members: group.members.map(m => ({
        ...m,
        dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth) : undefined,
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.updatedAt),
        conditions: m.conditions ?? [],
        geneticTests: (m.geneticTests ?? []).map(gt => ({
          ...gt,
          testDate: new Date(gt.testDate),
          consentDate: gt.consentDate ? new Date(gt.consentDate) : undefined
        }))
      })),
      auditLog: (group.auditLog ?? []).map(e => ({
        ...e,
        timestamp: new Date(e.timestamp)
      })),
      permissionMatrix: (group.permissionMatrix ?? []).map(p => ({
        ...p,
        setAt: new Date(p.setAt),
        expiresAt: p.expiresAt ? new Date(p.expiresAt) : undefined
      }))
    };
  }

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
      const probandId = proband?.id ?? 'fm-001';
      const existing = g.permissionMatrix.find(
        e => e.memberId === memberId && e.targetMemberId === probandId && e.category === category
      );

      const updatedMatrix = existing
        ? g.permissionMatrix.map(e =>
            e.memberId === memberId && e.targetMemberId === probandId && e.category === category
              ? { ...e, level, setAt: now }
              : e
          )
        : [
            ...g.permissionMatrix,
            {
              memberId,
              targetMemberId: probandId,
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

  // ── Methods: GoVet Integration ────────────────────────────────────────────

  /**
   * Loads pet data from the GoVet mock API.
   * On success, replaces the local pets with GoVet data.
   * On failure, silently falls back to empty array.
   */
  private loadPetsFromGovet(): void {
    this._isLoading.set(true);
    const familyGroupId = this._familyGroup().id;
    const ownerId = GOVET_DEMO_OWNER_ID;

    this.govetAdapter.getOwnerPets(ownerId, familyGroupId).subscribe({
      next: (pets) => {
        if (pets.length > 0) {
          const recordCalls = pets.map(pet =>
            this.govetAdapter.getPetRecords(ownerId, pet.id, pet),
          );
          forkJoin(recordCalls).subscribe({
            next: (enrichedPets) => {
              const petsWithFlags = enrichedPets.map(pet => ({
                ...pet,
                zoonoticFlags: this.computeZoonoticFlags(pet),
              }));
              this._pets.set(petsWithFlags);
              this._familyGroup.update(g => ({ ...g, pets: petsWithFlags }));
              this._govetLoaded.set(true);
              this._isLoading.set(false);
            },
            error: () => {
              this._pets.set(pets);
              this._familyGroup.update(g => ({ ...g, pets }));
              this._govetLoaded.set(true);
              this._isLoading.set(false);
            },
          });
        } else {
          // No pets found — leave as empty array
          this._isLoading.set(false);
        }
      },
      error: () => {
        // GoVet API unreachable — leave as empty array
        this._isLoading.set(false);
      },
    });
  }

  /**
   * Derives zoonotic flags from vaccination records.
   */
  private computeZoonoticFlags(pet: PetProfile): Record<string, boolean> {
    const hasRabies = pet.vaccinations.some(v =>
      v.vaccineName.toLowerCase().includes('rabies'),
    );
    return {
      rabiesVaccinated: hasRabies,
      regularFleaTick: false,
      recentTravel: false,
      contactWithWildlife: false,
    };
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

    const user = this.authService.user();
    const entry: AuditLogEntry = {
      id,
      timestamp: new Date(),
      actorId: proband?.id ?? user?.patientId ?? 'system',
      actorName: proband
        ? `${proband.firstName} ${proband.lastName}`
        : user
          ? `${user.firstName} ${user.lastName}`
          : 'System',
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
