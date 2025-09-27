/**
 * Consultation Controller
 * Handles doctor consultation booking and management system
 */

const { validationResult } = require('express-validator');
const Consultation = require('../models/Consultation');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { getIO } = require('../utils/socket'); // Socket.IO instance

/**
 * Get available doctors for consultation
 */
exports.getAvailableDoctors = async (req, res) => {
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
      specialty,
      consultationType,
      dateRange,
      rating,
      location,
      page = 1,
      limit = 20
    } = req.query;

    // Build filter query
    const filter = { isActive: true };
    
    if (specialty && specialty !== 'all') {
      filter.specialty = specialty;
    }
    
    if (consultationType) {
      filter.consultationTypes = { $in: [consultationType] };
    }
    
    if (rating) {
      filter['rating.average'] = { $gte: parseFloat(rating) };
    }
    
    if (location) {
      filter['location.city'] = { $regex: location, $options: 'i' };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    console.log('Final filter before query:', filter);
    console.log('Skip:', skip, 'Limit:', limit);
    
    const [doctors, total] = await Promise.all([
      Doctor.find(filter)
        .select('-createdAt -updatedAt')
        .sort({ 'rating.average': -1, name: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Doctor.countDocuments(filter)
    ]);
    


    // Enhance doctor data with availability status
    const enhancedDoctors = doctors.map(doctor => ({
      ...doctor.toObject(),
      isOnline: Math.random() > 0.3, // Mock online status
      nextAvailableSlot: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000), // Mock next slot
      consultationFee: doctor.consultationFee || 50 // Default fee
    }));

    res.json({
      success: true,
      data: {
        doctors: enhancedDoctors,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          specialty,
          consultationType,
          rating: rating ? parseFloat(rating) : null,
          location
        }
      },
      message: `Found ${enhancedDoctors.length} available doctors`
    });

  } catch (error) {
    console.error('Get available doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available doctors',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Book new consultation with doctor
 */
exports.bookConsultation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking data',
        errors: errors.array()
      });
    }

    const {
      doctorId,
      preferredDateTime,
      consultationType,
      symptoms,
      urgency,
      medicalHistory,
      currentMedications,
      allergies,
      insuranceInfo
    } = req.body;

    // Verify doctor exists and is available
    const doctor = await Doctor.findById(doctorId).populate('userId', 'name');
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check if the requested time slot is available
    const requestedDate = new Date(preferredDateTime);
    const isAvailable = await doctor.isTimeSlotAvailable(requestedDate, consultationType === 'in_person' ? 60 : 30);
    
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Selected time slot is not available',
        suggestedTimes: await doctor.getNextAvailableSlots(5)
      });
    }

    // Check for existing consultations in the same time slot
    const existingConsultation = await Consultation.findOne({
      doctorId,
      scheduledDateTime: {
        $gte: new Date(requestedDate.getTime() - 15 * 60000), // 15 min before
        $lte: new Date(requestedDate.getTime() + 15 * 60000)  // 15 min after
      },
      status: { $in: ['scheduled', 'ongoing'] }
    });

    if (existingConsultation) {
      return res.status(400).json({
        success: false,
        message: 'Time slot conflicts with existing consultation'
      });
    }

    // Calculate consultation fee
    const baseFee = doctor.consultationFee || 100;
    const urgencyMultiplier = {
      low: 1.0,
      medium: 1.2,
      high: 1.5,
      urgent: 2.0
    };
    const typeMultiplier = {
      chat: 0.8,
      audio: 0.9,
      video: 1.0,
      in_person: 1.3
    };
    
    const totalFee = Math.round(baseFee * urgencyMultiplier[urgency] * typeMultiplier[consultationType]);

    // Create consultation
    const consultation = new Consultation({
      patientId: req.user.id,
      doctorId,
      scheduledDateTime: requestedDate,
      consultationType,
      urgency,
      symptoms,
      medicalHistory,
      currentMedications: currentMedications || [],
      allergies: allergies || [],
      insuranceInfo,
      fee: {
        amount: totalFee,
        currency: 'USD',
        breakdown: {
          baseFee,
          urgencyMultiplier: urgencyMultiplier[urgency],
          typeMultiplier: typeMultiplier[consultationType]
        }
      },
      status: 'scheduled'
    });

    await consultation.save();

    // Populate for response
    await consultation.populate([
      { path: 'patientId', select: 'name email phone' },
      { path: 'doctorId', populate: { path: 'userId', select: 'name email' } }
    ]);

    // Send real-time notification to doctor
    if (io) {
      getIO().to(`doctor_${doctorId}`).emit('new_consultation', {
        consultationId: consultation._id,
        patient: consultation.patientId.name,
        dateTime: requestedDate,
        type: consultationType,
        urgency
      });
    }

    // Send confirmation email (would integrate with email service)
    // await sendConsultationConfirmationEmail(consultation);

    res.status(201).json({
      success: true,
      data: consultation,
      message: `Consultation booked successfully for ${requestedDate.toLocaleString()}`
    });

  } catch (error) {
    console.error('Book consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error booking consultation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get doctor availability slots
 */
exports.getDoctorAvailability = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid availability request',
        errors: errors.array()
      });
    }

    const { doctorId, date, duration = 30 } = req.query;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const requestedDate = new Date(date);
    const availableSlots = await doctor.getAvailableSlots(requestedDate, parseInt(duration));

    // Get existing consultations for the day to show busy slots
    const dayStart = new Date(requestedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(requestedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const existingConsultations = await Consultation.find({
      doctorId,
      scheduledDateTime: {
        $gte: dayStart,
        $lte: dayEnd
      },
      status: { $in: ['scheduled', 'ongoing'] }
    }).select('scheduledDateTime consultationType');

    res.json({
      success: true,
      data: {
        doctor: {
          id: doctor._id,
          name: doctor.userId.name,
          specialties: doctor.specialties
        },
        date: requestedDate.toDateString(),
        availableSlots,
        busySlots: existingConsultations.map(c => ({
          time: c.scheduledDateTime,
          type: c.consultationType
        })),
        workingHours: doctor.availability.workingHours,
        consultationTypes: doctor.consultationTypes || ['video', 'audio', 'chat']
      }
    });

  } catch (error) {
    console.error('Get doctor availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving doctor availability'
    });
  }
};

