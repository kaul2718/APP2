# Plan de Refactorización — Inventario, Partes, Repuestos y Presupuestos

## 1) Objetivo

Simplificar el dominio de inventario para que responda a la operación real del taller:

- registrar piezas/repuestos de forma simple,
- controlar stock,
- usar esos ítems en órdenes de trabajo,
- generar presupuestos estimados sin duplicar entidades innecesarias.

## Estado de ejecución actual (10/04/2026)

### ✅ Primera ola ya aplicada

- el backend de `detalles-repuestos` ya acepta trabajar con `parteId` o `repuestoId`,
- se añadieron endpoints consistentes por presupuesto y por orden (`by-presupuesto`, `by-orden` y totales),
- el frontend del presupuesto ya muestra y selecciona **Ítem / Parte** como concepto principal,
- los formularios y modales de detalle del presupuesto ya cargan el catálogo desde `Partes` como fuente maestra, reduciendo la dependencia operativa de `Repuesto`,
- la migración manual `Backend/sql/migracion_catalogo_maestro_partes.sql` ya fue ejecutada en la base de desarrollo, dejando `codigoInterno` y `precioReferencia` creados y backfilleados en `parte`,
- `DetalleRepuestos` ya resuelve selección y precios priorizando `Parte` como catálogo maestro, manteniendo `repuestoId` solo por compatibilidad temporal,
- la migración `Backend/sql/migracion_detalle_repuestos_parte_maestra.sql` ya fue ejecutada y dejó `parteId` backfilleado en `detalle_repuestos` (22/22 registros de desarrollo con parte asociada),
- `PresupuestoService` y los hooks del frontend ya fueron limpiados para quitar dependencias legacy innecesarias y consumir la información del catálogo maestro de forma más directa,
- el backend ya prioriza `parteId` directo para descuento/reversión de inventario, reduciendo aún más la dependencia operativa de `repuestoId`,
- las rutas legacy `/ver-repuesto` y `/ingresar-repuesto` ya redirigen al catálogo maestro (`/ver-parte` y `/ingresar-parte`),
- `EspecificacionParte` y `TipoEspecificacion` ya fueron retirados del arranque principal del backend y sus rutas frontend quedaron redirigidas al catálogo maestro,
- la navegación y las pantallas de detalle del presupuesto ya muestran **Ítems** como concepto visible principal, reduciendo aún más la presencia de `Repuesto` en la operación diaria,
- se ocultaron del menú principal los módulos legacy de `Repuestos`, `Tipo Especificación` y `Especificación Parte` para simplificar el flujo operativo,
- la migración `Backend/sql/migracion_eliminar_especificaciones_legacy.sql` ya fue ejecutada en la base de desarrollo, dejando `public.especificacion_parte` y `public.tipo_especificacion` eliminadas (`to_regclass = null` en ambas verificaciones),
- la migración `Backend/sql/migracion_eliminar_repuesto_legacy.sql` ya fue ejecutada correctamente: `public.repuesto` quedó eliminada y `detalle_repuestos` ya no conserva la columna `repuestoId`, operando solo con `parteId`.

### 🔜 Siguiente ola recomendada

- migrar el catálogo para que `Parte` absorba completamente a `Repuesto`,
- mover precio/código al catálogo maestro,
- dejar `Repuesto` como compatibilidad temporal o eliminarlo por completo.

---

## 2) Diagnóstico actual del sistema

### Estructura actual verificada

Hoy el flujo está distribuido así:

- `Categoria` → clasifica partes
- `Parte` → catálogo base (`nombre`, `modelo`, `descripcion`, `categoriaId`, `marcaId`)
- `Repuesto` → vuelve a guardar `nombre`, `descripcion`, `precioVenta` y además apunta a `parteId`
- `Inventario` → guarda stock y ubicación, pero cuelga de `parteId`
- `EspecificacionParte` → atributos por parte
- `TipoEspecificacion` → catálogo para clasificar especificaciones
- `DetalleRepuestos` → líneas del presupuesto, pero apunta a `repuestoId`
- `Presupuesto` → cuelga de `ordenId`

