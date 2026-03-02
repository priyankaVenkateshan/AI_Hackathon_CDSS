import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

export default function Header() {
    const { theme, toggleTheme } = useTheme();
    const { user } = useAuth();

    // Fallback if no user is found (shouldn't happen in protected routes)
    if (!user) return null;

    const initials = user.name.split(' ').map(n => n[0]).join('');
    const userRoleDisplay = user.role.charAt(0).toUpperCase() + user.role.slice(1);

    return (
        <header className="header">
            <div className="header__left">
                <div className="header__greeting">
                    <span className="header__greeting-text">Good afternoon,</span>
                    <span className="header__greeting-name">{user.name}</span>
                </div>

                <div className="header__search">
                    <span className="header__search-icon">🔍</span>
                    <input
                        className="header__search-input"
                        type="text"
                        placeholder="Search patients, records..."
                    />
                    <span className="header__search-kbd">⌘K</span>
                </div>
            </div>

            <div className="header__right">
                <button className="header__icon-btn header__icon-btn--has-badge" title="Notifications">
                    🔔
                </button>
                <button className="header__icon-btn" title="Messages">
                    💬
                </button>

                <button className="header__theme-btn" onClick={toggleTheme} title="Toggle theme">
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>

                <div className="header__divider" />

                <div className="header__profile">
                    <div className="header__avatar">{initials}</div>
                    <div className="header__profile-info">
                        <span className="header__profile-name">{user.name}</span>
                        <span className="header__profile-role">{userRoleDisplay}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
