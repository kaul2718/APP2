import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { TipoDocumentoOrden, EstadoFirmaDocumento } from '../entities/documento-orden.entity';

export class FirmarDocumentoDto {
  @IsEnum(TipoDocumentoOrden)
  @IsNotEmpty()
  tipoDocumento: TipoDocumentoOrden;

  @IsString()
  @IsOptional()
  firmaBase64?: string; // Data URL en base64 de la firma capturada en tablet (ej: "data:image/png;base64,...")

  @IsString()
  @IsNotEmpty()
  firmanteNombre: string;

  @IsString()
  @IsNotEmpty()
  firmanteIdentificacion: string;

  @IsString()
  @IsOptional()
  versionTerminos?: string;

  @IsBoolean()
  @IsOptional()
  terminosAceptados?: boolean;

  @IsEnum(EstadoFirmaDocumento)
  @IsOptional()
  estadoFirma?: EstadoFirmaDocumento;

  @IsString()
  @IsOptional()
  motivoSinFirma?: string;

  @IsString()
  @IsOptional()
  tokenAccesoRaw?: string;
}

