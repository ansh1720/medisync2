# MediSync News API Setup Guide

This guide will help you obtain free API keys for real health news data in your MediSync application.

## 📰 Supported News APIs

### 1. NewsAPI (Primary Source) - **RECOMMENDED**
- **Website**: https://newsapi.org/register
- **Free Tier**: 1,000 requests/day
- **Coverage**: BBC, Reuters, CNN, AP News, NPR, and 30,000+ sources
- **Health Sources**: Excellent coverage of health organizations and medical news

**Steps to get API key:**
1. Visit https://newsapi.org/register
2. Fill out the registration form:
   - Name: Your name
   - Email: Your email address
   - Company: Your company/project name (can be "Personal Project")
   - Country: Your country
3. Verify your email address
4. Login to your dashboard
5. Copy your API key from the "API Key" section

**Example API Key Format**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

---

### 2. GNews API (Secondary Source)
- **Website**: https://gnews.io/register
- **Free Tier**: 100 requests/day
- **Coverage**: Global news sources with good health coverage
- **Benefits**: Good for international health news

**Steps to get API key:**
1. Visit https://gnews.io/register
2. Create account with:
   - Email address
   - Password
   - Agree to terms
3. Verify email address
4. Login to dashboard
5. Find your API token in the dashboard

**Example API Key Format**: `ab12cd34ef56gh78ij90kl12mn34op56qr78st90`

---

### 3. CurrentsAPI (Additional Source)
- **Website**: https://currentsapi.services/en/register
- **Free Tier**: 600 requests/day
- **Coverage**: Diverse international sources
- **Benefits**: Good for breaking health news

**Steps to get API key:**
1. Visit https://currentsapi.services/en/register
2. Fill registration form:
   - Username
   - Email
   - Password
   - Company (optional)
3. Verify email
4. Login to dashboard
5. Copy API key from account settings

**Example API Key Format**: `AbCdEfGh-IjKl-MnOp-QrSt-UvWxYz123456`

---

## 🛠️ Configuration Instructions

### Option 1: Minimum Setup (NewsAPI Only)
For basic functionality, you only need NewsAPI:

```env
# Add to your .env file
VITE_NEWS_API_KEY=your_newsapi_key_here
```

### Option 2: Complete Setup (All APIs)
For maximum news variety and reliability:

```env
# Add to your .env file
VITE_NEWS_API_KEY=your_newsapi_key_here
VITE_GNEWS_API_KEY=your_gnews_key_here
VITE_CURRENTS_API_KEY=your_currents_key_here
```

---

## 📊 API Usage Limits

| Service | Free Requests/Day | Best For |
|---------|------------------|----------|
| NewsAPI | 1,000 | Primary health news from major sources |
| GNews | 100 | International health coverage |
| CurrentsAPI | 600 | Breaking health news and alerts |

**Total Daily Capacity**: Up to 1,700 requests/day with all APIs

---

## 🔧 How It Works in MediSync

1. **Smart Fallback System**: If one API fails, it tries the next
2. **Load Balancing**: Rotates between APIs to distribute requests
3. **Graceful Degradation**: Falls back to mock data if all APIs fail
4. **Source Attribution**: Shows which news source provided each article

---

## 🚀 Quick Start

1. Get at least NewsAPI key (recommended)
2. Add to `.env` file in `/client` folder
3. Restart your development server
4. Visit `/news` page to see real health news!

---

## 💡 Pro Tips

- **Start with NewsAPI**: It has the highest request limit and best health coverage
- **Add others gradually**: Test one API at a time
- **Monitor usage**: Check your dashboards to track API usage
- **Keep keys secure**: Never commit API keys to version control

---

## 🔍 Troubleshooting

If you see "No valid API keys found" message:
1. Check that keys are in `.env` file in `/client` folder
2. Ensure no extra spaces around the `=` sign
3. Restart the development server after adding keys
4. Check browser console for specific error messages

---

## 📞 Support

If you encounter issues:
1. Check API provider documentation
2. Verify email addresses are confirmed
3. Ensure you're on the free tier (not expired trial)
4. Contact API provider support if needed