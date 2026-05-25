const UBICACION = process.env.UBICACION_SERVICE_URL || 'http://ubicacion:3003';
const VEHICULOS = process.env.VEHICULOS_SERVICE_URL || 'http://vehiculos:3001';

async function fetchVehiculo(vehiculoId) {
  const res = await fetch(`${VEHICULOS}/${vehiculoId}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Error en servicio vehiculos: ${res.status}`);
  }
  return res.json();
}

async function fetchUbicacionActual(vehiculoId) {
  try {
    const res = await fetch(`${UBICACION}/ubicaciones/actual/${vehiculoId}`);
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(`[http] Error consultando ubicación actual de ${vehiculoId}:`, error.message);
    return null;
  }
}

async function fetchHistorial(vehiculoId) {
  try {
    const res = await fetch(`${UBICACION}/ubicaciones/historial/${vehiculoId}`);
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error(`[http] Error consultando historial de ${vehiculoId}:`, error.message);
    return [];
  }
}

module.exports = {
  fetchVehiculo,
  fetchUbicacionActual,
  fetchHistorial
};
