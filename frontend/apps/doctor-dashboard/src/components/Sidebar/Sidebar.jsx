import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth, roles } from '../../context/AuthContext';
import './Sidebar.css';

const navItems = [
    { section: 'Navigation' },
    { path: '/', icon: '🏠', label: 'Dashboard', tooltip: 'Dashboard' },
    { path: '/patients', icon: '👥', label: 'Patients', tooltip: 'Patients' },
    { path: '/surgery', icon: '🔪', label: 'Surgeries', tooltip: 'Surgical Schedule' },
    { path: '/medications', icon: '📋', label: 'Clinical Tasks', tooltip: 'Clinical Tasks' },
    { path: '/reports', icon: '📊', label: 'Reports', tooltip: 'Reports' },
    { path: '/profile', icon: '👤', label: 'Profile', tooltip: 'Profile' },
    { section: 'System', roles: [roles.ADMIN] },
    { path: '/admin/dashboard', icon: '📊', label: 'Admin Dashboard', tooltip: 'Admin overview', roles: [roles.ADMIN] },
    { path: '/admin/users', icon: '👥', label: 'Users', tooltip: 'Users & roles', roles: [roles.ADMIN] },
    { path: '/admin/audit', icon: '📋', label: 'Audit Log', tooltip: 'Audit log', roles: [roles.ADMIN] },
    { path: '/admin/config', icon: '🔧', label: 'System Config', tooltip: 'Config', roles: [roles.ADMIN] },
    { path: '/admin/analytics', icon: '📊', label: 'Analytics', tooltip: 'Analytics', roles: [roles.ADMIN] },
    { path: '/admin/resources', icon: '🛠️', label: 'Admin Resources', tooltip: 'OT & equipment', roles: [roles.ADMIN] },
    { path: '/settings', icon: '⚙️', label: 'Settings', tooltip: 'Settings', roles: [roles.ADMIN] },
];

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const { user, hasRole, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const filteredNavItems = navItems.filter(item => {
        if (!item.roles) return true;
        return hasRole(item.roles);
    });

    return (
        <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
            {/* Logo */}
            <div className="sidebar__logo">
                <div className="sidebar__logo-icon">C</div>
                <div className="sidebar__logo-text">
                    <span className="sidebar__logo-title">CDSS</span>
                    <span className="sidebar__logo-subtitle">Clinical Decision Support</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar__nav">
                {filteredNavItems.map((item, i) => {
                    if (item.section) {
                        return (
                            <div key={`section-${i}`} className="sidebar__section-label">
                                {item.section}
                            </div>
                        );
                    }
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) => `sidebar__link${isActive ? ' active' : ''}`}
                            data-tooltip={item.tooltip}
                        >
                            <span className="sidebar__link-icon">{item.icon}</span>
                            <span className="sidebar__link-text">{item.label}</span>
                            {item.badge && <span className="sidebar__link-badge">{item.badge}</span>}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer with Collapse and Logout */}
            <div className="sidebar__footer">
                <button className="sidebar__link logout-btn" onClick={handleLogout} style={{ width: '100%', background: 'none', border: 'none', padding: 'var(--space-3)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span className="sidebar__link-icon">🚪</span>
                    <span className="sidebar__link-text">Sign Out</span>
                </button>
                <div className="sidebar__divider" style={{ margin: 'var(--space-2) 0', borderTop: '1px solid rgba(255,255,255,0.05)' }} />
                <button className="sidebar__collapse-btn" onClick={() => setCollapsed(!collapsed)}>
                    <span className="sidebar__collapse-icon">{collapsed ? '▶' : '◀'}</span>
                    <span className="sidebar__link-text">{collapsed ? '' : 'Collapse'}</span>
                </button>
            </div>
        </aside>
    );
}
