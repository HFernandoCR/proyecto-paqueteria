import { useState, useEffect } from 'react'
import { Truck, AlertTriangle, CheckCircle2, Clock, Wrench, StopCircle, Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'
import axios from 'axios'

export function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const [vehiclesRes, anomaliesRes] = await Promise.all([
          axios.get('/api/vehiculos'),
          axios.get('/api/analitica/reportes/anomalias')
        ])

        const list: any[] = []

        // 1. Process anomalies
        const anomalies = anomaliesRes.data.anomalias || []
        anomalies.forEach((anom: any, idx: number) => {
          list.push({
            id: `anomaly-${anom.vehiculoId}-${idx}`,
            type: 'anomaly',
            title: 'Alerta de anomalía',
            description: `Vehículo ${anom.placa} detenido en ruta (+${anom.minutosDetenido} min)`,
            time: 'Alerta',
            icon: AlertTriangle,
            iconColor: 'text-destructive',
            timestamp: Date.now() - anom.minutosDetenido * 60000
          })
        })

        // 2. Process active vehicles
        const vehicles = vehiclesRes.data || []
        vehicles.forEach((v: any) => {
          if (v.estadoActual === 'en_ruta') {
            list.push({
              id: `en-ruta-${v._id}`,
              type: 'route_start',
              title: 'Vehículo en ruta',
              description: `El vehículo ${v.placa} (${v.modelo}) está en ruta activa`,
              time: 'Activo',
              icon: Navigation,
              iconColor: 'text-primary',
              timestamp: new Date(v.updatedAt || Date.now()).getTime()
            })
          } else if (v.estadoActual === 'mantenimiento') {
            list.push({
              id: `mantenimiento-${v._id}`,
              type: 'status_change',
              title: 'Mantenimiento',
              description: `Vehículo ${v.placa} ingresó a taller`,
              time: 'Mantenimiento',
              icon: Wrench,
              iconColor: 'text-warning',
              timestamp: new Date(v.updatedAt || Date.now()).getTime()
            })
          } else if (v.estadoActual === 'entregando') {
            list.push({
              id: `entregando-${v._id}`,
              type: 'arrival',
              title: 'Entregando paquetes',
              description: `Vehículo ${v.placa} está realizando entregas`,
              time: 'Entrega',
              icon: CheckCircle2,
              iconColor: 'text-success',
              timestamp: new Date(v.updatedAt || Date.now()).getTime()
            })
          }
        })

        list.sort((a, b) => b.timestamp - a.timestamp)
        setActivities(list.slice(0, 8))
      } catch (err) {
        console.error("Error loading activities:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadActivities()
    const interval = setInterval(loadActivities, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="rounded-xl border border-border bg-card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Actividad Reciente</h3>
            <p className="text-sm text-muted-foreground">Notificaciones del sistema</p>
          </div>
        </div>
      </div>
      
      {/* Activity list */}
      <div className="flex-1 overflow-auto p-2 min-h-[300px] max-h-[450px]">
        {isLoading && activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center h-full">
            <span className="flex h-6 w-6 rounded-full border-2 border-muted border-t-primary animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Cargando actividad...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center h-full">
            <Truck className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No hay actividad reciente</p>
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map((activity) => {
              const Icon = activity.icon
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-secondary/50"
                >
                  <div className={cn("mt-0.5", activity.iconColor)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="border-t border-border px-5 py-3 mt-auto">
        <button className="w-full rounded-lg bg-secondary py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
          Operación normal
        </button>
      </div>
    </div>
  )
}
