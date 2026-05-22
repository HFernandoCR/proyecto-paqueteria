# Sistema de Gestión de Rutas y Seguimiento de Vehículos de Paquetería

**Proyecto Integrador 8 — Equipo 6B**  
Materias: Servicios Web + Toma de Decisiones

---

## Arquitectura del sistema

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
                       |  red interna Docker
 +----------+--------+--------+----------+----------+----------+
 v          v        v        v          v          v
:3001     :3002    :3003    :3004      :3005      :3006
Vehículos  Rutas  Ubicación Seguim.  Analítica  Notificac.
    |        |       |        |          |          |
    +--------+-------+--------+----------+----------+
                          |
                  MongoDB :27017
              (6 BDs lógicas separadas)
```

### Microservicios

| Servicio       | Puerto | BD lógica          | Responsable    |
| -------------- | ------ | ------------------ | -------------- |
| vehiculos      | 3001   | db_vehiculos       | Manuel         |
| rutas          | 3002   | db_rutas           | Manuel         |
| ubicacion      | 3003   | db_ubicacion       | Eric           |
| seguimiento    | 3004   | db_seguimiento     | Jesús Ángel    |
| analitica      | 3005   | db_analitica       | Hector         |
| notificaciones | 3006   | db_notificaciones  | Jesús Ángel    |

---

## Stack tecnológico

| Capa           | Tecnología                         |
| -------------- | ---------------------------------- |
| Backend        | Node.js 20 + Express               |
| ODM            | Mongoose                           |
| Base de datos  | MongoDB 7                          |
| Frontend       | React 18 + Vite                    |
| Mapa           | Leaflet + OpenStreetMap            |
| Gráficas BI    | Recharts                           |
| Reverse proxy  | Nginx alpine                       |
| Contenedores   | Docker + docker-compose            |
| Repositorio    | GitLab self-hosted                 |
| Pruebas        | Postman / Newman                   |

---

## Setup y ejecución

### Prerrequisitos

- Docker Desktop instalado y corriendo
- Git configurado con tu nombre e email real

### Clonar y levantar

```bash
# 1. Clonar el repositorio
git clone https://gitlab.itolab.lat/equipo-6b/proyecto-paqueteria.git
cd proyecto-paqueteria

# 2. Levantar todos los servicios
docker compose up -d

# 3. Verificar que todo esté corriendo
docker compose ps

# 4. Revisar logs si algo falla
docker compose logs <nombre-servicio>
```

El sistema queda disponible en `http://equipo6b.itolab.lat`.

### Verificar health de cada servicio (desde el host)

> En desarrollo local reemplaza `equipo6b.itolab.lat` por `localhost:8108`.

```bash
curl http://equipo6b.itolab.lat/api/vehiculos/health
curl http://equipo6b.itolab.lat/api/rutas/health
curl http://equipo6b.itolab.lat/api/ubicacion/health
curl http://equipo6b.itolab.lat/api/seguimiento/health
curl http://equipo6b.itolab.lat/api/analitica/health
curl http://equipo6b.itolab.lat/api/notificaciones/health
```

Todos deben responder `{"status":"ok","service":"<nombre>"}`.

### Detener el sistema

```bash
docker compose down          # detiene sin borrar datos
docker compose down -v       # detiene y borra volúmenes (borra MongoDB)
```

---

## Convenciones de Git

### Ramas

| Prefijo    | Uso                              | Ejemplo                          |
| ---------- | -------------------------------- | -------------------------------- |
| `feature/` | Nueva funcionalidad              | `feature/12-crud-vehiculos`      |
| `fix/`     | Corrección de bug                | `fix/23-bearing-mal-calculado`   |
| `docs/`    | Solo documentación               | `docs/readme-instalacion`        |

- `main` está **protegida** — solo entra por Merge Request aprobado.
- Nombrar ramas como `feature/<num-issue>-<descripcion-kebab>`.

### Conventional Commits

Formato: `tipo(alcance): descripción en imperativo`

```
feat(vehiculos): agregar POST /vehiculos
fix(ubicacion): corregir cálculo de bearing
docs(readme): agregar instrucciones de docker
refactor(rutas): extraer validación a middleware
test(seguimiento): cubrir consulta de historial
chore(deps): actualizar express a 4.19
```

Tipos válidos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

### Reglas del equipo

1. **Nadie hace push directo a `main`** — todo entra por Merge Request.
2. **Cada MR vinculado a un issue** con `Closes #N` en la descripción.
3. **Cada MR aprobado por al menos un compañero** (no el autor).
4. **Commits pequeños y frecuentes** — no un commit gigante el último día.
5. **`git config user.name` y `user.email` con tu nombre real** — el profe revisa `git log`.
6. **Antes de pedir merge:** `git pull origin main` y resolver conflictos en tu rama.

### Flujo de trabajo

```bash
# 1. Partir siempre de main actualizado
git checkout main
git pull origin main

# 2. Crear rama para tu issue
git checkout -b feature/12-crud-vehiculos

# 3. Trabajar con commits pequeños
git add .
git commit -m "feat(vehiculos): agregar modelo Mongoose"
git push -u origin feature/12-crud-vehiculos

# 4. En GitLab: abrir Merge Request con "Closes #12" en la descripción

# 5. Esperar aprobación + merge

# 6. Limpiar rama local
git checkout main
git pull origin main
git branch -d feature/12-crud-vehiculos
```

---

## Estructura del repositorio

```
proyecto-paqueteria/
├── docker-compose.yml
├── .gitignore
├── README.md
├── docs/                        # documentación del proyecto
├── postman/                     # colección Postman
├── proxy/
│   ├── Dockerfile               # multi-stage: build React + nginx
│   └── nginx.conf               # reverse proxy + servir estáticos
├── backend/
│   ├── vehiculos/   (puerto 3001)
│   ├── rutas/       (puerto 3002)
│   ├── ubicacion/   (puerto 3003)
│   ├── seguimiento/ (puerto 3004)
│   ├── analitica/   (puerto 3005)
│   └── notificaciones/ (puerto 3006)
│       └── cada uno: Dockerfile, package.json, src/index.js
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
```

---

## Equipo

| Integrante                     | Rol            |
| ------------------------------ | -------------- |
| García Gallegos Eric (líder)   | Backend        |
| Cruz Ruiz Hector Fernando      | DevOps / BI    |
| Hernández Soriano Manuel       | Backend        |
| Martínez Mendoza Jesús Ángel   | Backend        |
| Diego García Jennifer          | Frontend       |
| Candelaria Velázquez Rodrigo   | Frontend       |
