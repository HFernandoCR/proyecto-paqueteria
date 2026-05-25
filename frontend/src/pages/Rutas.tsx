import { Plus, Search, Filter, Pencil, Trash2, MapPin, Route, Navigation, Clock, Ruler, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConfirmModal } from '@/components/modals/ConfirmModal'
import { RutaModal } from '@/components/modals/RutaModal'
import { WaypointsModal } from '@/components/modals/WaypointsModal'
import axios from 'axios'

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
  origenObj?: any
  destinoObj?: any
}

const mapToFrontendRuta = (r: any): Ruta => ({
  id: r._id,
  _id: r._id,
  nombre: r.nombre,
  origen: r.origen?.direccion || '',
  destino: r.destino?.direccion || '',
  distanciaKm: r.distanciaKm || 0,
  duracionMin: r.duracionEstimadaMin || 0,
  waypoints: r.waypoints || [],
  origenObj: r.origen,
  destinoObj: r.destino,
})

const mapToBackendRuta = (r: Omit<Ruta, 'id'>, existingRuta?: any) => {
  const currentOrigen = existingRuta?.origenObj;
  const currentDestino = existingRuta?.destinoObj;

  const origenLat = currentOrigen?.direccion === r.origen ? currentOrigen.lat : 19.4326 + (Math.random() - 0.5) * 0.1;
  const origenLng = currentOrigen?.direccion === r.origen ? currentOrigen.lng : -99.1332 + (Math.random() - 0.5) * 0.1;
  
  const destinoLat = currentDestino?.direccion === r.destino ? currentDestino.lat : 19.3530 + (Math.random() - 0.5) * 0.1;
  const destinoLng = currentDestino?.direccion === r.destino ? currentDestino.lng : -99.1747 + (Math.random() - 0.5) * 0.1;

  return {
    nombre: r.nombre,
    origen: {
      lat: origenLat,
      lng: origenLng,
      direccion: r.origen
    },
    destino: {
      lat: destinoLat,
      lng: destinoLng,
      direccion: r.destino
    },
    distanciaKm: r.distanciaKm,
    duracionEstimadaMin: r.duracionMin,
    waypoints: r.waypoints || []
  }
}

