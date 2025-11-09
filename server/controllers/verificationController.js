/**
 * Verification Controller
 * Handles doctor verification submission, approval, and rejection
 */

const Doctor = require('../models/Doctor');
const User = require('../models/User');

/**
 * Submit verification request
 * @route POST /api/verification/submit
 * @access Private (Doctor only)
 */
exports.submitVerification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      specialty,
      subSpecialties,
      bio,
      qualifications,
      experience,
      languages,
      medicalLicense,
      medicalCouncilRegistration,
      education,
      professionalExperience,
      specialtyCertifications,
      publications,
      awards,
      contact,
      consultationFee,
      availability,
      preferences
    } = req.body;

    // Find doctor by userRef
    let doctor = await Doctor.findOne({ userRef: userId });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Check if already verified
    if (doctor.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Your profile is already verified'
      });
    }

    // Check if already pending
    if (doctor.verificationStatus === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending verification request'
      });
    }

    // Validate required fields for verification
    if (!medicalLicense || !medicalLicense.number) {
      return res.status(400).json({
        success: false,
        message: 'Medical license information is required for verification'
      });
    }

    if (!education || education.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one education entry is required for verification'
      });
    }

    // Update doctor profile with verification details
    doctor.specialty = specialty || doctor.specialty;
    doctor.subSpecialties = subSpecialties || doctor.subSpecialties;
    doctor.bio = bio || doctor.bio;
    doctor.qualifications = qualifications || doctor.qualifications;
    doctor.experience = experience || doctor.experience;
    doctor.languages = languages || doctor.languages;
    doctor.medicalLicense = medicalLicense;
    doctor.medicalCouncilRegistration = medicalCouncilRegistration;
    doctor.education = education;
    doctor.professionalExperience = professionalExperience || [];
    doctor.specialtyCertifications = specialtyCertifications || [];
    doctor.publications = publications || [];
    doctor.awards = awards || [];
    
    // Properly merge contact information
    if (contact) {
      doctor.contact = {
        phone: contact.phone || doctor.contact?.phone || '',
        officeAddress: {
          street: contact.officeAddress?.street || doctor.contact?.officeAddress?.street || '',
          city: contact.officeAddress?.city || doctor.contact?.officeAddress?.city || '',
          state: contact.officeAddress?.state || doctor.contact?.officeAddress?.state || '',
          zipCode: contact.officeAddress?.zipCode || doctor.contact?.officeAddress?.zipCode || '',
          country: contact.officeAddress?.country || doctor.contact?.officeAddress?.country || 'United States'
        },
        emergencyContact: {
          phone: contact.emergencyContact?.phone || doctor.contact?.emergencyContact?.phone || '',
          relationship: contact.emergencyContact?.relationship || doctor.contact?.emergencyContact?.relationship || ''
        }
      };
    }
    
    doctor.consultationFee = consultationFee || doctor.consultationFee;
    doctor.availability = availability || doctor.availability;
    doctor.preferences = preferences || doctor.preferences;
    
    // Update verification status
    doctor.verificationStatus = 'pending';
    doctor.verificationSubmittedAt = new Date();

    console.log('Saving doctor verification with status:', doctor.verificationStatus);
    await doctor.save();
    console.log('Doctor verification saved successfully:', {
      id: doctor._id,
      name: doctor.name,
      status: doctor.verificationStatus,
      submittedAt: doctor.verificationSubmittedAt
    });

    res.status(200).json({
      success: true,
      message: 'Verification request submitted successfully. Please wait for admin approval.',
      data: {
        doctor
      }
    });
  } catch (error) {
    console.error('Error submitting verification:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Error submitting verification request',
      error: error.message
    });
  }
};

/**
 * Get verification status
 * @route GET /api/verification/status
 * @access Private (Doctor only)
 */
exports.getVerificationStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('Fetching verification status for userId:', userId);

    const doctor = await Doctor.findOne({ userRef: userId })
      .populate('verificationApprovedBy', 'name email');

    if (!doctor) {
      console.log('Doctor profile not found for userId:', userId);
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    console.log('Found doctor verification status:', {
      id: doctor._id,
      name: doctor.name,
      verificationStatus: doctor.verificationStatus,
      isVerified: doctor.isVerified
    });

    res.status(200).json({
      success: true,
      data: {
        verificationStatus: doctor.verificationStatus,
        isVerified: doctor.isVerified,
        verificationSubmittedAt: doctor.verificationSubmittedAt,
        verificationApprovedAt: doctor.verificationApprovedAt,
        verificationRejectedAt: doctor.verificationRejectedAt,
        verificationRejectionReason: doctor.verificationRejectionReason,
        verificationApprovedBy: doctor.verificationApprovedBy
      }
    });
  } catch (error) {
    console.error('Error fetching verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching verification status',
      error: error.message
    });
  }
};

