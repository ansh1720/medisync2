/**
 * Medical equipment reading interpretation utilities
 * Contains configurable thresholds and interpretation logic
 */

// Blood Pressure thresholds (mmHg)
const bloodPressureThresholds = {
  normal: { systolic: [90, 120], diastolic: [60, 80] },
  elevated: { systolic: [120, 129], diastolic: [60, 80] },
  stage1: { systolic: [130, 139], diastolic: [80, 89] },
  stage2: { systolic: [140, 180], diastolic: [90, 120] },
  crisis: { systolic: [180, 300], diastolic: [120, 200] }
};

// Blood Sugar thresholds (mg/dL)
const bloodSugarThresholds = {
  fasting: {
    normal: [70, 100],
    prediabetes: [100, 125],
    diabetes: [126, 400]
  },
  nonFasting: {
    normal: [70, 140],
    prediabetes: [140, 199],
    diabetes: [200, 400]
  },
  random: {
    normal: [70, 140],
    prediabetes: [140, 199],
    diabetes: [200, 400]
  }
};

// Blood Oxygen (SpO2) thresholds (%)
const oxygenThresholds = {
  normal: [95, 100],
  mild: [90, 94],
  moderate: [85, 89],
  severe: [0, 84]
};

// Body Temperature thresholds (°F)
const temperatureThresholds = {
  hypothermia: [90, 95],
  normal: [97, 99.5],
  lowFever: [99.5, 100.4],
  fever: [100.4, 102.2],
  highFever: [102.2, 104],
  dangerous: [104, 110]
};

// Heart Rate thresholds (BPM)
const heartRateThresholds = {
  bradycardia: [30, 60],
  normal: [60, 100],
  tachycardia: [100, 150],
  dangerous: [150, 250]
};

/**
 * Interpret Blood Pressure reading
 */
const interpretBloodPressure = (systolic, diastolic) => {
  if (!systolic || !diastolic || systolic < 50 || diastolic < 30) {
    return {
      status: 'critical',
      interpretation: 'Invalid blood pressure reading',
      suggestedAction: 'Please retake the measurement or consult a healthcare provider'
    };
  }

  // Check for hypertensive crisis
  if (systolic >= bloodPressureThresholds.crisis.systolic[0] || 
      diastolic >= bloodPressureThresholds.crisis.diastolic[0]) {
    return {
      status: 'critical',
      interpretation: 'Hypertensive Crisis - Extremely high blood pressure',
      suggestedAction: 'Seek immediate emergency medical attention. Call 911 or go to the nearest emergency room.'
    };
  }

  // Check for Stage 2 Hypertension
  if (systolic >= bloodPressureThresholds.stage2.systolic[0] || 
      diastolic >= bloodPressureThresholds.stage2.diastolic[0]) {
    return {
      status: 'warning',
      interpretation: 'Stage 2 Hypertension - High blood pressure',
      suggestedAction: 'Consult your doctor promptly. You may need medication adjustments or new treatment.'
    };
  }

  // Check for Stage 1 Hypertension
  if (systolic >= bloodPressureThresholds.stage1.systolic[0] || 
      diastolic >= bloodPressureThresholds.stage1.diastolic[0]) {
    return {
      status: 'warning',
      interpretation: 'Stage 1 Hypertension - Elevated blood pressure',
      suggestedAction: 'Schedule an appointment with your healthcare provider. Consider lifestyle changes and monitor regularly.'
    };
  }

  // Check for Elevated BP
  if (systolic >= bloodPressureThresholds.elevated.systolic[0] && 
      diastolic <= bloodPressureThresholds.elevated.diastolic[1]) {
    return {
      status: 'warning',
      interpretation: 'Elevated Blood Pressure',
      suggestedAction: 'Focus on lifestyle changes: healthy diet, regular exercise, stress management, and weight control.'
    };
  }

  // Check for Low BP
  if (systolic < bloodPressureThresholds.normal.systolic[0] || 
      diastolic < bloodPressureThresholds.normal.diastolic[0]) {
    return {
      status: 'warning',
      interpretation: 'Low Blood Pressure (Hypotension)',
      suggestedAction: 'Monitor symptoms like dizziness or fainting. Consult your doctor if symptoms persist.'
    };
  }

  // Normal range
  return {
    status: 'normal',
    interpretation: 'Normal Blood Pressure',
    suggestedAction: 'Maintain healthy lifestyle habits and continue regular monitoring.'
  };
};

