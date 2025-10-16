/**
 * Cleanup Script - Remove Previously Seeded Diseases
 * This script removes all diseases from MongoDB to ensure only CSV-based diseases are used
 */

const mongoose = require('mongoose');
const Disease = require('./models/Disease');
require('dotenv').config();

async function cleanupDiseases() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get count of existing diseases
    const existingCount = await Disease.countDocuments();
    console.log(`📊 Found ${existingCount} diseases in database`);

    if (existingCount === 0) {
      console.log('🎉 Database is already clean - no diseases to remove');
      return;
    }

    // Remove all diseases from MongoDB
    const deleteResult = await Disease.deleteMany({});
    console.log(`🗑️  Removed ${deleteResult.deletedCount} diseases from MongoDB`);

    // Verify cleanup
    const remainingCount = await Disease.countDocuments();
    console.log(`📈 Remaining diseases in database: ${remainingCount}`);

    if (remainingCount === 0) {
      console.log('✅ Database cleanup completed successfully!');
      console.log('💡 Note: The application will now use only CSV-based disease data');
      console.log('📄 CSV file contains 231 diseases and will be loaded automatically on server start');
    } else {
      console.log('⚠️  Warning: Some diseases may still remain in the database');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the cleanup
console.log('🧹 Starting database cleanup...');
console.log('📋 This will remove all previously seeded diseases from MongoDB');
console.log('📄 CSV-based diseases (231 total) will continue to work from the CSV file');
console.log('');

cleanupDiseases();