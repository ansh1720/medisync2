# MediSync News API Setup Guide

This guide will help you obtain free API keys for real health news data in your MediSync application.

## 📰 Supported News Sources

### 🆓 Free Sources (No API Key Required)

#### 1. WHO (World Health Organization) - **ALWAYS AVAILABLE**
- **Website**: https://www.who.int/
- **Coverage**: Official WHO news, disease outbreaks, health emergencies
- **Updates**: Daily updates from the world's leading health authority
- **No Setup Required**: Works out of the box!

**Features:**
- Disease outbreak news (DON)
- Health emergency updates
- Global health policy announcements
- Vaccination campaigns
- Public health guidance

---

#### 2. CDC (Centers for Disease Control) - **ALWAYS AVAILABLE**
- **Website**: https://www.cdc.gov/
- **Coverage**: U.S. health data, disease prevention, outbreak tracking
- **Updates**: Real-time health alerts and guidance
- **No Setup Required**: Works out of the box!

**Features:**
- COVID-19 and flu updates
- Vaccination information
- Disease prevention guidelines
- Health statistics
- Travel health notices

---

#### 3. PubMed (Medical Research) - **ALWAYS AVAILABLE**
- **Website**: https://pubmed.ncbi.nlm.nih.gov/
- **Coverage**: Latest medical research papers and clinical studies
- **Updates**: Thousands of new research articles daily
- **No Setup Required**: Works out of the box!

**Features:**
- Peer-reviewed research
- Clinical trial results
- Medical breakthroughs
- Scientific discoveries
- Evidence-based medicine

---

### 🔑 Optional API Sources (Require Keys)

#### 4. NewsAPI (Primary Source) - **RECOMMENDED**
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

### 5. GNews API (Secondary Source)
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

### 6. CurrentsAPI (Additional Source)
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

### Option 1: No Setup (Free Sources Only) ⭐ **RECOMMENDED FOR BEGINNERS**
The app works immediately with these free sources:
- ✅ WHO (World Health Organization)
- ✅ CDC (Centers for Disease Control)
- ✅ PubMed (Medical Research)

**No configuration needed!** Just start the app and visit the news page.

---

### Option 2: Basic Setup (NewsAPI Only)
For basic functionality, you only need NewsAPI:

```env
# Add to your .env file
VITE_NEWS_API_KEY=your_newsapi_key_here
```

---

### Option 3: Complete Setup (All Optional APIs)
For maximum news variety and reliability:

```env
# Add to your .env file
VITE_NEWS_API_KEY=your_newsapi_key_here
VITE_GNEWS_API_KEY=your_gnews_key_here
VITE_CURRENTS_API_KEY=your_currents_key_here
```

---

## 📊 News Sources Overview

| Service | Setup Required | Requests/Day | Best For | Status |
|---------|---------------|--------------|----------|--------|
| **WHO** | ❌ No | Unlimited | Official health alerts & outbreaks | ✅ Always Available |
| **CDC** | ❌ No | Unlimited | U.S. health data & prevention | ✅ Always Available |
| **PubMed** | ❌ No | Unlimited | Medical research & studies | ✅ Always Available |
| NewsAPI | ✅ Yes | 1,000 | Major news outlets coverage | ⭐ Optional |
| GNews | ✅ Yes | 100 | International news | ⭐ Optional |
| CurrentsAPI | ✅ Yes | 600 | Breaking news | ⭐ Optional |

**Total Free Access**: 3 unlimited sources + up to 1,700 requests/day with optional APIs

---

## 🔧 How It Works in MediSync

1. **Free Sources First**: Always tries WHO, CDC, and PubMed first (no API keys needed)
2. **Smart Fallback System**: If one source fails, automatically tries the next
3. **Load Balancing**: Rotates between all available sources to distribute requests
4. **Optional Enhancement**: Add NewsAPI/GNews/CurrentsAPI keys for even more variety
5. **Source Attribution**: Shows which health organization provided each article

**You get real health news even without any API keys!** ✨

---

## 🚀 Quick Start

### Immediate Use (No Setup)
1. Start your development server
2. Visit `/news` page
3. See real health news from WHO, CDC, and PubMed immediately! 🎉

### Enhanced Setup (Optional)
1. Get NewsAPI key for more variety (recommended)
2. Add to `.env` file in `/client` folder:
   ```
   VITE_NEWS_API_KEY=your_key_here
   ```
3. Restart your development server
4. Enjoy even more diverse health news sources!

---

## 💡 Pro Tips

- **No Keys Needed**: The app works great with just WHO, CDC, and PubMed!
- **Add NewsAPI**: For the most variety, add NewsAPI (1,000 requests/day)
- **Monitor Usage**: If using optional APIs, check dashboards to track usage
- **Keep Keys Secure**: Never commit API keys to version control
- **Mix Sources**: The app automatically rotates between all available sources for variety

---

## 🔍 Troubleshooting

### "Loading news..." takes a long time
- This is normal for first load - fetching from multiple health organizations
- News is cached for better performance on subsequent loads

### Optional API keys not working
1. Check that keys are in `.env` file in `/client` folder
2. Ensure no extra spaces around the `=` sign
3. Restart the development server after adding keys
4. Check browser console for specific error messages

### No news showing at all
- Check your internet connection
- Some sources might be temporarily unavailable - the app will try others
- Check browser console for error messages

---

## ✨ What's New

**🎉 Major Update**: MediSync now includes **free, unlimited access** to official health organizations:

- **WHO**: Get official disease outbreak alerts and global health news
- **CDC**: Access U.S. health statistics and prevention guidelines  
- **PubMed**: Browse latest medical research and clinical studies

**No API keys required!** The app works immediately with real health data from trusted medical sources.

---

## 📞 Support

If you encounter issues:
1. Check API provider documentation
2. Verify email addresses are confirmed
3. Ensure you're on the free tier (not expired trial)
4. Contact API provider support if needed