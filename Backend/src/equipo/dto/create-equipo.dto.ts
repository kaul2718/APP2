import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { IsNotBlank } from 'src/decorators/is-not-blank-decorator';

export class CreateEquipoDto {
  @IsNotBlank({ message: 'El tipo de equipo no puede estar vacío' })
  @IsString()
  tipoEquipo: string; // Tipo de equipo (computadora, laptop, etc.)

  @IsNotBlank({ message: 'La marca no puede estar vacía' })
  @IsString()
  marca: string; // Marca del equipo

  @IsNotBlank({ message: 'El modelo no puede estar vacío' })
  @IsString()
  modelo: string; // Modelo del equipo

  @IsNotBlank({ message: 'El numero de serie no puede estar vacío' })
  @IsString()
  numeroSerie: string; // Número de serie del equipo
  
  @IsNotBlank({ message: 'El numero de serie no puede estar vacío' })
  @IsInt()
  @Min(1)
  @IsOptional()
  orderId?: number; 
  
}