/**
 * Get user's consultations
 */
exports.getUserConsultations = async (req, res) => {
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
      status,
      type,
      startDate,
      endDate,
      doctorId,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter
    const filter = { patientId: req.user.id };
    
    if (status) filter.status = status;
    if (type) filter.consultationType = type;
    if (doctorId) filter.doctorId = doctorId;
    
    if (startDate || endDate) {
      filter.scheduledDateTime = {};
      if (startDate) filter.scheduledDateTime.$gte = new Date(startDate);
      if (endDate) filter.scheduledDateTime.$lte = new Date(endDate);
    }

    // Execute query
    const skip = (page - 1) * limit;
    const [consultations, total] = await Promise.all([
      Consultation.find(filter)
        .populate('doctorId', 'userId specialties ratings consultationFee')
        .populate('doctorId.userId', 'name')
        .sort({ scheduledDateTime: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Consultation.countDocuments(filter)
    ]);

    // Add computed fields
    const enhancedConsultations = consultations.map(consultation => ({
      ...consultation.toObject(),
      canJoin: consultation.canJoinNow(),
      canCancel: consultation.canCancel(),
      canReschedule: consultation.canReschedule(),
      timeUntilConsultation: consultation.getTimeUntilConsultation()
    }));

    res.json({
      success: true,
      data: {
        consultations: enhancedConsultations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        summary: {
          scheduled: consultations.filter(c => c.status === 'scheduled').length,
          completed: consultations.filter(c => c.status === 'completed').length,
          cancelled: consultations.filter(c => c.status === 'cancelled').length
        }
      }
    });

  } catch (error) {
    console.error('Get user consultations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving consultations'
    });
  }
};

/**
 * Get specific consultation details
 */
