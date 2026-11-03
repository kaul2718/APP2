import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ParteService } from './parte.service';
import { Parte } from './entities/parte.entity';
import { Categoria } from '../categoria/entities/categoria.entity';
import { Marca } from '../marca/entities/marca.entity';
import { CreateParteDto } from './dto/create-parte.dto';

describe('ParteService - Creación de Productos y Servicios (Validación de Marca Opcional)', () => {
  let parteService: ParteService;
  let mockParteRepository: any;
  let mockCategoriaRepository: any;
  let mockMarcaRepository: any;
  let mockNotificacionService: any;

  const mockCategoria: Categoria = {
    id: 1,
    nombre: 'Almacenamiento',
    descripcion: 'Discos y memorias de almacenamiento',
    estado: true,
  } as Categoria;

  const mockCategoriaServicio: Categoria = {
    id: 9,
    nombre: 'Servicios Técnicos',
    descripcion: 'Servicios de taller y mantenimiento',
    estado: true,
  } as Categoria;

  const mockMarca: Marca = {
    id: 1,
    nombre: 'Kingston',
    estado: true,
  } as Marca;

  beforeEach(() => {
    mockParteRepository = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({
        id: 1,
        ...dto,
      })),
      save: jest.fn().mockImplementation((parte) => Promise.resolve({
        id: 1,
        codigoInterno: 'SSD-1',
        ...parte,
      })),
    };

    mockCategoriaRepository = {
      findOne: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 1) return Promise.resolve(mockCategoria);
        if (where.id === 9) return Promise.resolve(mockCategoriaServicio);
        return Promise.resolve(null);
      }),
    };

    mockMarcaRepository = {
      findOne: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 1) return Promise.resolve(mockMarca);
        return Promise.resolve(null);
      }),
    };

    mockNotificacionService = {
      checkAndNotificarStockBajo: jest.fn().mockResolvedValue(undefined),
    };

    parteService = new ParteService(
      mockParteRepository,
      mockCategoriaRepository,
      mockMarcaRepository,
      mockNotificacionService,
    );

    // Mock findOne para retornar el ítem guardado
    jest.spyOn(parteService, 'findOne').mockImplementation((id: number) => {
      return Promise.resolve({
        id,
        nombre: 'Item Test',
      } as any);
    });
  });

  describe('1. Creación de productos con marca', () => {
    it('permite crear un producto con marca existente asociada correctamente', async () => {
      const dto: CreateParteDto = {
        nombre: 'SSD SATA 240 GB',
        categoriaId: 1,
        marcaId: 1,
        costo: 18.0,
        precio1: 28.0,
        precio2: 28.0,
        precio3: 28.0,
        precio4: 28.0,
        ivaTarifa: 15.0,
        stock: 0,
        stockMinimo: 2,
        unidadMedida: 'Unidad',
      };

      const result = await parteService.create(dto);

      expect(result).toBeDefined();
      expect(mockMarcaRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockParteRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'SSD SATA 240 GB',
          categoria: mockCategoria,
          marca: mockMarca,
          marcaId: 1,
        }),
      );
    });

    it('rechaza con NotFoundException si el marcaId proporcionado no existe', async () => {
      const dto: CreateParteDto = {
        nombre: 'SSD NVMe Inexistente',
        categoriaId: 1,
        marcaId: 999, // Marca que no existe en el catálogo
        costo: 30.0,
        precio1: 50.0,
        precio2: 50.0,
        precio3: 50.0,
        precio4: 50.0,
        ivaTarifa: 15.0,
        stock: 0,
        stockMinimo: 1,
      };

      await expect(parteService.create(dto)).rejects.toThrow(NotFoundException);
      await expect(parteService.create(dto)).rejects.toThrow(/Marca no encontrada/i);
    });
  });

  describe('2. Creación de productos genéricos sin marca (marcaId opcional)', () => {
    it('permite crear un producto físico genérico cuando marcaId es undefined', async () => {
      const dto: CreateParteDto = {
        nombre: 'Adaptador universal para laptop',
        categoriaId: 1,
        costo: 12.0,
        precio1: 22.0,
        precio2: 22.0,
        precio3: 22.0,
        precio4: 22.0,
        ivaTarifa: 15.0,
        stock: 0,
        stockMinimo: 1,
        unidadMedida: 'Unidad',
        // marcaId omitido
      };

      const result = await parteService.create(dto);

      expect(result).toBeDefined();
      // No debe consultar a la base de datos por una marca inexistente
      expect(mockMarcaRepository.findOne).not.toHaveBeenCalled();
      expect(mockParteRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Adaptador universal para laptop',
          categoria: mockCategoria,
          marca: undefined,
          marcaId: undefined,
        }),
      );
    });

    it('permite crear un producto físico genérico cuando marcaId es null o 0', async () => {
      const dto: any = {
        nombre: 'Cable SATA 3.0 Genérico',
        categoriaId: 1,
        marcaId: null,
        costo: 1.5,
        precio1: 4.0,
        precio2: 4.0,
        precio3: 4.0,
        precio4: 4.0,
        ivaTarifa: 15.0,
        stock: 0,
        stockMinimo: 2,
        unidadMedida: 'Unidad',
      };

      const result = await parteService.create(dto);

      expect(result).toBeDefined();
      expect(mockMarcaRepository.findOne).not.toHaveBeenCalled();
      expect(mockParteRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Cable SATA 3.0 Genérico',
          marca: undefined,
          marcaId: undefined,
        }),
      );
    });
  });

  describe('3. Creación de servicios técnicos sin marca', () => {
    it('permite crear un servicio técnico comercial con unidadMedida = "Servicio" y sin marca', async () => {
      const dto: CreateParteDto = {
        nombre: 'Mantenimiento preventivo',
        categoriaId: 9, // Servicios Técnicos
        costo: 0.0,
        precio1: 20.0,
        precio2: 20.0,
        precio3: 20.0,
        precio4: 20.0,
        ivaTarifa: 15.0,
        stock: 0,
        stockMinimo: 0,
        unidadMedida: 'Servicio',
        permiteModificarPrecio: true,
      };

      const result = await parteService.create(dto);

      expect(result).toBeDefined();
      expect(mockMarcaRepository.findOne).not.toHaveBeenCalled();
      expect(mockParteRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Mantenimiento preventivo',
          unidadMedida: 'Servicio',
          categoria: mockCategoriaServicio,
          marca: undefined,
          marcaId: undefined,
        }),
      );
    });
  });

  describe('4. Validaciones comerciales de costos y duplicados', () => {
    it('impide registrar un producto si el precio1 es inferior al costo', async () => {
      const dto: CreateParteDto = {
        nombre: 'Producto con precio a pérdida',
        categoriaId: 1,
        costo: 25.0,
        precio1: 20.0, // Error: menor al costo
        precio2: 25.0,
        precio3: 25.0,
        precio4: 25.0,
        ivaTarifa: 15.0,
        stock: 0,
        stockMinimo: 1,
      };

      await expect(parteService.create(dto)).rejects.toThrow(BadRequestException);
      await expect(parteService.create(dto)).rejects.toThrow(
        /El precio de venta 1 no puede ser inferior al costo/i,
      );
    });

    it('impide registrar un producto si el nombre ya existe', async () => {
      mockParteRepository.findOne.mockImplementation(({ where }: any) => {
        if (where?.nombre === 'SSD SATA 240 GB') {
          return Promise.resolve({ id: 5, nombre: 'SSD SATA 240 GB' });
        }
        return Promise.resolve(null);
      });

      const dto: CreateParteDto = {
        nombre: 'SSD SATA 240 GB',
        categoriaId: 1,
        costo: 18.0,
        precio1: 28.0,
        precio2: 28.0,
        precio3: 28.0,
        precio4: 28.0,
        ivaTarifa: 15.0,
        stock: 0,
        stockMinimo: 1,
      };

      await expect(parteService.create(dto)).rejects.toThrow(BadRequestException);
      await expect(parteService.create(dto)).rejects.toThrow(/Ya existe un item con ese nombre/i);
    });
  });
});
