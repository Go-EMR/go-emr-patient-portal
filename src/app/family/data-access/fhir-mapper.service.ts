import { Injectable } from '@angular/core';
import {
  FamilyMember,
  FamilyGroup,
  FamilyCondition,
  GeneticTestResult,
  PetProfile,
  PermissionEntry,
  AuditLogEntry
} from './family.models';

// =============================================================================
// FHIR R4 Resource Interfaces (simplified for mapping)
// =============================================================================

export interface FhirPatient {
  resourceType: 'Patient';
  id: string;
  meta: { profile: string[] };
  name: { use: string; family: string; given: string[] }[];
  gender: string;
  birthDate?: string;
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  identifier?: { system: string; value: string }[];
}

export interface FhirRelatedPerson {
  resourceType: 'RelatedPerson';
  id: string;
  patient: { reference: string };
  relationship: { coding: { system: string; code: string; display: string }[] }[];
  name: { use: string; family: string; given: string[] }[];
  gender: string;
  birthDate?: string;
}

export interface FhirGroup {
  resourceType: 'Group';
  id: string;
  type: 'person';
  actual: true;
  name: string;
  member: { entity: { reference: string }; period?: { start: string } }[];
}

export interface FhirConsent {
  resourceType: 'Consent';
  id: string;
  status: 'active' | 'inactive' | 'draft';
  scope: { coding: { system: string; code: string }[] };
  category: { coding: { system: string; code: string; display: string }[] }[];
  patient: { reference: string };
  performer: { reference: string }[];
  provision: {
    type: 'permit' | 'deny';
    period?: { start: string; end?: string };
    class?: { system: string; code: string }[];
  };
}

export interface FhirFamilyMemberHistory {
  resourceType: 'FamilyMemberHistory';
  id: string;
  status: 'completed' | 'partial';
  patient: { reference: string };
  relationship: { coding: { system: string; code: string; display: string }[] };
  name?: string;
  sex?: { coding: { system: string; code: string }[] };
  bornDate?: string;
  deceasedBoolean?: boolean;
  deceasedAge?: { value: number; unit: string };
  condition?: {
    code: { coding: { system: string; code: string; display: string }[] };
    outcome?: { coding: { system: string; code: string; display: string }[] };
    onsetAge?: { value: number; unit: string };
    contributedToDeath?: boolean;
  }[];
}

export interface FhirObservation {
  resourceType: 'Observation';
  id: string;
  status: 'final' | 'preliminary';
  category: { coding: { system: string; code: string; display: string }[] }[];
  code: { coding: { system: string; code: string; display: string }[] };
  subject: { reference: string };
  effectiveDateTime: string;
  valueCodeableConcept?: { coding: { system: string; code: string; display: string }[] };
  interpretation?: { coding: { system: string; code: string; display: string }[] }[];
  performer?: { reference: string; display: string }[];
  component?: {
    code: { coding: { system: string; code: string; display: string }[] };
    valueString?: string;
  }[];
}

export interface FhirDocumentReference {
  resourceType: 'DocumentReference';
  id: string;
  status: 'current' | 'superseded';
  type: { coding: { system: string; code: string; display: string }[] };
  subject: { reference: string };
  date: string;
  description: string;
  content: { attachment: { contentType: string; title: string } }[];
}

// =============================================================================
// FHIR Mapper Service
// =============================================================================

@Injectable({ providedIn: 'root' })
export class FhirMapperService {

  // ── Patient ────────────────────────────────────────────────────────────────

