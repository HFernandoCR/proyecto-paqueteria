# Proceso ETL — Servicio de Analitica

## Introduccion
En el contexto de este sistema, el proceso ETL (Extract, Transform, Load) consiste en recopilar informacion de varios microservicios, transformarla para generar indicadores de rendimiento, y exponer dichos datos para su visualizacion. El servicio Analitica no tiene base de datos propia — obtiene datos de otros servicios, los transforma y los expone como KPIs.

## Fase 1: Extraccion (Extract)
- Fuente de datos: servicios internos via HTTP (no BD directa)
- Llamadas que realiza:
  - GET http://vehiculos:3001/ — catalogo de vehiculos y estados
  - GET http://ubicacion:3003/ubicaciones/historial/:id — coordenadas GPS
  - GET http://rutas:3002/ — rutas y duraciones estimadas
- Tipo de datos: estructurados, fuente interna, primera mano (generados por el propio sistema)
- Las URLs de los servicios se encuentran en el archivo `helpers/http.js`.

## Fase 2: Transformacion (Transform)
El servicio aplica transformaciones especificas a los datos extraidos para calcular los KPIs:

- Calculo de distancia (Haversine): Se utiliza la formula de Haversine para medir la distancia entre dos coordenadas geograficas en la superficie terrestre. Esta implementacion se encuentra en el archivo `helpers/geo.js`.
- Agregacion de km por vehiculo: Suma de distancias entre puntos consecutivos del historial de ubicaciones del vehiculo durante el dia actual.
- Calculo de tiempo promedio por ruta: Promedio de tiempos registrados (en minutos) desde el primer hasta el ultimo punto del historial de cada vehiculo asignado a una ruta.
- Deteccion de anomalias: Comparacion de coordenadas de los ultimos 2 puntos del historial — si son iguales (la diferencia de latitud y longitud es menor a 0.0001 grados) y el tiempo entre ellos supera 15 minutos, se clasifica como anomalia (vehiculo detenido).
- Calculo de tasa de actividad: Ratio de `vehiculosActivos` (en_ruta o entregando) frente al total de vehiculos `vehiculosTotal`.

## Fase 3: Carga (Load)
- Los KPIs calculados se exponen como endpoints REST:
  `GET /kpi/resumen`
  `GET /kpi/km-por-vehiculo`
  `GET /kpi/entregas-por-dia`
  `GET /kpi/tiempo-por-ruta`
  `GET /reportes/anomalias`
- El frontend consume estos endpoints y los visualiza en la vista Analisis.
- No hay persistencia de los KPIs — se calculan en tiempo real en cada peticion (ETL en linea, no batch).

## Diagrama del flujo ETL

```
  [Vehiculos :3001] ─┐
  [Ubicacion :3003] ─┼─► [Analitica :3005] ─► [Dashboard /analisis]
  [Rutas     :3002] ─┘    (Transform)           (Visualizacion)
       (Extract)                                    (Load)
```

## Tipos de datos (Unidad 2 DSPTD)
- Datos estructurados: documentos MongoDB con esquema fijo (Mongoose)
- Datos internos: generados por los propios microservicios
- Datos de primera mano: coordenadas GPS simuladas por el sistema
- Datos numericos continuos: lat, lng, velocidadKmh, distanciaKm
- Datos categoricos: estadoActual (enum con 5 valores)
