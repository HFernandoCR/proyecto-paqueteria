import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Pencil, Trash2, Truck, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VehiculoModal } from '@/components/modals/VehiculoModal'
import { ConfirmModal } from '@/components/modals/ConfirmModal'
import axios from 'axios'

type EstadoVehiculo = 'disponible' | 'en_ruta' | 'detenido' | 'entregando' | 'mantenimiento'

interface Vehiculo {
  id: string | number
  _id?: string
  placa: string
  modelo: string
  capacidad: number
  operadorId: string
  rutaId: string | null
  estado: EstadoVehiculo
}

const estadoBadgeStyles: Record<EstadoVehiculo, string> = {
  'disponible': 'bg-success/10 text-success border-success/20',
  'en_ruta': 'bg-primary/10 text-primary border-primary/20',
  'detenido': 'bg-destructive/10 text-destructive border-destructive/20',
  'entregando': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'mantenimiento': 'bg-warning/10 text-warning border-warning/20',
}

const estadoLabels: Record<EstadoVehiculo, string> = {
  'disponible': 'Disponible',
  'en_ruta': 'En Ruta',
  'detenido': 'Detenido',
  'entregando': 'Entregando',
  'mantenimiento': 'Mantenimiento',
}

const mapToFrontendVehiculo = (v: any): Vehiculo => ({
  id: v._id,
  _id: v._id,
  placa: v.placa,
  modelo: v.modelo,
  capacidad: v.capacidadKg || 0,
  operadorId: v.operadorId || '',
  rutaId: v.rutaAsignadaId || null,
  estado: v.estadoActual || 'disponible',
})

const mapToBackendVehiculo = (v: Omit<Vehiculo, 'id'>) => ({
  placa: v.placa,
  modelo: v.modelo,
  capacidadKg: v.capacidad,
  operadorId: v.operadorId || undefined,
  rutaAsignadaId: v.rutaId || undefined,
  estadoActual: v.estado,
})

