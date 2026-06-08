import { useState, useEffect } from 'react'
import { Truck, Package, AlertTriangle } from 'lucide-react'
import { KpiCard } from '@/components/ui/KpiCard'
import { MapContainer } from '@/components/ui/MapContainer'
import { ActivityFeed } from '@/components/ui/ActivityFeed'
import axios from 'axios'

export function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [anomaliasCount, setAnomaliasCount] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<string>('cargando...')

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        const [resumenRes, anomaliasRes] = await Promise.all([
          axios.get('/api/analitica/kpi/resumen'),
          axios.get('/api/analitica/reportes/anomalias')
        ])

        setStats(resumenRes.data)
        setAnomaliasCount(anomaliasRes.data.total)
        setLastUpdated(new Date().toLocaleTimeString())
      } catch (err) {
        console.error("Error loading dashboard KPIs:", err)
      }
    }

    loadDashboardStats()
    const interval = setInterval(loadDashboardStats, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-bold text-foreground">Dashboard Principal</h2>
          <p className="text-muted-foreground">Operaciones en tiempo real</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          Actualizado: {lastUpdated}
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title="Vehículos Activos"
          value={stats ? String(stats.vehiculosActivos) : '...'}
          subtitle={stats ? `de ${stats.vehiculosTotal} totales` : 'Cargando...'}
          icon={Truck}
          trend={stats && stats.vehiculosTotal > 0 ? { value: Math.round((stats.vehiculosActivos / stats.vehiculosTotal) * 100), isPositive: true } : undefined}
          accentColor="primary"
        />
        <KpiCard
          title="Entregas Hoy"
          value={stats ? String(stats.entregasHoy) : '...'}
          subtitle={stats ? `${stats.kmRecorridosHoy} km recorridos` : 'Cargando...'}
          icon={Package}
          accentColor="info"
        />
        <KpiCard
          title="Alertas Activas"
          value={String(anomaliasCount)}
          subtitle={anomaliasCount > 0 ? 'Requiere atención' : 'Operación normal'}
          icon={AlertTriangle}
          accentColor="destructive"
        />
      </div>
      
      {/* Main content grid */}
      <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
        {/* Map container - takes 2 columns */}
        <div className="lg:col-span-2">
          <MapContainer />
        </div>
        
        {/* Activity feed */}
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
