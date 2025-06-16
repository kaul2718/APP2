import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { Repository } from 'typeorm';
import { Equipo } from './entities/equipo.entity';
import { Order } from '../orders/entities/order.entity';  // Importar la entidad Order
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class EquipoService {
  constructor(
    @InjectRepository(Equipo)
    private readonly equipoRepository: Repository<Equipo>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>, // Inyectar el repositorio de Order
  ) { }

  // Crear un nuevo equipo
  async create(createEquipoDto: CreateEquipoDto): Promise<Equipo> {
    const { orderId, numeroSerie, ...equipoData } = createEquipoDto;

    // Validar que el número de serie no esté duplicado
    const existingEquipo = await this.equipoRepository.findOne({ where: { numeroSerie } });
    if (existingEquipo) {
      throw new BadRequestException('El número de serie ya está registrado.');
    }

    let order = null;

    if (orderId) {
      // Si se proporciona orderId, se busca la orden
      order = await this.equipoRepository.findOne({ where: { id: orderId } });
      if (!order) {
        throw new BadRequestException(
          'No hemos encontrado ninguna orden con esa información. Por favor, verifica los datos e inténtalo nuevamente.'
        );
      }
    }

    // Crear el nuevo equipo
    const equipo = this.equipoRepository.create({
      order,  // Si no hay orderId, se pasará 'null'
      numeroSerie,  // Incluir el número de serie
      ...equipoData,
    });

    // Guardar el equipo
    return await this.equipoRepository.save(equipo);
  }


  // Obtener todos los equipos
  async findAll(): Promise<Equipo[]> {
    return this.equipoRepository.find({
      relations: ['order'], // Asegúrate de incluir la relación 'order' si es necesario
    });
  }

  // Obtener un equipo por ID
  async findOne(id: number): Promise<Equipo> {
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }

    const equipo = await this.equipoRepository.findOne({
      where: { id },
      relations: ['order'], // Incluir relaciones si es necesario
    });

    if (!equipo) {
      throw new NotFoundException('Equipo no encontrado.');
    }

    return equipo;
  }

  async update(id: number, updateEquipoDto: UpdateEquipoDto): Promise<Equipo> {
    // Buscar el equipo por ID, incluyendo la relación con la orden
    const equipo = await this.equipoRepository.findOne({
      where: { id },
      relations: ['order'], // Cargar la relación con la orden
    });

    if (!equipo) {
      throw new NotFoundException('Equipo no encontrado.');
    }

    // Validación de campos requeridos
    if (!updateEquipoDto.tipoEquipo || !updateEquipoDto.marca || !updateEquipoDto.modelo) {
      throw new BadRequestException('Los campos tipoEquipo, marca y modelo son obligatorios.');
    }

    // Verificar si el número de serie ya existe en otro equipo
    if (updateEquipoDto.numeroSerie) {
      const existingEquipo = await this.equipoRepository.findOne({
        where: { numeroSerie: updateEquipoDto.numeroSerie },
      });

      if (existingEquipo && existingEquipo.id !== id) {
        throw new BadRequestException('El número de serie ya está registrado en otro equipo.');
      }
    }

    // Verificar si el orderId ya está asignado a otro equipo (si se proporciona uno)
    if (updateEquipoDto.orderId) {
      const existingOrderEquipo = await this.equipoRepository.findOne({
        where: {
          order: { id: updateEquipoDto.orderId }, // Accede a la relación order para verificar el orderId
        },
      });

      // Si el orderId ya está asociado a otro equipo (y no es el mismo equipo), lanzar un error
      if (existingOrderEquipo && existingOrderEquipo.id !== id) {
        throw new BadRequestException('Este número de orden ya está asignado a otro equipo.');
      }

      // Buscar la orden correspondiente
      const order = await this.orderRepository.findOne({
        where: { id: updateEquipoDto.orderId },
      });

      if (!order) {
        throw new NotFoundException('Orden no encontrada.');
      }

      // Asignar la orden al equipo
      equipo.order = order;
    } else {
      // Si no se proporciona un orderId, eliminar la relación
      equipo.order = null;
    }

    // Actualizar los demás campos del equipo
    Object.assign(equipo, updateEquipoDto);

    // Guardar el equipo actualizado en la base de datos
    return this.equipoRepository.save(equipo);
  }


  // Eliminar un equipo
  async remove(id: number): Promise<{ message: string }> {
    // Verificar si el ID es válido
    if (isNaN(id)) {
      throw new BadRequestException('El ID proporcionado no es válido.');
    }
  
    // Buscar el equipo por ID
    const equipo = await this.equipoRepository.findOne({
      where: { id },
      relations: ['order'], // Cargar relaciones necesarias
    });
  
    // Verificar si el equipo existe
    if (!equipo) {
      throw new NotFoundException(`Equipo con ID ${id} no encontrado.`);
    }
  
    // Verificar si el equipo está asignado a una orden
    if (equipo.order) {
      throw new BadRequestException('No se puede eliminar el equipo porque está asignado a una orden.');
    }
  
    // Verificación adicional si el equipo ya está marcado como eliminado
    if (equipo.isDeleted) {
      throw new BadRequestException('El equipo ya ha sido eliminado.');
    }
  
    // Marcar el equipo como eliminado lógicamente
    equipo.isDeleted = true;
  
    // Guardar los cambios en la base de datos
    await this.equipoRepository.save(equipo);
  
    // Retornar un mensaje de éxito
    return { message: `Equipo con ID ${id} eliminado.` };
  }
}