  memberToPatient(member: FamilyMember): FhirPatient {
    return {
      resourceType: 'Patient',
      id: member.id,
      meta: { profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient'] },
      name: [{
        use: 'official',
        family: member.lastName,
        given: [member.firstName]
      }],
      gender: this.mapGender(member.sexAtBirth),
      birthDate: member.dateOfBirth ? this.formatDate(member.dateOfBirth) : undefined,
      deceasedBoolean: member.isDeceased || undefined,
      identifier: member.identifiers.map(id => ({
        system: this.getIdentifierSystem(id.type, id.country),
        value: id.value
      }))
    };
  }

  // ── RelatedPerson ──────────────────────────────────────────────────────────

  memberToRelatedPerson(member: FamilyMember, probandId: string): FhirRelatedPerson {
    return {
      resourceType: 'RelatedPerson',
      id: `rp-${member.id}`,
      patient: { reference: `Patient/${probandId}` },
      relationship: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode',
          code: this.mapRelationshipCode(member.relationship),
          display: this.mapRelationshipDisplay(member.relationship)
        }]
      }],
      name: [{
        use: 'official',
        family: member.lastName,
        given: [member.firstName]
      }],
      gender: this.mapGender(member.sexAtBirth),
      birthDate: member.dateOfBirth ? this.formatDate(member.dateOfBirth) : undefined
    };
  }

  // ── Group ──────────────────────────────────────────────────────────────────

  familyGroupToGroup(group: FamilyGroup): FhirGroup {
    return {
      resourceType: 'Group',
      id: group.id,
      type: 'person',
      actual: true,
      name: group.name,
      member: group.members.map(m => ({
        entity: { reference: `Patient/${m.id}` },
        period: { start: this.formatDate(m.createdAt) }
      }))
    };
  }

  // ── Consent ────────────────────────────────────────────────────────────────

  permissionToConsent(entry: PermissionEntry, memberName: string): FhirConsent {
    return {
      resourceType: 'Consent',
      id: `consent-${entry.memberId}-${entry.targetMemberId}-${entry.category}`,
      status: 'active',
      scope: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy' }]
      },
      category: [{
        coding: [{
          system: 'http://loinc.org',
          code: '59284-0',
          display: 'Consent Document'
        }]
      }],
      patient: { reference: `Patient/${entry.targetMemberId}` },
      performer: [{ reference: `Patient/${entry.memberId}` }],
      provision: {
        type: entry.level === 'none' ? 'deny' : 'permit',
        period: {
          start: this.formatDate(entry.setAt),
          end: entry.expiresAt ? this.formatDate(entry.expiresAt) : undefined
        },
        class: [{
          system: 'http://hl7.org/fhir/resource-types',
          code: this.mapCategoryToResourceType(entry.category)
        }]
      }
    };
  }

  // ── FamilyMemberHistory ────────────────────────────────────────────────────

  memberToFamilyHistory(member: FamilyMember, probandId: string): FhirFamilyMemberHistory {
    return {
      resourceType: 'FamilyMemberHistory',
      id: `fmh-${member.id}`,
      status: member.conditions.length > 0 ? 'completed' : 'partial',
      patient: { reference: `Patient/${probandId}` },
      relationship: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode',
          code: this.mapRelationshipCode(member.relationship),
          display: this.mapRelationshipDisplay(member.relationship)
        }]
      },
      name: `${member.firstName} ${member.lastName}`,
      sex: {
        coding: [{
          system: 'http://hl7.org/fhir/administrative-gender',
          code: this.mapGender(member.sexAtBirth)
        }]
      },
      bornDate: member.dateOfBirth ? this.formatDate(member.dateOfBirth) : undefined,
      deceasedBoolean: member.isDeceased || undefined,
      deceasedAge: member.deceasedAge ? { value: member.deceasedAge, unit: 'a' } : undefined,
      condition: member.conditions
        .filter(c => c.status === 'affected' || c.status === 'carrier')
        .map(c => ({
          code: {
            coding: [{
              system: 'http://snomed.info/sct',
              code: c.snomedCode || 'unknown',
              display: c.conditionName
            }]
          },
          outcome: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
              code: c.status === 'carrier' ? 'carrier' : 'confirmed',
              display: c.status === 'carrier' ? 'Carrier' : 'Confirmed'
            }]
          },
          onsetAge: c.onsetAge ? { value: c.onsetAge, unit: 'a' } : undefined,
          contributedToDeath: c.contributedToDeath || undefined
        }))
    };
  }

  // ── Observation (Genetic Test) ─────────────────────────────────────────────

  geneticTestToObservation(test: GeneticTestResult): FhirObservation {
    return {
      resourceType: 'Observation',
      id: `obs-${test.id}`,
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'laboratory',
          display: 'Laboratory'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '55233-1',
          display: `Genetic analysis — ${test.geneName}`
        }]
      },
      subject: { reference: `Patient/${test.memberId}` },
      effectiveDateTime: this.formatDate(test.testDate),
      valueCodeableConcept: {
        coding: [{
          system: 'http://loinc.org',
          code: this.mapClassificationCode(test.classification),
          display: this.mapClassificationDisplay(test.classification)
        }]
      },
      interpretation: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
          code: test.classification === 'pathogenic' || test.classification === 'likely-pathogenic' ? 'A' : 'N',
          display: test.classification === 'pathogenic' || test.classification === 'likely-pathogenic' ? 'Abnormal' : 'Normal'
        }]
      }],
      performer: [{ reference: `Organization/${test.lab}`, display: test.lab }],
      component: [
        {
          code: { coding: [{ system: 'http://loinc.org', code: '48018-6', display: 'Gene studied' }] },
          valueString: test.geneName
        },
        ...(test.variant ? [{
          code: { coding: [{ system: 'http://loinc.org', code: '81252-9', display: 'Discrete genetic variant' }] },
          valueString: test.variant
        }] : [])
      ]
    };
  }

  // ── DocumentReference (Audit Log) ──────────────────────────────────────────

  auditToDocumentReference(entry: AuditLogEntry): FhirDocumentReference {
    return {
      resourceType: 'DocumentReference',
      id: `doc-${entry.id}`,
      status: 'current',
      type: {
        coding: [{
          system: 'http://loinc.org',
          code: '57833-6',
          display: 'Audit log entry'
        }]
      },
      subject: entry.targetMemberId ? { reference: `Patient/${entry.targetMemberId}` } : { reference: 'Patient/unknown' },
      date: this.formatDate(entry.timestamp),
      description: `${entry.action}: ${entry.details}`,
      content: [{
        attachment: {
          contentType: 'text/plain',
          title: `${entry.action} by ${entry.actorName}`
        }
      }]
    };
  }

  // ── Batch Export ───────────────────────────────────────────────────────────

  exportFamilyBundle(group: FamilyGroup): object {
    const proband = group.members.find(m => m.isProband);
    const probandId = proband?.id || group.primaryMemberId;
    const entries: { resource: object; request: { method: string; url: string } }[] = [];

    // Group resource
    entries.push({
      resource: this.familyGroupToGroup(group),
      request: { method: 'PUT', url: `Group/${group.id}` }
    });

    // Patient + RelatedPerson + FamilyMemberHistory for each member
    for (const member of group.members) {
      entries.push({
        resource: this.memberToPatient(member),
        request: { method: 'PUT', url: `Patient/${member.id}` }
      });

      if (!member.isProband) {
        entries.push({
          resource: this.memberToRelatedPerson(member, probandId),
          request: { method: 'PUT', url: `RelatedPerson/rp-${member.id}` }
        });
      }

      entries.push({
        resource: this.memberToFamilyHistory(member, probandId),
        request: { method: 'PUT', url: `FamilyMemberHistory/fmh-${member.id}` }
      });

      // Genetic test observations
      for (const test of member.geneticTests) {
        entries.push({
          resource: this.geneticTestToObservation(test),
          request: { method: 'PUT', url: `Observation/obs-${test.id}` }
        });
      }
    }

    // Consent resources from permission matrix
    for (const perm of group.permissionMatrix) {
      const targetMember = group.members.find(m => m.id === perm.targetMemberId);
      entries.push({
        resource: this.permissionToConsent(perm, targetMember ? `${targetMember.firstName} ${targetMember.lastName}` : 'Unknown'),
        request: { method: 'PUT', url: `Consent/consent-${perm.memberId}-${perm.targetMemberId}-${perm.category}` }
      });
    }

    return {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: entries
    };
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private mapGender(sex: string): string {
    switch (sex) {
      case 'male': return 'male';
      case 'female': return 'female';
      case 'intersex': return 'other';
      default: return 'unknown';
    }
  }

  private mapRelationshipCode(rel: string): string {
    const map: Record<string, string> = {
      'spouse': 'SPS',
      'partner': 'DOMPART',
      'child': 'CHILD',
      'parent': 'PRN',
      'grandparent': 'GRPRN',
      'sibling': 'SIB',
      'aunt-uncle': 'AUNT',
      'cousin': 'COUSN',
      'niece-nephew': 'NEPHEW',
      'pet': 'O'
    };
    return map[rel] || 'O';
  }

  private mapRelationshipDisplay(rel: string): string {
    const map: Record<string, string> = {
      'spouse': 'Spouse',
      'partner': 'Domestic Partner',
      'child': 'Child',
      'parent': 'Parent',
      'grandparent': 'Grandparent',
      'sibling': 'Sibling',
      'aunt-uncle': 'Aunt/Uncle',
      'cousin': 'Cousin',
      'niece-nephew': 'Niece/Nephew',
      'pet': 'Other'
    };
    return map[rel] || 'Other';
  }

  private mapCategoryToResourceType(category: string): string {
    const map: Record<string, string> = {
      'appointments': 'Appointment',
      'medications': 'MedicationRequest',
      'lab-results': 'Observation',
      'immunizations': 'Immunization',
      'allergies': 'AllergyIntolerance',
      'mental-health': 'Condition',
      'reproductive': 'Condition',
      'sti': 'Condition',
      'genetic': 'Observation',
      'billing': 'Claim'
    };
    return map[category] || 'Resource';
  }

  private mapClassificationCode(classification: string): string {
    const map: Record<string, string> = {
      'pathogenic': 'LA6668-3',
      'likely-pathogenic': 'LA26332-9',
      'vus': 'LA26333-7',
      'likely-benign': 'LA26334-5',
      'benign': 'LA6675-8'
    };
    return map[classification] || 'LA26333-7';
  }

  private mapClassificationDisplay(classification: string): string {
    const map: Record<string, string> = {
      'pathogenic': 'Pathogenic',
      'likely-pathogenic': 'Likely Pathogenic',
      'vus': 'Variant of Uncertain Significance',
      'likely-benign': 'Likely Benign',
      'benign': 'Benign'
    };
    return map[classification] || 'Unknown';
  }

  private getIdentifierSystem(type: string, country: string): string {
    const systems: Record<string, string> = {
      'ABHA': 'https://healthid.ndhm.gov.in',
      'IHI': 'http://ns.electronichealth.net.au/id/hi/ihi/1.0',
      'CNP': 'urn:oid:2.16.840.1.113883.4.40',
      'MRN': 'http://hospital.example.org/mrn',
      'SSN': 'http://hl7.org/fhir/sid/us-ssn'
    };
    return systems[type] || `urn:${country}:${type}`;
  }
}
