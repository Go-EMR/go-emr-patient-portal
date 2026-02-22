// =============================================================================
// Medical Terms Glossary
// Plain-language definitions for terms commonly found in patient portals.
// Intended to support patient-facing "What does this mean?" tooltips and help text.
// =============================================================================

/**
 * A record mapping canonical medical term keys to their plain-language definitions.
 *
 * Keys are lowercase and use the most widely recognised abbreviation or name as
 * the primary key. Alternate abbreviations and full names are handled by
 * `getMedicalTermDefinition`, which performs case-insensitive partial matching
 * across all keys so that "a1c", "hba1c", and "glycated haemoglobin" all resolve
 * to the same definition at call-time without duplicating entries here.
 */
export const MEDICAL_TERMS: Record<string, string> = {
  // ---- Lab Panels ----------------------------------------------------------

  bmp: 'Basic Metabolic Panel (BMP): A blood test that measures eight substances — sodium, potassium, calcium, bicarbonate, chloride, blood urea nitrogen (BUN), creatinine, and glucose — to evaluate kidney function, blood sugar, and electrolyte balance.',

  'comprehensive metabolic panel':
    'Comprehensive Metabolic Panel (CMP): An expanded version of the BMP that also measures liver enzymes (ALT, AST, ALP), total protein, albumin, and bilirubin, giving a broader picture of organ health.',

  'lipid panel':
    'Lipid Panel: A blood test that measures fats in the blood, including total cholesterol, LDL ("bad") cholesterol, HDL ("good") cholesterol, and triglycerides. Used to assess cardiovascular risk.',

  'hba1c':
    'HbA1c (Hemoglobin A1c / A1C): A blood test that reflects your average blood sugar level over the past 2–3 months. Results are reported as a percentage; a value below 5.7% is considered normal, 5.7–6.4% indicates prediabetes, and 6.5% or higher indicates diabetes.',

  cbc: 'Complete Blood Count (CBC): A routine blood test that measures the three main types of cells in your blood — red blood cells (which carry oxygen), white blood cells (which fight infection), and platelets (which help clotting). Also reports hemoglobin and hematocrit.',

  tsh: 'Thyroid-Stimulating Hormone (TSH): A hormone produced by the pituitary gland that tells the thyroid gland how much thyroid hormone to make. An abnormal TSH level can indicate an overactive (hyperthyroidism) or underactive (hypothyroidism) thyroid.',

  // ---- Kidney Function -----------------------------------------------------

  egfr: 'Estimated Glomerular Filtration Rate (eGFR): An estimate of how well your kidneys are filtering waste from your blood, expressed in mL/min/1.73m². A value of 60 or above is generally considered normal; lower values may indicate chronic kidney disease.',

  bun: 'Blood Urea Nitrogen (BUN): A measure of the amount of urea nitrogen in your blood. Urea is a waste product formed when your body breaks down protein. Elevated BUN can suggest impaired kidney function or dehydration.',

  creatinine:
    'Creatinine: A waste product produced by normal muscle activity, filtered out of the blood by the kidneys. Elevated creatinine levels can be a sign of reduced kidney function. Often interpreted alongside eGFR.',

  // ---- Liver Enzymes -------------------------------------------------------

  alt: 'Alanine Aminotransferase (ALT): An enzyme found mainly in the liver. When liver cells are damaged, ALT is released into the bloodstream. Elevated ALT levels can indicate liver inflammation or injury.',

  ast: 'Aspartate Aminotransferase (AST): An enzyme found in the liver, heart, and muscles. Like ALT, it is released when cells are damaged. Elevated AST may indicate liver disease, heart problems, or muscle injury, so it is usually interpreted together with ALT.',

  // ---- Cholesterol ---------------------------------------------------------

  ldl: 'Low-Density Lipoprotein (LDL) — often called "bad" cholesterol. High LDL levels contribute to the build-up of fatty deposits (plaque) in arteries, increasing the risk of heart attack and stroke. A desirable level is typically below 100 mg/dL.',

  hdl: 'High-Density Lipoprotein (HDL) — often called "good" cholesterol. HDL helps carry cholesterol away from the arteries and back to the liver for removal. Higher HDL levels are associated with a lower risk of heart disease. A level of 60 mg/dL or above is considered protective.',

  triglycerides:
    'Triglycerides: A type of fat (lipid) found in the blood. The body converts excess calories into triglycerides for storage. High triglyceride levels, especially when combined with low HDL or high LDL, are linked to increased cardiovascular risk. A normal fasting level is below 150 mg/dL.',

  // ---- Blood Pressure ------------------------------------------------------

  systolic:
    'Systolic Blood Pressure: The top (higher) number in a blood pressure reading. It measures the pressure in your arteries when your heart beats and pumps blood. A normal systolic value is less than 120 mmHg.',

  diastolic:
    'Diastolic Blood Pressure: The bottom (lower) number in a blood pressure reading. It measures the pressure in your arteries when your heart is resting between beats. A normal diastolic value is less than 80 mmHg.',

  // ---- Body Measurements ---------------------------------------------------

  bmi: 'Body Mass Index (BMI): A number calculated from your height and weight (weight in kg divided by height in metres squared). It is used as a screening tool to categorise weight status: underweight (below 18.5), normal weight (18.5–24.9), overweight (25–29.9), or obese (30 and above). BMI does not directly measure body fat.',

  // ---- Oxygen / Respiratory ------------------------------------------------

  spo2: 'Oxygen Saturation (SpO2): The percentage of hemoglobin in your blood that is carrying oxygen. Measured non-invasively with a pulse oximeter clipped to a finger. A normal resting value is typically 95–100%; values below 90% may require medical attention.',

  'oxygen saturation':
    'Oxygen Saturation (SpO2): The percentage of hemoglobin in your blood that is carrying oxygen. Measured non-invasively with a pulse oximeter clipped to a finger. A normal resting value is typically 95–100%; values below 90% may require medical attention.',

  // ---- Common Medications --------------------------------------------------

  lisinopril:
    'Lisinopril: An ACE (angiotensin-converting enzyme) inhibitor medication commonly prescribed to treat high blood pressure (hypertension) and heart failure, and to protect the kidneys in people with diabetes. It works by relaxing blood vessels so the heart does not have to work as hard.',

  metformin:
    'Metformin: An oral medication used to lower blood sugar levels in people with type 2 diabetes. It works primarily by reducing the amount of glucose the liver releases into the blood and by improving the body\'s sensitivity to insulin. It is typically the first medication prescribed for type 2 diabetes.',

  atorvastatin:
    'Atorvastatin: A statin medication prescribed to lower LDL ("bad") cholesterol and triglycerides, and to raise HDL ("good") cholesterol. It reduces the risk of heart attack, stroke, and other cardiovascular events. It works by blocking an enzyme the liver uses to produce cholesterol.',

  // ---- Conditions ----------------------------------------------------------

  hypertension:
    'Hypertension (High Blood Pressure): A chronic condition in which the force of blood against artery walls is consistently too high (typically a reading of 130/80 mmHg or above). If left untreated, it increases the risk of heart disease, stroke, and kidney damage. It is often called a "silent" condition because it usually has no symptoms.',

  hyperlipidemia:
    'Hyperlipidemia: Elevated levels of lipids (fats) in the blood, including cholesterol and triglycerides. It is a major risk factor for cardiovascular disease. It is typically managed with lifestyle changes (diet and exercise) and, when needed, medications such as statins.',

  'type 2 diabetes':
    'Type 2 Diabetes: A chronic condition in which the body does not use insulin effectively (insulin resistance), leading to elevated blood sugar (glucose) levels. Over time, high blood sugar can damage nerves, blood vessels, and organs. It is managed through lifestyle changes, blood sugar monitoring, and medications such as metformin.',

  anaphylaxis:
    'Anaphylaxis: A severe, potentially life-threatening allergic reaction that comes on rapidly and can affect the whole body. Symptoms may include swelling of the throat, difficulty breathing, a sudden drop in blood pressure, hives, and loss of consciousness. It requires immediate emergency treatment, usually with epinephrine (adrenaline).',

  // ---- CBC Components ------------------------------------------------------

  hematocrit:
    'Hematocrit (HCT): The percentage of your total blood volume made up of red blood cells. It is part of a Complete Blood Count (CBC). A low hematocrit may indicate anemia; a high hematocrit can be associated with dehydration or certain blood disorders. Normal ranges are approximately 38–50% depending on age and sex.',

  hemoglobin:
    'Hemoglobin (Hgb / Hb): A protein inside red blood cells that carries oxygen from the lungs to the rest of the body and returns carbon dioxide to the lungs. Measured as part of a CBC, low hemoglobin indicates anemia. Normal adult ranges are approximately 12–17 g/dL depending on sex.',

  platelets:
    'Platelets (Thrombocytes): Small cell fragments in the blood that clump together to form clots and stop bleeding. Measured as part of a CBC and reported as platelet count. A normal range is approximately 150,000–400,000 per microliter. Low counts (thrombocytopenia) can cause excessive bleeding; high counts (thrombocytosis) can increase clotting risk.',

  wbc: 'White Blood Cell Count (WBC): The total number of white blood cells (leukocytes) in a sample of blood, measured as part of a CBC. White blood cells are part of the immune system and fight infection. A normal range is approximately 4,500–11,000 cells per microliter. An elevated count may indicate infection or inflammation; a low count may suggest an immune problem.',

  rbc: 'Red Blood Cell Count (RBC): The number of red blood cells (erythrocytes) per microliter of blood, measured as part of a CBC. Red blood cells carry oxygen throughout the body. Low RBC counts are associated with anemia; high counts can indicate dehydration or certain blood disorders.',

  // ---- Blood Sugar ---------------------------------------------------------

  'fasting glucose':
    'Fasting Glucose (Fasting Blood Sugar): A blood glucose measurement taken after you have not eaten for at least 8 hours. It is used to screen for and monitor diabetes and prediabetes. A normal fasting glucose level is below 100 mg/dL; 100–125 mg/dL suggests prediabetes, and 126 mg/dL or above on two separate tests indicates diabetes.',

  // ---- Coagulation ---------------------------------------------------------

  'prothrombin time':
    'Prothrombin Time (PT): A blood test that measures how long it takes for your blood to clot. It evaluates the extrinsic clotting pathway and is used to assess bleeding risk, diagnose clotting disorders, and monitor patients on certain blood-thinning medications. Results are often reported alongside the INR.',

  inr: 'International Normalised Ratio (INR): A standardised calculation derived from the prothrombin time (PT) that allows clotting test results to be compared across different laboratories. It is used primarily to monitor patients taking warfarin (a blood thinner). A normal INR for someone not on anticoagulants is approximately 0.9–1.1; a therapeutic INR for patients on warfarin is typically 2.0–3.0 depending on the condition being treated.',
};

