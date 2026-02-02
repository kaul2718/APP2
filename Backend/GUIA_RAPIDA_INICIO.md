# 🚀 GUÍA RÁPIDA DE INICIO - SISTEMA DE ROLES Y PERMISOS

## ⏱️ 5 MINUTOS PARA EMPEZAR

### Paso 1: Iniciar Base de Datos (1 min)
```bash
# Verifica que tu BD está corriendo
# Revisa .env tiene credenciales correctas

# Variables requeridas en .env:
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_DATABASE=nombre_db
DB_SSL=false
```

### Paso 2: Cargar Datos Iniciales (1 min)
```bash
npm run seed:run
```

Esto crea automáticamente:
- 5 roles (Admin, Gerente, Técnico, Recepcionista, Cliente)
- 20+ permisos (orders.*, users.*, etc)
- Relaciones rol-permiso

### Paso 3: Probar con Postman (2 min)

#### 3.1 Registrar usuario
```http
POST http://localhost:3000/api/v1/auth/register
Content-Type: application/json

{
  "cedula": "1234567890",
  "nombre": "Juan Técnico",
  "correo": "juan@tech.com",
  "password": "Password123",
  "telefono": "0987654321",
  "ciudad": "Quito"
}
```

**Response:**
```json
{
  "id": 5,
  "nombre": "Juan Técnico",
  "correo": "juan@tech.com",
  "role": "Cliente"
}
```

#### 3.2 Asignar rol Técnico
```http
POST http://localhost:3000/api/v1/user-roles/5/assign/3
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "id": 12,
  "userId": 5,
  "roleId": 3,
  "createdAt": "2026-01-30T..."
}
```

#### 3.3 Logear usuario
```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "correo": "juan@tech.com",
  "password": "Password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 3.4 Acceder a ruta protegida
```http
GET http://localhost:3000/api/v1/orders
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ **Acceso concedido** (porque el usuario es técnico)

---

## 🔧 PROTEGER MIS RUTAS

### Opción A: Por Rol (Simple)
```typescript
import { Roles } from './decorators/roles.decorator';
import { Role } from './common/enums/rol.enum';
import { AuthGuard } from './auth/guard/auth.guard';
import { RolesGuard } from './auth/guard/roles.guard';

@Controller('orders')
@UseGuards(AuthGuard, RolesGuard)
export class OrdersController {
  
  // Solo ADMIN
  @Get('admin-stats')
  @Roles(Role.ADMIN)
  getAdminStats() {
    return { stats: 'datos' };
  }

  // ADMIN o TECH
  @Get()
  @Roles(Role.ADMIN, Role.TECH)
  getOrders() {
    return { orders: [] };
  }

  // Cualquiera autenticado
  @Get('my-orders')
  getMyOrders() {
    return { orders: [] };
  }
}
```

### Opción B: Por Permiso (Granular)
```typescript
import { RequirePermissions } from './decorators/permissions.decorator';
import { PermissionsGuard } from './auth/guard/permissions.guard';

@Controller('orders')
@UseGuards(AuthGuard, PermissionsGuard)
export class OrdersController {
  
  // Requiere permiso 'orders.view'
  @Get()
  @RequirePermissions('orders.view')
  getOrders() {
    return { orders: [] };
  }

  // Requiere permiso 'orders.create'
  @Post()
  @RequirePermissions('orders.create')
  createOrder(@Body() dto: CreateOrderDto) {
    return { order: 'creada' };
  }

  // Requiere UNO de estos permisos
  @Patch(':id')
  @RequirePermissions(['orders.update', 'orders.admin-update'])
  updateOrder(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto
  ) {
    return { order: 'actualizada' };
  }
}
```

### Opción C: Combinado (Máxima Seguridad)
```typescript
@UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.TECH)
@RequirePermissions('orders.manage')
@Delete(':id')
deleteOrder(@Param('id') id: string) {
  return { message: 'Eliminada' };
}
```

---

## 📋 CREAR NUEVOS PERMISOS

### Vía API
```http
POST http://localhost:3000/api/v1/permissions
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "nombre": "Crear Presupuestos",
  "slug": "presupuestos.create",
  "descripcion": "Permite crear nuevos presupuestos"
}
```

### O editar seeder y reejecutar
```typescript
// src/seeder/seeder.service.ts

private async seedPermissions() {
  const permissions = [
    // ... permisos existentes ...
    { nombre: 'Mi Nuevo Permiso', slug: 'custom.permission' },
  ];
  // ...
}
```

```bash
npm run seed:run
```

---

## 👥 CREAR NUEVOS ROLES

### Vía API
```http
POST http://localhost:3000/api/v1/roles
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "nombre": "Gerente de Ventas",
  "slug": "sales-manager",
  "descripcion": "Gestión de ventas",
  "permissionIds": [1, 5, 10]  // IDs de permisos
}
```

### O editar seeder
```typescript
// src/seeder/seeder.service.ts

private async seedRoles() {
  const rolePermissions = [
    // ... roles existentes ...
    {
      nombre: 'Mi Rol',
      slug: 'my-role',
      descripcion: 'Descripción',
      permissions: ['orders.view', 'custom.permission'],
    },
  ];
  // ...
}
```

