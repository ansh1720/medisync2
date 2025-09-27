/**
 * Database Seed Script
 * Populates the database with sample data for development and testing
 * Run with: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./models/User');
const Disease = require('./models/Disease');

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Sample users data
 */
const sampleUsers = [
  {
    name: 'System Administrator',
    email: 'admin@medisync.com',
    password: 'Admin123!',
    role: 'admin',
    phone: '+1234567890',
    language: 'en',
    isActive: true
  },
  {
    name: 'Dr. Sarah Wilson',
    email: 'dr.wilson@medisync.com',
    password: 'Doctor123!',
    role: 'doctor',
    phone: '+1234567891',
    language: 'en',
    isActive: true
  },
  {
    name: 'Dr. Michael Chen',
    email: 'dr.chen@medisync.com',
    password: 'Doctor123!',
    role: 'doctor',
    phone: '+1234567892',
    language: 'en',
    isActive: true
  },
  {
    name: 'John Smith',
    email: 'john.smith@example.com',
    password: 'User123!',
    role: 'user',
    phone: '+1234567893',
    language: 'en',
    isActive: true
  },
  {
    name: 'Emily Johnson',
    email: 'emily.johnson@example.com',
    password: 'User123!',
    role: 'user',
    phone: '+1234567894',
    language: 'en',
    isActive: true
  }
];

/**
 * Sample diseases data
 */
const sampleDiseases = [
  {
    name: 'Common Cold',
    description: 'A viral infection of the upper respiratory tract that is very common and usually mild. It typically resolves on its own within 7-10 days.',
    symptoms: [
      'runny nose', 'sneezing', 'sore throat', 'mild cough', 
      'congestion', 'mild headache', 'low fever', 'fatigue'
    ],
    prevention: [
      'Wash hands frequently',
      'Avoid close contact with infected people',
      'Don\'t touch face with unwashed hands',
      'Maintain good hygiene',
      'Get adequate sleep',
      'Manage stress levels'
    ],
    treatment: [
      'Rest and sleep',
      'Drink plenty of fluids',
      'Use humidifier',
      'Gargle with salt water',
      'Over-the-counter pain relievers',
      'Throat lozenges'
    ],
    riskFactors: [
      'Weakened immune system',
      'Age (children and elderly)',
      'Seasonal changes',
      'Stress',
      'Lack of sleep',
      'Close contact with infected individuals'
    ],
    tags: ['respiratory', 'viral', 'contagious', 'mild'],
    sources: [
      'https://www.cdc.gov/dotw/common-cold/',
      'https://www.mayoclinic.org/diseases-conditions/common-cold/'
    ],
    severity: 'low',
    category: 'respiratory'
  },
  {
    name: 'Influenza (Flu)',
    description: 'A contagious respiratory illness caused by influenza viruses. It can cause mild to severe illness and can lead to hospitalization and death.',
    symptoms: [
      'high fever', 'muscle aches', 'fatigue', 'headache',
      'dry cough', 'sore throat', 'runny nose', 'body aches'
    ],
    prevention: [
      'Annual flu vaccination',
      'Wash hands frequently',
      'Avoid touching face',
      'Stay away from sick people',
      'Maintain healthy lifestyle',
      'Cover coughs and sneezes'
    ],
    treatment: [
      'Antiviral medications (if prescribed early)',
      'Rest and isolation',
      'Drink plenty of fluids',
      'Over-the-counter fever reducers',
      'Humidifier use',
      'Seek medical care if symptoms worsen'
    ],
    riskFactors: [
      'Age (under 5 or over 65)',
      'Chronic medical conditions',
      'Weakened immune system',
      'Pregnancy',
      'Obesity',
      'Living in nursing home'
    ],
    tags: ['respiratory', 'viral', 'contagious', 'seasonal'],
    sources: [
      'https://www.cdc.gov/flu/',
      'https://www.who.int/news-room/fact-sheets/detail/influenza-(seasonal)'
    ],
    severity: 'medium',
    category: 'respiratory'
  },
  {
    name: 'Type 2 Diabetes',
    description: 'A chronic condition that affects the way the body processes blood sugar (glucose). The body either resists the effects of insulin or doesn\'t produce enough insulin.',
    symptoms: [
      'increased thirst', 'frequent urination', 'increased hunger',
      'fatigue', 'blurred vision', 'slow healing wounds',
      'frequent infections', 'numbness in hands or feet'
    ],
    prevention: [
      'Maintain healthy weight',
      'Regular physical activity',
      'Healthy diet with limited processed foods',
      'Regular health screenings',
      'Avoid smoking',
      'Limit alcohol consumption'
    ],
    treatment: [
      'Blood glucose monitoring',
      'Healthy diet and meal planning',
      'Regular exercise',
      'Medication as prescribed',
      'Regular medical check-ups',
      'Foot care and eye exams'
    ],
    riskFactors: [
      'Obesity',
      'Family history',
      'Age over 45',
      'Sedentary lifestyle',
      'High blood pressure',
      'Previous gestational diabetes'
    ],
    tags: ['chronic', 'metabolic', 'lifestyle'],
    sources: [
      'https://www.cdc.gov/diabetes/basics/type2.html',
      'https://www.diabetes.org/diabetes/type-2'
    ],
    severity: 'high',
    category: 'endocrine'
  },
  {
    name: 'Hypertension (High Blood Pressure)',
    description: 'A condition in which the force of the blood against the artery walls is too high. Often called the "silent killer" because it usually has no symptoms.',
    symptoms: [
      'headaches', 'shortness of breath', 'nosebleeds',
      'chest pain', 'dizziness', 'vision problems'
    ],
    prevention: [
      'Maintain healthy weight',
      'Regular exercise',
      'Limit sodium intake',
      'Eat potassium-rich foods',
      'Limit alcohol',
      'Don\'t smoke',
      'Manage stress'
    ],
    treatment: [
      'Lifestyle modifications',
      'Regular blood pressure monitoring',
      'Antihypertensive medications',
      'Regular medical follow-ups',
      'Stress management',
      'Dietary changes (DASH diet)'
    ],
    riskFactors: [
      'Age',
      'Family history',
      'Obesity',
      'Lack of physical activity',
      'High sodium diet',
      'Excessive alcohol use',
      'Stress'
    ],
    tags: ['cardiovascular', 'chronic', 'silent'],
    sources: [
      'https://www.cdc.gov/bloodpressure/',
      'https://www.heart.org/en/health-topics/high-blood-pressure'
    ],
    severity: 'high',
    category: 'cardiovascular'
  },
  {
    name: 'Migraine',
    description: 'A neurological condition that can cause a variety of symptoms, most notably a throbbing, pulsing headache on one side of the head.',
    symptoms: [
      'severe headache', 'nausea', 'vomiting', 'sensitivity to light',
      'sensitivity to sound', 'visual disturbances', 'dizziness'
    ],
    prevention: [
      'Identify and avoid triggers',
      'Maintain regular sleep schedule',
      'Stay hydrated',
      'Manage stress',
      'Regular meals',
      'Limit caffeine and alcohol'
    ],
    treatment: [
      'Over-the-counter pain relievers',
      'Prescription migraine medications',
      'Rest in dark, quiet room',
      'Apply cold or warm compress',
      'Stay hydrated',
      'Preventive medications if frequent'
    ],
    riskFactors: [
      'Family history',
      'Age (teens to 50s)',
      'Gender (more common in women)',
      'Hormonal changes',
      'Certain foods',
      'Stress',
      'Sleep changes'
    ],
    tags: ['neurological', 'chronic', 'headache'],
    sources: [
      'https://www.mayoclinic.org/diseases-conditions/migraine-headache/',
      'https://americanmigrainefoundation.org/'
    ],
    severity: 'medium',
    category: 'neurological'
  },
  {
    name: 'Gastroesophageal Reflux Disease (GERD)',
    description: 'A chronic condition where stomach acid frequently flows back into the esophagus, causing irritation and discomfort.',
    symptoms: [
      'heartburn', 'chest pain', 'difficulty swallowing',
      'regurgitation', 'chronic cough', 'sore throat',
      'hoarse voice', 'feeling of lump in throat'
    ],
    prevention: [
      'Maintain healthy weight',
      'Avoid trigger foods',
      'Eat smaller meals',
      'Don\'t lie down after eating',
      'Elevate head while sleeping',
      'Quit smoking',
      'Limit alcohol'
    ],
    treatment: [
      'Dietary modifications',
      'Antacids for symptom relief',
      'Proton pump inhibitors',
      'H2 receptor blockers',
      'Lifestyle changes',
      'Surgery in severe cases'
    ],
    riskFactors: [
      'Obesity',
      'Pregnancy',
      'Smoking',
      'Certain foods and drinks',
      'Large meals',
      'Lying down after eating',
      'Certain medications'
    ],
    tags: ['digestive', 'chronic', 'acid reflux'],
    sources: [
      'https://www.niddk.nih.gov/health-information/digestive-diseases/acid-reflux-ger-gerd-adults',
      'https://www.mayoclinic.org/diseases-conditions/gerd/'
    ],
    severity: 'medium',
    category: 'digestive'
  }
];

