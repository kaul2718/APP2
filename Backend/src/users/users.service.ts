import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from 'src/common/enums/rol.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async create(createDto: CreateUserDto): Promise<User> {
    // Verificar si ya existe un usuario con la misma cédula o correo
    const existeCedula = await this.userRepository.findOne({
      where: { cedula: createDto.cedula },
      withDeleted: true,
    });

    if (existeCedula) {
      throw new BadRequestException('Ya existe un usuario con esta cédula');
    }

    const existeCorreo = await this.userRepository.findOne({
      where: { correo: createDto.correo },
      withDeleted: true,
    });

    if (existeCorreo) {
      throw new BadRequestException('Ya existe un usuario con este correo');
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createDto.password, salt);

    const nuevoUsuario = this.userRepository.create({
      ...createDto,
      password: hashedPassword,
      estado: createDto.estado !== undefined ? createDto.estado : true,
    });

    return this.userRepository.save(nuevoUsuario);
  }

  async findAll(includeInactive = false): Promise<User[]> {
    return this.userRepository.find({
      where: includeInactive ? {} : { estado: true },
      withDeleted: includeInactive,
      relations: ['clientOrders', 'technicianOrders', 'recepcionistaOrders', 'evidenciasTecnicas'],
    });
  }

  async findOne(id: number, includeInactive = false): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: includeInactive,
      relations: ['clientOrders', 'technicianOrders', 'recepcionistaOrders', 'evidenciasTecnicas'],
    });

    if (!user || (!includeInactive && !user.estado)) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async findByEmail(email: string, withPassword = false): Promise<User | undefined> {
    const options: any = {
      where: { correo: email },
      relations: ['clientOrders', 'technicianOrders', 'recepcionistaOrders']
    };

    if (withPassword) {
      options.select = ['id', 'cedula', 'nombre', 'apellido', 'correo', 'telefono',
        'direccion', 'ciudad', 'password', 'role', 'estado'];
    }

    return this.userRepository.findOne(options);
  }

  async update(id: number, updateDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id, true);

    // Verificar duplicados de cédula
    if (updateDto.cedula && updateDto.cedula !== user.cedula) {
      const existeCedula = await this.userRepository.findOne({
        where: { cedula: updateDto.cedula },
        withDeleted: true,
      });

      if (existeCedula) {
        throw new BadRequestException('Ya existe un usuario con esta cédula');
      }
      user.cedula = updateDto.cedula;
    }

    // Verificar duplicados de correo
    if (updateDto.correo && updateDto.correo !== user.correo) {
      const existeCorreo = await this.userRepository.findOne({
        where: { correo: updateDto.correo },
        withDeleted: true,
      });

      if (existeCorreo) {
        throw new BadRequestException('Ya existe un usuario con este correo');
      }
      user.correo = updateDto.correo;
    }

    // Actualizar campos básicos
    if (updateDto.nombre) user.nombre = updateDto.nombre;
    if (updateDto.apellido) user.apellido = updateDto.apellido;
    if (updateDto.telefono) user.telefono = updateDto.telefono;
    if (updateDto.direccion) user.direccion = updateDto.direccion;
    if (updateDto.ciudad) user.ciudad = updateDto.ciudad;
    if (updateDto.role) user.role = updateDto.role;
    if (updateDto.estado !== undefined) user.estado = updateDto.estado;

    // Actualizar contraseña si se proporciona
    if (updateDto.password) {
      const salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(updateDto.password, salt);
    }

    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<{ message: string }> {
    const user = await this.findOne(id);

    // Soft delete con TypeORM
    await this.userRepository.softRemove(user);

    // Además marcamos como inactivo
    user.estado = false;
    await this.userRepository.save(user);

    return { message: `Usuario con ID ${id} deshabilitado (soft delete).` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const user = await this.findOne(id, true);

    if (!user.deletedAt) {
      throw new BadRequestException('El usuario no está eliminado');
    }

    // Restauramos el soft delete
    await this.userRepository.restore(id);

    // Lo marcamos como activo
    user.estado = true;
    await this.userRepository.save(user);

    return { message: `Usuario con ID ${id} restaurado.` };
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    includeInactive = false,
  ): Promise<{ data: User[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.clientOrders', 'clientOrders')
      .leftJoinAndSelect('user.technicianOrders', 'technicianOrders')
      .leftJoinAndSelect('user.recepcionistaOrders', 'recepcionistaOrders');

    if (search) {
      query.where(
        '(LOWER(user.nombre) LIKE LOWER(:search) OR ' +
        'LOWER(user.apellido) LIKE LOWER(:search) OR ' +
        'LOWER(user.correo) LIKE LOWER(:search) OR ' +
        'user.cedula LIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (!includeInactive) {
      query.andWhere('user.estado = :estado', { estado: true })
        .andWhere('user.deletedAt IS NULL');
    }

    query.skip(skip)
      .take(limit)
      .orderBy('user.nombre', 'ASC');

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  async toggleStatus(id: number): Promise<User> {
    const user = await this.findOne(id, true);

    user.estado = !user.estado;
    await this.userRepository.save(user);

    return user;
  }

  async setResetPasswordToken(userId: number, token: string): Promise<void> {
    await this.userRepository.update(userId, { resetPasswordToken: token });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: token }
    });

    if (!user) {
      throw new NotFoundException('Token de recuperación inválido o expirado');
    }

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = null;

    await this.userRepository.save(user);
  }

  async countByRole(role: Role): Promise<number> {
    return this.userRepository.count({ where: { role } });
  }

  async updatePassword(id: number, currentPassword: string, newPassword: string): Promise<User> {
    // 1. Obtener el usuario y verificar que exista
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'password'] // Asegurarnos de incluir el password
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // 2. Verificar que el usuario tenga contraseña
    if (!user.password) {
      throw new BadRequestException('El usuario no tiene contraseña configurada');
    }

    // 3. Validar contraseña actual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // 4. Validar que la nueva contraseña sea diferente
    if (currentPassword === newPassword) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
    }

    // 5. Validar fortaleza de la nueva contraseña
    if (newPassword.length < 6) {
      throw new BadRequestException('La nueva contraseña debe tener al menos 6 caracteres');
    }

    // 6. Hashear y guardar la nueva contraseña
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(newPassword, salt);

    return this.userRepository.save(user);
  }
}