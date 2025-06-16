import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
// Recibir una solicitud, enviarle la pega a otra persona y despues devolverla
//El controller se encarga de recibir las peticiones (como cuando llegas a una oficina y pides algo), 
// ver qué quieres hacer (consultar, guardar, actualizar) y mandarle la tarea a alguien más (al servicio).

