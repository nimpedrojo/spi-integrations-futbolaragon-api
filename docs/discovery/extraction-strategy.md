# Extraction Strategy - Futbol Aragón

## Contexto

Este documento analiza el funcionamiento observable de la web pública de Futbol Aragón desde la perspectiva de extracción de datos para el spike `spi-integrations-futbolaragon-api`.

El análisis se basa únicamente en la evidencia ya documentada en:

- [`docs/discovery/functional-navigation-map.md`](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/docs/discovery/functional-navigation-map.md)
- [`docs/discovery/identifiers-map.md`](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/docs/discovery/identifiers-map.md)
- [`docs/discovery/public-vs-auth-analysis.md`](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/docs/discovery/public-vs-auth-analysis.md)

No se documenta aquí tráfico de red no capturado todavía. Cuando una conclusión es una inferencia a partir de URLs y comportamiento observado de navegación, se marca como tal.

## Observaciones técnicas

- tipo de navegación
  Inferencia actual: la navegación observada parece principalmente server-side o basada en carga de vistas por URL, porque el cambio entre competición, calendario, partido y clasificación queda reflejado en rutas distintas con query params explícitos.
  No hay evidencia documentada en el repo de una SPA client-side ni de carga principal vía API XHR.
- tipos de requests
  Evidencia observada: navegación por URL con parámetros en query string, lo que apunta al menos a requests `GET`.
  No hay evidencia documentada todavía de `POST`, `XHR`, `fetch`, endpoints JSON ni llamadas internas asíncronas.
- endpoints observados
  `https://www.futbolaragon.com/pnfg/`
  `https://www.futbolaragon.com/pnfg/NPcd/NFG_CmpJornada?cod_primaria=1000120&CodCompeticion=23108488&CodGrupo=23108496&CodTemporada=21&CodJornada=8&Sch_Codigo_Delegacion=1`
  `https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis?cod_primaria=1000120&codtemporada=21&codcompeticion=23108488&codgrupo=23108496&CodJornada=8`
  `https://www.futbolaragon.com/pnfg/NPcd/NFG_CmpPartido?cod_primaria=1000120&CodActa=922342&cod_acta=922342`
  `https://www.futbolaragon.com/pnfg/NPcd/NFG_VisClasificacion?cod_primaria=1000120&codjornada=7&codcompeticion=23108488&codgrupo=23108496&codjornada=7`
- parámetros clave
  `cod_primaria`
  `CodCompeticion` / `codcompeticion`
  `CodGrupo` / `codgrupo`
  `CodTemporada` / `codtemporada`
  `CodJornada` / `codjornada`
  `CodActa` / `cod_acta`
  `Sch_Codigo_Delegacion`
- dependencias
  No hay evidencia documentada de cookies requeridas para el flujo público.
  No hay evidencia documentada de tokens CSRF, headers especiales o sesión obligatoria en el alcance del spike.
  Sí se ha observado la aparición de modales tipo vignette, que pueden afectar a automatización basada en navegador, pero no prueban por sí solos una dependencia de red adicional.
  Queda pendiente validar con captura de red si existen cookies auxiliares o recursos secundarios relevantes para navegación estable.

## Análisis por entidad

### Competiciones

La entrada pública comienza en `https://www.futbolaragon.com/pnfg/`, donde se observa un selector inicial con IDs de interfaz `competicion` y `grupo`.

La competición visible del equipo objetivo se alcanza en una URL específica:

- `NFG_CmpJornada?cod_primaria=1000120&CodCompeticion=23108488&CodGrupo=23108496&CodTemporada=21&CodJornada=8&Sch_Codigo_Delegacion=1`

Con la evidencia actual, la carga de competición parece resolverse mediante una vista HTML servida por URL y parámetros, no mediante un endpoint interno documentado aparte.

### Calendario

El calendario se observa en:

- `NFG_VisCalendario_Vis?cod_primaria=1000120&codtemporada=21&codcompeticion=23108488&codgrupo=23108496&CodJornada=8`

La documentación actual indica que la vista carga una tabla completa tras cerrar el modal vignette. La evidencia disponible apunta a una carga de página o subvista HTML accesible directamente por GET.

No hay evidencia documentada de una llamada separada tipo XHR para rellenar la tabla.

### Jornadas

Las jornadas aparecen de forma contextual dentro de la competición y del calendario, especialmente a través de `CodJornada` o `codjornada`.

Con la evidencia actual, no se ha observado un endpoint independiente dedicado solo a jornadas. La jornada parece seleccionarse como parámetro de vista dentro de rutas mayores.

