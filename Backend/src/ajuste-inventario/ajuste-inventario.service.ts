import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AjusteInventario } from './entities/ajuste-inventario.entity';
import { AjusteInventarioDetalle } from './entities/ajuste-inventario-detalle.entity';
import { Parte } from '../parte/entities/parte.entity';
import { CreateAjusteInventarioDto } from './dto/create-ajuste-inventario.dto';
import { NotificacionService } from '../notificacion/notificacion.service';

@Injectable()
export class AjusteInventarioService {
  constructor(
    @InjectRepository(AjusteInventario)
    private readonly ajusteRepository: Repository<AjusteInventario>,
    @InjectRepository(AjusteInventarioDetalle)
    private readonly detalleRepository: Repository<AjusteInventarioDetalle>,
    @InjectRepository(Parte)
    private readonly parteRepository: Repository<Parte>,
    private readonly dataSource: DataSource,
    private readonly notificacionService: NotificacionService,
  ) {}

  // Crear ajuste transaccionalmente
  async create(createDto: CreateAjusteInventarioDto, usuarioId: number): Promise<AjusteInventario> {
    if (!createDto.detalles || createDto.detalles.length === 0) {
      throw new BadRequestException('El ajuste de inventario debe contener al menos un detalle.');
    }

    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      // 1. Guardar la cabecera del ajuste
      const ajuste = transactionalEntityManager.create(AjusteInventario, {
        motivo: createDto.motivo,
        comentario: createDto.comentario,
        usuarioId,
      });
      const ajusteGuardado = await transactionalEntityManager.save(AjusteInventario, ajuste);

      const detallesGuardados: AjusteInventarioDetalle[] = [];

      // 2. Procesar cada detalle
      for (const item of createDto.detalles) {
        // Cargar el producto actual en la transacción para evitar condiciones de carrera
        const parte = await transactionalEntityManager.findOne(Parte, {
          where: { id: item.parteId },
        });

        if (!parte) {
          throw new NotFoundException(`El repuesto con ID ${item.parteId} no existe.`);
        }

        if (parte.unidadMedida === 'Servicio') {
          throw new BadRequestException(`No se puede realizar ajuste de stock para el servicio: "${parte.nombre}".`);
        }

        const stockSistema = Number(parte.stock || 0);
        const stockFisico = Number(item.stockFisico || 0);
        const diferencia = stockFisico - stockSistema;

        // Crear el detalle de ajuste
        const detalle = transactionalEntityManager.create(AjusteInventarioDetalle, {
          ajusteId: ajusteGuardado.id,
          parteId: parte.id,
          stockSistema,
          stockFisico,
          diferencia,
        });
        const detalleGuardado = await transactionalEntityManager.save(AjusteInventarioDetalle, detalle);
        detallesGuardados.push(detalleGuardado);

        // Actualizar el stock del repuesto en el catálogo
        parte.stock = stockFisico;
        await transactionalEntityManager.save(Parte, parte);
      }

      // Asignar los detalles guardados a la cabecera para retornar la estructura completa
      ajusteGuardado.detalles = detallesGuardados;

      // 3. Ejecutar los triggers de notificación fuera de la transacción (para no bloquear)
      // pero asíncronamente
      for (const item of createDto.detalles) {
        this.notificacionService.checkAndNotificarStockBajo(item.parteId).catch((err) => {
          console.error(`Error al disparar alerta de stock para parte ${item.parteId}:`, err);
        });
      }

      return ajusteGuardado;
    });
  }

  // Obtener historial de ajustes ordenados por fecha descendente
  async findAll(): Promise<AjusteInventario[]> {
    return await this.ajusteRepository.find({
      relations: ['usuario', 'detalles', 'detalles.parte'],
      order: { fecha: 'DESC' },
    });
  }

  // Obtener un ajuste en específico
  async findOne(id: number): Promise<AjusteInventario> {
    const ajuste = await this.ajusteRepository.findOne({
      where: { id },
      relations: ['usuario', 'detalles', 'detalles.parte'],
    });

    if (!ajuste) {
      throw new NotFoundException(`El ajuste de inventario con ID ${id} no existe.`);
    }

    return ajuste;
  }
}