exports.getConsultationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const consultation = await Consultation.findById(id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'userId specialties ratings experience consultationFee')
      .populate('doctorId.userId', 'name email');

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check if user has permission to view this consultation
    const isPatient = consultation.patientId._id.toString() === req.user.id;
    const isDoctor = consultation.doctorId.userId._id.toString() === req.user.id;

    if (!isPatient && !isDoctor && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Add computed fields
    const consultationData = {
      ...consultation.toObject(),
      canJoin: consultation.canJoinNow(),
      canCancel: consultation.canCancel(),
      canReschedule: consultation.canReschedule(),
      timeUntilConsultation: consultation.getTimeUntilConsultation(),
      isPatientView: isPatient,
      isDoctorView: isDoctor
    };

    res.json({
      success: true,
      data: consultationData
    });

  } catch (error) {
    console.error('Get consultation by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving consultation'
    });
  }
};

/**
 * Reschedule consultation
 */
exports.rescheduleConsultation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reschedule data',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { newDateTime, reason } = req.body;

    const consultation = await Consultation.findById(id)
      .populate('doctorId')
      .populate('patientId', 'name');

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check permissions
    if (consultation.patientId._id.toString() !== req.user.id && 
        consultation.doctorId.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if consultation can be rescheduled
    if (!consultation.canReschedule()) {
      return res.status(400).json({
        success: false,
        message: 'Consultation cannot be rescheduled at this time'
      });
    }

    // Check new time slot availability
    const newDate = new Date(newDateTime);
    const isAvailable = await consultation.doctorId.isTimeSlotAvailable(
      newDate, 
      consultation.consultationType === 'in_person' ? 60 : 30
    );

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'New time slot is not available',
        suggestedTimes: await consultation.doctorId.getNextAvailableSlots(5)
      });
    }

    // Update consultation
    consultation.previousDateTime = consultation.scheduledDateTime;
    consultation.scheduledDateTime = newDate;
    consultation.status = 'rescheduled';
    consultation.rescheduleHistory.push({
      previousDateTime: consultation.previousDateTime,
      newDateTime: newDate,
      reason,
      rescheduledBy: req.user.id,
      rescheduledAt: new Date()
    });

    await consultation.save();

    // Send notifications
    if (io) {
      const recipientId = consultation.patientId._id.toString() === req.user.id ? 
        `doctor_${consultation.doctorId._id}` : 
        `patient_${consultation.patientId._id}`;
      
      getIO().to(recipientId).emit('consultation_rescheduled', {
        consultationId: consultation._id,
        newDateTime: newDate,
        reason
      });
    }

    res.json({
      success: true,
      data: consultation,
      message: `Consultation rescheduled to ${newDate.toLocaleString()}`
    });

  } catch (error) {
    console.error('Reschedule consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rescheduling consultation'
    });
  }
};

/**
 * Cancel consultation
 */
exports.cancelConsultation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cancellation data',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { reason, requestRefund = false } = req.body;

    const consultation = await Consultation.findById(id)
      .populate('doctorId')
      .populate('patientId', 'name');

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check permissions
    if (consultation.patientId._id.toString() !== req.user.id && 
        consultation.doctorId.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if consultation can be cancelled
    if (!consultation.canCancel()) {
      return res.status(400).json({
        success: false,
        message: 'Consultation cannot be cancelled at this time'
      });
    }

    // Calculate refund amount based on cancellation time
    let refundAmount = 0;
    const hoursUntilConsultation = (consultation.scheduledDateTime - new Date()) / (1000 * 60 * 60);
    
    if (requestRefund && hoursUntilConsultation > 24) {
      refundAmount = consultation.fee.amount * 0.9; // 90% refund
    } else if (requestRefund && hoursUntilConsultation > 2) {
      refundAmount = consultation.fee.amount * 0.5; // 50% refund
    }

    // Update consultation
    consultation.status = 'cancelled';
    consultation.cancellationReason = reason;
    consultation.cancelledBy = req.user.id;
    consultation.cancelledAt = new Date();
    consultation.refundAmount = refundAmount;

    await consultation.save();

    // Process refund if applicable
    if (refundAmount > 0) {
      // In a real system, would integrate with payment processor
      consultation.refundStatus = 'pending';
      consultation.refundProcessedAt = null;
    }

    // Send notifications
    if (io) {
      const recipientId = consultation.patientId._id.toString() === req.user.id ? 
        `doctor_${consultation.doctorId._id}` : 
        `patient_${consultation.patientId._id}`;
      
      getIO().to(recipientId).emit('consultation_cancelled', {
        consultationId: consultation._id,
        reason,
        refundAmount
      });
    }

    res.json({
      success: true,
      data: {
        consultationId: consultation._id,
        status: 'cancelled',
        refundAmount,
        refundStatus: consultation.refundStatus
      },
      message: 'Consultation cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling consultation'
    });
  }
};

