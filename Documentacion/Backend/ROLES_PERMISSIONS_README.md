# 🔐 Sistema de Roles y Permisos - Documentación

## Descripción General

Este es un sistema completo de **Roles y Permisos** basado en la arquitectura de **Spatie Laravel** pero implementado en **NestJS**. Permite un control granular de acceso a los recursos de la aplicación.

## 📋 Estructura

### Entidades Principales

#### 1. **Permission** (Permiso)
```typescript
@Entity('permissions')
export class Permission {
  id: number;
  nombre: string;        // Ej: "Ver Órdenes"
  slug: string;          // Ej: "orders.view" (identificador único)
  descripcion: string;   // Descripción del permiso
  createdAt: Date;
  updatedAt: Date;
}
```

#### 2. **Rol** (Rol)
```typescript
@Entity('roles')
export class Rol {
  id: number;
  nombre: string;        // Ej: "Administrador"
  slug: string;          // Ej: "admin" (identificador único)
  descripcion: string;   // Descripción del rol
  activo: boolean;
  rolePermissions: RolePermission[];  // Permisos asignados
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3. **RolePermission** (Asignación Rol-Permiso)
```typescript
@Entity('role_permissions')
export class RolePermission {
  id: number;
  roleId: number;
  permissionId: number;
  role: Rol;             // Relación
  permission: Permission; // Relación
}
```

#### 4. **UserRole** (Asignación Usuario-Rol)
```typescript
@Entity('user_roles')
export class UserRole {
  id: number;
  userId: number;
  roleId: number;
  user: User;
  rol: Rol;
}
```

## 🚀 Uso

### 1. Crear Permisos

**POST** `/api/v1/permissions`
```json
{
  "nombre": "Ver Órdenes",
  "slug": "orders.view",
  "descripcion": "Permite visualizar las órdenes"
}
```

### 2. Crear Roles con Permisos

**POST** `/api/v1/roles`
```json
{
  "nombre": "Técnico",
  "slug": "technician",
  "descripcion": "Rol para técnicos",
  "permissionIds": [1, 2, 3]
}
```

### 3. Asignar Roles a Usuarios

**POST** `/api/v1/user-roles`
```json
{
  "userId": 5,
  "roleId": 2
}
```

O usando el endpoint directo:
**POST** `/api/v1/user-roles/:userId/assign/:roleId`

### 4. Proteger Rutas por Rol

```typescript
import { Roles } from '../decorators/roles.decorator';


@Get('admin-only')
@Roles('admin')
adminEndpoint() {
  return 'Solo admin';
}
```

### 5. Proteger Rutas por Permiso

```typescript
import { RequirePermissions } from '../decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guard/permissions.guard';

