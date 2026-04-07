# Error Handling Strategy - Futbol Aragón Spike

## Objetivo
Permitir que la sincronización conserve el máximo avance posible cuando una etapa no crítica falla, dejando trazabilidad clara de incidencias parciales y fatales.

## Criterio general
- errores `fatal`: impiden arrancar o continuar el flujo base
- errores `warning`: afectan a una etapa concreta, pero el proceso puede seguir

## Errores fatales
Se consideran fatales en el spike:
- no encontrar la referencia del equipo
- no poder resolver o descargar la página base de competición
- cualquier error que impida construir el flujo mínimo de competición, calendario, jornadas y partidos

Resultado:
- `sync_run.status = failed`
- código de salida `1` en el job CLI

## Errores parciales
Se consideran degradables en el spike:
- fallo al guardar una raw capture
- fallo al descargar o extraer clasificación
- fallo al persistir una entidad concreta si el resto puede seguir
- fallo al actualizar la referencia fuente si el resto ya quedó persistido

Resultado:
- el proceso continúa cuando tiene sentido
- la incidencia se registra por etapa
- `sync_run.status = completed_with_warnings`

## Registro de incidencias
Cada incidencia guarda:
- `stage`
- `severity`
- `message`
- `timestamp`

Estas incidencias quedan reflejadas en:
- el resultado del servicio
- los logs del job
- el `sync_run`

## Comportamiento operativo
- el job siempre intenta cerrar `sync_run`
- si solo hay warnings, el job sigue devolviendo `0`
- si ocurre un error fatal, el job devuelve `1`

## Alcance actual
La estrategia es intencionalmente simple y suficiente para el spike.
No introduce un framework de errores ni reintentos avanzados por etapa.
