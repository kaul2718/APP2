/**
 * EJEMPLOS DE USO DEL SISTEMA DE ROLES Y PERMISOS
 * 
 * Este archivo contiene ejemplos prácticos de cómo usar
 * el sistema implementado en tu aplicación.
 */

// ============================================
// 1. PROTEGER RUTAS POR ROL
// ============================================

import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';


@Controller('orders')
@UseGuards(AuthGuard, RolesGuard)
export class OrdersExampleController {
  /**
   * Solo accesible para ADMIN
   */
  @Get('admin-report')
  @Roles('admin')
  getAdminReport() {
    return { data: 'Reporte administrativo' };
  }

  /**
   * Accesible para ADMIN y TECH
   */
  @Get('list')
  @Roles('admin', 'tech')
  getOrders() {
    return { data: 'Lista de órdenes' };
  }

  /**
   * Solo para CLIENT
   */
  @Get('my-orders')
  @Roles('client')
  getMyOrders() {
    return { data: 'Mis órdenes' };
  }
}

// ============================================
// 2. PROTEGER RUTAS POR PERMISO
// ============================================

import { PermissionsGuard } from 'src/auth/guard/permissions.guard';
import { RequirePermissions } from 'src/decorators/permissions.decorator';

@Controller('presupuestos')
@UseGuards(AuthGuard, PermissionsGuard)
export class PresupuestosExampleController {
  /**
   * Requiere permiso 'presupuestos.view'
   */
  @Get()
  @RequirePermissions('presupuestos.view')
  findAll() {
    return { data: 'Lista de presupuestos' };
  }

  /**
   * Requiere permiso 'presupuestos.create'
   */
  @Post()
  @RequirePermissions('presupuestos.create')
  create(@Body() dto: any) {
    return { data: 'Presupuesto creado' };
  }

  /**
   * Requiere UNO de estos permisos
   * (orden es OR, no AND)
   */
  @Post('approve')
  @RequirePermissions(['presupuestos.approve', 'presupuestos.update'])
  approve(@Body() dto: any) {
    return { data: 'Presupuesto aprobado' };
  }
}

// ============================================
// 3. COMBINAR GUARDS
// ============================================

@Controller('inventory')
@UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
export class InventoryExampleController {
  /**
   * Requiere:
   * - Ser ADMIN O TECH
   * - Tener permiso 'inventario.view'
   */
  @Get()
  @Roles('admin', 'tech')
  @RequirePermissions('inventario.view')
  getInventory() {
    return { data: 'Inventario' };
  }

  /**
   * Requiere:
   * - Ser ADMIN
   * - Tener permiso 'inventario.manage'
   */
  @Post()
  @Roles('admin')
  @RequirePermissions('inventario.manage')
  addToInventory(@Body() dto: any) {
    return { data: 'Item agregado' };
  }
}

// ============================================
// 4. VERIFICAR PERMISOS MANUALMENTE EN SERVICIO
// ============================================

import { Injectable } from '@nestjs/common';
import { RolService } from 'src/rol/rol.service';

@Injectable()
export class PermissionsExampleService {
  constructor(private readonly rolService: RolService) {}

  /**
   * Verificar si un rol tiene un permiso específico
   */
  async verificarPermiso(roleId: number, permissionSlug: string): Promise<boolean> {
    return await this.rolService.hasPermission(roleId, permissionSlug);
  }

  /**
   * Obtener todos los permisos de un rol
   */
  async obtenerPermisos(roleId: number): Promise<string[]> {
    return await this.rolService.getPermissions(roleId);
  }
}

// ============================================
// 5. ASIGNAR ROLES A USUARIOS
// ============================================

import { UsuarioRolService } from 'src/usuario-rol/usuario-rol.service';

@Injectable()
export class UserManagementExampleService {
  constructor(private readonly usuarioRolService: UsuarioRolService) {}

  /**
   * Asignar un rol a un usuario
   */
  async asignarRolAlUsuario(userId: number, roleId: number) {
    return await this.usuarioRolService.assignRoleToUser(userId, roleId);
  }

  /**
   * Remover un rol de un usuario
   */
  async removerRolDelUsuario(userId: number, roleId: number) {
    return await this.usuarioRolService.removeRoleFromUser(userId, roleId);
  }

  /**
   * Obtener todos los roles de un usuario
   */
  async obtenerRolesDelUsuario(userId: number) {
    return await this.usuarioRolService.findByUserId(userId);
  }
}

// ============================================
// 6. ACCEDER AL USUARIO ACTUAL EN CONTROLADOR
// ============================================

import { Request } from 'express';

@Controller('users')
export class UserExampleController {
  /**
   * Obtener el usuario actual desde el request
   */
  @Get('me')
  @UseGuards(AuthGuard)
  getCurrentUser(@Req() req: any) {
    const user = req.user; // Usuario del JWT

    return {
      id: user.sub,
      correo: user.correo,
      userRoles: user.userRoles, // Roles asignados
    };
  }

