import { Controller, Get, Param } from '@nestjs/common';
import { SriService } from './sri.service';
import { Auth } from 'src/auth/decorators/auth.decorator';

@Controller('sri')
@Auth('admin', 'tech', 'recep')
export class SriController {
  constructor(private readonly sriService: SriService) {}

  @Get('consultar/:documento')
  async consultarDocumento(@Param('documento') documento: string) {
    return this.sriService.consultarDocumento(documento);
  }
}
