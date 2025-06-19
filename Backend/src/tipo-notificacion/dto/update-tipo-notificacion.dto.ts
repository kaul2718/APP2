import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoNotificacionDto } from './create-tipo-notificacion.dto';

export class UpdateTipoNotificacionDto extends PartialType(CreateTipoNotificacionDto) {}
