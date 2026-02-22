// =============================================================================
// Risk Calculation Service — Task 16
// Computes hereditary risk cards from family conditions using heuristics
// =============================================================================

import { Injectable, inject } from '@angular/core';
import { FamilyService } from './family.service';
import { FamilyMember, HeredityRiskCard } from './family.models';

type RiskLevel = 'high' | 'moderate' | 'low' | 'unknown';
type RiskCountry = 'US' | 'IN' | 'AU' | 'RO';

interface RiskProfile {
  conditionName: string;
  snomedCodes: string[];
  inheritancePattern: string;
  firstDegreeMultiplier: number;  // risk multiplier per first-degree affected relative
  secondDegreeMultiplier: number; // risk multiplier per second-degree affected relative
  baselineRisk: number;           // population baseline percentage
  highThreshold: number;          // percentage threshold for "high"
  moderateThreshold: number;      // percentage threshold for "moderate"
  screeningRecommendation: string;
  countryNotes: Record<RiskCountry, string>;
}

const RISK_PROFILES: RiskProfile[] = [
  {
    conditionName: 'Breast Cancer',
    snomedCodes: ['254837009', '782593004', '782594005'],
    inheritancePattern: 'Autosomal dominant (BRCA1/BRCA2); polygenic risk in others',
    firstDegreeMultiplier: 2.0,
    secondDegreeMultiplier: 1.5,
    baselineRisk: 12,
    highThreshold: 30,
    moderateThreshold: 20,
    screeningRecommendation: 'Annual mammogram + MRI from age 30 (high risk) or 40 (moderate risk). BRCA testing if ≥2 affected first-degree relatives.',
    countryNotes: {
      US: 'USPSTF recommends annual mammography from age 40. BRCA testing covered by most insurers.',
      IN: 'Tata Memorial Centre BRCA testing programme available. Mammography from age 40.',
      AU: 'Cancer Australia guidelines: mammogram every 2 years age 50–74 under BreastScreen; high-risk individuals from age 40.',
      RO: 'National Cancer Control Plan includes mammography screening. BRCA testing available via university hospitals.',
    },
  },
  {
    conditionName: 'Colon Cancer',
    snomedCodes: ['363406005', '716917000', '109355002', '450961000'],
    inheritancePattern: 'Autosomal dominant (Lynch syndrome, FAP); polygenic risk in others',
    firstDegreeMultiplier: 2.5,
    secondDegreeMultiplier: 1.7,
    baselineRisk: 4.5,
    highThreshold: 15,
    moderateThreshold: 8,
    screeningRecommendation: 'Colonoscopy every 5 years from age 40 (moderate risk) or age 25 (high risk/Lynch). MSI testing on tumours.',
    countryNotes: {
      US: 'USPSTF recommends colonoscopy from age 45 for average risk; earlier for Lynch syndrome carriers.',
      IN: 'Consider colonoscopy from age 40 with positive family history. Lynch syndrome genetic counselling at AIIMS.',
      AU: 'National Bowel Cancer Screening Programme: FOBT from age 45. Colonoscopy for high-risk individuals.',
      RO: 'CNAS reimbursed colonoscopy every 5 years from age 50; earlier for high-risk families.',
    },
  },
  {
    conditionName: 'Type 2 Diabetes',
    snomedCodes: ['44054006', '73211009'],
    inheritancePattern: 'Polygenic; strong hereditary component (~40% lifetime risk if both parents affected)',
    firstDegreeMultiplier: 1.8,
    secondDegreeMultiplier: 1.3,
    baselineRisk: 11,
    highThreshold: 30,
    moderateThreshold: 18,
    screeningRecommendation: 'Annual HbA1c from age 35 (or BMI >25 with family history). Lifestyle intervention reduces onset by 58%.',
    countryNotes: {
      US: 'ADA recommends screening from age 35 with risk factors. CDC-recognised lifestyle programmes available.',
      IN: 'ICMR guidelines: screen from age 30 with family history. Metformin prophylaxis for high-risk individuals.',
      AU: 'AUSDRISK tool for risk assessment. Diabetes Australia: fasting glucose or HbA1c every 3 years from age 40.',
      RO: 'Romanian Diabetes Society: fasting glucose annually from age 45, or from 35 with risk factors.',
    },
  },
  {
    conditionName: 'Heart Disease',
    snomedCodes: ['53741008', '414545008', '57054005', '38341003'],
    inheritancePattern: 'Polygenic; familial hypercholesterolaemia (LDLR/PCSK9) autosomal dominant',
    firstDegreeMultiplier: 1.7,
    secondDegreeMultiplier: 1.3,
    baselineRisk: 7,
    highThreshold: 20,
    moderateThreshold: 12,
    screeningRecommendation: 'Lipid panel every 5 years from age 20. Coronary calcium score for intermediate-risk individuals. FH genetic testing.',
    countryNotes: {
      US: 'ACC/AHA guidelines: 10-year ASCVD risk calculator. Statin therapy for high-risk patients.',
      IN: 'India-specific Framingham risk; South Asians have higher baseline. Early statin therapy recommended.',
      AU: 'Heart Foundation: absolute cardiovascular risk assessment. National CVD risk calculator for GPs.',
      RO: 'ESC SCORE2 risk tool recommended. Lipid-lowering therapy reimbursed under CNAS for high-risk patients.',
    },
  },
  {
    conditionName: "Alzheimer's Disease",
    snomedCodes: ['26929004'],
    inheritancePattern: 'APOE ε4 allele (polygenic risk); rare autosomal dominant (APP, PSEN1, PSEN2)',
    firstDegreeMultiplier: 1.5,
    secondDegreeMultiplier: 1.2,
    baselineRisk: 10,
    highThreshold: 25,
    moderateThreshold: 15,
    screeningRecommendation: 'Cognitive assessment from age 65. APOE genotyping in research context. Lifestyle: exercise, cognitive engagement, Mediterranean diet.',
    countryNotes: {
      US: 'Alzheimer\'s Association guidelines. APOE testing available; counselling essential pre-test.',
      IN: 'Dementia India Alliance resources. Scarcity of dementia specialists; GP-led cognitive screening recommended.',
      AU: 'AIHW dementia data: second-leading cause of death. Dementia Australia support. Memory clinics in major cities.',
      RO: 'Romanian Society of Neurology guidelines. Alzheimer\'s specialist centres in Bucharest and Cluj.',
    },
  },
  {
    conditionName: 'Thalassaemia',
    snomedCodes: ['40108008', '234334002'],
    inheritancePattern: 'Autosomal recessive; both parents must be carriers for affected child (25% risk)',
    firstDegreeMultiplier: 3.0,
    secondDegreeMultiplier: 1.5,
    baselineRisk: 1.5,
    highThreshold: 25,
    moderateThreshold: 10,
    screeningRecommendation: 'Partner carrier testing for all confirmed carriers. Preconception genetic counselling. Haemoglobin electrophoresis for at-risk individuals.',
    countryNotes: {
      US: 'Carrier screening offered as part of expanded carrier screening panels. ACMG guidelines.',
      IN: 'Tata Medical Centre Mumbai: largest thalassaemia centre in Asia. National programme under Family Welfare.',
      AU: 'Reproductive Carrier Screening (Mackenzie\'s Mission): free for couples planning pregnancy.',
      RO: 'National Thalassaemia Programme; Fundeni Clinical Institute for bone marrow transplants.',
    },
  },
  {
    conditionName: 'Ovarian Cancer',
    snomedCodes: ['363443007', '782593004', '782594005'],
    inheritancePattern: 'BRCA1/BRCA2 (autosomal dominant); Lynch syndrome; polygenic',
    firstDegreeMultiplier: 2.5,
    secondDegreeMultiplier: 1.6,
    baselineRisk: 1.3,
    highThreshold: 10,
    moderateThreshold: 4,
    screeningRecommendation: 'RRSO (risk-reducing salpingo-oophorectomy) after age 35–40 for BRCA1 carriers. CA-125 + ultrasound surveillance for moderate risk.',
    countryNotes: {
      US: 'SGO guidelines: genetic testing for women with ovarian cancer. BRCA counselling for at-risk families.',
      IN: 'Tata Memorial: BRCA testing for high-risk families. Gynaecological oncology centres in metro cities.',
      AU: 'Familial Cancer Services at major hospitals. Cancer Australia BRCA guidelines.',
      RO: 'National gynaecological cancer programme. Genetic counselling available at university hospitals.',
    },
  },
  {
    conditionName: 'Melanoma',
    snomedCodes: ['372244006'],
    inheritancePattern: 'CDKN2A mutation (autosomal dominant); polygenic risk',
    firstDegreeMultiplier: 2.0,
    secondDegreeMultiplier: 1.4,
    baselineRisk: 2.5,
    highThreshold: 15,
    moderateThreshold: 7,
    screeningRecommendation: 'Annual full-body dermatologist exam for high-risk individuals. Monthly self-examination. Sunscreen SPF 50+ daily.',
    countryNotes: {
      US: 'AAD guidelines: annual skin exam for family history. Dermoscopy for lesion evaluation.',
      IN: 'Lower baseline risk in darker skin types; but mucosal and acral lentiginous melanoma monitoring important.',
      AU: 'Highest melanoma incidence globally. Cancer Council Australia: skin checks every 6–12 months for high risk.',
      RO: 'Skin cancer awareness campaigns. Dermoscopy available in dermatology departments.',
    },
  },
];

