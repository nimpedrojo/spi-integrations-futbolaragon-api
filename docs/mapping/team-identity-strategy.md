# Team Identity Strategy - Futbol Aragón

## Contexto
La entidad raíz del spike es `equipo`. Todo el flujo de navegación, extracción y persistencia gira alrededor de un único equipo objetivo de un único club dentro de Futbol Aragón.

En esta fase ya existe:
- extracción en modelo fuente
- persistencia raw
- persistencia normalizada mínima

Falta definir cómo relacionar de forma estable el equipo interno del sistema con su representación en Futbol Aragón.

## Problema
El nombre visible del equipo no es una clave fiable por sí sola.

Riesgos observables:
- variaciones de escritura
- sufijos como `"A"` o `"B"`
- cambios de nombre comercial
- problemas de codificación del HTML
- homónimos entre clubes o categorías distintas

Si dependemos solo del nombre visible, el spike queda expuesto a errores de identificación y a mappings ambiguos.

## Decisión
Usar una estrategia de identidad explícita y persistida para el equipo objetivo.

La correspondencia del equipo debe guardarse como un mapping estable entre:
- identificador interno del sistema
- referencia conocida en Futbol Aragón

Durante el spike no se implementará matching automático complejo. La correspondencia se considera una decisión controlada y persistida, no una inferencia dinámica basada únicamente en texto visible.

## Prioridad de identificación
Orden de preferencia para identificar el equipo en Futbol Aragón:

1. `sourceTeamId` si está observado y validado de forma explícita.
2. `sourceUrl` canónica del equipo o de su vista relevante.
3. `sourceTeamSlug` o referencia técnica estable usada en el spike.
4. combinación de `sourceTeamName` + `sourceClubName`.
5. nombre visible solo como apoyo manual, nunca como clave única.

## Datos mínimos del mapping
Campos mínimos propuestos:

| Campo | Uso |
|---|---|
| `sourceSystem` | Identifica el origen. En este spike: `futbol-aragon`. |
| `internalTeamId` | Identificador interno del equipo en el sistema. |
| `internalTeamName` | Nombre interno legible para validación operativa. |
| `sourceTeamId` | Identificador técnico de Futbol Aragón si se conoce. |
| `sourceTeamName` | Nombre visible en origen, útil para contraste manual. |
| `sourceClubName` | Contexto adicional para evitar ambigüedad. |
| `sourceUrl` | URL canónica o suficientemente estable del equipo en origen. |
| `sourceTeamSlug` | Referencia técnica simple usada por el spike mientras no exista mejor identificador. |

## Riesgos
- `sourceTeamId` puede no estar disponible al inicio del spike.
- `sourceUrl` puede cambiar de forma si el portal modifica rutas o parámetros.
- el `slug` del spike es útil como referencia operativa, pero no debe considerarse prueba fuerte por sí solo.
- el nombre visible seguirá siendo necesario para validación humana, aunque no debe actuar como clave única.

## Conclusión
La identidad del equipo en el spike debe resolverse mediante un mapping explícito y persistido, no por matching textual implícito.

La estrategia recomendada es:
- usar `internalTeamId` como ancla interna
- asociar la mejor referencia técnica disponible en Futbol Aragón
- conservar nombre y club solo como apoyo de validación

Con esto el spike queda preparado para implementar correspondencias estables en la siguiente tarea sin depender solo del nombre visible.
