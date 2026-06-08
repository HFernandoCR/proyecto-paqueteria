import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Truck, Navigation, AlertCircle, Radio } from 'lucide-react'

// IMPORTANTE: Estilos de Leaflet para que el mapa no se rompa visualmente
import 'leaflet/dist/leaflet.css'

import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
})
L.Marker.prototype.options.icon = DefaultIcon

const estadoColor: Record<string, string> = {
  en_ruta:      '#10b981', // verde
  entregando:   '#3b82f6', // azul
  detenido:     '#ef4444', // rojo
  disponible:   '#71717a', // gris
  mantenimiento:'#f59e0b', // amarillo
}

// Función para generar un icono dinámico según el estado del camión
const getCamionIcon = (estado?: string) => {
  const bgColor = estado && estadoColor[estado] ? estadoColor[estado] : '#71717a'

  return L.divIcon({
    html: `<div style="background-color: ${bgColor}; color: white; padding: 5px; border-radius: 50%; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 2px solid white; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; box-sizing: border-box;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v10"/><path d="M14 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M6 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M20 18h2v-4h-7v7"/></svg>
           </div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  })
}

// Estructura real del API /api/seguimiento/activos
interface UbicacionActual {
  lat?: number
  lng?: number
  velocidadKmh?: number
  bearing?: number
  timestamp?: string
}

interface VehiculoData {
  _id?: string
  placa?: string
  estadoActual?: string
  modelo?: string
}

interface VehiculoActivo {
  vehiculo: VehiculoData
  ubicacionActual?: UbicacionActual
}

// Componente auxiliar para mover la cámara del mapa suavemente cuando seleccionamos un camión
function ChangeMapView({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true })
  }, [center, map])
  return null
}

// Componente auxiliar para detectar click en zona vacía del mapa y deseleccionar
function MapEventsHandler({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({ click: onMapClick })
  return null
}

export function Seguimiento() {
  const [vehiculos, setVehiculos] = useState<VehiculoActivo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedVehiculo, setSelectedVehiculo] = useState<VehiculoActivo | null>(null)
  const [historial, setHistorial] = useState<Array<[number, number]>>([])

  // Ref para acceder al vehiculo seleccionado dentro del intervalo sin recrearlo
  const selectedRef = useRef(selectedVehiculo)
  useEffect(() => {
    selectedRef.current = selectedVehiculo
  }, [selectedVehiculo])

  // Coordenadas iniciales por defecto (puedes ajustarlas a tu ciudad si gustas)
  const defaultCenter: [number, number] = [17.0732, -96.7266]

  // CAMBIO 3: dependency array vacío — el intervalo se crea una sola vez
  useEffect(() => {
    const fetchActivos = async () => {
      try {
        setError(null)
        const res = await axios.get('/api/seguimiento/activos')
        setVehiculos(res.data)

        // Accedemos al ref en lugar de la dependencia para evitar recrear el intervalo
        const current = selectedRef.current
        if (current) {
          const actualizado = res.data.find((v: VehiculoActivo) =>
            v.vehiculo?._id === current.vehiculo?._id
          )
          if (actualizado) setSelectedVehiculo(actualizado)
        }
      } catch (err: any) {
        console.error("Error en polling de activos:", err)
        setError("Error de conexión con el servicio de monitoreo.")
      }
    }

    fetchActivos()
    const interval = setInterval(fetchActivos, 3000)
    return () => clearInterval(interval)
  }, [])

  // CAMBIO 2: Fetch del historial cada vez que cambia el vehiculo seleccionado
  useEffect(() => {
    if (!selectedVehiculo) {
      setHistorial([])
      return
    }
    const id = selectedVehiculo.vehiculo?._id
    if (!id) { setHistorial([]); return }

    axios.get(`/api/seguimiento/${id}/historial`)
      .then(res => {
        const coords: [number, number][] = (res.data.historial || [])
          .map((p: any) => [p.lat, p.lng] as [number, number])
        setHistorial(coords)
      })
      .catch(() => setHistorial([]))
  }, [selectedVehiculo])

  // Determinar el centro dinámico del mapa
  const mapCenter: [number, number] = selectedVehiculo
    ? [selectedVehiculo.ubicacionActual?.lat ?? 0, selectedVehiculo.ubicacionActual?.lng ?? 0]
    : defaultCenter

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col space-y-4 lg:h-[calc(100vh-7rem)]">
      {/* Encabezado */}
      <div className="flex flex-shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-foreground">Monitoreo en Tiempo Real</h2>
          <p className="text-muted-foreground text-sm">Ubicación y telemetría de las unidades activas</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5">
          <Radio className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            Polling Activo (3s)
          </span>
        </div>
      </div>

      {/* Contenedor Dividido */}
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4 lg:flex-row lg:overflow-hidden">
        
        {/* PANEL IZQUIERDO: Lista de unidades */}
        <div className="flex max-h-80 w-full flex-shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card lg:max-h-none lg:w-80">
          <div className="p-4 border-b border-border bg-secondary/20">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              Unidades en Ruta ({vehiculos.length})
            </h3>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {error && (
              <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {vehiculos.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 py-12">
                <Navigation className="h-8 w-8 text-muted-foreground/40 mb-2 rotate-45" />
                <p className="text-sm font-medium text-muted-foreground">No hay vehículos activos</p>
                <p className="text-xs text-muted-foreground/70 mt-1 max-w-[180px]">
                  Inicia una ruta simulada para ver la telemetría en el mapa.
                </p>
              </div>
            ) : (
              vehiculos.map((vehiculo, idx) => {
                const id = vehiculo.vehiculo?._id || idx
                const isSelected = selectedVehiculo?.vehiculo?._id === vehiculo.vehiculo?._id

                return (
                  <button
                    key={id}
                    onClick={() => setSelectedVehiculo(vehiculo)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border bg-secondary/10 hover:bg-secondary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-foreground">{vehiculo.vehiculo?.placa ?? 'Sin placa'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-success/10 text-success">
                        {vehiculo.vehiculo?.estadoActual ?? 'disponible'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                      <span>Velocidad:</span>
                      <span className="font-semibold text-foreground">{(vehiculo.ubicacionActual?.velocidadKmh ?? 0)} km/h</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* PANEL DERECHO: MAPA REAL DE LEAFLET */}
        <div className="relative z-0 min-h-[360px] flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-inner sm:min-h-[440px] lg:min-h-0">
          <MapContainer 
            center={defaultCenter} 
            zoom={13} 
            className="w-full h-full"
          >
            {/* Capa de mapas gratuita OpenStreetMap */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Marcadores: solo vehiculos con coordenadas validas para evitar crash en Leaflet */}
            {vehiculos
              .filter(v =>
                v.ubicacionActual?.lat != null &&
                v.ubicacionActual?.lng != null &&
                !isNaN(v.ubicacionActual.lat) &&
                !isNaN(v.ubicacionActual.lng)
              )
              .map((vehiculo, idx) => {
                const id = vehiculo.vehiculo?._id || idx
                return (
                  <Marker
                    key={id}
                    position={[vehiculo.ubicacionActual!.lat!, vehiculo.ubicacionActual!.lng!]}
                    icon={getCamionIcon(vehiculo.vehiculo?.estadoActual)}
                    eventHandlers={{
                      click: () => setSelectedVehiculo(vehiculo)
                    }}
                  >
                    <Popup>
                      <div className="font-sans text-xs space-y-1">
                        <p className="font-bold text-sm border-b pb-1 flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          {vehiculo.vehiculo?.placa ?? 'Sin placa'}
                        </p>
                        <p>
                          <b>Estado:</b>{' '}
                          <span className="capitalize">
                            {(vehiculo.vehiculo?.estadoActual ?? 'disponible').replace('_', ' ')}
                          </span>
                        </p>
                        <p><b>Velocidad:</b> {(vehiculo.ubicacionActual?.velocidadKmh ?? 0)} km/h</p>
                        <p className="text-[10px] text-muted-foreground">Lat: {(vehiculo.ubicacionActual?.lat ?? 0).toFixed(5)}, Lng: {(vehiculo.ubicacionActual?.lng ?? 0).toFixed(5)}</p>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}

            {/* Mover la cámara de forma fluida si seleccionamos una unidad */}
            {selectedVehiculo && <ChangeMapView center={mapCenter} />}

            {/* CAMBIO 1+2: Deseleccionar al click en zona vacía del mapa */}
            <MapEventsHandler onMapClick={() => setSelectedVehiculo(null)} />

            {/* CAMBIO 2: Polyline del recorrido histórico del vehiculo seleccionado */}
            {historial.length > 1 && (
              <Polyline
                positions={historial}
                pathOptions={{
                  color: estadoColor[selectedVehiculo?.vehiculo?.estadoActual ?? ''] ?? '#71717a',
                  weight: 3,
                  opacity: 0.8
                }}
              />
            )}
          </MapContainer>
        </div>

      </div>
    </div>
  )
}
