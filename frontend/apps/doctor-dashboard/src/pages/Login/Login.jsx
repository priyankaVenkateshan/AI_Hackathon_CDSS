import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
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

        try {
            const result = await login(email, password);
            if (result.success) {
                const role = result.user?.role;
                const isPatient = role === 'patient';
                const targetPath = isPatient ? '/patient-portal' : (from || '/');
                navigate(targetPath, { replace: true });
            } else {
                setError(result.message || 'Login failed');
            }
        } catch (_) {
            setError('Connection error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card animate-in">
                <div className="login-logo">
                    <h1>CDSS Login</h1>
                    <p>Enter your credentials to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>EMAIL</label>
                        <input
                            type="email"
                            placeholder="admin@cdss.ai"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>PASSWORD</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="login-actions-row">
                        <label className="login-remember">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <span>Remember me</span>
                        </label>
                        <button
                            type="button"
                            className="login-forgot"
                            onClick={() => setError('Please contact IT support to reset your password.')}
                        >
                            Forgot password?
                        </button>
                    </div>

                    {error && <div className="login-error">⚠️ {error}</div>}

                    <button type="submit" className="login-btn" disabled={isSubmitting}>
                        {isSubmitting ? 'Verifying...' : 'Access Dashboard'}
                    </button>
                </form>

                <div className="login-footer">
                    <small>Demo: priya@cdss.ai / admin@cdss.ai (***REDACTED***)</small>
                </div>
            </div>
        </div>
    );
}