export function Rutas() {
  const [rutas, setRutas] = useState<Ruta[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isWaypointsModalOpen, setIsWaypointsModalOpen] = useState(false)
  const [selectedRuta, setSelectedRuta] = useState<Ruta | null>(null)
  const [rutaToDelete, setRutaToDelete] = useState<Ruta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRutas()
  }, [])

  const fetchRutas = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await axios.get('/api/rutas/rutas')
      const mapped = res.data.map(mapToFrontendRuta)
      setRutas(mapped)
    } catch (err: any) {
      console.error("Error loading routes:", err)
      setError("No se pudo conectar al servidor de rutas. Por favor, asegúrate de que el servidor de tu escuela esté encendido.")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRutas = rutas.filter((r) => {
    return r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.origen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.destino.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleAddRuta = () => {
    setSelectedRuta(null)
    setIsModalOpen(true)
  }

  const handleEditRuta = (ruta: Ruta) => {
    setSelectedRuta(ruta)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (ruta: Ruta) => {
    setRutaToDelete(ruta)
    setIsDeleteModalOpen(true)
  }

  const handleViewWaypoints = (ruta: Ruta) => {
    setSelectedRuta(ruta)
    setIsWaypointsModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (rutaToDelete && rutaToDelete._id) {
      try {
        await axios.delete(`/api/rutas/rutas/${rutaToDelete._id}`)
        setRutas(rutas.filter((r) => r._id !== rutaToDelete._id))
        setRutaToDelete(null)
        setIsDeleteModalOpen(false)
      } catch (err) {
        console.error("Error deleting route:", err)
      }
    }
  }

  const handleSaveRuta = async (data: Omit<Ruta, 'id'>) => {
    try {
      if (selectedRuta && selectedRuta._id) {
        const backendData = mapToBackendRuta(data, selectedRuta)
        const res = await axios.put(`/api/rutas/rutas/${selectedRuta._id}`, backendData)
        const mapped = mapToFrontendRuta(res.data)
        setRutas(rutas.map((r) => r._id === selectedRuta._id ? mapped : r))
      } else {
        const backendData = mapToBackendRuta(data)
        const res = await axios.post('/api/rutas/rutas', backendData)
        const mapped = mapToFrontendRuta(res.data)
        setRutas([...rutas, mapped])
      }
      setIsModalOpen(false)
    } catch (err) {
      console.error("Error saving route:", err)
      alert("Error de conexión: No se pudo guardar la ruta. Por favor, asegúrate de que el servidor backend esté encendido.")
    }
  }

  const handleSaveWaypoints = async (waypoints: Waypoint[]) => {
    if (selectedRuta && selectedRuta._id) {
      try {
        const res = await axios.patch(`/api/rutas/rutas/${selectedRuta._id}`, { waypoints })
        const mapped = mapToFrontendRuta(res.data)
        setRutas(rutas.map((r) => r._id === selectedRuta._id ? mapped : r))
        setIsWaypointsModalOpen(false)
      } catch (err) {
        console.error("Error saving waypoints:", err)
      }
    }
  }

  const stats = {
    total: rutas.length,
    kmTotales: rutas.reduce((acc, r) => acc + r.distanciaKm, 0).toFixed(1),
    duracionPromedio: rutas.length > 0 ? Math.round(rutas.reduce((acc, r) => acc + r.duracionMin, 0) / rutas.length) : 0,
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion de Rutas</h2>
          <p className="text-muted-foreground">Administra las rutas de tu flotilla</p>
        </div>
        <button
          onClick={handleAddRuta}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Agregar Ruta
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Route className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Rutas</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-success/10 p-2">
              <Ruler className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.kmTotales} km</p>
              <p className="text-sm text-muted-foreground">Km Totales</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-warning/10 p-2">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.duracionPromedio} min</p>
              <p className="text-sm text-muted-foreground">Duracion Promedio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, origen o destino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12 px-6 rounded-xl border border-destructive/20 bg-destructive/5 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">Error de conexión</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">{error}</p>
          <button 
            onClick={fetchRutas}
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
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Origen
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Destino
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Distancia (Km)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Duración (Min)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Waypoints
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {!isLoading && filteredRutas.map((ruta) => (
                  <tr key={ruta.id} className="transition-colors hover:bg-secondary/20">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">{ruta.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 max-w-xs">
                        <MapPin className="h-4 w-4 text-success flex-shrink-0" />
                        <span className="text-foreground truncate" title={ruta.origen}>{ruta.origen}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 max-w-xs">
                        <MapPin className="h-4 w-4 text-destructive flex-shrink-0" />
                        <span className="text-foreground truncate" title={ruta.destino}>{ruta.destino}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-foreground">
                      {ruta.distanciaKm} km
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-foreground">
                      {ruta.duracionMin} min
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <button
                        onClick={() => handleViewWaypoints(ruta)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                      >
                        <MapPin className="h-3 w-3" />
                        {ruta.waypoints.length} puntos
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditRuta(ruta)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(ruta)}
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
              <h3 className="text-lg font-medium text-foreground">Cargando rutas...</h3>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && filteredRutas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Route className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground">No se encontraron rutas</h3>
              <p className="text-muted-foreground">Intenta ajustar los filtros de búsqueda</p>
            </div>
          )}

          {/* Table footer */}
          <div className="border-t border-border bg-secondary/20 px-6 py-3">
            <p className="text-sm text-muted-foreground">
              Mostrando <span className="font-medium text-foreground">{filteredRutas.length}</span> de{' '}
              <span className="font-medium text-foreground">{rutas.length}</span> rutas
            </p>
          </div>
        </div>
      )}

      {/* Modals */}
      <RutaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRuta}
        ruta={selectedRuta}
      />
      
      <WaypointsModal
        isOpen={isWaypointsModalOpen}
        onClose={() => setIsWaypointsModalOpen(false)}
        onSave={handleSaveWaypoints}
        waypoints={selectedRuta?.waypoints || []}
        rutaNombre={selectedRuta?.nombre || ''}
      />
      
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Ruta"
        message={`Estas seguro de que deseas eliminar la ruta "${rutaToDelete?.nombre}"? Esta accion no se puede deshacer.`}
      />
    </div>
  )
}
