# 🔐 REFERENCIA RÁPIDA - ROLES Y PERMISOS

## Tu Sistema de Roles

Tu aplicación tiene **5 roles** con los siguientes permisos predefinidos (automáticos al ejecutar `npm run seed:run`):

---

## 📋 TABLA DE REFERENCIA

```
┌────┬──────────────┬───────────┬─────────────────────────────────────┐
│ ID │ NOMBRE       │ SLUG      │ PERMISOS ASIGNADOS                  │
├────┼──────────────┼───────────┼─────────────────────────────────────┤
│ 1  │ Administrado │ admin     │ ✓ TODOS (acceso completo)           │
│    │ r            │           │   - orders.* (all)                  │
│    │              │           │   - users.* (all)                   │
│    │              │           │   - roles.manage                    │
│    │              │           │   - permissions.manage              │
│    │              │           │   - presupuestos.* (all)            │
│    │              │           │   - inventario.* (all)              │
│    │              │           │   - reportes.* (all)                │
│    │              │           │   - notificaciones.* (all)          │
├────┼──────────────┼───────────┼─────────────────────────────────────┤
│ 2  │ Técnico      │ tech      │ ✓ Ejecución de órdenes              │
│    │              │           │   - orders.view                     │
│    │              │           │   - orders.update                   │
│    │              │           │   - presupuestos.view               │
│    │              │           │   - inventario.view                 │
│    │              │           │   - notificaciones.view             │
├────┼──────────────┼───────────┼─────────────────────────────────────┤
│ 3  │ Recepcionista│ recep     │ ✓ Gestión de entrada                │
│    │              │           │   - orders.view                     │
│    │              │           │   - orders.create                   │
│    │              │           │   - users.view                      │
│    │              │           │   - presupuestos.view               │
│    │              │           │   - notificaciones.send             │
│    │              │           │   - notificaciones.view             │
├────┼──────────────┼───────────┼─────────────────────────────────────┤
│ 4  │ Cliente      │ client    │ ✓ Acceso limitado                   │
│    │              │           │   - orders.view                     │
│    │              │           │   - presupuestos.view               │
│    │              │           │   - notificaciones.view             │
├────┼──────────────┼───────────┼─────────────────────────────────────┤
│ 5  │ User         │ user      │ ✓ Usuario genérico                  │
│    │              │           │   - notificaciones.view             │
└────┴──────────────┴───────────┴─────────────────────────────────────┘
```

---

## 🔒 CÓMO USAR EN CONTROLADORES

### Proteger por Rol (usando tu enum)

```typescript
import { Role } from './common/enums/rol.enum';
import { Roles } from './decorators/roles.decorator';
import { AuthGuard } from './auth/guard/auth.guard';
import { RolesGuard } from './auth/guard/roles.guard';

@Controller('orders')
@UseGuards(AuthGuard, RolesGuard)
export class OrdersController {
  
  // Solo Administrador
  @Get('admin-dashboard')
  @Roles(Role.ADMIN)
  getAdminDashboard() {
    return { data: 'Datos administrativos' };
  }

  // Técnico o Administrador
  @Get()
  @Roles(Role.TECH, Role.ADMIN)
  getOrders() {
    return { orders: [] };
  }

  // Recepcionista o Administrador
  @Post()
  @Roles(Role.RECEP, Role.ADMIN)
  createOrder(@Body() dto: CreateOrderDto) {
    return { order: 'creada' };
  }
}
```

---

## 🎯 PERMISOS GRANULARES

Además de roles, puedes proteger por **permisos específicos**:

```typescript
import { RequirePermissions } from './decorators/permissions.decorator';
import { PermissionsGuard } from './auth/guard/permissions.guard';

@Controller('presupuestos')
@UseGuards(AuthGuard, PermissionsGuard)
export class PresupuestosController {
  
  // Ver presupuestos
  @Get()
  @RequirePermissions('presupuestos.view')
  getPresupuestos() { }

  // Crear presupuestos
  @Post()
  @RequirePermissions('presupuestos.create')
  createPresupuesto(@Body() dto: CreatePresupuestoDto) { }

  // Aprobar presupuestos (solo admin puede hacerlo)
  @Patch(':id/approve')
  @RequirePermissions('presupuestos.approve')
  approvePresupuesto(@Param('id') id: string) { }
}
```

---

## 📝 PERMISOS COMPLETOS DISPONIBLES

```
ÓRDENES:
  ✓ orders.view
  ✓ orders.create
  ✓ orders.update
  ✓ orders.delete

USUARIOS:
  ✓ users.view
  ✓ users.create
  ✓ users.update
  ✓ users.delete

ROLES Y PERMISOS:
  ✓ roles.manage
  ✓ permissions.manage

PRESUPUESTOS:
  ✓ presupuestos.view
  ✓ presupuestos.create
  ✓ presupuestos.update
  ✓ presupuestos.delete
  ✓ presupuestos.approve

INVENTARIO:
  ✓ inventario.view
  ✓ inventario.manage

REPORTES:
  ✓ reportes.view
  ✓ reportes.export

NOTIFICACIONES:
  ✓ notificaciones.send
  ✓ notificaciones.view
```

