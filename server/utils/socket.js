/**
 * Socket.IO Configuration and Instance
 * Separate module to prevent circular dependencies
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
        "http://localhost:3000"
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

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`👋 User disconnected: ${socket.id}`);
    });

    // Handle health alerts
    socket.on('subscribe_alerts', (data) => {
      socket.join('health_alerts');
      console.log(`User subscribed to health alerts`);
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