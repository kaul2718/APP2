import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Auth } from 'src/auth/decorators/auth.decorator';

@Controller('reports')
@Auth('admin')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboardStats(
    @Query('range') range?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getDashboardStats(range, startDate, endDate);
  }

  @Get('clients')
  getClientsReport(
    @Query('range') range?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('segment') segment?: string,
  ) {
    return this.reportsService.getClientsReport(range, startDate, endDate, segment);
  }

  @Get('inventory')
  getInventoryReport(
    @Query('categoryId') categoryId?: number,
    @Query('rotation') rotation?: string,
    @Query('stockStatus') stockStatus?: string,
  ) {
    return this.reportsService.getInventoryReport(categoryId, rotation, stockStatus);
  }

  @Get('purchases')
  getPurchasesReport(
    @Query('range') range?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('estado') estado?: string,
    @Query('minTotal') minTotal?: string,
    @Query('maxTotal') maxTotal?: string,
  ) {
    return this.reportsService.getPurchasesReport(range, startDate, endDate, estado, minTotal ? parseFloat(minTotal) : undefined, maxTotal ? parseFloat(maxTotal) : undefined);
  }

  @Get('budgets/estados')
  getBudgetsEstados() {
    return this.reportsService.getBudgetsEstados();
  }

  @Get('budgets')
  getBudgetsReport(
    @Query('range') range?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('estado') estado?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.reportsService.getBudgetsReport(range, startDate, endDate, estado, sortBy);
  }

  @Get('orders/estados')
  getOrdersEstados() {
    return this.reportsService.getOrdersEstados();
  }

  @Get('orders')
  getOrdersReport(
    @Query('range') range?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('estado') estado?: string,
    @Query('technicianId') technicianId?: number,
  ) {
    return this.reportsService.getOrdersReport(range, startDate, endDate, estado, technicianId);
  }

  @Get('technicians/list')
  getTechniciansList() {
    return this.reportsService.getTechniciansList();
  }

  @Get('technicians')
  getTechniciansReport(
    @Query('range') range?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('technicianId') technicianId?: number,
    @Query('sortBy') sortBy?: string,
    @Query('minOrders') minOrders?: string,
  ) {
    return this.reportsService.getTechniciansReport(range, startDate, endDate, technicianId, sortBy, minOrders ? parseInt(minOrders) : undefined);
  }

  @Get('equipment')
  getEquipmentReport(
    @Query('range') range?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: string,
    @Query('minCount') minCount?: string,
  ) {
    return this.reportsService.getEquipmentReport(range, startDate, endDate, sortBy, minCount ? parseInt(minCount) : undefined);
  }
}
