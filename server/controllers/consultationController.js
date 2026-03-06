/**
 * Consultation Controller
 * Clean rebuild – every function uses req.user.userId (set by auth middleware)
 * Doctor model uses `userRef` to link to User.
 */

const Consultation = require('../models/Consultation');
const Doctor = require('../models/Doctor');
const { getIO } = require('../utils/socket');

// ─── Helper: safe socket emit (never crashes if socket isn't ready) ───
const emitSafe = (room, event, data) => {
  try { getIO().to(room).emit(event, data); }
  catch (_) { /* socket not available */ }
};

// ────────────────────────────────────────────
// 1. GET /doctors – list / search doctors
// ────────────────────────────────────────────
exports.getDoctors = async (req, res) => {
  try {
    const { specialty, search, minRating, maxFee, page = 1, limit = 20 } = req.query;

    const filter = { isActive: true, isVerified: true };
    if (specialty && specialty !== 'all') filter.specialty = specialty;
    if (minRating) filter['rating.average'] = { $gte: Number(minRating) };
    if (maxFee) filter['consultationFee.amount'] = { $lte: Number(maxFee) };

    let query;
    if (search) {
      query = Doctor.find({
        ...filter,
        $or: [
          { name: new RegExp(search, 'i') },
          { specialty: new RegExp(search, 'i') },
          { bio: new RegExp(search, 'i') }
        ]
      });
    } else {
      query = Doctor.find(filter);
    }

    const total = await Doctor.countDocuments(filter);
    const doctors = await query
      .populate('hospitalAffiliation', 'name address')
      .sort({ 'rating.average': -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    res.json({ success: true, data: doctors, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error('getDoctors error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch doctors' });
  }
};

// ────────────────────────────────────────────
// 2. GET /doctors/:doctorId – single doctor profile
// ────────────────────────────────────────────
exports.getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.doctorId)
      .populate('hospitalAffiliation', 'name address')
      .lean();
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch (err) {
    console.error('getDoctorProfile error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch doctor profile' });
  }
};

// ────────────────────────────────────────────
// 3. GET /doctors/:doctorId/slots?date=YYYY-MM-DD
// ────────────────────────────────────────────
exports.getAvailableSlots = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const date = new Date(req.query.date || Date.now());
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[date.getDay()];

    const dayAvailability = doctor.availability.find(a => a.dayOfWeek === dayOfWeek);
    if (!dayAvailability) return res.json({ success: true, data: [] });

    // Get all booked slots for that day
    const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay   = new Date(date); endOfDay.setHours(23, 59, 59, 999);

    const booked = await Consultation.find({
      doctorId: doctor._id,
      scheduledAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['requested', 'confirmed', 'in_progress'] }
    }).select('scheduledAt estimatedDuration').lean();

    const bookedMinutes = booked.map(b => {
      const d = new Date(b.scheduledAt);
      return d.getHours() * 60 + d.getMinutes();
    });

    const duration = doctor.preferences?.consultationDuration || 30;
    const slots = [];
    for (const slot of dayAvailability.timeSlots) {
      if (!slot.isAvailable) continue;
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      let cur = sh * 60 + sm;
      const end = eh * 60 + em;
      while (cur + duration <= end) {
        const isBooked = bookedMinutes.includes(cur);
        slots.push({
          time: `${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`,
          available: !isBooked
        });
        cur += duration;
      }
    }

    res.json({ success: true, data: slots });
  } catch (err) {
    console.error('getAvailableSlots error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch slots' });
  }
};

