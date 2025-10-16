/**
 * Create Doctor Users Script
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/medisync', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createDoctorUsers = async () => {
  try {
    console.log('Creating doctor users...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const doctorUsers = [
      {
        name: 'Dr. Sarah Johnson',
        email: 'dr.johnson@medisync.com',
        password: hashedPassword,
        role: 'doctor',
        phone: '+1234567890',
        dateOfBirth: new Date('1985-05-15'),
        gender: 'female'
      },
      {
        name: 'Dr. Michael Chen',
        email: 'dr.chen@medisync.com', 
        password: hashedPassword,
        role: 'doctor',
        phone: '+1234567891',
        dateOfBirth: new Date('1982-08-20'),
        gender: 'male'
      },
      {
        name: 'Dr. Emily Rodriguez',
        email: 'dr.rodriguez@medisync.com',
        password: hashedPassword,
        role: 'doctor', 
        phone: '+1234567892',
        dateOfBirth: new Date('1988-12-10'),
        gender: 'female'
      }
    ];

    // Clear existing doctor users
    await User.deleteMany({ role: 'doctor' });
    console.log('Cleared existing doctor users');

    // Create new doctor users
    const createdUsers = await User.insertMany(doctorUsers);
    console.log(`Created ${createdUsers.length} doctor users`);

    console.log('Doctor users:');
    createdUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
    });

    console.log('\nDoctor users created successfully!');
    console.log('You can now login with:');
    console.log('Email: dr.johnson@medisync.com');
    console.log('Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating doctor users:', error);
    process.exit(1);
  }
};

createDoctorUsers();