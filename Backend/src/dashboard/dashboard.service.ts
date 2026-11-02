import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { Presupuesto } from '../presupuesto/entities/presupuesto.entity';
import { Notificacion } from '../notificacion/entities/notificacion.entity';
import { Parte } from '../parte/entities/parte.entity';
import { ActividadTecnica } from '../actividad-tecnica/entities/actividad-tecnica.entity';
import { HistorialEstadoOrden } from '../historial-estado-orden/entities/historial-estado-orden.entity';
import {
  DashboardAlert,
  DashboardChart,
  DashboardKpi,
  DashboardRecentItem,
  DashboardResponse,
  DashboardRole,
  TechnicianWorkloadStat,
  TurnaroundTimeStat,
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
    @InjectRepository(HistorialEstadoOrden)
    private readonly historialRepository: Repository<HistorialEstadoOrden>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
      default:
        return this.getClientDashboard(user.id, range);
    }
  }

  // ==========================================
  // DASHBOARD ADMINISTRATIVO (COMPLETO)
  // ==========================================
  async getAdminDashboard(range = '30d'): Promise<DashboardResponse> {
    const { from, to, prevFrom, prevTo } = this.getRangeIntervals(range);
    const now = new Date();

    const [
      inWorkshopCount,
      ordersCreated,
      ordersCreatedPrev,
      deliveredCount,
      deliveredPrev,
      pendingBudgets,
      delayedOrdersCount,
      readyToDeliverCount,
      unassignedOrdersCount,
      lowStockCount,
      unreadNotifications,
      recent,
      statusChart,
      evolutionChart,
      turnaroundTimes,
      technicianWorkloads,
    ] = await Promise.all([
      // 1. Equipos en taller (estado activo, independiente de fecha de ingreso)
      this.countInWorkshopOrders(),
      // 2. Ingresadas en período actual y anterior (para variación %)
      this.countOrdersCreatedBetween(from, to),
      this.countOrdersCreatedBetween(prevFrom, prevTo),
      // 3. Entregadas en período actual y anterior (historial_estado_orden)
      this.countDeliveredBetween(from, to),
      this.countDeliveredBetween(prevFrom, prevTo),
      // 4. Presupuestos pendientes actuales
      this.countPendingBudgets(),
      // 5. Órdenes atrasadas activas en taller
      this.countDelayedOrders(),
      // 6. Equipos listos para retirar (en Control)
      this.countReadyForPickup(),
      // Alertas operativas adicionales
      this.countUnassignedOrders(),
      this.countLowStock(),
      this.countUnreadNotifications(),
      this.getRecentOrders({}, 8),
      this.getOrderStatusChart({}, from),
      this.getOrdersEvolutionChart(range, from, to),
      this.getTurnaroundTimes(),
      this.getTechniciansWorkload(from),
    ]);

    // Variaciones porcentuales vs período anterior
    const createdVariation = range !== 'all' ? this.calculateVariation(ordersCreated, ordersCreatedPrev) : undefined;
    const deliveredVariation = range !== 'all' ? this.calculateVariation(deliveredCount, deliveredPrev) : undefined;

    // 6 KPIs alineados 1:1 con el Wireframe:
    // [ En taller ] [ Ingresadas ] [ Entregadas ]
    // [ Presupuestos ] [ Atrasadas ] [ Por retirar ]
    const kpis: DashboardKpi[] = [
      {
        key: 'in-workshop',
        label: 'En Taller',
        value: inWorkshopCount,
        subtitle: 'Equipos en proceso físico activo',
        trend: 'neutral',
        actionUrl: '/ver-orden',
      },
      {
        key: 'orders-created',
        label: 'Ingresadas',
        value: ordersCreated,
        variation: createdVariation,
        trend: createdVariation !== undefined ? (createdVariation >= 0 ? 'up' : 'down') : 'neutral',
        subtitle: range === 'all' ? 'Histórico total' : `vs. período anterior (${ordersCreatedPrev})`,
        actionUrl: '/ver-orden',
      },
      {
        key: 'orders-delivered',
        label: 'Entregadas',
        value: deliveredCount,
        variation: deliveredVariation,
        trend: deliveredVariation !== undefined ? (deliveredVariation >= 0 ? 'up' : 'down') : 'neutral',
        subtitle: range === 'all' ? 'Histórico total' : `vs. período anterior (${deliveredPrev})`,
        actionUrl: '/ver-orden',
      },
      {
        key: 'pending-budgets',
        label: 'Presupuestos',
        value: pendingBudgets,
        subtitle: 'Pendientes de aprobación',
        trend: pendingBudgets > 0 ? 'down' : 'neutral',
        actionUrl: '/ver-presupuesto',
      },
      {
        key: 'delayed-orders',
        label: 'Atrasadas',
        value: delayedOrdersCount,
        subtitle: 'Con fecha prometida vencida',
        trend: delayedOrdersCount > 0 ? 'down' : 'neutral',
        color: delayedOrdersCount > 0 ? 'rose' : 'gray',
        actionUrl: '/ver-orden?filtro=atrasadas',
      },
      {
        key: 'ready-to-pickup',
        label: 'Por Retirar',
        value: readyToDeliverCount,
        subtitle: 'Reparadas y listas en control',
        trend: readyToDeliverCount > 0 ? 'up' : 'neutral',
        color: 'emerald',
        actionUrl: '/ver-orden?estadoId=1',
      },
    ];

    // Panel de atención inmediata estructurado
    const alerts: DashboardAlert[] = [];

    if (delayedOrdersCount > 0) {
      alerts.push({
        id: 'delayed-orders',
        title: 'Órdenes Atrasadas',
        message: `${delayedOrdersCount} órdenes activas han superado su fecha de entrega prometida.`,
        severity: 'error',
        count: delayedOrdersCount,
        actionUrl: '/ver-orden?filtro=atrasadas',
        actionLabel: 'Revisar atrasos',
      });
    }

    if (pendingBudgets > 0) {
      alerts.push({
        id: 'pending-budgets',
        title: 'Presupuestos Pendientes',
        message: `${pendingBudgets} presupuestos están a la espera de aprobación del cliente.`,
        severity: 'warning',
        count: pendingBudgets,
        actionUrl: '/ver-presupuesto',
        actionLabel: 'Ver presupuestos',
      });
    }

    if (readyToDeliverCount > 0) {
      alerts.push({
        id: 'ready-pickup',
        title: 'Equipos Listos para Retiro',
        message: `${readyToDeliverCount} equipos finalizaron control de calidad y esperan retiro del cliente.`,
        severity: 'success',
        count: readyToDeliverCount,
        actionUrl: '/ver-orden?estadoId=1',
        actionLabel: 'Ver equipos listos',
      });
    }

    if (lowStockCount > 0) {
      alerts.push({
        id: 'low-stock',
        title: 'Stock Crítico en Almacén',
        message: `${lowStockCount} repuestos e insumos están en o por debajo del stock mínimo.`,
        severity: 'warning',
        count: lowStockCount,
        actionUrl: '/ver-inventario?filtro=critico',
        actionLabel: 'Gestionar inventario',
      });
    }

    if (unassignedOrdersCount > 0) {
      alerts.push({
        id: 'unassigned-orders',
        title: 'Órdenes sin Asignar',
        message: `${unassignedOrdersCount} equipos no tienen técnico asignado para diagnóstico.`,
        severity: 'info',
        count: unassignedOrdersCount,
        actionUrl: '/ver-orden?filtro=sin-asignar',
        actionLabel: 'Asignar técnicos',
      });
    }

    return {
      role: 'admin',
      range,
      generatedAt: now.toISOString(),
      kpis,
      charts: [evolutionChart, statusChart],
      recent,
      alerts,
      turnaroundTimes,
      technicianWorkloads,
    };
  }

  // ==========================================
  // DASHBOARD TÉCNICO
  // ==========================================
  async getTechDashboard(userId: number, range = '30d'): Promise<DashboardResponse> {
    const { from, to } = this.getRangeIntervals(range);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const [
      assignedActive,
      ordersCompleted,
      dueToday,
      activitiesToday,
      pendingBudgets,
      unreadNotifications,
      recent,
      statusChart,
    ] = await Promise.all([
      this.countInWorkshopOrders({ technicianId: userId }),
      this.countDeliveredBetween(from, to, { technicianId: userId }),
      this.countDueTodayOrders(userId, startOfDay, endOfDay),
      this.countActivitiesForTech(userId, startOfDay, endOfDay),
      this.countPendingBudgets({ technicianId: userId }),
      this.countUnreadNotifications(userId),
      this.getRecentOrders({ technicianId: userId }, 8),
      this.getOrderStatusChart({ technicianId: userId }, from),
    ]);

    const alerts: DashboardAlert[] = [];
    if (dueToday > 0) {
      alerts.push({
        id: 'tech-due-today',
        title: 'Vencimientos de Hoy',
        message: `Tienes ${dueToday} orden(es) con entrega programada para hoy.`,
        severity: 'error',
        count: dueToday,
        actionUrl: '/ver-orden',
        actionLabel: 'Ver órdenes de hoy',
      });
    }
    if (pendingBudgets > 0) {
      alerts.push({
        id: 'tech-pending-budgets',
        title: 'Presupuestos Pendientes',
        message: `Tienes ${pendingBudgets} presupuesto(s) pendientes de elaboración o respuesta.`,
        severity: 'warning',
        count: pendingBudgets,
        actionUrl: '/ver-presupuesto',
        actionLabel: 'Revisar presupuestos',
      });
    }

    return {
      role: 'tech',
      range,
      generatedAt: now.toISOString(),
      kpis: [
        { key: 'tech-assigned', label: 'Mis Asignaciones', value: assignedActive, subtitle: 'Activas en taller', actionUrl: '/ver-orden' },
        { key: 'tech-completed', label: 'Completadas', value: ordersCompleted, subtitle: 'En el período', actionUrl: '/ver-orden' },
        { key: 'tech-due-today', label: 'Entregas Hoy', value: dueToday, subtitle: 'Compromiso del día', color: dueToday > 0 ? 'rose' : 'gray', actionUrl: '/ver-orden' },
        { key: 'tech-activities', label: 'Actividades Hoy', value: activitiesToday, subtitle: 'Registros técnicos', actionUrl: '/ver-orden' },
      ],
      charts: [statusChart],
      recent,
      alerts,
    };
  }

  // ==========================================
  // DASHBOARD RECEPCIÓN
  // ==========================================
  async getRecepDashboard(userId: number, range = '30d'): Promise<DashboardResponse> {
    const { from, to } = this.getRangeIntervals(range);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const [
      ordersCreated,
      ordersCreatedToday,
      readyToPickup,
      pendingAssignment,
      unreadNotifications,
      recent,
      statusChart,
    ] = await Promise.all([
      this.countOrdersCreatedBetween(from, to, { recepcionistaId: userId }),
      this.countOrdersCreatedTodayByRecep(userId, startOfDay, endOfDay),
      this.countReadyForPickup(),
      this.countUnassignedOrders(),
      this.countUnreadNotifications(userId),
      this.getRecentOrders({ recepcionistaId: userId }, 8),
      this.getOrderStatusChart({ recepcionistaId: userId }, from),
    ]);

    const alerts: DashboardAlert[] = [];
    if (readyToPickup > 0) {
      alerts.push({
        id: 'recep-ready-pickup',
        title: 'Equipos Listos para Retiro',
        message: `${readyToPickup} equipo(s) están listos para ser retirados por el cliente.`,
        severity: 'success',
        count: readyToPickup,
        actionUrl: '/ver-orden?estadoId=1',
        actionLabel: 'Notificar / Entregar',
      });
    }
    if (pendingAssignment > 0) {
      alerts.push({
        id: 'recep-unassigned',
        title: 'Órdenes por Asignar',
        message: `${pendingAssignment} orden(es) están ingresadas pero sin técnico asignado.`,
        severity: 'warning',
        count: pendingAssignment,
        actionUrl: '/ver-orden?filtro=sin-asignar',
        actionLabel: 'Asignar técnico',
      });
    }

    return {
      role: 'recep',
      range,
      generatedAt: now.toISOString(),
      kpis: [
        { key: 'recep-created', label: 'Órdenes Registradas', value: ordersCreated, subtitle: 'En el período', actionUrl: '/ver-orden' },
        { key: 'recep-today', label: 'Ingresos Hoy', value: ordersCreatedToday, subtitle: 'Recepción del día', actionUrl: '/ver-orden' },
        { key: 'recep-ready', label: 'Por Entregar', value: readyToPickup, subtitle: 'Equipos listos en control', actionUrl: '/ver-orden?estadoId=1' },
        { key: 'recep-unassigned', label: 'Sin Asignar', value: pendingAssignment, subtitle: 'Pendientes de técnico', actionUrl: '/ver-orden?filtro=sin-asignar' },
      ],
      charts: [statusChart],
      recent,
      alerts,
    };
  }

  // ==========================================
  // DASHBOARD CLIENTE
  // ==========================================
  async getClientDashboard(userId: number, range = '30d'): Promise<DashboardResponse> {
    const { from } = this.getRangeIntervals(range);
    const now = new Date();
    const [myOrders, inWorkshop, pendingBudgets, unreadNotifications, recent, chart] = await Promise.all([
      this.countOrdersCreatedBetween(from, undefined, { clientId: userId }),
      this.countInWorkshopOrders({ clientId: userId }),
      this.countPendingBudgets({ clientId: userId }),
      this.countUnreadNotifications(userId),
      this.getRecentOrders({ clientId: userId }, 8),
      this.getOrderStatusChart({ clientId: userId }, from),
    ]);

    return {
      role: 'client',
      range,
      generatedAt: now.toISOString(),
      kpis: [
        { key: 'my-orders', label: 'Mis Órdenes', value: myOrders, actionUrl: '/ver-orden' },
        { key: 'my-active', label: 'Equipos en Taller', value: inWorkshop, actionUrl: '/ver-orden' },
        { key: 'pending-bud', label: 'Presupuestos por Aprobar', value: pendingBudgets, actionUrl: '/ver-presupuesto' },
        { key: 'unread-notif', label: 'Avisos', value: unreadNotifications, actionUrl: '/notificaciones' },
      ],
      charts: [chart],
      recent,
      alerts: [
        {
          id: 'client-alert',
          title: 'Estado del Servicio',
          message: unreadNotifications > 0 ? `Tienes ${unreadNotifications} novedades sobre tus equipos.` : 'Tus órdenes están en proceso.',
          severity: unreadNotifications > 0 ? 'info' : 'success',
        },
      ],
    };
  }

  // ==========================================
  // HELPERS Y CÁLCULOS RIGUROSOS
  // ==========================================
  private resolveRole(user: User): DashboardRole {
    const slugs = (user.userRoles || []).map((ur) => ur.rol?.slug).filter(Boolean);
    if (slugs.includes('admin')) return 'admin';
    if (slugs.includes('tech')) return 'tech';
    if (slugs.includes('recep')) return 'recep';
    return 'client';
  }

  private getRangeIntervals(range: string): { from?: Date; to?: Date; prevFrom?: Date; prevTo?: Date } {
    if (range === 'all') {
      return {};
    }
    const now = new Date();
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    const durationMs = days * 24 * 60 * 60 * 1000;

    const from = new Date(now.getTime() - durationMs);
    const to = now;
    const prevFrom = new Date(from.getTime() - durationMs);
    const prevTo = from;

    return { from, to, prevFrom, prevTo };
  }

  private calculateVariation(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
  }

  // 1. Equipos en taller activo (excluye Entrega, Archivados, Cancelada, Anulada)
  private async countInWorkshopOrders(filters: any = {}): Promise<number> {
    const qb = this.orderRepository.createQueryBuilder('o')
      .leftJoin('o.estadoOrden', 'eo')
      .where('o.deletedAt IS NULL')
      .andWhere("eo.nombre NOT IN ('Entrega', 'Archivados', 'Cancelada', 'Anulada')");

    if (filters.clientId) qb.andWhere('o.clientId = :clientId', { clientId: filters.clientId });
    if (filters.technicianId) qb.andWhere('o.technicianId = :techId', { techId: filters.technicianId });
    if (filters.recepcionistaId) qb.andWhere('o.recepcionistaId = :recepId', { recepId: filters.recepcionistaId });
    return qb.getCount();
  }

  // 2. Órdenes creadas en intervalo
  private async countOrdersCreatedBetween(startDate?: Date, endDate?: Date, filters: any = {}): Promise<number> {
    const qb = this.orderRepository.createQueryBuilder('o').where('o.deletedAt IS NULL');
    if (startDate) qb.andWhere('o.createdAt >= :startDate', { startDate });
    if (endDate) qb.andWhere('o.createdAt < :endDate', { endDate });
    if (filters.clientId) qb.andWhere('o.clientId = :clientId', { clientId: filters.clientId });
    if (filters.technicianId) qb.andWhere('o.technicianId = :techId', { techId: filters.technicianId });
    if (filters.recepcionistaId) qb.andWhere('o.recepcionistaId = :recepId', { recepId: filters.recepcionistaId });
    return qb.getCount();
  }

  // 3. Órdenes entregadas en intervalo (según historial_estado_orden)
  private async countDeliveredBetween(startDate?: Date, endDate?: Date, filters: any = {}): Promise<number> {
    const qb = this.historialRepository.createQueryBuilder('h')
      .innerJoin('h.estadoOrden', 'eo')
      .innerJoin('h.orden', 'o')
      .where('o.deletedAt IS NULL')
      .andWhere("eo.nombre = 'Entrega'");

    if (startDate) qb.andWhere('h.fechaCambio >= :startDate', { startDate });
    if (endDate) qb.andWhere('h.fechaCambio < :endDate', { endDate });
    if (filters.clientId) qb.andWhere('o.clientId = :clientId', { clientId: filters.clientId });
    if (filters.technicianId) qb.andWhere('o.technicianId = :techId', { techId: filters.technicianId });
    if (filters.recepcionistaId) qb.andWhere('o.recepcionistaId = :recepId', { recepId: filters.recepcionistaId });

    const raw = await qb.select('COUNT(DISTINCT h.ordenId)', 'cnt').getRawOne<{ cnt: string }>();
    return Number(raw?.cnt || 0);
  }

  // 4. Presupuestos pendientes
  private async countPendingBudgets(filters: any = {}): Promise<number> {
    const qb = this.presupuestoRepository.createQueryBuilder('p')
      .leftJoin('p.estado', 'estado')
      .leftJoin('p.orden', 'orden')
      .where('p.deletedAt IS NULL')
      .andWhere('LOWER(estado.nombre) LIKE :pending', { pending: '%pend%' });

    if (filters.clientId) qb.andWhere('orden.clientId = :clientId', { clientId: filters.clientId });
    if (filters.technicianId) qb.andWhere('orden.technicianId = :techId', { techId: filters.technicianId });
    if (filters.recepcionistaId) qb.andWhere('orden.recepcionistaId = :recepId', { recepId: filters.recepcionistaId });
    return qb.getCount();
  }

  // 5. Órdenes atrasadas activas en taller
  private async countDelayedOrders(filters: any = {}): Promise<number> {
    const now = new Date();
    const qb = this.orderRepository.createQueryBuilder('o')
      .leftJoin('o.estadoOrden', 'eo')
      .where('o.deletedAt IS NULL')
      .andWhere('o.fechaPrometidaEntrega IS NOT NULL')
      .andWhere('o.fechaPrometidaEntrega < :now', { now })
      .andWhere("eo.nombre NOT IN ('Entrega', 'Archivados', 'Cancelada', 'Anulada')");

    if (filters.technicianId) qb.andWhere('o.technicianId = :techId', { techId: filters.technicianId });
    if (filters.recepcionistaId) qb.andWhere('o.recepcionistaId = :recepId', { recepId: filters.recepcionistaId });
    return qb.getCount();
  }

  // 6. Equipos listos para retirar (en Control)
  private async countReadyForPickup(filters: any = {}): Promise<number> {
    const qb = this.orderRepository.createQueryBuilder('o')
      .leftJoin('o.estadoOrden', 'eo')
      .where('o.deletedAt IS NULL')
      .andWhere("eo.nombre = 'Control'");

    if (filters.clientId) qb.andWhere('o.clientId = :clientId', { clientId: filters.clientId });
    if (filters.technicianId) qb.andWhere('o.technicianId = :techId', { techId: filters.technicianId });
    if (filters.recepcionistaId) qb.andWhere('o.recepcionistaId = :recepId', { recepId: filters.recepcionistaId });
    return qb.getCount();
  }

  // Órdenes sin técnico asignado
  private async countUnassignedOrders(): Promise<number> {
    return this.orderRepository.createQueryBuilder('o')
      .leftJoin('o.estadoOrden', 'eo')
      .where('o.deletedAt IS NULL')
      .andWhere('o.technicianId IS NULL')
      .andWhere("eo.nombre NOT IN ('Entrega', 'Archivados', 'Cancelada', 'Anulada')")
      .getCount();
  }

  private async countUnreadNotifications(userId?: number): Promise<number> {
    const qb = this.notificacionRepository.createQueryBuilder('n')
      .where('n.isDeleted = false AND n.leido = false AND n.deletedAt IS NULL');
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
    const qb = this.orderRepository.createQueryBuilder('o')
      .leftJoinAndSelect('o.client', 'client')
      .leftJoinAndSelect('o.technician', 'technician')
      .leftJoinAndSelect('o.estadoOrden', 'estadoOrden')
      .where('o.deletedAt IS NULL');

    if (filters.clientId) qb.andWhere('o.clientId = :clientId', { clientId: filters.clientId });
    if (filters.technicianId) qb.andWhere('o.technicianId = :techId', { techId: filters.technicianId });
    if (filters.recepcionistaId) qb.andWhere('o.recepcionistaId = :recepId', { recepId: filters.recepcionistaId });

    const orders = await qb.orderBy('o.createdAt', 'DESC').take(limit).getMany();
    return orders.map((o) => ({
      id: o.id,
      title: `Orden #${o.workOrderNumber}`,
      subtitle: `${o.client?.nombre || ''} ${o.client?.apellido || ''}`.trim() || 'Cliente sin nombre',
      status: o.estadoOrden?.nombre || 'Pendiente',
      tecnico: o.technician ? `${o.technician.nombre} ${o.technician.apellido || ''}`.trim() : 'Sin asignar',
      createdAt: o.createdAt,
      path: '/ver-orden',
    }));
  }

  // Distribución por estado (con total explícito para cálculo exacto de porcentajes)
  private async getOrderStatusChart(filters: any, createdFrom: Date | undefined): Promise<DashboardChart> {
    const qb = this.orderRepository.createQueryBuilder('o')
      .leftJoin('o.estadoOrden', 'estadoOrden')
      .select('COALESCE(estadoOrden.nombre, :sinEstado)', 'label')
      .addSelect('COUNT(o.id)', 'value')
      .where('o.deletedAt IS NULL')
      .setParameter('sinEstado', 'Pendiente');

    if (createdFrom) {
      qb.andWhere('o.createdAt >= :createdFrom', { createdFrom });
    }
    if (filters.clientId) qb.andWhere('o.clientId = :clientId', { clientId: filters.clientId });
    if (filters.technicianId) qb.andWhere('o.technicianId = :techId', { techId: filters.technicianId });
    if (filters.recepcionistaId) qb.andWhere('o.recepcionistaId = :recepId', { recepId: filters.recepcionistaId });

    const rows = await qb.groupBy('estadoOrden.nombre').orderBy('COUNT(o.id)', 'DESC').getRawMany<{ label: string; value: string }>();
    const total = rows.reduce((acc, r) => acc + Number(r.value), 0);

    return {
      key: 'orders-status',
      title: 'Distribución por Estado',
      categories: rows.map((r) => r.label),
      series: [{ name: 'Órdenes', data: rows.map((r) => Number(r.value)) }],
      total,
    };
  }

  // Gráfica de evolución: Ingresadas vs Entregadas
  private async getOrdersEvolutionChart(range: string, from?: Date, to?: Date): Promise<DashboardChart> {
    const now = to || new Date();
    const categories: string[] = [];
    const ingresadasData: number[] = [];
    const entregadasData: number[] = [];

    // Helper para formatear fecha a etiqueta amigable
    const formatLabel = (d: Date, format: 'day' | 'month') => {
      if (format === 'month') {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      }
      return `${d.getDate()}/${d.getMonth() + 1}`;
    };

    if (range === '7d' || range === '30d') {
      const daysCount = range === '7d' ? 7 : 30;
      // Generar puntos diarios (o cada 3 días si es 30d para legibilidad)
      const stepDays = range === '7d' ? 1 : 3;
      const points = Math.ceil(daysCount / stepDays);

      for (let i = points - 1; i >= 0; i--) {
        const binEnd = new Date(now.getTime() - i * stepDays * 24 * 60 * 60 * 1000);
        const binStart = new Date(binEnd.getTime() - stepDays * 24 * 60 * 60 * 1000);
        categories.push(formatLabel(binEnd, 'day'));

        const [ing, ent] = await Promise.all([
          this.countOrdersCreatedBetween(binStart, binEnd),
          this.countDeliveredBetween(binStart, binEnd),
        ]);
        ingresadasData.push(ing);
        entregadasData.push(ent);
      }
    } else if (range === '90d') {
      // 12 semanas
      for (let i = 11; i >= 0; i--) {
        const binEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const binStart = new Date(binEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
        categories.push(`Sem ${12 - i}`);

        const [ing, ent] = await Promise.all([
          this.countOrdersCreatedBetween(binStart, binEnd),
          this.countDeliveredBetween(binStart, binEnd),
        ]);
        ingresadasData.push(ing);
        entregadasData.push(ent);
      }
    } else {
      // 'all' -> últimos 6 a 12 meses
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        categories.push(formatLabel(d, 'month'));

        const [ing, ent] = await Promise.all([
          this.countOrdersCreatedBetween(d, nextD),
          this.countDeliveredBetween(d, nextD),
        ]);
        ingresadasData.push(ing);
        entregadasData.push(ent);
      }
    }

    return {
      key: 'orders-evolution',
      title: 'Evolución: Ingresadas vs. Entregadas',
      categories,
      series: [
        { name: 'Ingresadas', data: ingresadasData },
        { name: 'Entregadas', data: entregadasData },
      ],
    };
  }

  // Tiempos promedio de atención: Express vs Completa
  private async getTurnaroundTimes(): Promise<TurnaroundTimeStat[]> {
    const raw = await this.orderRepository.createQueryBuilder('o')
      .innerJoin('o.historialEstados', 'h')
      .innerJoin('h.estadoOrden', 'eo')
      .where('o.deletedAt IS NULL')
      .andWhere("eo.nombre IN ('Entrega', 'Control')")
      .select('o.tipoOrden', 'tipoOrden')
      .addSelect('COUNT(DISTINCT o.id)', 'muestra')
      .addSelect('AVG(EXTRACT(EPOCH FROM (h.fechaCambio - o.createdAt)) / 3600)', 'horas')
      .groupBy('o.tipoOrden')
      .getRawMany<{ tipoOrden: string; muestra: string; horas: string }>();

    const results: TurnaroundTimeStat[] = [
      { tipoOrden: 'EXPRESS', horasPromedio: 0, diasPromedio: 0, muestra: 0 },
      { tipoOrden: 'COMPLETA', horasPromedio: 0, diasPromedio: 0, muestra: 0 },
    ];

    for (const r of raw) {
      const stat = results.find((s) => s.tipoOrden.toUpperCase() === (r.tipoOrden || '').toUpperCase());
      if (stat) {
        const hrs = Number(r.horas) || 0;
        stat.horasPromedio = Math.round(hrs * 10) / 10;
        stat.diasPromedio = Math.round((hrs / 24) * 10) / 10;
        stat.muestra = Number(r.muestra) || 0;
      }
    }
    return results;
  }

  // Carga de trabajo por técnico
  private async getTechniciansWorkload(from?: Date): Promise<TechnicianWorkloadStat[]> {
    const techs = await this.userRepository.createQueryBuilder('u')
      .innerJoin('u.userRoles', 'ur')
      .innerJoin('ur.rol', 'r')
      .where('r.slug = :slug', { slug: 'tech' })
      .andWhere('u.deletedAt IS NULL')
      .select(['u.id', 'u.nombre', 'u.apellido'])
      .getMany();

    const stats: TechnicianWorkloadStat[] = [];
    for (const t of techs) {
      const [asignadasActivas, completadasPeriodo] = await Promise.all([
        this.countInWorkshopOrders({ technicianId: t.id }),
        this.countDeliveredBetween(from, undefined, { technicianId: t.id }),
      ]);
      stats.push({
        id: t.id,
        nombre: `${t.nombre} ${t.apellido || ''}`.trim(),
        asignadasActivas,
        completadasPeriodo,
      });
    }

    // Ordenar por técnicos con más órdenes activas
    return stats.sort((a, b) => b.asignadasActivas - a.asignadasActivas);
  }

  private async countDueTodayOrders(userId: number, startOfDay: Date, endOfDay: Date): Promise<number> {
    return this.orderRepository.createQueryBuilder('o')
      .leftJoin('o.estadoOrden', 'eo')
      .where('o.deletedAt IS NULL AND o.technicianId = :userId', { userId })
      .andWhere('o.fechaPrometidaEntrega >= :startOfDay AND o.fechaPrometidaEntrega < :endOfDay', { startOfDay, endOfDay })
      .andWhere("eo.nombre NOT IN ('Entrega', 'Archivados', 'Cancelada', 'Anulada')")
      .getCount();
  }

  private async countActivitiesForTech(userId: number, startOfDay: Date, endOfDay: Date): Promise<number> {
    return this.actividadRepository.createQueryBuilder('a')
      .leftJoin('a.orden', 'o')
      .where('a.deletedAt IS NULL AND o.technicianId = :userId', { userId })
      .andWhere('a.fecha >= :startOfDay AND a.fecha < :endOfDay', { startOfDay, endOfDay })
      .getCount();
  }

  private async countOrdersCreatedTodayByRecep(userId: number, startOfDay: Date, endOfDay: Date): Promise<number> {
    return this.orderRepository.createQueryBuilder('o')
      .where('o.deletedAt IS NULL AND o.recepcionistaId = :userId', { userId })
      .andWhere('o.createdAt >= :startOfDay AND o.createdAt < :endOfDay', { startOfDay, endOfDay })
      .getCount();
  }
}
