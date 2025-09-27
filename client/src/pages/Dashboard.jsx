import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  ChartBarIcon,
  HeartIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';

function Dashboard() {
  const { user } = useAuth();
  const [healthMetrics, setHealthMetrics] = useState({
    riskScore: 15,
    lastAssessment: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    bpTrend: 'improving',
    lastBpReading: { systolic: 125, diastolic: 80, date: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    weeklyActivity: 4,
    upcomingAppointments: 2,
    medicationAdherence: 85,
    healthGoals: {
      completed: 3,
      total: 5
    }
  });

  const [recentActivity, setRecentActivity] = useState([
    {
      type: 'risk_assessment',
      title: 'Completed Risk Assessment',
      description: 'Overall risk score: Low (15%)',
      time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'completed'
    },
    {
      type: 'equipment_reading',
      title: 'Blood Pressure Reading',
      description: '125/80 mmHg - Normal',
      time: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'normal'
    },
    {
      type: 'appointment',
      title: 'Appointment Booked',
      description: 'Dr. Smith - Cardiology',
      time: new Date(Date.now() - 12 * 60 * 60 * 1000),
      status: 'scheduled'
    },
    {
      type: 'community',
      title: 'Forum Post Reply',
      description: 'Replied to "Managing diabetes"',
      time: new Date(Date.now() - 6 * 60 * 60 * 1000),
      status: 'completed'
    }
  ]);

  // Mock health recommendations
  const [recommendations] = useState([
    {
      type: 'exercise',
      title: 'Increase Physical Activity',
      description: 'Try to get 150 minutes of moderate exercise per week.',
      priority: 'medium',
      action: 'Log Exercise'
    },
    {
      type: 'medication',
      title: 'Medication Reminder',
      description: 'Remember to take your morning medications.',
      priority: 'high',
      action: 'Mark Taken'
    },
    {
      type: 'checkup',
      title: 'Schedule Checkup',
      description: 'Your last checkup was 6 months ago.',
      priority: 'medium',
      action: 'Book Now'
    }
  ]);

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      case 'scheduled': return 'text-purple-600 bg-purple-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'alert': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-lg text-gray-600">
              Your health dashboard - track your wellness journey
            </p>
          </div>

          {/* Health Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{healthMetrics.riskScore}%</p>
                  <p className="text-sm text-gray-600">Risk Score</p>
                  <p className="text-xs text-green-600">Low Risk</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <HeartIcon className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {healthMetrics.lastBpReading.systolic}/{healthMetrics.lastBpReading.diastolic}
                  </p>
                  <p className="text-sm text-gray-600">Blood Pressure</p>
                  <div className="flex items-center">
                    {healthMetrics.bpTrend === 'improving' ? (
                      <ArrowTrendingDownIcon className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <p className="text-xs text-green-600">Improving</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CalendarDaysIcon className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{healthMetrics.upcomingAppointments}</p>
                  <p className="text-sm text-gray-600">Appointments</p>
                  <p className="text-xs text-purple-600">This Week</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{healthMetrics.medicationAdherence}%</p>
                  <p className="text-sm text-gray-600">Medication</p>
                  <p className="text-xs text-orange-600">Adherence</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Health Recommendations */}
            <div className="lg:col-span-1">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Health Recommendations</h3>
                  <BellIcon className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div key={index} className={`p-3 border-l-4 rounded-r-lg bg-gray-50 ${getPriorityColor(rec.priority)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{rec.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>
                      <button className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium">
                        {rec.action}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <Link to="/profile" className="text-sm text-blue-600 hover:text-blue-800">View All</Link>
                </div>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(activity.status)}`}>
                        {activity.type === 'risk_assessment' && <ChartBarIcon className="h-4 w-4" />}
                        {activity.type === 'equipment_reading' && <HeartIcon className="h-4 w-4" />}
                        {activity.type === 'appointment' && <CalendarDaysIcon className="h-4 w-4" />}
                        {activity.type === 'community' && <UserGroupIcon className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-500">{activity.description}</p>
                        <div className="flex items-center mt-1">
                          <ClockIcon className="h-3 w-3 text-gray-400 mr-1" />
                          <p className="text-xs text-gray-400">{formatTimeAgo(activity.time)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <Link to="/risk-assessment" className="card text-center hover:shadow-lg transition-shadow cursor-pointer">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ChartBarIcon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Risk Assessment</h3>
                <p className="text-xs text-gray-600">Check health risk</p>
              </Link>

              <Link to="/equipment" className="card text-center hover:shadow-lg transition-shadow cursor-pointer">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <HeartIcon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Equipment Readings</h3>
                <p className="text-xs text-gray-600">Log vital signs</p>
              </Link>

              <Link to="/hospitals" className="card text-center hover:shadow-lg transition-shadow cursor-pointer">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Find Hospitals</h3>
                <p className="text-xs text-gray-600">Locate nearby care</p>
              </Link>

              <Link to="/consultations" className="card text-center hover:shadow-lg transition-shadow cursor-pointer">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Book Consultation</h3>
                <p className="text-xs text-gray-600">Schedule appointments</p>
              </Link>

              <Link to="/forum" className="card text-center hover:shadow-lg transition-shadow cursor-pointer">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Community</h3>
                <p className="text-xs text-gray-600">Connect & share</p>
              </Link>

              <Link to="/news" className="card text-center hover:shadow-lg transition-shadow cursor-pointer">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3v9m0 0h-3m3 0h3m-3 0l-2-2m2 2l2-2" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Health News</h3>
                <p className="text-xs text-gray-600">Latest updates</p>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;