/**
 * Interpret Blood Sugar reading
 */
const interpretBloodSugar = (value, context = 'random') => {
  if (!value || value < 20 || value > 600) {
    return {
      status: 'critical',
      interpretation: 'Invalid blood sugar reading',
      suggestedAction: 'Please retake the measurement or consult a healthcare provider'
    };
  }

  const thresholds = bloodSugarThresholds[context] || bloodSugarThresholds.random;

  // Dangerous levels
  if (value < 50) {
    return {
      status: 'critical',
      interpretation: 'Severe Hypoglycemia - Dangerously low blood sugar',
      suggestedAction: 'Seek immediate medical attention. Consume fast-acting carbohydrates if conscious.'
    };
  }

  if (value > 300) {
    return {
      status: 'critical',
      interpretation: 'Severe Hyperglycemia - Dangerously high blood sugar',
      suggestedAction: 'Seek immediate medical attention. Risk of diabetic ketoacidosis.'
    };
  }

  // Check thresholds based on context
  if (value >= thresholds.diabetes[0]) {
    return {
      status: 'warning',
      interpretation: `High blood sugar (${context === 'fasting' ? 'Fasting' : 'Non-fasting'}) - Diabetes range`,
      suggestedAction: 'Consult your healthcare provider. You may need medication adjustment or diabetes management.'
    };
  }

  if (value >= thresholds.prediabetes[0]) {
    return {
      status: 'warning',
      interpretation: `Elevated blood sugar (${context === 'fasting' ? 'Fasting' : 'Non-fasting'}) - Prediabetes range`,
      suggestedAction: 'Focus on lifestyle changes: healthy diet, regular exercise, and weight management.'
    };
  }

  if (value < 70) {
    return {
      status: 'warning',
      interpretation: 'Low blood sugar (Hypoglycemia)',
      suggestedAction: 'Consume fast-acting carbohydrates and monitor symptoms. Consult your doctor if frequent.'
    };
  }

  return {
    status: 'normal',
    interpretation: `Normal blood sugar (${context === 'fasting' ? 'Fasting' : 'Non-fasting'})`,
    suggestedAction: 'Continue healthy lifestyle habits and regular monitoring.'
  };
};

/**
 * Interpret Blood Oxygen reading
 */
const interpretOxygen = (value) => {
  if (!value || value < 50 || value > 100) {
    return {
      status: 'critical',
      interpretation: 'Invalid oxygen saturation reading',
      suggestedAction: 'Please retake the measurement or consult a healthcare provider'
    };
  }

  if (value <= oxygenThresholds.severe[1]) {
    return {
      status: 'critical',
      interpretation: 'Severe Hypoxemia - Critically low oxygen levels',
      suggestedAction: 'Seek immediate emergency medical attention. Call 911 or go to the nearest emergency room.'
    };
  }

  if (value <= oxygenThresholds.moderate[1]) {
    return {
      status: 'critical',
      interpretation: 'Moderate Hypoxemia - Low oxygen levels',
      suggestedAction: 'Seek prompt medical attention. You may need supplemental oxygen.'
    };
  }

  if (value <= oxygenThresholds.mild[1]) {
    return {
      status: 'warning',
      interpretation: 'Mild Hypoxemia - Below normal oxygen levels',
      suggestedAction: 'Consult your healthcare provider. Monitor for breathing difficulties.'
    };
  }

  return {
    status: 'normal',
    interpretation: 'Normal oxygen saturation',
    suggestedAction: 'Continue monitoring and maintain good respiratory health.'
  };
};

/**
 * Interpret Temperature reading
 */
