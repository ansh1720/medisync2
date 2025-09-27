/**
 * Risk Assessment Controller
 * Implements deterministic weighted scoring algorithm for health risk assessment
 * 
 * Algorithm Overview:
 * 1. Base score calculation from symptoms using symptom weights
 * 2. Age factor adjustment (higher risk for elderly and very young)
 * 3. Pre-existing conditions modifier
 * 4. Final score normalization and risk level determination
 */

const { validationResult } = require('express-validator');
const Disease = require('../models/Disease');
const RiskHistory = require('../models/RiskHistory');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const { getSymptomWeight, normalizeSymptom, calculateRiskScore, getRiskLevel } = require('../utils/symptomWeights');

/**
 * Calculate health risk assessment
 * Uses deterministic weighted scoring based on symptoms, age, and conditions
 */
exports.calculateRisk = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: errors.array()
      });
    }

    const { age, symptoms, conditions = [], location, additionalInfo = {} } = req.body;
    const userId = req.user?.id; // Optional authentication

    // Use enhanced risk calculation algorithm
    const riskAnalysis = calculateRiskScore(symptoms, age, conditions);
    const riskLevel = getRiskLevel(riskAnalysis.finalScore, riskAnalysis.hasCriticalCombination, age);
    
    // Calculate risk percentage (0-100%)
    let riskPercentage;
    if (riskLevel === 'minimal') {
      riskPercentage = Math.round((riskAnalysis.finalScore / 5) * 15); // 0-15%
    } else if (riskLevel === 'low') {
      riskPercentage = Math.round(15 + ((riskAnalysis.finalScore - 5) / 7 * 10)); // 15-25%
    } else if (riskLevel === 'moderate') {
      riskPercentage = Math.round(25 + ((riskAnalysis.finalScore - 12) / 13 * 25)); // 25-50%
    } else if (riskLevel === 'high') {
      riskPercentage = Math.round(50 + ((riskAnalysis.finalScore - 25) / 20 * 30)); // 50-80%
    } else { // critical
      riskPercentage = Math.round(80 + ((riskAnalysis.finalScore - 45) / 55 * 20)); // 80-100%
    }
    
    // Cap percentage at 100%
    riskPercentage = Math.min(100, Math.max(0, riskPercentage));
    
    // Create detailed symptom information
    const symptomDetails = symptoms.map(symptom => ({
      original: symptom,
      normalized: normalizeSymptom(symptom),
      weight: getSymptomWeight(symptom)
    }));

    // Step 6: Find potential matching diseases
    const potentialDiseases = await Disease.findBySymptoms(symptoms, { limit: 5 });

    // Step 7: Generate recommendations
    const recommendations = generateRecommendations(riskLevel, symptoms, conditions, age);

    // Step 8: Find nearby hospitals if location provided
    let nearbyHospitals = [];
    if (location) {
      nearbyHospitals = await Hospital.findNearby(
        location.latitude, 
        location.longitude, 
        riskLevel === 'critical' ? 50 : 25, // Larger radius for critical cases
        5
      );
    }

    // Step 9: Calculate next assessment date
    const nextAssessmentDate = calculateNextAssessmentDate(riskLevel);

    // Step 10: Prepare enhanced assessment result
    const assessmentResult = {
      id: new Date().getTime().toString(), // Temporary ID for anonymous users
      timestamp: new Date(),
      riskLevel,
      riskPercentage,
      normalizedScore: riskAnalysis.finalScore,
      breakdown: {
        baseScore: riskAnalysis.baseScore,
        combinationAdjustedScore: riskAnalysis.combinationAdjustedScore,
        ageFactor: riskAnalysis.ageFactor,
        conditionsModifier: riskAnalysis.conditionMultiplier,
        combinationMultiplier: riskAnalysis.combinationMultiplier,
        adjustedScore: riskAnalysis.ageAdjustedScore,
        finalScore: riskAnalysis.finalScore
      },
      symptoms: symptomDetails,
      conditions,
      age,
      ageCategory: riskAnalysis.ageCategory,
      dangerousCombinations: riskAnalysis.dangerousCombinations || [],
      hasCriticalCombination: riskAnalysis.hasCriticalCombination || false,
      criticalCombination: riskAnalysis.criticalCombination,
      potentialDiseases: potentialDiseases.map(disease => ({
        id: disease._id,
        name: disease.name,
        category: disease.category,
        matchingSymptoms: disease.symptoms.filter(s => 
          symptoms.some(userSymptom => 
            normalizeSymptom(userSymptom) === normalizeSymptom(s)
          )
        ),
        description: disease.description
      })),
      recommendations,
      nearbyHospitals: nearbyHospitals.map(hospital => ({
        id: hospital._id,
        name: hospital.name,
        address: hospital.address,
        phone: hospital.contactInfo?.phone,
        distance: hospital.distance,
        hasEmergency: hospital.services?.includes('emergency'),
        isOpen: hospital.isCurrentlyOpen ? hospital.isCurrentlyOpen() : null
      })),
      nextAssessmentDate
    };

    // Step 11: Save to history if user is authenticated
    if (userId) {
      const riskHistory = new RiskHistory({
        userId,
        symptoms,
        conditions,
        age,
        location,
        additionalInfo,
        riskLevel,
        riskPercentage,
        normalizedScore,
        breakdown: assessmentResult.breakdown,
        potentialDiseases: assessmentResult.potentialDiseases.map(d => d.id),
        recommendations,
        nearbyHospitals: assessmentResult.nearbyHospitals.map(h => h.id)
      });

      await riskHistory.save();
      assessmentResult.id = riskHistory._id;
    }

    res.json({
      success: true,
      data: assessmentResult,
      message: `Risk assessment completed. Level: ${riskLevel} (${riskPercentage}%)`
    });

  } catch (error) {
    console.error('Risk calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during risk assessment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get user's risk assessment history
 */
exports.getRiskHistory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 10,
      riskLevel,
      startDate,
      endDate
    } = req.query;

    // Build filter
    const filter = { userId: req.user.id };
    
    if (riskLevel) {
      filter.riskLevel = riskLevel;
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [history, total] = await Promise.all([
      RiskHistory.find(filter)
        .populate('potentialDiseases', 'name category description')
        .populate('nearbyHospitals', 'name address contactInfo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      RiskHistory.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get risk history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving risk history'
    });
  }
};

/**
 * Get specific risk assessment by ID
 */
exports.getRiskAssessmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const assessment = await RiskHistory.findOne({
      _id: id,
      userId: req.user.id
    })
    .populate('potentialDiseases', 'name category description symptoms')
    .populate('nearbyHospitals', 'name address contactInfo services')
    .populate('sharedWith.doctorId', 'name specialties contactInfo');

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Risk assessment not found'
      });
    }

    res.json({
      success: true,
      data: assessment
    });

  } catch (error) {
    console.error('Get risk assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving risk assessment'
    });
  }
};

