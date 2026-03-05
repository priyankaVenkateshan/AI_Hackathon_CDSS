import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

/**
 * Pixel-Perfect Login Component
 * Matches the user-provided medical dashboard mockup exactly.
 * Scoped styling to ensure no leakage into the dashboard.
 */
export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [department, setDepartment] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

<<<<<<< HEAD
        const result = await login(email, password);
        if (result.success) {
            const role = result.user?.role;
            const isPatient = role === 'patient';
            const targetPath = isPatient ? '/patient-portal' : (from || '/');
            navigate(targetPath, { replace: true });
        } else {
            setError(result.message || 'Login failed');
=======
        try {
            const result = await login(email, password);
            if (result.success) {
                navigate(from, { replace: true });
            } else {
                setError(result.message || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setIsSubmitting(false);
>>>>>>> 69dbc2b (feat: Phase 3 - Specialist Replacement, Multilingual Support, Emergency Response, Patient Portal)
        }
    };

    return (
        <div className="login-screen-root">
            {/* Top Left Branding */}
            <div className="cdss-branding-top">
                <div className="cdss-logo-v3">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 11H13V5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5V11H5C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13H11V19C11 19.5523 11.4477 20 12 20C12.5523 20 13 19.5523 13 19V13H19C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11Z" fill="#1d82f6" />
                        <path d="M8 12H16M12 8V16" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <div className="logo-label-v3">
                        <span className="brand-main">CDSS</span>
                        <span className="brand-sub">PLATFORM</span>
                    </div>
                </div>
            </div>

            {/* Centered Login Card */}
            <div className="login-card-exact animate-in">
                <h1 className="login-title-exact">Medical Dashboard Login</h1>
                <p className="login-subtitle-exact">Enter your credentials to access the CDSS system</p>

                <form onSubmit={handleSubmit} className="login-form-exact">
                    {/* Email Group */}
                    <div className="login-field-group">
                        <label>Clinical Email</label>
                        <div className="login-input-box">
                            <input
                                type="email"
                                placeholder="example@hospital.org"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <span className="field-icon-right">✉️</span>
                        </div>
                    </div>

                    {/* Password Group */}
                    <div className="login-field-group">
                        <label>Password</label>
                        <div className="login-input-box">
                            <span className="field-icon-left">🔒</span>
                            <input
                                type="password"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button type="button" className="field-action-right">👁️‍🗨️</button>
                        </div>
                    </div>

                    {/* Department Group */}
                    <div className="login-field-group">
                        <label>Department</label>
                        <div className="login-select-box">
                            <select
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                required
                            >
                                <option value="" disabled>Select Department</option>
                                <option value="Cardiology">Cardiology</option>
                                <option value="Orthopedics">Orthopedics</option>
                                <option value="Neurology">Neurology</option>
                                <option value="Pediatrics">Pediatrics</option>
                                <option value="Oncology">Oncology</option>
                            </select>
                        </div>
                    </div>

                    {/* Actions Row */}
                    <div className="login-actions-row">
                        <label className="exact-switch">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <span className="switch-track"></span>
                            <span className="switch-text">Remember Me</span>
                        </label>
                        <a href="#" className="forgot-link-exact" onClick={(e) => e.preventDefault()}>
                            Forgot Password?
                        </a>
                    </div>

                    {error && <div className="login-error-exact">{error}</div>}

                    {/* Submit Button */}
                    <button type="submit" className="login-submit-btn-exact" disabled={isSubmitting}>
                        {isSubmitting ? 'Accessing...' : 'Access Dashboard'}
                    </button>
                </form>

<<<<<<< HEAD
                <div className="login-footer">
                    <p>Secured by Hospital KMS & Biometric Auth</p>
                    <div className="demo-hint">
                        <small>Demo: Staff priya@cdss.ai / Admin admin@cdss.ai — Patient rajesh@patient.demo (pwd: ***REDACTED***)</small>
                    </div>
=======
                {/* Footer Section */}
                <div className="login-footer-exact">
                    <p className="assistance-text">Need assistance? <a href="#">Contact IT Support</a></p>
                    <p className="copyright-text">© 2024 CDSS Platform. All rights reserved.</p>
>>>>>>> 69dbc2b (feat: Phase 3 - Specialist Replacement, Multilingual Support, Emergency Response, Patient Portal)
                </div>
            </div>
        </div>
    );
}
