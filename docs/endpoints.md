# Tabla Completa de Endpoints del Sistema

Este documento es una referencia rápida de todos los endpoints disponibles en los 6 microservicios del **Proyecto Paquetería**. Toda esta configuración puede ser probada importando la colección oficial de Postman disponible en el repositorio:
👉 `postman/proyecto-paqueteria.postman_collection.json`

> **Nota:** Todas las peticiones deben hacerse al Reverse Proxy Nginx en el puerto `8108` (ej. `http://localhost:8108/api/servicio/...`). Nginx se encargará de enrutar la petición al microservicio correspondiente dentro de la red interna de Docker.

---

## Servicio Vehículos (`:3001`) - `/api/vehiculos`

| Metodo | Endpoint | Descripcion | Body Ejemplo | Respuesta Ejemplo |
| ------ | -------- | ----------- | ------------ | ----------------- |
| `POST` | `/api/vehiculos` | Crear vehículo | `{ "placa": "ABC-123", "modelo": "Ford Transit", "capacidadKg": 3500 }` | `201 Created` - `{ "_id": "60a...", "placa": "ABC-123", ... }` |
| `GET`  | `/api/vehiculos` | Listar todos los vehículos | N/A | `200 OK` - `[ { "_id": "...", "placa": "ABC-123" } ]` |
| `GET`  | `/api/vehiculos/:id` | Consultar vehículo por ID (con ruta embebida) | N/A | `200 OK` - `{ "_id": "...", "placa": "ABC-123", "rutaInfo": { ... } }` |
| `PUT`  | `/api/vehiculos/:id` | Reemplazar vehículo completo | `{ "placa": "XYZ-999", "modelo": "Sprinter", "capacidadKg": 4000 }` | `200 OK` - `{ "_id": "...", "placa": "XYZ-999", ... }` |
| `PATCH`| `/api/vehiculos/:id` | Actualización parcial | `{ "capacidadKg": 4500 }` | `200 OK` - `{ "_id": "...", "capacidadKg": 4500 }` |
| `PATCH`| `/api/vehiculos/:id/estado` | Cambiar estado del vehículo | `{ "estadoActual": "en_ruta" }` | `200 OK` - `{ "_id": "...", "estadoActual": "en_ruta" }` |
| `DELETE`|`/api/vehiculos/:id` | Eliminar vehículo | N/A | `200 OK` - `{ "mensaje": "Vehículo eliminado" }` |
| `POST` | `/api/vehiculos/operadores` | Registrar operador | `{ "nombre": "Juan", "licencia": "A123", "telefono": "555-1234" }` | `201 Created` - `{ "_id": "...", "nombre": "Juan" }` |
| `GET`  | `/api/vehiculos/operadores` | Listar operadores | N/A | `200 OK` - `[ { "nombre": "Juan", ... } ]` |

---

## Servicio Rutas (`:3002`) - `/api/rutas`

| Metodo | Endpoint | Descripcion | Body Ejemplo | Respuesta Ejemplo |
| ------ | -------- | ----------- | ------------ | ----------------- |
| `POST` | `/api/rutas` | Crear ruta y asignarla a un vehículo | `{ "nombre": "Ruta Centro", "vehiculoAsignado": "60a...", "origen": { "lat": 19.43, "lng": -99.13 }, "destino": { "lat": 19.44, "lng": -99.14 }, "waypoints": [ { "lat": 19.435, "lng": -99.135 } ] }` | `201 Created` - `{ "_id": "...", "nombre": "Ruta Centro" }` |
| `GET`  | `/api/rutas` | Listar todas las rutas | N/A | `200 OK` - `[ { "nombre": "Ruta Centro", ... } ]` |
| `GET`  | `/api/rutas/:id` | Consultar ruta por ID | N/A | `200 OK` - `{ "_id": "...", "nombre": "Ruta Centro" }` |
| `PUT`  | `/api/rutas/:id` | Reemplazar ruta completa | `{ "nombre": "Ruta Norte", "vehiculoAsignado": "60a...", "waypoints": [] }` | `200 OK` - `{ "_id": "...", "nombre": "Ruta Norte" }` |
| `PATCH`| `/api/rutas/:id` | Actualización parcial | `{ "distanciaKm": 15.5 }` | `200 OK` - `{ "_id": "...", "distanciaKm": 15.5 }` |
| `DELETE`|`/api/rutas/:id` | Eliminar ruta | N/A | `200 OK` - `{ "mensaje": "Ruta eliminada" }` |
| `POST` | `/api/rutas/:id/asignar` | Asignar ruta a vehículo específico | `{ "vehiculoId": "60b..." }` | `200 OK` - `{ "mensaje": "Ruta asignada" }` |

---

## Servicio Ubicación / Simulador (`:3003`) - `/api/ubicacion`

