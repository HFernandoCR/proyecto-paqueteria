import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Operador {
  id: string | number
  _id?: string
  nombreCompleto: string
  numeroLicencia: string
  telefono: string
  estado: 'Activo' | 'Inactivo'
}

interface OperadorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Omit<Operador, 'id'>) => void
  operador: Operador | null
}

export function OperadorModal({ isOpen, onClose, onSave, operador }: OperadorModalProps) {
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    numeroLicencia: '',
    telefono: '',
    estado: 'Activo' as Operador['estado'],
  })

  useEffect(() => {
    if (operador) {
      setFormData({
        nombreCompleto: operador.nombreCompleto,
        numeroLicencia: operador.numeroLicencia,
        telefono: operador.telefono,
        estado: operador.estado,
      })
    } else {
      setFormData({
        nombreCompleto: '',
        numeroLicencia: '',
        telefono: '',
        estado: 'Activo',
      })
    }
  }, [operador, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {operador ? 'Editar Operador' : 'Agregar Operador'}
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
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nombre Completo
            </label>
            <input
              type="text"
              value={formData.nombreCompleto}
              onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
              placeholder="Juan Perez Lopez"
              required
              className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Numero de Licencia <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.numeroLicencia}
              onChange={(e) => setFormData({ ...formData, numeroLicencia: e.target.value.toUpperCase() })}
              placeholder="LIC-001"
              required
              className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">Obligatorio. Ej: LIC-001</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Telefono
            </label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="55-1234-5678"
              required
              className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Estado
            </label>
            <div className="flex gap-2">
              {(['Activo', 'Inactivo'] as const).map((estado) => (
                <button
                  key={estado}
                  type="button"
                  onClick={() => setFormData({ ...formData, estado })}
                  className={cn(
                    "flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                    formData.estado === estado
                      ? estado === 'Activo'
                        ? 'border-success bg-success/10 text-success'
                        : 'border-red-500 bg-red-500 text-white'
                      : estado === 'Inactivo'
                        ? 'border-red-500 text-red-500 bg-secondary/50 hover:bg-red-500/10'
                        : 'border-border bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  )}
                >
                  {estado}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
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
              {operador ? 'Guardar Cambios' : 'Agregar Operador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
