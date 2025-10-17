import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';

function Navbar() {
  const { user, logout, getRoleDashboard } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getNavigationItems = () => {
    const baseNavigation = [
      { name: 'Dashboard', href: getRoleDashboard(user?.role || 'user') },
    ];

    // Role-specific navigation
    if (user?.role === 'admin') {
      return [
        ...baseNavigation,
        { name: 'User Management', href: '/admin/users' },
        { name: 'System Monitor', href: '/admin/monitor' },
        { name: 'Reports', href: '/admin/reports' },
      ];
    } else if (user?.role === 'doctor') {
      return [
        ...baseNavigation,
        { name: 'My Patients', href: '/patients' },
        { name: 'Appointments', href: '/consultations' },
        { name: 'Medical Records', href: '/health-records' },
        { name: 'Disease Search', href: '/diseases' },
        { name: 'Community', href: '/forum' },
      ];
    } else {
      return [
        ...baseNavigation,
        { name: 'Risk Assessment', href: '/risk-assessment' },
        { name: 'Equipment Readings', href: '/equipment' },
        { name: 'Disease Search', href: '/diseases' },
        { name: 'Find Hospitals', href: '/hospitals' },
        { name: 'Consultations', href: '/consultations' },
        { name: 'Community', href: '/forum' },
        { name: 'Health News', href: '/news' },
      ];
    }
  };

  const navigation = getNavigationItems();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo and Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    MediSync
                  </span>
                  <span className="text-xs text-gray-500 sm:block">
                    Healthcare Platform
                  </span>
                </div>
              </Link>
            </div>
            <div className="hidden lg:ml-12 lg:flex lg:space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    inline-flex items-center px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg
                    ${isActive(item.href)
                      ? 'bg-blue-100 shadow-sm ring-2 ring-blue-500/20'
                      : 'text-gray-600 
                    }
                  `}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-3 rounded-lg text-gray-400 sition-colors duration-200"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* User menu */}
          <div className="hidden lg:flex items-center space-x-4">
            <NotificationCenter />
            
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-500 sition-colors duration-200"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 
                  {user?.name}
                </div>
                {user?.role && user.role !== 'user' && (
                  <div className="text-xs text-gray-500 
                    {user.role}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Link
                  to="/profile"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 sm font-medium text-gray-700 sition-colors duration-200"
                >
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white 
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  block px-3 py-3 rounded-lg text-base font-medium transition-colors duration-200
                  ${isActive(item.href)
                    ? 'bg-blue-100 
                    : 'text-gray-600 
                  }
                `}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          {/* Mobile user section */}
          <div className="pt-4 pb-3 border-t border-gray-200 
            <div className="flex items-center px-4 mb-3">
              <div className="flex-1">
                <div className="text-base font-medium text-gray-800 
                  {user?.name}
                </div>
                {user?.role && user.role !== 'user' && (
                  <div className="text-sm text-gray-500 
                    {user.role}
                  </div>
                )}
              </div>
              
              {/* Mobile dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-gray-500 sition-colors duration-200"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            
            <div className="px-4 space-y-2">
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-left px-3 py-2 rounded-lg text-base font-medium text-gray-700 sition-colors duration-200"
              >
                Profile
              </Link>
              <button
                onClick={logout}
                className="block w-full text-left px-3 py-2 rounded-lg text-base font-medium text-white bg-red-600 hover:bg-red-700 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
