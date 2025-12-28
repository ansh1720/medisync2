import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon, UserIcon, ShieldCheckIcon, BeakerIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '', role: 'user' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, getRoleDashboard } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      // Navigation handled in handleSubmit
    }
  }, [isAuthenticated]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return toast.error('Please fill in all fields');

    setIsLoading(true);
    try {
      const response = await login(formData);
      const userRole = response.data?.user?.role || response.user?.role || formData.role;
      navigate(getRoleDashboard(userRole), { replace: true });
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { value: 'user', label: 'Patient', icon: UserIcon, color: 'primary' },
    { value: 'doctor', label: 'Doctor', icon: BeakerIcon, color: 'blue' },
    { value: 'admin', label: 'Admin', icon: ShieldCheckIcon, color: 'red' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Sign in to MediSync</h2>
          <p className="mt-2 text-sm text-gray-600">Your health companion is waiting for you</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="input pr-10"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
              <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeSlashIcon className="h-5 w-5 text-gray-400" /> : <EyeIcon className="h-5 w-5 text-gray-400" />}
              </button>
            </div>

            <div>
              <label className="label">Sign in as</label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map(({ value, label, icon: Icon, color }) => (
                  <label
                    key={value}
                    className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                      formData.role === value
                        ? `border-${color}-600 bg-${color}-50 text-${color}-900`
                        : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      className="sr-only"
                      checked={formData.role === value}
                      onChange={handleChange}
                    />
                    <span className="flex flex-col">
                      <Icon className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">{label}</span>
                      <span className="mt-1 text-xs text-gray-500">
                        {value === 'user' ? 'Regular user access' : value === 'doctor' ? 'Medical professional' : 'System administrator'}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
              Forgot your password?
            </Link>
          </div>

          <button type="submit" disabled={isLoading} className="btn btn-primary w-full flex justify-center py-3">
            {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Sign in'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Sign up now
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;