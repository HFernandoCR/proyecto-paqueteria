import { useState, useEffect } from 'react'
import { X, Plus, Trash2, MapPin } from 'lucide-react'

interface Waypoint {
  lat: number
  lng: number
}

interface WaypointsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (waypoints: Waypoint[]) => void
  waypoints: Waypoint[]
  rutaNombre: string
}

export function WaypointsModal({ isOpen, onClose, onSave, waypoints: initialWaypoints, rutaNombre }: WaypointsModalProps) {
  const [waypoints, setWaypoints] = useState<Waypoint[]>(initialWaypoints)
  const [newLat, setNewLat] = useState('')
  const [newLng, setNewLng] = useState('')

  useEffect(() => {
    if (isOpen) {
      setWaypoints(initialWaypoints)
    }
  }, [isOpen, initialWaypoints])

  const handleAddWaypoint = () => {
    const lat = parseFloat(newLat)
    const lng = parseFloat(newLng)
    
    if (!isNaN(lat) && !isNaN(lng)) {
      setWaypoints([...waypoints, { lat, lng }])
      setNewLat('')
      setNewLng('')
    }
  }

  const handleRemoveWaypoint = (index: number) => {
    setWaypoints(waypoints.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    onSave(waypoints)
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
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Puntos</h2>
            <p className="text-sm text-muted-foreground">{rutaNombre}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 p-4 rounded-lg bg-secondary/30 border border-border">
          <p className="text-sm font-medium text-foreground mb-3">Agregar nuevo punto</p>
          <div className="flex items-end gap-2">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground ml-1">Latitud</label>
              <input
                type="number"
                step="any"
                value={newLat}
                onChange={(e) => setNewLat(e.target.value)}
                placeholder="Ej: 17.0700"
                className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground ml-1">Longitud</label>
              <input
                type="number"
                step="any"
                value={newLng}
                onChange={(e) => setNewLng(e.target.value)}
                placeholder="Ej: -96.7200"
                className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAddWaypoint}
              disabled={!newLat || !newLng}
              className="h-[38px] rounded-lg bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Waypoints list */}
        <div className="flex-1 overflow-auto mb-4">
          {waypoints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MapPin className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No hay puntos definidos</p>
              <p className="text-sm text-muted-foreground/70">Agrega coordenadas Lat/Lng arriba</p>
            </div>
          ) : (
            <div className="space-y-2">
              {waypoints.map((wp, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="font-mono text-sm">
                      <span className="text-foreground">{wp.lat.toFixed(4)}</span>
                      <span className="text-muted-foreground">, </span>
                      <span className="text-foreground">{wp.lng.toFixed(4)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveWaypoint(index)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
          >
            Guardar Puntos
          </button>
        </div>
      </div>
    </div>
  )
}
