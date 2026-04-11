# Plan de Refactorización — Sistema de Gestión de Servicio Técnico

## Resumen del Contexto

Sistema de gestión técnica para computadores. Backend: NestJS 10 + PostgreSQL + TypeORM. Frontend: Next.js 15 + React 19 + TailwindCSS v4. Roles: `admin`, `tech`, `recep`, `client`.

---

## 🔍 Hallazgos del Análisis Completo

### BACKEND — Problemas Encontrados

#### 🔴 Críticos

| # | Problema | Ubicación |
|---|----------|-----------|
| B1 | `synchronize: true` en producción — puede sobrescribir datos en BD en cualquier deploy | `app.module.ts:56` |
| B2 | `console.log` con datos sensibles (user IDs, tokens implícitos) en el controller de órdenes | `orders.controller.ts:230,238` |
| B3 | El `@Auth()` se aplica **dos veces** en el mismo controlador (a nivel de clase y método): decorador redundante duplicado | `orders.controller.ts:32,37,43,181...` |
| B4 | `getDefaultEstadoOrden()` tiene `||` entre dos Promises — TypeScript lo acepta pero lógicamente es incorrecto: si `findOne` devuelve `null`, el `||` no resuelve la segunda Promise | `orders.service.ts:200-203` |
| B5 | `findOne` de orders no incluye todas las relaciones necesarias (`presupuesto`, `actividades`, `evidencias`, `historialEstados`, `casillero`) — obliga a N+1 queries desde el frontend | `orders.service.ts:235-252` |

#### 🟡 Medianos

| # | Problema | Ubicación |
|---|----------|-----------|
| B6 | `findAll` y `findAllPaginated` coexisten — `findAll` nunca es llamado desde ningún controller visible, es código muerto | `orders.service.ts:214-228` |
| B7 | El `OrdersModule` importa directamente repositorios de otros módulos (ActividadTecnica, Presupuesto, Casillero, EvidenciaTecnica, Historial) violando encapsulación modular | `orders.module.ts` |
| B8 | La validación de fechas pasadas se aplica en `create` pero no consistentemente en `update` — `fechaPrometidaEntrega` en update **sí la valida** pero es incoherente con el comentario "solo para negocio específico" | `orders.service.ts:282-292` |
| B9 | No hay Swagger/OpenAPI configurado (hay el paquete instalado pero no implementado) | `package.json:43` |
| B10 | Dos librerías de bcrypt instaladas (`bcrypt` + `bcryptjs`) — redundancia de dependencias | `package.json:33-34` |
| B11 | `sib-api-v3-sdk` y `@getbrevo/brevo` coexisten — son la misma API (Brevo/Sendinblue), duplicación de SDK | `package.json:24,42` |
| B12 | Los módulos de "tipos catálogo" (TipoEquipo, TipoActividad, TipoManoObra, TipoEspecificacion, TipoNotificacion) tienen estrutura **100% idéntica** sin abstracción base | Módulos catálogo |

#### 🟢 Menores

| # | Problema |
|---|----------|
| B13 | Archivos de documentación en `/src`: `EJEMPLOS_ROLES_PERMISOS.ts`, `ROLES_PERMISSIONS_README.md` mezclados con código |
| B14 | Múltiples `.md` en raíz del Backend (11 archivos) que deberían estar en `/Documentacion` |

---

### FRONTEND — Problemas Encontrados

#### 🔴 Críticos (Duplicación masiva)

