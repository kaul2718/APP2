import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Presupuesto } from 'src/presupuesto/entities/presupuesto.entity';
import { Notificacion } from 'src/notificacion/entities/notificacion.entity';
import { Inventario } from 'src/inventario/entities/inventario.entity';
import { ActividadTecnica } from 'src/actividad-tecnica/entities/actividad-tecnica.entity';
import {
  DashboardAlert,
  DashboardChart,
  DashboardRecentItem,
  DashboardResponse,
  DashboardRole,
} from './interfaces/dashboard-response.interface';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Presupuesto)
    private readonly presupuestoRepository: Repository<Presupuesto>,
    @InjectRepository(Notificacion)
    private readonly notificacionRepository: Repository<Notificacion>,
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    @InjectRepository(ActividadTecnica)
    private readonly actividadRepository: Repository<ActividadTecnica>,
  ) {}

  async getDashboardForUser(user: User, range = '30d'): Promise<DashboardResponse> {
    const role = this.resolveRole(user);

    switch (role) {
      case 'admin':
        return this.getAdminDashboard(range);
      case 'tech':
        return this.getTechDashboard(user.id, range);
      case 'recep':
        return this.getRecepDashboard(user.id, range);
      case 'client':
      default:
        return this.getClientDashboard(user.id, range);
    }
  }

  async getAdminDashboard(range = '30d'): Promise<DashboardResponse> {
    const from = this.getRangeStart(range);
    const now = new Date();

    const [
      totalOrders,
      activeOrders,
      pendingBudgets,
      delayedOrders,
      unreadNotifications,
      lowStockCount,
      recent,
      chart,
    ] = await Promise.all([
      this.countOrders({}, from),
      this.countOrders({ statusOnlyActive: true }, from),
      this.countPendingBudgets({}, from),
      this.countDelayedOrders(),
      this.countUnreadNotifications(),
      this.countLowStock(),
      this.getRecentOrders({}, 8),
      this.getOrderStatusChart({}, from),
    ]);

    const alerts: DashboardAlert[] = [];

    if (lowStockCount > 0) {
      alerts.push({
        id: 'low-stock',
        message: `Hay ${lowStockCount} ítems de inventario por debajo del stock mínimo.`,
        severity: 'warning',
      });
    }

    if (delayedOrders > 0) {
      alerts.push({
        id: 'delayed-orders',
        message: `Existen ${delayedOrders} órdenes con fecha prometida vencida.`,
        severity: 'error',
      });
    }

    return {
      role: 'admin',
      range,
      generatedAt: now.toISOString(),
      kpis: [
        { key: 'total-orders', label: 'Órdenes totales', value: totalOrders },
        { key: 'active-orders', label: 'Órdenes activas', value: activeOrders },
        { key: 'pending-budgets', label: 'Presupuestos pendientes', value: pendingBudgets },
        { key: 'unread-notifications', label: 'Notificaciones sin leer', value: unreadNotifications },
      ],
      charts: [chart],
      recent,
      alerts,
    };
  }

  async getTechDashboard(userId: number, range = '30d'): Promise<DashboardResponse> {
    const from = this.getRangeStart(range);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const [
      assignedOrders,
      inProgressOrders,
      dueToday,
      activitiesToday,
      unreadNotifications,
      pendingBudgets,
      recent,
      chart,
    ] = await Promise.all([
      this.countOrders({ technicianId: userId }, from),
      this.countOrders({ technicianId: userId, statusOnlyActive: true }, from),
      this.countDueTodayOrders(userId, startOfDay, endOfDay),
      this.countActivitiesForTech(userId, startOfDay, endOfDay),
      this.countUnreadNotifications(userId),
      this.countPendingBudgets({ technicianId: userId }, from),
      this.getRecentOrders({ technicianId: userId }, 8),
      this.getOrderStatusChart({ technicianId: userId }, from),
    ]);

    return {
      role: 'tech',
      range,
      generatedAt: now.toISOString(),
      kpis: [
        { key: 'assigned-orders', label: 'Órdenes asignadas', value: assignedOrders },
        { key: 'in-progress-orders', label: 'Órdenes activas', value: inProgressOrders },
        { key: 'due-today', label: 'Entregas de hoy', value: dueToday },
        { key: 'activities-today', label: 'Actividades de hoy', value: activitiesToday },
      ],
      charts: [chart],
      recent,
      alerts: [
        {
          id: 'tech-unread-notifications',
          message: `Tienes ${unreadNotifications} notificaciones sin leer.`,
          severity: unreadNotifications > 0 ? 'info' : 'success',
        },
        {
          id: 'tech-pending-budgets',
          message: `Hay ${pendingBudgets} presupuestos pendientes en tus órdenes.`,
          severity: pendingBudgets > 0 ? 'warning' : 'success',
        },
      ],
    };
  }

  async getRecepDashboard(userId: number, range = '30d'): Promise<DashboardResponse> {
    const from = this.getRangeStart(range);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const [
      ordersCreated,
      ordersCreatedToday,
      pendingAssignment,
      unreadNotifications,
      pendingBudgets,
      recent,
      chart,
    ] = await Promise.all([
      this.countOrders({ recepcionistaId: userId }, from),
      this.countOrdersCreatedTodayByRecep(userId, startOfDay, endOfDay),
      this.countOrdersPendingTechAssignment(userId),
      this.countUnreadNotifications(userId),
      this.countPendingBudgets({ recepcionistaId: userId }, from),
      this.getRecentOrders({ recepcionistaId: userId }, 8),
      this.getOrderStatusChart({ recepcionistaId: userId }, from),
    ]);

    return {
      role: 'recep',
      range,
      generatedAt: now.toISOString(),
      kpis: [
        { key: 'orders-created', label: 'Órdenes registradas', value: ordersCreated },
        { key: 'orders-created-today', label: 'Órdenes registradas hoy', value: ordersCreatedToday },
        { key: 'pending-assignment', label: 'Pendientes de técnico', value: pendingAssignment },
        { key: 'pending-budgets', label: 'Presupuestos pendientes', value: pendingBudgets },
      ],
      charts: [chart],
      recent,
      alerts: [
        {
          id: 'recep-unread-notifications',
          message: `Tienes ${unreadNotifications} notificaciones sin leer.`,
          severity: unreadNotifications > 0 ? 'info' : 'success',
        },
      ],
    };
  }

  async getClientDashboard(userId: number, range = '30d'): Promise<DashboardResponse> {
    const from = this.getRangeStart(range);
    const now = new Date();

    const [
      myOrders,
      myActiveOrders,
      pendingBudgets,
      unreadNotifications,
      recent,
      chart,
    ] = await Promise.all([
      this.countOrders({ clientId: userId }, from),
      this.countOrders({ clientId: userId, statusOnlyActive: true }, from),
      this.countPendingBudgets({ clientId: userId }, from),
      this.countUnreadNotifications(userId),
      this.getRecentOrders({ clientId: userId }, 8),
      this.getOrderStatusChart({ clientId: userId }, from),
    ]);

    return {
      role: 'client',
      range,
      generatedAt: now.toISOString(),
      kpis: [
        { key: 'my-orders', label: 'Mis órdenes', value: myOrders },
        { key: 'my-active-orders', label: 'Órdenes activas', value: myActiveOrders },
        { key: 'pending-budgets', label: 'Presupuestos pendientes', value: pendingBudgets },
        { key: 'unread-notifications', label: 'Notificaciones sin leer', value: unreadNotifications },
      ],
      charts: [chart],
      recent,
      alerts: [
        {
          id: 'client-notifications',
          message: unreadNotifications > 0
            ? `Tienes ${unreadNotifications} notificaciones sin leer.`
            : 'No tienes notificaciones pendientes.',
          severity: unreadNotifications > 0 ? 'info' : 'success',
        },
      ],
    };
  }

  private resolveRole(user: User): DashboardRole {
    const userRoles = (user.userRoles || []).map((ur) => ur.rol?.slug).filter(Boolean) as DashboardRole[];

    if (userRoles.includes('admin')) {
      return 'admin';
    }

    if (userRoles.includes('tech')) {
      return 'tech';
    }

    if (userRoles.includes('recep')) {
      return 'recep';
    }

    return 'client';
  }

  private getRangeStart(range: string): Date {
    const now = new Date();

    if (range === '7d') {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    if (range === '90d') {
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  private async countOrders(
    filters: { clientId?: number; technicianId?: number; recepcionistaId?: number; statusOnlyActive?: boolean },
    createdFrom?: Date,
  ): Promise<number> {
    const qb = this.orderRepository.createQueryBuilder('o');

    qb.where('o.deletedAt IS NULL');

    if (filters.clientId) {
      qb.andWhere('o.clientId = :clientId', { clientId: filters.clientId });
    }

    if (filters.technicianId) {
      qb.andWhere('o.technicianId = :technicianId', { technicianId: filters.technicianId });
    }

    if (filters.recepcionistaId) {
      qb.andWhere('o.recepcionistaId = :recepcionistaId', { recepcionistaId: filters.recepcionistaId });
    }

    if (filters.statusOnlyActive) {
      qb.andWhere('o.estado = true');
    }

    if (createdFrom) {
      qb.andWhere('o.createdAt >= :createdFrom', { createdFrom });
    }

    return qb.getCount();
  }

  private async countPendingBudgets(
    filters: { clientId?: number; technicianId?: number; recepcionistaId?: number },
    createdFrom?: Date,
  ): Promise<number> {
    const qb = this.presupuestoRepository
      .createQueryBuilder('p')
      .leftJoin('p.estado', 'estado')
      .leftJoin('p.orden', 'orden')
      .where('p.deletedAt IS NULL')
      .andWhere('LOWER(estado.nombre) LIKE :pending', { pending: '%pend%' });

    if (filters.clientId) {
      qb.andWhere('orden.clientId = :clientId', { clientId: filters.clientId });
    }

    if (filters.technicianId) {
      qb.andWhere('orden.technicianId = :technicianId', { technicianId: filters.technicianId });
    }

    if (filters.recepcionistaId) {
      qb.andWhere('orden.recepcionistaId = :recepcionistaId', { recepcionistaId: filters.recepcionistaId });
    }

    if (createdFrom) {
      qb.andWhere('p.createdAt >= :createdFrom', { createdFrom });
    }

    return qb.getCount();
  }

  private async countDelayedOrders(): Promise<number> {
    const now = new Date();

    return this.orderRepository
      .createQueryBuilder('o')
      .where('o.deletedAt IS NULL')
      .andWhere('o.fechaPrometidaEntrega IS NOT NULL')
      .andWhere('o.fechaPrometidaEntrega < :now', { now })
      .andWhere('o.estado = true')
      .getCount();
  }

  private async countUnreadNotifications(userId?: number): Promise<number> {
    const qb = this.notificacionRepository
      .createQueryBuilder('n')
      .where('n.isDeleted = false')
      .andWhere('n.leido = false')
      .andWhere('n.deletedAt IS NULL');

    if (userId) {
      qb.andWhere('n.usuarioId = :userId', { userId });
    }

    return qb.getCount();
  }

  private async countLowStock(): Promise<number> {
    return this.inventarioRepository
      .createQueryBuilder('i')
      .where('i.deletedAt IS NULL')
      .andWhere('i.estado = true')
      .andWhere('i.cantidad <= i.stockMinimo')
      .getCount();
  }

  private async getRecentOrders(
    filters: { clientId?: number; technicianId?: number; recepcionistaId?: number },
    limit = 8,
  ): Promise<DashboardRecentItem[]> {
    const qb = this.orderRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.client', 'client')
      .leftJoinAndSelect('o.technician', 'technician')
      .leftJoinAndSelect('o.estadoOrden', 'estadoOrden')
      .where('o.deletedAt IS NULL');

    if (filters.clientId) {
      qb.andWhere('o.clientId = :clientId', { clientId: filters.clientId });
    }

    if (filters.technicianId) {
      qb.andWhere('o.technicianId = :technicianId', { technicianId: filters.technicianId });
    }

    if (filters.recepcionistaId) {
      qb.andWhere('o.recepcionistaId = :recepcionistaId', { recepcionistaId: filters.recepcionistaId });
    }

    const orders = await qb
      .orderBy('o.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return orders.map((order) => {
      const clientName = `${order.client?.nombre || ''} ${order.client?.apellido || ''}`.trim();
      const techName = `${order.technician?.nombre || ''} ${order.technician?.apellido || ''}`.trim();

      return {
        id: order.id,
        title: `Orden #${order.workOrderNumber}`,
        subtitle: `${clientName || 'Cliente no disponible'}${techName ? ` · Técnico: ${techName}` : ''}`,
        status: order.estadoOrden?.nombre || 'Sin estado',
        createdAt: order.createdAt,
        path: '/ver-orden',
      };
    });
  }

  private async getOrderStatusChart(
    filters: { clientId?: number; technicianId?: number; recepcionistaId?: number },
    createdFrom: Date,
  ): Promise<DashboardChart> {
    const qb = this.orderRepository
      .createQueryBuilder('o')
      .leftJoin('o.estadoOrden', 'estadoOrden')
      .select('COALESCE(estadoOrden.nombre, :sinEstado)', 'label')
      .addSelect('COUNT(o.id)', 'value')
      .where('o.deletedAt IS NULL')
      .andWhere('o.createdAt >= :createdFrom', { createdFrom })
      .setParameter('sinEstado', 'Sin estado');

    if (filters.clientId) {
      qb.andWhere('o.clientId = :clientId', { clientId: filters.clientId });
    }

    if (filters.technicianId) {
      qb.andWhere('o.technicianId = :technicianId', { technicianId: filters.technicianId });
    }

    if (filters.recepcionistaId) {
      qb.andWhere('o.recepcionistaId = :recepcionistaId', { recepcionistaId: filters.recepcionistaId });
    }

    const rows = await qb
      .groupBy('estadoOrden.nombre')
      .orderBy('COUNT(o.id)', 'DESC')
      .getRawMany<{ label: string; value: string }>();

    return {
      key: 'orders-by-status',
      title: 'Órdenes por estado',
      categories: rows.map((row) => row.label),
      series: [
        {
          name: 'Órdenes',
          data: rows.map((row) => Number(row.value)),
        },
      ],
    };
  }

  private async countDueTodayOrders(userId: number, startOfDay: Date, endOfDay: Date): Promise<number> {
    return this.orderRepository
      .createQueryBuilder('o')
      .where('o.deletedAt IS NULL')
      .andWhere('o.technicianId = :userId', { userId })
      .andWhere('o.fechaPrometidaEntrega IS NOT NULL')
      .andWhere('o.fechaPrometidaEntrega >= :startOfDay', { startOfDay })
      .andWhere('o.fechaPrometidaEntrega < :endOfDay', { endOfDay })
      .getCount();
  }

  private async countActivitiesForTech(userId: number, startOfDay: Date, endOfDay: Date): Promise<number> {
    return this.actividadRepository
      .createQueryBuilder('a')
      .leftJoin('a.orden', 'o')
      .where('a.deletedAt IS NULL')
      .andWhere('o.technicianId = :userId', { userId })
      .andWhere('a.fecha >= :startOfDay', { startOfDay })
      .andWhere('a.fecha < :endOfDay', { endOfDay })
      .getCount();
  }

  private async countOrdersCreatedTodayByRecep(userId: number, startOfDay: Date, endOfDay: Date): Promise<number> {
    return this.orderRepository
      .createQueryBuilder('o')
      .where('o.deletedAt IS NULL')
      .andWhere('o.recepcionistaId = :userId', { userId })
      .andWhere('o.createdAt >= :startOfDay', { startOfDay })
      .andWhere('o.createdAt < :endOfDay', { endOfDay })
      .getCount();
  }

  private async countOrdersPendingTechAssignment(userId: number): Promise<number> {
    return this.orderRepository
      .createQueryBuilder('o')
      .where('o.deletedAt IS NULL')
      .andWhere('o.recepcionistaId = :userId', { userId })
      .andWhere('o.technicianId IS NULL')
      .getCount();
  }
}