| Metodo | Endpoint | Descripcion | Body Ejemplo | Respuesta Ejemplo |
| ------ | -------- | ----------- | ------------ | ----------------- |
| `GET`  | `/api/ubicacion/ubicaciones/actual/:vehiculoId` | Obtener coordenada actual del vehículo | N/A | `200 OK` - `{ "lat": 19.43, "lng": -99.13, "velocidadKmh": 60 }` |
| `GET`  | `/api/ubicacion/ubicaciones/historial/:vehiculoId` | Obtener todas las coordenadas recorridas | N/A | `200 OK` - `[ { "lat": 19.43, "timestamp": "..." } ]` |
| `POST` | `/api/ubicacion/simulador/start/:vehiculoId` | Iniciar simulación GPS | N/A | `200 OK` - `{ "message": "Simulador iniciado" }` |
| `POST` | `/api/ubicacion/simulador/stop/:vehiculoId` | Detener simulación GPS | N/A | `200 OK` - `{ "message": "Simulador detenido" }` |
| `GET`  | `/api/ubicacion/simulador/status` | Listar IDs de simulaciones activas | N/A | `200 OK` - `{ "activeSimulations": [ "60a..." ] }` |

---

## Servicio Seguimiento (`:3004`) - `/api/seguimiento`

| Metodo | Endpoint | Descripcion | Body Ejemplo | Respuesta Ejemplo |
| ------ | -------- | ----------- | ------------ | ----------------- |
| `GET`  | `/api/seguimiento/activos` | Obtener todos los vehículos actualmente `en_ruta` | N/A | `200 OK` - `[ { "vehiculo": {...}, "ubicacionActual": {...} } ]` |
| `GET`  | `/api/seguimiento/:vehiculoId` | Consultar estado y ubicación en tiempo real de un vehículo específico | N/A | `200 OK` - `{ "vehiculo": {...}, "ubicacionActual": {...} }` |
| `GET`  | `/api/seguimiento/:vehiculoId/historial` | Obtener el recorrido del vehículo | N/A | `200 OK` - `{ "vehiculo": {...}, "historial": [...] }` |

---

## Servicio Analítica / Toma de Decisiones (`:3005`) - `/api/analitica`

| Metodo | Endpoint | Descripcion | Body Ejemplo | Respuesta Ejemplo |
| ------ | -------- | ----------- | ------------ | ----------------- |
| `GET`  | `/api/analitica/kpi/resumen` | Obtener métricas generales del sistema (Km, entregas, activos) | N/A | `200 OK` - `{ "vehiculosActivos": 1, "kmRecorridosHoy": 15.5, ... }` |
| `GET`  | `/api/analitica/kpi/km-por-vehiculo` | Obtener listado de vehículos con sus Km totales | N/A | `200 OK` - `{ "datos": [ { "placa": "ABC", "kmTotal": 10 } ] }` |
| `GET`  | `/api/analitica/kpi/entregas-por-dia` | Obtener serie temporal de días con actividad | N/A | `200 OK` - `{ "datos": [ { "fecha": "2026-05-20", "entregas": 2 } ] }` |
| `GET`  | `/api/analitica/kpi/tiempo-por-ruta` | Obtener promedios de tiempo para completar rutas | N/A | `200 OK` - `{ "datos": [ { "rutaId": "...", "tiempoPromedioMin": 45 } ] }` |
| `GET`  | `/api/analitica/reportes/anomalias` | Listar vehículos fuera de ruta o detenidos | N/A | `200 OK` - `{ "anomalias": [...] }` |

---

## Servicio Notificaciones (`:3006`) - `/api/notificaciones`

| Metodo | Endpoint | Descripcion | Body Ejemplo | Respuesta Ejemplo |
| ------ | -------- | ----------- | ------------ | ----------------- |
| `POST` | `/api/notificaciones` | Crear una notificación (Uso interno) | `{ "vehiculoId": "60a...", "tipo": "llegada", "mensaje": "Vehículo en destino" }` | `201 Created` - `{ "mensaje": "Vehículo en destino", "leida": false }` |
| `GET`  | `/api/notificaciones` | Listar notificaciones | N/A | `200 OK` - `[ { "mensaje": "Vehículo en destino", "leida": false } ]` |
| `PATCH`| `/api/notificaciones/:id/leida` | Marcar notificación como leída | N/A | `200 OK` - `{ "_id": "...", "leida": true }` |
| `DELETE`|`/api/notificaciones/:id` | Eliminar notificación | N/A | `200 OK` - `{ "mensaje": "Notificación eliminada" }` |

---

## Códigos de Error Comunes (Manejo Global)

Si ocurren errores durante las peticiones, el sistema responderá con los siguientes códigos y estructuras JSON estándar:

| Código HTTP | Motivo / Caso de uso | Estructura de Respuesta |
| ----------- | -------------------- | ----------------------- |
| `400 Bad Request` | ID de MongoDB inválido (`CastError`), datos faltantes en validación de Mongoose, estado no permitido en el enum. | `{ "error": "ID inválido" }` o `{ "error": "Estado inválido. Valores permitidos: ..." }` |
| `404 Not Found` | El recurso solicitado por ID no existe en la base de datos o el proxy no encontró el endpoint. | `{ "error": "Vehículo no encontrado" }` |
| `422 Unprocessable Entity` / `400` | Fallo de validación (ej. placa duplicada - error `11000` en Mongo). | `{ "error": "La placa ya existe" }` |
| `500 Internal Server Error` | Error de comunicación entre microservicios o caída de base de datos. | `{ "error": "Error interno del servidor" }` |
| `503 Service Unavailable` | Un microservicio (ej. Rutas) no respondió al intento de consulta interna (`fetch`). | `{ "error": "No se pudo conectar al servicio de Rutas" }` |
