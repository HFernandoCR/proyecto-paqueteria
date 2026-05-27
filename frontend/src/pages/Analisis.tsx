import { useState, useEffect, useRef } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import axios from 'axios'
import { KpiCard } from '@/components/ui/KpiCard'
import {
  BarChart3,
  Truck,
  Navigation,
  Package,
  AlertTriangle,
  Download,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Colores para SVG — Recharts no puede usar variables CSS de Tailwind */
/* ------------------------------------------------------------------ */
const CHART_ACCENT  = '#4f72ff'
const CHART_ACCENT2 = '#7c9dff'
const CHART_GRID    = '#192033'
const CHART_MUTED   = '#5b6887'

/* Tooltip compartido para todos los charts */
const TT = {
  contentStyle: {
    background: '#0d1221',
    border: '1px solid #1d2740',
    borderRadius: '6px',
    fontSize: '0.8rem',
    color: '#dde3f0',
    padding: '0.5rem 0.75rem',
  },
  labelStyle: { color: '#dde3f0', fontWeight: 600, marginBottom: '0.2rem' },
  cursor: { fill: 'rgba(79,114,255,0.05)' },
}

/* ------------------------------------------------------------------ */
/*  Componente                                                           */
/* ------------------------------------------------------------------ */
export function Analisis() {
  /* ── Controles de UI ── */
  const [rango, setRango] = useState<7 | 30 | 90>(30)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  /* ── Datos ── */
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [kmPorVehiculo, setKmPorVehiculo] = useState<any[]>([])
  const [entregasPorDia, setEntregasPorDia] = useState<any[]>([])
  const [tiempoPorRuta, setTiempoPorRuta] = useState<any[]>([])
  const [anomalias, setAnomalias] = useState<any[]>([])

  /* Cerrar dropdown al hacer click fuera */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* Fetch — se re-ejecuta al cambiar el rango */
  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      axios.get('/api/analitica/kpi/resumen'),
      axios.get('/api/analitica/kpi/km-por-vehiculo'),
      axios.get(`/api/analitica/kpi/entregas-por-dia?dias=${rango}`),
      axios.get('/api/analitica/kpi/tiempo-por-ruta').catch(() => ({ data: { datos: [] } })),
      axios.get('/api/analitica/reportes/anomalias'),
    ])
      .then(([resumenRes, kmRes, entregasRes, tiempoRes, anomaliasRes]) => {
        setStats(resumenRes.data)
        setKmPorVehiculo(kmRes.data.datos ?? [])
        setEntregasPorDia(entregasRes.data.datos ?? [])
        setTiempoPorRuta(tiempoRes.data.datos ?? [])
        setAnomalias(anomaliasRes.data.anomalias ?? [])
      })
      .catch((err) => console.error('Error al cargar analítica:', err))
      .finally(() => setIsLoading(false))
  }, [rango])

  /* ── Exportar CSV ── */
  const handleExportCSV = () => {
    const rows: (string | number | undefined)[][] = [
      ['Sección', 'Campo', 'Valor'],
      ['KPIs', 'Vehículos Activos', stats?.vehiculosActivos],
      ['KPIs', 'Km Recorridos Hoy', stats?.kmRecorridosHoy],
      ['KPIs', 'Entregas Hoy', stats?.entregasHoy],
      ['KPIs', 'Vehículos Detenidos', stats?.vehiculosDetenidos],
      [],
      ['Km por Vehículo', 'Placa', 'Km Total'],
      ...kmPorVehiculo.map((v) => ['', v.placa, v.kmTotal]),
      [],
      ['Anomalías', 'Placa', 'ID Vehículo', 'Minutos Detenido'],
      ...anomalias.map((a) => ['', a.placa, a.vehiculoId, a.minutosDetenido]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analisis-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  /* ── Exportar PDF / Imprimir ── */
  const handleExportPrint = () => {
    window.print()
    setShowExportMenu(false)
  }

  const rangos: { label: string; value: 7 | 30 | 90 }[] = [
    { label: '7 días', value: 7 },
    { label: '30 días', value: 30 },
    { label: '90 días', value: 90 },
  ]

  return (
    <div className="space-y-6">

      {/* ── Header + controles ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Título */}
        <div className="flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-primary flex-shrink-0" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Análisis</h2>
            <p className="text-muted-foreground text-sm">Sistema de Soporte a Decisiones</p>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-2 no-print">
          {/* Filtro de rango */}
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            {rangos.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setRango(value)}
                className={cn(
                  'px-3 py-2 text-sm font-medium transition-colors',
                  rango === value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Botón exportar + dropdown (funcionalidad en commit siguiente) */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Download className="h-4 w-4" />
              Exportar
              <ChevronDown
                className={cn('h-3 w-3 transition-transform', showExportMenu && 'rotate-180')}
              />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 z-10 w-36 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                <button
                  onClick={handleExportCSV}
                  className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  CSV
                </button>
                <button
                  onClick={handleExportPrint}
                  className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  PDF
                </button>
                <button
                  onClick={handleExportPrint}
                  className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  Imprimir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Tarjetas KPI ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Vehículos Activos"
          value={isLoading ? '—' : String(stats?.vehiculosActivos ?? 0)}
          subtitle={stats ? `de ${stats.vehiculosTotal} registrados` : 'Cargando...'}
          icon={Truck}
          accentColor="primary"
        />
        <KpiCard
          title="Km Recorridos Hoy"
          value={isLoading ? '—' : String(stats?.kmRecorridosHoy ?? 0)}
          subtitle="km totales del día"
          icon={Navigation}
          accentColor="success"
        />
        <KpiCard
          title="Entregas Hoy"
          value={isLoading ? '—' : String(stats?.entregasHoy ?? 0)}
          subtitle="paquetes entregados"
          icon={Package}
          accentColor="primary"
        />
        <KpiCard
          title="Vehículos Detenidos"
          value={isLoading ? '—' : String(stats?.vehiculosDetenidos ?? 0)}
          subtitle={stats?.vehiculosDetenidos > 0 ? 'Requieren atención' : 'Sin incidencias'}
          icon={AlertTriangle}
          accentColor={stats?.vehiculosDetenidos > 0 ? 'destructive' : 'success'}
        />
      </div>

      {/* ── Grid 2 columnas: BarChart km + LineChart entregas ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* BarChart: Km por vehículo */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Km Recorridos por Vehículo</h3>
            <span className="flex items-center gap-2 text-sm">
              <span className="h-3 w-3 rounded-full" style={{ background: CHART_ACCENT }} />
              <span className="text-muted-foreground">km totales hoy</span>
            </span>
          </div>
          <div className="h-[300px]">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Cargando…
              </div>
            ) : kmPorVehiculo.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <p className="text-sm text-muted-foreground">Sin datos de trayecto disponibles</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kmPorVehiculo} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                  <XAxis
                    dataKey="placa"
                    stroke={CHART_MUTED}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={CHART_MUTED}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    unit=" km"
                  />
                  <Tooltip {...TT} formatter={(v) => [`${v} km`, 'Km totales']} />
                  <Bar dataKey="kmTotal" fill={CHART_ACCENT} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* LineChart: Entregas por día */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Entregas por Día</h3>
            <span className="flex items-center gap-2 text-sm">
              <span className="h-3 w-3 rounded-full" style={{ background: CHART_ACCENT }} />
              <span className="text-muted-foreground">entregas realizadas</span>
            </span>
          </div>
          <div className="h-[300px]">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Cargando…
              </div>
            ) : entregasPorDia.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <p className="text-sm text-muted-foreground">Sin historial de entregas disponible</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={entregasPorDia}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                  <XAxis
                    dataKey="fecha"
                    stroke={CHART_MUTED}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={CHART_MUTED}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip {...TT} formatter={(v) => [`${v}`, 'Entregas']} />
                  <Line
                    type="monotone"
                    dataKey="entregas"
                    stroke={CHART_ACCENT}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: CHART_ACCENT, strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* ── Full width: Tiempo promedio por ruta ── */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Tiempo Promedio por Ruta</h3>
          <span className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full" style={{ background: CHART_ACCENT2 }} />
            <span className="text-muted-foreground">minutos promedio</span>
          </span>
        </div>
        <div className="h-[300px]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Cargando…
            </div>
          ) : tiempoPorRuta.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">Sin datos de rutas disponibles</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={tiempoPorRuta} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                <XAxis
                  type="number"
                  stroke={CHART_MUTED}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  unit=" min"
                />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  width={130}
                  stroke={CHART_MUTED}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip {...TT} formatter={(v) => [`${v} min`, 'Tiempo promedio']} />
                <Bar dataKey="tiempoPromedioMin" fill={CHART_ACCENT2} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Tabla de anomalías ── */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Alertas de Vehículos</h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-destructive/10 text-destructive">
            {anomalias.length} {anomalias.length === 1 ? 'activa' : 'activas'}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Vehículos detenidos en ruta activa por más de 15 minutos
        </p>
        {isLoading ? (
          <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
            Cargando…
          </div>
        ) : anomalias.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-secondary/5 rounded-lg border border-border border-dashed">
            Operación normal sin alertas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
                    Placa
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
                    ID Vehículo
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
                    Tiempo Detenido
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {anomalias.map((a: any, i: number) => (
                  <tr key={`${a.vehiculoId}-${i}`}>
                    <td className="px-3 py-2.5 border-b border-border font-bold font-mono tracking-wide text-foreground">
                      {a.placa}
                    </td>
                    <td className="px-3 py-2.5 border-b border-border font-mono text-xs text-muted-foreground">
                      {a.vehiculoId}
                    </td>
                    <td className="px-3 py-2.5 border-b border-border font-bold text-destructive">
                      {a.minutosDetenido} min
                    </td>
                    <td className="px-3 py-2.5 border-b border-border">
                      <span className="inline-block bg-destructive/10 text-destructive rounded px-2 py-0.5 text-xs font-semibold tracking-wide">
                        Detenido
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
