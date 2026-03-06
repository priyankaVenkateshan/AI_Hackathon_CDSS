import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivity } from '../../context/ActivityContext';
import { useAuth } from '../../context/AuthContext';
import KpiCard from './KpiCard';
import TrendsChart from './TrendsChart';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const { logActivity } = useActivity();
  useAuth();

  useEffect(() => {
    logActivity('view_dashboard');
  }, [logActivity]);

  const kpis = [
    {
      title: 'Patients Today',
      value: '128',
      deltaPct: 1.2,
      deltaText: 'last week',
      tone: 'blue',
      series: [12, 13, 12, 14, 13, 13, 14, 15, 14, 15, 14, 15],
    },
    {
      title: 'Appointments',
      value: '42',
      deltaPct: 2.9,
      deltaText: 'last week',
      tone: 'mint',
      series: [8, 9, 10, 9, 11, 12, 13, 12, 14, 15, 16, 16],
    },
    {
      title: 'Surgeries',
      value: '6',
      deltaPct: 2.9,
      deltaText: 'last week',
      tone: 'purple',
      series: [2, 2, 3, 2, 3, 3, 4, 3, 4, 5, 5, 6],
    },
    {
      title: 'Alerts',
      value: '3',
      deltaPct: -1.4,
      deltaText: 'last week',
      tone: 'peach',
      series: [4, 4, 3, 3, 3, 4, 3, 3, 2, 2, 3, 3],
    },
  ];

  const trendLabels = ['16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27'];
  const patientsTrend = [10, 11, 12, 12, 14, 16, 18, 18, 19, 22, 24, 26];
  const apptTrend = [9, 10, 10, 11, 12, 12, 13, 15, 16, 18, 21, 23];

  const todaysAppointments = [
    { time: '09:00', patient: 'John Doe', doctor: 'Dr. Smith', status: 'Waiting' },
    { time: '10:30', patient: 'Emma Lee', doctor: 'Dr. Alex', status: 'Completed' },
    { time: '12:00', patient: 'Mike Ross', doctor: 'Dr. Sam', status: 'Scheduled' },
  ];

  const go = (path) => () => navigate(path);

  return (
    <div className="dash page-enter">
      <div className="dash-admin">
        <section className="dash-admin__kpis">
          {kpis.map((k) => (
            <KpiCard key={k.title} {...k} />
          ))}
        </section>

        <section className="dash-admin__row">
          <div className="dash-admin__col dash-admin__col--wide">
            <TrendsChart labels={trendLabels} seriesA={patientsTrend} seriesB={apptTrend} />
          </div>

          <div className="dash-admin__col">
            <div className="dash-panel">
              <div className="dash-panel__head">
                <div className="dash-panel__title">Today&apos;s Appointments</div>
              </div>
              <div className="dash-table">
                <div className="dash-table__head">
                  <span>Time</span>
                  <span>Patient</span>
                  <span>Doctor</span>
                  <span>Status</span>
                </div>
                {todaysAppointments.map((r) => (
                  <div key={`${r.time}-${r.patient}`} className="dash-table__row">
                    <span>{r.time}</span>
                    <span>{r.patient}</span>
                    <span>{r.doctor}</span>
                    <span className={`dash-status dash-status--${r.status.toLowerCase()}`}>{r.status}</span>
                  </div>
                ))}
                <div className="dash-table__foot">
                  <button type="button" className="dash-link" onClick={go('/appointments')} aria-label="View all appointments">
                    View All →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="dash-admin__row">
          <div className="dash-admin__col">
            <div className="dash-panel">
              <div className="dash-panel__head">
                <div className="dash-panel__title">Quick Actions</div>
              </div>
              <div className="dash-actions">
                <button type="button" className="dash-action" onClick={go('/patients')} aria-label="Add a patient">
                  <span className="dash-action__icon">＋</span> Add Patient
                </button>
                <button type="button" className="dash-action" onClick={go('/appointments')} aria-label="Schedule an appointment">
                  <span className="dash-action__icon">＋</span> Schedule Appointment
                </button>
                <button type="button" className="dash-action" onClick={go('/doctors')} aria-label="Add a doctor">
                  <span className="dash-action__icon">＋</span> Add Doctor
                </button>
                <button type="button" className="dash-action" onClick={go('/reports')} aria-label="Generate a report">
                  <span className="dash-action__icon">＋</span> Generate Report
                </button>
              </div>
            </div>
          </div>

          <div className="dash-admin__col dash-admin__col--wide">
            <div className="dash-panel">
              <div className="dash-panel__head">
                <div className="dash-panel__title">Today&apos;s Appointments</div>
              </div>
              <div className="dash-table dash-table--full">
                <div className="dash-table__head">
                  <span>Time</span>
                  <span>Patient</span>
                  <span>Doctor</span>
                  <span>Status</span>
                </div>
                {todaysAppointments.map((r) => (
                  <div key={`full-${r.time}-${r.patient}`} className="dash-table__row">
                    <span>{r.time}</span>
                    <span>{r.patient}</span>
                    <span>{r.doctor}</span>
                    <span className={`dash-status dash-status--${r.status.toLowerCase()}`}>{r.status}</span>
                  </div>
                ))}
                <div className="dash-table__foot">
                  <button type="button" className="dash-link" onClick={go('/appointments')} aria-label="View all appointments">
                    View All →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
