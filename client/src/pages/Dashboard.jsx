import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
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
  SparklesIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
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
        
        console.log(`Submit: Navigating to disease: ${diseaseId} from search: ${searchQuery.trim()}`);
        
        // Navigate to disease details page
        navigate(`/disease/${diseaseId}`, { 
          state: { 
            searchQuery: searchQuery.trim()
          }
        });
      } else {
        // Default to risk assessment with search as symptom
        navigate('/risk-assessment', { 
          state: { 
            prefilledSymptom: searchQuery.trim(),
            searchQuery: searchQuery.trim()
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
    
    if (suggestion.type === 'symptom') {
      console.log('Navigating to risk assessment for symptom:', suggestion.text);
      // Navigate to risk assessment with selected symptom
      navigate('/risk-assessment', { 
        state: { 
          prefilledSymptom: suggestion.text,
          searchQuery: suggestion.text
        }
      });
    } else if (suggestion.type === 'disease') {
      // Create URL-friendly disease ID
      let diseaseId = suggestion.text.toLowerCase();
      console.log('Original disease text:', suggestion.text);
      console.log('Lowercase disease text:', diseaseId);
      // Handle special cases for proper URL mapping
      if (diseaseId === 'common cold') {
        diseaseId = 'common-cold';
        console.log('Applied special case mapping to:', diseaseId);
      }
      diseaseId = diseaseId.replace(/\s+/g, '-');
      console.log('Final diseaseId after space replacement:', diseaseId);
      
      console.log(`Navigating to disease: ${diseaseId} from search: ${suggestion.text}`);
      
      // Navigate to disease details page for disease information
      navigate(`/disease/${diseaseId}`, { 
        state: { 
          searchQuery: suggestion.text
        }
      });
    }
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
    <div className="min-h-screen bg-gray-50">
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
            
            {/* DEBUG: Test Navigation Links */}
            <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded max-w-2xl mx-auto">
              <h3 className="text-sm font-bold text-yellow-800 mb-2">DEBUG: Test Disease Navigation</h3>
              <div className="space-x-2">
                <Link to="/disease/diabetes" className="text-blue-600 underline">Test Diabetes</Link>
                <Link to="/disease/asthma" className="text-blue-600 underline">Test Asthma</Link>
                <Link to="/disease/migraine" className="text-blue-600 underline">Test Migraine</Link>
                <Link to="/disease/common-cold" className="text-blue-600 underline">Test Common Cold</Link>
              </div>
            </div>
            
            {/* Smart Health Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-12 pr-12 py-4 border border-gray-300 rounded-2xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg shadow-lg"
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
              <div className="mt-4 flex flex-wrap justify-center gap-2">
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