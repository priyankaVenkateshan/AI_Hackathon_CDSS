import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import './Header.css';

const pathLabels = {
  '/': 'Dashboard',
  '/activity': 'My Activity',
  '/patients': 'Patients',
  '/patient': 'Patient Detail',
  '/surgery': 'Surgeries',
  '/resources': 'Resources',
  '/medications': 'Clinical Tasks',
  '/reports': 'Reports',
  '/profile': 'Profile',
  '/admin/users': 'Users',
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/audit': 'Audit Log',
  '/admin/config': 'System Config',
  '/admin/analytics': 'Analytics',
  '/admin/resources': 'Admin Resources',
  '/settings': 'Settings',
};

function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(Boolean);
  if (pathnames.length === 0) {
    return (
      <nav className="header__breadcrumbs" aria-label="Breadcrumb">
        <span className="header__breadcrumb-item">Dashboard</span>
      </nav>
    );
  }
  let current = '';
  const segments = pathnames.map((segment, i) => {
    current += (i === 0 ? '' : '/') + segment;
    const label = pathLabels[`/${current}`] || pathLabels[`/${segment}`] || segment;
    return { path: current, label };
  });
  if (pathnames[0] === 'patient' && pathnames[1]) {
    segments[segments.length - 1] = { path: location.pathname, label: `Patient ${pathnames[1]}` };
  }
  return (
    <nav className="header__breadcrumbs" aria-label="Breadcrumb">
      <span className="header__breadcrumb-item">Dashboard</span>
      {segments.map((s) => (
        <span key={s.path}>
          <span className="header__breadcrumb-sep"> / </span>
          <span className="header__breadcrumb-item">{s.label}</span>
        </span>
      ))}
    </nav>
  );
}

export default function Header() {
  const { user } = useAuth();
  const [onDuty] = useState(true); // could come from context/API

  if (!user) return null;

  const initials = user.name.split(' ').map((n) => n[0]).join('');

  return (
    <header className="header header--ops">
      <div className="header__inner">
        {/* Left: Doctor Portal + Breadcrumb */}
        <div className="header__left">
          <span className="header__portal-label">Doctor Portal</span>
          <Breadcrumbs />
        </div>

        {/* Center: Search */}
        <div className="header__center">
          <span className="header__search-icon" aria-hidden>🔍</span>
          <input
            className="header__search-input"
            type="search"
            placeholder="Search patients, shifts, cases"
            aria-label="Search"
          />
        </div>

        {/* Right: Notification, Profile, Shift badge */}
        <div className="header__right">
          <button
            type="button"
            className="header__icon-btn header__icon-btn--notify"
            title="Notifications"
            aria-label="Notifications"
          >
            <span className="header__icon">🔔</span>
            <span className="header__notify-dot" aria-hidden />
          </button>
          <div className="header__profile">
            <div className="header__avatar">{initials}</div>
            <div className="header__profile-info">
              <span className="header__profile-name">{user.name}</span>
            </div>
          </div>
          <span className={`header__shift-badge ${onDuty ? 'header__shift-badge--on' : 'header__shift-badge--off'}`}>
            {onDuty ? 'On Duty' : 'Off Duty'}
          </span>
        </div>
      </div>
    </header>
  );
}

