import { Injectable, signal } from '@angular/core';

/**
 * HealthLiteracyService
 *
 * Manages the "Simple View" toggle that converts medical jargon into plain
 * language throughout the portal.  Uses Angular Signals so components with
 * OnPush change detection automatically re-render when the mode changes.
 *
 * The simplify() method performs a case-insensitive whole-word replacement of
 * medical terms from a curated glossary.  It is safe to call with any string
 * and returns the original text unchanged when simple view is disabled.
 *
 * Usage:
 *   // In a template
 *   {{ diagnosis | simplifyText }}
 *
 *   // In a component class
 *   readonly display = computed(() =>
 *     this.literacyService.simplify(this.medicationName())
 *   );
 */
@Injectable({ providedIn: 'root' })
export class HealthLiteracyService {
  private _simpleView = signal(false);
  readonly simpleView = this._simpleView.asReadonly();

  // ── Medical term glossary ──────────────────────────────────────────────────
  // Keys: medical term (lowercase, may contain spaces/hyphens)
  // Values: plain-language replacement suitable for a general adult audience

  private readonly glossary: Record<string, string> = {
    // Diagnoses & conditions
    hypertension: 'high blood pressure',
    hypotension: 'low blood pressure',
    hyperglycemia: 'high blood sugar',
    hypoglycemia: 'low blood sugar',
    dyslipidemia: 'abnormal cholesterol levels',
    hypercholesterolemia: 'high cholesterol',
    tachycardia: 'fast heart rate',
    bradycardia: 'slow heart rate',
    arrhythmia: 'irregular heartbeat',
    'myocardial infarction': 'heart attack',
    angina: 'chest pain from the heart',
    atherosclerosis: 'hardening of the arteries',
    'type 2 diabetes mellitus': 'type 2 diabetes',
    'diabetes mellitus': 'diabetes',
    obesity: 'being significantly overweight',
    'bmi': 'body mass index (BMI)',
    dyspnea: 'shortness of breath',
    edema: 'swelling caused by fluid',
    'peripheral edema': 'swelling in the legs and feet',
    syncope: 'fainting',
    vertigo: 'dizziness with spinning sensation',
    nausea: 'feeling sick to your stomach',
    emesis: 'vomiting',
    diarrhea: 'loose or watery stools',
    constipation: 'difficulty passing stools',
    hematuria: 'blood in urine',
    proteinuria: 'protein in urine',
    'urinary tract infection': 'bladder infection',
    'uti': 'bladder infection',
    pneumonia: 'lung infection',
    bronchitis: 'airway inflammation',
    'upper respiratory infection': 'cold or throat infection',
    'uri': 'cold or throat infection',
    cellulitis: 'skin infection',
    sepsis: 'severe body-wide infection',
    anemia: 'low red blood cells (iron-poor blood)',
    thrombocytopenia: 'low platelet count',
    leukopenia: 'low white blood cell count',
    osteoporosis: 'weak or brittle bones',
    osteoarthritis: 'joint pain and stiffness from wear and tear',
    'rheumatoid arthritis': 'joint pain from the immune system attacking joints',
    migraine: 'severe recurring headache',
    seizure: 'sudden uncontrolled electrical activity in the brain',
    stroke: 'brain attack caused by blocked or burst blood vessel',
    'transient ischemic attack': 'mini-stroke',
    'tia': 'mini-stroke',
    dementia: 'memory and thinking problems',
    depression: 'persistent low mood',
    anxiety: 'excessive worry or fear',
    insomnia: 'difficulty sleeping',
    hypothyroidism: 'underactive thyroid (slow metabolism)',
    hyperthyroidism: 'overactive thyroid (fast metabolism)',
    'gastroesophageal reflux disease': 'acid reflux',
    'gerd': 'acid reflux',
    'irritable bowel syndrome': 'bowel sensitivity causing pain and irregular stools',
    'ibs': 'bowel sensitivity',
    'chronic obstructive pulmonary disease': 'lung disease that makes breathing hard',
    'copd': 'lung disease that makes breathing hard',
    asthma: 'airway condition causing breathing difficulties',
    eczema: 'itchy, inflamed skin',
    psoriasis: 'skin condition causing scaly patches',
    acne: 'pimples or skin breakouts',
    'benign prostatic hyperplasia': 'enlarged prostate',
    'bph': 'enlarged prostate',

    // Medications & treatments
    analgesic: 'pain reliever',
    antipyretic: 'fever reducer',
    antibiotic: 'medicine that kills bacteria',
    anticoagulant: 'blood thinner',
    antihypertensive: 'blood pressure medicine',
    diuretic: 'water pill (helps remove extra fluid)',
    'beta blocker': 'heart rate and blood pressure medicine',
    'ace inhibitor': 'blood pressure and heart medicine',
    statin: 'cholesterol-lowering medicine',
    corticosteroid: 'anti-inflammatory steroid',
    bronchodilator: 'inhaler that opens airways',
    antihistamine: 'allergy medicine',
    antidepressant: 'medicine for depression or anxiety',
    anxiolytic: 'medicine to reduce anxiety',
    hypnotic: 'sleep medicine',
    immunosuppressant: 'medicine that calms the immune system',
    chemotherapy: 'cancer treatment using medicines',
    'radiation therapy': 'cancer treatment using high-energy rays',
    dialysis: 'kidney cleaning treatment (machine does the work of the kidneys)',
    biopsy: 'small tissue sample taken for testing',
    endoscopy: 'camera procedure to look inside the body',
    colonoscopy: 'camera procedure to look inside the large bowel',
    laparoscopy: 'keyhole surgery',
    catheterization: 'inserting a tube to drain fluid',
    intubation: 'placing a breathing tube',
    'intravenous infusion': 'medicine given directly into a vein (IV drip)',
    'iv': 'into the vein',
    subcutaneous: 'under the skin',
    intramuscular: 'into the muscle',
    topical: 'applied to the skin',

    // Lab tests & results
    'complete blood count': 'full blood test',
    'cbc': 'full blood test',
    'basic metabolic panel': 'blood chemistry test',
    'bmp': 'blood chemistry test',
    'comprehensive metabolic panel': 'detailed blood chemistry test',
    'cmp': 'detailed blood chemistry test',
    'hba1c': 'average blood sugar over 3 months',
    'a1c': 'average blood sugar over 3 months',
    creatinine: 'waste product that shows how well the kidneys work',
    'glomerular filtration rate': 'measure of kidney function',
    'gfr': 'kidney function score',
    troponin: 'heart damage marker',
    'prothrombin time': 'blood clotting time test',
    'pt': 'blood clotting time',
    'international normalized ratio': 'blood thinning level',
    'inr': 'blood thinning level',
    'thyroid stimulating hormone': 'thyroid check',
    'tsh': 'thyroid check',
    urinalysis: 'urine test',
    echocardiogram: 'heart ultrasound',
    electrocardiogram: 'heart tracing test',
    'ekg': 'heart tracing test',
    'ecg': 'heart tracing test',
    'mri': 'detailed body scan using magnets',
    'ct scan': 'detailed X-ray scan',
    'x-ray': 'picture taken with radiation to see bones',
    ultrasound: 'scan using sound waves to see inside the body',

    // Anatomical terms
    cardiac: 'heart',
    pulmonary: 'lung',
    renal: 'kidney',
    hepatic: 'liver',
    cerebral: 'brain',
    vascular: 'blood vessel',
    gastrointestinal: 'digestive system',
    musculoskeletal: 'muscles and bones',
    dermatological: 'skin',
    ophthalmic: 'eye',
    otolaryngological: 'ear, nose, and throat',

    // General clinical terms
    acute: 'sudden or short-term',
    chronic: 'long-lasting',
    benign: 'not harmful or cancerous',
    malignant: 'cancerous',
    prognosis: 'expected outcome',
    diagnosis: 'identified condition',
    symptom: 'sign of a health problem',
    etiology: 'cause of a condition',
    comorbidity: 'other health conditions present at the same time',
    contraindicated: 'not recommended or unsafe',
    prophylaxis: 'prevention treatment',
    remission: 'disease is less active or gone',
    exacerbation: 'worsening of symptoms',
    idiopathic: 'cause unknown',
    iatrogenic: 'caused by medical treatment',
    palliative: 'focused on comfort and quality of life',
    'follow-up': 'return visit to check on your health',
    referral: 'recommendation to see a specialist',
    prescription: 'written order for medicine',
    dosage: 'amount of medicine to take',
    'adverse reaction': 'unwanted or harmful effect of a medicine',
    'side effect': 'unwanted effect of a medicine',
  };

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Toggle between standard and simple view. */
  toggleSimpleView(): void {
    this._simpleView.update((v) => !v);
    try {
      localStorage.setItem('portal_simple_view', String(this._simpleView()));
    } catch {
      // Ignore storage errors
    }
  }

