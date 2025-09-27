/**
 * Doctor Model
 * Handles doctor profiles, specialties, and availability
 */

const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Doctor name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  specialty: {
    type: String,
    required: [true, 'Specialty is required'],
    enum: {
      values: [
        'cardiology', 'neurology', 'oncology', 'pediatrics',
        'orthopedics', 'dermatology', 'psychiatry', 'radiology',
        'surgery', 'emergency', 'internal_medicine', 'obstetrics',
        'urology', 'ophthalmology', 'anesthesiology', 'pathology',
        'family_medicine', 'geriatrics', 'infectious_disease',
        'endocrinology', 'gastroenterology', 'pulmonology',
        'rheumatology', 'hematology', 'nephrology', 'plastic_surgery'
      ],
      message: 'Invalid specialty'
    }
  },
  subSpecialties: {
    type: [String],
    default: []
  },
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    trim: true
  },
  qualifications: {
    degree: {
      type: String,
      required: [true, 'Medical degree is required'],
      trim: true
    },
    university: {
      type: String,
      required: [true, 'University is required'],
      trim: true
    },
    graduationYear: {
      type: Number,
      required: [true, 'Graduation year is required'],
      min: [1950, 'Graduation year must be after 1950'],
      max: [new Date().getFullYear(), 'Graduation year cannot be in the future']
    },
    residency: {
      program: String,
      hospital: String,
      completionYear: Number
    },
    fellowship: {
      program: String,
      hospital: String,
      completionYear: Number
    },
    certifications: [String]
  },
  experience: {
    type: Number,
    min: [0, 'Experience cannot be negative'],
    max: [70, 'Experience cannot exceed 70 years']
  },
  languages: {
    type: [String],
    enum: ['en', 'es', 'fr', 'de', 'pt', 'zh', 'hi', 'ar', 'ja', 'ko'],
    default: ['en']
  },
  availability: [{
    dayOfWeek: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true
    },
    timeSlots: [{
      startTime: {
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
      },
      endTime: {
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
      },
      isAvailable: {
        type: Boolean,
        default: true
      }
    }]
  }],
  contact: {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [
        /^[\+]?[1-9][\d]{0,15}$/,
        'Please enter a valid phone number'
      ]
    },
    officeAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'United States' }
    },
    emergencyContact: {
      phone: String,
      relationship: String
    }
  },
  hospitalAffiliation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'
  },
  consultationFee: {
    amount: {
      type: Number,
      min: [0, 'Consultation fee cannot be negative'],
      max: [10000, 'Consultation fee cannot exceed $10,000']
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD'],
      default: 'USD'
    }
  },
  rating: {
    average: {
      type: Number,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
      default: 0
    },
    reviewCount: {
      type: Number,
      min: [0, 'Review count cannot be negative'],
      default: 0
    }
  },
  socialProfiles: {
    linkedIn: String,
    twitter: String,
    facebook: String,
    website: String
  },
  preferences: {
    consultationDuration: {
      type: Number, // in minutes
      min: [15, 'Consultation duration must be at least 15 minutes'],
      max: [120, 'Consultation duration cannot exceed 120 minutes'],
      default: 30
    },
    maxDailyConsultations: {
      type: Number,
      min: [1, 'Must allow at least 1 consultation per day'],
      max: [50, 'Cannot exceed 50 consultations per day'],
      default: 15
    },
    bookingAdvanceNotice: {
      type: Number, // in hours
      min: [1, 'Must allow at least 1 hour advance notice'],
      max: [720, 'Cannot exceed 30 days advance notice'], // 30 days
      default: 24
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    type: {
      type: String,
      enum: ['medical_license', 'degree_certificate', 'specialty_certification', 'other']
    },
    documentUrl: String,
    uploadDate: { type: Date, default: Date.now },
    isApproved: { type: Boolean, default: false }
  }],
  userRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
