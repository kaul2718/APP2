import { PartialType } from '@nestjs/mapped-types';
import { CreateEstadoOrdenDto } from './create-estado-orden.dto';
import { IsNotBlank } from 'src/decorators/is-not-blank-decorator';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateEstadoOrdenDto extends PartialType(CreateEstadoOrdenDto) {
    // ✅ Valida que no sea vacío ni espacios en blanco y que sea una cadena
    @IsNotBlank({ message: 'El nombre del estado no puede estar vacío' })
    @IsString({ message: 'El nombre del estado debe ser un texto' })
    @MaxLength(50)
    nombre?: string;

    // ✅ Valida que no sea vacío ni espacios en blanco y que sea una cadena
    @IsNotBlank({ message: 'La descripcion no puede estar vacío' })
    @IsString({ message: 'La descripcion debe ser un texto' })
    @MaxLength(255)
    descripcion?: string;

    // ✅ Campo opcional que debe ser booleano si se proporciona
    @IsOptional()
    @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
    estado?: boolean;

}
