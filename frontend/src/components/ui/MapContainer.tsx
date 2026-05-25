import { useState, useEffect } from 'react'
import { Navigation, Maximize2, MapPin } from 'lucide-react'
import { MapContainer as LeafletMap, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import axios from 'axios'

interface ActiveVehicle {
  _id: string
  placa: string
  modelo: string
  estadoActual: string
  lat: number
  lng: number
  velocidadKmh: number
  bearing: number
  timestamp: string
}

const createVehicleIcon = (status: string) => {
  const color = status === 'entregando' ? '#f59e0b' : '#3b82f6';
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <span class="absolute inline-flex h-4 w-4 rounded-full animate-ping opacity-75" style="background-color: ${color};"></span>
        <span class="relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-white shadow-md" style="background-color: ${color};"></span>
      </div>
    `,
    className: 'custom-vehicle-marker',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
}

export function MapContainer() {
  const [vehicles, setVehicles] = useState<ActiveVehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchActiveVehicles = async () => {
      try {
        const res = await axios.get('/api/seguimiento/activos')
        setVehicles(res.data || [])
      } catch (err) {
        console.error("Error loading active tracking vehicles:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActiveVehicles()
    const interval = setInterval(fetchActiveVehicles, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Navigation className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Seguimiento en Vivo</h3>
            <p className="text-sm text-muted-foreground">Ciudad de México y área metropolitana</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground font-medium">En vivo (3s)</span>
        </div>
      </div>
      
      {/* Map Content */}
      <div className="relative h-[400px] bg-secondary/10">
        {isLoading && vehicles.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center z-[1000] bg-background/50 backdrop-blur-xs">
            <div className="text-center">
              <span className="flex h-8 w-8 rounded-full border-4 border-muted border-t-primary animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Cargando mapa interactivo...</p>
            </div>
          </div>
        ) : null}

        <LeafletMap 
          center={[19.4326, -99.1332] as [number, number]} 
          zoom={11} 
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {vehicles.map((v) => (
            <Marker 
              key={v._id} 
              position={[v.lat, v.lng] as [number, number]} 
              icon={createVehicleIcon(v.estadoActual)}
            >
              <Popup>
                <div className="p-1 space-y-1">
                  <h4 className="font-bold text-foreground">{v.modelo}</h4>
                  <p className="text-xs font-mono text-muted-foreground">Placa: {v.placa}</p>
                  <p className="text-xs text-foreground">
                    Estado: <span className="font-semibold capitalize">{v.estadoActual.replace('_', ' ')}</span>
                  </p>
                  {v.velocidadKmh > 0 ? (
                    <p className="text-xs text-success font-medium">Velocidad: {v.velocidadKmh} km/h</p>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          ))}
        </LeafletMap>
      </div>
      
      {/* Footer with vehicle list */}
      <div className="border-t border-border px-5 py-4 bg-secondary/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm">
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{vehicles.length}</span> vehículos activos en mapa
          </span>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="text-muted-foreground font-medium">En ruta</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-warning" />
              <span className="text-muted-foreground font-medium font-medium">Entregando</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
