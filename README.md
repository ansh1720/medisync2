# MediSync Backend Server

A production-quality healthcare API backend built with Node.js, Express, MongoDB, and Socket.IO.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Disease Management**: CRUD operations with advanced search and filtering
- **Risk Assessment**: Symptom-based health risk calculation
- **Real-time Communication**: Socket.IO for live updates
- **Security**: Helmet, rate limiting, input validation, and secure password hashing
- **Database**: MongoDB with Mongoose ODM
- **Testing**: Jest and Supertest setup
- **Documentation**: Comprehensive API documentation

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 4.4+ (local or MongoDB Atlas)
- npm or yarn

## 🔧 Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Install server dependencies
npm run install-server

# Or navigate to server directory manually
cd server
npm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit the .env file with your configuration
```

**Required Environment Variables:**

```env
# MongoDB connection string
MONGO_URI=mongodb://localhost:27017/medisync

# JWT secret (generate a secure random string)
JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters

# Server configuration
PORT=5000
NODE_ENV=development

# Frontend URL for CORS
CLIENT_URL=http://localhost:3000

# Email configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Database Setup

```bash
# Start MongoDB (if running locally)
# On Windows:
net start MongoDB

# On macOS with Homebrew:
brew services start mongodb/brew/mongodb-community

# On Linux:
sudo systemctl start mongod
```

### 4. Seed Database with Sample Data

```bash
# Run the seed script from root directory
npm run seed

# Or navigate to server directory
cd server
npm run seed
```

This will create:
- **Admin Account**: `admin@medisync.com` / `Admin123!`
- **Doctor Account**: `dr.wilson@medisync.com` / `Doctor123!`  
- **User Account**: `john.smith@example.com` / `User123!`
- **Sample Diseases**: Common Cold, Flu, Diabetes, Hypertension, etc.

## 🏃‍♂️ Running the Server

### Development Mode
```bash
# From root directory
npm run dev

# Or from server directory
cd server
npm run dev
```
Server will start on `http://localhost:5000` with auto-restart on changes.

### Production Mode
```bash
# From root directory  
npm run start

# Or from server directory
cd server
npm start
```

### Health Check
Visit `http://localhost:5000/api/health` to verify the server is running.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Check test coverage
npm test -- --coverage
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Diseases
- `GET /api/diseases` - Get diseases (with pagination/search)
- `GET /api/diseases/search?q=query` - Full-text search
- `GET /api/diseases/:id` - Get disease by ID
- `POST /api/diseases` - Create disease (admin only)
- `PUT /api/diseases/:id` - Update disease (admin only)
- `DELETE /api/diseases/:id` - Delete disease (admin only)

### Example API Calls

```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com", 
    "password": "Password123!"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123!"
  }'

# Search diseases
curl "http://localhost:5000/api/diseases/search?q=fever%20headache&page=1&limit=5"

# Get disease by ID
curl "http://localhost:5000/api/diseases/DISEASE_ID"

# Create disease (admin only)
curl -X POST http://localhost:5000/api/diseases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Common Cold",
    "description": "Viral respiratory infection",
    "symptoms": ["runny nose", "cough", "sore throat"]
  }'
```

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (unique, required),
  passwordHash: String (required),
  role: String (enum: ['user', 'doctor', 'admin']),
  phone: String,
  language: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Disease Model
```javascript
{
  name: String (unique, required),
  description: String (required),
  symptoms: [String] (required),
  prevention: [String],
  treatment: [String],
  riskFactors: [String],
  tags: [String],
  sources: [String],
  severity: String (enum: ['low', 'medium', 'high', 'critical']),
  category: String (enum: ['infectious', 'chronic', etc.]),
  createdBy: ObjectId (User),
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs with salt rounds
- **Input Validation**: express-validator for request validation
- **Rate Limiting**: Prevents abuse and DoS attacks
- **CORS**: Configured for frontend integration
- **Helmet**: Security headers middleware
- **Role-based Access**: Admin, Doctor, User roles

## 🚀 Deployment

### Heroku Deployment

1. **Create Procfile** (already included):
```
web: node server.js
```

2. **Set Environment Variables**:
```bash
heroku config:set MONGO_URI=your_mongodb_atlas_uri
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set CLIENT_URL=your_frontend_url
```

3. **Deploy**:
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### MongoDB Atlas Setup

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create new cluster
3. Add database user
4. Whitelist IP addresses
5. Get connection string and update `MONGO_URI`

## 📁 Project Structure

```
server/
├── controllers/           # Request handlers
│   ├── authController.js
│   └── diseaseController.js
├── models/               # Database schemas
│   ├── User.js
│   └── Disease.js
├── routes/               # API routes
│   ├── authRoutes.js
│   └── diseaseRoutes.js
├── middlewares/          # Custom middleware
│   └── auth.js
├── utils/                # Utility functions
│   └── weights.js
├── .env.example          # Environment template
├── package.json          # Dependencies & scripts
└── server.js             # Main server file

scripts/
└── seed.js               # Database seeding script
```

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server  
npm start

# Run database seed
npm run seed

# Clear database
npm run seed clear

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Ensure MongoDB is running
# Windows:
net start MongoDB

# macOS:
brew services start mongodb-community

# Ubuntu:
sudo systemctl start mongod
```

**Port Already in Use**
```bash
# Kill process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:5000 | xargs kill
```

**JWT Token Issues**
- Ensure `JWT_SECRET` is set in `.env`
- Check token format: `Bearer <token>`
- Verify token hasn't expired

### Logs and Debugging

```bash
# View server logs in development
npm run dev

# Enable MongoDB debug logging
DEBUG=mongoose:* npm run dev

# View test output with details
npm test -- --verbose
```

## 📈 Performance & Scaling

- **Database Indexes**: Automatically created for common queries
- **Connection Pooling**: MongoDB connection pooling configured
- **Rate Limiting**: Prevents API abuse
- **Pagination**: All list endpoints support pagination
- **Caching**: Ready for Redis integration

## 🤝 Contributing

1. Follow existing code style and patterns
2. Add tests for new features
3. Update documentation
4. Use meaningful commit messages
5. Test thoroughly before submitting PRs

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 API Documentation

For detailed API documentation with request/response examples, see `/docs/api.md` (coming in full backend implementation).

---

**🏥 MediSync - Connecting Healthcare, Empowering Lives**