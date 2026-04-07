# Functional Coverage - Futbol Aragón

## Alcance esperado

El alcance funcional definido para este spike es:

- `competiciones`
- `calendarios`
- `jornadas`
- `partidos`
- `clasificaciones`

Ámbito del spike:

- un único `equipo`
- de un único `club`
- usando únicamente el `flujo público` de Futbol Aragón

La validación de este documento se apoya en:

- las ejecuciones reales persistidas en [sync-runs.json](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/.data/futbol-aragon/normalized/sync-runs.json)
- las evidencias raw en [pages.json](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/.data/futbol-aragon/raw/pages.json)
- la validación repetida documentada en [repeated-sync-tests.md](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/docs/validation/repeated-sync-tests.md)
- la consistencia de contratos documentada en [json-contract-consistency.md](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/docs/validation/json-contract-consistency.md)

## Validación por entidad

### Competiciones

- Se obtiene correctamente: `sí`
- Consistencia: `alta` en las dos ejecuciones reales correctas
- Observaciones:
  - en las ejecuciones `sync-team-spike-1775571468636` y `sync-team-spike-1775571948256` se extrajeron `143` competiciones
  - el contrato extraído se mantuvo estable entre ambas
  - existe ruido histórico en el dataset persistido total (`145`) por pruebas previas del spike, pero no hay evidencia de duplicado incremental entre las dos runs válidas

### Calendarios

- Se obtiene correctamente: `sí`
- Consistencia: `alta` dentro del alcance del equipo objetivo
- Observaciones:
  - en las dos ejecuciones reales correctas se obtuvo `1` calendario
  - el calendario incluye contexto funcional suficiente para enlazar competición, grupo, temporada, jornada y URL de clasificación
  - el total persistido actual (`2`) incluye al menos un registro previo de prueba

### Jornadas

- Se obtiene correctamente: `sí`
- Consistencia: `alta` en el flujo validado
- Observaciones:
  - en las dos ejecuciones reales correctas se obtuvieron `14` jornadas
  - el extractor devuelve label, número, URL y query contextual
  - `CodJornada` se comporta como identificador contextual y no como clave global
  - el total persistido actual (`15`) está afectado por baseline histórico del prototipo

### Partidos

- Se obtiene correctamente: `sí`
- Consistencia: `media-alta`
- Observaciones:
  - en las dos ejecuciones reales correctas se obtuvieron `4` partidos
  - se extraen local, visitante, fecha, hora, resultado cuando existe, venue y `CodActa` cuando está disponible
  - el contrato es consistente, pero algunos campos son condicionales según el estado del partido
  - el total persistido actual (`5`) incluye un registro previo de prueba

### Clasificaciones

- Se obtiene correctamente: `sí`
- Consistencia: `alta` en la vista validada
- Observaciones:
  - en las dos ejecuciones reales correctas se obtuvieron `8` filas de clasificación
  - se extraen métricas principales y `codigoEquipo` cuando aparece
  - la cobertura está validada sobre la vista pública detallada actualmente observada
  - el total persistido actual (`9`) incluye ruido histórico de pruebas anteriores

## Validación del flujo completo

### Ejecución extremo a extremo

El flujo completo quedó validado de forma real en al menos dos ejecuciones correctas:

- `sync-team-spike-1775571468636`
- `sync-team-spike-1775571948256`

Ambas cerraron con `status=completed` y el mismo resumen:

- `competitions: 143`
- `calendars: 1`
- `rounds: 14`
- `matches: 4`
- `standings: 8`

Esto confirma que el sistema cubre el alcance funcional esperado del spike cuando la fuente devuelve HTML utilizable.

### Raw captures

- El flujo genera evidencias raw de las páginas base consumidas.
- En las ejecuciones correctas se registraron al menos:
  - página de competición
  - página de clasificación
- Los hashes raw fueron idénticos entre las dos runs válidas observadas, lo que refuerza la estabilidad funcional del contenido en ese intervalo.

### Modelo normalizado

- El flujo persiste entidades normalizadas separadas de raw para:
  - competiciones
  - calendarios
  - jornadas
  - partidos
  - clasificaciones
  - source references
  - sync runs
- La persistencia actual es suficientemente operativa para el spike y permite trazabilidad por ejecución.

### Sync run

- Cada ejecución deja `sync_run` con estado y resumen.
- También quedó validado el comportamiento ante error fatal:
  - `sync-team-spike-1775572593162`
  - `status=failed`
  - error explícito cuando la página de competición devolvió contenido no utilizable

Esto no amplía cobertura funcional, pero sí confirma que el flujo extremo a extremo deja trazabilidad operativa cuando falla.

## Gaps detectados

- No existe todavía una cobertura funcional multi-equipo o multi-club.
- El punto de entrada sigue dependiendo de parámetros de navegación documentados para el spike y no de un descubrimiento completo desde la referencia persistida del equipo.
- Hay ruido en los JSON persistidos por datos previos de prueba o stubs, lo que reduce algo la limpieza del baseline.
- La robustez del flujo depende de que el HTML público llegue completo y utilizable.
- No se ha validado aún una serie amplia de cambios reales en calendario, resultados o clasificación entre varios días de ejecución.

## Limitaciones conocidas

- El spike está limitado a:
  - un único equipo
  - un único club
  - portal público
- La extracción depende del HTML actual y de selectores observados en discovery.
- Algunos textos visibles pueden venir degradados por codificación origen.
- Existen respuestas `200` no utilizables; ya están detectadas como fallo fatal, pero siguen siendo una fragilidad de la fuente.
- La cobertura actual valida el alcance funcional del spike, no una integración lista para producción generalista.

## Conclusión

El spike cubre funcionalmente el alcance definido para:

- `competiciones`
- `calendarios`
- `jornadas`
- `partidos`
- `clasificaciones`

siempre que se mantenga el mismo ámbito:

- un único equipo
- un único club
- flujo público

Nivel de cobertura: `alto` dentro del alcance del spike.

Nivel de confianza: `medio-alto`.

Recomendación:

- sí, el spike cubre realmente el alcance funcional definido y permite seguir avanzando
- conviene hacerlo sobre la base de que aún existen fragilidades operativas de fuente y un baseline persistido con algo de ruido histórico
- antes de una siguiente fase más ambiciosa, merece la pena reforzar la resolución de navegación desde `source references` y limpiar el dataset de pruebas antiguas
