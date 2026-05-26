import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  BarChart3,
  PieChart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/ui/NotificationBell'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Vehículos', href: '/vehiculos', icon: Truck },
  { name: 'Operadores', href: '/operadores', icon: Users },
  { name: 'Rutas', href: '/rutas', icon: Route },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
  { name: 'Dashboard BI', href: '/dashboard', icon: PieChart },
]

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('logitrack_auth')
    navigate('/login')
  }
  
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside 
        className={cn(
          "flex flex-col border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Truck className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-foreground">LogiTrack</span>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>
        
        {/* Bottom section */}
        <div className="border-t border-border p-3 space-y-1">
          <button className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          )}>
            <Settings className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Configuración</span>}
          </button>
          <button 
            onClick={handleLogout}
            className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          )}>
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
        
        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-0 top-20 -mr-3 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground"
          style={{ left: collapsed ? '52px' : '248px' }}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>
      
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Sistema de Logística</h1>
            <p className="text-sm text-muted-foreground">Bienvenido, Administrador</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">AD</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-foreground">Administrador</p>
                <p className="text-xs text-muted-foreground">Sistema</p>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
