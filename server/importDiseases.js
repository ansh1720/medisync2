/**
 * Import CSV disease data into MongoDB
 * Run this script to populate the diseases collection in MongoDB Atlas
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Disease = require('./models/Disease');
const DiseaseDataParser = require('./utils/diseaseParser');

const importDiseases = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    console.log('📂 Loading CSV data...');
    const parser = new DiseaseDataParser();
    await parser.loadData();
    const diseases = parser.getAllDiseases();
    console.log(`📊 Found ${diseases.length} diseases in CSV`);

    console.log('🗑️  Clearing existing diseases...');
    await Disease.deleteMany({});

    console.log('💾 Importing diseases to MongoDB...');
    const imported = await Disease.insertMany(diseases);
    console.log(`✅ Successfully imported ${imported.length} diseases to MongoDB`);

    console.log('🎉 Import complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
};

importDiseases();
