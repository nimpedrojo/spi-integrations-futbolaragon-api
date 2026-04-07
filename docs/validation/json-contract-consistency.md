# JSON Contract Consistency - Futbol Aragón

## Contexto
Se revisan los contratos JSON que generan los extractores actuales del spike para decidir si son suficientemente consistentes como base del resto del trabajo.

La validación se apoya en:

- una ejecución real correcta del flujo completo
- una segunda ejecución real con el mismo resultado
- ejecuciones posteriores donde la fuente devolvió respuesta `200` no utilizable

Referencias principales:

- [pages.json](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/.data/futbol-aragon/raw/pages.json)
- [sync-runs.json](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/.data/futbol-aragon/normalized/sync-runs.json)

## Competiciones

### Estructura esperada
Objeto raíz:

```json
{
  "competitions": [
    {
      "name": "string",
      "url": "string",
      "query": {
        "codPrimaria": 1000120,
        "codCompeticion": 23108488,
        "codGrupo": 23108496,
        "codTemporada": 21,
        "codJornada": 8
      },
      "optgroupLabel": "string",
      "selected": true
    }
  ]
}
```

### Campos obligatorios
- `name`
- `url`
- `query.codCompeticion`
- `selected`

### Campos opcionales
- `query.codPrimaria`
- `query.codGrupo`
- `query.codTemporada`
- `query.codJornada`
- `optgroupLabel`

### Variaciones observadas
- en competiciones no seleccionadas suelen faltar `codGrupo`, `codTemporada` y `codJornada`
- `optgroupLabel` aparece cuando la opción pertenece a un `optgroup`
- se observó mojibake en algunos nombres y labels por la codificación origen

## Calendarios

### Estructura esperada
Objeto raíz:

```json
{
  "calendars": [
    {
      "name": "string",
      "seasonLabel": "string",
      "competitionName": "string",
      "groupName": "string",
      "competitionUrl": "string",
      "calendarUrl": "string",
      "standingsUrl": "string",
      "query": {
        "codPrimaria": 1000120,
        "codCompeticion": 23108488,
        "codGrupo": 23108496,
        "codTemporada": 21,
        "codJornada": 8
      },
      "rounds": []
    }
  ]
}
```

### Campos obligatorios
- `name`
- `query`
- `rounds`

### Campos opcionales
- `seasonLabel`
- `competitionName`
- `groupName`
- `competitionUrl`
- `calendarUrl`
- `standingsUrl`
- cualquier campo individual dentro de `query`

### Variaciones observadas
- en HTML válido se obtuvo exactamente un calendario para el equipo objetivo
- `rounds` se devuelve embebido dentro del calendario
- `competitionName` y otros textos visibles pueden venir con caracteres degradados

## Jornadas

### Estructura esperada
Objeto raíz:

```json
{
  "rounds": [
    {
      "name": "string",
      "number": 8,
      "selected": true,
      "url": "string",
      "dateLabel": "11-04-2026",
      "state": "string",
      "visibleContext": "Jornada 8",
      "navigation": {
        "previousUrl": "string",
        "nextUrl": "string"
      },
      "query": {
        "codPrimaria": 1000120,
        "codCompeticion": 23108488,
        "codGrupo": 23108496,
        "codTemporada": 21,
        "codJornada": 8
      }
    }
  ]
}
```

### Campos obligatorios
- `name`
- `number`
- `selected`
- `url`
- `query.codJornada`

### Campos opcionales
- `dateLabel`
- `state`
- `visibleContext`
- `navigation.previousUrl`
- `navigation.nextUrl`
- resto de `query`

### Variaciones observadas
- `state` no se ha observado de forma fiable por jornada y suele quedar ausente
- `visibleContext` y `navigation` solo tienen sentido en la jornada seleccionada

## Partidos

### Estructura esperada
Objeto raíz:

```json
{
  "matches": [
    {
      "homeTeam": "string",
      "awayTeam": "string",
      "date": "11-04-2026",
      "time": "12:45",
      "result": "4 - 4",
      "status": "scheduled",
      "url": "string",
      "venue": "string",
      "visibleContext": "Jornada 8",
      "query": {
        "codPrimaria": 1000120,
        "codCompeticion": 23108488,
        "codGrupo": 23108496,
        "codTemporada": 21,
        "codJornada": 8,
        "codActa": 922342
      }
    }
  ]
}
```

### Campos obligatorios
- `homeTeam`
- `awayTeam`
- `query`

### Campos opcionales
- `date`
- `time`
- `result`
- `status`
- `url`
- `venue`
- `visibleContext`
- cualquier campo individual de `query`
- `query.codActa`

### Variaciones observadas
- en jornada programada sin acta:
  - no hay `url`
  - no hay `result`
  - no hay `query.codActa`
