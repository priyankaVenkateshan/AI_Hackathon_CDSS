import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
    const fromPatient = location.state?.patientId && location.state?.patientName;
    const [list, setList] = useState(isMockMode() ? surgeries : []);
    const [loading, setLoading] = useState(!isMockMode());
    const [error, setError] = useState(null);

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
            <h1 className="surgery-page__title">🔪 Surgery Queue</h1>

            {fromPatient && (
                <div className="surgery-new-card" style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-4)', background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-lg)' }}>
                    <strong>New surgery requested for {location.state.patientName}</strong>
                    <p style={{ margin: 'var(--space-2) 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Create a surgery and open the planning flow to pick an OT slot.</p>
                    <button
                        className="btn btn--primary"
                        onClick={() => navigate('/surgery-planning/new', { state: { patientId: location.state.patientId, patientName: location.state.patientName }, replace: true })}
                    >
                        Create surgery & plan
                    </button>
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
                                    {(surgery.status === 'scheduled' || surgery.status === 'in-prep') && (
                                        <button
                                            className="surgery-card__plan-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/surgery-planning/${surgery.id}`);
                                            }}
                                        >
                                            Plan Procedure
                                        </button>
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
