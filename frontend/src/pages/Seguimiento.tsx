import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Truck, Navigation, AlertCircle, Radio } from 'lucide-react'

interface VehiculoActivo {
  vehiculoId?: string
  _id?: string
  placa: string
  estadoActual: string
  velocidadKmh: number
  lat: number
  lng: number
}

export function Seguimiento() {
  const [vehiculos, setVehiculos] = useState<VehiculoActivo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedVehiculo, setSelectedVehiculo] = useState<VehiculoActivo | null>(null)

  useEffect(() => {
    const fetchActivos = async () => {
      try {
        setError(null)
        const res = await axios.get('/api/seguimiento/activos')
        setVehiculos(res.data)
        
        // Si teníamos un vehículo seleccionado, actualizamos sus coordenadas en tiempo real
        if (selectedVehiculo) {
          const actualizado = res.data.find((v: VehiculoActivo) => 
            (v.vehiculoId === selectedVehiculo.vehiculoId || v._id === selectedVehiculo._id)
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
  }, [selectedVehiculo])

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] space-y-4">
      {/* Encabezado del Módulo */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Monitoreo en Tiempo Real</h2>
          <p className="text-muted-foreground text-sm">Ubicación y telemetría de las unidades activas</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
          <Radio className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            Polling Activo (3s)
          </span>
        </div>
      </div>

      {/* Contenedor Principal Dividido */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden w-full">
        
        {/* PANEL IZQUIERDO: Lista de Vehículos */}
        <div className="w-full md:w-80 flex flex-col border border-border bg-card rounded-xl overflow-hidden flex-shrink-0">
          <div className="p-4 border-b border-border bg-secondary/20">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              Unidades en Ruta ({vehiculos.length})
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
                  Inicia un simulador desde Postman para ver telemetría.
                </p>
              </div>
            ) : (
              vehiculos.map((vehiculo, idx) => {
                const id = vehiculo.vehiculoId || vehiculo._id || idx
                const isSelected = selectedVehiculo && (selectedVehiculo.vehiculoId === vehiculo.vehiculoId || selectedVehiculo._id === vehiculo._id)
                
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
                      <span className="font-mono font-bold text-sm text-foreground">{vehiculo.placa}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        vehiculo.estadoActual === 'En Ruta' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                      }`}>
                        {vehiculo.estadoActual}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                      <span>Velocidad:</span>
                      <span className="font-semibold text-foreground">{vehiculo.velocidadKmh} km/h</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* PANEL DERECHO: El contenedor del Mapa */}
        <div className="flex-1 border border-border bg-card rounded-xl overflow-hidden relative shadow-inner flex flex-col justify-center items-center">
          {/* Aquí es donde Leaflet renderizará el mapa real en el paso 4 */}
          <div className="absolute inset-0 bg-secondary/10 flex flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-3">
              <Navigation className="h-8 w-8 text-primary animate-bounce" />
            </div>
            <h4 className="text-lg font-medium text-foreground">Contenedor del Mapa Listo</h4>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              La estructura visual está montada. En el siguiente paso instalaremos Leaflet para dibujar el mapa geográfico real aquí.
            </p>
            {selectedVehiculo && (
              <div className="mt-4 p-2.5 bg-card border border-border rounded-lg text-xs font-mono text-left space-y-1 shadow-sm">
                <p className="text-primary font-bold">📍 Unidad Enfocada: {selectedVehiculo.placa}</p>
                <p className="text-muted-foreground">Lat: {selectedVehiculo.lat.toFixed(6)}</p>
                <p className="text-muted-foreground">Lng: {selectedVehiculo.lng.toFixed(6)}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}