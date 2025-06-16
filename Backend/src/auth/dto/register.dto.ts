import { IsString, IsNotEmpty, IsEmail, Matches, Length } from 'class-validator';
import { Role } from '../../common/enums/rol.enum';
import { IsCedulaEcuatoriana } from '../../decorators/is-cedula-ecuatoriana.decorator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @Transform(({value})=> value.trim())
  @IsCedulaEcuatoriana({ message: 'La cédula ecuatoriana no es válida.' })
  cedula: string;

  @Transform(({value})=> value.trim())
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'El correo no es válido.' })
  correo: string;

  @Transform(({value})=> value.trim())
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'El teléfono debe tener 10 dígitos.' })
  telefono: string;
  
  @Transform(({value})=> value.trim())
  @IsString()
  @IsNotEmpty()
  direccion: string;

  @Transform(({value})=> value.trim())
  @IsString()
  @IsNotEmpty()
  ciudad: string;
  
  @Transform(({value})=> value.trim())
  @IsNotEmpty()
  @IsString()
  @Length(8, 20, { message: 'La contraseña debe tener entre 6 y 20 caracteres.' })
  password: string;

  @IsString()
  role: Role;
}