/**
 * Get user's risk trends over time
 */
exports.getRiskTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const trends = await RiskHistory.aggregate([
      {
        $match: {
          userId: req.user.id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            riskLevel: '$riskLevel'
          },
          count: { $sum: 1 },
          avgRiskPercentage: { $avg: '$riskPercentage' },
          maxRiskPercentage: { $max: '$riskPercentage' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        trends,
        period: `${days} days`,
        startDate,
        endDate: new Date()
      }
    });

  } catch (error) {
    console.error('Get risk trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving risk trends'
    });
  }
};

/**
 * Get user's most common symptoms
 */
exports.getCommonSymptoms = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const commonSymptoms = await RiskHistory.aggregate([
      { $match: { userId: req.user.id } },
      { $unwind: '$symptoms' },
      {
        $group: {
          _id: '$symptoms',
          count: { $sum: 1 },
          lastReported: { $max: '$createdAt' },
          avgRiskLevel: { $avg: '$riskPercentage' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: commonSymptoms
    });

  } catch (error) {
    console.error('Get common symptoms error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving common symptoms'
    });
  }
};

/**
 * Add feedback to risk assessment
 */
exports.addFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback data',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const feedback = req.body;

    const assessment = await RiskHistory.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Risk assessment not found'
      });
    }

    assessment.feedback = {
      ...assessment.feedback,
      ...feedback,
      submittedAt: new Date()
    };

    await assessment.save();

    res.json({
      success: true,
      message: 'Feedback added successfully',
      data: assessment.feedback
    });

  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding feedback'
    });
  }
};

/**
 * Set follow-up reminder
 */
exports.setReminder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reminder data',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { reminderDate, notes } = req.body;

    const assessment = await RiskHistory.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Risk assessment not found'
      });
    }

    assessment.followUpReminder = {
      date: new Date(reminderDate),
      notes,
      isActive: true,
      createdAt: new Date()
    };

    await assessment.save();

    res.json({
      success: true,
      message: 'Reminder set successfully',
      data: assessment.followUpReminder
    });

  } catch (error) {
    console.error('Set reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting reminder'
    });
  }
};

/**
 * Share assessment with doctor
 */
