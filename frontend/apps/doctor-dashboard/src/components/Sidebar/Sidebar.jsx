import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth, roles } from '../../context/AuthContext';
import './Sidebar.css';

const navItems = [
    { path: '/', icon: '🎛️', label: 'Dashboard', tooltip: 'Dashboard' },
    { path: '/schedule', icon: '📅', label: 'Appointments', tooltip: 'Appointments' },
    { path: '/patients', icon: '👥', label: 'Patients', tooltip: 'Patients' },
    { path: '/surgery', icon: '🏥', label: 'Surgery', tooltip: 'Surgery' },
    { section: 'ADMINISTRATION', roles: [roles.ADMIN] },
    { path: '/admin/dashboard', icon: '📊', label: 'Monitoring', tooltip: 'System Monitoring', roles: [roles.ADMIN] },
    { path: '/admin/users', icon: '👥', label: 'Users', tooltip: 'User Management', roles: [roles.ADMIN] },
    { path: '/admin/audit', icon: '🛡️', label: 'Audit', tooltip: 'Audit Logs', roles: [roles.ADMIN] },
    { path: '/admin/config', icon: '⚙️', label: 'Config', tooltip: 'System Config', roles: [roles.ADMIN] },
];

import { currentDoctor } from '../../data/mockData';

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const { user, hasRole, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
            {/* Profile Section */}
            <div className="sidebar__profile">
                <div className="sidebar__avatar-wrap">
                    <div className="sidebar__avatar-initials">
                        {currentDoctor.initials}
                    </div>
                </div>
                {!collapsed && (
                    <div className="sidebar__profile-info">
                        <h3 className="sidebar__doctor-name">{currentDoctor.name}, DMD</h3>
                        <p className="sidebar__doctor-title">{user?.role === 'admin' ? 'System Administrator' : 'Primary care doctor'}</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="sidebar__nav">
                {navItems.map((item, i) => {
                    // Check roles if defined
                    if (item.roles && !hasRole(item.roles)) return null;

                    if (item.section) {
                        if (collapsed) return <div key={`sec-${i}`} className="sidebar__divider" />;
                        return <div key={`sec-${i}`} className="sidebar__section-label">{item.section}</div>;
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
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer with Logout */}
            <div className="sidebar__footer">
                <button className="sidebar__link logout-btn" onClick={handleLogout}>
                    <span className="sidebar__link-icon">🔓</span>
                    <span className="sidebar__link-text">Logout</span>
                </button>
                <div className="sidebar__divider" />
                <button className="sidebar__collapse-btn" onClick={() => setCollapsed(!collapsed)}>
                    <span className="sidebar__collapse-icon">{collapsed ? '▶' : '◀'}</span>
                    <span className="sidebar__link-text">{collapsed ? '' : 'Collapse'}</span>
                </button>
            </div>

            {!collapsed && (
                <div className="sidebar__copyright">
                    © 2026 CDSS. All Rights Reserved
                </div>
            )}
        </aside>
    );
}

