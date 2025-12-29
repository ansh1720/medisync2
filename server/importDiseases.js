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
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

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
            description: row['What is it?']?.trim() || 'No description available.',
            symptoms: parseSymptoms(row.Symptoms || ''),
            causes: row.Cause?.trim() || '',
            prevention: row.Prevention?.trim() || '',
            treatment: row.Treatment?.trim() || '',
            importance: row['Why it matters']?.trim() || '',
            category: determineCategory(diseaseName),
            severity: determineSeverity(row),
            tags: extractTags(row)
          };

          diseases.push(disease);
        })
        .on('end', () => resolve())
        .on('error', (error) => reject(error));
    });

    console.log(`📊 Parsed ${diseases.length} diseases from CSV`);

    // Insert into database in batches
    const batchSize = 50;
    for (let i = 0; i < diseases.length; i += batchSize) {
      const batch = diseases.slice(i, i + batchSize);
      await Disease.insertMany(batch, { ordered: false });
      console.log(`✅ Imported batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(diseases.length / batchSize)}`);
    }

    console.log(`🎉 Successfully imported ${diseases.length} diseases to MongoDB`);
    
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
