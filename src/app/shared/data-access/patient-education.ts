// =============================================================================
// Patient Education Data
// Plain-language explanations for common lab tests (8th-grade reading level)
// =============================================================================

export interface PatientEducation {
  /** The canonical display name of the lab test. */
  testName: string;
  /** A 2-3 sentence plain-language overview of the test. */
  summary: string;
  /** A brief description of what the test actually measures. */
  whatItMeasures: string;
  /** Why a doctor orders this test and why results matter. */
  whyItMatters: string;
  /** The reference range considered normal for most adults. */
  normalRange: string;
  /** What it can mean if a result is above the normal range. */
  highMeaning: string;
  /** What it can mean if a result is below the normal range. */
  lowMeaning: string;
  /** 2-4 actionable lifestyle tips relevant to this test. */
  tips: string[];
}

// =============================================================================
// Education entries
// =============================================================================

export const PATIENT_EDUCATION: Record<string, PatientEducation> = {
  'comprehensive metabolic panel': {
    testName: 'Comprehensive Metabolic Panel',
    summary:
      'A comprehensive metabolic panel (CMP) is a group of 14 blood tests that give your doctor a broad snapshot of your health. It checks how well your kidneys and liver are working, looks at your blood sugar, and measures important minerals. Doctors use it for routine checkups and to watch for problems over time.',
    whatItMeasures:
      'Blood glucose, calcium, sodium, potassium, carbon dioxide, chloride, blood urea nitrogen (BUN), creatinine, total protein, albumin, and liver enzymes (ALT, AST, ALP, bilirubin).',
    whyItMatters:
      'This panel can catch early signs of diabetes, kidney disease, liver problems, and imbalances in the chemicals your body needs to work properly. Catching these issues early gives you and your doctor more options for treatment.',
    normalRange:
      'Each value has its own range. Key ones: Glucose 70-99 mg/dL, Creatinine 0.6-1.2 mg/dL, Sodium 136-145 mEq/L, Potassium 3.5-5.1 mEq/L.',
    highMeaning:
      'High glucose may point to diabetes or pre-diabetes. High creatinine can mean the kidneys are not filtering well. High liver enzymes may signal liver stress or inflammation.',
    lowMeaning:
      'Low glucose can cause shakiness or dizziness and may be linked to diabetes medications. Low sodium or potassium can affect muscle and heart function and may need prompt attention.',
    tips: [
      'Fast for 8-12 hours before your blood draw unless your doctor says otherwise.',
      'Drink plenty of water every day to help your kidneys flush waste.',
      'Limit alcohol, which can raise liver enzyme levels.',
      'Eat a balanced diet with vegetables, lean protein, and whole grains to support stable blood sugar.',
    ],
  },

  'lipid panel': {
    testName: 'Lipid Panel',
    summary:
      'A lipid panel measures the fats and cholesterol in your blood. It helps your doctor see whether you are at risk for heart disease or stroke. This is one of the most common blood tests ordered during a routine physical.',
    whatItMeasures:
      'Total cholesterol, LDL ("bad") cholesterol, HDL ("good") cholesterol, and triglycerides (a type of fat in the blood).',
    whyItMatters:
      'High LDL cholesterol and triglycerides can build up in your arteries and raise your risk of heart attack and stroke. Knowing your numbers lets you and your doctor create a plan to protect your heart.',
    normalRange:
      'Total cholesterol below 200 mg/dL; LDL below 100 mg/dL; HDL 40 mg/dL or higher (60+ is ideal); Triglycerides below 150 mg/dL.',
    highMeaning:
      'High LDL or total cholesterol means more fatty deposits can form in arteries, increasing heart disease risk. High triglycerides are often linked to diet, alcohol use, or diabetes.',
    lowMeaning:
      'Low HDL raises heart disease risk because HDL helps remove bad cholesterol from the blood. Low total cholesterol is uncommon but may be seen with certain health conditions.',
    tips: [
      'Limit saturated fats found in red meat, butter, and full-fat dairy.',
      'Exercise for at least 30 minutes on most days to raise HDL cholesterol.',
      'Cut back on sugary drinks and refined carbs to lower triglycerides.',
      'If you smoke, quitting can raise your HDL and protect your heart.',
    ],
  },

  'complete blood count': {
    testName: 'Complete Blood Count',
    summary:
      'A complete blood count (CBC) measures the different types of cells in your blood, including red cells, white cells, and platelets. It is one of the most common lab tests your doctor orders. The results can show a wide range of conditions, from anemia to infections.',
    whatItMeasures:
      'Red blood cell count, hemoglobin, hematocrit, white blood cell count and types (neutrophils, lymphocytes, etc.), and platelet count.',
    whyItMatters:
      'A CBC can detect anemia (low iron or blood loss), infections, blood cancers, and problems with clotting. It gives your doctor a quick look at how well your blood is doing its job of carrying oxygen, fighting infection, and stopping bleeding.',
    normalRange:
      'Hemoglobin: 12-17 g/dL (varies by sex); White blood cells: 4,500-11,000 per microliter; Platelets: 150,000-400,000 per microliter.',
    highMeaning:
      'A high white blood cell count often means your body is fighting an infection or inflammation. A high red blood cell count may be caused by dehydration or a lung condition.',
    lowMeaning:
      'Low hemoglobin is the main sign of anemia and can cause tiredness and shortness of breath. Low white blood cells may mean a weakened immune system. Low platelets can lead to easy bruising or bleeding.',
    tips: [
      'Eat iron-rich foods like lean meat, beans, and leafy greens to support healthy red blood cells.',
      'Get enough vitamin B12 and folate, found in eggs, dairy, and fortified cereals.',
      'Stay hydrated so blood tests reflect your true baseline.',
      'Tell your doctor about any medications you take, as some can affect blood cell counts.',
    ],
  },

  hba1c: {
    testName: 'HbA1c',
    summary:
      'The HbA1c test (also called the A1c or glycated hemoglobin test) measures your average blood sugar level over the past 2-3 months. Unlike a regular blood sugar test, you do not need to fast. It is the main test used to diagnose and manage diabetes.',
    whatItMeasures:
      'The percentage of hemoglobin in your red blood cells that has sugar attached to it. Higher blood sugar over time means a higher A1c percentage.',
    whyItMatters:
      'A1c shows how well your blood sugar has been controlled over time, not just on the day of the test. Keeping A1c in a healthy range lowers the risk of diabetes complications like nerve damage, kidney disease, and vision loss.',
    normalRange:
      'Below 5.7% is normal. 5.7%-6.4% is pre-diabetes. 6.5% or higher on two separate tests means diabetes. A goal for people managing diabetes is often below 7%.',
    highMeaning:
      'A high A1c means blood sugar has been running too high for months. This raises the risk of long-term damage to the eyes, kidneys, nerves, and heart.',
    lowMeaning:
      'A very low A1c (below 4%) is rare and may suggest low blood sugar episodes. In people taking diabetes medication, it could mean the doses need adjusting.',
    tips: [
      'Choose foods with a low glycemic index, such as whole grains, vegetables, and legumes.',
      'Aim for at least 150 minutes of moderate exercise per week, like brisk walking.',
      'Check your blood sugar at home if your doctor recommends it, and track trends.',
      'Take diabetes medications exactly as prescribed and do not skip doses.',
    ],
  },

  'thyroid panel (tsh)': {
    testName: 'Thyroid Panel (TSH)',
    summary:
      'A thyroid panel checks how well your thyroid gland is working. The thyroid is a small gland in your neck that controls your metabolism, energy, and many body functions. The most important test is TSH (thyroid-stimulating hormone), which tells your brain how hard to push the thyroid.',
    whatItMeasures:
      'TSH (thyroid-stimulating hormone), and often Free T4 (thyroxine) and Free T3 (triiodothyronine), which are hormones the thyroid itself produces.',
    whyItMatters:
      'Thyroid problems are very common and can cause symptoms like fatigue, weight changes, mood swings, and irregular heartbeat. Catching an overactive or underactive thyroid early means treatment can restore normal energy and health.',
    normalRange:
      'TSH: 0.4-4.0 mIU/L for most adults; Free T4: 0.8-1.8 ng/dL; Free T3: 2.3-4.2 pg/mL. Ranges can vary slightly by lab.',
    highMeaning:
      'A high TSH usually means the thyroid is underactive (hypothyroidism). The brain is sending extra signals to try to get more thyroid hormone. This can cause tiredness, weight gain, cold sensitivity, and depression.',
    lowMeaning:
      'A low TSH usually means the thyroid is overactive (hyperthyroidism). The brain is backing off because there is already too much thyroid hormone. This can cause rapid heartbeat, weight loss, anxiety, and sweating.',
    tips: [
      'Take thyroid medications (like levothyroxine) on an empty stomach at the same time each day.',
      'Avoid taking thyroid medication within 4 hours of calcium or iron supplements.',
      'Eat adequate iodine, found in seafood and iodized salt, to support thyroid function.',
      'Tell your doctor if you feel unusually tired, gain or lose weight without trying, or notice neck swelling.',
    ],
  },

  urinalysis: {
    testName: 'Urinalysis',
    summary:
      'A urinalysis (UA) is a test of your urine that looks at its appearance, chemical makeup, and microscopic content. It is often done during routine checkups or when you have symptoms like pain when urinating. It can reveal a lot about your kidneys, urinary tract, and overall health.',
    whatItMeasures:
      'Color and clarity, pH, protein, glucose, ketones, blood, nitrites, white blood cells, and bacteria or cells under a microscope.',
    whyItMatters:
      'A urinalysis can find urinary tract infections (UTIs), kidney disease, diabetes, dehydration, and kidney stones. Treating these conditions early prevents them from getting worse.',
    normalRange:
      'Clear to pale yellow urine; no significant protein, glucose, blood, or bacteria; pH between 4.5 and 8.0; specific gravity 1.005-1.030.',
    highMeaning:
      'High protein may signal kidney stress or disease. The presence of glucose can indicate diabetes. White blood cells or nitrites suggest a urinary tract infection that needs treatment.',
    lowMeaning:
      'Very dilute urine (low specific gravity) can mean you are drinking too much water or there is a kidney issue. Low pH (acidic urine) may be seen with certain diets or metabolic conditions.',
    tips: [
      'Drink enough water throughout the day; pale yellow urine is a good sign of hydration.',
      'Wipe front to back and urinate after sexual activity to help prevent UTIs.',
      'Do not delay urinating when you feel the urge, as holding it too long can encourage bacteria to grow.',
      'Follow your doctor\'s instructions on whether to fast or avoid certain foods before the test.',
    ],
  },

  'vitamin d': {
    testName: 'Vitamin D',
    summary:
      'A vitamin D blood test measures the level of vitamin D in your body. Vitamin D is sometimes called the "sunshine vitamin" because your skin makes it when exposed to sunlight. It plays a key role in bone strength, immune function, and mood. Low vitamin D is very common, especially in people who spend little time outdoors.',
    whatItMeasures:
      '25-hydroxyvitamin D (25-OH vitamin D), which is the storage form of vitamin D in your blood and the best way to check your overall vitamin D status.',
    whyItMatters:
      'Without enough vitamin D, your body cannot absorb calcium well, which weakens bones and raises the risk of fractures. Low levels have also been linked to fatigue, depression, and a weaker immune system.',
    normalRange:
      'Sufficient: 20-50 ng/mL; Optimal by many guidelines: 30-50 ng/mL; Deficient: below 20 ng/mL; Toxic: above 100 ng/mL.',
    highMeaning:
      'Very high vitamin D levels (usually from taking too many supplements) can cause nausea, weakness, kidney problems, and too much calcium in the blood. This is called vitamin D toxicity.',
    lowMeaning:
      'Low vitamin D can cause bone pain, muscle weakness, fatigue, and mood changes. Long-term deficiency raises the risk of osteoporosis, which makes bones fragile and easy to break.',
    tips: [
      'Get 10-30 minutes of midday sun exposure on your arms and legs several times per week when possible.',
      'Eat vitamin D-rich foods like fatty fish (salmon, tuna), egg yolks, and fortified milk or orange juice.',
      'Ask your doctor about the right supplement dose if your levels are low; do not take high doses without guidance.',
      'Pair vitamin D with calcium-rich foods since both work together for healthy bones.',
    ],
  },

  'iron panel': {
    testName: 'Iron Panel',
    summary:
      'An iron panel is a group of blood tests that measure the amount of iron in your body and how well your body is storing and using it. Iron is a mineral your body needs to make hemoglobin, the protein in red blood cells that carries oxygen. Both too little and too much iron can cause health problems.',
    whatItMeasures:
      'Serum iron (iron in the blood), ferritin (iron storage protein), total iron-binding capacity (TIBC), and transferrin saturation (the percentage of iron-binding sites that are filled).',
    whyItMatters:
      'An iron panel helps diagnose iron-deficiency anemia, which is the most common nutritional deficiency worldwide. It can also detect iron overload (hemochromatosis), which can damage the liver, heart, and other organs if left untreated.',
    normalRange:
      'Serum iron: 60-170 mcg/dL; Ferritin: 12-300 ng/mL for men, 12-150 ng/mL for women; TIBC: 250-370 mcg/dL; Transferrin saturation: 20-50%.',
    highMeaning:
      'High ferritin or high transferrin saturation can mean too much iron is being absorbed and stored. Hemochromatosis is a genetic condition that causes this. High iron levels can damage organs over time.',
    lowMeaning:
      'Low ferritin is often the first sign of iron deficiency before anemia develops. Low serum iron and high TIBC together suggest the body is trying to grab more iron from the blood because stores are running low.',
    tips: [
      'Eat iron-rich foods such as red meat, poultry, fish, lentils, beans, and fortified cereals.',
      'Pair plant-based iron sources with vitamin C (like orange juice) to improve absorption.',
      'Avoid drinking tea or coffee with iron-rich meals, as these can block iron absorption.',
      'If you take iron supplements, take them on an empty stomach with water unless they upset your stomach.',
    ],
  },

  'basic metabolic panel': {
    testName: 'Basic Metabolic Panel',
    summary:
      'A basic metabolic panel (BMP) is a set of 8 blood tests that give a quick overview of your body\'s chemistry and how your kidneys are working. It is a shorter version of the comprehensive metabolic panel and is often ordered in emergency or urgent situations as well as routine care. Results come back quickly and give your doctor key information about your health.',
    whatItMeasures:
      'Blood glucose, calcium, sodium, potassium, carbon dioxide, chloride, blood urea nitrogen (BUN), and creatinine.',
    whyItMatters:
      'This panel helps detect problems with blood sugar, kidney function, and electrolyte balance. Electrolytes are minerals that keep fluids, nerve signals, and muscle contractions working properly. An imbalance can cause serious symptoms quickly.',
    normalRange:
      'Glucose 70-99 mg/dL; Calcium 8.5-10.5 mg/dL; Sodium 136-145 mEq/L; Potassium 3.5-5.1 mEq/L; BUN 7-20 mg/dL; Creatinine 0.6-1.2 mg/dL.',
    highMeaning:
      'High glucose may point to diabetes. High creatinine or BUN suggests the kidneys may not be filtering waste properly. High potassium (hyperkalemia) can affect heart rhythm and requires prompt attention.',
    lowMeaning:
      'Low sodium (hyponatremia) can cause confusion, headaches, and in severe cases, seizures. Low glucose causes shakiness, sweating, and dizziness. Low potassium can cause muscle cramps and weakness.',
    tips: [
      'Stay well hydrated, especially in hot weather or during illness, to keep electrolytes balanced.',
      'Follow a low-sodium diet if your doctor recommends it to protect kidney and heart health.',
      'Monitor blood sugar regularly if you have diabetes or pre-diabetes.',
      'Let your doctor know about all supplements and over-the-counter medications, as some affect kidney function and electrolytes.',
    ],
  },

  'liver panel': {
    testName: 'Liver Panel',
    summary:
      'A liver panel (also called a liver function test or hepatic function panel) is a group of blood tests that check how well your liver is working. The liver filters your blood, makes proteins, and helps digest food. This panel helps your doctor spot liver damage, disease, or inflammation early.',
    whatItMeasures:
      'Alanine aminotransferase (ALT), aspartate aminotransferase (AST), alkaline phosphatase (ALP), gamma-glutamyl transferase (GGT), total and direct bilirubin, total protein, and albumin.',
    whyItMatters:
      'The liver is one of the hardest-working organs in your body, and it can be affected by alcohol, medications, viral infections, and conditions like fatty liver disease. Catching problems early through regular testing can prevent serious liver damage.',
    normalRange:
      'ALT: 7-56 U/L; AST: 10-40 U/L; ALP: 44-147 U/L; GGT: 8-61 U/L; Total bilirubin: 0.1-1.2 mg/dL; Albumin: 3.5-5.0 g/dL.',
    highMeaning:
      'High ALT and AST are the clearest signs of liver cell damage or inflammation. High bilirubin can cause jaundice (yellowing of skin and eyes). High GGT may point to alcohol use or bile duct problems.',
    lowMeaning:
      'Low albumin means the liver may not be making enough protein, which can happen in chronic liver disease or malnutrition. Low total protein can also suggest poor nutrition or kidney problems.',
    tips: [
      'Limit alcohol to no more than one drink per day for women or two for men, or avoid it entirely if your liver enzymes are elevated.',
      'Maintain a healthy weight, since excess body fat is a leading cause of fatty liver disease.',
      'Ask your doctor before starting any new supplements or herbal products, as many can stress the liver.',
      'Get vaccinated against hepatitis A and B if you have not already, to protect your liver from viral infections.',
    ],
  },
};

// =============================================================================
// Lookup helper
// =============================================================================

/**
 * Returns the PatientEducation entry for a given test name using
 * case-insensitive matching, or null if no match is found.
 *
 * @param testName - The lab test name to look up (any casing).
 * @returns The matching PatientEducation object, or null.
 */
export function getEducation(testName: string): PatientEducation | null {
  const key = testName.trim().toLowerCase();
  return PATIENT_EDUCATION[key] ?? null;
}