/**
 * Join consultation (get meeting details)
 */
exports.joinConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const consultation = await Consultation.findById(id)
      .populate('doctorId')
      .populate('patientId', 'name');

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check permissions
    const isPatient = consultation.patientId._id.toString() === req.user.id;
    const isDoctor = consultation.doctorId.userId.toString() === req.user.id;

    if (!isPatient && !isDoctor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if consultation can be joined
    if (!consultation.canJoinNow()) {
      return res.status(400).json({
        success: false,
        message: 'Consultation cannot be joined at this time',
        timeUntilConsultation: consultation.getTimeUntilConsultation()
      });
    }

    // Update consultation status to ongoing if not already
    if (consultation.status === 'scheduled') {
      consultation.status = 'ongoing';
      consultation.actualStartTime = new Date();
      await consultation.save();
    }

    // Generate meeting details based on consultation type
    let meetingDetails = {};
    
    switch (consultation.consultationType) {
      case 'video':
      case 'audio':
        // In a real system, would integrate with video conferencing service
        meetingDetails = {
          meetingId: `medisync-${consultation._id}`,
          joinUrl: `https://meet.medisync.com/room/${consultation._id}`,
          password: generateMeetingPassword(),
          dialIn: consultation.consultationType === 'audio' ? '+1-555-123-4567' : undefined
        };
        break;
        
      case 'chat':
        meetingDetails = {
          chatRoomId: `chat-${consultation._id}`,
          chatUrl: `/chat/${consultation._id}`
        };
        break;
        
      case 'in_person':
        meetingDetails = {
          location: consultation.doctorId.clinicAddress || 'Clinic address not available',
          instructions: 'Please arrive 15 minutes early for check-in'
        };
        break;
    }

    // Send notification to the other party
    if (io) {
      const otherPartyId = isPatient ? 
        `doctor_${consultation.doctorId._id}` : 
        `patient_${consultation.patientId._id}`;
      
      getIO().to(otherPartyId).emit('consultation_joined', {
        consultationId: consultation._id,
        joinedBy: isPatient ? 'patient' : 'doctor',
        meetingDetails
      });
    }

    res.json({
      success: true,
      data: {
        consultation: {
          id: consultation._id,
          type: consultation.consultationType,
          status: consultation.status,
          doctor: consultation.doctorId.userId.name,
          patient: consultation.patientId.name,
          scheduledTime: consultation.scheduledDateTime
        },
        meetingDetails,
        userRole: isPatient ? 'patient' : 'doctor'
      },
      message: 'Joining consultation...'
    });

  } catch (error) {
    console.error('Join consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining consultation'
    });
  }
};

/**
 * Complete consultation (doctor only)
 */
exports.completeConsultation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid completion data',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const {
      diagnosis,
      treatmentPlan,
      prescriptions,
      followUpRequired,
      followUpDate,
      notes
    } = req.body;

    const consultation = await Consultation.findById(id)
      .populate('patientId', 'name email');

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Verify doctor ownership
    if (consultation.doctorId.toString() !== req.user.doctorProfile) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update consultation
    consultation.status = 'completed';
    consultation.actualEndTime = new Date();
    consultation.diagnosis = diagnosis;
    consultation.treatmentPlan = treatmentPlan;
    consultation.followUpRequired = followUpRequired;
    consultation.followUpDate = followUpDate ? new Date(followUpDate) : null;
    consultation.doctorNotes = notes;

    // Add prescriptions if provided
    if (prescriptions && prescriptions.length > 0) {
      consultation.prescriptions = prescriptions.map(prescription => ({
        ...prescription,
        prescribedAt: new Date(),
        prescribedBy: req.user.id
      }));
    }

    await consultation.save();

    // Update doctor statistics
    const doctor = await Doctor.findById(consultation.doctorId);
    if (doctor) {
      doctor.totalConsultations = (doctor.totalConsultations || 0) + 1;
      await doctor.save();
    }

    // Send notification to patient
    if (io) {
      getIO().to(`patient_${consultation.patientId._id}`).emit('consultation_completed', {
        consultationId: consultation._id,
        diagnosis,
        treatmentPlan,
        prescriptions: consultation.prescriptions,
        followUpRequired
      });
    }

    res.json({
      success: true,
      data: consultation,
      message: 'Consultation completed successfully'
    });

  } catch (error) {
    console.error('Complete consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing consultation'
    });
  }
};

