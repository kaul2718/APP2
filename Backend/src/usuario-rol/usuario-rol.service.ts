import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../user-role/entities/user-role.entity';
import { User } from '../users/entities/user.entity';
import { Rol } from '../rol/entities/rol.entity';
import { CreateUsuarioRolDto } from './dto/create-usuario-rol.dto';
import { UpdateUsuarioRolDto } from './dto/update-usuario-rol.dto';

@Injectable()
export class UsuarioRolService {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  async create(createUsuarioRolDto: CreateUsuarioRolDto): Promise<UserRole> {
    const { userId, roleId } = createUsuarioRolDto;

    // Validar que los parámetros no sean null/undefined
    if (!userId || !roleId) {
      throw new BadRequestException(`userId y roleId son requeridos`);
    }

    // Validar que el usuario existe y NO está borrado
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    // Validar que el rol existe y NO está borrado
    const rol = await this.rolRepository.findOne({
      where: { id: roleId },
    });
    if (!rol) {
      throw new NotFoundException(`Rol con ID ${roleId} no encontrado`);
    }

    // Validar que la asignación no exista
    const existingUserRole = await this.userRoleRepository.findOne({
      where: { userId, roleId },
    });

    if (existingUserRole) {
      throw new BadRequestException(
        `El usuario ya tiene asignado este rol`,
      );
    }

    const userRole = this.userRoleRepository.create({
      userId,
      roleId,
    });

    return await this.userRoleRepository.save(userRole);
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

    const userRole = await this.findOne(id);

    // Validar que no haya conflicto con otra asignación
    if (
      updateUsuarioRolDto.roleId &&
      updateUsuarioRolDto.roleId !== userRole.roleId
    ) {
      if (updateUsuarioRolDto.roleId <= 0) {
        throw new BadRequestException(`ID de rol inválido`);
      }

      const newRol = await this.rolRepository.findOne({
        where: { id: updateUsuarioRolDto.roleId },
      });
      if (!newRol) {
        throw new NotFoundException(
          `Rol con ID ${updateUsuarioRolDto.roleId} no encontrado`,
        );
      }

      const existingUserRole = await this.userRoleRepository.findOne({
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
    }

    Object.assign(userRole, updateUsuarioRolDto);
    return await this.userRoleRepository.save(userRole);
  }

  async remove(id: number): Promise<{ message: string }> {
    if (!id || id <= 0) {
      throw new BadRequestException(`ID de asignación inválido`);
    }

    const userRole = await this.findOne(id);
    await this.userRoleRepository.remove(userRole);

    return { message: `Asignación de rol eliminada correctamente` };
  }

  async assignRoleToUser(userId: number, roleId: number): Promise<UserRole> {
    // Validaciones de parámetros
    if (!userId || userId <= 0) {
      throw new BadRequestException(`ID de usuario inválido`);
    }
    if (!roleId || roleId <= 0) {
      throw new BadRequestException(`ID de rol inválido`);
    }

    return await this.create({ userId, roleId });
  }

  async removeRoleFromUser(userId: number, roleId: number): Promise<void> {
    // Validaciones de parámetros
    if (!userId || userId <= 0) {
      throw new BadRequestException(`ID de usuario inválido`);
    }
    if (!roleId || roleId <= 0) {
      throw new BadRequestException(`ID de rol inválido`);
    }

    const userRole = await this.userRoleRepository.findOne({
      where: { userId, roleId },
    });

    if (!userRole) {
      throw new NotFoundException(`Asignación de rol no encontrada`);
    }

    await this.userRoleRepository.remove(userRole);
  }
}
