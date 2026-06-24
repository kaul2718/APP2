import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Presupuesto } from 'src/presupuesto/entities/presupuesto.entity';
import { Parte } from 'src/parte/entities/parte.entity';
import { Compra } from 'src/compra/entities/compra.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Presupuesto)
    private readonly presupuestoRepository: Repository<Presupuesto>,
    @InjectRepository(Parte)
    private readonly parteRepository: Repository<Parte>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Compra)
    private readonly compraRepository: Repository<Compra>,
  ) {}

  private getDateRange(range?: string, startDate?: string, endDate?: string): { from: Date, to: Date } {
    const to = new Date();
    let from = new Date();

    if (startDate) {
      from = new Date(startDate);
    } else if (range) {
      const days = range === '7d' ? 7 : range === '90d' ? 90 : range === 'all' ? 3650 : 30;
      from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    } else {
      from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return { from, to: end };
    }

    return { from, to };
  }

  async getDashboardStats(range?: string, startDate?: string, endDate?: string) {
    const { from, to } = this.getDateRange(range, startDate, endDate);

    const [ordersCount, budgetsCount, purchasesCount, activeClients] = await Promise.all([
      this.orderRepository.createQueryBuilder('o').where('o.deletedAt IS NULL AND o.createdAt >= :from AND o.createdAt <= :to', { from, to }).getCount(),
      this.presupuestoRepository.createQueryBuilder('p').where('p.deletedAt IS NULL AND p.createdAt >= :from AND p.createdAt <= :to', { from, to }).getCount(),
      this.compraRepository.createQueryBuilder('c').where('c.createdAt >= :from AND c.createdAt <= :to', { from, to }).getCount(),
      this.orderRepository.createQueryBuilder('o').select('DISTINCT o.clientId').where('o.deletedAt IS NULL AND o.createdAt >= :from AND o.createdAt <= :to', { from, to }).getRawMany(),
    ]);

    // Calcular montos totales
    const budgetTotalRaw = await this.presupuestoRepository.createQueryBuilder('p')
      .leftJoin('p.detallesPresupuestoItems', 'd')
      .select('SUM(d.subtotal)', 'total')
      .where('p.deletedAt IS NULL AND p.createdAt >= :from AND p.createdAt <= :to', { from, to })
      .getRawOne();

    const purchasesTotalRaw = await this.compraRepository.createQueryBuilder('c')
      .select('SUM(c.total)', 'total')
      .where('c.createdAt >= :from AND c.createdAt <= :to', { from, to })
      .getRawOne();

    const revenue = parseFloat(budgetTotalRaw?.total || '0');
    const expenses = parseFloat(purchasesTotalRaw?.total || '0');
    const netProfit = revenue - expenses;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      ordersCount,
      budgetsCount,
      purchasesCount,
      clientsCount: activeClients.length,
      revenue,
      expenses,
      netProfit,
      profitMargin,
    };
  }

  async getClientsReport(range?: string, startDate?: string, endDate?: string, segment?: string) {
    const { from, to } = this.getDateRange(range, startDate, endDate);

    const qb = this.orderRepository.createQueryBuilder('o')
      .leftJoin('o.client', 'c')
      .select('c.id', 'id')
      .addSelect('c.nombre', 'nombre')
      .addSelect('c.apellido', 'apellido')
      .addSelect('c.correo', 'correo')
      .addSelect('c.telefono', 'telefono')
      .addSelect('COUNT(o.id)', 'ordersCount')
      .where('o.deletedAt IS NULL')
      .groupBy('c.id')
      .addGroupBy('c.nombre')
      .addGroupBy('c.apellido')
      .addGroupBy('c.correo')
      .addGroupBy('c.telefono');

    if (segment === 'inactive') {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      qb.having('MAX(o.createdAt) < :ninetyDaysAgo', { ninetyDaysAgo });
    } else {
      qb.andWhere('o.createdAt >= :from AND o.createdAt <= :to', { from, to });
      if (segment === 'frequent') {
        qb.having('COUNT(o.id) >= 3');
      }
    }

    const clientsRaw = await qb.orderBy('COUNT(o.id)', 'DESC').getRawMany();

    return clientsRaw.map(c => ({
      id: c.id,
      nombreCompleto: `${c.nombre || ''} ${c.apellido || ''}`.trim(),
      correo: c.correo,
      telefono: c.telefono,
      ordersCount: parseInt(c.ordersCount || '0'),
    }));
  }

  async getInventoryReport(categoryId?: number, rotation?: string, stockStatus?: string) {
    const qb = this.parteRepository.createQueryBuilder('p')
      .leftJoinAndSelect('p.categoria', 'cat')
      .where('p.deletedAt IS NULL')
      .andWhere('LOWER(cat.nombre) NOT IN (:...serviciosCats)', { serviciosCats: ['servicio', 'servicios'] });

    if (categoryId) {
      qb.andWhere('p.categoriaId = :categoryId', { categoryId });
    }

    if (stockStatus === 'low') {
      qb.andWhere('p.stock <= p.stockMinimo');
    } else if (stockStatus === 'normal') {
      qb.andWhere('p.stock > p.stockMinimo');
    }

    if (rotation === 'low') {
      // Artículos de baja rotación (no han sido utilizados en ningún presupuesto/orden)
      const subQuery = this.presupuestoRepository.manager.createQueryBuilder()
        .select('DISTINCT dr.parteId')
        .from('detalle_repuestos', 'dr')
        .where('dr.parteId IS NOT NULL');
      
      qb.andWhere(`p.id NOT IN (${subQuery.getQuery()})`);
    } else if (rotation === 'high') {
      // Artículos de alta rotación (los más utilizados)
      qb.leftJoin('detalle_repuestos', 'dr', 'dr.parteId = p.id')
        .groupBy('p.id')
        .addGroupBy('cat.id')
        .orderBy('COUNT(dr.id)', 'DESC');
    } else {
      qb.orderBy('p.stock', 'ASC');
    }

    const parts = await qb.getMany();

    return parts.map(p => ({
      id: p.id,
      codigo: p.codigoInterno || 'N/A',
      nombre: p.nombre,
      categoria: p.categoria?.nombre || 'General',
      stock: parseFloat(p.stock as any || 0),
      stockMinimo: parseFloat(p.stockMinimo as any || 0),
      precio: parseFloat(p.precio1 as any || 0),
      activo: p.estado,
    }));
  }

  async getPurchasesReport(range?: string, startDate?: string, endDate?: string, estado?: string, minTotal?: number, maxTotal?: number) {
    const { from, to } = this.getDateRange(range, startDate, endDate);

    const qb = this.compraRepository.createQueryBuilder('c')
      .leftJoinAndSelect('c.proveedor', 'p')
      .leftJoinAndSelect('c.usuario', 'u')
      .where('c.createdAt >= :from AND c.createdAt <= :to', { from, to });

    if (estado) {
      qb.andWhere('LOWER(c.estado) = LOWER(:estado)', { estado });
    }
    if (minTotal !== undefined) {
      qb.andWhere('c.total >= :minTotal', { minTotal });
    }
    if (maxTotal !== undefined) {
      qb.andWhere('c.total <= :maxTotal', { maxTotal });
    }

    const purchases = await qb.orderBy('c.fecha', 'DESC').getMany();

    return purchases.map(c => ({
      id: c.id,
      numeroFactura: c.numeroFactura,
      fecha: c.fecha,
      total: parseFloat(c.total as any || 0),
      proveedor: c.proveedor?.nombre || 'Desconocido',
      comprador: `${c.usuario?.nombre || ''} ${c.usuario?.apellido || ''}`.trim(),
      estado: c.estado,
    }));
  }

  async getBudgetsEstados(): Promise<string[]> {
    const raw = await this.presupuestoRepository.createQueryBuilder('p')
      .leftJoin('p.estado', 'est')
      .select('DISTINCT est.nombre', 'nombre')
      .where('p.deletedAt IS NULL AND est.nombre IS NOT NULL')
      .getRawMany();
    return raw.map(r => r.nombre).filter(Boolean);
  }

  async getBudgetsReport(range?: string, startDate?: string, endDate?: string, estado?: string, sortBy?: string) {
    const { from, to } = this.getDateRange(range, startDate, endDate);

    const qb = this.presupuestoRepository.createQueryBuilder('p')
      .leftJoinAndSelect('p.estado', 'est')
      .leftJoinAndSelect('p.orden', 'ord')
      .leftJoin('ord.client', 'cli')
      .select([
        'p.id', 'p.fechaEmision', 'p.descripcion', 'p.estadoId',
        'est.nombre', 'ord.id', 'ord.workOrderNumber', 'cli.nombre', 'cli.apellido'
      ])
      .where('p.deletedAt IS NULL AND p.createdAt >= :from AND p.createdAt <= :to', { from, to });

    if (estado) {
      qb.andWhere('LOWER(est.nombre) = LOWER(:estado)', { estado });
    }

    if (sortBy === 'total_asc' || sortBy === 'total_desc') {
      // For total sorting we'll sort after computing; use createdAt default here
      qb.orderBy('p.createdAt', 'DESC');
    } else {
      qb.orderBy('p.createdAt', 'DESC');
    }

    const budgets = await qb.getMany();

    const result = [];
    for (const b of budgets) {
      const detailsSum = await this.presupuestoRepository.createQueryBuilder('p')
        .leftJoin('p.detallesPresupuestoItems', 'd')
        .select('SUM(d.subtotal)', 'total')
        .where('p.id = :id', { id: b.id })
        .getRawOne();

      result.push({
        id: b.id,
        fecha: b.fechaEmision,
        descripcion: b.descripcion,
        estado: b.estado?.nombre || 'Pendiente',
        orden: b.orden ? `#${b.orden.workOrderNumber}` : 'Sin Orden',
        cliente: b.orden?.client ? `${b.orden.client.nombre || ''} ${b.orden.client.apellido || ''}`.trim() : 'N/A',
        total: parseFloat(detailsSum?.total || '0'),
      });
    }

    if (sortBy === 'total_desc') result.sort((a, b) => b.total - a.total);
    if (sortBy === 'total_asc') result.sort((a, b) => a.total - b.total);

    return result;
  }

  async getOrdersEstados(): Promise<string[]> {
    const raw = await this.orderRepository.createQueryBuilder('o')
      .leftJoin('o.estadoOrden', 'e')
      .select('DISTINCT e.nombre', 'nombre')
      .where('o.deletedAt IS NULL AND e.nombre IS NOT NULL')
      .getRawMany();
    return raw.map(r => r.nombre).filter(Boolean);
  }

  async getOrdersReport(range?: string, startDate?: string, endDate?: string, estado?: string, technicianId?: number) {
    const { from, to } = this.getDateRange(range, startDate, endDate);

    const qb = this.orderRepository.createQueryBuilder('o')
      .leftJoinAndSelect('o.client', 'c')
      .leftJoinAndSelect('o.technician', 't')
      .leftJoinAndSelect('o.estadoOrden', 'e')
      .where('o.deletedAt IS NULL AND o.createdAt >= :from AND o.createdAt <= :to', { from, to });

    if (estado) {
      qb.andWhere('LOWER(e.nombre) = LOWER(:estado)', { estado });
    }
    if (technicianId) {
      qb.andWhere('o.technicianId = :technicianId', { technicianId });
    }

    const orders = await qb.orderBy('o.createdAt', 'DESC').getMany();

    return orders.map(o => ({
      id: o.id,
      workOrderNumber: o.workOrderNumber,
      cliente: `${o.client?.nombre || ''} ${o.client?.apellido || ''}`.trim(),
      tecnico: o.technician ? `${o.technician.nombre || ''} ${o.technician.apellido || ''}`.trim() : 'Sin asignar',
      estado: o.estadoOrden?.nombre || 'Pendiente',
      fechaIngreso: o.createdAt,
      fechaPrometida: o.fechaPrometidaEntrega,
    }));
  }

  async getTechniciansList() {
    const techs = await this.orderRepository.createQueryBuilder('o')
      .leftJoin('o.technician', 't')
      .select('t.id', 'id')
      .addSelect('t.nombre', 'nombre')
      .addSelect('t.apellido', 'apellido')
      .where('t.id IS NOT NULL')
      .groupBy('t.id')
      .getRawMany();

    return techs.map(t => ({
      id: t.id,
      nombreCompleto: `${t.nombre || ''} ${t.apellido || ''}`.trim(),
    }));
  }

  async getTechniciansReport(range?: string, startDate?: string, endDate?: string, technicianId?: number, sortBy?: string, minOrders?: number) {
    const { from, to } = this.getDateRange(range, startDate, endDate);

    if (technicianId) {
      // ─── Detailed Report for a Single Technician ──────────────────────────────
      const orders = await this.orderRepository.createQueryBuilder('o')
        .leftJoinAndSelect('o.client', 'c')
        .leftJoinAndSelect('o.estadoOrden', 'e')
        .where('o.technicianId = :technicianId AND o.deletedAt IS NULL AND o.createdAt >= :from AND o.createdAt <= :to', { technicianId, from, to })
        .orderBy('o.createdAt', 'DESC')
        .getMany();

      const details = [];
      for (const o of orders) {
        const servicesRaw = await this.presupuestoRepository.createQueryBuilder('p')
          .leftJoin('p.detallesPresupuestoItems', 'd')
          .select('SUM(d.subtotal)', 'total')
          .where('p.ordenId = :orderId AND p.deletedAt IS NULL', { orderId: o.id })
          .andWhere('d.parteId IS NULL')
          .getRawOne();

        const partsRaw = await this.presupuestoRepository.createQueryBuilder('p')
          .leftJoin('p.detallesPresupuestoItems', 'd')
          .select('SUM(d.subtotal)', 'total')
          .where('p.ordenId = :orderId AND p.deletedAt IS NULL', { orderId: o.id })
          .andWhere('d.parteId IS NOT NULL')
          .getRawOne();

        const servicesVal = parseFloat(servicesRaw?.total || '0');
        const partsVal = parseFloat(partsRaw?.total || '0');

        details.push({
          id: o.id,
          workOrderNumber: o.workOrderNumber,
          cliente: `${o.client?.nombre || ''} ${o.client?.apellido || ''}`.trim(),
          estado: o.estadoOrden?.nombre || 'Pendiente',
          fechaIngreso: o.createdAt,
          servicesGenerated: servicesVal,
          partsGenerated: partsVal,
          moneyGenerated: servicesVal + partsVal,
        });
      }
      return { isDetail: true, orders: details };
    }

    // ─── Summary Report of All Technicians ────────────────────────────────────
    const summaryQb = this.orderRepository.createQueryBuilder('o')
      .leftJoin('o.technician', 't')
      .select('t.id', 'id')
      .addSelect('t.nombre', 'nombre')
      .addSelect('t.apellido', 'apellido')
      .addSelect('COUNT(o.id)', 'totalAssigned')
      .where('o.deletedAt IS NULL AND o.createdAt >= :from AND o.createdAt <= :to', { from, to })
      .andWhere('t.id IS NOT NULL')
      .groupBy('t.id');

    if (minOrders && minOrders > 0) {
      summaryQb.having('COUNT(o.id) >= :minOrders', { minOrders });
    }

    const techsRaw = await summaryQb.getRawMany();

    const result = [];
    for (const t of techsRaw) {
      const servicesRaw = await this.presupuestoRepository.createQueryBuilder('p')
        .leftJoin('p.orden', 'o')
        .leftJoin('p.detallesPresupuestoItems', 'd')
        .select('SUM(d.subtotal)', 'total')
        .where('o.technicianId = :techId AND p.deletedAt IS NULL AND o.createdAt >= :from AND o.createdAt <= :to', { techId: t.id, from, to })
        .andWhere('d.parteId IS NULL')
        .getRawOne();

      const partsRaw = await this.presupuestoRepository.createQueryBuilder('p')
        .leftJoin('p.orden', 'o')
        .leftJoin('p.detallesPresupuestoItems', 'd')
        .select('SUM(d.subtotal)', 'total')
        .where('o.technicianId = :techId AND p.deletedAt IS NULL AND o.createdAt >= :from AND o.createdAt <= :to', { techId: t.id, from, to })
        .andWhere('d.parteId IS NOT NULL')
        .getRawOne();

      const servicesVal = parseFloat(servicesRaw?.total || '0');
      const partsVal = parseFloat(partsRaw?.total || '0');

      result.push({
        id: t.id,
        nombreCompleto: `${t.nombre || ''} ${t.apellido || ''}`.trim(),
        totalAssigned: parseInt(t.totalAssigned || '0'),
        servicesGenerated: servicesVal,
        partsGenerated: partsVal,
        moneyGenerated: servicesVal + partsVal,
      });
    }

    // Sort in-memory after financials computed
    if (sortBy === 'total_desc') result.sort((a, b) => b.moneyGenerated - a.moneyGenerated);
    else if (sortBy === 'total_asc') result.sort((a, b) => a.moneyGenerated - b.moneyGenerated);
    else if (sortBy === 'orders_desc') result.sort((a, b) => b.totalAssigned - a.totalAssigned);
    else if (sortBy === 'orders_asc') result.sort((a, b) => a.totalAssigned - b.totalAssigned);

    return { isDetail: false, technicians: result };
  }

  async getEquipmentReport(range?: string, startDate?: string, endDate?: string, sortBy?: string, minCount?: number) {
    const { from, to } = this.getDateRange(range, startDate, endDate);

    const sortOrder = sortBy === 'count_asc' ? 'ASC' : 'DESC';

    const equipmentRaw = await this.orderRepository.createQueryBuilder('o')
      .leftJoin('o.equipo', 'eq')
      .leftJoin('eq.marca', 'm')
      .select('m.nombre', 'brand')
      .addSelect('COUNT(o.id)', 'count')
      .where('o.deletedAt IS NULL AND o.createdAt >= :from AND o.createdAt <= :to', { from, to })
      .andWhere('m.nombre IS NOT NULL AND m.nombre != :empty', { empty: '' })
      .groupBy('m.nombre')
      .orderBy('COUNT(o.id)', sortOrder)
      .getRawMany();

    const mapped = equipmentRaw.map(eq => ({
      brand: eq.brand,
      count: parseInt(eq.count || '0'),
    }));

    return minCount && minCount > 0
      ? mapped.filter(eq => eq.count >= minCount)
      : mapped;
  }
}
