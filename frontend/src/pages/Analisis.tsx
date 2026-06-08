import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import axios from 'axios'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Info,
  Lightbulb,
  Navigation,
  PackageCheck,
  TrendingDown,
  TrendingUp,
  Truck,
  XCircle,
} from 'lucide-react'
import { AreaChartRosen } from '../components/charts/AreaChartRosen'
import { DonutChartRosen } from '../components/charts/DonutChartRosen'
import { HorizontalBarRosen } from '../components/charts/HorizontalBarRosen'
import { cn } from '@/lib/utils'

const BRAND_PRIMARY = 'var(--primary)'
const OK_GREEN = 'var(--success)'
const WARNING_AMBER = 'var(--warning)'
const STOPPED_GRAY = 'var(--muted-foreground)'

type Rango = 7 | 30 | 90
type InsightNivel = 'info' | 'advertencia' | 'critico'
type InsightIcon = 'AlertTriangle' | 'TrendingUp' | 'XCircle' | 'Clock' | 'Activity' | 'TrendingDown' | 'Info'
type CsvCell = string | number | null | undefined

interface ResumenStats {
  vehiculosActivos: number
  vehiculosTotal: number
  kmRecorridosHoy: number
  entregasHoy: number
  vehiculosDetenidos: number
}

interface KmPorVehiculo {
  vehiculoId: string
  placa: string
  kmTotal: number
}

interface EntregaPorDia {
  fecha: string
  entregas: number
}

interface TiempoPorRuta {
  rutaId: string
  nombre: string
  tiempoPromedioMin: number
}

interface Anomalia {
  vehiculoId: string
  placa: string
  minutosDetenido: number
}

interface Insight {
  id: 'eficiencia' | 'ruta-critica' | 'anomalias' | 'actividad'
  nivel: InsightNivel
  icono: InsightIcon
  titulo: string
  descripcion: string
  accion: string
}

interface DatosResponse<T> {
  datos?: T[]
}

interface AnomaliasResponse {
  anomalias?: Anomalia[]
  total?: number
}

interface KpiBadge {
  label: string
  tone: 'success' | 'warning' | 'neutral'
  icon: typeof TrendingUp
}

function buildCsv(rows: CsvCell[][]): string {
  const escape = (val: CsvCell) => {
    const s = val == null ? '' : String(val)
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return rows.map((row) => row.map(escape).join(',')).join('\r\n')
}

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value)
}

function compactPercent(value: number) {
  return `${Math.round(value)}%`
}

