# Quick Start Commands - MediSync

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