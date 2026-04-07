# Normalized Model - Futbol Aragón Spike

## Objetivo
Definir el modelo normalizado mínimo del prototipo para persistir información útil del spike sin depender todavía del Core de ProcessIQ.

## Principios
- Mantener separación estricta entre modelo fuente y modelo interno.
- Priorizar trazabilidad y simplicidad sobre completitud.
- Permitir persistencia local del spike y evolución futura hacia un modelo más rico.

## Entidades

### `team`
Representa el equipo raíz del spike.

Campos principales:
- `id`
- `clubId`
- `name?`
- `slug?`
- `season?`
- `active`

### `competition`
Representa la competición asociada al equipo dentro del ámbito del spike.

Campos principales:
- `id`
- `sourceId`
- `teamId`
- `name`
- `season`
- `sourceSystem?`
- `externalCode?`
- `groupName?`
- `status?`

### `calendar`
Representa el contexto navegable de calendario de una competición.

Campos principales:
- `id`
- `sourceId`
- `competitionId`
- `teamId`
- `name`
- `seasonLabel?`
- `visibleContext?`

### `round`
Representa una jornada del calendario.

Campos principales:
- `id`
- `sourceId`
- `calendarId`
- `name`
- `order`
- `number?`
- `dateLabel?`
- `status?`

### `match`
Representa un partido de una jornada.

Campos principales:
- `id`
- `sourceId`
- `roundId`
- `homeTeamName`
- `awayTeamName`
- `kickoffAt`
- `status`
- `result?`
- `homeScore?`
- `awayScore?`
- `venue?`
- `sourceUrl?`

### `standing`
Representa una fila de clasificación.

Campos principales:
- `id`
- `sourceId`
- `competitionId`
- `teamName`
- `position`
- `points`
- `played?`
- `won?`
- `drawn?`
- `lost?`
- `goalsFor?`
- `goalsAgainst?`
- `goalDifference?`
- `sourceUrl?`

### `source_reference`
Enlace entre una entidad interna y su referencia en origen.

Campos principales:
- `id`
- `entity`
- `internalId`
- `sourceId`
- `sourceSystem?`
- `sourceEntityType?`
- `sourceUrl?`
- `metadata?`
- `lastSeenAt?`

### `sync_run`
Registro de ejecución de una sincronización.

Campos principales:
- `id`
- `teamId`
- `sourceSystem?`
- `accessMode?`
- `status`
- `startedAt`
- `finishedAt?`
- `summary?`
- `errorMessage?`

## Relaciones mínimas
- `competition.teamId -> team.id`
- `calendar.competitionId -> competition.id`
- `round.calendarId -> calendar.id`
- `match.roundId -> round.id`
- `standing.competitionId -> competition.id`
- `source_reference.internalId -> entidad normalizada correspondiente`
- `sync_run.teamId -> team.id`

## Decisiones prácticas
- `sourceId` se mantiene en las entidades sincronizadas para facilitar trazabilidad durante el spike.
- `source_reference` se conserva como tabla/colección separada porque seguirá siendo útil aunque cambie el modelo interno.
- `sync_run` guarda resumen agregado y estado de ejecución para diagnóstico operativo.
- Los campos opcionales dejan preparada la evolución sin forzar todavía la persistencia completa.

## Siguiente paso
Implementar la persistencia real de estas entidades manteniendo este contrato como modelo interno del spike.
