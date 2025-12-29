/**
 * Disease Model
 * Handles disease information with search capabilities
 */

const mongoose = require('mongoose');

const diseaseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Disease name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Disease name must be at least 2 characters'],
    maxlength: [100, 'Disease name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Disease description is required'],
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  symptoms: {
    type: [String],
    default: []
  },
  prevention: {
    type: [String],
    default: []
  },
  treatment: {
    type: [String],
    default: []
  },
  riskFactors: {
    type: [String],
    default: []
  },
  tags: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return v.every(tag => tag.length <= 30);
      },
      message: 'Tags must not exceed 30 characters each'
    }
  },
  sources: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
        return v.every(source => urlRegex.test(source) || source.length <= 200);
      },
      message: 'Sources must be valid URLs or text references under 200 characters'
    }
  },
  severity: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'critical'],
      message: 'Severity must be low, medium, high, or critical'
    },
    default: 'medium'
  },
  category: {
    type: String,
    enum: {
      values: [
        'infectious', 'chronic', 'genetic', 'autoimmune', 
        'cardiovascular', 'respiratory', 'neurological', 
        'digestive', 'endocrine', 'musculoskeletal', 
        'mental', 'cancer', 'other'
      ],
      message: 'Invalid disease category'
    },
    default: 'other'
  },
  prevalence: {
    global: {
      type: Number,
      min: [0, 'Prevalence cannot be negative'],
      max: [100, 'Prevalence cannot exceed 100%']
    },
    byRegion: [{
      region: String,
      rate: {
        type: Number,
        min: [0, 'Prevalence cannot be negative'],
        max: [100, 'Prevalence cannot exceed 100%']
      }
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
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

// Indexes for search and performance
diseaseSchema.index({ name: 1 });
diseaseSchema.index({ tags: 1 });
diseaseSchema.index({ category: 1 });
diseaseSchema.index({ severity: 1 });
diseaseSchema.index({ isActive: 1 });
diseaseSchema.index({ createdAt: -1 });

// Text index for full-text search on name, symptoms, and description
diseaseSchema.index({
  name: 'text',
  symptoms: 'text',
  description: 'text',
  tags: 'text'
}, {
  weights: {
    name: 10,
    symptoms: 5,
    tags: 3,
    description: 1
  },
  name: 'disease_text_index'
});

// Static method for text search
diseaseSchema.statics.searchByText = function(searchTerm, options = {}) {
  const {
    page = 1,
    limit = 10,
    category,
    severity,
    tags
  } = options;
  
  const query = {
    $text: { $search: searchTerm },
    isActive: true
  };
  
  if (category) query.category = category;
  if (severity) query.severity = severity;
  if (tags && tags.length > 0) query.tags = { $in: tags };
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static method for symptom matching
diseaseSchema.statics.findBySymptoms = function(symptoms, options = {}) {
  const {
    page = 1,
    limit = 10,
    minMatches = 1
  } = options;
  
  const query = {
    symptoms: { 
      $in: symptoms.map(symptom => new RegExp(symptom, 'i'))
    },
    isActive: true
  };
  
  return this.aggregate([
    { $match: query },
    {
      $addFields: {
        matchCount: {
          $size: {
            $filter: {
              input: '$symptoms',
              cond: {
                $in: [
                  '$$this',
                  symptoms.map(symptom => new RegExp(symptom, 'i'))
                ]
              }
            }
          }
        }
      }
    },
    { $match: { matchCount: { $gte: minMatches } } },
    { $sort: { matchCount: -1, name: 1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit }
  ]);
};

// Static method to get diseases by category
diseaseSchema.statics.findByCategory = function(category, options = {}) {
  const { page = 1, limit = 10 } = options;
  
  return this.find({ category, isActive: true })
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Instance method to get related diseases
diseaseSchema.methods.getRelatedDiseases = function(limit = 5) {
  return this.constructor.find({
    _id: { $ne: this._id },
    $or: [
      { category: this.category },
      { tags: { $in: this.tags } },
      { symptoms: { $in: this.symptoms } }
    ],
    isActive: true
  }).limit(limit);
};

// Pre-save middleware to normalize data
diseaseSchema.pre('save', function(next) {
  // Normalize tags to lowercase
  if (this.tags) {
    this.tags = this.tags.map(tag => tag.toLowerCase().trim());
  }
  
  // Normalize symptoms
  if (this.symptoms) {
    this.symptoms = this.symptoms.map(symptom => symptom.toLowerCase().trim());
  }
  
  next();
});

module.exports = mongoose.model('Disease', diseaseSchema);