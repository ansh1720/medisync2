import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';

function Navbar() {
  const { user, logout, getRoleDashboard } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getNavigationItems = () => {
    const baseNavigation = [
      { name: 'Dashboard', href: getRoleDashboard(user?.role || 'user') },
      { name: 'Diseases', href: '/diseases' },
      { name: 'Risk Assessment', href: '/risk-assessment' },
      { name: 'Consultation', href: '/consultations' },
      { name: 'Hospitals', href: '/hospitals' },
    ];

    // Add role-specific navigation items
    // Note: Admins don't need a separate "Admin Panel" link because Dashboard already goes to /admin-dashboard
    if (user?.role === 'doctor') {
      baseNavigation.push({ name: 'My Patients', href: '/doctor/patients' });
    }

    return baseNavigation;
  };

  return (
    <nav className="bg-nav shadow-lg border-b border-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-all duration-200 shadow-lg">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
              </div>
              <div className="ml-3">
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Medi
                  </span>
                  <span className="text-2xl font-bold text-nav">
                    Sync
                  </span>
                </div>
                <span className="text-xs text-muted-foreground -mt-1 hidden sm:block">
                  Healthcare Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            <div className="flex space-x-1">
              {getNavigationItems().map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location.pathname === item.href
                      ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20'
                      : 'text-muted-foreground hover:bg-nav-hover hover:text-nav'
                  }`}
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
              className="inline-flex items-center justify-center p-3 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors duration-200"
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
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-nav">
                  {user?.name}
                </div>
                {user?.role && user.role !== 'user' && (
                  <div className="text-xs text-muted-foreground capitalize">
                    {user.role}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Link
                  to="/profile"
                  className="inline-flex items-center px-3 py-2 border border-border rounded-lg text-sm font-medium text-muted-foreground bg-card hover:bg-accent transition-colors duration-200"
                >
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-white bg-error hover:bg-red-700 transition-colors duration-200"
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
        <div className="lg:hidden border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-nav">
            {getNavigationItems().map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200 ${
                  location.pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-nav-hover hover:text-nav'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          <div className="pt-4 pb-3 border-t border-border bg-muted">
            <div className="flex items-center justify-between px-5">
              <div className="flex-shrink-0">
                <div className="text-base font-medium text-foreground">
                  {user?.name}
                </div>
                {user?.role && user.role !== 'user' && (
                  <div className="text-sm text-muted-foreground capitalize">
                    {user.role}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <Link
                to="/profile"
                className="block w-full text-left px-3 py-2 rounded-lg text-base font-medium text-muted-foreground bg-card border border-border hover:bg-accent transition-colors duration-200"
              >
                Profile
              </Link>
              <button
                onClick={logout}
                className="block w-full text-left px-3 py-2 rounded-lg text-base font-medium text-white bg-error hover:bg-red-700 transition-colors duration-200"
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