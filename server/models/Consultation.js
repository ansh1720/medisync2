/**
 * Consultation Model
 * Handles medical consultations between patients and doctors
 */

const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor ID is required']
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
  chiefComplaint: {
    type: String,
    required: [true, 'Chief complaint is required'],
    trim: true,
    maxlength: [500, 'Chief complaint cannot exceed 500 characters']
  },
  additionalNotes: {
    type: String,
    maxlength: [1000, 'Additional notes cannot exceed 1000 characters'],
    trim: true
  },
  medicalHistory: {
    allergies: [String],
    currentMedications: [String],
    previousSurgeries: [String],
    chronicConditions: [String],
    familyHistory: [String]
  },
  vitalSigns: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number,
      unit: { type: String, default: 'mmHg' }
    },
    heartRate: {
      value: Number,
      unit: { type: String, default: 'bpm' }
    },
    temperature: {
      value: Number,
      unit: { type: String, enum: ['celsius', 'fahrenheit'], default: 'celsius' }
    },
    oxygenSaturation: {
      value: Number,
      unit: { type: String, default: '%' }
    },
    weight: {
      value: Number,
      unit: { type: String, enum: ['kg', 'lbs'], default: 'kg' }
    },
    height: {
      value: Number,
      unit: { type: String, enum: ['cm', 'ft'], default: 'cm' }
    }
  },
  status: {
    type: String,
    enum: {
      values: ['requested', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
      message: 'Invalid consultation status'
    },
    default: 'requested'
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Invalid priority level'
    },
    default: 'medium'
  },
  consultationType: {
    type: String,
    enum: {
      values: ['in_person', 'video_call', 'phone_call', 'chat'],
      message: 'Invalid consultation type'
    },
    default: 'in_person'
  },
  scheduledAt: {
    type: Date,
    required: [true, 'Scheduled date and time is required'],
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: 'Scheduled time must be in the future'
    }
  },
  estimatedDuration: {
    type: Number, // in minutes
    min: [15, 'Consultation must be at least 15 minutes'],
    max: [120, 'Consultation cannot exceed 120 minutes'],
    default: 30
  },
  actualStartTime: {
    type: Date
  },
  actualEndTime: {
    type: Date
  },
  prescription: {
    medications: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      dosage: {
        type: String,
        required: true,
        trim: true
      },
      frequency: {
        type: String,
        required: true,
        trim: true
      },
      duration: {
        type: String,
        required: true,
        trim: true
      },
      instructions: {
        type: String,
        trim: true
      }
    }],
    generalInstructions: {
      type: String,
      maxlength: [1000, 'General instructions cannot exceed 1000 characters']
    }
  },
  diagnosis: {
    primary: {
      type: String,
      trim: true
    },
    secondary: [String],
    icd10Codes: [String],
    confidence: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  treatmentPlan: {
    shortTerm: [String],
    longTerm: [String],
    lifestyle: [String],
    followUpRequired: {
      type: Boolean,
      default: false
    },
    followUpDate: Date,
    referrals: [{
      specialty: String,
      reason: String,
      urgency: {
        type: String,
        enum: ['routine', 'urgent', 'emergency'],
        default: 'routine'
      }
    }]
  },
  documents: [{
    type: {
      type: String,
      enum: ['lab_report', 'xray', 'prescription', 'referral', 'other']
    },
    filename: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  payment: {
    amount: {
      type: Number,
      min: [0, 'Payment amount cannot be negative']
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD'],
      default: 'USD'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'insurance', 'cash']
    },
    transactionId: String,
    paidAt: Date
  },
  feedback: {
    patientRating: {
      type: Number,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5']
    },
    patientComment: {
      type: String,
      maxlength: [500, 'Patient comment cannot exceed 500 characters']
    },
    doctorRating: {
      type: Number,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5']
    },
    doctorComment: {
      type: String,
      maxlength: [500, 'Doctor comment cannot exceed 500 characters']
    }
  },
  cancellationReason: {
    type: String,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters']
  },
  isEmergency: {
    type: Boolean,
    default: false
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
consultationSchema.index({ userId: 1 });
consultationSchema.index({ doctorId: 1 });
consultationSchema.index({ status: 1 });
consultationSchema.index({ scheduledAt: 1 });
consultationSchema.index({ createdAt: -1 });
consultationSchema.index({ priority: 1 });
consultationSchema.index({ consultationType: 1 });
consultationSchema.index({ isEmergency: 1 });

// Compound indexes for common queries
consultationSchema.index({ userId: 1, status: 1 });
consultationSchema.index({ doctorId: 1, status: 1 });
consultationSchema.index({ userId: 1, scheduledAt: 1 });
consultationSchema.index({ doctorId: 1, scheduledAt: 1 });

// Virtual for consultation duration
consultationSchema.virtual('actualDuration').get(function() {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60)); // in minutes
  }
  return null;
});

