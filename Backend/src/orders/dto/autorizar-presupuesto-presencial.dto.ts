import { IsString, IsIn, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ModalidadAutorizacion } from '../../presupuesto/entities/autorizacion-presupuesto.entity';

export class AutorizarPresupuestoPresencialDto {
  @IsOptional()
  @IsIn(['ACEPTADO', 'RECHAZADO', 'APROBADO'], { message: 'La acción debe ser ACEPTADO, APROBADO o RECHAZADO' })
  action?: 'ACEPTADO' | 'RECHAZADO' | 'APROBADO';

  @IsOptional()
  @IsIn(['ACEPTADO', 'RECHAZADO', 'APROBADO'], { message: 'La decisión debe ser ACEPTADO, APROBADO o RECHAZADO' })
  decision?: 'ACEPTADO' | 'RECHAZADO' | 'APROBADO';

  @IsOptional()
  @IsEnum(ModalidadAutorizacion, {
    message:
      'Modalidad de autorización inválida. Valores permitidos: PRESENCIAL_FIRMA, CONFIRMACION_TELEFONICA, CONFIRMACION_MENSAJE_CORREO, AUTORIZACION_INTERNA',
  })
  modalidad?: ModalidadAutorizacion;

  @IsOptional()
  @IsString()
  autorizanteNombre?: string;

  @IsOptional()
  @IsString()
  autorizanteIdentificacion?: string;

  @IsOptional()
  @IsString()
  autorizanteCedula?: string;

  @IsOptional()
  @IsString()
  autorizanteParentesco?: string;

  @IsOptional()
  @IsString()
  autorizanteTelefono?: string;

  @IsOptional()
  @IsString()
  firmaBase64?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsBoolean()
  terminosAceptados?: boolean;

  @IsOptional()
  @IsBoolean()
  consentimientoAceptado?: boolean;
}