exports.shareWithDoctor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sharing data',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { doctorId, permissions = 'view' } = req.body;

    // Verify doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const assessment = await RiskHistory.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Risk assessment not found'
      });
    }

    // Check if already shared with this doctor
    const existingShare = assessment.sharedWith.find(
      share => share.doctorId.toString() === doctorId
    );

    if (existingShare) {
      existingShare.permissions = permissions;
      existingShare.sharedAt = new Date();
    } else {
      assessment.sharedWith.push({
        doctorId,
        permissions,
        sharedAt: new Date()
      });
    }

    await assessment.save();

    res.json({
      success: true,
      message: 'Assessment shared with doctor successfully'
    });

  } catch (error) {
    console.error('Share assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sharing assessment'
    });
  }
};

/**
 * Delete risk assessment
 */
exports.deleteRiskAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await RiskHistory.findOneAndDelete({
      _id: id,
      userId: req.user.id
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Risk assessment not found'
      });
    }

    res.json({
      success: true,
      message: 'Risk assessment deleted successfully'
    });

  } catch (error) {
    console.error('Delete assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting assessment'
    });
  }
};

/**
 * Get current symptom weights (for transparency)
 */
exports.getSymptomWeights = async (req, res) => {
  try {
    // This could be moved to a configuration file or database
    const weights = {
      // Respiratory symptoms
      'difficulty breathing': 8,
      'shortness of breath': 8,
      'chest pain': 7,
      'cough': 4,
      'wheezing': 6,
      
      // Cardiovascular symptoms
      'heart palpitations': 7,
      'chest pressure': 7,
      'rapid heartbeat': 6,
      
      // Neurological symptoms
      'severe headache': 6,
      'confusion': 7,
      'dizziness': 5,
      'fainting': 8,
      'seizures': 9,
      
      // Systemic symptoms
      'high fever': 6,
      'fever': 4,
      'chills': 3,
      'fatigue': 3,
      'weakness': 3,
      
      // Gastrointestinal
      'severe abdominal pain': 7,
      'vomiting blood': 9,
      'persistent vomiting': 6,
      'nausea': 2,
      'diarrhea': 3,
      
      // Other critical symptoms
      'loss of consciousness': 10,
      'severe bleeding': 9,
      'inability to speak': 8,
      'paralysis': 9
    };

    res.json({
      success: true,
      data: {
        weights,
        lastUpdated: '2024-01-01',
        version: '1.0',
        description: 'Symptom weights used in risk assessment algorithm'
      }
    });

  } catch (error) {
    console.error('Get symptom weights error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving symptom weights'
    });
  }
};

// Helper functions

function generateRecommendations(riskLevel, symptoms, conditions, age) {
  const recommendations = {
    immediate: [],
    shortTerm: [],
    lifestyle: []
  };

  switch (riskLevel) {
    case 'critical':
      recommendations.immediate.push('Seek immediate emergency medical attention');
      recommendations.immediate.push('Call emergency services or go to the nearest ER');
      recommendations.immediate.push('Do not drive yourself - call ambulance or have someone drive you');
      break;

    case 'high':
      recommendations.immediate.push('Contact your doctor today or visit urgent care');
      recommendations.immediate.push('Monitor symptoms closely');
      recommendations.shortTerm.push('Schedule follow-up appointment within 24-48 hours');
      break;

    case 'medium':
      recommendations.immediate.push('Consider scheduling a doctor appointment');
      recommendations.shortTerm.push('Monitor symptoms for 24-48 hours');
      recommendations.shortTerm.push('Seek medical care if symptoms worsen');
      break;

    case 'low':
      recommendations.shortTerm.push('Monitor symptoms');
      recommendations.shortTerm.push('Consider self-care measures');
      break;
  }

  // Age-specific recommendations
  if (age < 2) {
    recommendations.immediate.unshift('Infants require immediate medical evaluation');
  } else if (age > 65) {
    recommendations.shortTerm.push('Elderly individuals should be more cautious with symptoms');
  }

  // Condition-specific recommendations
  if (conditions.includes('diabetes')) {
    recommendations.lifestyle.push('Monitor blood sugar levels closely');
  }
  if (conditions.includes('hypertension')) {
    recommendations.lifestyle.push('Monitor blood pressure regularly');
  }

  // General lifestyle recommendations
  recommendations.lifestyle.push('Stay hydrated');
  recommendations.lifestyle.push('Get adequate rest');
  recommendations.lifestyle.push('Maintain a healthy diet');

  return recommendations;
}

function calculateNextAssessmentDate(riskLevel) {
  const now = new Date();
  const nextDate = new Date(now);

  switch (riskLevel) {
    case 'critical':
      nextDate.setHours(now.getHours() + 4); // 4 hours
      break;
    case 'high':
      nextDate.setHours(now.getHours() + 12); // 12 hours
      break;
    case 'medium':
      nextDate.setDate(now.getDate() + 1); // 1 day
      break;
    case 'low':
      nextDate.setDate(now.getDate() + 3); // 3 days
      break;
  }

  return nextDate;
}