doctorSchema.index({ email: 1 }, { unique: true });
doctorSchema.index({ specialty: 1 });
doctorSchema.index({ subSpecialties: 1 });
doctorSchema.index({ 'contact.officeAddress.city': 1 });
doctorSchema.index({ 'contact.officeAddress.state': 1 });
doctorSchema.index({ isActive: 1 });
doctorSchema.index({ isVerified: 1 });
doctorSchema.index({ 'rating.average': -1 });
doctorSchema.index({ createdAt: -1 });

// Text index for search
doctorSchema.index({
  name: 'text',
  specialty: 'text',
  subSpecialties: 'text',
  bio: 'text'
}, {
  weights: {
    name: 10,
    specialty: 8,
    subSpecialties: 5,
    bio: 1
  },
  name: 'doctor_text_index'
});

// Virtual for full name with title
doctorSchema.virtual('fullNameWithTitle').get(function() {
  return `Dr. ${this.name}`;
});

// Virtual for years of experience
doctorSchema.virtual('yearsOfExperience').get(function() {
  if (this.qualifications && this.qualifications.graduationYear) {
    return new Date().getFullYear() - this.qualifications.graduationYear;
  }
  return this.experience || 0;
});

// Static method to find available doctors by specialty
doctorSchema.statics.findAvailableBySpecialty = function(specialty, options = {}) {
  const {
    date = new Date(),
    limit = 10,
    city,
    state,
    minRating = 0
  } = options;

  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];

  const query = {
    specialty,
    isActive: true,
    isVerified: true,
    'availability.dayOfWeek': dayOfWeek,
    'rating.average': { $gte: minRating }
  };

  if (city) query['contact.officeAddress.city'] = new RegExp(city, 'i');
  if (state) query['contact.officeAddress.state'] = new RegExp(state, 'i');

  return this.find(query)
    .populate('hospitalAffiliation', 'name address')
    .populate('userRef', 'name email phone')
    .sort({ 'rating.average': -1, 'rating.reviewCount': -1 })
    .limit(limit);
};

// Static method for text search
doctorSchema.statics.searchDoctors = function(searchTerm, options = {}) {
  const {
    page = 1,
    limit = 10,
    specialty,
    city,
    minRating = 0
  } = options;

  const query = {
    $text: { $search: searchTerm },
    isActive: true,
    isVerified: true,
    'rating.average': { $gte: minRating }
  };

  if (specialty) query.specialty = specialty;
  if (city) query['contact.officeAddress.city'] = new RegExp(city, 'i');

  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, 'rating.average': -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('hospitalAffiliation', 'name address')
    .populate('userRef', 'name email');
};

// Instance method to check availability for a specific date and time
doctorSchema.methods.isAvailableAt = function(date, time) {
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
  
  const dayAvailability = this.availability.find(av => av.dayOfWeek === dayOfWeek);
  if (!dayAvailability) return false;

  const requestedTime = this.timeToMinutes(time);
  
  return dayAvailability.timeSlots.some(slot => {
    if (!slot.isAvailable) return false;
    
    const startTime = this.timeToMinutes(slot.startTime);
    const endTime = this.timeToMinutes(slot.endTime);
    
    return requestedTime >= startTime && requestedTime < endTime;
  });
};

// Instance method to get available time slots for a specific date
doctorSchema.methods.getAvailableSlots = function(date) {
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
  
  const dayAvailability = this.availability.find(av => av.dayOfWeek === dayOfWeek);
  if (!dayAvailability) return [];

  return dayAvailability.timeSlots
    .filter(slot => slot.isAvailable)
    .map(slot => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: this.preferences.consultationDuration
    }));
};

// Helper method to convert time string to minutes
doctorSchema.methods.timeToMinutes = function(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Instance method to update rating
doctorSchema.methods.updateRating = function(newRating) {
  const currentTotal = this.rating.average * this.rating.reviewCount;
  this.rating.reviewCount += 1;
  this.rating.average = (currentTotal + newRating) / this.rating.reviewCount;
  return this.save();
};

module.exports = mongoose.model('Doctor', doctorSchema);