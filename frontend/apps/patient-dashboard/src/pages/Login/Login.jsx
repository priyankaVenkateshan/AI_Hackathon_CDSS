import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    const result = await login(email, password);
    if (result.success) {
      // #region agent log
      fetch('http://127.0.0.1:7803/ingest/454ee95e-546b-4257-becf-08e4fe56dd25',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'11cc47'},body:JSON.stringify({sessionId:'11cc47',location:'patient-dashboard:Login:beforeNav',message:'login success before navigate',data:{from,hasUser:!!result.user},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
      navigate(from, { replace: true });
    } else setError(result.message || 'Login failed');
    setIsSubmitting(false);
  };

  return (
    <div className="login-container">
      <div className="login-card animate-in">
        <div className="login-logo">
          <div className="logo-icon">C</div>
          <h1>CDSS Patient Portal</h1>
          <p>View your health records and appointments</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <div className="login-error">⚠️ {error}</div>}
          <button type="submit" className="login-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="login-footer">
          <p>Secured access to your health information</p>
          <div className="demo-hint"><small>Demo: patient@cdss.ai / ***REDACTED***</small></div>
        </div>
      </div>
    </div>
  );
}
