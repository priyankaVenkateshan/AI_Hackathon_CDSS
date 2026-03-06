import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isMockMode } from '../../api/config';
import { getDashboard, getSchedule } from '../../api/client';
import { patients, todaySchedule, aiAlerts, surgeries } from '../../data/mockData';
import { useAuth, roles } from '../../context/AuthContext';
import './Dashboard.css';

const getInitials = (name) => name.split(' ').map(n => n[0]).join('');

const alertIcons = { critical: '🚨', warning: '⚠️', info: 'ℹ️', success: '✅' };

function mapApiAlertToUi(alert) {
    const typeMap = { drug_interaction: 'critical', vital_abnormality: 'critical', high: 'warning', critical: 'critical', info: 'info', success: 'success' };
    return {
        id: alert.id,
        type: typeMap[alert.type] || alert.type || 'info',
        title: (alert.type || 'Alert').replace(/_/g, ' '),
        message: alert.message,
        time: alert.time || '',
    };
}

function mapApiQueueToUi(q) {
    return {
        id: q.id,
        name: q.name,
        gender: 'Male',
        ward: '—',
        conditions: [q.status || '—'],
        vitals: q.vitals || { hr: 0, bp: '—', spo2: 0 },
        severity: (q.severity || '').toLowerCase(),
        status: q.status === 'Stable' || q.status === 'Ready for Discharge' ? 'waiting' : 'in-consultation',
    };
}

