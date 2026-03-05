import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patients, todaySchedule, clinicalUpdates } from '../../data/mockData';
import { useActivity } from '../../context/ActivityContext';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const ICON_SIZE = 20;

function ClinicalUpdateIcon({ type, className }) {
  const props = { width: ICON_SIZE, height: ICON_SIZE, className, 'aria-hidden': true };
  switch (type) {
    case 'discharge_pending':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M9 15l2 2 4-4" />
        </svg>
      );
    case 'upcoming_surgery':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M5 4v16M9 4v16M15 4v16M19 4v16M3 8h18M3 16h18" />
        </svg>
      );
    case 'follow_up_reminder':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    default:
      return null;
  }
}

function Dashboard() {
  const navigate = useNavigate();
  const { logActivity } = useActivity();
  useAuth();

  useEffect(() => {
    logActivity('view_dashboard');
  }, [logActivity]);

  const scheduleWithLocation = todaySchedule.map((s) => {
    const type = s.type || 'Consultation';
    let consultationType = 'OP';
    if (type === 'Follow-up' || type === 'Lab Review') consultationType = 'Follow-up';
    if (type === 'Pre-op Check' || type === 'Emergency') consultationType = 'Surgery';
    if (type === 'Consultation') consultationType = 'Consultation';
    return {
      ...s,
      consultationType,
      location: type === 'Pre-op Check' ? 'OT-3' : type === 'Emergency' ? 'ICU' : 'Room 4',
    };
  });

  const myPatients = patients.filter((p) => p.status !== 'scheduled').slice(0, 6);

  const scheduleTypeClass = (type) => {
    if (type === 'Consultation') return 'consultation';
    if (type === 'Follow-up') return 'followup';
    if (type === 'Surgery') return 'surgery';
    return 'consultation';
  };

  return (
    <div className="dash page-enter">
      <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#059669', fontWeight: 600 }}>✓ Dashboard updated — Recent Alerts replaced with Clinical Updates</p>
      <div className="dash__grid">
        {/* ─── Top Section: Today's Schedule (full width) ─── */}
        <section className="dash__top dash__top--full">
          <div className="dash-card">
            <h2 className="dash-card__title">Today&apos;s Schedule</h2>
            <ul className="dash-schedule">
              {scheduleWithLocation.map((item, i) => (
                <li
                  key={i}
                  className={`dash-schedule__item dash-schedule__item--${scheduleTypeClass(item.consultationType)}`}
                >
                  <span className="dash-schedule__time">{item.time}</span>
                  <span className="dash-schedule__patient">{item.patient}</span>
                  <span className="dash-schedule__type">
                    {item.consultationType === 'Consultation' ? 'OP' : item.consultationType === 'Follow-up' ? 'Follow-up' : 'Surgery'}
                  </span>
                  <span className="dash-schedule__location">{item.location}</span>
                  <button
                    type="button"
                    className="dash-schedule__btn"
                    onClick={() => item.patient && item.patient !== 'Walk-in slot' && navigate('/patients')}
                  >
                    View Patient
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─── Row 2: Patient Overview Summary + Clinical Updates ─── */}
        <section className="dash__row2 dash__summary">
          <div className="dash-card dash-card--summary">
            <h2 className="dash-card__title">Patient Overview Summary</h2>
            <div className="dash-summary__content">
              <div className="dash-summary__actions">
                {myPatients.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="dash-summary__btn"
                    onClick={() => navigate(`/patient/${p.id}`)}
                  >
                    <span className="dash-summary__btn-name">{p.name}</span>
                    <span className="dash-summary__btn-meta">{p.ward || '—'} · {(p.severity || '—')}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="dash__row2 dash__updates">
          <div className="dash-card dash-card--updates">
            <h2 className="dash-card__title">Clinical Updates</h2>
            <ul className="dash-updates-list">
              {clinicalUpdates.map((u) => (
                <li key={u.id} className={`dash-update dash-update--${u.priority}`}>
                  <span className="dash-update__icon" aria-hidden>
                    <ClinicalUpdateIcon type={u.type} className="dash-update__icon-svg" />
                  </span>
                  <div className="dash-update__body">
                    <span className="dash-update__title">{u.title}</span>
                    <span className="dash-update__patient">{u.patientName}</span>
                    <p className="dash-update__desc">{u.description}</p>
                    <div className="dash-update__meta">
                      <span className="dash-update__time">{u.time}</span>
                      <button
                        type="button"
                        className="dash-update__btn"
                        onClick={() => navigate('/patients')}
                      >
                        Review
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