// ────────────────────────────────────────────
// 4. POST /book – book a consultation
// ────────────────────────────────────────────
exports.bookConsultation = async (req, res) => {
  try {
    const { doctorId, scheduledAt, symptoms, chiefComplaint, additionalNotes, consultationType } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const consultation = await Consultation.create({
      userId: req.user.userId,
      doctorId,
      scheduledAt: new Date(scheduledAt),
      symptoms: symptoms || [],
      chiefComplaint: chiefComplaint || '',
      additionalNotes: additionalNotes || '',
      consultationType: consultationType || 'video_call',
      estimatedDuration: doctor.preferences?.consultationDuration || 30,
      payment: {
        amount: doctor.consultationFee?.amount || 0,
        currency: doctor.consultationFee?.currency || 'USD',
        status: doctor.consultationFee?.amount ? 'pending' : 'paid'
      },
      status: 'confirmed' // auto-confirm for now
    });

    const populated = await Consultation.findById(consultation._id)
      .populate('doctorId', 'name specialty consultationFee')
      .populate('userId', 'name email');

    // Notify doctor
    emitSafe(`doctor_${doctorId}`, 'new_consultation', {
      consultationId: populated._id,
      patientName: populated.userId?.name,
      scheduledAt: populated.scheduledAt
    });

    res.status(201).json({ success: true, data: populated, message: 'Consultation booked successfully' });
  } catch (err) {
    console.error('bookConsultation error:', err);
    res.status(500).json({ success: false, message: 'Failed to book consultation' });
  }
};

// ────────────────────────────────────────────
// 5. GET /my-consultations – patient's list
// ────────────────────────────────────────────
exports.getMyConsultations = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.user.userId };
    if (status) filter.status = status;

    const total = await Consultation.countDocuments(filter);
    const consultations = await Consultation.find(filter)
      .populate('doctorId', 'name specialty consultationFee rating')
      .sort({ scheduledAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    res.json({ success: true, data: consultations, total });
  } catch (err) {
    console.error('getMyConsultations error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch consultations' });
  }
};

// ────────────────────────────────────────────
// 6. GET /doctor/consultations – doctor's list
// ────────────────────────────────────────────
exports.getDoctorConsultations = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userRef: req.user.userId });
    if (!doctor) return res.status(403).json({ success: false, message: 'Doctor profile not found' });

    const { status, date, page = 1, limit = 20 } = req.query;
    const filter = { doctorId: doctor._id };
    if (status) filter.status = status;
    if (date) {
      const d = new Date(date);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);
      filter.scheduledAt = { $gte: start, $lte: end };
    }

    const total = await Consultation.countDocuments(filter);
    const consultations = await Consultation.find(filter)
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name specialty')
      .sort({ scheduledAt: 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    res.json({ success: true, data: consultations, total });
  } catch (err) {
    console.error('getDoctorConsultations error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch consultations' });
  }
};

// ────────────────────────────────────────────
// 7. GET /:id – single consultation details
// ────────────────────────────────────────────
exports.getConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate('doctorId', 'name specialty consultationFee rating bio')
      .populate('userId', 'name email phone');

    if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found' });

    // Only the patient or the doctor can view
    const doctor = await Doctor.findOne({ userRef: req.user.userId });
    const isPatient = consultation.userId._id.toString() === req.user.userId;
    const isDoctor  = doctor && consultation.doctorId._id.toString() === doctor._id.toString();

    if (!isPatient && !isDoctor && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: consultation });
  } catch (err) {
    console.error('getConsultation error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch consultation' });
  }
};

// ────────────────────────────────────────────
// 8. POST /:id/join – join video session
// ────────────────────────────────────────────
exports.joinConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found' });

    if (consultation.status === 'confirmed') {
      consultation.status = 'in_progress';
      consultation.actualStartTime = new Date();
      await consultation.save();
    }

    res.json({ success: true, data: consultation, message: 'Joined consultation' });
  } catch (err) {
    console.error('joinConsultation error:', err);
    res.status(500).json({ success: false, message: 'Failed to join consultation' });
  }
};

