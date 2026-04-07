# Spike Results - Futbol Aragón

## Contexto

Este documento resume el resultado del spike técnico `spi-integrations-futbolaragon-api`, cuyo objetivo ha sido validar la viabilidad de automatizar una ingesta desacoplada desde Futbol Aragón hacia un servicio propio de integración.

El trabajo realizado durante el spike ha cubierto:

- análisis de navegación
- comparación entre portal público y autenticado
- estrategia de extracción
- implementación de cliente público
- extractores por entidad
- persistencia raw y normalizada
- comando manual y job repetible de sincronización
- validación de contratos
- validación de identificadores
- pruebas repetidas
- validación de cobertura funcional

## Alcance

El alcance funcional validado en el spike es:

- `competiciones`
- `calendarios`
- `jornadas`
- `partidos`
- `clasificaciones`

Ámbito validado:

- un único `equipo`
- de un único `club`
- usando únicamente el `portal público`

Queda fuera del alcance validado:

- multi-equipo
- multi-club
- navegación autenticada
- robustez generalista para producción

## Resultado general

### Viabilidad

La integración es `viable` para el alcance del spike.

### Nivel de confianza

El nivel de confianza actual es `medio-alto`.

### Complejidad

La complejidad técnica observada es `media`.

No parece una integración trivial, pero tampoco requiere, con la evidencia actual, una solución desproporcionada. La mayor complejidad no está en el modelado interno, sino en la dependencia del HTML público y en la variabilidad operativa de la fuente.

## Qué funciona bien

- El portal público cubre el alcance funcional del spike.
- El flujo extremo a extremo quedó validado en ejecuciones reales correctas.
- Los extractores de:
  - competiciones
  - calendarios
  - jornadas
  - partidos
  - clasificaciones
  generan contratos suficientemente consistentes para continuar.
- La persistencia raw y normalizada permite trazabilidad útil.
- Los identificadores principales observados, especialmente `CodCompeticion` y `CodGrupo`, muestran estabilidad suficiente para servir como base técnica.
- En dos ejecuciones correctas consecutivas se repitieron:
  - los mismos conteos funcionales
  - los mismos hashes raw
  - ausencia de evidencia de duplicado incremental
- El flujo ya distingue fallo fatal de error parcial y deja `sync_run` trazable.

## Qué es frágil

- La fuente puede devolver respuestas `200` no utilizables.
- El HTML público es la principal dependencia frágil del sistema.
- Algunos textos visibles llegan con problemas de codificación.
- El punto de entrada del sync aún depende de parámetros documentados del spike y no de una resolución completamente gobernada desde `source references`.
- El baseline persistido actual contiene ruido histórico de pruebas anteriores, lo que ensucia parte de la validación cuantitativa.

## Comparación público vs autenticado

Conclusión del spike:

- el `portal público` cubre el alcance necesario
- el `portal autenticado` se descarta para este spike

Motivos:

- no se ha observado valor funcional adicional útil en el autenticado para el alcance definido
- introducir login y sesión añadiría complejidad operativa sin beneficio claro
- la evidencia sólida del spike está concentrada en el flujo público

Decisión práctica:

- continuar solo con cliente público en la siguiente fase, salvo nueva evidencia relevante

## Estrategia de extracción

La estrategia que mejor encaja con la evidencia observada es:

- `scraping híbrido`

Punto de partida real:

- navegación pública por `GET`
- construcción de URLs con parámetros observados
- captura de HTML raw
- extracción por vista/entidad con `cheerio`

La recomendación del spike no es diseñar ahora alrededor de endpoints internos, porque no hay evidencia suficiente en el repositorio para justificarlo.

## Estabilidad de identificadores

Identificadores con mejor nivel de confianza actual:

- `CodCompeticion` / `codcompeticion`
- `CodGrupo` / `codgrupo`
- `Codigo_Equipo` / `codequipo` cuando está disponible
- `CodActa` / `cod_acta`
- `CodTemporada` / `codtemporada` como contexto compuesto

Identificadores que conviene tratar solo como apoyo contextual:

