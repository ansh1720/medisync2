/**
 * RiskHistory Model
 * Stores risk assessment results for authenticated users
 */

const mongoose = require('mongoose');

const riskHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  input: {
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
      max: [150, 'Age cannot exceed 150']
    },
    symptoms: {
      type: [String],
      required: [true, 'At least one symptom is required'],
      validate: {
        validator: function(v) {
          return v && v.length > 0;
        },
        message: 'At least one symptom must be provided'
      }
    },
    conditions: {
      type: [String],
      default: []
    },
    location: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      },
      city: String,
      state: String,
      country: String
    },
    additionalInfo: {
      gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say']
      },
      lifestyle: {
        smoking: {
          type: String,
          enum: ['never', 'former', 'current']
        },
        alcohol: {
          type: String,
          enum: ['never', 'occasional', 'moderate', 'heavy']
        },
        exercise: {
          type: String,
          enum: ['sedentary', 'light', 'moderate', 'active', 'very_active']
        }
      },
      familyHistory: [String],
      recentTravel: {
        hasRecent: Boolean,
        destinations: [String],
        travelDates: [{
          destination: String,
          from: Date,
          to: Date
        }]
      }
    }
  },
  result: {
    score: {
      type: Number,
      required: [true, 'Risk score is required'],
      min: [0, 'Risk score cannot be negative'],
      max: [100, 'Risk score cannot exceed 100']
    },
    riskLevel: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: 'Invalid risk level'
      },
      required: [true, 'Risk level is required']
    },
    topDiseases: [{
      diseaseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Disease'
      },
      diseaseName: {
        type: String,
        required: true
      },
      confidence: {
        type: Number,
        min: [0, 'Confidence cannot be negative'],
        max: [100, 'Confidence cannot exceed 100']
      },
      matchingSymptoms: [String],
      riskFactors: [String]
    }],
    recommendations: {
      immediate: [String],
      shortTerm: [String],
      longTerm: [String],
      lifestyle: [String],
      followUp: {
        required: Boolean,
        timeframe: String,
        specialist: String
      }
    },
    factors: {
      symptomScores: [{
        symptom: String,
        weight: Number
      }],
      conditionMultipliers: [{
        condition: String,
        multiplier: Number
      }],
      ageMultiplier: {
        type: Number,
        default: 1.0
      },
      locationRiskFactor: {
        type: Number,
        default: 1.0
      }
    }
  },
  assessment: {
    accuracy: {
      type: String,
      enum: ['very_low', 'low', 'medium', 'high', 'very_high'],
      default: 'medium'
    },
    limitations: [String],
    dataQuality: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent'],
      default: 'good'
    },
    algorithmVersion: {
      type: String,
      default: '1.0'
    }
  },
  userFeedback: {
    helpfulRating: {
      type: Number,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5']
    },
    accuracyRating: {
      type: Number,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5']
    },
    comment: {
      type: String,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    followedRecommendations: {
      type: Boolean
    },
    actualOutcome: {
      type: String,
      enum: ['better', 'same', 'worse', 'sought_medical_help']
    },
    feedbackDate: Date
  },
  followUp: {
    reminderSet: {
      type: Boolean,
      default: false
    },
    reminderDate: Date,
    completed: {
      type: Boolean,
      default: false
    },
    completedDate: Date,
    notes: String
  },
  isSharedWithDoctor: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    permissions: {
      type: String,
      enum: ['view', 'comment', 'full'],
      default: 'view'
    }
  }],
  tags: [String], // For user's own categorization
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
riskHistorySchema.index({ userId: 1 });
riskHistorySchema.index({ createdAt: -1 });
riskHistorySchema.index({ 'result.riskLevel': 1 });
riskHistorySchema.index({ 'result.score': -1 });
riskHistorySchema.index({ 'input.symptoms': 1 });
riskHistorySchema.index({ 'input.conditions': 1 });

// Compound indexes for common queries
riskHistorySchema.index({ userId: 1, createdAt: -1 });
riskHistorySchema.index({ userId: 1, 'result.riskLevel': 1 });
riskHistorySchema.index({ userId: 1, 'followUp.reminderDate': 1 });

