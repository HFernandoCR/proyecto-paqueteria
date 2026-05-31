# Casos de Uso y Flujo del Sistema

Este documento describe formalmente la interacción entre los actores y el sistema de **Proyecto Paquetería**, apoyado por diagramas diseñados en Draw.io.

## 1. Diagrama de Casos de Uso General

El siguiente diagrama ilustra las funciones principales que puede realizar el Administrador/Operador logístico dentro de la plataforma, así como la interacción automatizada del Simulador GPS.

![Diagrama de Casos de Uso](./diagramas/diagrama-casos-uso.png)

### Actores del Sistema
1. **Operador Logístico (Humano):** Usuario de la interfaz web (React) encargado de dar de alta la infraestructura (vehículos, rutas) y monitorear la operación. Dado que el sistema no requiere Login, cualquier cliente que acceda actúa bajo este rol general.
2. **Simulador GPS (Sistema Automático):** Microservicio interno (Ubicación) que simula el hardware GPS de los camiones, inyectando coordenadas en tiempo real al historial.

### CU-01: Gestión de Flotilla (CRUDs)
- **Actor:** Operador Logístico
- **Descripción:** El operador registra vehículos en el sistema y administra a los choferes encargados de operarlos.
- **Flujo Principal:**
  1. El operador navega al panel de Vehículos/Operadores.
  2. Llena el formulario con placas, capacidad y datos del chofer.
  3. El sistema guarda la entidad en MongoDB (`db_vehiculos`).

### CU-02: Diseño y Asignación de Rutas
- **Actor:** Operador Logístico
- **Descripción:** Se define un trayecto en el mapa con puntos intermedios (waypoints) y se asigna un camión disponible para recorrerlo.
- **Flujo Principal:**
  1. El operador ingresa origen, destino y dibuja la ruta.
  2. El sistema calcula la distancia y la guarda en `db_rutas`.
  3. El operador vincula un vehículo específico a esta ruta.

### CU-03: Seguimiento y Monitoreo en Tiempo Real
- **Actores:** Operador Logístico, Simulador GPS
- **Descripción:** Una vez iniciada la simulación, el vehículo recorre la ruta asignada y el operador lo observa moverse en el mapa.
- **Flujo Principal:**
  1. El operador "Inicia Viaje" para un vehículo.
  2. El **Simulador GPS** comienza a generar y emitir coordenadas basadas en los waypoints.
  3. El Frontend realiza *long-polling* cada 3 segundos al servicio de Seguimiento.
  4. El vehículo se actualiza visualmente en el mapa con su *bearing* (rotación) correcta.

---

## 2. Diagramas de Actividad

Los diagramas de actividad detallan el flujo paso a paso de los procesos internos del sistema, desde que inicia un viaje hasta que se detiene o llega a su destino.

### Flujo Completo de Operación
![Diagrama de Actividades](./diagramas/diagrama-actividades.png)

### Flujo Simplificado
Representación resumida del ciclo de vida de un envío en la plataforma.
![Diagrama Simplificado](./diagramas/diagrama-actividad-simplificado.png)

### Flujo de KPIs Analíticos
Este diagrama muestra cómo la información cruda generada por el Simulador GPS fluye hacia el microservicio de Analítica para ser procesada y mostrada en el **Dashboard BI** como métricas de negocio.
![Diagrama KPI Analíticos](./diagramas/diagrama-actividades-kpi-analiticos.png)
