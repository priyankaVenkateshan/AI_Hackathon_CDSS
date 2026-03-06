import { useEffect, useState } from 'react';
import {
  dashboardOverview,
  pendingClinicalTasks,
} from '../../data/mockData';
import { useActivity } from '../../context/ActivityContext';
import './Dashboard.css';

// SVG Sparkline Component
const Sparkline = ({ data, color, height = 60, width = 200 }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((val, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((val - min) / range) * height
  }));

  const d = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const areaD = `${d} L ${points[points.length - 1].x},${height} L 0,${height} Z`;

  return (
    <svg width={width} height={height} className="sparkline">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#gradient-${color})`} />
      <path d={d} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default function Dashboard() {
  const { logActivity } = useActivity();

  useEffect(() => {
    logActivity('view_dashboard_redesign');
  }, [logActivity]);

  return (
    <div className="dashboard-redesign page-enter">
      <div className="dashboard__container">

        {/* Stat Cards Section */}
        <section className="dashboard__stats-grid">
          <div className="stat-card">
            <div className="stat-card__main">
              <span className="stat-card__label">Total Patients</span>
              <h2 className="stat-card__value">{dashboardOverview.totalPatients}</h2>
            </div>
            <div className="stat-card__meta">
              <span className="stat-card__trend positive">▲ 4.7% last week</span>
              <Sparkline data={dashboardOverview.stats.patients} color="#48bb78" />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__main">
              <span className="stat-card__label">Patients Attended</span>
              <h2 className="stat-card__value">{dashboardOverview.patientsAttended}</h2>
            </div>
            <div className="stat-card__meta">
              <span className="stat-card__trend positive">▲ 12% last week</span>
              <Sparkline data={dashboardOverview.stats.attended} color="#38bdf8" />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__main">
              <span className="stat-card__label">Today's Appointment</span>
              <h2 className="stat-card__value">{dashboardOverview.todayAppointments}</h2>
            </div>
            <div className="stat-card__meta">
              <span className="stat-card__trend negative">▼ 2.4% last week</span>
              <Sparkline data={dashboardOverview.stats.appointments} color="#f56565" />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__main">
              <span className="stat-card__label">Surgery Schedules</span>
              <h2 className="stat-card__value">{dashboardOverview.surgeriesScheduled}</h2>
            </div>
            <div className="stat-card__meta">
              <span className="stat-card__trend positive">▲ 8.2% last week</span>
              <Sparkline data={dashboardOverview.stats.surgeries} color="#818cf8" />
            </div>
          </div>
        </section>

        {/* Doctor's Tasks Section */}
        <section className="dashboard__activity">
          <div className="activity-card">
            <div className="activity-card__header">
              <h3 className="activity-card__title">Doctor's Tasks for the Day</h3>
              <div className="activity-card__controls">
                <span className="current-date">Friday, March 6, 2026</span>
              </div>
            </div>

            <div className="tasks-list">
              {pendingClinicalTasks.map((task) => (
                <div key={task.id} className="task-item">
                  <div className="task-item__main">
                    <div className={`task-badge ${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </div>
                    <div className="task-content">
                      <span className="task-type">{task.taskType}</span>
                      <span className="task-patient">Patient: {task.patientName}</span>
                    </div>
                  </div>
                  <button className="task-action-btn">View Details</button>
                </div>
              ))}
            </div>

            <div className="activity-footer">
              <span className="footer-info">Showing {pendingClinicalTasks.length} pending tasks</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
