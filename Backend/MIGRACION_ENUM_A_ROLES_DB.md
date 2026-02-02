# 🔄 MIGRACIÓN - De Rol ENUM a Sistema Flexible de Roles

## 📊 ANTES vs DESPUÉS

### ANTES (Solo Enum)
```typescript
// Roles hardcodeados
export enum Role {
  USER = 'User',
  ADMIN = 'Administrador',
  TECH = 'Técnico',
  CLIENT = 'Cliente',
  RECEP = 'Recepcionista'
}

// Protección básica por rol
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
getAdmin() { }

// ❌ Limitaciones:
// - No hay permisos granulares
// - Un usuario solo puede tener UN rol (desde enum)
// - Difícil de escalar
// - No hay control fino de acceso
```

### DESPUÉS (Sistema Flexible)
```typescript
// Roles en BD (flexibles)
@Entity('roles')
export class Rol {
  id: number;
  nombre: string;
  slug: string;
  rolePermissions: RolePermission[];
}

// Un usuario puede tener MÚLTIPLES roles
@Entity('user_roles')
export class UserRole {
  userId: number;
  roleId: number;  // ← Tabla de unión
}

// Permisos granulares
@Entity('permissions')
export class Permission {
  id: number;
  nombre: string;
  slug: string;  // ej: 'orders.create'
}

// ✅ Ventajas:
// - Permisos granulares
// - Múltiples roles por usuario
// - Completamente escalable
// - Control fino de acceso
```

---

## 🔀 CAMBIOS EN TU CÓDIGO

### 1. El Enum NO Desaparece
Mantiene su propósito pero ahora es complementario:

```typescript
// src/common/enums/rol.enum.ts
// ✅ SE MANTIENE IGUAL (para referencia)
export enum Role {
  USER = 'User',
  ADMIN = 'Administrador',
  TECH = 'Técnico',
  CLIENT = 'Cliente',
  RECEP = 'Recepcionista'
}
```

### 2. User Entity Cambios
```typescript
// ANTES
@Entity('users')
export class User {
  @Column({ type: 'enum', enum: Role })
  role: Role;  // ← Un solo rol
}

// DESPUÉS
@Entity('users')
export class User {
  @Column({ type: 'enum', enum: Role })
  role: Role;  // ← Se mantiene para compatibilidad

  @OneToMany(() => UserRole, ur => ur.user)
  userRoles: UserRole[];  // ← NUEVO: múltiples roles
}
```

### 3. Controladores - Cambia la Forma de Proteger

#### ANTES - Solo rol del enum
```typescript
@Get('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)  // ← Usa enum directamente
getAdmin() { }
```

#### DESPUÉS - Por rol en BD O por permiso
```typescript
// Opción A: Seguir usando enum (compatible)
@Get('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
getAdmin() { }

// Opción B: Usar roles de BD (más flexible)
@Get('admin')
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermissions('admin-dashboard')  // ← Permiso específico
getAdmin() { }

// Opción C: Combinar (máxima seguridad)
@Get('admin')
@UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN)
@RequirePermissions('admin-dashboard')
getAdmin() { }
```

---

## 🛠️ COMPATIBILIDAD HACIA ATRÁS

### ✅ Lo que SIGUE FUNCIONANDO

```typescript
// 1. Tu enum Role sigue existiendo
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
doSomething() { }

// 2. AuthGuard sigue igual
@UseGuards(AuthGuard)
protected() { }

// 3. JWT sigue igual
// Token contiene: { sub, correo, role }

// 4. Crear usuario sigue igual
POST /api/v1/auth/register
{
  "role": "Administrador"  // Sigue usando el enum
}
```

### ⚠️ Lo que CAMBIA (Nuevo)

```typescript
// 1. Nuevo: Múltiples roles por usuario
POST /api/v1/user-roles/5/assign/2
// Usuario 5 ahora tiene rol 2

// 2. Nuevo: Permisos granulares
@RequirePermissions('orders.create')
@UseGuards(PermissionsGuard)

// 3. Nuevo: Asignar permisos a roles
POST /api/v1/roles/2/permissions/1
// Rol 2 ahora tiene permiso 1

// 4. Nuevo: Seeders automáticos
npm run seed:run
```

---

## 🎯 PLAN DE MIGRACIÓN (Opcional)

Si quieres migrar GRADUALMENTE:

### FASE 1: Mantener (No cambiar nada)
```
✓ Sigue usando @Roles(Role.ADMIN)
✓ El enum funciona igual
✓ Todo es compatible
```

### FASE 2: Agregar (Nuevas funcionalidades)
```
✓ Agregar permisos granulares donde sea necesario
✓ Usar @RequirePermissions() en rutas nuevas
✓ Mantener @Roles() en rutas existentes
```

