import { IsEmail, IsBoolean, IsEnum, IsNotEmpty, IsOptional, Matches, MinLength } from 'class-validator';
import { Role } from '../../common/enums/rol.enum';
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @Matches(/^\d{10}$/, { message: 'La cédula debe tener exactamente 10 dígitos.' })
  cedula?: string;

  @IsOptional()
  nombre?: string;

  @IsOptional()
  apellido?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo debe ser válido.' })
  correo?: string;

  @IsOptional()
  @Matches(/^[0-9]{10}$/, { message: 'El número de teléfono debe tener 10 dígitos.' })
  telefono?: string;

  @IsOptional()
  direccion?: string;

  @IsOptional()
  ciudad?: string;

  @IsOptional()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  password?: string;

  @IsOptional()
  @IsEnum(Role, { message: 'El rol proporcionado no es válido' })
  role?: Role;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}