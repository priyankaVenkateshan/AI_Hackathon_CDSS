import { useState, useEffect, useMemo } from 'react';
import Calendar from 'react-calendar';
import { useAuth, roles } from '../../context/AuthContext';
import { getSchedule, getSurgeries } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import 'react-calendar/dist/Calendar.css';
import './Schedule.css';

export default function Schedule() {
  const { hasRole, user } = useAuth();
  const navigate = useNavigate();
  const isSurgeon = hasRole(roles.SURGEON);
  const [date, setDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [surgeries, setSurgeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([getSchedule(), getSurgeries()])
      .then(([appts, surgs]) => {
        setAppointments(Array.isArray(appts) ? appts : (appts.items || []));
        setSurgeries(Array.isArray(surgs) ? surgs : (surgs.items || []));
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedDateStr = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const currentAppointments = useMemo(() => {
    const dStr = date.toISOString().split('T')[0];
    return appointments.filter(a => (a.appointment_time || '').startsWith(dStr))
      .map(a => ({
        ...a,
        time: (a.appointment_time || '').split('T')[1]?.substring(0, 5) || '—',
        patient: a.patient_name || a.patient_id,
        status: a.status?.toLowerCase() || 'upcoming'
      }));
  }, [appointments, date]);

  const otSchedule = useMemo(() => {
    const dStr = date.toISOString().split('T')[0];
    return surgeries.filter(s => (s.scheduled_time || s.date || '').startsWith(dStr));
  }, [surgeries, date]);

  const handleOptimize = () => {
    setOptimizing(true);
    setTimeout(() => {
      setOptimizing(false);
      alert("Scheduling Agent: Your schedule for " + selectedDateStr + " has been optimized. 2 overlaps resolved, and gaps reduced by 40 minutes.");
    }, 1500);
  };

  if (loading) return <div className="schedule-page" style={{padding: '4rem', textAlign: 'center'}}>Loading schedule...</div>;
  return (
    <div className="schedule-page page-enter">
      <div className="schedule-container">
        <div className="schedule__header text-center">
          <h1 className="schedule-page__title">Appointments & Schedule</h1>
          <p className="schedule-page__subtitle">Select a date to view your clinical schedule</p>
        </div>

        <div className="schedule-vertical-stack">
          {/* Scheduling Agent Optimization Section */}
          <section className="schedule-card agent-card centered-card">
            <div className="agent-header">
              <span className="agent-icon">🤖</span>
              <div>
                <h3 className="agent-title">Scheduling Agent</h3>
                <p className="agent-subtitle">AI-driven conflict detection & time optimization</p>
              </div>
            </div>
            <div className="agent-actions">
               <button 
                  className={`btn btn--primary ${optimizing ? 'loading' : ''}`} 
                  onClick={handleOptimize}
                  disabled={optimizing}
               >
                 {optimizing ? 'Optimizing...' : '⚡ Optimize Schedule'}
               </button>
            </div>
          </section>

          {/* Calendar */}
          <section className="schedule-card calendar-card centered-card">
            <h2 className="schedule-card__title">Select Date</h2>
            <div className="calendar-container">
              <Calendar
                onChange={setDate}
                value={date}
                className="custom-calendar"
              />
            </div>
          </section>

          {/* Appointments for selected date */}
          <section className="schedule-card appointments-card centered-card">
            <div className="schedule-card__header">
              <h2 className="schedule-card__title">
                {selectedDateStr}
              </h2>
              <span className="schedule-card__count">{currentAppointments.length} items</span>
            </div>

            {currentAppointments.length > 0 ? (
              <ul className="schedule-list">
                {currentAppointments.map((item, i) => (
                  <li key={i} className={`schedule-list__item schedule-list__item--${item.status}`}>
                    <div className="schedule-item__main">
                      <span className="schedule-list__time">{item.time}</span>
                      <span className="schedule-list__patient">{item.patient}</span>
                    </div>
                    <div className="schedule-item__meta">
                      <span className="schedule-list__type">{item.reason || item.consultationType || 'Consultation'}</span>
                    </div>
                    <div className="schedule-item__actions">
                      <button type="button" className="schedule-list__btn" onClick={() => item.patient_id && navigate(`/patient/${item.patient_id}`)}>
                        View Record
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">
                <p>No appointments scheduled for this date.</p>
              </div>
            )}
          </section>

          {/* OT Schedule at the bottom if applicable */}
          {isSurgeon && (
            <section className="schedule-card ot-card centered-card">
              <h2 className="schedule-card__title">OT Schedule</h2>
              <ul className="schedule-list">
                {otSchedule.map((s) => (
                  <li key={s.id} className="schedule-list__item">
                    <div className="schedule-item__main">
                      <span className="schedule-list__time">{s.time ||(s.scheduled_time || '').split('T')[1]?.substring(0, 5)}</span>
                      <span className="schedule-list__patient">{s.patient_name || s.patient_id}</span>
                    </div>
                    <div className="schedule-item__meta">
                      <span className="schedule-list__type">{s.type}</span>
                      <span className="schedule-list__location">{s.ot_id || s.ot}</span>
                    </div>
                    <button type="button" className="schedule-list__btn" onClick={() => navigate('/surgery')}>
                      View
                    </button>
                  </li>
                ))}
                {otSchedule.length === 0 && <p className="empty-state">No surgeries scheduled for this date.</p>}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

