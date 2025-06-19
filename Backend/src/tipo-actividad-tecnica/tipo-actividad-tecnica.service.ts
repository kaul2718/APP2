import { Injectable } from '@nestjs/common';
import { CreateTipoActividadTecnicaDto } from './dto/create-tipo-actividad-tecnica.dto';
import { UpdateTipoActividadTecnicaDto } from './dto/update-tipo-actividad-tecnica.dto';

@Injectable()
export class TipoActividadTecnicaService {
  create(createTipoActividadTecnicaDto: CreateTipoActividadTecnicaDto) {
    return 'This action adds a new tipoActividadTecnica';
  }

  findAll() {
    return `This action returns all tipoActividadTecnica`;
  }

  findOne(id: number) {
    return `This action returns a #${id} tipoActividadTecnica`;
  }

  update(id: number, updateTipoActividadTecnicaDto: UpdateTipoActividadTecnicaDto) {
    return `This action updates a #${id} tipoActividadTecnica`;
  }

  remove(id: number) {
    return `This action removes a #${id} tipoActividadTecnica`;
  }
}
