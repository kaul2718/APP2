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
import { Role } from 'src/common/enums/rol.enum';
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
      role,
    } = registerDto;

    const existingUser = await this.usersService.findByEmail(correo);
    if (existingUser) {
      throw new BadRequestException('El correo electrónico ya está registrado');
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
      role: role || Role.CLIENT,
    });

    return {
      id: newUser.id,
      nombre: newUser.nombre,
      apellido: newUser.apellido,
      correo: newUser.correo,
      role: newUser.role,
    };
  }

  async login(loginDto: LoginDto) {
    const { correo, password } = loginDto;

    const user = await this.usersService.findByEmail(correo);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const userWithPassword = await this.usersService.findByEmail(correo, true);
    if (!userWithPassword || !userWithPassword.password) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcryptjs.compare(password, userWithPassword.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: user.id,
      correo: user.correo,
      role: user.role,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      user: {
        id: user.id,
        cedula: user.cedula,
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
        role: user.role,
      },
    };
  }

  async profile({ correo }: { correo: string }) {
    return this.usersService.findByEmail(correo);
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
