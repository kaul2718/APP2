/**
 * Utilidad inteligente de optimización de imágenes en el cliente (Next.js / Navegador)
 * - Convierte fotografías pesadas (hasta 100MB) a WebP de alta fidelidad.
 * - Soporta JPG, PNG, WebP y archivos HEIC/HEIF de iPhone vía heic2any.
 * - Redimensiona adaptativamente preservando la relación de aspecto (2560px estándar / 3840px modo detalle).
 * - Corrige orientación y remueve metadatos GPS al redibujar en Canvas.
 * - Conserva el original si ya es pequeño o si la compresión no aporta beneficio.
 */

export interface ImageOptimizationOptions {
  maxDimension?: number; // Lado mayor máximo en píxeles (default: 2560)
  quality?: number; // Calidad WebP 0 a 1 (default: 0.85)
  highDetailMode?: boolean; // Modo diagnóstico de placa/circuito (3840px, 0.92)
  maxOriginalSizeMB?: number; // Límite máximo admisible (default: 100MB)
}

export interface ImageOptimizationResult {
  file: File;
  originalSize: number;
  optimizedSize: number;
  savedBytes: number;
  compressionRatio: number; // Porcentaje de ahorro (ej. 85.4%)
  wasOptimized: boolean;
  originalDimensions: { width: number; height: number };
  finalDimensions: { width: number; height: number };
}

/**
 * Convierte un Blob o File HEIC/HEIF de iPhone a JPEG Blob usando heic2any
 */
async function convertHeicToJpeg(file: File): Promise<Blob> {
  try {
    const heic2anyModule = await import('heic2any');
    const heic2any = heic2anyModule.default || heic2anyModule;
    const result = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92,
    });
    return Array.isArray(result) ? result[0] : result;
  } catch (error: any) {
    console.warn('Error en decodificación HEIC en cliente:', error);
    throw new Error('No se pudo procesar la fotografía HEIC de iPhone en este navegador.');
  }
}

/**
 * Carga una imagen en un elemento HTMLImageElement de forma asíncrona
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('No se pudo decodificar el archivo de imagen.'));
    img.src = src;
  });
}

/**
 * Optimiza una imagen antes de ser subida a Cloudflare R2
 */
export async function optimizeImageClient(
  file: File,
  options?: ImageOptimizationOptions,
): Promise<ImageOptimizationResult> {
  const originalSize = file.size;
  const maxOriginalSizeMB = options?.maxOriginalSizeMB ?? 100;
  const maxBytes = maxOriginalSizeMB * 1024 * 1024;

  if (originalSize > maxBytes) {
    throw new Error(
      `El archivo (${(originalSize / 1024 / 1024).toFixed(1)}MB) supera el límite máximo permitido de ${maxOriginalSizeMB}MB.`,
    );
  }

  const highDetail = options?.highDetailMode ?? false;
  const maxDimension = options?.maxDimension ?? (highDetail ? 3840 : 2560);
  const quality = options?.quality ?? (highDetail ? 0.92 : 0.85);

  const lowerName = file.name.toLowerCase();
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    lowerName.endsWith('.heic') ||
    lowerName.endsWith('.heif');

  // Si ya es un WebP pequeño (< 300KB), no recomprimir innecesariamente
  if (file.type === 'image/webp' && originalSize < 300 * 1024) {
    return {
      file,
      originalSize,
      optimizedSize: originalSize,
      savedBytes: 0,
      compressionRatio: 0,
      wasOptimized: false,
      originalDimensions: { width: 0, height: 0 },
      finalDimensions: { width: 0, height: 0 },
    };
  }

  // 1. Obtener Blob base (convirtiendo HEIC si aplica)
  let workingBlob: Blob = file;
  if (isHeic) {
    workingBlob = await convertHeicToJpeg(file);
  }

  // 2. Cargar en imagen para medir dimensiones y redibujar en Canvas
  const objectUrl = URL.createObjectURL(workingBlob);
  let img: HTMLImageElement;
  try {
    img = await loadImage(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  const originalWidth = img.naturalWidth || img.width;
  const originalHeight = img.naturalHeight || img.height;

  // Si la imagen es un PNG pequeño (< 200KB) o sus dimensiones ya son reducidas y no es HEIC
  if (
    !isHeic &&
    file.type === 'image/png' &&
    originalSize < 200 * 1024 &&
    originalWidth <= maxDimension &&
    originalHeight <= maxDimension
  ) {
    return {
      file,
      originalSize,
      optimizedSize: originalSize,
      savedBytes: 0,
      compressionRatio: 0,
      wasOptimized: false,
      originalDimensions: { width: originalWidth, height: originalHeight },
      finalDimensions: { width: originalWidth, height: originalHeight },
    };
  }

  // 3. Calcular dimensiones proporcionales
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;
  const longestSide = Math.max(originalWidth, originalHeight);

  if (longestSide > maxDimension) {
    const ratio = maxDimension / longestSide;
    targetWidth = Math.round(originalWidth * ratio);
    targetHeight = Math.round(originalHeight * ratio);
  }

  // 4. Renderizar en Canvas con interpolación de alta calidad
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { alpha: true });

  if (!ctx) {
    throw new Error('No se pudo inicializar el contexto de procesamiento gráfico.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // 5. Exportar a WebP
  const optimizedBlob: Blob | null = await new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/webp', quality);
  });

  // Liberar memoria del canvas
  canvas.width = 0;
  canvas.height = 0;

  if (!optimizedBlob) {
    // Si el navegador no soporta exportación WebP (muy raro hoy en día), devolver original
    return {
      file,
      originalSize,
      optimizedSize: originalSize,
      savedBytes: 0,
      compressionRatio: 0,
      wasOptimized: false,
      originalDimensions: { width: originalWidth, height: originalHeight },
      finalDimensions: { width: originalWidth, height: originalHeight },
    };
  }

  const finalSize = optimizedBlob.size;

  // Si el resultado optimizado no reduce el peso y el original no es HEIC, conservar original
  if (finalSize >= originalSize && !isHeic) {
    return {
      file,
      originalSize,
      optimizedSize: originalSize,
      savedBytes: 0,
      compressionRatio: 0,
      wasOptimized: false,
      originalDimensions: { width: originalWidth, height: originalHeight },
      finalDimensions: { width: originalWidth, height: originalHeight },
    };
  }

  // Construir nombre con extensión .webp
  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const newFileName = `${baseName}.webp`;

  const optimizedFile = new File([optimizedBlob], newFileName, {
    type: 'image/webp',
    lastModified: Date.now(),
  });

  const savedBytes = Math.max(0, originalSize - finalSize);
  const compressionRatio = Number(((savedBytes / originalSize) * 100).toFixed(1));

  return {
    file: optimizedFile,
    originalSize,
    optimizedSize: finalSize,
    savedBytes,
    compressionRatio,
    wasOptimized: true,
    originalDimensions: { width: originalWidth, height: originalHeight },
    finalDimensions: { width: targetWidth, height: targetHeight },
  };
}

/**
 * Función auxiliar para formatear tamaños de archivo en KB o MB legibles
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
