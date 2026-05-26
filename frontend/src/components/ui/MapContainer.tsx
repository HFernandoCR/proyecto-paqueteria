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

const estadoColor: Record<string, string> = {
  en_ruta:      '#10b981', // verde
  entregando:   '#3b82f6', // azul
  detenido:     '#ef4444', // rojo
  disponible:   '#71717a', // gris
  mantenimiento:'#f59e0b', // amarillo
}

const createVehicleIcon = (status: string) => {
  const color = estadoColor[status] ?? '#71717a';
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
        // La API devuelve [{vehiculo: {...}, ubicacionActual: {lat,lng,...}|null}].
        // Solo mostramos vehículos con coordenadas conocidas.
        const items: any[] = res.data || []
        const mapped = items
          .filter((item) => item.ubicacionActual?.lat != null && item.ubicacionActual?.lng != null)
          .map((item) => ({
            _id:          item.vehiculo._id,
            placa:        item.vehiculo.placa,
            modelo:       item.vehiculo.modelo,
            estadoActual: item.vehiculo.estadoActual,
            lat:          item.ubicacionActual.lat,
            lng:          item.ubicacionActual.lng,
            velocidadKmh: item.ubicacionActual.velocidadKmh ?? 0,
            bearing:      item.ubicacionActual.bearing ?? 0,
            timestamp:    item.ubicacionActual.timestamp ?? new Date().toISOString(),
          }))
        setVehicles(mapped)
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
            <p className="text-sm text-muted-foreground">Oaxaca y zona metropolitana</p>
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
          center={[17.0732, -96.7266] as [number, number]} 
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
              <Popup className="map-popup" maxWidth={180}>
                <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', color: '#fafafa' }}>
                  {/* Placa */}
                  <p style={{ fontWeight: 700, fontSize: '13px', letterSpacing: '0.06em', marginBottom: '6px' }}>
                    {v.placa}
                  </p>
                  {/* Estado con badge de color */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '7px', height: '7px',
                      borderRadius: '50%',
                      backgroundColor: estadoColor[v.estadoActual] ?? '#71717a',
                      flexShrink: 0,
                    }} />
                    <span style={{
                      color: estadoColor[v.estadoActual] ?? '#71717a',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}>
                      {v.estadoActual.replace('_', ' ')}
                    </span>
                  </div>
                  {/* Velocidad */}
                  {v.velocidadKmh > 0 && (
                    <p style={{ color: '#71717a' }}>{v.velocidadKmh} km/h</p>
                  )}
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
            {([
              { estado: 'disponible',    label: 'Disponible'    },
              { estado: 'en_ruta',       label: 'En ruta'       },
              { estado: 'entregando',    label: 'Entregando'    },
              { estado: 'detenido',      label: 'Detenido'      },
              { estado: 'mantenimiento', label: 'Mantenimiento' },
            ] as const).map(({ estado, label }) => (
              <span key={estado} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: estadoColor[estado] }}
                />
                <span className="text-muted-foreground font-medium">{label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
