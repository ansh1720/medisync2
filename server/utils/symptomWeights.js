// Enhanced symptom weights for risk assessment
// Based on medical literature and clinical severity guidelines
// Scale: 1-10 (1=minimal concern, 10=medical emergency)

const SYMPTOM_WEIGHTS = {
  // Critical/Emergency symptoms (9-10)
  'chest pain': 9.5,
  'difficulty breathing': 9.8,
  'severe shortness of breath': 10,
  'loss of consciousness': 10,
  'severe headache': 9.2,
  'seizures': 10,
  'fainting': 9.0,
  'severe abdominal pain': 9.0,
  'blood in vomit': 9.5,
  'blood in stool': 9.2,
  'blood in urine': 8.8,
  'severe allergic reaction': 10,
  'choking': 10,
  'cardiac arrest': 10,
  'stroke symptoms': 10,
  'severe burns': 9.8,
  'severe bleeding': 9.7,
  'poisoning': 9.8,
  
  // High severity symptoms (7-8.9)
  'high fever': 8.2,          // >103°F (39.4°C)
  'fever': 7.5,               // 100.4-103°F (38-39.4°C)
  'persistent vomiting': 8.0,
  'vomiting': 7.2,
  'severe diarrhea': 7.8,
  'dehydration': 8.1,
  'chest tightness': 8.3,
  'palpitations': 7.8,
  'irregular heartbeat': 8.5,
  'shortness of breath': 8.7,
  'wheezing': 7.9,
  'coughing up blood': 9.1,
  'severe cough': 7.6,
  'persistent cough': 7.3,
  'vision problems': 8.0,
  'double vision': 8.8,
  'sudden vision loss': 9.5,
  'hearing loss': 7.7,
  'severe confusion': 8.9,
  'confusion': 8.2,
  'disorientation': 8.4,
  'memory loss': 7.8,
  'severe weakness': 8.3,
  'paralysis': 9.8,
  'numbness': 7.9,
  'tingling': 6.8,
  'severe dizziness': 8.1,
  'balance problems': 7.7,
  'severe joint pain': 7.8,
  'joint swelling': 7.5,
  'inability to move joint': 8.2,
  
  // Moderate severity symptoms (5-6.9)
  'moderate fever': 6.8,      // 99.5-100.4°F (37.5-38°C)
  'low grade fever': 5.8,     // 99-99.5°F (37.2-37.5°C)
  'cough': 6.2,
  'sore throat': 5.5,
  'hoarse voice': 5.2,
  'difficulty swallowing': 7.2,
  'nausea': 5.8,
  'diarrhea': 6.1,
  'constipation': 4.8,
  'abdominal pain': 6.5,
  'stomach cramps': 5.9,
  'heartburn': 4.7,
  'indigestion': 4.2,
  'loss of appetite': 5.1,
  'weight loss': 6.8,
  'unexplained weight loss': 7.9,
  'headache': 6.3,
  'migraine': 7.4,
  'dizziness': 6.7,
  'weakness': 6.1,
  'fatigue': 5.7,
  'excessive tiredness': 6.2,
  'sleep problems': 5.3,
  'insomnia': 5.8,
  'muscle aches': 5.4,
  'muscle cramps': 5.7,
  'joint pain': 6.0,
  'back pain': 5.9,
  'neck pain': 5.6,
  'stiff neck': 7.1,
  'swollen glands': 6.8,
  'swollen lymph nodes': 7.0,
  'skin rash': 6.2,
  'skin lesions': 6.9,
  'itching': 4.9,
  'hives': 6.7,
  'swelling': 6.6,
  'swelling in legs': 7.3,
  'swelling in face': 7.8,
  'leg pain': 6.1,
  'leg cramps': 5.5,
  'cold hands/feet': 5.2,
  
  // Lower severity symptoms (3-4.9)
  'runny nose': 3.2,
  'stuffy nose': 3.5,
  'sneezing': 3.1,
  'congestion': 3.8,
  'watery eyes': 3.3,
  'dry eyes': 3.7,
  'dry mouth': 4.1,
  'bad breath': 2.8,
  'dental pain': 5.8,
  'mouth sores': 4.6,
  'bleeding gums': 4.9,
  'chills': 4.8,
  'sweating': 4.5,
  'night sweats': 5.2,
  'hot flashes': 4.3,
  'mood changes': 4.1,
  'irritability': 3.9,
  'anxiety': 4.7,
  'depression': 5.1,
  'restlessness': 4.2,
  'nervousness': 4.0,
  
  // Specialized symptoms with context-dependent severity
  'loss of taste': 6.8,       // Can indicate serious conditions
  'loss of smell': 6.5,       // Can indicate serious conditions
  'hair loss': 4.8,
  'brittle nails': 3.6,
  'pale skin': 5.4,
  'yellow skin': 7.8,
  'blue lips/fingers': 8.9,
  'frequent urination': 5.6,
  'painful urination': 6.4,
  'blood in urine': 8.8,
  'dark urine': 6.7,
  'cloudy urine': 5.9,
  'strong urine odor': 5.1,
  'urinary retention': 8.1,
  'incontinence': 6.3,
  
  // Gender-specific symptoms
  'menstrual irregularities': 5.8,
  'heavy menstrual bleeding': 7.2,
  'missed periods': 5.5,
  'pelvic pain': 6.9,
  'breast pain': 5.7,
  'breast lumps': 8.5,
  'nipple discharge': 7.1,
  'erectile dysfunction': 4.9,
  'testicular pain': 7.8,
  'genital discharge': 6.8,
  
  // Pediatric considerations (higher weights for children)
  'high fever in child': 9.1,
  'vomiting in infant': 8.7,
  'difficulty feeding': 8.3,
  'lethargy in child': 8.8,
  'irritability in infant': 7.9,
  
  // Geriatric considerations (higher weights for elderly)
  'falls': 7.8,
  'hip pain': 7.2,
  'confusion in elderly': 8.7,
  'sudden weakness in elderly': 9.0,
  'chest pain in elderly': 9.8,
  'night sweats': 5,
  'weight loss': 6,
  'weight gain': 4,
  'difficulty sleeping': 3,
  
  // Emergency symptoms
  'severe bleeding': 10,
  'difficulty breathing': 10,
  'severe chest pain': 10,
  'loss of consciousness': 10,
  'severe abdominal pain': 9,
  'severe headache': 9,
  'high fever': 9,
  'signs of stroke': 10,
  'severe allergic reaction': 10,
  
  // Mental health symptoms
  'anxiety': 4,
  'depression': 5,
  'mood swings': 3,
  'panic attacks': 7,
  'suicidal thoughts': 10,
  
  // Infection symptoms
  'chills': 6,
  'sweating': 4,
  'swollen joints': 6,
  'red streaks': 8,
  'pus or discharge': 6,
  'burning urination': 5,
  'frequent urination': 4,
  
  // Respiratory specific
  'wheezing': 7,
  'dry cough': 5,
  'productive cough': 6,
  'blood in cough': 9,
  'throat irritation': 3,
  
  // Digestive specific
  'heartburn': 3,
  'bloating': 2,
  'gas': 1,
  'difficulty swallowing': 7,
  'blood in vomit': 9,
  
  // Skin and external
  'itching': 2,
  'bruising': 4,
  'skin discoloration': 5,
  'unusual moles': 6,
  'hair loss': 3,
  'nail changes': 2,
  
  // Reproductive health
  'irregular periods': 4,
  'heavy bleeding': 7,
  'pelvic pain': 6,
  'breast lumps': 7,
  'erectile dysfunction': 4,
  
  // Eye and vision
  'blurred vision': 6,
  'double vision': 8,
  'eye pain': 5,
  'light sensitivity': 5,
  'eye discharge': 4,
  
  // Ear and hearing
  'ear pain': 4,
  'ear discharge': 5,
  'ringing in ears': 4,
  'balance problems': 6,
  
  // Urinary symptoms
  'blood in urine': 8,
  'painful urination': 6,
  'urgency': 4,
  'incontinence': 5,
  'kidney pain': 7
};

