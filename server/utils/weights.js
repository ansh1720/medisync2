/**
 * Symptom Weights Utility
 * Provides weighted scoring system for risk assessment
 * Used by the risk assessment API to calculate disease probability
 */

/**
 * Symptom weight map with seeded default weights (0-10 scale)
 * Higher weights indicate more serious or specific symptoms
 */
const symptomWeights = {
  // High-priority symptoms (8-10)
  'chest pain': 10,
  'difficulty breathing': 10,
  'severe headache': 9,
  'high fever': 9,
  'blood in stool': 9,
  'blood in urine': 9,
  'seizures': 10,
  'loss of consciousness': 10,
  'severe abdominal pain': 9,
  'shortness of breath': 9,
  'irregular heartbeat': 8,
  'severe dizziness': 8,

  // Medium-high priority symptoms (6-7)
  'persistent cough': 7,
  'fever': 7,
  'vomiting': 6,
  'diarrhea': 6,
  'headache': 6,
  'muscle pain': 6,
  'joint pain': 6,
  'sore throat': 6,
  'rash': 6,
  'swelling': 7,
  'numbness': 7,
  'blurred vision': 7,

  // Medium priority symptoms (4-5)
  'fatigue': 5,
  'nausea': 5,
  'runny nose': 4,
  'sneezing': 4,
  'mild cough': 4,
  'congestion': 4,
  'loss of appetite': 5,
  'insomnia': 4,
  'mild headache': 4,
  'stomach ache': 5,
  'constipation': 4,
  'mild dizziness': 4,

  // Low priority symptoms (2-3)
  'stuffy nose': 3,
  'itchy eyes': 3,
  'dry mouth': 3,
  'mild nausea': 3,
  'restlessness': 2,
  'mild anxiety': 3,
  'minor aches': 2,
  'slight temperature': 3,

  // General symptoms (1-2)
  'general discomfort': 2,
  'mild irritation': 1,
  'feeling unwell': 2
};

/**
 * Condition multipliers for risk calculation
 * These multiply the base symptom scores for patients with pre-existing conditions
 */
const conditionMultipliers = {
  'diabetes': 1.3,
  'hypertension': 1.2,
  'heart disease': 1.4,
  'lung disease': 1.3,
  'kidney disease': 1.3,
  'liver disease': 1.2,
  'cancer': 1.5,
  'autoimmune disorder': 1.3,
  'immunocompromised': 1.4,
  'obesity': 1.2,
  'asthma': 1.3,
  'copd': 1.4,
  'stroke history': 1.2,
  'blood clotting disorder': 1.3,
  'mental health condition': 1.1
};

/**
 * Age risk multipliers
 * Risk increases with age for most conditions
 */
const ageMultipliers = {
  '0-17': 0.8,    // Children generally lower risk for most adult diseases
  '18-29': 1.0,   // Baseline
  '30-39': 1.1,
  '40-49': 1.2,
  '50-59': 1.3,
  '60-69': 1.4,
  '70-79': 1.6,
  '80+': 1.8
};

/**
 * Get symptom weight by name
 * @param {string} symptom - Symptom name (case-insensitive)
 * @returns {number} Weight value (1-10), defaults to 3 if not found
 */
const getSymptomWeight = (symptom) => {
  const normalizedSymptom = symptom.toLowerCase().trim();
  return symptomWeights[normalizedSymptom] || 3; // Default weight for unknown symptoms
};

/**
 * Get condition multiplier
 * @param {string} condition - Medical condition name
 * @returns {number} Multiplier value, defaults to 1.0 if not found
 */
const getConditionMultiplier = (condition) => {
  const normalizedCondition = condition.toLowerCase().trim();
  return conditionMultipliers[normalizedCondition] || 1.0;
};

/**
 * Get age-based risk multiplier
 * @param {number} age - Patient age
 * @returns {number} Age multiplier
 */
const getAgeMultiplier = (age) => {
  if (age < 18) return ageMultipliers['0-17'];
  if (age < 30) return ageMultipliers['18-29'];
  if (age < 40) return ageMultipliers['30-39'];
  if (age < 50) return ageMultipliers['40-49'];
  if (age < 60) return ageMultipliers['50-59'];
  if (age < 70) return ageMultipliers['60-69'];
  if (age < 80) return ageMultipliers['70-79'];
  return ageMultipliers['80+'];
};

/**
 * Calculate total risk score based on symptoms, conditions, and age
 * @param {Array} symptoms - Array of symptom strings
 * @param {Array} conditions - Array of pre-existing conditions
 * @param {number} age - Patient age
 * @returns {Object} Risk calculation result
 */
