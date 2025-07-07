import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  Req
} from '@nestjs/common';
import { OrderService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { Order } from './entities/order.entity';
import { CreateActividadTecnicaDto } from 'src/actividad-tecnica/dto/create-actividad-tecnica.dto';
import { CreatePresupuestoDto } from 'src/presupuesto/dto/create-presupuesto.dto';
import { CreateDetalleRepuestoDto } from 'src/detalle-repuestos/dto/create-detalle-repuesto.dto';
import { CreateCasilleroDto } from 'src/casillero/dto/create-casillero.dto';
import { CreateEvidenciaTecnicaDto } from 'src/evidencia-tecnica/dto/create-evidencia-tecnica.dto';
import { User as UserDecorator } from 'src/auth/decorators/user.decorator';
import { User } from 'src/users/entities/user.entity';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Auth(Role.RECEP, Role.ADMIN)
  @Post()
  create(@Body() dto: CreateOrderDto): Promise<Order> {
    return this.orderService.create(dto);
  }

  @Auth()
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('estadoOrdenId') estadoOrdenId?: number,
    @Query('technicianId') technicianId?: number,
    @Query('clientId') clientId?: number,
    @Query('fechaInicio') fechaInicio?: Date,
    @Query('fechaFin') fechaFin?: Date,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    const result = await this.orderService.findAllPaginated(
      page,
      limit,
      search,
      estadoOrdenId,
      technicianId,
      clientId,
      fechaInicio,
      fechaFin,
      includeInactive,
    );

    return {
      items: result.data,
      totalItems: result.total,
      totalPages: Math.ceil(result.total / limit),
      currentPage: page,
    };
  }

  @Auth()
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<Order> {
    return this.orderService.findOne(id, includeInactive);
  }

  @Auth(Role.TECH, Role.RECEP, Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderDto,
  ): Promise<Order> {
    return this.orderService.update(id, dto);
  }

  @Auth(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Order> {
    await this.orderService.remove(id);
    return this.orderService.findOne(id, true);
  }

  @Auth(Role.ADMIN)
  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<Order> {
    await this.orderService.restore(id);
    return this.orderService.findOne(id);
  }

  @Auth(Role.TECH, Role.ADMIN)
  @Patch(':id/toggle-estado')
  async toggleEstado(@Param('id', ParseIntPipe) id: number): Promise<Order> {
    return this.orderService.toggleStatus(id);
  }

  @Auth(Role.TECH, Role.ADMIN)
  @Post(':id/actividades')
  addActividadTecnica(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: CreateActividadTecnicaDto,
  ) {
    return this.orderService.addActividadTecnica(orderId, dto);
  }

  @Auth(Role.TECH, Role.ADMIN)
  @Post(':id/presupuesto')
  addPresupuesto(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: CreatePresupuestoDto,
  ) {
    return this.orderService.addPresupuesto(orderId, dto);
  }

  @Auth(Role.RECEP, Role.ADMIN)
  @Post(':id/casillero')
  assignCasillero(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: CreateCasilleroDto,
  ) {
    return this.orderService.assignCasillero(orderId, dto);
  }

  @Auth(Role.TECH, Role.ADMIN)
  @Post(':id/evidencias')
  addEvidenciaTecnica(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: CreateEvidenciaTecnicaDto,
  ) {
    return this.orderService.addEvidenciaTecnica(orderId, dto);
  }

  @Auth(Role.TECH, Role.RECEP, Role.ADMIN)
  @Patch(':id/estado/:estadoId')
  async changeEstadoOrden(
    @Param('id', ParseIntPipe) orderId: number,
    @Param('estadoId', ParseIntPipe) estadoOrdenId: number,
    @UserDecorator() user: User, // Usando tu decorador personalizado
  ): Promise<Order> {
    return this.orderService.changeEstadoOrden(orderId, estadoOrdenId, user.id);
  }
}