/**
 * Hospital Controller
 * Handles hospital locator operations with geospatial queries
 */

const { validationResult } = require('express-validator');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');

/**
 * Find nearby hospitals using geospatial queries
 */
exports.findNearbyHospitals = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location parameters',
        errors: errors.array()
      });
    }

    const {
      lat,
      lng,
      radius = 25, // Default 25km radius
      limit = 10,
      services,
      type
    } = req.query;

    // Build query filter
    const filter = {};
    
    if (services) {
      const serviceArray = services.split(',').map(s => s.trim());
      filter.services = { $in: serviceArray };
    }
    
    if (type) {
      filter.type = type;
    }

    // Use geospatial query to find nearby hospitals
    const hospitals = await Hospital.find({
      ...filter,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)] // [longitude, latitude]
          },
          $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
        }
      }
    }).limit(parseInt(limit));

    // Enhance results with additional information
    const enhancedHospitals = hospitals.map(hospital => ({
      ...hospital.toObject(),
      hasEmergencyServices: hospital.specialties?.includes('emergency') || false
    }));

    res.json({
      success: true,
      data: {
        hospitals: enhancedHospitals,
        searchCriteria: {
          center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
          radius: parseFloat(radius),
          services: services?.split(',') || [],
          type: type || 'all'
        },
        count: enhancedHospitals.length
      },
      message: `Found ${enhancedHospitals.length} hospitals within ${radius}km`
    });

  } catch (error) {
    console.error('Find nearby hospitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding nearby hospitals',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Search hospitals with advanced filters
 */
exports.searchHospitals = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid search parameters',
        errors: errors.array()
      });
    }

    const {
      q,
      city,
      state,
      zipCode,
      services,
      acceptsInsurance,
      rating,
      page = 1,
      limit = 20
    } = req.query;

    // Build search query
    const searchQuery = {};
    
    // Text search
    if (q) {
      searchQuery.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { 'address.street': { $regex: q, $options: 'i' } }
      ];
    }
    
    // Location filters
    if (city) searchQuery['address.city'] = { $regex: city, $options: 'i' };
    if (state) searchQuery['address.state'] = { $regex: state, $options: 'i' };
    if (zipCode) searchQuery['address.zipCode'] = zipCode;
    
    // Services filter
    if (services) {
      const serviceArray = services.split(',').map(s => s.trim());
      searchQuery.services = { $in: serviceArray };
    }
    
    // Insurance filter
    if (acceptsInsurance) {
      const insuranceArray = acceptsInsurance.split(',').map(i => i.trim());
      searchQuery.acceptedInsurance = { $in: insuranceArray };
    }
    
    // Rating filter
    if (rating) {
      searchQuery['ratings.overall'] = { $gte: parseFloat(rating) };
    }

    // Execute search with pagination
    const skip = (page - 1) * limit;
    const [hospitals, total] = await Promise.all([
      Hospital.find(searchQuery)
        .populate('departments.head', 'name specialties')
        .sort({ 'ratings.overall': -1, name: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Hospital.countDocuments(searchQuery)
    ]);

    // Enhance results
    const enhancedHospitals = hospitals.map(hospital => ({
      ...hospital.toObject(),
      isOpen: hospital.isCurrentlyOpen(),
      hasEmergencyServices: hospital.services.includes('emergency'),
      acceptsYourInsurance: acceptsInsurance ? 
        hospital.acceptedInsurance.some(insurance => 
          acceptsInsurance.split(',').some(userInsurance => 
            insurance.toLowerCase().includes(userInsurance.toLowerCase())
          )
        ) : undefined
    }));

    res.json({
      success: true,
      data: {
        hospitals: enhancedHospitals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        searchCriteria: {
          query: q,
          location: { city, state, zipCode },
          services: services?.split(',') || [],
          insurance: acceptsInsurance?.split(',') || [],
          minRating: rating ? parseFloat(rating) : null
        }
      }
    });

  } catch (error) {
    console.error('Search hospitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching hospitals'
    });
  }
};

/**
 * Get all hospitals with basic filtering
 */
exports.getAllHospitals = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      services
    } = req.query;

    // Build filter
    const filter = {};
    if (type) filter.type = type;
    if (services) {
      const serviceArray = services.split(',').map(s => s.trim());
      filter.services = { $in: serviceArray };
    }

    // Execute query
    const skip = (page - 1) * limit;
    const [hospitals, total] = await Promise.all([
      Hospital.find(filter)
        .select('-departments -reviews') // Exclude heavy fields
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Hospital.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        hospitals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all hospitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving hospitals'
    });
  }
};

