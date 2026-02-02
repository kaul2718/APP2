import { IsEmail, IsBoolean, IsNotEmpty, IsOptional, Matches, MinLength, IsArray, IsString } from 'class-validator';
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
  @IsArray({ message: 'Los roles deben ser un array' })
  @IsString({ each: true, message: 'Cada rol debe ser un string' })
  roleIds?: string[];

  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}