const calculateRiskScore = (symptoms = [], conditions = [], age = 30) => {
  // Calculate base symptom score
  let baseScore = 0;
  const symptomScores = [];

  symptoms.forEach(symptom => {
    const weight = getSymptomWeight(symptom);
    baseScore += weight;
    symptomScores.push({
      symptom: symptom.toLowerCase().trim(),
      weight
    });
  });

  // Apply condition multipliers
  let conditionMultiplier = 1.0;
  const appliedConditions = [];

  conditions.forEach(condition => {
    const multiplier = getConditionMultiplier(condition);
    if (multiplier > 1.0) {
      conditionMultiplier *= multiplier;
      appliedConditions.push({
        condition: condition.toLowerCase().trim(),
        multiplier
      });
    }
  });

  // Apply age multiplier
  const ageMultiplier = getAgeMultiplier(age);

  // Calculate final score
  const adjustedScore = baseScore * conditionMultiplier * ageMultiplier;

  // Normalize to 0-100 scale (assuming max possible score with severe symptoms)
  const maxPossibleScore = 200; // Theoretical maximum for severe cases
  const normalizedScore = Math.min(100, (adjustedScore / maxPossibleScore) * 100);

  // Determine risk level
  let riskLevel;
  if (normalizedScore < 20) {
    riskLevel = 'low';
  } else if (normalizedScore < 50) {
    riskLevel = 'medium';
  } else if (normalizedScore < 80) {
    riskLevel = 'high';
  } else {
    riskLevel = 'critical';
  }

  return {
    baseScore,
    adjustedScore,
    normalizedScore: Math.round(normalizedScore * 100) / 100,
    riskLevel,
    factors: {
      symptomScores,
      appliedConditions,
      ageGroup: getAgeGroup(age),
      ageMultiplier,
      totalConditionMultiplier: Math.round(conditionMultiplier * 100) / 100
    },
    recommendations: generateRecommendations(riskLevel, normalizedScore)
  };
};

/**
 * Get age group string for display
 * @param {number} age - Patient age
 * @returns {string} Age group
 */
const getAgeGroup = (age) => {
  if (age < 18) return '0-17';
  if (age < 30) return '18-29';
  if (age < 40) return '30-39';
  if (age < 50) return '40-49';
  if (age < 60) return '50-59';
  if (age < 70) return '60-69';
  if (age < 80) return '70-79';
  return '80+';
};

/**
 * Generate recommendations based on risk level
 * @param {string} riskLevel - Risk level (low, medium, high, critical)
 * @param {number} score - Normalized risk score
 * @returns {Array} Array of recommendation strings
 */
const generateRecommendations = (riskLevel, score) => {
  const recommendations = [];

  switch (riskLevel) {
    case 'low':
      recommendations.push('Monitor symptoms and rest');
      recommendations.push('Stay hydrated and maintain good hygiene');
      recommendations.push('Consult a healthcare provider if symptoms worsen');
      break;

    case 'medium':
      recommendations.push('Schedule a consultation with a healthcare provider');
      recommendations.push('Monitor symptoms closely');
      recommendations.push('Avoid strenuous activities');
      recommendations.push('Consider over-the-counter remedies for symptom relief');
      break;

    case 'high':
      recommendations.push('Seek medical attention promptly');
      recommendations.push('Schedule an appointment with your doctor today');
      recommendations.push('Avoid self-medication without professional advice');
      recommendations.push('Keep a symptom diary');
      break;

    case 'critical':
      recommendations.push('Seek immediate medical attention');
      recommendations.push('Consider visiting an emergency room');
      recommendations.push('Do not delay medical care');
      recommendations.push('Have someone accompany you to the hospital');
      break;
  }

  return recommendations;
};

/**
 * Add or update symptom weight
 * @param {string} symptom - Symptom name
 * @param {number} weight - Weight value (1-10)
 */
const updateSymptomWeight = (symptom, weight) => {
  if (weight < 1 || weight > 10) {
    throw new Error('Weight must be between 1 and 10');
  }
  symptomWeights[symptom.toLowerCase().trim()] = weight;
};

/**
 * Get all symptom weights
 * @returns {Object} Complete symptom weights object
 */
const getAllSymptomWeights = () => {
  return { ...symptomWeights };
};

/**
 * Get all condition multipliers
 * @returns {Object} Complete condition multipliers object
 */
const getAllConditionMultipliers = () => {
  return { ...conditionMultipliers };
};

module.exports = {
  symptomWeights,
  conditionMultipliers,
  ageMultipliers,
  getSymptomWeight,
  getConditionMultiplier,
  getAgeMultiplier,
  calculateRiskScore,
  getAgeGroup,
  generateRecommendations,
  updateSymptomWeight,
  getAllSymptomWeights,
  getAllConditionMultipliers
};