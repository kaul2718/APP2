import { IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';

export class ResponderPresupuestoClienteDto {
  @IsNotEmpty({ message: 'La decisión sobre el presupuesto es obligatoria' })
  @IsString()
  @IsIn(['ACEPTADO', 'RECHAZADO', 'APROBADO'], {
    message: 'La acción debe ser ACEPTADO, APROBADO o RECHAZADO',
  })
  action: 'ACEPTADO' | 'RECHAZADO' | 'APROBADO';

  @IsOptional()
  @IsString()
  notas?: string;
}