### Problemas principales detectados

#### A. `Parte` y `Repuesto` están solapados

La tabla `Repuesto` duplica información que ya vive en `Parte`:

- `nombre`
- `descripcion`
- relación con lo que realmente se instala

Además:

- `Inventario` usa `parteId`
- `DetalleRepuestos` usa `repuestoId`

Eso obliga a enlazar stock y presupuesto por un puente indirecto (`repuesto.parteId`), lo cual complica la lógica y abre la puerta a inconsistencias.

#### B. `EspecificacionParte` y `TipoEspecificacion` están sobre-modelados para un inventario simple

Para un taller que solo necesita manejar ítems como:

- Memoria RAM
- SSD
- Disco duro
- Pantalla
- Batería

estas dos entidades son opcionales, no centrales.

Sirven si más adelante quieren:

- comparar fichas técnicas complejas,
- filtrar por atributos avanzados,
- construir catálogos técnicos ricos.

Pero para el MVP operativo del taller, hoy agregan complejidad de mantenimiento y de UI.

#### C. El stock y el uso real del repuesto no están modelados de forma suficientemente clara

Actualmente:

- al crear un `DetalleRepuestos` se valida stock,
- pero el descuento real ocurre al cambiar el estado del `Presupuesto` a `aprobado`.

Eso significa que el sistema mezcla dos conceptos distintos:

1. **presupuestar** lo que se estima usar,
2. **consumir** lo que realmente se instala.

Para un flujo robusto, eso debe quedar explícito.

#### D. No hay migraciones reales en el repo

Se verificó que:

- `synchronize` está en `false`,
- no existe carpeta de migraciones,
- no hay scripts de `migration:run`, `migration:generate`, etc.

Conclusión: antes de refactorizar la estructura, primero hay que formalizar la evolución de esquema con migraciones reales.

---

## 3) Qué debería quedarse y qué debería simplificarse

## Mantener

### `Categoria`
Sí conviene mantenerla.

Ejemplos útiles:

- RAM
- Almacenamiento
- Pantallas
- Baterías
- Cargadores
- Tarjetas madre

### `Inventario`
Mantener **solo si** quieren controlar:

- stock actual,
- stock mínimo,
- ubicación física.

Si el inventario será realmente simple y solo habrá un stock global por ítem, se puede incluso fusionar dentro de `Parte`.

### `Presupuesto` + detalle de ítems
Sí debe mantenerse, porque es clave para:

- estimar costo,
- registrar lo que se va a usar,
- enlazarlo con la orden.

---

## Simplificar o absorber

### `Repuesto`
**Recomendación principal:** absorber `Repuesto` dentro de `Parte`.

La entidad canónica debería ser una sola: el ítem inventariable que se cotiza y se consume.

Es decir, `Parte` debería pasar a representar directamente el repuesto/ítem de inventario.

### `EspecificacionParte` y `TipoEspecificacion`
**Recomendación:** sacarlas del flujo principal y tratarlas como módulo opcional.

Opciones:

1. **Opción simple (recomendada ahora):** eliminarlas del flujo diario y reemplazarlas por un campo libre como `detalleTecnico` o `observacionesTecnicas`.
2. **Opción intermedia:** conservarlas en BD pero ocultarlas del sidebar y de la operación diaria.
3. **Opción avanzada:** mantenerlas solo si el negocio confirma que realmente las usa para catálogo técnico.

---

## 4) Modelo objetivo recomendado

## Opción recomendada para este proyecto

### Entidades núcleo

#### `Categoria`
- `id`
- `nombre`
- `descripcion`
- `estado`

#### `Parte`  ← entidad principal del inventario
- `id`
- `codigoInterno`
- `nombre`
- `modelo`
- `descripcion`
- `marcaId`
- `categoriaId`
- `precioReferencia`
- `detalleTecnico` o `observacionesTecnicas` (texto libre)
- `estado`

