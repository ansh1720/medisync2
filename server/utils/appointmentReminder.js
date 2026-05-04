/**
 * Appointment Reminder Scheduler
 * Sends notifications to doctor and patient 10 minutes and 5 minutes before consultation
 */

const cron = require('node-cron');
const Consultation = require('../models/Consultation');
const { getIO } = require('./socket');

let reminderJob = null;

// Track sent reminders to avoid duplicates (in-memory, resets on server restart)
const sentReminders = new Set();

const generateReminderKey = (consultationId, minutesBefore) => {
  return `${consultationId}-${minutesBefore}`;
};

/**
 * Start the appointment reminder scheduler
 * Runs every minute to check for upcoming consultations
 */
const startAppointmentReminder = () => {
  console.log('[Reminder] Starting appointment reminder scheduler...');
  
  // Run every minute
  reminderJob = cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      // Check for consultations in next 10-5 minutes
      const tenMinutesLater = new Date(now.getTime() + 10 * 60000);
      const upcomingConsultations = await Consultation.find({
        scheduledAt: { 
          $gte: now,
          $lte: tenMinutesLater 
        },
        status: { $in: ['requested', 'confirmed'] },
        'payment.status': 'paid' // Only for paid consultations
      })
      .populate('userId', 'name email')
      .populate('doctorId', 'name userRef')
      .lean();

      if (upcomingConsultations.length === 0) return;

      for (const consultation of upcomingConsultations) {
        const minutesUntilStart = Math.round(
          (consultation.scheduledAt - now) / 60000
        );

        // Send 10-minute reminder
        if (minutesUntilStart <= 10 && minutesUntilStart > 5) {
          const reminderKey = generateReminderKey(consultation._id, 10);
          if (!sentReminders.has(reminderKey)) {
            sendReminderNotification(consultation, 10);
            sentReminders.add(reminderKey);
          }
        }

        // Send 5-minute reminder
        if (minutesUntilStart <= 5 && minutesUntilStart > 0) {
          const reminderKey = generateReminderKey(consultation._id, 5);
          if (!sentReminders.has(reminderKey)) {
            sendReminderNotification(consultation, 5);
            sentReminders.add(reminderKey);
          }
        }
      }
    } catch (err) {
      console.error('[Reminder] Error checking upcoming consultations:', err.message);
    }
  });

  console.log('[Reminder] Appointment reminder scheduler started ✓');
};

/**
 * Send reminder notification to doctor and patient
 */
const sendReminderNotification = (consultation, minutesBefore) => {
  try {
    const io = getIO();
    if (!io) {
      console.log('[Reminder] Socket.IO not available yet');
      return;
    }

    const reminderData = {
      consultationId: consultation._id,
      doctorName: consultation.doctorId?.name,
      patientName: consultation.userId?.name,
      scheduledAt: consultation.scheduledAt,
      minutesUntilStart: minutesBefore,
      message: `Your consultation starts in ${minutesBefore} minutes`
    };

    console.log(`[Reminder] Sending ${minutesBefore}-minute reminder for consultation ${consultation._id}`);

    // Send to patient
    io.to(`user_${consultation.userId._id}`).emit('appointment_reminder', {
      ...reminderData,
      type: 'patient'
    });

    // Send to doctor
    io.to(`doctor_${consultation.doctorId._id}`).emit('appointment_reminder', {
      ...reminderData,
      type: 'doctor'
    });

    console.log(`[Reminder] ${minutesBefore}-minute reminder sent ✓`);
  } catch (err) {
    console.error('[Reminder] Error sending notification:', err.message);
  }
};

/**
 * Stop the appointment reminder scheduler
 */
const stopAppointmentReminder = () => {
  if (reminderJob) {
    reminderJob.stop();
    console.log('[Reminder] Appointment reminder scheduler stopped');
  }
};

module.exports = {
  startAppointmentReminder,
  stopAppointmentReminder
};
