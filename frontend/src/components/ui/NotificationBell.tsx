import { useState, useEffect, useRef } from 'react'
import { Bell, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notificacion {
  _id: string
  vehiculoId: string
  tipo: 'llegada' | 'cambio_estado' | 'anomalia'
  mensaje: string
  timestamp: string
  leida: boolean
}

function tiempoRelativo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const minutos = Math.floor(diff / 60_000)
  if (minutos < 1) return 'ahora mismo'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  return `hace ${Math.floor(horas / 24)} d`
}

const iconoPorTipo = {
  llegada:       CheckCircle,
  cambio_estado: RefreshCw,
  anomalia:      AlertTriangle,
} as const

const colorPorTipo = {
  llegada:       'text-green-500',
  cambio_estado: 'text-blue-500',
  anomalia:      'text-amber-500',
} as const

export function NotificationBell() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchNotificaciones = async () => {
    try {
      const res = await fetch('/api/notificaciones?leida=false')
      if (!res.ok) return
      const data: Notificacion[] = await res.json()
      setNotificaciones(data)
    } catch {
      // ignorar errores de red silenciosamente
    }
  }

  // carga inicial + polling cada 30 s
  useEffect(() => {
    fetchNotificaciones()
    const id = setInterval(fetchNotificaciones, 30_000)
    return () => clearInterval(id)
  }, [])

  // cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const recientes = [...notificaciones]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)

  const count = notificaciones.length

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-lg z-50">
          {/* cabecera */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Notificaciones</span>
            {count > 0 && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                {count} sin leer
              </span>
            )}
          </div>

          {/* lista */}
          <ul className="max-h-72 overflow-y-auto divide-y divide-border">
            {recientes.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                Sin notificaciones pendientes
              </li>
            ) : (
              recientes.map(n => {
                const Icono = iconoPorTipo[n.tipo]
                return (
                  <li key={n._id}>
                    <button className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-secondary transition-colors">
                      <Icono
                        className={cn('mt-0.5 h-4 w-4 flex-shrink-0', colorPorTipo[n.tipo])}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-snug">{n.mensaje}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {tiempoRelativo(n.timestamp)}
                        </p>
                      </div>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
