import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcryptjs from 'bcryptjs';
import * as QRCode from 'qrcode';
import { ActivacionCuenta, TipoActivacion } from './entities/activacion-cuenta.entity';
import { User } from '../users/entities/user.entity';
import { GenerarActivacionDto } from './dto/generar-activacion.dto';
import { ConsumirActivacionDto } from './dto/consumir-activacion.dto';

@Injectable()
export class ActivacionService {
  private readonly logger = new Logger(ActivacionService.name);

  constructor(
    @InjectRepository(ActivacionCuenta)
    private readonly activacionRepository: Repository<ActivacionCuenta>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Genera una credencial criptográfica de activación temporal de un solo uso (15 minutos).
   * Solo puede ser emitida por personal autorizado (recepción / administración)
   * tras verificar presencialmente la identidad física del cliente.
   */
  async generarTokenActivacion(
    dto: GenerarActivacionDto,
    operadorId: number,
    ipGeneracion?: string,
  ) {
    const { usuarioId, tipo = TipoActivacion.ACTIVACION } = dto;

    // 1. Validar que el usuario exista y esté activo
    const user = await this.userRepository.findOne({
      where: { id: usuarioId },
      relations: ['userRoles', 'userRoles.rol'],
    });

    if (!user || !user.estado) {
      throw new NotFoundException('Cliente no encontrado o inactivo en el sistema.');
    }

    // 2. Verificar que el usuario tenga rol de cliente
    const roleSlug =
      user.userRoles && user.userRoles.length > 0
        ? user.userRoles[0].rol?.slug
        : 'client';

    if (roleSlug !== 'client' && roleSlug !== 'cliente') {
      throw new BadRequestException(
        'Las credenciales de activación presencial son exclusivas para clientes. El personal técnico y administrativo gestiona su acceso mediante credenciales institucionales.',
      );
    }

    // 3. Comprobar si el usuario ya tiene contraseña configurada
    const userWithPassword = await this.userRepository.findOne({
      where: { id: usuarioId },
      select: ['id', 'password'],
    });

    const yaTienePassword = Boolean(userWithPassword?.password);

    if (tipo === TipoActivacion.ACTIVACION && yaTienePassword) {
      throw new BadRequestException(
        'El cliente ya tiene una cuenta activa con contraseña establecida. Para modificarla, solicite un restablecimiento presencial de contraseña.',
      );
    }

    // 4. Invalidar / revocar credenciales de activación anteriores que no hayan sido consumidas
    await this.activacionRepository.update(
      {
        usuarioId,
        usedAt: IsNull(),
        revokedAt: IsNull(),
      },
      {
        revokedAt: new Date(),
      },
    );

    // 5. Generar token criptográficamente seguro (128 bits de entropía = 16 bytes = 32 caracteres hex)
    const rawSecret = crypto.randomBytes(16).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawSecret).digest('hex');

    // Vigencia corta de 15 minutos
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 6. Guardar el registro auditable (almacenando únicamente el hash SHA-256)
    const nuevaActivacion = this.activacionRepository.create({
      usuarioId,
      tokenHash,
      tipo,
      expiresAt,
      usedAt: null,
      revokedAt: null,
      intentosFallidos: 0,
      generadoPorId: operadorId,
      ipGeneracion: ipGeneracion || null,
    });

    await this.activacionRepository.save(nuevaActivacion);

    this.logger.log(
      `✓ Credencial de [${tipo}] generada para cliente ID ${user.id} (${user.cedula}) por operador ID ${operadorId}. Expira en 15 minutos.`,
    );

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4000';
    const qrUrl = `${frontendUrl}/activar-cuenta?token=${rawSecret}`;

    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 280,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    return {
      success: true,
      token: rawSecret, // Solo devuelto de forma efímera para generar el QR en el modal del operador
      qrUrl,
      qrDataUrl,
      expiresAt,
      tipo,
      cliente: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        cedula: user.cedula,
        correo: user.correo,
      },
    };
  }

  /**
   * Valida si un token es válido antes de que el cliente establezca su contraseña.
   * No revela datos sensibles ni hashes.
   */
  async validarTokenActivacion(rawSecret: string) {
    if (!rawSecret || rawSecret.trim().length < 20) {
      return {
        valido: false,
        mensaje: 'La credencial de activación ingresada no es válida.',
      };
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(rawSecret.trim())
      .digest('hex');

    const registro = await this.activacionRepository.findOne({
      where: { tokenHash },
      relations: ['usuario'],
    });

    if (!registro) {
      return {
        valido: false,
        mensaje: 'La credencial de activación no existe o no es válida.',
      };
    }

    if (registro.usedAt) {
      return {
        valido: false,
        mensaje: 'Esta credencial de activación ya fue utilizada previamente.',
      };
    }

    if (registro.revokedAt) {
      return {
        valido: false,
        mensaje:
          'Esta credencial de activación ha sido cancelada o sustituida por una nueva emisión.',
      };
    }

    if (new Date() > new Date(registro.expiresAt)) {
      return {
        valido: false,
        mensaje:
          'La credencial de activación ha expirado (su vigencia es de 15 minutos). Acérquese a recepción para generar un nuevo código.',
      };
    }

    if (registro.intentosFallidos >= 5) {
      return {
        valido: false,
        mensaje:
          'Esta credencial fue bloqueada por demasiados intentos fallidos. Solicite una nueva en recepción.',
      };
    }

    return {
      valido: true,
      tipo: registro.tipo,
      cliente: {
        nombre: registro.usuario?.nombre,
        apellido: registro.usuario?.apellido,
        cedula: registro.usuario?.cedula,
      },
    };
  }

  /**
   * Consume la credencial de activación de forma atómica y transaccional,
   * asigna la nueva contraseña con bcrypt y deja la credencial invalidada definitivamente.
   */
  async consumirTokenActivacion(dto: ConsumirActivacionDto, ipConsumo?: string) {
    const { token, password, confirmPassword } = dto;

    if (!token || !token.trim()) {
      throw new BadRequestException('El token de activación es requerido.');
    }

    if (password !== confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden.');
    }

    if (password.length < 8) {
      throw new BadRequestException(
        'La contraseña debe tener al menos 8 caracteres.',
      );
    }
    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException(
        'La contraseña debe contener al menos una letra mayúscula.',
      );
    }
    if (!/\d/.test(password)) {
      throw new BadRequestException(
        'La contraseña debe contener al menos un número.',
      );
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(token.trim())
      .digest('hex');

    // Operación transaccional con bloqueo pesimista
    return await this.activacionRepository.manager.transaction(
      async (manager) => {
        const registro = await manager
          .createQueryBuilder(ActivacionCuenta, 'act')
          .setLock('pessimistic_write')
          .where('act.token_hash = :tokenHash', { tokenHash })
          .getOne();

        if (!registro) {
          throw new UnauthorizedException(
            'Credencial de activación no válida o inexistente.',
          );
        }

        if (registro.usedAt) {
          throw new BadRequestException(
            'Esta credencial de activación ya fue utilizada.',
          );
        }

        if (registro.revokedAt) {
          throw new BadRequestException(
            'Esta credencial fue revocada o sustituida por una nueva emisión.',
          );
        }

        const ahora = new Date();
        if (ahora > new Date(registro.expiresAt)) {
          throw new BadRequestException(
            'La credencial de activación ha expirado (vigencia de 15 minutos). Solicite una nueva en recepción.',
          );
        }

        if (registro.intentosFallidos >= 5) {
          throw new BadRequestException(
            'Credencial bloqueada por exceso de intentos fallidos.',
          );
        }

        // Obtener el usuario
        const user = await manager.findOne(User, {
          where: { id: registro.usuarioId },
        });

        if (!user || !user.estado) {
          throw new NotFoundException(
            'No se encontró el usuario asociado a esta credencial.',
          );
        }

        // Si es una primera activación, proteger contra sobrescritura inesperada si ya tenía clave
        const userWithPass = await manager.findOne(User, {
          where: { id: user.id },
          select: ['id', 'password'],
        });

        if (
          registro.tipo === TipoActivacion.ACTIVACION &&
          userWithPass?.password
        ) {
          // Si ya tenía contraseña y el token era de primera activación, denegar
          await manager.update(ActivacionCuenta, registro.id, {
            revokedAt: ahora,
          });
          throw new BadRequestException(
            'La cuenta ya se encuentra activa con una contraseña previamente registrada. Para restablecerla se requiere una solicitud de recuperación.',
          );
        }

        // Encriptar la nueva contraseña con bcrypt (cost factor 10)
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        // 1. Actualizar la contraseña del usuario
        await manager.update(User, user.id, {
          password: hashedPassword,
          resetPasswordToken: null,
        });

        // 2. Marcar la credencial como consumida definitivamente
        await manager.update(ActivacionCuenta, registro.id, {
          usedAt: ahora,
          ipConsumo: ipConsumo || null,
        });

        // 3. Revocar cualquier otra credencial pendiente para este usuario
        await manager
          .createQueryBuilder()
          .update(ActivacionCuenta)
          .set({ revokedAt: ahora })
          .where(
            'usuario_id = :userId AND id != :currentId AND used_at IS NULL AND revoked_at IS NULL',
            {
              userId: user.id,
              currentId: registro.id,
            },
          )
          .execute();

        this.logger.log(
          `✓ Contraseña establecida exitosamente para cliente #${user.id} (${user.cedula}) mediante credencial [${registro.tipo}]. Token invalidado definitivamente.`,
        );

        return {
          success: true,
          message:
            '¡Tu cuenta ha sido activada exitosamente! Ya puedes iniciar sesión con tu cédula y contraseña.',
          cliente: {
            id: user.id,
            nombre: user.nombre,
            apellido: user.apellido,
            cedula: user.cedula,
          },
        };
      },
    );
  }
}
