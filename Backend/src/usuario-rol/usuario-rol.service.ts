import { Injectable, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../user-role/entities/user-role.entity';
import { User } from '../users/entities/user.entity';
import { Rol } from '../rol/entities/rol.entity';
import { CreateUsuarioRolDto } from './dto/create-usuario-rol.dto';
import { UpdateUsuarioRolDto } from './dto/update-usuario-rol.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsuarioRolService {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    @Optional()
    private readonly auditService?: AuditService,
  ) {}

  private async getUserRoleSlugs(
    userRoleRepo: Repository<UserRole>,
    userId: number,
  ): Promise<string[]> {
    const assignments = await userRoleRepo.find({
      where: { userId },
      relations: ['rol'],
    });
    return assignments
      .map((a) => a.rol?.slug)
      .filter((slug): slug is string => Boolean(slug));
  }

  async create(createUsuarioRolDto: CreateUsuarioRolDto): Promise<UserRole> {
    const { userId, roleId } = createUsuarioRolDto;

    if (!userId || !roleId) {
      throw new BadRequestException(`userId y roleId son requeridos`);
    }

    return await this.userRoleRepository.manager.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const rolRepo = manager.getRepository(Rol);
      const userRoleRepo = manager.getRepository(UserRole);

      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
      }

      const rol = await rolRepo.findOne({ where: { id: roleId } });
      if (!rol) {
        throw new NotFoundException(`Rol con ID ${roleId} no encontrado`);
      }

      const existingUserRole = await userRoleRepo.findOne({
        where: { userId, roleId },
      });

      if (existingUserRole) {
        throw new BadRequestException(`El usuario ya tiene asignado este rol`);
      }

      const previousRoles = await this.getUserRoleSlugs(userRoleRepo, userId);

      const userRole = userRoleRepo.create({ userId, roleId });
      const saved = await userRoleRepo.save(userRole);
      const nextRoles = Array.from(new Set([...previousRoles, rol.slug]));

      await this.auditService?.logCritical(
        {
          action: 'USER_ROLE_ASSIGNED',
          module: 'roles',
          entityType: 'User',
          entityId: userId,
          description: `Rol "${rol.slug}" asignado al usuario #${userId} (${user.nombre} ${user.apellido || ''})`.trim(),
          oldValues: { roles: previousRoles },
          newValues: { roles: nextRoles, assignedRoleId: rol.id, assignedRoleSlug: rol.slug },
          status: 'SUCCESS',
        },
        manager,
      );

      return saved;
    });
  }

  async findAll(): Promise<UserRole[]> {
    return await this.userRoleRepository.find({
      relations: ['user', 'rol', 'rol.rolePermissions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<UserRole> {
    const userRole = await this.userRoleRepository.findOne({
      where: { id },
      relations: ['user', 'rol', 'rol.rolePermissions'],
    });

    if (!userRole) {
      throw new NotFoundException(`Asignación de rol con ID ${id} no encontrada`);
    }

    return userRole;
  }

  async findByUserId(userId: number): Promise<UserRole[]> {
    if (!userId || userId <= 0) {
      throw new BadRequestException(`ID de usuario inválido`);
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    return await this.userRoleRepository.find({
      where: { userId },
      relations: ['rol', 'rol.rolePermissions', 'rol.rolePermissions.permission'],
    });
  }

  async update(
    id: number,
    updateUsuarioRolDto: UpdateUsuarioRolDto,
  ): Promise<UserRole> {
    if (!id || id <= 0) {
      throw new BadRequestException(`ID de asignación inválido`);
    }

    return await this.userRoleRepository.manager.transaction(async (manager) => {
      const userRoleRepo = manager.getRepository(UserRole);
      const rolRepo = manager.getRepository(Rol);

      const userRole = await userRoleRepo.findOne({
        where: { id },
        relations: ['user', 'rol'],
      });
      if (!userRole) {
        throw new NotFoundException(`Asignación de rol con ID ${id} no encontrada`);
      }

      const previousRoles = await this.getUserRoleSlugs(userRoleRepo, userRole.userId);
      let newRolSlug = userRole.rol?.slug;

      if (
        updateUsuarioRolDto.roleId &&
        updateUsuarioRolDto.roleId !== userRole.roleId
      ) {
        if (updateUsuarioRolDto.roleId <= 0) {
          throw new BadRequestException(`ID de rol inválido`);
        }

        const newRol = await rolRepo.findOne({
          where: { id: updateUsuarioRolDto.roleId },
        });
        if (!newRol) {
          throw new NotFoundException(
            `Rol con ID ${updateUsuarioRolDto.roleId} no encontrado`,
          );
        }

        const existingUserRole = await userRoleRepo.findOne({
          where: {
            userId: userRole.userId,
            roleId: updateUsuarioRolDto.roleId,
          },
        });

        if (existingUserRole) {
          throw new BadRequestException(
            `El usuario ya tiene asignado este rol`,
          );
        }

        newRolSlug = newRol.slug;
      }

      Object.assign(userRole, updateUsuarioRolDto);
      const saved = await userRoleRepo.save(userRole);
      const nextRoles = await this.getUserRoleSlugs(userRoleRepo, userRole.userId);

      await this.auditService?.logCritical(
        {
          action: 'USER_ROLE_UPDATED',
          module: 'roles',
          entityType: 'User',
          entityId: userRole.userId,
          description: `Asignación de rol #${id} actualizada para usuario #${userRole.userId} (nuevo rol: ${newRolSlug || saved.roleId})`,
          oldValues: { roles: previousRoles },
          newValues: { roles: nextRoles, updatedAssignmentId: id, roleId: saved.roleId, roleSlug: newRolSlug },
          status: 'SUCCESS',
        },
        manager,
      );

      return saved;
    });
  }

  async remove(id: number): Promise<{ message: string }> {
    if (!id || id <= 0) {
      throw new BadRequestException(`ID de asignación inválido`);
    }

    return await this.userRoleRepository.manager.transaction(async (manager) => {
      const userRoleRepo = manager.getRepository(UserRole);
      const userRole = await userRoleRepo.findOne({
        where: { id },
        relations: ['user', 'rol'],
      });
      if (!userRole) {
        throw new NotFoundException(`Asignación de rol con ID ${id} no encontrada`);
      }

      const previousRoles = await this.getUserRoleSlugs(userRoleRepo, userRole.userId);
      const removedSlug = userRole.rol?.slug || String(userRole.roleId);
      await userRoleRepo.remove(userRole);
      const nextRoles = await this.getUserRoleSlugs(userRoleRepo, userRole.userId);

      await this.auditService?.logCritical(
        {
          action: 'USER_ROLE_REMOVED',
          module: 'roles',
          entityType: 'User',
          entityId: userRole.userId,
          description: `Rol "${removedSlug}" removido del usuario #${userRole.userId}`,
          oldValues: { roles: previousRoles },
          newValues: { roles: nextRoles, removedRoleId: userRole.roleId, removedRoleSlug: removedSlug },
          status: 'SUCCESS',
        },
        manager,
      );

      return { message: `Asignación de rol eliminada correctamente` };
    });
  }

  async assignRoleToUser(userId: number, roleId: number): Promise<UserRole> {
    if (!userId || userId <= 0) {
      throw new BadRequestException(`ID de usuario inválido`);
    }
    if (!roleId || roleId <= 0) {
      throw new BadRequestException(`ID de rol inválido`);
    }

    return await this.create({ userId, roleId });
  }

  async removeRoleFromUser(userId: number, roleId: number): Promise<void> {
    if (!userId || userId <= 0) {
      throw new BadRequestException(`ID de usuario inválido`);
    }
    if (!roleId || roleId <= 0) {
      throw new BadRequestException(`ID de rol inválido`);
    }

    await this.userRoleRepository.manager.transaction(async (manager) => {
      const userRoleRepo = manager.getRepository(UserRole);
      const userRole = await userRoleRepo.findOne({
        where: { userId, roleId },
        relations: ['rol'],
      });

      if (!userRole) {
        throw new NotFoundException(`Asignación de rol no encontrada`);
      }

      const previousRoles = await this.getUserRoleSlugs(userRoleRepo, userId);
      const removedSlug = userRole.rol?.slug || String(roleId);
      await userRoleRepo.remove(userRole);
      const nextRoles = await this.getUserRoleSlugs(userRoleRepo, userId);

      await this.auditService?.logCritical(
        {
          action: 'USER_ROLE_REMOVED',
          module: 'roles',
          entityType: 'User',
          entityId: userId,
          description: `Rol "${removedSlug}" removido del usuario #${userId}`,
          oldValues: { roles: previousRoles },
          newValues: { roles: nextRoles, removedRoleId: roleId, removedRoleSlug: removedSlug },
          status: 'SUCCESS',
        },
        manager,
      );
    });
  }
}
