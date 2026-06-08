import { useEffect, useMemo, useState } from 'react'
import * as d3 from 'd3'

export interface HorizontalBarDatum {
  label: string
  value: number
  unit?: string
}

type BarVariant = 'ranking' | 'duration' | 'single'
type SortDirection = 'desc' | 'asc' | 'none'

interface HorizontalBarRosenProps {
  data: HorizontalBarDatum[]
  title: string
  color?: string
  variant?: BarVariant
  sort?: SortDirection
  minHeight?: number
}

const rankingColors = ['var(--ranking-high)', 'var(--ranking-mid)', 'var(--ranking-low)']
const slowColor = 'var(--route-slow)'
const mediumColor = 'var(--route-medium)'
const fastColor = 'var(--route-fast)'

function colorForRanking(index: number, total: number) {
  if (total <= 1) return rankingColors[0]
  if (index === 0) return rankingColors[0]
  if (index <= Math.ceil(total / 2)) return rankingColors[1]
  return rankingColors[2]
}

function colorForDuration(index: number, total: number) {
  if (total <= 1) return mediumColor
  if (index === 0) return slowColor
  if (index === total - 1) return fastColor
  return mediumColor
}

export function HorizontalBarRosen({
  data,
  title,
  color = 'var(--primary)',
  variant = 'single',
  sort = 'none',
  minHeight = 260,
}: HorizontalBarRosenProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 60)
    return () => window.clearTimeout(timer)
  }, [])

  const sortedData = useMemo(() => {
    const copy = [...data]
    if (sort === 'desc') return copy.sort((a, b) => b.value - a.value)
    if (sort === 'asc') return copy.sort((a, b) => a.value - b.value)
    return copy
  }, [data, sort])

  if (!sortedData || sortedData.length === 0) {
    return (
      <div className="flex h-full w-full flex-col">
        <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex flex-1 items-center justify-center text-center" style={{ minHeight }}>
          <p className="text-sm text-muted-foreground">Sin datos disponibles</p>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(d3.max(sortedData, (datum) => datum.value) ?? 0, 1)
  const scale = d3.scaleLinear().domain([0, maxValue]).range([0, 100])

  return (
    <div className="flex h-full w-full flex-col">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1" style={{ minHeight }}>
        {sortedData.map((datum, index) => {
          const isZero = datum.value <= 0
          const barColor =
            variant === 'ranking'
              ? colorForRanking(index, sortedData.length)
              : variant === 'duration'
                ? colorForDuration(index, sortedData.length)
                : color
          const width = isZero ? 3 : scale(datum.value)
          const valueText = `${datum.value.toFixed(datum.value % 1 === 0 ? 0 : 1)} ${datum.unit ?? ''}`.trim()

          return (
            <div key={`${datum.label}-${index}`} className="grid grid-cols-[minmax(88px,0.9fr)_2fr_auto] items-center gap-3">
              <span className="truncate text-sm font-medium text-foreground" title={datum.label}>
                {datum.label}
              </span>
              <div className="h-[18px] rounded-[3px] border border-border/70 bg-muted/55">
                <div
                  className="h-full rounded-[3px] transition-all duration-700 ease-out"
                  style={{
                    width: mounted ? `${width}%` : '0%',
                    minWidth: isZero ? 10 : 18,
                    background: isZero
                      ? 'var(--border)'
                      : `linear-gradient(90deg, ${barColor} 0%, ${barColor}CC 100%)`,
                    boxShadow: isZero ? 'none' : `0 0 0 1px color-mix(in srgb, ${barColor} 45%, transparent), 0 4px 12px color-mix(in srgb, ${barColor} 18%, transparent)`,
                  }}
                />
              </div>
              <span className={isZero ? 'text-xs font-semibold text-muted-foreground/60' : 'text-xs font-semibold text-foreground'}>
                {valueText}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
