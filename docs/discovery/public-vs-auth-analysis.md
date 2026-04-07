# Public vs Auth Analysis - Futbol Aragón

## Contexto

Este documento compara los dos modos de acceso considerados durante el spike `spi-integrations-futbolaragon-api`:

- portal público
- portal autenticado

La comparación se hace para el alcance funcional ya definido del spike:

- competiciones
- calendario
- jornadas
- partidos
- clasificación

El objetivo no es evaluar todo el portal de Futbol Aragón, sino determinar qué canal aporta los datos necesarios para sincronizar un único `equipo` de un único club con la menor complejidad posible.

La evidencia validada en el repo está concentrada en el flujo público, documentado en [`docs/discovery/functional-navigation-map.md`](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/docs/discovery/functional-navigation-map.md). Del portal autenticado solo consta, a nivel de spike, una revisión parcial y la observación funcional de que no aporta datos útiles adicionales para cubrir el alcance definido. Cuando algo no esté validado con el mismo nivel de detalle, se marca como tal.

## Comparativa

| Aspecto | Portal público | Portal autenticado |
|---|---|---|
| Acceso a competiciones | Validado en el flujo observado. Se llega a la competición del equipo objetivo. | No validado con el mismo detalle. No se ha identificado valor adicional útil para el spike. |
| Calendario | Validado. Existe vista de calendario accesible en modo público. | No validado con el mismo detalle. No aporta ventaja funcional observada. |
| Jornadas | Validado parcialmente a través de `CodJornada` y de la vista de calendario. | No validado. Sin evidencia en el repo de mejor cobertura que el portal público. |
| Partidos | Validado. Se accede al acta/detalle de partido mediante `CodActa`/`cod_acta`. | No validado. No se ha observado que facilite mejor acceso a los partidos relevantes. |
| Clasificación | Validado. Existe vista pública de clasificación con parámetros observables. | No validado. No se ha observado aporte funcional adicional para este alcance. |
| Complejidad técnica | Media. Requiere navegación y manejo de modales tipo vignette, pero sin login. | Más alta de forma percibida. Añade autenticación y gestión de sesión sin beneficio funcional claro para el spike. |
| Necesidad de sesión | No | Sí |
| Estabilidad percibida | Pendiente de validar en más capturas, pero suficiente para continuar el spike. | Pendiente y menos favorable para el spike por dependencia de sesión y menor evidencia útil. |
| Viabilidad de automatización | Sí, con cautela. El flujo público ya ofrece rutas, parámetros e identificadores observados. | Baja para este spike. La complejidad extra no se justifica con la evidencia disponible. |

## Observaciones

### Portal público

- Existe recorrido documentado con URLs, parámetros e IDs observados para competición, calendario, partido y clasificación.
- El portal público ya cubre el alcance funcional necesario para el spike.
- Se han detectado algunos inconvenientes operativos, como modales tipo vignette y variaciones en el casing de parámetros, pero no bloquean el descubrimiento funcional.
- Ya hay una base reutilizable para estrategia de navegación e identificación de parámetros en [`docs/discovery/identifiers-map.md`](/Users/nimpedrojo/Documents/01.%20Desarrollo/spi-integrations-futbolaragon-api/docs/discovery/identifiers-map.md).

### Portal autenticado

- Su análisis ha sido parcial y no está documentado en el repo con el mismo nivel de detalle que el flujo público.
- La observación funcional recogida para el spike es que no permite obtener datos útiles adicionales para cubrir el alcance previsto.
- Introduce dependencia de login, sesión y potencial expiración, lo que incrementa la complejidad técnica y operativa.
- Dado que no mejora la cobertura funcional del spike, su coste técnico no queda justificado en esta fase.

## Conclusión

Para el spike actual, el portal público cubre el alcance funcional necesario:

- competiciones
- calendario
- jornadas
- partidos
- clasificación

En consecuencia, el portal autenticado se descarta para este spike.

Esta decisión no afirma que el portal autenticado carezca de utilidad en cualquier escenario futuro. Lo que sí deja establecido es que, con la evidencia disponible y para el alcance actual, no aporta valor suficiente para compensar la complejidad adicional que introduce.

## Implicaciones técnicas

- simplificación del cliente de integración al centrarse en navegación pública
- eliminación del login y de la gestión de sesión del camino principal de sincronización
- menor complejidad operativa en ejecución nocturna, despliegue y diagnóstico
- reducción de riesgos asociados a expiración de sesión, redirecciones y cambios de acceso autenticado
- enfoque de las próximas tareas en robustecer el cliente público, la estrategia de navegación y la validación de estabilidad de IDs

Esta decisión afecta a tareas futuras: cualquier diseño o implementación posterior debe asumir que el camino principal del spike usa únicamente el portal público, salvo que aparezca nueva evidencia que obligue a reabrir la evaluación.
