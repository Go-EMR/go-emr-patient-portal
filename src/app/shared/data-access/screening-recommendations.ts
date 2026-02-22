// =============================================================================
// Preventive Screening Recommendations - USPSTF / USCDI v5 Aligned
// =============================================================================

export interface ScreeningRecommendation {
  /** Stable unique identifier for this recommendation type */
  id: string;
  /** Display name of the screening */
  name: string;
  /** Clinical description of what is tested and why */
  description: string;
  /** Inclusive age range for which this screening applies */
  ageRange: { min: number; max: number };
  /** Biological sex applicability */
  sex: 'all' | 'male' | 'female';
  /** How often the screening should be performed */
  frequency: string;
  /** Date the screening was most recently completed, if known */
  lastCompleted?: Date;
  /** Calculated or estimated date the next screening is due */
  nextDue?: Date;
  /** Current compliance status relative to today */
  status: 'up_to_date' | 'due_soon' | 'overdue' | 'not_applicable';
  /** Clinical urgency level */
  priority: 'routine' | 'important' | 'urgent';
  /** Broad clinical category for grouping in the UI */
  category: string;
}

// =============================================================================
// Mock data anchored to: patient male, age 44, today = 2026-02-21
//
// Status distribution across applicable screenings:
//   up_to_date : Blood Pressure, Dental, Eye Exam, Skin Cancer
//   due_soon   : Cholesterol, Diabetes (HbA1c)
//   overdue    : Colorectal Cancer
//   not_applicable: Mammography, Cervical Cancer, Bone Density,
//                   Prostate (age 44 is in the "discuss" window but
//                   not universally recommended before 50 by USPSTF),
//                   Lung Cancer (starts at 50 per updated USPSTF)
// =============================================================================

