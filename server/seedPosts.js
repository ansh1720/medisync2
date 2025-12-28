const mongoose = require('mongoose');
const Post = require('./models/Post');
const User = require('./models/User');
require('dotenv').config();

const mockPosts = [
  {
    title: 'Tips for Managing Diabetes',
    body: 'Looking for advice on managing blood sugar levels naturally. What has worked for you? I\'ve been diagnosed recently and trying to understand the best approaches for diet and exercise. Any recommendations would be greatly appreciated!',
    category: 'chronic_conditions',
    tags: ['diabetes', 'blood sugar', 'diet'],
    status: 'published'
  },
  {
    title: 'Best exercises for weight loss?',
    body: 'Starting my fitness journey and would love to hear about effective exercises that helped you lose weight. I\'m looking for a balanced approach that combines cardio and strength training. What worked best for you?',
    category: 'exercise',
    tags: ['exercise', 'weight loss', 'fitness'],
    status: 'published'
  },
  {
    title: 'Dealing with anxiety and stress',
    body: 'How do you cope with daily anxiety? Looking for healthy coping mechanisms. I\'ve tried meditation but would love to hear about other techniques that have worked for people. Mental health is so important!',
    category: 'mental_health',
    tags: ['anxiety', 'stress', 'mental health'],
    status: 'published'
  },
  {
    title: 'Healthy meal prep ideas',
    body: 'Share your favorite healthy meal prep recipes for the week! I\'m trying to eat better but find it hard to prepare healthy meals daily. What are your go-to recipes that are both nutritious and easy to prepare?',
    category: 'nutrition',
    tags: ['nutrition', 'meal prep', 'healthy eating'],
    status: 'published'
  },
  {
    title: 'Managing high blood pressure naturally',
    body: 'What lifestyle changes have helped you control hypertension without medication? I\'m looking for natural ways to manage blood pressure through diet, exercise, and stress management. Would love to hear your experiences!',
    category: 'chronic_conditions',
    tags: ['hypertension', 'blood pressure', 'lifestyle'],
    status: 'published'
  }
];

async function seedPosts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find a test user or create one
    let testUser = await User.findOne({ email: 'test@medisync.com' });
    
    if (!testUser) {
      console.log('📝 Creating test user...');
      testUser = await User.create({
        name: 'Community Member',
        email: 'test@medisync.com',
        password: 'test123', // This will be hashed by the User model
        role: 'user'
      });
      console.log('✅ Test user created');
    }

    // Clear existing posts
    console.log('🗑️  Clearing existing posts...');
    await Post.deleteMany({});

    // Create posts with the test user
    console.log('📝 Creating mock posts...');
    const postsWithUser = mockPosts.map(post => ({
      ...post,
      userId: testUser._id,
      stats: {
        likes: Math.floor(Math.random() * 20),
        comments: Math.floor(Math.random() * 10),
        views: Math.floor(Math.random() * 100)
      }
    }));

    const createdPosts = await Post.insertMany(postsWithUser);
    
    console.log(`✅ Successfully created ${createdPosts.length} posts`);
    
    createdPosts.forEach(post => {
      console.log(`   - ${post.title}`);
    });

    console.log('\n✨ Seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding posts:', error);
    process.exit(1);
  }
}

seedPosts();
