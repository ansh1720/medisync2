# Database Integration Plan

## Summary
Currently, many features in MediSync are using mock data instead of properly integrating with the database. This document outlines what has been fixed and what still needs attention.

## ✅ Already Using Database

1. **Authentication System** - Fully integrated with MongoDB
   - User registration
   - Login
   - JWT tokens
   - Role-based access control

2. **Disease Search** - Fully integrated
   - Disease database queries
   - Search functionality
   - Disease details

3. **Doctor Verification System** - Fully integrated
   - Doctor profile creation
   - Verification submission
   - Admin approval/rejection
   - Status tracking

4. **Equipment Readings** - Has API endpoints ready
   - `/api/equipment/readings` endpoints exist

5. **Community Forum** - Has API endpoints ready
   - `/api/forum/posts` endpoints exist

6. **Health News** - Has API endpoints ready
   - `/api/news` endpoints exist

## ✅ Just Fixed

1. **Doctor's Patients List** (`/doctor/patients`)
   - Now fetches real patients from consultations database
   - API endpoint: `GET /api/consultation/doctor/patients`
   - Falls back to mock data if no patients exist yet

## ⚠️ Partially Using Database

1. **Doctor Dashboard** (`/doctor-dashboard`)
   - **Fixed:** Now loads consultations from database via `/api/consultation/doctor/schedule`
   - **Still Mock:** 
     - Recent patients stats (shows mock names)
     - Some dashboard statistics
   - **Action needed:** Update to use consultation stats API

2. **Consultation Requests**
   - **Fixed:** Now loads from database
   - **Still Mock:** Accept/Decline actions need to update database
   - **Action needed:** Implement status update API calls

## ❌ Still Using Mock Data

1. **Admin Dashboard** (`/admin-dashboard`)
   - Recent activities (hardcoded activities)
   - System statistics (hardcoded numbers except pending verifications)
   - **Action needed:** Create API endpoints for:
     - User statistics
     - System activities log
     - Consultation statistics

2. **Risk Assessment** (`/risk-assessment`)
   - Risk history may not be saving properly
   - **Action needed:** Verify `/api/risk` endpoints are being used

3. **Hospital Locator** (`/hospital-locator`)
   - May have hardcoded hospitals
   - **Action needed:** Verify hospital data is loaded from database

4. **Health Records** (`/health-records`)
   - Check if using real user data
   - **Action needed:** Verify data persistence

5. **Prescriptions** (`/prescriptions`)
   - Check if integrated with consultations
   - **Action needed:** Link to consultation prescription endpoint

## 🔧 Backend APIs Available But Not Used

The following API endpoints exist in the backend but may not be used by frontend:

### Consultation APIs
- `GET /api/consultation/doctors` - Get available doctors
- `POST /api/consultation/book` - Book consultation
- `GET /api/consultation/my-consultations` - User's consultations
- `PUT /api/consultation/:id/reschedule` - Reschedule
- `DELETE /api/consultation/:id` - Cancel consultation
- `PUT /api/consultation/:id/complete` - Complete consultation
- `POST /api/consultation/:id/add-notes` - Add notes
- `POST /api/consultation/:id/prescription` - Add prescription
- `GET /api/consultation/:id/join` - Join consultation
- `GET /api/consultation/upcoming` - Upcoming consultations
- `GET /api/consultation/stats/overview` - Statistics

### Equipment APIs
- `POST /api/equipment/readings` - Add reading
- `GET /api/equipment/readings` - Get readings
- `GET /api/equipment/analytics` - Get analytics

### Forum APIs
- `GET /api/forum/posts` - Get posts
- `POST /api/forum/posts` - Create post
- `POST /api/forum/posts/:id/comments` - Add comment
- `POST /api/forum/posts/:id/like` - Like post

### Hospital APIs
- `GET /api/hospitals` - Get hospitals
- `GET /api/hospitals/:id` - Get hospital details

## 📋 Action Items Priority

### High Priority
1. ✅ **Doctor's Patients** - DONE
2. **Consultation Accept/Decline** - Update database when doctor accepts/declines
3. **Admin Dashboard Stats** - Create real statistics from database

### Medium Priority
4. **Health Records** - Verify persistence
5. **Risk Assessment** - Verify data saving
6. **Prescriptions** - Link to consultations

### Low Priority
7. **Admin Activities Log** - Create activity tracking system
8. **Dashboard Statistics** - Real-time stats calculations

## 🎯 Next Steps

1. **Test the fixed features:**
   - Doctor's Patients page should now show real patients
   - Doctor Dashboard should show real consultations

2. **Update Accept/Decline functionality:**
   - When doctor accepts consultation, update status in database
   - When doctor declines, update status to 'cancelled'

3. **Create missing API endpoints:**
   - System statistics for admin
   - Activity logging

4. **Frontend integration:**
   - Replace all remaining mock data with API calls
   - Add proper error handling
   - Add loading states

## 📝 Notes

- Mock data should ONLY be used as fallback when API fails
- Always show a message to user when displaying fallback data
- All new features must use database from the start
- Existing features should be migrated systematically
