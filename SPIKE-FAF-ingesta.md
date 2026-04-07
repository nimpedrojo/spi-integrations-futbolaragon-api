# Spike FAF - Ingesta automatizada desde Futbol Aragón

## Objetivo
Validar la viabilidad técnica y construir un prototipo funcional para automatizar la ingesta desde Futbol Aragón hacia un nuevo servicio de integración ProcessIQ.

## Alcance
- Competiciones
- Calendarios
- Jornadas
- Partidos
- Clasificaciones

## Ámbito
- Un único equipo
- De un único club

## Frecuencia objetivo
- Sincronización diaria
- Ejecución nocturna

## Entidad raíz
- Equipo

## Stack
- Node.js
- Fastify

## Persistencia del spike
- Raw JSON
- Base de datos normalizada

## Fuentes a validar
- Portal público
- Portal autenticado

## Criterios de éxito
- Login automatizable si aplica
- Extracción estable de competiciones
- Extracción estable de calendarios
- Extracción estable de jornadas
- Extracción estable de partidos
- Extracción estable de clasificaciones
- Datos estructurados en JSON consistente
- Persistencia raw y en BD
- Job repetible
- Mapping básico al modelo interno
- Identificación de IDs estables
- Tolerancia a errores parciales

## Riesgos conocidos
- Diferencias entre portal público y autenticado
- Cambios en HTML o navegación
- IDs no estables
- Dependencia de sesión
- Validación legal pendiente

## Entregables
- Servicio base del spike
- Extractores del alcance
- Persistencia raw + normalizada
- Job manual ejecutable
- Simulación de job nocturno
- Informe final de conclusiones