// Enhanced age factor multipliers based on clinical data
const AGE_FACTORS = {
  'newborn': 2.1,     // 0-3 months - highest risk, immature immune system
  'infant': 1.9,      // 3-12 months - high risk, developing immunity
  'toddler': 1.6,     // 1-3 years - high risk, exploratory behavior
  'preschool': 1.3,   // 3-6 years - moderate risk
  'child': 1.15,      // 6-12 years - slight increase, school exposure
  'teen': 1.0,        // 13-17 years - baseline, strong immune system
  'young_adult': 0.95, // 18-30 years - slightly below baseline
  'adult': 1.0,       // 30-50 years - baseline reference
  'middle_aged': 1.25, // 50-65 years - moderate increase
  'elderly': 1.6,     // 65-75 years - high risk, multiple comorbidities
  'very_elderly': 2.0, // 75-85 years - very high risk
  'extreme_elderly': 2.4 // 85+ years - extremely high risk
};

// Enhanced medical condition risk multipliers based on clinical outcomes
const CONDITION_MULTIPLIERS = {
  // Metabolic conditions
  'diabetes': 1.7,              // High risk, affects multiple systems
  'type 1 diabetes': 1.8,       // Higher risk than type 2
  'type 2 diabetes': 1.6,       // Still significant risk
  'pre-diabetes': 1.2,          // Moderate increase
  'metabolic syndrome': 1.4,     // Multiple risk factors
  'obesity': 1.3,               // BMI >30, increases complications
  'severe obesity': 1.6,        // BMI >40, much higher risk
  'thyroid disease': 1.3,       // Affects metabolism
  'hyperthyroidism': 1.4,       // Higher risk than hypo
  'hypothyroidism': 1.2,        // Moderate risk
  
  // Cardiovascular conditions
  'heart disease': 1.9,         // Major risk factor
  'coronary artery disease': 2.0, // Very high risk
  'heart failure': 2.1,         // Extremely high risk
  'cardiomyopathy': 1.9,        // High risk
  'arrhythmia': 1.5,            // Moderate-high risk
  'hypertension': 1.4,          // Common, significant risk
  'high blood pressure': 1.4,   // Same as hypertension
  'stroke history': 1.8,        // Very high risk
  'peripheral artery disease': 1.6, // High risk
  'deep vein thrombosis': 1.7,  // High clotting risk
  'pulmonary embolism': 1.8,    // Very high risk
  
  // Respiratory conditions
  'asthma': 1.5,                // Respiratory compromise
  'severe asthma': 1.8,         // Much higher risk
  'copd': 1.7,                  // High risk, poor lung function
  'emphysema': 1.8,             // Very high risk
  'chronic bronchitis': 1.6,    // High risk
  'pulmonary fibrosis': 1.9,    // Very high risk
  'sleep apnea': 1.3,           // Moderate risk
  'cystic fibrosis': 2.0,       // Very high risk
  
  // Immune system conditions
  'immunocompromised': 2.2,     // Extremely high risk
  'hiv/aids': 2.1,              // Very high risk
  'cancer': 1.9,                // High risk, varies by type
  'active cancer': 2.1,         // Very high risk
  'cancer remission': 1.5,      // Moderate-high risk
  'chemotherapy': 2.0,          // Very high risk
  'radiation therapy': 1.7,     // High risk
  'organ transplant': 2.2,      // Extremely high risk (immunosuppressed)
  'autoimmune disease': 1.6,    // High risk
  'rheumatoid arthritis': 1.5,  // Moderate-high risk
  'lupus': 1.7,                 // High risk
  'multiple sclerosis': 1.6,    // High risk
  'crohn\'s disease': 1.4,      // Moderate-high risk
  'ulcerative colitis': 1.4,    // Moderate-high risk
  
  // Kidney and liver conditions
  'kidney disease': 1.8,        // High risk
  'chronic kidney disease': 1.9, // Very high risk
  'dialysis': 2.0,              // Very high risk
  'liver disease': 1.6,         // High risk
  'cirrhosis': 1.9,             // Very high risk
  'hepatitis': 1.5,             // Moderate-high risk
  
  // Neurological conditions
  'dementia': 1.7,              // High risk
  'alzheimer\'s': 1.8,          // Very high risk
  'parkinson\'s': 1.6,          // High risk
  'epilepsy': 1.4,              // Moderate-high risk
  'cerebral palsy': 1.5,        // Moderate-high risk
  'spinal cord injury': 1.6,    // High risk
  
  // Blood disorders
  'anemia': 1.3,                // Moderate risk
  'sickle cell disease': 1.8,   // Very high risk
  'hemophilia': 1.6,            // High risk (bleeding risk)
  'thrombocytopenia': 1.5,      // Moderate-high risk
  
  // Mental health (can affect compliance and self-care)
  'depression': 1.2,            // Affects self-care
  'severe depression': 1.4,     // Higher impact
  'bipolar disorder': 1.3,      // Moderate risk
  'schizophrenia': 1.5,         // Higher risk
  'anxiety disorder': 1.1,      // Minimal increase
  'panic disorder': 1.2,        // Slight increase
  
  // Pregnancy and reproductive
  'pregnancy': 1.4,             // Moderate-high risk
  'high-risk pregnancy': 1.8,   // Very high risk
  'recent pregnancy': 1.3,      // Post-partum risks
  
  // Substance use
  'smoking': 1.4,               // Significant risk
  'heavy smoking': 1.6,         // High risk
  'alcohol abuse': 1.3,         // Moderate risk
  'drug abuse': 1.5,            // Moderate-high risk
  
  // Age-related (specific conditions)
  'osteoporosis': 1.2,          // Fracture risk
  'arthritis': 1.1,             // Minimal increase
  'severe arthritis': 1.3,      // Moderate increase
  'pregnancy': 1.2,
  'immunocompromised': 1.5,
  'chronic lung disease': 1.4,
  'cardiovascular disease': 1.5,
  'stroke history': 1.3,
  'blood clotting disorders': 1.3,
  'mental health conditions': 1.1,
  'epilepsy': 1.2,
  'thyroid disorders': 1.1
};

