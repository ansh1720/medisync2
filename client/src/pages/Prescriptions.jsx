import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInteraction } from '../context/InteractionContext';
import { Link } from 'react-router-dom';
import { consultationAPI } from '../utils/api';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShoppingBagIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarDaysIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';

function Prescriptions() {
  const { user } = useAuth();
  const { trackFeatureUsage } = useInteraction();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Track page visit
  useEffect(() => {
    trackFeatureUsage('prescriptions', { source: 'direct' });
  }, []);
  
  // Mock data for prescriptions
  const [prescriptions, setPrescriptions] = useState([
    {
      id: 1,
      prescriptionNumber: 'RX001234',
      doctor: 'Dr. Rajesh Kumar',
      specialty: 'Cardiology',
      date: new Date('2024-10-10'),
      status: 'active',
      medications: [
        {
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily',
          duration: '30 days',
          instructions: 'Take with or without food',
          remaining: 25,
          total: 30
        },
        {
          name: 'Aspirin',
          dosage: '81mg',
          frequency: 'Once daily',
          duration: '30 days',
          instructions: 'Take with food',
          remaining: 20,
          total: 30
        }
      ],
      pharmacy: {
        name: 'Apollo Pharmacy',
        address: '123 MG Road, Delhi, India 110001',
        phone: '+91 11 2345 6789'
      },
      refillsRemaining: 2,
      nextRefillDate: new Date('2024-11-05')
    },
    {
      id: 2,
      prescriptionNumber: 'RX001235',
      doctor: 'Dr. Priya Sharma',
      specialty: 'Endocrinology',
      date: new Date('2024-10-05'),
      status: 'active',
      medications: [
        {
          name: 'Metformin',
          dosage: '500mg',
          frequency: 'Twice daily',
          duration: '90 days',
          instructions: 'Take with meals',
          remaining: 85,
          total: 90
        }
      ],
      pharmacy: {
        name: 'HealthPlus Pharmacy',
        address: '456 Oak Ave, City, State 12345',
        phone: '+1 (555) 987-6543'
      },
      refillsRemaining: 3,
      nextRefillDate: new Date('2024-12-25')
    },
    {
      id: 3,
      prescriptionNumber: 'RX001210',
      doctor: 'Dr. Emily Davis',
      specialty: 'Family Medicine',
      date: new Date('2024-09-15'),
      status: 'completed',
      medications: [
        {
          name: 'Amoxicillin',
          dosage: '250mg',
          frequency: 'Three times daily',
          duration: '10 days',
          instructions: 'Take with food, complete full course',
          remaining: 0,
          total: 30
        }
      ],
      pharmacy: {
        name: 'MediCare Pharmacy',
        address: '123 Main St, City, State 12345',
        phone: '+1 (555) 123-4567'
      },
      refillsRemaining: 0,
      completedDate: new Date('2024-09-25')
    }
  ]);

  const [reminders, setReminders] = useState([
    {
      id: 1,
      medication: 'Lisinopril 10mg',
      time: '08:00 AM',
      taken: true
    },
    {
      id: 2,
      medication: 'Metformin 500mg',
      time: '12:00 PM',
      taken: false
    },
    {
      id: 3,
      medication: 'Metformin 500mg',
      time: '06:00 PM',
      taken: false
    }
  ]);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return CheckCircleIcon;
      case 'pending': return ClockIcon;
      case 'expired': return ExclamationTriangleIcon;
      case 'completed': return CheckCircleIcon;
      default: return ClockIcon;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'pending': return 'yellow';
      case 'expired': return 'red';
      case 'completed': return 'gray';
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

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = prescription.medications.some(med => 
      med.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || prescription.doctor.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' || prescription.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const tabs = [
    { id: 'active', label: 'Active', count: prescriptions.filter(p => p.status === 'active').length },
    { id: 'completed', label: 'Completed', count: prescriptions.filter(p => p.status === 'completed').length },
    { id: 'all', label: 'All', count: prescriptions.length }
  ];

  const markReminderTaken = (reminderId) => {
    setReminders(reminders.map(reminder => 
      reminder.id === reminderId ? { ...reminder, taken: true } : reminder
    ));
  };

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
              <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
              <p className="text-gray-600 mt-2">Manage your medications and refills</p>
            </div>
            <div className="flex space-x-3">
              <button className="btn btn-outline">
                <ShoppingBagIcon className="h-4 w-4 mr-2" />
                Order Refills
              </button>
              <Link to="/consultations" className="btn btn-primary">
                <PlusIcon className="h-4 w-4 mr-2" />
                New Consultation
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Today's Reminders */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BellIcon className="h-5 w-5 mr-2" />
                Today's Medications
              </h3>
              
              <div className="space-y-3">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className={`p-3 rounded-lg border ${
                    reminder.taken ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{reminder.medication}</p>
                        <p className="text-xs text-gray-500">{reminder.time}</p>
                      </div>
                      {!reminder.taken ? (
                        <button
                          onClick={() => markReminderTaken(reminder.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Mark Taken
                        </button>
                      ) : (
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Prescriptions</span>
                  <span className="font-semibold text-green-600">
                    {prescriptions.filter(p => p.status === 'active').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Medications Due</span>
                  <span className="font-semibold text-yellow-600">
                    {reminders.filter(r => !r.taken).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Refills Available</span>
                  <span className="font-semibold">
                    {prescriptions.reduce((sum, p) => sum + p.refillsRemaining, 0)}
                  </span>
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
                    placeholder="Search medications or doctors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
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

              {/* Prescriptions List */}
              <div className="p-6">
                {filteredPrescriptions.length === 0 ? (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions found</h3>
                    <p className="text-gray-500">Try adjusting your search criteria.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredPrescriptions.map((prescription) => {
                      const StatusIcon = getStatusIcon(prescription.status);
                      const statusColor = getStatusColor(prescription.status);
                      
                      return (
                        <div key={prescription.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center space-x-3">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {prescription.prescriptionNumber}
                                </h3>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                                </span>
                              </div>
                              <p className="text-gray-600 mt-1">
                                Prescribed by {prescription.doctor} • {prescription.specialty}
                              </p>
                              <p className="text-sm text-gray-500">
                                Issued on {formatDate(prescription.date)}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button className="p-2 text-gray-400 hover:text-gray-600">
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button className="p-2 text-gray-400 hover:text-gray-600">
                                <ArrowDownTrayIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Medications */}
                          <div className="space-y-3 mb-4">
                            {prescription.medications.map((medication, index) => (
                              <div key={index} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">
                                      {medication.name} {medication.dosage}
                                    </h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {medication.frequency} • {medication.duration}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {medication.instructions}
                                    </p>
                                  </div>
                                  {prescription.status === 'active' && (
                                    <div className="text-right">
                                      <p className="text-sm font-medium text-gray-900">
                                        {medication.remaining}/{medication.total} pills left
                                      </p>
                                      <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                                        <div 
                                          className="bg-blue-600 h-2 rounded-full" 
                                          style={{ width: `${(medication.remaining / medication.total) * 100}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Pharmacy Info & Actions */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{prescription.pharmacy.name}</p>
                                <p className="text-xs text-gray-500">{prescription.pharmacy.address}</p>
                              </div>
                              <button className="text-blue-600 hover:text-blue-800">
                                <PhoneIcon className="h-4 w-4" />
                              </button>
                            </div>
                            
                            {prescription.status === 'active' && (
                              <div className="flex space-x-3">
                                <div className="text-right text-sm">
                                  <p className="text-gray-600">Refills: {prescription.refillsRemaining}</p>
                                  <p className="text-gray-500">Next: {formatDate(prescription.nextRefillDate)}</p>
                                </div>
                                <button className="btn btn-primary btn-sm">
                                  <ShoppingBagIcon className="h-4 w-4 mr-1" />
                                  Refill
                                </button>
                              </div>
                            )}
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

export default Prescriptions;