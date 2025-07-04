import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from 'src/auth/dto/register.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async create(createUserDto: RegisterDto): Promise<User> {
    // Verificar si ya existe un usuario con el mismo correo, cédula o teléfono
    const existingUsers = await Promise.all([
      this.userRepository.findOne({ where: { correo: createUserDto.correo }, withDeleted: true }),
      this.userRepository.findOne({ where: { cedula: createUserDto.cedula }, withDeleted: true }),
      createUserDto.telefono
        ? this.userRepository.findOne({ where: { telefono: createUserDto.telefono }, withDeleted: true })
        : null,
    ]);

    if (existingUsers[0]) {
      throw new BadRequestException('Ya existe un usuario con este correo electrónico.');
    }
    if (existingUsers[1]) {
      throw new BadRequestException('Ya existe un usuario con esta cédula.');
    }
    if (existingUsers[2]) {
      throw new BadRequestException('Ya existe un usuario con este teléfono.');
    }

    const newUser = this.userRepository.create({
      ...createUserDto,
      estado: true, // Por defecto se crea como activo
    });
    return this.userRepository.save(newUser);
  }

  async findOneByEmail(correo: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { correo },
      withDeleted: true,
    });
  }

  async findByEmailWithPassword(correo: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { correo },
      select: ['id', 'nombre', 'correo', 'password', 'telefono', 'direccion', 'ciudad', 'role', 'estado'],
      withDeleted: true,
    });
  }

  async findOneByCedula(cedula: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { cedula },
      withDeleted: true,
    });
  }

  async findOneByTelefono(telefono: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { telefono },
      withDeleted: true,
    });
  }

  async findAll(includeDeleted = false): Promise<User[]> {
    return this.userRepository.find({
      where: includeDeleted ? {} : { estado: true },
      withDeleted: includeDeleted,
    });
  }

  async findOne(id: number, includeDeleted = false): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: includeDeleted,
    });

    if (!user) {
      throw new NotFoundException(`No se ha encontrado ningún usuario con el ID ${id}.`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id, true);

    if (updateUserDto.correo && updateUserDto.correo !== user.correo) {
      const existing = await this.userRepository.findOne({
        where: { correo: updateUserDto.correo },
        withDeleted: true,
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('Ya existe un usuario con este correo electrónico.');
      }
    }

    if (updateUserDto.cedula && updateUserDto.cedula !== user.cedula) {
      const existing = await this.userRepository.findOne({
        where: { cedula: updateUserDto.cedula },
        withDeleted: true,
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('Ya existe un usuario con esta cédula.');
      }
    }

    if (updateUserDto.telefono && updateUserDto.telefono !== user.telefono) {
      const existing = await this.userRepository.findOne({
        where: { telefono: updateUserDto.telefono },
        withDeleted: true,
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('Ya existe un usuario con este teléfono.');
      }
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<{ message: string }> {
    const user = await this.findOne(id);
    user.estado = false;
    await this.userRepository.softRemove(user);
    return { message: `Usuario con ID ${id} deshabilitado (soft delete).` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const user = await this.findOne(id, true);

    if (!user.deletedAt) {
      throw new BadRequestException('El usuario no está eliminado.');
    }

    await this.userRepository.restore(id);
    user.estado = true;
    await this.userRepository.save(user);
    return { message: `Usuario con ID ${id} restaurado.` };
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    includeDeleted = false,
  ): Promise<{ data: User[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.userRepository.createQueryBuilder('user');

    if (search) {
      // Mapear "activo"/"inactivo" a booleano en string
      const mappedEstado =
        search.toLowerCase() === 'activo'
          ? 'true'
          : search.toLowerCase() === 'inactivo'
            ? 'false'
            : search;

      query.where(
        `(LOWER(user.nombre) LIKE LOWER(:search) OR
        LOWER(user.cedula) LIKE LOWER(:search) OR
        LOWER(CAST(user.role AS TEXT)) LIKE LOWER(:search) OR
        LOWER(user.correo) LIKE LOWER(:search) OR
        LOWER(CAST(user.estado AS TEXT)) LIKE LOWER(:estado))`,
        {
          search: `%${search}%`,
          estado: `%${mappedEstado}%`,
        },
      );
    }

    if (!includeDeleted) {
      if (search) {
        query.andWhere('user.deletedAt IS NULL');
      } else {
        query.where('user.deletedAt IS NULL');
      }
    }

    query.skip(skip)
      .take(limit)
      .orderBy('user.nombre', 'ASC');

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }


  async actualizarEstado(id: number, estado: boolean): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.estado = estado;
    await this.userRepository.save(user);

    return user;
  }
}