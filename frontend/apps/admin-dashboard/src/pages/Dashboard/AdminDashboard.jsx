import KPICard from './components/KPICard.jsx'
import './AdminDashboard.css'

const kpis = [
  {
    title: 'Total Appointment',
    value: '489',
    deltaPct: +5.9,
    deltaText: 'last week',
    tone: 'danger',
    series: [20, 23, 25, 24, 26, 29, 31, 30, 33, 36, 34, 38],
  },
  {
    title: 'Total Patients',
    value: '210',
    deltaPct: -4.7,
    deltaText: 'last week',
    tone: 'success',
    series: [15, 17, 16, 18, 20, 19, 22, 24, 23, 25, 28, 30],
  },
  {
    title: 'Surgeries Today',
    value: '12',
    deltaPct: +2.1,
    deltaText: 'last week',
    tone: 'info',
    series: [6, 7, 6, 8, 9, 8, 10, 9, 11, 12, 11, 12],
  },
  {
    title: 'Active Alerts',
    value: '7',
    deltaPct: +1.3,
    deltaText: 'last week',
    tone: 'warning',
    series: [2, 3, 3, 4, 3, 5, 4, 5, 6, 5, 7, 7],
  },
]

export default function AdminDashboard() {
  return (
    <div className="admin">
      <header className="admin__header">
        <div>
          <div className="admin__title">Admin Dashboard</div>
          <div className="admin__subtitle">System overview and operations</div>
        </div>
      </header>

      <section className="admin__kpis">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </section>
    </div>
  )
}