/**
 * Get doctor's consultation schedule
 */
exports.getDoctorSchedule = async (req, res) => {
  try {
    const {
      date,
      view = 'day',
      status
    } = req.query;

    // Get doctor profile
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Calculate date range based on view
    const baseDate = date ? new Date(date) : new Date();
    let startDate, endDate;

    switch (view) {
      case 'day':
        startDate = new Date(baseDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(baseDate);
        endDate.setHours(23, 59, 59, 999);
        break;
        
      case 'week':
        startDate = new Date(baseDate);
        startDate.setDate(baseDate.getDate() - baseDate.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
        
      case 'month':
        startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    // Build query filter
    const filter = {
      doctorId: doctor._id,
      scheduledDateTime: {
        $gte: startDate,
        $lte: endDate
      }
    };

    if (status) {
      filter.status = status;
    }

    // Get consultations
    const consultations = await Consultation.find(filter)
      .populate('patientId', 'name email phone')
      .sort({ scheduledDateTime: 1 });

    // Group by date for better organization
    const groupedConsultations = {};
    consultations.forEach(consultation => {
      const dateKey = consultation.scheduledDateTime.toDateString();
      if (!groupedConsultations[dateKey]) {
        groupedConsultations[dateKey] = [];
      }
      groupedConsultations[dateKey].push({
        ...consultation.toObject(),
        canJoin: consultation.canJoinNow(),
        timeUntilConsultation: consultation.getTimeUntilConsultation()
      });
    });

    res.json({
      success: true,
      data: {
        schedule: groupedConsultations,
        summary: {
          total: consultations.length,
          scheduled: consultations.filter(c => c.status === 'scheduled').length,
          ongoing: consultations.filter(c => c.status === 'ongoing').length,
          completed: consultations.filter(c => c.status === 'completed').length,
          cancelled: consultations.filter(c => c.status === 'cancelled').length
        },
        view,
        dateRange: {
          start: startDate,
          end: endDate
        }
      }
    });

  } catch (error) {
    console.error('Get doctor schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving doctor schedule'
    });
  }
};

/**
 * Add consultation notes (doctor only)
 */
exports.addConsultationNotes = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notes data',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { notes, isPrivate = false } = req.body;

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Verify doctor ownership
    if (consultation.doctorId.toString() !== req.user.doctorProfile) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Add notes
    consultation.doctorNotes = consultation.doctorNotes || [];
    consultation.doctorNotes.push({
      note: notes,
      isPrivate,
      addedAt: new Date(),
      addedBy: req.user.id
    });

    await consultation.save();

    res.json({
      success: true,
      data: {
        consultationId: consultation._id,
        notesCount: consultation.doctorNotes.length
      },
      message: 'Notes added successfully'
    });

  } catch (error) {
    console.error('Add consultation notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding consultation notes'
    });
  }
};

/**
 * Add prescription to consultation
 */
exports.addPrescription = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid prescription data',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { medications, pharmacyInstructions } = req.body;

    const consultation = await Consultation.findById(id)
      .populate('patientId', 'name email');

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Verify doctor ownership
    if (consultation.doctorId.toString() !== req.user.doctorProfile) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Add prescription
    const prescription = {
      medications: medications.map(med => ({
        ...med,
        prescribedAt: new Date()
      })),
      pharmacyInstructions,
      prescribedBy: req.user.id,
      prescribedAt: new Date(),
      prescriptionId: `RX-${Date.now()}-${consultation._id.toString().slice(-6)}`
    };

    consultation.prescriptions = consultation.prescriptions || [];
    consultation.prescriptions.push(prescription);

    await consultation.save();

    // Send notification to patient
    if (io) {
      getIO().to(`patient_${consultation.patientId._id}`).emit('new_prescription', {
        consultationId: consultation._id,
        prescriptionId: prescription.prescriptionId,
        medications: prescription.medications
      });
    }

    res.json({
      success: true,
      data: prescription,
      message: 'Prescription added successfully'
    });

  } catch (error) {
    console.error('Add prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding prescription'
    });
  }
};