/**
 * Get specific hospital by ID
 */
exports.getHospitalById = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid hospital ID',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    
    const hospital = await Hospital.findById(id)
      .populate('departments.head', 'name specialties experience contactInfo')
      .populate('reviews.userId', 'name');

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    // Add computed fields
    const hospitalData = {
      ...hospital.toObject(),
      isOpen: hospital.isCurrentlyOpen(),
      estimatedWaitTime: hospital.getEstimatedWaitTime(),
      hasEmergencyServices: hospital.services.includes('emergency')
    };

    res.json({
      success: true,
      data: hospitalData
    });

  } catch (error) {
    console.error('Get hospital by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving hospital'
    });
  }
};

/**
 * Create new hospital (admin only)
 */
exports.createHospital = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid hospital data',
        errors: errors.array()
      });
    }

    const hospitalData = req.body;
    
    // Check for duplicate hospital
    const existingHospital = await Hospital.findOne({
      name: hospitalData.name,
      'address.city': hospitalData.address.city,
      'address.state': hospitalData.address.state
    });

    if (existingHospital) {
      return res.status(400).json({
        success: false,
        message: 'Hospital with this name already exists in this location'
      });
    }

    const hospital = new Hospital(hospitalData);
    await hospital.save();

    res.status(201).json({
      success: true,
      data: hospital,
      message: 'Hospital created successfully'
    });

  } catch (error) {
    console.error('Create hospital error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating hospital',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update hospital information (admin only)
 */
exports.updateHospital = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid update data',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    const hospital = await Hospital.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    res.json({
      success: true,
      data: hospital,
      message: 'Hospital updated successfully'
    });

  } catch (error) {
    console.error('Update hospital error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating hospital'
    });
  }
};

/**
 * Delete hospital (admin only)
 */
exports.deleteHospital = async (req, res) => {
  try {
    const { id } = req.params;

    const hospital = await Hospital.findByIdAndDelete(id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    res.json({
      success: true,
      message: 'Hospital deleted successfully'
    });

  } catch (error) {
    console.error('Delete hospital error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting hospital'
    });
  }
};

/**
 * Get hospital availability and wait times
 */
exports.getHospitalAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    
    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    // Calculate current availability
    const availability = {
      isOpen: hospital.isCurrentlyOpen(),
      currentCapacity: hospital.capacity,
      estimatedWaitTime: hospital.getEstimatedWaitTime(),
      emergencyAvailable: hospital.services.includes('emergency'),
      departments: hospital.departments.map(dept => ({
        name: dept.name,
        isOpen: dept.operatingHours ? 
          isTimeInOperatingHours(new Date(), dept.operatingHours) : 
          hospital.isCurrentlyOpen(),
        estimatedWait: Math.floor(Math.random() * 60) + 15 // Simulated wait time
      })),
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: availability
    });

  } catch (error) {
    console.error('Get hospital availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving hospital availability'
    });
  }
};

/**
 * Get hospital departments
 */
exports.getHospitalDepartments = async (req, res) => {
  try {
    const { id } = req.params;
    
    const hospital = await Hospital.findById(id)
      .populate('departments.head', 'name specialties experience')
      .select('departments name');

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    res.json({
      success: true,
      data: {
        hospitalName: hospital.name,
        departments: hospital.departments
      }
    });

  } catch (error) {
    console.error('Get hospital departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving hospital departments'
    });
  }
};

/**
 * Get doctors associated with hospital
 */
