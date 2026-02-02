# 📋 Guía de Testing - API Endpoints con Sistema de Roles y Permisos

> **Última actualización:** 30/01/2026
> **Estado:** Sistema en desarrollo - Listo para testing completo

---

## 🔐 Prerrequisitos

### 1. Usuarios de Prueba
```bash
# Crear estos usuarios mediante /auth/register

Usuario Admin:
- Email: admin@test.com
- Password: Admin123!
- Rol: admin

Usuario Técnico:
- Email: tech@test.com
- Password: Tech123!
- Rol: tech

Usuario Recepcionista:
- Email: recep@test.com
- Password: Recep123!
- Rol: recep

Usuario Cliente:
- Email: client@test.com
- Password: Client123!
- Rol: client

Usuario Normal:
- Email: user@test.com
- Password: User123!
- Rol: user
```

### 2. Obtener Token
```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "correo": "admin@test.com",
  "password": "Admin123!"
}

# Respuesta esperada:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🧪 ENDPOINTS POR MÓDULO

### 📦 AUTH - Autenticación

#### 1. **Registro de Usuario**
```
POST /api/v1/auth/register
Content-Type: application/json
Authorization: (NO REQUERIDO)

{
  "cedula": "1234567890",
  "nombre": "Juan",
  "apellido": "Pérez",
  "correo": "juan@test.com",
  "telefono": "0987654321",
  "direccion": "Calle Principal",
  "ciudad": "Quito",
  "password": "Password123!",
  "roleIds": []  // Se asignará rol 'user' por defecto
}

✅ Esperado: 201 Created - Usuario creado
❌ Error 400: Email ya existe
❌ Error 400: Validación de datos
```

#### 2. **Login**
```
POST /api/v1/auth/login
Content-Type: application/json
Authorization: (NO REQUERIDO)

{
  "correo": "admin@test.com",
  "password": "Admin123!"
}

✅ Esperado: 200 OK - Token JWT
{
  "access_token": "eyJhbGc..."
}

❌ Error 401: Email o contraseña inválidos
```

#### 3. **Ver Perfil (Autenticado)**
```
GET /api/v1/auth/profile
Authorization: Bearer {token}

✅ Esperado: 200 OK - Datos del usuario autenticado
{
  "id": 1,
  "nombre": "Admin",
  "correo": "admin@test.com",
  "userRoles": [
    {
      "id": 1,
      "rol": {
        "id": 1,
        "slug": "admin",
        "nombre": "Administrador"
      }
    }
  ]
}

❌ Error 401: Token no válido
❌ Error 401: Token expirado
```

---

### 👥 USUARIOS - Gestión de Usuarios

#### 4. **Listar Usuarios**
```
GET /api/v1/users
Authorization: Bearer {admin_token}

✅ Esperado: 200 OK - Lista de usuarios
❌ Error 403: Usuario sin rol 'admin' (acceso denegado)
❌ Error 401: Sin token
```

#### 5. **Obtener Usuario por ID**
```
GET /api/v1/users/1
Authorization: Bearer {admin_token}

✅ Esperado: 200 OK - Datos del usuario específico
❌ Error 403: Acceso denegado (no admin)
❌ Error 404: Usuario no existe
```

#### 6. **Crear Usuario**
```
POST /api/v1/users
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "cedula": "9876543210",
  "nombre": "Nuevo",
  "apellido": "Usuario",
  "correo": "nuevo@test.com",
  "telefono": "0912345678",
  "direccion": "Av. Secundaria",
  "ciudad": "Cuenca",
  "password": "NewPass123!",
  "roleIds": []
}

✅ Esperado: 201 Created - Usuario creado
❌ Error 403: No es admin
❌ Error 400: Email duplicado
```

#### 7. **Actualizar Usuario**
```
PUT /api/v1/users/2
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "nombre": "Juan Actualizado",
  "telefono": "0999999999",
  "estado": true
}

✅ Esperado: 200 OK - Usuario actualizado
❌ Error 403: No es admin
❌ Error 404: Usuario no existe
```

#### 8. **Eliminar Usuario**
```
DELETE /api/v1/users/2
Authorization: Bearer {admin_token}

✅ Esperado: 200 OK - Usuario eliminado
❌ Error 403: No es admin
❌ Error 404: Usuario no existe
```

---

### 🎭 ROLES - Gestión de Roles

#### 9. **Listar Todos los Roles**
```
GET /api/v1/roles
Authorization: Bearer {admin_token}

✅ Esperado: 200 OK - Lista de 5 roles (admin, tech, recep, client, user)
❌ Error 403: Usuario no es admin
❌ Error 401: Sin token