---

## 🎯 FLUJO TÍPICO DE PROYECTO

### 1. Definir Permisos
```typescript
// src/seeder/seeder.service.ts

const permissions = [
  { nombre: 'Ver Reportes', slug: 'reports.view' },
  { nombre: 'Exportar Reportes', slug: 'reports.export' },
  { nombre: 'Crear Reportes', slug: 'reports.create' },
];
```

### 2. Definir Roles con Permisos
```typescript
const rolePermissions = [
  {
    nombre: 'Analista',
    slug: 'analyst',
    permissions: ['reports.view', 'reports.export'],
  },
  {
    nombre: 'Administrador Reportes',
    slug: 'reports-admin',
    permissions: ['reports.view', 'reports.export', 'reports.create'],
  },
];
```

### 3. Ejecutar Seeder
```bash
npm run seed:run
```

### 4. Proteger Controladores
```typescript
@Get()
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermissions('reports.view')
getReports() { }

@Post()
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermissions('reports.create')
createReport(@Body() dto: CreateReportDto) { }
```

### 5. Asignar Rol a Usuario
```bash
POST /api/v1/user-roles/{userId}/assign/{roleId}
```

---

## 📊 COMPARACIÓN: Antes vs Después

### ANTES (Solo Role enum)
```typescript
// Limitado a 5 roles fijos
@Roles(Role.ADMIN)
getAdmin() { }

// No hay permisos granulares
// Difícil de escalar
```

### DESPUÉS (Sistema flexible)
```typescript
// Roles ilimitados y configurables
@RequirePermissions('reports.export')
exportReports() { }

// Permisos específicos por acción
// Fácil de escalar
// Un usuario puede tener múltiples roles
```

---

## 🐛 SOLUCIONAR PROBLEMAS

### ❌ "403 Forbidden" sin razón
**Solución:**
```bash
# 1. Verifica token JWT
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer {token}"

# 2. Verifica si usuario tiene rol
GET /api/v1/user-roles/user/{userId}

# 3. Verifica si rol tiene permiso
GET /api/v1/roles/{roleId}/permissions

# 4. Verifica que permiso existe
GET /api/v1/permissions
```

### ❌ "RolService not found"
**Solución:**
```typescript
// app.module.ts
import { RolModule } from './rol/rol.module';

@Module({
  imports: [
    // ... otros imports ...
    RolModule,  // ← Asegúrate de importar
  ],
})
export class AppModule {}
```

### ❌ "Seeder no crea datos"
**Solución:**
```bash
# 1. Verifica BD conectada
psql -U postgres -d nombre_db

# 2. Ejecuta seeder
npm run seed:run

# 3. Revisa output para mensajes de error

# 4. Verifica datos creados
SELECT * FROM permissions;
SELECT * FROM roles;
```

### ❌ "No reconoce @Roles"
**Solución:**
```typescript
// Debe tener AMBOS guards
@UseGuards(AuthGuard, RolesGuard)  // ← Importantes
@Roles(Role.ADMIN)
getAdmin() { }
```

---

## 📚 DOCUMENTACIÓN DISPONIBLE

| Documento | Contenido |
|-----------|----------|
| `IMPLEMENTACION_COMPLETADA.md` | 📋 Resumen ejecutivo |
| `ROLES_PERMISOS_IMPLEMENTACION.md` | 📊 Diagramas y arquitectura |
| `DIAGRAMA_SISTEMA_ROLES.txt` | 🎨 Visualización completa |
| `src/ROLES_PERMISSIONS_README.md` | 📖 Documentación técnica |
| `src/EJEMPLOS_ROLES_PERMISOS.ts` | 💡 Ejemplos de código |

---

## ✅ CHECKLIST DE INICIO RÁPIDO

- [ ] BD conectada y corriendo
- [ ] `.env` con credenciales correctas
- [ ] `npm install` (si es primera vez)
- [ ] `npm run seed:run` (cargar roles)
- [ ] Probar login con Postman
- [ ] Asignar rol a usuario de prueba
- [ ] Proteger una ruta con @Roles
- [ ] Probar acceso con y sin permiso
- [ ] Leer documentación completa
- [ ] ¡Empezar a usar en proyecto!

---

## 🎓 CONCEPTO CLAVE

```
Usuario = Persona que accede
   ↓
UserRole = Asignación (usuario tiene rol)
   ↓
Rol = Grupo de permisos
   ↓
RolePermission = Asignación (rol tiene permiso)
   ↓
Permission = Acción específica permitida
```

---

## 🚀 ¡LISTO PARA EMPEZAR!

1. Ejecuta: `npm run seed:run`
2. Crea usuario: `POST /api/v1/auth/register`
3. Asigna rol: `POST /api/v1/user-roles/{id}/assign/{roleId}`
4. Protege ruta: `@RequirePermissions('action.name')`
5. ¡Disfruta del sistema! 🎉

---

**Para más ayuda:** Revisa `src/EJEMPLOS_ROLES_PERMISOS.ts`
