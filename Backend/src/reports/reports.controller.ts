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
  ) {
    return this.reportsService.getClientsReport(range, startDate, endDate);
  }

  @Get('inventory')
  getInventoryReport() {
    return this.reportsService.getInventoryReport();
  }

  @Get('purchases')
  getPurchasesReport(
    @Query('range') range?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getPurchasesReport(range, startDate, endDate);
  }

  @Get('budgets')
  getBudgetsReport(
    @Query('range') range?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getBudgetsReport(range, startDate, endDate);
  }

  @Get('orders')
  getOrdersReport(
    @Query('range') range?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getOrdersReport(range, startDate, endDate);
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
  ) {
    return this.reportsService.getTechniciansReport(range, startDate, endDate, technicianId);
  }

  @Get('equipment')
  getEquipmentReport(
    @Query('range') range?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getEquipmentReport(range, startDate, endDate);
  }
}