// Get symptom weight with normalization
function getSymptomWeight(symptom) {
  const normalizedSymptom = symptom.toLowerCase().trim();
  return SYMPTOM_WEIGHTS[normalizedSymptom] || 3; // Default weight for unknown symptoms
}

// Get precise age category for enhanced risk assessment
function getAgeCategory(age) {
  if (age < 0.25) return 'newborn';        // 0-3 months
  if (age < 1) return 'infant';            // 3-12 months
  if (age < 3) return 'toddler';           // 1-3 years
  if (age < 6) return 'preschool';         // 3-6 years
  if (age < 13) return 'child';            // 6-12 years
  if (age < 18) return 'teen';             // 13-17 years
  if (age < 30) return 'young_adult';      // 18-30 years
  if (age < 50) return 'adult';            // 30-50 years
  if (age < 65) return 'middle_aged';      // 50-65 years
  if (age < 75) return 'elderly';          // 65-75 years
  if (age < 85) return 'very_elderly';     // 75-85 years
  return 'extreme_elderly';                // 85+ years
}

// Enhanced risk score calculation with symptom combinations
function calculateRiskScore(symptoms, age, conditions = []) {
  // Base symptom score
  let baseScore = 0;
  const symptomWeights = [];
  
  symptoms.forEach(symptom => {
    const weight = getSymptomWeight(symptom);
    symptomWeights.push({ symptom, weight });
    baseScore += weight;
  });
  
  // Check for dangerous symptom combinations
  const combinationAnalysis = checkSymptomCombinations(symptoms);
  
  // Apply combination multiplier if found
  let combinationAdjustedScore = baseScore;
  if (combinationAnalysis.highestMultiplier > 1.0) {
    combinationAdjustedScore = baseScore * combinationAnalysis.highestMultiplier;
  }
  
  // Apply age factor
  const ageCategory = getAgeCategory(age);
  const ageFactor = AGE_FACTORS[ageCategory] || 1.0;
  let ageAdjustedScore = combinationAdjustedScore * ageFactor;
  
  // Apply condition multipliers (compound effect)
  let conditionMultiplier = 1.0;
  const appliedConditions = [];
  
  conditions.forEach(condition => {
    const normalizedCondition = condition.toLowerCase().trim();
    const multiplier = CONDITION_MULTIPLIERS[normalizedCondition];
    if (multiplier) {
      conditionMultiplier *= multiplier;
      appliedConditions.push({ condition, multiplier });
    }
  });
  
  let finalScore = ageAdjustedScore * conditionMultiplier;
  
  // Additional emergency boost for critical combinations
  if (combinationAnalysis.hasCriticalCombination) {
    finalScore *= 1.2; // 20% additional boost for critical patterns
  }
  
  // Cap the score at a reasonable maximum
  finalScore = Math.min(finalScore, 100);
  
  return {
    baseScore: Math.round(baseScore * 10) / 10,
    combinationAdjustedScore: Math.round(combinationAdjustedScore * 10) / 10,
    ageAdjustedScore: Math.round(ageAdjustedScore * 10) / 10,
    finalScore: Math.round(finalScore * 10) / 10,
    ageFactor,
    conditionMultiplier: Math.round(conditionMultiplier * 100) / 100,
    combinationMultiplier: combinationAnalysis.highestMultiplier,
    symptomWeights,
    appliedConditions,
    ageCategory,
    dangerousCombinations: combinationAnalysis.combinations,
    hasCriticalCombination: combinationAnalysis.hasCriticalCombination,
    criticalCombination: combinationAnalysis.criticalCombination
  };
}

