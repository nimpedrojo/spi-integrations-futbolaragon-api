# Nightly Job - Futbol Aragón Spike

## Objetivo
Dejar preparada una ejecución nocturna repetible del job de sincronización del equipo objetivo, sin interacción manual y con trazabilidad operativa básica.

## Comando
Después de compilar:

```bash
npm run sync:team:nightly
```

También admite parámetros opcionales:

```bash
node dist/modules/futbolAragon/jobs/sync-team.job.js \
  --club-id club-spike \
  --team-id team-spike \
  --source-team-slug stadium-venecia-a
```

## Variables de entorno soportadas
Si no se pasan argumentos, el job puede tomar valores de estas variables:

- `FAF_SYNC_CLUB_ID`
- `FAF_SYNC_TEAM_ID`
- `FAF_SYNC_SOURCE_TEAM_SLUG`

Si no están definidas, el spike usa los valores por defecto ya documentados.

## Comportamiento operativo
- ejecución no interactiva
- código de salida `0` si la sync termina bien
- código de salida `1` si ocurre un fallo fatal
- logs de inicio, progreso y fin
- resumen final con recuento de entidades sincronizadas

## Trazabilidad generada
Cada ejecución deja rastro en:

- `.data/futbol-aragon/raw`
- `.data/futbol-aragon/normalized`
- `sync-runs.json`

## Ejemplo futuro con cron
Ejemplo ilustrativo, no configurado en este spike:

```cron
0 3 * * * cd /ruta/al/proyecto && npm run sync:team:nightly >> logs/faf-sync.log 2>&1
```

## Ejemplo futuro con PM2
Ejemplo ilustrativo, no configurado en este spike:

```bash
pm2 start npm --name futbolaragon-sync -- run sync:team:nightly
```

## Consideraciones
- la referencia del equipo en `source references` debe existir antes de la ejecución nocturna
- el job usa el flujo público de Futbol Aragón
- la autenticación queda fuera del alcance de este spike
