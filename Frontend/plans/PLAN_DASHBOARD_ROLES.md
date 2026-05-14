# Plan de Implementación de Dashboards por Rol

## 1. Objetivo
Implementar dashboards para los roles `admin`, `client`, `tech` y `recep` en backend y frontend, manteniendo coherencia con el diseño actual del aplicativo (estructura, tipografía, cards, tablas, modales, estados de carga, colores y modo oscuro).

## 2. Alcance Funcional

### Roles a cubrir
- Admin: vista ejecutiva y operativa global.
- Técnico: carga de trabajo técnica, actividades pendientes y productividad.
- Recepcionista: flujo de recepción, creación/seguimiento de órdenes y atención.
- Cliente: estado de sus órdenes, presupuestos y notificaciones.

### Qué incluye
- Endpoints backend de métricas y actividad reciente por rol.
- Pantallas frontend de dashboard por rol.
- Componentes compartidos para no duplicar UI.
- Control de acceso por rol y validación de permisos.
- Estados de carga, vacío y error homogéneos con el resto del sistema.

### Qué no incluye (en esta fase)
- BI avanzado externo.
- Exportaciones complejas (PDF/Excel) del dashboard.
- Nuevos roles adicionales.

## 3. Principios de Diseño (obligatorio)
Para cumplir “mismo diseño que tenemos en el aplicativo”, se debe:

1. Reusar componentes base existentes (cards, tablas, badges, botones, breadcrumbs, modal, skeletons).
2. Mantener layout actual: sidebar + contenido principal + espaciados consistentes.
3. Conservar patrones de interacción actuales:
   - filtros arriba,
   - KPIs en grid responsivo,
   - tabla/listado de recientes,
   - acciones rápidas visibles.
4. Respetar clases y tokens visuales existentes (incluyendo dark mode).
5. Evitar nuevas librerías visuales si no son estrictamente necesarias.

## 4. Arquitectura Propuesta

## 4.1 Backend (NestJS + TypeORM)

### 4.1.1 Nuevo módulo de dashboard
- Crear módulo Dashboard con:
  - controlador de dashboards,
  - servicio de agregaciones,
  - tipos/DTO de respuesta por rol.

### 4.1.2 Endpoints recomendados
- GET /api/v1/dashboard/me
  - Resuelve automáticamente dashboard según rol del usuario autenticado.
- GET /api/v1/dashboard/admin
- GET /api/v1/dashboard/tech
- GET /api/v1/dashboard/recep
- GET /api/v1/dashboard/client

Recomendación: usar `dashboard/me` como endpoint principal del frontend y dejar los endpoints por rol para pruebas internas, monitoreo o uso explícito.

### 4.1.3 Datos mínimos por rol

- Admin
  - KPIs: órdenes totales, órdenes por estado, ingresos estimados, presupuestos aprobados, tickets retrasados.
  - Operación: órdenes recientes, top técnicos, alertas de inventario bajo.

- Técnico
  - KPIs: órdenes asignadas, en progreso, vencidas, actividades del día.
  - Operación: lista de órdenes asignadas con prioridad y fecha prometida.

- Recepcionista
  - KPIs: órdenes creadas hoy, pendientes de recepción, clientes atendidos, equipos recibidos.
  - Operación: últimas órdenes registradas, cola de recepción.

- Cliente
  - KPIs: mis órdenes activas, presupuestos pendientes, presupuestos aprobados, notificaciones nuevas.
  - Operación: últimas actualizaciones de sus órdenes.

### 4.1.4 Seguridad
- Proteger endpoints con guardas ya existentes.
- Mantener validación por rol (`admin`, `tech`, `recep`, `client`).
- En `dashboard/client`, garantizar filtro por usuario autenticado (nunca datos globales).

### 4.1.5 Rendimiento
- Consultas agregadas con índices existentes y joins mínimos.
- Agregaciones por rango temporal (hoy, 7 días, 30 días) parametrizables.
- Considerar caché corto (30-120 s) para dashboard admin.

## 4.2 Frontend (Next.js + React)

### 4.2.1 Estructura funcional
- Ruta principal de dashboard resuelta por sesión/rol.
- Un contenedor común y secciones específicas por rol.
- Hook único para consumo de dashboard (`useDashboard`) con estrategia por rol.

### 4.2.2 Componentes UI recomendados
- DashboardShell (encabezado, filtros y layout consistente).
- KpiCard (tarjetas métricas homogéneas).
- DashboardChartSection (gráficas simples con librería ya usada en proyecto).
- RecentActivityTable (actividad reciente reutilizable).
- QuickActionsPanel (acciones rápidas por rol).
- EmptyStateDashboard y ErrorStateDashboard reutilizables.