// Enhanced risk level determination with more precise thresholds
function getRiskLevel(score, hasCriticalCombination = false, age = null) {
  // Override with critical if dangerous combinations detected
  if (hasCriticalCombination && score >= 25) {
    return 'CRITICAL';
  }
  
  // Age-adjusted thresholds (elderly have lower thresholds)
  let criticalThreshold = 45;
  let highThreshold = 25;
  let moderateThreshold = 12;
  let lowThreshold = 5;
  
  if (age !== null) {
    if (age >= 75) {
      // Very elderly - lower thresholds
      criticalThreshold = 35;
      highThreshold = 20;
      moderateThreshold = 10;
      lowThreshold = 4;
    } else if (age >= 65) {
      // Elderly - slightly lower thresholds
      criticalThreshold = 40;
      highThreshold = 22;
      moderateThreshold = 11;
      lowThreshold = 4.5;
    } else if (age < 5) {
      // Very young - lower thresholds due to vulnerability
      criticalThreshold = 35;
      highThreshold = 20;
      moderateThreshold = 10;
      lowThreshold = 4;
    }
  }
  
  if (score >= criticalThreshold) return 'CRITICAL';
  if (score >= highThreshold) return 'HIGH';
  if (score >= moderateThreshold) return 'MODERATE';
  if (score >= lowThreshold) return 'LOW';
  return 'MINIMAL';
}

