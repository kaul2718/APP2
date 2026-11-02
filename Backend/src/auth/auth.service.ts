import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcryptjs from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { EnviarInvitacionDto } from './dto/enviar-invitacion.dto';
import { GuardarNuevaClaveDto } from './dto/guardar-nueva-clave.dto';
import { v4 as uuidv4 } from 'uuid';
import { BrevoService } from './brevo.service'; // ✅ Importación agregada

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly brevoService: BrevoService, // ✅ Inyección del servicio de Brevo
  ) { }

  async register(registerDto: RegisterDto) {
    const {
      cedula,
      nombre,
      apellido,
      correo,
      password,
      telefono,
      direccion,
      ciudad,
      roleIds,
    } = registerDto;

    const cleanCorreo = correo && correo.trim() !== '' ? correo.trim().toLowerCase() : null;
    if (cleanCorreo) {
      const existingUser = await this.usersService.findByEmail(cleanCorreo);
      if (existingUser) {
        throw new BadRequestException('El correo electrónico ya está registrado');
      }
    }

    const allUsers = await this.usersService.findAll(true);
    if (allUsers.some((user) => user.cedula === cedula)) {
      throw new BadRequestException('La cédula ya está registrada');
    }
    if (allUsers.some((user) => user.telefono === telefono)) {
      throw new BadRequestException('El teléfono ya está registrado');
    }

    const hashedPassword = password ? await bcryptjs.hash(password, 10) : null;

    const newUser = await this.usersService.create({
      cedula,
      nombre,
      apellido: apellido || '',
      correo,
      telefono,
      direccion,
      ciudad,
      password: hashedPassword,
      role: (roleIds && roleIds.length > 0) ? roleIds[0] : 'client',
    });

    return {
      id: newUser.id,
      nombre: newUser.nombre,
      apellido: newUser.apellido,
      correo: newUser.correo,
    };
  }

  async login(loginDto: LoginDto) {
    const rawInput = (loginDto.identificador || loginDto.correo || '').trim();
    const password = loginDto.password;

    if (!rawInput) {
      throw new BadRequestException('Debe ingresar su cédula o correo electrónico.');
    }
    if (!password) {
      throw new BadRequestException('La contraseña es obligatoria.');
    }

    const isCedula = /^\d{10}$/.test(rawInput);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawInput);

    if (!isCedula && !isEmail) {
      throw new UnauthorizedException(
        'El formato ingresado no es válido. Ingrese una cédula ecuatoriana de 10 dígitos o su correo electrónico.',
      );
    }

    let userWithPassword: any = null;

    if (isCedula) {
      // Búsqueda por cédula
      userWithPassword = await this.usersService.findByCedula(rawInput, true);

      if (!userWithPassword) {
        throw new UnauthorizedException('Credenciales incorrectas o usuario no registrado.');
      }

      // Restricción para personal administrativo y técnico: deben ingresar obligatoriamente por correo
      const userRole =
        userWithPassword.userRoles && userWithPassword.userRoles.length > 0
          ? userWithPassword.userRoles[0].rol?.slug
          : 'client';

      if (userRole !== 'client' && userRole !== 'cliente') {
        throw new UnauthorizedException(
          'El personal administrativo y técnico debe iniciar sesión con su correo electrónico institucional.',
        );
      }
    } else {
      // Búsqueda por correo electrónico
      const cleanEmail = rawInput.toLowerCase();
      userWithPassword = await this.usersService.findByEmail(cleanEmail, true);

      if (!userWithPassword) {
        throw new UnauthorizedException('Credenciales incorrectas o usuario no registrado.');
      }
    }

    // Validación fundamental: si el cliente no tiene contraseña configurada, no permitir acceso
    if (!userWithPassword.password) {
      throw new UnauthorizedException(
        'Esta cuenta aún no ha sido activada. Por favor, acérquese a recepción para solicitar la activación presencial de su cuenta.',
      );
    }

    // Validación segura de la contraseña con bcrypt
    const isPasswordValid = await bcryptjs.compare(password, userWithPassword.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    const payload = {
      sub: userWithPassword.id,
      correo: userWithPassword.correo,
      cedula: userWithPassword.cedula,
    };

    const token = await this.jwtService.signAsync(payload);

    // Obtener el rol principal del usuario
    const userRole =
      userWithPassword.userRoles && userWithPassword.userRoles.length > 0
        ? userWithPassword.userRoles[0].rol.slug
        : 'client';

    // Obtener los permisos asociados
    const permissionsSlugs =
      userWithPassword.userRoles &&
      userWithPassword.userRoles.length > 0 &&
      userWithPassword.userRoles[0].rol.rolePermissions
        ? userWithPassword.userRoles[0].rol.rolePermissions
            .map((rp) => rp.permission?.slug)
            .filter(Boolean)
        : [];

    return {
      token,
      user: {
        id: userWithPassword.id,
        cedula: userWithPassword.cedula,
        nombre: userWithPassword.nombre,
        apellido: userWithPassword.apellido,
        correo: userWithPassword.correo,
        telefono: userWithPassword.telefono,
        direccion: userWithPassword.direccion,
        ciudad: userWithPassword.ciudad,
        role: userRole,
        permissions: permissionsSlugs,
      },
    };
  }

  async profile(activeUser: any) {
    let user: any = null;
    if (activeUser?.id || activeUser?.sub) {
      user = await this.usersService.findOne(activeUser.id || activeUser.sub);
    } else if (activeUser?.correo) {
      user = await this.usersService.findByEmail(activeUser.correo);
    }

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const userRole =
      user.userRoles && user.userRoles.length > 0
        ? user.userRoles[0].rol.slug
        : 'client';

    const permissionsSlugs =
      user.userRoles &&
      user.userRoles.length > 0 &&
      user.userRoles[0].rol.rolePermissions
        ? user.userRoles[0].rol.rolePermissions
            .map((rp) => rp.permission?.slug)
            .filter(Boolean)
        : [];

    return {
      id: user.id,
      cedula: user.cedula,
      nombre: user.nombre,
      apellido: user.apellido,
      correo: user.correo,
      telefono: user.telefono,
      direccion: user.direccion,
      ciudad: user.ciudad,
      role: userRole,
      permissions: permissionsSlugs,
    };
  }


  async enviarInvitacion(dto: EnviarInvitacionDto) {
    // 1. Buscar al usuario por correo
    const user = await this.usersService.findByEmail(dto.correo, true); // ← Asegúrate de incluir el password

    if (!user) {
      throw new NotFoundException('No existe un usuario con este correo');
    }

    // 2. Validación clave: Si YA TIENE contraseña, lanzar error
    if (user.password) {
      throw new BadRequestException(
        'Este usuario ya tiene contraseña registrada. No se puede enviar invitación.'
      );
    }

    // 3. Si pasa las validaciones, generar token y enviar correo
    const token = uuidv4();
    await this.usersService.setResetPasswordToken(user.id, token);

    const enlace = `http://localhost:4000/establecer-password?token=${token}`;
    await this.brevoService.enviarInvitacion(user.nombre, user.correo, enlace);

    return { message: 'Correo de invitación enviado correctamente' };
  }

  async guardarNuevaClave(dto: GuardarNuevaClaveDto) {
    try {
      await this.usersService.resetPassword(dto.token, dto.password);
      return {
        success: true,
        message: 'Contraseña creada correctamente'
      };
    } catch (error) {
      // Aquí discriminamos el error para enviar un mensaje claro
      if (error instanceof Error) {
        if (
          error.message.includes('Token expirado') ||
          error.message.includes('ya fue usado') ||
          error.message.includes('inválido')
        ) {
          throw new BadRequestException({
            success: false,
            message: error.message,
          });
        }
      }

      throw new BadRequestException({
        success: false,
        message: 'Error al establecer la contraseña',
        error: error.message,
      });
    }
  }

  async restablecerContraseña(correo: string) {
    const user = await this.usersService.findByEmail(correo, true); // incluir password si aplica

    if (!user) {
      throw new NotFoundException('No existe un usuario con este correo');
    }

    // Si NO tiene contraseña, probablemente sea un usuario recién creado (invitación)
    if (!user.password) {
      throw new BadRequestException(
        'Este usuario aún no ha activado su cuenta. Usa el envío de invitación.'
      );
    }

    // Generar nuevo token y guardarlo
    const token = uuidv4();
    await this.usersService.setResetPasswordToken(user.id, token);

    // Enlace para restablecer contraseña (frontend)
    const enlace = `http://localhost:4000/establecer-password?token=${token}`;

    // Enviar correo (usa tu servicio de Brevo, Nodemailer, etc.)
    await this.brevoService.enviarResetPassword(user.nombre, user.correo, enlace);

    return { message: 'Se ha enviado el enlace para restablecer la contraseña.' };
  }

}