  /**
   * Verificar si es admin
   */
  @Get('check-admin')
  @UseGuards(AuthGuard)
  checkIfAdmin(@Req() req: any) {
    // Verificar si el usuario tiene el rol admin en sus userRoles
    const isAdmin = (req.user.userRoles || []).some(
      (ur: any) => ur.rol?.slug === 'admin'
    );
    return { isAdmin };
  }
}

// ============================================
// 7. REQUESTS HTTP DE EJEMPLO
// ============================================

/**
 * CREAR UN PERMISO
 * POST /api/v1/permissions
 * Authorization: Bearer {token}
 */
const createPermissionExample = {
  nombre: 'Eliminar Órdenes',
  slug: 'orders.delete',
  descripcion: 'Permite eliminar órdenes del sistema',
};

/**
 * CREAR UN ROL CON PERMISOS
 * POST /api/v1/roles
 * Authorization: Bearer {token}
 */
const createRoleExample = {
  nombre: 'Gerente de Servicio',
  slug: 'service-manager',
  descripcion: 'Gestión de servicios técnicos',
  permissionIds: [1, 2, 3, 4], // IDs de permisos
};

/**
 * ASIGNAR ROL A USUARIO
 * POST /api/v1/user-roles
 * Authorization: Bearer {token}
 */
const assignRoleExample = {
  userId: 5,
  roleId: 2,
};

/**
 * OBTENER ROLES DE UN USUARIO
 * GET /api/v1/user-roles/user/5
 * Authorization: Bearer {token}
 */

/**
 * ASIGNAR ROL DIRECTO
 * POST /api/v1/user-roles/5/assign/2
 * Authorization: Bearer {token}
 */

/**
 * REMOVER ROL
 * DELETE /api/v1/user-roles/5/remove/2
 * Authorization: Bearer {token}
 */

// ============================================
// 8. INICIALIZAR DATOS (SEEDER)
// ============================================

/**
 * Ejecutar el seeder en terminal:
 * npm run seed:run
 *
 * Esto creará automáticamente:
 * - 5 roles predefinidos
 * - 20+ permisos predefinidos
 * - Relaciones rol-permiso
 */

// ============================================
// 9. PATRONES RECOMENDADOS
// ============================================

/**
 * PATRÓN 1: Verificar permiso en servicio
 * 
 * Implementación en tu servicio (inyecta los servicios necesarios):
 * 
 * @Injectable()
 * export class OrdersService {
 *   constructor(
 *     private usuarioRolService: UsuarioRolService,
 *     private rolService: RolService,
 *   ) {}
 * 
 *   async validateUserPermission(
 *     userId: number,
 *     permissionSlug: string,
 *   ): Promise<boolean> {
 *     const userRoles = await this.usuarioRolService.findByUserId(userId);
 *     for (const userRole of userRoles) {
 *       const hasPermission = await this.rolService.hasPermission(
 *         userRole.roleId,
 *         permissionSlug,
 *       );
 *       if (hasPermission) return true;
 *     }
 *     return false;
 *   }
 * }
 */

/**
 * PATRÓN 2: Ruta protegida simple (ejemplo dentro de un controller)
 * 
 * Implementación en tu controller:
 * @Get('data')
 * @UseGuards(AuthGuard, RolesGuard)
 * @Roles('admin')
 * getData() {
 *   // Solo admins pueden acceder
 * }
 */

/**
 * PATRÓN 3: Ruta con múltiples roles (ejemplo)
 */
// @Get('list')
// @UseGuards(AuthGuard, RolesGuard)
// @Roles('admin', 'tech', 'recep')
// getList() {
//   // Admin, técnico o recepcionista
// }

/**
 * PATRÓN 4: Ruta con permisos granulares
 */
// @Post()
// @UseGuards(AuthGuard, PermissionsGuard)
// @RequirePermissions('orders.create')
// create(@Body() dto: any) {
//   // Solo usuarios con permiso
// }

// ============================================
// 10. ERRORES COMUNES Y SOLUCIONES
// ============================================

/**
 * ❌ Error: RolService no inyectado
 * ✓ Solución: Asegúrate de importar RolModule en tu módulo
 * 
 * import { RolModule } from 'src/rol/rol.module';
 * @Module({
 *   imports: [RolModule],
 * })
 */

/**
 * ❌ Error: 403 Forbidden sin razón aparente
 * ✓ Solución: Verifica:
 *   1. Usuario tiene JWT válido
 *   2. Usuario tiene rol asignado (userRoles no vacío)
 *   3. Rol tiene permisos asignados
 *   4. El permiso/rol existe en BD
 */

/**
 * ❌ Error: No reconoce @Roles
 * ✓ Solución: Asegúrate de usar AuthGuard y RolesGuard juntos
 * 
 * @UseGuards(AuthGuard, RolesGuard)
 * @Roles('admin')
 */

// ============================================
// FIN DE EJEMPLOS
// ============================================
