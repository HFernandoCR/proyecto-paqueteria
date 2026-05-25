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

/* ------------------------------------------------------------------ */
/*  Estilos en línea reutilizables                                      */
/* ------------------------------------------------------------------ */
const s = {
  page: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    background: '#0f1117',
    minHeight: '100vh',
    fontFamily: "'Segoe UI', sans-serif",
    color: '#f1f5f9',
    boxSizing: 'border-box',
  },
  /* Header */
  header: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  h2: { margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9' },
  sub: { margin: 0, fontSize: '0.875rem', color: '#94a3b8' },
  /* Grid de 4 tarjetas */
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1rem',
  },
  kpiCard: {
    background: '#1e2130',
    borderRadius: '12px',
    padding: '1.25rem',
    border: '1px solid #2d3148',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  kpiLabel: { fontSize: '0.8rem', color: '#94a3b8', margin: 0 },
  kpiValue: { fontSize: '2rem', fontWeight: 700, margin: 0 },
  kpiSub: { fontSize: '0.75rem', margin: 0 },
  /* Sección de gráfica */
  chartSection: {
    background: '#1e2130',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #2d3148',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  chartTitle: { margin: 0, fontSize: '1rem', fontWeight: 600 },
  chartGrid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '1.5rem',
  },
  chartBox: { height: '260px' },
  /* Spinner */
  spinner: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    color: '#94a3b8',
    fontSize: '0.875rem',
  },
  /* Tabla */
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th: {
    textAlign: 'left',
    padding: '0.5rem 0.75rem',
    color: '#94a3b8',
    fontSize: '0.75rem',
    fontWeight: 600,
    borderBottom: '1px solid #2d3148',
  },
  td: { padding: '0.65rem 0.75rem', borderBottom: '1px solid #2d3148' },
  badgeDanger: {
    display: 'inline-block',
    background: 'rgba(239,68,68,0.15)',
    color: '#ef4444',
    borderRadius: '20px',
    padding: '0.2rem 0.65rem',
    fontSize: '0.72rem',
    fontWeight: 600,
  },
  empty: {
    textAlign: 'center',
    padding: '2rem',
    color: '#64748b',
    fontSize: '0.875rem',
    border: '1px dashed #2d3148',
    borderRadius: '8px',
  },
}

/* colores de acento para cada KPI */
const KPI_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

/* tooltip personalizado de recharts */
const tooltipStyle = {
  contentStyle: {
    background: '#1e2130',
    border: '1px solid #2d3148',
    borderRadius: '8px',
    color: '#f1f5f9',
  },
  labelStyle: { color: '#f1f5f9', fontWeight: 700 },
}

