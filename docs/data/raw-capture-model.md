# Raw Capture Model - Futbol Aragón

## Objetivo
Definir la evidencia raw que se almacenará inmediatamente después de la ingesta HTTP, antes de cualquier extracción o normalización.

## Alcance
Este modelo aplica a capturas del portal público de Futbol Aragón durante el spike. El objetivo es preservar trazabilidad, permitir replay de parsers y facilitar diagnóstico de cambios en la fuente.

## Campos mínimos del modelo

| Campo | Descripción |
|---|---|
| `sourceSystem` | Sistema origen de la captura. En este spike: `futbol-aragon`. |
| `entityType` | Tipo de evidencia capturada, por ejemplo `competition-page`, `round-page` o `standings-page`. |
| `sourceUrl` | URL o path solicitado por el cliente antes de redirects. |
| `resolvedUrl` | URL final resuelta tras redirects. |
| `accessMode` | Modo de acceso usado en la captura. En este spike: `public`. |
| `httpStatus` | Código HTTP observado en la respuesta final. |
| `contentType` | `Content-Type` devuelto por la fuente si existe. |
| `contentHash` | Hash SHA-256 del payload para detectar duplicados o cambios. |
| `payload` | Contenedor del contenido raw y su metadata básica. |
| `capturedAt` | Timestamp ISO de la captura. |
| `parseStatus` | Estado del procesamiento posterior. Inicialmente `pending`. |
| `errorMessage` | Error opcional asociado a la captura o a su parseo. |

## Estrategia de almacenamiento del payload
- Durante el spike se mantiene `payload.body` en memoria para simplificar replay y pruebas locales.
- Si se indica `outputDirectory`, el repositorio también persiste el payload a fichero y guarda `payload.filePath`.
- Esta estrategia es deliberadamente híbrida: útil para iterar rápido ahora y fácilmente reemplazable por persistencia real en base de datos u object storage después.

## Diseño actual
- El repositorio de capturas raw vive en [`src/modules/futbolAragon/repositories/raw-capture.repository.ts`](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/src/modules/futbolAragon/repositories/raw-capture.repository.ts).
- Los tipos base del modelo viven en [`src/modules/futbolAragon/types/source.types.ts`](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/src/modules/futbolAragon/types/source.types.ts).

## Decisiones prácticas
- El payload se guarda en `utf8`, que es suficiente para el spike aunque la fuente tenga peculiaridades de codificación.
- `parseStatus` arranca en `pending` para desacoplar captura y extracción.
- `contentHash` se calcula siempre sobre el body raw para tener una referencia estable de evidencia.
- `sourceUrl` y `resolvedUrl` se guardan por separado para conservar contexto de navegación y redirects.

## Siguiente paso
Implementar la persistencia real de `RawCaptureEvidence` en el backend elegido, manteniendo la misma forma de contrato para no acoplar los extractores a la tecnología de almacenamiento.
