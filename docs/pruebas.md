# Documentación de Pruebas y Casos de Uso

Este documento contiene la matriz de pruebas formales ejecutadas sobre el conjunto de microservicios del **Proyecto Paquetería**.

## Requisitos Previos para Pruebas

Para ejecutar la colección de pruebas exitosamente:
1. Asegurarse de tener Docker instalado.
2. Levantar los servicios de infraestructura (MongoDB) con `docker compose up -d mongo`.
3. Levantar los microservicios en sus respectivos puertos ejecutando `npm run dev` en cada carpeta, o levantando todos vía `docker compose up -d`.
4. Importar el archivo `postman/proyecto-paqueteria.postman_collection.json` en Postman.

---

## Matriz de Casos de Prueba (Flujo Completo E2E)

A continuación, se detalla el flujo ideal de comunicación entre todos los microservicios (End-to-End).

| ID | Microservicio | Endpoint Probado | Escenario (Caso de Prueba) | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **CP-01** | Vehículos | `POST /vehiculos` | Registrar un nuevo camión en la flotilla. | Código `201 Created`. Retorna el objeto del vehículo con un `_id` generado por Mongo. |
| **CP-02** | Rutas | `POST /rutas` | Crear una nueva ruta asignando el ID del vehículo creado en CP-01 y enviando un arreglo de `waypoints`. | Código `201 Created`. Retorna la ruta con los waypoints listos para ser consumidos. |
| **CP-03** | Rutas | `GET /rutas` | Listar todas las rutas para verificar que la ruta anterior se guardó exitosamente. | Código `200 OK`. Retorna un arreglo que incluye la ruta creada. |
| **CP-04** | Ubicación | `POST /simulador/start/:id` | Arrancar el simulador GPS usando el ID del vehículo. El simulador consulta internamente al servicio de Rutas. | Código `200 OK`. Mensaje "Simulador real iniciado con ruta" y comienza a loguear coordenadas en consola. |
| **CP-05** | Seguimiento | `GET /seguimiento/activos` | Consultar la lista de vehículos activos que actualmente están en ruta y enviando telemetría. | Código `200 OK`. El vehículo debe aparecer en la lista como "activo". |
| **CP-06** | Ubicación | `GET /ubicaciones/historial/:id` | Mientras el simulador avanza, consultar el historial de coordenadas generadas. | Código `200 OK`. Retorna un arreglo de puntos GPS con latitud, longitud y timestamp. |
| **CP-07** | Analítica | `GET /api/analitica/kpi/resumen` | Consultar los KPIs globales del sistema mientras los vehículos operan. | Código `200 OK`. Retorna los indicadores clave de rendimiento como km totales y entregas del día. |
| **CP-08** | Ubicación | `POST /simulador/stop/:id` | Detener el simulador manualmente antes de que llegue a su destino. | Código `200 OK`. Mensaje "Simulador detenido manualmente" y cesan los logs en consola. |

---

## Pruebas de Fallo Esperado (Negative Testing)

| ID | Microservicio | Endpoint Probado | Escenario (Caso de Prueba) | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **CP-09** | Ubicación | `POST /simulador/start/:id` | Intentar iniciar el simulador para un vehículo que **NO** tiene ruta asignada o la ruta no tiene waypoints. | Código `400 Bad Request`. Mensaje de error indicando que la ruta no es válida. |
| **CP-10** | Seguimiento | `GET /seguimiento/:id` | Consultar el estado en tiempo real de un vehículo que no existe o cuyo ID es inválido. | Código `404 Not Found` o `400 Bad Request` indicando "Vehículo no encontrado". |
