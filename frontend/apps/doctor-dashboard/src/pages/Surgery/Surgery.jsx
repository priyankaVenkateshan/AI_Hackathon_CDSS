import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, roles } from '../../context/AuthContext';
import { isMockMode } from '../../api/config';
import { getSurgeries } from '../../api/client';
import { surgeries } from '../../data/mockData';
import './Surgery.css';

const columns = [
    { key: 'scheduled', label: 'Scheduled', variant: 'scheduled' },
    { key: 'in-prep', label: 'In Preparation', variant: 'in-prep' },
    { key: 'pre-op', label: 'Pre-Op Assessment', variant: 'pre-op' },
];

export default function Surgery() {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasRole } = useAuth();
    const isSurgeon = hasRole(roles.SURGEON);
    const fromPatient = location.state?.patientId && location.state?.patientName;
    const [list, setList] = useState(isMockMode() ? surgeries : []);
    const [loading, setLoading] = useState(!isMockMode());
    const [error, setError] = useState(null);
    const [replacementFor, setReplacementFor] = useState(null);
    const [replacementNotified, setReplacementNotified] = useState(false);

    const mockReplacements = [
        { id: 'DR-ALT-1', name: 'Dr. Suresh Reddy', specialty: 'General Surgery', status: 'available' },
        { id: 'DR-ALT-2', name: 'Dr. Priya Sharma', specialty: 'General', status: 'available' },
    ];

    useEffect(() => {
        if (isMockMode()) {
            setList(surgeries);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        getSurgeries()
            .then((data) => {
                if (cancelled) return;
                setList(Array.isArray(data) ? data : (data.surgeries || data.items || []));
            })
            .catch((err) => {
                if (!cancelled) setError(err.message || 'Failed to load surgeries');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    if (loading && !isMockMode()) {
        return (
            <div className="surgery-page page-enter" style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Loading surgery queue…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="surgery-page page-enter" style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-error, #c00)' }}>{error}</p>
                <button className="btn btn--primary" onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    return (
        <div className="surgery-page page-enter">
            <h1 className="surgery-page__title">🔪 Surgeries</h1>
            <p className="surgery-page__desc">
                {isSurgeon ? 'Surgical schedule, OT assignment, and complication simulation.' : 'View surgical schedule. Pre-op planning and OT assignment are available to surgeons.'}
            </p>

            {!isSurgeon && (
                <div className="surgery-page__role-note" style={{ padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', color: '#1e40af' }}>
                    You are viewing the surgical schedule. For consultation workflow and patient tasks, use <button type="button" className="link-btn" onClick={() => navigate('/patients')} style={{ background: 'none', border: 'none', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>Patients</button> or <button type="button" className="link-btn" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>Dashboard</button>.
                </div>
            )}

            {/* Surgical Schedule Table */}
            <div className="surgery-schedule-table-wrap">
                <h2 className="surgery-section-title">Surgical Schedule Table</h2>
                <table className="surgery-schedule-table">
                    <thead>
                        <tr>
                            <th>Surgery name</th>
                            <th>Date / Time</th>
                            <th>Surgeon</th>
                            <th>OT assignment</th>
                            <th>Team</th>
                            <th>Duration</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((s) => (
                            <tr key={s.id} onClick={() => isSurgeon && navigate(`/surgery-planning/${s.id}`)}>
                                <td>{s.type}</td>
                                <td>{s.date} {s.time}</td>
                                <td>{s.surgeon || '—'}</td>
                                <td>{s.ot || '—'}</td>
                                <td>Team —</td>
                                <td>{s.estimatedDuration || '—'}</td>
                                <td><span className={`surgery-status-tag surgery-status-tag--${(s.status || '').replace('-', '_')}`}>{s.status === 'in-prep' ? 'In Progress' : s.status === 'pre-op' ? 'Pre-Op Assessment' : (s.status || 'Scheduled')}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Complication Simulator - Surgeon only */}
            {isSurgeon && (
            <div className="surgery-complication-simulator">
                <h2 className="surgery-section-title">Complication Simulator (Edge Case)</h2>
                <div className="complication-simulator__card">
                    <div className="complication-simulator__row">
                        <span className="complication-simulator__label">Complication Type</span>
                        <span className="complication-simulator__value">Intraoperative findings — unexpected bleeding</span>
                    </div>
                    <div className="complication-simulator__row">
                        <span className="complication-simulator__label">AI Suggested Intervention</span>
                        <span className="complication-simulator__value">Real-time surgical guidance: Apply pressure, consider vessel ligation; check coagulation panel.</span>
                    </div>
                    <div className="complication-simulator__row">
                        <span className="complication-simulator__label">Immediate Actions</span>
                        <ol className="complication-simulator__actions">
                            <li>Maintain hemodynamics; request blood products if needed.</li>
                            <li>Identify source; consider intra-op imaging.</li>
                            <li>Follow emergency protocol for hemorrhage control.</li>
                        </ol>
                    </div>
                </div>
            </div>
            )}

            {replacementFor && (
                <div className="surgery-replacement-panel" style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-4)', background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>Find replacement — {replacementFor.type} ({replacementFor.id})</h3>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                        Current: {replacementFor.surgeon}. Qualified replacements (Scheduling Agent):
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, marginBottom: 'var(--space-3)' }}>
                        {mockReplacements.map((r) => (
                            <li key={r.id} style={{ padding: 'var(--space-2)', background: 'var(--surface-bg)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)' }}>
                                {r.name} — {r.specialty} ({r.status})
                            </li>
                        ))}
                    </ul>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button
                            className="btn btn--primary"
                            onClick={() => { setReplacementNotified(true); setTimeout(() => { setReplacementFor(null); setReplacementNotified(false); }, 2000); }}
                            disabled={replacementNotified}
                        >
                            {replacementNotified ? 'Notified ✓' : 'Notify replacement & team'}
                        </button>
                        <button className="btn btn--outline" onClick={() => setReplacementFor(null)}>Cancel</button>
                    </div>
                </div>
            )}

            {fromPatient && (
                <div className="surgery-new-card" style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-4)', background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-lg)' }}>
                    <strong>New surgery requested for {location.state.patientName}</strong>
                    <p style={{ margin: 'var(--space-2) 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Create a surgery and open the planning flow to pick an OT slot.</p>
                    {isSurgeon && (
                    <button
                        className="btn btn--primary"
                        onClick={() => navigate('/surgery-planning/new', { state: { patientId: location.state.patientId, patientName: location.state.patientName }, replace: true })}
                    >
                        Create surgery & plan
                    </button>
                    )}
                </div>
            )}

            <div className="surgery-board">
                {columns.map((col, ci) => {
                    const items = list.filter(s => s.status === col.key);
                    return (
                        <div key={col.key} className={`surgery-column animate-in animate-in-delay-${ci + 1}`}>
                            <div className="surgery-column__header">
                                <div className={`surgery-column__dot surgery-column__dot--${col.variant}`} />
                                <span className="surgery-column__title">{col.label}</span>
                                <span className="surgery-column__count">{items.length}</span>
                            </div>
                            {items.map((surgery, i) => (
                                <div key={surgery.id} className={`surgery-card animate-in animate-in-delay-${i + 2}`}>
                                    <div className="surgery-card__id">{surgery.id}</div>
                                    <div className="surgery-card__type">{surgery.type}</div>
                                    <div className="surgery-card__patient">👤 {surgery.patient}</div>
                                    <div className="surgery-card__meta">
                                        <span className="surgery-card__meta-item">🏥 {surgery.ot || '—'}</span>
                                        <span className="surgery-card__meta-item">📅 {surgery.date || '—'}</span>
                                        <span className="surgery-card__meta-item">⏰ {surgery.time || '—'}</span>
                                    </div>
                                    <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                        🩺 {surgery.surgeon || '—'}
                                    </div>
                                    {(surgery.status === 'scheduled' || surgery.status === 'in-prep') && isSurgeon && (
                                        <>
                                            <button
                                                className="surgery-card__plan-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/surgery-planning/${surgery.id}`);
                                                }}
                                            >
                                                Plan Procedure
                                            </button>
                                            <button
                                                className="surgery-card__plan-btn"
                                                style={{ marginTop: 'var(--space-1)', background: 'var(--surface-card)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setReplacementFor(surgery);
                                                }}
                                            >
                                                Doctor unavailable? Find replacement
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}
                            {items.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                                    No surgeries
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
