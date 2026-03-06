import { useState } from 'react';
import Calendar from 'react-calendar';
import { useAuth, roles } from '../../context/AuthContext';
import { todaySchedule, surgeries } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';
import 'react-calendar/dist/Calendar.css';
import './Schedule.css';

export default function Schedule() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const isSurgeon = hasRole(roles.SURGEON);
  const [date, setDate] = useState(new Date());

  // Format date for comparison and display
  const selectedDateStr = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const isToday = (someDate) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
      someDate.getMonth() === today.getMonth() &&
      someDate.getFullYear() === today.getFullYear();
  };

  // Helper to get appointments for a specific date
  // In a real app, this would be an API call. Here we simulate it.
  const getAppointmentsForDate = (selectedDate) => {
    // If it's today, return the standard todaySchedule
    if (isToday(selectedDate)) {
      return todaySchedule.map((s) => ({
        ...s,
        location: s.type === 'Pre-op Check' ? 'OT-3' : 'Room 4',
        consultationType: s.type,
      }));
    }

    // For other dates, we return a subset or empty based on the day of the week to simulate variety
    const day = selectedDate.getDay();
    if (day === 0) return []; // Sundays are empty

    // Return a shuffled/subset of today's schedule for other days
    return todaySchedule.slice(0, (day % 4) + 2).map((s, i) => ({
      ...s,
      time: `${9 + i}:00`, // adjust times slightly
      location: 'Room 4',
      consultationType: s.type,
    }));
  };

  const currentAppointments = getAppointmentsForDate(date);
  const otSchedule = isSurgeon ? surgeries.filter((s) => s.status === 'scheduled' || s.status === 'pre-op') : [];

  return (
    <div className="schedule-page page-enter">
      <div className="schedule-container">
        <div className="schedule__header text-center">
          <h1 className="schedule-page__title">Appointments & Schedule</h1>
          <p className="schedule-page__subtitle">Select a date to view your clinical schedule</p>
        </div>

        <div className="schedule-vertical-stack">
          {/* Calendar at the top */}
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
                {isToday(date) ? "Today's Appointments" : `Appointments for ${selectedDateStr}`}
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
                      <span className="schedule-list__type">{item.consultationType}</span>
                      <span className="schedule-list__location">{item.location}</span>
                    </div>
                    <div className="schedule-item__actions">
                      <button type="button" className="schedule-list__btn" onClick={() => item.patient && navigate('/patients')}>
                        View Details
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
                      <span className="schedule-list__time">{s.time}</span>
                      <span className="schedule-list__patient">{s.patient}</span>
                    </div>
                    <div className="schedule-item__meta">
                      <span className="schedule-list__type">{s.type}</span>
                      <span className="schedule-list__location">{s.ot}</span>
                    </div>
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
    </div>
  );
}

