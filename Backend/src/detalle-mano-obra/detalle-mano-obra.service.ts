import { Injectable } from '@nestjs/common';
import { CreateDetalleManoObraDto } from './dto/create-detalle-mano-obra.dto';
import { UpdateDetalleManoObraDto } from './dto/update-detalle-mano-obra.dto';

@Injectable()
export class DetalleManoObraService {
  create(createDetalleManoObraDto: CreateDetalleManoObraDto) {
    return 'This action adds a new detalleManoObra';
  }

  findAll() {
    return `This action returns all detalleManoObra`;
  }

  findOne(id: number) {
    return `This action returns a #${id} detalleManoObra`;
  }

  update(id: number, updateDetalleManoObraDto: UpdateDetalleManoObraDto) {
    return `This action updates a #${id} detalleManoObra`;
  }

  remove(id: number) {
    return `This action removes a #${id} detalleManoObra`;
  }
}