RESPUESTA ESPERADA:
[
  {
    "id": 1,
    "nombre": "Administrador",
    "slug": "admin",
    "descripcion": "Acceso total al sistema",
    "rolePermissions": [...]
  },
  ...
]
```

#### 10. **Obtener Rol por ID**
```
GET /api/v1/roles/1
Authorization: Bearer {admin_token}

✅ Esperado: 200 OK - Detalles del rol admin
❌ Error 403: No es admin
❌ Error 404: Rol no existe
```

#### 11. **Crear Rol (Avanzado)**
```
POST /api/v1/roles
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "nombre": "Auditor",
  "slug": "auditor",
  "descripcion": "Solo lectura de reportes"
}

✅ Esperado: 201 Created - Nuevo rol creado
❌ Error 403: No es admin
❌ Error 400: Slug duplicado
```

#### 12. **Actualizar Rol**
```
PATCH /api/v1/roles/5
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "nombre": "Auditor Modificado",
  "descripcion": "Acceso a reportes y análisis"
}

✅ Esperado: 200 OK - Rol actualizado
❌ Error 403: No es admin
```

#### 13. **Eliminar Rol**
```
DELETE /api/v1/roles/5
Authorization: Bearer {admin_token}

✅ Esperado: 200 OK - Rol eliminado
❌ Error 403: No es admin
❌ Error 409: Rol tiene usuarios asignados (no se puede eliminar)
```

---

### 🔑 PERMISOS - Gestión de Permisos

#### 14. **Listar Permisos**
```
GET /api/v1/permissions
Authorization: Bearer {admin_token}

✅ Esperado: 200 OK - Lista de 21+ permisos
[
  {
    "id": 1,
    "nombre": "Ver Órdenes",
    "slug": "orders.view",
    "descripcion": null
  },
  ...
]

❌ Error 403: No es admin
❌ Error 401: Sin token
```

#### 15. **Crear Permiso**
```
POST /api/v1/permissions
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "nombre": "Auditar Sistema",
  "slug": "audit.system",
  "descripcion": "Acceso a logs de auditoría"
}

✅ Esperado: 201 Created
❌ Error 403: No es admin
```

---

### 👤 USUARIO-ROL - Asignación de Roles a Usuarios

#### 16. **Asignar Rol a Usuario**
```
POST /api/v1/user-roles/{userId}/assign/{roleId}
Authorization: Bearer {user_token}  // El mismo usuario O admin

Ejemplo: Asignar rol 'admin' (id: 1) al usuario (id: 5)

POST /api/v1/user-roles/5/assign/1
Authorization: Bearer {token}

✅ Esperado: 201 Created - Rol asignado
{
  "id": 1,
  "userId": 5,
  "roleId": 1,
  "createdAt": "2026-01-30T21:30:00.000Z"
}

❌ Error 400: El usuario ya tiene ese rol
❌ Error 404: Usuario o Rol no existe
```

#### 17. **Remover Rol de Usuario**
```
DELETE /api/v1/user-roles/{userId}/{roleId}
Authorization: Bearer {admin_token}

Ejemplo: Remover rol 'tech' (id: 2) del usuario (id: 3)

DELETE /api/v1/user-roles/3/2
Authorization: Bearer {admin_token}

✅ Esperado: 200 OK - Rol removido
❌ Error 404: Relación no existe
❌ Error 403: No es admin
```

#### 18. **Listar Roles de Usuario**
```
GET /api/v1/user-roles/{userId}
Authorization: Bearer {admin_token}

Ejemplo:
GET /api/v1/user-roles/5
Authorization: Bearer {admin_token}

✅ Esperado: 200 OK - Lista de roles del usuario
[
  {
    "id": 1,
    "roleId": 1,
    "rol": {
      "id": 1,
      "nombre": "Administrador",
      "slug": "admin"
    }
  }
]

❌ Error 404: Usuario no existe
```

---

### 📋 ÓRDENES - Gestión de Órdenes

#### 19. **Listar Órdenes**
```
GET /api/v1/orders
Authorization: Bearer {user_token}  // Requiere rol con permiso 'orders.view'

✅ Esperado: 200 OK - Lista de órdenes
❌ Error 403: Usuario sin permiso 'orders.view'
❌ Error 401: Sin token
```

#### 20. **Crear Orden**
```
POST /api/v1/orders
Authorization: Bearer {recep_token}  // Requiere rol con permiso 'orders.create'
Content-Type: application/json

{
  "clientId": 4,
  "problemaReportado": "Reparación de laptop"
}

✅ Esperado: 201 Created
❌ Error 403: Permiso denegado
❌ Error 400: Datos inválidos
```

#### 21. **Obtener Orden por ID**
```
GET /api/v1/orders/1
Authorization: Bearer {tech_token}

