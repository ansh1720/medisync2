# MediSync - Healthcare Platform

A comprehensive healthcare platform with disease search, risk assessment, health news, community forum, and more.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### Installation

```bash
# Install dependencies
npm install
cd client && npm install
cd ../server && npm install

# Setup environment variables
# Create server/.env file with:
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000

# Run development servers
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
cd client
npm run dev
```

Visit `http://localhost:5173` for frontend and `http://localhost:5000` for backend.

## 🌐 Live Deployment

- **Frontend**: https://ansh1720.github.io/medisync2/
- **Backend**: https://medisync-api-9043.onrender.com

Both auto-deploy on push to main branch.

## 📋 Features

- **Disease Search** - Search and browse disease information
- **Risk Assessment** - Symptom-based health risk calculation
- **Health News** - Latest news from WHO, CDC, PubMed
- **Community Forum** - Post and discuss health topics with "My Posts" section
- **Hospital Locator** - Find nearby hospitals
- **Consultations** - Book and manage doctor consultations

## 🔧 Tech Stack

**Frontend:**
- React 18 + Vite
- TailwindCSS
- React Router
- Axios

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Socket.IO

## 📁 Project Structure

```
medisync/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   └── utils/       # Utilities
│   └── package.json
├── server/              # Express backend
│   ├── controllers/     # Request handlers
│   ├── models/         # Database schemas
│   ├── routes/         # API routes
│   ├── middlewares/    # Auth & validation
│   └── package.json
├── scripts/            # Database seeding scripts
└── README.md
```

## 🔒 Security

- JWT authentication with role-based access
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS configuration

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile

### Diseases
- `GET /api/diseases` - List diseases (pagination, search)
- `GET /api/diseases/:id` - Get disease details
- `POST /api/diseases` - Create disease (admin)

### Forum
- `GET /api/forum/posts` - Get posts (filtered by category)
- `POST /api/forum/posts` - Create post
- `POST /api/forum/posts/:id/like` - Like post

### News
- `GET /api/news/v2` - Get health news from WHO/CDC/PubMed

## 🛠️ Development

```bash
# Run tests
npm test

# Seed database
cd server
npm run seed

# Clear database
npm run seed clear
```

## 📄 License

MIT License

---

**🏥 MediSync - Connecting Healthcare, Empowering Lives**
