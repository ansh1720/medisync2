/**
 * Migration Script: Create Doctor documents for existing doctor users
 * Run this once to migrate existing doctor users who don't have Doctor documents
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Doctor = require('./models/Doctor');

async function migrateExistingDoctors() {
  try {
    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Find all users with doctor role
    const doctorUsers = await User.find({ role: 'doctor' });
    console.log(`📋 Found ${doctorUsers.length} doctor users\n`);

    let created = 0;
    let existing = 0;
    let errors = 0;

    for (const user of doctorUsers) {
      try {
        // Check if Doctor document already exists
        const existingDoctor = await Doctor.findOne({ userRef: user._id });
        
        if (existingDoctor) {
          console.log(`⏭️  Doctor document already exists for: ${user.name} (${user.email})`);
          existing++;
          continue;
        }

        // Create new Doctor document
        const doctor = new Doctor({
          name: user.name,
          email: user.email,
          specialty: 'general',
          contact: {
            phone: user.phone || '',
            officeAddress: {
              country: 'United States'
            }
          },
          userRef: user._id,
          createdBy: user._id,
          verificationStatus: 'not_submitted',
          isVerified: false,
          isActive: true,
          experience: 0,
          languages: ['en'],
          consultationFee: {
            amount: 0,
            currency: 'USD'
          },
          rating: {
            average: 0,
            reviewCount: 0
          }
        });

        await doctor.save();
        console.log(`✅ Created Doctor document for: ${user.name} (${user.email})`);
        created++;

      } catch (error) {
        console.error(`❌ Error creating Doctor for ${user.name}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Already existed: ${existing}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📋 Total processed: ${doctorUsers.length}`);
    console.log('='.repeat(50));

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');
    console.log('🎉 Migration completed successfully!\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateExistingDoctors();