- en partidos ya jugados sí puede aparecer `codActa` y resultado
- `status` varía según la evidencia HTML disponible

## Clasificación

### Estructura esperada
Objeto raíz:

```json
{
  "standings": [
    {
      "position": 1,
      "teamName": "string",
      "points": 17,
      "played": 7,
      "won": 5,
      "drawn": 2,
      "lost": 0,
      "goalsFor": 27,
      "goalsAgainst": 12,
      "url": "string",
      "recentForm": ["G", "E", "E", "G", "G"],
      "visibleContext": "string",
      "query": {
        "codPrimaria": 1000120,
        "codCompeticion": 23108488,
        "codGrupo": 23108496,
        "codTemporada": 21,
        "codJornada": 8,
        "codigoEquipo": 265
      }
    }
  ],
  "competitionName": "string",
  "seasonLabel": "string",
  "groupName": "string",
  "visibleContext": "string",
  "sourceView": "detail"
}
```

### Campos obligatorios
- `standings`
- `sourceView`
- por fila:
  - `position`
  - `teamName`
  - `query`

### Campos opcionales
- `competitionName`
- `seasonLabel`
- `groupName`
- `visibleContext`
- por fila:
  - `points`
  - `played`
  - `won`
  - `drawn`
  - `lost`
  - `goalsFor`
  - `goalsAgainst`
  - `url`
  - `recentForm`
  - `query.codigoEquipo`

### Variaciones observadas
- se observó `sourceView = detail`
- el extractor contempla `summary`, pero en las capturas válidas revisadas la vista útil fue `detail`
- `recentForm` aparece solo si la tabla contiene la secuencia de últimos resultados

## Comparativa entre ejecuciones

## Ejecuciones válidas observadas
- `sync-team-spike-1775571468636`
- `sync-team-spike-1775571948256`

En ambas:
- `competitions = 143`
- `calendars = 1`
- `rounds = 14`
- `matches = 4`
- `standings = 8`

Los hashes raw repetidos confirman consistencia del contenido fuente:
- competición:
  - `e3db05b53d01b33a7daa03d4e8a81427ab461cfa555175579bb94436d6ac2616`
- clasificación:
  - `2f005d653e88649b639d30b59a971fa52f374b574914b6722d4a89954dc3cbfa`

Conclusión observada:
- los contratos JSON son consistentes entre las dos ejecuciones buenas revisadas
- no se detectaron cambios estructurales entre ellas

## Variación observada en ejecuciones no válidas
También se registraron ejecuciones posteriores donde la respuesta fuente devolvió `200` pero payload vacío:
- hash vacío: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`

Impacto:
- no cambió la forma del contrato
- simplemente no hubo datos útiles que extraer
- el riesgo aquí no es de inconsistencia del JSON extraído, sino de ausencia completa de contenido fuente válido

## Riesgos detectados

### Riesgo 1: codificación de caracteres
- algunos nombres y labels presentan mojibake
- afecta a legibilidad y potencialmente a comparaciones textuales
- no parece romper la estructura contractual

### Riesgo 2: campos opcionales con presencia condicional
- `codActa`, `result`, `url`, `state`, `navigation`, `recentForm` no están siempre presentes
- esto exige que el resto del spike trate esos campos como opcionales reales

### Riesgo 3: dependencia de HTML usable
- una respuesta HTTP `200` no garantiza contrato extraíble
- el mayor riesgo actual es contenido vacío o incompleto, no deriva estructural silenciosa del JSON

### Riesgo 4: mezcla de contratos ricos y contratos mínimos
- `calendar` incorpora `rounds` embebidas
- `rounds` también existe como contrato independiente
- esto es útil para el spike, pero conviene mantener claro qué capa consume cada contrato

## Fixtures
Se dejan ejemplos mínimos observados en:

- [competition.sample.json](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/fixtures/contracts/competition.sample.json)
- [calendar.sample.json](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/fixtures/contracts/calendar.sample.json)
- [round.sample.json](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/fixtures/contracts/round.sample.json)
- [match.sample.json](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/fixtures/contracts/match.sample.json)
- [standing.sample.json](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/fixtures/contracts/standing.sample.json)

## Conclusión
Los contratos JSON actuales son suficientemente consistentes para seguir avanzando con el spike, con estas salvedades:

- deben tratarse varios campos como opcionales de verdad
- no conviene basar decisiones críticas en texto visible sin limpiar codificación
- el mayor riesgo operativo actual está en la variabilidad del HTML fuente, no en una deriva estructural del JSON generado

Conclusión práctica:
- sí, los contratos son utilizables para continuar
- pero la siguiente capa debería reforzar validación de contenido fuente y limpieza mínima de texto
