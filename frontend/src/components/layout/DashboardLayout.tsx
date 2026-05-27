import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/ui/NotificationBell'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Vehículos', href: '/vehiculos', icon: Truck },
  { name: 'Operadores', href: '/operadores', icon: Users },
  { name: 'Rutas', href: '/rutas', icon: Route },
  { name: 'Análisis', href: '/analisis', icon: BarChart3 },
]

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('logitrack_theme')
    return (saved as 'dark' | 'light') || 'dark'
  })
  const navigate = useNavigate()

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'light') {
      root.classList.add('light')
    } else {
      root.classList.remove('light')
    }
    localStorage.setItem('logitrack_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

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
            
            {/* User Dropdown Menu */}
            <div className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-secondary transition-colors focus:outline-none"
              >
                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/10">
                  <span className="text-sm font-medium text-primary">AD</span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-foreground leading-none">Administrador</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Sistema</p>
                </div>
              </button>

              {/* Dropdown Card */}
              {isUserMenuOpen && (
                <>
                  {/* Backdrop overlay to close when clicking outside */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-2 shadow-xl z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-border mb-1">
                      <p className="text-sm font-semibold text-foreground">Administrador</p>
                      <p className="text-xs text-muted-foreground">rodrigo.wong@logitrack.com</p>
                    </div>
                    
                    {/* Theme Toggler Option */}
                    <button 
                      onClick={toggleTheme}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        <span>{theme === 'light' ? 'Modo Sepia (Cálido)' : 'Modo Oscuro'}</span>
                      </div>
                      <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-medium uppercase">
                        {theme === 'light' ? 'Sepia' : 'Oscuro'}
                      </span>
                    </button>

                    {/* Settings Option */}
                    <button 
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        alert("Configuración de la plataforma: Próximamente disponible.");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Configuración</span>
                    </button>

                    <div className="h-px bg-border my-1" />

                    {/* Logout Option */}
                    <button 
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </>
              )}
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
