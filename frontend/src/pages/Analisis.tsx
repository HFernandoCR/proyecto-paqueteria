import { useState, useEffect, useRef } from 'react'
import { BarChart3, Download, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Analisis() {
  /* ── Controles de UI ── */
  const [rango, setRango] = useState<7 | 30 | 90>(30)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  /* Cerrar dropdown al hacer click fuera */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const rangos: { label: string; value: 7 | 30 | 90 }[] = [
    { label: '7 días', value: 7 },
    { label: '30 días', value: 30 },
    { label: '90 días', value: 90 },
  ]

  return (
    <div className="space-y-6">

      {/* ── Header + controles ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Título */}
        <div className="flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-primary flex-shrink-0" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Análisis</h2>
            <p className="text-muted-foreground text-sm">Sistema de Soporte a Decisiones</p>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-2 no-print">
          {/* Filtro de rango */}
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            {rangos.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setRango(value)}
                className={cn(
                  'px-3 py-2 text-sm font-medium transition-colors',
                  rango === value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Botón exportar + dropdown (funcionalidad en commit siguiente) */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Download className="h-4 w-4" />
              Exportar
              <ChevronDown
                className={cn('h-3 w-3 transition-transform', showExportMenu && 'rotate-180')}
              />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 z-10 w-36 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                <button className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-secondary transition-colors">
                  CSV
                </button>
                <button className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-secondary transition-colors">
                  PDF
                </button>
                <button className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-secondary transition-colors">
                  Imprimir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
