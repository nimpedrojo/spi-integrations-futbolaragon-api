# Identifiers Map - Futbol Aragón

## Resumen
Listado de parámetros e identificadores observados en el flujo público para el equipo objetivo.

Este documento reutiliza únicamente identificadores ya documentados en [`docs/discovery/functional-navigation-map.md`](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/docs/discovery/functional-navigation-map.md). El flujo autenticado queda fuera de este spike porque no aporta valor funcional adicional para el alcance actual.

## Tabla de identificadores

| Nombre | Ejemplo | Aparece en | Representa | Estabilidad | Uso previsto | Notas |
|---|---|---|---|---|---|---|
| `cod_primaria` | `1000120` | URL de competición, calendario, partido y clasificación | Identificador base del portal o contexto común de navegación | Media | Mantener como parámetro técnico de navegación mientras se valide su necesidad real | Se repite en todas las vistas observadas del flujo público. No está claro todavía si identifica portal, delegación o aplicación. |
| `CodCompeticion` | `23108488` | URL de competición (`NFG_CmpJornada`) | Competición seleccionada | Media | Candidato para navegación entre vistas relacionadas con competición | Se observa en mayúsculas en una vista y en minúsculas en otras (`codcompeticion`). Conviene validar si el valor permanece estable entre jornadas y vistas. |
| `codcompeticion` | `23108488` | URL de calendario y clasificación | Competición seleccionada | Media | Igual que `CodCompeticion`, pero sin asumir aún normalización definitiva del nombre del parámetro | Parece equivalente funcional a `CodCompeticion`. La diferencia de casing sugiere que la vista no mantiene convención consistente. |
| `CodGrupo` | `23108496` | URL de competición (`NFG_CmpJornada`) | Grupo asociado a la competición | Media | Candidato para navegación contextual dentro de competición | Se reutiliza también como `codgrupo` en otras vistas. |
| `codgrupo` | `23108496` | URL de calendario y clasificación | Grupo asociado a la competición | Media | Igual que `CodGrupo`, evitando decidir todavía el nombre canónico | Relacionado con la categoría/grupo visible `2 Alevin / Copa`. |
| `CodTemporada` | `21` | URL de competición (`NFG_CmpJornada`) | Temporada seleccionada | Media | Contextualizar sincronizaciones por temporada | En otra vista aparece como `codtemporada`. El valor `21` no debe interpretarse aún sin validar su semántica exacta frente a `2025-2026`. |
| `codtemporada` | `21` | URL de calendario | Temporada seleccionada | Media | Igual que `CodTemporada`, sin cerrar todavía convención técnica | Mismo patrón de casing inconsistente que competición y grupo. |
| `CodJornada` | `8` | URL de competición y calendario | Jornada activa o seleccionada en la vista | Baja | Navegación puntual a una jornada concreta | Parece dependiente del estado de la vista y por tanto poco adecuado como clave técnica estable. |
| `codjornada` | `7` | URL de clasificación | Jornada usada para mostrar clasificación en un corte concreto | Baja | Navegación o consulta contextual | Aparece duplicado en la URL de clasificación y además con valor distinto del observado en calendario. |
| `Sch_Codigo_Delegacion` | `1` | URL de competición (`NFG_CmpJornada`) | Posible delegación o ámbito organizativo | Pendiente | Mantener observado, sin usar aún como clave ni filtro | Solo aparece una vez en la documentación actual. Falta evidencia para saber si es fijo o relevante para la navegación. |
| `CodActa` | `922342` | URL de detalle de partido (`NFG_CmpPartido`) | Acta o identificador del partido | Media | Candidato para abrir detalle de partido y vincular acta | Aparece junto con `cod_acta` con el mismo valor, lo que sugiere redundancia. |
| `cod_acta` | `922342` | URL de detalle de partido (`NFG_CmpPartido`) | Acta o identificador del partido | Media | Igual que `CodActa`, pendiente de decidir nombre canónico | Mismo valor que `CodActa` en la misma URL. Conviene validar cuál de los dos es realmente necesario. |
| `competicion` | `[pendiente de capturar valor real]` | Selector inicial del portal público | Control UI para escoger competición | Pendiente | Posible selector de entrada para automatización de navegación | Está documentado como ID de interfaz, no como parámetro de URL. |
| `grupo` | `[pendiente de capturar valor real]` | Selector inicial del portal público | Control UI para escoger grupo | Pendiente | Posible selector de interfaz para navegación inicial | Igual que `competicion`, solo hay evidencia de nombre del ID, no de valor. |
| `divResultados` | `divResultados` | Vista de competición | Contenedor UI de resultados/calendario/clasificación | Baja | Selector auxiliar para extracción o espera de carga | Parece ID de DOM y no identificador de negocio. |
| `CL_Resumen` | `CL_Resumen` | Vista de clasificación | Contenedor o bloque UI del resumen de clasificación | Baja | Selector auxiliar para localizar la tabla de clasificación | También parece un ID de DOM, útil para automatización de UI pero no como clave funcional. |

## Observaciones
- IDs que parecen globales
  `cod_primaria` es el único parámetro observado en todas las vistas públicas documentadas.
- IDs que parecen contextuales
  `CodJornada` y `codjornada` parecen depender de la jornada activa en cada vista.
- IDs que cambian según la vista
  `CodCompeticion` y `codcompeticion`, `CodGrupo` y `codgrupo`, `CodTemporada` y `codtemporada`, `CodActa` y `cod_acta` apuntan al mismo tipo de dato con convenciones distintas de nombre.
- parámetros redundantes
  En el detalle de partido aparecen `CodActa` y `cod_acta` con el mismo valor. En clasificación, `codjornada` aparece repetido en la misma URL.
- relaciones detectadas entre IDs
  `codcompeticion` y `codgrupo` se mantienen entre calendario y clasificación, lo que sugiere relación fuerte entre competición y grupo.
  `codtemporada` parece contextualizar la competición observada, pero todavía no hay evidencia suficiente para afirmar si forma parte de una clave compuesta estable.
  `CodActa`/`cod_acta` parece depender de un partido concreto dentro de una jornada y competición.
- IDs de interfaz frente a IDs funcionales
  `competicion`, `grupo`, `divResultados` y `CL_Resumen` parecen identificadores de DOM o de controles UI, no claves de negocio.

## Recomendación inicial
- Identificadores candidatos a clave técnica
  `codcompeticion` o `CodCompeticion` como identificador de competición observado.
  `codgrupo` o `CodGrupo` como identificador contextual asociado a la competición.
  `CodActa` o `cod_acta` como identificador puntual para detalle de partido.
- Identificadores que no conviene usar como clave
  `CodJornada` y `codjornada`, porque parecen cambiar por vista o corte temporal.
  `divResultados` y `CL_Resumen`, porque parecen IDs de DOM.
  `competicion` y `grupo`, porque por ahora solo están observados como controles UI sin valor real capturado.
- Dudas pendientes de validar
  Si `cod_primaria=1000120` es realmente fijo para Futbol Aragón o solo para el flujo observado.
  Si las variantes con distinto casing son equivalentes al 100 % o si alguna vista exige una concreta.
  Si `codcompeticion + codgrupo + codtemporada` forman un contexto estable reutilizable entre sincronizaciones.
  Si `CodActa` identifica de forma global un partido o solo el acta visible dentro de una competición concreta.
