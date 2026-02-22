/// <reference lib="webworker" />

/**
 * Risk Calculation Web Worker
 * Performs client-side hereditary risk computation off the main thread.
 * Receives family member data and returns risk cards.
 */

interface WorkerFamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  relationship: string;
  isDeceased: boolean;
  deceasedAge?: number;
  conditions: WorkerCondition[];
}

interface WorkerCondition {
  conditionName: string;
  category: string;
  status: string;
  onsetAge?: number;
  contributedToDeath: boolean;
}

interface WorkerRiskCard {
  conditionName: string;
  riskLevel: 'high' | 'moderate' | 'low' | 'unknown';
  riskPercentage: number;
  inheritancePattern: string;
  affectedRelatives: string[];
  screeningRecommendation: string;
  summary: string;
}

interface WorkerRequest {
  type: 'calculate';
  members: WorkerFamilyMember[];
  country: string;
}

interface WorkerResponse {
  type: 'result' | 'progress' | 'error';
  progress?: number;
  riskCards?: WorkerRiskCard[];
  error?: string;
}

// Tracked conditions with baseline population risk and inheritance info
const TRACKED_CONDITIONS: {
  name: string;
  aliases: string[];
  baselineRisk: number;
  inheritancePattern: string;
  screeningByCountry: Record<string, string>;
}[] = [
  {
    name: 'Breast Cancer',
    aliases: ['breast cancer', 'breast carcinoma', 'brca'],
    baselineRisk: 0.125,
    inheritancePattern: 'Autosomal dominant with variable penetrance (BRCA1/BRCA2)',
    screeningByCountry: {
      US: 'USPSTF: Mammography every 2 years ages 50-74; earlier if high risk. Genetic counseling if family history.',
      IN: 'ICMR: Clinical breast exam annually from age 30; mammography for high-risk per Tata Memorial guidelines.',
      AU: 'Cancer Australia: BreastScreen every 2 years ages 50-74; risk assessment via iPrevent tool.',
      RO: 'National screening programme: mammography every 2 years ages 50-69.'
    }
  },
  {
    name: 'Colon Cancer',
    aliases: ['colon cancer', 'colorectal cancer', 'bowel cancer'],
    baselineRisk: 0.045,
    inheritancePattern: 'Autosomal dominant (Lynch syndrome — MLH1, MSH2, MSH6, PMS2) or sporadic',
    screeningByCountry: {
      US: 'USPSTF: Colonoscopy starting age 45, every 10 years; or FIT annually.',
      IN: 'ICMR: Colonoscopy recommended from age 40 with family history.',
      AU: 'National Bowel Cancer Screening: FIT every 2 years ages 50-74.',
      RO: 'National programme: FIT from age 50.'
    }
  },
  {
    name: 'Type 2 Diabetes',
    aliases: ['type 2 diabetes', 'type ii diabetes', 'diabetes mellitus type 2', 't2dm'],
    baselineRisk: 0.10,
    inheritancePattern: 'Polygenic — multiple genes with strong environmental interaction',
    screeningByCountry: {
      US: 'ADA: Fasting glucose or HbA1c every 3 years from age 35; earlier if BMI >= 25.',
      IN: 'ICMR: Annual fasting glucose from age 30 (high prevalence population).',
      AU: 'RACGP: AUSDRISK every 3 years from age 40.',
      RO: 'Glycaemia screening from age 45 via family physician.'
    }
  },
  {
    name: 'Heart Disease',
    aliases: ['coronary artery disease', 'heart disease', 'cad', 'ischemic heart disease', 'cardiovascular disease'],
    baselineRisk: 0.065,
    inheritancePattern: 'Polygenic — familial hypercholesterolemia (LDLR, APOB, PCSK9) or multifactorial',
    screeningByCountry: {
      US: 'ACC/AHA: Cardiovascular risk assessment from age 20; lipid panel every 4-6 years.',
      IN: 'ICMR-INDIAB: Lipid profile and BP screening from age 30.',
      AU: 'RACGP: Absolute CVD risk assessment every 2 years from age 45 (35 for Aboriginal/Torres Strait Islander).',
      RO: 'SCORE risk assessment from age 40 per ESC guidelines.'
    }
  },
  {
    name: 'Alzheimer\'s Disease',
    aliases: ['alzheimer', 'alzheimers', 'alzheimer\'s disease', 'dementia'],
    baselineRisk: 0.10,
    inheritancePattern: 'Complex — early-onset autosomal dominant (APP, PSEN1, PSEN2); late-onset polygenic (APOE e4)',
    screeningByCountry: {
      US: 'No routine screening; cognitive assessment if symptomatic. Genetic testing for early-onset families.',
      IN: 'NIMHANS guidelines: cognitive screening for at-risk individuals from age 60.',
      AU: 'Cognitive screening as part of 75+ Health Assessment.',
      RO: 'Cognitive assessment via family physician for at-risk patients.'
    }
  },
  {
    name: 'Thalassemia',
    aliases: ['thalassemia', 'thalassaemia', 'beta-thalassemia', 'alpha-thalassemia'],
    baselineRisk: 0.05,
    inheritancePattern: 'Autosomal recessive (HBB for beta; HBA1/HBA2 for alpha)',
    screeningByCountry: {
      US: 'CDC: Carrier screening recommended for individuals of Mediterranean, South Asian, Southeast Asian, African descent.',
      IN: 'National Thalassemia Prevention Programme: mandatory premarital screening in endemic states.',
      AU: 'RANZCOG: Carrier screening offered preconception or early pregnancy.',
      RO: 'Carrier screening recommended in regions with higher prevalence.'
    }
  },
  {
    name: 'Ovarian Cancer',
    aliases: ['ovarian cancer', 'ovarian carcinoma'],
    baselineRisk: 0.012,
    inheritancePattern: 'Autosomal dominant with reduced penetrance (BRCA1/BRCA2, RAD51C, BRIP1)',
    screeningByCountry: {
      US: 'NCCN: Risk-reducing salpingo-oophorectomy for BRCA carriers; no routine screening for average risk.',
      IN: 'BRCA testing via Tata Memorial or AIIMS for high-risk families.',
      AU: 'Cancer Australia: Genetic testing for BRCA if family history; no routine screening.',
      RO: 'Genetic counseling for families with multiple cases.'
    }
  },
  {
    name: 'Melanoma',
    aliases: ['melanoma', 'malignant melanoma', 'skin cancer melanoma'],
    baselineRisk: 0.025,
    inheritancePattern: 'Autosomal dominant with reduced penetrance (CDKN2A, CDK4); strong UV interaction',
    screeningByCountry: {
      US: 'AAD: Annual full-body skin exam; self-exam monthly for high-risk individuals.',
      IN: 'Low incidence; dermatology referral for suspicious lesions.',
      AU: 'Cancer Council: Annual skin checks (highest incidence globally); SunSmart program.',
      RO: 'Euromelanoma campaign: annual skin checks for at-risk individuals.'
    }
  }
];

