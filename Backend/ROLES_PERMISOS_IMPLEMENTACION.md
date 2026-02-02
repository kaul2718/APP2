# 🎯 Sistema de Roles y Permisos - Resumen Rápido

## ¿Qué se implementó?

### 1️⃣ **Nuevas Entidades de Base de Datos**
```
┌─────────────────┐
│   Permission    │  Permisos individuales (ej: "orders.view")
└────────┬────────┘
         │ N:N
┌────────▼────────┐
│ RolePermission  │  Tabla de unión roles-permisos
└────────┬────────┘
         │ N:1
┌────────▼────────┐
│      Rol        │  Roles del sistema (Administrador, Técnico, etc)
└────────┬────────┘
         │ N:N
┌────────▼────────┐
│    UserRole     │  Tabla de unión usuarios-roles
└────────┬────────┘
         │ N:1
┌────────▼────────┐
│      User       │  Usuarios del sistema
└─────────────────┘
```

### 2️⃣ **Nuevos Módulos**
- `PermissionsModule` - Gestión de permisos
- `RolePermissionModule` - Relación roles-permisos
- `RolModule` (mejorado) - Gestión de roles
- `UsuarioRolModule` (mejorado) - Asignación usuarios-roles
- `SeederModule` - Carga inicial de datos

### 3️⃣ **Guards de Seguridad**
```typescript
AuthGuard         → ✓ Verifica JWT válido
   ↓
RolesGuard        → ✓ Verifica rol del usuario
   ↓
PermissionsGuard  → ✓ Verifica permisos del usuario
```

### 4️⃣ **Decoradores**
```typescript
@Roles(Role.ADMIN)                          // Proteger por rol
@RequirePermissions('orders.create')         // Proteger por permiso
```

### 5️⃣ **Servicios**

| Servicio | Función |
|----------|---------|
| `PermissionsService` | CRUD de permisos |
| `RolService` | CRUD de roles + asignación de permisos |
| `UsuarioRolService` | Asignación de roles a usuarios |
| `SeederService` | Carga inicial de datos |

## 🚀 Endpoints API

### 🔑 Permisos
```
POST   /api/v1/permissions              Crear permiso
GET    /api/v1/permissions              Listar permisos
GET    /api/v1/permissions/:id          Obtener permiso
PATCH  /api/v1/permissions/:id          Actualizar permiso
DELETE /api/v1/permissions/:id          Eliminar permiso
```

### 👑 Roles
```
POST   /api/v1/roles                    Crear rol con permisos
GET    /api/v1/roles                    Listar roles
GET    /api/v1/roles/:id                Obtener rol
PATCH  /api/v1/roles/:id                Actualizar rol
DELETE /api/v1/roles/:id                Eliminar rol
GET    /api/v1/roles/:roleId/permissions  Obtener permisos del rol
POST   /api/v1/roles/:roleId/permissions/:permissionId  Asignar permiso
```

### 👤 Usuarios-Roles
```
POST   /api/v1/user-roles               Asignar rol a usuario
GET    /api/v1/user-roles               Listar asignaciones
GET    /api/v1/user-roles/:id           Obtener asignación
GET    /api/v1/user-roles/user/:userId  Obtener roles del usuario
PATCH  /api/v1/user-roles/:id           Actualizar asignación
DELETE /api/v1/user-roles/:id           Remover asignación
POST   /api/v1/user-roles/:userId/assign/:roleId  Asignar rol
DELETE /api/v1/user-roles/:userId/remove/:roleId  Remover rol
```

## 📊 Roles Predefinidos (Seeder)

| Rol | Slug | Descripción | Permisos |
|-----|------|-------------|----------|
| 👑 **Administrador** | admin | Acceso total | Todos |
| 🔧 **Técnico** | tech | Ejecución de órdenes | Ver/editar órdenes, ver presupuestos e inventario |
| 📞 **Recepcionista** | recep | Gestión de clientes | Crear órdenes, ver usuarios, notificaciones |
| 👤 **Cliente** | client | Acceso limitado | Ver propias órdenes, presupuestos, notificaciones |
| 👥 **User** | user | Usuario genérico | Notificaciones |
| 👤 **Cliente** | Acceso limitado | Ver órdenes, presupuestos, notificaciones |

## 🔐 Ejemplo de Uso

### Paso 1: Ejecutar Seeder
```bash
npm run seed:run
```
✓ Crea roles predefinidos y permisos

### Paso 2: Asignar Rol a Usuario
```bash
POST /api/v1/user-roles
{
  "userId": 5,
  "roleId": 2
}
```

### Paso 3: Proteger Ruta
```typescript
@Post('orders')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.TECH)
createOrder(@Body() dto: CreateOrderDto) {
  return this.ordersService.create(dto);
}
```

O con permisos:
```typescript
@Get('orders')
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermissions('orders.view')
getOrders() {
  return this.ordersService.findAll();
}
```

## 🔄 Flujo de Autorización

```
Solicitud HTTP
    ↓
Verificar JWT (AuthGuard)
    ↓
Obtener datos del usuario (incluyendo roles)
    ↓
Verificar Rol si @Roles está presente (RolesGuard)
    ↓
Verificar Permiso si @RequirePermissions está presente (PermissionsGuard)
    ↓
✓ Permitir acceso o ✗ Denegar (403)
```

## 💾 Archivos Creados/Modificados

### ✨ Nuevos Archivos
- `src/permissions/` - Módulo completo de permisos
- `src/role-permission/` - Módulo de relación
- `src/user-role/entities/user-role.entity.ts` - Entidad
- `src/seeder/` - Seeders
- `src/decorators/permissions.decorator.ts` - Decorator de permisos
- `src/auth/guard/permissions.guard.ts` - Guard de permisos

### ♻️ Archivos Modificados
- `src/rol/` - Servicio, controlador, DTOs mejorados
- `src/usuario-rol/` - Servicio, controlador, DTOs mejorados
- `src/users/entities/user.entity.ts` - Añadida relación userRoles
- `src/app.module.ts` - Importados nuevos módulos

## 🎓 Ventajas del Sistema

✅ **Flexible** - Permisos granulares y altamente configurables
✅ **Escalable** - Fácil agregar nuevos roles y permisos
✅ **Seguro** - Multiple capas de validación
✅ **Eficiente** - Datos cacheados con eager loading
✅ **Similar a Spatie** - Arquitectura conocida en Laravel

## 📚 Documentación Completa
Ver: `src/ROLES_PERMISSIONS_README.md`
