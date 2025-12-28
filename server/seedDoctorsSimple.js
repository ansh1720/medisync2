/**
 * Simple Doctor Seed Data Script
 */

const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/medisync';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create a default user reference
const ObjectId = mongoose.Types.ObjectId;
const defaultUserId = new ObjectId();

const sampleDoctors = [
  {
    name: "Dr. Rajesh Kumar",
    email: "dr.rajesh@medisync.com",
    specialty: "cardiology",
    subSpecialties: ["interventional_cardiology", "cardiac_catheterization"],
    bio: "Renowned interventional cardiologist with expertise in complex cardiac procedures and heart disease management.",
    qualifications: {
      degree: "MBBS, DM Cardiology",
      university: "AIIMS Delhi",
      graduationYear: 2005
    },
    experience: 18,
    languages: ["hi", "en"],
    consultationFee: {
      amount: 1200,
      currency: "INR"
    },
    location: "Apollo Hospitals, Delhi",
    hospital: "Apollo Hospitals Delhi",
    rating: {
      average: 4.9,
      reviewCount: 245
    },
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
      phone: "+919876543210"
    },
    consultationFee: {
      amount: 1200,
      currency: "INR"
    },
    rating: {
      average: 4.9,
      reviewCount: 245
    },
    isAvailable: true,
    isVerified: true,
    userRef: defaultUserId
  },
  {
    name: "Dr. Priya Sharma",
    email: "dr.priya@medisync.com",
    specialty: "family_medicine", 
    subSpecialties: ["family_medicine", "preventive_care"],
    bio: "Dedicated general physician with extensive experience in family medicine and preventive healthcare.",
    qualifications: {
      degree: "MBBS, MD General Medicine",
      university: "JIPMER Puducherry",
      graduationYear: 2011
    },
    experience: 12,
    languages: ["hi", "en"],
    consultationFee: {
      amount: 800,
      currency: "INR"
    },
    location: "Fortis Healthcare, Mumbai",
    hospital: "Fortis Healthcare Mumbai",
    rating: {
      average: 4.7,
      reviewCount: 189
    },
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
      phone: "+919876543220"
    },
    isAvailable: true,
    isVerified: true,
    userRef: new ObjectId()
  },
  {
    name: "Dr. Anjali Mehta",
    email: "dr.anjali@medisync.com",
    specialty: "pediatrics",
    subSpecialties: ["neonatology", "child_development"],
    bio: "Compassionate pediatrician with extensive experience in child healthcare and developmental pediatrics.",
    qualifications: {
      degree: "MBBS, MD Pediatrics", 
      university: "AIIMS Delhi",
      graduationYear: 2007
    },
    experience: 16,
    languages: ["hi", "en"],
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
      phone: "+919876543230"
    },
    consultationFee: {
      amount: 900,
      currency: "INR"
    },
    rating: {
      average: 4.9,
      reviewCount: 312
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