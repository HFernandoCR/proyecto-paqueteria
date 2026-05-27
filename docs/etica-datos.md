# Etica y Privacidad de Datos

## Introduccion
El manejo responsable de la informacion es crucial en un sistema de logistica que registra ubicaciones en tiempo real y datos personales de operadores. Este documento aborda la etica, privacidad, uso legal y anonimizacion de datos aplicados en el sistema de gestion de rutas y seguimiento de vehiculos.

## Datos personales de operadores
- Que datos se almacenan: nombre, numero de licencia, telefono, activo.
- Medidas aplicadas: Los datos se usan exclusivamente para identificar al operador asignado a un vehiculo y no se exponen en endpoints publicos innecesarios.
- Recomendacion de mejora: Cifrar el campo telefono en la base de datos para agregar una capa de proteccion adicional.

## Tracking de ubicacion de vehiculos
- Que se registra: coordenadas GPS cada 3 segundos, velocidad, bearing, timestamp (modelo HistorialUbicacion).
- Uso legitimo: Monitoreo operativo de la flota de reparto de la empresa.
- Limitacion de acceso: Los datos de ubicacion solo son accesibles dentro de la red interna de Docker, no estan expuestos directamente al exterior.
- Retencion de datos: Actualmente, el historial se acumula sin limite. En produccion se recomienda implementar una politica de retencion (ej: eliminar o archivar datos con antiguedad mayor a 90 dias).

## Anonimizacion en el historial
- El modelo `HistorialUbicacion` usa `vehiculoId` (ObjectId) en lugar del nombre o placa del vehiculo, lo cual desacopla el historial de los datos personales del operador.
- Para identificar a que vehiculo u operador pertenece un recorrido se requiere cruzar con la coleccion `Vehiculo`, lo que agrega una capa logica de separacion de informacion.
- Los endpoints de analitica exponen la placa (dato del vehiculo) pero no el nombre ni datos personales del operador.

## Uso legal de los datos simulados
- El sistema utiliza un simulador GPS (no emplea datos reales de personas).
- Las coordenadas generadas son ficticias dentro del rango geografico de Oaxaca, Mexico.
- No se recopilan datos de usuarios finales ni se procesan datos personales reales en esta implementacion.
- En un despliegue real se requeriria:
  - Elaborar un aviso de privacidad.
  - Obtener el consentimiento expreso del operador para el tracking.
  - Cumplir estrictamente con la LFPDPPP (Ley Federal de Proteccion de Datos Personales en Posesion de Particulares).

## Buenas practicas implementadas
- Separacion de bases de datos logicas por servicio (db_vehiculos, db_ubicacion, etc.).
- Comunicacion interna y segura entre servicios dentro de la red del contenedor, evitando exposicion publica de las APIs internas.
- Sin autenticacion JWT en esta version (acorde al alcance del proyecto academico). Sin embargo, en un entorno de produccion se requeriria la implementacion de un sistema de autenticacion y autorizacion por roles (RBAC).
