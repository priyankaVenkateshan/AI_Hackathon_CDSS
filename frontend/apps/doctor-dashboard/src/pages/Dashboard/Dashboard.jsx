import { useEffect, useState } from 'react';
import { getDashboard } from '../../api/client';
import { useActivity } from '../../context/ActivityContext';
import './Dashboard.css';

// SVG Sparkline Component
const Sparkline = ({ data, color, height = 60, width = 200 }) => {
  if (!data || data.length < 2) return null;
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logActivity('view_dashboard_integrated');
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, [logActivity]);

  const fetchDashboardData = async () => {
    try {
      const result = await getDashboard();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Loading clinical dashboard...</p>
      </div>
    );
  }

  const stats = data || {
    totalPatients: 0,
    patientsAttended: 0,
    todayAppointments: 0,
    surgeriesScheduled: 0,
    stats_trends: { patients: [], attended: [], appointments: [], surgeries: [] },
    patient_queue: [],
    ai_alerts: []
  };

  return (
    <div className="dashboard-redesign page-enter">
      <div className="dashboard__container">

        {/* Stat Cards Section */}
        <section className="dashboard__stats-grid">
          <div className="stat-card">
            <div className="stat-card__main">
              <span className="stat-card__label">Total Patients</span>
              <h2 className="stat-card__value">{stats.totalPatients}</h2>
            </div>
            <div className="stat-card__meta">
              <span className="stat-card__trend positive">▲ Current Count</span>
              <Sparkline data={stats.stats_trends.patients} color="#48bb78" />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__main">
              <span className="stat-card__label">Patients Attended</span>
              <h2 className="stat-card__value">{stats.patientsAttended}</h2>
            </div>
            <div className="stat-card__meta">
              <span className="stat-card__trend positive">▲ Today</span>
              <Sparkline data={stats.stats_trends.attended} color="#38bdf8" />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__main">
              <span className="stat-card__label">Today's Appointment</span>
              <h2 className="stat-card__value">{stats.todayAppointments}</h2>
            </div>
            <div className="stat-card__meta">
              <span className="stat-card__trend info">● Scheduled</span>
              <Sparkline data={stats.stats_trends.appointments} color="#f56565" />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__main">
              <span className="stat-card__label">Surgery Schedules</span>
              <h2 className="stat-card__value">{stats.surgeriesScheduled}</h2>
            </div>
            <div className="stat-card__meta">
              <span className="stat-card__trend positive">● OT Active</span>
              <Sparkline data={stats.stats_trends.surgeries} color="#818cf8" />
            </div>
          </div>
        </section>

        {/* Live Patient Queue Section */}
        <div className="dashboard__main-content">
          <section className="dashboard__queue">
            <div className="activity-card">
              <div className="activity-card__header">
                <h3 className="activity-card__title">Live Patient Queue</h3>
                <div className="activity-card__controls">
                  <span className="live-indicator">LIVE</span>
                </div>
              </div>

              <div className="tasks-list">
                {stats.patient_queue.length > 0 ? (
                  stats.patient_queue.map((patient) => (
                    <div key={patient.id} className="task-item">
                      <div className="task-item__main">
                        <div className={`task-badge ${patient.severity.toLowerCase()}`}>
                          {patient.severity}
                        </div>
                        <div className="task-content">
                          <span className="task-type">{patient.name}</span>
                          <span className="task-patient">ID: {patient.id} | Status: {patient.status}</span>
                        </div>
                      </div>
                      <div className="task-vitals-mini">
                         <span>HR: {patient.vitals.hr || '—'}</span>
                         <span>SpO2: {patient.vitals.spo2 || '—'}%</span>
                      </div>
                      <button className="task-action-btn" onClick={() => window.location.href=`/patients/${patient.id}`}>Consult</button>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No patients in queue</div>
                )}
              </div>
            </div>
          </section>

          {/* AI Alerts Sidebar */}
          <section className="dashboard__alerts">
            <div className="activity-card alerts-card">
              <div className="activity-card__header">
                <h3 className="activity-card__title">AI Clinical Alerts</h3>
              </div>
              <div className="alerts-list">
                {stats.ai_alerts.map((alert) => (
                  <div key={alert.id} className={`alert-item ${alert.severity}`}>
                    <div className="alert-icon">⚠️</div>
                    <div className="alert-body">
                      <p className="alert-message">{alert.message}</p>
                      <span className="alert-time">{alert.time}</span>
                    </div>
                  </div>
                ))}
                {stats.ai_alerts.length === 0 && <p className="empty-text">No active clinical alerts.</p>}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
