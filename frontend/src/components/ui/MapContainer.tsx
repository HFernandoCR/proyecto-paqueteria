import { useState, useEffect, useRef } from 'react'
import { Navigation, Maximize2, MapPin, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
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

interface ActiveVehicleResponse {
  vehiculo: {
    _id: string
    placa: string
    modelo: string
    estadoActual: string
  }
  ubicacionActual?: {
    lat?: number
    lng?: number
    velocidadKmh?: number
    bearing?: number
    timestamp?: string
  }
}

interface HistoryPoint {
  lat?: number
  lng?: number
}

interface HistoryResponse {
  historial?: HistoryPoint[]
}

const estadoColor: Record<string, string> = {
  en_ruta:      '#10b981', // verde
  entregando:   '#3b82f6', // azul
  detenido:     '#ef4444', // rojo
  disponible:   '#71717a', // gris
  mantenimiento:'#f59e0b', // amarillo
}

const createVehicleIcon = (status: string, isLoading: boolean = false) => {
  const color = estadoColor[status] ?? '#71717a';
  const loadingClass = isLoading ? "opacity-50 animate-pulse" : "";
  return L.divIcon({
    html: `
      <div class="${loadingClass}" style="background-color: ${color}; color: white; padding: 5px; border-radius: 50%; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 2px solid white; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; box-sizing: border-box;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v10"/><path d="M14 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M6 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M20 18h2v-4h-7v7"/></svg>
      </div>
    `,
    className: 'custom-vehicle-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

function MapEventsHandler({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({
    click: onMapClick,
  })
  return null
}

export function MapContainer() {
  const [vehicles, setVehicles] = useState<ActiveVehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [historyLoadingId, setHistoryLoadingId] = useState<string | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historyCount, setHistoryCount] = useState<number | null>(null)

  const mapRef = useRef<L.Map | null>(null)
  const polylineRef = useRef<L.Polyline | null>(null)
  const selectedVehicleIdRef = useRef<string | null>(null)

  useEffect(() => {
    selectedVehicleIdRef.current = selectedVehicleId
  }, [selectedVehicleId])

  const handleMapClick = () => {
    if (polylineRef.current) {
      polylineRef.current.remove()
      polylineRef.current = null
    }
    setSelectedVehicleId(null)
    setHistoryError(null)
    setHistoryCount(null)
  }

  const refreshVehicleHistory = async (v: ActiveVehicle, flyToVehicle = false) => {
    try {
      if (flyToVehicle || !polylineRef.current) {
        setHistoryLoadingId(v._id)
      }

      let points: HistoryPoint[] = []
      try {
        const res = await axios.get<HistoryResponse>(`/api/seguimiento/${v._id}/historial`)
        points = res.data.historial || []
      } catch (err) {
        const fallbackRes = await axios.get<HistoryPoint[]>(`/api/ubicacion/ubicaciones/historial/${v._id}`)
        points = fallbackRes.data || []
      }

      const latlngs = points
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
        .map((p) => [p.lat!, p.lng!] as [number, number])

      if (latlngs.length === 0) {
        setHistoryError("Sin historial de recorrido disponible")
      } else {
        setHistoryError(null)
        setHistoryCount(latlngs.length)
        const map = mapRef.current
        if (map) {
          if (polylineRef.current) {
            polylineRef.current.setLatLngs(latlngs)
          } else {
            polylineRef.current = L.polyline(latlngs, {
              color: estadoColor[v.estadoActual] ?? '#71717a',
              weight: 3,
              opacity: 0.8
            }).addTo(map)
          }

          if (flyToVehicle) {
            map.flyTo([v.lat, v.lng], 14, { duration: 1 })
          }
        }
      }
    } catch (err) {
      setHistoryError("Sin historial de recorrido disponible")
      console.error("Error fetching vehicle history:", err)
    } finally {
      setHistoryLoadingId(null)
    }
  }

  const handleVehicleClick = async (v: ActiveVehicle) => {
    if (polylineRef.current) {
      polylineRef.current.remove()
      polylineRef.current = null
    }
    setSelectedVehicleId(v._id)
    setHistoryError(null)
    setHistoryCount(null)
    await refreshVehicleHistory(v, true)
  }

  useEffect(() => {
    return () => {
      if (polylineRef.current) {
        polylineRef.current.remove()
      }
    }
  }, [])

  useEffect(() => {
    const fetchActiveVehicles = async () => {
      try {
        const res = await axios.get('/api/seguimiento/activos')
        // La API devuelve [{vehiculo: {...}, ubicacionActual: {lat,lng,...}|null}].
        // Solo mostramos vehículos con coordenadas conocidas.
        const items: ActiveVehicleResponse[] = res.data || []
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

        const selectedId = selectedVehicleIdRef.current
        const selected = selectedId ? mapped.find((v) => v._id === selectedId) : null
        if (selected) {
          await refreshVehicleHistory(selected)
        }
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
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="shrink-0 rounded-lg bg-primary/10 p-2">
            <Navigation className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-foreground">Seguimiento en Vivo</h3>
            <p className="truncate text-sm text-muted-foreground">Oaxaca y zona metropolitana</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-muted-foreground font-medium">En vivo (3s)</span>
          </div>
          <Link
            to="/seguimiento"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            title="Ver en pantalla completa"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span>Expandir</span>
          </Link>
        </div>
      </div>
      
      {/* Map Content */}
      <div className="relative h-[320px] bg-secondary/10 sm:h-[400px]">
        {isLoading && vehicles.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center z-[1000] bg-background/50 backdrop-blur-xs">
            <div className="text-center">
              <span className="flex h-8 w-8 rounded-full border-4 border-muted border-t-primary animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Cargando mapa interactivo...</p>
            </div>
          </div>
        ) : null}

        {/* @ts-ignore */}
        <LeafletMap 
          ref={mapRef}
          center={[17.0732, -96.7266] as [number, number]} 
          zoom={11} 
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          zoomControl={true}
        >
          <MapEventsHandler onMapClick={handleMapClick} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {vehicles.map((v) => (
            <Marker 
              key={v._id} 
              position={[v.lat, v.lng] as [number, number]} 
              icon={createVehicleIcon(v.estadoActual, historyLoadingId === v._id)}
              eventHandlers={{ click: () => handleVehicleClick(v) }}
            >
              <Popup>
                <div className="font-sans text-xs space-y-1">
                  <p className="font-bold text-sm border-b pb-1 flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    {v.placa ?? 'Sin placa'}
                  </p>
                  <p>
                    <b>Estado:</b>{' '}
                    <span className="capitalize">
                      {(v.estadoActual ?? 'disponible').replace('_', ' ')}
                    </span>
                  </p>
                  <p><b>Velocidad:</b> {(v.velocidadKmh ?? 0)} km/h</p>
                  <p className="text-[10px] text-muted-foreground">Lat: {(v.lat ?? 0).toFixed(5)}, Lng: {(v.lng ?? 0).toFixed(5)}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </LeafletMap>
      </div>
      
      {/* Footer with vehicle list */}
      <div className="border-t border-border bg-secondary/10 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm">
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{vehicles.length}</span> vehículos activos en mapa
          </span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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
