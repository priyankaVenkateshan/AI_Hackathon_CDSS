import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { patients } from '../../data/mockData';
import './Medications.css';

const OPERATIONAL_ALERTS = [
  { id: 1, title: 'Doctor absent', detail: 'You are assigned to manage 6 additional patients.', type: 'Staffing', time: '08:10', action: 'View' },
  { id: 2, title: 'Emergency admission assigned', detail: 'New emergency admission assigned to you.', type: 'Emergency', time: '08:45', action: 'View' },
  { id: 3, title: 'OT rescheduled', detail: 'Knee reconstruction moved to 4:30 PM, OT-3.', type: 'Shift', time: '09:05', action: 'View' },
  { id: 4, title: 'ICU consult requested', detail: 'ICU consult requested for Ward 5 patient.', type: 'Emergency', time: '09:15', action: 'Acknowledge' },
  { id: 5, title: 'Shift extended by 2 hours', detail: 'Overtime approved. Shift end 8:00 PM.', type: 'Shift', time: '09:30', action: 'View' },
  { id: 6, title: 'Nurse escalation', detail: 'Escalation request from Ward 3 (pain management).', type: 'Escalation', time: '09:45', action: 'Acknowledge' },
];

const SUMMARY_CARDS = [
  { label: 'Patients Assigned Today', value: 14, updated: '5' },
  { label: 'Critical Cases', value: 2, updated: '2' },
  { label: 'Pending Notes', value: 5, updated: '3' },
  { label: 'Surgeries / Procedures Today', value: 3, updated: '1' },
];

function SummaryCard({ label, value, updated }) {
  return (
    <div className="cw-card cw-summary-card">
      <span className="cw-summary-card__dot" aria-hidden />
      <div className="cw-summary-card__value">{value}</div>
      <div className="cw-summary-card__label">{label}</div>
      <div className="cw-summary-card__updated">Updated {updated} mins ago</div>
    </div>
  );
}

function OperationalAlert({ title, detail, type, time, action }) {
  return (
    <div className={`cw-alert cw-alert--${type.toLowerCase()}`}>
      <div className="cw-alert__head">
        <span className="cw-alert__title">{title}</span>
        <span className="cw-alert__type">{type}</span>
      </div>
      <p className="cw-alert__detail">{detail}</p>
      <div className="cw-alert__foot">
        <span className="cw-alert__time">{time}</span>
        <button type="button" className="cw-btn cw-btn--sm">{action}</button>
      </div>
    </div>
  );
}

export default function Medications() {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('priority'); // priority | name

  const todayPatients = useMemo(() => {
    const list = patients.filter((p) => p.status !== 'scheduled').map((p) => ({
      ...p,
      priority: (p.severity || 'moderate').toLowerCase() === 'critical' ? 'High' : (p.severity || 'moderate').toLowerCase() === 'high' ? 'High' : (p.severity || 'moderate').toLowerCase() === 'moderate' ? 'Medium' : 'Low',
    }));
    if (sortBy === 'priority') {
      const order = { High: 0, Medium: 1, Low: 2 };
      return [...list].sort((a, b) => order[a.priority] - order[b.priority]);
    }
    return [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [sortBy]);

  const priorityClass = (p) => (p === 'High' ? 'high' : p === 'Medium' ? 'medium' : 'low');

  return (
    <div className="cw-page page-enter">
      <div className="cw-breadcrumb">Doctor Portal / Dashboard / Clinical Workboard</div>
      <h1 className="cw-title">Clinical Workboard</h1>
      <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#059669', fontWeight: 600 }}>✓ Refreshed — Pending Tasks &amp; Schedule sections removed</p>

      <div className="cw-grid">
        {/* 1. Top Summary Strip */}
        <section className="cw-section cw-summary-strip">
          {SUMMARY_CARDS.map((card) => (
            <SummaryCard key={card.label} label={card.label} value={card.value} updated={card.updated} />
          ))}
        </section>

        {/* 2. Primary Work Area - Left 70% */}
        <section className="cw-main">
          {/* A. Today's Patient List */}
          <div className="cw-card cw-patients-card">
            <h2 className="cw-card__title">Today's Patient List</h2>
            <div className="cw-table-wrap">
              <table className="cw-table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Age / Gender</th>
                    <th>Room / OPD</th>
                    <th>Diagnosis</th>
                    <th>
                      <button
                        type="button"
                        className="cw-sort-btn"
                        onClick={() => setSortBy(sortBy === 'priority' ? 'name' : 'priority')}
                      >
                        Priority {sortBy === 'priority' ? '▼' : '▲'}
                      </button>
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {todayPatients.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.age != null ? `${p.age}` : '—'} / {(p.gender || '—').slice(0, 1)}</td>
                      <td>{p.ward || 'OPD'}</td>
                      <td>{(Array.isArray(p.conditions) ? p.conditions : [p.conditions]).filter(Boolean).slice(0, 2).join(', ') || '—'}</td>
                      <td>
                        <span className={`cw-priority cw-priority--${priorityClass(p.priority)}`}>{p.priority}</span>
                      </td>
                      <td>
                        <button type="button" className="cw-btn cw-btn--view" onClick={() => navigate(`/patient/${p.id}`)}>View Case</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Right 30% - Operational Alert Center */}
        <aside className="cw-sidebar">
          <div className="cw-card cw-alerts-card">
            <h2 className="cw-card__title">Operational Alert Center</h2>
            <div className="cw-alerts-list">
              {OPERATIONAL_ALERTS.map((a) => (
                <OperationalAlert
                  key={a.id}
                  title={a.title}
                  detail={a.detail}
                  type={a.type}
                  time={a.time}
                  action={a.action}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
