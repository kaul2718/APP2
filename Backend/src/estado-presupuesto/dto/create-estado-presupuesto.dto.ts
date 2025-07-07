import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsNotBlank } from 'src/decorators/is-not-blank-decorator';

export class CreateEstadoPresupuestoDto {
  
  // ✅ Valida que no sea vacío ni espacios en blanco y que sea una cadena
  @IsNotBlank({ message: 'El nombre del modelo no puede estar vacío' })
  @IsString({ message: 'El nombre del modelo debe ser un texto' })
  nombre: string;
  
 // ✅ Campo opcional que debe ser booleano si se proporciona
  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  estado?: boolean;

  @IsString({ message: 'La descripcion debe ser un texto' })
  @IsNotEmpty({ message: 'Agregar una descripcion' })
  descripcion: string;


}
