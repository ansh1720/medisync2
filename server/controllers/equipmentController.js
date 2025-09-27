/**
 * Equipment Controller
 * Handles medical device readings with interpretation and analytics
 */

const { validationResult } = require('express-validator');
const EquipmentReading = require('../models/EquipmentReading');
const Doctor = require('../models/Doctor');
const csv = require('csv-parser');
const { Readable } = require('stream');

/**
 * Submit new equipment reading
 */
exports.submitReading = async (req, res) => {
  try {
    console.log('User from req:', req.user); // Debug log
    console.log('Request body:', req.body); // Debug log
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reading data',
        errors: errors.array()
      });
    }

    const { 
      equipmentType, 
      readings, 
      deviceInfo, 
      notes, 
      location,
      timestamp 
    } = req.body;

    const readingData = {
      userId: req.user.userId,
      equipmentType,
      readings,
      deviceInfo: deviceInfo || {},
      timestamp: timestamp ? new Date(timestamp) : new Date()
    };

    // Only add optional fields if they exist
    if (notes) readingData.notes = notes;
    if (location && location.coordinates && location.coordinates.length === 2) {
      readingData.location = location;
    }

    const reading = new EquipmentReading(readingData);

    await reading.save();

    // Populate for response
    await reading.populate('sharedWith.doctorId', 'name specialties');

    res.status(201).json({
      success: true,
      data: reading,
      message: `${equipmentType} reading recorded successfully`
    });

  } catch (error) {
    console.error('Submit reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting reading',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Submit multiple readings at once
 */
exports.submitBulkReadings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bulk reading data',
        errors: errors.array()
      });
    }

    const { readings } = req.body;
    
    // Prepare readings for insertion
    const readingDocuments = readings.map(reading => ({
      userId: req.user.userId,
      equipmentType: reading.equipmentType,
      readings: reading.readings,
      deviceInfo: reading.deviceInfo || {},
      notes: reading.notes,
      location: reading.location,
      timestamp: reading.timestamp ? new Date(reading.timestamp) : new Date()
    }));

    const savedReadings = await EquipmentReading.insertMany(readingDocuments);

    res.status(201).json({
      success: true,
      data: {
        count: savedReadings.length,
        readings: savedReadings
      },
      message: `${savedReadings.length} readings recorded successfully`
    });

  } catch (error) {
    console.error('Submit bulk readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting bulk readings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Upload readings from file (CSV/JSON)
 */
exports.uploadReadingsFile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file upload data',
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { equipmentType } = req.body;
    const { buffer, mimetype } = req.file;
    
    let readings = [];

    if (mimetype === 'application/json' || mimetype === 'text/json') {
      // Handle JSON file
      const jsonData = JSON.parse(buffer.toString());
      readings = Array.isArray(jsonData) ? jsonData : [jsonData];
    } else if (mimetype === 'text/csv') {
      // Handle CSV file
      readings = await parseCSV(buffer, equipmentType);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file format'
      });
    }

    // Process and validate readings
    const readingDocuments = readings.map(reading => ({
      userId: req.user.userId,
      equipmentType,
      readings: reading.readings || reading,
      timestamp: reading.timestamp ? new Date(reading.timestamp) : new Date(),
      deviceInfo: reading.deviceInfo || {},
      notes: reading.notes || 'Uploaded from file'
    }));

    const savedReadings = await EquipmentReading.insertMany(readingDocuments);

    res.status(201).json({
      success: true,
      data: {
        count: savedReadings.length,
        readings: savedReadings.slice(0, 10) // Return first 10 for preview
      },
      message: `${savedReadings.length} readings uploaded successfully`
    });

  } catch (error) {
    console.error('Upload readings file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing file upload',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get reading history
 */
exports.getReadingHistory = async (req, res) => {
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
      equipmentType,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    // Build filter
    const filter = { userId: req.user.userId };
    
    if (equipmentType) {
      filter.equipmentType = equipmentType;
    }
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Execute query
    const skip = (page - 1) * limit;
    const [history, total] = await Promise.all([
      EquipmentReading.find(filter)
        .populate('sharedWith.doctorId', 'name specialties')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      EquipmentReading.countDocuments(filter)
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
    console.error('Get reading history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving reading history'
    });
  }
};

/**
 * Get specific reading by ID
 */
exports.getReadingById = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reading ID',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    
    const reading = await EquipmentReading.findOne({
      _id: id,
      userId: req.user.userId
    }).populate('sharedWith.doctorId', 'name specialties contactInfo');

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Reading not found'
      });
    }

    res.json({
      success: true,
      data: reading
    });

  } catch (error) {
    console.error('Get reading by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving reading'
    });
  }
};

