const UBICACION = process.env.UBICACION_SERVICE_URL || 'http://ubicacion:3003';
const VEHICULOS = process.env.VEHICULOS_SERVICE_URL || 'http://vehiculos:3001';

async function fetchVehiculos() {
  const res = await fetch(`${VEHICULOS}/`);
  if (!res.ok) throw new Error(`vehiculos → ${res.status}`);
  return res.json();
}

async function fetchHistorial(vehiculoId, limit = 0) {
  try {
    const url = limit > 0
      ? `${UBICACION}/ubicaciones/historial/${vehiculoId}?limit=${limit}`
      : `${UBICACION}/ubicaciones/historial/${vehiculoId}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    return res.json();
  } catch (_) {
    return [];
  }
}

async function fetchRuta(rutaId) {
  const RUTAS = process.env.RUTAS_SERVICE_URL || 'http://rutas:3002';
  try {
    const res = await fetch(`${RUTAS}/${rutaId}`);
    if (!res.ok) return null;
    return res.json();
  } catch (_) {
    return null;
  }
}

module.exports = { fetchVehiculos, fetchHistorial, fetchRuta };
