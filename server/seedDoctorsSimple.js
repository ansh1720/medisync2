/**
 * Simple Doctor Seed Data Script
 */

const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/medisync', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create a default user reference
const ObjectId = mongoose.Types.ObjectId;
const defaultUserId = new ObjectId();

const sampleDoctors = [
  {
    name: "Dr. Sarah Johnson",
    email: "dr.johnson@medisync.com",
    specialty: "cardiology",
    subSpecialties: ["interventional_cardiology"],
    bio: "Board-certified cardiologist with 15 years of experience.",
    qualifications: {
      degree: "MD",
      university: "Harvard Medical School",
      graduationYear: 2008
    },
    experience: 15,
    languages: ["en", "es"],
    availability: [
      {
        dayOfWeek: "monday",
        timeSlots: [
          {
            startTime: "09:00",
            endTime: "17:00",
            isAvailable: true
          }
        ]
      },
      {
        dayOfWeek: "tuesday", 
        timeSlots: [
          {
            startTime: "09:00",
            endTime: "17:00",
            isAvailable: true
          }
        ]
      }
    ],
    contact: {
      phone: "+12125550100"
    },
    consultationFee: {
      amount: 150,
      currency: "USD"
    },
    rating: {
      average: 4.8,
      count: 125
    },
    isAvailable: true,
    isVerified: true,
    userRef: defaultUserId
  },
  {
    name: "Dr. Michael Chen",
    email: "dr.chen@medisync.com",
    specialty: "neurology", 
    subSpecialties: ["stroke"],
    bio: "Neurologist specializing in stroke treatment.",
    qualifications: {
      degree: "MD",
      university: "Johns Hopkins School of Medicine",
      graduationYear: 2010
    },
    experience: 12,
    languages: ["en"],
    availability: [
      {
        dayOfWeek: "monday",
        timeSlots: [
          {
            startTime: "08:00", 
            endTime: "16:00",
            isAvailable: true
          }
        ]
      }
    ],
    contact: {
      phone: "+12125550200"
    },
    consultationFee: {
      amount: 180,
      currency: "USD"
    },
    rating: {
      average: 4.7,
      count: 98
    },
    isAvailable: true,
    isVerified: true,
    userRef: new ObjectId()
  },
  {
    name: "Dr. Emily Rodriguez",
    email: "dr.rodriguez@medisync.com",
    specialty: "pediatrics",
    subSpecialties: ["adolescent_medicine"],
    bio: "Pediatrician dedicated to children's health.",
    qualifications: {
      degree: "MD", 
      university: "Stanford School of Medicine",
      graduationYear: 2012
    },
    experience: 10,
    languages: ["en", "es"],
    availability: [
      {
        dayOfWeek: "wednesday",
        timeSlots: [
          {
            startTime: "09:00",
            endTime: "18:00", 
            isAvailable: true
          }
        ]
      }
    ],
    contact: {
      phone: "+12125550300"
    },
    consultationFee: {
      amount: 120,
      currency: "USD"
    },
    rating: {
      average: 4.9,
      count: 87
    },
    isAvailable: true,
    isVerified: true,
    userRef: new ObjectId()
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