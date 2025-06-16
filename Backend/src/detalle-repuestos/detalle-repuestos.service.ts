import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetalleRepuestos } from './entities/detalle-repuesto.entity';
import { CreateDetalleRepuestoDto } from './dto/create-detalle-repuesto.dto';
import { UpdateDetalleRepuestoDto } from './dto/update-detalle-repuesto.dto';
import { Repuesto } from '../repuestos/entities/repuesto.entity';

@Injectable()
export class DetalleRepuestosService {
  constructor(
    @InjectRepository(DetalleRepuestos)
    private readonly detalleRepuestosRepository: Repository<DetalleRepuestos>,
    @InjectRepository(Repuesto)
    private readonly repuestoRepository: Repository<Repuesto>,
  ) {}

  async create(createDetalleRepuestoDto: CreateDetalleRepuestoDto): Promise<DetalleRepuestos> {
    const { repuestoId, cantidad } = createDetalleRepuestoDto;
  
    // Obtener el repuesto para actualizar su stock y obtener su precio
    const repuesto = await this.repuestoRepository.findOne({
      where: { id: repuestoId },
    });
  
    if (!repuesto) {
      throw new NotFoundException(`Repuesto con ID ${repuestoId} no encontrado.`);
    }
  
    // Verificar que haya suficiente stock
    if (repuesto.stockActual < cantidad) {
      throw new BadRequestException(`No hay suficiente stock para el repuesto con ID ${repuestoId}.`);
    }
  
    // Asignar el precioUnitario desde la tabla repuesto, si no se especifica en el DTO
    const precioUnitario = createDetalleRepuestoDto.precioUnitario || repuesto.precioVenta;
  
    // Calcular el subtotal
    const subtotal = precioUnitario * cantidad;
  
    // Disminuir el stock del repuesto
    repuesto.stockActual -= cantidad;
  
    try {
      // Guardar el cambio en el stock del repuesto
      await this.repuestoRepository.save(repuesto);
  
      // Crear y guardar el detalle de repuesto, con el precioUnitario y subtotal calculados
      const detalleRepuesto = this.detalleRepuestosRepository.create({
        ...createDetalleRepuestoDto,
        precioUnitario,  // Asignamos el precio unitario de la tabla repuesto
        subtotal,  // Asignamos el subtotal calculado
      });
      return await this.detalleRepuestosRepository.save(detalleRepuesto);
    } catch (error) {
      throw new InternalServerErrorException(`Error al crear el detalle de repuesto: ${error.message}`);
    }
  }

  // Obtener todos los detalles de repuestos
  async findAll(): Promise<DetalleRepuestos[]> {
    try {
      return await this.detalleRepuestosRepository.find({ relations: ['repuesto'] });
    } catch (error) {
      throw new InternalServerErrorException(`Error al obtener los detalles de repuestos: ${error.message}`);
    }
  }

  // Obtener un detalle de repuesto por ID
  async findOne(id: number): Promise<DetalleRepuestos> {
    try {
      const detalleRepuesto = await this.detalleRepuestosRepository.findOne({
        where: { id },
        relations: ['repuesto'],
      });
      if (!detalleRepuesto) {
        throw new NotFoundException(`Detalle de repuesto con ID ${id} no encontrado.`);
      }
      return detalleRepuesto;
    } catch (error) {
      throw new InternalServerErrorException(`Error al obtener el detalle de repuesto: ${error.message}`);
    }
  }

  // Actualizar un detalle de repuesto
async update(id: number, updateDetalleRepuestoDto: UpdateDetalleRepuestoDto): Promise<DetalleRepuestos> {
  try {
    // Obtener el detalle de repuesto a actualizar
    const detalleRepuesto = await this.detalleRepuestosRepository.findOne({
      where: { id },
      relations: ['repuesto'],
    });

    if (!detalleRepuesto) {
      throw new NotFoundException(`Detalle de repuesto con ID ${id} no encontrado.`);
    }

    // Obtener el repuesto relacionado
    const repuesto = await this.repuestoRepository.findOne({
      where: { id: detalleRepuesto.repuesto.id },
    });

    if (!repuesto) {
      throw new NotFoundException(`Repuesto con ID ${detalleRepuesto.repuesto.id} no encontrado.`);
    }

    // Verificar si la cantidad ha cambiado
    let diferenciaCantidad = 0;
    if (updateDetalleRepuestoDto.cantidad !== undefined) {
      diferenciaCantidad = updateDetalleRepuestoDto.cantidad - detalleRepuesto.cantidad;

      // Verificar que el stock no sea negativo
      repuesto.stockActual -= diferenciaCantidad;
      if (repuesto.stockActual < 0) {
        throw new BadRequestException('No hay suficiente stock para esta cantidad.');
      }

      // Guardar el cambio en el stock del repuesto
      await this.repuestoRepository.save(repuesto);
    }

    // Recalcular el subtotal en base al nuevo precio unitario y cantidad
    const precioUnitario = updateDetalleRepuestoDto.precioUnitario || repuesto.precioVenta;
    const subtotal = precioUnitario * updateDetalleRepuestoDto.cantidad;

    // Actualizar el detalle de repuesto con el nuevo subtotal y cantidad
    Object.assign(detalleRepuesto, updateDetalleRepuestoDto, { subtotal });

    // Guardar el detalle actualizado
    return await this.detalleRepuestosRepository.save(detalleRepuesto);
  } catch (error) {
    throw new InternalServerErrorException(`Error al actualizar el detalle de repuesto: ${error.message}`);
  }
}

  // Eliminar un detalle de repuesto
  async remove(id: number): Promise<{ message: string }> {
    try {
      // Obtener el detalle de repuesto
      const detalleRepuesto = await this.detalleRepuestosRepository.findOne({
        where: { id },
        relations: ['repuesto'],
      });

      if (!detalleRepuesto) {
        throw new NotFoundException(`Detalle de repuesto con ID ${id} no encontrado.`);
      }

      // Obtener el repuesto relacionado
      const repuesto = await this.repuestoRepository.findOne({
        where: { id: detalleRepuesto.repuesto.id },
      });

      if (!repuesto) {
        throw new NotFoundException(`Repuesto con ID ${detalleRepuesto.repuesto.id} no encontrado.`);
      }

      // Restaurar el stock del repuesto
      repuesto.stockActual += detalleRepuesto.cantidad;
      await this.repuestoRepository.save(repuesto);

      // Eliminar el detalle de repuesto
      await this.detalleRepuestosRepository.remove(detalleRepuesto);

      return { message: `Detalle de repuesto con ID ${id} eliminado con éxito.` };
    } catch (error) {
      throw new InternalServerErrorException(`Error al eliminar el detalle de repuesto: ${error.message}`);
    }
  }
}
