import { PartialType } from '@nestjs/mapped-types';
import { CreateEquipoDto } from './create-equipo.dto';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { IsNotBlank } from 'src/decorators/is-not-blank-decorator';

export class UpdateEquipoDto extends PartialType(CreateEquipoDto) {
    @IsNotBlank({ message: 'El tipo de equipo no puede estar vacío' })
    @IsString()
    @IsOptional()
    tipoEquipo?: string; // Tipo de equipo (computadora, laptop, etc.)

    @IsNotBlank({ message: 'La marca no puede estar vacía' })
    @IsString()
    @IsOptional()
    marca?: string; // Marca del equipo

    @IsNotBlank({ message: 'El modelo no puede estar vacío' })
    @IsString()
    @IsOptional()
    modelo?: string; // Modelo del equipo

    @IsNotBlank({ message: 'El numero de serie no puede estar vacío' })
    @IsString()
    @IsOptional()
    numeroSerie?: string; // Número de serie del equipo

    @IsNotBlank({ message: 'El numero de serie no puede estar vacío' })
    @IsInt()
    @Min(1)
    @IsOptional()
    orderId?: number;
}