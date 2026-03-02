import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isMockMode } from '../../api/config';
import { getDashboard, getSchedule } from '../../api/client';
import { patients, todaySchedule, aiAlerts } from '../../data/mockData';
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
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(!isMockMode());
    const [error, setError] = useState(null);
    const [stats, setStats] = useState([]);
    const [queue, setQueue] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [wardFilter, setWardFilter] = useState('all');

    useEffect(() => {
        if (isMockMode()) {
            const waitingCount = patients.filter(p => p.status === 'waiting').length;
            const criticalCount = patients.filter(p => p.severity === 'critical').length;
            const todayAppointments = todaySchedule.length;
            const completedToday = todaySchedule.filter(s => s.status === 'completed').length;
            setStats([
                { icon: '👥', label: 'Patients Waiting', value: waitingCount, trend: '+2 from yesterday', trendDir: 'up', variant: 'primary' },
                { icon: '🚨', label: 'Critical Alerts', value: criticalCount, trend: 'Needs attention', trendDir: 'down', variant: 'warning' },
                { icon: '📅', label: "Today's Appointments", value: todayAppointments, trend: `${completedToday} completed`, trendDir: 'up', variant: 'secondary' },
                { icon: '🤖', label: 'AI Insights Ready', value: aiAlerts.length, trend: '2 actionable', trendDir: 'up', variant: 'accent' },
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
                const d = data;
                const statMap = { warning: 'warning', critical: 'warning', info: 'secondary', ai: 'accent' };
                setStats((d.stats || []).map((s, i) => ({
                    icon: ['👥', '🚨', '📅', '🤖'][i] || 'ℹ️',
                    label: s.label,
                    value: s.value,
                    trend: s.trend || '',
                    trendDir: s.type === 'critical' ? 'down' : 'up',
                    variant: statMap[s.type] || 'primary',
                })));
                setQueue((d.patient_queue || []).map(mapApiQueueToUi));
                setAlerts((d.ai_alerts || []).map(mapApiAlertToUi));
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

    const statRows = isMockMode() ? [
        { icon: '👥', label: 'Patients Waiting', value: patients.filter(p => p.status === 'waiting').length, trend: '+2 from yesterday', trendDir: 'up', variant: 'primary' },
        { icon: '🚨', label: 'Critical Alerts', value: patients.filter(p => p.severity === 'critical').length, trend: 'Needs attention', trendDir: 'down', variant: 'warning' },
        { icon: '📅', label: "Today's Appointments", value: todaySchedule.length, trend: `${todaySchedule.filter(s => s.status === 'completed').length} completed`, trendDir: 'up', variant: 'secondary' },
        { icon: '🤖', label: 'AI Insights Ready', value: aiAlerts.length, trend: '2 actionable', trendDir: 'up', variant: 'accent' },
    ] : stats;

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
            {/* Stats Row */}
            <div className="dashboard__stats">
                {statRows.map((stat, i) => (
                    <div key={i} className={`stat-card animate-in animate-in-delay-${i + 1}`}>
                        <div className={`stat-card__icon stat-card__icon--${stat.variant}`}>{stat.icon}</div>
                        <div className="stat-card__info">
                            <span className="stat-card__value">{stat.value}</span>
                            <span className="stat-card__label">{stat.label}</span>
                            <span className={`stat-card__trend stat-card__trend--${stat.trendDir}`}>{stat.trend}</span>
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
        </div>
    );
}