/**
 * Get consultation prescription
 */
exports.getConsultationPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    
    const consultation = await Consultation.findById(id)
      .populate('doctorId', 'userId specialties')
      .populate('doctorId.userId', 'name')
      .populate('patientId', 'name email')
      .select('prescriptions patientId doctorId scheduledDateTime');

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check permissions
    const isPatient = consultation.patientId._id.toString() === req.user.id;
    const isDoctor = consultation.doctorId.userId._id.toString() === req.user.id;

    if (!isPatient && !isDoctor && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        consultationId: consultation._id,
        consultationDate: consultation.scheduledDateTime,
        doctor: consultation.doctorId,
        patient: consultation.patientId,
        prescriptions: consultation.prescriptions || []
      }
    });

  } catch (error) {
    console.error('Get consultation prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving prescription'
    });
  }
};

/**
 * Add consultation review
 */
exports.addConsultationReview = async (req, res) => {
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
    const { rating, comment, categories, wouldRecommend } = req.body;

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check if patient can review
    if (consultation.patientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only patients can review consultations'
      });
    }

    if (consultation.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed consultations'
      });
    }

    if (consultation.review) {
      return res.status(400).json({
        success: false,
        message: 'Consultation already reviewed'
      });
    }

    // Add review
    consultation.review = {
      rating,
      comment,
      categories: categories || {},
      wouldRecommend,
      reviewDate: new Date()
    };

    await consultation.save();

    // Update doctor's overall rating
    await updateDoctorRating(consultation.doctorId, rating);

    res.json({
      success: true,
      data: consultation.review,
      message: 'Review submitted successfully'
    });

  } catch (error) {
    console.error('Add consultation review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding consultation review'
    });
  }
};

/**
 * Get consultation statistics
 */
exports.getConsultationStats = async (req, res) => {
  try {
    const { period = 'month', doctorId } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build filter
    const filter = {
      scheduledDateTime: { $gte: startDate }
    };

    if (doctorId) {
      filter.doctorId = doctorId;
    } else if (req.user.role === 'patient') {
      filter.patientId = req.user.id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user.id });
      if (doctor) filter.doctorId = doctor._id;
    }

    // Get statistics
    const stats = await Consultation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalConsultations: { $sum: 1 },
          completedConsultations: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledConsultations: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          totalRevenue: { $sum: '$fee.amount' },
          avgRating: { $avg: '$review.rating' },
          consultationTypes: { $push: '$consultationType' }
        }
      }
    ]);

    const typeBreakdown = await Consultation.aggregate([
      { $match: filter },
      { $group: { _id: '$consultationType', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalConsultations: 0,
          completedConsultations: 0,
          cancelledConsultations: 0,
          totalRevenue: 0,
          avgRating: 0
        },
        typeBreakdown,
        period,
        dateRange: { start: startDate, end: now }
      }
    });

  } catch (error) {
    console.error('Get consultation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving consultation statistics'
    });
  }
};

/**
 * Process consultation payment
 */
exports.processPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment data',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { paymentMethod, amount, currency = 'USD', paymentDetails } = req.body;

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Verify patient
    if (consultation.patientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if already paid
    if (consultation.payment && consultation.payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Consultation already paid'
      });
    }

    // Validate payment amount
    if (amount !== consultation.fee.amount) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount does not match consultation fee'
      });
    }

    // Process payment (integrate with payment processor)
    const paymentResult = await processPaymentWithProvider(
      paymentMethod,
      amount,
      currency,
      paymentDetails
    );

    // Update consultation with payment info
    consultation.payment = {
      method: paymentMethod,
      amount,
      currency,
      transactionId: paymentResult.transactionId,
      status: paymentResult.success ? 'completed' : 'failed',
      processedAt: new Date(),
      paymentDetails: paymentResult.details
    };

    await consultation.save();

    res.json({
      success: paymentResult.success,
      data: {
        consultationId: consultation._id,
        payment: consultation.payment
      },
      message: paymentResult.success ? 
        'Payment processed successfully' : 
        'Payment failed'
    });

  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment'
    });
  }
};

