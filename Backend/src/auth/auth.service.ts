import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcryptjs from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'src/common/enums/rol.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  async register(registerDto: RegisterDto) {
    const { cedula, nombre, apellido, correo, password, telefono, direccion, ciudad, role } = registerDto;

    // Verificar si ya existe un usuario con el mismo correo
    const existingUser = await this.usersService.findByEmail(correo);
    if (existingUser) {
      throw new BadRequestException('El correo electrónico ya está registrado');
    }

    // Verificar duplicados de cédula y teléfono
    const allUsers = await this.usersService.findAll(true);
    if (allUsers.some(user => user.cedula === cedula)) {
      throw new BadRequestException('La cédula ya está registrada');
    }
    if (allUsers.some(user => user.telefono === telefono)) {
      throw new BadRequestException('El teléfono ya está registrado');
    }

    // Crear nuevo usuario
    const newUser = await this.usersService.create({
      cedula,
      nombre,
      apellido: apellido || '',
      correo,
      telefono,
      direccion,
      ciudad,
      password: await bcryptjs.hash(password, 10),
      role: role || Role.CLIENT,
    });

    return {
      id: newUser.id,
      nombre: newUser.nombre,
      apellido: newUser.apellido,
      correo: newUser.correo,
      role: newUser.role
    };
  }

  async login(loginDto: LoginDto) {
    const { correo, password } = loginDto;

    // Buscar usuario incluyendo la contraseña (necesita un método especial en UsersService)
    const user = await this.usersService.findByEmail(correo);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Para comparar contraseña necesitamos el usuario con password
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
      role: user.role
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
      }
    };
  }

  async profile({ correo }: { correo: string }) {
    return this.usersService.findByEmail(correo);
  }
}