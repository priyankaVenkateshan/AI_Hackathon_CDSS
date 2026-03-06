import { Navigate } from 'react-router-dom';
import { useAuth, roles } from '../../context/AuthContext';

/**
 * Restricts Patient Portal to users with role=patient only.
 * Staff (doctor, nurse, admin, surgeon) are redirected to the doctor dashboard.
 */
export default function PatientPortalGuard({ children }) {
    const { user, loading } = useAuth();

    // #region agent log
    const redirect = !user ? 'login' : (user.role !== roles.PATIENT ? 'dashboard' : null);
    fetch('http://127.0.0.1:7803/ingest/454ee95e-546b-4257-becf-08e4fe56dd25',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'11cc47'},body:JSON.stringify({sessionId:'11cc47',location:'PatientPortalGuard',message:'guard check',data:{loading,hasUser:!!user,userRole:user?.role,redirect},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== roles.PATIENT) return <Navigate to="/" replace />;

    return children;
}
