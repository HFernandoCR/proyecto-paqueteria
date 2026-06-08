import { useEffect, useState } from 'react'
import * as d3 from 'd3'

interface BarChartRosenProps {
  data: Array<{ label: string; value: number; unit?: string }>
  title: string
  color?: string
  height?: number
}

export function BarChartRosen({
  data,
  title,
  color = 'var(--primary)',
  height = 200,
}: BarChartRosenProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col w-full h-full">
        <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
        <div className="flex-1 flex items-center justify-center text-center" style={{ minHeight: height }}>
          <p className="text-sm text-muted-foreground">Sin datos disponibles</p>
        </div>
      </div>
    )
  }

  const maxValue = d3.max(data, (d) => d.value) || 1
  const scale = d3.scaleLinear().domain([0, maxValue]).range([0, 100])

  return (
    <div className="flex flex-col w-full h-full">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <div className="flex-1 flex flex-col justify-around gap-2" style={{ minHeight: height }}>
        {data.map((d, i) => (
          <div key={`${d.label}-${i}`} className="flex items-center w-full group">
            <div className="w-20 sm:w-24 flex-shrink-0 text-sm font-medium text-foreground truncate pr-2">
              {d.label}
            </div>
            
            <div className="flex-1 flex items-center relative">
              <div
                className="h-6 rounded-r-md transition-all duration-700 ease-out"
                style={{
                  width: mounted ? `${scale(d.value)}%` : '0%',
                  background: `linear-gradient(90deg, ${color} 0%, ${color}AA 100%)`,
                }}
                title={`${d.value} ${d.unit || ''}`}
              />
              <span 
                className="ml-2 text-xs font-semibold text-muted-foreground transition-opacity duration-700 whitespace-nowrap"
                style={{ opacity: mounted ? 1 : 0 }}
              >
                {d.value.toFixed(1)} {d.unit || ''}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
