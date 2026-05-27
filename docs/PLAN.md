# Plan de Desarrollo — Proyecto Integrador 8

**Sistema de gestión de rutas y seguimiento de vehículos de paquetería**

> Versión refinada del 20 de mayo de 2026 — incorpora reverse proxy Nginx, redistribución de carga, endpoints PUT, y distribución de tareas de documentación.

---

## 1. Contexto general

| Dato | Valor |
| --- | --- |
| Materias | Servicios Web + Toma de Decisiones |
| Equipo | 6B  |
| Puerto asignado en el servidor | `8108` |
| URL pública | `http://equipo6b.itolab.lat` |
| Repositorio | `https://gitlab.itolab.lat` |
| Fecha de hoy | Miércoles 20 de mayo de 2026 |
| Fecha de entrega | Martes 26 de mayo de 2026 |
| Días efectivos | 6   |

**Hector cubre ambas materias** (Servicios Web + Toma de Decisiones), por lo que es responsable del módulo de analítica y dashboard BI que cumple los requisitos de la segunda materia.

---

## 2. Equipo y reparto de responsabilidades

| Integrante | Rol principal | Responsabilidad |
| --- | --- | --- |
| **García Gallegos Eric** (líder) | Backend | Servicio **Ubicación** (simulador GPS) — pieza más técnica. Además: colección Postman. |
| **Cruz Ruiz Hector Fernando** | Setup, DevOps, BI | Setup inicial del repo + docker-compose + **Nginx proxy** + servicio **Analítica** + dashboard BI + integración final de la documentación |
| **Hernández Soriano Manuel** | Backend | Servicio **Vehículos** + Servicio **Rutas**. Además: diagrama UML de clases. |
| **Martínez Mendoza Jesús Ángel** | Backend | Servicio **Seguimiento** + Servicio **Notificaciones**. Además: casos de uso y flujo. |
| **Diego García Jennifer** | Frontend | Mapa Leaflet + visualización de vehículos animados. Además: grabación del video demo. |
| **Candelaria Velázquez Rodrigo** | Frontend | CRUDs (formularios y tablas) + integración con dashboard. Además: edición del video demo. |

---

## 3. Arquitectura del sistema

```
                Usuario (navegador externo)
                equipo6b.itolab.lat
                            |
                            v
              +--------------------------+
              |  Nginx reverse proxy     |
              |  :8108  (único público)  |
              |  /     -> build React    |
              |  /api/*-> servicios      |
              +--------------+-----------+
                             |  red interna de Docker
   +----------+-----+--------+--------+----------+----------+
   v          v     v        v        v          v          v
+--------+ +------+ +---------+ +-------+ +---------+ +---------+
|Vehíc.  | |Rutas | |Ubicación| |Segui. | |Analítica| |Notific. |
| :3001  | |:3002 | |  :3003  | |:3004  | |  :3005  | |  :3006  |
+---+----+ +--+---+ +----+----+ +---+---+ +----+----+ +----+----+
    |         |         |          |          |           |
    +---------+---------+----------+----------+-----------+
                              |
                              v
                  +-------------------------+
                  |    MongoDB  :27017      |
                  |  (red interna, BDs      |
                  |   lógicas separadas)    |
                  +-------------------------+
```

**Dependencias HTTP entre servicios (red interna):**

- `Vehículos` consulta `Rutas` cuando un endpoint pide info embebida de la ruta asignada de un vehículo.
- `Ubicación` consulta `Rutas` para obtener los waypoints que el simulador GPS necesita recorrer.
- `Seguimiento` consume `Ubicación` (posición y historial) y `Vehículos` (datos del vehículo).
- `Analítica` consume `Ubicación` (historial de coordenadas) y `Vehículos` (catálogo).
- `Notificaciones` recibe eventos disparados internamente desde `Ubicación` (llegada a destino) y `Vehículos` (cambios de estado).

**Decisiones clave:**

