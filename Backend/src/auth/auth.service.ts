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

  async register({ cedula, nombre, correo, password, telefono, direccion, ciudad, role }: RegisterDto) {
    // Verificar si ya existe un usuario con el mismo correo
    const userByEmail = await this.usersService.findOneByEmail(correo);
    if (userByEmail) {
      throw new BadRequestException('Ya existe un usuario registrado con este correo. Por favor, verifique la información e intente nuevamente.');
    }
  
    // Verificar si ya existe un usuario con la misma cédula
    const userByCedula = await this.usersService.findOneByCedula(cedula);
    if (userByCedula) {
      throw new BadRequestException('Ya existe un usuario registrado con esta cédula. Por favor, verifique la información e intente nuevamente.');
    }
  
    // Verificar si ya existe un usuario con el mismo teléfono
    const userByPhone = await this.usersService.findOneByTelefono(telefono);
    if (userByPhone) {
      throw new BadRequestException('Ya existe un usuario registrado con este teléfono. Por favor, verifique la información e intente nuevamente.');
    }
  
    // Asignar rol por defecto si no se proporciona
    const userRole = role ?? Role.CLIENT;
  
    // Crear usuario con todos los campos requeridos
    await this.usersService.create({
      cedula,
      nombre,
      correo,
      telefono,
      direccion,
      ciudad,
      password: await bcryptjs.hash(password, 10),
      role: userRole,
    });
  
    return {
      nombre,
      cedula,
      correo,
    };
  }


  async login({ correo, password }: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(correo);
    if (!user) {
      throw new UnauthorizedException('El correo electrónico proporcionado es incorrecto o no se encuentra registrado en nuestro sistema.');
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña proporcionada es incorrecta. Por favor, verifique e intente nuevamente.');
    }

    // Aquí agregamos el `id` del usuario como `sub` en el payload
    const payload = {
      sub: user.id,  // ✅ Agregar el ID del usuario
      correo: user.correo,
      role: user.role
    };

    const token = await this.jwtService.signAsync(payload, { expiresIn: '1h' }); // Expiración del token

    return {
      token,
      user: {
        id: user.id,
        cedula: user.cedula,
        nombre: user.nombre,
        telefono: user.telefono,
        direccion: user.direccion,
        ciudad: user.ciudad,
        correo: user.correo,
        role: user.role,
      },
    };
  }

  async profile({ correo, role }: { correo: string; role: string }) {
    return await this.usersService.findOneByEmail(correo);
  }
}