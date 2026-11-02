import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { ReportsExportService, ReportColumnDefinition } from './reports-export.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { PermissionsGuard } from '../auth/guard/permissions.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('reports')
@UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly exportService: ReportsExportService,
  ) {}

  // =========================================================================
  // 1. FILTROS Y RESUMEN GENERAL (METADATOS)
  // =========================================================================
  @Get('filters')
  @RequirePermissions('reportes.view')
  async getFilterOptions() {
    return this.reportsService.getFilterOptions();
  }

  @Get('summary')
  @RequirePermissions('reportes.view')
  async getExecutiveSummary(@Query() query: ReportQueryDto) {
    return this.reportsService.getExecutiveSummary(query);
  }

  // =========================================================================
  // 2. ENDPOINTS DE CONSULTA DE REPORTES (JSON PARA VISTA PREVIA)
  // =========================================================================
  @Get('orders')
  @RequirePermissions('reportes.view')
  async getOrdersReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getOrdersReport(query);
  }

  @Get('delivered-vs-received')
  @RequirePermissions('reportes.view')
  async getDeliveredVsReceivedReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getDeliveredVsReceivedReport(query);
  }

  @Get('delayed-sla')
  @RequirePermissions('reportes.view')
  async getDelayedAndSlaReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getDelayedAndSlaReport(query);
  }

  @Get('budgets')
  @RequirePermissions('reportes.view')
  async getBudgetsReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getBudgetsReport(query);
  }

  @Get('inventory')
  @RequirePermissions('reportes.view')
  async getInventoryReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getInventoryReport(query);
  }

  @Get('technicians')
  @RequirePermissions('reportes.view')
  async getTechniciansReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getTechniciansReport(query);
  }

  @Get('recurring-clients')
  @RequirePermissions('reportes.view')
  async getRecurringClientsReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getRecurringClientsReport(query);
  }

  @Get('purchases')
  @RequirePermissions('reportes.view')
  async getPurchasesReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getPurchasesReport(query);
  }

  // =========================================================================
  // 3. EXPORTACIÓN PROFESIONAL A EXCEL (.XLSX)
  // =========================================================================
  @Get('export/excel')
  @RequirePermissions('reportes.export')
  async exportExcel(
    @Query() query: ReportQueryDto,
    @Query('type') type: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const reportType = query.type || type || 'orders';
    const exportConfig = await this.resolveExportData(reportType, query, user);

    const buffer = await this.exportService.generateExcel({
      title: exportConfig.title,
      dateRangeLabel: exportConfig.dateRangeLabel,
      generatedBy: `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.correo,
      columns: exportConfig.columns,
      data: exportConfig.data,
      kpis: exportConfig.kpis,
      totals: exportConfig.totals,
    });

    const filename = `reporte_${reportType}_${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }

  // =========================================================================
  // 4. EXPORTACIÓN PROFESIONAL A PDF VECTORIAL
  // =========================================================================
  @Get('export/pdf')
  @RequirePermissions('reportes.export')
  async exportPdf(
    @Query() query: ReportQueryDto,
    @Query('type') type: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const reportType = query.type || type || 'orders';
    const exportConfig = await this.resolveExportData(reportType, query, user);

    const buffer = await this.exportService.generatePdf({
      title: exportConfig.title,
      dateRangeLabel: exportConfig.dateRangeLabel,
      generatedBy: `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.correo,
      columns: exportConfig.columns,
      data: exportConfig.data,
      kpis: exportConfig.kpis,
      totals: exportConfig.totals,
    });

    const filename = `reporte_${reportType}_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }

  // =========================================================================
  // HELPER PARA RESOLVER DATOS COMPLETOS DE EXPORTACIÓN (SIN PAGINAR)
  // =========================================================================
  private async resolveExportData(type: string, query: ReportQueryDto, user: User) {
    // Para exportación completa se consulta sin paginar (límite de seguridad: 5000 registros)
    const exportQuery: ReportQueryDto = {
      ...query,
      page: 1,
      limit: 5000,
    };

    switch (type) {
      case 'orders': {
        const result = await this.reportsService.getOrdersReport(exportQuery);
        const columns: ReportColumnDefinition[] = [
          { header: 'N° Orden', key: 'workOrderNumber', width: 14 },
          { header: 'Tipo', key: 'tipoOrden', width: 10, align: 'center' },
          { header: 'Fecha Ingreso', key: 'fechaIngreso', width: 14, type: 'date' },
          { header: 'Cliente', key: 'cliente', width: 24 },
          { header: 'Cédula/RUC', key: 'clienteIdentificacion', width: 14 },
          { header: 'Equipo', key: 'equipoCompleto', width: 24 },
          { header: 'N° Serie', key: 'serie', width: 14 },
          { header: 'Técnico', key: 'tecnico', width: 18 },
          { header: 'Estado', key: 'estado', width: 14, align: 'center' },
          { header: 'Monto Aprobado', key: 'montoAprobado', width: 16, type: 'currency', align: 'right' },
        ];
        const totalAprobado = result.data.reduce((acc, row) => acc + (row.montoAprobado || 0), 0);
        return {
          title: 'Reporte General de Órdenes de Servicio',
          dateRangeLabel: result.dateRangeLabel,
          columns,
          data: result.data,
          kpis: result.kpis,
          totals: { montoAprobado: totalAprobado },
        };
      }

      case 'delivered':
      case 'delivered-vs-received': {
        const result = await this.reportsService.getDeliveredVsReceivedReport(exportQuery);
        const columns: ReportColumnDefinition[] = [
          { header: 'N° Orden', key: 'workOrderNumber', width: 14 },
          { header: 'Tipo', key: 'tipoOrden', width: 10, align: 'center' },
          { header: 'Fecha Ingreso', key: 'fechaIngreso', width: 14, type: 'date' },
          { header: 'Estado Actual', key: 'estado', width: 14, align: 'center' },
          { header: 'Fecha Entrega', key: 'fechaEntrega', width: 14, type: 'date' },
          { header: 'Días en Taller', key: 'diasEstanciaTaller', width: 14, type: 'number', align: 'right' },
          { header: 'Cliente', key: 'cliente', width: 24 },
          { header: 'Equipo', key: 'equipo', width: 24 },
          { header: 'N° Serie', key: 'serie', width: 14 },
          { header: 'Técnico', key: 'tecnico', width: 18 },
        ];
        return {
          title: 'Reporte de Equipos Recibidos vs. Físicamente Entregados',
          dateRangeLabel: result.dateRangeLabel,
          columns,
          data: result.data,
          kpis: result.kpis,
        };
      }

      case 'delayed':
      case 'delayed-sla': {
        const result = await this.reportsService.getDelayedAndSlaReport(exportQuery);
        const columns: ReportColumnDefinition[] = [
          { header: 'N° Orden', key: 'workOrderNumber', width: 14 },
          { header: 'Tipo', key: 'tipoOrden', width: 10, align: 'center' },
          { header: 'Fecha Ingreso', key: 'fechaIngreso', width: 14, type: 'date' },
          { header: 'Fecha Prometida', key: 'fechaPrometidaEntrega', width: 14, type: 'date' },
          { header: 'Días Retraso', key: 'diasRetraso', width: 12, type: 'number', align: 'right' },
          { header: 'Cliente', key: 'cliente', width: 22 },
          { header: 'Teléfono', key: 'telefono', width: 14 },
          { header: 'Equipo', key: 'equipo', width: 22 },
          { header: 'Técnico', key: 'tecnico', width: 18 },
          { header: 'Estado', key: 'estado', width: 14, align: 'center' },
        ];
        return {
          title: 'Reporte de Órdenes Atrasadas y Tiempos de Atención SLA',
          dateRangeLabel: result.dateRangeLabel,
          columns,
          data: result.delayedOrders,
          kpis: result.kpis,
        };
      }

      case 'budgets': {
        const result = await this.reportsService.getBudgetsReport(exportQuery);
        const columns: ReportColumnDefinition[] = [
          { header: 'N° Presupuesto', key: 'numeroPresupuesto', width: 16 },
          { header: 'N° Orden', key: 'workOrderNumber', width: 14 },
          { header: 'Fecha Emisión', key: 'fechaEmision', width: 14, type: 'date' },
          { header: 'Cliente', key: 'cliente', width: 24 },
          { header: 'Estado', key: 'estado', width: 14, align: 'center' },
          { header: 'Repuestos', key: 'montoRepuestos', width: 14, type: 'currency', align: 'right' },
          { header: 'Mano de Obra', key: 'montoServicios', width: 14, type: 'currency', align: 'right' },
          { header: 'Subtotal', key: 'subtotal', width: 14, type: 'currency', align: 'right' },
          { header: 'IVA (15%)', key: 'iva', width: 12, type: 'currency', align: 'right' },
          { header: 'Total', key: 'total', width: 14, type: 'currency', align: 'right' },
        ];
        const subtotalSum = result.data.reduce((acc, row) => acc + (row.subtotal || 0), 0);
        const totalSum = result.data.reduce((acc, row) => acc + (row.total || 0), 0);
        return {
          title: 'Reporte de Presupuestos y Tasa de Aprobación',
          dateRangeLabel: result.dateRangeLabel,
          columns,
          data: result.data,
          kpis: result.kpis,
          totals: { subtotal: subtotalSum, total: totalSum },
        };
      }

      case 'inventory': {
        const result = await this.reportsService.getInventoryReport(exportQuery);
        const isServicesTab = exportQuery.tipoItem === 'servicios';

        if (isServicesTab) {
          const columns: ReportColumnDefinition[] = [
            { header: 'Código', key: 'codigo', width: 16 },
            { header: 'Descripción del Servicio', key: 'nombre', width: 34 },
            { header: 'Categoría', key: 'categoria', width: 18 },
            { header: 'Tarifa Comercial', key: 'precioVenta', width: 16, type: 'currency', align: 'right' },
            { header: 'Costo Referencial', key: 'costoUnitario', width: 16, type: 'currency', align: 'right' },
            { header: 'Disponibilidad', key: 'disponibilidadComercial', width: 16, align: 'center' },
          ];
          return {
            title: 'Catálogo de Tarifas y Servicios Técnicos',
            dateRangeLabel: result.dateRangeLabel,
            columns,
            data: result.data,
            kpis: result.kpis,
          };
        }

        const columns: ReportColumnDefinition[] = [
          { header: 'Código', key: 'codigo', width: 14 },
          { header: 'Descripción', key: 'nombre', width: 30 },
          { header: 'Categoría', key: 'categoria', width: 16 },
          { header: 'Stock', key: 'stock', width: 10, type: 'number', align: 'right' },
          { header: 'Mín.', key: 'stockMinimo', width: 10, type: 'number', align: 'right' },
          { header: 'Condición', key: 'estadoStock', width: 14, align: 'center' },
          { header: 'Costo Unit.', key: 'costoUnitario', width: 14, type: 'currency', align: 'right' },
          { header: 'P. Venta', key: 'precioVenta', width: 14, type: 'currency', align: 'right' },
          { header: 'Valor Costo', key: 'valorInventarioCosto', width: 15, type: 'currency', align: 'right' },
        ];
        const valorTotalCosto = result.data.reduce((acc, row) => acc + (row.valorInventarioCosto || 0), 0);
        return {
          title:
            exportQuery.tipoItem === 'todos'
              ? 'Reporte de Catálogo e Inventario General'
              : 'Reporte de Inventario Físico y Valoración de Almacén',
          dateRangeLabel: result.dateRangeLabel,
          columns,
          data: result.data,
          kpis: result.kpis,
          totals: { valorInventarioCosto: valorTotalCosto },
        };
      }

      case 'technicians':
      case 'techs': {
        const result = await this.reportsService.getTechniciansReport(exportQuery);
        const columns: ReportColumnDefinition[] = [
          { header: 'Técnico', key: 'nombre', width: 24 },
          { header: 'Correo', key: 'email', width: 24 },
          { header: 'En Taller Activo', key: 'cargaActivaTaller', width: 16, type: 'number', align: 'right' },
          { header: 'Completadas Período', key: 'completadasPeriodo', width: 18, type: 'number', align: 'right' },
          { header: 'Intervenciones', key: 'actividadesRegistradas', width: 16, type: 'number', align: 'right' },
          { header: 'Atrasadas', key: 'ordenesAtrasadas', width: 14, type: 'number', align: 'right' },
        ];
        return {
          title: 'Reporte de Productividad y Carga de Trabajo por Técnico',
          dateRangeLabel: result.dateRangeLabel,
          columns,
          data: result.technicians,
          kpis: result.kpis,
        };
      }

      case 'recurring_clients':
      case 'recurring-clients':
      case 'clients': {
        const result = await this.reportsService.getRecurringClientsReport(exportQuery);
        const columns: ReportColumnDefinition[] = [
          { header: 'Cliente', key: 'nombre', width: 26 },
          { header: 'Cédula / RUC', key: 'identificacion', width: 16 },
          { header: 'Teléfono', key: 'telefono', width: 16 },
          { header: 'Servicios Recibidos', key: 'totalOrdenes', width: 16, type: 'number', align: 'right' },
          { header: 'Última Visita', key: 'ultimoIngreso', width: 14, type: 'date' },
        ];
        return {
          title: 'Reporte de Clientes y Equipos Recurrentes',
          dateRangeLabel: result.dateRangeLabel,
          columns,
          data: result.recurringClients,
          kpis: result.kpis,
        };
      }

      case 'purchases': {
        const result = await this.reportsService.getPurchasesReport(exportQuery);
        const columns: ReportColumnDefinition[] = [
          { header: 'N° Factura', key: 'numeroFactura', width: 18 },
          { header: 'Fecha', key: 'fecha', width: 14, type: 'date' },
          { header: 'Proveedor', key: 'proveedor', width: 24 },
          { header: 'RUC Proveedor', key: 'proveedorRuc', width: 16 },
          { header: 'Subtotal', key: 'subtotal', width: 14, type: 'currency', align: 'right' },
          { header: 'IVA', key: 'ivaMonto', width: 12, type: 'currency', align: 'right' },
          { header: 'Total', key: 'total', width: 14, type: 'currency', align: 'right' },
          { header: 'Estado', key: 'estado', width: 14, align: 'center' },
        ];
        const totalCompras = result.data.reduce((acc, row) => acc + (row.total || 0), 0);
        return {
          title: 'Reporte de Compras a Proveedores',
          dateRangeLabel: result.dateRangeLabel,
          columns,
          data: result.data,
          kpis: result.kpis,
          totals: { total: totalCompras },
        };
      }

      default:
        throw new BadRequestException(`Tipo de reporte no soportado: ${type}`);
    }
  }
}
