import { useState, useEffect } from 'react'
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
import { Truck, Navigation, Package, AlertTriangle } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Design tokens — paleta única                                        */
/* ------------------------------------------------------------------ */
const C = {
  bg:      '#0b0e18',  // fondo de página
  surface: '#111827',  // fondo de tarjeta/panel
  border:  '#1d2740',  // borde general
  text:    '#dde3f0',  // texto principal
  muted:   '#5b6887',  // texto secundario
  accent:  '#4f72ff',  // único color de marca
  accent2: '#7c9dff',  // variante clara del accent (gráfica tiempo)
  danger:  '#e05252',  // solo para alertas reales
  grid:    '#192033',  // líneas de cuadrícula en gráficas
}

/* ------------------------------------------------------------------ */
/*  Estilos reutilizables                                               */
/* ------------------------------------------------------------------ */
const s = {
  page: {
    padding: '1.75rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    background: C.bg,
    minHeight: '100vh',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    fontSize: '0.875rem',
    color: C.text,
    boxSizing: 'border-box',
  },
  /* ── Header ── */
  header: {
    paddingBottom: '1.25rem',
    borderBottom: `1px solid ${C.border}`,
  },
  h2: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 700,
    color: C.text,
    letterSpacing: '-0.01em',
  },
  sub: {
    margin: '0.25rem 0 0',
    fontSize: '0.8rem',
    color: C.muted,
    letterSpacing: '0.01em',
  },
  /* ── Paneles de gráfica ── */
  panel: {
    background: C.surface,
    borderRadius: '8px',
    padding: '1.25rem 1.5rem',
    border: `1px solid ${C.border}`,
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  panelTitle: {
    margin: 0,
    fontSize: '0.875rem',
    fontWeight: 600,
    color: C.text,
    letterSpacing: '0.01em',
  },
  legend: {
    fontSize: '0.75rem',
    color: C.muted,
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
    flexShrink: 0,
  },
  chartBox: { height: '300px' },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '1.25rem',
  },
  /* ── Estados vacíos / carga ── */
  spinner: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    color: C.muted,
    fontSize: '0.8rem',
  },
  empty: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    color: C.muted,
    fontSize: '0.8rem',
    border: `1px dashed ${C.border}`,
    borderRadius: '6px',
  },
  /* ── Tabla ── */
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.8rem',
  },
  th: {
    textAlign: 'left',
    padding: '0.5rem 0.75rem',
    color: C.muted,
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    borderBottom: `1px solid ${C.border}`,
  },
  td: {
    padding: '0.6rem 0.75rem',
    borderBottom: `1px solid ${C.border}`,
    color: C.text,
  },
  badgeDanger: {
    display: 'inline-block',
    background: 'rgba(224,82,82,0.12)',
    color: C.danger,
    borderRadius: '4px',
    padding: '0.15rem 0.55rem',
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.03em',
  },
  alertSub: {
    margin: '0 0 1rem',
    fontSize: '0.78rem',
    color: C.muted,
  },
} as const

/* Tooltip compartido para todos los charts */
const TT = {
  contentStyle: {
    background: '#0d1221',
    border: `1px solid ${C.border}`,
    borderRadius: '6px',
    fontSize: '0.8rem',
    color: C.text,
    padding: '0.5rem 0.75rem',
  },
  labelStyle: { color: C.text, fontWeight: 600, marginBottom: '0.2rem' },
  cursor: { fill: 'rgba(79,114,255,0.05)' },
}