function generarInsights(
  stats: ResumenStats | null,
  kmPorVehiculo: KmPorVehiculo[],
  tiempoPorRuta: TiempoPorRuta[],
  anomalias: Anomalia[],
): Insight[] {
  if (!stats || kmPorVehiculo.length === 0 || tiempoPorRuta.length === 0) return []

  const nuevosInsights: Insight[] = []

  const vehiculosConKm = kmPorVehiculo.filter((vehiculo) => vehiculo.kmTotal > 0)
  if (vehiculosConKm.length > 0) {
    const max = vehiculosConKm.reduce((prev, current) => (prev.kmTotal > current.kmTotal ? prev : current))
    const min = vehiculosConKm.reduce((prev, current) => (prev.kmTotal < current.kmTotal ? prev : current))
    const difPorcentaje = max.kmTotal === 0 ? 0 : ((max.kmTotal - min.kmTotal) / max.kmTotal) * 100
    const nivel: InsightNivel = difPorcentaje > 50 ? 'advertencia' : 'info'

    nuevosInsights.push({
      id: 'eficiencia',
      nivel,
      icono: difPorcentaje > 50 ? 'AlertTriangle' : 'TrendingUp',
      titulo: 'Eficiencia de flota',
      descripcion: `${max.placa} lidera con ${max.kmTotal} km recorridos hoy. ${min.placa} registra menor actividad con ${min.kmTotal} km.`,
      accion: 'Revisar asignación de rutas para equilibrar la carga',
    })
  }

  if (tiempoPorRuta.length > 0) {
    const promedioGeneral = tiempoPorRuta.reduce((acc, ruta) => acc + ruta.tiempoPromedioMin, 0) / tiempoPorRuta.length
    const rutaLenta = tiempoPorRuta.reduce((prev, current) =>
      prev.tiempoPromedioMin > current.tiempoPromedioMin ? prev : current,
    )
    const excesoPromedio = ((rutaLenta.tiempoPromedioMin - promedioGeneral) / promedioGeneral) * 100

    let nivel: InsightNivel = 'info'
    if (excesoPromedio > 50) nivel = 'critico'
    else if (excesoPromedio >= 20) nivel = 'advertencia'

    nuevosInsights.push({
      id: 'ruta-critica',
      nivel,
      icono: nivel === 'critico' ? 'XCircle' : nivel === 'advertencia' ? 'AlertTriangle' : 'Clock',
      titulo: 'Ruta más lenta',
      descripcion: `Ruta ${rutaLenta.nombre} toma ${rutaLenta.tiempoPromedioMin} min promedio, un ${Math.round(excesoPromedio)}% más que el promedio de ${promedioGeneral.toFixed(1)} min.`,
      accion: 'Considerar redistribuir puntos o asignar vehículo más rápido a esta ruta',
    })
  }

  if (anomalias.length === 0) {
    nuevosInsights.push({
      id: 'anomalias',
      nivel: 'info',
      icono: 'Activity',
      titulo: 'Estado de anomalías',
      descripcion: 'Operación normal. Todos los vehículos activos se mueven dentro de los parámetros esperados.',
      accion: 'Mantener monitoreo estándar',
    })
  } else if (anomalias.length <= 2) {
    nuevosInsights.push({
      id: 'anomalias',
      nivel: 'advertencia',
      icono: 'AlertTriangle',
      titulo: 'Estado de anomalías',
      descripcion: `${anomalias.length} vehículo(s) llevan más de 15 min detenidos en ruta activa.`,
      accion: 'Contactar a los operadores para verificar estado',
    })
  } else {
    nuevosInsights.push({
      id: 'anomalias',
      nivel: 'critico',
      icono: 'XCircle',
      titulo: 'Estado de anomalías',
      descripcion: `${anomalias.length} vehículos llevan más de 15 min detenidos en ruta activa.`,
      accion: 'Atención inmediata requerida, posible bloqueo en ruta',
    })
  }

  if (stats.vehiculosTotal > 0) {
    const tasaActividad = (stats.vehiculosActivos / stats.vehiculosTotal) * 100
    let nivel: InsightNivel = 'info'
    let sugerencia = 'Mantener asignación actual'

    if (tasaActividad < 40) {
      nivel = 'critico'
      sugerencia = 'Revisión de flota inactiva urgente'
    } else if (tasaActividad < 70) {
      nivel = 'advertencia'
      sugerencia = 'Revisar disponibilidad de vehículos'
    }

    nuevosInsights.push({
      id: 'actividad',
      nivel,
      icono: nivel === 'critico' ? 'TrendingDown' : 'Info',
      titulo: 'Tasa de actividad de la flota',
      descripcion: `El ${Math.round(tasaActividad)}% de la flota está activa hoy (${stats.vehiculosActivos} de ${stats.vehiculosTotal}).`,
      accion: sugerencia,
    })
  }

  return nuevosInsights
}

const rangos: { label: string; value: Rango }[] = [
  { label: '7 días', value: 7 },
  { label: '30 días', value: 30 },
  { label: '90 días', value: 90 },
]

const insightIcons: Record<InsightIcon, typeof AlertTriangle> = {
  AlertTriangle,
  TrendingUp,
  XCircle,
  Clock,
  Activity,
  TrendingDown,
  Info,
}

const softBg = (token: string) => `color-mix(in srgb, ${token} 14%, transparent)`

const insightStyles: Record<Insight['id'], { color: string; bg: string }> = {
  eficiencia: { color: BRAND_PRIMARY, bg: softBg(BRAND_PRIMARY) },
  'ruta-critica': { color: WARNING_AMBER, bg: softBg(WARNING_AMBER) },
  anomalias: { color: OK_GREEN, bg: softBg(OK_GREEN) },
  actividad: { color: 'var(--teal)', bg: softBg('var(--teal)') },
}

