# Documentación del Diagrama UML de Clases - Sección 10

## Diagrama de la Entidad Principal y Relacionadas

A continuación se presenta el modelo de clases.

![Diagrama UML de Clases](https://drive.google.com/file/d/1Yz8MocB8dpipRxT41QH4dpNVjXyXbrKe/view?usp=sharing)

## Entidades Principales y Atributos

### 1. Vehiculo
Representa a una unidad de transporte dentro de la flotilla.
- `_id`: ObjectId
- `placa`: String (única)
- `modelo`: String
- `capacidadKg`: Number
- `estadoActual`: Enum (String) `['disponible', 'en_ruta', 'detenido', 'entregando', 'mantenimiento']`
- `operadorId`: ObjectId (Ref: Operador)
- `rutaAsignadaId`: ObjectId (Ref: Ruta)
- `createdAt`, `updatedAt`: Date

### 2. Operador
Representa al conductor asignado a un vehículo.
- `_id`: ObjectId
- `nombre`: String
- `licencia`: String
- `telefono`: String
- `activo`: Boolean
- `createdAt`, `updatedAt`: Date

### 3. Ruta
Define el trayecto asignado a un vehículo.
- `_id`: ObjectId
- `nombre`: String
- `origen`: Punto (lat: Number, lng: Number, direccion: String)
- `destino`: Punto (lat: Number, lng: Number, direccion: String)
- `waypoints`: Array de Puntos (lat: Number, lng: Number)
- `distanciaKm`: Number
- `duracionEstimadaMin`: Number
- `vehiculoAsignado`: ObjectId (Ref: Vehiculo)
- `createdAt`, `updatedAt`: Date

### 4. HistorialUbicacion
Registro temporal de la posición de un vehículo.
- `_id`: ObjectId
- `vehiculoId`: ObjectId (Ref: Vehiculo)
- `lat`: Number
- `lng`: Number
- `velocidadKmh`: Number
- `bearing`: Number
- `timestamp`: Date

### 5. Notificacion
Alertas y eventos relacionados con la actividad de los vehículos.
- `_id`: ObjectId
- `vehiculoId`: ObjectId (Ref: Vehiculo)
- `tipo`: Enum (String) `['llegada', 'cambio_estado', 'anomalia']`
- `mensaje`: String
- `timestamp`: Date
- `leida`: Boolean

## Relaciones y Cardinalidades

- **Vehiculo - Operador (1 a 1)**: Un vehículo tiene un único operador asignado (`operadorId`).
- **Vehiculo - Ruta (1 a 1)**: Un vehículo tiene una `rutaAsignadaId`. A su vez, una Ruta puede referenciar a su `vehiculoAsignado`.
- **Vehiculo - HistorialUbicacion (1 a N)**: Un vehículo genera múltiples registros en su historial (`vehiculoId` en HistorialUbicacion).
- **Vehiculo - Notificacion (1 a N)**: Un vehículo puede generar múltiples notificaciones por distintos eventos (`vehiculoId` en Notificacion).

## Decisiones de Diseño

*Nota: `EstadoVehiculo` se modela como enum dentro de `Vehiculo`.*

**Justificación:**
Se decidió utilizar un `enum` interno en el atributo `estadoActual` en lugar de una colección separada porque los estados del vehículo son finitos, cerrados y parte de la lógica central del negocio. Esto simplifica enormemente las consultas a la base de datos (evitando el uso de `populate` o *joins* costosos en Mongoose), garantizando una respuesta más rápida y manteniendo el diseño alineado a la naturaleza orientada a documentos de MongoDB.