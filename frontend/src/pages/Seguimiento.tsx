import React, { useState, useEffect } from 'react'
import axios from 'axios'

// Definimos la interfaz basada en lo que envía el microservicio de seguimiento
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

  useEffect(() => {
    const fetchActivos = async () => {
      try {
        setError(null)
        // Hacemos la petición al proxy de Nginx
        const res = await axios.get('/api/seguimiento/activos')
        setVehiculos(res.data)
        
        // Prueba. Lo imprimimos en la consola
        console.log("📡 Datos de vehículos recibidos del polling:", res.data)
      } catch (err: any) {
        console.error("Error en polling de activos:", err)
        setError("No se pudo conectar con el servicio de seguimiento.")
      }
    }

    // 1. Ejecutar de inmediato al cargar la página por primera vez
    fetchActivos()

    // 2. Configurar el polling para que se ejecute cada 3 segundos (3000 ms)
    const interval = setInterval(fetchActivos, 3000)

    // 3. FUNCIÓN DE LIMPIEZA: Detiene el reloj si el usuario cambia de página
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6 h-[calc(100vh-theme(spacing.20))] flex flex-col justify-center items-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Seguimiento en Tiempo Real</h2>
        <p className="text-muted-foreground mt-2">
          El sistema está consultando los vehículos activos de forma automática.
        </p>

        {/* Estado del contador en pantalla */}
        <div className="mt-6 p-4 rounded-xl border border-border bg-card inline-block">
          <p className="text-sm font-medium text-muted-foreground">Vehículos activos detectados</p>
          <p className="text-4xl font-bold text-primary mt-1 font-mono">{vehiculos.length}</p>
        </div>

        {error && (
          <p className="text-sm text-destructive font-medium mt-4 bg-destructive/10 px-4 py-2 rounded-lg border border-destructive/20">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}