import { useState, useEffect, useRef, useMemo } from 'react'
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
  LabelList,
} from 'recharts'
import axios from 'axios'
import { KpiCard } from '@/components/ui/KpiCard'
import { InsightCard } from '@/components/ui/InsightCard'
import {
  BarChart3,
  Truck,
  Navigation,
  Package,
  AlertTriangle,
  Download,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Colores para SVG — Recharts no puede usar variables CSS de Tailwind */
/* ------------------------------------------------------------------ */
const CHART_ACCENT  = '#4f72ff'
const CHART_ACCENT2 = '#7c9dff'
const CHART_GRID    = '#192033'
const CHART_MUTED   = '#5b6887'

/* Arma un CSV escapando cada campo según RFC 4180 (comillas solo si hace falta,
   comillas internas duplicadas) y une las filas con CRLF. */
function buildCsv(rows: (string | number | null | undefined)[][]): string {
  const escape = (val: string | number | null | undefined) => {
    const s = val == null ? '' : String(val)
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return rows.map((r) => r.map(escape).join(',')).join('\r\n')
}

/* Tooltip compartido para todos los charts */
const TT = {
  contentStyle: {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    color: 'hsl(var(--foreground))',
    fontSize: '0.8rem',
    padding: '0.5rem 0.75rem',
  },
  labelStyle: { color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: '0.2rem' },
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
  const [abierto, setAbierto] = useState(() => {
    const guardado = localStorage.getItem('analisis_recomendaciones_abierto')
    return guardado !== null ? guardado === 'true' : false
  })

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
    const rows: (string | number | null | undefined)[][] = [
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
      ...kmPorVehiculo.map((v) => [v.placa, v.kmTotal]),
      [],
      ['Entregas por Día'],
      ['Fecha', 'Entregas'],
      ...entregasPorDia.map((e) => [e.fecha, e.entregas]),
      [],
      ['Tiempo Promedio por Ruta'],
      ['Ruta', 'Minutos Promedio'],
      ...tiempoPorRuta.map((t) => [t.nombre, t.tiempoPromedioMin]),
      [],
      ['Anomalías'],
      ['Placa', 'ID Vehículo', 'Minutos Detenido'],
      ...anomalias.map((a) => [a.placa, a.vehiculoId, a.minutosDetenido]),
    ]
    const BOM = String.fromCharCode(0xfeff) // BOM UTF-8: Excel respeta acentos
    const csv = BOM + buildCsv(rows)
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

  /* ── Recomendaciones (Insights) ── */
  const insights = useMemo(() => {
    if (!stats || kmPorVehiculo.length === 0 || tiempoPorRuta.length === 0) return []
    
    const nuevosInsights: any[] = []

    // 1. Eficiencia de flota
    const vehiculosConKm = kmPorVehiculo.filter(v => v.kmTotal > 0)
    if (vehiculosConKm.length > 0) {
      const max = vehiculosConKm.reduce((prev, current) => (prev.kmTotal > current.kmTotal) ? prev : current)
      const min = vehiculosConKm.reduce((prev, current) => (prev.kmTotal < current.kmTotal) ? prev : current)
      
      const difPorcentaje = max.kmTotal === 0 ? 0 : ((max.kmTotal - min.kmTotal) / max.kmTotal) * 100
      const nivel = difPorcentaje > 50 ? 'advertencia' : 'info'
      
      nuevosInsights.push({
        id: 'eficiencia',
        nivel,
        icono: difPorcentaje > 50 ? 'AlertTriangle' : 'TrendingUp',
        titulo: 'Eficiencia de flota',
        descripcion: `${max.placa} lidera con ${max.kmTotal} km recorridos hoy. ${min.placa} registra menor actividad con ${min.kmTotal} km.`,
        accion: 'Revisar asignación de rutas para equilibrar la carga'
      })
    }

    // 2. Ruta crítica
    if (tiempoPorRuta.length > 0) {
      const promedioGeneral = tiempoPorRuta.reduce((acc, r) => acc + r.tiempoPromedioMin, 0) / tiempoPorRuta.length
      const rutaLenta = tiempoPorRuta.reduce((prev, current) => (prev.tiempoPromedioMin > current.tiempoPromedioMin) ? prev : current)
      
      const excesoPromedio = ((rutaLenta.tiempoPromedioMin - promedioGeneral) / promedioGeneral) * 100
      
      let nivel = 'info'
      if (excesoPromedio > 50) nivel = 'critico'
      else if (excesoPromedio >= 20) nivel = 'advertencia'

      nuevosInsights.push({
        id: 'ruta-critica',
        nivel,
        icono: nivel === 'critico' ? 'XCircle' : nivel === 'advertencia' ? 'AlertTriangle' : 'Clock',
        titulo: 'Ruta más lenta',
        descripcion: `Ruta ${rutaLenta.nombre} toma ${rutaLenta.tiempoPromedioMin} min promedio, un ${Math.round(excesoPromedio)}% más que el promedio de ${promedioGeneral.toFixed(1)} min.`,
        accion: 'Considerar redistribuir waypoints o asignar vehículo más rápido a esta ruta'
      })
    }

    // 3. Estado de anomalías
    if (anomalias.length === 0) {
      nuevosInsights.push({
        id: 'anomalias',
        nivel: 'info',
        icono: 'Activity',
        titulo: 'Estado de anomalías',
        descripcion: 'Operación normal. Todos los vehículos activos se mueven dentro de los parámetros esperados.',
        accion: 'Mantener monitoreo estándar'
      })
    } else if (anomalias.length <= 2) {
      nuevosInsights.push({
        id: 'anomalias',
        nivel: 'advertencia',
        icono: 'AlertTriangle',
        titulo: 'Estado de anomalías',
        descripcion: `${anomalias.length} vehículo(s) llevan más de 15 min detenidos en ruta activa.`,
        accion: 'Contactar a los operadores para verificar estado'
      })
    } else {
      nuevosInsights.push({
        id: 'anomalias',
        nivel: 'critico',
        icono: 'XCircle',
        titulo: 'Estado de anomalías',
        descripcion: `${anomalias.length} vehículos llevan más de 15 min detenidos en ruta activa.`,
        accion: 'Atención inmediata requerida, posible bloqueo en ruta'
      })
    }

    // 4. Tasa de actividad
    if (stats.vehiculosTotal > 0) {
      const tasaActividad = (stats.vehiculosActivos / stats.vehiculosTotal) * 100
      let nivel = 'info'
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
        accion: sugerencia
      })
    }

    return nuevosInsights
  }, [stats, kmPorVehiculo, tiempoPorRuta, anomalias])

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

      {/* ── Recomendaciones del Sistema ── */}
      {!isLoading && insights.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden transition-all duration-200">
          {/* Header — siempre visible, clickeable */}
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('analisis_recomendaciones_abierto', String(!abierto))
              setAbierto(!abierto)
            }}
            className="w-full flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Lightbulb className="h-5 w-5 text-warning flex-shrink-0" />
              <div className="text-left">
                <h3 className="text-base font-semibold text-foreground">Recomendaciones del Sistema</h3>
                {abierto && (
                  <p className="text-sm text-muted-foreground">Basado en datos operativos en tiempo real</p>
                )}
              </div>
              {!abierto && (
                <span className="ml-1 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {insights.length} recomendaciones
                </span>
              )}
            </div>
            <span className="flex-shrink-0 text-muted-foreground">
              {abierto ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </button>

          {/* Contenido — solo se renderiza cuando está abierto */}
          {abierto && (
            <div className="px-6 pb-6 grid gap-4 sm:grid-cols-2">
              {insights.map(insight => (
                <InsightCard
                  key={insight.id}
                  nivel={insight.nivel as any}
                  icono={insight.icono}
                  titulo={insight.titulo}
                  descripcion={insight.descripcion}
                  accion={insight.accion}
                />
              ))}
            </div>
          )}
        </div>
      )}

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
                  <defs>
                    <linearGradient id="gradKm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
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
                  <Bar dataKey="kmTotal" fill="url(#gradKm)" radius={[3, 3, 0, 0]}>
                    <LabelList dataKey="kmTotal" position="top" formatter={(v: number) => `${v.toFixed(1)} km`} className="text-xs fill-foreground" />
                  </Bar>
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
                <defs>
                  <linearGradient id="gradTiempo" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
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
                <Bar dataKey="tiempoPromedioMin" fill="url(#gradTiempo)" radius={[0,4,4,0]}>
                  <LabelList dataKey="tiempoPromedioMin" position="right"
                    formatter={(v: number) => `${v.toFixed(0)} min`}
                    className="text-xs fill-muted-foreground" />
                </Bar>
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