- **6 microservicios** Node.js + Express independientes (cada uno con su `Dockerfile` y `package.json`).
- **1 frontend** React + Vite que se compila a estático y lo sirve Nginx en `/`.
- **1 reverse proxy Nginx** en `:8108` — único puerto público, rutea `/api/<servicio>/*` a cada microservicio. Sin esto el sistema no funciona en el servidor del lab porque solo tenemos un puerto público asignado.
- **1 contenedor MongoDB** compartido, con una **base de datos lógica por servicio** (`db_vehiculos`, `db_rutas`, `db_ubicacion`, `db_seguimiento`, `db_analitica`, `db_notificaciones`). Esto preserva el aislamiento conceptual de microservicios sin multiplicar contenedores.
- **Orquestación** con `docker-compose` — todo levanta con `docker compose up -d`.
- **Comunicación entre servicios:** HTTP REST + JSON sobre la red interna de Docker.
- **Tiempo real:** polling desde el frontend cada 3 segundos al endpoint `/api/seguimiento/activos` (sin WebSockets, fuera de alcance).

---

## 4. Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| Backend | Node.js 20 + Express 4 |
| ORM/ODM | Mongoose 8 |
| Base de datos | MongoDB 7 |
| Frontend | React 18 + Vite 5 + TypeScript |
| Estilos | Tailwind CSS 4 |
| Ruteo SPA | React Router 7 |
| Cliente HTTP frontend | Axios |
| Iconos | lucide-react |
| Mapa | Leaflet + react-leaflet + OpenStreetMap (sin API key) |
| Gráficas BI | Recharts |
| Reverse proxy | Nginx (imagen oficial `nginx:alpine`) |
| Contenedores | Docker + docker-compose |
| Repositorio | GitLab self-hosted (gitlab.itolab.lat) |
| Pruebas | Postman / Newman |

---

## 5. Estructura del repositorio (monorepo)

```
proyecto-paqueteria/
├── docker-compose.yml          # orquestación de todo
├── .gitignore                  # node, dist, .env
├── README.md                   # arquitectura, setup, convenciones
├── CONTRIBUTING.md             # guía de contribución
├── docs/
│   ├── PLAN.md                 # este documento
│   ├── arquitectura.md         # diagramas y descripción
│   ├── endpoints.md            # tabla completa de endpoints
│   ├── modelos.md              # modelos de datos
│   ├── casos-de-uso.md         # casos de uso y flujo del sistema
│   ├── uml-clases.md           # diagrama UML de clases
│   ├── pruebas.md              # tabla de casos de prueba
│   ├── etica-datos.md          # ética y privacidad de datos
│   ├── etl.md                  # proceso ETL (extracción, transformación, carga)
│   └── capturas/               # screenshots para entrega
├── proxy/                      # infraestructura de red, no es servicio de negocio
│   ├── Dockerfile
│   └── nginx.conf              # configuración del reverse proxy
├── backend/                    # los 6 microservicios Node.js + Express
│   ├── vehiculos/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   ├── rutas/
│   ├── ubicacion/
│   ├── seguimiento/
│   ├── analitica/
│   └── notificaciones/
├── frontend/                   # React + Vite, build estático servido por Nginx
│   ├── Dockerfile
│   ├── package.json
│   └── src/
└── postman/
    └── proyecto-paqueteria.postman_collection.json
```

**Notas sobre la estructura:**

- `backend/` y `frontend/` son las dos carpetas principales del trabajo.
- `proxy/` queda en la raíz porque Nginx no es ni backend de negocio ni frontend: es infraestructura de red. Además sirve el build estático de React, así que pertenece a ambos lados y no encaja limpiamente dentro de ninguno.
- En `docker-compose.yml` cada servicio tendrá `build: ./backend/<nombre>` (sin nivel intermedio `services/`).

---

## 6. Cronograma de los 6 días

> Sin milestones formales por el atraso, solo guía mental. Cada día tiene un objetivo claro y un criterio binario para saber si se cumplió.

