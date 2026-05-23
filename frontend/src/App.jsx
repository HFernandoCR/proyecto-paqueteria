import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', paddingTop: '2rem' }}>
      <h1>🚚 Sistema de Paquetería — Equipo 6B</h1>
      <p>Frontend base con React, Vite y Leaflet integrados.</p>
      
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
        <MapContainer center={[19.4326, -99.1332]} zoom={13} style={{ height: '500px', width: '80%', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
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

export default App;
