import { AccessLevel, RecordCategory } from '../data-access/family.models';
import { SupportedCountry } from '../data-access/ruleset.models';

export interface AgeGateResult {
  accessLevel: AccessLevel;
  cutoffAge: number;
  daysUntilCutoff: number;
  hiddenCategories: RecordCategory[];
  message: string;
}

interface CountryAgeRule {
  fullAccessUntil: number;
  partialAccessUntil?: number;
  hiddenAtPartial: RecordCategory[];
  hiddenAtFull: RecordCategory[];
}

const COUNTRY_RULES: Record<SupportedCountry, CountryAgeRule> = {
  IN: {
    fullAccessUntil: 18,
    hiddenAtPartial: [],
    hiddenAtFull: []
  },
  RO: {
    fullAccessUntil: 14,
    partialAccessUntil: 16,
    hiddenAtPartial: ['mental-health', 'reproductive', 'sti'],
    hiddenAtFull: []
  },
  AU: {
    fullAccessUntil: 14,
    hiddenAtPartial: [],
    hiddenAtFull: []
  },
  US: {
    fullAccessUntil: 13,
    partialAccessUntil: 16,
    hiddenAtPartial: ['mental-health', 'reproductive', 'sti', 'genetic'],
    hiddenAtFull: []
  }
};

const US_STATE_OVERRIDES: Record<string, Partial<CountryAgeRule>> = {
  CA: { fullAccessUntil: 12, partialAccessUntil: 15 },
  NY: { fullAccessUntil: 13, partialAccessUntil: 16 },
  TX: { fullAccessUntil: 14, partialAccessUntil: 17 },
  FL: { fullAccessUntil: 13, partialAccessUntil: 16 },
  IL: { fullAccessUntil: 12, partialAccessUntil: 16 },
  PA: { fullAccessUntil: 14, partialAccessUntil: 16 },
  OH: { fullAccessUntil: 14, partialAccessUntil: 16 },
  GA: { fullAccessUntil: 13, partialAccessUntil: 16 },
  NC: { fullAccessUntil: 13, partialAccessUntil: 16 },
  WA: { fullAccessUntil: 13, partialAccessUntil: 15 }
};

function calculateAge(dob: Date): number {
  const today = new Date(2026, 1, 22);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function daysUntilAge(dob: Date, targetAge: number): number {
  const today = new Date(2026, 1, 22);
  const birthday = new Date(dob.getFullYear() + targetAge, dob.getMonth(), dob.getDate());
  const diffMs = birthday.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function calculateAgeGateRules(
  dob: Date,
  country: SupportedCountry,
  state?: string
): AgeGateResult {
  const age = calculateAge(dob);
  let rules = { ...COUNTRY_RULES[country] };

  // Apply US state overrides
  if (country === 'US' && state && US_STATE_OVERRIDES[state]) {
    rules = { ...rules, ...US_STATE_OVERRIDES[state] };
  }

  const { fullAccessUntil, partialAccessUntil, hiddenAtPartial } = rules;

  // Under full access age: parent has full access
  if (age < fullAccessUntil) {
    const daysLeft = daysUntilAge(dob, fullAccessUntil);
    return {
      accessLevel: 'full',
      cutoffAge: fullAccessUntil,
      daysUntilCutoff: daysLeft,
      hiddenCategories: [],
      message: daysLeft <= 90
        ? `Full access changes in ${daysLeft} days when child turns ${fullAccessUntil}`
        : ''
    };
  }

  // Between full and partial cutoff: partial access
  if (partialAccessUntil && age < partialAccessUntil) {
    const daysLeft = daysUntilAge(dob, partialAccessUntil);
    return {
      accessLevel: 'partial',
      cutoffAge: partialAccessUntil,
      daysUntilCutoff: daysLeft,
      hiddenCategories: hiddenAtPartial,
      message: `Partial access — some categories restricted. Access changes in ${daysLeft} days when child turns ${partialAccessUntil}`
    };
  }

  // Past all cutoffs: no parental access
  return {
    accessLevel: 'none',
    cutoffAge: partialAccessUntil || fullAccessUntil,
    daysUntilCutoff: 0,
    hiddenCategories: [
      'appointments', 'medications', 'lab-results', 'immunizations',
      'allergies', 'mental-health', 'reproductive', 'sti', 'genetic', 'billing'
    ],
    message: `Child has reached age of consent (${partialAccessUntil || fullAccessUntil}). Parental access has been revoked.`
  };
}
