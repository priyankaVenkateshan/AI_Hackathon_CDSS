import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import { roles } from '../../context/AuthContext';

export default function ProtectedRoute({ children, requiredRoles }) {
    const { user, loading, hasRole } = useAuth();
    const location = useLocation();

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRoles && !hasRole(requiredRoles)) {
        return <Navigate to={user?.role === roles.PATIENT ? '/patient-portal' : '/'} replace />;
    }

    return children;
}