| Día | Fecha | Objetivo | Criterio de cierre |
| --- | --- | --- | --- |
| 1   | Mié 20 | Setup repo en GitLab, `docker-compose.yml` con Nginx + MongoDB + 6 servicios stub, issues creadas, todos clonan y configuran git | `docker compose up -d` levanta todo en :8108 |
| 2   | Jue 21 | CRUDs de Vehículos y Rutas terminados. Eric arranca el **simulador placebo** (coordenadas aleatorias o línea recta). Frontend arranca con mapa vacío en :8108. | Curl/Postman crea un vehículo y una ruta |
| 3   | Vie 22 | Simulador placebo persiste posiciones en `HistorialUbicacion`. Seguimiento consume Ubicación. Frontend muestra un vehículo (cualquiera) moviéndose en el mapa. | Un punto se mueve en el mapa cada 3 segundos |
| 4   | Sáb 23 | Eric sustituye el placebo por el **simulador real** (bearing, velocidad, recorrido por waypoints). CRUDs del frontend listos. Jesús Ángel termina Notificaciones. | Vehículo recorre los waypoints de su ruta real |
| 5   | Dom 24 | Servicio Analítica + dashboard BI completo. Colección Postman final + capturas. Casos de uso y UML en Draw.io. | Dashboard muestra gráficas con datos reales |
| 6   | Lun 25 | Documentación PDF (cada quien su sección, Hector integra). Presentación de 10 diapositivas. Video demo. Ensayo. | PDF y presentación cerrados |
| 7   | Mar 26 | Entrega y presentación. | —   |

**Puntos de control críticos:**

- **Viernes 22 en la noche:** debe haber al menos un punto moviéndose en el mapa, aunque sea con coordenadas inventadas. Si no, recortar más alcance.
- **Sábado 23 en la noche:** el simulador real debe estar corriendo. Si no, mantener el placebo y documentar como "simulación de coordenadas" en el PDF.

> Estrategia "simulador placebo → simulador real": Eric entrega primero una versión que solo genera coordenadas falsas y las persiste. Eso desbloquea a Jesús Ángel, Jennifer, Rodrigo y al BI desde el viernes. El algoritmo de bearing y avance por waypoints lo refina en paralelo durante sábado.

---

## 7. Convenciones de Git (importante)

### Ramas

- `main` → protegida, solo merge desde MRs aprobados
- `feature/<num-issue>-<descripcion-kebab>` → ej: `feature/12-crud-vehiculos`
- `fix/<num-issue>-<descripcion-kebab>` → ej: `fix/23-bearing-mal-calculado`
- `docs/<descripcion>` → ej: `docs/readme-instalacion`

### Conventional Commits (obligatorio)

```
feat(vehiculos): agregar POST /vehiculos
fix(ubicacion): corregir cálculo de bearing
docs(readme): agregar instrucciones de docker
refactor(rutas): extraer validación a middleware
test(seguimiento): cubrir consulta de historial
chore(deps): actualizar express a 4.19
```

### Reglas duras del equipo

1. **Nadie hace push directo a `main`** — todo entra por Merge Request.
2. **Cada MR vinculado a un issue** con `Closes #N` en la descripción.
3. **Cada MR aprobado por al menos un compañero** (no el autor).
4. **Commits pequeños y frecuentes** — no un commit gigante el último día.
5. **Cada integrante con su `git config user.name` y `user.email` reales** — el profe revisa `git log` y debe ver los 6 nombres.
6. **Antes de pedir merge, hacer `git pull origin main`** y resolver conflictos en tu rama.

### Flujo de cada integrante

```bash
# 1. Posicionarse en main actualizado
git checkout main
git pull origin main

# 2. Crear rama desde main
git checkout -b feature/12-crud-vehiculos

# 3. Trabajar, commits pequeños
git add .
git commit -m "feat(vehiculos): agregar modelo Mongoose"
git push -u origin feature/12-crud-vehiculos

# 4. En GitLab: crear MR con "Closes #12" en descripción

# 5. Esperar aprobación + merge

# 6. Limpiar
git checkout main
git pull origin main
git branch -d feature/12-crud-vehiculos
```

---

## 8. Labels en GitLab

### Por servicio

`svc::vehiculos`, `svc::rutas`, `svc::ubicacion`, `svc::seguimiento`, `svc::analitica`, `svc::notificaciones`