export function Vehiculos() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('todos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null)
  const [vehiculoToDelete, setVehiculoToDelete] = useState<Vehiculo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchVehiculos()
  }, [])

  const fetchVehiculos = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await axios.get('/api/vehiculos')
      const mapped = res.data.map(mapToFrontendVehiculo)
      setVehiculos(mapped)
    } catch (err: any) {
      console.error("Error loading vehicles:", err)
      setError("No se pudo conectar al servidor. Verifica tu conexión e intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredVehiculos = vehiculos.filter((v) => {
    const matchesSearch = 
      v.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.operadorId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterEstado === 'todos' || v.estado === filterEstado
    return matchesSearch && matchesFilter
  })

  const handleAddVehiculo = () => {
    setSelectedVehiculo(null)
    setIsModalOpen(true)
  }

  const handleEditVehiculo = (vehiculo: Vehiculo) => {
    setSelectedVehiculo(vehiculo)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (vehiculo: Vehiculo) => {
    setVehiculoToDelete(vehiculo)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (vehiculoToDelete && vehiculoToDelete._id) {
      try {
        await axios.delete(`/api/vehiculos/${vehiculoToDelete._id}`)
        setVehiculos(vehiculos.filter((v) => v._id !== vehiculoToDelete._id))
        setVehiculoToDelete(null)
        setIsDeleteModalOpen(false)
      } catch (err) {
        console.error("Error deleting vehicle:", err)
      }
    }
  }

  const handleSaveVehiculo = async (data: Omit<Vehiculo, 'id'>) => {
    const backendData = mapToBackendVehiculo(data)
    try {
      if (selectedVehiculo && selectedVehiculo._id) {
        const res = await axios.put(`/api/vehiculos/${selectedVehiculo._id}`, backendData)
        const mapped = mapToFrontendVehiculo(res.data)
        setVehiculos(vehiculos.map((v) => v._id === selectedVehiculo._id ? mapped : v))
      } else {
        const res = await axios.post('/api/vehiculos', backendData)
        const mapped = mapToFrontendVehiculo(res.data)
        setVehiculos([...vehiculos, mapped])
      }
      setIsModalOpen(false)
    } catch (err) {
      console.error("Error saving vehicle:", err)
      alert("Error de conexión: No se pudo guardar el vehículo. Por favor, asegúrate de que el servidor backend esté encendido.")
    }
  }

  const stats = {
    total: vehiculos.length,
    enRuta: vehiculos.filter((v) => v.estado === 'en_ruta').length,
    disponibles: vehiculos.filter((v) => v.estado === 'disponible').length,
    detenidos: vehiculos.filter((v) => v.estado === 'detenido').length,
    entregando: vehiculos.filter((v) => v.estado === 'entregando').length,
    mantenimiento: vehiculos.filter((v) => v.estado === 'mantenimiento').length,
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestión de Vehículos</h2>
          <p className="text-muted-foreground">Administra tu flotilla de vehículos</p>
        </div>
        <button
          onClick={handleAddVehiculo}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/30"
        >
          <Plus className="h-4 w-4" />
          Agregar Vehículo
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-secondary p-2">
              <Truck className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.enRuta}</p>
              <p className="text-sm text-muted-foreground">En Ruta</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-success/10 p-2">
              <Truck className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.disponibles}</p>
              <p className="text-sm text-muted-foreground">Disponibles</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-destructive/10 p-2">
              <Truck className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.detenidos}</p>
              <p className="text-sm text-muted-foreground">Detenidos</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-warning/10 p-2">
              <Truck className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.mantenimiento}</p>
              <p className="text-sm text-muted-foreground">Mantenimiento</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por placa, modelo u operador ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="todos">Todos los estados</option>
            <option value="disponible">Disponible</option>
            <option value="en_ruta">En Ruta</option>
            <option value="detenido">Detenido</option>
            <option value="entregando">Entregando</option>
            <option value="mantenimiento">Mantenimiento</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12 px-6 rounded-xl border border-destructive/20 bg-destructive/5 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">Error de conexión</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">{error}</p>
          <button 
            onClick={fetchVehiculos}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Table */}
      {!error && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Placa
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Modelo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Capacidad (Kg)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Operador ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Ruta ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {!isLoading && filteredVehiculos.map((vehiculo) => (
                  <tr key={vehiculo.id} className="transition-colors hover:bg-secondary/20">
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-mono font-semibold text-foreground">{vehiculo.placa}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-foreground">
                      {vehiculo.modelo}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-foreground">
                      {vehiculo.capacidad.toLocaleString()} kg
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-mono text-foreground">{vehiculo.operadorId}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-mono text-muted-foreground">
                        {vehiculo.rutaId || '—'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                        estadoBadgeStyles[vehiculo.estado]
                      )}>
                        {estadoLabels[vehiculo.estado]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditVehiculo(vehiculo)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(vehiculo)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="flex h-8 w-8 rounded-full border-4 border-muted border-t-primary animate-spin mb-4" />
              <h3 className="text-lg font-medium text-foreground">Cargando vehículos...</h3>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && filteredVehiculos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Truck className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground">No se encontraron vehículos</h3>
              <p className="text-muted-foreground">Intenta ajustar los filtros de búsqueda</p>
            </div>
          )}

          {/* Table footer */}
          <div className="border-t border-border bg-secondary/20 px-6 py-3">
            <p className="text-sm text-muted-foreground">
              Mostrando <span className="font-medium text-foreground">{filteredVehiculos.length}</span> de{' '}
              <span className="font-medium text-foreground">{vehiculos.length}</span> vehículos
            </p>
          </div>
        </div>
      )}

      {/* Modals */}
      <VehiculoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveVehiculo}
        vehiculo={selectedVehiculo}
      />
      
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Vehiculo"
        message={`Estas seguro de que deseas eliminar el vehiculo con placa ${vehiculoToDelete?.placa}? Esta accion no se puede deshacer.`}
      />
    </div>
  )
}
