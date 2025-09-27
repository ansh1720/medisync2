/**
 * Equipment Reading Model
 * Stores medical device readings with interpretation and alerts
 */

const mongoose = require('mongoose');

const equipmentReadingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  equipmentType: {
    type: String,
    required: true,
    enum: [
      'blood_pressure', 'thermometer', 'pulse_oximeter', 
      'glucometer', 'ecg_monitor', 'peak_flow_meter', 
      'weight_scale', 'heart_rate_monitor'
    ],
    index: true
  },
  
  // Raw readings from device
  readings: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    validate: {
      validator: function(readings) {
        return validateReadingsByType(this.equipmentType, readings);
      },
      message: 'Invalid readings for equipment type'
    }
  },
  
  // Device information
  deviceInfo: {
    model: {
      type: String,
      trim: true,
      maxlength: 100
    },
    serialNumber: {
      type: String,
      trim: true,
      maxlength: 50
    },
    manufacturer: {
      type: String,
      trim: true,
      maxlength: 50
    },
    firmware: {
      type: String,
      trim: true,
      maxlength: 20
    },
    calibrationDate: Date
  },
  
  // Interpretation results
  interpretation: {
    status: {
      type: String,
      enum: ['normal', 'borderline', 'abnormal', 'critical'],
      required: false
    },
    category: {
      type: String, // e.g., 'hypertensive', 'hypotensive', 'tachycardic'
      trim: true
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500
    },
    recommendations: [String],
    referenceRanges: {
      type: mongoose.Schema.Types.Mixed
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 1.0
    }
  },
  
  // Alert information
  alert: {
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    message: String,
    actionRequired: Boolean,
    acknowledged: {
      status: {
        type: Boolean,
        default: false
      },
      acknowledgedAt: Date,
      notes: String
    }
  },
  
  // Metadata
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[1] >= -90 && coords[1] <= 90 && 
                 coords[0] >= -180 && coords[0] <= 180;
        },
        message: 'Invalid coordinates format'
      }
    }
  },
  
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Quality indicators
  quality: {
    signalQuality: {
      type: Number,
      min: 0,
      max: 100
    },
    measurementReliability: {
      type: String,
      enum: ['high', 'medium', 'low']
    },
    artifacts: [String], // e.g., 'motion', 'irregular_rhythm'
    validated: {
      type: Boolean,
      default: false
    }
  },
  
  // Sharing information
  sharedWith: [{
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    message: String,
    permissions: {
      type: String,
      enum: ['view', 'comment', 'full'],
      default: 'view'
    }
  }],
  
  // File attachments (e.g., ECG strips)
  attachments: [{
    filename: String,
    contentType: String,
    size: Number,
    data: Buffer,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
equipmentReadingSchema.index({ userId: 1, equipmentType: 1, timestamp: -1 });
equipmentReadingSchema.index({ timestamp: -1 });
equipmentReadingSchema.index({ 'interpretation.status': 1 });
equipmentReadingSchema.index({ 'alert.severity': 1 });
equipmentReadingSchema.index({ location: '2dsphere' });

// Virtual for reading age
equipmentReadingSchema.virtual('age').get(function() {
  return Date.now() - this.timestamp;
});

// Virtual for formatted readings
equipmentReadingSchema.virtual('formattedReadings').get(function() {
  return formatReadingsByType(this.equipmentType, this.readings);
});

// Static method: Get user's latest readings by equipment type
equipmentReadingSchema.statics.getLatestByType = function(userId, equipmentType, limit = 10) {
  return this.find({ 
    userId, 
    ...(equipmentType && { equipmentType }) 
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .populate('sharedWith.doctorId', 'name specialties');
};

// Static method: Get readings within date range
equipmentReadingSchema.statics.getReadingsInRange = function(userId, startDate, endDate, equipmentType) {
  const query = {
    userId,
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (equipmentType) {
    query.equipmentType = equipmentType;
  }
  
  return this.find(query).sort({ timestamp: 1 });
};

// Static method: Get analytics for readings
equipmentReadingSchema.statics.getAnalytics = function(userId, equipmentType, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const matchStage = {
    userId,
    timestamp: { $gte: startDate }
  };
  
  if (equipmentType) {
    matchStage.equipmentType = equipmentType;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          equipmentType: '$equipmentType',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
        },
        count: { $sum: 1 },
        normalCount: {
          $sum: { $cond: [{ $eq: ['$interpretation.status', 'normal'] }, 1, 0] }
        },
        abnormalCount: {
          $sum: { $cond: [{ $ne: ['$interpretation.status', 'normal'] }, 1, 0] }
        },
        avgReadings: { $push: '$readings' }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);
};

// Static method: Get active alerts
equipmentReadingSchema.statics.getActiveAlerts = function(userId, severity) {
  const query = {
    userId,
    'alert.severity': { $exists: true },
    'alert.acknowledged.status': false
  };
  
  if (severity) {
    query['alert.severity'] = severity;
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(50);
};

// Instance method: Acknowledge alert
equipmentReadingSchema.methods.acknowledgeAlert = function(notes) {
  this.alert.acknowledged = {
    status: true,
    acknowledgedAt: new Date(),
    notes: notes || ''
  };
  return this.save();
};

// Instance method: Share with doctor
equipmentReadingSchema.methods.shareWithDoctor = function(doctorId, message, permissions = 'view') {
  // Check if already shared with this doctor
  const existingShare = this.sharedWith.find(
    share => share.doctorId.toString() === doctorId.toString()
  );
  
  if (existingShare) {
    existingShare.message = message;
    existingShare.permissions = permissions;
    existingShare.sharedAt = new Date();
  } else {
    this.sharedWith.push({
      doctorId,
      message,
      permissions,
      sharedAt: new Date()
    });
  }
  
  return this.save();
};

// Pre-save middleware: Auto-interpret readings
equipmentReadingSchema.pre('save', function(next) {
  console.log('Pre-save middleware called for equipment type:', this.equipmentType); // Debug
  console.log('Readings:', this.readings); // Debug
  
  if (this.isModified('readings') || this.isNew) {
    try {
      console.log('About to interpret reading...'); // Debug
      const interpretation = interpretReading(this.equipmentType, this.readings);
      console.log('Interpretation result:', interpretation); // Debug
      this.interpretation = interpretation;
      
      // Generate alert if abnormal
      if (interpretation.status === 'abnormal' || interpretation.status === 'critical') {
        this.alert = generateAlert(this.equipmentType, this.readings, interpretation);
      }
    } catch (error) {
      console.error('Error in pre-save middleware:', error); // Debug
      return next(error);
    }
  }
  next();
});

// Validation function for readings by equipment type
function validateReadingsByType(equipmentType, readings) {
  const validators = {
    blood_pressure: (r) => {
      return r.systolic && r.diastolic &&
             typeof r.systolic === 'number' && typeof r.diastolic === 'number' &&
             r.systolic >= 50 && r.systolic <= 300 &&
             r.diastolic >= 30 && r.diastolic <= 200 &&
             r.systolic > r.diastolic;
    },
    
    thermometer: (r) => {
      return r.temperature && typeof r.temperature === 'number' &&
             r.temperature >= 90 && r.temperature <= 110; // Fahrenheit
    },
    
    pulse_oximeter: (r) => {
      return r.oxygenSaturation && r.heartRate &&
             typeof r.oxygenSaturation === 'number' && typeof r.heartRate === 'number' &&
             r.oxygenSaturation >= 70 && r.oxygenSaturation <= 100 &&
             r.heartRate >= 30 && r.heartRate <= 250;
    },
    
    glucometer: (r) => {
      return r.glucoseLevel && typeof r.glucoseLevel === 'number' &&
             r.glucoseLevel >= 20 && r.glucoseLevel <= 600; // mg/dL
    },
    
    heart_rate_monitor: (r) => {
      return r.heartRate && typeof r.heartRate === 'number' &&
             r.heartRate >= 30 && r.heartRate <= 250;
    },
    
    weight_scale: (r) => {
      return r.weight && typeof r.weight === 'number' &&
             r.weight >= 1 && r.weight <= 1000; // kg
    },
    
    peak_flow_meter: (r) => {
      return r.peakFlow && typeof r.peakFlow === 'number' &&
             r.peakFlow >= 50 && r.peakFlow <= 900; // L/min
    },
    
    ecg_monitor: (r) => {
      return r.heartRate && typeof r.heartRate === 'number' &&
             r.heartRate >= 30 && r.heartRate <= 250;
    }
  };
  
  return validators[equipmentType] ? validators[equipmentType](readings) : false;
}

// Reading interpretation function
function interpretReading(equipmentType, readings) {
  const interpreters = {
    blood_pressure: (r) => {
      const { systolic, diastolic } = r;
      
      if (systolic >= 180 || diastolic >= 110) {
        return {
          status: 'critical',
          category: 'hypertensive_crisis',
          message: 'Dangerously high blood pressure - seek immediate medical attention',
          recommendations: ['Call emergency services', 'Do not delay treatment'],
          confidence: 0.95
        };
      } else if (systolic >= 140 || diastolic >= 90) {
        return {
          status: 'abnormal',
          category: 'hypertensive',
          message: 'High blood pressure detected',
          recommendations: ['Consult with doctor', 'Monitor regularly', 'Consider lifestyle changes'],
          confidence: 0.9
        };
      } else if (systolic >= 130 || diastolic >= 80) {
        return {
          status: 'borderline',
          category: 'elevated',
          message: 'Elevated blood pressure',
          recommendations: ['Monitor regularly', 'Maintain healthy lifestyle'],
          confidence: 0.85
        };
      } else if (systolic < 90 || diastolic < 60) {
        return {
          status: 'abnormal',
          category: 'hypotensive',
          message: 'Low blood pressure detected',
          recommendations: ['Monitor symptoms', 'Consult doctor if symptomatic'],
          confidence: 0.8
        };
      } else {
        return {
          status: 'normal',
          category: 'normal',
          message: 'Blood pressure is within normal range',
          recommendations: ['Continue healthy habits'],
          confidence: 0.9
        };
      }
    },
    
    thermometer: (r) => {
      const temp = r.temperature;
      
      if (temp >= 103) {
        return {
          status: 'critical',
          category: 'hyperthermia',
          message: 'High fever - seek immediate medical attention',
          recommendations: ['Call doctor immediately', 'Take cooling measures'],
          confidence: 0.95
        };
      } else if (temp >= 100.4) {
        return {
          status: 'abnormal',
          category: 'fever',
          message: 'Fever detected',
          recommendations: ['Rest', 'Stay hydrated', 'Monitor temperature'],
          confidence: 0.9
        };
      } else if (temp >= 99) {
        return {
          status: 'borderline',
          category: 'low_grade_fever',
          message: 'Slightly elevated temperature',
          recommendations: ['Monitor', 'Rest if feeling unwell'],
          confidence: 0.8
        };
      } else if (temp < 95) {
        return {
          status: 'abnormal',
          category: 'hypothermia',
          message: 'Low body temperature',
          recommendations: ['Seek warmth', 'Consult doctor if persistent'],
          confidence: 0.85
        };
      } else {
        return {
          status: 'normal',
          category: 'normal',
          message: 'Temperature is normal',
          recommendations: [],
          confidence: 0.9
        };
      }
    },
    
    pulse_oximeter: (r) => {
      const { oxygenSaturation, heartRate } = r;
      let issues = [];
      
      if (oxygenSaturation < 90) {
        issues.push({
          status: 'critical',
          category: 'severe_hypoxia',
          message: 'Dangerously low oxygen levels'
        });
      } else if (oxygenSaturation < 95) {
        issues.push({
          status: 'abnormal',
          category: 'hypoxia',
          message: 'Low oxygen saturation'
        });
      }
      
      if (heartRate > 100) {
        issues.push({
          status: 'borderline',
          category: 'tachycardia',
          message: 'Elevated heart rate'
        });
      } else if (heartRate < 60) {
        issues.push({
          status: 'borderline',
          category: 'bradycardia',
          message: 'Low heart rate'
        });
      }
      
      if (issues.length === 0) {
        return {
          status: 'normal',
          category: 'normal',
          message: 'Oxygen saturation and heart rate are normal',
          recommendations: [],
          confidence: 0.9
        };
      } else {
        const mostSevere = issues.reduce((prev, curr) => 
          prev.status === 'critical' ? prev : curr
        );
        return {
          ...mostSevere,
          recommendations: oxygenSaturation < 90 ? 
            ['Seek immediate medical attention'] : 
            ['Monitor closely', 'Consult doctor'],
          confidence: 0.85
        };
      }
    },
    
    glucometer: (r) => {
      const glucose = r.glucoseLevel;
      
      if (glucose < 70) {
        return {
          status: glucose < 50 ? 'critical' : 'abnormal',
          category: 'hypoglycemia',
          message: 'Low blood sugar',
          recommendations: glucose < 50 ? 
            ['Treat immediately with glucose', 'Seek medical help'] : 
            ['Consume glucose', 'Monitor closely'],
          confidence: 0.95
        };
      } else if (glucose > 250) {
        return {
          status: 'critical',
          category: 'severe_hyperglycemia',
          message: 'Very high blood sugar - seek immediate care',
          recommendations: ['Contact doctor immediately', 'Check ketones'],
          confidence: 0.95
        };
      } else if (glucose > 180) {
        return {
          status: 'abnormal',
          category: 'hyperglycemia',
          message: 'High blood sugar',
          recommendations: ['Follow diabetes management plan', 'Monitor closely'],
          confidence: 0.9
        };
      } else {
        return {
          status: 'normal',
          category: 'normal',
          message: 'Blood sugar is within acceptable range',
          recommendations: ['Continue monitoring'],
          confidence: 0.85
        };
      }
    },

    heart_rate_monitor: (r) => {
      const heartRate = r.heartRate;
      
      if (heartRate > 180) {
        return {
          status: 'critical',
          category: 'severe_tachycardia',
          message: 'Dangerously high heart rate - seek immediate medical attention',
          recommendations: ['Call emergency services', 'Do not delay treatment'],
          confidence: 0.95
        };
      } else if (heartRate > 100) {
        return {
          status: 'abnormal',
          category: 'tachycardia',
          message: 'Elevated heart rate',
          recommendations: ['Monitor symptoms', 'Consult doctor if persistent'],
          confidence: 0.9
        };
      } else if (heartRate < 40) {
        return {
          status: 'critical',
          category: 'severe_bradycardia',
          message: 'Dangerously low heart rate - seek immediate medical attention',
          recommendations: ['Call emergency services', 'Monitor consciousness'],
          confidence: 0.95
        };
      } else if (heartRate < 60) {
        return {
          status: 'abnormal',
          category: 'bradycardia',
          message: 'Low heart rate',
          recommendations: ['Monitor symptoms', 'Consult doctor if symptomatic'],
          confidence: 0.85
        };
      } else {
        return {
          status: 'normal',
          category: 'normal',
          message: 'Heart rate is within normal range',
          recommendations: ['Continue monitoring'],
          confidence: 0.9
        };
      }
    }
  };
  
  const interpreter = interpreters[equipmentType];
  if (!interpreter) {
    return {
      status: 'normal',
      category: 'uninterpreted',
      message: 'Reading recorded - interpretation not available',
      recommendations: [],
      confidence: 0.5
    };
  }
  
  return interpreter(readings);
}

// Alert generation function
function generateAlert(equipmentType, readings, interpretation) {
  const severityMap = {
    'critical': 'critical',
    'abnormal': 'high',
    'borderline': 'medium'
  };
  
  return {
    severity: severityMap[interpretation.status] || 'low',
    message: interpretation.message,
    actionRequired: interpretation.status === 'critical',
    acknowledged: {
      status: false
    }
  };
}

// Formatting function for display
function formatReadingsByType(equipmentType, readings) {
  const formatters = {
    blood_pressure: (r) => `${r.systolic}/${r.diastolic} mmHg`,
    thermometer: (r) => `${r.temperature}°F`,
    pulse_oximeter: (r) => `SpO2: ${r.oxygenSaturation}%, HR: ${r.heartRate} bpm`,
    glucometer: (r) => `${r.glucoseLevel} mg/dL`,
    heart_rate_monitor: (r) => `${r.heartRate} bpm`,
    weight_scale: (r) => `${r.weight} kg`,
    peak_flow_meter: (r) => `${r.peakFlow} L/min`,
    ecg_monitor: (r) => `HR: ${r.heartRate} bpm${r.rhythm ? `, Rhythm: ${r.rhythm}` : ''}`
  };
  
  const formatter = formatters[equipmentType];
  return formatter ? formatter(readings) : JSON.stringify(readings);
}

module.exports = mongoose.model('EquipmentReading', equipmentReadingSchema);