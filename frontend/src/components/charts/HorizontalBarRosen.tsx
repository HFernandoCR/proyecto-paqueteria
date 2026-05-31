import React, { useEffect, useState } from 'react'
import * as d3 from 'd3'

interface HorizontalBarRosenProps {
  data: Array<{ label: string; value: number; unit?: string }>
  title: string
  color?: string
}

export function HorizontalBarRosen({
  data,
  title,
  color = '#f59e0b',
}: HorizontalBarRosenProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col w-full h-full">
        <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
        <div className="flex-1 flex items-center justify-center text-center" style={{ minHeight: 200 }}>
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
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
        {data.map((d, i) => (
          <div key={`${d.label}-${i}`} className="flex flex-col w-full group border-b border-border/40 pb-3 last:border-0 last:pb-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-foreground truncate max-w-[80%]">
                {d.label}
              </span>
              <span 
                className="text-xs font-semibold text-muted-foreground transition-opacity duration-700"
                style={{ opacity: mounted ? 1 : 0 }}
              >
                {d.value.toFixed(0)} {d.unit || ''}
              </span>
            </div>
            
            <div className="w-full relative flex items-center bg-secondary/10 rounded-r-md h-8">
              <div
                className="absolute left-0 top-0 h-full rounded-r-md transition-all duration-700 ease-out"
                style={{
                  width: mounted ? `${scale(d.value)}%` : '0%',
                  background: `linear-gradient(90deg, ${color} 0%, ${color}AA 100%)`,
                }}
                title={`${d.value} ${d.unit || ''}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
