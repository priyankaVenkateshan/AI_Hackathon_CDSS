import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';

import { roles } from '../../context/AuthContext';

export default function ProtectedRoute({ children, requiredRoles }) {
    const { user, loading, hasRole } = useAuth();
    const location = useLocation();

    // #region agent log
    const branch = loading ? 'loading' : (!user ? 'redirectLogin' : (requiredRoles && !hasRole(requiredRoles) ? 'redirectRole' : 'children'));
    fetch('http://127.0.0.1:7803/ingest/454ee95e-546b-4257-becf-08e4fe56dd25',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4da93a'},body:JSON.stringify({sessionId:'4da93a',location:'ProtectedRoute:branch',message:'ProtectedRoute render',data:{branch,loading:!!loading,hasUser:!!user,requiredRoles:requiredRoles||null},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    // #endregion

    if (loading) return <LoadingSpinner message="Loading…" />;

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRoles && !hasRole(requiredRoles)) {
        return <Navigate to={user?.role === roles.PATIENT ? '/patient-portal' : '/'} replace />;
    }

    return children;
}