| # | Problema | Afecta |
|---|----------|--------|
| F1 | **38 hooks con estructura 100% idéntica**: cada uno tiene `fetchXxx`, `createXxx`, `updateXxx`, `toggleXxxStatus`, `deleteXxx`, `restoreXxx` con el mismo patrón `fetch()` + `toast` + `setLoading` | Todos los hooks |
| F2 | **`useActividadTecnica` tiene funciones duplicadas dentro del mismo archivo**: `createActividad` Y `createActividadTecnica` (líneas 148 y 296) hacen exactamente lo mismo. Igual `updateActividad` vs `updateActividadTecnica`, `fetchActividadesByOrder` vs `getActividadesByOrder` | `useActividadTecnica.ts` |
| F3 | **59 modales sin componente base**: cada modal repite la misma estructura de modal, grid, inputs, botones — sin una abstracción `<CrudModal>` o `<EntityModal>` | `/components/modals/` |
| F4 | **26 tablas con lógica repetida**: búsqueda, paginación, filtro de inactivos, handlers de CRUD, toasts — todo duplicado en cada tabla | `/components/tables/` |
| F5 | Las interfaces de datos (`Order`, `UserBasic`, `EquipoBasic`, etc.) están **definidas dentro de los hooks** en lugar de un directorio `/src/types` centralizado — solo existe `/interfaces/order.ts` pero el hook define sus propias versiones | `useOrders.ts:8-58` |

#### 🟡 Medianos

| # | Problema | Ubicación |
|---|----------|-----------|
| F6 | `ordenTable.tsx` tiene **dos estados que hacen lo mismo**: `isEditModalOpen` (línea 58) Y `editModalOpen` (línea 70) — solo se usa uno pero ambos existen | `ordenTable.tsx:58,70` |
| F7 | `handleEdit` (línea 103) y `handleEditClick` (línea 161) en el mismo componente — ambas funciones suman `setSelectedOrder` + abrir modal diferente pero se confunden | `ordenTable.tsx:103,161` |
| F8 | Los estados de orden están **hardcodeados con IDs** en el select del filtro (options con value="1","2","5","6"...) — si cambia la BD se rompe | `ordenTable.tsx:284-296` |
| F9 | `AgregarActividadTecnicaModal` importa `useOrders` completo (carga todas las órdenes) solo para mostrar el número de la orden seleccionada — innecesario cuando el `orderId` ya viene como prop | `AgregarActividadTecnicaModal.tsx:43` |
| F10 | Dos librerías de toast instaladas: `react-toastify` Y `sonner` — solo se usa `react-toastify` | `package.json:40-41` |
| F11 | Tres librerías de iconos: `@mui/icons-material`, `@heroicons/react`, `lucide-react` — sin criterio de cuándo usar cada una | `package.json` |
| F12 | El middleware solo protege `/dashboard/:path*` pero las rutas del admin están en `/(admin)/` — la protección de ruta no cubre todas las páginas admin | `middleware.ts:4` |
| F13 | `formatDate` y `formatUserName` están definidas en múltiples componentes por separado (al menos en `ordenTable.tsx` y `OrdenDetailsModal.tsx`) | Múltiples archivos |
| F14 | `usePresupuesto` llama a otros 3 hooks internamente (`useDetalleRepuesto`, `useDetalleManoObra`, `useEstadoPresupuesto`) generando hooks anidados instanciados múltiples veces | `usePresupuesto.ts:80-88` |
| F15 | `useState` e `import React` mezclados: algunos componentes usan `React.useState` y `useState` (del destructuring) en el mismo archivo | Varios modales |
| F16 | `console.log` comentados (`//console.log`) en producción — código de debug que debería eliminarse (más de 40 instancias) | Toda la codebase |
| F17 | `any` tipo usado explícitamente en múltiples lugares críticos: `selectedPresupuesto: any`, `presupuestoResumen: any`, `presupuestoDetails: any` | `ordenTable.tsx:64-68` |

---

### ACCESIBILIDAD WCAG 2.1 — Problemas Encontrados

> Evaluación orientada a usuarios normales (nivel AA de WCAG 2.1)