export const SCREENING_RECOMMENDATIONS: ScreeningRecommendation[] = [
  // -------------------------------------------------------------------------
  // Cardiovascular
  // -------------------------------------------------------------------------
  {
    id: 'screening-blood-pressure',
    name: 'Blood Pressure Screening',
    description:
      'Measures systolic and diastolic arterial pressure to detect hypertension. '
      + 'Adults with no prior hypertension diagnosis should be screened at least every 1–3 years. '
      + 'Hypertension is the leading modifiable risk factor for cardiovascular disease and stroke.',
    ageRange: { min: 18, max: 120 },
    sex: 'all',
    frequency: 'Every 1–3 years (annually if elevated)',
    lastCompleted: new Date('2025-09-10'),
    nextDue: new Date('2026-09-10'),
    status: 'up_to_date',
    priority: 'important',
    category: 'Cardiovascular',
  },
  {
    id: 'screening-cholesterol',
    name: 'Cholesterol Screening / Lipid Panel',
    description:
      'Fasting or non-fasting lipid panel measuring total cholesterol, LDL, HDL, and triglycerides. '
      + 'Used to assess 10-year cardiovascular disease risk via the Pooled Cohort Equations. '
      + 'Recommended for adults aged 35+ and younger adults with risk factors.',
    ageRange: { min: 35, max: 120 },
    sex: 'all',
    frequency: 'Every 5 years (more frequently if abnormal)',
    lastCompleted: new Date('2023-11-04'),
    nextDue: new Date('2026-04-15'),
    status: 'due_soon',
    priority: 'important',
    category: 'Cardiovascular',
  },

  // -------------------------------------------------------------------------
  // Metabolic
  // -------------------------------------------------------------------------
  {
    id: 'screening-diabetes-hba1c',
    name: 'Diabetes Screening (HbA1c)',
    description:
      'Hemoglobin A1c blood test reflecting average blood glucose over the preceding 2–3 months. '
      + 'Screens for prediabetes (5.7–6.4 %) and type 2 diabetes (≥6.5 %). '
      + 'USPSTF recommends screening all adults aged 35–70 who are overweight or obese.',
    ageRange: { min: 35, max: 70 },
    sex: 'all',
    frequency: 'Every 1–3 years',
    lastCompleted: new Date('2024-03-20'),
    nextDue: new Date('2026-03-20'),
    status: 'due_soon',
    priority: 'important',
    category: 'Metabolic',
  },

  // -------------------------------------------------------------------------
  // Cancer Screening
  // -------------------------------------------------------------------------
  {
    id: 'screening-colorectal-cancer',
    name: 'Colorectal Cancer Screening',
    description:
      'Screens for colorectal cancer and precancerous polyps. Options include annual high-sensitivity '
      + 'fecal immunochemical test (FIT), stool DNA test every 1–3 years, or colonoscopy every 10 years. '
      + 'USPSTF recommends starting at age 45 for average-risk adults.',
    ageRange: { min: 45, max: 75 },
    sex: 'all',
    frequency: 'Annually (FIT) or every 10 years (colonoscopy)',
    lastCompleted: undefined,
    nextDue: new Date('2025-02-21'),
    status: 'overdue',
    priority: 'urgent',
    category: 'Cancer Screening',
  },
  {
    id: 'screening-mammography',
    name: 'Mammography',
    description:
      'Bilateral X-ray screening of breast tissue for early detection of breast cancer. '
      + 'USPSTF recommends biennial screening for women aged 40–74. '
      + 'Women with dense breast tissue or family history may benefit from earlier or more frequent screening.',
    ageRange: { min: 40, max: 74 },
    sex: 'female',
    frequency: 'Every 2 years',
    lastCompleted: undefined,
    nextDue: undefined,
    status: 'not_applicable',
    priority: 'routine',
    category: 'Cancer Screening',
  },
  {
    id: 'screening-cervical-cancer',
    name: 'Cervical Cancer Screening',
    description:
      'Pap smear (cytology) and/or high-risk HPV co-testing to detect cervical dysplasia and cervical cancer. '
      + 'USPSTF recommends Pap smear every 3 years (ages 21–65) or Pap + HPV co-test every 5 years (ages 30–65).',
    ageRange: { min: 21, max: 65 },
    sex: 'female',
    frequency: 'Every 3 years (Pap) or every 5 years (co-test)',
    lastCompleted: undefined,
    nextDue: undefined,
    status: 'not_applicable',
    priority: 'routine',
    category: 'Cancer Screening',
  },
  {
    id: 'screening-prostate-cancer',
    name: 'Prostate Cancer Screening (PSA)',
    description:
      'Prostate-specific antigen (PSA) blood test to detect prostate cancer. '
      + 'USPSTF recommends individualized decision-making for men aged 55–69; '
      + 'screening is not recommended after age 70. Men under 55 are not routinely screened.',
    ageRange: { min: 55, max: 69 },
    sex: 'male',
    frequency: 'Every 1–2 years (after shared decision-making)',
    lastCompleted: undefined,
    nextDue: undefined,
    status: 'not_applicable',
    priority: 'routine',
    category: 'Cancer Screening',
  },
  {
    id: 'screening-skin-cancer',
    name: 'Skin Cancer Screening',
    description:
      'Clinical full-body skin examination to detect melanoma, basal cell carcinoma, and squamous cell carcinoma. '
      + 'Recommended for adults with significant sun exposure history, fair skin, or family history of melanoma. '
      + 'Self-examination should be performed monthly.',
    ageRange: { min: 18, max: 120 },
    sex: 'all',
    frequency: 'Annually',
    lastCompleted: new Date('2025-06-15'),
    nextDue: new Date('2026-06-15'),
    status: 'up_to_date',
    priority: 'routine',
    category: 'Cancer Screening',
  },
  {
    id: 'screening-lung-cancer',
    name: 'Lung Cancer Screening (Low-Dose CT)',
    description:
      'Annual low-dose computed tomography (LDCT) scan of the chest to detect early-stage lung cancer. '
      + 'USPSTF recommends annual LDCT for adults aged 50–80 with a 20 pack-year smoking history '
      + 'who currently smoke or quit within the past 15 years.',
    ageRange: { min: 50, max: 80 },
    sex: 'all',
    frequency: 'Annually',
    lastCompleted: undefined,
    nextDue: undefined,
    status: 'not_applicable',
    priority: 'routine',
    category: 'Cancer Screening',
  },

  // -------------------------------------------------------------------------
  // Bone Health
  // -------------------------------------------------------------------------
  {
    id: 'screening-bone-density',
    name: 'Bone Density Scan (DEXA)',
    description:
      'Dual-energy X-ray absorptiometry (DEXA) scan measuring bone mineral density at the hip and lumbar spine. '
      + 'Used to diagnose osteoporosis and assess fracture risk. '
      + 'USPSTF recommends screening for women aged 65+ and younger postmenopausal women with risk factors.',
    ageRange: { min: 65, max: 120 },
    sex: 'female',
    frequency: 'Every 2 years',
    lastCompleted: undefined,
    nextDue: undefined,
    status: 'not_applicable',
    priority: 'routine',
    category: 'Bone Health',
  },

  // -------------------------------------------------------------------------
  // Sensory / Preventive
  // -------------------------------------------------------------------------
  {
    id: 'screening-eye-exam',
    name: 'Comprehensive Eye Exam',
    description:
      'Dilated fundus examination and visual acuity testing to screen for glaucoma, diabetic retinopathy, '
      + 'age-related macular degeneration, and refractive errors. '
      + 'Adults aged 40–64 should be screened every 2–4 years; annually for diabetic patients.',
    ageRange: { min: 18, max: 120 },
    sex: 'all',
    frequency: 'Every 2 years',
    lastCompleted: new Date('2025-01-22'),
    nextDue: new Date('2027-01-22'),
    status: 'up_to_date',
    priority: 'routine',
    category: 'Sensory Health',
  },
  {
    id: 'screening-dental-exam',
    name: 'Dental Exam & Cleaning',
    description:
      'Routine oral examination and professional prophylaxis (cleaning) to detect dental caries, '
      + 'periodontal disease, and oral cancers. '
      + 'The American Dental Association recommends at least one exam and cleaning per year; '
      + 'twice yearly for patients at elevated caries or periodontal risk.',
    ageRange: { min: 0, max: 120 },
    sex: 'all',
    frequency: 'Every 6 months',
    lastCompleted: new Date('2025-11-30'),
    nextDue: new Date('2026-05-30'),
    status: 'up_to_date',
    priority: 'routine',
    category: 'Oral Health',
  },
];

// =============================================================================
// Utility: filter recommendations applicable to a specific patient
// =============================================================================

/**
 * Returns the subset of {@link SCREENING_RECOMMENDATIONS} that apply to a
 * patient of the given age and biological sex.
 *
 * A recommendation is included when:
 * - The patient's age falls within the recommendation's inclusive age range, AND
 * - The recommendation's sex is `'all'`, or matches the patient's sex exactly.
 *
 * Recommendations outside the applicable criteria retain their original data
 * but are intentionally excluded from the returned array rather than being
 * marked `not_applicable` — callers should use the full
 * {@link SCREENING_RECOMMENDATIONS} array when they need to display all items.
 *
 * @param age - Patient's current age in whole years
 * @param sex - Patient's biological sex
 * @returns Array of screening recommendations applicable to this patient
 */
export function getPatientScreenings(
  age: number,
  sex: 'male' | 'female',
): ScreeningRecommendation[] {
  return SCREENING_RECOMMENDATIONS.filter((rec) => {
    const inAgeRange = age >= rec.ageRange.min && age <= rec.ageRange.max;
    const sexMatch = rec.sex === 'all' || rec.sex === sex;
    return inAgeRange && sexMatch;
  });
}
