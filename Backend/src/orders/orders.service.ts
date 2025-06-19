import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/rol.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Casillero } from '../casillero/entities/casillero.entity';
import { EstadoCasillero } from '../common/enums/estadoCasillero.enum';
import { Equipo } from 'src/equipo/entities/equipo.entity';
import { DataSource } from 'typeorm';  // Importa DataSource
import { EstadoFinal } from 'src/common/enums/estadoFinalOrden';

@Injectable()
export class OrderService {
  constructor(
    private readonly dataSource: DataSource,  // Inyección DataSource
    @InjectRepository(Order)
    private readonly repairOrderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Equipo)  // Inyecta el repositorio de Equipo
    private readonly equipoRepository: Repository<Equipo>,
    @InjectRepository(Casillero)
    private readonly casilleroRepository: Repository<Casillero>,
  ) { }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const {
      clientId,
      technicianId,
      workOrderNumber,
      equipoId,
      ...orderData
    } = createOrderDto;

    // Validar si el número de orden ya existe
    const existingOrder = await this.repairOrderRepository.findOne({
      where: { workOrderNumber },
    });
    if (existingOrder) {
      throw new BadRequestException(
        `El número de orden de trabajo "${workOrderNumber}" ya existe.`,
      );
    }

    // Buscar cliente
    const client = await this.userRepository.findOne({
      where: { id: clientId, role: Role.CLIENT },
    });
    if (!client) {
      throw new BadRequestException('Cliente no encontrado.');
    }

    // Buscar técnico (opcional)
    let technician = null;
    if (technicianId) {
      technician = await this.userRepository.findOne({
        where: { id: technicianId, role: Role.TECH },
      });
      if (!technician) {
        throw new BadRequestException('Técnico no encontrado.');
      }
    }

    // Buscar equipo (opcional)
    let equipo = null;
    if (equipoId) {
      equipo = await this.equipoRepository.findOne({
        where: { id: equipoId },
      });
      if (!equipo) {
        throw new BadRequestException('No se ha encontrado el equipo con ese ID.');
      }
    }

    // Crear y guardar la orden
    const repairOrder = this.repairOrderRepository.create({
      workOrderNumber,
      client,
      technician,
      equipo, // ← se guarda como relación ManyToOne
      ...orderData,
    });

    return this.repairOrderRepository.save(repairOrder);
  }

  // Obtener todas las órdenes de reparación
  async findAll(user: any): Promise<Order[]> {
    const { userId, role } = user;
    let whereCondition = {};
    if (role === Role.TECH) {
      whereCondition = { technician: { id: userId } };
    } else if (role === Role.CLIENT) {
      whereCondition = { client: { id: userId } };
    }

    return this.repairOrderRepository.find({
      where: whereCondition,
      relations: ['client','technician','presupuesto','equipo',],
      order: {
        fechaIngreso: 'DESC',
      },
    });
  }

  // Obtener todas las órdenes de reparación por cliente
  async findOrdersByClient(clientId: number): Promise<Order[]> {
    return await this.repairOrderRepository.find({
      where: {
        client: { id: clientId },
      },
      relations: ['technician', 'actividades', 'client', 'equipo', 'presupuesto'],
      order: {
        fechaIngreso: 'DESC',
      },
    });
  }

  // Obtener todas las órdenes de reparación por tecnico
  async findOrdersByTechnician(technicianId: number): Promise<Order[]> {
    return await this.repairOrderRepository.find({
      where: {
        technician: { id: technicianId },
      },
      relations: ['technician', 'actividades', 'client', 'equipo', 'presupuesto'],
      order: {
        fechaIngreso: 'DESC',
      },
    });
  }

  // Obtener  las órdenes de reparación por ID -- Vista interna para admin o técnico,
  async findOne(id: number): Promise<Order> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    const repairOrder = await this.repairOrderRepository.findOne({
      where: { id },
      relations: ['client', 'technician', 'equipo', 'presupuesto', 'actividades', 'detalleRepuestos',
        'detalleRepuestos.repuesto',
        'detalleServicios',
        'detalleServicios.servicio',
        'casillero',
      ],
    });

    if (!repairOrder) {
      throw new NotFoundException(
        'No se ha encontrado ninguna orden de reparación con ese número.'
      );
    }

    return repairOrder;
  }

  // Obtener una orden de reparación por workOrderNumber -- Consulta del cliente usando el número de orden
  async findOneByWorkOrderNumber(workOrderNumber: string): Promise<Order> {
    if (!workOrderNumber) {
      throw new BadRequestException('El número de orden de trabajo proporcionado no es válido.');
    }

    // Buscar la orden con las relaciones necesarias
    const repairOrder = await this.repairOrderRepository.findOne({
      where: { workOrderNumber, isDeleted: false },
      relations: ['client', 'technician', 'presupuesto', 'casillero'],
    });

    if (!repairOrder) {
      throw new BadRequestException('No se ha encontrado ninguna orden de reparación con ese número. Por favor, verifica el número de orden e inténtalo nuevamente.');
    }

    return repairOrder; // Retornar la orden sin validar el presupuesto
  }

  //UPDATE
  async update(workOrderNumber: string, updateRepairOrderDto: UpdateOrderDto): Promise<Order> {
    const repairOrder = await this.repairOrderRepository.findOne({
      where: { workOrderNumber },
      relations: ['technician', 'client', 'equipo', 'casillero'],
    });

    if (!repairOrder) {
      throw new NotFoundException('Orden de reparación no encontrada.');
    }

    // Validación de cambio de técnico
    if (
      updateRepairOrderDto.technicianId &&
      updateRepairOrderDto.technicianId !== repairOrder.technician?.id
    ) {
      const newTechnician = await this.userRepository.findOne({
        where: {
          id: updateRepairOrderDto.technicianId,
          role: Role.TECH,
        },
      });

      if (!newTechnician) {
        throw new NotFoundException(
          `Técnico con ID ${updateRepairOrderDto.technicianId} no encontrado.`
        );
      }

      repairOrder.technician = newTechnician;
    }

    // Asignar los nuevos valores
    Object.assign(repairOrder, updateRepairOrderDto);

    //  Si el estado final es "ENTREGADO", liberar el casillero
    if (
      updateRepairOrderDto.EstadoFinal === EstadoFinal.ENTREGADO &&
      repairOrder.casillero
    ) {
      const casillero = await this.casilleroRepository.findOne({
        where: { id: repairOrder.casillero.id },
      });

      if (casillero) {
        casillero.estado = EstadoCasillero.DISPONIBLE;
        casillero.orderId = null;
        await this.casilleroRepository.save(casillero);
      }

      repairOrder.casillero = null; // Limpiar la relación si es bidireccional
    }

    await this.repairOrderRepository.save(repairOrder);

    // Recargar la orden actualizada con relaciones completas
    return this.repairOrderRepository.findOne({
      where: { workOrderNumber },
      relations: ['technician','client','equipo','presupuesto','detalleServicios','detalleServicios.servicio',
        'detalleRepuestos',
        'detalleRepuestos.repuesto',
        'actividades',
      ],
    });
  }

  async remove(workOrderNumber: string): Promise<{ message: string }> {
    const repairOrder = await this.repairOrderRepository.findOne({
      where: { workOrderNumber, isDeleted: false },
      relations: ['equipo', 'presupuesto'],
    });

    if (!repairOrder) {
      throw new NotFoundException('Orden no encontrada o ya eliminada.');
    }

    if (repairOrder.equipo) {
      throw new BadRequestException('No se puede eliminar la orden porque está vinculada a un equipo.');
    }

    // Marca como eliminado (soft delete)
    repairOrder.isDeleted = true;
    repairOrder.deletedAt = new Date();

    await this.repairOrderRepository.save(repairOrder);

    return { message: `La orden ${workOrderNumber} fue eliminada (soft delete).` };
  }

  // Agregar este nuevo método
  async assignCasillero(workOrderNumber: string, casilleroId: number): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { workOrderNumber },
        relations: ['casillero'],
      });

      if (!order) {
        throw new NotFoundException('Orden no encontrada.');
      }

      if (order.casillero) {
        throw new BadRequestException(`La orden ya tiene asignado el casillero ${order.casillero.numero}`);
      }

      const casillero = await queryRunner.manager.findOne(Casillero, {
        where: { id: casilleroId },
      });

      if (!casillero) {
        throw new NotFoundException('Casillero no encontrado.');
      }

      if (casillero.estado === EstadoCasillero.OCUPADO) {
        throw new BadRequestException(`El casillero ${casillero.numero} ya está ocupado.`);
      }

      casillero.orderId = order.id;
      casillero.estado = EstadoCasillero.OCUPADO;
      order.casillero = casillero;

      await queryRunner.manager.save(casillero);
      await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();

      return await this.repairOrderRepository.findOne({
        where: { id: order.id },
        relations: ['casillero', 'client', 'technician', 'equipo'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}