| # | Criterio WCAG | Problema | Ubicación |
|---|---------------|----------|-----------|
| W1 | **1.1.1 Alt text** | Las imágenes de evidencia técnica no tienen `alt` descriptivo — usan `"Evidencia N"` genérico. Las imágenes decorativas no tienen `alt=""` | `OrdenDetailsModal.tsx:373-376` |
| W2 | **1.3.1 Info y relaciones** | Las tablas de datos (`<Table>`) no tienen `<caption>` ni `aria-label` que describa su propósito | Todas las tablas |
| W3 | **1.3.1 Info y relaciones** | Los campos de formulario en los modales tienen `<Label>` pero **no hay asociación `htmlFor`/`id` explícita** en todos los casos — el `<select>` de tipo actividad en `AgregarActividadTecnicaModal` no tiene `id` | Modal de actividades |
| W4 | **1.4.3 Contraste** | Los botones de acción en tablas (iconos grises sobre fondo blanco) pueden no alcanzar ratio 4.5:1 — `text-gray-400` es problemático | Tablas |
| W5 | **1.4.4 Tamaño de texto** | Uso de tamaños fijos en px (`font-size: 12px, 10px`) sin unidades relativas | `globals.css` |
| W6 | **2.1.1 Teclado** | Los modales no atrapan el foco (focus trap) — al abrir un modal, el foco puede escapar al contenido de fondo | Todos los modales |
| W7 | **2.1.1 Teclado** | Las tablas con `overflow-x-auto` dentro de `min-w-[1102px]` no son navegables por teclado si hay scroll horizontal oculto | `ordenTable.tsx:319-320` |
| W8 | **2.4.3 Orden de foco** | Los inputs con `tabIndex={-1}` en los detalles modales son correctos (read-only), pero el orden de tabulación en formularios multi-sección no ha sido probado | `OrdenDetailsModal.tsx:40` |
| W9 | **2.4.4 Propósito del enlace** | Los botones de acción con solo iconos SVG tienen `aria-label` en la tabla de órdenes (bien hecho), PERO en otras tablas puede faltar | Otras tablas |
| W10 | **2.4.6 Encabezados** | Uso de `<h2>`, `<h3>`, `<h4>` dentro de modales sin jerarquía consistente — algunos modales usan `<h2>` para el título y `<h4>` para subsecciones saltando `<h3>` | Modales |
| W11 | **2.4.7 Foco visible** | El foco de los botones de icono en tablas puede no ser visible — `focus:outline-none` en algunos botones elimina el indicador de foco | Tablas y botones |
| W12 | **3.1.1 Idioma de la página** | El `<html lang="">` no está configurado en español explícitamente | `layout.tsx` |
| W13 | **3.2.2 Al recibir entrada** | El `<select>` de filtro de estado en `ordenTable` dispara `fetchOrders` inmediatamente al cambiar — puede confundir usuarios con lectores de pantalla | `ordenTable.tsx:277-282` |
| W14 | **3.3.1 Identificación de errores** | Los mensajes de error en formularios usan texto como `"⚠️ Debe seleccionar una orden"` — el emoji no es leído correctamente por todos los lectores de pantalla | Modales |
| W15 | **3.3.2 Etiquetas e instrucciones** | Los campos marcados con `*` de obligatorio no tienen explicación del asterisco en ningún formulario | Todos los formularios |
| W16 | **4.1.2 Nombre, función, valor** | El `confirm()` del navegador para confirmar eliminaciones no es accesible — no es controlable desde lectores de pantalla y viola la consistencia de la UI | Tablas |
| W17 | **4.1.3 Mensajes de estado** | Los toasts de `react-toastify` necesitan `role="alert"` o `aria-live="polite"` — verificar configuración | Toast global |

---

## 📋 Plan de Refactorización — 6 Fases

### Fase 1 — Infraestructura compartida y tipos (3-4 días)

> Sin esta fase, las fases siguientes son inconsistentes

#### [MODIFY] `Backend/src/app.module.ts`
- Cambiar `synchronize: true` → `synchronize: false` (usar migraciones)

#### [NEW] `Frontend/src/types/` (directorio nuevo)
Centralizar TODAS las interfaces actualmente en hooks:
- `Frontend/src/types/order.types.ts` — Order, UserBasic, EquipoBasic, EstadoOrdenBasic
- `Frontend/src/types/pagination.types.ts` — PaginatedResponse<T> genérico
- `Frontend/src/types/actividad.types.ts`, `presupuesto.types.ts`, `usuario.types.ts`, etc.

#### [NEW] `Frontend/src/lib/api.ts`
Crear cliente API centralizado que encapsule `fetch` + `Authorization` header:
```typescript
// Ejemplo:
export async function apiRequest<T>(
  url: string, 
  options: RequestInit = {},
  session: Session
): Promise<T>
```

