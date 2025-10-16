import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  UsersIcon, 
  UserGroupIcon, 
  ChartBarIcon, 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    activeConsultations: 0,
    pendingApprovals: 0,
    systemAlerts: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      // Mock data for admin dashboard
      setTimeout(() => {
        setStats({
          totalUsers: 1247,
          totalDoctors: 89,
          totalPatients: 1158,
          activeConsultations: 23,
          pendingApprovals: 7,
          systemAlerts: 3
        });

        setRecentActivities([
          {
            id: 1,
            type: 'user_registration',
            message: 'New patient Dr. Sarah Johnson registered',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            priority: 'info'
          },
          {
            id: 2,
            type: 'doctor_approval',
            message: 'Dr. Michael Chen requires verification',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            priority: 'warning'
          },
          {
            id: 3,
            type: 'system_alert',
            message: 'High server load detected',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
            priority: 'error'
          },
          {
            id: 4,
            type: 'consultation',
            message: '15 consultations completed today',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
            priority: 'success'
          }
        ]);

        setPendingApprovals([
          {
            id: 1,
            name: 'Dr. Michael Chen',
            email: 'michael.chen@hospital.com',
            specialization: 'Cardiology',
            license: 'MD123456',
            submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            id: 2,
            name: 'Dr. Emily Rodriguez',
            email: 'emily.rodriguez@clinic.com',
            specialization: 'Pediatrics',
            license: 'MD789012',
            submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ]);

        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin dashboard data');
      setIsLoading(false);
    }
  };

  const handleApproveDoctor = async (doctorId) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPendingApprovals(prev => prev.filter(doc => doc.id !== doctorId));
      setStats(prev => ({ ...prev, pendingApprovals: prev.pendingApprovals - 1 }));
      toast.success('Doctor approved successfully');
    } catch (error) {
      toast.error('Failed to approve doctor');
    }
  };

  const handleRejectDoctor = async (doctorId) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPendingApprovals(prev => prev.filter(doc => doc.id !== doctorId));
      setStats(prev => ({ ...prev, pendingApprovals: prev.pendingApprovals - 1 }));
      toast.success('Doctor application rejected');
    } catch (error) {
      toast.error('Failed to reject doctor application');
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'success': return 'text-green-600 bg-green-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-lg text-gray-600">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="btn btn-outline">
                <Cog6ToothIcon className="h-5 w-5 mr-2" />
                System Settings
              </button>
              <button className="btn btn-primary">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-green-600">+12% from last month</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <UsersIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Doctors */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Doctors</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalDoctors}</p>
                <p className="text-sm text-green-600">+3 this week</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserGroupIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Active Consultations */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Consultations</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeConsultations}</p>
                <p className="text-sm text-blue-600">Live sessions</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingApprovals}</p>
                <p className="text-sm text-orange-600">Require attention</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <ClockIcon className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* System Alerts */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Alerts</p>
                <p className="text-3xl font-bold text-gray-900">{stats.systemAlerts}</p>
                <p className="text-sm text-red-600">Need review</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className="text-3xl font-bold text-green-600">Healthy</p>
                <p className="text-sm text-gray-500">All systems operational</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Recent Activities</h3>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All
              </button>
            </div>
            
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${getPriorityColor(activity.priority)}`}>
                    <BellIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Doctor Approvals */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Pending Doctor Approvals</h3>
              <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {pendingApprovals.length} pending
              </span>
            </div>
            
            <div className="space-y-4">
              {pendingApprovals.map((doctor) => (
                <div key={doctor.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{doctor.name}</h4>
                      <p className="text-sm text-gray-600">{doctor.email}</p>
                      <p className="text-sm text-gray-500">
                        {doctor.specialization} • License: {doctor.license}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Submitted {formatTimeAgo(doctor.submittedAt)}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleApproveDoctor(doctor.id)}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectDoctor(doctor.id)}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {pendingApprovals.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending approvals</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;