/**
 * Simple Hospital Seed Data Script
 */

const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/medisync', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create a default admin user ID
const ObjectId = mongoose.Types.ObjectId;
const defaultAdminId = new ObjectId();

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
    specialties: ["emergency", "cardiology", "surgery"],
    contact: {
      phone: "+12125550100",
      email: "info@citygeneralhospital.com",
      website: "https://citygeneralhospital.com"
    },
    createdBy: defaultAdminId
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
      coordinates: [-74.0100, 40.7200]
    },
    type: "specialty",
    specialties: ["cardiology", "neurology", "oncology"],
    contact: {
      phone: "+12125550200",
      email: "info@metromedical.com", 
      website: "https://metromedical.com"
    },
    createdBy: defaultAdminId
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
      coordinates: [-73.9730, 40.7589]
    },
    type: "emergency",
    specialties: ["emergency", "surgery"],
    contact: {
      phone: "+12125550300",
      email: "info@stmarysemergency.com",
      website: "https://stmarysemergency.com"
    },
    createdBy: defaultAdminId
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
    
    console.log('Hospital seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding hospitals:', error);
    process.exit(1);
  }
}

// Run the seed function
seedHospitals();