import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { BrevoService } from 'src/auth/brevo.service';
import { JwtService } from '@nestjs/jwt';
import { UsuarioRolService } from 'src/usuario-rol/usuario-rol.service';
import { RolService } from 'src/rol/rol.service';
import parsePhoneNumberFromString from 'libphonenumber-js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly brevoService: BrevoService,
    private readonly jwtService: JwtService,
    private readonly usuarioRolService: UsuarioRolService,
    private readonly rolService: RolService,
  ) { }

  async create(createDto: CreateUserDto): Promise<User> {
    // ✅ Validar campos requeridos
    if (!createDto.cedula || createDto.cedula.trim() === '') {
      throw new BadRequestException('La cédula es requerida');
    }
    if (!createDto.nombre || createDto.nombre.trim() === '') {
      throw new BadRequestException('El nombre es requerido');
    }
    if (!createDto.correo || createDto.correo.trim() === '') {
      throw new BadRequestException('El correo es requerido');
    }
    if (!createDto.telefono || createDto.telefono.trim() === '') {
      throw new BadRequestException('El teléfono es requerido');
    }

    // ✅ La contraseña es OPCIONAL - si no se proporciona, enviar invitación por correo
    if (createDto.password && createDto.password.trim() === '') {
      createDto.password = undefined; // Convertir string vacío a undefined
    }

    // ✅ Validar formato de cédula (10 dígitos)
    if (!/^\d{10}$/.test(createDto.cedula)) {
      throw new BadRequestException('La cédula debe tener exactamente 10 dígitos');
    }

    // ✅ Validar formato de teléfono (usando libphonenumber-js para celulares y convencionales en EC)
    const parsedPhone = parsePhoneNumberFromString(createDto.telefono, 'EC');
    if (!parsedPhone || !parsedPhone.isValid()) {
      throw new BadRequestException('El teléfono ingresado no es un número de Ecuador válido (Celular o Fijo)');
    }
    // Guardar el número limpio en formato nacional sin espacios (ej: 0991234567 o 022123456)
    createDto.telefono = parsedPhone.formatNational().replace(/\s+/g, '');

    // ✅ Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createDto.correo)) {
      throw new BadRequestException('El correo no es válido');
    }

    // ✅ Validar fortaleza de contraseña SOLO SI se proporciona
    if (createDto.password) {
      if (createDto.password.length < 8) {
        throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');
      }
      if (!/[A-Z]/.test(createDto.password)) {
        throw new BadRequestException('La contraseña debe contener al menos una mayúscula');
      }
      if (!/\d/.test(createDto.password)) {
        throw new BadRequestException('La contraseña debe contener al menos un número');
      }
    }

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

    // Encriptar la contraseña si se proporciona, sino dejarla null
    let hashedPassword: string | null = null;
    if (createDto.password) {
      const salt = await bcrypt.genSalt();
      hashedPassword = await bcrypt.hash(createDto.password, salt);
    }

    const nuevoUsuario = this.userRepository.create({
      ...createDto,
      password: hashedPassword,
      estado: createDto.estado !== undefined ? createDto.estado : true,
    });

    const usuarioGuardado = await this.userRepository.save(nuevoUsuario);

    // ✅ SOPORTE PARA ROL POR SLUG (Enviado desde el frontend como 'role')
    if (createDto.role && (!createDto.roleIds || createDto.roleIds.length === 0)) {
        try {
            const roleObj = await this.rolService.findBySlug(createDto.role);
            if (roleObj) {
                if (!createDto.roleIds) createDto.roleIds = [];
                createDto.roleIds.push(roleObj.id);
            }
        } catch (error) {
            console.error(`Error al buscar rol por slug ${createDto.role}:`, error.message);
        }
    }

    // ✅ ASIGNAR ROLES al nuevo usuario
    if (createDto.roleIds && createDto.roleIds.length > 0) {
      for (const roleId of createDto.roleIds) {
        try {
          const numericRoleId = Number(roleId);
          if (!isNaN(numericRoleId)) {
            await this.usuarioRolService.assignRoleToUser(usuarioGuardado.id, numericRoleId);
          }
        } catch (error) {
          throw error;
        }
      }
    }

    // El envío de invitación se maneja explícitamente desde el frontend o AuthService
    // para evitar duplicidad y asegurar el formato correcto del enlace.

    // ✅ Recargar el usuario con sus relaciones de roles
    const usuarioConRoles = await this.userRepository.findOne({
      where: { id: usuarioGuardado.id },
      relations: ['userRoles', 'userRoles.rol'],
    });

    // ✅ Mapear roles para respuesta
    const usuarioObj = usuarioConRoles as any;
    usuarioObj.role = usuarioConRoles?.userRoles?.length > 0 
      ? usuarioConRoles.userRoles[0].rol.slug 
      : 'client';
    
    return usuarioConRoles;
  }

  async findAll(includeInactive = false): Promise<User[]> {
    const data = await this.userRepository.find({
      where: includeInactive ? {} : { estado: true },
      withDeleted: includeInactive,
      relations: ['userRoles', 'userRoles.rol'],
    });

    return data.map(user => {
      const userObj = user as any;
      userObj.role = user.userRoles?.length > 0 ? user.userRoles[0].rol.slug : 'client';
      return userObj;
    });
  }

  async findOne(id: number, includeInactive = false): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: includeInactive,
      relations: [
        'userRoles',
        'userRoles.rol',
        'userRoles.rol.rolePermissions',
        'userRoles.rol.rolePermissions.permission'
      ],
    });

    if (!user || (!includeInactive && !user.estado)) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const userObj = user as any;
    userObj.role = user.userRoles?.length > 0 ? user.userRoles[0].rol.slug : 'client';
    return userObj;
  }

  async findByEmail(email: string, withPassword = false): Promise<User | undefined> {
    // ✅ Validar que el email no esté vacío
    if (!email || email.trim() === '') {
      throw new BadRequestException('El correo es requerido');
    }

    const options: any = {
      where: { correo: email, estado: true },
      relations: [
        'userRoles',
        'userRoles.rol',
        'userRoles.rol.rolePermissions',
        'userRoles.rol.rolePermissions.permission'
      ],
    };

    if (withPassword) {
      options.select = ['id', 'cedula', 'nombre', 'apellido', 'correo', 'telefono',
        'direccion', 'ciudad', 'password', 'estado'];
    }

    return this.userRepository.findOne(options);
  }

  async update(id: number, updateDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id, true);

    // ✅ Validar campos no estén vacíos si se proporcionan
    if (updateDto.nombre !== undefined && updateDto.nombre.trim() === '') {
      throw new BadRequestException('El nombre no puede estar vacío');
    }
    if (updateDto.apellido !== undefined && updateDto.apellido.trim() === '') {
      throw new BadRequestException('El apellido no puede estar vacío');
    }
    if (updateDto.telefono !== undefined && updateDto.telefono.trim() === '') {
      throw new BadRequestException('El teléfono no puede estar vacío');
    }
    if (updateDto.correo !== undefined && updateDto.correo.trim() === '') {
      throw new BadRequestException('El correo no puede estar vacío');
    }

    // ✅ Validar formato de teléfono (usando libphonenumber-js para celulares y convencionales en EC)
    if (updateDto.telefono) {
      const parsedPhone = parsePhoneNumberFromString(updateDto.telefono, 'EC');
      if (!parsedPhone || !parsedPhone.isValid()) {
        throw new BadRequestException('El teléfono ingresado no es un número de Ecuador válido (Celular o Fijo)');
      }
      updateDto.telefono = parsedPhone.formatNational().replace(/\s+/g, '');
    }

    // ✅ Validar formato de correo
    if (updateDto.correo) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateDto.correo)) {
        throw new BadRequestException('El correo no es válido');
      }
    }

    // Verificar duplicados de cédula
    if (updateDto.cedula && updateDto.cedula !== user.cedula) {
      // ✅ Validar formato de cédula
      if (!/^\d{10}$/.test(updateDto.cedula)) {
        throw new BadRequestException('La cédula debe tener exactamente 10 dígitos');
      }

      const existeCedula = await this.userRepository.findOne({
        where: { cedula: updateDto.cedula },
        withDeleted: true,
      });

      if (existeCedula) {
        throw new BadRequestException('Ya existe un usuario con esta cédula');
      }
      user.cedula = updateDto.cedula.trim();
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
      user.correo = updateDto.correo.trim();
    }

    // Actualizar campos básicos
    if (updateDto.nombre) user.nombre = updateDto.nombre.trim();
    if (updateDto.apellido) user.apellido = updateDto.apellido.trim();
    if (updateDto.telefono) user.telefono = updateDto.telefono.trim();
    if (updateDto.direccion) user.direccion = updateDto.direccion?.trim();
    if (updateDto.ciudad) user.ciudad = updateDto.ciudad?.trim();
    if (updateDto.estado !== undefined) user.estado = updateDto.estado;

    // Actualizar contraseña si se proporciona
    if (updateDto.password) {
      // ✅ Validar fortaleza de contraseña
      if (updateDto.password.length < 8) {
        throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');
      }
      if (!/[A-Z]/.test(updateDto.password)) {
        throw new BadRequestException('La contraseña debe contener al menos una mayúscula');
      }
      if (!/\d/.test(updateDto.password)) {
        throw new BadRequestException('La contraseña debe contener al menos un número');
      }

      const salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(updateDto.password, salt);
    }

    // Guardar los cambios del usuario
    const usuarioActualizado = await this.userRepository.save(user);

    // Actualizar roles si se proporciona roleIds
    if (updateDto.roleIds && Array.isArray(updateDto.roleIds) && updateDto.roleIds.length > 0) {
      // Obtener roles actuales del usuario
      const rolesActuales = await this.usuarioRolService.findByUserId(user.id);

      // Eliminar roles existentes
      for (const userRole of rolesActuales) {
        await this.usuarioRolService.removeRoleFromUser(user.id, userRole.roleId);
      }

      // Asignar nuevos roles
      for (const roleId of updateDto.roleIds) {
        const roleIdNum = Number(roleId);
        if (!isNaN(roleIdNum)) {
          await this.usuarioRolService.assignRoleToUser(user.id, roleIdNum);
        }
      }
    }

    return usuarioActualizado;
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
    role?: string,
  ): Promise<{ data: User[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .leftJoinAndSelect('userRoles.rol', 'rol');

    // Incluir soft deleted si se solicita
    if (includeInactive) {
      query.withDeleted();
    }

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
      query.andWhere('user.estado = :estado', { estado: true });
    }

    if (role && role !== 'all') {
      query.andWhere('rol.slug = :role', { role });
    }

    query.skip(skip)
      .take(limit)
      .orderBy('user.nombre', 'ASC');

    const [data, total] = await query.getManyAndCount();

    // Transformar los usuarios para que tengan un campo 'role' mapeado desde userRoles
    const transformedData = data.map(user => {
      const userObj = user as any;
      userObj.role = user.userRoles?.length > 0 ? user.userRoles[0].rol.slug : 'client';
      return userObj;
    });

    return { data: transformedData, total };
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

  /**
   * Obtener reporte completo del usuario con todas sus relaciones
   * @param id ID del usuario
   * @returns Datos completos del usuario para reportes
   */
  async getUserReport(id: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: [
        'clientOrders',
        'technicianOrders',
        'recepcionistaOrders',
        'evidenciasTecnicas',
        'userRoles',
        'userRoles.rol',
      ],
    });

    if (!user || !user.estado) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      usuario: {
        id: user.id,
        cedula: user.cedula,
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
        telefono: user.telefono,
        direccion: user.direccion,
        ciudad: user.ciudad,
      },
      roles: user.userRoles?.map(ur => ({ id: ur.id, rol: ur.rol })) || [],
      actividad: {
        ordenesComo_cliente: user.clientOrders?.length || 0,
        ordenesComo_tecnico: user.technicianOrders?.length || 0,
        ordenesComo_recepcionista: user.recepcionistaOrders?.length || 0,
        evidencias_tecnicas: user.evidenciasTecnicas?.length || 0,
      },
      detalles: {
        clientOrders: user.clientOrders || [],
        technicianOrders: user.technicianOrders || [],
        recepcionistaOrders: user.recepcionistaOrders || [],
        evidenciasTecnicas: user.evidenciasTecnicas || [],
      },
    };
  }

  /**
   * Contar usuarios con un rol específico
   * @param roleSlug Slug del rol (ej: 'admin', 'tech')
   * @returns Cantidad de usuarios con ese rol
   */
  async countByRole(roleSlug: string): Promise<number> {
    const count = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.userRoles', 'userRole')
      .innerJoin('userRole.rol', 'rol')
      .where('rol.slug = :slug', { slug: roleSlug })
      .andWhere('user.estado = :estado', { estado: true })
      .andWhere('user.deletedAt IS NULL')
      .getCount();
    return count;
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