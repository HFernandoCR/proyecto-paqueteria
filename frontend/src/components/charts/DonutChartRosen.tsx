import { useEffect, useMemo, useState } from 'react'
import * as d3 from 'd3'

export interface DonutDatum {
  label: string
  value: number
  color: string
}

interface DonutChartRosenProps {
  data: DonutDatum[]
  title: string
  size?: number
}

export function DonutChartRosen({ data, title, size = 210 }: DonutChartRosenProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 60)
    return () => window.clearTimeout(timer)
  }, [])

  const total = d3.sum(data, (datum) => datum.value)
  const radius = size / 2
  const outerRadius = Math.max(70, radius - 12)
  const innerRadius = Math.max(48, outerRadius - 24)

  const arcs = useMemo(() => {
    const visibleData = data.filter((datum) => datum.value > 0)
    return d3
      .pie<DonutDatum>()
      .value((datum) => datum.value)
      .sort(null)(visibleData)
  }, [data])

  const arcGenerator = d3.arc<d3.PieArcDatum<DonutDatum>>().innerRadius(innerRadius).outerRadius(outerRadius)

  return (
    <div className="flex h-full w-full flex-col">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      <div className="flex flex-1 flex-col items-center gap-5 lg:flex-row lg:items-center lg:justify-center">
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={title}>
            <g transform={`translate(${radius}, ${radius})`}>
              <circle
                r={outerRadius}
                fill="none"
                stroke="var(--secondary)"
                strokeWidth={outerRadius - innerRadius}
                opacity={0.55}
              />
              {arcs.map((arc, index) => (
                <path
                  key={`${arc.data.label}-${index}`}
                  d={arcGenerator(arc) ?? ''}
                  fill={arc.data.color}
                  className="transition-all duration-700 hover:opacity-90"
                  style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'scale(1)' : 'scale(0.96)',
                    transformOrigin: '0 0',
                  }}
                >
                  <title>{`${arc.data.label}: ${arc.data.value}`}</title>
                </path>
              ))}

              <text
                textAnchor="middle"
                y={-2}
                className="fill-foreground text-4xl font-bold transition-opacity duration-700"
                style={{ opacity: mounted ? 1 : 0 }}
              >
                {total}
              </text>
              <text
                textAnchor="middle"
                y={22}
                className="fill-muted-foreground text-xs font-medium transition-opacity duration-700"
                style={{ opacity: mounted ? 1 : 0 }}
              >
                vehículos
              </text>
            </g>
          </svg>
        </div>

        <div className="grid w-full max-w-[220px] gap-2">
          {data.map((datum) => (
            <div key={datum.label} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/30 px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-3 w-3 flex-shrink-0 rounded-[3px]" style={{ backgroundColor: datum.color }} />
                <span className="truncate text-sm font-medium text-foreground">{datum.label}</span>
              </div>
              <span className="font-mono text-sm font-semibold text-muted-foreground">{datum.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
