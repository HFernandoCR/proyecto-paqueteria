import React, { useEffect, useState } from 'react'
import * as d3 from 'd3'

interface DonutChartRosenProps {
  data: Array<{ label: string; value: number; color: string }>
  title: string
  size?: number
}

export function DonutChartRosen({
  data,
  title,
  size = 200,
}: DonutChartRosenProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div className="flex flex-col w-full h-full">
        <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
        <div className="flex-1 flex items-center justify-center text-center" style={{ minHeight: size }}>
          <p className="text-sm text-muted-foreground">Sin datos disponibles</p>
        </div>
      </div>
    )
  }

  const total = d3.sum(data, (d) => d.value)
  const pie = d3.pie<any>().value((d) => d.value).sort(null)
  const arcs = pie(data)

  const arcGenerator = d3.arc<any>().innerRadius(60).outerRadius(90)

  return (
    <div className="flex flex-col w-full h-full">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
            <g transform={`translate(${size / 2}, ${size / 2})`}>
              {arcs.map((arc, i) => {
                const d = arcGenerator(arc) || ''
                return (
                  <path
                    key={`arc-${i}`}
                    d={d}
                    fill={arc.data.color}
                    className="transition-all duration-700 hover:scale-[1.03] cursor-pointer"
                    style={{
                      opacity: mounted ? 1 : 0,
                      transformOrigin: '0px 0px',
                    }}
                  >
                    <title>{`${arc.data.label}: ${arc.data.value}`}</title>
                  </path>
                )
              })}
              
              <text
                textAnchor="middle"
                y={0}
                className="text-3xl font-bold fill-foreground transition-opacity duration-700"
                style={{ opacity: mounted ? 1 : 0 }}
              >
                {total}
              </text>
              <text
                textAnchor="middle"
                y={20}
                className="text-xs font-medium fill-muted-foreground transition-opacity duration-700"
                style={{ opacity: mounted ? 1 : 0 }}
              >
                vehículos
              </text>
            </g>
          </svg>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
          {data.map((d, i) => (
            <div key={`legend-${i}`} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-sm text-foreground">{d.label}</span>
              <span className="text-sm font-semibold text-muted-foreground">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
