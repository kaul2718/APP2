import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  Req,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  ParseIntPipe
} from '@nestjs/common';
import { Request } from 'express';
import { OrderService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ConvertirOrdenCompletaDto } from './dto/convertir-orden.dto';
import { AutorizarPresupuestoPrivadoDto } from './dto/autorizar-presupuesto-privado.dto';
import { AutorizarPresupuestoPresencialDto } from './dto/autorizar-presupuesto-presencial.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { RequirePermissions } from 'src/decorators/permissions.decorator';
import { CurrentUser, CurrentUser as UserDecorator } from 'src/auth/decorators/user.decorator';

import { Order } from './entities/order.entity';
import { CreateActividadTecnicaDto } from 'src/actividad-tecnica/dto/create-actividad-tecnica.dto';
import { CreatePresupuestoDto } from 'src/presupuesto/dto/create-presupuesto.dto';
import { CreateCasilleroDto } from 'src/casillero/dto/create-casillero.dto';
import { CreateEvidenciaTecnicaDto } from 'src/evidencia-tecnica/dto/create-evidencia-tecnica.dto';
import { User } from 'src/users/entities/user.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Auth('admin', 'tech', 'recep')
  @RequirePermissions('orders.create')
  @Post()
  create(@Body() dto: CreateOrderDto): Promise<Order> {
    return this.orderService.create(dto);
  }

  @Auth('client')
  @Get('my-orders')
  async getMyOrders(
    @UserDecorator() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = page ? parseInt(page, 10) : 1;
    const parsedLimit = limit ? parseInt(limit, 10) : 10;

    const result = await this.orderService.findAllPaginated(
      parsedPage,
      parsedLimit,
      undefined,
      undefined,
      undefined,
      user.id,
    );

    return {
      items: result.data,
      totalItems: result.total,
      currentPage: parsedPage,
      totalPages: Math.ceil(result.total / parsedLimit),
    };
  }

  @Auth('admin', 'tech', 'recep')
  @RequirePermissions('orders.view')
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('estadoOrdenId') estadoOrdenId?: string,
    @Query('technicianId') technicianId?: string,
    @Query('clientId') clientId?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    // Convertir y validar page
    const parsedPage = page ? parseInt(page, 10) : 1;
    if (isNaN(parsedPage) || parsedPage < 1) {
      throw new BadRequestException('page debe ser un numero positivo');
    }

    // Convertir y validar limit
    const ALLOWED_LIMITS = [10, 25, 50, 100];
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    if (isNaN(parsedLimit) || !ALLOWED_LIMITS.includes(parsedLimit)) {
      throw new BadRequestException(`limit debe ser uno de: ${ALLOWED_LIMITS.join(', ')}`);
    }

    // Convertir IDs opcionales
    const parsedEstadoOrdenId = estadoOrdenId ? parseInt(estadoOrdenId, 10) : undefined;
    const parsedTechnicianId = technicianId ? parseInt(technicianId, 10) : undefined;
    const parsedClientId = clientId ? parseInt(clientId, 10) : undefined;

    // Validar IDs si se proporcionan
    if (parsedEstadoOrdenId && isNaN(parsedEstadoOrdenId)) {
      throw new BadRequestException('estadoOrdenId debe ser un numero');
    }
    if (parsedTechnicianId && isNaN(parsedTechnicianId)) {
      throw new BadRequestException('technicianId debe ser un numero');
    }
    if (parsedClientId && isNaN(parsedClientId)) {
      throw new BadRequestException('clientId debe ser un numero');
    }

    // Convertir fechas si se proporcionan
    const parsedFechaInicio = fechaInicio ? new Date(fechaInicio) : undefined;
    const parsedFechaFin = fechaFin ? new Date(fechaFin) : undefined;

    // Convertir includeInactive a boolean
    const parsedIncludeInactive = includeInactive === 'true';

    const result = await this.orderService.findAllPaginated(
      parsedPage,
      parsedLimit,
      search,
      parsedEstadoOrdenId,
      parsedTechnicianId,
      parsedClientId,
      parsedFechaInicio,
      parsedFechaFin,
      parsedIncludeInactive,
    );

    return {
      items: result.data,
      totalItems: result.total,
      totalPages: Math.ceil(result.total / parsedLimit),
      currentPage: parsedPage,
    };
  }

  @Auth('admin', 'recep', 'tech')
  @Get('tecnicos/disponibilidad')
  async getTechniciansAvailability() {
    return this.orderService.getTechniciansAvailability();
  }

  @Auth('admin', 'tech', 'recep', 'client')
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('includeInactive') includeInactive?: string,
    @CurrentUser() user?: any,
  ): Promise<Order> {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      throw new BadRequestException('ID debe ser un número positivo');
    }
    const parsedIncludeInactive = includeInactive === 'true';
    const order = await this.orderService.findOne(parsedId, parsedIncludeInactive);

    const isClient =
      user?.role === 'client' ||
      user?.role === 'cliente' ||
      (user?.userRoles &&
        user.userRoles.some((r: any) =>
          ['client', 'cliente'].includes(r.rol?.slug || r.rol?.nombre),
        ));

    const userId = user?.sub || user?.id;
    if (isClient && order.client?.id !== userId) {
      throw new ForbiddenException('No tiene permisos para consultar esta orden de servicio.');
    }

    return order;
  }


  // Endpoint unificado para actualización (incluye casillero y estado)
  @Auth('tech', 'recep', 'admin')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @CurrentUser() user: any,
  ): Promise<Order> {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      throw new BadRequestException('ID debe ser un número positivo');
    }

    if (!user || (!user.sub && !user.id)) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    const authenticatedUserId = Number(user.sub || user.id);
    return await this.orderService.update(parsedId, dto, authenticatedUserId);
  }

  @Auth('admin')
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Order> {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      throw new BadRequestException('ID debe ser un número positivo');
    }
    await this.orderService.remove(parsedId);
    return this.orderService.findOne(parsedId, true);
  }

  @Auth('admin')
  @Patch(':id/restore')
  async restore(@Param('id') id: string): Promise<Order> {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      throw new BadRequestException('ID debe ser un número positivo');
    }
    await this.orderService.restore(parsedId);
    return this.orderService.findOne(parsedId);
  }

  @Auth('admin', 'tech', 'recep')
  @Patch(':id/toggle-estado')
  async toggleEstado(@Param('id') id: string): Promise<Order> {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      throw new BadRequestException('ID debe ser un número positivo');
    }
    return this.orderService.toggleStatus(parsedId);
  }

  @Auth('admin', 'tech', 'recep')
  @Patch(':id/convertir-completa')
  async convertirACompleta(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConvertirOrdenCompletaDto,
    @UserDecorator() user: User,
  ) {
    const userId = user?.id || (user as any)?.sub;
    return this.orderService.convertirOrdenACompleta(id, dto, userId);
  }

  @Auth('admin', 'tech', 'recep')
  @Post(':id/actividades')
  addActividadTecnica(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: CreateActividadTecnicaDto,
  ) {
    return this.orderService.addActividadTecnica(orderId, dto);
  }

  @Auth('admin', 'tech', 'recep')
  @Post(':id/presupuesto')
  addPresupuesto(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: CreatePresupuestoDto,
  ) {
    return this.orderService.addPresupuesto(orderId, dto);
  }

  @Auth('admin', 'tech', 'recep')
  @Post(':id/casillero')
  assignCasillero(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: CreateCasilleroDto,
  ) {
    return this.orderService.assignCasillero(orderId, dto);
  }

  @Auth('admin', 'tech', 'recep')
  @Post(':id/evidencias')
  addEvidenciaTecnica(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: CreateEvidenciaTecnicaDto,
  ) {
    return this.orderService.addEvidenciaTecnica(orderId, dto);
  }

  @Auth('admin', 'tech', 'recep')
  @Patch(':id/estado/:estadoId')
  async changeEstadoOrden(
    @Param('id', ParseIntPipe) orderId: number,
    @Param('estadoId', ParseIntPipe) estadoOrdenId: number,
    @UserDecorator() user: User, // Usando tu decorador personalizado
  ): Promise<Order> {
    return this.orderService.changeEstadoOrden(orderId, estadoOrdenId, user.id);
  }

  @Auth('tech')
  @RequirePermissions('orders.view')
  @Get('tecnico/mis-ordenes')
  async getOrdersForTechnician(
    @CurrentUser() user: any,
    @Query('estadoOrdenId') estadoOrdenId?: string,
    @Query('search') search?: string,
  ) {
    const parsedEstadoId = estadoOrdenId ? parseInt(estadoOrdenId, 10) : undefined;
    return this.orderService.findOrdersByTechnician(user.id, parsedEstadoId, search);
  }

  @Auth('client')
  @Get('cliente/mis-ordenes')
  async getOrdersForClient(@CurrentUser() user: any) {  // Usa any temporalmente para debug
    return this.orderService.findOrdersByClient(user.id); // Usa user.id en lugar de user.sub
  }

  @Get('public/consulta')
  async getPublicOrder(
    @Query('cedula') cedula: string,
    @Query('workorder') workorder: string,
    @Query('token') token?: string,
  ) {
    return this.orderService.findPublicOrder(cedula, workorder, token);
  }

  /**
   * Endpoint de compatibilidad revocado permanentemente:
   * Bloquea cualquier intento de aprobar/rechazar presupuestos únicamente con cédula y número de orden.
   */
  @Post('public/consulta/presupuesto/action')
  async handlePublicPresupuestoAction() {
    throw new ForbiddenException(
      'El método de aprobación directa por cédula ha sido revocado permanentemente por motivos de seguridad. Utilice la autorización verificada mediante la credencial privada o en mostrador.',
    );
  }

  /**
   * Autorización verificada mediante credencial criptográfica privada (Token de ODS / QR físico)
   */
  @Post('public/consulta/presupuesto/autorizar-privado')
  async handlePrivatePresupuestoAction(
    @Body() dto: AutorizarPresupuestoPrivadoDto,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip;
    const userAgent = req.headers['user-agent'];
    return this.orderService.handlePrivatePresupuestoAction(dto, ip, userAgent);
  }

  /**
   * Autorización presencial asistida en mostrador con firma táctil manuscrita
   */
  @Auth('admin', 'tech', 'recep')
  @Post(':id/presupuesto/autorizar-presencial')
  async handlePresupuestoActionPresencial(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: AutorizarPresupuestoPresencialDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const operadorId = user.sub || user.id;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip;
    const userAgent = req.headers['user-agent'];
    return this.orderService.handlePresupuestoActionPresencial(orderId, dto, operadorId, ip, userAgent);
  }

  /**
   * Regeneración de credencial privada de orden por pérdida o extravío
   */
  @Auth('admin', 'tech', 'recep')
  @Post(':id/credencial/regenerar')
  async regenerarCredencial(
    @Param('id', ParseIntPipe) orderId: number,
    @CurrentUser() user: any,
  ) {
    const operadorId = user.sub || user.id;
    return this.orderService.regenerarCredencialOrden(orderId, operadorId);
  }

  /**
   * Revocación de credencial privada de orden
   */
  @Auth('admin', 'tech', 'recep')
  @Post(':id/credencial/revocar')
  async revocarCredencial(
    @Param('id', ParseIntPipe) orderId: number,
    @CurrentUser() user: any,
  ) {
    const operadorId = user.sub || user.id;
    return this.orderService.revocarCredencialOrden(orderId, operadorId);
  }
}