Por tanto, la extracción de jornadas, al menos con la evidencia actual, parece depender de parsear la vista de competición o calendario y no de consumir un recurso aislado.

### Partidos

El detalle de partido se observa en:

- `NFG_CmpPartido?cod_primaria=1000120&CodActa=922342&cod_acta=922342`

La vista alcanzada es el "acta del partido", con resultado, alineaciones y goles. Esto sugiere una página HTML específica por partido, accesible por identificador de acta.

Con la evidencia actual, la carga del partido parece resolverse por navegación directa a una vista server-side.

### Clasificación

La clasificación se observa en:

- `NFG_VisClasificacion?cod_primaria=1000120&codjornada=7&codcompeticion=23108488&codgrupo=23108496&codjornada=7`

La documentación recoge que se carga una tabla de clasificación tras cerrar el modal vignette. Igual que en calendario, no hay evidencia documentada de un endpoint JSON o XHR separado.

La clasificación parece servirse como HTML en una vista propia, parametrizada por competición, grupo y jornada.

## Evaluación de estrategias

### Scraping HTML puro

Ventajas:

- encaja con toda la evidencia observada hasta ahora
- no depende de descubrir APIs internas no documentadas
- reutiliza directamente las rutas y parámetros ya identificados
- reduce el alcance técnico inicial del spike

Limitaciones:

- obliga a parsear HTML y a convivir con variaciones de estructura de página
- puede verse afectado por modales o cambios de DOM si se automatiza con navegador
- puede ser menos robusto si parte de los datos reales se inyecta después por requests no observadas aún

Evaluación actual:

- estrategia viable y respaldada por la evidencia disponible

### Scraping híbrido

Definición para este spike:

- navegar por URLs públicas conocidas
- capturar HTML principal
- dejar abierta la posibilidad de aprovechar requests internos solo si se observan y validan más adelante

Ventajas:

- mantiene una base simple para empezar
- permite evolucionar sin rehacer el diseño si luego se detectan endpoints internos útiles
- encaja bien con una arquitectura modular cliente + extractor

Limitaciones:

- introduce una estrategia en dos fases, con parte aún pendiente de validación
- requiere disciplina para no asumir endpoints internos sin evidencia

Evaluación actual:

- es la opción más flexible sin contradecir la evidencia disponible

### Consumo de endpoints internos

Ventajas:

- potencialmente simplificaría el parsing si existieran endpoints estructurados reutilizables

Limitaciones:

- no hay endpoints internos observados ni documentados todavía
- elegir esta estrategia ahora sería una decisión no justificada con la evidencia actual
- aumenta el riesgo de diseñar el cliente sobre supuestos incorrectos

Evaluación actual:

- no recomendable en este momento

## Estrategia recomendada

- estrategia elegida
  Scraping híbrido con punto de partida en HTML público servido por URL.
- justificación técnica
  La evidencia actual muestra rutas públicas estables a nivel de vista y parámetros reutilizables para competición, calendario, partido y clasificación.
  No hay evidencia suficiente para diseñar la extracción alrededor de endpoints internos.
  Empezar por HTML permite implementar el spike con el menor número de supuestos no validados.
- implicaciones para el diseño del cliente y extractores
  El cliente debe centrarse en construir y solicitar vistas públicas por `GET` a partir de parámetros observados.
  Los extractores deben trabajar sobre HTML capturado por vista y no asumir respuesta JSON.
  Conviene separar claramente:
  un cliente de navegación pública por URL
  un repositorio de raw capture para guardar HTML completo
  extractores por tipo de vista o entidad
  normalizadores desacoplados del HTML fuente
  Si en una fase posterior se detectan requests internos útiles, podrán añadirse como optimización sin romper el flujo base.
- riesgos
  Que existan requests secundarios no documentados todavía y algunos datos no estén realmente en el HTML principal.
  Que el portal cambie el DOM o los nombres de parámetros entre temporadas o categorías.
  Que los modales tipo vignette interfieran en automatización basada en navegador si se usa ese enfoque.
  Que la estabilidad percibida de `codcompeticion`, `codgrupo`, `codtemporada` y `CodActa` necesite validación adicional antes de consolidar mapping técnico.

## Pendientes de validación

- confirmar con captura de red real si las vistas públicas generan requests XHR adicionales
- verificar si las tablas de calendario y clasificación están completas en el HTML inicial
- validar si `CodActa` basta por sí solo para recuperar partido o si depende de más contexto
- confirmar si `cod_primaria` y `Sch_Codigo_Delegacion` son necesarios en todos los accesos relevantes
