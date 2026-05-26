import { Routes, Route, Navigate } from 'react-router-dom'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { Dashboard } from './pages/Dashboard'
import { Vehiculos } from './pages/Vehiculos'
import { Operadores } from './pages/Operadores'
import { Rutas } from './pages/Rutas'
import { Reportes } from './pages/Reportes'
import { DashboardBI } from './pages/DashboardBI'
import { Login } from './pages/Login'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="vehiculos" element={<Vehiculos />} />
          <Route path="operadores" element={<Operadores />} />
          <Route path="rutas" element={<Rutas />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="dashboard" element={<DashboardBI />} />
        </Route>
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
