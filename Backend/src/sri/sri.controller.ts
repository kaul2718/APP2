import { Controller, Get, Param } from '@nestjs/common';
import { SriService } from './sri.service';

@Controller('sri')
export class SriController {
  constructor(private readonly sriService: SriService) {}

  @Get('consultar/:documento')
  async consultarDocumento(@Param('documento') documento: string) {
    return this.sriService.consultarDocumento(documento);
  }
}