### FASE 3: Optimizar (Mejorar)
```
✓ Migrar rutas existentes a permisos
✓ Aprovechar múltiples roles por usuario
✓ Crear estructura de permisos por módulo
```

---

## 🚀 CÓMO EMPIEZA A FUNCIONAR

### Paso 1: Cargar Datos
```bash
npm run seed:run
```

Crea automáticamente:
- 5 roles (basados en tu enum)
- 20+ permisos
- Relaciones rol-permiso

### Paso 2: Usuario Actual
```
ANTES:
  User.role = 'Administrador' (del enum)

DESPUÉS:
  User.role = 'Administrador' (se mantiene)
  + User.userRoles = [
      { roleId: 1, rol: { permisos: [...] } }
    ]
```

### Paso 3: Verificar Acceso
```typescript
// El guard verifica:
if (user.role === Role.ADMIN) {
  // ✓ Acceso por enum (ANTES)
}

if (user.userRoles?.some(ur => ur.rol.id === 1)) {
  // ✓ Acceso por BD (DESPUÉS)
}
```

---

## 📈 EVOLUCIÓN DE ARQUITECTURA

```
Versión 1 (Tu sistema actual):
┌─────────────────────┐
│ User.role (enum)    │ ← Un solo rol hardcodeado
└──────────┬──────────┘
           │
           └─→ RolesGuard verifica

─────────────────────────────────────────

Versión 2 (Con sistema implementado):
┌─────────────────────┐
│ User.role (enum)    │ ← Se mantiene para compatibilidad
└──────────┬──────────┘
           │
           ├─→ RolesGuard verifica (ANTES)
           │
           └─┐
┌────────────▼──────────┐
│ User.userRoles (BD)   │ ← Múltiples roles nuevos
├───────────────────────┤
│ - roleId: 1           │
│ - roleId: 2           │
│ - roleId: 3 ...       │
└────────────┬──────────┘
             │
             └─→ PermissionsGuard verifica (NUEVO)
```

---

## ✅ CHECKLIST DE COMPATIBILIDAD

- ✅ Tu enum Role se mantiene
- ✅ Rutas existentes con @Roles siguen funcionando
- ✅ AuthGuard sin cambios
- ✅ JWT sin cambios
- ✅ Auth service sin cambios
- ✅ Crear usuario sigue igual
- ✅ Puedes usar AMBOS sistemas al mismo tiempo
- ✅ Migración gradual es posible

---

## 🎓 DECISIONES CLAVE

### ¿Por qué mantener el enum?
- **Compatibilidad:** Todo sigue funcionando
- **Referencia:** Documento claro de roles
- **Transición:** Permite migración gradual
- **Legacy:** No rompe código existente

### ¿Cuándo usar qué?

| Situación | Usar |
|-----------|------|
| Ruta existente | @Roles(Role.ADMIN) |
| Nueva ruta | @RequirePermissions('action.name') |
| Control fino | @RequirePermissions() |
| Múltiples roles | UserRoles + Permisos |
| Máxima seguridad | @Roles() + @RequirePermissions() |

---

## 🔗 RELACIÓN: ENUM vs BD

```
Enum Role (Estático):
  USER → 'User'
  ADMIN → 'Administrador'
  TECH → 'Técnico'
  CLIENT → 'Cliente'
  RECEP → 'Recepcionista'

Mapa a Roles en BD (Dinámico):
  admin (slug) ← admin (enum value) ✅
  tech (slug) ← TECH (enum value) ✅
  recep (slug) ← RECEP (enum value) ✅
  client (slug) ← CLIENT (enum value) ✅
  user (slug) ← USER (enum value) ✅

Cada uno en BD tiene:
  - ID único
  - Nombre
  - Descripción
  - Permisos asociados ← NUEVO
  - Múltiples asignaciones ← NUEVO
```

---

## 🚀 PRÓXIMAS MEJORAS (Opcionales)

Cuando estés listo:

1. **Crear permisos específicos** por módulo
2. **Implementar auditoría** de cambios de roles
3. **Caché de permisos** para optimizar
4. **Interface visual** para gestionar roles
5. **Migrar completamente** a sistema flexible

---

## 📝 RESUMEN

| Aspecto | ANTES | DESPUÉS |
|--------|-------|---------|
| Roles | Enum (5 fijos) | BD (ilimitados) |
| Roles por usuario | 1 (del enum) | N (múltiples) |
| Permisos | No hay | Granulares |
| Protección | Por rol | Por rol O permiso |
| Escalabilidad | Limitada | Completa |
| Compatibilidad | - | 100% con anterior |

**Lo mejor:** Puedes usar AMBOS sistemas en paralelo. Migración sin presión.

---

**Creado:** 30 de Enero de 2026  
**Estado:** ✅ COMPATIBLE CON TU CÓDIGO EXISTENTE
