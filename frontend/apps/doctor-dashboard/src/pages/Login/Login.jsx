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
            const role = result.user?.role;
            const isPatient = role === 'patient';
            const targetPath = isPatient ? '/patient-portal' : (from || '/');
            navigate(targetPath, { replace: true });
        } else {
            setError(result.message || 'Login failed');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="login-container">
            <div className="login-card animate-in">
                <div className="login-logo">
                    <div className="logo-icon">C</div>
                    <h1>CDSS Platform</h1>
                    <p>Clinical Decision Support System</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Clinical Email</label>
                        <input
                            type="email"
                            placeholder="name@hospital.ai"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Credential Key</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <div className="login-error">⚠️ {error}</div>}

                    <button type="submit" className="login-btn" disabled={isSubmitting}>
                        {isSubmitting ? 'Verifying...' : 'Access Dashboard'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Secured by Hospital KMS & Biometric Auth</p>
                    <div className="demo-hint">
                        <small>Demo: Staff priya@cdss.ai / Admin admin@cdss.ai — Patient rajesh@patient.demo (pwd: ***REDACTED***)</small>
                    </div>
                </div>
            </div>
        </div>
    );
}