/**
 * Get all pending verification requests
 * @route GET /api/verification/pending
 * @access Private (Admin only)
 */
exports.getPendingVerifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    console.log('Fetching pending verifications...');
    const doctors = await Doctor.find({ verificationStatus: 'pending' })
      .populate('userRef', 'name email phone')
      .populate('hospitalAffiliation', 'name address')
      .sort({ verificationSubmittedAt: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Doctor.countDocuments({ verificationStatus: 'pending' });
    
    console.log(`Found ${count} pending verifications`);
    console.log('Pending doctors:', doctors.map(d => ({ name: d.name, status: d.verificationStatus })));

    res.status(200).json({
      success: true,
      data: {
        doctors,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalCount: count
      }
    });
  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending verifications',
      error: error.message
    });
  }
};

/**
 * Get verification details for a specific doctor
 * @route GET /api/verification/doctor/:doctorId
 * @access Private (Admin only)
 */
exports.getVerificationDetails = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findById(doctorId)
      .populate('userRef', 'name email phone')
      .populate('hospitalAffiliation', 'name address')
      .populate('verificationApprovedBy', 'name email');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        doctor
      }
    });
  } catch (error) {
    console.error('Error fetching verification details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching verification details',
      error: error.message
    });
  }
};

/**
 * Approve doctor verification
 * @route PUT /api/verification/approve/:doctorId
 * @access Private (Admin only)
 */
exports.approveVerification = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const adminId = req.user.userId;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    if (doctor.verificationStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This verification request is not pending'
      });
    }

    // Update verification status
    doctor.verificationStatus = 'approved';
    doctor.isVerified = true;
    doctor.verificationApprovedAt = new Date();
    doctor.verificationApprovedBy = adminId;
    doctor.verificationRejectionReason = undefined;

    await doctor.save();

    // You can add email notification here to inform the doctor

    res.status(200).json({
      success: true,
      message: 'Doctor verification approved successfully',
      data: {
        doctor
      }
    });
  } catch (error) {
    console.error('Error approving verification:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving verification',
      error: error.message
    });
  }
};

/**
 * Reject doctor verification
 * @route PUT /api/verification/reject/:doctorId
 * @access Private (Admin only)
 */
exports.rejectVerification = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    if (doctor.verificationStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This verification request is not pending'
      });
    }

    // Update verification status
    doctor.verificationStatus = 'rejected';
    doctor.isVerified = false;
    doctor.verificationRejectedAt = new Date();
    doctor.verificationRejectionReason = reason;

    await doctor.save();

    // You can add email notification here to inform the doctor

    res.status(200).json({
      success: true,
      message: 'Doctor verification rejected',
      data: {
        doctor
      }
    });
  } catch (error) {
    console.error('Error rejecting verification:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting verification',
      error: error.message
    });
  }
};

/**
 * Get all verified doctors (public)
 * @route GET /api/verification/verified-doctors
 * @access Public
 */
exports.getVerifiedDoctors = async (req, res) => {
  try {
    const { page = 1, limit = 20, specialty, search } = req.query;

    const query = {
      isVerified: true,
      isActive: true
    };

    if (specialty) {
      query.specialty = specialty;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialty: { $regex: search, $options: 'i' } },
        { subSpecialties: { $regex: search, $options: 'i' } }
      ];
    }

    const doctors = await Doctor.find(query)
      .populate('userRef', 'name email')
      .populate('hospitalAffiliation', 'name address')
      .select('-verificationDocuments -medicalLicense.documentUrl -medicalCouncilRegistration.documentUrl')
      .sort({ 'rating.average': -1, verificationApprovedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Doctor.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        doctors,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalCount: count
      }
    });
  } catch (error) {
    console.error('Error fetching verified doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching verified doctors',
      error: error.message
    });
  }
};