- `CodJornada` / `codjornada`
- `cod_primaria`

Identificadores que conviene evitar como base técnica:

- nombres visibles
- posición en clasificación
- IDs de DOM o controles UI

Conclusión práctica:

- sí existe base suficiente para modelar la navegación y el mapping técnico sin depender solo del nombre visible

## Calidad de datos

Calidad observada:

- `buena` para el alcance funcional del spike
- `no completamente robusta` desde una perspectiva operativa

Puntos positivos:

- contratos consistentes entre ejecuciones correctas
- cobertura funcional completa del alcance
- datos normalizados utilizables para el prototipo

Puntos débiles:

- algunos campos son condicionales por naturaleza, por ejemplo en partidos no jugados aún
- hay mojibake en ciertos textos visibles
- la fiabilidad del dato depende de que el HTML llegue completo

## Comportamiento en ejecuciones repetidas

El spike ha demostrado:

- repetibilidad funcional en dos ejecuciones reales correctas
- mismos conteos:
  - `competitions: 143`
  - `calendars: 1`
  - `rounds: 14`
  - `matches: 4`
  - `standings: 8`
- mismos hashes raw en competición y clasificación entre esas dos ejecuciones
- ausencia de evidencia de duplicado incremental entre runs correctas

También se ha observado:

- una respuesta fuente no utilizable que provocó fallo fatal correctamente trazado
- un falso positivo previo con conteos a cero, ya corregido por endurecimiento del flujo

Conclusión:

- el comportamiento repetido es suficientemente bueno para seguir avanzando
- pero no debe asumirse todavía como robustez operativa cerrada

## Riesgos técnicos

- cambios en el HTML o en los selectores observados
- respuestas `200` sin contenido útil
- dependencia de parámetros de navegación todavía fijados en parte por conocimiento del spike
- ruido de datos de prueba mezclados en el almacenamiento local actual
- validación todavía limitada a un solo equipo, un solo club y un periodo corto de observación

## Coste de mantenimiento estimado

Estimación actual:

- `moderado`

Razones:

- el diseño modular ayuda a contener el coste
- el uso de raw captures y contratos separados mejora el diagnóstico
- la mayor fuente de coste futuro estará en adaptar extractores si cambia el HTML

No parece una integración de mantenimiento bajo-cero. Requerirá vigilancia razonable y alguna capacidad de ajuste cuando la web cambie, pero el coste sigue siendo asumible si el alcance sigue acotado.

## Recomendación

Recomendación clara:

- `sí, continuar`

Pero continuar con estas condiciones:

- tratar la siguiente fase como endurecimiento de una base ya válida, no como salto directo a producción
- reforzar la resolución de navegación desde `source references`
- limpiar o separar el dataset de pruebas antiguas
- consolidar mejor el control de errores sobre respuestas fuente vacías o degradadas

No recomendaría parar el trabajo, porque el spike ya ha demostrado viabilidad real. Tampoco recomendaría dar el problema por resuelto del todo, porque aún hay fragilidad operativa observable.

## Siguientes pasos

- persistir en la referencia del equipo los parámetros de navegación realmente necesarios para no depender del baseline documentado del spike
- limpiar el baseline local de pruebas o separar entorno operativo y entorno de validación
- añadir tests ligeros de contrato/snapshot sobre los extractores
- ampliar validación temporal con más ejecuciones en días distintos
- reforzar el tratamiento de contenido HTML vacío o degradado antes de marcar éxito
- evaluar después si merece la pena ampliar a más equipos o clubes

## Conclusión final

El spike demuestra que la integración con Futbol Aragón es `técnicamente viable` para el alcance definido.

La cobertura funcional conseguida es alta dentro del ámbito validado y la base implementada ya permite:

- navegar
- capturar raw
- extraer
- persistir
- sincronizar
- trazar incidencias

La principal cautela no está en falta de cobertura, sino en la fragilidad natural del origen HTML y en que la validación aún está acotada.

Conclusión ejecutiva:

- continuar `sí`
- continuar `con endurecimiento incremental`
- no considerar todavía el resultado como integración generalista cerrada para producción
