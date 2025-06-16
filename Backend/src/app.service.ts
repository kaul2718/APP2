import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
//El servicio es el que maneja la lógica de tu negocio, como calcular algo, 
// conectar con la base de datos, o resolver cualquier trabajo. 
// El controller solo le pasa la solicitud y este pana se encarga de todo.

