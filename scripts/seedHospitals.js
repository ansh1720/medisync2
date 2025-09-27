/**
 * Hospital Seed Data Script
 * Adds sample hospital data for testing the hospital locator feature
 */

const mongoose = require('mongoose');
const Hospital = require('../server/models/Hospital');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/medisync', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sampleHospitals = [
  {
    name: "City General Hospital",
    address: {
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "United States"
    },
    location: {
      type: "Point",
      coordinates: [-74.0060, 40.7128] // [longitude, latitude] - NYC
    },
    type: "general",
    services: ["emergency", "surgery", "cardiology", "pediatrics", "radiology"],
    phone: "(212) 555-0100",
    website: "https://citygeneralhospital.com",
    description: "A full-service general hospital providing comprehensive medical care.",
    operatingHours: {
      monday: { open: "00:00", close: "23:59", isOpen: true },
      tuesday: { open: "00:00", close: "23:59", isOpen: true },
      wednesday: { open: "00:00", close: "23:59", isOpen: true },
      thursday: { open: "00:00", close: "23:59", isOpen: true },
      friday: { open: "00:00", close: "23:59", isOpen: true },
      saturday: { open: "00:00", close: "23:59", isOpen: true },
      sunday: { open: "00:00", close: "23:59", isOpen: true }
    },
    acceptedInsurance: ["Medicare", "Medicaid", "Blue Cross", "Aetna", "Cigna"],
    ratings: {
      overall: 4.2,
      cleanliness: 4.5,
      staff: 4.0,
      facilities: 4.3,
      waitTime: 3.8
    }
  },
  {
    name: "Metropolitan Medical Center",
    address: {
      street: "456 Broadway",
      city: "New York",
      state: "NY",
      zipCode: "10013",
      country: "United States"
    },
    location: {
      type: "Point",
      coordinates: [-74.0100, 40.7200] // Slightly different location
    },
    type: "specialty",
    services: ["cardiology", "neurology", "oncology", "orthopedics", "radiology"],
    phone: "(212) 555-0200",
    website: "https://metromedical.com",
    description: "Specialized medical center focusing on advanced treatments.",
    operatingHours: {
      monday: { open: "06:00", close: "22:00", isOpen: true },
      tuesday: { open: "06:00", close: "22:00", isOpen: true },
      wednesday: { open: "06:00", close: "22:00", isOpen: true },
      thursday: { open: "06:00", close: "22:00", isOpen: true },
      friday: { open: "06:00", close: "22:00", isOpen: true },
      saturday: { open: "08:00", close: "18:00", isOpen: true },
      sunday: { open: "08:00", close: "18:00", isOpen: true }
    },
    acceptedInsurance: ["Medicare", "Blue Cross", "United Healthcare", "Aetna"],
    ratings: {
      overall: 4.6,
      cleanliness: 4.8,
      staff: 4.5,
      facilities: 4.7,
      waitTime: 4.2
    }
  },
  {
    name: "St. Mary's Emergency Center",
    address: {
      street: "789 Fifth Avenue",
      city: "New York",
      state: "NY",
      zipCode: "10022",
      country: "United States"
    },
    location: {
      type: "Point",
      coordinates: [-73.9730, 40.7589] // Upper East Side
    },
    type: "emergency",
    services: ["emergency", "trauma", "urgent_care", "radiology", "surgery"],
    phone: "(212) 555-0300",
    website: "https://stmarysemergency.com",
    description: "24/7 emergency medical services and trauma care.",
    operatingHours: {
      monday: { open: "00:00", close: "23:59", isOpen: true },
      tuesday: { open: "00:00", close: "23:59", isOpen: true },
      wednesday: { open: "00:00", close: "23:59", isOpen: true },
      thursday: { open: "00:00", close: "23:59", isOpen: true },
      friday: { open: "00:00", close: "23:59", isOpen: true },
      saturday: { open: "00:00", close: "23:59", isOpen: true },
      sunday: { open: "00:00", close: "23:59", isOpen: true }
    },
    acceptedInsurance: ["Medicare", "Medicaid", "Blue Cross", "Cigna", "United Healthcare"],
    ratings: {
      overall: 4.0,
      cleanliness: 4.2,
      staff: 3.8,
      facilities: 4.1,
      waitTime: 3.5
    }
  },
  {
    name: "Children's Medical Hospital",
    address: {
      street: "321 Park Avenue",
      city: "New York",
      state: "NY",
      zipCode: "10010",
      country: "United States"
    },
    location: {
      type: "Point",
      coordinates: [-73.9857, 40.7454] // Midtown
    },
    type: "pediatric",
    services: ["pediatrics", "neonatology", "pediatric_surgery", "emergency", "radiology"],
    phone: "(212) 555-0400",
    website: "https://childrensmedical.com",
    description: "Specialized pediatric care for children and adolescents.",
    operatingHours: {
      monday: { open: "00:00", close: "23:59", isOpen: true },
      tuesday: { open: "00:00", close: "23:59", isOpen: true },
      wednesday: { open: "00:00", close: "23:59", isOpen: true },
      thursday: { open: "00:00", close: "23:59", isOpen: true },
      friday: { open: "00:00", close: "23:59", isOpen: true },
      saturday: { open: "00:00", close: "23:59", isOpen: true },
      sunday: { open: "00:00", close: "23:59", isOpen: true }
    },
    acceptedInsurance: ["Medicare", "Medicaid", "Blue Cross", "Aetna", "Cigna", "United Healthcare"],
    ratings: {
      overall: 4.8,
      cleanliness: 4.9,
      staff: 4.7,
      facilities: 4.8,
      waitTime: 4.3
    }
  },
  {
    name: "Heart & Vascular Institute",
    address: {
      street: "654 Lexington Avenue",
      city: "New York",
      state: "NY",
      zipCode: "10022",
      country: "United States"
    },
    location: {
      type: "Point",
      coordinates: [-73.9712, 40.7614] // Upper East Side
    },
    type: "cardiac",
    services: ["cardiology", "cardiac_surgery", "vascular", "emergency", "radiology"],
    phone: "(212) 555-0500",
    website: "https://heartvascular.com",
    description: "Advanced cardiac and vascular treatments with cutting-edge technology.",
    operatingHours: {
      monday: { open: "07:00", close: "19:00", isOpen: true },
      tuesday: { open: "07:00", close: "19:00", isOpen: true },
      wednesday: { open: "07:00", close: "19:00", isOpen: true },
      thursday: { open: "07:00", close: "19:00", isOpen: true },
      friday: { open: "07:00", close: "19:00", isOpen: true },
      saturday: { open: "09:00", close: "17:00", isOpen: true },
      sunday: { open: "09:00", close: "17:00", isOpen: true }
    },
    acceptedInsurance: ["Medicare", "Blue Cross", "Aetna", "United Healthcare"],
    ratings: {
      overall: 4.7,
      cleanliness: 4.8,
      staff: 4.6,
      facilities: 4.9,
      waitTime: 4.1
    }
  }
];

async function seedHospitals() {
  try {
    console.log('Connecting to MongoDB...');
    
    // Clear existing hospitals
    await Hospital.deleteMany({});
    console.log('Cleared existing hospital data');
    
    // Insert sample hospitals
    const hospitals = await Hospital.insertMany(sampleHospitals);
    console.log(`Successfully seeded ${hospitals.length} hospitals`);
    
    // Create geospatial index if it doesn't exist
    await Hospital.collection.createIndex({ location: "2dsphere" });
    console.log('Created geospatial index');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding hospitals:', error);
    process.exit(1);
  }
}

// Run the seed function
seedHospitals();