### Por área

`area::frontend`, `area::devops`, `area::docs`, `area::pruebas`

### Por tipo

`type::feature`, `type::bug`, `type::enhancement`

### Por prioridad

`prio::alta`, `prio::media`, `prio::baja`

### Por estado (para el board Kanban)

`status::todo`, `status::in-progress`, `status::review`, `status::done`

> El board Kanban se configura con columnas basadas en los `status::*` y las cards se arrastran entre columnas.

---

## 9. Endpoints por servicio

> Todos los endpoints públicos quedan detrás del proxy Nginx en `:8108/api/<servicio>/...`. Los puertos `:3001-:3006` son solo accesibles dentro de la red de Docker.

### Servicio Vehículos (`:3001`)

| Método | Endpoint | Descripción |
| --- | --- | --- |
| POST | `/vehiculos` | Registrar vehículo |
| GET | `/vehiculos` | Listar vehículos |
| GET | `/vehiculos/:id` | Consultar vehículo (con ruta embebida) |
| PUT | `/vehiculos/:id` | Reemplazar vehículo completo |
| PATCH | `/vehiculos/:id` | Actualización parcial |
| DELETE | `/vehiculos/:id` | Eliminar vehículo |
| PATCH | `/vehiculos/:id/estado` | Cambiar estado |
| POST | `/operadores` | Registrar operador |
| GET | `/operadores` | Listar operadores |

> `GET /vehiculos/:id` consulta a Rutas internamente para embeber la información de la ruta asignada (nombre, distancia).

### Servicio Rutas (`:3002`)

| Método | Endpoint | Descripción |
| --- | --- | --- |
| POST | `/rutas` | Crear ruta |
| GET | `/rutas` | Listar rutas |
| GET | `/rutas/:id` | Consultar ruta |
| PUT | `/rutas/:id` | Reemplazar ruta completa |
| PATCH | `/rutas/:id` | Actualización parcial |
| DELETE | `/rutas/:id` | Eliminar ruta |
| POST | `/rutas/:id/asignar` | Asignar ruta a vehículo `{ vehiculoId }` |

### Servicio Ubicación (`:3003`) — incluye simulador GPS

| Método | Endpoint | Descripción |
| --- | --- | --- |
| GET | `/ubicaciones/actual/:vehiculoId` | Ubicación actual |
| GET | `/ubicaciones/historial/:vehiculoId` | Historial completo |
| POST | `/simulador/start/:vehiculoId` | Iniciar simulación |
| POST | `/simulador/stop/:vehiculoId` | Detener simulación |
| GET | `/simulador/status` | Estado del simulador |

Internamente: job que cada 3s avanza la posición de los vehículos activos por los waypoints de su ruta (consultados a Rutas), calcula bearing y velocidad, persiste en `HistorialUbicacion`. En la fase placebo el job solo escribe coordenadas aleatorias o una línea recta entre origen y destino.

### Servicio Seguimiento (`:3004`)

| Método | Endpoint | Descripción |
| --- | --- | --- |
| GET | `/seguimiento/:vehiculoId` | Estado en tiempo real + ubicación |
| GET | `/seguimiento/:vehiculoId/historial` | Recorrido del vehículo |
| GET | `/seguimiento/activos` | Todos los vehículos en ruta |

Consume `:3003` (Ubicación) y `:3001` (Vehículos).

### Servicio Analítica (`:3005`) — Toma de Decisiones

| Método | Endpoint | Descripción |
| --- | --- | --- |
| GET | `/kpi/resumen` | KPIs generales (vehículos activos, km hoy, etc.) |
| GET | `/kpi/km-por-vehiculo` | Km recorridos por vehículo (gráfica de barras) |
| GET | `/kpi/entregas-por-dia` | Serie temporal de entregas |
| GET | `/kpi/tiempo-por-ruta` | Tiempo promedio por ruta |
| GET | `/reportes/anomalias` | Vehículos detenidos > X min fuera de zona |

### Servicio Notificaciones (`:3006`)

