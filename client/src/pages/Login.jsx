import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon, UserIcon, ShieldCheckIcon, BeakerIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user', // Add role selection
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated, getRoleDashboard } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      // Don't redirect here anymore, let handleSubmit handle role-based navigation
    }
  }, [isAuthenticated]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await login(formData);
      // Get user role from response and redirect to appropriate dashboard
      const userRole = response.data?.user?.role || response.user?.role || formData.role;
      const dashboardPath = getRoleDashboard(userRole);
      navigate(dashboardPath, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      // Error is already handled and displayed by the AuthContext login method
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Sign in to MediSync
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your health companion is waiting for you
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="input pr-10"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Role Selection */}
            <div>
              <label className="label">
                Sign in as
              </label>
              <div className="grid grid-cols-3 gap-3">
                {/* User Role */}
                <label className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                  formData.role === 'user' 
                    ? 'border-primary-600 bg-primary-50 text-primary-900' 
                    : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    className="sr-only"
                    checked={formData.role === 'user'}
                    onChange={handleChange}
                  />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <UserIcon className="h-6 w-6 mb-2" />
                      <span className="block text-sm font-medium">Patient</span>
                      <span className="mt-1 flex items-center text-xs text-gray-500">
                        Regular user access
                      </span>
                    </span>
                  </span>
                </label>

                {/* Doctor Role */}
                <label className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                  formData.role === 'doctor' 
                    ? 'border-blue-600 bg-blue-50 text-blue-900' 
                    : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="doctor"
                    className="sr-only"
                    checked={formData.role === 'doctor'}
                    onChange={handleChange}
                  />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <BeakerIcon className="h-6 w-6 mb-2" />
                      <span className="block text-sm font-medium">Doctor</span>
                      <span className="mt-1 flex items-center text-xs text-gray-500">
                        Medical professional
                      </span>
                    </span>
                  </span>
                </label>

                {/* Admin Role */}
                <label className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                  formData.role === 'admin' 
                    ? 'border-red-600 bg-red-50 text-red-900' 
                    : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    className="sr-only"
                    checked={formData.role === 'admin'}
                    onChange={handleChange}
                  />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <ShieldCheckIcon className="h-6 w-6 mb-2" />
                      <span className="block text-sm font-medium">Admin</span>
                      <span className="mt-1 flex items-center text-xs text-gray-500">
                        System administrator
                      </span>
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full flex justify-center py-3"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign up now
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;