/* ------------------------------------------------------------------ */
/*  Componente principal                                                 */
/* ------------------------------------------------------------------ */
export function DashboardBI() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [kmPorVehiculo, setKmPorVehiculo] = useState([])
  const [entregasPorDia, setEntregasPorDia] = useState([])
  const [tiempoPorRuta, setTiempoPorRuta] = useState([])
  const [anomalias, setAnomalias] = useState([])

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

  /* ── KPI cards config ── */
  const kpis = [
    {
      label: 'Vehículos Activos',
      value: stats ? `${stats.vehiculosActivos}` : '—',
      sub: stats ? `de ${stats.vehiculosTotal} registrados` : '',
    },
    {
      label: 'Km Recorridos Hoy',
      value: stats ? `${stats.kmRecorridosHoy}` : '—',
      sub: 'km totales del día',
    },
    {
      label: 'Entregas Hoy',
      value: stats ? `${stats.entregasHoy}` : '—',
      sub: 'paquetes entregados',
    },
    {
      label: 'Vehículos Detenidos',
      value: stats ? `${stats.vehiculosDetenidos}` : '—',
      sub:
        stats && stats.vehiculosDetenidos > 0
          ? '⚠ requieren atención'
          : '✅ sin incidencias',
    },
  ]

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={s.header}>
        <h2 style={s.h2}>📊 Dashboard BI</h2>
        <p style={s.sub}>
          Indicadores clave de rendimiento · Toma de Decisiones
        </p>
      </div>

      {/* ── Tarjetas KPI ── */}
      <div style={s.kpiGrid}>
        {kpis.map((kpi, i) => (
          <div key={kpi.label} style={s.kpiCard}>
            <p style={s.kpiLabel}>{kpi.label}</p>
            <p style={{ ...s.kpiValue, color: KPI_COLORS[i] }}>
              {isLoading ? '…' : kpi.value}
            </p>
            <p style={{ ...s.kpiSub, color: KPI_COLORS[i] + 'cc' }}>
              {kpi.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ── Fila: BarChart km + LineChart entregas ── */}
      <div style={s.chartGrid2}>

      {/* ── BarChart: Km recorridos por vehículo ── */}
      <div style={s.chartSection}>
        <div style={s.chartHeader}>
          <h3 style={s.chartTitle}>📦 Km Recorridos por Vehículo</h3>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            ● km totales hoy
          </span>
        </div>

        <div style={s.chartBox}>
          {isLoading ? (
            <div style={s.spinner}>Cargando datos…</div>
          ) : kmPorVehiculo.length === 0 ? (
            <div style={s.empty}>Sin datos de trayecto disponibles</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kmPorVehiculo}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
                <XAxis
                  dataKey="placa"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  unit=" km"
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(v) => [`${v} km`, 'Km totales']}
                />
                <Bar dataKey="kmTotal" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── LineChart: Entregas por día ── */}
      <div style={s.chartSection}>
        <div style={s.chartHeader}>
          <h3 style={s.chartTitle}>📈 Entregas por Día</h3>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            ● entregas realizadas
          </span>
        </div>

        <div style={s.chartBox}>
          {isLoading ? (
            <div style={s.spinner}>Cargando datos…</div>
          ) : entregasPorDia.length === 0 ? (
            <div style={s.empty}>Sin historial de entregas disponible</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={entregasPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
                <XAxis
                  dataKey="fecha"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(v) => [`${v}`, 'Entregas']}
                />
                <Line
                  type="monotone"
                  dataKey="entregas"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      </div>{/* fin grid 2 columnas */}

      {/* ── Tabla de anomalías ── */}
      <div style={s.chartSection}>
        <div style={s.chartHeader}>
          <h3 style={s.chartTitle}>🚨 Vehículos con Anomalía</h3>
          <span
            style={{
              fontSize: '0.78rem',
              background: 'rgba(239,68,68,0.12)',
              color: '#ef4444',
              borderRadius: '20px',
              padding: '0.2rem 0.7rem',
              fontWeight: 600,
            }}
          >
            {anomalias.length} activas
          </span>
        </div>
        <p style={{ ...s.kpiSub, color: '#64748b', marginBottom: '1rem' }}>
          Vehículos detenidos en ruta activa por más de 15 minutos
        </p>

        {isLoading ? (
          <div style={s.spinner}>Cargando datos…</div>
        ) : anomalias.length === 0 ? (
          <div style={s.empty}>
            ✅ Operación normal — sin anomalías reportadas
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
                {anomalias.map((a, i) => (
                  <tr key={`${a.vehiculoId}-${i}`}>
                    <td style={{ ...s.td, fontWeight: 700, fontFamily: 'monospace' }}>
                      {a.placa}
                    </td>
                    <td
                      style={{
                        ...s.td,
                        fontFamily: 'monospace',
                        fontSize: '0.78rem',
                        color: '#94a3b8',
                      }}
                    >
                      {a.vehiculoId}
                    </td>
                    <td style={{ ...s.td, color: '#ef4444', fontWeight: 700 }}>
                      {a.minutosDetenido} min
                    </td>
                    <td style={s.td}>
                      <span style={s.badgeDanger}>⚠ Detenido</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── BarChart horizontal: tiempo promedio por ruta ── */}
      <div style={s.chartSection}>
        <div style={s.chartHeader}>
          <h3 style={s.chartTitle}>⏱ Tiempo Promedio por Ruta (min)</h3>
          <span style={{ fontSize: '0.8rem', color: '#f59e0b' }}>
            ● minutos promedio
          </span>
        </div>

        <div style={s.chartBox}>
          {isLoading ? (
            <div style={s.spinner}>Cargando datos…</div>
          ) : tiempoPorRuta.length === 0 ? (
            <div style={s.empty}>Sin datos de rutas disponibles</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={tiempoPorRuta}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  unit=" min"
                />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  width={130}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(v) => [`${v} min`, 'Tiempo promedio']}
                />
                <Bar
                  dataKey="tiempoPromedioMin"
                  fill="#f59e0b"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
