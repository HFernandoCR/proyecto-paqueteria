import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string
  subtitle: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  accentColor?: 'primary' | 'success' | 'warning' | 'destructive'
}

const accentStyles = {
  primary: {
    icon: 'bg-primary/10 text-primary',
    border: 'border-l-primary',
  },
  success: {
    icon: 'bg-success/10 text-success',
    border: 'border-l-success',
  },
  warning: {
    icon: 'bg-warning/10 text-warning',
    border: 'border-l-warning',
  },
  destructive: {
    icon: 'bg-destructive/10 text-destructive',
    border: 'border-l-destructive',
  },
}

export function KpiCard({ title, value, subtitle, icon: Icon, trend, accentColor = 'primary' }: KpiCardProps) {
  const styles = accentStyles[accentColor]
  
  return (
    <div className={cn(
      "rounded-xl border border-border bg-card p-5 transition-all hover:bg-card/80 border-l-4",
      styles.border
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{value}</span>
            {trend && (
              <span className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.value}%
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className={cn("rounded-lg p-3", styles.icon)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}
