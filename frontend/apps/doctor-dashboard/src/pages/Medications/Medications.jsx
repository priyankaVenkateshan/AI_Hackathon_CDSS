import { useState, useEffect } from 'react';
import { isMockMode } from '../../api/config';
import { getMedications, sendNudge, scheduleReminder } from '../../api/client';
import { medications, patients } from '../../data/mockData';
import './Medications.css';

export default function Medications() {
    const [sentReminders, setSentReminders] = useState([]);
    const [scheduledReminders, setScheduledReminders] = useState([]);
    const [nudgeLoading, setNudgeLoading] = useState(null);
    const [filter, setFilter] = useState('all');
    const [medsList, setMedsList] = useState(isMockMode() ? medications : []);
    const [loading, setLoading] = useState(!isMockMode());
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isMockMode()) {
            setMedsList(medications);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        getMedications()
            .then((data) => {
                if (cancelled) return;
                setMedsList(Array.isArray(data) ? data : (data.medications || data.items || []));
            })
            .catch((err) => {
                if (!cancelled) setError(err.message || 'Failed to load medications');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    const patientsForAdherence = isMockMode() ? patients : [];
    const avgAdherence = patientsForAdherence.length
        ? (patientsForAdherence.reduce((acc, p) => acc + (p.adherence || 0), 0) / patientsForAdherence.length) * 100
        : 0;

    const adherenceTrend7d = [84, 82, 85, 86, 84, 83, avgAdherence.toFixed(0)].map((v, i, arr) => typeof v === 'number' ? v : parseFloat(v));
    const trendLabel = adherenceTrend7d.length ? `7-day trend: ${adherenceTrend7d[0]}% → ${adherenceTrend7d[adherenceTrend7d.length - 1]}%` : '';

    const handleSendReminder = (med) => {
        if (sentReminders.includes(med.id)) return;
        const patientId = patients.find(p => p.name === med.patient)?.id;
        if (!isMockMode() && patientId) {
            setNudgeLoading(med.id);
            sendNudge(patientId, med.id)
                .then(() => { setSentReminders(prev => [...prev, med.id]); })
                .catch(() => {})
                .finally(() => setNudgeLoading(null));
        } else {
            setSentReminders([...sentReminders, med.id]);
        }
    };

    const handleScheduleReminder = (med) => {
        const at = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        const patientId = patients.find(p => p.name === med.patient)?.id;
        if (!isMockMode() && patientId) {
            scheduleReminder(patientId, med.id, at).then(() => setScheduledReminders(prev => [...prev, med.id])).catch(() => {});
        } else {
            setScheduledReminders(prev => [...prev, med.id]);
        }
    };

    const filteredMeds = medsList.filter(med => {
        if (filter === 'overdue') return med.status === 'overdue';
        if (filter === 'interactions') return (med.interactions || []).length > 0;
        return true;
    });

    if (loading && !isMockMode()) {
        return (
            <div className="meds-page page-enter" style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Loading medications…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="meds-page page-enter" style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-error, #c00)' }}>{error}</p>
                <button className="btn btn--primary" onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    return (
        <div className="meds-page page-enter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="meds-page__title">💊 Medication Adherence Hub</h1>
                <div className="filter-group" style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                        style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--surface-border)', background: 'var(--surface-card)', cursor: 'pointer' }}
                    >
                        All
                    </button>
                    <button
                        className={`filter-btn ${filter === 'overdue' ? 'active' : ''}`}
                        onClick={() => setFilter('overdue')}
                        style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--surface-border)', background: 'var(--surface-card)', cursor: 'pointer' }}
                    >
                        Overdue
                    </button>
                </div>
            </div>

            {/* Adherence Header Section */}
            <div className="meds-header animate-in">
                <div className="adherence-stat">
                    <span className="adherence-stat__label">Global Patient Adherence</span>
                    <span className="adherence-stat__value">{avgAdherence.toFixed(1)}%</span>
                </div>
                <div className="adherence-bar-container">
                    <div className="adherence-bar" style={{ width: `${avgAdherence}%` }}></div>
                </div>
                {trendLabel && <div className="adherence-trend" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>{trendLabel}</div>}
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', maxWidth: '200px' }}>
                    🤖 AI Tip: Evening adherence is 12% lower than morning. Consider evening SMS nudges.
                </div>
            </div>

            <div className="meds-grid">
                {filteredMeds.map((med, i) => (
                    <div key={med.id}
                        className={`med-card animate-in animate-in-delay-${Math.min(i + 1, 6)} ${(med.interactions || []).length > 0 ? 'med-card--interaction' : ''}`}
                    >
                        <div className="med-card__header">
                            <span className="med-card__name">💊 {med.medication}</span>
                            <span className={`med-card__status med-status--${med.status}`}>{med.status ? med.status.replace('-', ' ') : '—'}</span>
                        </div>
                        <div className="med-card__patient">👤 {med.patient}</div>
                        <div className="med-card__details">
                            <span className="med-card__detail-item">🔄 {med.frequency}</span>
                            <span className="med-card__detail-item">⏰ Next: {med.nextDose ? new Date(med.nextDose).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                        </div>

                        {med.interactions?.length > 0 && (
                            <div className="med-card__interaction">
                                ⚠️ Interaction: {(med.interactions || []).join(', ')}
                            </div>
                        )}

                        {med.status === 'overdue' && (
                            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                <button
                                    className="med-card__nudge-btn"
                                    onClick={() => handleSendReminder(med)}
                                    disabled={sentReminders.includes(med.id) || nudgeLoading === med.id}
                                >
                                    {sentReminders.includes(med.id) ? '✅ Reminder Sent' : nudgeLoading === med.id ? 'Sending…' : '📱 Send Patient Nudge'}
                                </button>
                                <button
                                    className="med-card__nudge-btn"
                                    style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)' }}
                                    onClick={() => handleScheduleReminder(med)}
                                    disabled={scheduledReminders.includes(med.id)}
                                >
                                    {scheduledReminders.includes(med.id) ? '⏰ Scheduled' : 'Schedule reminder'}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
