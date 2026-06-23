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

    return {
      ordersCount,
      budgetsCount,
      purchasesCount,
      clientsCount: activeClients.length,
      revenue: parseFloat(budgetTotalRaw?.total || '0'),
      expenses: parseFloat(purchasesTotalRaw?.total || '0'),
    };
  }

  async getClientsReport(range?: string, startDate?: string, endDate?: string) {
    const { from, to } = this.getDateRange(range, startDate, endDate);

    const clientsRaw = await this.orderRepository.createQueryBuilder('o')
      .leftJoin('o.client', 'c')
      .select('c.id', 'id')
      .addSelect('c.nombre', 'nombre')
      .addSelect('c.apellido', 'apellido')
      .addSelect('c.correo', 'correo')
      .addSelect('c.telefono', 'telefono')
      .addSelect('COUNT(o.id)', 'ordersCount')
      .where('o.deletedAt IS NULL AND o.createdAt >= :from AND o.createdAt <= :to', { from, to })
      .groupBy('c.id')
      .orderBy('COUNT(o.id)', 'DESC')
      .getRawMany();

    return clientsRaw.map(c => ({
      id: c.id,
      nombreCompleto: `${c.nombre || ''} ${c.apellido || ''}`.trim(),
      correo: c.correo,
      telefono: c.telefono,
      ordersCount: parseInt(c.ordersCount || '0'),
    }));
  }

  async getInventoryReport() {
    const parts = await this.parteRepository.createQueryBuilder('p')
      .leftJoinAndSelect('p.categoria', 'cat')
      .where('p.deletedAt IS NULL')
      .orderBy('p.stock', 'ASC')
      .getMany();

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

  async getPurchasesReport(range?: string, startDate?: string, endDate?: string) {
    const { from, to } = this.getDateRange(range, startDate, endDate);

    const purchases = await this.compraRepository.createQueryBuilder('c')
      .leftJoinAndSelect('c.proveedor', 'p')
      .leftJoinAndSelect('c.usuario', 'u')
      .where('c.createdAt >= :from AND c.createdAt <= :to', { from, to })
      .orderBy('c.fecha', 'DESC')
      .getMany();

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

  async getBudgetsReport(range?: string, startDate?: string, endDate?: string) {
    const { from, to } = this.getDateRange(range, startDate, endDate);

    const budgets = await this.presupuestoRepository.createQueryBuilder('p')
      .leftJoinAndSelect('p.estado', 'est')
      .leftJoinAndSelect('p.orden', 'ord')
      .leftJoin('ord.client', 'cli')
      .select([
        'p.id', 'p.fechaEmision', 'p.descripcion', 'p.estadoId',
        'est.nombre', 'ord.id', 'ord.workOrderNumber', 'cli.nombre', 'cli.apellido'
      ])
      .where('p.deletedAt IS NULL AND p.createdAt >= :from AND p.createdAt <= :to', { from, to })
      .orderBy('p.createdAt', 'DESC')
      .getMany();

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

    return result;
  }

  async getOrdersReport(range?: string, startDate?: string, endDate?: string) {
    const { from, to } = this.getDateRange(range, startDate, endDate);

    const orders = await this.orderRepository.createQueryBuilder('o')
      .leftJoinAndSelect('o.client', 'c')
      .leftJoinAndSelect('o.technician', 't')
      .leftJoinAndSelect('o.estadoOrden', 'e')
      .where('o.deletedAt IS NULL AND o.createdAt >= :from AND o.createdAt <= :to', { from, to })
      .orderBy('o.createdAt', 'DESC')
      .getMany();

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

  async getTechniciansReport(range?: string, startDate?: string, endDate?: string, technicianId?: number) {
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
        // Query services/labor subtotal (parteId IS NULL)
        const servicesRaw = await this.presupuestoRepository.createQueryBuilder('p')
          .leftJoin('p.detallesPresupuestoItems', 'd')
          .select('SUM(d.subtotal)', 'total')
          .where('p.ordenId = :orderId AND p.deletedAt IS NULL', { orderId: o.id })
          .andWhere('d.parteId IS NULL')
          .getRawOne();

        // Query parts subtotal (parteId IS NOT NULL)
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
      return {
        isDetail: true,
        orders: details,
      };
    }

    // ─── Summary Report of All Technicians ────────────────────────────────────
    const techsRaw = await this.orderRepository.createQueryBuilder('o')
      .leftJoin('o.technician', 't')
      .select('t.id', 'id')
      .addSelect('t.nombre', 'nombre')
      .addSelect('t.apellido', 'apellido')
      .addSelect('COUNT(o.id)', 'totalAssigned')
      .where('o.deletedAt IS NULL AND o.createdAt >= :from AND o.createdAt <= :to', { from, to })
      .andWhere('t.id IS NOT NULL')
      .groupBy('t.id')
      .getRawMany();

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

    return {
      isDetail: false,
      technicians: result,
    };
  }

  async getEquipmentReport(range?: string, startDate?: string, endDate?: string) {
    const { from, to } = this.getDateRange(range, startDate, endDate);

    const equipmentRaw = await this.orderRepository.createQueryBuilder('o')
      .leftJoin('o.equipo', 'eq')
      .leftJoin('eq.marca', 'm')
      .select('m.nombre', 'brand')
      .addSelect('COUNT(o.id)', 'count')
      .where('o.deletedAt IS NULL AND o.createdAt >= :from AND o.createdAt <= :to', { from, to })
      .andWhere('m.nombre IS NOT NULL AND m.nombre != :empty', { empty: '' })
      .groupBy('m.nombre')
      .orderBy('COUNT(o.id)', 'DESC')
      .getRawMany();

    return equipmentRaw.map(eq => ({
      brand: eq.brand,
      count: parseInt(eq.count || '0'),
    }));
  }
}
