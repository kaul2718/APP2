import { IsEmail, IsBoolean, IsNotEmpty, IsOptional, Matches, MinLength, IsArray, IsString } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'La cédula es requerida' })
  @Matches(/^\d{10}$/, { message: 'La cédula debe tener exactamente 10 dígitos.' })
  cedula: string;

  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre: string;

  @IsOptional()
  apellido: string;

  @IsNotEmpty({ message: 'El correo es requerido' })
  @IsEmail({}, { message: 'El correo debe ser válido.' })
  correo: string;

  @IsNotEmpty({ message: 'El teléfono es requerido' })
  @Matches(/^[0-9]{10}$/, { message: 'El número de teléfono debe tener 10 dígitos.' })
  telefono: string;

  @IsNotEmpty({ message: 'La dirección es requerida' })
  direccion: string;

  @IsNotEmpty({ message: 'La ciudad es requerida' })
  ciudad: string;

  @IsOptional()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  password?: string;

  /**
   * Array de slugs de roles a asignar al usuario
   * Ej: ['client', 'tech']
   * Los roles se asignan via UserRole después de crear el usuario
   */
  @IsOptional()
  @IsArray({ message: 'Los roles deben ser un array' })
  @IsString({ each: true, message: 'Cada rol debe ser un string' })
  roleIds?: string[];

  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}