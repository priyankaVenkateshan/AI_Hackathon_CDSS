import { createContext, useContext, useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { isCognitoEnabled } from '../api/config';

const AuthContext = createContext();

export const roles = {
    DOCTOR: 'doctor',
    SURGEON: 'surgeon',
    NURSE: 'nurse',
    ADMIN: 'admin',
    PATIENT: 'patient',
};

const users = [
    { id: 'u1', name: 'Dr. Priya Sharma', role: roles.DOCTOR, email: 'priya@cdss.ai', password: '***REDACTED***' },
    { id: 'u2', name: 'Dr. Vikram Patel', role: roles.SURGEON, email: 'vikram@cdss.ai', password: '***REDACTED***' },
    { id: 'u3', name: 'Nurse Anjali', role: roles.NURSE, email: 'anjali@cdss.ai', password: '***REDACTED***' },
    { id: 'u4', name: 'Admin Sameer', role: roles.ADMIN, email: 'admin@cdss.ai', password: '***REDACTED***' },
    { id: 'PT-1001', name: 'Rajesh Kumar', role: roles.PATIENT, email: 'rajesh@patient.demo', password: '***REDACTED***' },
    { id: 'p1', name: 'Rahul Kumar', role: roles.PATIENT, email: 'patient@cdss.ai', password: '***REDACTED***' },
];

const CDSS_USER_KEY = 'cdss_user';
const CDSS_TOKEN_KEY = 'cdss_token';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isCognitoEnabled()) {
            import('../lib/cognito').then(({ cognitoGetSession }) => {
                cognitoGetSession()
                    .then((sessionUser) => {
                        if (sessionUser) {
                            setUser(sessionUser);
                            localStorage.setItem(CDSS_USER_KEY, JSON.stringify(sessionUser));
                        }
                        setLoading(false);
                        // #region agent log
                        fetch('http://127.0.0.1:7803/ingest/454ee95e-546b-4257-becf-08e4fe56dd25',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4da93a'},body:JSON.stringify({sessionId:'4da93a',location:'AuthContext:cognitoDone',message:'auth loading done',data:{loading:false,hasUser:!!sessionUser},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
                        // #endregion
                    })
                    .catch(() => {
                        setLoading(false);
                        // #region agent log
                        fetch('http://127.0.0.1:7803/ingest/454ee95e-546b-4257-becf-08e4fe56dd25',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4da93a'},body:JSON.stringify({sessionId:'4da93a',location:'AuthContext:cognitoCatch',message:'cognitoGetSession failed',data:{loading:false},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
                        // #endregion
                    });
            }).catch(() => {
                setLoading(false);
                // #region agent log
                fetch('http://127.0.0.1:7803/ingest/454ee95e-546b-4257-becf-08e4fe56dd25',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4da93a'},body:JSON.stringify({sessionId:'4da93a',location:'AuthContext:cognitoImportCatch',message:'cognito import failed',data:{loading:false},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
                // #endregion
            });
            return;
        }
        const savedUser = localStorage.getItem(CDSS_USER_KEY);
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (_) { /* ignore */ }
        }
        setLoading(false);
        // #region agent log
        fetch('http://127.0.0.1:7803/ingest/454ee95e-546b-4257-becf-08e4fe56dd25',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4da93a'},body:JSON.stringify({sessionId:'4da93a',location:'AuthContext:mockDone',message:'auth loading done',data:{loading:false,hasSavedUser:!!savedUser},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
    }, []);

    const login = async (email, password) => {
        if (isCognitoEnabled()) {
            try {
                const { cognitoSignIn } = await import('../lib/cognito');
                const sessionUser = await cognitoSignIn(email, password);
                flushSync(() => {
                    setUser(sessionUser);
                });
                localStorage.setItem(CDSS_USER_KEY, JSON.stringify(sessionUser));
                return { success: true, user: sessionUser };
            } catch (err) {
                const message = err.message || err.name === 'NotAuthorizedException' ? 'Invalid credentials' : 'Login failed';
                return { success: false, message };
            }
        }
        const foundUser = users.find(u => u.email === email && u.password === password);
        if (foundUser) {
            const { password: _, ...userWithoutPassword } = foundUser;
            const userWithToken = { ...userWithoutPassword, token: userWithoutPassword.id };
            flushSync(() => {
                setUser(userWithToken);
            });
            localStorage.setItem(CDSS_USER_KEY, JSON.stringify(userWithToken));
            return { success: true, user: userWithToken };
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
        localStorage.removeItem(CDSS_TOKEN_KEY);
    };

    const hasRole = (requiredRoles) => {
        if (!user) return false;
        if (Array.isArray(requiredRoles)) {
            return requiredRoles.includes(user.role);
        }
        return user.role === requiredRoles;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, hasRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
