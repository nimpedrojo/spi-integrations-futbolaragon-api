# Functional Navigation Map - Futbol Aragón

> Estado: borrador de descubrimiento (FAF-004).  
> Alcance: documentación del recorrido funcional real para **un único equipo de un único club** en modo público y autenticado.  
> Nota: este documento **no implementa scraping** y marca como pendiente cualquier dato no confirmado.

## Equipo objetivo
- Club: Stadium Venecia
- Equipo: 2 Alevin A
- Temporada: 2025-2026
- Categoría/Grupo: 2 Alevin / Copa

## Cómo rellenar el campo `Resultado`
- Documenta **qué pantalla o estado concreto** obtienes tras la acción (no solo "ok" o "carga").
- Incluye, cuando aplique, estos elementos observables:
  - Nombre visible de la vista/módulo (ej.: "Detalle de competición", "Listado de jornadas", "Clasificación").
  - Evidencia de contexto (equipo, competición, temporada, grupo) tal como aparece en UI.
  - Tipo de dato disponible en esa pantalla (tabla, tarjetas, filtros, selector de jornada, etc.).
  - Comportamiento de navegación (si redirige, abre modal, cambia query params, requiere login, muestra error).
- Si el paso no se puede completar, anota el bloqueo real (permiso, 404, sesión expirada, dato no visible, etc.).
- Formato sugerido: `Vista alcanzada + evidencia + cambio de estado`.
  - Ejemplo (plantilla): `Se abre [Nombre vista], mostrando [evidencia], y la URL queda en [ruta/query].`

## Flujo público

### Paso 1
- URL: https://www.futbolaragon.com/pnfg/
- Acción: Abrir el portal público de Futbol Aragón y localizar el acceso inicial hacia competiciones/equipos.
- Resultado: Abre pantalla inicial. Aparece un selector para escoger la competicion. En ocasiones abre vignette con publicidad
- IDs observados: 'competicion','grupo'
- Parámetros detectados: ninguno
- Notas: No asumir rutas internas hasta confirmar navegación real.

### Paso 2
- URL: futbolaragon.com/pnfg/NPcd/NFG_CmpJornada?cod_primaria=1000120&CodCompeticion=23108488&CodGrupo=23108496&CodTemporada=21&CodJornada=8&Sch_Codigo_Delegacion=1
- Acción: Navegar hacia la competición asociada al equipo objetivo.
- Resultado: Carga la pagina con calendario,clasificaciones y resultados en formato tabla. Abre en ocasiones modal tipo vignette
- IDs observados: 'divResultados'
- Parámetros detectados: cod_primaria=1000120
                         CodCompeticion=23108488
                         CodGrupo=23108496
                         CodTemporada=21
                         CodJornada=8
                         Sch_Codigo_Delegacion=1
- Notas: Confirmar si la competición se filtra por temporada/categoría/grupo.

### Paso 3
- URL: futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis?cod_primaria=1000120&codtemporada=21&codcompeticion=23108488&codgrupo=23108496&CodJornada=8
- Acción: Acceder al calendario o listado de jornadas de la competición/equipo.
- Resultado: Abre modal con vignette, una vez cerrado muesta todo el calendario en formato tabla
- IDs observados: 
- Parámetros detectados: cod_primaria=1000120
                         codtemporada=21
                         codcompeticion=23108488
                         codgrupo=23108496
                         CodJornada=8
- Notas: Validar si jornadas y partidos están en la misma vista o en vistas separadas.

### Paso 4
- URL: https://www.futbolaragon.com/pnfg/NPcd/NFG_CmpPartido?cod_primaria=1000120&CodActa=922342&cod_acta=922342
- Acción: Abrir detalle de jornada y/o partido.
- Resultado: Abre el "acta del partido" con el resultado, las alineaciones , los goles en tres columnas
- IDs observados: 
- Parámetros detectados: cod_primaria=1000120
                         CodActa=922342
                         cod_acta=922342
- Notas: Registrar identificadores estables para reutilización en automatización.

### Paso 5
- URL: futbolaragon.com/pnfg/NPcd/NFG_VisClasificacion?cod_primaria=1000120&codjornada=7&codcompeticion=23108488&codgrupo=23108496&codjornada=7
- Acción: Acceder a clasificación vinculada a la misma competición.
- Resultado: Accede a "calsificacion" en formato tabla. Abre modal vignette que hay que cerrar
- IDs observados: CL_Resumen
- Parámetros detectados: cod_primaria=1000120
                         codjornada=7
                         codcompeticion=23108488
                         codgrupo=23108496
                         codjornada=7
- Notas: Verificar consistencia de IDs de competición/grupo entre calendario y clasificación.


## Riesgos observados
- Dependencia de rutas no verificadas si no se registra navegación real.
- Posibles cambios de IDs o parámetros entre temporadas/categorías.
- Diferencias entre portal público y autenticado que afecten reutilización de selectores/IDs.
- Requisitos de autenticación (sesión, expiración, redirecciones) que compliquen automatización.

## Checklist de completitud FAF-004
- [x] Equipo objetivo definido (club, equipo, temporada, categoría/grupo).
- [x] Flujo público con pasos reales, URLs y evidencias.
- [x] Parámetros e IDs observados documentados por paso.
- [x] Punto de arranque recomendado justificado con datos observados.
