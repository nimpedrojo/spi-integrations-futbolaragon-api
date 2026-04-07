# Repeated Sync Tests - Futbol Aragón

## Contexto
Se documentan ejecuciones repetidas del flujo de sincronización sobre el mismo equipo objetivo (`team-spike`) para evaluar:

- repetibilidad
- consistencia de resultados
- riesgo de duplicados
- comportamiento ante variaciones en la respuesta fuente

Las evidencias usadas en este documento provienen de los datos persistidos en:

- [sync-runs.json](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/.data/futbol-aragon/normalized/sync-runs.json)
- [pages.json](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/.data/futbol-aragon/raw/pages.json)
- [competitions.json](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/.data/futbol-aragon/normalized/competitions.json)
- [calendars.json](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/.data/futbol-aragon/normalized/calendars.json)
- [rounds.json](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/.data/futbol-aragon/normalized/rounds.json)
- [matches.json](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/.data/futbol-aragon/normalized/matches.json)
- [standings.json](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/.data/futbol-aragon/normalized/standings.json)

## Ejecución 1: primera carga real

- Fecha/hora: `2026-04-07T14:17:48.636Z` a `2026-04-07T14:18:01.812Z`
- `syncRunId`: `sync-team-spike-1775571468636`
- Resultado: `completed`
- Entidades procesadas:
  - `competitions: 143`
  - `calendars: 1`
  - `rounds: 14`
  - `matches: 4`
  - `standings: 8`
- Incidencias: no se registraron
- Observaciones:
  - primera sincronización real extremo a extremo contra Futbol Aragón
  - se generaron dos raw captures relevantes:
    - competición con hash `e3db05b53d01b33a7daa03d4e8a81427ab461cfa555175579bb94436d6ac2616`
    - clasificación con hash `2f005d653e88649b639d30b59a971fa52f374b574914b6722d4a89954dc3cbfa`
  - el flujo produjo datos funcionales completos para el alcance del spike

## Ejecución 2: segunda carga sin cambios esperados

- Fecha/hora: `2026-04-07T14:25:48.256Z` a `2026-04-07T14:26:05.857Z`
- `syncRunId`: `sync-team-spike-1775571948256`
- Resultado: `completed`
- Entidades procesadas:
  - `competitions: 143`
  - `calendars: 1`
  - `rounds: 14`
  - `matches: 4`
  - `standings: 8`
- Incidencias: no se registraron
- Observaciones:
  - los hashes raw de competición y clasificación repitieron exactamente los de la ejecución 1
  - no se observaron cambios visibles en la fuente entre ambas ejecuciones
  - la persistencia normalizada no creció en proporción a la repetición, lo que indica comportamiento de `upsert` estable sobre los IDs actuales

## Ejecución 3: carga con cambio real observado en la respuesta fuente

- Fecha/hora: `2026-04-07T14:36:33.162Z` a `2026-04-07T14:36:33.303Z`
- `syncRunId`: `sync-team-spike-1775572593162`
- Resultado: `failed`
- Entidades procesadas:
  - no se cerró resumen de entidades útiles
- Incidencias:
  - `stage: fatal-sync`
  - `severity: fatal`
  - mensaje: `Core extraction returned no usable data from the competition page. The source HTML is likely invalid or incomplete.`
- Observaciones:
  - la captura raw de competición generada en esta franja tiene hash del payload vacío:
    - `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
  - eso indica una respuesta `200` pero sin HTML útil para extracción
  - tras endurecer la validación del flujo, esta situación ya no se marca como éxito vacío sino como fallo fatal

## Observación adicional relevante

- Existe una ejecución intermedia `sync-team-spike-1775572442097` a las `2026-04-07T14:34:02Z`
- Resultado: `completed`
- Entidades procesadas:
  - `competitions: 0`
  - `calendars: 0`
  - `rounds: 0`
  - `matches: 0`
  - `standings: 0`
- Interpretación:
  - fue un falso positivo anterior a la mejora de validación fatal
  - sirve como evidencia de que el endurecimiento posterior era necesario

## Comparativa final

### Raw captures
- Entre la ejecución 1 y la 2 se generaron nuevas evidencias raw, pero con hashes idénticos para competición y clasificación.
- Esto sugiere estabilidad del contenido fuente en esas dos ejecuciones.
- En la ejecución 3 apareció un payload vacío o no usable en la página de competición.

### Competiciones
- Las ejecuciones 1 y 2 procesaron `143` competiciones.
- No se observaron diferencias funcionales entre ambas.
- El total persistido actual es `145`, pero ese total incluye registros previos de pruebas/stubs y no implica duplicado generado por las dos ejecuciones reales repetidas.

### Calendarios
- Las ejecuciones 1 y 2 procesaron `1` calendario.
- No hubo cambios visibles entre runs.
- El total persistido actual es `2`, de nuevo contaminado por datos previos de prueba del spike.

### Jornadas
- Las ejecuciones 1 y 2 procesaron `14` jornadas.
- No se observaron variaciones.
- El total persistido actual es `15`, con el mismo matiz de baseline previo.

### Partidos
- Las ejecuciones 1 y 2 procesaron `4` partidos.
- No se detectaron diferencias entre ambas.
- El total persistido actual es `5`, afectado por un registro anterior de pruebas.

### Clasificación
- Las ejecuciones 1 y 2 procesaron `8` filas de clasificación.
- No se detectaron diferencias visibles.
- El total persistido actual es `9`, afectado por datos previos del prototipo.

### Diferencias observadas
- Ejecución 1 vs 2:
  - sin cambios visibles
  - hashes raw idénticos
  - mismo volumen de entidades procesadas
- Ejecución 2 vs 3:
  - cambio real en la respuesta fuente o en su usabilidad
  - la página base dejó de ser extraíble aunque devolvía `200`
  - el proceso pasó a fallar de forma explícita y trazable

### Posibles duplicados
- No hay evidencia de duplicado incremental entre las ejecuciones 1 y 2 del flujo real.
- Sí existe ruido histórico en los JSON normalizados por registros de pruebas anteriores del spike.
- Para una validación más limpia en siguientes fases convendría:
  - limpiar el baseline de pruebas manuales/stub
  - separar dataset de test y dataset operativo

## Conclusión
El spike ha demostrado repetibilidad funcional en dos ejecuciones reales consecutivas sobre el mismo equipo objetivo, con resultados y hashes raw consistentes.

También ha quedado demostrado que:
- la fuente puede devolver respuestas `200` no utilizables
- esa situación ya está detectada como fallo fatal y no como éxito silencioso

Conclusión operativa:
- el flujo es suficientemente estable para seguir avanzando
- pero conviene mejorar la robustez del acceso y limpiar el baseline persistido antes de considerar la validación completamente cerrada
