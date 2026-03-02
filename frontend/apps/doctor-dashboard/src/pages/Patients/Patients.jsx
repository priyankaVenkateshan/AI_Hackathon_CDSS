import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isMockMode } from '../../api/config';
import { getPatients } from '../../api/client';
import { patients } from '../../data/mockData';
import './Patients.css';

const getInitials = (name) => name.split(' ').map(n => n[0]).join('');

const filters = ['All', 'Critical', 'High', 'Moderate', 'Low'];

export default function Patients() {
    const [activeFilter, setActiveFilter] = useState('All');
    const [list, setList] = useState(isMockMode() ? patients : []);
    const [loading, setLoading] = useState(!isMockMode());
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isMockMode()) {
            setList(patients);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        getPatients()
            .then((data) => {
                if (cancelled) return;
                setList(Array.isArray(data) ? data : (data.patients || data.items || []));
            })
            .catch((err) => {
                if (!cancelled) setError(err.message || 'Failed to load patients');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    const filtered = activeFilter === 'All'
        ? list
        : list.filter(p => (p.severity || '').toLowerCase() === activeFilter.toLowerCase());

    if (loading && !isMockMode()) {
        return (
            <div className="patients-page page-enter" style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Loading patients…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="patients-page page-enter" style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-error, #c00)' }}>{error}</p>
                <button className="btn btn--primary" onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    return (
        <div className="patients-page page-enter">
            <div className="patients-page__header">
                <h1 className="patients-page__title">👥 Patients</h1>
                <div className="patients-page__filters">
                    {filters.map(f => (
                        <button
                            key={f}
                            className={`filter-btn ${activeFilter === f ? 'active' : ''}`}
                            onClick={() => setActiveFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="patients-table animate-in">
                <table>
                    <thead>
                        <tr>
                            <th>Patient</th>
                            <th>Age / Gender</th>
                            <th>Ward</th>
                            <th>Conditions</th>
                            <th>Vitals</th>
                            <th>Severity</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((p, i) => (
                            <tr key={p.id} className={`animate-in animate-in-delay-${Math.min(i + 1, 6)}`} onClick={() => navigate(`/patient/${p.id}`)}>
                                <td>
                                    <div className="patient-name-cell">
                                        <div className={`patient-name-cell__avatar queue-item__avatar--${(p.gender || 'male').toLowerCase()}`}>
                                            {getInitials(p.name)}
                                        </div>
                                        <div className="patient-name-cell__text">
                                            <span className="patient-name-cell__name">{p.name}</span>
                                            <span className="patient-name-cell__id">{p.id}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>{p.age != null ? `${p.age}y` : '—'} / {(p.gender || 'M')[0]}</td>
                                <td>{p.ward || '—'}</td>
                                <td>{Array.isArray(p.conditions) ? p.conditions.join(', ') : (p.conditions || '—')}</td>
                                <td>
                                    <span className="mono" style={{ fontSize: 'var(--text-xs)' }}>
                                        HR:{p.vitals?.hr ?? '—'} BP:{p.vitals?.bp ?? '—'} O₂:{p.vitals?.spo2 ?? '—'}%
                                    </span>
                                </td>
                                <td>
                                    <span className={`queue-item__severity severity--${(p.severity || 'moderate').toLowerCase()}`}>{p.severity || '—'}</span>
                                </td>
                                <td>
                                    <span className={`schedule-item__status status--${p.status === 'in-consultation' ? 'in-progress' : p.status === 'waiting' ? 'upcoming' : 'completed'}`}>
                                        {(p.status || '—').replace('-', ' ')}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
