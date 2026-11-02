import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  MaxLength,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateConfiguracionSistemaDto {
  // ─── Metadatos de solo lectura (permitidos pero ignorados) ─────────────
  @IsOptional()
  id?: number;

  @IsOptional()
  logoUrl?: string | null;

  @IsOptional()
  storageKeyLogo?: string | null;

  @IsOptional()
  createdAt?: any;

  @IsOptional()
  updatedAt?: any;

  // ─── 1. Secuencial de Órdenes ──────────────────────────────────────────
  @IsOptional()
  @IsString()
  @MaxLength(20)
  ordenPrefijo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  ordenSiguienteNumero?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(3)
  @Max(10)
  ordenDigitos?: number;

  @IsOptional()
  @IsBoolean()
  ordenPermitirReinicio?: boolean;

  // ─── 2. Secuencial de Presupuestos ────────────────────────────────────
  @IsOptional()
  @IsString()
  @MaxLength(20)
  presupuestoPrefijo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  presupuestoSiguienteNumero?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(3)
  @Max(10)
  presupuestoDigitos?: number;

  // ─── 3. Identidad de Empresa ──────────────────────────────────────────
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombreEmpresa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombreComercial?: string;

  @IsOptional()
  @IsString()
  @MaxLength(13)
  ruc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(25)
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  correoContacto?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  slogan?: string;

  // ─── 4. Políticas Legales ─────────────────────────────────────────────
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  diasAbandono?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  diasGarantiaDefault?: number;

  @IsOptional()
  @IsString()
  terminosRecepcion?: string;

  @IsOptional()
  @IsString()
  terminosEntrega?: string;

  // ─── 5. Parámetros Económicos y Operativos ────────────────────────────
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  porcentajeIva?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  diasVigenciaPresupuesto?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  tiempoLimiteDiagnosticoHoras?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  diasAlertaControlRetiro?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockMinimoAlertaGlobal?: number;

  // ─── 6. Plantillas WhatsApp ───────────────────────────────────────────
  @IsOptional()
  @IsString()
  plantillaWhatsappRecepcion?: string;

  @IsOptional()
  @IsString()
  plantillaWhatsappListoEntrega?: string;
}