function isFirstDegree(relationship: string): boolean {
  return ['parent', 'sibling', 'child'].includes(relationship);
}

function isSecondDegree(relationship: string): boolean {
  return ['grandparent', 'aunt-uncle', 'niece-nephew', 'half'].includes(relationship);
}

function calculateRiskForCondition(
  condition: typeof TRACKED_CONDITIONS[0],
  members: WorkerFamilyMember[],
  country: string
): WorkerRiskCard {
  const affectedMembers: string[] = [];
  let firstDegreeCount = 0;
  let secondDegreeCount = 0;
  let earlyOnset = false;
  let carrierCount = 0;

  for (const member of members) {
    for (const cond of member.conditions) {
      const nameMatch = condition.aliases.some(alias =>
        cond.conditionName.toLowerCase().includes(alias)
      );
      if (!nameMatch) continue;

      const displayName = `${member.firstName} ${member.lastName} (${member.relationship})`;

      if (cond.status === 'affected') {
        affectedMembers.push(displayName);
        if (isFirstDegree(member.relationship)) firstDegreeCount++;
        else if (isSecondDegree(member.relationship)) secondDegreeCount++;
        if (cond.onsetAge && cond.onsetAge < 50) earlyOnset = true;
      } else if (cond.status === 'carrier') {
        carrierCount++;
        affectedMembers.push(`${displayName} [carrier]`);
      }
    }
  }

  // Heuristic risk calculation
  let riskMultiplier = 1.0;
  riskMultiplier += firstDegreeCount * 2.0;
  riskMultiplier += secondDegreeCount * 0.5;
  if (earlyOnset) riskMultiplier *= 1.5;
  if (carrierCount > 0) riskMultiplier *= 1.3;

  const calculatedRisk = Math.min(condition.baselineRisk * riskMultiplier, 0.95);
  const riskPercentage = Math.round(calculatedRisk * 100);

  let riskLevel: 'high' | 'moderate' | 'low' | 'unknown';
  if (affectedMembers.length === 0) {
    riskLevel = 'unknown';
  } else if (riskPercentage >= 30 || firstDegreeCount >= 2) {
    riskLevel = 'high';
  } else if (riskPercentage >= 15 || firstDegreeCount >= 1) {
    riskLevel = 'moderate';
  } else {
    riskLevel = 'low';
  }

  const screening = condition.screeningByCountry[country] || condition.screeningByCountry['US'];

  let summary: string;
  if (affectedMembers.length === 0) {
    summary = `No known family history of ${condition.name}. Population baseline risk applies.`;
  } else {
    summary = `${affectedMembers.length} family member(s) affected. ` +
      (firstDegreeCount > 0 ? `${firstDegreeCount} first-degree relative(s). ` : '') +
      (earlyOnset ? 'Early onset detected in family. ' : '') +
      `Estimated risk: ~${riskPercentage}% (population baseline: ${Math.round(condition.baselineRisk * 100)}%).`;
  }

  return {
    conditionName: condition.name,
    riskLevel,
    riskPercentage: affectedMembers.length === 0 ? Math.round(condition.baselineRisk * 100) : riskPercentage,
    inheritancePattern: condition.inheritancePattern,
    affectedRelatives: affectedMembers,
    screeningRecommendation: screening,
    summary
  };
}

addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const { type, members, country } = event.data;

  if (type !== 'calculate') {
    postMessage({ type: 'error', error: `Unknown request type: ${type}` } as WorkerResponse);
    return;
  }

  try {
    const riskCards: WorkerRiskCard[] = [];
    const total = TRACKED_CONDITIONS.length;

    for (let i = 0; i < total; i++) {
      // Report progress
      postMessage({
        type: 'progress',
        progress: Math.round(((i + 1) / total) * 100)
      } as WorkerResponse);

      const card = calculateRiskForCondition(TRACKED_CONDITIONS[i], members, country);
      riskCards.push(card);
    }

    // Sort: high risk first, then moderate, then low, then unknown
    const order: Record<string, number> = { high: 0, moderate: 1, low: 2, unknown: 3 };
    riskCards.sort((a, b) => order[a.riskLevel] - order[b.riskLevel]);

    postMessage({ type: 'result', riskCards } as WorkerResponse);
  } catch (err) {
    postMessage({ type: 'error', error: String(err) } as WorkerResponse);
  }
});
