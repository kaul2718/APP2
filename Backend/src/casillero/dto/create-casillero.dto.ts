import { EstadoCasillero } from "src/common/enums/estadoCasillero.enum";
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { IsNotBlank } from "src/decorators/is-not-blank-decorator";

export class CreateCasilleroDto {

    // ✅ Valida que no sea vacío ni espacios en blanco y que sea una cadena
    @IsNotBlank({ message: 'El código del casillero no puede estar vacío ni contener solo espacios' })
    @IsString({ message: 'El código del casillero debe ser un texto válido' })
    codigo: string;

    // ✅ Valida que sea una cadena de texto
    @IsString({ message: 'La descripción del casillero debe ser un texto' })
    descripcion: string;

    // ✅ Campo opcional que debe ser booleano si se proporciona
    @IsOptional()
    @IsBoolean({ message: 'El estado debe ser un valor booleano (true o false)' })
    estado?: boolean;

    // ✅ Campo opcional que debe ser numérico si se proporciona
    @IsOptional()
    @IsNumber({}, { message: 'El ID de la orden debe ser un número válido' })
    orderId?: number; // Opcional porque la orden podría asignarse después
}
