import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import type { Metadata } from 'sharp';
const sharp = require('sharp');

export interface ImageOptimizeOptions {
  maxDimension?: number; // Lado mayor máximo (default 2560px)
  quality?: number; // Calidad WebP 1-100 (default 85)
  highDetailMode?: boolean; // Modo diagnóstico de placa/circuito (3840px, 92%)
  stripMetadata?: boolean; // Eliminar datos GPS/EXIF por privacidad (default true)
}

export interface OptimizedImageResult {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  width: number;
  height: number;
  size: number;
  originalSize: number;
  savedBytes: number;
  compressionRatio: number;
  wasOptimized: boolean;
}

@Injectable()
export class ImageOptimizerService {
  private readonly logger = new Logger(ImageOptimizerService.name);

  // Límite de seguridad de descompresión: 100 megapíxeles (~10000x10000)
  private readonly MAX_PIXELS = 100_000_000;
  // Límite de tamaño de archivo original admisible: 100 MB
  private readonly MAX_ORIGINAL_BYTES = 100 * 1024 * 1024;

  /**
   * Valida, sanea y optimiza un buffer de imagen
   */
  async optimize(
    inputBuffer: Buffer,
    originalName: string,
    mimeType: string,
    options?: ImageOptimizeOptions,
  ): Promise<OptimizedImageResult> {
    const originalSize = inputBuffer.length;

    if (originalSize > this.MAX_ORIGINAL_BYTES) {
      throw new BadRequestException(
        `El archivo (${(originalSize / 1024 / 1024).toFixed(1)}MB) supera el límite máximo permitido de 100MB.`,
      );
    }

    const highDetail = options?.highDetailMode ?? false;
    const maxDimension = options?.maxDimension ?? (highDetail ? 3840 : 2560);
    const quality = options?.quality ?? (highDetail ? 92 : 85);
    const stripMetadata = options?.stripMetadata ?? true;

    let image = sharp(inputBuffer, {
      limitInputPixels: this.MAX_PIXELS,
      failOn: 'error',
    });

    let metadata: Metadata;
    try {
      metadata = await image.metadata();
    } catch (err: any) {
      this.logger.warn(`Error al leer metadatos de la imagen (${originalName}): ${err.message}`);
      throw new BadRequestException(
        `La imagen proporcionada está corrupta o en un formato no soportado (${err.message}).`,
      );
    }

    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;
    const currentFormat = metadata.format?.toLowerCase();

    // 1. Corregir orientación automáticamente por EXIF
    image = image.rotate();

    // 2. Redimensionamiento adaptativo sin distorsión ni ampliación artificial
    const longestSide = Math.max(originalWidth, originalHeight);
    let targetWidth: number | undefined;
    let targetHeight: number | undefined;

    if (longestSide > maxDimension) {
      if (originalWidth >= originalHeight) {
        targetWidth = maxDimension;
      } else {
        targetHeight = maxDimension;
      }
      image = image.resize({
        width: targetWidth,
        height: targetHeight,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // 3. Sanitización de privacidad: eliminar GPS y datos sensibles del cliente
    if (stripMetadata) {
      // Al no invocar .withMetadata(), Sharp remueve todos los tags EXIF (GPS, número de serie de cámara, etc.)
    }

    // 4. Caso especial: Si ya es WebP y pesa menos de 300KB y no excede dimensiones, conservar original
    if (currentFormat === 'webp' && originalSize < 300 * 1024 && longestSide <= maxDimension) {
      return {
        buffer: inputBuffer,
        mimeType: 'image/webp',
        extension: '.webp',
        width: originalWidth,
        height: originalHeight,
        size: originalSize,
        originalSize,
        savedBytes: 0,
        compressionRatio: 0,
        wasOptimized: false,
      };
    }

    // 5. Conversión a WebP de alta fidelidad
    image = image.webp({
      quality,
      effort: 4, // Nivel equilibrado de compresión sin retardar la CPU
      smartSubsample: true, // Submuestreo inteligente para preservar nitidez en bordes y texto
    });

    const optimizedBuffer = await image.toBuffer();
    const finalSize = optimizedBuffer.length;

    // 6. Verificar metadatos finales del resultado optimizado
    const finalMetadata = await sharp(optimizedBuffer).metadata();
    const finalWidth = finalMetadata.width || originalWidth;
    const finalHeight = finalMetadata.height || originalHeight;

    // 7. Evaluar si conviene el resultado optimizado
    // Si la imagen original ya era pequeña (ej. PNG plano) y WebP resulta más pesado, conservar original si es formato estándar
    if (finalSize >= originalSize && ['jpeg', 'jpg', 'png', 'webp'].includes(currentFormat || '')) {
      return {
        buffer: inputBuffer,
        mimeType: mimeType || `image/${currentFormat}`,
        extension: `.${currentFormat}`,
        width: originalWidth,
        height: originalHeight,
        size: originalSize,
        originalSize,
        savedBytes: 0,
        compressionRatio: 0,
        wasOptimized: false,
      };
    }

    const savedBytes = Math.max(0, originalSize - finalSize);
    const compressionRatio = Number(((savedBytes / originalSize) * 100).toFixed(1));

    this.logger.log(
      `Optimización exitosa: ${originalName} [${(originalSize / 1024).toFixed(1)} KB → ${(finalSize / 1024).toFixed(1)} KB, -${compressionRatio}%] (${finalWidth}x${finalHeight})`,
    );

    return {
      buffer: optimizedBuffer,
      mimeType: 'image/webp',
      extension: '.webp',
      width: finalWidth,
      height: finalHeight,
      size: finalSize,
      originalSize,
      savedBytes,
      compressionRatio,
      wasOptimized: true,
    };
  }
}