#### `Inventario`
- `id`
- `parteId`
- `cantidad`
- `stockMinimo`
- `ubicacion`
- `estado`

#### `Presupuesto`
- `id`
- `ordenId`
- `estadoId`
- `descripcion`
- `fechaEmision`

#### `DetallePresupuestoItem` (actual `DetalleRepuestos`)
- `id`
- `presupuestoId`
- `parteId`
- `cantidad`
- `precioUnitarioSnapshot`
- `subtotal`
- `comentario`
- `estadoUso` (opcional: `cotizado`, `aprobado`, `instalado`, `devuelto`)

---

## 5) Decisiones de diseño recomendadas

### Decisión 1 — ¿Se elimina `Repuesto`?

**Sí, recomendado.**

Porque hoy:

- duplica datos de `Parte`,
- complica el enlace con `Inventario`,
- obliga a trabajar con dos catálogos para representar casi lo mismo.

### Decisión 2 — ¿Se elimina `TipoEspecificacion`?

**Sí para el flujo principal**, salvo que el negocio pida explícitamente catálogo técnico avanzado.

### Decisión 3 — ¿Cuándo se descuenta inventario?

Definir una única regla de negocio. Recomendación:

- **Presupuesto** = estimación (no descuenta stock todavía),
- **Uso/instalación real en OT** = descuenta stock.

Si desean reservar stock desde la aprobación del presupuesto, entonces debe existir una lógica explícita de:

- `reservado`
- `consumido`
- `revertido`

pero no mezclarlo de forma implícita.

---

## 6) Inconsistencias actuales que deben corregirse

1. `Inventario` trabaja con `parteId`, pero `DetalleRepuestos` trabaja con `repuestoId`.
2. `DetalleRepuestosService` valida stock al crear, pero no descuenta en ese momento.
3. El descuento depende del cambio de estado del presupuesto, no del uso real del repuesto.
4. El frontend tiene CRUD separados para `Parte`, `Repuesto`, `Inventario`, `EspecificacionParte` y `TipoEspecificacion`, lo que obliga a un flujo demasiado largo para registrar algo simple.
5. El hook `useDetalleRepuesto` tiene lógica por orden (`by-orden`) que no está expuesta de forma coherente en el backend actual.
6. No hay migraciones reales para respaldar el refactor de BD.

---

## 7) Plan de refactorización por fases

## Fase 0 — Congelar y documentar el estado actual

### Objetivo
Asegurar que el refactor no rompa datos existentes.

### Tareas
- inventariar tablas actuales en PostgreSQL,
- exportar respaldo de datos,
- crear primera migración base desde el esquema actual,
- documentar relaciones actuales y dependencias en frontend.

### Entregable
- `migration_001_baseline`
- respaldo SQL/CSV
- mapa actual del dominio

---

## Fase 1 — Definir la entidad canónica del catálogo

### Objetivo
Eliminar la ambigüedad entre `Parte` y `Repuesto`.

### Tareas
- decidir que `Parte` será el ítem canónico,
- agregar a `Parte` los campos que hoy solo tiene `Repuesto`:
  - `codigoInterno`
  - `precioReferencia` o `precioVenta`
- preparar compatibilidad temporal con datos existentes.

### Resultado esperado
Desde ese momento, una RAM, un SSD o una batería se registran solo una vez en el catálogo.

---

## Fase 2 — Migración de datos y compatibilidad

### Objetivo
Mover información desde `Repuesto` hacia `Parte` sin perder historial.

### Tareas
- migrar `codigo` y `precioVenta` de `repuestos` hacia `partes`,
- agregar `parteId` directo en `detalle_repuestos`,
- rellenarlo usando la relación actual `repuesto.parteId`,
- dejar `repuestoId` como legado temporal mientras se migra frontend/backend.

### Resultado esperado
El detalle del presupuesto ya podrá trabajar directamente con `parteId`.

