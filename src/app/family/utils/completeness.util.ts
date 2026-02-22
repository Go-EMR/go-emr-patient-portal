// =============================================================================
// Completeness Utility — Task 17
// Calculates family history completeness from members array
// =============================================================================

import { FamilyMember } from '../data-access/family.models';

export type CompletenessStatus = 'complete' | 'partial' | 'missing';

export interface CompletenessItem {
  label: string;
  relationship: string;
  status: CompletenessStatus;
  memberId?: string;
  memberName?: string;
}

export interface CompletenessResult {
  percentage: number;
  items: CompletenessItem[];
  totalExpected: number;
  totalComplete: number;
  totalPartial: number;
  totalMissing: number;
}

// Expected relatives to track for a complete family history
const EXPECTED_RELATIVES: { label: string; relationship: string }[] = [
  { label: 'Mother',                 relationship: 'parent'      },
  { label: 'Father',                 relationship: 'parent'      },
  { label: 'Maternal Grandmother',   relationship: 'grandparent' },
  { label: 'Maternal Grandfather',   relationship: 'grandparent' },
  { label: 'Paternal Grandmother',   relationship: 'grandparent' },
  { label: 'Paternal Grandfather',   relationship: 'grandparent' },
  { label: 'Siblings',               relationship: 'sibling'     },
];

export function calculateCompleteness(members: FamilyMember[]): CompletenessResult {
  // Group non-proband members by relationship for matching
  const humanMembers = members.filter(m => !m.isPet && !m.isProband);

  const parentMembers    = humanMembers.filter(m => m.relationship === 'parent');
  const grandparentMembers = humanMembers.filter(m => m.relationship === 'grandparent');
  const siblingMembers   = humanMembers.filter(m => m.relationship === 'sibling');

  // Determine sex-split for parents and grandparents
  const motherCandidates = parentMembers.filter(m => m.sexAtBirth === 'female');
  const fatherCandidates = parentMembers.filter(m => m.sexAtBirth === 'male');

  const grandmotherCandidates = grandparentMembers.filter(m => m.sexAtBirth === 'female');
  const grandfatherCandidates = grandparentMembers.filter(m => m.sexAtBirth === 'male');

  function resolveStatus(
    candidates: FamilyMember[],
    minRequired = 1
  ): { status: CompletenessStatus; memberId?: string; memberName?: string } {
    if (candidates.length === 0) {
      return { status: 'missing' };
    }
    const withConditions = candidates.filter(m => m.conditions.length > 0);
    const best = withConditions[0] ?? candidates[0];
    return {
      status: withConditions.length > 0 ? 'complete' : 'partial',
      memberId: best.id,
      memberName: `${best.firstName} ${best.lastName}`,
    };
  }

  const motherResult     = resolveStatus(motherCandidates);
  const fatherResult     = resolveStatus(fatherCandidates);
  const maternalGrandmaResult = resolveStatus(
    grandmotherCandidates.slice(0, 1)
  );
  const maternalGrandpaResult = resolveStatus(
    grandfatherCandidates.slice(0, 1)
  );
  const paternalGrandmaResult = resolveStatus(
    grandmotherCandidates.slice(1, 2)
  );
  const paternalGrandpaResult = resolveStatus(
    grandfatherCandidates.slice(1, 2)
  );

  // Siblings: partial if any exists without conditions, complete if any with conditions
  let siblingsStatus: CompletenessStatus = 'missing';
  let siblingsMemberId: string | undefined;
  let siblingsMemberName: string | undefined;
  if (siblingMembers.length > 0) {
    const withConditions = siblingMembers.filter(m => m.conditions.length > 0);
    siblingsStatus = withConditions.length > 0 ? 'complete' : 'partial';
    const best = withConditions[0] ?? siblingMembers[0];
    siblingsMemberId = best.id;
    siblingsMemberName = `${best.firstName} ${best.lastName}`;
  }

  const items: CompletenessItem[] = [
    {
      label: 'Mother',
      relationship: 'parent',
      status: motherResult.status,
      memberId: motherResult.memberId,
      memberName: motherResult.memberName,
    },
    {
      label: 'Father',
      relationship: 'parent',
      status: fatherResult.status,
      memberId: fatherResult.memberId,
      memberName: fatherResult.memberName,
    },
    {
      label: 'Maternal Grandmother',
      relationship: 'grandparent',
      status: maternalGrandmaResult.status,
      memberId: maternalGrandmaResult.memberId,
      memberName: maternalGrandmaResult.memberName,
    },
    {
      label: 'Maternal Grandfather',
      relationship: 'grandparent',
      status: maternalGrandpaResult.status,
      memberId: maternalGrandpaResult.memberId,
      memberName: maternalGrandpaResult.memberName,
    },
    {
      label: 'Paternal Grandmother',
      relationship: 'grandparent',
      status: paternalGrandmaResult.status,
      memberId: paternalGrandmaResult.memberId,
      memberName: paternalGrandmaResult.memberName,
    },
    {
      label: 'Paternal Grandfather',
      relationship: 'grandparent',
      status: paternalGrandpaResult.status,
      memberId: paternalGrandpaResult.memberId,
      memberName: paternalGrandpaResult.memberName,
    },
    {
      label: 'Siblings',
      relationship: 'sibling',
      status: siblingsStatus,
      memberId: siblingsMemberId,
      memberName: siblingsMemberName,
    },
  ];

  const totalExpected = items.length;
  const totalComplete = items.filter(i => i.status === 'complete').length;
  const totalPartial  = items.filter(i => i.status === 'partial').length;
  const totalMissing  = items.filter(i => i.status === 'missing').length;

  // Scoring: complete = 1 point, partial = 0.5 points, missing = 0
  const score = totalComplete + totalPartial * 0.5;
  const percentage = Math.round((score / totalExpected) * 100);

  return {
    percentage,
    items,
    totalExpected,
    totalComplete,
    totalPartial,
    totalMissing,
  };
}
