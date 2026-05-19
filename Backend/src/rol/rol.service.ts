import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from './entities/rol.entity';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { RolePermission } from '../role-permission/entities/role-permission.entity';
import { UserRole } from '../user-role/entities/user-role.entity';
import { PermissionsService } from '../permissions/permissions.service';

// Roles del sistema que NO se pueden eliminar/editar
const SYSTEM_ROLES = ['admin', 'tech', 'recep', 'client', 'user'];

@Injectable()
export class RolService {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly permissionsService: PermissionsService,
  ) {}

  async create(createRolDto: CreateRolDto): Promise<Rol> {
    const { nombre, slug, descripcion, permissionIds } = createRolDto;

    // ✅ Validar campos requeridos
    if (!nombre || nombre.trim() === '') {
      throw new BadRequestException('El nombre del rol es requerido');
    }
    if (!slug || slug.trim() === '') {
      throw new BadRequestException('El slug del rol es requerido');
    }

    // ✅ Validar que el slug sea único
    const existingRol = await this.rolRepository.findOne({
      where: { slug },
      withDeleted: true,
    });

    if (existingRol) {
      throw new BadRequestException(
        `El rol con slug "${slug}" ya existe`,
      );
    }

    const rol = this.rolRepository.create({
      nombre: nombre.trim(),
      slug: slug.trim(),
      descripcion: descripcion?.trim(),
    });

    const savedRol = await this.rolRepository.save(rol);

    // ✅ Asignar permisos si se proporcionan
    if (permissionIds && permissionIds.length > 0) {
      await this.assignPermissions(savedRol.id, permissionIds);
      return await this.findOne(savedRol.id);
    }

    return savedRol;
  }

  async findAll(): Promise<Rol[]> {
    return await this.rolRepository.find({
      where: { deletedAt: null },
      relations: ['rolePermissions', 'rolePermissions.permission'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Rol> {
    const rol = await this.rolRepository.findOne({
      where: { id },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    if (!rol) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }

    return rol;
  }

  async findBySlug(slug: string): Promise<Rol> {
    const rol = await this.rolRepository.findOne({
      where: { slug },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    if (!rol) {
      throw new NotFoundException(`Rol con slug "${slug}" no encontrado`);
    }

    return rol;
  }

  async update(id: number, updateRolDto: UpdateRolDto): Promise<Rol> {
    const rol = await this.findOne(id);

    // ✅ Proteger roles del sistema
    if (SYSTEM_ROLES.includes(rol.slug)) {
      throw new BadRequestException(
        `No se puede editar el rol del sistema "${rol.nombre}"`,
      );
    }

    // ✅ Validar slug único si es actualizado
    if (updateRolDto.slug && updateRolDto.slug !== rol.slug) {
      const existingRol = await this.rolRepository.findOne({
        where: { slug: updateRolDto.slug },
        withDeleted: true,
      });

      if (existingRol) {
        throw new BadRequestException(
          `El rol con slug "${updateRolDto.slug}" ya existe`,
        );
      }
    }

    if (updateRolDto.nombre) {
      updateRolDto.nombre = updateRolDto.nombre.trim();
    }
    if (updateRolDto.slug) {
      updateRolDto.slug = updateRolDto.slug.trim();
    }
    if (updateRolDto.descripcion) {
      updateRolDto.descripcion = updateRolDto.descripcion.trim();
    }

    Object.assign(rol, updateRolDto);
    const updatedRol = await this.rolRepository.save(rol);

    // ✅ Actualizar permisos si se proporcionan
    if (updateRolDto.permissionIds) {
      await this.assignPermissions(id, updateRolDto.permissionIds);
      return await this.findOne(id);
    }

    return updatedRol;
  }

  async remove(id: number): Promise<{ message: string }> {
    const rol = await this.findOne(id);

    // ✅ Proteger roles del sistema
    if (SYSTEM_ROLES.includes(rol.slug)) {
      throw new BadRequestException(
        `No se puede eliminar el rol del sistema "${rol.nombre}"`,
      );
    }

    // ✅ Validar: Verificar si el rol tiene usuarios asignados (usando TypeORM)
    const usersCount = await this.userRoleRepository.count({
      where: { roleId: id },
    });

    if (usersCount > 0) {
      throw new ConflictException(
        `No se puede eliminar el rol "${rol.nombre}" porque tiene ${usersCount} usuario(s) asignado(s)`,
      );
    }

    // ✅ Soft delete: marcar como eliminado sin borrar físicamente
    await this.rolRepository.softRemove(rol);

    return { message: `Rol ${rol.nombre} eliminado correctamente` };
  }

  async assignPermissions(roleId: number, permissionIds: number[]): Promise<void> {
    // ✅ Validar que el array no esté vacío
    if (!permissionIds || permissionIds.length === 0) {
      throw new BadRequestException('Debe proporcionar al menos un permiso');
    }

    // ✅ Validar no hay duplicados
    const uniqueIds = new Set(permissionIds);
    if (uniqueIds.size !== permissionIds.length) {
      throw new BadRequestException('No se pueden asignar permisos duplicados');
    }

    // Validar que el rol existe
    const rol = await this.rolRepository.findOne({ where: { id: roleId } });
    if (!rol) {
      throw new NotFoundException(`Rol con ID ${roleId} no encontrado`);
    }

    // Eliminar permisos existentes
    await this.rolePermissionRepository.delete({ roleId });

    // ✅ Crear nuevos registros de permisos
    for (const permissionId of permissionIds) {
      // Validar que el permiso existe
      await this.permissionsService.findOne(permissionId);

      const rolePermission = this.rolePermissionRepository.create({
        roleId,
        permissionId,
      });

      await this.rolePermissionRepository.save(rolePermission);
    }
  }

  async getPermissions(roleId: number): Promise<string[]> {
    const rol = await this.findOne(roleId);
    return rol.rolePermissions.map((rp) => rp.permission.slug);
  }

  async hasPermission(roleId: number, permissionSlug: string): Promise<boolean> {
    const permissions = await this.getPermissions(roleId);
    return permissions.includes(permissionSlug);
  }

  /** Bulk-replace ALL permissions for a role (accepts empty array to clear all) */
  async setPermissions(roleId: number, permissionIds: number[]): Promise<void> {
    // Validate the role exists
    await this.rolRepository.findOneOrFail({ where: { id: roleId } }).catch(() => {
      throw new NotFoundException(`Rol con ID ${roleId} no encontrado`);
    });

    // Remove all existing permissions
    await this.rolePermissionRepository.delete({ roleId });

    if (!permissionIds || permissionIds.length === 0) return;

    // Validate no duplicates
    const unique = [...new Set(permissionIds)];

    for (const permissionId of unique) {
      await this.permissionsService.findOne(permissionId);
      const rp = this.rolePermissionRepository.create({ roleId, permissionId });
      await this.rolePermissionRepository.save(rp);
    }
  }

  /** Remove a single permission from a role */
  async removePermission(roleId: number, permissionId: number): Promise<void> {
    const rp = await this.rolePermissionRepository.findOne({
      where: { roleId, permissionId },
    });

    if (!rp) {
      throw new NotFoundException(
        `El rol ${roleId} no tiene asignado el permiso ${permissionId}`,
      );
    }

    await this.rolePermissionRepository.remove(rp);
  }
}

