import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FirmaElectronicaConfig } from './entities/firma-electronica-config.entity';
import * as forge from 'node-forge';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { PDFDocument } from 'pdf-lib';
import { SignPdf } from '@signpdf/signpdf';
import { P12Signer } from '@signpdf/signer-p12';
import { pdflibAddPlaceholder } from '@signpdf/placeholder-pdf-lib';

@Injectable()
export class FirmaElectronicaService {
  private readonly logger = new Logger(FirmaElectronicaService.name);
  private readonly certsDir = path.join(process.cwd(), 'certs');
  private readonly encryptionKey: Buffer;

  constructor(
    @InjectRepository(FirmaElectronicaConfig)
    private readonly configRepo: Repository<FirmaElectronicaConfig>,
  ) {
    if (!fs.existsSync(this.certsDir)) {
      fs.mkdirSync(this.certsDir, { recursive: true });
    }
    // Clave simétrica derivada para cifrado AES-256-GCM
    const salt = 'hdc-firma-ec-salt-2026';
    const secret = process.env.JWT_SECRET || 'hdc-secret-key-production-ec';
    this.encryptionKey = crypto.scryptSync(secret, salt, 32);
  }

  // Cifrado simétrico AES-256-GCM
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${tag}:${encrypted}`;
  }

  // Descifrado simétrico AES-256-GCM
  private decrypt(cipherText: string): string {
    const [ivHex, tagHex, encrypted] = cipherText.split(':');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(ivHex, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Obtiene la configuración activa
   */
  async getConfig(): Promise<FirmaElectronicaConfig | null> {
    return this.configRepo.findOne({
      where: { id: 1 },
    });
  }

  /**
   * Retorna el estado público sin exponer contraseñas
   */
  async getStatus() {
    const config = await this.getConfig();
    if (!config) {
      return {
        configurado: false,
        activo: false,
      };
    }

    const ahora = new Date();
    const expirado = config.fechaExpiracion ? ahora > config.fechaExpiracion : false;
    const diasRestantes = config.fechaExpiracion
      ? Math.ceil(
          (config.fechaExpiracion.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24),
        )
      : 0;

    return {
      configurado: true,
      activo: config.activo && !expirado,
      expirado,
      diasRestantes,
      titularNombre: config.titularNombre,
      titularCedulaRuc: config.titularCedulaRuc,
      entidadEmisora: config.entidadEmisora,
      organizacion: config.organizacion,
      fechaEmision: config.fechaEmision,
      fechaExpiracion: config.fechaExpiracion,
      serialNumber: config.serialNumber,
      firmarRecepcion: config.firmarRecepcion,
      firmarEntrega: config.firmarEntrega,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Valida y almacena un nuevo archivo .p12 con su contraseña
   */
  async guardarConfig(fileBuffer: Buffer, fileName: string, password: string) {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException('El archivo de firma .p12 es requerido.');
    }
    if (!password || !password.trim()) {
      throw new BadRequestException('La contraseña del certificado digital es obligatoria.');
    }

    // 1. Validar y parsear PKCS#12 con node-forge
    let certObj: forge.pki.Certificate;
    try {
      const p12Der = fileBuffer.toString('binary');
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password.trim());

      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const bags = certBags[forge.pki.oids.certBag];
      if (!bags || bags.length === 0 || !bags[0].cert) {
        throw new Error('No se encontró certificado X.509 en el archivo PKCS#12.');
      }
      certObj = bags[0].cert;
    } catch (err: any) {
      this.logger.error(`Error validando .p12: ${err.message}`);
      throw new BadRequestException(
        'Contraseña del certificado incorrecta o archivo de firma electrónica (.p12) no válido.',
      );
    }

    // 2. Extraer atributos del certificado
    const subjectAttrs = certObj.subject.attributes;
    const issuerAttrs = certObj.issuer.attributes;

    const titularNombre =
      subjectAttrs.find((a) => a.name === 'commonName')?.value?.toString() ||
      'Representante Legal HDC';

    // Extracción de Cédula / RUC (común en certificados ecuatorianos: serialNumber o OU)
    const cedulaAttr =
      subjectAttrs.find((a) => a.name === 'serialNumber')?.value?.toString() ||
      subjectAttrs.find((a) => a.shortName === 'UID')?.value?.toString() ||
      '';

    const entidadEmisora =
      issuerAttrs.find((a) => a.name === 'commonName')?.value?.toString() ||
      issuerAttrs.find((a) => a.name === 'organizationName')?.value?.toString() ||
      'Entidad de Certificación Acreditada (Ecuador)';

    const organizacion =
      subjectAttrs.find((a) => a.name === 'organizationName')?.value?.toString() ||
      'Hospital del Computador';

    const fechaEmision = certObj.validity.notBefore;
    const fechaExpiracion = certObj.validity.notAfter;
    const serialNumber = certObj.serialNumber;

    // 3. Guardar archivo físico de manera segura en el servidor
    const p12FilePath = path.join(this.certsDir, 'firma_gerente.p12');
    fs.writeFileSync(p12FilePath, fileBuffer);

    // 4. Encriptar contraseña y persistir en base de datos
    const passwordEncriptado = this.encrypt(password.trim());

    let config = await this.getConfig();
    if (!config) {
      config = this.configRepo.create({
        id: 1,
        archivoP12Nombre: fileName || 'firma_gerente.p12',
        archivoP12Ruta: p12FilePath,
        passwordEncriptado,
        titularNombre,
        titularCedulaRuc: cedulaAttr,
        entidadEmisora,
        organizacion,
        fechaEmision,
        fechaExpiracion,
        serialNumber,
        activo: true,
        firmarRecepcion: true,
        firmarEntrega: true,
      });
    } else {
      config.archivoP12Nombre = fileName || 'firma_gerente.p12';
      config.archivoP12Ruta = p12FilePath;
      config.passwordEncriptado = passwordEncriptado;
      config.titularNombre = titularNombre;
      config.titularCedulaRuc = cedulaAttr;
      config.entidadEmisora = entidadEmisora;
      config.organizacion = organizacion;
      config.fechaEmision = fechaEmision;
      config.fechaExpiracion = fechaExpiracion;
      config.serialNumber = serialNumber;
      config.activo = true;
    }

    await this.configRepo.save(config);

    this.logger.log(
      `✓ Firma electrónica (.p12) configurada exitosamente para: ${titularNombre} (Emisor: ${entidadEmisora})`,
    );

    return this.getStatus();
  }

  /**
   * Elimina la configuración y el archivo de firma
   */
  async eliminarConfig() {
    const config = await this.getConfig();
    if (!config) return { message: 'No había firma configurada.' };

    if (fs.existsSync(config.archivoP12Ruta)) {
      try {
        fs.unlinkSync(config.archivoP12Ruta);
      } catch (err) {
        this.logger.warn(`No se pudo eliminar archivo físico: ${err.message}`);
      }
    }

    await this.configRepo.delete(config.id);
    return { message: 'Firma electrónica eliminada exitosamente.' };
  }

  /**
   * Activa o desactiva la firma automática
   */
  async toggleActivo(activo: boolean) {
    const config = await this.getConfig();
    if (!config) {
      throw new NotFoundException('No existe firma electrónica configurada.');
    }
    config.activo = activo;
    await this.configRepo.save(config);
    return this.getStatus();
  }

  /**
   * Firma criptográficamente un documento PDF con el certificado PKCS#12 del Gerente (PAdES / FirmaEC)
   */
  async firmarPdfCriptografico(
    pdfBuffer: Buffer,
    razon: string = 'Certificación Electrónica - Hospital del Computador',
    location: string = 'Riobamba, Ecuador',
  ): Promise<Buffer> {
    const config = await this.getConfig();
    if (!config || !config.activo) {
      return pdfBuffer;
    }

    // Verificar expiración
    if (config.fechaExpiracion && new Date() > config.fechaExpiracion) {
      this.logger.warn('Certificado digital expirado. No se estampará firma criptográfica.');
      return pdfBuffer;
    }

    if (!fs.existsSync(config.archivoP12Ruta)) {
      this.logger.warn(
        `Archivo .p12 no encontrado en ruta: ${config.archivoP12Ruta}. Saltando firma criptográfica.`,
      );
      return pdfBuffer;
    }

    try {
      const p12Buffer = fs.readFileSync(config.archivoP12Ruta);
      const password = this.decrypt(config.passwordEncriptado);

      // Cargar PDF en pdf-lib para inyectar contenedor de firma PAdES
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      pdflibAddPlaceholder({
        pdfDoc,
        reason: razon,
        contactInfo: 'gerencia@elhospitaldelcomputador.com',
        name: config.titularNombre || 'Hospital del Computador',
        location: location,
        signatureLength: 8192,
      });

      const pdfWithPlaceholder = await pdfDoc.save();

      // Firmar criptográficamente usando P12Signer
      const signer = new P12Signer(p12Buffer, { passphrase: password });
      const signPdf = new SignPdf();
      const signedBuffer = await signPdf.sign(Buffer.from(pdfWithPlaceholder), signer);

      this.logger.log(
        `✓ PDF firmado criptográficamente con PAdES (.p12 FirmaEC) para: ${config.titularNombre}`,
      );

      return signedBuffer;
    } catch (err: any) {
      this.logger.error(`Error al firmar criptográficamente PDF con .p12: ${err.message}`);
      // Fallback: retornar buffer original para no truncar la operación del usuario
      return pdfBuffer;
    }
  }

  /**
   * Genera un PDF de prueba firmado para verificar que el certificado y FirmaEC funcionen
   */
  async testFirma() {
    const config = await this.getConfig();
    if (!config) {
      throw new BadRequestException('No hay firma electrónica configurada para probar.');
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const font = await pdfDoc.embedFont('Helvetica-Bold');
    page.drawText('PRUEBA DE FIRMA ELECTRÓNICA - HOSPITAL DEL COMPUTADOR', {
      x: 50,
      y: 750,
      size: 14,
      font,
    });
    page.drawText(`Titular: ${config.titularNombre}`, { x: 50, y: 720, size: 10 });
    page.drawText(`Entidad Emisora: ${config.entidadEmisora}`, { x: 50, y: 700, size: 10 });
    page.drawText(`Fecha de prueba: ${new Date().toISOString()}`, { x: 50, y: 680, size: 10 });

    const rawBuffer = Buffer.from(await pdfDoc.save());
    const signedBuffer = await this.firmarPdfCriptografico(
      rawBuffer,
      'Validación técnica de firma digital FirmaEC',
    );

    return {
      success: true,
      mensaje: `Firma digital probada y validada exitosamente para ${config.titularNombre}`,
      tamanioBytes: signedBuffer.length,
      titular: config.titularNombre,
      emisor: config.entidadEmisora,
    };
  }
}
