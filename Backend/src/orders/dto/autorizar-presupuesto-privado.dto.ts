import { IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';

export class AutorizarPresupuestoPrivadoDto {
  @IsNotEmpty({ message: 'El número de orden es requerido' })
  @IsString()
  workorder: string;

  @IsNotEmpty({ message: 'La credencial privada de acceso es requerida' })
  @IsString()
  token: string;

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

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  consentimientoAceptado?: boolean;
}
