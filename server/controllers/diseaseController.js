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
    const query = { isActive: true };
    
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
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagArray };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const diseases = await Disease.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email');

    // Get total count for pagination
    const totalCount = await Disease.countDocuments(query);
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
      message: 'Diseases retrieved successfully'
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

    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    if (category) options.category = category;
    if (severity) options.severity = severity;
    if (tags) {
      options.tags = Array.isArray(tags) ? tags : tags.split(',');
    }

    const diseases = await Disease.searchByText(q, options);
    const totalCount = await Disease.countDocuments({
      $text: { $search: q },
      isActive: true,
      ...(category && { category }),
      ...(severity && { severity }),
      ...(tags && { tags: { $in: Array.isArray(tags) ? tags : tags.split(',') } })
    });

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
      message: 'Search completed successfully'
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
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      minMatches: parseInt(minMatches)
    };

    const diseases = await Disease.findBySymptoms(symptomArray, options);

    res.json({
      success: true,
      data: {
        diseases,
        searchSymptoms: symptomArray,
        minMatches: parseInt(minMatches)
      },
      message: 'Symptom-based search completed successfully'
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
    const categories = await Disease.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: { categories },
      message: 'Categories retrieved successfully'
    });

  } catch (error) {
    next(error);
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
  restoreDisease
};