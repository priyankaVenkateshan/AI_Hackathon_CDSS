import { createContext, useContext, useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { isCognitoEnabled } from '../api/config';

const AuthContext = createContext();

export const roles = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  SURGEON: 'surgeon',
  NURSE: 'nurse',
  ADMIN: 'admin',
};

const users = [
  { id: 'p1', name: 'Rahul Kumar', role: roles.PATIENT, email: 'patient@cdss.ai', password: 'password123' },
  { id: 'u1', name: 'Dr. Priya Sharma', role: roles.DOCTOR, email: 'priya@cdss.ai', password: 'password123' },
  { id: 'u2', name: 'Dr. Vikram Patel', role: roles.SURGEON, email: 'vikram@cdss.ai', password: 'password123' },
  { id: 'u3', name: 'Nurse Anjali', role: roles.NURSE, email: 'anjali@cdss.ai', password: 'password123' },
  { id: 'u4', name: 'Admin Sameer', role: roles.ADMIN, email: 'admin@cdss.ai', password: 'password123' },
];

const CDSS_USER_KEY = 'cdss_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isCognitoEnabled()) {
      import('../lib/cognito').then(({ cognitoGetSession }) => {
        cognitoGetSession()
          .then((sessionUser) => {
            if (sessionUser && sessionUser.role !== roles.PATIENT) {
              // Non-patient users should use Staff app, not patient portal.
              sessionUser = null;
            }
            if (sessionUser) {
              setUser(sessionUser);
              localStorage.setItem(CDSS_USER_KEY, JSON.stringify(sessionUser));
            }
            setLoading(false);
            // #region agent log
            fetch('http://127.0.0.1:7803/ingest/454ee95e-546b-4257-becf-08e4fe56dd25',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'11cc47'},body:JSON.stringify({sessionId:'11cc47',location:'patient-dashboard:AuthContext:cognitoDone',message:'auth init done',data:{loading:false,hasUser:!!sessionUser},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
            // #endregion
          })
          .catch(() => {
            setLoading(false);
          });
      }).catch(() => {
        setLoading(false);
      });
      return;
    }

    const saved = localStorage.getItem(CDSS_USER_KEY);
    if (saved) try { setUser(JSON.parse(saved)); } catch (_) {}
    setLoading(false);
    // #region agent log
    fetch('http://127.0.0.1:7803/ingest/454ee95e-546b-4257-becf-08e4fe56dd25',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'11cc47'},body:JSON.stringify({sessionId:'11cc47',location:'patient-dashboard:AuthContext:mockInit',message:'auth init done',data:{loading:false,hasSavedUser:!!saved},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
  }, []);

  const login = async (email, password) => {
    if (isCognitoEnabled()) {
      try {
        const { cognitoSignIn } = await import('../lib/cognito');
        const sessionUser = await cognitoSignIn(email, password);
        if ((sessionUser?.role || '').toLowerCase() !== roles.PATIENT) {
          return { success: false, message: 'This account is not a patient. Please use the Staff app.' };
        }
        flushSync(() => {
          setUser(sessionUser);
        });
        localStorage.setItem(CDSS_USER_KEY, JSON.stringify(sessionUser));
        return { success: true, user: sessionUser };
      } catch (err) {
        const message = err?.message || 'Login failed';
        return { success: false, message };
      }
    }
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      if (found.role !== roles.PATIENT) {
        return { success: false, message: 'This account is not a patient. Please use the Staff app.' };
      }
      const { password: _, ...u } = found;
      setUser({ ...u, token: u.id });
      localStorage.setItem(CDSS_USER_KEY, JSON.stringify({ ...u, token: u.id }));
      return { success: true };
    }
    return { success: false, message: 'Invalid credentials' };
  };

  const logout = async () => {
    if (isCognitoEnabled()) {
      try {
        const { cognitoSignOut } = await import('../lib/cognito');
        await cognitoSignOut();
      } catch (_) { /* ignore */ }
    }
    setUser(null);
    localStorage.removeItem(CDSS_USER_KEY);
  };

  const hasRole = (requiredRoles) => {
    if (!user) return false;
    return Array.isArray(requiredRoles) ? requiredRoles.includes(user.role) : user.role === requiredRoles;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