@Get('orders')
@RequirePermissions(['orders.view', 'orders.create'])
@UseGuards(PermissionsGuard)
getOrders() {
  return 'Listado de órdenes';
}
```

## 🔒 Guards Disponibles

### 1. **AuthGuard** - Verificación de Autenticación
Valida que el usuario tenga un JWT válido.

### 2. **RolesGuard** - Verificación de Roles
Valida que el usuario tenga uno de los roles especificados.

```typescript
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin', 'tech')
@Get()
getData() {}
```

### 3. **PermissionsGuard** - Verificación de Permisos
Valida que el usuario tenga uno de los permisos requeridos.

```typescript
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermissions('orders.create')
@Post()
createOrder() {}
```

## 📦 Seeders

### Ejecutar Seeder

```bash
npm run seed:run
```

El seeder crea automáticamente:

**Roles Predefinidos:**
- 👑 Administrador - Acceso total
- 👨‍💼 Gerente Técnico - Gestión de órdenes
- 🔧 Técnico - Ejecución de órdenes
- 📞 Recepcionista - Gestión de clientes
- 👤 Cliente - Acceso limitado

**Permisos Predefinidos:**
- `orders.view`, `orders.create`, `orders.update`, `orders.delete`
- `users.view`, `users.create`, `users.update`, `users.delete`
- `roles.manage`, `permissions.manage`
- `presupuestos.view`, `presupuestos.create`, `presupuestos.update`, `presupuestos.delete`, `presupuestos.approve`
- `inventario.view`, `inventario.manage`
- `reportes.view`, `reportes.export`
- `notificaciones.send`, `notificaciones.view`

## 🎯 Servicios Principales

### **PermissionsService**
```typescript
- create(createPermissionDto)           // Crear permiso
- findAll()                             // Listar todos
- findOne(id)                           // Obtener por ID
- findBySlug(slug)                      // Obtener por slug
- update(id, updatePermissionDto)       // Actualizar
- remove(id)                            // Eliminar
```

### **RolService**
```typescript
- create(createRolDto)                  // Crear rol con permisos
- findAll()                             // Listar todos
- findOne(id)                           // Obtener por ID
- findBySlug(slug)                      // Obtener por slug
- update(id, updateRolDto)              // Actualizar
- remove(id)                            // Eliminar
- assignPermissions(roleId, permIds)    // Asignar permisos
- getPermissions(roleId)                // Obtener permisos del rol
- hasPermission(roleId, slug)           // Verificar si tiene permiso
```

### **UsuarioRolService**
```typescript
- create(createUsuarioRolDto)           // Asignar rol a usuario
- findAll()                             // Listar todas asignaciones
- findOne(id)                           // Obtener por ID
- findByUserId(userId)                  // Obtener roles del usuario
- update(id, updateUsuarioRolDto)       // Actualizar asignación
- remove(id)                            // Remover asignación
- assignRoleToUser(userId, roleId)      // Asignar rol
- removeRoleFromUser(userId, roleId)    // Remover rol
```

## 🔄 Flujo de Autenticación y Autorización

```
1. Usuario inicia sesión
   ↓
2. Se genera JWT con información del usuario
   ↓
3. Al acceder a ruta protegida:
   a. AuthGuard valida el JWT
   b. Se cargan los roles del usuario
   c. Se validan los permisos según el guard
   d. Si hay permisos, se permite el acceso
   e. Si no, se retorna 403 Forbidden
```

## 📝 Ejemplo Completo

### 1. Crear un Permiso
```bash
POST /api/v1/permissions
{
  "nombre": "Crear Órdenes",
  "slug": "orders.create"
}
```

### 2. Crear un Rol
```bash
POST /api/v1/roles
{
  "nombre": "Técnico",
  "slug": "tech",
  "permissionIds": [1, 2]
}
```

### 3. Asignar a Usuario
```bash
POST /api/v1/user-roles
{
  "userId": 5,
  "roleId": 2
}
```

### 4. Proteger Endpoint
```typescript
@Post('orders')
@UseGuards(AuthGuard, RolesGuard)
@Roles('tech', 'admin')
createOrder(@Body() createOrderDto: CreateOrderDto) {
  return this.ordersService.create(createOrderDto);
}
```

## 🛠️ Configuración Avanzada

### Múltiples Permisos (OR)
```typescript
@RequirePermissions(['orders.create', 'orders.update'])
// Usuario necesita al menos UNO de estos permisos
```

### Combinación de Guards
```typescript
@UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin', 'tech')
@RequirePermissions('orders.create')
createOrder() {}
```

## 📊 Relaciones de Base de Datos

```
Users
  ↓ (1:N)
UserRoles
  ↓
Roles ← → RolePermissions → ← Permissions
```

## ✅ Checklist de Implementación

- ✅ Entidades de permisos y roles
- ✅ Servicios de gestión
- ✅ Guards de autenticación
- ✅ Decorators para protección
- ✅ Seeders de datos iniciales
- ✅ Controladores con rutas
- ✅ DTOs con validación

## 🚀 Próximos Pasos

1. Ejecutar `npm install` para instalar dependencias
2. Ejecutar `npm run seed:run` para inicializar datos
3. Crear endpoints en las rutas protegidas
4. Personalizar permisos según tus necesidades
