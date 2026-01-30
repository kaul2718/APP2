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
  Req,
  UnauthorizedException
} from '@nestjs/common';
import { OrderService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { Order } from './entities/order.entity';
import { CreateActividadTecnicaDto } from 'src/actividad-tecnica/dto/create-actividad-tecnica.dto';
import { CreatePresupuestoDto } from 'src/presupuesto/dto/create-presupuesto.dto';
import { CreateCasilleroDto } from 'src/casillero/dto/create-casillero.dto';
import { CreateEvidenciaTecnicaDto } from 'src/evidencia-tecnica/dto/create-evidencia-tecnica.dto';
import { CurrentUser, CurrentUser as UserDecorator } from 'src/auth/decorators/user.decorator';
import { User } from 'src/users/entities/user.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('orders')
@Auth(Role.ADMIN, Role.TECH, Role.RECEP) // Ajusta los roles según necesites

export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Auth(Role.ADMIN, Role.TECH, Role.RECEP) // Ajusta los roles según necesites
  @Post()
  create(@Body() dto: CreateOrderDto): Promise<Order> {
    return this.orderService.create(dto);
  }

  @Auth(Role.ADMIN, Role.TECH, Role.RECEP) // Ajusta los roles según necesites
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

  @Auth(Role.CLIENT) // Ajusta los roles según necesites
  @Auth()
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<Order> {
    return this.orderService.findOne(id, includeInactive);
  }

  // Endpoint unificado para actualización (incluye casillero y estado)
  @Auth(Role.TECH, Role.RECEP, Role.ADMIN)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderDto,
    @Req() req,
  ): Promise<Order> {
    console.log('Usuario desde req.user:', req.user); // debug temporal

    if (!req.user || !req.user.sub) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    return await this.orderService.update(id, {
      ...dto,
      userId: req.user.sub
    });
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

  @Auth(Role.ADMIN, Role.TECH, Role.RECEP) // Ajusta los roles según necesites
  @Patch(':id/toggle-estado')
  async toggleEstado(@Param('id', ParseIntPipe) id: number): Promise<Order> {
    return this.orderService.toggleStatus(id);
  }

  @Auth(Role.ADMIN, Role.TECH, Role.RECEP) // Ajusta los roles según necesites
  @Post(':id/actividades')
  addActividadTecnica(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: CreateActividadTecnicaDto,
  ) {
    return this.orderService.addActividadTecnica(orderId, dto);
  }

  @Auth(Role.ADMIN, Role.TECH, Role.RECEP) // Ajusta los roles según necesites
  @Post(':id/presupuesto')
  addPresupuesto(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: CreatePresupuestoDto,
  ) {
    return this.orderService.addPresupuesto(orderId, dto);
  }

  @Auth(Role.ADMIN, Role.TECH, Role.RECEP) // Ajusta los roles según necesites
  @Post(':id/casillero')
  assignCasillero(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: CreateCasilleroDto,
  ) {
    return this.orderService.assignCasillero(orderId, dto);
  }

  @Auth(Role.ADMIN, Role.TECH, Role.RECEP) // Ajusta los roles según necesites
  @Post(':id/evidencias')
  addEvidenciaTecnica(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: CreateEvidenciaTecnicaDto,
  ) {
    return this.orderService.addEvidenciaTecnica(orderId, dto);
  }

  @Auth(Role.ADMIN, Role.TECH, Role.RECEP) // Ajusta los roles según necesites
  @Patch(':id/estado/:estadoId')
  async changeEstadoOrden(
    @Param('id', ParseIntPipe) orderId: number,
    @Param('estadoId', ParseIntPipe) estadoOrdenId: number,
    @UserDecorator() user: User, // Usando tu decorador personalizado
  ): Promise<Order> {
    return this.orderService.changeEstadoOrden(orderId, estadoOrdenId, user.id);
  }

  @Auth(Role.TECH)
  @Get('tecnico/mis-ordenes')
  async getOrdersForTechnician(@CurrentUser() user: any) { // Usa CurrentUser como decorador
    console.log('USER ID TO SEARCH:', user.sub);

    return this.orderService.findOrdersByTechnician(user.sub);
  }

  @Auth(Role.CLIENT)
  @Get('cliente/mis-ordenes')
  async getOrdersForClient(@CurrentUser() user: any) {  // Usa any temporalmente para debug
    console.log('USER ID TO SEARCH:', user.sub);
    return this.orderService.findOrdersByClient(user.sub); // Usa user.sub en lugar de user.id
  }
}