  /** Explicitly set the simple view state. */
  setSimpleView(enabled: boolean): void {
    this._simpleView.set(enabled);
    try {
      localStorage.setItem('portal_simple_view', String(enabled));
    } catch {
      // Ignore
    }
  }

  /**
   * Replace recognised medical terms in the given text with their plain-
   * language equivalents.  Returns the original text unchanged when simple
   * view is disabled.
   *
   * Replacement is:
   *  - Case-insensitive matching
   *  - Whole-word only (won't mangle partial matches inside longer words)
   *  - Preserves the capitalisation style of the source text
   */
  simplify(text: string): string {
    if (!this._simpleView() || !text) return text;

    let result = text;

    // Sort by length descending so longer phrases match before their
    // sub-phrases (e.g. "myocardial infarction" before "infarction").
    const sortedKeys = Object.keys(this.glossary).sort((a, b) => b.length - a.length);

    for (const term of sortedKeys) {
      const replacement = this.glossary[term];
      // Use word-boundary anchors where possible; for multi-word terms use a
      // flexible boundary that handles spaces.
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`, 'gi');

      result = result.replace(pattern, (match) => {
        // Preserve original capitalisation style
        if (match[0] === match[0].toUpperCase()) {
          return replacement.charAt(0).toUpperCase() + replacement.slice(1);
        }
        return replacement;
      });
    }

    return result;
  }

  /** Restore persisted simple-view preference. */
  restorePreference(): void {
    try {
      const stored = localStorage.getItem('portal_simple_view');
      if (stored === 'true') this._simpleView.set(true);
    } catch {
      // Ignore
    }
  }
}