#### [NEW] `Frontend/src/lib/formatters.ts`
Centralizar `formatDate`, `formatCurrency`, `formatUserName` usadas en múltiples componentes.

---

### Fase 2 — Refactorización de hooks (4-5 días)

> El patrón se repite 38 veces

#### [NEW] `Frontend/src/hooks/useCrud.ts` — Hook genérico base

```typescript
export function useCrud<T>(endpoint: string, options?: CrudOptions) {
  // fetch, create, update, delete, restore, toggleStatus
  // paginación, búsqueda, filtro de inactivos
  // estado compartido: loading, totalPages, searchTerm, showInactive
}
```

Los 38 hooks existentes se reducirían a:
```typescript
export function useCategoria() {
  return useCrud<Categoria>('/categorias');
}
export function useOrders() {
  return useCrud<Order>('/orders', { 
    rolBasedEndpoints: { tech: 'tecnico/mis-ordenes', client: 'cliente/mis-ordenes' }
  });
}
```

#### Limpiar `useActividadTecnica.ts`
- Eliminar `createActividad` (duplicado de `createActividadTecnica`)
- Eliminar `fetchActividadesByOrder` (duplicado de `getActividadesByOrder`)
- Eliminar `updateActividad` (duplicado de `updateActividadTecnica`)

#### Eliminar `sonner` del `package.json`
Solo mantener `react-toastify`.

---

### Fase 3 — Refactorización de componentes de tabla (3-4 días)

#### [NEW] `Frontend/src/components/tables/DataTable.tsx` — Tabla genérica

```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  showInactive: boolean;
  onToggleInactive: () => void;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  actions: (row: T) => ActionDef[];
}
```

Los 26 archivos de tabla pasarían a ser configuraciones simples con columnas y acciones definidas.

---

### Fase 4 — Refactorización de modales (4-5 días)

#### [NEW] `Frontend/src/components/modals/CrudModal.tsx` — Modal base

```typescript
interface CrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: () => Promise<void>;
  loading?: boolean;
  mode: 'create' | 'edit' | 'view';
  children: React.ReactNode;
}
```

Los 59 modales actuales se reducirían significativamente.

#### Eliminar modales duplicados detectados:
- `AddActivityModal.tsx` vs `AgregarActividadTecnicaModal.tsx` — revisar cuál se usa
- `AddBudgetModal.tsx` vs `AgregarPresupuestoModal.tsx` — revisar cuál se usa
- `AddEvidenceModal.tsx` vs `AgregarEvidenciaTecnicaModal.tsx` — revisar cuál se usa

#### Corregir `ordenTable.tsx`
- Eliminar estado duplicado `editModalOpen` (solo mantener `isEditModalOpen`)
- Eliminar función duplicada `handleEdit` (solo mantener `handleEditClick`)
- Reemplazar `confirm()` nativo con modal de confirmación accesible

---

### Fase 5 — Correcciones de accesibilidad WCAG (3-4 días)

#### Prioridad Alta (WCAG 2.1 AA)

1. **Focus trap en modales** — Implementar usando `@headlessui/react Dialog` (ya instalado) o `focus-trap-react`

2. **Labels asociadas a inputs** — Agregar `id` a todos los `<select>`, `<input>`, `<textarea>` y `htmlFor` correspondiente en `<Label>`

3. **`lang="es"` en HTML** — Agregar a `layout.tsx`

4. **Eliminar `confirm()` del navegador** — Reemplazar con `<ConfirmDialog>` accesible con:
   - `role="alertdialog"` 
   - `aria-labelledby`, `aria-describedby`
   - Focus automático en botón de confirmar

5. **Mensajes de error accesibles** — Eliminar emojis de mensajes de error, agregar `role="alert"` o `aria-describedby` en campo de error

6. **Botones de icono** — Verificar que TODOS tengan `aria-label` descriptivo

7. **Alt text en imágenes** — Texto descriptivo para evidencias técnicas, `alt=""` para decorativas

8. **`aria-live` en toasts** — Configurar `react-toastify` con `role="status"` / `role="alert"` según urgencia