const interpretTemperature = (value, unit = 'F') => {
  // Convert Celsius to Fahrenheit if needed
  if (unit === 'C') {
    value = (value * 9/5) + 32;
  }

  if (!value || value < 85 || value > 115) {
    return {
      status: 'critical',
      interpretation: 'Invalid temperature reading',
      suggestedAction: 'Please retake the measurement or consult a healthcare provider'
    };
  }

  if (value >= temperatureThresholds.dangerous[0]) {
    return {
      status: 'critical',
      interpretation: 'Dangerous Hyperthermia - Extremely high fever',
      suggestedAction: 'Seek immediate emergency medical attention. Risk of heat stroke or severe infection.'
    };
  }

  if (value >= temperatureThresholds.highFever[0]) {
    return {
      status: 'critical',
      interpretation: 'High Fever',
      suggestedAction: 'Seek medical attention promptly. Take fever reducers and stay hydrated.'
    };
  }

  if (value >= temperatureThresholds.fever[0]) {
    return {
      status: 'warning',
      interpretation: 'Fever',
      suggestedAction: 'Monitor temperature, rest, stay hydrated. Consult doctor if fever persists or worsens.'
    };
  }

  if (value >= temperatureThresholds.lowFever[0]) {
    return {
      status: 'warning',
      interpretation: 'Low-grade fever',
      suggestedAction: 'Monitor temperature and symptoms. Rest and stay hydrated.'
    };
  }

  if (value <= temperatureThresholds.hypothermia[1]) {
    return {
      status: 'critical',
      interpretation: 'Hypothermia - Dangerously low body temperature',
      suggestedAction: 'Seek immediate medical attention. Warm the body gradually and avoid direct heat.'
    };
  }

  return {
    status: 'normal',
    interpretation: 'Normal body temperature',
    suggestedAction: 'Temperature is within normal range. Continue monitoring if feeling unwell.'
  };
};

/**
 * Interpret Heart Rate reading
 */
const interpretHeartRate = (value, age = null) => {
  if (!value || value < 30 || value > 300) {
    return {
      status: 'critical',
      interpretation: 'Invalid heart rate reading',
      suggestedAction: 'Please retake the measurement or consult a healthcare provider'
    };
  }

  // Adjust thresholds slightly for age if provided
  let normalRange = heartRateThresholds.normal;
  if (age) {
    if (age > 65) {
      normalRange = [50, 100]; // Slightly lower for elderly
    } else if (age < 18) {
      normalRange = [70, 120]; // Higher for children/teens
    }
  }

  if (value >= heartRateThresholds.dangerous[0]) {
    return {
      status: 'critical',
      interpretation: 'Dangerous Tachycardia - Extremely high heart rate',
      suggestedAction: 'Seek immediate emergency medical attention. Call 911 or go to the nearest emergency room.'
    };
  }

  if (value >= heartRateThresholds.tachycardia[0]) {
    return {
      status: 'warning',
      interpretation: 'Tachycardia - High heart rate',
      suggestedAction: 'Consult your healthcare provider. Monitor for symptoms like chest pain or dizziness.'
    };
  }

  if (value <= heartRateThresholds.bradycardia[1]) {
    return {
      status: 'warning',
      interpretation: 'Bradycardia - Low heart rate',
      suggestedAction: 'Consult your healthcare provider, especially if experiencing dizziness or fatigue.'
    };
  }

  if (value < 40) {
    return {
      status: 'critical',
      interpretation: 'Severe Bradycardia - Dangerously low heart rate',
      suggestedAction: 'Seek immediate medical attention. Risk of inadequate blood circulation.'
    };
  }

  return {
    status: 'normal',
    interpretation: 'Normal heart rate',
    suggestedAction: 'Heart rate is within normal range. Continue regular monitoring.'
  };
};

/**
 * Main interpretation function - routes to appropriate interpreter
 */
const interpretReading = (type, value, context = null, age = null) => {
  switch (type.toLowerCase()) {
    case 'bp':
    case 'bloodpressure':
      if (typeof value === 'object' && value.systolic && value.diastolic) {
        return interpretBloodPressure(value.systolic, value.diastolic);
      }
      throw new Error('Blood pressure requires systolic and diastolic values');

    case 'sugar':
    case 'glucose':
    case 'bloodsugar':
      return interpretBloodSugar(value, context);

    case 'oxygen':
    case 'spo2':
    case 'oxygensaturation':
      return interpretOxygen(value);

    case 'temperature':
    case 'temp':
      return interpretTemperature(value, context);

    case 'heartrate':
    case 'pulse':
    case 'hr':
      return interpretHeartRate(value, age);

    default:
      throw new Error(`Unsupported equipment type: ${type}`);
  }
};

module.exports = {
  interpretReading,
  interpretBloodPressure,
  interpretBloodSugar,
  interpretOxygen,
  interpretTemperature,
  interpretHeartRate,
  // Export thresholds for configuration
  bloodPressureThresholds,
  bloodSugarThresholds,
  oxygenThresholds,
  temperatureThresholds,
  heartRateThresholds
};