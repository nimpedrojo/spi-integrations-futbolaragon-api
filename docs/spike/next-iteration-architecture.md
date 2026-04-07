# Next Iteration Architecture - Futbol Aragón

## Objetivo de la siguiente fase

La siguiente iteración debe evolucionar el spike actual hacia una solución más robusta, repetible y mantenible, sin perder la simplicidad conseguida.

El objetivo no es rehacer la arquitectura, sino endurecerla para:

- ejecutar sincronizaciones nocturnas de forma fiable
- soportar incrementalidad básica
- consolidar identidad y navegación del equipo
- mejorar persistencia y trazabilidad
- preparar una integración limpia con ProcessIQ

## Decisiones clave

### Ejecución

- mantener el sync como `job no interactivo`
- conservar un `servicio de orquestación` separado del job CLI
- seguir ejecutando la ingesta como proceso batch y no como request HTTP síncrona

Decisión práctica:

- el job nocturno seguirá siendo la vía principal de ejecución
- la API Fastify puede exponer disparo manual o estado, pero no debe asumir la carga principal del proceso

### Incrementalidad

- pasar de “recaptura completa del contexto” a `incrementalidad pragmática`
- no intentar una delta compleja desde el primer momento

Decisión práctica:

- mantener captura completa de las páginas base necesarias
- añadir deduplicación por `contentHash`
- evitar reprocesado innecesario cuando el raw no cambie
- permitir reextracción desde raw ya persistido

### Identidad

- consolidar `source references` como base técnica de identidad
- dejar de depender de parámetros hardcodeados del spike

Decisión práctica:

- persistir en la referencia del equipo:
  - `sourceTeamId` cuando exista
  - `sourceUrl`
  - `sourceTeamSlug`
  - parámetros navegables mínimos del contexto del equipo
- usar nombres visibles solo como validación o fallback humano

### Errores

- mantener la separación entre errores `fatales` y `warning`
- ampliar la trazabilidad por etapa sin convertirlo en un framework complejo

Decisión práctica:

- conservar `sync_run` como eje operativo
- registrar incidencias por etapa
- añadir mejor clasificación de causas:
  - `source_unavailable`
  - `source_empty`
  - `extract_failed`
  - `persist_failed`

### Persistencia

- mantener separación estricta entre `raw` y `normalizado`
- seguir con un diseño simple, pero preparado para salir del filesystem si hiciera falta

Decisión práctica:

- en la siguiente fase todavía puede mantenerse persistencia local simple si acelera el trabajo
- pero la capa repository debe quedar lista para sustituir filesystem por una persistencia más estable sin tocar extractores ni orquestación

## Evolución de la arquitectura actual

La arquitectura actual ya tiene una base válida:

- cliente público
- extractores por entidad
- normalizadores
- repositories
- job + service
- raw captures
- source references
- sync runs

La evolución recomendada es:

1. fortalecer identidad y navegación
2. fortalecer reejecución y deduplicación
3. fortalecer observabilidad operativa
4. preparar contrato de salida estable hacia ProcessIQ

No se recomienda introducir una arquitectura nueva por colas, microservicios adicionales o pipelines complejos en esta iteración.

## Nuevos componentes necesarios

### 1. Navigation Context Resolver

Responsabilidad:

- resolver desde `source_reference` el contexto navegable del equipo
- construir el punto de entrada del sync sin depender del baseline manual del spike

Contenido mínimo:

- `codCompeticion`
- `codGrupo`
- `codTemporada`
- `codJornada` inicial si aplica
- `codPrimaria` si sigue siendo necesario

### 2. Raw Replay / Reprocess Service

Responsabilidad:

- relanzar extracción y normalización desde raw persistido
- permitir diagnóstico sin depender de la fuente en tiempo real

Valor:

- reduce coste de debug
- facilita tests de regresión sobre HTML real

### 3. Deduplication Policy

Responsabilidad:

- evitar escrituras redundantes
- diferenciar “nueva ejecución” de “nuevo contenido”

Mínimo viable:

- comparar `contentHash`
- mantener upsert estable por `sourceId` o clave compuesta

### 4. Contract Validation Tests

Responsabilidad:

- validar que los extractores mantienen estructura esperada sobre fixtures reales

Mínimo viable:

- tests de snapshot o assertions ligeras sobre:
  - competiciones
  - calendarios
  - jornadas
  - partidos
  - clasificación

### 5. Sync Report Builder

Responsabilidad:

- generar un resumen operativo más uniforme por ejecución

Contenido mínimo:

- páginas pedidas
- hashes raw
- entidades procesadas
- incidencias
- warnings
- duración

## Riesgos a mitigar

- dependencia del HTML y de selectores observados
- respuestas `200` con contenido vacío o no utilizable
- mezcla de datos de prueba con datos operativos
- dependencia parcial de navegación resuelta manualmente
- cambios de temporada o de estructura que alteren IDs contextuales
- ampliación futura a varios equipos sin haber consolidado aún identidad y deduplicación

## Roadmap técnico por fases

### Fase 1. Hardening operativo

- persistir contexto de navegación en `source references`
- eliminar dependencia del baseline manual del spike
- mejorar la clasificación de errores operativos
- separar dataset operativo de dataset de pruebas

### Fase 2. Reprocesado y pruebas

- habilitar replay desde raw capture
- fijar fixtures reales de HTML
- añadir tests de contrato y regresión de extractores
- validar más ejecuciones en distintos días

### Fase 3. Incrementalidad práctica

- incorporar deduplicación por `contentHash`
- evitar reescrituras innecesarias cuando no cambie el contenido
- mejorar el cierre de `sync_run` con métricas de cambio real

### Fase 4. Integración estable con ProcessIQ

- definir contrato de salida consumible por el Core o por servicios intermedios
- mantener el servicio de Futbol Aragón como integración desacoplada
- limitar el acoplamiento con ProcessIQ a entidades y eventos necesarios

## Integración futura con ProcessIQ

La integración futura debería mantener estas decisiones:

- el servicio de Futbol Aragón sigue siendo `desacoplado del Core`
- el modelo fuente y el modelo normalizado interno siguen separados
- ProcessIQ no debería depender del HTML ni de IDs de DOM
- la integración con Core debe consumir datos ya normalizados y trazables

Patrón recomendado:

- `Futbol Aragón integration service`
  - navega
  - captura raw
  - extrae
  - normaliza
  - persiste
- `ProcessIQ/Core`
  - consume entidades internas o eventos ya estabilizados

Esto reduce divergencias y mantiene el coste de cambio localizado en el borde de integración.

## Recomendación final

La siguiente iteración debe centrarse en `endurecer`, no en `complicar`.

Recomendación concreta:

- continuar sobre la arquitectura actual
- añadir resolver de navegación persistido
- añadir replay desde raw
- añadir tests de contrato
- añadir incrementalidad básica con deduplicación
- mantener desacople con ProcessIQ

No recomendaría todavía:

- introducir autenticación
- rediseñar la solución como pipeline distribuido
- ampliar a muchos equipos antes de cerrar identidad, deduplicación y robustez operativa

## Conclusión

La arquitectura del spike ya ha demostrado que el enfoque es válido.

La siguiente iteración debería convertir esa validez en una base más productiva mediante:

- identidad más sólida
- navegación menos manual
- mejor reprocesado
- mejor deduplicación
- mejor trazabilidad

Conclusión práctica:

- seguir con la arquitectura actual, evolucionada por capas
- priorizar fiabilidad operativa sobre sofisticación
- preparar el servicio para integrarse con ProcessIQ como adaptador estable de fuente, no como lógica de negocio central
