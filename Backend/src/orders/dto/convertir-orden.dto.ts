import { IsNotEmpty, IsOptional, IsString, IsObject, IsBoolean } from 'class-validator';

export class AutorizacionClienteDto {
  @IsBoolean()
  @IsNotEmpty()
  autorizado: boolean;

  @IsString()
  @IsOptional()
  medio?: string;

  @IsString()
  @IsOptional()
  fechaAutorizacion?: string;

  @IsString()
  @IsOptional()
  contacto?: string;

  @IsString()
  @IsOptional()
  detalles?: string;
}

export class ConvertirOrdenCompletaDto {
  @IsString()
  @IsNotEmpty({ message: 'El motivo del escalamiento es obligatorio' })
  motivoEscalamiento: string;

  @IsOptional()
  @IsObject()
  autorizacionCliente?: AutorizacionClienteDto;

  @IsOptional()
  @IsObject()
  inspeccionComplementaria?: any;

  @IsOptional()
  userId?: number;
}