#### Prioridad Media

9. **`<caption>` en tablas** — Agregar a todas las tablas

10. **Indicador de foco visible** — Eliminar `focus:outline-none` sin reemplazo, usar `focus-visible:ring-2`

11. **Asterisco en campos obligatorios** — Agregar `<span aria-hidden="true">*</span>` y leyenda "* Campo obligatorio" en formularios

12. **Jerarquía de encabezados** — Revisar estructura h1→h2→h3 en modales

13. **Idioma consistente** — Verificar que no haya mezcla castellano/inglés en mensajes de usuario

---

### Fase 6 — Limpieza y mejoras menores del Backend (2-3 días)

1. **Eliminar `console.log` de producción** — `orders.controller.ts:230,238` y similares → usar un logger estructurado (`Logger` de NestJS)

2. **Corregir doble `@Auth()`** — Quitar los decoradores `@Auth()` redundantes a nivel de método cuando ya hay uno a nivel de clase

3. **Eliminar `findAll()` método muerto** — `orders.service.ts:214-228`

4. **Corregir `getDefaultEstadoOrden()`** — Arreglar el bug de `Promise || Promise`

5. **Eliminar una de las dos librerías de bcrypt** — Solo mantener `bcryptjs`

6. **Eliminar `sib-api-v3-sdk`** — Solo mantener `@getbrevo/brevo`

7. **Remover archivos `.md` de `/src`** — Moverlos a `/Documentacion`

8. **Cargar estados desde la BD** en el filtro de orden en lugar de IDs hardcodeados — usar `useEstadoOrden()` hook ya existente

---

## ⚠️ Consideraciones Importantes

> [!CAUTION]
> `synchronize: true` debe desactivarse **antes** de IR a producción. Si ya está en producción, hacerlo con cuidado porque requiere crear migraciones TypeORM primero.

> [!WARNING]
> Las fases 2, 3 y 4 son grandes refactorizaciones. Se recomienda hacer feature branches separados y probar cada módulo antes de mergear.

> [!IMPORTANT]
> Los tests end-to-end de WCAG deben hacerse con herramientas como **axe-core** (extensión de Chrome) y pruebas manuales con lector de pantalla (NVDA/VoiceOver) antes de declarar el nivel AA alcanzado.

---

## 📊 Estimación de Esfuerzo

| Fase | Descripción | Días estimados | Impacto |
|------|-------------|---------------|---------|
| 1 | Infraestructura compartida y tipos | 3-4 | Alto |
| 2 | Refactorización de hooks | 4-5 | Muy Alto |
| 3 | Refactorización de tablas | 3-4 | Alto |
| 4 | Refactorización de modales | 4-5 | Alto |
| 5 | Correcciones WCAG | 3-4 | Alto (evaluación) |
| 6 | Limpieza backend | 2-3 | Medio |
| **Total** | | **~19-25 días** | |

---

## ❓ Preguntas Abiertas para el Usuario

> [!IMPORTANT]
> **Pregunta 1**: ¿El sistema ya está en producción con datos reales? Esto afecta directamente cómo manejamos el cambio de `synchronize: true`.
TODO ESTA EN LOCAL AUN

> [!IMPORTANT]  
> **Pregunta 2**: ¿Quieres ejecutar todas las fases o priorizar alguna? Por ejemplo, si la evaluación de accesibilidad es inminente, la Fase 5 debería ir primero.
NO HAY PROBLEMA VAMOS EN ORDEN COMO PLANTEASTE PARA NO PERDERNOS

> [!IMPORTANT]
> **Pregunta 3**: Los modales duplicados (`AddActivityModal` vs `AgregarActividadTecnicaModal`, etc.) — ¿cuál es el que está actualmente en uso? ¿O ambos se usan desde distintas páginas?
Me parece que se usaban en distintas

> [!IMPORTANT]
> **Pregunta 4**: ¿Hay un criterio para elegir entre los tres paquetes de iconos (`@mui/icons-material`, `@heroicons/react`, `lucide-react`)? ¿O se puede estandarizar a uno solo?
Puedes elegir elq eusea mas completo 