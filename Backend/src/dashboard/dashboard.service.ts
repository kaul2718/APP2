import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Presupuesto } from 'src/presupuesto/entities/presupuesto.entity';
import { Notificacion } from 'src/notificacion/entities/notificacion.entity';
import { Parte } from 'src/parte/entities/parte.entity';
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
    @InjectRepository(Parte)
    private readonly parteRepository: Repository<Parte>,
    @InjectRepository(ActividadTecnica)
    private readonly actividadRepository: Repository<ActividadTecnica>,
  ) {}

  async getDashboardForUser(user: User, range = '30d'): Promise<DashboardResponse> {
    const role = this.resolveRole(user);
    switch (role) {
      case 'admin': return this.getAdminDashboard(range);
      case 'tech': return this.getTechDashboard(user.id, range);
      case 'recep': return this.getRecepDashboard(user.id, range);
      default: return this.getClientDashboard(user.id, range);
    }
  }

  async getAdminDashboard(range = '30d'): Promise<DashboardResponse> {
    const from = this.getRangeStart(range);
    const now = new Date();

    const [
      totalOrders, activeOrders, pendingBudgets, delayedOrders,
      unreadNotifications, lowStockCount, recent, chart,
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
        message: `Atención: ${lowStockCount} productos en almacén con stock crítico.`,
        severity: 'warning',
      });
    }
    if (delayedOrders > 0) {
      alerts.push({
        id: 'delayed-orders',
        message: `Alerta: ${delayedOrders} órdenes con retraso en fecha de entrega.`,
        severity: 'error',
      });
    }

    return {
      role: 'admin', range, generatedAt: now.toISOString(),
      kpis: [
        { key: 'total-orders', label: 'Total Órdenes', value: totalOrders },
        { key: 'active-orders', label: 'Órdenes Activas', value: activeOrders },
        { key: 'pending-budgets', label: 'Presupuestos Pendientes', value: pendingBudgets },
        { key: 'unread-notifications', label: 'Avisos Pendientes', value: unreadNotifications },
      ],
      charts: [chart], recent, alerts,
    };
  }

  async getTechDashboard(userId: number, range = '30d'): Promise<DashboardResponse> {
    const from = this.getRangeStart(range);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const [
      assignedOrders, inProgressOrders, dueToday, activitiesToday,
      unreadNotifications, pendingBudgets, recent, chart,
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
      role: 'tech', range, generatedAt: now.toISOString(),
      kpis: [
        { key: 'assigned-orders', label: 'Mis Asignaciones', value: assignedOrders },
        { key: 'in-progress-orders', label: 'En Proceso', value: inProgressOrders },
        { key: 'due-today', label: 'Entregas Hoy', value: dueToday },
        { key: 'activities-today', label: 'Actividad Realizada', value: activitiesToday },
      ],
      charts: [chart], recent,
      alerts: [
        {
          id: 'tech-unread',
          message: unreadNotifications > 0 ? `Tienes ${unreadNotifications} mensajes sin leer.` : 'Sin mensajes nuevos.',
          severity: unreadNotifications > 0 ? 'info' : 'success',
        },
        {
          id: 'tech-pending',
          message: pendingBudgets > 0 ? `Quedan ${pendingBudgets} presupuestos por definir.` : 'Presupuestos al día.',
          severity: pendingBudgets > 0 ? 'warning' : 'success',
        }
      ],
    };
  }

  async getRecepDashboard(userId: number, range = '30d'): Promise<DashboardResponse> {
    const from = this.getRangeStart(range);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const [
      ordersCreated, ordersCreatedToday, pendingAssignment, unreadNotifications,
      pendingBudgets, recent, chart,
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
      role: 'recep', range, generatedAt: now.toISOString(),
      kpis: [
        { key: 'orders-created', label: 'Órdenes Registradas', value: ordersCreated },
        { key: 'orders-today', label: 'Ingresos Hoy', value: ordersCreatedToday },
        { key: 'pending-assign', label: 'Por Asignar', value: pendingAssignment },
        { key: 'pending-budgets', label: 'Presupuestos Pend.', value: pendingBudgets },
      ],
      charts: [chart], recent,
      alerts: [{ id: 'recep-notif', message: `Notificaciones sin leer: ${unreadNotifications}`, severity: unreadNotifications > 0 ? 'info' : 'success' }],
    };
  }

  async getClientDashboard(userId: number, range = '30d'): Promise<DashboardResponse> {
    const from = this.getRangeStart(range);
    const now = new Date();
    const [myOrders, myActiveOrders, pendingBudgets, unreadNotifications, recent, chart] = await Promise.all([
      this.countOrders({ clientId: userId }, from),
      this.countOrders({ clientId: userId, statusOnlyActive: true }, from),
      this.countPendingBudgets({ clientId: userId }, from),
      this.countUnreadNotifications(userId),
      this.getRecentOrders({ clientId: userId }, 8),
      this.getOrderStatusChart({ clientId: userId }, from),
    ]);

    return {
      role: 'client', range, generatedAt: now.toISOString(),
      kpis: [
        { key: 'my-orders', label: 'Mis Órdenes', value: myOrders },
        { key: 'my-active', label: 'Equipos en Servicio', value: myActiveOrders },
        { key: 'pending-bud', label: 'Presupuestos Enviados', value: pendingBudgets },
        { key: 'unread-notif', label: 'Avisos', value: unreadNotifications },
      ],
      charts: [chart], recent,
      alerts: [{ id: 'client-alert', message: unreadNotifications > 0 ? `Tienes novedades en tus órdenes.` : 'Todo en orden.', severity: unreadNotifications > 0 ? 'info' : 'success' }],
    };
  }

  private resolveRole(user: User): DashboardRole {
    const slugs = (user.userRoles || []).map((ur) => ur.rol?.slug).filter(Boolean);
    if (slugs.includes('admin')) return 'admin';
    if (slugs.includes('tech')) return 'tech';
    if (slugs.includes('recep')) return 'recep';
    return 'client';
  }

  private getRangeStart(range: string): Date | undefined {
    if (range === 'all') return undefined;
    const now = new Date();
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  private async countOrders(filters: any, createdFrom?: Date): Promise<number> {
    const qb = this.orderRepository.createQueryBuilder('o').where('o.deletedAt IS NULL');
    if (filters.clientId) qb.andWhere('o.clientId = :clientId', { clientId: filters.clientId });
    if (filters.technicianId) qb.andWhere('o.technicianId = :technicianId', { technicianId: filters.technicianId });
    if (filters.recepcionistaId) qb.andWhere('o.recepcionistaId = :recepcionistaId', { recepcionistaId: filters.recepcionistaId });
    if (filters.statusOnlyActive) qb.andWhere('o.estado = true');
    if (createdFrom) qb.andWhere('o.createdAt >= :createdFrom', { createdFrom });
    return qb.getCount();
  }

  private async countPendingBudgets(filters: any, createdFrom?: Date): Promise<number> {
    const qb = this.presupuestoRepository.createQueryBuilder('p').leftJoin('p.estado', 'estado').leftJoin('p.orden', 'orden')
      .where('p.deletedAt IS NULL').andWhere('LOWER(estado.nombre) LIKE :pending', { pending: '%pend%' });
    if (filters.clientId) qb.andWhere('orden.clientId = :clientId', { clientId: filters.clientId });
    if (filters.technicianId) qb.andWhere('orden.technicianId = :technicianId', { technicianId: filters.technicianId });
    if (filters.recepcionistaId) qb.andWhere('orden.recepcionistaId = :recepcionistaId', { recepcionistaId: filters.recepcionistaId });
    if (createdFrom) qb.andWhere('p.createdAt >= :createdFrom', { createdFrom });
    return qb.getCount();
  }

  private async countDelayedOrders(): Promise<number> {
    const now = new Date();
    return this.orderRepository.createQueryBuilder('o').where('o.deletedAt IS NULL')
      .andWhere('o.fechaPrometidaEntrega IS NOT NULL').andWhere('o.fechaPrometidaEntrega < :now', { now })
      .andWhere('o.estado = true').getCount();
  }

  private async countUnreadNotifications(userId?: number): Promise<number> {
    const qb = this.notificacionRepository.createQueryBuilder('n').where('n.isDeleted = false AND n.leido = false AND n.deletedAt IS NULL');
    if (userId) qb.andWhere('n.usuarioId = :userId', { userId });
    return qb.getCount();
  }

  private async countLowStock(): Promise<number> {
    return this.parteRepository.createQueryBuilder('p')
      .where('p.deletedAt IS NULL')
      .andWhere('p.estado = true')
      .andWhere('p.stock <= p.stockMinimo')
      .getCount();
  }

  private async getRecentOrders(filters: any, limit = 8): Promise<DashboardRecentItem[]> {
    const qb = this.orderRepository.createQueryBuilder('o').leftJoinAndSelect('o.client', 'client')
      .leftJoinAndSelect('o.technician', 'technician').leftJoinAndSelect('o.estadoOrden', 'estadoOrden')
      .where('o.deletedAt IS NULL');
    if (filters.clientId) qb.andWhere('o.clientId = :clientId', { clientId: filters.clientId });
    if (filters.technicianId) qb.andWhere('o.technicianId = :technicianId', { technicianId: filters.technicianId });
    if (filters.recepcionistaId) qb.andWhere('o.recepcionistaId = :recepcionistaId', { recepcionistaId: filters.recepcionistaId });
    const orders = await qb.orderBy('o.createdAt', 'DESC').take(limit).getMany();
    return orders.map((o) => ({
      id: o.id, title: `Orden #${o.workOrderNumber}`,
      subtitle: `${o.client?.nombre || ''} ${o.client?.apellido || ''}`.trim(),
      status: o.estadoOrden?.nombre || 'Pendiente',
      createdAt: o.createdAt, path: '/ver-orden'
    }));
  }

  private async getOrderStatusChart(filters: any, createdFrom: Date | undefined): Promise<DashboardChart> {
    const qb = this.orderRepository.createQueryBuilder('o').leftJoin('o.estadoOrden', 'estadoOrden')
      .select('COALESCE(estadoOrden.nombre, :sinEstado)', 'label').addSelect('COUNT(o.id)', 'value')
      .where('o.deletedAt IS NULL').setParameter('sinEstado', 'Pendiente');
    
    if (createdFrom) {
      qb.andWhere('o.createdAt >= :createdFrom', { createdFrom });
    }
    if (filters.clientId) qb.andWhere('o.clientId = :clientId', { clientId: filters.clientId });
    if (filters.technicianId) qb.andWhere('o.technicianId = :technicianId', { technicianId: filters.technicianId });
    if (filters.recepcionistaId) qb.andWhere('o.recepcionistaId = :recepcionistaId', { recepcionistaId: filters.recepcionistaId });
    const rows = await qb.groupBy('estadoOrden.nombre').orderBy('COUNT(o.id)', 'DESC').getRawMany<{ label: string; value: string }>();
    return {
      key: 'orders-status', title: 'Distribución por Estado',
      categories: rows.map((r) => r.label),
      series: [{ name: 'Órdenes', data: rows.map((r) => Number(r.value)) }]
    };
  }

  private async countDueTodayOrders(userId: number, startOfDay: Date, endOfDay: Date): Promise<number> {
    return this.orderRepository.createQueryBuilder('o').where('o.deletedAt IS NULL AND o.technicianId = :userId', { userId })
      .andWhere('o.fechaPrometidaEntrega >= :startOfDay AND o.fechaPrometidaEntrega < :endOfDay', { startOfDay, endOfDay }).getCount();
  }

  private async countActivitiesForTech(userId: number, startOfDay: Date, endOfDay: Date): Promise<number> {
    return this.actividadRepository.createQueryBuilder('a').leftJoin('a.orden', 'o')
      .where('a.deletedAt IS NULL AND o.technicianId = :userId', { userId })
      .andWhere('a.fecha >= :startOfDay AND a.fecha < :endOfDay', { startOfDay, endOfDay }).getCount();
  }

  private async countOrdersCreatedTodayByRecep(userId: number, startOfDay: Date, endOfDay: Date): Promise<number> {
    return this.orderRepository.createQueryBuilder('o').where('o.deletedAt IS NULL AND o.recepcionistaId = :userId', { userId })
      .andWhere('o.createdAt >= :startOfDay AND o.createdAt < :endOfDay', { startOfDay, endOfDay }).getCount();
  }

  private async countOrdersPendingTechAssignment(userId: number): Promise<number> {
    return this.orderRepository.createQueryBuilder('o').where('o.deletedAt IS NULL AND o.recepcionistaId = :userId AND o.technicianId IS NULL', { userId }).getCount();
  }
}
