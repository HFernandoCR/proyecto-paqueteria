import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Download, Calendar, Truck, AlertTriangle, Clock, Ruler } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import axios from 'axios'

export function Reportes() {
  const [stats, setStats] = useState<any>(null)
  const [kmPorVehiculo, setKmPorVehiculo] = useState<any[]>([])
  const [entregasPorDia, setEntregasPorDia] = useState<any[]>([])
  const [anomalias, setAnomalias] = useState<any[]>([])
  const [tiempoPromedio, setTiempoPromedio] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const [resumenRes, kmRes, entregasRes, anomaliasRes, tiempoRes] = await Promise.all([
          axios.get('/api/analitica/kpi/resumen'),
          axios.get('/api/analitica/kpi/km-por-vehiculo'),
          axios.get('/api/analitica/kpi/entregas-por-dia'),
          axios.get('/api/analitica/reportes/anomalias'),
          axios.get('/api/analitica/kpi/tiempo-por-ruta').catch(() => ({ data: { datos: [] } }))
        ])

        setStats(resumenRes.data)
        setKmPorVehiculo(kmRes.data.datos || [])
        setEntregasPorDia(entregasRes.data.datos || [])
        setAnomalias(anomaliasRes.data.anomalias || [])

        const tiempos = tiempoRes.data.datos || []
        if (tiempos.length > 0) {
          const avg = tiempos.reduce((acc: number, t: any) => acc + (t.tiempoPromedioMin || 0), 0) / tiempos.length
          setTiempoPromedio(Math.round(avg))
        } else {
          setTiempoPromedio(45) // fallback default
        }
      } catch (err) {
        console.error("Error fetching analytics data for reports:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReportData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reportes y Análisis</h2>
          <p className="text-muted-foreground">Visualiza el rendimiento de tu operación en tiempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
            <Calendar className="h-4 w-4" />
            Últimos 30 días
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Vehículos Activos</p>
            <Truck className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {isLoading ? '...' : stats ? stats.vehiculosActivos : 0}
          </p>
          <p className="text-xs text-muted-foreground">de {stats ? stats.vehiculosTotal : 0} registrados</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Km Totales Hoy</p>
            <Ruler className="h-4 w-4 text-success" />
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {isLoading ? '...' : stats ? stats.kmRecorridosHoy : 0}
          </p>
          <p className="text-xs text-success">Km recorridos hoy</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Tiempo Prom. Viaje</p>
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {isLoading ? '...' : `${tiempoPromedio} min`}
          </p>
          <p className="text-xs text-muted-foreground">promedio por ruta activa</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Anomalías Activas</p>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {isLoading ? '...' : anomalias.length}
          </p>
          <p className="text-xs text-destructive">{anomalias.length > 0 ? 'Requieren atención' : 'Operación estable'}</p>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart 1: Km por vehiculo */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Km por Vehículo</h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">Km totales</span>
              </span>
            </div>
          </div>
          
          <div className="h-64 rounded-lg bg-secondary/10 p-3 border border-border">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <span className="flex h-6 w-6 rounded-full border-2 border-muted border-t-primary animate-spin" />
              </div>
            ) : kmPorVehiculo.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Sin datos de trayecto disponibles</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kmPorVehiculo}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="placa" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="kmTotal" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Serie temporal de trayectos */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Entregas por Día</h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-success" />
                <span className="text-muted-foreground font-medium">Entregas realizadas</span>
              </span>
            </div>
          </div>
          
          <div className="h-64 rounded-lg bg-secondary/10 p-3 border border-border">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <span className="flex h-6 w-6 rounded-full border-2 border-muted border-t-primary animate-spin" />
              </div>
            ) : entregasPorDia.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Sin historial de entregas</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={entregasPorDia}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="fecha" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="entregas" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Operadores */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Top Operadores por Km</h3>
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            Sin datos disponibles
          </div>
        </div>

        {/* Reporte de Anomalias */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Reporte de Anomalías</h3>
            <span className="inline-flex items-center rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {anomalias.length} activas
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Vehículos detenidos en ruta activa por más de 15 minutos
          </p>
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <span className="flex h-6 w-6 rounded-full border-2 border-muted border-t-primary animate-spin" />
              </div>
            ) : anomalias.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-secondary/5 rounded-lg border border-border border-dashed">
                Operación normal, sin anomalías reportadas.
              </div>
            ) : (
              anomalias.map((anomalia, idx) => (
                <div key={`${anomalia.placa}-${idx}`} className="flex items-center justify-between py-3 px-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-destructive/10 p-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="font-mono font-semibold text-foreground">{anomalia.placa}</p>
                      <p className="text-xs text-muted-foreground">ID de Vehículo: {anomalia.vehiculoId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-destructive">{anomalia.minutosDetenido} min</p>
                    <p className="text-xs text-muted-foreground">detenido</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
