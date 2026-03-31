/**
 * Consultation Model
 * Clean rebuild for the video doctor consultation flow
 */

const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  // Patient who booked
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required']
  },
  // Doctor assigned
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor is required']
  },

  // ── Booking ──
  scheduledAt: {
    type: Date,
    required: [true, 'Scheduled date/time is required']
  },
  estimatedDuration: { type: Number, min: 15, max: 120, default: 30 },
  consultationType: {
    type: String,
    enum: ['video_call', 'phone_call', 'in_person'],
    default: 'video_call'
  },

  // ── Pre-Consultation Data ──
  symptoms: { type: [String], default: [] },
  chiefComplaint: { type: String, trim: true, maxlength: 500 },
  additionalNotes: { type: String, trim: true, maxlength: 1000 },
  documents: [{
    name: String,
    url: String,
    fileType: { type: String, enum: ['report', 'image', 'prescription', 'other'], default: 'other' },
    uploadedAt: { type: Date, default: Date.now }
  }],

  // ── Status Flow: requested → confirmed → in_progress → completed ──
  status: {
    type: String,
    enum: ['requested', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'requested'
  },

  // ── Payment ──
  payment: {
    amount: { type: Number, min: 0, default: 0 },
    currency: { type: String, enum: ['USD', 'EUR', 'GBP', 'INR'], default: 'USD' },
    status: { type: String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'pending' },
    method: { type: String },
    paidAt: Date,
    razorpayOrderId: String,
    razorpayPaymentId: String
  },

  // ── Video Session ──
  actualStartTime: Date,
  actualEndTime: Date,

  // ── Doctor Output ──
  doctorNotes: { type: String, trim: true, maxlength: 5000 },
  diagnosis: { type: String, trim: true, maxlength: 2000 },
  prescription: {
    medications: [{
      name: { type: String, required: true, trim: true },
      dosage: { type: String, required: true, trim: true },
      frequency: { type: String, required: true, trim: true },
      duration: { type: String, required: true, trim: true },
      instructions: { type: String, trim: true }
    }],
    generalInstructions: { type: String, maxlength: 2000 },
    issuedAt: Date
  },

  // ── Follow-up ──
  followUpRequired: { type: Boolean, default: false },
  followUpDate: Date,

  // ── Cancellation ──
  cancelledBy: { type: String, enum: ['patient', 'doctor', 'system'] },
  cancellationReason: { type: String, maxlength: 500 },

  // ── Feedback ──
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
    submittedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { transform(doc, ret) { delete ret.__v; return ret; } }
});

// Indexes
consultationSchema.index({ userId: 1, status: 1 });
consultationSchema.index({ doctorId: 1, status: 1 });
consultationSchema.index({ doctorId: 1, scheduledAt: 1 });
consultationSchema.index({ userId: 1, scheduledAt: -1 });

// Can the user join this video session right now?
consultationSchema.methods.canJoinNow = function () {
  if (!this.scheduledAt) return false;
  const now = new Date();
  const t = new Date(this.scheduledAt);
  const start = new Date(t.getTime() - 10 * 60 * 1000);   // 10 min before
  const end   = new Date(t.getTime() + (this.estimatedDuration || 30) * 60 * 1000);
  return now >= start && now <= end && ['confirmed', 'in_progress', 'requested'].includes(this.status);
};

// Can this consultation still be cancelled?
consultationSchema.methods.canCancel = function () {
  if (['cancelled', 'completed', 'no_show'].includes(this.status)) return false;
  const now = new Date();
  return this.scheduledAt && (new Date(this.scheduledAt).getTime() - now.getTime()) > 60 * 60 * 1000;
};

module.exports = mongoose.model('Consultation', consultationSchema);