---

## 🔄 FLUJO DE ASIGNACIÓN DE ROLES

### 1. Crear Usuario
```bash
POST /api/v1/auth/register
{
  "cedula": "1234567890",
  "nombre": "Juan",
  "correo": "juan@tech.com",
  "password": "Seguro123!",
  "telefono": "0987654321",
  "ciudad": "Quito",
  "role": "User"  # Rol inicial (del enum)
}
```

### 2. Asignar Rol Nuevo
```bash
POST /api/v1/user-roles/5/assign/2
# Asigna el rol ID 2 (Técnico) al usuario ID 5
```

### 3. Obtener Roles del Usuario
```bash
GET /api/v1/user-roles/user/5
# Retorna todos los roles del usuario 5
```

### 4. Remover Rol
```bash
DELETE /api/v1/user-roles/5/remove/2
# Remueve el rol ID 2 (Técnico) del usuario ID 5
```

---

## 💡 EJEMPLOS PRÁCTICOS

### Ejemplo 1: Solo Técnicos pueden actualizar órdenes
```typescript
@Patch(':id')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.TECH, Role.ADMIN)
updateOrder(
  @Param('id') id: string,
  @Body() dto: UpdateOrderDto
) {
  return this.ordersService.update(id, dto);
}
```

### Ejemplo 2: Solo admins pueden ver estadísticas
```typescript
@Get('statistics')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
getStatistics() {
  return { stats: 'datos' };
}
```

### Ejemplo 3: Recepcionistas pueden crear órdenes
```typescript
@Post()
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.RECEP, Role.ADMIN)
createOrder(@Body() dto: CreateOrderDto) {
  return this.ordersService.create(dto);
}
```

### Ejemplo 4: Con permisos granulares
```typescript
@Patch(':id/approve')
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermissions('presupuestos.approve')
approvePresupuesto(@Param('id') id: string) {
  return { message: 'Aprobado' };
}
```

---

## 🚀 INICIAR SISTEMA

```bash
# 1. Cargar roles y permisos predefinidos
npm run seed:run

# 2. Iniciar servidor
npm run start:dev

# 3. Probar endpoints en Postman
# GET http://localhost:3000/api/v1/roles
```

---

## 🎓 MAPPING DEL ENUM

Tu enum `Role` se mapea a los slugs así:

```typescript
export enum Role {
  USER = 'User'           → slug: 'user'
  ADMIN = 'Administrador' → slug: 'admin'
  TECH = 'Técnico'        → slug: 'tech'
  CLIENT = 'Cliente'      → slug: 'client'
  RECEP = 'Recepcionista' → slug: 'recep'
}
```

---

## ⚙️ CONFIGURACIÓN POR MÓDULO

Para **cada módulo** de tu aplicación, sigue este patrón:

```typescript
// 1. Importa los guards y decorators
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/common/enums/rol.enum';

// 2. Aplica guards a controlador
@Controller('mi-recurso')
@UseGuards(AuthGuard, RolesGuard)
export class MiRecursoController {
  
  // 3. Protege rutas con @Roles
  @Get()
  @Roles(Role.ADMIN, Role.TECH)
  getRecursos() { }
}
```

---

## ✅ CHECKLIST DE SETUP

- [ ] Ejecutar `npm run seed:run`
- [ ] Verificar que se crearon 5 roles
- [ ] Verificar que se crearon 20+ permisos
- [ ] Crear usuario de prueba
- [ ] Asignar rol a usuario
- [ ] Logear y probar acceso
- [ ] Proteger una ruta con @Roles
- [ ] Proteger una ruta con @RequirePermissions
- [ ] Leer documentación completa

---

## 📞 REFERENCIA RÁPIDA DE COMANDOS

```bash
# Ver roles
curl http://localhost:3000/api/v1/roles

# Ver permisos
curl http://localhost:3000/api/v1/permissions

# Ver roles de un usuario
curl http://localhost:3000/api/v1/user-roles/user/5

# Crear un permiso
curl -X POST http://localhost:3000/api/v1/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"nombre":"Mi Permiso","slug":"mi.permiso"}'

# Asignar rol a usuario
curl -X POST http://localhost:3000/api/v1/user-roles/5/assign/2 \
  -H "Authorization: Bearer {token}"
```

---

**Fecha de creación:** 30 de Enero de 2026  
**Estado:** ✅ ACTUALIZADO PARA TUS ROLES  
**Versión:** 1.0 - Alineado con tu enum