const badgeStyles: Record<KpiBadge['tone'], CSSProperties> = {
  success: { backgroundColor: softBg('var(--success)'), color: 'var(--success)' },
  warning: { backgroundColor: softBg('var(--warning)'), color: 'var(--warning)' },
  neutral: { backgroundColor: 'var(--secondary)', color: 'var(--muted-foreground)' },
}

function KpiHeroCard({
  title,
  value,
  subtitle,
  badge,
  icon: Icon,
  iconTone,
}: {
  title: string
  value: string
  subtitle: string
  badge: KpiBadge
  icon: typeof Navigation
  iconTone: CSSProperties
}) {
  const BadgeIcon = badge.icon

  return (
    <div className="rounded-xl border border-border/80 bg-card px-5 py-4 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground/80">{subtitle}</p>
        </div>
        <div className="rounded-lg p-2" style={iconTone}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="flex items-end justify-between gap-3">
        <span className="text-[42px] font-bold leading-none text-foreground">{value}</span>
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold" style={badgeStyles[badge.tone]}>
          <BadgeIcon className="h-3.5 w-3.5" />
          {badge.label}
        </span>
      </div>
    </div>
  )
}

function DssInsightCard({ insight }: { insight: Insight }) {
  const Icon = insightIcons[insight.icono]
  const style = insightStyles[insight.id]

  return (
    <article className="rounded-xl border border-border/80 bg-card p-4" style={{ borderLeft: `3px solid ${style.color}` }}>
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-md p-1.5" style={{ backgroundColor: style.bg, color: style.color }}>
            <Icon className="h-4 w-4" />
          </span>
        <h4 className="text-sm font-bold text-foreground">{insight.titulo}</h4>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{insight.descripcion}</p>
      <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary">
        <ArrowRight className="h-4 w-4" />
        {insight.accion}
      </p>
    </article>
  )
}