---

## Fase 3 — Simplificar backend

### Objetivo
Alinear lógica de negocio con el nuevo modelo.

### Tareas
- refactorizar `DetalleRepuestosService` para usar `parteId` directo,
- renombrar conceptualmente `DetalleRepuestos` a algo más claro como `DetallePresupuestoItem`,
- hacer que el precio unitario sea un **snapshot histórico** del momento de cotización,
- definir una única política de inventario:
  - o reservar al aprobar,
  - o descontar al instalar.

### Resultado esperado
La lógica de stock deja de depender del puente `repuesto -> parte`.

---

## Fase 4 — Simplificar frontend

### Objetivo
Reducir pantallas y pasos innecesarios.

### Tareas
- unificar la gestión de `Parte + Repuesto` en una sola pantalla de catálogo,
- hacer que `Inventario` se administre desde la misma vista del ítem o desde una subvista simple,
- sacar `TipoEspecificacion` y `EspecificacionParte` del flujo principal,
- en formularios de presupuesto, seleccionar `Parte` directamente en lugar de `Repuesto`.

### Resultado esperado
Registrar un ítem nuevo ya no requerirá pasar por varias pantallas redundantes.

---

## Fase 5 — Deprecación limpia

### Objetivo
Retirar lo que sobre sin romper historial.

### Tareas
- marcar `Repuesto` como legacy/deprecado,
- ocultar rutas y menús que ya no se usarán,
- mantener compatibilidad temporal de lectura,
- luego eliminar columnas/tablas sobrantes en una migración final.

### Resultado esperado
El dominio queda simple y mantenible.

---

## 8) Refactor funcional esperado en la operación diaria

## Flujo actual
Para registrar una simple RAM, hoy potencialmente hay que tocar:

1. categoría,
2. parte,
3. repuesto,
4. inventario,
5. especificación,
6. tipo de especificación.

## Flujo propuesto
Para registrar una RAM bastaría con:

1. crear el ítem (`Parte`) con:
   - nombre,
   - modelo,
   - categoría,
   - marca,
   - precio,
   - descripción,
2. cargar stock y ubicación,
3. usar ese mismo ítem en presupuesto/orden.

---

## 9) Prioridad recomendada de ejecución

### Alta prioridad
1. formalizar migraciones de base de datos,
2. decidir que `Parte` será la entidad principal,
3. mover precio/código a `Parte`,
4. conectar `DetalleRepuestos` directo con `parteId`.

### Media prioridad
5. ocultar `TipoEspecificacion` y `EspecificacionParte` del flujo principal,
6. unificar formularios y vistas del frontend.

### Baja prioridad
7. eliminar definitivamente tablas legacy luego de estabilización.

---

## 10) Recomendación final

Para este proyecto, la estructura actual está **más compleja de lo que el caso de uso necesita**.

### Mi recomendación concreta es:

- **mantener:** `Categoria`, `Parte`, `Inventario`, `Presupuesto`, `DetalleRepuestos` (renombrado conceptualmente),
- **absorber/eliminar:** `Repuesto`,
- **volver opcional o sacar del flujo principal:** `EspecificacionParte` y `TipoEspecificacion`.

Con eso el sistema queda mucho más coherente con el objetivo real:

> controlar qué pieza se usa en una orden, cuánto stock queda y cuánto costará el servicio.

---

## 11) Siguiente paso sugerido

Siguiente paso recomendado de implementación:

### Paso 1
Hacer un **documento de decisión técnica** confirmando este modelo objetivo:

- `Parte` será el ítem maestro,
- `Inventario` manejará stock,
- `DetalleRepuestos` pasará a apuntar a `parteId`,
- `TipoEspecificacion` y `EspecificacionParte` saldrán del flujo principal.

### Paso 2
Después de esa confirmación, ejecutar el refactor en este orden:

1. backend + migración,
2. frontend catálogo,
3. frontend presupuesto/orden,
4. limpieza final.
