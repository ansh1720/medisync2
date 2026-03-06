/**
 * Socket.IO Configuration and Instance
 * Handles real-time communication for consultations, chat, and notifications
 */

let io = null;

// Initialize Socket.IO
const initializeSocket = (server) => {
  const { Server } = require('socket.io');
  
  io = new Server(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL || "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:3000",
        "https://ansh1720.github.io"
      ],
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log(`👤 User connected: ${socket.id}`);

    // Join user-specific room for notifications
    socket.on('join_user', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their notification room`);
    });

    // Join doctor-specific room
    socket.on('join_doctor', (doctorId) => {
      socket.join(`doctor_${doctorId}`);
      console.log(`Doctor ${doctorId} joined their notification room`);
    });

    // ===== CONSULTATION ROOM EVENTS =====

    // Join a consultation room
    socket.on('join_consultation', ({ consultationId, userId, role, name }) => {
      const roomId = `consultation_${consultationId}`;
      socket.join(roomId);
      socket.consultationRoom = roomId;
      socket.userId = userId;
      socket.userName = name;
      socket.userRole = role;
      
      console.log(`📞 ${name} (${role}) joined consultation room: ${roomId}`);
      
      // Notify others in the room
      socket.to(roomId).emit('user_joined_consultation', {
        userId,
        name,
        role,
        socketId: socket.id
      });
    });

    // Leave a consultation room
    socket.on('leave_consultation', ({ consultationId }) => {
      const roomId = `consultation_${consultationId}`;
      socket.leave(roomId);
      
      console.log(`👋 ${socket.userName || 'User'} left consultation room: ${roomId}`);
      
      socket.to(roomId).emit('user_left_consultation', {
        userId: socket.userId,
        name: socket.userName || 'Participant'
      });
    });

    // ===== WEBRTC SIGNALING =====

    // Forward call offer to the other participant
    socket.on('call_offer', ({ consultationId, signal, from, name }) => {
      const roomId = `consultation_${consultationId}`;
      console.log(`📹 Call offer from ${name} in room ${roomId}`);
      
      socket.to(roomId).emit('call_offer', {
        signal,
        from,
        name,
        socketId: socket.id
      });
    });

    // Forward call answer
    socket.on('call_answer', ({ consultationId, signal }) => {
      const roomId = `consultation_${consultationId}`;
      console.log(`📹 Call answer in room ${roomId}`);
      
      socket.to(roomId).emit('call_answer', {
        signal,
        socketId: socket.id
      });
    });

    // Forward ICE candidates
    socket.on('ice_candidate', ({ consultationId, candidate }) => {
      const roomId = `consultation_${consultationId}`;
      socket.to(roomId).emit('ice_candidate', { candidate });
    });

    // End call - notify everyone in the room
    socket.on('end_call', ({ consultationId }) => {
      const roomId = `consultation_${consultationId}`;
      console.log(`📞 Call ended in room ${roomId}`);
      socket.to(roomId).emit('call_ended', {
        endedBy: socket.userName || 'Participant'
      });
    });

    // ===== CHAT MESSAGES =====

    // Handle chat messages within a consultation
    socket.on('chat_message', ({ consultationId, message }) => {
      const roomId = `consultation_${consultationId}`;
      console.log(`💬 Chat message in ${roomId} from ${message.senderName}`);
      
      // Broadcast to others in the room (not back to sender)
      socket.to(roomId).emit('chat_message', message);
    });

    // ===== HEALTH ALERTS =====

    // Handle health alerts
    socket.on('subscribe_alerts', (data) => {
      socket.join('health_alerts');
      console.log(`User subscribed to health alerts`);
    });

    // ===== DISCONNECT =====

    socket.on('disconnect', () => {
      console.log(`👋 User disconnected: ${socket.id}`);
      
      // Notify consultation room if user was in one
      if (socket.consultationRoom) {
        socket.to(socket.consultationRoom).emit('user_left_consultation', {
          userId: socket.userId,
          name: socket.userName || 'Participant'
        });
      }
    });
  });

  // Global alert broadcast function
  const broadcastAlert = (alertData) => {
    io.emit('alert_broadcast', alertData);
    console.log('📢 Alert broadcasted to all connected users');
  };

  return { io, broadcastAlert };
};

// Get Socket.IO instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO
};