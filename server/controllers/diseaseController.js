/**
 * Disease Controller
 * Handles CRUD operations and search functionality for diseases
 */

const { validationResult } = require('express-validator');
const Disease = require('../models/Disease');

/**
 * Get diseases with pagination, search, and filters
 * @route GET /api/diseases
 */
const getDiseases = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 10,
      name,
      symptom,
      category,
      severity,
      tags,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = {};
    
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    
    if (symptom) {
      query.symptoms = { $regex: symptom, $options: 'i' };
    }
    
    if (category) {
      query.category = category;
    }
    
    if (severity) {
      query.severity = severity;
    }
    
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [diseases, totalCount] = await Promise.all([
      Disease.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Disease.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: {
        diseases,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      },
      message: 'Diseases retrieved successfully from database'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Full-text search diseases
 * @route GET /api/diseases/search
 */
const searchDiseases = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      q,
      page = 1,
      limit = 10,
      category,
      severity,
      tags
    } = req.query;

    // Build text search query
    const query = {};
    
    if (q) {
      query.$text = { $search: q };
    }
    
    if (category) {
      query.category = category;
    }
    
    if (severity) {
      query.severity = severity;
    }
    
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    // Execute query with text score sorting
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [diseases, totalCount] = await Promise.all([
      Disease.find(query, q ? { score: { $meta: 'textScore' } } : {})
        .sort(q ? { score: { $meta: 'textScore' } } : { name: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Disease.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: {
        diseases,
        searchQuery: q,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      },
      message: 'Search completed successfully from database'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Find diseases by symptoms
 * @route GET /api/diseases/symptoms
 */
const findBySymptoms = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      symptoms,
      page = 1,
      limit = 10,
      minMatches = 1
    } = req.query;

    const symptomArray = symptoms.split(',').map(s => s.trim());
    
    // Use CSV data for symptom-based search
    const matchingDiseases = diseaseParser.findBySymptoms(symptomArray, {
      minMatches: parseInt(minMatches),
      limit: parseInt(limit)
    });

    // Apply pagination
    const totalCount = matchingDiseases.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedResults = matchingDiseases.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: {
        diseases: paginatedResults,
        searchSymptoms: symptomArray,
        minMatches: parseInt(minMatches),
        totalMatches: totalCount
      },
      message: 'Symptom-based search completed successfully using CSV data'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get disease categories with counts
 * @route GET /api/diseases/categories
 */
const getCategories = async (req, res, next) => {
  try {
    // Use CSV data to get categories
    const allDiseases = diseaseParser.getAllDiseases();
    const categoryCount = {};

    // Count diseases by category (using simple categorization based on disease name/type)
    allDiseases.forEach(disease => {
      const category = categorizeDiseaseByName(disease.name);
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const categories = Object.entries(categoryCount)
      .map(([category, count]) => ({ _id: category, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      data: { categories },
      message: 'Categories retrieved successfully from CSV data'
    });

  } catch (error) {
    next(error);
  }
};

// Helper function to categorize diseases
const categorizeDiseaseByName = (diseaseName) => {
  const name = diseaseName.toLowerCase();
  
  if (name.includes('heart') || name.includes('cardiac') || name.includes('blood pressure')) {
    return 'cardiovascular';
  } else if (name.includes('lung') || name.includes('breathing') || name.includes('respiratory')) {
    return 'respiratory';
  } else if (name.includes('diabetes') || name.includes('thyroid') || name.includes('hormone')) {
    return 'endocrine';
  } else if (name.includes('infection') || name.includes('virus') || name.includes('bacteria')) {
    return 'infectious';
  } else if (name.includes('cancer') || name.includes('tumor') || name.includes('malignant')) {
    return 'cancer';
  } else if (name.includes('mental') || name.includes('depression') || name.includes('anxiety')) {
    return 'mental';
  } else if (name.includes('digestive') || name.includes('stomach') || name.includes('bowel')) {
    return 'digestive';
  } else if (name.includes('bone') || name.includes('joint') || name.includes('muscle')) {
    return 'musculoskeletal';
  } else if (name.includes('brain') || name.includes('nerve') || name.includes('neurological')) {
    return 'neurological';
  } else {
    return 'other';
  }
};

/**
 * Get disease by ID
 * @route GET /api/diseases/:id
 */
const getDiseaseById = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;

    const disease = await Disease.findById(id)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email');

    if (!disease || !disease.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Disease not found'
      });
    }

    res.json({
      success: true,
      data: { disease },
      message: 'Disease retrieved successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get related diseases
 * @route GET /api/diseases/:id/related
 */
const getRelatedDiseases = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { limit = 5 } = req.query;

    const disease = await Disease.findById(id);
    if (!disease || !disease.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Disease not found'
      });
    }

    const relatedDiseases = await disease.getRelatedDiseases(parseInt(limit));

    res.json({
      success: true,
      data: { relatedDiseases },
      message: 'Related diseases retrieved successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Create new disease
 * @route POST /api/diseases
 */
const createDisease = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name,
      description,
      symptoms,
      prevention = [],
      treatment = [],
      riskFactors = [],
      tags = [],
      sources = [],
      severity = 'medium',
      category = 'other',
      prevalence
    } = req.body;

    // Check if disease already exists
    const existingDisease = await Disease.findOne({ 
      name: { $regex: `^${name}$`, $options: 'i' } 
    });
    
    if (existingDisease) {
      return res.status(400).json({
        success: false,
        message: 'Disease with this name already exists'
      });
    }

    const disease = new Disease({
      name,
      description,
      symptoms,
      prevention,
      treatment,
      riskFactors,
      tags,
      sources,
      severity,
      category,
      prevalence,
      createdBy: req.user.userId,
      lastModifiedBy: req.user.userId
    });

    await disease.save();

    // Populate creator info
    await disease.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: { disease },
      message: 'Disease created successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update disease
 * @route PUT /api/diseases/:id
 */
const updateDisease = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = { ...req.body };
    updateData.lastModifiedBy = req.user.userId;

    const disease = await Disease.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('lastModifiedBy', 'name email');

    if (!disease) {
      return res.status(404).json({
        success: false,
        message: 'Disease not found'
      });
    }

    res.json({
      success: true,
      data: { disease },
      message: 'Disease updated successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Delete disease (soft delete)
 * @route DELETE /api/diseases/:id
 */
const deleteDisease = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;

    const disease = await Disease.findByIdAndUpdate(
      id,
      { 
        isActive: false,
        lastModifiedBy: req.user.userId
      },
      { new: true }
    );

    if (!disease) {
      return res.status(404).json({
        success: false,
        message: 'Disease not found'
      });
    }

    res.json({
      success: true,
      message: 'Disease deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Restore soft-deleted disease
 * @route POST /api/diseases/:id/restore
 */
const restoreDisease = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;

    const disease = await Disease.findByIdAndUpdate(
      id,
      { 
        isActive: true,
        lastModifiedBy: req.user.userId
      },
      { new: true }
    ).populate('createdBy', 'name email')
     .populate('lastModifiedBy', 'name email');

    if (!disease) {
      return res.status(404).json({
        success: false,
        message: 'Disease not found'
      });
    }

    res.json({
      success: true,
      data: { disease },
      message: 'Disease restored successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Enhanced disease search with CSV data and charts
 * @route GET /api/diseases/enhanced-search
 */
const enhancedSearch = async (req, res, next) => {
  try {
    // Check for validation errors first
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { query: searchQuery, limit = 10, includeCharts = false } = req.query;

    if (!searchQuery || searchQuery.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Search in CSV data only (no MongoDB dependency)
    const csvResults = diseaseParser.searchDiseases(searchQuery, {
      limit: parseInt(limit),
      includeChartData: includeCharts === 'true',
      sortBy: 'relevance'
    });

    res.json({
      success: true,
      data: csvResults,
      total: csvResults.length,
      query: searchQuery,
      hasCharts: includeCharts === 'true',
      source: 'CSV data only'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed disease information with charts
 * @route GET /api/diseases/details/:name
 */
const getDiseaseDetailsWithCharts = async (req, res, next) => {
  try {
    const { name } = req.params;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Disease name is required'
      });
    }

    // Try to get from CSV data first
    let disease = diseaseParser.getDiseaseByName(decodeURIComponent(name));
    
    // If not found in CSV, try MongoDB
    if (!disease) {
      const mongoDisease = await Disease.findOne({
        name: { $regex: new RegExp(name, 'i') },
        isActive: true
      });
      
      if (mongoDisease) {
        disease = {
          name: mongoDisease.name,
          overview: mongoDisease.description,
          symptoms: mongoDisease.symptoms || [],
          cause: '',
          prevention: mongoDisease.prevention?.join('; ') || '',
          treatment: mongoDisease.treatment || '',
          importance: '',
          riskScore: mongoDisease.severity === 'high' ? 8 : mongoDisease.severity === 'medium' ? 5 : 3,
          chartData: diseaseParser.generateChartData({
            symptoms: mongoDisease.symptoms || [],
            riskScore: mongoDisease.severity === 'high' ? 8 : mongoDisease.severity === 'medium' ? 5 : 3,
            preventionMethods: {
              lifestyle: [],
              medical: [],
              environmental: [],
              behavioral: []
            }
          }),
          source: 'database'
        };
      }
    }

    if (!disease) {
      return res.status(404).json({
        success: false,
        message: 'Disease not found'
      });
    }

    res.json({
      success: true,
      data: disease
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get symptom-based disease suggestions
 * @route POST /api/diseases/symptom-analysis
 */
const getSymptomBasedSuggestions = async (req, res, next) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Symptoms array is required'
      });
    }

    const suggestions = [];
    
    // Search for each symptom in CSV data
    for (const symptom of symptoms) {
      const results = diseaseParser.searchDiseases(symptom, {
        limit: 3,
        includeChartData: false
      });
      
      results.forEach(result => {
        const existing = suggestions.find(s => s.name === result.name);
        if (existing) {
          existing.matchScore += result.relevanceScore;
          existing.matchingSymptoms.push(symptom);
        } else {
          suggestions.push({
            ...result,
            matchScore: result.relevanceScore,
            matchingSymptoms: [symptom]
          });
        }
      });
    }

    // Sort by match score and limit results
    const sortedSuggestions = suggestions
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    res.json({
      success: true,
      data: sortedSuggestions,
      inputSymptoms: symptoms,
      totalSuggestions: sortedSuggestions.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get disease statistics and analytics
 * @route GET /api/diseases/statistics
 */
const getDiseaseStatistics = async (req, res, next) => {
  try {
    const csvStats = diseaseParser.getStatistics();
    const mongoCount = await Disease.countDocuments({ isActive: true });

    const combinedStats = {
      csv: csvStats || {
        totalDiseases: 0,
        avgRiskScore: 0,
        topSymptoms: [],
        riskDistribution: { low: 0, medium: 0, high: 0 }
      },
      database: {
        totalDiseases: mongoCount
      },
      combined: {
        totalDiseases: (csvStats?.totalDiseases || 0) + mongoCount
      }
    };

    res.json({
      success: true,
      data: combinedStats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDiseases,
  searchDiseases,
  findBySymptoms,
  getCategories,
  getDiseaseById,
  getRelatedDiseases,
  createDisease,
  updateDisease,
  deleteDisease,
  restoreDisease,
  // Enhanced CSV-based functions
  enhancedSearch,
  getDiseaseDetailsWithCharts,
  getSymptomBasedSuggestions,
  getDiseaseStatistics
};