/**
 * Get analytics and trends
 */
exports.getAnalytics = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid analytics parameters',
        errors: errors.array()
      });
    }

    const { 
      equipmentType, 
      period = 'month',
      includeAverages = true 
    } = req.query;

    // Calculate date range
    const periodDays = {
      'week': 7,
      'month': 30,
      'quarter': 90,
      'year': 365
    };
    
    const days = periodDays[period] || 30;

    // Get analytics data
    const analytics = await EquipmentReading.getAnalytics(
      req.user.userId, 
      equipmentType, 
      days
    );

    // Calculate summary statistics if requested
    let summary = {};
    if (includeAverages) {
      summary = await calculateSummaryStats(req.user.userId, equipmentType, days);
    }

    res.json({
      success: true,
      data: {
        analytics,
        summary,
        period: {
          name: period,
          days,
          startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          endDate: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving analytics'
    });
  }
};

/**
 * Get alerts
 */
exports.getAlerts = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid alert parameters',
        errors: errors.array()
      });
    }

    const { 
      severity,
      acknowledged,
      limit = 20
    } = req.query;

    // Build query
    const query = { 
      userId: req.user.userId,
      'alert.severity': { $exists: true }
    };

    if (severity) {
      query['alert.severity'] = severity;
    }

    if (acknowledged !== undefined) {
      query['alert.acknowledged.status'] = acknowledged === 'true';
    }

    const alerts = await EquipmentReading.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('sharedWith.doctorId', 'name specialties');

    // Group alerts by severity
    const groupedAlerts = alerts.reduce((acc, reading) => {
      const severity = reading.alert.severity;
      if (!acc[severity]) acc[severity] = [];
      acc[severity].push(reading);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        alerts,
        groupedBySeverity: groupedAlerts,
        summary: {
          total: alerts.length,
          critical: alerts.filter(a => a.alert.severity === 'critical').length,
          high: alerts.filter(a => a.alert.severity === 'high').length,
          medium: alerts.filter(a => a.alert.severity === 'medium').length,
          acknowledged: alerts.filter(a => a.alert.acknowledged.status).length
        }
      }
    });

  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving alerts'
    });
  }
};

/**
 * Acknowledge an alert
 */
exports.acknowledgeAlert = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid acknowledgment data',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { notes } = req.body;

    const reading = await EquipmentReading.findOne({
      _id: id,
      userId: req.user.userId
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    if (!reading.alert || !reading.alert.severity) {
      return res.status(400).json({
        success: false,
        message: 'No alert to acknowledge'
      });
    }

    await reading.acknowledgeAlert(notes);

    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
      data: reading.alert
    });

  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Error acknowledging alert'
    });
  }
};

/**
 * Get reading summary for dashboard
 */
exports.getReadingSummary = async (req, res) => {
  try {
    // Get latest reading for each equipment type
    const equipmentTypes = [
      'blood_pressure', 'thermometer', 'pulse_oximeter', 
      'glucometer', 'heart_rate_monitor', 'weight_scale'
    ];

    const latestReadings = await Promise.all(
      equipmentTypes.map(async (type) => {
        const reading = await EquipmentReading.findOne({
          userId: req.user.userId,
          equipmentType: type
        }).sort({ timestamp: -1 });
        return { equipmentType: type, reading };
      })
    );

    // Get active alerts count
    const alertsCount = await EquipmentReading.countDocuments({
      userId: req.user.userId,
      'alert.severity': { $exists: true },
      'alert.acknowledged.status': false
    });

    // Get total readings in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentReadingsCount = await EquipmentReading.countDocuments({
      userId: req.user.userId,
      timestamp: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      data: {
        latestReadings: latestReadings.filter(item => item.reading),
        statistics: {
          activeAlerts: alertsCount,
          recentReadings: recentReadingsCount,
          totalEquipmentTypes: latestReadings.filter(item => item.reading).length
        }
      }
    });

  } catch (error) {
    console.error('Get reading summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving reading summary'
    });
  }
};

