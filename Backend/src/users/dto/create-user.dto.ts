import { IsEmail, IsBoolean, IsNotEmpty, IsOptional, Matches, MinLength, IsArray, IsNumber } from 'class-validator';

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
  @Matches(/^[0-9\s\-+()]{9,16}$/, { message: 'El número de teléfono debe tener entre 9 y 16 caracteres.' })
  telefono: string;

  @IsNotEmpty({ message: 'La dirección es requerida' })
  direccion: string;

  @IsNotEmpty({ message: 'La ciudad es requerida' })
  ciudad: string;

  @IsOptional()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  password?: string;

  /**
   * Array de IDs de roles a asignar al usuario
   * Ej: [1, 2]
   * Los roles se asignan via UserRole después de crear el usuario
   */
  @IsOptional()
  @IsArray({ message: 'Los roles deben ser un array' })
  @IsNumber({}, { each: true, message: 'Cada rol debe ser un número (ID)' })
  roleIds?: number[];

  @IsOptional()
  role?: string;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}