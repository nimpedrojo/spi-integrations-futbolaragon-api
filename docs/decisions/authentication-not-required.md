# Authentication Not Required for Spike FAF-009

## Contexto

Durante el discovery del spike `spi-integrations-futbolaragon-api` se analizaron tanto el portal público como el portal autenticado de Futbol Aragón.

El alcance funcional del spike se limita a obtener, para un único `equipo` de un único club:

- competiciones
- calendarios
- jornadas
- partidos
- clasificaciones

La arquitectura del servicio ya contemplaba dos posibles modos de acceso, pero el análisis funcional y técnico posterior obligaba a decidir cuál debía formar parte real de esta fase.

## Hallazgo

El portal público cubre el alcance funcional necesario para el spike.

Además, durante el discovery se concluyó que el portal autenticado no aporta acceso útil adicional para obtener las entidades incluidas en el alcance actual.

Por tanto, para este spike no existe una necesidad funcional que justifique implementar:

- login automatizado
- persistencia de sesión autenticada
- validación o renovación de sesión

## Decisión

En el spike FAF-009 no se implementará autenticación automatizada contra Futbol Aragón.

Tampoco se implementará validación de sesión autenticada ni lógica de renovación de credenciales.

La integración del spike se apoyará únicamente en el portal público.

## Justificación

- el portal público ya permite acceder a competiciones, calendario, jornadas, partidos y clasificación
- el portal autenticado fue revisado y no aporta cobertura funcional adicional útil para este alcance
- implementar login y sesión aumentaría la complejidad técnica sin mejorar el resultado del spike
- eliminar autenticación del camino principal reduce riesgos operativos y acelera la validación del enfoque de extracción
- mantener esta decisión explícita evita que la autenticación quede interpretada como una tarea “pendiente de implementar” dentro del spike

## Implicaciones técnicas

- el cliente principal del spike es exclusivamente el cliente público
- no se desarrollan flujos de login, almacenamiento de credenciales ni refresh de sesión
- no se añaden validaciones de estado autenticado ni manejo de expiración de sesión
- los componentes `auth-client.ts` y `session-manager.ts` se conservan solo como placeholders arquitectónicos, no como piezas activas del spike
- las próximas tareas deben asumir que los extractores y capturas raw parten únicamente del portal público

## Condiciones futuras para revisitar esta decisión

Esta decisión solo debería revisitarse si aparece evidencia nueva y concreta de alguno de estos supuestos:

- el portal público deja de exponer alguna de las entidades necesarias para el alcance real
- el portal autenticado ofrece datos imprescindibles que no estén disponibles públicamente
- una futura fase del proyecto amplía el alcance más allá del spike actual
- aparecen restricciones técnicas en el portal público que hagan inviable la extracción estable

Hasta que se cumpla alguna de esas condiciones, la autenticación debe considerarse explícitamente fuera de alcance para este spike.
