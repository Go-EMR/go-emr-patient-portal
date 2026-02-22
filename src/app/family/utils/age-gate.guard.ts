import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FamilyService } from '../data-access/family.service';
import { RulesetService } from '../data-access/ruleset.service';
import { calculateAgeGateRules } from './age-gate.util';

/**
 * Route guard that checks age-gate rules before allowing access to a child's records.
 * If the child has reached the consent age for the jurisdiction, access is denied
 * and the user is redirected to the family dashboard with a notification.
 *
 * Usage in routes:
 *   { path: 'family/member/:id/records', canActivate: [ageGateGuard], ... }
 */
export const ageGateGuard: CanActivateFn = (route) => {
  const familyService = inject(FamilyService);
  const rulesetService = inject(RulesetService);
  const router = inject(Router);

  const memberId = route.paramMap.get('id');
  if (!memberId) {
    return true;
  }

  const members = familyService.members();
  const member = members.find(m => m.id === memberId);

  if (!member) {
    return true;
  }

  // Only apply age-gate to child relationships
  if (member.relationship !== 'child') {
    return true;
  }

  // No DOB means we can't calculate age gate
  if (!member.dateOfBirth) {
    return true;
  }

  const jurisdiction = rulesetService.jurisdiction();
  const result = calculateAgeGateRules(
    member.dateOfBirth,
    jurisdiction.country,
    jurisdiction.state
  );

  // If access level is 'none', the child has aged out — block access
  if (result.accessLevel === 'none') {
    // Log the denial to audit trail
    familyService.addAuditEntry(
      'age-gate-denied',
      `Access to ${member.firstName} ${member.lastName}'s records was denied — age gate threshold reached (${result.cutoffAge} years in ${jurisdiction.country}${jurisdiction.state ? '/' + jurisdiction.state : ''})`,
      memberId
    );

    router.navigate(['/family'], {
      queryParams: {
        ageGateDenied: member.firstName,
        cutoffAge: result.cutoffAge
      }
    });

    return false;
  }

  // If partial access, log it but allow navigation
  if (result.accessLevel === 'partial') {
    familyService.addAuditEntry(
      'age-gate-partial',
      `Partial access to ${member.firstName} ${member.lastName}'s records — approaching age gate threshold in ${result.daysUntilCutoff} days`,
      memberId
    );
  }

  return true;
};
