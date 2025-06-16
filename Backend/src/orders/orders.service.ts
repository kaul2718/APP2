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

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly repairOrderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Casillero)
    private readonly casilleroRepository: Repository<Casillero>,
    @InjectRepository(Equipo)  // Inyecta el repositorio de Equipo
    private readonly equipoRepository: Repository<Equipo>,
  ) { }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const { clientId, technicianId, workOrderNumber, equipoId, ...orderData } = createOrderDto;

    // Validar si el número de orden de trabajo ya existe
    const existingOrder = await this.repairOrderRepository.findOne({ where: { workOrderNumber } });
    if (existingOrder) {
      throw new BadRequestException(
        `El número de orden de trabajo "${workOrderNumber}" ya existe.`
      );
    }

    // Buscar al cliente
    const client = await this.userRepository.findOne({ where: { id: clientId, role: Role.CLIENT } });
    if (!client) {
      throw new BadRequestException('Cliente no encontrado.');
    }

    // Buscar al técnico (si se proporciona)
    let technician = null;
    if (technicianId) {
      technician = await this.userRepository.findOne({ where: { id: technicianId, role: Role.TECH } });
      if (!technician) {
        throw new BadRequestException('Técnico no encontrado.');
      }
    }

    // Buscar el equipo (si se proporciona)
    let equipo = null;
    if (equipoId) {
      equipo = await this.equipoRepository.findOne({ where: { id: equipoId } });
      if (!equipo) {
        throw new BadRequestException('No se ha encontrado el equipo con ese ID.');
      }
    }

    // Crear la nueva orden de reparación
    const repairOrder = this.repairOrderRepository.create({
      workOrderNumber,
      client,
      technician,
      equipo, // Asignar el equipo a la orden
      ...orderData,
    });

    // Guardar la orden en la base de datos
    const savedOrder = await this.repairOrderRepository.save(repairOrder);

    // Si el equipo existe, actualizar su relación con la orden
    if (equipo) {
      equipo.order = savedOrder;  // Relacionar el equipo con la orden
      await this.equipoRepository.save(equipo);
    }

    return savedOrder;
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
      relations: ['client', 'technician', 'presupuesto'],
    });
  }

  async findOrdersByClient(clientId: number) {
    return await this.repairOrderRepository.find({
      where: {
        clientId: clientId, // Filtrar por cliente
      },
      relations: ['technician', 'actividades', 'client'], // Relacionar entidades si es necesario
    });
  }

  async findOrdersByTechnician(technicianId: number): Promise<Order[]> {
    return await this.repairOrderRepository.find({
      where: {
        technicianId: technicianId, // Filtrar por cliente
      },
      relations: ['technician', 'actividades', 'client'], // Relacionar entidades si es necesario
    });
  }
  /* Obtener una orden de reparación por ID
  async findOne(id: number): Promise<Order> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    const repairOrder = await this.repairOrderRepository.findOne({
      where: { id },
      relations: ['client', 'technician'],
    });
    if (!repairOrder) {
      throw new BadRequestException('No se ha encontrado ninguna orden de reparación con ese número. Por favor, verifica el número de orden e inténtalo nuevamente.');
    }
    return repairOrder;
  }*/

  // Obtener una orden de reparación por workOrderNumber
  async findOneByWorkOrderNumber(workOrderNumber: string): Promise<Order> {
    if (!workOrderNumber) {
      throw new BadRequestException('El número de orden de trabajo proporcionado no es válido.');
    }

    // Buscar la orden con las relaciones necesarias
    const repairOrder = await this.repairOrderRepository.findOne({
      where: { workOrderNumber },
      relations: ['client', 'technician', 'presupuesto', 'casillero'],
    });

    if (!repairOrder) {
      throw new BadRequestException('No se ha encontrado ninguna orden de reparación con ese número. Por favor, verifica el número de orden e inténtalo nuevamente.');
    }

    return repairOrder; // Retornar la orden sin validar el presupuesto
  }

  //UPDATE
  async update(workOrderNumber: string, updateRepairOrderDto: UpdateOrderDto): Promise<Order> {
    // Buscar la orden actual con las relaciones necesarias
    const repairOrder = await this.repairOrderRepository.findOne({
      where: { workOrderNumber },
      relations: ['technician', 'client'], // Cargar relaciones necesarias
    });

    if (!repairOrder) {
      throw new NotFoundException('Orden de reparación no encontrada.');
    }

    // Manejo de cambio de técnico si se especifica un nuevo ID
    if (updateRepairOrderDto.technicianId && updateRepairOrderDto.technicianId !== repairOrder.technician?.id) {
      const newTechnician = await this.userRepository.findOne({
        where: { id: updateRepairOrderDto.technicianId },
      });

      if (!newTechnician) {
        throw new NotFoundException(`Técnico con ID ${updateRepairOrderDto.technicianId} no encontrado.`);
      }

      repairOrder.technician = newTechnician; // Asignar el nuevo técnico
    }

    // Actualizar los demás campos de la orden
    Object.assign(repairOrder, updateRepairOrderDto);

    // Guardar la orden actualizada
    const savedOrder = await this.repairOrderRepository.save(repairOrder);

    // Recargar con relaciones completas y retornar
    return this.repairOrderRepository.findOne({
      where: { workOrderNumber: savedOrder.workOrderNumber },
      relations: ['technician', 'client'],
    });
  }


  async remove(workOrderNumber: string): Promise<void> {
    const repairOrder = await this.findOneByWorkOrderNumber(workOrderNumber);
    await this.repairOrderRepository.remove(repairOrder);
  }

  // Agregar este nuevo método
  async assignCasillero(workOrderNumber: string, casilleroId: number): Promise<Order> {
    // Buscar la orden usando el workOrderNumber (que es como manejas las búsquedas en tu servicio)
    const order = await this.repairOrderRepository.findOne({
      where: { workOrderNumber },
      relations: ['casillero']
    });

    if (!order) {
      throw new NotFoundException(
        'No se ha encontrado ninguna orden de reparación con ese número.'
      );
    }

    // Verificar si la orden ya tiene un casillero asignado
    if (order.casillero) {
      throw new BadRequestException(
        `La orden ${workOrderNumber} ya tiene asignado el casillero ${order.casillero.numero}`
      );
    }

    // Buscar el casillero
    const casillero = await this.casilleroRepository.findOne({
      where: { id: casilleroId }
    });

    if (!casillero) {
      throw new NotFoundException('Casillero no encontrado');
    }

    // Verificar que el casillero esté disponible
    if (casillero.estado === EstadoCasillero.OCUPADO) {
      throw new BadRequestException(
        `El casillero ${casillero.numero} ya está ocupado`
      );
    }

    // Asignar el casillero a la orden y actualizar su estado
    casillero.orderId = order.id;
    casillero.estado = EstadoCasillero.OCUPADO;
    order.casillero = casillero;

    // Guardar los cambios
    await this.casilleroRepository.save(casillero);

    // Guardar y retornar la orden actualizada con sus relaciones
    return this.repairOrderRepository.save(order);
  }
}