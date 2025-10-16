import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { consultationAPI } from '../utils/api';
import { 
  CalendarDaysIcon, 
  UserGroupIcon, 
  ClockIcon, 
  CheckCircleIcon,
  DocumentTextIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  StarIcon,
  PhoneIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    completedConsultations: 0,
    upcomingAppointments: 0,
    averageRating: 0,
    totalReviews: 0
  });
  const [appointments, setAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [consultationRequests, setConsultationRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedData = useRef(false);

  useEffect(() => {
    // Prevent duplicate API calls in React StrictMode
    if (!hasLoadedData.current) {
      hasLoadedData.current = true;
      loadDoctorData();
    }
  }, []);

  const loadDoctorData = async () => {
    try {
      setIsLoading(true);
      
      // Load doctor schedule and stats from real API
      const [scheduleResponse, statsResponse, upcomingResponse] = await Promise.all([
        consultationAPI.getDoctorSchedule({ 
          date: new Date().toISOString().split('T')[0],
          view: 'day' 
        }).catch(err => {
          console.log('Schedule endpoint not available, using mock data');
          return null;
        }),
        consultationAPI.getConsultationStats({
          period: 'month'
        }).catch(err => {
          console.log('Stats endpoint not available, using mock data');
          return null;
        }),
        consultationAPI.getUpcomingConsultations({
          hours: 24
        }).catch(err => {
          console.log('Upcoming consultations endpoint not available, using mock data');
          return null;
        })
      ]);

      // Use real data if available, otherwise fall back to mock data
      if (statsResponse?.data?.data) {
        const statsData = statsResponse.data.data;
        setStats({
          todayAppointments: statsData.todayAppointments || 8,
          totalPatients: statsData.totalPatients || 142,
          completedConsultations: statsData.completedThisMonth || 89,
          upcomingAppointments: statsData.upcomingAppointments || 12,
          averageRating: statsData.averageRating || 4.8,
          totalReviews: statsData.totalReviews || 67
        });
      } else {
        // Mock data fallback
        setStats({
          todayAppointments: 8,
          totalPatients: 142,
          completedConsultations: 89,
          upcomingAppointments: 12,
          averageRating: 4.8,
          totalReviews: 67
        });
      }

      if (scheduleResponse?.data?.data?.appointments) {
        setAppointments(scheduleResponse.data.data.appointments);
      } else {
        // Mock appointments
        setAppointments([
          {
            id: 1,
            patientName: 'Sarah Johnson',
            patientAge: 32,
            time: '09:00 AM',
            type: 'video',
            condition: 'Regular Checkup',
            status: 'confirmed',
            duration: 30
          },
          {
            id: 2,
            patientName: 'Michael Chen',
            patientAge: 45,
            time: '10:30 AM',
            type: 'in-person',
            condition: 'Hypertension Follow-up',
            status: 'confirmed',
            duration: 45
          },
          {
            id: 3,
            patientName: 'Emily Rodriguez',
            patientAge: 28,
            time: '02:00 PM',
            type: 'phone',
            condition: 'Prescription Renewal',
            status: 'pending',
            duration: 15
          },
          {
            id: 4,
            patientName: 'David Wilson',
            patientAge: 38,
            time: '03:30 PM',
            type: 'video',
            condition: 'Diabetes Consultation',
            status: 'confirmed',
            duration: 30
          }
        ]);
      }

      // Mock recent patients and consultation requests for now
      setRecentPatients([
        {
          id: 1,
          name: 'Alice Thompson',
          age: 29,
          condition: 'Migraine',
          lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          nextAppointment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'stable'
        },
        {
          id: 2,
          name: 'Robert Brown',
          age: 52,
          condition: 'Diabetes Type 2',
          lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          nextAppointment: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          status: 'monitoring'
        },
        {
          id: 3,
          name: 'Lisa Garcia',
          age: 41,
          condition: 'Hypertension',
          lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          nextAppointment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'improving'
        }
      ]);

      setConsultationRequests([
        {
          id: 1,
          patientName: 'James Miller',
          age: 35,
          requestedTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
          urgency: 'medium',
          symptoms: 'Chest pain, shortness of breath',
          requestedAt: new Date(Date.now() - 30 * 60 * 1000)
        },
        {
          id: 2,
          patientName: 'Maria Lopez',
          age: 28,
          requestedTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
          urgency: 'low',
          symptoms: 'Skin rash, itching',
          requestedAt: new Date(Date.now() - 45 * 60 * 1000)
        }
      ]);

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading doctor data:', error);
      toast.error('Failed to load doctor dashboard data');
      setIsLoading(false);
    }
  };

  const handleAcceptConsultation = async (requestId) => {
    try {
      // In a real implementation, this would call an API to accept the consultation
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const acceptedRequest = consultationRequests.find(req => req.id === requestId);
      if (acceptedRequest) {
        // Add to appointments
        const newAppointment = {
          id: Date.now(),
          patientName: acceptedRequest.patientName,
          patientAge: acceptedRequest.age,
          time: formatTime(acceptedRequest.requestedTime),
          type: 'video',
          condition: acceptedRequest.symptoms,
          status: 'confirmed',
          duration: 30
        };
        setAppointments(prev => [...prev, newAppointment]);
        
        // Update stats
        setStats(prev => ({
          ...prev,
          todayAppointments: prev.todayAppointments + 1
        }));
      }
      
      setConsultationRequests(prev => prev.filter(req => req.id !== requestId));
      toast.success('Consultation request accepted');
    } catch (error) {
      console.error('Error accepting consultation:', error);
      toast.error('Failed to accept consultation request');
    }
  };

  const handleDeclineConsultation = async (requestId) => {
    try {
      // Mock API call  
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setConsultationRequests(prev => prev.filter(req => req.id !== requestId));
      toast.success('Consultation request declined');
    } catch (error) {
      console.error('Error declining consultation:', error);
      toast.error('Failed to decline consultation request');
    }
  };

  const handleStartConsultation = async (appointmentId) => {
    try {
      const appointment = appointments.find(apt => apt.id === appointmentId);
      if (appointment) {
        // In a real implementation, this would open the consultation interface
        toast.success(`Starting consultation with ${appointment.patientName}`);
        
        // Update appointment status to ongoing
        setAppointments(prev => 
          prev.map(apt => 
            apt.id === appointmentId 
              ? { ...apt, status: 'ongoing' }
              : apt
          )
        );
      }
    } catch (error) {
      console.error('Error starting consultation:', error);
      toast.error('Failed to start consultation');
    }
  };

  const handleOpenMedicalRecords = () => {
    // Navigate to health records page for doctor to manage patient records
    navigate('/health-records');
  };

  const handleNewPrescription = () => {
    // Navigate to prescriptions page where doctor can create new prescriptions
    navigate('/prescriptions');
  };

  const handleViewPatient = (patientId) => {
    // Navigate to health records page with patient context
    const patient = recentPatients.find(p => p.id === patientId);
    if (patient) {
      // For now, navigate to health records. In the future, this could be patient-specific
      navigate('/health-records', { state: { patientId, patientName: patient.name } });
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'stable': return 'text-green-600 bg-green-50';
      case 'monitoring': return 'text-yellow-600 bg-yellow-50';
      case 'improving': return 'text-blue-600 bg-blue-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConsultationTypeIcon = (type) => {
    switch (type) {
      case 'video': return <VideoCameraIcon className="h-4 w-4" />;
      case 'phone': return <PhoneIcon className="h-4 w-4" />;
      default: return <UserGroupIcon className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading doctor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
              <p className="text-lg text-gray-600">Welcome back, Dr. {user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleOpenMedicalRecords}
                className="btn btn-outline"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Medical Records
              </button>
              <button 
                onClick={handleNewPrescription}
                className="btn btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Prescription
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Today's Appointments */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                <p className="text-3xl font-bold text-gray-900">{stats.todayAppointments}</p>
                <p className="text-sm text-blue-600">4 confirmed, 1 pending</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CalendarDaysIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Patients */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalPatients}</p>
                <p className="text-sm text-green-600">+8 this month</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserGroupIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Completed Consultations */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed This Month</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completedConsultations}</p>
                <p className="text-sm text-purple-600">89% completion rate</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <CheckCircleIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Appointments</p>
                <p className="text-3xl font-bold text-gray-900">{stats.upcomingAppointments}</p>
                <p className="text-sm text-orange-600">Next 7 days</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <ClockIcon className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Average Rating */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <div className="flex items-center">
                  <p className="text-3xl font-bold text-gray-900">{stats.averageRating}</p>
                  <StarIcon className="h-6 w-6 text-yellow-400 ml-2" />
                </div>
                <p className="text-sm text-gray-500">{stats.totalReviews} reviews</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <HeartIcon className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Consultation Requests */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Requests</p>
                <p className="text-3xl font-bold text-gray-900">{consultationRequests.length}</p>
                <p className="text-sm text-blue-600">Awaiting response</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Schedule */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Today's Schedule</h3>
              <Link to="/consultations" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All
              </Link>
            </div>
            
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{appointment.patientName}</h4>
                        <span className="text-sm text-gray-500">({appointment.patientAge}y)</span>
                        <div className="flex items-center text-gray-400">
                          {getConsultationTypeIcon(appointment.type)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{appointment.condition}</p>
                      <p className="text-sm text-gray-500">
                        {appointment.time} • {appointment.duration} mins
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        appointment.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : appointment.status === 'ongoing'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.status}
                      </span>
                      <button 
                        onClick={() => handleStartConsultation(appointment.id)}
                        className={`btn btn-sm ${
                          appointment.status === 'ongoing' 
                            ? 'btn-secondary' 
                            : 'btn-primary'
                        }`}
                      >
                        {appointment.status === 'ongoing' ? 'Resume' : 'Start'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Patients */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Recent Patients</h3>
              <Link to="/patients" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All Patients
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentPatients.map((patient) => (
                <div 
                  key={patient.id} 
                  onClick={() => handleViewPatient(patient.id)}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{patient.name}</h4>
                      <span className="text-sm text-gray-500">({patient.age}y)</span>
                    </div>
                    <p className="text-sm text-gray-600">{patient.condition}</p>
                    <p className="text-xs text-gray-500">
                      Last visit: {formatDate(patient.lastVisit)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(patient.status)}`}>
                      {patient.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Next: {formatDate(patient.nextAppointment)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Consultation Requests */}
        {consultationRequests.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">New Consultation Requests</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {consultationRequests.length} pending
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {consultationRequests.map((request) => (
                  <div key={request.id} className={`border rounded-lg p-4 ${getUrgencyColor(request.urgency)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{request.patientName}</h4>
                          <span className="text-sm text-gray-500">({request.age}y)</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getUrgencyColor(request.urgency)}`}>
                            {request.urgency} priority
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Symptoms:</strong> {request.symptoms}
                        </p>
                        <p className="text-sm text-gray-500">
                          Requested for: {formatTime(request.requestedTime)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Submitted {formatTime(request.requestedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => handleAcceptConsultation(request.id)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineConsultation(request.id)}
                        className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorDashboard;