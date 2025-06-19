import { Injectable } from '@nestjs/common';
import { CreateTipoManoObraDto } from './dto/create-tipo-mano-obra.dto';
import { UpdateTipoManoObraDto } from './dto/update-tipo-mano-obra.dto';

@Injectable()
export class TipoManoObraService {
  create(createTipoManoObraDto: CreateTipoManoObraDto) {
    return 'This action adds a new tipoManoObra';
  }

  findAll() {
    return `This action returns all tipoManoObra`;
  }

  findOne(id: number) {
    return `This action returns a #${id} tipoManoObra`;
  }

  update(id: number, updateTipoManoObraDto: UpdateTipoManoObraDto) {
    return `This action updates a #${id} tipoManoObra`;
  }

  remove(id: number) {
    return `This action removes a #${id} tipoManoObra`;
  }
}