✅ Esperado: 200 OK - Detalles de la orden
❌ Error 404: Orden no existe
❌ Error 403: Permiso denegado
```

#### 22. **Actualizar Orden**
```
PUT /api/v1/orders/1
Authorization: Bearer {tech_token}
Content-Type: application/json

{
  "estado": "en progreso",
  "descripcion": "Comenzó la reparación"
}

✅ Esperado: 200 OK
❌ Error 403: Permiso denegado
❌ Error 404: Orden no existe
```

---

## 🧬 TEST DE CONTROL DE ACCESO (CRÍTICO)

### Escenario 1: Admin puede acceder a TODO
```
Usuario: admin@test.com
Token: {admin_token}

✅ GET /api/v1/users
✅ GET /api/v1/roles
✅ POST /api/v1/users
✅ DELETE /api/v1/users/2
✅ GET /api/v1/permissions
✅ GET /api/v1/orders
```

### Escenario 2: Técnico tiene acceso LIMITADO
```
Usuario: tech@test.com
Token: {tech_token}

✅ GET /api/v1/orders (permiso: orders.view)
✅ PUT /api/v1/orders/1 (permiso: orders.update)
❌ GET /api/v1/users (No tiene permiso)
❌ POST /api/v1/users (No tiene permiso)
❌ GET /api/v1/roles (No tiene permiso)
❌ DELETE /api/v1/users/2 (No tiene permiso)
```

### Escenario 3: Cliente tiene acceso MÍNIMo
```
Usuario: client@test.com
Token: {client_token}

✅ GET /api/v1/orders (permiso: orders.view)
✅ GET /api/v1/presupuestos (permiso: presupuestos.view)
❌ POST /api/v1/users
❌ PUT /api/v1/orders/1 (No tiene permiso)
❌ GET /api/v1/roles
```

### Escenario 4: Sin Token
```
❌ GET /api/v1/users → Error 401 Unauthorized
❌ GET /api/v1/roles → Error 401 Unauthorized
❌ POST /api/v1/orders → Error 401 Unauthorized
```

### Escenario 5: Token Expirado
```
(Esperar a que expire el token JWT - 1 día)
❌ GET /api/v1/users → Error 401 Unauthorized
```

---

## 📊 MATRIZ DE PERMISOS

| Endpoint | Admin | Tech | Recep | Client | User |
|----------|:-----:|:----:|:-----:|:------:|:----:|
| GET /users | ✅ | ❌ | ✅ | ❌ | ❌ |
| POST /users | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /orders | ✅ | ✅ | ✅ | ✅ | ❌ |
| POST /orders | ✅ | ❌ | ✅ | ❌ | ❌ |
| PUT /orders | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /presupuestos | ✅ | ✅ | ✅ | ✅ | ❌ |
| GET /permissions | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🔧 Herramientas para Testing

### Opción 1: Postman (Recomendado para Producción)
- Importar collection
- Usar variables para token
- Guardar ejemplos de respuestas
- Automatizar tests

### Opción 2: cURL
```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@test.com","password":"Admin123!"}'

# Usar token
curl -X GET http://localhost:3000/api/v1/roles \
  -H "Authorization: Bearer eyJhbGc..."
```

### Opción 3: Thunder Client / REST Client (VS Code)

---

## ✅ Checklist Pre-Producción

- [ ] Login funciona y devuelve token válido
- [ ] Admin puede acceder a todos los endpoints
- [ ] Tech/Recep/Client tienen acceso restringido según permisos
- [ ] Sin token = Error 401
- [ ] Token inválido = Error 401
- [ ] Permiso insuficiente = Error 403
- [ ] Recurso no existe = Error 404
- [ ] Crear usuario funciona
- [ ] Asignar roles funciona
- [ ] Remover roles funciona
- [ ] No se puede eliminar rol si hay usuarios asignados
- [ ] Las relaciones userRoles se cargan correctamente
- [ ] Todas las validaciones de DTO funcionan

---

## 📞 Debugging

Si algo no funciona:

1. **Verifica el token**
   ```bash
   jwt.io → Pega el token y verifica su contenido
   ```

2. **Revisa los logs del servidor**
   ```bash
   npm run start:dev
   # Busca errores de autenticación/autorización
   ```

3. **Verifica que el usuario tiene el rol asignado**
   ```
   GET /api/v1/auth/profile
   Authorization: Bearer {token}
   # Mira que userRoles no esté vacío
   ```

4. **Checa la BD directamente**
   ```sql
   SELECT u.id, u.correo, r.slug
   FROM "user" u
   LEFT JOIN "user_role" ur ON u.id = ur."userId"
   LEFT JOIN "rol" r ON ur."roleId" = r.id
   WHERE u.correo = 'admin@test.com';
   ```

---

**¡Listo para producción!** 🚀