/**
 * Export readings as CSV or JSON
 */
exports.exportReadings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid export parameters',
        errors: errors.array()
      });
    }

    const {
      format = 'csv',
      equipmentType,
      startDate,
      endDate
    } = req.query;

    // Build filter
    const filter = { userId: req.user.userId };
    
    if (equipmentType) {
      filter.equipmentType = equipmentType;
    }
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const readings = await EquipmentReading.find(filter)
      .sort({ timestamp: -1 })
      .limit(5000); // Limit for performance

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 
        `attachment; filename="medisync-readings-${Date.now()}.json"`);
      return res.json(readings);
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 
        `attachment; filename="medisync-readings-${Date.now()}.csv"`);
      
      // Convert to CSV
      const csvData = convertToCSV(readings);
      return res.send(csvData);
    }

    res.status(400).json({
      success: false,
      message: 'Unsupported export format'
    });

  } catch (error) {
    console.error('Export readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting readings'
    });
  }
};

/**
 * Delete a reading
 */
exports.deleteReading = async (req, res) => {
  try {
    const { id } = req.params;

    const reading = await EquipmentReading.findOneAndDelete({
      _id: id,
      userId: req.user.userId
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Reading not found'
      });
    }

    res.json({
      success: true,
      message: 'Reading deleted successfully'
    });

  } catch (error) {
    console.error('Delete reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting reading'
    });
  }
};

/**
 * Update a reading
 */
exports.updateReading = async (req, res) => {
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
    const { notes, readings } = req.body;

    const reading = await EquipmentReading.findOne({
      _id: id,
      userId: req.user.userId
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Reading not found'
      });
    }

    // Update fields
    if (notes !== undefined) reading.notes = notes;
    if (readings !== undefined) reading.readings = readings;

    await reading.save();

    res.json({
      success: true,
      data: reading,
      message: 'Reading updated successfully'
    });

  } catch (error) {
    console.error('Update reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating reading'
    });
  }
};

/**
 * Get reference ranges
 */
exports.getReferenceRanges = async (req, res) => {
  try {
    const referenceRanges = {
      blood_pressure: {
        normal: { systolic: [90, 120], diastolic: [60, 80] },
        elevated: { systolic: [120, 129], diastolic: [60, 80] },
        high_stage1: { systolic: [130, 139], diastolic: [80, 89] },
        high_stage2: { systolic: [140, 180], diastolic: [90, 110] },
        crisis: { systolic: [180, null], diastolic: [110, null] }
      },
      
      thermometer: {
        hypothermia: [null, 95],
        normal: [97, 99],
        low_fever: [99, 100.4],
        fever: [100.4, 103],
        high_fever: [103, null]
      },
      
      pulse_oximeter: {
        oxygen: {
          critical: [null, 90],
          low: [90, 95],
          normal: [95, 100]
        },
        heartRate: {
          bradycardia: [null, 60],
          normal: [60, 100],
          tachycardia: [100, null]
        }
      },
      
      glucometer: {
        hypoglycemia_severe: [null, 50],
        hypoglycemia: [50, 70],
        normal: [70, 140],
        prediabetes: [140, 200],
        diabetes: [200, null]
      }
    };

    res.json({
      success: true,
      data: referenceRanges,
      lastUpdated: '2024-01-01',
      source: 'Clinical guidelines and medical references'
    });

  } catch (error) {
    console.error('Get reference ranges error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving reference ranges'
    });
  }
};

/**
 * Share reading with doctor
 */
exports.shareReading = async (req, res) => {
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
    const { doctorId, message } = req.body;

    // Verify doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const reading = await EquipmentReading.findOne({
      _id: id,
      userId: req.user.userId
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Reading not found'
      });
    }

    await reading.shareWithDoctor(doctorId, message);

    res.json({
      success: true,
      message: 'Reading shared with doctor successfully'
    });

  } catch (error) {
    console.error('Share reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sharing reading'
    });
  }
};

// Helper functions

