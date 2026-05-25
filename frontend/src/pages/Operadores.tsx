import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Pencil, Trash2, Phone, IdCard, User, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConfirmModal } from '@/components/modals/ConfirmModal'
import { OperadorModal } from '@/components/modals/OperadorModal'
import axios from 'axios'

interface Operador {
  id: string | number
  _id?: string
  nombreCompleto: string
  numeroLicencia: string
  telefono: string
  estado: 'Activo' | 'Inactivo'
}

const estadoBadgeStyles = {
  'Activo': 'bg-success/10 text-success border-success/20',
  'Inactivo': 'bg-muted text-muted-foreground border-muted',
}

const mapToFrontendOperador = (op: any): Operador => ({
  id: op._id,
  _id: op._id,
  nombreCompleto: op.nombre,
  numeroLicencia: op.licencia,
  telefono: op.telefono || '',
  estado: op.activo ? 'Activo' : 'Inactivo',
})

const mapToBackendOperador = (op: Omit<Operador, 'id'>) => ({
  nombre: op.nombreCompleto,
  licencia: op.numeroLicencia,
  telefono: op.telefono,
  activo: op.estado === 'Activo',
})

export function Operadores() {
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('todos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedOperador, setSelectedOperador] = useState<Operador | null>(null)
  const [operadorToDelete, setOperadorToDelete] = useState<Operador | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOperadores()
  }, [])

  const fetchOperadores = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await axios.get('/api/vehiculos/operadores')
      const mapped = res.data.map(mapToFrontendOperador)
      setOperadores(mapped)
    } catch (err: any) {
      console.error("Error loading operators:", err)
      setError("No se pudo conectar al servidor de operadores. Por favor, asegúrate de que el servidor de tu escuela esté encendido.")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredOperadores = operadores.filter((op) => {
    const matchesSearch =
      op.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.numeroLicencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.telefono.includes(searchTerm)
    const matchesFilter = filterEstado === 'todos' || op.estado === filterEstado
    return matchesSearch && matchesFilter
  })

  const handleAddOperador = () => {
    setSelectedOperador(null)
    setIsModalOpen(true)
  }

  const handleEditOperador = (operador: Operador) => {
    setSelectedOperador(operador)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (operador: Operador) => {
    setOperadorToDelete(operador)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (operadorToDelete && operadorToDelete._id) {
      try {
        await axios.delete(`/api/vehiculos/operadores/${operadorToDelete._id}`)
        setOperadores(operadores.filter((op) => op._id !== operadorToDelete._id))
        setOperadorToDelete(null)
        setIsDeleteModalOpen(false)
      } catch (err) {
        console.error("Error deleting operator:", err)
      }
    }
  }

  const handleSaveOperador = async (data: Omit<Operador, 'id'>) => {
    const backendData = mapToBackendOperador(data)
    try {
      if (selectedOperador && selectedOperador._id) {
        const res = await axios.put(`/api/vehiculos/operadores/${selectedOperador._id}`, backendData)
        const mapped = mapToFrontendOperador(res.data)
        setOperadores(operadores.map((op) => op._id === selectedOperador._id ? mapped : op))
      } else {
        const res = await axios.post('/api/vehiculos/operadores', backendData)
        const mapped = mapToFrontendOperador(res.data)
        setOperadores([...operadores, mapped])
      }
      setIsModalOpen(false)
    } catch (err) {
      console.error("Error saving operator:", err)
      alert("Error de conexión: No se pudo guardar el operador. Por favor, asegúrate de que el servidor backend esté encendido.")
    }
  }

  const stats = {
    total: operadores.length,
    activos: operadores.filter((op) => op.estado === 'Activo').length,
    inactivos: operadores.filter((op) => op.estado === 'Inactivo').length,
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion de Operadores</h2>
          <p className="text-muted-foreground">Administra los conductores de tu flotilla</p>
        </div>
        <button
          onClick={handleAddOperador}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Agregar Operador
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-secondary p-2">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-success/10 p-2">
              <User className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.activos}</p>
              <p className="text-sm text-muted-foreground">Activos</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.inactivos}</p>
              <p className="text-sm text-muted-foreground">Inactivos</p>
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
            placeholder="Buscar por nombre, licencia o telefono..."
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
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Grid of operator cards */}
      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12 px-6 rounded-xl border border-destructive/20 bg-destructive/5 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">Error de conexión</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">{error}</p>
          <button
            onClick={fetchOperadores}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Grid List */}
      {!isLoading && !error && filteredOperadores.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOperadores.map((operador) => (
            <div key={operador.id} className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary">
                      {operador.nombreCompleto.split(' ').slice(0, 2).map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{operador.nombreCompleto}</h3>
                    <p className="text-sm text-muted-foreground font-mono">{operador.numeroLicencia}</p>
                  </div>
                </div>
                <span className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                  estadoBadgeStyles[operador.estado]
                )}>
                  {operador.estado}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{operador.telefono}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IdCard className="h-4 w-4" />
                  <span>Licencia: {operador.numeroLicencia}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-border">
                <button
                  onClick={() => handleEditOperador(operador)}
                  className="flex-1 rounded-lg bg-secondary py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
                >
                  <Pencil className="h-4 w-4 inline mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteClick(operador)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-border bg-card">
          <span className="flex h-8 w-8 rounded-full border-4 border-muted border-t-primary animate-spin mb-4" />
          <h3 className="text-lg font-medium text-foreground">Cargando operadores...</h3>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filteredOperadores.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-border bg-card">
          <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground">No se encontraron operadores</h3>
          <p className="text-muted-foreground">Intenta ajustar los filtros de búsqueda</p>
        </div>
      )}

      {/* Modals */}
      <OperadorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveOperador}
        operador={selectedOperador}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Operador"
        message={`Estas seguro de que deseas eliminar al operador ${operadorToDelete?.nombreCompleto}? Esta accion no se puede deshacer.`}
      />
    </div>
  )
}
