import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'

interface Notificacion {
  _id: string
  vehiculoId: string
  tipo: 'llegada' | 'cambio_estado' | 'anomalia'
  mensaje: string
  timestamp: string
  leida: boolean
}

export function NotificationBell() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])

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

  useEffect(() => {
    fetchNotificaciones()
  }, [])

  const count = notificaciones.length

  return (
    <button
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
  )
}
