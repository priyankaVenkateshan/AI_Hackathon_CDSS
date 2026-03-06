function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function buildPath(series, width, height, padding) {
  if (!series?.length) return { line: '', area: '' }

  const min = Math.min(...series)
  const max = Math.max(...series)
  const span = max - min || 1

  const innerW = width - padding * 2
  const innerH = height - padding * 2
  const step = innerW / Math.max(1, series.length - 1)

  const points = series.map((v, i) => {
    const x = padding + i * step
    const t = (v - min) / span
    const y = padding + (1 - clamp(t, 0, 1)) * innerH
    return { x, y }
  })

  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')

  const last = points[points.length - 1]
  const first = points[0]
  const baselineY = height - padding
  const area = `${line} L ${last.x.toFixed(2)} ${baselineY.toFixed(
    2,
  )} L ${first.x.toFixed(2)} ${baselineY.toFixed(2)} Z`

  return { line, area }
}

export default function SparkArea({ series = [], tone = 'info' }) {
  const width = 220
  const height = 64
  const padding = 4
  const { line, area } = buildPath(series, width, height, padding)
  const gradId = `spark-grad-${tone}`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--spark)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--spark)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={line}
        fill="none"
        stroke="var(--spark)"
        strokeOpacity="0.7"
        strokeWidth="2.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

