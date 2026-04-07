# Functional Navigation Map - Futbol Aragón

> Estado: borrador de descubrimiento (FAF-004).  
> Alcance: documentación del recorrido funcional real para **un único equipo de un único club** en modo público y autenticado.  
> Nota: este documento **no implementa scraping** y marca como pendiente cualquier dato no confirmado.

## Equipo objetivo
- Club: `[PENDIENTE: completar manualmente]`
- Equipo: `[PENDIENTE: completar manualmente]`
- Temporada: `[PENDIENTE: completar manualmente]`
- Categoría/Grupo: `[PENDIENTE: completar manualmente]`

## Flujo público

### Paso 1
- URL: `[PENDIENTE VALIDACIÓN]`
- Acción: Abrir el portal público de Futbol Aragón y localizar el acceso inicial hacia competiciones/equipos.
- Resultado: `[PENDIENTE VALIDACIÓN]`
- IDs observados: `[PENDIENTE VALIDACIÓN]`
- Parámetros detectados: `[PENDIENTE VALIDACIÓN]`
- Notas: No asumir rutas internas hasta confirmar navegación real.

### Paso 2
- URL: `[PENDIENTE VALIDACIÓN]`
- Acción: Navegar hacia la competición asociada al equipo objetivo.
- Resultado: `[PENDIENTE VALIDACIÓN]`
- IDs observados: `[PENDIENTE VALIDACIÓN]`
- Parámetros detectados: `[PENDIENTE VALIDACIÓN]`
- Notas: Confirmar si la competición se filtra por temporada/categoría/grupo.

### Paso 3
- URL: `[PENDIENTE VALIDACIÓN]`
- Acción: Acceder al calendario o listado de jornadas de la competición/equipo.
- Resultado: `[PENDIENTE VALIDACIÓN]`
- IDs observados: `[PENDIENTE VALIDACIÓN]`
- Parámetros detectados: `[PENDIENTE VALIDACIÓN]`
- Notas: Validar si jornadas y partidos están en la misma vista o en vistas separadas.

### Paso 4
- URL: `[PENDIENTE VALIDACIÓN]`
- Acción: Abrir detalle de jornada y/o partido.
- Resultado: `[PENDIENTE VALIDACIÓN]`
- IDs observados: `[PENDIENTE VALIDACIÓN]`
- Parámetros detectados: `[PENDIENTE VALIDACIÓN]`
- Notas: Registrar identificadores estables para reutilización en automatización.

### Paso 5
- URL: `[PENDIENTE VALIDACIÓN]`
- Acción: Acceder a clasificación vinculada a la misma competición.
- Resultado: `[PENDIENTE VALIDACIÓN]`
- IDs observados: `[PENDIENTE VALIDACIÓN]`
- Parámetros detectados: `[PENDIENTE VALIDACIÓN]`
- Notas: Verificar consistencia de IDs de competición/grupo entre calendario y clasificación.

## Flujo autenticado

### Paso 1
- URL: `[PENDIENTE VALIDACIÓN]`
- Acción: Abrir portal autenticado y completar inicio de sesión.
- Resultado: `[PENDIENTE VALIDACIÓN]`
- IDs observados: `[PENDIENTE VALIDACIÓN]`
- Parámetros detectados: `[PENDIENTE VALIDACIÓN]`
- Notas: Confirmar requisitos de sesión (cookies, tokens, posibles redirecciones).

### Paso 2
- URL: `[PENDIENTE VALIDACIÓN]`
- Acción: Localizar el equipo objetivo desde menús/listados internos.
- Resultado: `[PENDIENTE VALIDACIÓN]`
- IDs observados: `[PENDIENTE VALIDACIÓN]`
- Parámetros detectados: `[PENDIENTE VALIDACIÓN]`
- Notas: Identificar si existen IDs distintos a los del portal público.

### Paso 3
- URL: `[PENDIENTE VALIDACIÓN]`
- Acción: Navegar a competiciones y calendario del equipo objetivo.
- Resultado: `[PENDIENTE VALIDACIÓN]`
- IDs observados: `[PENDIENTE VALIDACIÓN]`
- Parámetros detectados: `[PENDIENTE VALIDACIÓN]`
- Notas: Validar si la temporada/categoría se resuelve por contexto de usuario.

### Paso 4
- URL: `[PENDIENTE VALIDACIÓN]`
- Acción: Acceder a jornadas y partidos.
- Resultado: `[PENDIENTE VALIDACIÓN]`
- IDs observados: `[PENDIENTE VALIDACIÓN]`
- Parámetros detectados: `[PENDIENTE VALIDACIÓN]`
- Notas: Registrar endpoints o rutas visibles en navegación real (sin inferencias).

### Paso 5
- URL: `[PENDIENTE VALIDACIÓN]`
- Acción: Acceder a clasificación de la competición objetivo.
- Resultado: `[PENDIENTE VALIDACIÓN]`
- IDs observados: `[PENDIENTE VALIDACIÓN]`
- Parámetros detectados: `[PENDIENTE VALIDACIÓN]`
- Notas: Comprobar si la clasificación añade datos extra frente al modo público.

## Comparativa inicial
- Qué entidades aparecen en ambos modos: `[PENDIENTE VALIDACIÓN]`
- Qué entidades cambian: `[PENDIENTE VALIDACIÓN]`
- Qué flujo parece más automatizable: `[PENDIENTE VALIDACIÓN]`
- Qué flujo parece más completo: `[PENDIENTE VALIDACIÓN]`

## Punto de arranque recomendado
- Público: `[PENDIENTE VALIDACIÓN]`
- Autenticado: `[PENDIENTE VALIDACIÓN]`
- Justificación: `[PENDIENTE VALIDACIÓN: completar tras contrastar estabilidad de URLs, IDs y requisitos de sesión]`

## Riesgos observados
- Dependencia de rutas no verificadas si no se registra navegación real.
- Posibles cambios de IDs o parámetros entre temporadas/categorías.
- Diferencias entre portal público y autenticado que afecten reutilización de selectores/IDs.
- Requisitos de autenticación (sesión, expiración, redirecciones) que compliquen automatización.

## Checklist de completitud FAF-004
- [ ] Equipo objetivo definido (club, equipo, temporada, categoría/grupo).
- [ ] Flujo público con pasos reales, URLs y evidencias.
- [ ] Flujo autenticado con pasos reales, URLs y evidencias.
- [ ] Parámetros e IDs observados documentados por paso.
- [ ] Comparativa inicial completada con hallazgos confirmados.
- [ ] Punto de arranque recomendado justificado con datos observados.
