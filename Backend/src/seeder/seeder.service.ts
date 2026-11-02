import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Rol } from '../rol/entities/rol.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { RolePermission } from '../role-permission/entities/role-permission.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../user-role/entities/user-role.entity';
import { EstadoOrden } from '../estado-orden/entities/estado-orden.entity';
import { EstadoPresupuesto } from '../estado-presupuesto/entities/estado-presupuesto.entity';
import { TipoActividadTecnica } from '../tipo-actividad-tecnica/entities/tipo-actividad-tecnica.entity';
import { TipoNotificacion } from '../tipo-notificacion/entities/tipo-notificacion.entity';
import { TipoEquipo } from '../tipo-equipo/entities/tipo-equipo.entity';
import { ConfiguracionSistema } from '../configuracion-sistema/entities/configuracion-sistema.entity';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(EstadoOrden)
    private readonly estadoOrdenRepository: Repository<EstadoOrden>,
    @InjectRepository(EstadoPresupuesto)
    private readonly estadoPresupuestoRepository: Repository<EstadoPresupuesto>,
    @InjectRepository(TipoActividadTecnica)
    private readonly tipoActividadTecnicaRepository: Repository<TipoActividadTecnica>,
    @InjectRepository(TipoNotificacion)
    private readonly tipoNotificacionRepository: Repository<TipoNotificacion>,
    @InjectRepository(TipoEquipo)
    private readonly tipoEquipoRepository: Repository<TipoEquipo>,
    @InjectRepository(ConfiguracionSistema)
    private readonly configSistemaRepository: Repository<ConfiguracionSistema>,
  ) { }

  async seed() {
    this.logger.log('--- 1. Sincronizando permisos del sistema ---');
    await this.seedPermissions();

    this.logger.log('--- 2. Sincronizando roles del sistema ---');
    await this.seedRoles();

    this.logger.log('--- 3. Inicializando catálogos requeridos ---');
    await this.seedCatalogs();

    this.logger.log('--- 4. Verificando/Creando usuario administrador inicial ---');
    await this.seedInitialAdmin();

    this.logger.log('✅ Inicialización de seeders completada.');
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

      // Almacén
      { nombre: 'Ver Almacén', slug: 'almacen.view' },
      { nombre: 'Gestionar Almacén', slug: 'almacen.manage' },

      // Checklists
      { nombre: 'Ver Checklists', slug: 'checklists.view' },
      { nombre: 'Gestionar Checklists', slug: 'checklists.manage' },

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
        this.logger.log(`✓ Permiso creado: ${permissionData.nombre}`);
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
          'checklists.view',
          'checklists.manage',
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
          'checklists.view',
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
      let rol = await this.rolRepository.findOne({
        where: { slug: roleData.slug },
      });

      if (!rol) {
        rol = this.rolRepository.create({
          nombre: roleData.nombre,
          slug: roleData.slug,
          descripcion: roleData.descripcion,
        });
        rol = await this.rolRepository.save(rol);
        this.logger.log(`✓ Rol creado: ${roleData.nombre}`);
      } else {
        rol.nombre = roleData.nombre;
        rol.descripcion = roleData.descripcion;
        rol = await this.rolRepository.save(rol);
      }

      // Sincronizar permisos del rol de forma segura
      await this.rolePermissionRepository.delete({ roleId: rol.id });

      for (const permissionSlug of roleData.permissions) {
        const permission = await this.permissionRepository.findOne({
          where: { slug: permissionSlug },
        });

        if (permission) {
          const rolePermission = this.rolePermissionRepository.create({
            roleId: rol.id,
            permissionId: permission.id,
          });
          await this.rolePermissionRepository.save(rolePermission);
        }
      }
      this.logger.log(`✓ Permisos sincronizados para el rol: ${roleData.nombre}`);
    }
  }

  private async seedCatalogs() {
    // 1. Estado de Órdenes
    const estadosOrden = [
      { nombre: 'Recepción', descripcion: 'Equipo recibido en recepción y registrado' },
      { nombre: 'Diagnóstico', descripcion: 'Equipo en evaluación y diagnóstico técnico' },
      { nombre: 'Presupuestado', descripcion: 'Presupuesto emitido a la espera de autorización' },
      { nombre: 'Aprobado', descripcion: 'Presupuesto aprobado por el cliente' },
      { nombre: 'En Reparación', descripcion: 'Equipo en proceso de reparación técnica' },
      { nombre: 'Esperando Repuesto', descripcion: 'En espera de repuestos o suministros' },
      { nombre: 'Control de Calidad', descripcion: 'Pruebas finales y control de calidad' },
      { nombre: 'Listo para Entrega', descripcion: 'Equipo listo para entrega al cliente' },
      { nombre: 'Entregado', descripcion: 'Equipo entregado a satisfacción del cliente' },
      { nombre: 'Archivados', descripcion: 'Orden archivada y cerrada' },
      { nombre: 'Anulado', descripcion: 'Orden anulada' },
    ];

    for (const item of estadosOrden) {
      const exists = await this.estadoOrdenRepository.findOne({
        where: { nombre: item.nombre },
        withDeleted: true,
      });
      if (!exists) {
        const estado = this.estadoOrdenRepository.create({
          nombre: item.nombre,
          descripcion: item.descripcion,
          estado: true,
        });
        await this.estadoOrdenRepository.save(estado);
        this.logger.log(`✓ Estado de orden creado: ${item.nombre}`);
      }
    }

    // 2. Estado de Presupuesto
    const estadosPresupuesto = [
      { nombre: 'Pendiente', descripcion: 'Presupuesto pendiente de revisión o respuesta' },
      { nombre: 'Aprobado', descripcion: 'Presupuesto aprobado por el cliente' },
      { nombre: 'Rechazado', descripcion: 'Presupuesto rechazado por el cliente' },
      { nombre: 'Vencido', descripcion: 'Presupuesto expirado' },
    ];

    for (const item of estadosPresupuesto) {
      const exists = await this.estadoPresupuestoRepository.findOne({
        where: { nombre: item.nombre },
        withDeleted: true,
      });
      if (!exists) {
        const ep = this.estadoPresupuestoRepository.create({
          nombre: item.nombre,
          descripcion: item.descripcion,
          estado: true,
        });
        await this.estadoPresupuestoRepository.save(ep);
        this.logger.log(`✓ Estado de presupuesto creado: ${item.nombre}`);
      }
    }

    // 3. Tipos de Actividad Técnica
    const tiposActividad = [
      { nombre: 'Diagnóstico Inicial', descripcion: 'Revisión y peritaje inicial de fallas' },
      { nombre: 'Mantenimiento Preventivo', descripcion: 'Limpieza interna, cambio de pasta térmica, lubricación' },
      { nombre: 'Mantenimiento Correctivo', descripcion: 'Reparación de componentes electrónicos y módulos' },
      { nombre: 'Microelectrónica / Reballing', descripcion: 'Soldadura SMD/BGA, reparación de pistas y placa' },
      { nombre: 'Instalación de Software / SO', descripcion: 'Instalación de sistema operativo y utilitarios' },
      { nombre: 'Reemplazo de Componente', descripcion: 'Sustitución de pantalla, teclado, disco, batería o fuente' },
      { nombre: 'Pruebas y Control de Calidad', descripcion: 'Testeo de rendimiento y verificación final' },
    ];

    for (const item of tiposActividad) {
      const exists = await this.tipoActividadTecnicaRepository.findOne({
        where: { nombre: item.nombre },
        withDeleted: true,
      });
      if (!exists) {
        const ta = this.tipoActividadTecnicaRepository.create({
          nombre: item.nombre,
          descripcion: item.descripcion,
          estado: true,
        });
        await this.tipoActividadTecnicaRepository.save(ta);
        this.logger.log(`✓ Tipo de actividad técnica creado: ${item.nombre}`);
      }
    }

    // 4. Tipos de Notificación
    const tiposNotificacion = [
      { nombre: 'Cambio de Estado ODS', descripcion: 'Notificaciones sobre la evolución del estado de la orden' },
      { nombre: 'Presupuesto Disponible', descripcion: 'Aviso de nuevo presupuesto emitido' },
      { nombre: 'Presupuesto Aprobado', descripcion: 'Confirmación de presupuesto aprobado' },
      { nombre: 'Presupuesto Rechazado', descripcion: 'Confirmación de presupuesto rechazado' },
      { nombre: 'Orden Lista para Retiro', descripcion: 'Aviso al cliente de que su equipo está listo' },
      { nombre: 'Notificación General', descripcion: 'Avisos administrativos o generales' },
    ];

    for (const item of tiposNotificacion) {
      const exists = await this.tipoNotificacionRepository.findOne({
        where: { nombre: item.nombre },
        withDeleted: true,
      });
      if (!exists) {
        const tn = this.tipoNotificacionRepository.create({
          nombre: item.nombre,
          descripcion: item.descripcion,
          estado: true,
        });
        await this.tipoNotificacionRepository.save(tn);
        this.logger.log(`✓ Tipo de notificación creado: ${item.nombre}`);
      }
    }

    // 5. Tipos de Equipo base
    const tiposEquipo = [
      'Laptop',
      'Computadora de Escritorio',
      'Todo en Uno (AIO)',
      'Servidor',
      'Impresora / Multifunción',
      'Monitor',
    ];

    for (const nombre of tiposEquipo) {
      const exists = await this.tipoEquipoRepository.findOne({
        where: { nombre },
        withDeleted: true,
      });
      if (!exists) {
        const te = this.tipoEquipoRepository.create({
          nombre,
          estado: true,
        });
        await this.tipoEquipoRepository.save(te);
        this.logger.log(`✓ Tipo de equipo base creado: ${nombre}`);
      }
    }

    // 6. Configuración de Sistema Singleton (id: 1)
    const configExists = await this.configSistemaRepository.findOne({ where: { id: 1 } });
    if (!configExists) {
      const nuevaConfig = new ConfiguracionSistema();
      nuevaConfig.id = 1;
      nuevaConfig.ordenPrefijo = '';
      nuevaConfig.ordenSiguienteNumero = 1;
      nuevaConfig.ordenDigitos = 5;
      nuevaConfig.ordenPermitirReinicio = false;
      nuevaConfig.presupuestoPrefijo = 'PRE-';
      nuevaConfig.presupuestoSiguienteNumero = 1;
      nuevaConfig.presupuestoDigitos = 5;
      nuevaConfig.nombreEmpresa = 'Hospital del Computador';
      nuevaConfig.nombreComercial = 'Hospital del Computador';
      nuevaConfig.ruc = '1792999999001';
      nuevaConfig.telefono = '032999999';
      nuevaConfig.whatsapp = '+593 96 962 0222';
      nuevaConfig.correoContacto = 'soporte@hospitaldelcomputador.com';
      nuevaConfig.direccion = 'Riobamba, Chimborazo, Ecuador';
      nuevaConfig.ciudad = 'Riobamba';
      nuevaConfig.slogan = 'Servicio Técnico Especializado en Computación, Laptops y Servidores';
      nuevaConfig.porcentajeIva = 15.0;
      nuevaConfig.diasAbandono = 60;
      nuevaConfig.diasGarantiaDefault = 90;
      nuevaConfig.diasVigenciaPresupuesto = 15;

      await this.configSistemaRepository.save(nuevaConfig);
      this.logger.log('✓ Configuración base del sistema inicializada.');
    }
  }

  private async seedInitialAdmin() {
    const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || '').trim().toLowerCase();
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      this.logger.warn(
        '⚠️ INITIAL_ADMIN_EMAIL o INITIAL_ADMIN_PASSWORD no están configurados en las variables de entorno. Omitiendo creación automática del administrador inicial.',
      );
      return;
    }

    const adminRole = await this.rolRepository.findOne({ where: { slug: 'admin' } });
    if (!adminRole) {
      throw new Error('El rol de administrador no se encontró al inicializar el usuario.');
    }

    const existingAdminByEmail = await this.userRepository.findOne({
      where: { correo: adminEmail },
      withDeleted: true,
    });

    const adminCedula = process.env.INITIAL_ADMIN_CEDULA || '0600000000';
    const existingAdminByCedula = await this.userRepository.findOne({
      where: { cedula: adminCedula },
      withDeleted: true,
    });

    if (existingAdminByEmail || existingAdminByCedula) {
      const existing = existingAdminByEmail || existingAdminByCedula;
      // Verificar si ya tiene el rol admin asignado
      const hasAdminRole = await this.userRoleRepository.findOne({
        where: { userId: existing.id, roleId: adminRole.id },
      });
      if (!hasAdminRole) {
        const ur = this.userRoleRepository.create({
          userId: existing.id,
          roleId: adminRole.id,
        });
        await this.userRoleRepository.save(ur);
        this.logger.log(`✓ Rol administrador asociado al usuario existente ID: ${existing.id}`);
      }
      this.logger.log(`ℹ Usuario administrador (${existing.correo}) ya registrado. No se modifica su contraseña existente.`);
      return;
    }

    // Hashear contraseña de forma segura con bcrypt
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const newAdmin = this.userRepository.create({
      cedula: adminCedula,
      nombre: process.env.INITIAL_ADMIN_NAME || 'Administrador',
      apellido: process.env.INITIAL_ADMIN_LASTNAME || 'General',
      correo: adminEmail,
      telefono: process.env.INITIAL_ADMIN_PHONE || '0999999999',
      direccion: process.env.INITIAL_ADMIN_ADDRESS || 'Matriz Riobamba',
      ciudad: process.env.INITIAL_ADMIN_CITY || 'Riobamba',
      password: hashedPassword,
      estado: true,
    });

    const savedAdmin = await this.userRepository.save(newAdmin);

    const userRole = this.userRoleRepository.create({
      userId: savedAdmin.id,
      roleId: adminRole.id,
    });
    await this.userRoleRepository.save(userRole);

    this.logger.log(`✓ Usuario administrador inicial creado con éxito para: [${adminEmail}] (ID: ${savedAdmin.id})`);
  }
}