exports.getHospitalDoctors = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const {
      specialty,
      available,
      page = 1,
      limit = 20
    } = req.query;

    // Build doctor search query
    const doctorQuery = { hospitalId: id };
    
    if (specialty) {
      doctorQuery.specialties = { $in: [specialty] };
    }

    // Execute query
    const skip = (page - 1) * limit;
    let doctorsQuery = Doctor.find(doctorQuery)
      .populate('userId', 'name email')
      .sort({ 'ratings.overall': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const [doctors, total] = await Promise.all([
      doctorsQuery,
      Doctor.countDocuments(doctorQuery)
    ]);

    // Filter by availability if requested
    let filteredDoctors = doctors;
    if (available === 'true') {
      filteredDoctors = doctors.filter(doctor => doctor.isAvailableNow());
    }

    res.json({
      success: true,
      data: {
        doctors: filteredDoctors.map(doctor => ({
          ...doctor.toObject(),
          isAvailable: doctor.isAvailableNow()
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get hospital doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving hospital doctors'
    });
  }
};

/**
 * Add review for hospital
 */
exports.addHospitalReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review data',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { rating, comment, category = 'overall' } = req.body;
    
    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    // Check if user already reviewed this hospital
    const existingReview = hospital.reviews.find(
      review => review.userId.toString() === req.user.id
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this hospital'
      });
    }

    // Add review
    hospital.reviews.push({
      userId: req.user.id,
      rating,
      comment,
      category,
      date: new Date()
    });

    await hospital.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: hospital.reviews[hospital.reviews.length - 1]
    });

  } catch (error) {
    console.error('Add hospital review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding review'
    });
  }
};

/**
 * Get hospital reviews
 */
exports.getHospitalReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 10,
      rating,
      category
    } = req.query;

    const hospital = await Hospital.findById(id)
      .populate('reviews.userId', 'name')
      .select('reviews ratings name');

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    // Filter reviews
    let reviews = hospital.reviews;
    
    if (rating) {
      reviews = reviews.filter(r => r.rating === parseFloat(rating));
    }
    
    if (category) {
      reviews = reviews.filter(r => r.category === category);
    }

    // Paginate
    const skip = (page - 1) * limit;
    const paginatedReviews = reviews
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: {
        hospitalName: hospital.name,
        reviews: paginatedReviews,
        ratings: hospital.ratings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: reviews.length,
          pages: Math.ceil(reviews.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get hospital reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving reviews'
    });
  }
};

/**
 * Emergency contact for critical situations
 */
exports.emergencyContact = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid emergency contact data',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const {
      patientInfo,
      emergencyType,
      severity,
      symptoms,
      contactPhone
    } = req.body;

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    if (!hospital.services.includes('emergency')) {
      return res.status(400).json({
        success: false,
        message: 'This hospital does not provide emergency services'
      });
    }

    // Create emergency record
    const emergencyRecord = {
      hospitalId: id,
      patientInfo,
      emergencyType,
      severity,
      symptoms,
      contactPhone,
      timestamp: new Date(),
      status: 'reported'
    };

    // In a real system, this would:
    // 1. Alert the hospital's emergency department
    // 2. Create a case number
    // 3. Send notifications to medical staff
    // 4. Update hospital capacity/availability

    const emergencyResponse = {
      caseNumber: `EM-${Date.now()}`,
      hospitalContact: hospital.contactInfo.phone,
      estimatedResponse: severity === 'critical' ? '5-10 minutes' : '15-30 minutes',
      instructions: getEmergencyInstructions(emergencyType, severity),
      hospitalAddress: hospital.address,
      isOpen: hospital.isCurrentlyOpen()
    };

    res.json({
      success: true,
      data: emergencyResponse,
      message: 'Emergency contact established successfully'
    });

  } catch (error) {
    console.error('Emergency contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing emergency contact'
    });
  }
};

/**
 * Get hospital statistics overview
 */
exports.getHospitalStatistics = async (req, res) => {
  try {
    const { region, type } = req.query;

    // Build aggregation pipeline
    const matchStage = {};
    if (region) matchStage['address.state'] = region;
    if (type) matchStage.type = type;

    const statistics = await Hospital.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalHospitals: { $sum: 1 },
          avgRating: { $avg: '$ratings.overall' },
          totalCapacity: { $sum: '$capacity' },
          servicesCovered: { $addToSet: '$services' },
          typeDistribution: {
            $push: '$type'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalHospitals: 1,
          avgRating: { $round: ['$avgRating', 2] },
          totalCapacity: 1,
          uniqueServices: { $size: { $reduce: {
            input: '$servicesCovered',
            initialValue: [],
            in: { $setUnion: ['$$value', '$$this'] }
          }}},
          typeDistribution: 1
        }
      }
    ]);

    const typeStats = await Hospital.aggregate([
      { $match: matchStage },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: statistics[0] || {
          totalHospitals: 0,
          avgRating: 0,
          totalCapacity: 0,
          uniqueServices: 0
        },
        typeBreakdown: typeStats,
        region: region || 'All regions',
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Get hospital statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving hospital statistics'
    });
  }
};

