import { useState, useEffect } from 'react'
import { X, Plus, Trash2, MapPin } from 'lucide-react'
import { MapContainer as LeafletMap, TileLayer, Marker, useMapEvents, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

const createWaypointIcon = (index: number) => {
  return L.divIcon({
    html: `<div style="background-color: #3b82f6; color: white; border-radius: 50%; border: 2px solid white; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${index + 1}</div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  })
}

function MapEventsHandler({ onMapClick }: { onMapClick: (e: L.LeafletMouseEvent) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e)
    }
  })
  return null
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

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    setWaypoints([...waypoints, { lat: e.latlng.lat, lng: e.latlng.lng }])
  }

  const handleSave = () => {
    onSave(waypoints)
  }

  if (!isOpen) return null

  // Calculate center based on existing waypoints or default to Oaxaca
  const mapCenter: [number, number] = waypoints.length > 0 
    ? [waypoints[0].lat, waypoints[0].lng] 
    : [17.0732, -96.7266]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-5xl rounded-xl border border-border bg-card p-6 shadow-2xl max-h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 shrink-0">
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

        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 overflow-hidden mb-6">
          {/* Formulario y Lista */}
          <div className="w-full lg:w-80 flex flex-col flex-shrink-0">
            <div className="mb-4 p-4 rounded-lg bg-secondary/30 border border-border shrink-0">
              <p className="text-sm font-medium text-foreground mb-3">Agregar manualmente</p>
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
            <div className="flex-1 overflow-auto bg-card rounded-lg border border-border">
              {waypoints.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <MapPin className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No hay puntos definidos</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Haz clic en el mapa para agregarlos rápidamente</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {waypoints.map((wp, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-sm shrink-0">
                          {index + 1}
                        </div>
                        <div className="font-mono text-xs">
                          <span className="text-foreground">{wp.lat.toFixed(5)}</span>
                          <span className="text-muted-foreground mx-1">,</span>
                          <span className="text-foreground">{wp.lng.toFixed(5)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveWaypoint(index)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mapa Interactivo */}
          <div className="flex-1 rounded-xl overflow-hidden border border-border relative min-h-[300px] bg-secondary/10">
            <LeafletMap 
              center={mapCenter} 
              zoom={13} 
              style={{ height: '100%', width: '100%', zIndex: 1 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapEventsHandler onMapClick={handleMapClick} />
              
              {waypoints.map((wp, index) => (
                <Marker 
                  key={index} 
                  position={[wp.lat, wp.lng]} 
                  icon={createWaypointIcon(index)} 
                />
              ))}

              {waypoints.length > 1 && (
                <Polyline 
                  positions={waypoints.map(wp => [wp.lat, wp.lng] as [number, number])} 
                  pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.8 }} 
                />
              )}
            </LeafletMap>
            
            {/* Overlay hint */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-background/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-border flex items-center gap-2 pointer-events-none">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Haz clic en el mapa para agregar puntos</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border shrink-0">
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
