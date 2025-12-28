import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { consultationAPI } from '../utils/api';
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
  BellIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  PhoneIcon,
  PlusIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import { useInteraction } from '../context/InteractionContext';
import {
  QuickSearchWidget,
  PersonalizedActionsWidget,
  RecentHealthActivityWidget,
  HealthInsightsWidget,
  FeatureDiscoveryWidget
} from '../components/DynamicWidgets';
import toast from 'react-hot-toast';

function Dashboard() {
  const { user } = useAuth();
  const { 
    trackFeatureUsage, 
    trackSearch, 
    getDynamicDashboardLayout,
    userInteractions,
    clearRecentSearches
  } = useInteraction();
  const navigate = useNavigate();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const [healthMetrics, setHealthMetrics] = useState({
    riskScore: 0,
    lastAssessment: null,
    bpTrend: null,
    lastBpReading: null,
    weeklyActivity: 0,
    upcomingAppointments: 0,
    medicationAdherence: 0,
    healthGoals: {
      completed: 0,
      total: 0
    }
  });

  // Patient consultation data
  const [consultationData, setConsultationData] = useState({
    upcomingConsultations: [],
    recentConsultations: [],
    totalConsultations: 0,
    pendingPrescriptions: 0,
    favouriteDoctors: []
  });

  const [quickActions, setQuickActions] = useState([
    { 
      title: 'Book Consultation', 
      description: 'Find and book a doctor',
      icon: CalendarDaysIcon,
      color: 'blue',
      action: () => navigate('/consultations')
    },
    { 
      title: 'Instant Consult', 
      description: 'Connect with available doctor',
      icon: ChatBubbleLeftRightIcon,
      color: 'green',
      action: () => handleInstantConsult()
    },
    { 
      title: 'Health Records', 
      description: 'View medical history',
      icon: DocumentTextIcon,
      color: 'purple',
      action: () => navigate('/health-records')
    },
    { 
      title: 'Prescriptions', 
      description: 'View and order medicines',
      icon: PlusIcon,
      color: 'orange',
      action: () => navigate('/prescriptions')
    }
  ]);

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

  // Health recommendations (empty by default for new users)
  const [recommendations] = useState([]);

  // Mock search suggestions data
  const mockSearchSuggestions = [
    { id: 1, type: 'symptom', text: 'fever', description: 'High body temperature' },
    { id: 2, type: 'symptom', text: 'headache', description: 'Pain in head or neck' },
    { id: 3, type: 'symptom', text: 'chest pain', description: 'Pain in chest area' },
    { id: 4, type: 'symptom', text: 'shortness of breath', description: 'Difficulty breathing' },
    { id: 5, type: 'disease', text: 'diabetes', description: 'Blood sugar management' },
    { id: 6, type: 'disease', text: 'hypertension', description: 'High blood pressure' },
    { id: 7, type: 'disease', text: 'asthma', description: 'Breathing disorder' },
    { id: 8, type: 'disease', text: 'common cold', description: 'Viral infection' },
    { id: 9, type: 'symptom', text: 'cough', description: 'Throat irritation' },
    { id: 10, type: 'symptom', text: 'fatigue', description: 'Extreme tiredness' },
    { id: 11, type: 'disease', text: 'migraine', description: 'Severe headache' },
    { id: 12, type: 'symptom', text: 'nausea', description: 'Feeling sick' }
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load consultation data from API
      const consultationsResponse = await consultationAPI.getConsultations().catch(err => {
        console.log('Consultations API not available, using mock data');
        return null;
      });

      if (consultationsResponse?.data?.data) {
        const consultations = consultationsResponse.data.data;
        setConsultationData({
          upcomingConsultations: consultations.upcoming || [],
          recentConsultations: consultations.recent || [],
          totalConsultations: consultations.total || 0,
          pendingPrescriptions: consultations.pendingPrescriptions || 0,
          favouriteDoctors: consultations.favouriteDoctors || []
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  // Track feature navigation
  const handleFeatureNavigation = (feature, path, additionalData = {}) => {
    trackFeatureUsage(feature, additionalData);
    navigate(path);
  };

  const handleInstantConsult = () => {
    trackFeatureUsage('consultations', { type: 'instant' });
    toast.info('Connecting you with an available doctor...');
    navigate('/consultations', { state: { instant: true } });
  };

  const getConsultationTypeIcon = (type) => {
    switch (type) {
      case 'video': return VideoCameraIcon;
      case 'chat': return ChatBubbleLeftRightIcon;
      case 'phone': return PhoneIcon;
      default: return ChatBubbleLeftRightIcon;
    }
  };

  // Search functionality
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length >= 1) {
      setIsSearching(true);
      // Simulate API call delay
      setTimeout(() => {
        const filtered = mockSearchSuggestions
          .filter(item => 
            item.text.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 6);
        setSearchSuggestions(filtered);
        setShowSuggestions(true);
        setIsSearching(false);
      }, 300);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Track the search
      trackSearch(searchQuery.trim(), 'dashboard');
      
      // Check if the search query matches a disease in our suggestions
      const matchingDisease = mockSearchSuggestions.find(item => 
        item.type === 'disease' && 
        item.text.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );
      
      if (matchingDisease) {
        // Create URL-friendly disease ID
        let diseaseId = matchingDisease.text.toLowerCase();
        // Handle special cases for proper URL mapping
        if (diseaseId === 'common cold') {
          diseaseId = 'common-cold';
        }
        diseaseId = diseaseId.replace(/\s+/g, '-');
        
        // Navigate to disease details page
        navigate(`/disease/${diseaseId}`, { 
          state: { 
            searchQuery: searchQuery.trim()
          }
        });
      } else {
        // Navigate to enhanced disease search instead of risk assessment
        navigate('/diseases', { 
          state: { 
            initialSearch: searchQuery.trim()
          }
        });
      }
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    console.log('=== SUGGESTION CLICK DEBUG ===');
    console.log('Selected suggestion:', suggestion);
    setSearchQuery(suggestion.text);
    setShowSuggestions(false);
    
    // Track the search when clicking suggestions
    trackSearch(suggestion.text, 'dashboard-suggestion');
    
    if (suggestion.type === 'symptom') {
      console.log('Navigating to disease search for symptom:', suggestion.text);
      // Navigate to disease search with selected symptom
      navigate('/diseases', { 
        state: { 
          initialSearch: suggestion.text
        }
      });
    } else if (suggestion.type === 'disease') {
      // Create URL-friendly disease ID
      let diseaseId = suggestion.text.toLowerCase();
      // Handle special cases for proper URL mapping
      if (diseaseId === 'common cold') {
        diseaseId = 'common-cold';
      }
      diseaseId = diseaseId.replace(/\s+/g, '-');
      
      // Navigate to disease details page for disease information
      navigate(`/disease/${diseaseId}`, { 
        state: { 
          searchQuery: suggestion.text
        }
      });
    }
    // Reset search query after navigation
    setSearchQuery('');
  };

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
    <div className="min-h-screen bg-gray-50 transition-colors duration-200">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Your health dashboard - track your wellness journey
            </p>
            
            {/* Smart Health Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-12 pr-12 py-4 border border-gray-300 rounded-2xl leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg shadow-lg transition-colors duration-200"
                    placeholder="Search symptoms, diseases, or health concerns..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => searchQuery && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    {isSearching ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                    ) : (
                      <SparklesIcon className="h-5 w-5 text-primary-500" />
                    )}
                  </div>
                </div>
              </form>
              
              {/* Search Suggestions */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  <div className="py-2">
                    {searchSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                            suggestion.type === 'symptom' 
                              ? 'bg-red-100 text-red-600' 
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {suggestion.type === 'symptom' ? (
                              <ExclamationTriangleIcon className="h-4 w-4" />
                            ) : (
                              <HeartIcon className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900 capitalize">
                                {suggestion.text}
                              </span>
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                suggestion.type === 'symptom' 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {suggestion.type}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{suggestion.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs text-gray-600 text-center">
                      💡 Select a suggestion or press Enter to get personalized health insights
                    </p>
                  </div>
                </div>
              )}
              
              {/* Quick Search Tags */}
              <div className="mt-4">
                {userInteractions.recentSearches.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="text-sm text-gray-500 mr-2">Recent searches:</span>
                    {userInteractions.recentSearches.slice(0, 5).map((search, index) => (
                      <button
                        key={`${search.query}-${index}`}
                        onClick={() => {
                          setSearchQuery(search.query);
                          handleSuggestionClick({ text: search.query, type: search.type || 'general' });
                        }}
                        className="group px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full transition-all duration-200 border border-blue-200 hover:border-blue-300 hover:shadow-sm"
                        title={`Searched ${formatTimeAgo(new Date(search.timestamp))}`}
                      >
                        <span className="flex items-center gap-1">
                          {search.query}
                          <span className="text-blue-500 opacity-60 group-hover:opacity-100 text-xs">
                            ↗
                          </span>
                        </span>
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        // Clear recent searches
                        clearRecentSearches();
                      }}
                      className="px-2 py-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                      title="Clear recent searches"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="text-sm text-gray-500 mr-2">Popular searches:</span>
                    {[
                      { text: 'fever', type: 'symptom' },
                      { text: 'headache', type: 'symptom' },
                      { text: 'chest pain', type: 'symptom' },
                      { text: 'diabetes', type: 'disease' },
                      { text: 'hypertension', type: 'disease' }
                    ].map((tag) => (
                      <button
                        key={tag.text}
                        onClick={() => {
                          setSearchQuery(tag.text);
                          handleSuggestionClick(tag);
                        }}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                      >
                        {tag.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions for Consultation */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Personalized Dashboard</h2>
            
            {/* Dynamic Widgets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Left Column - Primary Widgets */}
              <div className="lg:col-span-2 space-y-6">
                <QuickSearchWidget />
                <PersonalizedActionsWidget />
                <RecentHealthActivityWidget />
              </div>
              
              {/* Right Column - Secondary Widgets */}
              <div className="space-y-6">
                <HealthInsightsWidget />
                <FeatureDiscoveryWidget />
                
                {/* Traditional Health Metrics Card */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Risk Score</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        healthMetrics.riskScore < 20 ? 'bg-green-100 text-green-700' :
                        healthMetrics.riskScore < 40 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {healthMetrics.riskScore}% - {healthMetrics.riskScore < 20 ? 'Low' : healthMetrics.riskScore < 40 ? 'Medium' : 'High'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Blood Pressure</span>
                      <span className="text-sm font-medium">
                        {healthMetrics.lastBpReading ? `${healthMetrics.lastBpReading.systolic}/${healthMetrics.lastBpReading.diastolic}` : 'No data'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Appointments</span>
                      <span className="text-sm font-medium">{healthMetrics.upcomingAppointments} upcoming</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions for Consultation */}
          <div className="mb-8" style={{ display: 'none' }}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <button
                    key={index}
                    onClick={action.action}
                    className={`p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border-l-4 group ${
                      action.color === 'blue' ? 'border-l-blue-500' :
                      action.color === 'green' ? 'border-l-green-500' :
                      action.color === 'purple' ? 'border-l-purple-500' :
                      'border-l-orange-500'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`p-3 rounded-lg transition-colors ${
                        action.color === 'blue' ? 'bg-blue-100 group-hover:bg-blue-200' :
                        action.color === 'green' ? 'bg-green-100 group-hover:bg-green-200' :
                        action.color === 'purple' ? 'bg-purple-100 group-hover:bg-purple-200' :
                        'bg-orange-100 group-hover:bg-orange-200'
                      }`}>
                        <IconComponent className={`h-6 w-6 ${
                          action.color === 'blue' ? 'text-blue-600' :
                          action.color === 'green' ? 'text-green-600' :
                          action.color === 'purple' ? 'text-purple-600' :
                          'text-orange-600'
                        }`} />
                      </div>
                      <div className="ml-4 text-left">
                        <h3 className="text-sm font-medium text-gray-900">{action.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Consultation Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Upcoming Consultations */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Consultations</h3>
                <Link to="/consultations" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View All
                </Link>
              </div>
              {consultationData.upcomingConsultations.length > 0 ? (
                <div className="space-y-4">
                  {consultationData.upcomingConsultations.slice(0, 2).map((consultation) => {
                    const IconComponent = getConsultationTypeIcon(consultation.type);
                    return (
                      <div key={consultation.id} className="flex items-center p-3 border border-gray-200 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <IconComponent className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{consultation.doctorName}</h4>
                          <p className="text-xs text-gray-500">{consultation.specialty}</p>
                          <p className="text-xs text-gray-600">{consultation.reason}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {consultation.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-xs text-gray-500">{consultation.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No upcoming consultations</p>
                  <button 
                    onClick={() => navigate('/consultations')}
                    className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Book a consultation
                  </button>
                </div>
              )}
            </div>

            {/* Recent Consultations */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Consultations</h3>
                <span className="text-sm text-gray-500">{consultationData.totalConsultations} total</span>
              </div>
              {consultationData.recentConsultations.length > 0 ? (
                <div className="space-y-4">
                  {consultationData.recentConsultations.slice(0, 2).map((consultation) => (
                    <div key={consultation.id} className="flex items-center p-3 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{consultation.doctorName}</h4>
                        <p className="text-xs text-gray-500">{consultation.specialty}</p>
                        <p className="text-xs text-gray-600">{consultation.diagnosis}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center">
                          {[...Array(consultation.rating)].map((_, i) => (
                            <StarIcon key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {consultation.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No consultation history</p>
                </div>
              )}
            </div>
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
                    {healthMetrics.lastBpReading ? `${healthMetrics.lastBpReading.systolic}/${healthMetrics.lastBpReading.diastolic}` : 'No data'}
                  </p>
                  <p className="text-sm text-gray-600">Blood Pressure</p>
                  {healthMetrics.bpTrend && (
                    <div className="flex items-center">
                      {healthMetrics.bpTrend === 'improving' ? (
                        <ArrowTrendingDownIcon className="h-4 w-4 text-green-600 mr-1" />
                      ) : (
                        <ArrowTrendingUpIcon className="h-4 w-4 text-red-600 mr-1" />
                      )}
                      <p className="text-xs text-green-600">{healthMetrics.bpTrend === 'improving' ? 'Improving' : 'Needs Attention'}</p>
                    </div>
                  )}
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