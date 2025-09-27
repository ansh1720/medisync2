/**
 * Hospital Model
 * Handles hospital information with geospatial location data
 */

const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true,
    minlength: [2, 'Hospital name must be at least 2 characters'],
    maxlength: [100, 'Hospital name cannot exceed 100 characters']
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'Zip code is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'United States'
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: [true, 'Coordinates are required'],
      validate: {
        validator: function(v) {
          return v && v.length === 2 && 
                 v[0] >= -180 && v[0] <= 180 && // longitude
                 v[1] >= -90 && v[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates. Must be [longitude, latitude] within valid ranges'
      }
    }
  },
  type: {
    type: String,
    enum: {
      values: [
        'general', 'specialty', 'emergency', 'urgent_care', 
        'children', 'psychiatric', 'rehabilitation', 'cancer',
        'cardiac', 'maternity', 'surgical', 'research'
      ],
      message: 'Invalid hospital type'
    },
    default: 'general'
  },
  specialties: {
    type: [String],
    validate: {
      validator: function(v) {
        const validSpecialties = [
          'cardiology', 'neurology', 'oncology', 'pediatrics',
          'orthopedics', 'dermatology', 'psychiatry', 'radiology',
          'surgery', 'emergency', 'internal_medicine', 'obstetrics',
          'urology', 'ophthalmology', 'anesthesiology', 'pathology',
          'family_medicine', 'geriatrics', 'infectious_disease',
          'endocrinology', 'gastroenterology', 'pulmonology'
        ];
        return v.every(specialty => validSpecialties.includes(specialty));
      },
      message: 'Invalid specialty provided'
    },
    default: []
  },
  contact: {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [
        /^[\+]?[1-9][\d]{0,15}$/,
        'Please enter a valid phone number'
      ]
    },
    email: {
      type: String,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email'
      ]
    },
    website: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true; // Optional field
          const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
          return urlRegex.test(v);
        },
        message: 'Please enter a valid website URL'
      }
    },
    emergencyPhone: {
      type: String,
      match: [
        /^[\+]?[1-9][\d]{0,15}$/,
        'Please enter a valid emergency phone number'
      ]
    }
  },
  services: {
    emergency: {
      type: Boolean,
      default: false
    },
    pharmacy: {
      type: Boolean,
      default: false
    },
    laboratory: {
      type: Boolean,
      default: false
    },
    imaging: {
      type: Boolean,
      default: false
    },
    surgery: {
      type: Boolean,
      default: false
    },
    ambulance: {
      type: Boolean,
      default: false
    }
  },
  capacity: {
    totalBeds: {
      type: Number,
      min: [1, 'Total beds must be at least 1'],
      max: [10000, 'Total beds cannot exceed 10000']
    },
    icuBeds: {
      type: Number,
      min: [0, 'ICU beds cannot be negative'],
      max: [1000, 'ICU beds cannot exceed 1000']
    },
    emergencyBeds: {
      type: Number,
      min: [0, 'Emergency beds cannot be negative'],
      max: [500, 'Emergency beds cannot exceed 500']
    }
  },
  rating: {
    overall: {
      type: Number,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
      default: 3
    },
    reviewCount: {
      type: Number,
      min: [0, 'Review count cannot be negative'],
      default: 0
    }
  },
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
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
hospitalSchema.index({ location: '2dsphere' }); // Geospatial index
hospitalSchema.index({ name: 1 });
hospitalSchema.index({ type: 1 });
hospitalSchema.index({ specialties: 1 });
hospitalSchema.index({ 'address.city': 1 });
hospitalSchema.index({ 'address.state': 1 });
hospitalSchema.index({ isActive: 1 });
hospitalSchema.index({ createdAt: -1 });

// Text index for search
hospitalSchema.index({
  name: 'text',
  'address.city': 'text',
  'address.state': 'text',
  specialties: 'text'
}, {
  weights: {
    name: 10,
    specialties: 5,
    'address.city': 3,
    'address.state': 1
  },
  name: 'hospital_text_index'
});

// Virtual for full address
hospitalSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Static method to find hospitals near a location
hospitalSchema.statics.findNearLocation = function(longitude, latitude, maxDistance = 50000, options = {}) {
  const {
    limit = 10,
    specialty,
    type,
    services,
    emergency
  } = options;

  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // in meters
      }
    },
    isActive: true
  };

  if (specialty) {
    query.specialties = specialty;
  }

  if (type) {
    query.type = type;
  }

  if (emergency) {
    query['services.emergency'] = true;
  }

  if (services && Array.isArray(services)) {
    services.forEach(service => {
      query[`services.${service}`] = true;
    });
  }

  return this.find(query)
    .limit(limit)
    .populate('createdBy', 'name email');
};

// Static method for text search
hospitalSchema.statics.searchByText = function(searchTerm, options = {}) {
  const {
    page = 1,
    limit = 10,
    type,
    specialty
  } = options;

  const query = {
    $text: { $search: searchTerm },
    isActive: true
  };

  if (type) query.type = type;
  if (specialty) query.specialties = specialty;

  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('createdBy', 'name email');
};

// Instance method to calculate distance from a point
hospitalSchema.methods.distanceFrom = function(longitude, latitude) {
  const [hospitalLng, hospitalLat] = this.location.coordinates;
  
  // Haversine formula for distance calculation
  const R = 6371000; // Earth's radius in meters
  const dLat = (hospitalLat - latitude) * Math.PI / 180;
  const dLng = (hospitalLng - longitude) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(latitude * Math.PI / 180) * Math.cos(hospitalLat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

// Instance method to check if hospital is open at a given time
hospitalSchema.methods.isOpenAt = function(date = new Date()) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[date.getDay()];
  const currentHour = date.getHours();
  const currentMinute = date.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const dayHours = this.operatingHours[dayName];
  if (!dayHours || !dayHours.open || !dayHours.close) {
    return false; // Closed if no hours specified
  }

  const [openHour, openMin] = dayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = dayHours.close.split(':').map(Number);
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  return currentTime >= openTime && currentTime <= closeTime;
};

module.exports = mongoose.model('Hospital', hospitalSchema);