/* ------------------------------------------------------------------ */
/*  Componente                                                           */
/* ------------------------------------------------------------------ */
export function DashboardBI() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [kmPorVehiculo, setKmPorVehiculo] = useState<any[]>([])
  const [entregasPorDia, setEntregasPorDia] = useState<any[]>([])
  const [tiempoPorRuta, setTiempoPorRuta] = useState<any[]>([])
  const [anomalias, setAnomalias] = useState<any[]>([])

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [resumenRes, kmRes, entregasRes, tiempoRes, anomaliasRes] =
          await Promise.all([
            axios.get('/api/analitica/kpi/resumen'),
            axios.get('/api/analitica/kpi/km-por-vehiculo'),
            axios.get('/api/analitica/kpi/entregas-por-dia'),
            axios
              .get('/api/analitica/kpi/tiempo-por-ruta')
              .catch(() => ({ data: { datos: [] } })),
            axios.get('/api/analitica/reportes/anomalias'),
          ])

        setStats(resumenRes.data)
        setKmPorVehiculo(kmRes.data.datos ?? [])
        setEntregasPorDia(entregasRes.data.datos ?? [])
        setTiempoPorRuta(tiempoRes.data.datos ?? [])
        setAnomalias(anomaliasRes.data.anomalias ?? [])
      } catch (err) {
        console.error('Error al cargar datos de analítica:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAll()
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Header ── */}
      <div style={s.header}>
        <h2 className="text-2xl font-bold text-foreground">Dashboard BI</h2>
        <p className="text-muted-foreground">Indicadores clave · Toma de Decisiones</p>
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

      {/* ── Fila: BarChart km + LineChart entregas ── */}
      <div style={s.grid2}>

        {/* BarChart: Km por vehículo */}
        <div style={s.panel}>
          <div style={s.panelHeader}>
            <h3 style={s.panelTitle}>Km Recorridos por Vehículo</h3>
            <span style={s.legend}>
              <span style={{ ...s.legendDot, background: C.accent }} />
              km totales hoy
            </span>
          </div>
          <div style={s.chartBox}>
            {isLoading ? (
              <div style={s.spinner}>Cargando…</div>
            ) : kmPorVehiculo.length === 0 ? (
              <div style={s.empty}>Sin datos de trayecto disponibles</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kmPorVehiculo} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                  <XAxis
                    dataKey="placa"
                    stroke={C.muted}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={C.muted}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    unit=" km"
                  />
                  <Tooltip
                    {...TT}
                    formatter={(v) => [`${v} km`, 'Km totales']}
                  />
                  <Bar dataKey="kmTotal" fill={C.accent} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* LineChart: Entregas por día */}
        <div style={s.panel}>
          <div style={s.panelHeader}>
            <h3 style={s.panelTitle}>Entregas por Día</h3>
            <span style={s.legend}>
              <span style={{ ...s.legendDot, background: C.accent }} />
              entregas realizadas
            </span>
          </div>
          <div style={s.chartBox}>
            {isLoading ? (
              <div style={s.spinner}>Cargando…</div>
            ) : entregasPorDia.length === 0 ? (
              <div style={s.empty}>Sin historial de entregas disponible</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={entregasPorDia}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                  <XAxis
                    dataKey="fecha"
                    stroke={C.muted}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={C.muted}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    {...TT}
                    formatter={(v) => [`${v}`, 'Entregas']}
                  />
                  <Line
                    type="monotone"
                    dataKey="entregas"
                    stroke={C.accent}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: C.accent, strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>{/* fin grid 2 cols */}

      {/* ── Tabla de alertas ── */}
      <div style={s.panel}>
        <div style={s.panelHeader}>
          <h3 style={s.panelTitle}>Alertas de Vehículos</h3>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              background: 'rgba(224,82,82,0.1)',
              color: C.danger,
              borderRadius: '4px',
              padding: '0.2rem 0.6rem',
            }}
          >
            {anomalias.length} {anomalias.length === 1 ? 'activa' : 'activas'}
          </span>
        </div>
        <p style={s.alertSub}>
          Vehículos detenidos en ruta activa por más de 15 minutos
        </p>
        {isLoading ? (
          <div style={{ ...s.spinner, height: '80px' }}>Cargando…</div>
        ) : anomalias.length === 0 ? (
          <div style={{ ...s.empty, height: '80px' }}>
            Operación normal — sin alertas
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Placa</th>
                  <th style={s.th}>ID Vehículo</th>
                  <th style={s.th}>Tiempo detenido</th>
                  <th style={s.th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {anomalias.map((a: any, i: number) => (
                  <tr key={`${a.vehiculoId}-${i}`}>
                    <td style={{ ...s.td, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                      {a.placa}
                    </td>
                    <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '0.75rem', color: C.muted }}>
                      {a.vehiculoId}
                    </td>
                    <td style={{ ...s.td, color: C.danger, fontWeight: 700 }}>
                      {a.minutosDetenido} min
                    </td>
                    <td style={s.td}>
                      <span style={s.badgeDanger}>Detenido</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── BarChart horizontal: tiempo por ruta ── */}
      <div style={s.panel}>
        <div style={s.panelHeader}>
          <h3 style={s.panelTitle}>Tiempo Promedio por Ruta</h3>
          <span style={s.legend}>
            <span style={{ ...s.legendDot, background: C.accent2 }} />
            minutos promedio
          </span>
        </div>
        <div style={s.chartBox}>
          {isLoading ? (
            <div style={s.spinner}>Cargando…</div>
          ) : tiempoPorRuta.length === 0 ? (
            <div style={s.empty}>Sin datos de rutas disponibles</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={tiempoPorRuta} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
                <XAxis
                  type="number"
                  stroke={C.muted}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  unit=" min"
                />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  width={130}
                  stroke={C.muted}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  {...TT}
                  formatter={(v) => [`${v} min`, 'Tiempo promedio']}
                />
                <Bar
                  dataKey="tiempoPromedioMin"
                  fill={C.accent2}
                  radius={[0, 3, 3, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  )
}
