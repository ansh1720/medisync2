import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RoleBasedRedirect() {
  const { user, isAuthenticated, loading, getRoleDashboard } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const dashboardPath = getRoleDashboard(user?.role || 'user');
  return <Navigate to={dashboardPath} replace />;
}

export default RoleBasedRedirect;