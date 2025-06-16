import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  // Crear un usuario
  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = this.userRepository.create(createUserDto);
    return this.userRepository.save(newUser);
  }

  // Buscar un usuario por correo
  async findOneByEmail(correo: string): Promise<User | null> {
    return this.userRepository.findOneBy({ correo });
  }

  // Buscar un usuario por correo e incluir el password (para login, por ejemplo)
  async findByEmailWithPassword(correo: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { correo },
      select: ['id', 'nombre', 'correo', 'password', 'telefono', 'direccion', 'ciudad', 'role'],
    });
  }
 
  // Buscar un usuario por cédula
  async findOneByCedula(cedula: string): Promise<User | null> {
    return this.userRepository.findOneBy({ cedula });
  }

  // Buscar un usuario por teléfono
  async findOneByTelefono(telefono: string): Promise<User | null> {
    return this.userRepository.findOneBy({ telefono });
  }


  // Obtener todos los usuarios
  async findAll(page: number = 1, limit: number = 10, role?: string): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder("user");

    // Si se pasa un rol, filtra por el rol
    if (role) {
      queryBuilder.where("user.role = :role", { role });
    }

    return queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
  }

  // Obtener un usuario por ID
  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`No se ha encontrado ningún usuario con el ID ${id} proporcionado.`);
    }
    return user;
  }

  // Actualizar un usuario
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    // Verificar si el ID es válido
    if (isNaN(id) || id <= 0) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }
    const user = await this.findOne(id); // Verificar si el usuario existe
    const updatedUser = this.userRepository.merge(user, updateUserDto);
    return this.userRepository.save(updatedUser);
  }

  // Eliminar un usuario lógicamente (soft delete)
  async softDeleteUser(id: number): Promise<void> {
    const user = await this.findOne(id); // Verificar si el usuario existe
    await this.userRepository.softDelete(id); // Marca la fecha en deletedAt
  }

  // Restaurar un usuario eliminado lógicamente
  async restoreUser(id: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true, // Incluir los eliminados lógicamente
    });

    if (!user) {
      throw new NotFoundException(`No se ha encontrado ningún usuario con el ID ${id}.`);
    }

    await this.userRepository.restore(id); // Restaura el usuario eliminando la marca en deletedAt
  }

  // Eliminar un usuario físicamente (sin usar eliminación lógica)
  async remove(id: number): Promise<void> {
    const user = await this.findOne(id); // Verificar si el usuario existe
    await this.userRepository.remove(user); // Elimina físicamente el usuario
  }
}
