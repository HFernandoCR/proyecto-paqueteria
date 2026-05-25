import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Waypoint {
  lat: number
  lng: number
}

interface Ruta {
  id: string | number
  _id?: string
  nombre: string
  origen: string
  destino: string
  distanciaKm: number
  duracionMin: number
  waypoints: Waypoint[]
}

interface RutaModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Omit<Ruta, 'id'>) => void
  ruta: Ruta | null
}

export function RutaModal({ isOpen, onClose, onSave, ruta }: RutaModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    origen: '',
    destino: '',
    distanciaKm: 0,
    duracionMin: 0,
    waypoints: [] as Waypoint[],
  })

  useEffect(() => {
    if (ruta) {
      setFormData({
        nombre: ruta.nombre,
        origen: ruta.origen,
        destino: ruta.destino,
        distanciaKm: ruta.distanciaKm,
        duracionMin: ruta.duracionMin,
        waypoints: ruta.waypoints,
      })
    } else {
      setFormData({
        nombre: '',
        origen: '',
        destino: '',
        distanciaKm: 0,
        duracionMin: 0,
        waypoints: [],
      })
    }
  }, [ruta, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {ruta ? 'Editar Ruta' : 'Agregar Ruta'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nombre de la Ruta
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ruta Norte CDMX"
              required
              className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Origen (Direccion)
            </label>
            <input
              type="text"
              value={formData.origen}
              onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
              placeholder="Av. Insurgentes Norte 1500, Gustavo A. Madero"
              required
              className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Destino (Direccion)
            </label>
            <input
              type="text"
              value={formData.destino}
              onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
              placeholder="Central de Abastos, Iztapalapa"
              required
              className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Distancia (Km)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.distanciaKm}
                onChange={(e) => setFormData({ ...formData, distanciaKm: parseFloat(e.target.value) || 0 })}
                placeholder="35.5"
                required
                min={0.1}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Duracion Estimada (Min)
              </label>
              <input
                type="number"
                value={formData.duracionMin}
                onChange={(e) => setFormData({ ...formData, duracionMin: parseInt(e.target.value) || 0 })}
                placeholder="65"
                required
                min={1}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Los waypoints se gestionan desde la tabla principal despues de crear la ruta.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
            >
              {ruta ? 'Guardar Cambios' : 'Agregar Ruta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