// Virtual for time since assessment
riskHistorySchema.virtual('daysSinceAssessment').get(function() {
  const now = new Date();
  const diffTime = now - this.createdAt;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for assessment summary
riskHistorySchema.virtual('summary').get(function() {
  return {
    date: this.createdAt,
    riskLevel: this.result.riskLevel,
    score: this.result.score,
    topDisease: this.result.topDiseases[0]?.diseaseName || 'None identified',
    symptomCount: this.input.symptoms.length
  };
});

// Static method to get risk history for user
riskHistorySchema.statics.getUserHistory = function(userId, options = {}) {
  const {
    page = 1,
    limit = 10,
    riskLevel,
    startDate,
    endDate
  } = options;

  const query = { userId };
  
  if (riskLevel) query['result.riskLevel'] = riskLevel;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  return this.find(query)
    .populate('result.topDiseases.diseaseId', 'name category')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static method to get risk trends
riskHistorySchema.statics.getRiskTrends = function(userId, days = 30) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: dateThreshold }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        avgScore: { $avg: '$result.score' },
        maxScore: { $max: '$result.score' },
        count: { $sum: 1 },
        riskLevels: { $push: '$result.riskLevel' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);
};

// Static method to get common symptoms for user
riskHistorySchema.statics.getCommonSymptoms = function(userId, limit = 10) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $unwind: '$input.symptoms' },
    {
      $group: {
        _id: '$input.symptoms',
        frequency: { $sum: 1 },
        lastReported: { $max: '$createdAt' },
        avgRiskScore: { $avg: '$result.score' }
      }
    },
    { $sort: { frequency: -1, lastReported: -1 } },
    { $limit: limit }
  ]);
};

// Instance method to add feedback
riskHistorySchema.methods.addFeedback = function(feedback) {
  this.userFeedback = {
    ...this.userFeedback,
    ...feedback,
    feedbackDate: new Date()
  };
  return this.save();
};

// Instance method to set reminder
riskHistorySchema.methods.setFollowUpReminder = function(reminderDate, notes = '') {
  this.followUp = {
    reminderSet: true,
    reminderDate: new Date(reminderDate),
    completed: false,
    notes
  };
  return this.save();
};

// Instance method to complete follow-up
riskHistorySchema.methods.completeFollowUp = function(notes = '') {
  this.followUp.completed = true;
  this.followUp.completedDate = new Date();
  if (notes) this.followUp.notes = notes;
  return this.save();
};

// Instance method to share with doctor
riskHistorySchema.methods.shareWithDoctor = function(doctorId, permissions = 'view') {
  // Check if already shared with this doctor
  const existingShare = this.sharedWith.find(
    share => share.doctorId.toString() === doctorId.toString()
  );

  if (!existingShare) {
    this.sharedWith.push({
      doctorId,
      permissions
    });
    this.isSharedWithDoctor = true;
  } else {
    // Update permissions
    existingShare.permissions = permissions;
  }

  return this.save();
};

// Instance method to get risk comparison with previous assessments
riskHistorySchema.methods.compareWithPrevious = async function() {
  const previousAssessments = await this.constructor.find({
    userId: this.userId,
    createdAt: { $lt: this.createdAt }
  })
  .sort({ createdAt: -1 })
  .limit(3);

  if (previousAssessments.length === 0) {
    return { isFirstAssessment: true };
  }

  const latest = previousAssessments[0];
  const scoreDiff = this.result.score - latest.result.score;
  const trend = scoreDiff > 5 ? 'increasing' : scoreDiff < -5 ? 'decreasing' : 'stable';

  return {
    isFirstAssessment: false,
    previousScore: latest.result.score,
    scoreDifference: scoreDiff,
    trend,
    daysSinceLastAssessment: Math.floor((this.createdAt - latest.createdAt) / (1000 * 60 * 60 * 24))
  };
};

module.exports = mongoose.model('RiskHistory', riskHistorySchema);