### 4.2.3 Comportamiento por rol
- Admin: panel completo (KPI + gráficas + tablas + alertas).
- Técnico: foco en tareas asignadas y pendientes inmediatos.
- Recepcionista: foco en recepción y creación/seguimiento rápido.
- Cliente: foco en visibilidad y trazabilidad de su servicio.

### 4.2.4 Responsividad
- Móvil: cards en columna, tablas resumidas y acciones prioritarias.
- Tablet/desktop: grillas de 2-4 columnas y tablas completas.

## 5. Contratos de API (propuesta inicial)

## 5.1 Response base
- role: string
- range: string
- generatedAt: string
- kpis: lista de métricas
- charts: series para visualización
- recent: actividad reciente
- alerts: alertas funcionales

## 5.2 KPI item
- key
- label
- value
- delta (opcional)
- trend (up/down/neutral)

## 6. Plan de Implementación por Fases

### Fase 0: Descubrimiento y alineación (0.5-1 día)
- Inventario de componentes actuales reutilizables.
- Definir métricas finales por rol con negocio.
- Validar permisos y alcance de datos sensibles.

Entregable:
- Documento de métricas aprobadas por rol.

### Fase 1: Backend base (1-2 días)
- Crear módulo dashboard.
- Implementar `GET /dashboard/me`.
- Implementar endpoint admin (más completo) y cliente (más restringido).
- Pruebas unitarias de servicio (agregaciones y filtros por usuario).

Entregable:
- Endpoints funcionando con datos reales y contratos estables.

### Fase 2: Backend completo por rol (1-2 días)
- Implementar tech y recep.
- Ajustar agregaciones y filtros por estado/rango.
- Hardening de seguridad y validaciones de acceso.

Entregable:
- Cobertura completa backend para 4 roles.

### Fase 3: Frontend base y layout común (1-2 días)
- Crear DashboardShell + KpiCard + estados loading/empty/error.
- Integrar `useDashboard` con `dashboard/me`.
- Render de dashboard según rol autenticado.

Entregable:
- Dashboard navegable por rol con estilo consistente.

### Fase 4: Visualización y operación por rol (1-2 días)
- Completar secciones específicas: tablas recientes, alertas y acciones rápidas.
- Integrar gráficas con estilos existentes.
- Ajustes de UX en responsive.

Entregable:
- Dashboards funcionales por rol listos para QA.

### Fase 5: QA, hardening y salida a producción (1 día)
- QA funcional por rol.
- QA visual y de coherencia con diseño actual.
- Pruebas de seguridad (acceso indebido por rol).
- Ajustes finales y checklist de release.

Entregable:
- Versión lista para despliegue.

## 7. Criterios de Aceptación

### Backend
- Cada rol recibe solo sus datos autorizados.
- `dashboard/me` responde correctamente según sesión.
- Tiempo de respuesta aceptable en dashboard (objetivo inicial: < 600 ms en consultas habituales).

### Frontend
- Vista de dashboard correcta para admin, tech, recep y client.
- Coherencia visual con páginas actuales (cards, tablas, botones, spacing, dark mode).
- Responsive en móvil/tablet/desktop sin quiebres críticos.

### Seguridad
- Un cliente no puede ver datos globales.
- Un técnico no ve métricas administrativas globales.
- Recepcionista solo ve información operativa permitida.

## 8. Riesgos y Mitigaciones
- Riesgo: métricas ambiguas por rol.
  - Mitigación: validación temprana de catálogo de KPIs (Fase 0).

- Riesgo: consultas pesadas para admin.
  - Mitigación: agregaciones optimizadas, rangos limitados y caché corto.

- Riesgo: desviación visual del diseño actual.
  - Mitigación: reutilizar componentes existentes y checklist de diseño en QA.

## 9. Checklist Técnico
- Definir DTOs de respuesta por rol.
- Definir política de filtros de fechas.
- Implementar endpoint `dashboard/me`.
- Implementar hooks y componentes compartidos en frontend.
- Crear pruebas unitarias backend y pruebas de integración básicas.
- Validar accesos por rol en QA manual.

## 10. Estimación Total
- Total estimado: 5.5 a 10 días hábiles (según complejidad de métricas y calidad de datos históricos).

## 11. Próximo Paso Recomendado
Iniciar Fase 0 con una sesión corta de definición de KPIs por rol (máximo 60 minutos) para bloquear contratos de API y evitar retrabajo en frontend.