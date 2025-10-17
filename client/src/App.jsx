import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { InteractionProvider } from './context/InteractionContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import RiskAssessment from './pages/RiskAssessment';
import EquipmentReadings from './pages/EquipmentReadings';
import HospitalLocator from './pages/HospitalLocator';
import DoctorConsultation from './pages/DoctorConsultation';
import CommunityForum from './pages/CommunityForum';
import HealthNews from './pages/HealthNews';
import UserProfile from './pages/UserProfile';
import DiseaseDetails from './pages/DiseaseDetails';
import EnhancedDiseaseSearch from './pages/EnhancedDiseaseSearch';
import EnhancedDiseaseDetails from './pages/EnhancedDiseaseDetails';
import HealthRecords from './pages/HealthRecords';
import Prescriptions from './pages/Prescriptions';
import DoctorPatients from './pages/DoctorPatients';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InteractionProvider>
          <Router>
            <div className="App">
            <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: '#4aed88',
                },
              },
            }}
          />
          
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-dashboard"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorPatients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/risk-assessment"
              element={
                <ProtectedRoute>
                  <RiskAssessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/equipment"
              element={
                <ProtectedRoute>
                  <EquipmentReadings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hospitals"
              element={
                <ProtectedRoute>
                  <HospitalLocator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/consultations"
              element={
                <ProtectedRoute>
                  <DoctorConsultation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forum"
              element={
                <ProtectedRoute>
                  <CommunityForum />
                </ProtectedRoute>
              }
            />
            <Route
              path="/news"
              element={
                <ProtectedRoute>
                  <HealthNews />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/disease/:diseaseId"
              element={
                <ProtectedRoute>
                  <DiseaseDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/diseases"
              element={
                <ProtectedRoute>
                  <EnhancedDiseaseSearch />
                </ProtectedRoute>
              }
            />
            <Route
              path="/diseases/details/:name"
              element={
                <ProtectedRoute>
                  <EnhancedDiseaseDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/health-records"
              element={
                <ProtectedRoute>
                  <HealthRecords />
                </ProtectedRoute>
              }
            />
            <Route
              path="/prescriptions"
              element={
                <ProtectedRoute>
                  <Prescriptions />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<RoleBasedRedirect />} />
            <Route path="*" element={<RoleBasedRedirect />} />
          </Routes>
        </div>
      </Router>
      </InteractionProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
