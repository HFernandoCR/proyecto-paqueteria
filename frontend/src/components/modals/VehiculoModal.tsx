import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
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

interface VehiculoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Omit<Vehiculo, 'id'>) => void
  vehiculo: Vehiculo | null
}

const estadoConfig: { value: EstadoVehiculo; label: string; activeClass: string }[] = [
  { value: 'disponible', label: 'Disponible', activeClass: 'border-success bg-success/10 text-success' },
  { value: 'en_ruta', label: 'En Ruta', activeClass: 'border-primary bg-primary/10 text-primary' },
  { value: 'detenido', label: 'Detenido', activeClass: 'border-destructive bg-destructive/10 text-destructive' },
  { value: 'entregando', label: 'Entregando', activeClass: 'border-cyan-500 bg-cyan-500/10 text-cyan-400' },
  { value: 'mantenimiento', label: 'Mantenimiento', activeClass: 'border-warning bg-warning/10 text-warning' },
]

export function VehiculoModal({ isOpen, onClose, onSave, vehiculo }: VehiculoModalProps) {
  const [operadores, setOperadores] = useState<any[]>([])
  const [rutas, setRutas] = useState<any[]>([])
  const [formData, setFormData] = useState({
    placa: '',
    modelo: '',
    capacidad: 1500,
    operadorId: '',
    rutaId: '' as string | null,
    estado: 'disponible' as EstadoVehiculo,
  })

  useEffect(() => {
    if (isOpen) {
      axios.get('/api/vehiculos/operadores')
        .then(res => {
          setOperadores(res.data)
          if (!vehiculo && res.data.length > 0) {
            setFormData(prev => ({ ...prev, operadorId: res.data[0]._id }))
          }
        })
        .catch(err => console.error("Error loading operators:", err))

      axios.get('/api/rutas')
        .then(res => setRutas(res.data))
        .catch(err => console.error("Error loading routes:", err))
    }
  }, [isOpen])

  useEffect(() => {
    if (vehiculo) {
      setFormData({
        placa: vehiculo.placa,
        modelo: vehiculo.modelo,
        capacidad: vehiculo.capacidad,
        operadorId: vehiculo.operadorId,
        rutaId: vehiculo.rutaId,
        estado: vehiculo.estado,
      })
    } else {
      setFormData({
        placa: '',
        modelo: '',
        capacidad: 1500,
        operadorId: operadores.length > 0 ? operadores[0]._id : '',
        rutaId: null,
        estado: 'disponible',
      })
    }
  }, [vehiculo, isOpen, operadores])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      rutaId: formData.rutaId || null,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {vehiculo ? 'Editar Vehículo' : 'Agregar Vehículo'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Placa
              </label>
              <input
                type="text"
                value={formData.placa}
                onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                placeholder="ABC-123"
                required
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Capacidad (Kg)
              </label>
              <input
                type="number"
                value={formData.capacidad}
                onChange={(e) => setFormData({ ...formData, capacidad: parseInt(e.target.value) || 0 })}
                placeholder="1500"
                required
                min={100}
                max={10000}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Modelo
            </label>
            <input
              type="text"
              value={formData.modelo}
              onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
              placeholder="Ford Transit 2023"
              required
              className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Operador Asignado (ID)
              </label>
              <select
                value={formData.operadorId}
                onChange={(e) => setFormData({ ...formData, operadorId: e.target.value })}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              >
                <option value="">Seleccionar operador</option>
                {operadores.map((op) => (
                  <option key={op._id} value={op._id}>{op.nombre} ({op.licencia})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Ruta Asignada (ID)
              </label>
              <select
                value={formData.rutaId || ''}
                onChange={(e) => setFormData({ ...formData, rutaId: e.target.value || null })}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              >
                <option value="">Sin ruta asignada</option>
                {rutas.map((rt) => (
                  <option key={rt._id} value={rt._id}>{rt.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Estado
            </label>
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-3">
              {estadoConfig.map((config) => (
                <button
                  key={config.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, estado: config.value })}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    formData.estado === config.value
                      ? config.activeClass
                      : 'border-border bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  )}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
            >
              {vehiculo ? 'Guardar Cambios' : 'Agregar Vehículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