| Método | Endpoint | Descripción |
| --- | --- | --- |
| POST | `/notificaciones` | Crear notificación (interno) |
| GET | `/notificaciones` | Listar notificaciones |
| PATCH | `/notificaciones/:id/leida` | Marcar como leída |
| DELETE | `/notificaciones/:id` | Eliminar notificación |

---

## 10. Modelos de datos (Mongoose)

> Cada servicio tiene su propia base de datos lógica en el mismo contenedor de MongoDB. Las referencias por `ObjectId` entre servicios se resuelven con llamadas HTTP, no con `populate` cruzado.

### Vehículo (`db_vehiculos`)

```js
{
  placa: String (único),
  modelo: String,
  capacidadKg: Number,
  estadoActual: enum ['disponible', 'en_ruta', 'detenido', 'entregando', 'mantenimiento'],
  operadorId: ObjectId,
  rutaAsignadaId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

> **Nota sobre la entidad `EstadoVehículo`:** el documento del proyecto la lista como entidad separada. En este diseño se modela como `enum` dentro de `Vehículo` (campo `estadoActual`), ya que no tiene atributos propios que justifiquen una colección aparte. Esta decisión se justifica explícitamente en la sección "Modelo de datos" del PDF de entrega.

### Operador (`db_vehiculos`)

```js
{
  nombre: String,
  licencia: String,
  telefono: String,
  activo: Boolean
}
```

### Ruta (`db_rutas`)

```js
{
  nombre: String,
  origen: { lat: Number, lng: Number, direccion: String },
  destino: { lat: Number, lng: Number, direccion: String },
  waypoints: [{ lat: Number, lng: Number }],
  distanciaKm: Number,
  duracionEstimadaMin: Number,
  vehiculoAsignado: ObjectId
}
```

### HistorialUbicación (`db_ubicacion`)

```js
{
  vehiculoId: ObjectId (indexed),
  lat: Number,
  lng: Number,
  velocidadKmh: Number,
  bearing: Number,
  timestamp: Date (indexed)
}
```

> Índice compuesto: `{ vehiculoId: 1, timestamp: -1 }`.

### Notificación (`db_notificaciones`)

```js
{
  vehiculoId: ObjectId,
  tipo: enum ['llegada', 'cambio_estado', 'anomalia'],
  mensaje: String,
  timestamp: Date,
  leida: Boolean
}
```

---

## 11. Issues iniciales (Sprint día 1-2)

Estas son las primeras 23 issues que se crearán en GitLab al inicio:

1. **[DevOps]** Crear repo y estructura base — _Hector_
2. **[DevOps]** `docker-compose.yml` con MongoDB + 6 servicios stub — _Hector_
3. **[DevOps]** Configurar Nginx como reverse proxy en `:8108` — _Hector_
4. **[DevOps]** Configurar protección de rama main y labels — _Hector_
5. **[Vehículos]** CRUD de vehículos (incluye PUT y PATCH) — _Manuel_
6. **[Vehículos]** CRUD de operadores — _Manuel_
7. **[Vehículos]** Endpoint cambio de estado — _Manuel_
8. **[Vehículos]** Integración con Rutas (embeber info de ruta asignada) — _Manuel_
9. **[Rutas]** CRUD de rutas (incluye PUT y PATCH) — _Manuel_
10. **[Rutas]** Endpoint asignación de ruta a vehículo — _Manuel_
11. **[Ubicación]** Modelo y endpoints de consulta — _Eric_
12. **[Ubicación]** Simulador placebo (coordenadas aleatorias o línea recta) — _Eric_
13. **[Ubicación]** Simulador real con bearing, velocidad y waypoints — _Eric_
14. **[Seguimiento]** Endpoints de consulta + integración con Ubicación y Vehículos — _Jesús Ángel_
15. **[Seguimiento]** Lógica de estado en tiempo real — _Jesús Ángel_
16. **[Notificaciones]** CRUD de notificaciones + escucha de eventos de Ubicación — _Jesús Ángel_
17. **[Frontend]** Setup React + Vite + Leaflet — _Jennifer_
18. **[Frontend]** Mapa con marcadores animados (polling 3s) — _Jennifer_
19. **[Frontend]** Vistas de CRUD (vehículos, operadores, rutas) — _Rodrigo_
20. **[Analítica]** Endpoints de KPIs — _Hector_
21. **[Frontend]** Dashboard BI con Recharts — _Hector + Rodrigo_
22. **[Pruebas]** Colección Postman + tabla de casos de prueba — _Eric_
23. **[Docs]** Casos de uso y diagrama de actividades (Draw.io) — _Jesús Ángel_
24. **[Docs]** Diagrama UML de clases (Draw.io) — _Manuel_
25. **[Docs]** Video demo 3-5 min — _Jennifer (graba) + Rodrigo (edita)_

---

## 12. Entregables finales

1. **Documento PDF** (10-20 páginas) con:
  - Portada
  - Introducción
  - Planteamiento del problema
  - Requerimientos (funcionales, no funcionales)
  - Casos de uso y flujo del sistema
  - Diseño (arquitectura, modelo de datos, UML de clases)
  - Tecnologías
  - Implementación (módulos, endpoints, capturas)
  - Pruebas realizadas (tabla de casos + capturas Postman)
  - Resultados, conclusiones, referencias APA
2. **Código fuente** en GitLab del lab
3. **Presentación** de 10 diapositivas
4. **Evidencias** (capturas Postman, interfaz, gráficas)
5. **Sistema funcional** corriendo en `:8108` del servidor del lab
6. **Video demo** 3-5 min

### Reparto de la documentación

Cada integrante redacta la sección del PDF correspondiente a su trabajo. Hector consolida todo y aplica formato institucional al final.

| Sección del PDF | Responsable |
| --- | --- |
| Portada, Introducción | Hector |
| Planteamiento del problema, Requerimientos | Hector |
| Casos de uso y flujo | Jesús Ángel |
| Arquitectura del sistema | Hector |
| Modelo de datos | Manuel |
| UML de clases | Manuel |
| Tecnologías | Hector |
| Implementación: servicios backend | Cada quien su servicio |
| Implementación: frontend | Jennifer + Rodrigo |
| Pruebas realizadas | Eric |
| Resultados y dificultades | Hector (con aportes de todos) |
| Conclusiones (individuales) | Cada integrante |
| Referencias APA | Hector |

---

## 13. Lo que NO va en esta entrega (recorte de alcance)

- WebSockets / Socket.io — polling cada 3s es suficiente.
- Autenticación / JWT.
- API Gateway separado (Nginx hace el trabajo de proxy).
- Tests automatizados extensivos (Jest, etc.).
- CI/CD pipelines en GitLab.
- Mapas con costo (Google Maps, Mapbox) — Leaflet + OSM gratis.
- Persistencia distribuida en múltiples contenedores de MongoDB — un solo contenedor con BDs lógicas.

---

## 14. Próximos pasos inmediatos

| #   | Acción | Responsable | Estado |
| --- | --- | --- | --- |
| 1   | Confirmar con profe de DSPTD el alcance del dashboard BI | Hector | Pendiente |
| 2   | Crear cuenta en gitlab.itolab.lat | Hector | Pendiente |
| 3   | Crear proyecto privado | Hector | Pendiente |
| 4   | Generar Personal Access Token (scope `api`) | Hector | Pendiente |
| 5   | Obtener usernames GitLab de los 5 compañeros | Hector | Pendiente |
| 6   | Correr script de setup (labels + issues + protección main) | Hector | Pendiente |
| 7   | Push inicial: README + `docker-compose.yml` + estructura + `nginx.conf` | Hector | Pendiente |
| 8   | Agregar a los 5 como Maintainers | Hector | Pendiente |
| 9   | Junta de 30 min con equipo: presentar plan refinado | Hector + Eric | Pendiente |
| 10  | Todos clonan en `equipo6b.itolab.lat` y configuran git | Equipo | Pendiente |
| 11  | Cada quien arranca su feature branch del Sprint 1 | Equipo | Pendiente |

---

Documento creado el 20 de mayo de 2026.