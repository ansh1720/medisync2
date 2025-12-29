const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Disease = require('./models/Disease');
require('dotenv').config();

/**
 * Import diseases from CSV to MongoDB
 */
async function importDiseases() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/medisync';
    console.log('🔗 Connecting to:', mongoURI.replace(/:[^:]*@/, ':****@')); // Hide password
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    console.log('📂 Database:', mongoose.connection.db.databaseName);

    // Clear existing diseases
    await Disease.deleteMany({});
    console.log('🗑️  Cleared existing diseases');

    const csvPath = path.join(__dirname, 'data/Simplified_Disease_Summaries (1).csv');
    const diseases = [];

    // Read and parse CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          const diseaseName = row.Disease?.trim();
          if (!diseaseName) return;

          const disease = {
            name: diseaseName,
            description: (row['What is it?']?.trim() && row['What is it?'].trim().length >= 10) 
              ? row['What is it?'].trim() 
              : 'No description available for this condition.',
            symptoms: parseSymptoms(row.Symptoms || ''),
            prevention: parseToArray(row.Prevention || ''),
            treatment: parseToArray(row.Treatment || ''),
            riskFactors: parseToArray(row.Cause || ''),
            severity: determineSeverity(row),
            tags: extractTags(row),
            sources: []
          };

          diseases.push(disease);
        })
        .on('end', () => resolve())
        .on('error', (error) => reject(error));
    });

    console.log(`📊 Parsed ${diseases.length} diseases from CSV`);
    
    // Log first disease for debugging
    if (diseases.length > 0) {
      console.log('📝 Sample disease:', JSON.stringify(diseases[0], null, 2));
      
      // Try to insert first disease manually to see validation error
      console.log('\n🧪 Testing single document insert...');
      try {
        const testDoc = new Disease(diseases[0]);
        const validationError = testDoc.validateSync();
        if (validationError) {
          console.error('❌ Validation error:', validationError.message);
          Object.keys(validationError.errors).forEach(key => {
            console.error(`  - ${key}: ${validationError.errors[key].message}`);
          });
        } else {
          console.log('✅ Validation passed for test document');
          const saved = await testDoc.save();
          console.log('✅ Test document saved successfully');
          await Disease.deleteOne({ _id: saved._id });
        }
      } catch (err) {
        console.error('❌ Test insert failed:', err.message);
      }
    }

    // Insert into database in batches
    const batchSize = 50;
    let totalInserted = 0;
    const failedDiseases = [];
    for (let i = 0; i < diseases.length; i += batchSize) {
      const batch = diseases.slice(i, i + batchSize);
      try {
        const result = await Disease.insertMany(batch, { ordered: false });
        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(diseases.length / batchSize)} - Inserted ${result.length} diseases`);
        totalInserted += result.length;
      } catch (error) {
        if (error.writeErrors) {
          error.writeErrors.forEach(err => {
            const failedDoc = batch[err.index];
            failedDiseases.push({ name: failedDoc?.name, error: err.err.errmsg });
          });
        }
        // Count successfully inserted documents from partial batch
        if (error.insertedDocs) {
          totalInserted += error.insertedDocs.length;
        }
      }
    }
    console.log(`🎉 Successfully imported ${totalInserted} diseases to MongoDB`);
    
    if (failedDiseases.length > 0) {
      console.log(`\n⚠️  ${failedDiseases.length} diseases failed to import:`);
      failedDiseases.slice(0, 10).forEach(({ name, error }) => {
        console.log(`  - ${name}: ${error}`);
      });
      if (failedDiseases.length > 10) {
        console.log(`  ... and ${failedDiseases.length - 10} more`);
      }
    }
    
    // Verify the import
    const count = await Disease.countDocuments();
    console.log(`✅ Verified: ${count} diseases in database`);
    
    // Create indexes for better search performance (skip if exists)
    try {
      await Disease.collection.createIndex({ name: 'text', 'symptoms': 'text', 'description': 'text' });
      console.log('📇 Created text indexes for search');
    } catch (error) {
      if (error.code === 85) {
        console.log('📇 Text index already exists, skipping creation');
      } else {
        throw error;
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing diseases:', error);
    process.exit(1);
  }
}

/**
 * Parse symptoms from text into array
 */
function parseSymptoms(symptomsText) {
  if (!symptomsText || symptomsText.trim() === '') return [];

  const symptomPatterns = [
    /symptoms?\s*include[:\s]*/i,
    /signs?\s*and\s*symptoms?[:\s]*/i,
    /may\s*experience[:\s]*/i,
    /characterized\s*by[:\s]*/i
  ];

  let cleanText = symptomsText;
  symptomPatterns.forEach(pattern => {
    cleanText = cleanText.replace(pattern, '');
  });

  const symptoms = cleanText
    .split(/[;,.]/)
    .map(s => s.trim())
    .filter(s => s.length > 2 && s.length < 100)
    .map(s => s.replace(/^(and\s+|or\s+)/i, ''))
    .filter(s => s.length > 0);

  return symptoms.slice(0, 15);
}

/**
 * Parse text into array (for prevention, treatment, etc.)
 */
function parseToArray(text) {
  if (!text || text.trim() === '') return [];
  
  // Split by periods or semicolons, clean up
  const items = text
    .split(/[.;]/)
    .map(s => s.trim())
    .filter(s => s.length > 10 && s.length < 500);
  
  return items.slice(0, 10);
}

/**
 * Determine disease category based on name and characteristics
 */
function determineCategory(name) {
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('cancer') || nameLower.includes('tumor') || nameLower.includes('tumour')) {
    return 'cancer';
  }
  if (nameLower.includes('diabetes') || nameLower.includes('hypertension') || nameLower.includes('copd') || nameLower.includes('asthma')) {
    return 'chronic';
  }
  if (nameLower.includes('flu') || nameLower.includes('covid') || nameLower.includes('malaria') || nameLower.includes('tuberculosis') || nameLower.includes('cholera')) {
    return 'infectious';
  }
  if (nameLower.includes('mental') || nameLower.includes('anxiety') || nameLower.includes('depression') || nameLower.includes('bipolar') || nameLower.includes('autism')) {
    return 'mental_health';
  }
  if (nameLower.includes('injury') || nameLower.includes('burn') || nameLower.includes('bite')) {
    return 'injury';
  }
  
  return 'general';
}

/**
 * Determine severity level
 */
function determineSeverity(row) {
  const text = `${row['What is it?']} ${row['Why it matters']}`.toLowerCase();
  
  if (text.includes('fatal') || text.includes('death') || text.includes('mortality')) {
    return 'high';
  }
  if (text.includes('serious') || text.includes('severe') || text.includes('chronic')) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Extract tags from row data
 */
function extractTags(row) {
  const tags = new Set();
  const name = row.Disease?.toLowerCase() || '';
  
  // Add category-based tags
  if (name.includes('cancer')) tags.add('cancer');
  if (name.includes('infection') || name.includes('disease')) tags.add('infectious');
  if (name.includes('mental') || name.includes('health')) tags.add('mental health');
  if (name.includes('child')) tags.add('pediatric');
  if (name.includes('pregnancy') || name.includes('maternal')) tags.add('maternal');
  
  // Extract keywords from symptoms
  const symptoms = row.Symptoms?.toLowerCase() || '';
  if (symptoms.includes('fever')) tags.add('fever');
  if (symptoms.includes('pain')) tags.add('pain');
  if (symptoms.includes('fatigue')) tags.add('fatigue');
  
  return Array.from(tags).slice(0, 5);
}

// Run the import
importDiseases();
