import { useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

/**
 * Custom hook to listen for appointment reminders
 * Plays a sound and shows a toast notification
 */
export const useAppointmentReminder = () => {
  useEffect(() => {
    try {
      const socket = io(process.env.REACT_APP_API_URL || 'https://medisync-api-9043.onrender.com', {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling']
      });

      // Listen for appointment reminders
      socket.on('appointment_reminder', (data) => {
        console.log('[Reminder] Received appointment reminder:', data);
        
        const { minutesUntilStart, doctorName, patientName, type } = data;
        const message = type === 'doctor' 
          ? `Consultation with ${patientName} starts in ${minutesUntilStart} minutes!`
          : `Consultation with Dr. ${doctorName} starts in ${minutesUntilStart} minutes!`;

        // Show toast notification
        toast.success(message, {
          duration: 10000, // Show for 10 seconds
          icon: '⏰'
        });

        // Optional: Play a sound (notification sound)
        playNotificationSound();

        // Optional: Request browser notification permission
        if (Notification.permission === 'granted') {
          new Notification('MediSync Appointment Reminder', {
            body: message,
            icon: '/ms-icon.png',
            tag: `appointment-${data.consultationId}`
          });
        }
      });

      return () => {
        socket.off('appointment_reminder');
        socket.disconnect();
      };
    } catch (err) {
      console.error('[Reminder] Error setting up reminder listener:', err);
    }
  }, []);
};

/**
 * Play a simple notification sound
 */
const playNotificationSound = () => {
  try {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (err) {
    console.log('[Reminder] Could not play sound:', err.message);
  }
};
