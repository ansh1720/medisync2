# 🚀 MediSync News API Setup Checklist

## Step-by-Step Registration Process

### ✅ 1. NewsAPI (PRIORITY: HIGH)
**Website**: Already opened - https://newsapi.org/register

**Registration Steps**:
- [ ] Fill out form with your details:
  - Name: `Your Name`
  - Email: `your-email@domain.com`
  - Company: `MediSync` or `Personal Project`
  - Country: `Your Country`
- [ ] Agree to terms and submit
- [ ] Check your email and verify account
- [ ] Login to dashboard
- [ ] Copy API key (format: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)
- [ ] Paste in notes/temp file for later

**Free Tier**: 1,000 requests/day ✨

---

### ✅ 2. GNews API (PRIORITY: MEDIUM)
**Website**: Already opened - https://gnews.io/register

**Registration Steps**:
- [ ] Create account with:
  - Email: `your-email@domain.com`
  - Password: `Your secure password`
- [ ] Agree to terms and submit
- [ ] Check email and verify
- [ ] Login to dashboard
- [ ] Find API token (format: `ab12cd34ef56gh78ij90kl12mn34op56qr78st90`)
- [ ] Copy and save for later

**Free Tier**: 100 requests/day

---

### ✅ 3. CurrentsAPI (PRIORITY: LOW)
**Website**: Already opened - https://currentsapi.services/en/register

**Registration Steps**:
- [ ] Fill registration form:
  - Username: `your-username`
  - Email: `your-email@domain.com`
  - Password: `Your secure password`
  - Company: `Optional`
- [ ] Submit and verify email
- [ ] Login to dashboard
- [ ] Go to account settings
- [ ] Copy API key (format: `AbCdEfGh-IjKl-MnOp-QrSt-UvWxYz123456`)
- [ ] Save for configuration

**Free Tier**: 600 requests/day

---

## 🔧 Configuration Steps

### 4. Update Environment File
Once you have your API keys:

- [ ] Open `client/.env` file in your project
- [ ] Add your keys (remove the # and add your actual keys):

```env
# Replace with your actual keys
VITE_NEWS_API_KEY=your_newsapi_key_here
VITE_GNEWS_API_KEY=your_gnews_key_here
VITE_CURRENTS_API_KEY=your_currents_key_here
```

### 5. Test Configuration
- [ ] Save the `.env` file
- [ ] Restart your development server: `npm run dev`
- [ ] Visit `/news` page
- [ ] Check console - should see API source names instead of "mock data"
- [ ] Verify real news articles are loading

---

## 💡 Pro Tips

### Minimum Setup
- **Just NewsAPI**: Gets you 1,000 requests/day with excellent health coverage
- **Add others later**: You can always add more APIs as needed

### Security
- **Keep keys private**: Never share your API keys
- **Check usage**: Monitor your API dashboards for usage stats
- **Environment file**: Make sure `.env` is in your `.gitignore`

### Troubleshooting
- **Keys not working**: Double-check for typos and extra spaces
- **Still seeing mock data**: Restart dev server after adding keys
- **API errors**: Check API dashboards for account status

---

## 📊 Expected Results

With real API keys configured, you'll get:
- ✅ **Live health news** from BBC, Reuters, CNN, etc.
- ✅ **Breaking health updates** from WHO, CDC, NIH
- ✅ **Medical research news** from journals and universities
- ✅ **Global health coverage** from international sources
- ✅ **Real-time updates** as news breaks
- ✅ **Better variety** than mock data

---

## 🆘 Need Help?

If you get stuck:
1. Check the detailed guide: `NEWS_API_SETUP.md`
2. Run setup script: `./setup-news-apis.ps1`
3. Ask me for specific help with any step!

**Ready to get started? Begin with NewsAPI (highest priority) 🚀**

## To Resume Development Tomorrow:

### 1. Start Backend Server:
```bash
cd "d:\app\ms\medisync\server"
npm run dev
```

### 2. Start Frontend Server (in new terminal):
```bash
cd "d:\app\ms\medisync\client" 
npm run dev
```

### 3. Test URLs:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Doctors API: http://localhost:5000/api/consultation/doctors
- Debug API: http://localhost:5000/api/consultation/debug-doctors

### 4. Database Check:
```bash
# Check doctors in correct database
cd "d:\app\ms\medisync\server"
node -e "const mongoose = require('mongoose'); const Doctor = require('./models/Doctor'); mongoose.connect('mongodb://localhost:27017/medisync').then(async () => { const count = await Doctor.countDocuments(); console.log('Doctors:', count); process.exit(0); });"
```

### 5. Key File Locations:
- Database config: `server/.env` (MONGO_URI=mongodb://localhost:27017/medisync)
- Doctor API: `server/controllers/consultationController.js`
- Frontend: `client/src/pages/DoctorConsultation.jsx`

### 6. If Issues Arise:
1. Check database connection (medisync vs diseaseDb)
2. Verify both servers are running
3. Check console for React errors
4. Refer to DEBUGGING_SESSION_LOG.md for details