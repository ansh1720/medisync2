import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  HeartIcon,
  BeakerIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  NewspaperIcon,
  UserGroupIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';

function Dashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const features = [
    {
      title: 'Disease Search',
      description: 'Search diseases by symptoms',
      icon: BeakerIcon,
      color: 'blue',
      path: '/diseases'
    },
    {
      title: 'Risk Assessment',
      description: 'Check your health risk',
      icon: HeartIcon,
      color: 'red',
      path: '/risk-assessment'
    },
    {
      title: 'Doctor Consultation',
      description: 'Book appointments',
      icon: ChatBubbleLeftRightIcon,
      color: 'green',
      path: '/consultations'
    },
    {
      title: 'Find Hospitals',
      description: 'Locate nearby hospitals',
      icon: MapPinIcon,
      color: 'purple',
      path: '/hospitals'
    },
    {
      title: 'Health News',
      description: 'Latest health updates',
      icon: NewspaperIcon,
      color: 'indigo',
      path: '/news'
    },
    {
      title: 'Community Forum',
      description: 'Connect with others',
      icon: UserGroupIcon,
      color: 'pink',
      path: '/forum'
    }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/diseases', { state: { searchQuery: searchQuery.trim() } });
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'text-blue-600',
      red: 'text-red-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      indigo: 'text-indigo-600',
      pink: 'text-pink-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to MediSync
          </h1>
          <p className="text-xl text-gray-600">
            Your comprehensive healthcare platform
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-16">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for diseases, symptoms, doctors..."
                className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Search
            </button>
          </form>
        </div>

        {/* Feature Tiles */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Explore Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <button
                  key={index}
                  onClick={() => navigate(feature.path)}
                  className="p-6 rounded-xl border-2 border-gray-200 bg-white hover:shadow-lg transition-all duration-200 text-left"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <Icon className={`h-8 w-8 ${getColorClasses(feature.color)}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1 text-gray-900">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
