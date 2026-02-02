# 📋 Revisión y Correcciones - Migración de Roles Frontend/Backend

## 🔍 Problemas Identificados

Después de la migración de **Enum de Roles → Sistema Flexible de Roles en BD**, el frontend presentaba las siguientes incompatibilidades:

### **1. Enum de Roles Desactualizado**
- **Problema**: El frontend usaba valores del enum antiguo: `"Administrador"`, `"Técnico"`, `"Cliente"`, etc.
- **Backend retorna**: Slugs minúsculos desde BD: `"admin"`, `"tech"`, `"recep"`, `"client"`, `"user"`
- **Impacto**: Desajuste en comparaciones y filtrado de navegación

### **2. Navegación (navItems) Incompatible**
- **Problema**: `src/data/sidebar/navItems.tsx` comparaba roles con los valores antiguos del enum
- **Líneas afectadas**: 30+ referencias en el archivo
- **Impacto**: El menú lateral no filtraba correctamente los items según el rol del usuario

### **3. Hooks usando comparaciones incorrectas**
- **Archivo**: `useOrders.ts` - Líneas ~105-110
  - Comparaba `session.user.role === 'TECH'` (mayúsculas, valor antiguo)
  - Debería comparar con `'tech'` (minúsculas, slug de BD)
  - Lo mismo para `'CLIENT'` → `'client'`

- **Archivo**: `useSignUpFormHandler.ts` - Línea ~86
  - Asignaba rol como `"Cliente"` (valor antiguo)
  - Debería asignar `"client"` (slug de BD)

### **4. Respuesta de Login sin Role**
- **Problema**: Backend `auth.service.ts` método `login()` no retornaba el `role` del usuario
- **Tipo esperado** en frontend: `CustomLoginResponse` espera `role: string`
- **Impacto**: La sesión de NextAuth no tenía acceso al rol del usuario

---

## ✅ Cambios Realizados

### **1. Actualizar Types - Roles con slugs BD**
**Archivo**: `Frontend/src/types/role.ts`

```typescript
export enum Role {
    USER = 'user',
    ADMIN = 'admin',
    TECH = 'tech',
    CLIENT = 'client',
    RECEP = 'recep'
}

// Mapeo para mostrar nombres legibles en la UI
export const RoleDisplayNames: Record<Role, string> = {
    [Role.USER]: 'Usuario',
    [Role.ADMIN]: 'Administrador',
    [Role.TECH]: 'Técnico',
    [Role.CLIENT]: 'Cliente',
    [Role.RECEP]: 'Recepcionista'
}
```

**Cambios**:
- ✅ Valores del enum ahora coinciden con los slugs de BD
- ✅ Agregado mapeo `RoleDisplayNames` para mostrar nombres legibles en la UI

---

### **2. Corregir Navegación - navItems**
**Archivo**: `Frontend/src/data/sidebar/navItems.tsx`

**Cambios realizados** (14 items completamente actualizados):
- Dashboard: `["Administrador", "Técnico"]` → `["admin", "tech"]`
- Clientes: `["Administrador"]` → `["admin"]`
- Orden de Servicio: `["Administrador", "Técnico", "Cliente"]` → `["admin", "tech", "client"]`
- Actividad Técnica: `["Administrador", "Técnico"]` → `["admin", "tech"]`
- Equipos: `["Administrador", "Técnico"]` → `["admin", "tech"]`
- Casilleros: `["Administrador"]` → `["admin"]`
- Estados Orden: `["Administrador"]` → `["admin"]`
- Tipo Actividad Técnica: `["Administrador"]` → `["admin"]`
- Presupuestos: `["Administrador", "Técnico"]` → `["admin", "tech"]`
- Estado Presupuesto: `["Administrador"]` → `["admin"]`
- Tipo Mano Obra: `["Administrador"]` → `["admin"]`
- Inventario/Partes: `["Administrador", "Técnico"]` → `["admin", "tech"]`
- Tipo Notificación: `["Administrador"]` → `["admin"]`

**Impacto**: El menú lateral ahora filtra correctamente los items según el rol del usuario

---

### **3. Corregir useOrders Hook**
**Archivo**: `Frontend/src/hooks/useOrders.ts` (Líneas ~103-110)

**Antes**:
```typescript
if (session.user.role === 'TECH') {
    endpoint = 'tecnico/mis-ordenes';
    isRoleSpecificEndpoint = true;
} else if (session.user.role === 'CLIENT') {
    endpoint = 'cliente/mis-ordenes';
    isRoleSpecificEndpoint = true;
}
```