// ────────────────────────────────────────────
// 9. POST /:id/complete – doctor completes consultation
// ────────────────────────────────────────────
exports.completeConsultation = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userRef: req.user.userId });
    if (!doctor) return res.status(403).json({ success: false, message: 'Doctor profile not found' });

    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found' });
    if (consultation.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your consultation' });
    }

    const { diagnosis, doctorNotes, prescription, followUpRequired, followUpDate } = req.body;

    consultation.status = 'completed';
    consultation.actualEndTime = new Date();
    if (diagnosis) consultation.diagnosis = diagnosis;
    if (doctorNotes) consultation.doctorNotes = doctorNotes;
    if (followUpRequired !== undefined) consultation.followUpRequired = followUpRequired;
    if (followUpDate) consultation.followUpDate = new Date(followUpDate);
    if (prescription) {
      consultation.prescription = {
        medications: prescription.medications || [],
        generalInstructions: prescription.generalInstructions || '',
        issuedAt: new Date()
      };
    }

    await consultation.save();

    // Notify patient
    emitSafe(`user_${consultation.userId}`, 'consultation_completed', {
      consultationId: consultation._id
    });

    res.json({ success: true, data: consultation, message: 'Consultation completed' });
  } catch (err) {
    console.error('completeConsultation error:', err);
    res.status(500).json({ success: false, message: 'Failed to complete consultation' });
  }
};

// ────────────────────────────────────────────
// 10. POST /:id/prescription – doctor adds/updates prescription
// ────────────────────────────────────────────
exports.addPrescription = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userRef: req.user.userId });
    if (!doctor) return res.status(403).json({ success: false, message: 'Doctor profile not found' });

    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found' });
    if (consultation.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your consultation' });
    }

    const { medications, generalInstructions } = req.body;
    consultation.prescription = {
      medications: medications || [],
      generalInstructions: generalInstructions || '',
      issuedAt: new Date()
    };
    await consultation.save();

    emitSafe(`user_${consultation.userId}`, 'new_prescription', {
      consultationId: consultation._id
    });

    res.json({ success: true, data: consultation.prescription, message: 'Prescription saved' });
  } catch (err) {
    console.error('addPrescription error:', err);
    res.status(500).json({ success: false, message: 'Failed to save prescription' });
  }
};

// ────────────────────────────────────────────
// 11. POST /:id/cancel – cancel a consultation
// ────────────────────────────────────────────
exports.cancelConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found' });

    // Check ownership
    const doctor = await Doctor.findOne({ userRef: req.user.userId });
    const isPatient = consultation.userId.toString() === req.user.userId;
    const isDoctor  = doctor && consultation.doctorId.toString() === doctor._id.toString();
    if (!isPatient && !isDoctor && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (['completed', 'cancelled'].includes(consultation.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this consultation' });
    }

    consultation.status = 'cancelled';
    consultation.cancelledBy = isDoctor ? 'doctor' : 'patient';
    consultation.cancellationReason = req.body.reason || '';

    // Auto-refund if paid
    if (consultation.payment?.status === 'paid') {
      consultation.payment.status = 'refunded';
    }

    await consultation.save();

    // Notify the other party
    if (isPatient) {
      emitSafe(`doctor_${consultation.doctorId}`, 'consultation_cancelled', { consultationId: consultation._id });
    } else {
      emitSafe(`user_${consultation.userId}`, 'consultation_cancelled', { consultationId: consultation._id });
    }

    res.json({ success: true, data: consultation, message: 'Consultation cancelled' });
  } catch (err) {
    console.error('cancelConsultation error:', err);
    res.status(500).json({ success: false, message: 'Failed to cancel consultation' });
  }
};

// ────────────────────────────────────────────
// 12. POST /:id/pay – mark payment as paid
// ────────────────────────────────────────────
exports.payConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found' });
    if (consultation.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not your consultation' });
    }

    consultation.payment.status = 'paid';
    consultation.payment.method = req.body.method || 'credit_card';
    consultation.payment.paidAt = new Date();
    await consultation.save();

    res.json({ success: true, data: consultation, message: 'Payment successful' });
  } catch (err) {
    console.error('payConsultation error:', err);
    res.status(500).json({ success: false, message: 'Payment failed' });
  }
};

