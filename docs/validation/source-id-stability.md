# Source ID Stability - Futbol Aragón

## Contexto
Durante el spike se han observado y utilizado varios identificadores fuente para navegar, extraer y persistir información del portal público de Futbol Aragón.

El objetivo de este documento es dejar claro qué identificadores parecen suficientemente estables para servir de base técnica en futuras sincronizaciones y cuáles deben tratarse solo como apoyo contextual.

La valoración se basa solo en lo realmente observado en:

- capturas raw persistidas
- ejecuciones repetidas del sync
- extractores funcionales del spike
- documentación previa de discovery

## Clasificación usada
- `Estable`
- `Probablemente estable`
- `Inestable`
- `No concluyente`

## Identificadores revisados

| Identificador | Qué representa | Dónde aparece | Comportamiento entre vistas / runs | Evaluación | Notas |
|---|---|---|---|---|---|
| `cod_primaria=1000120` | contexto base del portal o módulo de competiciones | competición, clasificación, partido, calendario | se repite en todas las vistas válidas observadas y no cambió entre ejecuciones correctas | `Probablemente estable` | parece muy constante, pero no se ha validado fuera del flujo concreto del spike |
| `CodCompeticion` / `codcompeticion = 23108488` | competición seleccionada | competición, calendario, clasificación, normalizado | se mantiene igual entre vistas relacionadas y entre ejecuciones correctas | `Estable` | cambia el casing del parámetro, no el valor |
| `CodGrupo` / `codgrupo = 23108496` | grupo asociado a la competición | competición, calendario, clasificación, normalizado | se mantiene igual entre vistas y entre ejecuciones correctas | `Estable` | también varía el casing del nombre del parámetro |
| `CodTemporada` / `codtemporada = 21` | temporada técnica | competición y calendario | estable en las capturas válidas observadas | `Probablemente estable` | solo se ha visto sobre una temporada concreta; no se ha contrastado cambio de temporada |
| `CodJornada` / `codjornada = 8` | jornada activa dentro del contexto de la competición | competición, calendario, clasificación | consistente mientras la vista consultada es la misma jornada; cambia al cambiar de jornada | `Probablemente estable` | útil como identificador contextual, no como clave global |
| `CodActa` / `cod_acta = 922342` | acta o detalle técnico del partido | vista de partido / acta | observado como identificador puntual y duplicado en la misma URL | `Probablemente estable` | no se ha validado entre varias actas ni se ha observado en runs repetidos del flujo nocturno actual |
| `Codigo_Equipo` / `codequipo` | identificador técnico del equipo en enlaces de vista de equipo o clasificación | enlaces de partido y clasificación | se observa repetido para el mismo equipo en vistas distintas; por ejemplo `2208411` para Stadium Venecia A | `Probablemente estable` | muy buen candidato técnico para equipo, pero aún no se ha navegado una estrategia completa basada solo en él |
| `position` en clasificación | posición del equipo en la tabla | contrato de clasificación extraído | puede cambiar con la evolución de resultados | `Inestable` | dato funcional, no identificador técnico |
| nombre visible de competición | texto visible de competición | HTML de competición, calendario, clasificación | contenido coherente, pero afectado por mojibake y potencialmente por cambios editoriales | `Inestable` | útil para validación humana, no para clave técnica |
| nombre visible de equipo | texto visible del equipo | partidos, clasificación, enlaces | consistente dentro de la misma captura, pero vulnerable a codificación, sufijos y cambios de nomenclatura | `Inestable` | no debe usarse como única referencia |
| `Sch_Codigo_Delegacion = 1` | posible delegación o ámbito organizativo | URL de competición | solo observado en la entrada de competición documentada | `No concluyente` | falta evidencia para considerarlo necesario o estable |
| `CL_Resumen`, `divResultados`, `competicion`, `grupo` | IDs de DOM o controles de UI | HTML / selectores de interfaz | útiles para extracción, no como identidad funcional | `Inestable` | selectores operativos, no IDs de negocio |

## Observaciones por entidad

### Competición
- `23108488` se mantiene igual entre:
  - URL de competición
  - URL de clasificación
  - contratos extraídos
  - modelo normalizado persistido
- nivel de confianza actual: alto

### Grupo
- `23108496` se mantiene igual entre las mismas vistas y contratos
- nivel de confianza actual: alto

### Jornada
- `8` se mantiene cuando la consulta apunta a jornada 8
- cambia por definición si se consulta otra jornada
- nivel de confianza actual: medio, como contexto y no como identidad global

### Partido / acta
- `CodActa` se ha observado como identificador explícito del detalle de partido
- no se ha validado todavía una serie amplia de actas entre ejecuciones
- nivel de confianza actual: medio

### Equipo
- `codequipo` aparece en:
  - enlaces de clasificación
  - enlaces de ficha/equipo
- para el equipo objetivo se ha observado `2208411`
- nivel de confianza actual: medio-alto

### Clasificación
- la clasificación reutiliza `codcompeticion`, `codgrupo`, `codjornada`
- no introduce una clave técnica nueva claramente mejor que esas
- el `codigoEquipo` dentro de cada fila sí es un identificador interesante del equipo en contexto

### Temporada
- `21` se ha mantenido en todas las vistas correctas observadas
- no hay validación cruzada con otra temporada
- nivel de confianza actual: medio

## Comportamiento entre ejecuciones

## Ejecuciones correctas
En las ejecuciones reales correctas del sync:
- `sync-team-spike-1775571468636`
- `sync-team-spike-1775571948256`

se mantuvieron constantes:
- `CodCompeticion=23108488`
- `CodGrupo=23108496`
- `CodJornada=8`
- hashes raw de competición y clasificación

Esto refuerza la confianza en:
- `codcompeticion`
- `codgrupo`
- `codjornada` como contexto de consulta

## Ejecuciones con respuesta no utilizable
En ejecuciones posteriores:
- la URL y los parámetros seguían siendo los mismos
- pero el payload capturado llegó vacío

Conclusión:
- el principal riesgo observado no es cambio de IDs, sino pérdida de contenido útil aunque la navegación mantenga los mismos parámetros

## Recomendación operativa final

### IDs que usaría como referencia técnica
- `codcompeticion` / `CodCompeticion`
- `codgrupo` / `CodGrupo`
- `codequipo` / `Codigo_Equipo` cuando esté disponible
- `codtemporada` / `CodTemporada` como parte del contexto
- `CodActa` / `cod_acta` para detalle de partido

### IDs que usaría solo como apoyo contextual
- `codjornada` / `CodJornada`
- `cod_primaria`

### IDs que evitaría como base técnica
- nombres visibles de equipo o competición
- `position` de clasificación
- IDs de DOM o de controles UI:
  - `CL_Resumen`
  - `divResultados`
  - `competicion`
  - `grupo`
- `Sch_Codigo_Delegacion` hasta validar mejor su comportamiento

## Conclusión
El nivel de confianza actual permite apoyar la integración futura principalmente en:

- `codcompeticion`
- `codgrupo`
- `codequipo` cuando esté disponible
- `codtemporada`
- `CodActa` para partido

La principal cautela no está en la estabilidad de esos IDs observados, sino en la fiabilidad del contenido HTML que llega con ellos.

Conclusión práctica:
- sí hay base suficiente para seguir avanzando con estos identificadores
- pero conviene seguir tratando `codjornada` como contexto y no como identidad global
- y no conviene depender del nombre visible como clave técnica en ninguna parte del flujo
