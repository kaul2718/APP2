import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from '../rol/entities/rol.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { RolePermission } from '../role-permission/entities/role-permission.entity';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async seed() {
    await this.seedPermissions();
    await this.seedRoles();
  }

  private async seedPermissions() {
    const permissions = [
      // Órdenes
      { nombre: 'Ver Órdenes', slug: 'orders.view' },
      { nombre: 'Crear Órdenes', slug: 'orders.create' },
      { nombre: 'Editar Órdenes', slug: 'orders.update' },
      { nombre: 'Eliminar Órdenes', slug: 'orders.delete' },

      // Usuarios
      { nombre: 'Ver Usuarios', slug: 'users.view' },
      { nombre: 'Crear Usuarios', slug: 'users.create' },
      { nombre: 'Editar Usuarios', slug: 'users.update' },
      { nombre: 'Eliminar Usuarios', slug: 'users.delete' },

      // Roles y Permisos
      { nombre: 'Gestionar Roles', slug: 'roles.manage' },
      { nombre: 'Gestionar Permisos', slug: 'permissions.manage' },

      // Presupuestos
      { nombre: 'Ver Presupuestos', slug: 'presupuestos.view' },
      { nombre: 'Crear Presupuestos', slug: 'presupuestos.create' },
      { nombre: 'Editar Presupuestos', slug: 'presupuestos.update' },
      { nombre: 'Eliminar Presupuestos', slug: 'presupuestos.delete' },
      { nombre: 'Aprobar Presupuestos', slug: 'presupuestos.approve' },

      // Almacen
      { nombre: 'Ver Almacén', slug: 'almacen.view' },
      { nombre: 'Gestionar Almacén', slug: 'almacen.manage' },

      // Reportes
      { nombre: 'Ver Reportes', slug: 'reportes.view' },
      { nombre: 'Exportar Reportes', slug: 'reportes.export' },

      // Notificaciones
      { nombre: 'Enviar Notificaciones', slug: 'notificaciones.send' },
      { nombre: 'Ver Notificaciones', slug: 'notificaciones.view' },
    ];

    for (const permissionData of permissions) {
      const existing = await this.permissionRepository.findOne({
        where: { slug: permissionData.slug },
      });

      if (!existing) {
        const permission = this.permissionRepository.create(permissionData);
        await this.permissionRepository.save(permission);
        console.log(`✓ Permiso creado: ${permissionData.nombre}`);
      }
    }
  }

  private async seedRoles() {
    const rolePermissions = [
      {
        nombre: 'Administrador',
        slug: 'admin',
        descripcion: 'Acceso total al sistema',
        permissions: [
          'orders.view',
          'orders.create',
          'orders.update',
          'orders.delete',
          'users.view',
          'users.create',
          'users.update',
          'users.delete',
          'roles.manage',
          'permissions.manage',
          'presupuestos.view',
          'presupuestos.create',
          'presupuestos.update',
          'presupuestos.delete',
          'presupuestos.approve',
          'almacen.view',
          'almacen.manage',
          'reportes.view',
          'reportes.export',
          'notificaciones.send',
          'notificaciones.view',
        ],
      },
      {
        nombre: 'Técnico',
        slug: 'tech',
        descripcion: 'Ejecución de órdenes técnicas',
        permissions: [
          'orders.view',
          'orders.update',
          'presupuestos.view',
          'almacen.view',
          'notificaciones.view',
        ],
      },
      {
        nombre: 'Recepcionista',
        slug: 'recep',
        descripcion: 'Gestión de cliente y órdenes de entrada',
        permissions: [
          'orders.view',
          'orders.create',
          'users.view',
          'presupuestos.view',
          'notificaciones.send',
          'notificaciones.view',
        ],
      },
      {
        nombre: 'Cliente',
        slug: 'client',
        descripcion: 'Acceso limitado para clientes',
        permissions: [
          'orders.view',
          'presupuestos.view',
          'notificaciones.view',
        ],
      },
      {
        nombre: 'User',
        slug: 'user',
        descripcion: 'Usuario genérico del sistema',
        permissions: [
          'notificaciones.view',
        ],
      },
    ];

    for (const roleData of rolePermissions) {
      const existing = await this.rolRepository.findOne({
        where: { slug: roleData.slug },
      });

      if (!existing) {
        const rol = this.rolRepository.create({
          nombre: roleData.nombre,
          slug: roleData.slug,
          descripcion: roleData.descripcion,
        });

        const savedRole = await this.rolRepository.save(rol);

        // Asignar permisos
        for (const permissionSlug of roleData.permissions) {
          const permission = await this.permissionRepository.findOne({
            where: { slug: permissionSlug },
          });

          if (permission) {
            const rolePermission = this.rolePermissionRepository.create({
              roleId: savedRole.id,
              permissionId: permission.id,
            });

            await this.rolePermissionRepository.save(rolePermission);
          }
        }

        console.log(`✓ Rol creado: ${roleData.nombre}`);
      }
    }
  }
}
