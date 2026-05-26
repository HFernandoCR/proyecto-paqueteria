import { Routes, Route, Navigate } from 'react-router-dom'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { Dashboard } from './pages/Dashboard'
import { Vehiculos } from './pages/Vehiculos'
import { Operadores } from './pages/Operadores'
import { Rutas } from './pages/Rutas'
import { Analisis } from './pages/Analisis'
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
          <Route path="analisis" element={<Analisis />} />
          <Route path="reportes" element={<Navigate to="/analisis" replace />} />
          <Route path="dashboard" element={<Navigate to="/analisis" replace />} />
        </Route>
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
