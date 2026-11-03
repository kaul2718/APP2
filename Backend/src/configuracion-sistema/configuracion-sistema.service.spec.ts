/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfiguracionSistemaService } from './configuracion-sistema.service';
import { ConfiguracionSistema } from './entities/configuracion-sistema.entity';
import { Order } from '../orders/entities/order.entity';
import { DataSource } from 'typeorm';
import { StorageService } from '../storage/storage.service';
import { BadRequestException } from '@nestjs/common';

describe('ConfiguracionSistemaService', () => {
  let service: ConfiguracionSistemaService;
  let mockConfigRepo: any;
  let mockOrderRepo: any;
  let mockDataSource: any;
  let mockStorageService: any;

  const mockConfig: ConfiguracionSistema = {
    id: 1,
    ordenPrefijo: 'ODS-',
    ordenSiguienteNumero: 36,
    ordenDigitos: 5,
    ordenPermitirReinicio: false,
    presupuestoPrefijo: 'PRE-',
    presupuestoSiguienteNumero: 1,
    presupuestoDigitos: 5,
    nombreEmpresa: 'Hospital del Computador',
    nombreComercial: 'Hospital del Computador',
    ruc: '1792999999001',
    telefono: '022123456',
    whatsapp: '+593 96 962 0222',
    correoContacto: 'soporte@elhospitaldelcomputador.com',
    direccion: 'Quito, Ecuador',
    ciudad: 'Quito',
    slogan: 'Servicio Técnico',
    logoUrl: null,
    storageKeyLogo: null,
    diasAbandono: 60,
    diasGarantiaDefault: 90,
    terminosRecepcion: 'Términos recepción',
    terminosEntrega: 'Términos entrega',
    porcentajeIva: 15.0,
    diasVigenciaPresupuesto: 15,
    tiempoLimiteDiagnosticoHoras: 48,
    diasAlertaControlRetiro: 15,
    stockMinimoAlertaGlobal: 5,
    plantillaWhatsappRecepcion: 'Mensaje recepción',
    plantillaWhatsappListoEntrega: 'Mensaje entrega',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockConfigRepo = {
      findOne: jest.fn().mockResolvedValue({ ...mockConfig }),
      create: jest.fn().mockImplementation((dto) => ({ ...dto })),
      save: jest.fn().mockImplementation((ent) => Promise.resolve({ ...ent })),
    };

    mockOrderRepo = {
      find: jest.fn().mockResolvedValue([
        { workOrderNumber: '00030' },
        { workOrderNumber: '00035' },
      ]),
    };

    mockDataSource = {
      transaction: jest.fn().mockImplementation(async (callback) => {
        const fakeManager = {
          findOne: jest.fn().mockResolvedValue({ ...mockConfig }),
          save: jest.fn().mockImplementation((ent) => Promise.resolve(ent)),
        };
        return await callback(fakeManager);
      }),
    };

    mockStorageService = {
      getPresignedUrl: jest.fn().mockResolvedValue('https://storage.r2.dev/logo.png'),
      uploadFile: jest.fn().mockResolvedValue({ storageKey: 'test-key' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfiguracionSistemaService,
        {
          provide: getRepositoryToken(ConfiguracionSistema),
          useValue: mockConfigRepo,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = module.get<ConfiguracionSistemaService>(ConfiguracionSistemaService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe obtener la configuración existente', async () => {
    const res = await service.obtenerConfiguracion();
    expect(res).toBeDefined();
    expect(res.nombreEmpresa).toBe('Hospital del Computador');
    expect(res.ordenSiguienteNumero).toBe(36);
  });

  it('debe calcular correctamente el máximo número de orden existente', async () => {
    const maxNum = await service.obtenerMaximoNumeroOrdenExistente();
    expect(maxNum).toBe(35);
  });

  it('debe generar el siguiente número de orden formateado con prefijo y ceros a la izquierda', async () => {
    const numGenerado = await service.generarSiguienteNumeroOrden();
    expect(numGenerado).toBe('ODS-00036');
  });

  it('debe generar vista previa con formato solicitado', () => {
    const preview1 = service.obtenerVistaPrevia('ODS-', 1000, 5);
    expect(preview1).toBe('ODS-01000');

    const preview2 = service.obtenerVistaPrevia('', 42, 6);
    expect(preview2).toBe('000042');
  });

  it('debe rechazar actualizar a un número menor al máximo histórico sin permiso de reinicio', async () => {
    await expect(
      service.actualizarConfiguracion({
        ordenSiguienteNumero: 20, // Menor a 35 que ya existe
        ordenPermitirReinicio: false,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe permitir actualizar a un número menor si ordenPermitirReinicio es true', async () => {
    const res = await service.actualizarConfiguracion({
      ordenSiguienteNumero: 20,
      ordenPermitirReinicio: true,
    });
    expect(res.ordenSiguienteNumero).toBe(20);
  });
});
