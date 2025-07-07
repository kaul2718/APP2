import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoNotificacionDto } from './create-tipo-notificacion.dto';
import { IsNotBlank } from 'src/decorators/is-not-blank-decorator';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateTipoNotificacionDto extends PartialType(CreateTipoNotificacionDto) {

    @IsNotBlank({ message: 'El nombre del tipo notificación no puede estar vacío' })
    @IsString({ message: 'El nombre del tipo notificación debe ser un texto' })
    nombre?: string;

    @IsNotBlank({ message: 'La descripcion del tipo notificación no puede estar vacío' })
    @IsString({ message: 'La descripcion del tipo notificación debe ser un texto' })
    descripcion?: string;

    @IsOptional()
    @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
    estado?: boolean;
}
