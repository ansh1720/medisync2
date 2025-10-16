import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInteraction } from '../context/InteractionContext';
import { Link } from 'react-router-dom';
import { consultationAPI } from '../utils/api';
import { 
  DocumentTextIcon,
  CalendarDaysIcon,
  HeartIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  FolderIcon,
  ClockIcon,
  UserIcon,
  ChartBarIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';

function HealthRecords() {
  const { user } = useAuth();
  const { trackFeatureUsage } = useInteraction();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Track page visit
  useEffect(() => {
    trackFeatureUsage('healthRecords', { source: 'direct' });
  }, []);
  
  // Mock data for medical records
  const [records, setRecords] = useState([
    {
      id: 1,
      type: 'consultation',
      title: 'Cardiology Consultation',
      doctor: 'Dr. Rajesh Kumar',
      date: new Date('2024-10-10'),
      summary: 'Regular checkup, blood pressure monitoring, heart rate normal',
      files: ['ecg_report.pdf', 'blood_test.pdf'],
      status: 'completed'
    },
    {
      id: 2,
      type: 'lab_report',
      title: 'Blood Test Results',
      doctor: 'Dr. Priya Sharma',
      date: new Date('2024-10-08'),
      summary: 'Complete blood count, cholesterol levels, glucose test',
      files: ['blood_work_results.pdf'],
      status: 'completed'
    },
    {
      id: 3,
      type: 'prescription',
      title: 'Medication Prescription',
      doctor: 'Dr. Rajesh Kumar',
      date: new Date('2024-10-05'),
      summary: 'Prescribed: Lisinopril 10mg, Metformin 500mg',
      files: ['prescription_oct_2024.pdf'],
      status: 'active'
    },
    {
      id: 4,
      type: 'imaging',
      title: 'Chest X-Ray',
      doctor: 'Dr. Robert Wilson',
      date: new Date('2024-09-28'),
      summary: 'Routine chest X-ray - No abnormalities detected',
      files: ['chest_xray_sep_2024.jpg', 'radiology_report.pdf'],
      status: 'completed'
    },
    {
      id: 5,
      type: 'vaccination',
      title: 'Annual Flu Vaccination',
      doctor: 'Dr. Emily Davis',
      date: new Date('2024-09-15'),
      summary: 'Seasonal influenza vaccine administered',
      files: ['vaccination_record.pdf'],
      status: 'completed'
    }
  ]);

  const [personalInfo, setPersonalInfo] = useState({
    bloodType: 'O+',
    allergies: ['Penicillin', 'Shellfish'],
    chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
    emergencyContact: {
      name: 'Jane Smith',
      relation: 'Spouse',
      phone: '+1 (555) 123-4567'
    }
  });

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const getRecordIcon = (type) => {
    switch (type) {
      case 'consultation': return UserIcon;
      case 'lab_report': return ChartBarIcon;
      case 'prescription': return DocumentTextIcon;
      case 'imaging': return EyeIcon;
      case 'vaccination': return HeartIcon;
      default: return DocumentTextIcon;
    }
  };

  const getRecordColor = (type) => {
    switch (type) {
      case 'consultation': return 'blue';
      case 'lab_report': return 'green';
      case 'prescription': return 'purple';
      case 'imaging': return 'orange';
      case 'vaccination': return 'red';
      default: return 'gray';
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || record.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const tabs = [
    { id: 'all', label: 'All Records', count: records.length },
    { id: 'consultation', label: 'Consultations', count: records.filter(r => r.type === 'consultation').length },
    { id: 'lab_report', label: 'Lab Reports', count: records.filter(r => r.type === 'lab_report').length },
    { id: 'prescription', label: 'Prescriptions', count: records.filter(r => r.type === 'prescription').length },
    { id: 'imaging', label: 'Imaging', count: records.filter(r => r.type === 'imaging').length },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
              <h1 className="text-3xl font-bold text-gray-900">Health Records</h1>
              <p className="text-gray-600 mt-2">View and manage your medical history</p>
            </div>
            <div className="flex space-x-3">
              <button className="btn btn-outline">
                <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                Upload Record
              </button>
              <Link to="/consultations" className="btn btn-primary">
                <PlusIcon className="h-4 w-4 mr-2" />
                Book Consultation
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Personal Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Blood Type</label>
                  <p className="text-gray-900">{personalInfo.bloodType}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Known Allergies</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {personalInfo.allergies.map((allergy, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Chronic Conditions</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {personalInfo.chronicConditions.map((condition, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
                  <div className="mt-1">
                    <p className="text-sm text-gray-900">{personalInfo.emergencyContact.name}</p>
                    <p className="text-xs text-gray-500">{personalInfo.emergencyContact.relation}</p>
                    <p className="text-sm text-blue-600">{personalInfo.emergencyContact.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Records</span>
                  <span className="font-semibold">{records.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Consultation</span>
                  <span className="font-semibold">Oct 10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Prescriptions</span>
                  <span className="font-semibold">2</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="pl-10 pr-8 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="consultation">Consultations</option>
                    <option value="lab_report">Lab Reports</option>
                    <option value="prescription">Prescriptions</option>
                    <option value="imaging">Imaging</option>
                    <option value="vaccination">Vaccinations</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                      <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Records List */}
              <div className="p-6">
                {filteredRecords.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
                    <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRecords.map((record) => {
                      const IconComponent = getRecordIcon(record.type);
                      const color = getRecordColor(record.type);
                      
                      return (
                        <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className={`p-2 rounded-lg bg-${color}-100`}>
                                <IconComponent className={`h-5 w-5 text-${color}-600`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-lg font-medium text-gray-900">{record.title}</h4>
                                  <span className="text-sm text-gray-500">{formatDate(record.date)}</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">Dr. {record.doctor}</p>
                                <p className="text-sm text-gray-500 mb-3">{record.summary}</p>
                                
                                {record.files && record.files.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {record.files.map((file, index) => (
                                      <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                                        <DocumentTextIcon className="h-3 w-3 mr-1" />
                                        {file}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <button className="p-2 text-gray-400 hover:text-gray-600">
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button className="p-2 text-gray-400 hover:text-gray-600">
                                <ArrowDownTrayIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HealthRecords;