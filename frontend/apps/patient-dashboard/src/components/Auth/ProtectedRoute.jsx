import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, requiredRoles }) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  // #region agent log
  const branch = loading ? 'loading' : (!user ? 'redirectLogin' : (requiredRoles && !hasRole(requiredRoles) ? 'redirectRole' : 'children'));
  fetch('http://127.0.0.1:7803/ingest/454ee95e-546b-4257-becf-08e4fe56dd25',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'11cc47'},body:JSON.stringify({sessionId:'11cc47',location:'patient-dashboard:ProtectedRoute',message:'branch',data:{branch,loading:!!loading,hasUser:!!user},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
  // #endregion

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (requiredRoles && !hasRole(requiredRoles)) return <Navigate to="/" replace />;
  return children;
}