/**
 * Report issue with hospital information
 */
exports.reportIssue = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue report data',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { issueType, description, contactInfo } = req.body;

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    // Create issue report
    const issueReport = {
      reportId: `ISSUE-${Date.now()}`,
      hospitalId: id,
      hospitalName: hospital.name,
      reportedBy: req.user.id,
      issueType,
      description,
      contactInfo,
      status: 'reported',
      timestamp: new Date()
    };

    // In a real system, this would:
    // 1. Store in issue tracking system
    // 2. Notify administrators
    // 3. Create workflow for resolution

    res.json({
      success: true,
      data: {
        reportId: issueReport.reportId,
        status: 'reported',
        message: 'Issue report submitted successfully'
      },
      message: 'Thank you for reporting this issue. We will investigate and update the information.'
    });

  } catch (error) {
    console.error('Report issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting issue report'
    });
  }
};

/**
 * Get directions to hospital
 */
exports.getDirections = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid direction parameters',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { fromLat, fromLng, mode = 'driving' } = req.query;

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    // Calculate basic distance
    const [hospitalLng, hospitalLat] = hospital.location.coordinates;
    const distance = calculateDistance(
      parseFloat(fromLat),
      parseFloat(fromLng),
      hospitalLat,
      hospitalLng
    );

    // Estimate travel time based on mode
    const travelTimes = {
      driving: Math.max(5, Math.round(distance / 0.5)), // ~30 mph avg
      walking: Math.max(10, Math.round(distance * 12)), // ~5 mph
      transit: Math.max(10, Math.round(distance / 0.3)) // ~18 mph avg
    };

    const directions = {
      distance: Math.round(distance * 10) / 10, // Round to 1 decimal
      estimatedTime: travelTimes[mode],
      mode,
      destination: {
        name: hospital.name,
        address: hospital.address,
        coordinates: {
          latitude: hospitalLat,
          longitude: hospitalLng
        }
      },
      origin: {
        latitude: parseFloat(fromLat),
        longitude: parseFloat(fromLng)
      },
      // In a real system, would integrate with Google Maps API or similar
      mapUrl: `https://maps.google.com/maps?saddr=${fromLat},${fromLng}&daddr=${hospitalLat},${hospitalLng}&dirflg=${mode === 'walking' ? 'w' : mode === 'transit' ? 'r' : 'd'}`
    };

    res.json({
      success: true,
      data: directions
    });

  } catch (error) {
    console.error('Get directions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating directions'
    });
  }
};

// Helper functions

function isTimeInOperatingHours(time, operatingHours) {
  const day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][time.getDay()];
  const dayHours = operatingHours[day];
  
  if (!dayHours || dayHours.closed) return false;
  
  const currentTime = time.getHours() * 60 + time.getMinutes();
  const [openHour, openMin] = dayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = dayHours.close.split(':').map(Number);
  
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;
  
  return currentTime >= openTime && currentTime <= closeTime;
}

function getEmergencyInstructions(emergencyType, severity) {
  const instructions = {
    cardiac: {
      critical: ['Call 911 immediately', 'Start CPR if trained', 'Use AED if available'],
      high: ['Sit patient down', 'Loosen tight clothing', 'Monitor breathing'],
      medium: ['Keep patient calm', 'Monitor symptoms', 'Prepare for transport']
    },
    stroke: {
      critical: ['Call 911 immediately', 'Note time of symptom onset', 'Keep patient still'],
      high: ['Check for FAST symptoms', 'Keep airway clear', 'Monitor vital signs'],
      medium: ['Document symptoms', 'Prepare medical history', 'Stay with patient']
    },
    trauma: {
      critical: ['Control bleeding', 'Immobilize spine', 'Maintain breathing'],
      high: ['Apply direct pressure', 'Elevate injured area', 'Monitor for shock'],
      medium: ['Clean wounds', 'Apply bandages', 'Watch for complications']
    },
    respiratory: {
      critical: ['Ensure airway is clear', 'Assist breathing', 'Call 911'],
      high: ['Sit patient upright', 'Use rescue inhaler if available', 'Monitor oxygen'],
      medium: ['Remove triggers', 'Encourage slow breathing', 'Stay calm']
    }
  };

  return instructions[emergencyType]?.[severity] || [
    'Stay with the patient',
    'Monitor vital signs',
    'Prepare for medical transport'
  ];
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}