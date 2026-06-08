import { useEffect, useId, useRef, useState } from 'react'
import * as d3 from 'd3'
import { TrendingUp } from 'lucide-react'

export interface AreaChartDatum {
  label: string
  value: number
}

interface AreaChartRosenProps {
  data: AreaChartDatum[]
  title: string
  color?: string
  height?: number
}

const compactDate = (label: string) => {
  const parts = label.split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`
  return label
}

export function AreaChartRosen({
  data,
  title,
  color = 'var(--primary)',
  height = 280,
}: AreaChartRosenProps) {
  const gradientId = useId().replace(/:/g, '')
  const containerRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [mounted, setMounted] = useState(false)
  const [pathLength, setPathLength] = useState(0)

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      if (rect.width > 0) {
        setDimensions({ width: rect.width, height: rect.height > 0 ? rect.height : height })
      }
    }

    updateSize()
    const resizeObserver = new ResizeObserver(updateSize)
    if (containerRef.current) resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [height])

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 80)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (pathRef.current) setPathLength(pathRef.current.getTotalLength())
  }, [dimensions, data])

  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full flex-col">
        <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
        <div
          className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground"
          style={{ minHeight: height }}
        >
          <TrendingUp className="h-7 w-7 opacity-30" />
          <p className="text-sm">Sin datos disponibles</p>
        </div>
      </div>
    )
  }

  const margin = { top: 18, right: 18, bottom: 34, left: 42 }
  const innerWidth = Math.max(0, dimensions.width - margin.left - margin.right)
  const innerHeight = Math.max(0, dimensions.height - margin.top - margin.bottom)
  const maxValue = Math.max(d3.max(data, (datum) => datum.value) ?? 0, 1)
  const meanValue = d3.mean(data, (datum) => datum.value) ?? 0

  const xScale = d3
    .scalePoint<string>()
    .domain(data.map((datum) => datum.label))
    .range([0, innerWidth])
    .padding(data.length === 1 ? 0.5 : 0.25)

  const yScale = d3
    .scaleLinear()
    .domain([0, Math.ceil(maxValue * 1.15)])
    .nice(4)
    .range([innerHeight, 0])

  const lineGenerator = d3
    .line<AreaChartDatum>()
    .defined((datum) => Number.isFinite(datum.value))
    .x((datum) => xScale(datum.label) ?? 0)
    .y((datum) => yScale(datum.value))
    .curve(data.length > 1 ? d3.curveMonotoneX : d3.curveLinear)

  const areaGenerator = d3
    .area<AreaChartDatum>()
    .defined((datum) => Number.isFinite(datum.value))
    .x((datum) => xScale(datum.label) ?? 0)
    .y0(innerHeight)
    .y1((datum) => yScale(datum.value))
    .curve(data.length > 1 ? d3.curveMonotoneX : d3.curveLinear)

  const yTicks = yScale.ticks(4)
  const labelStep = Math.max(1, Math.ceil(data.length / 7))
  const areaPath = areaGenerator(data) ?? ''
  const linePath = lineGenerator(data) ?? ''
  const meanY = yScale(meanValue)

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="rounded-full bg-secondary/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
          Media {meanValue.toFixed(1)}
        </span>
      </div>
      <div ref={containerRef} className="relative w-full flex-1" style={{ minHeight: height }}>
        {dimensions.width > 0 && dimensions.height > 0 && (
          <svg width={dimensions.width} height={dimensions.height} role="img" aria-label={title}>
            <defs>
              <linearGradient id={`${gradientId}-area`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <g transform={`translate(${margin.left},${margin.top})`}>
              {yTicks.map((tick) => (
                <g key={`y-${tick}`}>
                  <line
                    x1={0}
                    x2={innerWidth}
                    y1={yScale(tick)}
                    y2={yScale(tick)}
                    className="stroke-border"
                    strokeDasharray="2 4"
                    strokeWidth={0.7}
                  />
                  <text
                    x={-10}
                    y={yScale(tick)}
                    dy="0.32em"
                    textAnchor="end"
                    className="fill-muted-foreground text-[11px]"
                  >
                    {tick}
                  </text>
                </g>
              ))}

              <line
                x1={0}
                x2={innerWidth}
                y1={meanY}
                y2={meanY}
                stroke={color}
                strokeDasharray="5 5"
                strokeOpacity={0.7}
                strokeWidth={1}
              />

              <line x1={0} x2={innerWidth} y1={innerHeight} y2={innerHeight} className="stroke-border" />
              <line x1={0} x2={0} y1={0} y2={innerHeight} className="stroke-border" />

              {data.map((datum, index) => {
                if (index % labelStep !== 0 && index !== data.length - 1) return null
                return (
                  <text
                    key={`x-${datum.label}`}
                    x={xScale(datum.label)}
                    y={innerHeight + 22}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[11px]"
                  >
                    {compactDate(datum.label)}
                  </text>
                )
              })}

              <path
                d={areaPath}
                fill={`url(#${gradientId}-area)`}
                className="transition-opacity duration-700"
                style={{ opacity: mounted ? 1 : 0 }}
              />
              {data.length > 1 && (
                <path
                  ref={pathRef}
                  d={linePath}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={pathLength || undefined}
                  strokeDashoffset={mounted ? 0 : pathLength}
                  className="transition-all duration-700 ease-out"
                />
              )}

              {data.map((datum) => {
                const cx = xScale(datum.label)
                if (cx === undefined) return null
                return (
                  <circle
                    key={`point-${datum.label}`}
                    cx={cx}
                    cy={yScale(datum.value)}
                    r={4}
                    fill="var(--card)"
                    stroke={color}
                    strokeWidth={2}
                    className="transition-opacity duration-500"
                    style={{ opacity: mounted ? 1 : 0 }}
                  >
                    <title>{`${datum.label}: ${datum.value}`}</title>
                  </circle>
                )
              })}
            </g>
          </svg>
        )}
      </div>
    </div>
  )
}