// Get risk color for UI
function getRiskColor(level) {
  const colors = {
    'CRITICAL': '#DC2626',  // Red
    'HIGH': '#EA580C',      // Orange
    'MODERATE': '#D97706',  // Amber
    'LOW': '#16A34A',       // Green
    'MINIMAL': '#059669'    // Emerald
  };
  return colors[level] || '#6B7280';
}

// Symptom combination patterns for enhanced accuracy
// These combinations increase risk beyond individual symptom weights
const SYMPTOM_COMBINATIONS = {
  // Cardiovascular emergencies
  'chest_pain_breathing': {
    symptoms: ['chest pain', 'difficulty breathing', 'shortness of breath'],
    multiplier: 1.8,
    urgency: 'critical',
    description: 'Potential heart attack or pulmonary embolism'
  },
  'chest_pain_sweating': {
    symptoms: ['chest pain', 'sweating', 'nausea'],
    multiplier: 1.7,
    urgency: 'critical',
    description: 'Classic heart attack presentation'
  },
  'chest_pain_dizziness': {
    symptoms: ['chest pain', 'dizziness', 'fainting'],
    multiplier: 1.6,
    urgency: 'critical',
    description: 'Cardiac event with hemodynamic compromise'
  },
  
  // Stroke indicators
  'stroke_triad': {
    symptoms: ['severe headache', 'confusion', 'weakness'],
    multiplier: 1.9,
    urgency: 'critical',
    description: 'Potential stroke'
  },
  'stroke_speech': {
    symptoms: ['confusion', 'weakness', 'vision problems'],
    multiplier: 1.8,
    urgency: 'critical',
    description: 'Stroke with neurological deficits'
  },
  
  // Respiratory emergencies
  'severe_respiratory': {
    symptoms: ['difficulty breathing', 'chest pain', 'blue lips/fingers'],
    multiplier: 2.0,
    urgency: 'critical',
    description: 'Severe respiratory distress'
  },
  'asthma_attack': {
    symptoms: ['difficulty breathing', 'wheezing', 'chest tightness'],
    multiplier: 1.6,
    urgency: 'high',
    description: 'Severe asthma exacerbation'
  },
  
  // Infection patterns
  'sepsis_indicators': {
    symptoms: ['high fever', 'confusion', 'severe weakness'],
    multiplier: 1.8,
    urgency: 'critical',
    description: 'Potential sepsis'
  },
  'severe_infection': {
    symptoms: ['high fever', 'chills', 'severe weakness'],
    multiplier: 1.5,
    urgency: 'high',
    description: 'Severe systemic infection'
  },
  'meningitis_signs': {
    symptoms: ['severe headache', 'stiff neck', 'fever'],
    multiplier: 1.9,
    urgency: 'critical',
    description: 'Potential meningitis'
  },
  
  // Gastrointestinal emergencies
  'gi_bleeding': {
    symptoms: ['vomiting', 'blood in stool', 'severe weakness'],
    multiplier: 1.7,
    urgency: 'critical',
    description: 'Gastrointestinal bleeding'
  },
  'severe_dehydration': {
    symptoms: ['persistent vomiting', 'diarrhea', 'dizziness'],
    multiplier: 1.4,
    urgency: 'high',
    description: 'Severe dehydration'
  },
  'appendicitis_signs': {
    symptoms: ['severe abdominal pain', 'fever', 'nausea'],
    multiplier: 1.6,
    urgency: 'high',
    description: 'Potential appendicitis'
  },
  
  // Neurological patterns
  'increased_icp': {
    symptoms: ['severe headache', 'vomiting', 'vision problems'],
    multiplier: 1.7,
    urgency: 'critical',
    description: 'Increased intracranial pressure'
  },
  'seizure_cluster': {
    symptoms: ['seizures', 'confusion', 'weakness'],
    multiplier: 1.6,
    urgency: 'critical',
    description: 'Seizure disorder or brain injury'
  },
  
  // Metabolic emergencies  
  'diabetic_emergency': {
    symptoms: ['confusion', 'severe weakness', 'vomiting'],
    multiplier: 1.5,
    urgency: 'high',
    description: 'Diabetic ketoacidosis or hypoglycemia'
  },
  'thyroid_storm': {
    symptoms: ['high fever', 'palpitations', 'confusion'],
    multiplier: 1.6,
    urgency: 'critical',
    description: 'Thyroid storm'
  },
  
  // Allergic reactions
  'anaphylaxis': {
    symptoms: ['difficulty breathing', 'hives', 'swelling'],
    multiplier: 2.0,
    urgency: 'critical',
    description: 'Anaphylactic reaction'
  },
  'severe_allergy': {
    symptoms: ['hives', 'swelling', 'difficulty breathing'],
    multiplier: 1.8,
    urgency: 'critical',
    description: 'Severe allergic reaction'
  },
  
  // Pregnancy complications
  'preeclampsia': {
    symptoms: ['severe headache', 'vision problems', 'swelling'],
    multiplier: 1.7,
    urgency: 'critical',
    description: 'Potential preeclampsia'
  },
  'pregnancy_bleeding': {
    symptoms: ['abdominal pain', 'bleeding', 'dizziness'],
    multiplier: 1.8,
    urgency: 'critical',
    description: 'Pregnancy complication'
  }
};