// Map relationship to degree (first-degree = parent/sibling/child; second-degree = grandparent/aunt-uncle)
function getDegree(relationship: string): 1 | 2 | null {
  if (['parent', 'sibling', 'child'].includes(relationship)) return 1;
  if (['grandparent', 'aunt-uncle'].includes(relationship)) return 2;
  return null;
}

@Injectable({ providedIn: 'root' })
export class RiskCalculationService {
  private readonly familyService = inject(FamilyService);

  computeRiskCards(country: RiskCountry = 'US'): HeredityRiskCard[] {
    const members = this.familyService.humanMembers();
    return RISK_PROFILES.map(profile => this._computeCard(profile, members, country));
  }

  private _computeCard(
    profile: RiskProfile,
    members: FamilyMember[],
    country: RiskCountry,
  ): HeredityRiskCard {
    const affectedRelatives: string[] = [];
    let riskMultiplier = 1.0;

    // Count affected relatives for this condition
    for (const member of members) {
      if (member.isProband) continue;
      const degree = getDegree(member.relationship);
      if (degree === null) continue;

      const hasCondition = member.conditions.some(
        c =>
          profile.snomedCodes.includes(c.snomedCode ?? '') ||
          c.conditionName.toLowerCase().includes(
            profile.conditionName.toLowerCase().split(' ')[0].toLowerCase()
          )
      );

      if (hasCondition) {
        const name = `${member.firstName} ${member.lastName} (${member.relationship}${member.isDeceased ? ', deceased' : ''})`;
        affectedRelatives.push(name);
        riskMultiplier *= degree === 1 ? profile.firstDegreeMultiplier : profile.secondDegreeMultiplier;
      }
    }

    const estimatedRisk = profile.baselineRisk * riskMultiplier;

    let riskLevel: RiskLevel;
    if (affectedRelatives.length === 0) {
      riskLevel = 'low';
    } else if (estimatedRisk >= profile.highThreshold) {
      riskLevel = 'high';
    } else if (estimatedRisk >= profile.moderateThreshold) {
      riskLevel = 'moderate';
    } else {
      riskLevel = 'low';
    }

    const summary = affectedRelatives.length === 0
      ? `No family history of ${profile.conditionName} identified in the current records.`
      : `${affectedRelatives.length} affected relative${affectedRelatives.length > 1 ? 's' : ''} identified. Estimated lifetime risk approximately ${estimatedRisk.toFixed(0)}% vs ${profile.baselineRisk}% population baseline.`;

    return {
      conditionName: profile.conditionName,
      riskLevel,
      riskPercentage: Math.min(Math.round(estimatedRisk), 99),
      inheritancePattern: profile.inheritancePattern,
      affectedRelatives,
      screeningRecommendation: profile.screeningRecommendation,
      countrySpecificNotes: profile.countryNotes,
      summary,
    };
  }
}
