/**
 * Doctor Seed Data Script
 * Adds sample doctor data for testing the consultation feature
 */

const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/medisync', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sampleDoctors = [
  {
    name: "Dr. Sarah Johnson",
    email: "dr.johnson@medisync.com",
    specialty: "cardiology",
    subSpecialties: ["interventional_cardiology", "heart_failure"],
    bio: "Board-certified cardiologist with 15 years of experience in treating heart conditions and cardiovascular diseases.",
    qualifications: [
      {
        degree: "MD",
        institution: "Harvard Medical School",
        year: 2008
      },
      {
        degree: "Cardiology Fellowship",
        institution: "Mayo Clinic",
        year: 2012
      }
    ],
    experience: 15,
    consultationFee: 150,
    consultationTypes: ["video", "audio", "chat"],
    languages: ["English", "Spanish"],
    ratings: {
      overall: 4.8,
      bedside_manner: 4.9,
      wait_time: 4.6,
      knowledge: 4.9
    },
    availability: {
      monday: { start: "09:00", end: "17:00", isAvailable: true },
      tuesday: { start: "09:00", end: "17:00", isAvailable: true },
      wednesday: { start: "09:00", end: "17:00", isAvailable: true },
      thursday: { start: "09:00", end: "17:00", isAvailable: true },
      friday: { start: "09:00", end: "17:00", isAvailable: true },
      saturday: { start: "10:00", end: "14:00", isAvailable: true },
      sunday: { start: "10:00", end: "14:00", isAvailable: false }
    },
    isAvailable: true,
    isVerified: true
  },
  {
    name: "Dr. Michael Chen",
    email: "dr.chen@medisync.com", 
    specialty: "neurology",
    subSpecialties: ["stroke", "epilepsy"],
    bio: "Neurologist specializing in stroke treatment and epilepsy management with over 12 years of clinical experience.",
    qualifications: [
      {
        degree: "MD",
        institution: "Johns Hopkins School of Medicine", 
        year: 2010
      },
      {
        degree: "Neurology Residency",
        institution: "UCLA Medical Center",
        year: 2014
      }
    ],
    experience: 12,
    consultationFee: 180,
    consultationTypes: ["video", "audio", "in_person"],
    languages: ["English", "Mandarin"],
    ratings: {
      overall: 4.7,
      bedside_manner: 4.6,
      wait_time: 4.8,
      knowledge: 4.9
    },
    availability: {
      monday: { start: "08:00", end: "16:00", isAvailable: true },
      tuesday: { start: "08:00", end: "16:00", isAvailable: true },
      wednesday: { start: "08:00", end: "16:00", isAvailable: true },
      thursday: { start: "08:00", end: "16:00", isAvailable: true },
      friday: { start: "08:00", end: "16:00", isAvailable: true },
      saturday: { start: "09:00", end: "13:00", isAvailable: true },
      sunday: { start: "09:00", end: "13:00", isAvailable: false }
    },
    isAvailable: true,
    isVerified: true
  },
  {
    name: "Dr. Emily Rodriguez",
    email: "dr.rodriguez@medisync.com",
    specialty: "pediatrics", 
    subSpecialties: ["adolescent_medicine", "developmental_pediatrics"],
    bio: "Pediatrician dedicated to providing comprehensive care for children and adolescents with 10 years of experience.",
    qualifications: [
      {
        degree: "MD",
        institution: "Stanford School of Medicine",
        year: 2012
      },
      {
        degree: "Pediatrics Residency", 
        institution: "Children's Hospital of Philadelphia",
        year: 2015
      }
    ],
    experience: 10,
    consultationFee: 120,
    consultationTypes: ["video", "audio", "chat", "in_person"],
    languages: ["English", "Spanish"],
    ratings: {
      overall: 4.9,
      bedside_manner: 5.0,
      wait_time: 4.7,
      knowledge: 4.8
    },
    availability: {
      monday: { start: "09:00", end: "18:00", isAvailable: true },
      tuesday: { start: "09:00", end: "18:00", isAvailable: true },
      wednesday: { start: "09:00", end: "18:00", isAvailable: true },
      thursday: { start: "09:00", end: "18:00", isAvailable: true },
      friday: { start: "09:00", end: "18:00", isAvailable: true },
      saturday: { start: "10:00", end: "15:00", isAvailable: true },
      sunday: { start: "10:00", end: "15:00", isAvailable: false }
    },
    isAvailable: true,
    isVerified: true
  },
  {
    name: "Dr. James Wilson",
    email: "dr.wilson@medisync.com",
    specialty: "orthopedics",
    subSpecialties: ["sports_medicine", "joint_replacement"],
    bio: "Orthopedic surgeon specializing in sports injuries and joint replacement surgery with 18 years of experience.",
    qualifications: [
      {
        degree: "MD",
        institution: "University of Pennsylvania School of Medicine",
        year: 2005
      },
      {
        degree: "Orthopedic Surgery Residency",
        institution: "Hospital for Special Surgery",
        year: 2010
      }
    ],
    experience: 18,
    consultationFee: 200,
    consultationTypes: ["video", "in_person"],
    languages: ["English"],
    ratings: {
      overall: 4.6,
      bedside_manner: 4.5,
      wait_time: 4.4,
      knowledge: 4.8
    },
    availability: {
      monday: { start: "07:00", end: "15:00", isAvailable: true },
      tuesday: { start: "07:00", end: "15:00", isAvailable: true },
      wednesday: { start: "07:00", end: "15:00", isAvailable: true },
      thursday: { start: "07:00", end: "15:00", isAvailable: true },
      friday: { start: "07:00", end: "15:00", isAvailable: true },
      saturday: { start: "08:00", end: "12:00", isAvailable: false },
      sunday: { start: "08:00", end: "12:00", isAvailable: false }
    },
    isAvailable: true,
    isVerified: true
  }
];

async function seedDoctors() {
  try {
    console.log('Connecting to MongoDB...');
    
    // Clear existing doctors
    await Doctor.deleteMany({});
    console.log('Cleared existing doctor data');
    
    // Insert sample doctors
    const doctors = await Doctor.insertMany(sampleDoctors);
    console.log(`Successfully seeded ${doctors.length} doctors`);
    
    console.log('Doctor seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding doctors:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDoctors();