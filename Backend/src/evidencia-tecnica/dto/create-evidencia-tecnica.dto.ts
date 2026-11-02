import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEvidenciaTecnicaDto {
  @IsNumber()
  @IsNotEmpty()
  ordenId: number;

  @IsNumber()
  @IsNotEmpty()
  subidoPorId: number;

  @IsString()
  @IsOptional()
  storageKey?: string;

  @IsString()
  @IsOptional()
  nombreOriginal?: string;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsNumber()
  @IsOptional()
  tamanoBytes?: number;

  @IsString()
  @IsOptional()
  archivoUrl?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  tipoArchivo?: 'imagen' | 'video';

  @IsOptional()
  highDetailMode?: boolean;
}

export class RequestPresignedUploadDto {
  @IsNumber()
  @IsNotEmpty()
  ordenId: number;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsNumber()
  @IsOptional()
  fileSize?: number;
}

export class ConfirmUploadDto {
  @IsNumber()
  @IsNotEmpty()
  ordenId: number;

  @IsString()
  @IsNotEmpty()
  storageKey: string;

  @IsString()
  @IsOptional()
  nombreOriginal?: string;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsNumber()
  @IsOptional()
  tamanoBytes?: number;

  @IsString()
  @IsOptional()
  descripcion?: string;
}