/**
 * Get upcoming consultations
 */
exports.getUpcomingConsultations = async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    
    const now = new Date();
    const endTime = new Date(now.getTime() + parseInt(hours) * 60 * 60 * 1000);

    // Build filter based on user role
    const filter = {
      scheduledDateTime: {
        $gte: now,
        $lte: endTime
      },
      status: 'scheduled'
    };

    if (req.user.role === 'patient') {
      filter.patientId = req.user.id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user.id });
      if (doctor) filter.doctorId = doctor._id;
    }

    const consultations = await Consultation.find(filter)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'userId specialties')
      .populate('doctorId.userId', 'name')
      .sort({ scheduledDateTime: 1 })
      .limit(10);

    // Add computed fields
    const upcomingConsultations = consultations.map(consultation => ({
      ...consultation.toObject(),
      timeUntilConsultation: consultation.getTimeUntilConsultation(),
      canJoin: consultation.canJoinNow()
    }));

    res.json({
      success: true,
      data: {
        consultations: upcomingConsultations,
        timeframe: `next ${hours} hours`,
        count: upcomingConsultations.length
      }
    });

  } catch (error) {
    console.error('Get upcoming consultations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving upcoming consultations'
    });
  }
};

/**
 * Get bulk availability for multiple doctors
 */
exports.getBulkAvailability = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bulk availability request',
        errors: errors.array()
      });
    }

    const { doctorIds, dateRange, duration = 30 } = req.body;

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    // Get all doctors
    const doctors = await Doctor.find({ _id: { $in: doctorIds } })
      .populate('userId', 'name');

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No doctors found'
      });
    }

    // Get availability for each doctor
    const availabilityResults = await Promise.all(
      doctors.map(async (doctor) => {
        const availability = [];
        
        // Check each day in the range
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const daySlots = await doctor.getAvailableSlots(new Date(d), duration);
          if (daySlots.length > 0) {
            availability.push({
              date: new Date(d).toDateString(),
              slots: daySlots
            });
          }
        }

        return {
          doctor: {
            id: doctor._id,
            name: doctor.userId.name,
            specialties: doctor.specialties,
            consultationFee: doctor.consultationFee
          },
          availability
        };
      })
    );

    res.json({
      success: true,
      data: {
        results: availabilityResults,
        dateRange: {
          start: startDate,
          end: endDate
        },
        requestedDuration: duration
      }
    });

  } catch (error) {
    console.error('Get bulk availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving bulk availability'
    });
  }
};

// Helper functions

async function updateDoctorRating(doctorId, newRating) {
  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return;

    // Get all completed consultations with reviews
    const reviewedConsultations = await Consultation.find({
      doctorId,
      status: 'completed',
      'review.rating': { $exists: true }
    });

    if (reviewedConsultations.length === 0) return;

    // Calculate new average rating
    const totalRating = reviewedConsultations.reduce((sum, consultation) => 
      sum + consultation.review.rating, 0
    );
    const averageRating = totalRating / reviewedConsultations.length;

    // Update doctor rating
    doctor.ratings = doctor.ratings || {};
    doctor.ratings.overall = Math.round(averageRating * 10) / 10; // Round to 1 decimal
    doctor.ratings.totalReviews = reviewedConsultations.length;

    await doctor.save();
  } catch (error) {
    console.error('Update doctor rating error:', error);
  }
}

async function processPaymentWithProvider(method, amount, currency, details) {
  // Mock payment processing - integrate with real payment provider
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.1; // 90% success rate for simulation
      resolve({
        success,
        transactionId: success ? `txn_${Date.now()}` : null,
        details: success ? { status: 'completed' } : { error: 'Payment declined' }
      });
    }, 1000);
  });
}

// Helper function to generate meeting password
function generateMeetingPassword() {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
}

module.exports = exports;