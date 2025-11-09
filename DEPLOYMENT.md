# MediSync Deployment Guide

## GitHub Pages Deployment

This guide will help you deploy the MediSync frontend to GitHub Pages.

### Prerequisites

- GitHub repository: `medisync2`
- Node.js installed locally (for testing)

### Step 1: Enable GitHub Pages

1. Go to your repository: https://github.com/ansh1720/medisync2
2. Click on **Settings** → **Pages** (left sidebar)
3. Under **Source**, select **GitHub Actions**

### Step 2: Push Changes

The deployment workflow is already set up. Just push your code:

```bash
git add .
git commit -m "Add GitHub Pages deployment"
git push medisync2 main
```

### Step 3: Monitor Deployment

1. Go to the **Actions** tab in your repository
2. Wait for the "Deploy to GitHub Pages" workflow to complete (usually 2-3 minutes)
3. Once complete, your site will be live at: **https://ansh1720.github.io/medisync2/**

### Step 4: Backend Deployment (Important!)

⚠️ **Note**: GitHub Pages only hosts static frontend files. You need to deploy the backend separately.

#### Option 1: Deploy Backend to Render (Recommended - Free)

1. Go to https://render.com and sign up
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variables**:
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: Your JWT secret
     - `NODE_ENV`: `production`

#### Option 2: Deploy Backend to Railway

1. Go to https://railway.app and sign up
2. Click **New Project** → **Deploy from GitHub repo**
3. Select `medisync2` repository
4. Set root directory to `server`
5. Add environment variables (same as above)

#### Option 3: Deploy Backend to Heroku

```bash
cd server
heroku create medisync-api
git subtree push --prefix server heroku main
```

### Step 5: Update API URL in Frontend

Once your backend is deployed, update the API URL:

1. Create `client/.env.production`:
```env
VITE_API_URL=https://your-backend-url.com
```

2. Update `client/src/utils/api.js` to use this URL

3. Commit and push:
```bash
git add .
git commit -m "Update production API URL"
git push medisync2 main
```

### Testing Locally

Before deploying, test the build locally:

```bash
cd client
npm run build
npm run preview
```

Visit `http://localhost:4173` to see the production build.

### Troubleshooting

#### Issue: Blank page after deployment
- Check browser console for errors
- Verify `base: '/medisync2/'` in `vite.config.js` matches your repository name
- Check if all environment variables are set

#### Issue: API requests failing
- Ensure backend is deployed and running
- Check CORS settings in backend
- Verify API URL in frontend `.env.production`

#### Issue: 404 on page refresh
- GitHub Pages doesn't support SPA routing by default
- Add a custom 404.html that redirects to index.html (already included)

### Custom Domain (Optional)

1. Go to Settings → Pages
2. Add your custom domain
3. Update DNS records as instructed
4. Update `base: '/'` in `vite.config.js`

### Continuous Deployment

The GitHub Actions workflow automatically deploys on every push to `main` branch. No manual action needed!

---

## Environment Variables for Production

### Frontend (.env.production)
```env
VITE_API_URL=https://your-backend-url.com
VITE_NEWS_API_KEY=your_newsapi_key (optional)
VITE_GNEWS_API_KEY=your_gnews_key (optional)
```

### Backend (Render/Railway/Heroku)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/medisync
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=production
PORT=3001
CLIENT_URL=https://ansh1720.github.io/medisync2
```

---

## Quick Start Commands

```bash
# Build frontend locally
cd client && npm run build

# Preview production build
npm run preview

# Deploy (automatic via GitHub Actions)
git push medisync2 main
```

Your site will be live at: **https://ansh1720.github.io/medisync2/** 🚀
