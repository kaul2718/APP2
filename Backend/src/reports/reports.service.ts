import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';

import { Order } from '../orders/entities/order.entity';
import { Presupuesto } from '../presupuesto/entities/presupuesto.entity';
import { DetallePresupuestoItem } from '../detalle-presupuesto-item/entities/detalle-presupuesto-item.entity';
import { Parte } from '../parte/entities/parte.entity';
import { User } from '../users/entities/user.entity';
import { Compra } from '../compra/entities/compra.entity';
import { ActividadTecnica } from '../actividad-tecnica/entities/actividad-tecnica.entity';
import { HistorialEstadoOrden } from '../historial-estado-orden/entities/historial-estado-orden.entity';
import { EstadoOrden } from '../estado-orden/entities/estado-orden.entity';
import { EstadoPresupuesto } from '../estado-presupuesto/entities/estado-presupuesto.entity';

import { ReportQueryDto } from './dto/report-query.dto';
import { getEcuadorDateRange, formatEcuadorDate } from './utils/date-range.util';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Presupuesto)
    private readonly presupuestoRepository: Repository<Presupuesto>,
    @InjectRepository(DetallePresupuestoItem)
    private readonly detallePresupuestoRepository: Repository<DetallePresupuestoItem>,
    @InjectRepository(Parte)
    private readonly parteRepository: Repository<Parte>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Compra)
    private readonly compraRepository: Repository<Compra>,
    @InjectRepository(ActividadTecnica)
    private readonly actividadRepository: Repository<ActividadTecnica>,
    @InjectRepository(HistorialEstadoOrden)
    private readonly historialRepository: Repository<HistorialEstadoOrden>,
    @InjectRepository(EstadoOrden)
    private readonly estadoOrdenRepository: Repository<EstadoOrden>,
    @InjectRepository(EstadoPresupuesto)
    private readonly estadoPresupuestoRepository: Repository<EstadoPresupuesto>,
  ) {}

  // =========================================================================
  // 1. REPORTE GENERAL DE ÓRDENES
  // =========================================================================
  async getOrdersReport(query: ReportQueryDto) {
    const range = getEcuadorDateRange(query.preset, query.startDate, query.endDate);
    const { from, to } = range;
    const now = new Date();

    const qb = this.orderRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.client', 'client')
      .leftJoinAndSelect('o.technician', 'technician')
      .leftJoinAndSelect('o.estadoOrden', 'eo')
      .leftJoinAndSelect('o.equipo', 'equipo')
      .leftJoinAndSelect('equipo.tipoEquipo', 'tipoEquipo')
      .leftJoinAndSelect('equipo.marca', 'marca')
      .leftJoinAndSelect('equipo.modelo', 'modelo')
      .leftJoin('o.presupuesto', 'p')
      .leftJoin('p.estado', 'ep')
      .leftJoin('p.detallesPresupuestoItems', 'd')
      .select([
        'o.id',
        'o.workOrderNumber',
        'o.tipoOrden',
        'o.createdAt',
        'o.fechaPrometidaEntrega',
        'o.problemaReportado',
        'o.esperaRepuesto',
        'client.id',
        'client.nombre',
        'client.apellido',
        'client.cedula',
        'client.telefono',
        'technician.id',
        'technician.nombre',
        'technician.apellido',
        'eo.id',
        'eo.nombre',
        'equipo.id',
        'equipo.numeroSerie',
        'tipoEquipo.nombre',
        'marca.nombre',
        'modelo.nombre',
        'ep.nombre',
      ])
      .addSelect('COALESCE(SUM(CASE WHEN ep.nombre = \'Aprobado\' THEN d.subtotal ELSE 0 END), 0)', 'montoAprobado')
      .where('o.deletedAt IS NULL');

    if (query.preset !== 'all') {
      qb.andWhere('o.createdAt >= :from AND o.createdAt < :to', { from, to });
    }

    if (query.estadoId) {
      qb.andWhere('o.estadoOrdenId = :estadoId', { estadoId: query.estadoId });
    }

    if (query.tecnicoId) {
      qb.andWhere('o.technicianId = :techId', { techId: query.tecnicoId });
    }

    if (query.tipoOrden && query.tipoOrden !== 'todos') {
      qb.andWhere('o.tipoOrden = :tipoOrden', { tipoOrden: query.tipoOrden });
    }

    if (query.search) {
      const term = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(o.workOrderNumber) LIKE :term OR LOWER(client.nombre) LIKE :term OR LOWER(client.apellido) LIKE :term OR LOWER(client.cedula) LIKE :term OR LOWER(equipo.numeroSerie) LIKE :term)',
        { term },
      );
    }

    qb.groupBy(
      'o.id, client.id, technician.id, eo.id, equipo.id, tipoEquipo.id, marca.id, modelo.id, ep.nombre',
    ).orderBy('o.createdAt', 'DESC');

    // Conteo total para paginación
    const rawAll = await qb.getRawMany();
    const total = rawAll.length;

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 25);
    const offset = (page - 1) * limit;

    const rawPaginated = rawAll.slice(offset, offset + limit);

    // Mapeo limpio para frontend y exportaciones
    const items = rawPaginated.map((r) => {
      const fechaPrometida = r.o_fechaPrometidaEntrega ? new Date(r.o_fechaPrometidaEntrega) : null;
      const estadoNombre = r.eo_nombre || 'Sin Estado';
      const esActiva = !['Entregado', 'Entrega', 'Archivados', 'Cancelada', 'Anulada'].includes(estadoNombre);
      const estaAtrasada = !['Listo para Entrega', 'Entregado', 'Entrega', 'Archivados', 'Cancelada', 'Anulada'].includes(estadoNombre) && fechaPrometida && fechaPrometida < now;

      return {
        id: r.o_id,
        workOrderNumber: r.o_workOrderNumber,
        tipoOrden: r.o_tipoOrden || 'COMPLETA',
        fechaIngreso: r.o_createdAt,
        fechaPrometidaEntrega: r.o_fechaPrometidaEntrega,
        cliente: `${r.client_nombre || ''} ${r.client_apellido || ''}`.trim() || 'Consumidor Final',
        clienteIdentificacion: r.client_cedula || 'N/A',
        clienteTelefono: r.client_telefono || 'N/A',
        tecnico: r.technician_nombre ? `${r.technician_nombre} ${r.technician_apellido || ''}`.trim() : 'Sin Asignar',
        estado: estadoNombre,
        equipoTipo: r.tipoEquipo_nombre || 'Equipo',
        marca: r.marca_nombre || 'Genérica',
        modelo: r.modelo_nombre || 'N/A',
        serie: r.equipo_numeroSerie || 'S/N',
        equipoCompleto: `${r.tipoEquipo_nombre || 'Equipo'} ${r.marca_nombre || ''} ${r.modelo_nombre || ''}`.trim(),
        problemaReportado: r.o_problemaReportado || '',
        montoAprobado: parseFloat(r.montoAprobado || '0'),
        esperaRepuesto: !!r.o_esperaRepuesto,
        atrasada: !!estaAtrasada,
      };
    });

    // KPIs calculados sobre el universo filtrado
    let totalExpress = 0;
    let totalCompletas = 0;
    let totalEnTaller = 0;
    let totalAprobadoSum = 0;
    let totalAtrasadas = 0;

    rawAll.forEach((r) => {
      if (r.o_tipoOrden === 'EXPRESS') totalExpress++;
      else totalCompletas++;

      const est = r.eo_nombre || '';
      if (!['Entregado', 'Entrega', 'Archivados', 'Cancelada', 'Anulada'].includes(est)) {
        totalEnTaller++;
      }

      const fp = r.o_fechaPrometidaEntrega ? new Date(r.o_fechaPrometidaEntrega) : null;
      if (!['Listo para Entrega', 'Entregado', 'Entrega', 'Archivados', 'Cancelada', 'Anulada'].includes(est) && fp && fp < now) {
        totalAtrasadas++;
      }

      totalAprobadoSum += parseFloat(r.montoAprobado || '0');
    });

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      dateRangeLabel: range.label,
      kpis: [
        { label: 'Total Órdenes', value: total },
        { label: 'En Taller Activo', value: totalEnTaller },
        { label: 'Express / Completas', value: `${totalExpress} / ${totalCompletas}` },
        { label: 'Presupuestos Aprobados', value: `$ ${totalAprobadoSum.toFixed(2)}` },
        { label: 'Órdenes Atrasadas', value: totalAtrasadas },
      ],
    };
  }

  // =========================================================================
  // 2. REPORTE DE EQUIPOS RECIBIDOS VS. FÍSICAMENTE ENTREGADOS
  // =========================================================================
  async getDeliveredVsReceivedReport(query: ReportQueryDto) {
    const range = getEcuadorDateRange(query.preset, query.startDate, query.endDate);
    const { from, to } = range;
    const now = new Date();

    // 1. Conteo de recibidas en el período
    const receivedQb = this.orderRepository
      .createQueryBuilder('o')
      .where('o.deletedAt IS NULL');

    if (query.preset !== 'all') {
      receivedQb.andWhere('o.createdAt >= :from AND o.createdAt < :to', { from, to });
    }
    if (query.tecnicoId) {
      receivedQb.andWhere('o.technicianId = :techId', { techId: query.tecnicoId });
    }
    if (query.tipoOrden && query.tipoOrden !== 'todos') {
      receivedQb.andWhere('o.tipoOrden = :tipoOrden', { tipoOrden: query.tipoOrden });
    }
    const totalRecibidas = await receivedQb.getCount();

    // 2. Conteo de entregas físicas verificables según historial de estado 'Entrega'
    const deliveredCountQb = this.historialRepository
      .createQueryBuilder('h')
      .innerJoin('h.estadoOrden', 'eo')
      .innerJoin('h.orden', 'o')
      .where('o.deletedAt IS NULL')
      .andWhere("eo.nombre = 'Entrega'");

    if (query.preset !== 'all') {
      deliveredCountQb.andWhere('h.fechaCambio >= :from AND h.fechaCambio < :to', { from, to });
    }
    if (query.tecnicoId) {
      deliveredCountQb.andWhere('o.technicianId = :techId', { techId: query.tecnicoId });
    }
    if (query.tipoOrden && query.tipoOrden !== 'todos') {
      deliveredCountQb.andWhere('o.tipoOrden = :tipoOrden', { tipoOrden: query.tipoOrden });
    }
    const deliveredCountRaw = await deliveredCountQb
      .select('COUNT(DISTINCT o.id)', 'count')
      .getRawOne();
    const totalEntregadas = parseInt(deliveredCountRaw?.count || '0', 10);

    // 3. Consulta de equipos correspondientes al flujo operativo del período
    // Muestra equipos ingresados en el período y/o que tuvieron entrega física en el período
    const mainQb = this.orderRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.estadoOrden', 'eo')
      .leftJoinAndSelect('o.client', 'client')
      .leftJoinAndSelect('o.technician', 'technician')
      .leftJoinAndSelect('o.equipo', 'equipo')
      .leftJoinAndSelect('equipo.tipoEquipo', 'tipoEquipo')
      .leftJoinAndSelect('equipo.marca', 'marca')
      .leftJoinAndSelect('equipo.modelo', 'modelo')
      .where('o.deletedAt IS NULL');

    if (query.preset !== 'all') {
      mainQb.andWhere(
        new Brackets((qb) => {
          qb.where('o.createdAt >= :from AND o.createdAt < :to', { from, to }).orWhere(
            'EXISTS (SELECT 1 FROM historial_estado_orden h_sub JOIN estado_orden eo_sub ON h_sub."estadoOrdenId" = eo_sub.id WHERE h_sub."ordenId" = o.id AND eo_sub.nombre = \'Entrega\' AND h_sub."fechaCambio" >= :from AND h_sub."fechaCambio" < :to)',
            { from, to }
          );
        })
      );
    }

    if (query.tecnicoId) {
      mainQb.andWhere('o.technicianId = :techId', { techId: query.tecnicoId });
    }
    if (query.tipoOrden && query.tipoOrden !== 'todos') {
      mainQb.andWhere('o.tipoOrden = :tipoOrden', { tipoOrden: query.tipoOrden });
    }

    mainQb.orderBy('o.createdAt', 'DESC');

    const totalOrders = await mainQb.getCount();

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 25);
    const offset = (page - 1) * limit;

    const orders = await mainQb.skip(offset).take(limit).getMany();

    // Obtener la fecha de entrega para cada orden de la página (si tuvo transición a 'Entrega')
    const orderIds = orders.map((o) => o.id);
    const deliveryDatesMap = new Map<number, Date>();

    if (orderIds.length > 0) {
      const deliveryHist = await this.historialRepository
        .createQueryBuilder('h')
        .innerJoin('h.estadoOrden', 'eo')
        .where('h.ordenId IN (:...orderIds)', { orderIds })
        .andWhere("eo.nombre = 'Entrega'")
        .select(['h.ordenId AS "ordenId"', 'h.fechaCambio AS "fechaCambio"'])
        .orderBy('h.fechaCambio', 'DESC')
        .getRawMany();

      deliveryHist.forEach((dh) => {
        if (!deliveryDatesMap.has(dh.ordenId)) {
          deliveryDatesMap.set(dh.ordenId, new Date(dh.fechaCambio));
        }
      });
    }

    const items = orders.map((o) => {
      const fechaIngreso = o.createdAt ? new Date(o.createdAt) : now;
      const fechaEntrega = deliveryDatesMap.get(o.id) || null;
      const endDateForDiff = fechaEntrega || now;
      const diffMs = Math.max(0, endDateForDiff.getTime() - fechaIngreso.getTime());
      const diasTaller = Math.round((diffMs / (1000 * 60 * 60 * 24)) * 10) / 10;

      const clienteNombre =
        [o.client?.nombre, o.client?.apellido].filter(Boolean).join(' ').trim() || 'Consumidor Final';
      const tecnicoNombre =
        [o.technician?.nombre, o.technician?.apellido].filter(Boolean).join(' ').trim() || 'Sin Asignar';
      const equipoStr =
        [o.equipo?.tipoEquipo?.nombre || 'Equipo', o.equipo?.marca?.nombre, o.equipo?.modelo?.nombre]
          .filter(Boolean)
          .join(' ')
          .trim();

      return {
        ordenId: o.id,
        workOrderNumber: o.workOrderNumber,
        tipoOrden: o.tipoOrden || 'COMPLETA',
        fechaIngreso: o.createdAt,
        fechaEntrega: fechaEntrega ? fechaEntrega.toISOString() : null,
        diasEstanciaTaller: diasTaller,
        estado: o.estadoOrden?.nombre || 'Recepción',
        cliente: clienteNombre,
        tecnico: tecnicoNombre,
        equipo: equipoStr,
        serie: o.equipo?.numeroSerie || 'S/N',
      };
    });

    const enTaller = Math.max(0, totalRecibidas - totalEntregadas);
    const tasaSalida = totalRecibidas > 0 ? Math.round((totalEntregadas / totalRecibidas) * 100) : 0;

    return {
      data: items,
      total: totalOrders,
      page,
      limit,
      totalPages: Math.ceil(totalOrders / limit) || 1,
      dateRangeLabel: range.label,
      kpis: [
        { label: 'Equipos Recibidos', value: totalRecibidas },
        { label: 'Físicamente Entregados', value: totalEntregadas },
        { label: 'En Proceso (Taller)', value: enTaller },
        { label: 'Tasa de Rotación / Salida', value: `${tasaSalida}%` },
      ],
      disclosure:
        'Nota operativa: Solo se contabilizan como entregas físicas las transiciones verificadas al estado "Entrega" en el historial de trazabilidad. Los archivados administrativos sin retiro físico no se computan como entregados.',
    };
  }

  // =========================================================================
  // 3. REPORTE DE ÓRDENES ATRASADAS Y TIEMPOS DE ATENCIÓN (SLA)
  // =========================================================================
  async getDelayedAndSlaReport(query: ReportQueryDto) {
    const range = getEcuadorDateRange(query.preset, query.startDate, query.endDate);
    const now = new Date();

    // 1. Órdenes activas atrasadas (fechaPrometidaEntrega < now y en taller)
    const delayedQb = this.orderRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.client', 'client')
      .leftJoinAndSelect('o.technician', 'technician')
      .leftJoinAndSelect('o.estadoOrden', 'eo')
      .leftJoinAndSelect('o.equipo', 'equipo')
      .leftJoinAndSelect('equipo.tipoEquipo', 'tipoEquipo')
      .leftJoinAndSelect('equipo.marca', 'marca')
      .where('o.deletedAt IS NULL')
      .andWhere('o.fechaPrometidaEntrega IS NOT NULL')
      .andWhere('o.fechaPrometidaEntrega < :now', { now })
      .andWhere("eo.nombre NOT IN ('Listo para Entrega', 'Entregado', 'Entrega', 'Archivados', 'Cancelada', 'Anulada')");

    if (query.tecnicoId) {
      delayedQb.andWhere('o.technicianId = :techId', { techId: query.tecnicoId });
    }
    if (query.tipoOrden && query.tipoOrden !== 'todos') {
      delayedQb.andWhere('o.tipoOrden = :tipoOrden', { tipoOrden: query.tipoOrden });
    }

    delayedQb.orderBy('o.fechaPrometidaEntrega', 'ASC');

    const delayedOrders = await delayedQb.getMany();
    const delayedItems = delayedOrders.map((o) => {
      const fechaPrometida = new Date(o.fechaPrometidaEntrega);
      const diffMs = Math.max(0, now.getTime() - fechaPrometida.getTime());
      const diasRetraso = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      return {
        id: o.id,
        workOrderNumber: o.workOrderNumber,
        tipoOrden: o.tipoOrden || 'COMPLETA',
        fechaIngreso: o.createdAt,
        fechaPrometidaEntrega: o.fechaPrometidaEntrega,
        diasRetraso,
        cliente: `${o.client?.nombre || ''} ${o.client?.apellido || ''}`.trim() || 'Cliente',
        telefono: o.client?.telefono || 'N/A',
        tecnico: o.technician?.nombre ? `${o.technician.nombre} ${o.technician.apellido || ''}`.trim() : 'Sin Asignar',
        estado: o.estadoOrden?.nombre || 'Activo',
        equipo: `${o.equipo?.tipoEquipo?.nombre || 'Equipo'} ${o.equipo?.marca?.nombre || ''}`.trim(),
        esperaRepuesto: !!o.esperaRepuesto,
      };
    });

    // 2. Tiempos promedio de atención de órdenes completadas/entregadas en el período (turnaround time)
    const tatRaw = await this.orderRepository
      .createQueryBuilder('o')
      .innerJoin('o.historialEstados', 'h')
      .innerJoin('h.estadoOrden', 'eo')
      .where('o.deletedAt IS NULL')
      .andWhere("eo.nombre IN ('Listo para Entrega', 'Entregado')")
      .select('o.tipoOrden', 'tipoOrden')
      .addSelect('COUNT(DISTINCT o.id)', 'muestra')
      .addSelect('AVG(EXTRACT(EPOCH FROM (h.fechaCambio - o.createdAt)) / 3600)', 'horas')
      .groupBy('o.tipoOrden')
      .getRawMany();

    const turnaroundStats = [
      { tipoOrden: 'EXPRESS', horasPromedio: 0, diasPromedio: 0, muestra: 0 },
      { tipoOrden: 'COMPLETA', horasPromedio: 0, diasPromedio: 0, muestra: 0 },
    ];

    tatRaw.forEach((r) => {
      const stat = turnaroundStats.find((s) => s.tipoOrden === (r.tipoOrden || '').toUpperCase());
      if (stat) {
        const hrs = parseFloat(r.horas || '0');
        stat.horasPromedio = Math.round(hrs * 10) / 10;
        stat.diasPromedio = Math.round((hrs / 24) * 10) / 10;
        stat.muestra = parseInt(r.muestra || '0', 10);
      }
    });

    return {
      delayedOrders: delayedItems,
      totalAtrasadas: delayedItems.length,
      turnaroundStats,
      dateRangeLabel: range.label,
      kpis: [
        { label: 'Órdenes Atrasadas Activas', value: delayedItems.length },
        {
          label: 'TAT Express Promedio',
          value: `${turnaroundStats[0].horasPromedio} hrs (${turnaroundStats[0].muestra} órdenes)`,
        },
        {
          label: 'TAT Completo Promedio',
          value: `${turnaroundStats[1].diasPromedio} días (${turnaroundStats[1].muestra} órdenes)`,
        },
        {
          label: 'En Espera de Repuesto',
          value: delayedItems.filter((o) => o.esperaRepuesto).length,
        },
      ],
      disclosure:
        'Aclaración SLA: El tiempo promedio de atención representa el ciclo total de permanencia en taller desde la recepción hasta su finalización/entrega. No debe confundirse con horas hombre efectivas registradas por técnicos.',
    };
  }

  // =========================================================================
  // 4. REPORTE DE PRESUPUESTOS Y TASA DE CONVERSIÓN
  // =========================================================================
  async getBudgetsReport(query: ReportQueryDto) {
    const range = getEcuadorDateRange(query.preset, query.startDate, query.endDate);
    const { from, to } = range;

    // Consulta única agregada SIN N+1
    const qb = this.presupuestoRepository
      .createQueryBuilder('p')
      .leftJoin('p.orden', 'o')
      .leftJoin('o.client', 'c')
      .leftJoin('p.estado', 'ep')
      .leftJoin('p.detallesPresupuestoItems', 'd', 'd.deletedAt IS NULL')
      .leftJoin('d.parte', 'parte')
      .leftJoin('parte.categoria', 'cat_parte')
      .select([
        'p.id AS presupuesto_id',
        'p.createdAt AS fecha_emision',
        'p.descripcion AS descripcion',
        'o.id AS orden_id',
        'o.workOrderNumber AS numero_orden',
        'c.nombre AS cliente_nombre',
        'c.apellido AS cliente_apellido',
        'c.cedula AS cliente_cedula',
        'ep.id AS estado_id',
        'ep.nombre AS estado_nombre',
        'COALESCE(SUM(CASE WHEN d.parteId IS NOT NULL AND (parte.unidadMedida != \'Servicio\' AND (cat_parte.nombre IS NULL OR LOWER(cat_parte.nombre) != \'servicio\')) THEN d.subtotal ELSE 0 END), 0) AS monto_repuestos',
        'COALESCE(SUM(CASE WHEN d.parteId IS NULL OR parte.unidadMedida = \'Servicio\' OR LOWER(cat_parte.nombre) = \'servicio\' THEN d.subtotal ELSE 0 END), 0) AS monto_servicios',
        'COALESCE(SUM(d.subtotal), 0) AS subtotal',
        'COALESCE(SUM(d.subtotal * 0.15), 0) AS iva',
        'COALESCE(SUM(d.subtotal * 1.15), 0) AS total',
      ])
      .where('p.deletedAt IS NULL');

    if (query.preset !== 'all') {
      qb.andWhere('p.createdAt >= :from AND p.createdAt < :to', { from, to });
    }

    if (query.estadoId) {
      qb.andWhere('p.estadoId = :estadoId', { estadoId: query.estadoId });
    }

    if (query.search) {
      const term = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(o.workOrderNumber) LIKE :term OR LOWER(c.nombre) LIKE :term OR LOWER(c.apellido) LIKE :term OR LOWER(c.cedula) LIKE :term)',
        { term },
      );
    }

    qb.groupBy('p.id, o.id, c.id, ep.id').orderBy('p.createdAt', 'DESC');

    const rawBudgets = await qb.getRawMany();
    const total = rawBudgets.length;

    // Métricas financieras reales y verificables
    let montoCotizadoTotal = 0;
    let montoAprobadoTotal = 0;
    let montoRechazadoTotal = 0;
    let montoPendienteTotal = 0;

    let totalEmitidos = total;
    let aprobadosCount = 0;
    let rechazadosCount = 0;
    let pendientesCount = 0;

    const items = rawBudgets.map((r) => {
      const subtotal = parseFloat(r.subtotal || '0');
      const montoRepuestos = parseFloat(r.monto_repuestos || '0');
      const montoServicios = parseFloat(r.monto_servicios || '0');
      const iva = parseFloat(r.iva || '0');
      const totalMonto = parseFloat(r.total || '0');
      const estado = r.estado_nombre || 'Pendiente';

      montoCotizadoTotal += subtotal;

      if (estado.toLowerCase().includes('aprob')) {
        aprobadosCount++;
        montoAprobadoTotal += subtotal;
      } else if (estado.toLowerCase().includes('rechaz') || estado.toLowerCase().includes('cancel')) {
        rechazadosCount++;
        montoRechazadoTotal += subtotal;
      } else {
        pendientesCount++;
        montoPendienteTotal += subtotal;
      }

      return {
        id: r.presupuesto_id,
        numeroPresupuesto: `PRE-${String(r.presupuesto_id).padStart(5, '0')}`,
        workOrderNumber: r.numero_orden || 'Sin ODS',
        fechaEmision: r.fecha_emision,
        cliente: `${r.cliente_nombre || ''} ${r.cliente_apellido || ''}`.trim() || 'Cliente',
        clienteCedula: r.cliente_cedula || 'N/A',
        estado,
        montoRepuestos,
        montoServicios,
        subtotal,
        iva,
        total: totalMonto,
      };
    });

    const tasaAprobacion = totalEmitidos > 0 ? Math.round((aprobadosCount / totalEmitidos) * 100) : 0;

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 25);
    const offset = (page - 1) * limit;

    return {
      data: items.slice(offset, offset + limit),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      dateRangeLabel: range.label,
      kpis: [
        { label: 'Monto Total Cotizado', value: `$ ${montoCotizadoTotal.toFixed(2)}` },
        { label: 'Monto Presupuestos Aprobados', value: `$ ${montoAprobadoTotal.toFixed(2)}` },
        { label: 'Tasa de Aprobación', value: `${tasaAprobacion}% (${aprobadosCount}/${totalEmitidos})` },
        { label: 'Pendientes / Rechazados', value: `${pendientesCount} / ${rechazadosCount}` },
      ],
      disclosure:
        'Nota de transparencia contable: El monto aprobado representa presupuestos con autorización formal del cliente. No se contabiliza como ingreso en caja hasta su liquidación de pago.',
    };
  }

  // =========================================================================
  // 5. REPORTE DE INVENTARIO, STOCK CRÍTICO Y CONSUMO REAL
  // =========================================================================
  async getInventoryReport(query: ReportQueryDto) {
    const range = getEcuadorDateRange(query.preset, query.startDate, query.endDate);
    const { from, to } = range;
    const tipoItem = query.tipoItem || 'productos';

    const qb = this.parteRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.categoria', 'cat')
      .where('p.deletedAt IS NULL AND p.estado = true');

    // Filtro por tipo de ítem: productos físicos vs servicios técnicos vs todos
    if (tipoItem === 'servicios') {
      qb.andWhere("(p.unidadMedida = 'Servicio' OR LOWER(cat.nombre) = 'servicio')");
    } else if (tipoItem === 'productos') {
      qb.andWhere("(p.unidadMedida != 'Servicio' AND (cat.nombre IS NULL OR LOWER(cat.nombre) != 'servicio'))");
      if (query.filtroStock === 'critico') {
        qb.andWhere('p.stock <= p.stockMinimo AND p.stock > 0');
      } else if (query.filtroStock === 'agotado') {
        qb.andWhere('p.stock = 0');
      } else if (query.filtroStock === 'disponible') {
        qb.andWhere('p.stock > p.stockMinimo');
      }
    } else {
      // 'todos'
      if (query.filtroStock === 'critico') {
        qb.andWhere(
          "(p.unidadMedida != 'Servicio' AND (cat.nombre IS NULL OR LOWER(cat.nombre) != 'servicio')) AND p.stock <= p.stockMinimo AND p.stock > 0",
        );
      } else if (query.filtroStock === 'agotado') {
        qb.andWhere(
          "(p.unidadMedida != 'Servicio' AND (cat.nombre IS NULL OR LOWER(cat.nombre) != 'servicio')) AND p.stock = 0",
        );
      } else if (query.filtroStock === 'disponible') {
        qb.andWhere(
          "(p.unidadMedida != 'Servicio' AND (cat.nombre IS NULL OR LOWER(cat.nombre) != 'servicio')) AND p.stock > p.stockMinimo",
        );
      }
    }

    if (query.search) {
      const term = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere('(LOWER(p.nombre) LIKE :term OR LOWER(p.codigoInterno) LIKE :term)', { term });
    }

    if (tipoItem === 'servicios') {
      qb.orderBy('p.nombre', 'ASC');
    } else {
      qb.orderBy('p.stock', 'DESC').addOrderBy('p.nombre', 'ASC');
    }

    const allParts = await qb.getMany();
    const total = allParts.length;

    // 1. Estadísticas globales exactas y verificables del inventario físico (excluyendo servicios)
    const physicalStatsRaw = await this.parteRepository
      .createQueryBuilder('p')
      .leftJoin('p.categoria', 'cat')
      .where('p.deletedAt IS NULL AND p.estado = true')
      .andWhere("(p.unidadMedida != 'Servicio' AND (cat.nombre IS NULL OR LOWER(cat.nombre) != 'servicio'))")
      .select([
        'COUNT(p.id) AS total_fisico',
        'COALESCE(SUM(p.stock), 0) AS stock_total_fisico',
        'COALESCE(SUM(p.stock * p.costo), 0) AS valor_costo_fisico',
        'COALESCE(SUM(p.stock * p.precio1), 0) AS valor_venta_fisico',
        'COUNT(CASE WHEN p.stock = 0 THEN 1 END) AS agotados_count',
        'COUNT(CASE WHEN p.stock <= p.stockMinimo AND p.stock > 0 THEN 1 END) AS criticos_count',
        'COUNT(CASE WHEN p.stock > 0 AND (p.costo IS NULL OR p.costo = 0) THEN 1 END) AS sin_costo_count',
      ])
      .getRawOne();

    const totalProductosFisicos = parseInt(physicalStatsRaw?.total_fisico || '0', 10);
    const stockTotalFisico = parseFloat(physicalStatsRaw?.stock_total_fisico || '0');
    const valorTotalCosto = parseFloat(physicalStatsRaw?.valor_costo_fisico || '0');
    const valorTotalVenta = parseFloat(physicalStatsRaw?.valor_venta_fisico || '0');
    const criticosCount = parseInt(physicalStatsRaw?.criticos_count || '0', 10);
    const agotadosCount = parseInt(physicalStatsRaw?.agotados_count || '0', 10);
    const sinCostoConStockCount = parseInt(physicalStatsRaw?.sin_costo_count || '0', 10);

    // 2. Estadísticas de servicios técnicos comerciales
    const servicesStatsRaw = await this.parteRepository
      .createQueryBuilder('p')
      .leftJoin('p.categoria', 'cat')
      .where('p.deletedAt IS NULL AND p.estado = true')
      .andWhere("(p.unidadMedida = 'Servicio' OR LOWER(cat.nombre) = 'servicio')")
      .select([
        'COUNT(p.id) AS total_servicios',
        'COALESCE(AVG(p.precio1), 0) AS tarifa_promedio',
        'COALESCE(MAX(p.precio1), 0) AS tarifa_maxima',
        'COALESCE(MIN(p.precio1), 0) AS tarifa_minima',
      ])
      .getRawOne();

    const totalServicios = parseInt(servicesStatsRaw?.total_servicios || '0', 10);
    const tarifaPromedio = parseFloat(servicesStatsRaw?.tarifa_promedio || '0');
    const tarifaMaxima = parseFloat(servicesStatsRaw?.tarifa_maxima || '0');
    const tarifaMinima = parseFloat(servicesStatsRaw?.tarifa_minima || '0');

    // Mapeo detallado de filas
    const items = allParts.map((p) => {
      const isService = p.unidadMedida === 'Servicio' || p.categoria?.nombre?.toLowerCase() === 'servicio';
      const costo = Number(p.costo || 0);
      const precio = Number(p.precio1 || 0);
      const tieneCostoRegistrado = costo > 0;

      if (isService) {
        return {
          id: p.id,
          codigo: p.codigoInterno || `SRV-${p.id}`,
          nombre: p.nombre,
          categoria: p.categoria?.nombre || 'Servicio',
          esServicio: true,
          tipoItem: 'Servicio',
          stock: null,
          stockMinimo: null,
          costoUnitario: costo,
          precioVenta: precio,
          valorInventarioCosto: 0,
          valorInventarioVenta: 0,
          estadoStock: 'Disponible',
          tieneCostoRegistrado,
          disponibilidadComercial: 'Tarifa Activa',
        };
      }

      const stock = Number(p.stock || 0);
      const stockMin = Number(p.stockMinimo || 0);
      const valorCosto = stock * costo;
      const valorVenta = stock * precio;

      return {
        id: p.id,
        codigo: p.codigoInterno || `PAR-${p.id}`,
        nombre: p.nombre,
        categoria: p.categoria?.nombre || 'General',
        esServicio: false,
        tipoItem: 'Producto',
        stock,
        stockMinimo: stockMin,
        costoUnitario: costo,
        precioVenta: precio,
        valorInventarioCosto: valorCosto,
        valorInventarioVenta: valorVenta,
        estadoStock: stock === 0 ? 'Agotado' : stock <= stockMin ? 'Crítico' : 'Disponible',
        tieneCostoRegistrado,
        disponibilidadComercial: stock > 0 ? 'En Stock' : 'Sin Stock',
      };
    });

    // 3. Consumo real de repuestos físicos en el período (solo órdenes con presupuesto Aprobado)
    const consumptionQb = this.detallePresupuestoRepository
      .createQueryBuilder('d')
      .innerJoin('d.presupuesto', 'pres')
      .innerJoin('pres.estado', 'ep')
      .innerJoin('d.parte', 'p')
      .leftJoin('p.categoria', 'cat')
      .where("ep.nombre = 'Aprobado'")
      .andWhere('d.deletedAt IS NULL')
      .andWhere("(p.unidadMedida != 'Servicio' AND (cat.nombre IS NULL OR LOWER(cat.nombre) != 'servicio'))");

    if (query.preset !== 'all') {
      consumptionQb.andWhere('pres.createdAt >= :from AND pres.createdAt < :to', { from, to });
    }

    const consumptionRaw = await consumptionQb
      .select([
        'p.id AS parte_id',
        'p.nombre AS nombre',
        'p.codigoInterno AS codigo',
        'SUM(d.cantidad) AS cantidad_consumida',
        'SUM(d.subtotal) AS monto_total',
      ])
      .groupBy('p.id, p.nombre, p.codigoInterno')
      .orderBy('cantidad_consumida', 'DESC')
      .limit(10)
      .getRawMany();

    const topConsumed = consumptionRaw.map((r) => ({
      parteId: r.parte_id,
      nombre: r.nombre,
      codigo: r.codigo || 'S/C',
      cantidadConsumida: parseInt(r.cantidad_consumida || '0', 10),
      montoTotal: parseFloat(r.monto_total || '0'),
    }));

    // 4. Servicios técnicos más ejecutados en el período (en órdenes con presupuesto Aprobado)
    const servicesUsageQb = this.detallePresupuestoRepository
      .createQueryBuilder('d')
      .innerJoin('d.presupuesto', 'pres')
      .innerJoin('pres.estado', 'ep')
      .innerJoin('d.parte', 'p')
      .leftJoin('p.categoria', 'cat')
      .where("ep.nombre = 'Aprobado'")
      .andWhere('d.deletedAt IS NULL')
      .andWhere("(p.unidadMedida = 'Servicio' OR LOWER(cat.nombre) = 'servicio')");

    if (query.preset !== 'all') {
      servicesUsageQb.andWhere('pres.createdAt >= :from AND pres.createdAt < :to', { from, to });
    }

    const servicesUsageRaw = await servicesUsageQb
      .select([
        'p.id AS parte_id',
        'p.nombre AS nombre',
        'p.codigoInterno AS codigo',
        'SUM(d.cantidad) AS cantidad_realizada',
        'SUM(d.subtotal) AS monto_total',
      ])
      .groupBy('p.id, p.nombre, p.codigoInterno')
      .orderBy('cantidad_realizada', 'DESC')
      .limit(10)
      .getRawMany();

    const topServices = servicesUsageRaw.map((r) => ({
      parteId: r.parte_id,
      nombre: r.nombre,
      codigo: r.codigo || 'S/C',
      cantidadRealizada: parseInt(r.cantidad_realizada || '0', 10),
      montoTotal: parseFloat(r.monto_total || '0'),
    }));

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 25);
    const offset = (page - 1) * limit;

    let kpis = [];
    let disclosure = '';

    if (tipoItem === 'servicios') {
      kpis = [
        { label: 'Servicios en Catálogo', value: `${totalServicios} servicios` },
        { label: 'Tarifa Promedio (Mano de Obra)', value: `$ ${tarifaPromedio.toFixed(2)}` },
        { label: 'Tarifa Rango (Mín / Máx)', value: `$ ${tarifaMinima.toFixed(2)} - $ ${tarifaMaxima.toFixed(2)}` },
        { label: 'Disponibilidad Comercial', value: '100% Activos' },
      ];
      disclosure =
        'Transparencia contable: Los servicios técnicos corresponden a mano de obra y diagnósticos tarifados para presupuestos. No participan en stock físico, stock mínimo ni valoración de almacén.';
    } else {
      kpis = [
        { label: 'Valoración Físico a Costo', value: `$ ${valorTotalCosto.toFixed(2)}` },
        { label: 'Valor Estimado a Venta (PVP)', value: `$ ${valorTotalVenta.toFixed(2)}` },
        { label: 'Stock Total en Almacén', value: `${stockTotalFisico} uds. (${totalProductosFisicos} productos)` },
        { label: 'Stock Crítico / Agotado', value: `${criticosCount} / ${agotadosCount}` },
      ];
      disclosure = `Transparencia contable: La valoración de almacén refleja únicamente existencias físicas reales de repuestos y productos.${
        sinCostoConStockCount > 0
          ? ` Nota: Se detectaron ${sinCostoConStockCount} productos con existencias físicas pero con costo unitario en $0.00 (sin costo registrado).`
          : ''
      }`;
    }

    return {
      data: items.slice(offset, offset + limit),
      topConsumed,
      topServices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      dateRangeLabel: range.label,
      tipoItem,
      kpis,
      disclosure,
    };
  }

  // =========================================================================
  // 6. REPORTE DE PRODUCTIVIDAD Y CARGA DE TRABAJO POR TÉCNICO
  // =========================================================================
  async getTechniciansReport(query: ReportQueryDto) {
    const range = getEcuadorDateRange(query.preset, query.startDate, query.endDate);
    const { from, to } = range;
    const now = new Date();

    // Obtener todos los técnicos activos del sistema
    const techs = await this.userRepository
      .createQueryBuilder('u')
      .innerJoin('u.userRoles', 'ur')
      .innerJoin('ur.rol', 'r')
      .where('r.slug = :slug', { slug: 'tech' })
      .andWhere('u.deletedAt IS NULL')
      .select(['u.id', 'u.nombre', 'u.apellido', 'u.correo'])
      .getMany();

    const technicianStats = [];

    for (const t of techs) {
      // 1. Carga activa actual en taller (asignadas en proceso)
      const cargaActiva = await this.orderRepository
        .createQueryBuilder('o')
        .leftJoin('o.estadoOrden', 'eo')
        .where('o.deletedAt IS NULL')
        .andWhere('o.technicianId = :techId', { techId: t.id })
        .andWhere("eo.nombre NOT IN ('Listo para Entrega', 'Entregado', 'Entrega', 'Archivados', 'Cancelada', 'Anulada')")
        .getCount();

      // 2. Órdenes finalizadas/entregadas en el período
      const completadasRaw = await this.historialRepository
        .createQueryBuilder('h')
        .innerJoin('h.estadoOrden', 'eo')
        .innerJoin('h.orden', 'o')
        .where('o.deletedAt IS NULL')
        .andWhere('o.technicianId = :techId', { techId: t.id })
        .andWhere("eo.nombre IN ('Listo para Entrega', 'Entregado')")
        .andWhere('h.fechaCambio >= :from AND h.fechaCambio < :to', { from, to })
        .select('COUNT(DISTINCT o.id)', 'cnt')
        .getRawOne();
      const completadas = parseInt(completadasRaw?.cnt || '0', 10);

      // 3. Actividades técnicas registradas en el período
      const actividadesCount = await this.actividadRepository
        .createQueryBuilder('a')
        .innerJoin('a.orden', 'o')
        .where('o.technicianId = :techId', { techId: t.id })
        .andWhere('a.fecha >= :from AND a.fecha < :to', { from, to })
        .getCount();

      // 4. Órdenes atrasadas asignadas
      const atrasadas = await this.orderRepository
        .createQueryBuilder('o')
        .leftJoin('o.estadoOrden', 'eo')
        .where('o.deletedAt IS NULL')
        .andWhere('o.technicianId = :techId', { techId: t.id })
        .andWhere('o.fechaPrometidaEntrega IS NOT NULL')
        .andWhere('o.fechaPrometidaEntrega < :now', { now })
        .andWhere("eo.nombre NOT IN ('Listo para Entrega', 'Entregado', 'Entrega', 'Archivados', 'Cancelada', 'Anulada')")
        .getCount();

      technicianStats.push({
        id: t.id,
        nombre: `${t.nombre || ''} ${t.apellido || ''}`.trim() || 'Técnico',
        email: t.correo,
        cargaActivaTaller: cargaActiva,
        completadasPeriodo: completadas,
        actividadesRegistradas: actividadesCount,
        ordenesAtrasadas: atrasadas,
      });
    }

    // Listado de actividades técnicas recientes del período
    const recentActivitiesRaw = await this.actividadRepository
      .createQueryBuilder('a')
      .innerJoinAndSelect('a.orden', 'o')
      .leftJoinAndSelect('o.technician', 'tech')
      .leftJoinAndSelect('a.tipoActividad', 'tipoAct')
      .where('a.fecha >= :from AND a.fecha < :to', { from, to })
      .orderBy('a.fecha', 'DESC')
      .limit(20)
      .getMany();

    const activitiesList = recentActivitiesRaw.map((a) => ({
      id: a.id,
      fecha: a.fecha,
      workOrderNumber: a.orden?.workOrderNumber || 'S/N',
      tecnico: a.orden?.technician ? `${a.orden.technician.nombre} ${a.orden.technician.apellido || ''}`.trim() : 'N/A',
      tipoActividad: a.tipoActividad?.nombre || 'Intervención Técnica',
      diagnostico: a.diagnostico || '',
      trabajoRealizado: a.trabajoRealizado || '',
    }));

    return {
      technicians: technicianStats,
      recentActivities: activitiesList,
      dateRangeLabel: range.label,
      kpis: [
        { label: 'Técnicos Activos', value: techs.length },
        { label: 'Total Órdenes en Proceso', value: technicianStats.reduce((a, b) => a + b.cargaActivaTaller, 0) },
        { label: 'Órdenes Completadas Período', value: technicianStats.reduce((a, b) => a + b.completadasPeriodo, 0) },
        { label: 'Intervenciones Técnicas', value: technicianStats.reduce((a, b) => a + b.actividadesRegistradas, 0) },
      ],
    };
  }

  // =========================================================================
  // 7. REPORTE DE CLIENTES Y EQUIPOS RECURRENTES
  // =========================================================================
  async getRecurringClientsReport(query: ReportQueryDto) {
    const range = getEcuadorDateRange(query.preset, query.startDate, query.endDate);

    // 1. Clientes frecuentes con múltiples órdenes
    const clientsRaw = await this.userRepository
      .createQueryBuilder('u')
      .innerJoin('u.clientOrders', 'o')
      .where('u.deletedAt IS NULL')
      .andWhere('o.deletedAt IS NULL')
      .select([
        'u.id AS cliente_id',
        'u.nombre AS nombre',
        'u.apellido AS apellido',
        'u.cedula AS cedula',
        'u.telefono AS telefono',
        'u.correo AS email',
        'COUNT(o.id) AS total_ordenes',
        'MAX(o.createdAt) AS ultimo_ingreso',
      ])
      .groupBy('u.id, u.nombre, u.apellido, u.cedula, u.telefono, u.correo')
      .having('COUNT(o.id) > 1')
      .orderBy('total_ordenes', 'DESC')
      .limit(50)
      .getRawMany();

    const recurringClients = clientsRaw.map((r) => ({
      clienteId: r.cliente_id,
      nombre: `${r.nombre || ''} ${r.apellido || ''}`.trim() || 'Cliente',
      identificacion: r.cedula || 'N/A',
      telefono: r.telefono || 'N/A',
      email: r.email || 'N/A',
      totalOrdenes: parseInt(r.total_ordenes || '0', 10),
      ultimoIngreso: r.ultimo_ingreso,
    }));

    // 2. Equipos recurrentes (mismo número de serie con más de 1 orden)
    const recurringEquipmentRaw = await this.orderRepository
      .createQueryBuilder('o')
      .innerJoin('o.equipo', 'eq')
      .leftJoin('eq.tipoEquipo', 'te')
      .leftJoin('eq.marca', 'm')
      .leftJoin('eq.modelo', 'mod')
      .where('o.deletedAt IS NULL')
      .select([
        'eq.id AS equipo_id',
        'eq.numeroSerie AS numero_serie',
        'te.nombre AS tipo_equipo',
        'm.nombre AS marca',
        'mod.nombre AS modelo',
        'COUNT(o.id) AS ingresos_taller',
        'MAX(o.createdAt) AS ultimo_servicio',
      ])
      .groupBy('eq.id, eq.numeroSerie, te.nombre, m.nombre, mod.nombre')
      .having('COUNT(o.id) > 1')
      .orderBy('ingresos_taller', 'DESC')
      .limit(50)
      .getRawMany();

    const recurringEquipment = recurringEquipmentRaw.map((r) => ({
      equipoId: r.equipo_id,
      numeroSerie: r.numero_serie || 'S/N',
      tipoEquipo: r.tipo_equipo || 'Equipo',
      marca: r.marca || 'N/A',
      modelo: r.modelo || 'N/A',
      ingresosTaller: parseInt(r.ingresos_taller || '0', 10),
      ultimoServicio: r.ultimo_servicio,
    }));

    return {
      recurringClients,
      recurringEquipment,
      dateRangeLabel: range.label,
      kpis: [
        { label: 'Clientes Recurrentes', value: recurringClients.length },
        { label: 'Equipos Reingresados', value: recurringEquipment.length },
      ],
      disclosure:
        'Nota técnica: Los reingresos identifican frecuencia histórica por número de serie del equipo. No deben interpretarse automáticamente como garantías a menos que exista un diagnóstico técnico oficial de reincidencia de falla.',
    };
  }

  // =========================================================================
  // 8. REPORTE DE COMPRAS A PROVEEDORES
  // =========================================================================
  async getPurchasesReport(query: ReportQueryDto) {
    const range = getEcuadorDateRange(query.preset, query.startDate, query.endDate);
    const { from, to } = range;

    const qb = this.compraRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.proveedor', 'prov')
      .leftJoinAndSelect('c.usuario', 'user')
      .orderBy('c.fecha', 'DESC');

    if (query.preset !== 'all') {
      qb.andWhere('c.fecha >= :from AND c.fecha < :to', { from, to });
    }

    if (query.search) {
      const term = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere('(LOWER(c.numeroFactura) LIKE :term OR LOWER(prov.nombre) LIKE :term)', { term });
    }

    const allPurchases = await qb.getMany();
    const total = allPurchases.length;

    let subtotalSum = 0;
    let ivaSum = 0;
    let totalSum = 0;

    const items = allPurchases.map((c) => {
      const subtotal = Number(c.subtotal || 0);
      const iva = Number(c.ivaMonto || 0);
      const tot = Number(c.total || 0);

      subtotalSum += subtotal;
      ivaSum += iva;
      totalSum += tot;

      return {
        id: c.id,
        numeroFactura: c.numeroFactura,
        fecha: c.fecha,
        proveedor: c.proveedor?.nombre || 'Proveedor Desconocido',
        proveedorRuc: c.proveedor?.ruc_nit || 'N/A',
        estado: c.estado || 'Completado',
        subtotal,
        ivaMonto: iva,
        total: tot,
        registradoPor: c.usuario?.nombre ? `${c.usuario.nombre} ${c.usuario.apellido || ''}`.trim() : 'Sistema',
      };
    });

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 25);
    const offset = (page - 1) * limit;

    return {
      data: items.slice(offset, offset + limit),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      dateRangeLabel: range.label,
      kpis: [
        { label: 'Total Compras Realizadas', value: `$ ${totalSum.toFixed(2)}` },
        { label: 'Subtotal sin Impuestos', value: `$ ${subtotalSum.toFixed(2)}` },
        { label: 'IVA Pagado', value: `$ ${ivaSum.toFixed(2)}` },
        { label: 'Facturas Registradas', value: total },
      ],
    };
  }

  // =========================================================================
  // 9. RESUMEN EJECUTIVO GENERAL (METRICAS CONSOLIDADAS)
  // =========================================================================
  async getExecutiveSummary(query: ReportQueryDto) {
    const range = getEcuadorDateRange(query.preset, query.startDate, query.endDate);
    const { from, to } = range;
    const now = new Date();

    const [
      totalIngresadas,
      totalEnTaller,
      entregadasRaw,
      presupuestosRaw,
      comprasRaw,
      atrasadasCount,
    ] = await Promise.all([
      // Ingresadas en período
      this.orderRepository
        .createQueryBuilder('o')
        .where('o.deletedAt IS NULL')
        .andWhere(query.preset !== 'all' ? 'o.createdAt >= :from AND o.createdAt < :to' : '1=1', { from, to })
        .getCount(),

      // En taller activo hoy
      this.orderRepository
        .createQueryBuilder('o')
        .leftJoin('o.estadoOrden', 'eo')
        .where('o.deletedAt IS NULL')
        .andWhere("eo.nombre NOT IN ('Entregado', 'Entrega', 'Archivados', 'Cancelada', 'Anulada')")
        .getCount(),

      // Entregadas físicamente en período
      this.historialRepository
        .createQueryBuilder('h')
        .innerJoin('h.estadoOrden', 'eo')
        .innerJoin('h.orden', 'o')
        .where('o.deletedAt IS NULL')
        .andWhere("eo.nombre = 'Entregado'")
        .andWhere(query.preset !== 'all' ? 'h.fechaCambio >= :from AND h.fechaCambio < :to' : '1=1', { from, to })
        .select('COUNT(DISTINCT o.id)', 'cnt')
        .getRawOne(),

      // Presupuestos aprobados en período
      this.presupuestoRepository
        .createQueryBuilder('p')
        .innerJoin('p.estado', 'ep')
        .innerJoin('p.detallesPresupuestoItems', 'd')
        .where('p.deletedAt IS NULL')
        .andWhere("ep.nombre = 'Aprobado'")
        .andWhere(query.preset !== 'all' ? 'p.createdAt >= :from AND p.createdAt < :to' : '1=1', { from, to })
        .select('SUM(d.subtotal)', 'subtotal')
        .getRawOne(),

      // Compras en período
      this.compraRepository
        .createQueryBuilder('c')
        .where(query.preset !== 'all' ? 'c.fecha >= :from AND c.fecha < :to' : '1=1', { from, to })
        .select('SUM(c.total)', 'total')
        .getRawOne(),

      // Órdenes atrasadas activas
      this.orderRepository
        .createQueryBuilder('o')
        .leftJoin('o.estadoOrden', 'eo')
        .where('o.deletedAt IS NULL')
        .andWhere('o.fechaPrometidaEntrega IS NOT NULL')
        .andWhere('o.fechaPrometidaEntrega < :now', { now })
        .andWhere("eo.nombre NOT IN ('Listo para Entrega', 'Entregado', 'Entrega', 'Archivados', 'Cancelada', 'Anulada')")
        .getCount(),
    ]);

    const entregadas = parseInt(entregadasRaw?.cnt || '0', 10);
    const montoPresupuestosAprobados = parseFloat(presupuestosRaw?.subtotal || '0');
    const totalCompras = parseFloat(comprasRaw?.total || '0');

    return {
      dateRangeLabel: range.label,
      kpis: [
        { key: 'ingresadas', label: 'Órdenes Ingresadas', value: totalIngresadas },
        { key: 'en-taller', label: 'Equipos en Taller', value: totalEnTaller },
        { key: 'entregadas', label: 'Entregadas en Período', value: entregadas },
        { key: 'atrasadas', label: 'Órdenes Atrasadas', value: atrasadasCount },
        { key: 'presupuestos-aprobados', label: 'Presupuestos Aprobados', value: `$ ${montoPresupuestosAprobados.toFixed(2)}` },
        { key: 'compras-periodo', label: 'Compras a Proveedores', value: `$ ${totalCompras.toFixed(2)}` },
      ],
    };
  }

  // =========================================================================
  // 10. LISTAS AUXILIARES PARA FILTROS COMBINABLES
  // =========================================================================
  async getFilterOptions() {
    const [estados, tecnicos] = await Promise.all([
      this.estadoOrdenRepository.find({
        where: { estado: true },
        select: ['id', 'nombre'],
        order: { nombre: 'ASC' },
      }),
      this.userRepository
        .createQueryBuilder('u')
        .innerJoin('u.userRoles', 'ur')
        .innerJoin('ur.rol', 'r')
        .where('r.slug = :slug', { slug: 'tech' })
        .andWhere('u.deletedAt IS NULL')
        .select(['u.id', 'u.nombre', 'u.apellido'])
        .orderBy('u.nombre', 'ASC')
        .getMany(),
    ]);

    const estadosPresupuesto = await this.estadoPresupuestoRepository.find({
      select: ['id', 'nombre'],
      order: { nombre: 'ASC' },
    });

    return {
      estados: estados.map((e) => ({ id: e.id, label: e.nombre })),
      tecnicos: tecnicos.map((t) => ({
        id: t.id,
        label: `${t.nombre || ''} ${t.apellido || ''}`.trim(),
      })),
      estadosPresupuesto: estadosPresupuesto.map((ep) => ({ id: ep.id, label: ep.nombre })),
      tiposOrden: [
        { id: 'todos', label: 'Todos los tipos' },
        { id: 'EXPRESS', label: 'Express' },
        { id: 'COMPLETA', label: 'Completa' },
      ],
      filtrosStock: [
        { id: 'todos', label: 'Todos' },
        { id: 'critico', label: 'Stock Crítico' },
        { id: 'agotado', label: 'Agotado (0)' },
        { id: 'disponible', label: 'Disponible' },
      ],
    };
  }
}