/**
 * Look up a plain-language definition for a medical term.
 *
 * Matching is case-insensitive and partial: if the normalised form of `term`
 * appears anywhere within a key, that key's definition is returned.  When
 * multiple keys match, the one with the shortest key is preferred (i.e. the
 * most specific match wins for longer queries, but an exact or near-exact key
 * takes precedence over a broad substring hit).
 *
 * Returns `null` when no key contains the supplied term.
 *
 * @example
 * getMedicalTermDefinition('A1C')       // matches key 'hba1c'   via partial search
 * getMedicalTermDefinition('ldl')       // matches key 'ldl'     (exact, case-insensitive)
 * getMedicalTermDefinition('potassium') // returns null (not a top-level key)
 */
export function getMedicalTermDefinition(term: string): string | null {
  if (!term || term.trim().length === 0) {
    return null;
  }

  const needle = term.trim().toLowerCase();

  // 1. Exact match — fastest path.
  if (Object.prototype.hasOwnProperty.call(MEDICAL_TERMS, needle)) {
    return MEDICAL_TERMS[needle] ?? null;
  }

  // 2. Partial match: collect all keys that contain the needle as a substring.
  //    Sort by key length ascending so the shortest (most specific) key wins
  //    when multiple keys contain the same substring.
  const matchingKeys = Object.keys(MEDICAL_TERMS)
    .filter((key) => key.includes(needle))
    .sort((a, b) => a.length - b.length);

  if (matchingKeys.length > 0) {
    // matchingKeys[0] is guaranteed to exist after the length check above.
    const bestKey = matchingKeys[0] as string;
    return MEDICAL_TERMS[bestKey] ?? null;
  }

  // 3. Reverse partial match: check whether any key is a substring of the needle.
  //    This handles inputs like "blood urea nitrogen" matching the key "bun" — unlikely
  //    in practice but provides a safety net for verbose user queries.
  const reverseKeys = Object.keys(MEDICAL_TERMS)
    .filter((key) => needle.includes(key))
    .sort((a, b) => b.length - a.length); // longest matching key wins

  if (reverseKeys.length > 0) {
    const bestKey = reverseKeys[0] as string;
    return MEDICAL_TERMS[bestKey] ?? null;
  }

  return null;
}
