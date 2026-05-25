import { Routes, Route } from 'react-router-dom'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { Dashboard } from './pages/Dashboard'
import { Vehiculos } from './pages/Vehiculos'
import { Operadores } from './pages/Operadores'
import { Rutas } from './pages/Rutas'
import { Reportes } from './pages/Reportes'

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="vehiculos" element={<Vehiculos />} />
        <Route path="operadores" element={<Operadores />} />
        <Route path="rutas" element={<Rutas />} />
        <Route path="reportes" element={<Reportes />} />
      </Route>
    </Routes>
  )
}

export default App