// Normalize symptom for consistent matching
function normalizeSymptom(symptom) {
  return symptom.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

// Check for dangerous symptom combinations
function checkSymptomCombinations(symptoms) {
  const normalizedSymptoms = symptoms.map(s => normalizeSymptom(s));
  const matchedCombinations = [];
  let highestMultiplier = 1.0;
  let criticalCombination = null;
  
  for (const [key, combination] of Object.entries(SYMPTOM_COMBINATIONS)) {
    const requiredSymptoms = combination.symptoms;
    let matchCount = 0;
    
    requiredSymptoms.forEach(required => {
      const normalizedRequired = normalizeSymptom(required);
      if (normalizedSymptoms.some(symptom => 
        symptom.includes(normalizedRequired) || normalizedRequired.includes(symptom)
      )) {
        matchCount++;
      }
    });
    
    // If at least 2 out of 3 symptoms match (or all for smaller combinations)
    const threshold = requiredSymptoms.length >= 3 ? 2 : requiredSymptoms.length;
    if (matchCount >= threshold) {
      matchedCombinations.push({
        name: key,
        ...combination,
        matchedCount: matchCount,
        totalRequired: requiredSymptoms.length,
        confidence: matchCount / requiredSymptoms.length
      });
      
      if (combination.multiplier > highestMultiplier) {
        highestMultiplier = combination.multiplier;
        criticalCombination = combination;
      }
    }
  }
  
  return {
    combinations: matchedCombinations,
    highestMultiplier,
    criticalCombination,
    hasCriticalCombination: matchedCombinations.some(c => c.urgency === 'critical')
  };
}

module.exports = {
  SYMPTOM_WEIGHTS,
  AGE_FACTORS,
  CONDITION_MULTIPLIERS,
  SYMPTOM_COMBINATIONS,
  getSymptomWeight,
  getAgeCategory,
  calculateRiskScore,
  getRiskLevel,
  getRiskColor,
  normalizeSymptom,
  checkSymptomCombinations
};