async function parseCSV(buffer, equipmentType) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer.toString());
    
    stream
      .pipe(csv())
      .on('data', (data) => {
        // Convert CSV row to reading format based on equipment type
        const reading = convertCSVRowToReading(data, equipmentType);
        if (reading) results.push(reading);
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

function convertCSVRowToReading(row, equipmentType) {
  try {
    const converters = {
      blood_pressure: (r) => ({
        readings: {
          systolic: parseFloat(r.systolic),
          diastolic: parseFloat(r.diastolic)
        },
        timestamp: r.timestamp || r.date
      }),
      
      thermometer: (r) => ({
        readings: {
          temperature: parseFloat(r.temperature)
        },
        timestamp: r.timestamp || r.date
      }),
      
      pulse_oximeter: (r) => ({
        readings: {
          oxygenSaturation: parseFloat(r.oxygen || r.spo2),
          heartRate: parseFloat(r.heartRate || r.pulse)
        },
        timestamp: r.timestamp || r.date
      }),
      
      glucometer: (r) => ({
        readings: {
          glucoseLevel: parseFloat(r.glucose || r.bloodSugar)
        },
        timestamp: r.timestamp || r.date
      })
    };
    
    const converter = converters[equipmentType];
    return converter ? converter(row) : null;
  } catch (error) {
    console.error('CSV conversion error:', error);
    return null;
  }
}

function convertToCSV(readings) {
  if (!readings.length) return '';
  
  const headers = [
    'timestamp', 'equipmentType', 'readings', 'interpretation', 
    'status', 'notes', 'deviceModel'
  ];
  
  const csvRows = [headers.join(',')];
  
  readings.forEach(reading => {
    const row = [
      reading.timestamp.toISOString(),
      reading.equipmentType,
      JSON.stringify(reading.readings).replace(/"/g, '""'),
      reading.interpretation.message.replace(/"/g, '""'),
      reading.interpretation.status,
      (reading.notes || '').replace(/"/g, '""'),
      reading.deviceInfo?.model || ''
    ];
    csvRows.push(row.map(field => `"${field}"`).join(','));
  });
  
  return csvRows.join('\n');
}

async function calculateSummaryStats(userId, equipmentType, days) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const filter = {
    userId,
    timestamp: { $gte: startDate }
  };
  
  if (equipmentType) {
    filter.equipmentType = equipmentType;
  }
  
  const readings = await EquipmentReading.find(filter);
  
  if (!readings.length) {
    return { totalReadings: 0, averages: {}, trends: {} };
  }
  
  // Group by equipment type and calculate averages
  const grouped = readings.reduce((acc, reading) => {
    const type = reading.equipmentType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(reading);
    return acc;
  }, {});
  
  const summary = {
    totalReadings: readings.length,
    averages: {},
    trends: {},
    statusDistribution: {
      normal: readings.filter(r => r.interpretation.status === 'normal').length,
      borderline: readings.filter(r => r.interpretation.status === 'borderline').length,
      abnormal: readings.filter(r => r.interpretation.status === 'abnormal').length,
      critical: readings.filter(r => r.interpretation.status === 'critical').length
    }
  };
  
  // Calculate averages for each equipment type
  Object.keys(grouped).forEach(type => {
    const typeReadings = grouped[type];
    const averageCalculators = {
      blood_pressure: (readings) => {
        const systolic = readings.map(r => r.readings.systolic);
        const diastolic = readings.map(r => r.readings.diastolic);
        return {
          avgSystolic: systolic.reduce((a, b) => a + b, 0) / systolic.length,
          avgDiastolic: diastolic.reduce((a, b) => a + b, 0) / diastolic.length
        };
      },
      
      thermometer: (readings) => {
        const temps = readings.map(r => r.readings.temperature);
        return {
          avgTemperature: temps.reduce((a, b) => a + b, 0) / temps.length
        };
      },
      
      pulse_oximeter: (readings) => {
        const spo2 = readings.map(r => r.readings.oxygenSaturation);
        const hr = readings.map(r => r.readings.heartRate);
        return {
          avgOxygenSaturation: spo2.reduce((a, b) => a + b, 0) / spo2.length,
          avgHeartRate: hr.reduce((a, b) => a + b, 0) / hr.length
        };
      }
    };
    
    const calculator = averageCalculators[type];
    if (calculator) {
      summary.averages[type] = calculator(typeReadings);
    }
  });
  
  return summary;
}
