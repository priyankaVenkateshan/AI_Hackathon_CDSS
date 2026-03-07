import { useNavigate } from 'react-router-dom';
import { useAuth, roles } from '../../context/AuthContext';
import {
  dashboardOverview,
  pendingClinicalTasks,
  adminDashboardKpis,
  adminTodayAppointments,
  adminTrendsData,
} from '../../data/mockData';
import './Dashboard.css';

// Shared Sparkline for both dashboards
const Sparkline = ({ data, color, height = 48, width = 140, className = '' }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((val, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((val - min) / range) * height,
  }));
  const d = `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`;
  const areaD = `${d} L ${points[points.length - 1].x},${height} L 0,${height} Z`;
  const gradId = `grad-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width={width} height={height} className={className}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={d} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Doctor Dashboard: Total Patients, Patients Attended, Today's Appointment, Surgery Schedules + Doctor's Tasks
const doctorKpis = [
  { label: 'Total Patients', value: dashboardOverview.totalPatients, delta: '▲ 6.7% last week', trend: 'positive', sparkData: dashboardOverview.stats.patients, color: '#48bb78' },
  { label: 'Patients Attended', value: dashboardOverview.patientsAttended, delta: '▲ 12% last week', trend: 'positive', sparkData: dashboardOverview.stats.attended, color: '#38bdf8' },
  { label: "Today's Appointment", value: dashboardOverview.todayAppointments, delta: '▼ 2.4% last week', trend: 'negative', sparkData: dashboardOverview.stats.appointments, color: '#f56565' },
  { label: 'Surgery Schedules', value: dashboardOverview.surgeriesScheduled, delta: '▲ 6.2% last week', trend: 'positive', sparkData: dashboardOverview.stats.surgeries, color: '#818cf8' },
];

function DoctorDashboard() {
  const navigate = useNavigate();
  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="dashboard-redesign page-enter">
      <div className="dashboard__container">
        <section className="dashboard__stats-grid">
          {doctorKpis.map((kpi) => (
            <div key={kpi.label} className="stat-card">
              <div className="stat-card__main">
                <span className="stat-card__label">{kpi.label}</span>
                <h2 className="stat-card__value">{kpi.value}</h2>
              </div>
              <div className="stat-card__meta">
                <span className={`stat-card__trend ${kpi.trend}`}>{kpi.delta}</span>
                <Sparkline data={kpi.sparkData} color={kpi.color} className="sparkline" />
              </div>
            </div>
          ))}
        </section>

        <section className="dashboard__activity">
          <div className="activity-card">
            <div className="activity-card__header">
              <h3 className="activity-card__title">Doctor&apos;s Tasks for the Day</h3>
              <div className="activity-card__controls">
                <span className="current-date">{dateStr}</span>
              </div>
            </div>
            <div className="tasks-list">
              {pendingClinicalTasks.map((task) => (
                <div key={task.id} className="task-item">
                  <div className="task-item__main">
                    <div className={`task-badge ${task.priority.toLowerCase()}`}>
                      {task.priority.toUpperCase()}
                    </div>
                    <div className="task-content">
                      <span className="task-type">{task.taskType}</span>
                      <span className="task-patient">Patient: {task.patientName}</span>
                    </div>
                  </div>
                  <button type="button" className="task-action-btn" onClick={() => navigate('/patients')}>
                    View Details
                  </button>
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

// Admin Dashboard: KPIs, Trends, Today's Appointments, Quick Actions (unchanged)
const quickActions = [
  { label: 'Add Patient', path: '/patients' },
  { label: 'Schedule Appointment', path: '/appointments' },
  { label: 'Add Doctor', path: '/doctors' },
  { label: 'Generate Report', path: '/reports' },
];

const statusColors = { Waiting: '#3b82f6', Completed: '#22c55e', Scheduled: '#eab308' };

function AdminDashboard() {
  const navigate = useNavigate();
  const { labels, patients, appointments } = adminTrendsData;
  const chartHeight = 200;
  const chartWidth = 400;
  const pad = 24;
  const w = chartWidth - pad * 2;
  const h = chartHeight - pad * 2;
  const maxP = Math.max(...patients);
  const maxA = Math.max(...appointments);
  const scaleP = maxP ? h / maxP : 0;
  const scaleA = maxA ? h / maxA : 0;

  const pathPatients = patients
    .map((val, i) => {
      const x = pad + (i / (labels.length - 1)) * w;
      const y = pad + h - val * scaleP;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
  const pathAppointments = appointments
    .map((val, i) => {
      const x = pad + (i / (labels.length - 1)) * w;
      const y = pad + h - val * scaleA;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="admin-dash page-enter">
      <div className="admin-dash__container">
        <section className="admin-dash__kpis">
          {adminDashboardKpis.map((kpi) => (
            <div key={kpi.id} className="admin-dash__kpi-card">
              <div className="admin-dash__kpi-label">{kpi.label}</div>
              <div className="admin-dash__kpi-value">{kpi.value}</div>
              <div className="admin-dash__kpi-meta">
                <span className={`admin-dash__kpi-delta ${kpi.trend}`}>{kpi.delta}</span>
                <Sparkline data={kpi.sparkData} color={kpi.color} className="admin-dash__sparkline" />
              </div>
            </div>
          ))}
        </section>

        <section className="admin-dash__middle">
          <div className="admin-dash__trends-card">
            <h3 className="admin-dash__card-title">Patient & Appointment Trends</h3>
            <div className="admin-dash__legend">
              <span className="admin-dash__legend-item"><span className="admin-dash__legend-dot blue" /> Patients</span>
              <span className="admin-dash__legend-item"><span className="admin-dash__legend-dot green" /> Appointments</span>
            </div>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="admin-dash__trends-svg">
              <path d={pathPatients} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d={pathAppointments} fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="admin-dash__xaxis">
              {labels.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          </div>
          <div className="admin-dash__appointments-card">
            <h3 className="admin-dash__card-title">Today&apos;s Appointments</h3>
            <table className="admin-dash__table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {adminTodayAppointments.map((row) => (
                  <tr key={row.id}>
                    <td>{row.time}</td>
                    <td>{row.patient}</td>
                    <td>{row.doctor}</td>
                    <td>
                      <span className="admin-dash__status" style={{ ['--status-color']: statusColors[row.status] }}>
                        <span className="admin-dash__status-dot" /> {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="admin-dash__view-all" onClick={() => navigate('/appointments')}>
              View All →
            </button>
          </div>
        </section>

        <section className="admin-dash__bottom">
          <div className="admin-dash__quick-actions-card">
            <h3 className="admin-dash__card-title">Quick Actions</h3>
            <ul className="admin-dash__quick-list">
              {quickActions.map((action) => (
                <li key={action.path}>
                  <button type="button" className="admin-dash__quick-item" onClick={() => navigate(action.path)}>
                    <span className="admin-dash__quick-icon">+</span>
                    {action.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="admin-dash__appointments-card">
            <h3 className="admin-dash__card-title">Today&apos;s Appointments</h3>
            <table className="admin-dash__table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {adminTodayAppointments.map((row) => (
                  <tr key={row.id}>
                    <td>{row.time}</td>
                    <td>{row.patient}</td>
                    <td>{row.doctor}</td>
                    <td>
                      <span className="admin-dash__status" style={{ ['--status-color']: statusColors[row.status] }}>
                        <span className="admin-dash__status-dot" /> {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="admin-dash__view-all" onClick={() => navigate('/appointments')}>
              View All →
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole && hasRole([roles.ADMIN]);

  return isAdmin ? <AdminDashboard /> : <DoctorDashboard />;
}
