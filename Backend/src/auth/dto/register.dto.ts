import { IsString, IsNotEmpty, IsEmail, Matches, Length, IsOptional, IsArray } from 'class-validator';
import { IsCedulaEcuatoriana } from '../../decorators/is-cedula-ecuatoriana.decorator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @Transform(({ value }) => value.trim())
  @IsCedulaEcuatoriana({ message: 'La cédula ecuatoriana no es válida.' })
  cedula: string;

  @Transform(({ value }) => value.trim())
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @Transform(({ value }) => value.trim())
  @IsString()
  @IsOptional()
  apellido?: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'El correo no es válido.' })
  correo: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @Matches(/^[0-9\s\-+()]{9,16}$/, { message: 'El número de teléfono debe tener entre 9 y 16 caracteres.' })
  telefono: string;

  @Transform(({ value }) => value.trim())
  @IsString()
  @IsNotEmpty()
  direccion: string;

  @Transform(({ value }) => value.trim())
  @IsString()
  @IsNotEmpty()
  ciudad: string;


  @IsOptional()
  @IsString()
  @Length(8, 20, { message: 'La contraseña debe tener entre 6 y 20 caracteres.' })
  password?: string;

  /**
   * Array de slugs de roles a asignar
   * Ej: ['client', 'tech']
   * Opcional - si no se proporciona, se asigna 'user' por defecto
   */
  @IsOptional()
  @IsArray({ message: 'Los roles deben ser un array' })
  @IsString({ each: true, message: 'Cada rol debe ser un string' })
  roleIds?: string[];
}
