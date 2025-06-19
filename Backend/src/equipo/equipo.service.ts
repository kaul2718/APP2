import { BadRequestException, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { Equipo } from './entities/equipo.entity';
import { Order } from '../orders/entities/order.entity';
import { TipoEquipo } from '../tipo-equipo/entities/tipo-equipo.entity';
import { Marca } from '../marca/entities/marca.entity';
import { Modelo } from '../modelo/entities/modelo.entity';

@Injectable()
export class EquipoService {
  constructor(
    @InjectRepository(Equipo)
    private readonly equipoRepository: Repository<Equipo>,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(TipoEquipo)
    private readonly tipoEquipoRepository: Repository<TipoEquipo>,

    @InjectRepository(Marca)
    private readonly marcaRepository: Repository<Marca>,

    @InjectRepository(Modelo)
    private readonly modeloRepository: Repository<Modelo>,
  ) { }

  //METODO PARA REGISTRAR UN EQUIPO
  async create(createEquipoDto: CreateEquipoDto): Promise<Equipo> {
    const {
      numeroSerie,
      tipoEquipoId,
      marcaId,
      modeloId,
      ...equipoData
    } = createEquipoDto;

    const existingEquipo = await this.equipoRepository.findOne({
      where: { numeroSerie },
    });

    if (existingEquipo) {
      throw new BadRequestException('El número de serie ya está registrado.');
    }

    const tipoEquipo = await this.tipoEquipoRepository.findOne({
      where: { id: tipoEquipoId },
    });
    if (!tipoEquipo) throw new BadRequestException('Tipo de equipo no encontrado.');

    const marca = await this.marcaRepository.findOne({
      where: { id: marcaId },
    });
    if (!marca) throw new BadRequestException('Marca no encontrada.');

    const modelo = await this.modeloRepository.findOne({
      where: { id: modeloId },
    });
    if (!modelo) throw new BadRequestException('Modelo no encontrado.');

    const equipo = this.equipoRepository.create({
      numeroSerie,
      tipoEquipo,
      marca,
      modelo,
      ...equipoData,
    });

    return await this.equipoRepository.save(equipo);
  }


  //METODO PARA LISTAR TODOS LOS EQUIPOS
  async findAll(): Promise<Equipo[]> {
    return this.equipoRepository.find({
      relations: ['ordenes', 'tipoEquipo', 'marca', 'modelo'],
    });
  }

  //METODO PARA LISTAR ALGUN EQUIPO
  async findOne(id: number): Promise<Equipo> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    const equipo = await this.equipoRepository.findOne({
      where: { id },
      relations: ['ordenes', 'tipoEquipo', 'marca', 'modelo'],
    });

    if (!equipo) {
      throw new NotFoundException('Equipo no encontrado.');
    }

    return equipo;
  }

  //METODO PARA ACTULIZAR ALGUN EQUIPO
  async update(id: number, updateEquipoDto: UpdateEquipoDto): Promise<Equipo> {
    const equipo = await this.equipoRepository.findOne({
      where: { id },
      relations: ['tipoEquipo', 'marca', 'modelo'], // sin 'order'
    });

    if (!equipo) {
      throw new NotFoundException('Equipo no encontrado.');
    }

    // Validar si se actualiza el número de serie y no está duplicado
    if (updateEquipoDto.numeroSerie) {
      const existingEquipo = await this.equipoRepository.findOne({
        where: { numeroSerie: updateEquipoDto.numeroSerie },
      });

      if (existingEquipo && existingEquipo.id !== id) {
        throw new BadRequestException('El número de serie ya está en uso.');
      }
    }

    // Actualizar relaciones si vienen en el DTO
    if (updateEquipoDto.tipoEquipoId) {
      const tipoEquipo = await this.tipoEquipoRepository.findOne({
        where: { id: updateEquipoDto.tipoEquipoId },
      });
      if (!tipoEquipo) throw new NotFoundException('Tipo de equipo no encontrado.');
      equipo.tipoEquipo = tipoEquipo;
    }

    if (updateEquipoDto.marcaId) {
      const marca = await this.marcaRepository.findOne({
        where: { id: updateEquipoDto.marcaId },
      });
      if (!marca) throw new NotFoundException('Marca no encontrada.');
      equipo.marca = marca;
    }

    if (updateEquipoDto.modeloId) {
      const modelo = await this.modeloRepository.findOne({
        where: { id: updateEquipoDto.modeloId },
      });
      if (!modelo) throw new NotFoundException('Modelo no encontrado.');
      equipo.modelo = modelo;
    }

    // Asignar las demás propiedades directamente del DTO
    Object.assign(equipo, updateEquipoDto);
    return await this.equipoRepository.save(equipo);
  }

  //METODO PARA ELIMINAR UN EQUIPO
  async remove(id: number): Promise<{ message: string }> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    const equipo = await this.equipoRepository.findOne({
      where: { id },
    });

    if (!equipo) {
      throw new NotFoundException(`Equipo con ID ${id} no encontrado.`);
    }
    // Verificar si existe alguna orden que tenga asignado este equipo
    const ordenAsignada = await this.orderRepository.findOne({
      where: { equipoId: id },
    });
    if (ordenAsignada) {
      throw new BadRequestException(
        'No se puede eliminar el equipo porque está asignado a una orden.'
      );
    }
    if (equipo.isDeleted) {
      throw new BadRequestException('El equipo ya ha sido eliminado.');
    }
    equipo.isDeleted = true;
    await this.equipoRepository.save(equipo);
    return { message: `Equipo con ID ${id} eliminado.` };
  }
}