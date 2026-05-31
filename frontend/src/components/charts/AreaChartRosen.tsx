import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { TrendingUp } from 'lucide-react'

interface AreaChartRosenProps {
  data: Array<{ label: string; value: number }>
  title: string
  color?: string
  height?: number
}

export function AreaChartRosen({
  data,
  title,
  color = '#3b82f6',
  height = 250,
}: AreaChartRosenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({ width: rect.width, height: rect.height })
      }
    }

    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) {
        setDimensions({ width, height })
      }
    })
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  const pathRef = useRef<SVGPathElement>(null)
  const [pathLength, setPathLength] = useState(0)

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength())
    }
  }, [dimensions, data])

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col w-full h-full">
        <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2" style={{ minHeight: height }}>
          <TrendingUp className="h-8 w-8 opacity-30" />
          <p className="text-sm">Sin datos disponibles</p>
        </div>
      </div>
    )
  }

  if (data.length === 1) {
    return (
      <div className="flex flex-col w-full h-full">
        <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2" style={{ minHeight: height }}>
          <TrendingUp className="h-8 w-8 opacity-40" style={{ color: color }} />
          <p className="text-sm font-medium text-foreground">
            {data[0].value} entregas hoy
          </p>
          <p className="text-xs text-center max-w-[200px]">
            La grafica aparecera cuando haya datos de mas de un dia
          </p>
        </div>
      </div>
    )
  }

  const margin = { top: 20, right: 20, bottom: 30, left: 40 }
  const innerWidth = Math.max(0, dimensions.width - margin.left - margin.right)
  const innerHeight = Math.max(0, dimensions.height - margin.top - margin.bottom)

  const maxValue = d3.max(data, d => d.value) || 1

  const xScale = d3.scalePoint()
    .domain(data.map(d => d.label))
    .range([0, innerWidth])
    .padding(0.1)

  const yScale = d3.scaleLinear()
    .domain([0, maxValue * 1.1])
    .range([innerHeight, 0])

  const lineGenerator = d3.line<any>()
    .x(d => xScale(d.label) ?? 0)
    .y(d => yScale(d.value))
    .curve(d3.curveMonotoneX)

  const areaGenerator = d3.area<any>()
    .x(d => xScale(d.label) ?? 0)
    .y0(innerHeight)
    .y1(d => yScale(d.value))
    .curve(d3.curveMonotoneX)

  const pathD = lineGenerator(data) || ''
  const areaD = areaGenerator(data) || ''

  const yTicks = yScale.ticks(5)

  return (
    <div className="flex flex-col w-full h-full">
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <div className="flex-1 w-full relative" ref={containerRef} style={{ minHeight: height }}>
        {dimensions.width > 0 && dimensions.height > 0 && (
          <svg width={dimensions.width} height={dimensions.height}>
            <defs>
              <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <g transform={`translate(${margin.left},${margin.top})`}>
              
              {/* Grid horizontales */}
              {yTicks.map(tick => (
                <line
                  key={`grid-${tick}`}
                  x1={0}
                  x2={innerWidth}
                  y1={yScale(tick)}
                  y2={yScale(tick)}
                  stroke="currentColor"
                  className="text-border opacity-50"
                  strokeDasharray="3 3"
                />
              ))}

              {/* Y Axis Labels */}
              {yTicks.map(tick => (
                <text
                  key={`y-${tick}`}
                  x={-10}
                  y={yScale(tick)}
                  dy="0.32em"
                  textAnchor="end"
                  className="text-xs fill-muted-foreground"
                >
                  {tick}
                </text>
              ))}

              {/* X Axis Labels */}
              {data.map((d, i) => (
                <text
                  key={`x-${i}-${d.label}`}
                  x={xScale(d.label)}
                  y={innerHeight + 20}
                  textAnchor="middle"
                  className="text-xs fill-muted-foreground"
                >
                  {d.label}
                </text>
              ))}

              {/* Area */}
              <path
                d={areaD}
                fill="url(#area-grad)"
                className="transition-opacity duration-1000"
                style={{ opacity: mounted ? 1 : 0 }}
              />

              {/* Line */}
              <path
                ref={pathRef}
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeDasharray={pathLength}
                strokeDashoffset={mounted ? 0 : pathLength}
                className="transition-all duration-1000 ease-in-out"
              />

              {/* Points */}
              {data.map((d, i) => {
                const cx = xScale(d.label)
                const cy = yScale(d.value)
                return cx !== undefined ? (
                  <circle
                    key={`pt-${i}`}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={color}
                    className="transition-opacity duration-1000 delay-500"
                    style={{ opacity: mounted ? 1 : 0 }}
                  >
                    <title>{`${d.label}: ${d.value}`}</title>
                  </circle>
                ) : null
              })}
            </g>
          </svg>
        )}
      </div>
    </div>
  )
}
