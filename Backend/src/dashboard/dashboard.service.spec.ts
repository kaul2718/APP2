/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { Order } from '../orders/entities/order.entity';
import { Presupuesto } from '../presupuesto/entities/presupuesto.entity';
import { Notificacion } from '../notificacion/entities/notificacion.entity';
import { Parte } from '../parte/entities/parte.entity';
import { ActividadTecnica } from '../actividad-tecnica/entities/actividad-tecnica.entity';
import { HistorialEstadoOrden } from '../historial-estado-orden/entities/historial-estado-orden.entity';
import { User } from '../users/entities/user.entity';

describe('DashboardService', () => {
  let service: DashboardService;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(5),
    getMany: jest.fn().mockResolvedValue([
      {
        id: 1,
        workOrderNumber: '00001',
        client: { nombre: 'Juan', apellido: 'Perez' },
        technician: { nombre: 'Carlos', apellido: 'Pacheco' },
        estadoOrden: { nombre: 'Diagnóstico' },
        createdAt: new Date(),
      },
    ]),
    getRawOne: jest.fn().mockResolvedValue({ cnt: '3' }),
    getRawMany: jest.fn().mockResolvedValue([
      { label: 'Diagnóstico', value: '5' },
      { label: 'Reparación', value: '3' },
    ]),
  };

  const createMockRepo = () => ({
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Order), useValue: createMockRepo() },
        { provide: getRepositoryToken(Presupuesto), useValue: createMockRepo() },
        { provide: getRepositoryToken(Notificacion), useValue: createMockRepo() },
        { provide: getRepositoryToken(Parte), useValue: createMockRepo() },
        { provide: getRepositoryToken(ActividadTecnica), useValue: createMockRepo() },
        { provide: getRepositoryToken(HistorialEstadoOrden), useValue: createMockRepo() },
        { provide: getRepositoryToken(User), useValue: createMockRepo() },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAdminDashboard', () => {
    it('should return valid admin dashboard with 6 KPIs aligned with wireframe', async () => {
      const result = await service.getAdminDashboard('30d');

      expect(result).toBeDefined();
      expect(result.role).toBe('admin');
      expect(result.range).toBe('30d');
      expect(result.kpis).toHaveLength(6);

      const kpiKeys = result.kpis.map((k) => k.key);
      expect(kpiKeys).toEqual([
        'in-workshop',
        'orders-created',
        'orders-delivered',
        'pending-budgets',
        'delayed-orders',
        'ready-to-pickup',
      ]);

      // Charts: Evolution + Distribution
      expect(result.charts).toHaveLength(2);
      expect(result.charts[0].key).toBe('orders-evolution');
      expect(result.charts[1].key).toBe('orders-status');
      expect(result.charts[1].total).toBeGreaterThan(0);

      // Section 4: Operational Metrics
      expect(result.turnaroundTimes).toBeDefined();
      expect(Array.isArray(result.turnaroundTimes)).toBe(true);
      expect(result.technicianWorkloads).toBeDefined();
      expect(Array.isArray(result.technicianWorkloads)).toBe(true);

      // Section 3: Alerts and Recent
      expect(result.alerts).toBeDefined();
      expect(result.recent).toBeDefined();
    });

    it('should support ranges 7d, 90d and all', async () => {
      const res7d = await service.getAdminDashboard('7d');
      expect(res7d.range).toBe('7d');
      expect(res7d.kpis).toHaveLength(6);

      const res90d = await service.getAdminDashboard('90d');
      expect(res90d.range).toBe('90d');
      expect(res90d.kpis).toHaveLength(6);

      const resAll = await service.getAdminDashboard('all');
      expect(resAll.range).toBe('all');
      expect(resAll.kpis).toHaveLength(6);
    });
  });

  describe('getTechDashboard', () => {
    it('should return technical dashboard with role-specific KPIs', async () => {
      const result = await service.getTechDashboard(1, '30d');
      expect(result).toBeDefined();
      expect(result.role).toBe('tech');
      expect(result.kpis).toHaveLength(4);
    });
  });

  describe('getRecepDashboard', () => {
    it('should return receptionist dashboard with role-specific KPIs', async () => {
      const result = await service.getRecepDashboard(1, '30d');
      expect(result).toBeDefined();
      expect(result.role).toBe('recep');
      expect(result.kpis).toHaveLength(4);
    });
  });

  describe('getClientDashboard', () => {
    it('should return client dashboard with role-specific KPIs', async () => {
      const result = await service.getClientDashboard(1, '30d');
      expect(result).toBeDefined();
      expect(result.role).toBe('client');
      expect(result.kpis).toHaveLength(4);
    });
  });
});