export function Analisis() {
  const [rango, setRango] = useState<Rango>(30)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const [abierto, setAbierto] = useState(() => {
    const guardado = localStorage.getItem('analisis_recomendaciones_abierto')
    return guardado !== null ? guardado === 'true' : true
  })

  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<ResumenStats | null>(null)
  const [kmPorVehiculo, setKmPorVehiculo] = useState<KmPorVehiculo[]>([])
  const [entregasPorDia, setEntregasPorDia] = useState<EntregaPorDia[]>([])
  const [tiempoPorRuta, setTiempoPorRuta] = useState<TiempoPorRuta[]>([])
  const [anomalias, setAnomalias] = useState<Anomalia[]>([])

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      axios.get<ResumenStats>('/api/analitica/kpi/resumen'),
      axios.get<DatosResponse<KmPorVehiculo>>(`/api/analitica/kpi/km-por-vehiculo?dias=${rango}`),
      axios.get<DatosResponse<EntregaPorDia>>(`/api/analitica/kpi/entregas-por-dia?dias=${rango}`),
      axios
        .get<DatosResponse<TiempoPorRuta>>(`/api/analitica/kpi/tiempo-por-ruta?dias=${rango}`)
        .catch(() => ({ data: { datos: [] } })),
      axios.get<AnomaliasResponse>('/api/analitica/reportes/anomalias'),
    ])
      .then(([resumenRes, kmRes, entregasRes, tiempoRes, anomaliasRes]) => {
        setStats(resumenRes.data)
        setKmPorVehiculo(kmRes.data.datos ?? [])
        setEntregasPorDia(entregasRes.data.datos ?? [])
        setTiempoPorRuta(tiempoRes.data.datos ?? [])
        setAnomalias(anomaliasRes.data.anomalias ?? [])
      })
      .catch((error: unknown) => console.error('Error al cargar analítica:', error))
      .finally(() => setIsLoading(false))
  }, [rango])

  const insights = useMemo(
    () => generarInsights(stats, kmPorVehiculo, tiempoPorRuta, anomalias),
    [stats, kmPorVehiculo, tiempoPorRuta, anomalias],
  )

  const promedioEntregas = useMemo(() => {
    if (entregasPorDia.length === 0) return 0
    return entregasPorDia.reduce((total, dia) => total + dia.entregas, 0) / entregasPorDia.length
  }, [entregasPorDia])

  const tasaActividad = stats && stats.vehiculosTotal > 0 ? (stats.vehiculosActivos / stats.vehiculosTotal) * 100 : 0
  const disponibles = Math.max(0, (stats?.vehiculosTotal ?? 0) - (stats?.vehiculosActivos ?? 0) - (stats?.vehiculosDetenidos ?? 0))

  const entregasBadge: KpiBadge =
    stats && promedioEntregas > 0 && stats.entregasHoy < promedioEntregas
      ? { label: 'Bajo promedio', tone: 'warning', icon: TrendingDown }
      : { label: 'En rango esperado', tone: 'success', icon: CheckCircle2 }

  const handleExportCSV = () => {
    const rows: CsvCell[][] = [
      ['Reporte de Análisis - Sistema de Paquetería'],
      ['Generado', new Date().toLocaleString('es-MX')],
      ['Rango de días', rango],
      [],
      ['KPIs'],
      ['Métrica', 'Valor'],
      ['Vehículos Activos', stats?.vehiculosActivos],
      ['Vehículos Totales', stats?.vehiculosTotal],
      ['Km Recorridos Hoy', stats?.kmRecorridosHoy],
      ['Entregas Hoy', stats?.entregasHoy],
      ['Vehículos Detenidos', stats?.vehiculosDetenidos],
      [],
      ['Km por Vehículo'],
      ['Placa', 'Km Total'],
      ...kmPorVehiculo.map((vehiculo) => [vehiculo.placa, vehiculo.kmTotal]),
      [],
      ['Entregas por Día'],
      ['Fecha', 'Entregas'],
      ...entregasPorDia.map((dia) => [dia.fecha, dia.entregas]),
      [],
      ['Tiempo Promedio por Ruta'],
      ['Ruta', 'Minutos Promedio'],
      ...tiempoPorRuta.map((ruta) => [ruta.nombre, ruta.tiempoPromedioMin]),
      [],
      ['Anomalías'],
      ['Placa', 'ID Vehículo', 'Minutos Detenido'],
      ...anomalias.map((anomalia) => [anomalia.placa, anomalia.vehiculoId, anomalia.minutosDetenido]),
    ]
    const csv = String.fromCharCode(0xfeff) + buildCsv(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `analisis-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  const handleExportPrint = () => {
    window.print()
    setShowExportMenu(false)
  }

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-tertiary p-6">
      <div className="space-y-5">
        <section className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Análisis de flota</h2>
              <p className="text-sm text-muted-foreground">Sistema de soporte a decisiones · Últimos {rango} días</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            <div className="inline-flex overflow-hidden rounded-lg border border-border bg-secondary/60 p-1">
              {rangos.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setRango(value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
                    rango === value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu((value) => !value)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                Exportar
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showExportMenu && 'rotate-180')} />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                  <button onClick={handleExportCSV} className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-secondary">
                    CSV
                  </button>
                  <button onClick={handleExportPrint} className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-secondary">
                    PDF
                  </button>
                  <button onClick={handleExportPrint} className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-secondary">
                    Imprimir
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <KpiHeroCard
            title="Km recorridos hoy"
            value={isLoading ? '—' : formatNumber(stats?.kmRecorridosHoy ?? 0, 1)}
            subtitle="kilómetros"
            icon={Navigation}
            iconTone={{ backgroundColor: softBg('var(--info)'), color: 'var(--info)' }}
            badge={{ label: 'Sin histórico previo', tone: 'neutral', icon: Info }}
          />
          <KpiHeroCard
            title="Entregas completadas"
            value={isLoading ? '—' : formatNumber(stats?.entregasHoy ?? 0)}
            subtitle={`promedio ${formatNumber(promedioEntregas, 1)} por día`}
            icon={PackageCheck}
            iconTone={{ backgroundColor: softBg('var(--warning)'), color: 'var(--warning)' }}
            badge={entregasBadge}
          />
          <KpiHeroCard
            title="Tasa de actividad"
            value={isLoading ? '—' : compactPercent(tasaActividad)}
            subtitle={`${stats?.vehiculosActivos ?? 0} de ${stats?.vehiculosTotal ?? 0} vehículos activos`}
            icon={Truck}
            iconTone={{ backgroundColor: softBg('var(--teal)'), color: 'var(--teal)' }}
            badge={{ label: 'Flota actual', tone: 'neutral', icon: CheckCircle2 }}
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
            <AreaChartRosen
              title="Entregas por día"
              data={entregasPorDia.map((dia) => ({ label: dia.fecha, value: dia.entregas }))}
              color={BRAND_PRIMARY}
              height={310}
            />
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
            <DonutChartRosen
              title="Distribución de flota"
              data={[
                { label: 'En ruta', value: stats?.vehiculosActivos ?? 0, color: BRAND_PRIMARY },
                { label: 'Disponible', value: disponibles, color: OK_GREEN },
                { label: 'Mantenimiento', value: 0, color: WARNING_AMBER },
                { label: 'Detenido', value: stats?.vehiculosDetenidos ?? 0, color: STOPPED_GRAY },
              ]}
              size={220}
            />
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
            <HorizontalBarRosen
              title="Km por vehículo"
              data={kmPorVehiculo.map((vehiculo) => ({
                label: vehiculo.placa,
                value: vehiculo.kmTotal,
                unit: 'km',
              }))}
              variant="ranking"
              sort="desc"
              minHeight={265}
            />
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
            <HorizontalBarRosen
              title="Tiempo promedio por ruta"
              data={tiempoPorRuta.map((ruta) => ({
                label: ruta.nombre,
                value: ruta.tiempoPromedioMin,
                unit: 'min',
              }))}
              variant="duration"
              sort="desc"
              minHeight={265}
            />
          </div>
        </section>

        {!isLoading && insights.length > 0 && (
          <section className="rounded-xl border border-border/80 bg-card shadow-sm">
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('analisis_recomendaciones_abierto', String(!abierto))
                setAbierto(!abierto)
              }}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-secondary/30"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Lightbulb className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground">Recomendaciones DSS</h3>
                  <p className="text-sm text-muted-foreground">Señales accionables basadas en los KPIs operativos</p>
                </div>
                {!abierto && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {insights.length} recomendaciones
                  </span>
                )}
              </div>
              {abierto ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {abierto && (
              <div className="grid gap-4 px-5 pb-5 md:grid-cols-2">
                {insights.map((insight) => (
                  <DssInsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            )}
          </section>
        )}

        <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Alertas de vehículos</h3>
              <p className="text-sm text-muted-foreground">Vehículos detenidos en ruta activa por más de 15 minutos</p>
            </div>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground">
              {anomalias.length} {anomalias.length === 1 ? 'activa' : 'activas'}
            </span>
          </div>

          {isLoading ? (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">Cargando…</div>
          ) : anomalias.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-secondary/20 px-4 py-8 text-center text-sm text-muted-foreground">
              Operación normal sin alertas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                    <th className="px-3 py-2 text-left font-semibold">Placa</th>
                    <th className="px-3 py-2 text-left font-semibold">ID Vehículo</th>
                    <th className="px-3 py-2 text-left font-semibold">Tiempo detenido</th>
                    <th className="px-3 py-2 text-left font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {anomalias.map((anomalia, index) => (
                    <tr key={`${anomalia.vehiculoId}-${index}`} className="hover:bg-secondary/20">
                      <td className="px-3 py-3 font-mono font-bold text-foreground">{anomalia.placa}</td>
                      <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{anomalia.vehiculoId}</td>
                      <td className="px-3 py-3 font-bold text-destructive">{anomalia.minutosDetenido} min</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                          Detenido
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
