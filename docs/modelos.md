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

## Ruta (db_rutas)

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| _id | ObjectId | Sí | Identificador único de la ruta |
| origen | String | Sí | Dirección de origen |
| destino | String | Sí | Dirección de destino |
| distanciaKms | Number | Sí | Distancia total en kilómetros |
| vehiculoId | ObjectId | Sí | Referencia al vehículo asignado para esta ruta |
| estado | String | Sí | Estado de la ruta (e.g. pendiente, en_curso, completada) |

## HistorialUbicacion (db_ubicacion)

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| _id | ObjectId | Sí | Identificador único del registro de ubicación |
| vehiculoId | ObjectId | Sí | Referencia al vehículo asociado |
| latitud | Number | Sí | Coordenada de latitud |
| longitud | Number | Sí | Coordenada de longitud |
| timestamp | Date | Sí | Fecha y hora en la que se registró la ubicación |

Índice compuesto: { vehiculoId: 1, timestamp: -1 }

## Notificacion (db_notificaciones)

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| _id | ObjectId | Sí | Identificador único de la notificación |
| usuarioId | ObjectId | Sí | Referencia al usuario u operador que recibe la notificación |
| mensaje | String | Sí | Contenido del mensaje de la notificación |
| tipo | String (Enum) | Sí | Tipo de notificación (valores: alerta, sistema, mantenimiento, ruta) |
| leida | Boolean | Sí | Indica si la notificación ya fue leída |
| fechaCreacion | Date | Sí | Fecha y hora en la que se generó la notificación |
