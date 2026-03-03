import { useAuth } from '../../context/AuthContext';
import { todaySchedule, surgeries } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';
import { roles } from '../../context/AuthContext';
import './Schedule.css';

export default function Schedule() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const isSurgeon = hasRole(roles.SURGEON);

  const scheduleWithLocation = todaySchedule.map((s) => ({
    ...s,
    location: s.type === 'Pre-op Check' ? 'OT-3' : 'Room 4',
    consultationType: s.type,
  }));

  const otSchedule = isSurgeon ? surgeries.filter((s) => s.status === 'scheduled' || s.status === 'pre-op') : [];

  return (
    <div className="schedule-page page-enter">
      <h1 className="schedule-page__title">Schedule</h1>
      <div className="schedule-page__grid">
        <section className="schedule-card">
          <h2 className="schedule-card__title">Today&apos;s Schedule</h2>
          <ul className="schedule-list">
            {scheduleWithLocation.map((item, i) => (
              <li key={i} className={`schedule-list__item schedule-list__item--${item.status}`}>
                <span className="schedule-list__time">{item.time}</span>
                <span className="schedule-list__patient">{item.patient}</span>
                <span className="schedule-list__type">{item.consultationType}</span>
                <span className="schedule-list__location">{item.location}</span>
                <button type="button" className="schedule-list__btn" onClick={() => item.patient && navigate('/patients')}>
                  View
                </button>
              </li>
            ))}
          </ul>
        </section>
        {isSurgeon && (
          <section className="schedule-card">
            <h2 className="schedule-card__title">OT Schedule</h2>
            <ul className="schedule-list">
              {otSchedule.map((s) => (
                <li key={s.id} className="schedule-list__item">
                  <span className="schedule-list__time">{s.time}</span>
                  <span className="schedule-list__patient">{s.patient}</span>
                  <span className="schedule-list__type">{s.type}</span>
                  <span className="schedule-list__location">{s.ot}</span>
                  <button type="button" className="schedule-list__btn" onClick={() => navigate('/surgery')}>
                    View
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