**Después**:
```typescript
if (session.user.role === 'tech') {
    endpoint = 'tecnico/mis-ordenes';
    isRoleSpecificEndpoint = true;
} else if (session.user.role === 'client') {
    endpoint = 'cliente/mis-ordenes';
    isRoleSpecificEndpoint = true;
}
```

**Impacto**: Ahora la lógica de filtrado de órdenes por rol funciona correctamente

---

### **4. Corregir useSignUpFormHandler Hook**
**Archivo**: `Frontend/src/hooks/useSignUpFormHandler.ts` (Línea ~86)

**Antes**:
```typescript
await registerUser({ ...formData, role: "Cliente" });
```

**Después**:
```typescript
await registerUser({ ...formData, role: "client" });
```

**Impacto**: Nuevos usuarios se registran con el rol slug correcto `"client"`

---

### **5. Actualizar Backend - Auth Service**
**Archivo**: `Backend/src/auth/auth.service.ts` (Método `login`)

**Antes**:
```typescript
return {
    token,
    user: {
        id: user.id,
        cedula: user.cedula,
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
    },
};
```

**Después**:
```typescript
// ✅ Obtener el primer rol del usuario (desde userRoles)
const userRole = user.userRoles && user.userRoles.length > 0 
    ? user.userRoles[0].rol.slug 
    : 'user'; // fallback a 'user' si no tiene roles

return {
    token,
    user: {
        id: user.id,
        cedula: user.cedula,
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
        telefono: user.telefono,
        direccion: user.direccion,
        ciudad: user.ciudad,
        role: userRole,
    },
};
```

**Impacto**: 
- ✅ El login ahora retorna el `role` slug correcto del usuario
- ✅ La sesión de NextAuth recibe el rol correctamente
- ✅ Se agrega `telefono`, `direccion`, `ciudad` que faltaban en la respuesta

---

## 🔗 Flujo de Comunicación Actualizado

```
┌─────────────────────────────────────────────────────────────────┐
│                     NUEVO FLUJO DE ROLES                        │
└─────────────────────────────────────────────────────────────────┘

1️⃣ FRONTEND LOGIN
   Envía credenciales → Backend auth/login

2️⃣ BACKEND VERIFICA
   - Busca usuario con findByEmail(email)
   - Carga relaciones: userRoles, userRoles.rol
   - Retorna role SLUG: 'admin', 'tech', 'client', etc.

3️⃣ NEXTAUTH SESSION
   - JWT callback: token.user recibe role slug
   - Session callback: session.user tiene role slug

4️⃣ FRONTEND USA ROLE
   - Compara con slugs: 'admin', 'tech', 'client', 'recep', 'user'
   - Filtra navItems según role
   - Redirige endpoints específicos (tecnico/mis-ordenes, etc.)

5️⃣ VALORES USADOS EN FRONTEND
   ✅ Comparaciones: 'admin', 'tech', 'client', 'recep', 'user'
   ✅ Almacenados en enum: Role.ADMIN, Role.TECH, etc.
   ✅ Mapeo legible: RoleDisplayNames para UI
```

---

## 📝 Checklist de Verificación

- [x] Enum `Role` actualizado con slugs de BD
- [x] `navItems.tsx` usando slugs correctos en todas las referencias
- [x] `useOrders.ts` comparando con slugs minúsculos
- [x] `useSignUpFormHandler.ts` asignando rol como slug
- [x] Backend retorna `role` en respuesta de login
- [x] Backend retorna campos adicionales: telefono, direccion, ciudad
- [x] `findByEmail` carga relaciones: userRoles.rol

---

## 🚀 Próximas Verificaciones Recomendadas

1. **Testing del Login**
   ```bash
   # Verificar en F12 → Network → login response
   # Debe retornar role: "admin", "tech", "client", etc.
   ```

2. **Filtrado de Navegación**
   - Inicia sesión como Admin → debería ver todos los items
   - Inicia sesión como Técnico → debería ver solo items de técnico
   - Inicia sesión como Cliente → debería ver solo items de cliente

3. **Endpoints específicos por rol**
   - Técnico: `/tecnico/mis-ordenes`
   - Cliente: `/cliente/mis-ordenes`
   - Admin: `/orders` (todos)

4. **Permisos en Backend**
   - Verificar que `RolesGuard` valida los slugs correctamente
   - Verificar que `@Roles('admin', 'tech')` funciona con slugs

---

## 📚 Documentación Relacionada

- Backend: `Backend/MIGRACION_ENUM_A_ROLES_DB.md`
- Backend: `Backend/ROLES_PERMISOS_IMPLEMENTACION.md`
- Frontend Types: `Frontend/src/types/role.ts`
- Frontend Navigation: `Frontend/src/data/sidebar/navItems.tsx`

