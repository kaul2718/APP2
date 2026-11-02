import { IsNotEmpty, IsString, IsIn, IsOptional, IsBoolean } from 'class-validator';

export class AutorizarPresupuestoPresencialDto {
  @IsOptional()
  @IsIn(['ACEPTADO', 'RECHAZADO', 'APROBADO'], { message: 'La acción debe ser ACEPTADO, APROBADO o RECHAZADO' })
  action?: 'ACEPTADO' | 'RECHAZADO' | 'APROBADO';

  @IsOptional()
  @IsIn(['ACEPTADO', 'RECHAZADO', 'APROBADO'], { message: 'La decisión debe ser ACEPTADO, APROBADO o RECHAZADO' })
  decision?: 'ACEPTADO' | 'RECHAZADO' | 'APROBADO';

  @IsNotEmpty({ message: 'El nombre del autorizante es requerido' })
  @IsString()
  autorizanteNombre: string;

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

  @IsNotEmpty({ message: 'La firma manuscrita capturada en pantalla es obligatoria para la autorización presencial' })
  @IsString()
  firmaBase64: string;

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