/**
 * Create sample users
 */
const seedUsers = async () => {
  try {
    console.log('🌱 Seeding users...');
    
    // Clear existing users
    await User.deleteMany({});
    
    // Create users with hashed passwords
    const users = [];
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = new User({
        ...userData,
        passwordHash: hashedPassword
      });
      users.push(user);
    }
    
    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);
    
    return createdUsers;
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

/**
 * Create sample diseases
 */
const seedDiseases = async (adminUser) => {
  try {
    console.log('🌱 Seeding diseases...');
    
    // Clear existing diseases
    await Disease.deleteMany({});
    
    // Add createdBy field to each disease
    const diseasesWithCreator = sampleDiseases.map(disease => ({
      ...disease,
      createdBy: adminUser._id,
      lastModifiedBy: adminUser._id
    }));
    
    const createdDiseases = await Disease.insertMany(diseasesWithCreator);
    console.log(`✅ Created ${createdDiseases.length} diseases`);
    
    return createdDiseases;
  } catch (error) {
    console.error('❌ Error seeding diseases:', error);
    throw error;
  }
};

/**
 * Main seed function
 */
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();
    
    // Seed users first
    const users = await seedUsers();
    const adminUser = users.find(user => user.role === 'admin');
    
    // Seed diseases
    await seedDiseases(adminUser);
    
    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Sample Accounts Created:');
    console.log('Admin: admin@medisync.com / Admin123!');
    console.log('Doctor: dr.wilson@medisync.com / Doctor123!');
    console.log('User: john.smith@example.com / User123!');
    console.log('\n🔍 You can now test the API endpoints with these accounts.');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
    process.exit(0);
  }
};

/**
 * Clear database function
 */
const clearDatabase = async () => {
  try {
    console.log('🧹 Clearing database...');
    
    await connectDB();
    
    await User.deleteMany({});
    await Disease.deleteMany({});
    
    console.log('✅ Database cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'clear':
    clearDatabase();
    break;
  default:
    seedDatabase();
}

module.exports = {
  seedDatabase,
  clearDatabase,
  sampleUsers,
  sampleDiseases
};