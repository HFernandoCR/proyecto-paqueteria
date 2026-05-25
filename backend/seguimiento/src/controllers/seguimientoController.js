const http = require('../helpers/http');

exports.getEstadoTiempoReal = async (req, res) => {
  try {
    const { vehiculoId } = req.params;
    
    // 1. Obtener datos del vehículo
    const vehiculo = await http.fetchVehiculo(vehiculoId);
    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    // 2. Obtener ubicación actual
    const ubicacionActual = await http.fetchUbicacionActual(vehiculoId);

    // 3. Devolver objeto combinado
    res.json({
      vehiculo,
      ubicacionActual
    });
  } catch (error) {
    console.error('[seguimiento] Error en getEstadoTiempoReal:', error.message);
    res.status(500).json({ error: 'Error interno al consultar el estado en tiempo real' });
  }
};

exports.getHistorialVehiculo = async (req, res) => {
  try {
    const { vehiculoId } = req.params;
    
    const vehiculo = await http.fetchVehiculo(vehiculoId);
    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    const historial = await http.fetchHistorial(vehiculoId);

    res.json({
      vehiculo,
      historial
    });
  } catch (error) {
    console.error('[seguimiento] Error en getHistorialVehiculo:', error.message);
    res.status(500).json({ error: 'Error interno al consultar el historial' });
  }
};

exports.getVehiculosActivos = async (req, res) => {
  try {
    const vehiculosActivos = await http.fetchVehiculosActivos();
    
    // Obtener ubicación de cada uno en paralelo
    const activosConUbicacion = await Promise.all(vehiculosActivos.map(async (vehiculo) => {
      const ubicacionActual = await http.fetchUbicacionActual(vehiculo._id);
      return { vehiculo, ubicacionActual };
    }));

    res.json(activosConUbicacion);
  } catch (error) {
    console.error('[seguimiento] Error en getVehiculosActivos:', error.message);
    res.status(500).json({ error: 'Error interno al consultar vehículos activos' });
  }
};
