import { Injectable } from '@nestjs/common';
import { Command, Console } from 'nestjs-console';
import { SeederService } from './seeder.service';

@Console()
@Injectable()
export class SeederCommand {
  constructor(private readonly seederService: SeederService) {}

  @Command({
    command: 'seed:run',
    description: 'Ejecutar el seeder de roles y permisos',
  })
  async run(): Promise<void> {
    try {
      console.log('🌱 Iniciando seeder...');
      await this.seederService.seed();
      console.log('✅ Seeder completado exitosamente');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error al ejecutar seeder:', error.message);
      process.exit(1);
    }
  }
}
