const UBICACION = process.env.UBICACION_SERVICE_URL || 'http://ubicacion:3003';
const VEHICULOS = process.env.VEHICULOS_SERVICE_URL || 'http://vehiculos:3001';
const RUTAS = process.env.RUTAS_SERVICE_URL || 'http://rutas:3002';
const HTTP_TIMEOUT_MS = Number(process.env.INTERNAL_HTTP_TIMEOUT_MS || 2500);
const VEHICULOS_CACHE_MS = Number(process.env.VEHICULOS_CACHE_MS || 30000);
const RUTAS_CACHE_MS = Number(process.env.RUTAS_CACHE_MS || 60000);

const cache = new Map();
const inFlight = new Map();

function getCache(key) {
  const item = cache.get(key);
  if (!item || item.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return item.value;
}

function setCache(key, value, ttlMs) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(HTTP_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

function appendHistorialParams(url, { limit = 0, desde, hasta, fields } = {}) {
  if (limit > 0) url.searchParams.set('limit', String(limit));
  if (desde) url.searchParams.set('desde', desde instanceof Date ? desde.toISOString() : String(desde));
  if (hasta) url.searchParams.set('hasta', hasta instanceof Date ? hasta.toISOString() : String(hasta));
  if (fields) url.searchParams.set('fields', fields);
  return url;
}

async function fetchVehiculos() {
  const cached = getCache('vehiculos');
  if (cached) return cached;
  if (inFlight.has('vehiculos')) return inFlight.get('vehiculos');

  const request = fetchJson(`${VEHICULOS}/`)
    .then((vehiculos) => {
      setCache('vehiculos', vehiculos, VEHICULOS_CACHE_MS);
      return vehiculos;
    })
    .finally(() => inFlight.delete('vehiculos'));

  inFlight.set('vehiculos', request);
  return request;
}

async function fetchHistorial(vehiculoId, options = {}) {
  try {
    const url = appendHistorialParams(
      new URL(`${UBICACION}/ubicaciones/historial/${vehiculoId}`),
      options
    );
    return await fetchJson(url);
  } catch (_) {
    return [];
  }
}

async function fetchHistoriales(vehiculoIds, options = {}) {
  if (!vehiculoIds.length) return {};

  try {
    const url = appendHistorialParams(new URL(`${UBICACION}/ubicaciones/historial`), options);
    url.searchParams.set('vehiculoIds', vehiculoIds.join(','));
    const data = await fetchJson(url);
    return Object.fromEntries(vehiculoIds.map((id) => [String(id), data[String(id)] || []]));
  } catch (_) {
    return Object.fromEntries(vehiculoIds.map((id) => [String(id), []]));
  }
}

async function fetchRuta(rutaId) {
  const cacheKey = `ruta:${rutaId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const ruta = await fetchJson(`${RUTAS}/${rutaId}`);
    setCache(cacheKey, ruta, RUTAS_CACHE_MS);
    return ruta;
  } catch (_) {
    return null;
  }
}

module.exports = { fetchVehiculos, fetchHistorial, fetchHistoriales, fetchRuta };
