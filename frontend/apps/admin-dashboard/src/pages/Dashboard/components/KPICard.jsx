import SparkArea from './SparkArea.jsx'
import './KPICard.css'

function formatDelta(deltaPct) {
  const abs = Math.abs(deltaPct).toFixed(1)
  return `${abs}%`
}

export default function KPICard({
  title,
  value,
  deltaPct,
  deltaText = 'last week',
  tone = 'info',
  series = [],
}) {
  const isUp = deltaPct >= 0
  const deltaClass = isUp ? 'kpi__delta--up' : 'kpi__delta--down'

  return (
    <div className={`kpi kpi--${tone}`}>
      <div className="kpi__top">
        <div className="kpi__meta">
          <div className="kpi__title">{title}</div>
          <div className="kpi__value">{value}</div>
        </div>
        <div className={`kpi__delta ${deltaClass}`}>
          <span className="kpi__deltaValue">
            {isUp ? '+' : '-'}
            {formatDelta(deltaPct)}
          </span>
          <span className="kpi__deltaText">{deltaText}</span>
        </div>
      </div>

      <div className="kpi__spark">
        <SparkArea series={series} tone={tone} />
      </div>
    </div>
  )
}

