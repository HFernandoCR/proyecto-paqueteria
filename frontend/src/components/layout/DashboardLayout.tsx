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
  Moon,
  MapPin,
  User,
  Menu,
  X,
} from 'lucide-react'
import { useState, useEffect, Fragment } from 'react'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/ui/NotificationBell'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Vehículos', href: '/vehiculos', icon: Truck },
  { name: 'Operadores', href: '/operadores', icon: Users },
  { name: 'Rutas', href: '/rutas', icon: Route },
  { name: 'Seguimiento', href: '/seguimiento', icon: MapPin },
  { name: 'Análisis', href: '/analisis', icon: BarChart3 },
]

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
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

  useEffect(() => {
    const closeOnDesktop = () => {
      if (window.innerWidth >= 1024) setMobileSidebarOpen(false)
    }

    window.addEventListener('resize', closeOnDesktop)
    return () => window.removeEventListener('resize', closeOnDesktop)
  }, [])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const handleLogout = () => {
    localStorage.removeItem('logitrack_auth')
    navigate('/login')
  }

  const renderSidebar = (isMobile = false) => {
    const sidebarCollapsed = isMobile ? false : collapsed

    return (
      <aside
        className={cn(
          'relative flex h-full flex-col border-r border-border bg-card transition-all duration-300',
          isMobile ? 'w-72 max-w-[82vw]' : sidebarCollapsed ? 'w-16' : 'w-64',
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-border px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Truck className="h-5 w-5 text-primary-foreground" />
          </div>
          {!sidebarCollapsed && (
            <span className="font-semibold text-foreground">LogiTrack</span>
          )}
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navigation.map((item, index) => (
            <Fragment key={item.name}>
              {index === 1 && (
                <>
                  <div className="mx-3 my-2 border-t border-border" />
                  {!sidebarCollapsed && (
                    <div className="px-3 pb-1 pt-4">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                        Gestión
                      </span>
                    </div>
                  )}
                </>
              )}
              {index === 4 && !sidebarCollapsed && (
                <div className="px-3 pb-1 pt-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Monitoreo
                  </span>
                </div>
              )}
              <NavLink
                to={item.href}
                onClick={() => {
                  if (isMobile) setMobileSidebarOpen(false)
                }}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            </Fragment>
          ))}
        </nav>

        {!isMobile && (
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground lg:flex"
            aria-label={collapsed ? 'Expandir navegación' : 'Contraer navegación'}
          >
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
        )}
      </aside>
    )
  }

  return (
    <div className="flex h-screen min-w-0 bg-background">
      <div className="hidden lg:block">
        {renderSidebar()}
      </div>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Cerrar menú"
          />
          <div className="relative h-full shadow-2xl">
            {renderSidebar(true)}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-3 sm:px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">Sistema de Logística</h1>
              <p className="hidden truncate text-sm text-muted-foreground sm:block">Bienvenido, Administrador</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <NotificationBell />

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-secondary focus:outline-none"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/10 bg-primary/20">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium leading-none text-foreground">Administrador</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Sistema</p>
                </div>
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-[min(14rem,calc(100vw-1rem))] rounded-xl border border-border bg-card p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="mb-1 border-b border-border px-3 py-2">
                      <p className="text-sm font-semibold text-foreground">Administrador</p>
                      <p className="truncate text-xs text-muted-foreground">rodrigo.wong@logitrack.com</p>
                    </div>

                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                        {theme === 'light' ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
                        <span className="truncate whitespace-nowrap">{theme === 'light' ? 'Modo Sepia (Cálido)' : 'Modo Oscuro'}</span>
                      </div>
                      <span className="shrink-0 whitespace-nowrap rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium uppercase text-primary">
                        {theme === 'light' ? 'Sepia' : 'Oscuro'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        alert('Configuración de la plataforma: Próximamente disponible.')
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Configuración</span>
                    </button>

                    <div className="my-1 h-px bg-border" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        handleLogout()
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
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

        <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