// Virtual for days until consultation
consultationSchema.virtual('daysUntilConsultation').get(function() {
  if (this.scheduledAt) {
    const now = new Date();
    const diffTime = this.scheduledAt - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Static method to find consultations by user
consultationSchema.statics.findByUser = function(userId, options = {}) {
  const {
    status,
    page = 1,
    limit = 10,
    startDate,
    endDate
  } = options;

  const query = { userId };
  
  if (status) query.status = status;
  if (startDate || endDate) {
    query.scheduledAt = {};
    if (startDate) query.scheduledAt.$gte = new Date(startDate);
    if (endDate) query.scheduledAt.$lte = new Date(endDate);
  }

  return this.find(query)
    .populate('doctorId', 'name specialty contact rating')
    .populate('userId', 'name email phone')
    .sort({ scheduledAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static method to find consultations by doctor
consultationSchema.statics.findByDoctor = function(doctorId, options = {}) {
  const {
    status,
    date,
    page = 1,
    limit = 10
  } = options;

  const query = { doctorId };
  
  if (status) query.status = status;
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    query.scheduledAt = {
      $gte: startOfDay,
      $lte: endOfDay
    };
  }

  return this.find(query)
    .populate('userId', 'name email phone')
    .populate('doctorId', 'name specialty')
    .sort({ scheduledAt: 1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static method to get upcoming consultations
consultationSchema.statics.getUpcoming = function(userId, isDoctor = false) {
  const query = {
    status: { $in: ['confirmed', 'in_progress'] },
    scheduledAt: { $gte: new Date() }
  };

  if (isDoctor) {
    query.doctorId = userId;
  } else {
    query.userId = userId;
  }

  return this.find(query)
    .populate('doctorId', 'name specialty contact')
    .populate('userId', 'name email phone')
    .sort({ scheduledAt: 1 })
    .limit(5);
};

// Instance method to start consultation
consultationSchema.methods.startConsultation = function() {
  this.status = 'in_progress';
  this.actualStartTime = new Date();
  return this.save();
};

// Instance method to complete consultation
consultationSchema.methods.completeConsultation = function() {
  this.status = 'completed';
  this.actualEndTime = new Date();
  return this.save();
};

// Instance method to cancel consultation
consultationSchema.methods.cancelConsultation = function(reason) {
  this.status = 'cancelled';
  this.cancellationReason = reason;
  return this.save();
};

// Instance method to add prescription
consultationSchema.methods.addPrescription = function(medications, instructions) {
  this.prescription = {
    medications,
    generalInstructions: instructions
  };
  return this.save();
};

// Pre-save middleware
consultationSchema.pre('save', function(next) {
  // Ensure actual end time is after start time
  if (this.actualStartTime && this.actualEndTime && this.actualEndTime <= this.actualStartTime) {
    return next(new Error('End time must be after start time'));
  }
  
  // Set follow-up date if required but not set
  if (this.treatmentPlan && this.treatmentPlan.followUpRequired && !this.treatmentPlan.followUpDate) {
    const followUpDate = new Date(this.scheduledAt);
    followUpDate.setDate(followUpDate.getDate() + 14); // Default to 2 weeks
    this.treatmentPlan.followUpDate = followUpDate;
  }

  next();
});

module.exports = mongoose.model('Consultation', consultationSchema);