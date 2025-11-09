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
    
    // Log first disease to see structure
    if (diseases.length > 0) {
      console.log('📝 First disease sample:', JSON.stringify(diseases[0], null, 2));
    }
    
    // Transform CSV data to match Disease model schema
    const transformedDiseases = diseases.map(disease => ({
      name: disease.name || 'Unknown Disease',
      description: disease.overview || disease.importance || 'No description available',
      symptoms: disease.symptoms && disease.symptoms.length > 0 ? disease.symptoms : disease.symptomKeywords && disease.symptomKeywords.length > 0 ? disease.symptomKeywords : ['General symptoms'],
      causes: disease.cause ? [disease.cause] : ['Unknown cause'],
      prevention: disease.preventionMethods && disease.preventionMethods.length > 0 ? disease.preventionMethods : disease.prevention ? [disease.prevention] : ['Consult healthcare provider'],
      treatment: disease.treatment ? [disease.treatment] : ['Seek medical attention'],
      category: 'General Health',
      severity: disease.riskScore > 0.7 ? 'severe' : disease.riskScore > 0.4 ? 'moderate' : 'mild',
      createdBy: 'system', // System-generated
      isActive: true
    })).filter(d => d.name && d.name !== 'Unknown Disease'); // Only import valid diseases
    
    console.log(`📋 Prepared ${transformedDiseases.length} diseases for import`);
    
    if (transformedDiseases.length > 0) {
      console.log('📝 First transformed disease:', JSON.stringify(transformedDiseases[0], null, 2));
      
      try {
        const imported = await Disease.insertMany(transformedDiseases, { ordered: false, rawResult: true });
        console.log(`✅ Successfully imported ${imported.insertedCount || imported.length} diseases to MongoDB`);
      } catch (error) {
        if (error.writeErrors) {
          console.log(`⚠️  Imported some with errors. Successful: ${error.insertedDocs?.length || 0}`);
          console.log('First error:', error.writeErrors[0]);
        } else {
          throw error;
        }
      }
    } else {
      console.log('⚠️  No valid diseases to import');
    }

    console.log('🎉 Import complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
};

importDiseases();