export default function Dashboard() {
    // #region agent log
    fetch('http://127.0.0.1:7803/ingest/454ee95e-546b-4257-becf-08e4fe56dd25',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4da93a'},body:JSON.stringify({sessionId:'4da93a',location:'Dashboard:mount',message:'Dashboard mounted',data:{},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    const navigate = useNavigate();
    const { user } = useAuth();

    const getInstruments = (type) => {
        const lists = {
            'ACL Reconstruction': ['Arthrotome', 'Graft passer', 'Drill bits (4.5mm, 6mm)', 'Interference screws', 'Sutures (Vicryl 2-0)'],
            'Cardiac Catheterization': ['Introducer sheath', 'Diagnostic catheters', 'Guidewires', 'Contrast media', 'Pressure manifold'],
            'Appendectomy': ['Scalpel #10', 'Babcock forceps', 'Ligation clips', 'Suction irrigator', 'Trocar set (10mm, 5mm)']
        };
        return lists[type] || ['Standard surgical kit', 'Sterile drapes', 'Suction tip'];
    };
    const [loading, setLoading] = useState(!isMockMode());
    const [error, setError] = useState(null);
    const [stats, setStats] = useState([]);
    const [queue, setQueue] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [surgeryList, setSurgeryList] = useState(isMockMode() ? surgeries : []);
    const [selectedSurgery, setSelectedSurgery] = useState(null);
    const [wardFilter, setWardFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showEmergencyOverlay, setShowEmergencyOverlay] = useState(false);

    useEffect(() => {
        if (isMockMode()) {
            const waitingCount = patients.filter(p => p.status === 'waiting').length;
            const criticalCount = patients.filter(p => p.severity === 'critical').length;
            const todayAppointments = todaySchedule.length;
            const completedToday = todaySchedule.filter(s => s.status === 'completed').length;
            const pendingConsults = patients.filter(p => p.status === 'waiting').length;
            const surgeryCount = 2; // Mock surgery count

            setStats([
                { icon: '👥', label: 'Patients Attended', value: 12, trend: '+3 from avg', trendDir: 'up', variant: 'primary' },
                { icon: '📅', label: 'Appointments', value: todayAppointments, trend: `${completedToday} completed`, trendDir: 'up', variant: 'secondary' },
                { icon: '⏳', label: 'Pending Consults', value: pendingConsults, trend: 'Due today', trendDir: 'down', variant: 'info' },
                { icon: '🔪', label: 'Surgeries', value: surgeryCount, trend: 'OT-3 Booked', trendDir: 'up', variant: 'accent' },
                { icon: '🚨', label: 'Critical Alerts', value: criticalCount, trend: 'Needs action', trendDir: 'down', variant: 'warning' },
            ]);
            setQueue(patients.filter(p => p.status !== 'scheduled'));
            setAlerts(aiAlerts);
            setSchedule(todaySchedule);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        Promise.all([
            getDashboard(user?.id || 'DR-DEFAULT'),
            getSchedule().catch(() => ({ schedule: [] })),
        ])
            .then(([data, scheduleData]) => {
                if (cancelled) return;
                const d = data || {};
                const statMap = { warning: 'warning', critical: 'warning', info: 'secondary', ai: 'accent' };

                // Backend contract: docs/api_reference.md – stats is an object with aggregate counts.
                // Also support an array of stat objects if backend evolves.
                let statsSource = [];
                if (Array.isArray(d.stats)) {
                    statsSource = d.stats;
                } else if (d.stats && typeof d.stats === 'object') {
                    const {
                        totalPatients = 0,
                        activeSurgeries = 0,
                        alertsCount = 0,
                    } = d.stats;
                    statsSource = [
                        { label: 'Patients', value: totalPatients, type: 'info' },
                        { label: 'Active Surgeries', value: activeSurgeries, type: 'info' },
                        { label: 'Critical Alerts', value: alertsCount, type: alertsCount > 0 ? 'warning' : 'info' },
                    ];
                }

                setStats(statsSource.map((s, i) => ({
                    icon: ['👥', '🚨', '📅', '🤖'][i] || 'ℹ️',
                    label: s.label,
                    value: s.value,
                    trend: s.trend || '',
                    trendDir: s.type === 'critical' ? 'down' : 'up',
                    variant: statMap[s.type] || 'primary',
                })));

                const patientQueue = d.patient_queue || d.patientQueue || [];
                const aiAlertsApi = d.ai_alerts || d.aiAlerts || [];

                setQueue(patientQueue.map(mapApiQueueToUi));
                setAlerts(aiAlertsApi.map(mapApiAlertToUi));
                setSchedule(scheduleData?.schedule || scheduleData || []);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message || 'Failed to load dashboard');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [user?.id]);

    if (loading && !isMockMode()) {
        return (
            <div className="dashboard page-enter" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                <p className="dashboard__loading">Loading dashboard…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard page-enter" style={{ padding: '2rem', textAlign: 'center' }}>
                <p className="dashboard__error" style={{ color: 'var(--color-error, #c00)' }}>{error}</p>
                <button className="btn btn--primary" onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    const statRows = stats.length > 0 ? stats : (isMockMode() ? [
        { icon: '👥', label: 'Patients Attended', value: 12, trend: '+3 from avg', trendDir: 'up', variant: 'primary' },
        { icon: '📅', label: 'Appointments', value: todaySchedule.length, trend: `${todaySchedule.filter(s => s.status === 'completed').length} completed`, trendDir: 'up', variant: 'secondary' },
        { icon: '⏳', label: 'Pending Consults', value: patients.filter(p => p.status === 'waiting').length, trend: 'Due today', trendDir: 'down', variant: 'info' },
        { icon: '🔪', label: 'Surgeries', value: 2, trend: 'OT-3 Booked', trendDir: 'up', variant: 'accent' },
        { icon: '🚨', label: 'Critical Alerts', value: patients.filter(p => p.severity === 'critical').length, trend: 'Needs action', trendDir: 'down', variant: 'warning' },
    ] : []);

    const queueList = queue.length ? queue : (isMockMode() ? patients.filter(p => p.status !== 'scheduled') : []);
    const isNurse = user?.role === roles.NURSE;
    const wards = ['All', 'General', 'OPD', 'ICU', 'Cardiology'];
    const queueFilteredByWard = isNurse && wardFilter !== 'all'
        ? queueList.filter(p => (p.ward || '').toLowerCase() === wardFilter.toLowerCase())
        : queueList;
    const alertList = alerts.length ? alerts : (isMockMode() ? aiAlerts : []);
    const scheduleList = schedule.length ? schedule : (isMockMode() ? todaySchedule : []);

    return (
        <div className="dashboard page-enter">
            {/* Search Bar */}
            <div className="dashboard__header">
                <div className="search-container">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search patient by ID, name, or phone (⌘K)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Surgery & Resource Coordination */}
            <div className="dashboard__coordination animate-in animate-in-delay-4">
                <div className="card-header">
                    <span className="card-header__title">🔪 Surgery & Resource Coordination</span>
                </div>
                <div className="ot-status-grid">
                    {['OT-1', 'OT-2', 'OT-3', 'ICU-Beds'].map((res) => {
                        const isOT = res.startsWith('OT');
                        const busy = surgeryList.some(s => s.ot === res && s.status === 'in-prep');
                        return (
                            <div key={res} className={`resource-card ${busy ? 'resource-card--busy' : 'resource-card--available'}`}>
                                <div className="resource-card__header">
                                    <span className="resource-name">{res}</span>
                                    <span className={`status-dot ${busy ? 'status-dot--busy' : 'status-dot--available'}`} />
                                </div>
                                <div className="resource-card__content">
                                    {busy ? (
                                        <span className="resource-status-text">In Use • Appendectomy</span>
                                    ) : (
                                        <span className="resource-status-text">Ready • All cleared</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="surgery-mini-list">
                    {surgeryList.slice(0, 3).map((s, i) => (
                        <div
                            key={s.id}
                            className={`surgery-mini-item ${selectedSurgery?.id === s.id ? 'active' : ''}`}
                            onClick={() => setSelectedSurgery(selectedSurgery?.id === s.id ? null : s)}
                        >
                            <div className="surgery-mini-info">
                                <span className="surgery-mini-patient">{s.patient}</span>
                                <span className="surgery-mini-type">{s.type}</span>
                            </div>
                            <div className="surgery-mini-meta">
                                <span className="surgery-mini-ot">{s.ot}</span>
                                <span className={`surgery-mini-status status--${s.status}`}>{s.status}</span>
                            </div>
                            {selectedSurgery?.id === s.id && (
                                <div className="surgery-checklist animate-in">
                                    <div className="checklist-title">📋 Instrument Checklist</div>
                                    <ul className="checklist-items">
                                        {getInstruments(s.type).map((item, idx) => (
                                            <li key={idx} className="checklist-item">
                                                <input type="checkbox" readOnly checked={idx < 2} />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Stats Row */}
            <div className="dashboard__stats">
                {statRows.map((stat, i) => (
                    <div key={i} className={`stat-card stat-card--narrow animate-in animate-in-delay-${i + 1}`}>
                        <div className={`stat-card__icon stat-card__icon--${stat.variant}`}>{stat.icon}</div>
                        <div className="stat-card__info">
                            <span className="stat-card__value">{stat.value}</span>
                            <span className="stat-card__label">{stat.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Patient Queue */}
            <div className="dashboard__queue animate-in animate-in-delay-3">
                <div className="card-header">
                    <span className="card-header__title">👥 Patient Queue</span>
                    {isNurse && (
                        <select
                            className="dashboard-ward-filter"
                            value={wardFilter}
                            onChange={(e) => setWardFilter(e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--surface-border)', background: 'var(--surface-card)', fontSize: 'var(--text-sm)' }}
                        >
                            {wards.map((w) => (
                                <option key={w} value={w === 'All' ? 'all' : w}>{w}</option>
                            ))}
                        </select>
                    )}
                    <span className="card-header__action" onClick={() => navigate('/patients')}>View all →</span>
                </div>
                <div className="queue-list">
                    {queueFilteredByWard.map((patient, i) => (
                        <div
                            key={patient.id}
                            className={`queue-item animate-in animate-in-delay-${i + 1}`}
                            onClick={() => navigate(`/patient/${patient.id}`)}
                        >
                            <div className={`queue-item__avatar queue-item__avatar--${(patient.gender || 'male').toLowerCase()}`}>
                                {getInitials(patient.name)}
                            </div>
                            <div className="queue-item__info">
                                <div className="queue-item__name">{patient.name}</div>
                                <div className="queue-item__details">
                                    <span>{patient.age ? `${patient.age}y` : '—'} / {(patient.gender || 'M')[0]}</span>
                                    <span>·</span>
                                    <span>{patient.ward || '—'}</span>
                                    <span>·</span>
                                    <span>{Array.isArray(patient.conditions) ? patient.conditions[0] : patient.conditions || '—'}</span>
                                </div>
                            </div>
                            <div className="queue-item__vitals">
                                <span className={`vital-mini ${patient.vitals?.spo2 < 92 ? 'vital-mini--critical' : ''}`}>
                                    💓 {patient.vitals?.hr ?? '—'}
                                </span>
                                <span className="vital-mini">🩸 {patient.vitals?.bp ?? '—'}</span>
                                <span className={`vital-mini ${patient.vitals?.spo2 < 92 ? 'vital-mini--critical' : ''}`}>
                                    O₂ {patient.vitals?.spo2 ?? '—'}%
                                </span>
                            </div>
                            <span className={`queue-item__severity severity--${patient.severity || 'moderate'}`}>
                                {patient.severity || '—'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Alerts */}
            <div className="dashboard__alerts animate-in animate-in-delay-4">
                <div className="card-header">
                    <span className="card-header__title">🤖 AI Alerts</span>
                    <span className="card-header__action">Mark all read</span>
                </div>
                <div className="alert-list">
                    {alertList.map((alert, i) => (
                        <div key={alert.id || i} className={`alert-item alert-item--${alert.type} animate-in animate-in-delay-${i + 1}`}>
                            <div className="alert-item__header">
                                <span className="alert-item__icon">{alertIcons[alert.type] || 'ℹ️'}</span>
                                <span className="alert-item__title">{alert.title}</span>
                                <span className="alert-item__time">{alert.time}</span>
                            </div>
                            <div className="alert-item__message">{alert.message}</div>
                            {alert.type === 'critical' && (
                                <button
                                    className="alert-item__action-btn"
                                    onClick={() => setShowEmergencyOverlay(true)}
                                >
                                    🔴 Trigger Emergency Protocol
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Schedule */}
            <div className="dashboard__schedule animate-in animate-in-delay-5">
                <div className="card-header">
                    <span className="card-header__title">📅 Today's Schedule</span>
                    <span className="card-header__action">Full calendar →</span>
                </div>
                <div className="schedule-list">
                    {scheduleList.map((slot, i) => (
                        <div key={i} className="schedule-item">
                            <span className="schedule-item__time">{slot.time}</span>
                            <div className="schedule-item__line">
                                <div className={`schedule-item__dot schedule-item__dot--${slot.status}`} />
                            </div>
                            <div className="schedule-item__info">
                                <div className="schedule-item__patient">{slot.patient}</div>
                                <div className="schedule-item__type">{slot.type}</div>
                            </div>
                            <span className={`schedule-item__status status--${(slot.status || 'upcoming').replace('-', ' ')}`}>
                                {(slot.status || 'upcoming').replace('-', ' ')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Emergency Overlay */}
            {showEmergencyOverlay && (
                <div className="emergency-overlay">
                    <div className="emergency-overlay__content glass animate-in">
                        <div className="emergency-overlay__header">
                            <h2 className="emergency-overlay__title">🚨 EMERGENCY: Code Blue Simulation</h2>
                            <span className="emergency-overlay__timer">00:45s Elapsed</span>
                        </div>
                        <div className="emergency-overlay__grid">
                            <div className="emergency-overlay__section">
                                <h3 className="section-title">📍 Asset Tracking</h3>
                                <div className="asset-stat">
                                    <span className="asset-label">Crash Cart #4:</span>
                                    <span className="asset-value">In Transit (ICU Corridor)</span>
                                </div>
                                <div className="asset-stat">
                                    <span className="asset-label">Defibrillator:</span>
                                    <span className="asset-value">Ready at ICU Station B</span>
                                </div>
                            </div>
                            <div className="emergency-overlay__section">
                                <h3 className="section-title">👨‍⚕️ Rapid Response Team</h3>
                                <ul className="team-list">
                                    <li>Dr. Sharma (Lead) — <span className="status--waiting">Confirmed</span></li>
                                    <li>Nurse Anjali (ICU) — <span className="status--waiting">Confirmed</span></li>
                                    <li>Respiratory Therapist — <span className="status--upcoming">En Route</span></li>
                                </ul>
                            </div>
                        </div>
                        <div className="emergency-overlay__actions">
                            <button className="btn btn--primary btn--emergency" onClick={() => setShowEmergencyOverlay(false)}>
                                Acknowledge & Monitor
                            </button>
                            <button className="btn btn--outline" onClick={() => setShowEmergencyOverlay(false)}>
                                Dismiss (False Alarm)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
