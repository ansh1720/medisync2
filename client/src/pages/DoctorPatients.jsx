import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { consultationAPI } from '../utils/api';

function DoctorPatients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      
      // Load patients from API
      const response = await consultationAPI.getDoctorPatients();
      
      if (response.data.success) {
        const apiPatients = response.data.data.patients.map(patient => ({
          ...patient,
          lastVisit: new Date(patient.lastVisit),
          nextAppointment: patient.nextAppointment ? new Date(patient.nextAppointment) : null
        }));
        
        setPatients(apiPatients);
        setIsLoading(false);
        return;
      }
      
    } catch (error) {
      console.error('Error loading patients from API:', error);
      toast.error('Failed to load patients from database, showing sample data');
    }
    
    // Fallback to mock data if API fails
    const mockPatients = [
      {
        id: 1,
        name: 'Priya Sharma',
        age: 29,
        gender: 'Female',
        phone: '+91 98765 43210',
        email: 'priya.sharma@email.com',
        condition: 'Migraine',
        lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        nextAppointment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'stable',
        bloodGroup: 'O+',
        emergencyContact: '+91 98765 12345',
        consultationCount: 1
      },
      {
        id: 2,
        name: 'Rajesh Kumar',
        age: 52,
        gender: 'Male',
        phone: '+91 98234 56789',
        email: 'rajesh.kumar@email.com',
        condition: 'Diabetes Type 2',
        lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        nextAppointment: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'monitoring',
        bloodGroup: 'A+',
        emergencyContact: '+91 98876 54321',
        consultationCount: 3
      },
      {
        id: 3,
        name: 'Kavita Patel',
        age: 41,
        gender: 'Female',
        phone: '+91 97345 67890',
        email: 'kavita.patel@email.com',
        condition: 'Hypertension',
        lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        nextAppointment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'improving',
        bloodGroup: 'B-',
        emergencyContact: '+91 97765 43210',
        consultationCount: 2
      },
      {
        id: 4,
        name: 'Amit Verma',
        age: 67,
        gender: 'Male',
        phone: '+91 96456 78901',
        email: 'amit.verma@email.com',
        condition: 'Arthritis',
        lastVisit: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        nextAppointment: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        status: 'stable',
        bloodGroup: 'AB+',
        emergencyContact: '+91 96654 32109',
        consultationCount: 5
      },
      {
        id: 5,
        name: 'Sneha Reddy',
        age: 34,
        gender: 'Female',
        phone: '+91 95567 89012',
        email: 'sneha.reddy@email.com',
        condition: 'Anxiety',
        lastVisit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        nextAppointment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'improving',
        bloodGroup: 'O-',
        emergencyContact: '+91 95543 21098',
        consultationCount: 1
      }
    ];

    setPatients(mockPatients);
    setIsLoading(false);
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || patient.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const handleViewMedicalRecords = (patient) => {
    navigate('/health-records', { 
      state: { 
        patientId: patient.id, 
        patientName: patient.name,
        doctorView: true 
      } 
    });
  };

  const handleScheduleAppointment = (patient) => {
    toast.success(`Scheduling appointment with ${patient.name}...`);
    // In a real app, this would open appointment scheduling modal
  };

  const handleContact = (patient, method) => {
    if (method === 'phone') {
      toast.success(`Calling ${patient.name} at ${patient.phone}...`);
    } else if (method === 'message') {
      toast.success(`Sending message to ${patient.name}...`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'stable':
        return 'bg-green-100 text-green-800';
      case 'monitoring':
        return 'bg-yellow-100 text-yellow-800';
      case 'improving':
        return 'bg-blue-100 text-blue-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'N/A';
    return dateObj.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
          <div className="flex items-center space-x-3 mb-4">
            <UserGroupIcon className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">My Patients</h1>
          </div>
          <p className="text-gray-600">Manage and view your patient records</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="stable">Stable</option>
                <option value="monitoring">Monitoring</option>
                <option value="improving">Improving</option>
                <option value="critical">Critical</option>
              </select>
              
              <span className="text-sm text-gray-500">
                {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Patients Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <div key={patient.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              {/* Patient Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {patient.name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{patient.age}y • {patient.gender}</span>
                    <span className="text-blue-600">{patient.bloodGroup}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(patient.status)}`}>
                  {patient.status}
                </span>
              </div>

              {/* Patient Info */}
              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-700">Primary Condition</p>
                  <p className="text-gray-900">{patient.condition}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Last Visit</p>
                    <p className="text-gray-600">{formatDate(patient.lastVisit)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Next Appointment</p>
                    <p className="text-gray-600">{formatDate(patient.nextAppointment)}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Contact</p>
                  <p className="text-sm text-gray-600">{patient.phone}</p>
                  <p className="text-sm text-gray-600">{patient.email}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleViewMedicalRecords(patient)}
                  className="flex items-center space-x-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                >
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>Records</span>
                </button>
                
                <button
                  onClick={() => handleScheduleAppointment(patient)}
                  className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <CalendarDaysIcon className="h-4 w-4" />
                  <span>Schedule</span>
                </button>
                
                <button
                  onClick={() => handleContact(patient, 'phone')}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <PhoneIcon className="h-4 w-4" />
                  <span>Call</span>
                </button>
                
                <button
                  onClick={() => handleContact(patient, 'message')}
                  className="flex items-center space-x-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  <span>Message</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Your patients will appear here once you start seeing them'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorPatients;