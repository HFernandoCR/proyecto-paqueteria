import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { DashboardBI } from './pages/DashboardBI';

/* ------------------------------------------------------------------ */
/*  Estilos del layout principal                                        */
/* ------------------------------------------------------------------ */
const navStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
  padding: '0.85rem 2rem',
  background: '#1e2130',
  borderBottom: '1px solid #2d3148',
  fontFamily: "'Segoe UI', sans-serif",
};

const logoStyle = {
  fontWeight: 700,
  fontSize: '1.1rem',
  color: '#f1f5f9',
  textDecoration: 'none',
  marginRight: 'auto',
};

const linkStyle = {
  color: '#94a3b8',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: 500,
  padding: '0.4rem 0.75rem',
  borderRadius: '6px',
  transition: 'background 0.15s, color 0.15s',
};

const activeLinkStyle = {
  ...linkStyle,
  background: 'rgba(59,130,246,0.15)',
  color: '#3b82f6',
};

/* ------------------------------------------------------------------ */
/*  Inicio — mapa de vehículos                                          */
/* ------------------------------------------------------------------ */
function Inicio() {
  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", padding: '2rem', background: '#0f1117', minHeight: 'calc(100vh - 52px)', color: '#f1f5f9' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>🚚 Sistema de Paquetería — Equipo 6B</h1>
      <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
        Frontend base con React, Vite y Leaflet integrados.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <MapContainer
          center={[19.4326, -99.1332]}
          zoom={13}
          style={{ height: '500px', width: '80%', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.25)' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[19.4326, -99.1332]}>
            <Popup>
              Centro de CDMX. <br /> Sistema de Paquetería.
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  App con routing                                                     */
/* ------------------------------------------------------------------ */
function App() {
  return (
    <>
      {/* Barra de navegación superior */}
      <nav style={navStyle}>
        <NavLink to="/" style={logoStyle}>
          🚛 LogiTrack
        </NavLink>
        <NavLink
          to="/"
          end
          style={({ isActive }) => isActive ? activeLinkStyle : linkStyle}
        >
          Inicio
        </NavLink>
        <NavLink
          to="/dashboard"
          style={({ isActive }) => isActive ? activeLinkStyle : linkStyle}
        >
          📊 Dashboard BI
        </NavLink>
      </nav>

      {/* Contenido de la ruta activa */}
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/dashboard" element={<DashboardBI />} />
      </Routes>
    </>
  );
}

export default App;
