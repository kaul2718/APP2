import { Injectable } from '@nestjs/common';
import { CreateEvidenciaTecnicaDto } from './dto/create-evidencia-tecnica.dto';
import { UpdateEvidenciaTecnicaDto } from './dto/update-evidencia-tecnica.dto';

@Injectable()
export class EvidenciaTecnicaService {
  create(createEvidenciaTecnicaDto: CreateEvidenciaTecnicaDto) {
    return 'This action adds a new evidenciaTecnica';
  }

  findAll() {
    return `This action returns all evidenciaTecnica`;
  }

  findOne(id: number) {
    return `This action returns a #${id} evidenciaTecnica`;
  }

  update(id: number, updateEvidenciaTecnicaDto: UpdateEvidenciaTecnicaDto) {
    return `This action updates a #${id} evidenciaTecnica`;
  }

  remove(id: number) {
    return `This action removes a #${id} evidenciaTecnica`;
  }
}
