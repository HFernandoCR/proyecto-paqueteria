# Modelos de datos

## Vehiculo (db_vehiculos)

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| _id | ObjectId | Sí | Identificador único del vehículo |
| placa | String | Sí | Número de placa del vehículo |
| capacidadPeso | Number | Sí | Capacidad máxima de carga en kilogramos |
| estadoActual | String (Enum) | Sí | Estado del vehículo (valores permitidos: disponible, en_ruta, detenido, entregando, mantenimiento) |

**Nota sobre la decisión arquitectónica:**
Se decidió modelar `EstadoVehiculo` como un enum directamente dentro de la colección del vehículo en lugar de utilizar una colección separada. Esta decisión se basa en la simplicidad de acceso, ya que el estado es un valor intrínseco que no requiere atributos adicionales independientes, y evita el costo de realizar `$lookup` (joins) en consultas frecuentes, optimizando así el rendimiento de la base de datos al realizar búsquedas de vehículos disponibles o en ruta.

## Operador (db_vehiculos)

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| _id | ObjectId | Sí | Identificador único del operador |
| nombre | String | Sí | Nombre completo del operador |
| numeroLicencia | String | Sí | Número de la licencia de conducir |
| vehiculoAsignado | ObjectId | No | Referencia al vehículo actualmente asignado |
