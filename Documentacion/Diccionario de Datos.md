# 8. DICCIONARIO DE DATOS (BASE DE DATOS RELACIONAL)

> [!TIP]
> **Soporte Visual (ERD):** Para comprender visualmente cómo interactúan estas 29 tablas, sus relaciones de cardinalidad y claves foráneas, consulte el [Diseño Visual y Diagramas UML.md](file:///c:/APP2/Documentacion/Dise%C3%B1o%20Visual%20y%20Diagramas%20UML.md).

> [!NOTE]
> **Manual Técnico Principal:** Si desea revisar la arquitectura, factibilidad o metodología de desarrollo del proyecto, consulte el [Manual Técnico - Hospital del Computador.md](file:///c:/APP2/Documentacion/Manual%20T%C3%A9cnico%20-%20Hospital%20del%20Computador.md).

Este diccionario de datos detalla la estructura física de la base de datos de la aplicación **Hospital del Computador**, construida sobre el motor **PostgreSQL** mediante el mapeo de entidades de **TypeORM**. 

El esquema está compuesto por **29 tablas** normalizadas y optimizadas, divididas en módulos lógicos para garantizar la integridad referencial, el control de accesos RBAC, la auditoría del ciclo de soporte técnico y la trazabilidad logística de inventarios.

---


### 8.1 Tabla: `actividadtecnica` (ActividadTecnica)
Registro diario de actividades, comentarios y observaciones del técnico asignado a una ODS.

**Tabla Anexo Diccionario: Especificación física de la tabla `actividadtecnica`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `ordenId` | `INT` | FK | NOT NULL | Clave foránea que referencia a la orden de servicio asociada en la tabla `orders`. |
| `tipoActividadId` | `INT` | FK | NOT NULL | Clave foránea que referencia al tipo de actividad técnica en `tipoactividadtecnica`. |
| `fecha` | `TIMESTAMP` |  | NOT NULL | Fecha y hora en que se ejecutó la transacción. |
| `diagnostico` | `TEXT` |  | NOT NULL | Evaluación o reporte de fallas elaborado por el técnico en su bitácora. |
| `trabajoRealizado` | `TEXT` |  | NOT NULL | Procedimientos, reparaciones y soldaduras ejecutadas en el equipo. |
| `estado` | `BOOLEAN` |  | NOT NULL | Flag lógico del estado del registro (activo/inactivo, disponible/ocupado). |
| `deletedAt` | `TIMESTAMP` |  | NULL | Marca de tiempo de la eliminación lógica del registro (Soft Delete). |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
| `updatedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la última modificación en base de datos. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.2 Tabla: `ajuste_inventario` (AjusteInventario)
Cabecera de los ajustes manuales de stock realizados tras auditorías físicas de inventario.

**Tabla Anexo Diccionario: Especificación física de la tabla `ajuste_inventario`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `fecha` | `TIMESTAMP` |  | NOT NULL | Fecha y hora en que se ejecutó la transacción. |
| `motivo` | `TEXT` |  | NOT NULL | Causa declarada del ajuste manual de stock (merma, rotura, auditoría). |
| `comentario` | `TEXT` |  | NULL | Detalles o aclaraciones escritas por el auditor de inventario. |
| `usuarioId` | `INT` | FK | NOT NULL | Clave foránea que referencia al usuario asociado en la tabla `users`. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.3 Tabla: `ajuste_inventario_detalle` (AjusteInventarioDetalle)
Detalles del ajuste manual de inventario, reflejando diferencias y mermas detectadas por ítem.

**Tabla Anexo Diccionario: Especificación física de la tabla `ajuste_inventario_detalle`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `ajusteId` | `INT` | FK | NOT NULL | Clave foránea que referencia al ajuste de inventario cabecera en la tabla `ajuste_inventario`. |
| `parteId` | `INT` | FK | NOT NULL | Clave foránea que referencia al repuesto/servicio en la tabla `parte`. |
| `stockSistema` | `DECIMAL(10,2)` |  | NOT NULL | Cantidad de stock lógico registrado por el sistema antes del conteo físico. |
| `stockFisico` | `DECIMAL(10,2)` |  | NOT NULL | Cantidad real de unidades contadas en almacén. |
| `diferencia` | `DECIMAL(10,2)` |  | NOT NULL | Diferencia matemática resultante (Stock Físico - Stock Sistema). |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.4 Tabla: `casillero` (Casillero)
Estructuras de almacenamiento físico en el taller de electrónica para ubicar espacialmente los equipos.

**Tabla Anexo Diccionario: Especificación física de la tabla `casillero`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `codigo` | `VARCHAR` |  | NOT NULL, UNIQUE | Atributo que representa el campo `codigo` en la entidad. |
| `situacion` | `ENUM` |  | NOT NULL | Estado actual de ocupación del casillero (disponible, ocupado, reservado). |
| `descripcion` | `VARCHAR` |  | NOT NULL | Detalles, observaciones o justificaciones del presupuesto o registro. |
| `estado` | `BOOLEAN` |  | NOT NULL | Flag lógico del estado del registro (activo/inactivo, disponible/ocupado). |
| `orderId` | `INT` | FK | NULL | Clave foránea opcional que asocia el casillero a una orden en soporte. |
| `deletedAt` | `TIMESTAMP` |  | NULL | Marca de tiempo de la eliminación lógica del registro (Soft Delete). |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
| `updatedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la última modificación en base de datos. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.5 Tabla: `categoria` (Categoria)
Clasificaciones lógicas para la organización de los repuestos del inventario (ej: Pantallas, Discos, Cargadores).

**Tabla Anexo Diccionario: Especificación física de la tabla `categoria`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `nombre` | `VARCHAR` |  | NOT NULL | Nombres completos del registro (usuario, rol, marca, modelo, etc.). |
| `estado` | `BOOLEAN` |  | NOT NULL | Flag lógico del estado del registro (activo/inactivo, disponible/ocupado). |
| `descripcion` | `VARCHAR` |  | NOT NULL | Detalles, observaciones o justificaciones del presupuesto o registro. |
| `deletedAt` | `TIMESTAMP` |  | NULL | Marca de tiempo de la eliminación lógica del registro (Soft Delete). |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
| `updatedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la última modificación en base de datos. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.6 Tabla: `checklist_template` (ChecklistTemplate)
Plantillas estructuradas de ítems de peritaje que se cargan según la categoría del equipo en soporte.

**Tabla Anexo Diccionario: Especificación física de la tabla `checklist_template`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `nombre` | `VARCHAR` |  | NOT NULL | Nombres completos del registro (usuario, rol, marca, modelo, etc.). |
| `tipoEquipoId` | `INT` | FK | NOT NULL | Clave foránea que referencia al tipo de equipo en la tabla `tipoequipo`. |
| `items` | `VARCHAR[]` |  | NOT NULL | Arreglo de cadenas que contiene los puntos de verificación del checklist de peritaje. |
| `estado` | `BOOLEAN` |  | NOT NULL | Flag lógico del estado del registro (activo/inactivo, disponible/ocupado). |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
| `updatedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la última modificación en base de datos. |
| `deletedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la eliminación lógica del registro (Soft Delete). |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.7 Tabla: `compra` (Compra)
Registro de transacciones de compra de insumos asentadas a proveedores.

**Tabla Anexo Diccionario: Especificación física de la tabla `compra`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `numeroFactura` | `VARCHAR` |  | NOT NULL | Número de factura física o electrónica del proveedor. |
| `fecha` | `TIMESTAMP` |  | NOT NULL | Fecha y hora en que se ejecutó la transacción. |
| `subtotal` | `DECIMAL(12,2)` |  | NOT NULL | Monto acumulado antes de la aplicación de tasas impositivas. |
| `ivaPorcentaje` | `DECIMAL(5,2)` |  | NOT NULL | Porcentaje de IVA aplicado a la transacción en el taller (ej: `15.00`). |
| `ivaMonto` | `DECIMAL(12,2)` |  | NOT NULL | Valor monetario calculado del IVA correspondiente al subtotal. |
| `total` | `DECIMAL(12,2)` |  | NOT NULL | Suma neta final a pagar por el cliente (Subtotal + IVA). |
| `comentario` | `TEXT` |  | NULL | Detalles o aclaraciones escritas por el auditor de inventario. |
| `estado` | `VARCHAR` |  | NOT NULL | Flag lógico del estado del registro (activo/inactivo, disponible/ocupado). |
| `proveedorId` | `INT` | FK | NOT NULL | Clave foránea que referencia al proveedor en la tabla `proveedor`. |
| `usuarioId` | `INT` | FK | NOT NULL | Clave foránea que referencia al usuario asociado en la tabla `users`. |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.8 Tabla: `compra_detalle` (CompraDetalle)
Detalle de los repuestos y cantidades compradas a proveedores en una factura de compra.

**Tabla Anexo Diccionario: Especificación física de la tabla `compra_detalle`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `compraId` | `INT` | FK | NOT NULL | Clave foránea que referencia a la compra en la tabla `compra`. |
| `parteId` | `INT` | FK | NOT NULL | Clave foránea que referencia al repuesto/servicio en la tabla `parte`. |
| `cantidad` | `DECIMAL(10,2)` |  | NOT NULL | Cantidad de ítems transaccionados (decimal para partes fraccionables, entero para enteros). |
| `precioUnitario` | `DECIMAL(12,2)` |  | NOT NULL | Precio unitario cobrado al momento de la cotización. |
| `subtotal` | `DECIMAL(12,2)` |  | NOT NULL | Monto acumulado antes de la aplicación de tasas impositivas. |
| `actualizarCosto` | `BOOLEAN` |  | NOT NULL | Flag que define si la compra modifica el costo promedio ponderado de inventario. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.9 Tabla: `detalle_repuestos` (DetallePresupuestoItem)
Detalle físico del presupuesto, registrando repuestos utilizados del inventario y servicios realizados.

**Tabla Anexo Diccionario: Especificación física de la tabla `detalle_repuestos`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `cantidad` | `INT` |  | NOT NULL | Cantidad de ítems transaccionados (decimal para partes fraccionables, entero para enteros). |
| `precioUnitario` | `DECIMAL(10,2)` |  | NOT NULL | Precio unitario cobrado al momento de la cotización. |
| `subtotal` | `DECIMAL(10,2)` |  | NOT NULL | Monto acumulado antes de la aplicación de tasas impositivas. |
| `fechaUso` | `TIMESTAMP` |  | NOT NULL | Fecha y hora en la que se aplicó el insumo a la orden en el taller. |
| `presupuestoId` | `INT` | FK | NOT NULL | Clave foránea que referencia al presupuesto asociado en la tabla `presupuesto`. |
| `parteId` | `INT` | FK | NULL | Clave foránea que referencia al repuesto/servicio en la tabla `parte`. |
| `estadoOrdenId` | `INT` | FK | NULL | Clave foránea que referencia al estado actual de la ODS en `estado_orden`. |
| `estado` | `BOOLEAN` |  | NOT NULL | Flag lógico del estado del registro (activo/inactivo, disponible/ocupado). |
| `comentario` | `TEXT` |  | NULL | Detalles o aclaraciones escritas por el auditor de inventario. |
| `deletedAt` | `TIMESTAMP` |  | NULL | Marca de tiempo de la eliminación lógica del registro (Soft Delete). |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
| `updatedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la última modificación en base de datos. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.10 Tabla: `equipo` (Equipo)
Registro físico de los dispositivos ingresados en taller, incluyendo números de serie y clasificaciones.

**Tabla Anexo Diccionario: Especificación física de la tabla `equipo`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `numeroSerie` | `VARCHAR` |  | NOT NULL | Número de serie único grabado de fábrica en el chasis del dispositivo. |
| `estado` | `BOOLEAN` |  | NOT NULL | Flag lógico del estado del registro (activo/inactivo, disponible/ocupado). |
| `isDeleted` | `BOOLEAN` |  | NOT NULL | Flag de control para identificar registros marcados como eliminados. |
| `deletedAt` | `TIMESTAMP` |  | NULL | Marca de tiempo de la eliminación lógica del registro (Soft Delete). |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
| `updatedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la última modificación en base de datos. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.11 Tabla: `estado_orden` (EstadoOrden)
Catálogo maestro de estados del flujo de vida de una orden de servicio (ej: Ingresado, En Diagnóstico, Por Reparar).

**Tabla Anexo Diccionario: Especificación física de la tabla `estado_orden`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `nombre` | `VARCHAR` |  | NOT NULL | Nombres completos del registro (usuario, rol, marca, modelo, etc.). |
| `descripcion` | `TEXT` |  | NULL | Detalles, observaciones o justificaciones del presupuesto o registro. |
| `estado` | `BOOLEAN` |  | NOT NULL | Flag lógico del estado del registro (activo/inactivo, disponible/ocupado). |
| `deletedAt` | `TIMESTAMP` |  | NULL | Marca de tiempo de la eliminación lógica del registro (Soft Delete). |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
| `updatedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la última modificación en base de datos. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.12 Tabla: `estadopresupuesto` (EstadoPresupuesto)
Catálogo de estados por los que puede transitar una cotización (ej: Pendiente, Aprobado, Rechazado).

**Tabla Anexo Diccionario: Especificación física de la tabla `estadopresupuesto`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `nombre` | `VARCHAR` |  | NOT NULL | Nombres completos del registro (usuario, rol, marca, modelo, etc.). |
| `descripcion` | `TEXT` |  | NOT NULL | Detalles, observaciones o justificaciones del presupuesto o registro. |
| `estado` | `BOOLEAN` |  | NOT NULL | Flag lógico del estado del registro (activo/inactivo, disponible/ocupado). |
| `deletedAt` | `TIMESTAMP` |  | NULL | Marca de tiempo de la eliminación lógica del registro (Soft Delete). |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
| `updatedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la última modificación en base de datos. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.13 Tabla: `evidenciatecnica` (EvidenciaTecnica)
Almacenamiento de enlaces y metadatos de fotos y videos adjuntos como evidencia técnica a una orden.

**Tabla Anexo Diccionario: Especificación física de la tabla `evidenciatecnica`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `ordenId` | `INT` | FK | NOT NULL | Clave foránea que referencia a la orden de servicio asociada en la tabla `orders`. |
| `subidoPorId` | `INT` | FK | NOT NULL | Clave foránea del usuario que subió la evidencia técnica a la orden. |
| `estadoOrdenId` | `INT` | FK | NULL | Clave foránea que referencia al estado actual de la ODS en `estado_orden`. |
| `archivoUrl` | `TEXT` |  | NOT NULL | Enlace o ruta de almacenamiento de la imagen o video cargado como evidencia. |
| `tipoArchivo` | `VARCHAR` |  | NOT NULL | Extensión de formato multimedia (ej: `'image/png'`, `'video/mp4'`). |
| `descripcion` | `TEXT` |  | NULL | Detalles, observaciones o justificaciones del presupuesto o registro. |
| `fechaSubida` | `TIMESTAMP` |  | NOT NULL | Fecha y hora del registro del adjunto multimedia. |
| `deletedAt` | `TIMESTAMP` |  | NULL | Marca de tiempo de la eliminación lógica del registro (Soft Delete). |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.14 Tabla: `historial_estado_orden` (HistorialEstadoOrden)
Bitácora de auditoría inmutable que registra las transacciones de estado de cada ODS con su autor y fecha.

**Tabla Anexo Diccionario: Especificación física de la tabla `historial_estado_orden`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `fechaCambio` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la transición de estado de ODS. |
| `observaciones` | `TEXT` |  | NULL | Notas o justificaciones asociadas al cambio de estado de la orden. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.15 Tabla: `marca` (Marca)
Catálogo maestro de marcas de fabricantes de dispositivos (ej: HP, Lenovo, Epson, Xiaomi).

**Tabla Anexo Diccionario: Especificación física de la tabla `marca`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `nombre` | `VARCHAR` |  | NOT NULL | Nombres completos del registro (usuario, rol, marca, modelo, etc.). |
| `estado` | `BOOLEAN` |  | NOT NULL | Flag lógico del estado del registro (activo/inactivo, disponible/ocupado). |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
| `updatedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la última modificación en base de datos. |
| `deletedAt` | `TIMESTAMP` |  | NULL | Marca de tiempo de la eliminación lógica del registro (Soft Delete). |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.16 Tabla: `modelo` (Modelo)
Catálogo maestro de modelos de dispositivos asociados a marcas específicas.

**Tabla Anexo Diccionario: Especificación física de la tabla `modelo`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `nombre` | `VARCHAR` |  | NOT NULL | Nombres completos del registro (usuario, rol, marca, modelo, etc.). |
| `estado` | `BOOLEAN` |  | NOT NULL | Flag lógico del estado del registro (activo/inactivo, disponible/ocupado). |
| `deletedAt` | `TIMESTAMP` |  | NULL | Marca de tiempo de la eliminación lógica del registro (Soft Delete). |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
| `updatedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la última modificación en base de datos. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.17 Tabla: `notificaciones` (Notificacion)
Registro histórico de alertas del sistema enviadas a usuarios específicos.

**Tabla Anexo Diccionario: Especificación física de la tabla `notificaciones`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `usuarioId` | `INT` | FK | NOT NULL | Clave foránea que referencia al usuario asociado en la tabla `users`. |
| `ordenServicioId` | `INT` | FK | NULL | Clave foránea que referencia a la orden de servicio asociada en la tabla `orders`. |
| `tipoId` | `INT` | FK | NOT NULL | Clave foránea de tipología (ej: `tipo_notificacion.id`). |
| `mensaje` | `TEXT` |  | NOT NULL | Contenido de texto plano con la descripción de la alerta. |
| `leido` | `BOOLEAN` |  | NOT NULL | Determina si el usuario ha leído la alerta. |
| `fechaEnvio` | `TIMESTAMP` |  | NOT NULL | Fecha y hora del despacho de la notificación. |
| `isDeleted` | `BOOLEAN` |  | NOT NULL | Flag de control para identificar registros marcados como eliminados. |
| `deletedAt` | `TIMESTAMP` |  | NULL | Marca de tiempo de la eliminación lógica del registro (Soft Delete). |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.18 Tabla: `orders` (Order)
Cabecera principal de las órdenes de servicio (ODS), registrando cliente, técnico, estado logístico y peritaje.

**Tabla Anexo Diccionario: Especificación física de la tabla `orders`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `type` | `VARCHAR` |  | NOT NULL | Atributo que representa el campo `type` en la entidad. |
| `checklistData` | `JSONB` |  | NULL | Estructura JSONB jerárquica con los ítems evaluados en el checklist de diagnóstico. |
| `workOrderNumber` | `VARCHAR` |  | NOT NULL, UNIQUE | Código secuencial único generado por el sistema para identificación física del trabajo. |
| `estado` | `BOOLEAN` |  | NOT NULL | Flag lógico del estado del registro (activo/inactivo, disponible/ocupado). |
| `clientId` | `INT` | FK | NULL | Atributo que representa el campo `clientId` en la entidad. |
| `technicianId` | `INT` | FK | NULL | Atributo que representa el campo `technicianId` en la entidad. |
| `recepcionistaId` | `INT` | FK | NULL | Atributo que representa el campo `recepcionistaId` en la entidad. |
| `equipoId` | `INT` | FK | NOT NULL | Clave foránea que referencia al equipo asociado en la tabla `equipo`. |
| `problemaReportado` | `VARCHAR` |  | NOT NULL | Descripción detallada del síntoma o falla reportado por el cliente al ingresar. |
| `accesorios` | `VARCHAR[]` |  | NULL | Arreglo de texto que detalla las partes físicas externas recibidas (cargador, mochila, etc.). |
| `fechaPrometidaEntrega` | `TIMESTAMP` |  | NULL | Fecha estimada de finalización pactada con el cliente. |
| `casilleroId` | `INT` | FK | NULL | Clave foránea que asocia un casillero físico de taller a la orden. |
| `estadoOrdenId` | `INT` | FK | NULL | Clave foránea que referencia al estado actual de la ODS en `estado_orden`. |
| `deletedAt` | `TIMESTAMP` |  | NULL | Marca de tiempo de la eliminación lógica del registro (Soft Delete). |
| `esperaRepuesto` | `BOOLEAN` |  | NOT NULL | Indica si la orden de servicio está en espera de piezas para proceder con la reparación. |
| `tiempoEstimadoReparacion` | `FLOAT` |  | NOT NULL | Cantidad de horas estimadas necesarias para completar el servicio. |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
| `updatedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la última modificación en base de datos. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.19 Tabla: `parte` (Parte)
Catálogo maestro unificado de ítems físicos (repuestos) y de mano de obra (servicios) del taller.

**Tabla Anexo Diccionario: Especificación física de la tabla `parte`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `nombre` | `VARCHAR` |  | NOT NULL | Nombres completos del registro (usuario, rol, marca, modelo, etc.). |
| `modelo` | `VARCHAR` |  | NULL | Modelo comercial compatible con el repuesto de inventario. |
| `descripcion` | `VARCHAR` |  | NULL | Detalles, observaciones o justificaciones del presupuesto o registro. |
| `codigoInterno` | `VARCHAR` |  | NULL, UNIQUE | SKU o código de barras interno de la tienda para repuestos (Único). |
| `costo` | `DECIMAL(12,2)` |  | NOT NULL | Costo unitario promedio de adquisición en inventario. |
| `precio1` | `DECIMAL(12,2)` |  | NOT NULL | Precio de venta al público general (PVP). |
| `precio2` | `DECIMAL(12,2)` |  | NOT NULL | Precio especial de venta para mayoristas. |
| `precio3` | `DECIMAL(12,2)` |  | NOT NULL | Precio especial de venta con descuento de taller. |
| `precio4` | `DECIMAL(12,2)` |  | NOT NULL | Precio especial de venta para distribuidores autorizados. |
| `ivaTarifa` | `DECIMAL(5,2)` |  | NOT NULL | Tarifa del impuesto al valor agregado gravada al ítem del inventario (ej: `15.00`). |
| `stock` | `DECIMAL(12,3)` |  | NOT NULL | Cantidad física disponible actualmente en almacén (admite decimales). |
| `stockMinimo` | `DECIMAL(12,3)` |  | NOT NULL | Límite de unidades que dispara alertas automáticas de reabastecimiento. |
| `ubicacion` | `VARCHAR` |  | NULL | Ubicación en percha del taller para la pieza (ej: 'Cajón B4'). |
| `unidadMedida` | `VARCHAR` |  | NOT NULL | Unidad de despacho del catálogo (ej: `'Unidad'`, `'Metro'`, `'Servicio'`). |
| `permiteModificarPrecio` | `BOOLEAN` |  | NOT NULL | Indica si el técnico puede editar la tarifa en la cotización. |
| `permiteFraccionar` | `BOOLEAN` |  | NOT NULL | Flag que habilita el despacho de porciones decimales de la pieza. |
| `estado` | `BOOLEAN` |  | NOT NULL | Flag lógico del estado del registro (activo/inactivo, disponible/ocupado). |
| `categoriaId` | `INT` | FK | NOT NULL | Clave foránea que referencia a la categoría de inventario en `categoria`. |
| `marcaId` | `INT` | FK | NULL | Clave foránea que referencia a la marca en la tabla `marca`. |
| `deletedAt` | `TIMESTAMP` |  | NULL | Marca de tiempo de la eliminación lógica del registro (Soft Delete). |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
| `updatedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la última modificación en base de datos. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.20 Tabla: `permissions` (Permission)
Contiene los permisos atómicos del sistema asociados a acciones de controladores y vistas.

**Tabla Anexo Diccionario: Especificación física de la tabla `permissions`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `nombre` | `VARCHAR` |  | NOT NULL | Nombres completos del registro (usuario, rol, marca, modelo, etc.). |
| `slug` | `VARCHAR` |  | NOT NULL | Cadena identificadora corta para uso en controladores y guards. |
| `descripcion` | `VARCHAR` |  | NULL | Detalles, observaciones o justificaciones del presupuesto o registro. |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
| `updatedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la última modificación en base de datos. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.21 Tabla: `presupuesto` (Presupuesto)
Cotización económica asociada a una ODS, detallando subtotales, IVA y total general.

**Tabla Anexo Diccionario: Especificación física de la tabla `presupuesto`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `ordenId` | `INT` | FK | NOT NULL | Clave foránea que referencia a la orden de servicio asociada en la tabla `orders`. |
| `fechaEmision` | `TIMESTAMP` |  | NOT NULL | Fecha y hora en que se emitió el presupuesto. |
| `estadoId` | `INT` | FK | NOT NULL | Clave foránea que referencia al estado en su respectivo catálogo. |
| `descripcion` | `TEXT` |  | NULL | Detalles, observaciones o justificaciones del presupuesto o registro. |
| `deletedAt` | `TIMESTAMP` |  | NULL | Marca de tiempo de la eliminación lógica del registro (Soft Delete). |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
| `updatedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la última modificación en base de datos. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.22 Tabla: `proveedor` (Proveedor)
Registro de proveedores autorizados que suministran insumos al taller.

**Tabla Anexo Diccionario: Especificación física de la tabla `proveedor`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `nombre` | `VARCHAR` |  | NOT NULL | Nombres completos del registro (usuario, rol, marca, modelo, etc.). |
| `ruc_nit` | `VARCHAR` |  | NOT NULL | Registro Único de Contribuyentes o identificación fiscal del proveedor. |
| `correo` | `VARCHAR` |  | NULL, UNIQUE | Dirección de correo electrónico (Único). |
| `telefono` | `VARCHAR` |  | NULL | Número de contacto telefónico del registro. |
| `direccion` | `TEXT` |  | NULL | Dirección domiciliaria física. |
| `estado` | `BOOLEAN` |  | NOT NULL | Flag lógico del estado del registro (activo/inactivo, disponible/ocupado). |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
| `updatedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la última modificación en base de datos. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.23 Tabla: `roles` (Rol)
Define los roles lógicos del sistema (ej: admin, tecnico, recepcionista, cliente) para el control de accesos.

**Tabla Anexo Diccionario: Especificación física de la tabla `roles`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `nombre` | `VARCHAR` |  | NOT NULL | Nombres completos del registro (usuario, rol, marca, modelo, etc.). |
| `slug` | `VARCHAR` |  | NOT NULL | Cadena identificadora corta para uso en controladores y guards. |
| `descripcion` | `VARCHAR` |  | NULL | Detalles, observaciones o justificaciones del presupuesto o registro. |
| `activo` | `BOOLEAN` |  | NOT NULL | Determina si el rol está habilitado. |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
| `updatedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la última modificación en base de datos. |
| `deletedAt` | `TIMESTAMP` |  | NULL | Marca de tiempo de la eliminación lógica del registro (Soft Delete). |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.24 Tabla: `role_permissions` (RolePermission)
Tabla asociativa intermedia que vincula los roles con sus respectivos permisos (relación Many-to-Many).

**Tabla Anexo Diccionario: Especificación física de la tabla `role_permissions`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `roleId` | `INT` | FK | NOT NULL | Clave foránea que referencia al rol asociado en la tabla `roles`. |
| `permissionId` | `INT` | FK | NOT NULL | Clave foránea que referencia al permiso asociado en la tabla `permissions`. |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
| `updatedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la última modificación en base de datos. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.25 Tabla: `tipoactividadtecnica` (TipoActividadTecnica)
Catálogo de tipos de tareas de mantenimiento técnico (ej: Limpieza, Cambio de Pasta, Reballing).

**Tabla Anexo Diccionario: Especificación física de la tabla `tipoactividadtecnica`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `nombre` | `VARCHAR` |  | NOT NULL | Nombres completos del registro (usuario, rol, marca, modelo, etc.). |
| `descripcion` | `TEXT` |  | NULL | Detalles, observaciones o justificaciones del presupuesto o registro. |
| `estado` | `BOOLEAN` |  | NOT NULL | Flag lógico del estado del registro (activo/inactivo, disponible/ocupado). |
| `deletedAt` | `TIMESTAMP` |  | NULL | Marca de tiempo de la eliminación lógica del registro (Soft Delete). |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
| `updatedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la última modificación en base de datos. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.26 Tabla: `tipoequipo` (TipoEquipo)
Catálogo de tipos de equipos soportados por el taller (ej: Laptop, Computadora de Escritorio, Impresora).

**Tabla Anexo Diccionario: Especificación física de la tabla `tipoequipo`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `nombre` | `VARCHAR` |  | NOT NULL | Nombres completos del registro (usuario, rol, marca, modelo, etc.). |
| `estado` | `BOOLEAN` |  | NOT NULL | Flag lógico del estado del registro (activo/inactivo, disponible/ocupado). |
| `deletedAt` | `TIMESTAMP` |  | NULL | Marca de tiempo de la eliminación lógica del registro (Soft Delete). |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
| `updatedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la última modificación en base de datos. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.27 Tabla: `tiponotificacion` (TipoNotificacion)
Clasificaciones de alertas en tiempo real (ej: Alerta de stock mínimo, cambio de estado de orden).

**Tabla Anexo Diccionario: Especificación física de la tabla `tiponotificacion`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `nombre` | `VARCHAR` |  | NOT NULL | Nombres completos del registro (usuario, rol, marca, modelo, etc.). |
| `descripcion` | `TEXT` |  | NULL | Detalles, observaciones o justificaciones del presupuesto o registro. |
| `estado` | `BOOLEAN` |  | NOT NULL | Flag lógico del estado del registro (activo/inactivo, disponible/ocupado). |
| `deletedAt` | `TIMESTAMP` |  | NULL | Marca de tiempo de la eliminación lógica del registro (Soft Delete). |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
| `updatedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la última modificación en base de datos. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.28 Tabla: `users` (User)
Almacena la información de contacto, credenciales de acceso y estado de clientes, técnicos y recepcionistas.

**Tabla Anexo Diccionario: Especificación física de la tabla `users`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `cedula` | `VARCHAR` |  | NOT NULL, UNIQUE | Cédula de identidad o RUC ecuatoriano de la persona (Longitud variable, Único). |
| `nombre` | `VARCHAR` |  | NOT NULL | Nombres completos del registro (usuario, rol, marca, modelo, etc.). |
| `apellido` | `VARCHAR` |  | NULL | Apellidos completos del usuario (opcional). |
| `correo` | `VARCHAR` |  | NOT NULL, UNIQUE | Dirección de correo electrónico (Único). |
| `telefono` | `VARCHAR` |  | NOT NULL | Número de contacto telefónico del registro. |
| `direccion` | `VARCHAR` |  | NOT NULL | Dirección domiciliaria física. |
| `ciudad` | `VARCHAR` |  | NOT NULL | Ciudad de residencia o ubicación. |
| `password` | `VARCHAR` |  | NULL | Contraseña de acceso del usuario cifrada mediante el algoritmo hash `bcrypt`. |
| `resetPasswordToken` | `VARCHAR` |  | NULL | Token de seguridad temporal generado para restablecer credenciales. |
| `estado` | `BOOLEAN` |  | NOT NULL | Flag lógico del estado del registro (activo/inactivo, disponible/ocupado). |
| `deletedAt` | `TIMESTAMP` |  | NULL | Marca de tiempo de la eliminación lógica del registro (Soft Delete). |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
| `updatedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la última modificación en base de datos. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*

### 8.29 Tabla: `user_roles` (UserRole)
Tabla asociativa intermedia que vincula los usuarios con sus respectivos roles (relación Many-to-Many).

**Tabla Anexo Diccionario: Especificación física de la tabla `user_roles`**
| Campo | Tipo de Dato | Llave | Restricción | Descripción y Definición del Atributo |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `INT` | PK | NOT NULL, SERIAL | Identificador único incremental autogenerado en base de datos (Clave Primaria). |
| `userId` | `INT` | FK | NOT NULL | Clave foránea que referencia al usuario asociado en la tabla `users`. |
| `roleId` | `INT` | FK | NOT NULL | Clave foránea que referencia al rol asociado en la tabla `roles`. |
| `createdAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo del registro e inserción inicial en base de datos. |
| `updatedAt` | `TIMESTAMP` |  | NOT NULL | Marca de tiempo de la última modificación en base de datos. |
*Fuente: Entidad física de base de datos*
*Elaborado por: El autor, 2026*
