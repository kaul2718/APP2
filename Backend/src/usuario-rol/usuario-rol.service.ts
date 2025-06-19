import { Injectable } from '@nestjs/common';
import { CreateUsuarioRolDto } from './dto/create-usuario-rol.dto';
import { UpdateUsuarioRolDto } from './dto/update-usuario-rol.dto';

@Injectable()
export class UsuarioRolService {
  create(createUsuarioRolDto: CreateUsuarioRolDto) {
    return 'This action adds a new usuarioRol';
  }

  findAll() {
    return `This action returns all usuarioRol`;
  }

  findOne(id: number) {
    return `This action returns a #${id} usuarioRol`;
  }

  update(id: number, updateUsuarioRolDto: UpdateUsuarioRolDto) {
    return `This action updates a #${id} usuarioRol`;
  }

  remove(id: number) {
    return `This action removes a #${id} usuarioRol`;
  }
}
