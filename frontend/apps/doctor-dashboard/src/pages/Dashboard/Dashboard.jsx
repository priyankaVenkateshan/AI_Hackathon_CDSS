import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patients, todaySchedule, pendingClinicalTasks, clinicalAlerts } from '../../data/mockData';
import { useActivity } from '../../context/ActivityContext';
import { useAuth } from '../../context/AuthContext';
import { roles } from '../../context/AuthContext';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const { logActivity } = useActivity();
  const { user, hasRole } = useAuth();
  const isSurgeon = hasRole(roles.SURGEON);

  useEffect(() => {
    logActivity('view_dashboard');
  }, [logActivity]);

  const tasksToShow = pendingClinicalTasks.filter((t) => !t.surgeonOnly || isSurgeon);

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

  const priorityClass = (p) => {
    const s = (p || '').toLowerCase();
    if (s === 'high') return 'high';
    if (s === 'medium') return 'medium';
    return 'low';
  };

  const scheduleTypeClass = (type) => {
    if (type === 'Consultation') return 'consultation';
    if (type === 'Follow-up') return 'followup';
    if (type === 'Surgery') return 'surgery';
    return 'consultation';
  };

  return (
    <div className="dash page-enter">
      <div className="dash__grid">
        {/* ─── Top Section: 2-column responsive ─── */}
        <section className="dash__top dash__top--left">
          <div className="dash-card">
            <h2 className="dash-card__title">Pending Clinical Tasks</h2>
            <ul className="dash-tasks">
              {tasksToShow.map((task) => (
                <li key={task.id} className="dash-tasks__item">
                  <div className="dash-tasks__main">
                    <span className="dash-tasks__patient">{task.patientName}</span>
                    <span className="dash-tasks__type">{task.taskType}</span>
                    <span className={`dash-tasks__priority dash-tasks__priority--${priorityClass(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="dash-tasks__action"
                    onClick={() => navigate('/patients')}
                  >
                    Quick Action
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="dash__top dash__top--right">
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

        {/* ─── Row 2: Patient Overview Summary + Recent Alerts ─── */}
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

        <section className="dash__row2 dash__alerts">
          <div className="dash-card">
            <h2 className="dash-card__title">Recent Alerts</h2>
            <p className="dash-alerts__note">Clinical alerts only</p>
            <ul className="dash-alerts-list">
              {clinicalAlerts.slice(0, 5).map((a) => (
                <li key={a.id} className={`dash-alert dash-alert--${a.type}`}>
                  <div className="dash-alert__head">
                    <span className="dash-alert__title">{a.title}</span>
                    <span className="dash-alert__time">{a.time}</span>
                  </div>
                  <p className="dash-alert__message">{a.message}</p>
                  {a.patient && a.patient !== '—' && (
                    <button
                      type="button"
                      className="dash-alert__action"
                      onClick={() => navigate('/patients')}
                    >
                      View
                    </button>
                  )}
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
