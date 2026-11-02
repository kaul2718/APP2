import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ConsumirActivacionDto {
  @IsNotEmpty({ message: 'El token de activación es obligatorio.' })
  @IsString({ message: 'El token debe ser una cadena de texto.' })
  token: string;

  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria.' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @Matches(/[A-Z]/, { message: 'La contraseña debe contener al menos una letra mayúscula.' })
  @Matches(/[a-z]/, { message: 'La contraseña debe contener al menos una letra minúscula.' })
  @Matches(/\d/, { message: 'La contraseña debe contener al menos un número.' })
  password: string;

  @IsNotEmpty({ message: 'Debe confirmar la contraseña.' })
  @IsString({ message: 'La confirmación debe ser una cadena de texto.' })
  confirmPassword: string;
}
