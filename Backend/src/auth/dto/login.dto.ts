import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class LoginDto {
  /**
   * Cédula de 10 dígitos o correo electrónico del usuario.
   */
  @IsOptional()
  @IsString({ message: 'El identificador debe ser una cadena de texto.' })
  identificador?: string;

  /**
   * Campo alternativo para retrocompatibilidad con clientes anteriores.
   */
  @IsOptional()
  @IsString({ message: 'El correo debe ser una cadena de texto.' })
  correo?: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  password: string;
}
