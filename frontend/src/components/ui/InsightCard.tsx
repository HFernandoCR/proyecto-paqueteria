import { AlertTriangle, Info, XCircle, ArrowRight, Activity, Clock, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export type NivelInsight = 'info' | 'advertencia' | 'critico'

interface InsightCardProps {
  nivel: NivelInsight
  icono: string
  titulo: string
  descripcion: string
  accion: string
}

const ICON_MAP: Record<string, any> = {
  Info,
  AlertTriangle,
  XCircle,
  Activity,
  Clock,
  TrendingDown,
  TrendingUp
}

export function InsightCard({ nivel, icono, titulo, descripcion, accion }: InsightCardProps) {
  const IconComponent = ICON_MAP[icono] || Info

  const config = {
    info: {
      border: 'border-l-primary',
      bgBadge: 'bg-primary/10',
      textBadge: 'text-primary',
      iconColor: 'text-primary',
      label: 'Info'
    },
    advertencia: {
      border: 'border-l-warning',
      bgBadge: 'bg-warning/10',
      textBadge: 'text-warning',
      iconColor: 'text-warning',
      label: 'Advertencia'
    },
    critico: {
      border: 'border-l-destructive',
      bgBadge: 'bg-destructive/10',
      textBadge: 'text-destructive',
      iconColor: 'text-destructive',
      label: 'Crítico'
    }
  }

  const { border, bgBadge, textBadge, iconColor, label } = config[nivel]

  return (
    <div className={cn('rounded-xl border border-border bg-card p-5 border-l-4 shadow-sm', border)}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg bg-secondary/50', iconColor)}>
            <IconComponent className="h-5 w-5" />
          </div>
          <h4 className="font-bold text-foreground text-base">{titulo}</h4>
        </div>
        <span className={cn('text-xs font-bold px-2 py-1 rounded-md tracking-wide', bgBadge, textBadge)}>
          {label}
        </span>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4 pl-12">
        {descripcion}
      </p>
      
      <div className="pl-12">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground bg-secondary/30 px-3 py-2 rounded-md">
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Acción sugerida:</span>
          <span>{accion}</span>
        </div>
      </div>
    </div>
  )
}
