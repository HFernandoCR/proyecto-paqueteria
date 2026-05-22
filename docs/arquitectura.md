# Arquitectura del sistema

Sistema de gestión de rutas y seguimiento de vehículos de paquetería.
Documento de referencia técnica del Equipo 6B.

---

## Visión general

```
                Usuario (navegador externo)
                equipo6b.itolab.lat
                            |
                            v
              +--------------------------+
              |  Nginx reverse proxy     |
              |  :8108  (único público)  |
              |  /     -> build React    |
              |  /api/*-> servicios       |
              +--------------+-----------+
                             |  red interna de Docker
   +----------+-----+--------+--------+----------+----------+
   v          v     v        v        v          v          v
+--------+ +------+ +---------+ +-------+ +---------+ +---------+
|Vehíc.  | |Rutas | |Ubicación| |Segui. | |Analítica| |Notific. |
| :3001  | |:3002 | |  :3003  | |:3004  | |  :3005  | |  :3006  |
+---+----+ +--+---+ +----+----+ +---+---+ +----+----+ +----+----+
    |         |          |          |          |           |
    +---------+----------+----------+----------+-----------+
                              |
                              v
                  +-------------------------+
                  |    MongoDB  :27017      |
                  |  (red interna, 6 BDs    |
                  |   lógicas separadas)    |
                  +-------------------------+
```

Único puerto público: `:8108`, manejado por Nginx. Los puertos `3001-3006`
y MongoDB solo son accesibles dentro de la red interna de Docker.

---

## Microservicios

| Servicio       | Puerto | BD lógica         | Responsabilidad principal                          |
| -------------- | ------ | ----------------- | -------------------------------------------------- |
| vehiculos      | 3001   | db_vehiculos      | Catálogo de vehículos y operadores                 |
| rutas          | 3002   | db_rutas          | Rutas, waypoints y asignación a vehículos          |
| ubicacion      | 3003   | db_ubicacion      | Simulador GPS e historial de coordenadas           |
| seguimiento    | 3004   | db_seguimiento    | Estado en tiempo real (combina ubicación+vehículo) |
| analitica      | 3005   | db_analitica      | KPIs y reportes para el dashboard BI               |
| notificaciones | 3006   | db_notificaciones | Eventos del sistema (llegadas, cambios de estado)  |

### Dependencias HTTP entre servicios (red interna)

- `Vehículos` consulta `Rutas` para embeber info de la ruta asignada de un vehículo.
- `Ubicación` consulta `Rutas` para obtener los waypoints que recorre el simulador.
- `Seguimiento` consume `Ubicación` (posición e historial) y `Vehículos` (datos del vehículo).
- `Analítica` consume `Ubicación` (historial) y `Vehículos` (catálogo).
- `Notificaciones` recibe eventos internos de `Ubicación` (llegada a destino) y `Vehículos` (cambios de estado).

Las referencias entre servicios se resuelven con llamadas HTTP, **no** con
`populate` cruzado de Mongoose, porque cada servicio tiene su propia base de datos lógica.

---

## Decisiones de diseño

### 6 microservicios independientes

Cada servicio es un proyecto Node.js + Express autónomo con su propio
`Dockerfile` y `package.json`. Esto mantiene el aislamiento conceptual de
microservicios que pide la materia, sin acoplar la lógica de un servicio con otro.

### Una sola instancia de MongoDB con 6 bases lógicas

En lugar de levantar un contenedor de MongoDB por servicio, se usa un único
contenedor con una base de datos lógica por servicio (`db_vehiculos`,
`db_rutas`, etc.). Esto preserva la separación de datos entre servicios sin
multiplicar contenedores ni consumir recursos de más en el servidor del lab.

### Nginx como reverse proxy y servidor de estáticos

Nginx es el único punto de entrada público (`:8108`). Cumple dos funciones:

1. Servir el build estático de React en `/`.
2. Rutear `/api/<servicio>/*` hacia cada microservicio en la red interna.

#### Proxy Dockerfile multi-stage

El `proxy/Dockerfile` es **multi-stage** y su contexto de build en
`docker-compose.yml` es `.` (la raíz del repo). Esto permite que:

- **Primera etapa:** Nginx copia el `frontend/` y lo compila (genera el build de Vite).
- **Segunda etapa:** se obtiene una imagen `nginx:alpine` limpia que contiene
  únicamente el build resultante y el `nginx.conf`.

Ventaja: elimina la necesidad de un volumen compartido entre contenedores o de
un segundo contenedor solo para servir los estáticos. Un único contenedor Nginx
construye y sirve el frontend, y además hace de proxy.

#### Strip de prefijo en nginx

La barra final en `proxy_pass http://vehiculos:3001/;` hace que Nginx **quite**
el prefijo `/api/vehiculos/` antes de reenviar la petición.

Ejemplo: una petición externa a `GET /api/vehiculos/health` llega al
contenedor del servicio como `GET /health`, que es exactamente la ruta que
expone el Express de cada microservicio. Sin esa barra final, el servicio
recibiría `/api/vehiculos/health` y no encontraría la ruta.

### Comunicación en tiempo real por polling

El frontend consulta `/api/seguimiento/activos` cada 3 segundos para actualizar
las posiciones en el mapa. Se descartó WebSockets/Socket.io por estar fuera del
alcance; el polling es suficiente para la escala del proyecto.

### EstadoVehículo modelado como enum

El documento del proyecto lista `EstadoVehículo` como entidad separada. En este
diseño se modela como un campo `enum` (`estadoActual`) dentro del documento
`Vehículo`, ya que no tiene atributos propios que justifiquen una colección
aparte. Esta decisión se documenta también en el modelo de datos.

---

## Orquestación

Todo el sistema se levanta con:

```bash
docker compose up -d
```

`docker-compose.yml` define los 8 contenedores (6 servicios + Nginx + MongoDB).
Cada servicio se construye con `build: ./backend/<nombre>` y expone un endpoint
`GET /health` que responde `{"status":"ok","service":"<nombre>"}`.
