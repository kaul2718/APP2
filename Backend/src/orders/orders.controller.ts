import { Controller, Get, Post, Body, Patch, Param, Delete, Put, BadRequestException, NotFoundException, InternalServerErrorException, Req } from '@nestjs/common';
import { OrderService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { Request } from 'express';

@Auth(Role.ADMIN)
@Controller('orders')
export class OrdersController {
  constructor(private readonly OrderService: OrderService) { }
  // Crear una nueva orden de reparación
  @Auth(Role.TECH)
  @Post()
  async create(@Body() CreateOrderDto: CreateOrderDto): Promise<Order> {
    return this.OrderService.create(CreateOrderDto);
  }

  //TRAE TODAS LAS ORDENES DEL TECNICO QUE ESTEN ASOCIADAS A SU IDDDDDDDDD
  @Auth(Role.TECH)
  @Get('tecnico')
  async getOrdersForTechnician(@Req() req) {
    const technicianId = req.user.sub;  // Usar el sub del token
    return await this.OrderService.findOrdersByTechnician(technicianId);
  }

  @Auth(Role.CLIENT)
  @Get('cliente')
  async getOrdersForClient(@Req() req) {
    const clientId = req.user.sub;  // Usar el sub del token para obtener el ID del cliente
    return await this.OrderService.findOrdersByClient(clientId);
  }

  // Obtener todas las órdenes de reparación
  @Get()
  async findAll(@Req() request: Request): Promise<Order[]> {
    const user = request.user; // Asume que el usuario autenticado está en request.user
    return this.OrderService.findAll(user);
  }

  /* Obtener una orden de reparación por ID
  @Auth(Role.TECH)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Order> {
    return this.OrderService.findOne(Number(id));
  }*/

  @Get(':workOrderNumber')
  async findOneByWorkOrderNumber(@Param('workOrderNumber') workOrderNumber: string) {
    if (!workOrderNumber) {
      throw new BadRequestException('El número de orden de trabajo no puede estar vacío.');
    }
    return this.OrderService.findOneByWorkOrderNumber(workOrderNumber);
  }

  // Actualizar una orden de reparación por workOrderNumber
  @Auth(Role.TECH) // Solo accesible por técnicos
  @Patch(':workOrderNumber')
  async update(
    @Param('workOrderNumber') workOrderNumber: string,
    @Body() updateRepairOrderDto: UpdateOrderDto,
  ) {
    if (!workOrderNumber) {
      throw new BadRequestException('El número de orden de trabajo no puede estar vacío.');
    }

    try {
      // Verificar si la orden de reparación existe
      const existingOrder = await this.OrderService.findOneByWorkOrderNumber(workOrderNumber);
      if (!existingOrder) {
        throw new NotFoundException('No se ha encontrado una orden de reparación con ese número de orden de trabajo.');
      }

      // Actualizar la orden de reparación con el DTO proporcionado
      return await this.OrderService.update(workOrderNumber, updateRepairOrderDto);
    } catch (error) {
      throw new InternalServerErrorException(
        `Ocurrió un error al intentar actualizar la orden: ${error.message}`,
      );
    }
  }


  // Eliminar una orden de reparación por workOrderNumber
  @Auth(Role.TECH)  // Solo accesible por técnicos
  @Delete(':workOrderNumber')
  async remove(@Param('workOrderNumber') workOrderNumber: string): Promise<void> {
    if (!workOrderNumber) {
      throw new BadRequestException('El número de orden de trabajo no puede estar vacío.');
    }
    await this.OrderService.remove(workOrderNumber);
  }

  // Asignar casillero a  una orden de reparación
  @Auth(Role.TECH)
  @Patch(':workOrderNumber/assign-casillero/:casilleroId')
  async assignCasillero(
    @Param('workOrderNumber') workOrderNumber: string,
    @Param('casilleroId') casilleroId: string,
  ) {
    if (!workOrderNumber) {
      throw new BadRequestException('El número de orden de trabajo no puede estar vacío.');
    }

    if (!casilleroId || isNaN(Number(casilleroId))) {
      throw new BadRequestException('El ID del casillero no es válido.');
    }

    try {
      // Verificar si la orden existe
      const existingOrder = await this.OrderService.findOneByWorkOrderNumber(workOrderNumber);
      if (!existingOrder) {
        throw new NotFoundException('No se ha encontrado una orden de reparación con ese número de orden de trabajo.');
      }

      // Asignar el casillero
      return await this.OrderService.assignCasillero(workOrderNumber, Number(casilleroId));
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Ocurrió un error al intentar asignar el casillero: ${error.message}`,
      );
    }
  }
}