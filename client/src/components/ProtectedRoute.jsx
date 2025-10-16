import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, loading, user, getRoleDashboard } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && (!user?.role || !allowedRoles.includes(user.role))) {
    // Redirect to user's appropriate dashboard if they don't have access
    const userDashboard = getRoleDashboard(user?.role || 'user');
    return <Navigate to={userDashboard} replace />;
  }

  return children;
}

export default ProtectedRoute;