// ────────────────────────────────────────────
// 13. POST /:id/feedback – patient leaves feedback
// ────────────────────────────────────────────
exports.addFeedback = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found' });
    if (consultation.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not your consultation' });
    }
    if (consultation.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only review completed consultations' });
    }

    const { rating, comment } = req.body;
    consultation.feedback = { rating, comment, submittedAt: new Date() };
    await consultation.save();

    // Update doctor rating
    if (rating) {
      const doctor = await Doctor.findById(consultation.doctorId);
      if (doctor) {
        const currentTotal = (doctor.rating?.average || 0) * (doctor.rating?.reviewCount || 0);
        doctor.rating.reviewCount = (doctor.rating?.reviewCount || 0) + 1;
        doctor.rating.average = (currentTotal + rating) / doctor.rating.reviewCount;
        await doctor.save();
      }
    }

    res.json({ success: true, message: 'Feedback submitted' });
  } catch (err) {
    console.error('addFeedback error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit feedback' });
  }
};

// ────────────────────────────────────────────
// 14. PUT /:id/pre-consultation – update symptoms / upload info before call
// ────────────────────────────────────────────
exports.updatePreConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found' });
    if (consultation.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not your consultation' });
    }
    if (['completed', 'cancelled'].includes(consultation.status)) {
      return res.status(400).json({ success: false, message: 'Cannot update this consultation' });
    }

    const { symptoms, chiefComplaint, additionalNotes, documents } = req.body;
    if (symptoms) consultation.symptoms = symptoms;
    if (chiefComplaint) consultation.chiefComplaint = chiefComplaint;
    if (additionalNotes !== undefined) consultation.additionalNotes = additionalNotes;
    if (documents) consultation.documents.push(...documents);

    await consultation.save();
    res.json({ success: true, data: consultation, message: 'Pre-consultation data updated' });
  } catch (err) {
    console.error('updatePreConsultation error:', err);
    res.status(500).json({ success: false, message: 'Failed to update pre-consultation data' });
  }
};

// ────────────────────────────────────────────
// 15. GET /doctor/stats – doctor dashboard stats
// ────────────────────────────────────────────
exports.getDoctorStats = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userRef: req.user.userId });
    if (!doctor) return res.status(403).json({ success: false, message: 'Doctor profile not found' });

    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);

    const [total, completed, todayCount, upcoming] = await Promise.all([
      Consultation.countDocuments({ doctorId: doctor._id }),
      Consultation.countDocuments({ doctorId: doctor._id, status: 'completed' }),
      Consultation.countDocuments({ doctorId: doctor._id, scheduledAt: { $gte: todayStart, $lte: todayEnd } }),
      Consultation.find({
        doctorId: doctor._id,
        status: { $in: ['confirmed', 'requested'] },
        scheduledAt: { $gte: now }
      }).populate('userId', 'name email').sort({ scheduledAt: 1 }).limit(5).lean()
    ]);

    res.json({
      success: true,
      data: {
        totalConsultations: total,
        completedConsultations: completed,
        todayAppointments: todayCount,
        upcomingConsultations: upcoming
      }
    });
  } catch (err) {
    console.error('getDoctorStats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

// ────────────────────────────────────────────
// 16. POST /:id/accept – doctor accepts consultation
// ────────────────────────────────────────────
exports.acceptConsultation = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userRef: req.user.userId });
    if (!doctor) return res.status(403).json({ success: false, message: 'Doctor profile not found' });

    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found' });
    if (consultation.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your consultation' });
    }
    if (consultation.status !== 'requested') {
      return res.status(400).json({ success: false, message: 'Can only accept requested consultations' });
    }

    consultation.status = 'confirmed';
    await consultation.save();

    emitSafe(`user_${consultation.userId}`, 'consultation_confirmed', {
      consultationId: consultation._id
    });

    res.json({ success: true, data: consultation, message: 'Consultation confirmed' });
  } catch (err) {
    console.error('acceptConsultation error:', err);
    res.status(500).json({ success: false, message: 'Failed to accept consultation' });
  }
};
