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
  const res = await fetch(`${UBICACION}/ubicaciones/actual/${vehiculoId}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Error en servicio ubicacion (actual): ${res.status}`);
  }
  return res.json();
}

async function fetchHistorial(vehiculoId) {
  const res = await fetch(`${UBICACION}/ubicaciones/historial/${vehiculoId}`);
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Error en servicio ubicacion (historial): ${res.status}`);
  }
  return res.json();
}

async function fetchVehiculosActivos() {
  const res = await fetch(`${VEHICULOS}/`);
  if (!res.ok) {
    throw new Error(`Error en servicio vehiculos (lista): ${res.status}`);
  }
  const vehiculos = await res.json();
  return vehiculos.filter(v => v.estadoActual === 'en_ruta' || v.estadoActual === 'entregando');
}

module.exports = {
  fetchVehiculo,
  fetchUbicacionActual,
  fetchHistorial,
  fetchVehiculosActivos
};
