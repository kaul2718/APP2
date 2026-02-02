import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const { nombre, slug, descripcion } = createPermissionDto;

    // Validar que el slug sea único
    const existingPermission = await this.permissionRepository.findOne({
      where: { slug },
    });

    if (existingPermission) {
      throw new BadRequestException(`El permiso con slug "${slug}" ya existe`);
    }

    const permission = this.permissionRepository.create({
      nombre,
      slug,
      descripcion,
    });

    return await this.permissionRepository.save(permission);
  }

  async findAll(): Promise<Permission[]> {
    return await this.permissionRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permiso con ID ${id} no encontrado`);
    }

    return permission;
  }

  async findBySlug(slug: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { slug },
    });

    if (!permission) {
      throw new NotFoundException(`Permiso con slug "${slug}" no encontrado`);
    }

    return permission;
  }

  async update(
    id: number,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    const permission = await this.findOne(id);

    // Validar slug único si es actualizado
    if (
      updatePermissionDto.slug &&
      updatePermissionDto.slug !== permission.slug
    ) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { slug: updatePermissionDto.slug },
      });

      if (existingPermission) {
        throw new BadRequestException(
          `El permiso con slug "${updatePermissionDto.slug}" ya existe`,
        );
      }
    }

    Object.assign(permission, updatePermissionDto);
    return await this.permissionRepository.save(permission);
  }

  async remove(id: number): Promise<{ message: string }> {
    const permission = await this.findOne(id);
    await this.permissionRepository.remove(permission);

    return { message: `Permiso ${permission.nombre} eliminado correctamente` };
  }

  async findByIds(ids: number[]): Promise<Permission[]> {
    return await this.permissionRepository.findByIds(ids);
  }
}
