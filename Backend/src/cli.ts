/**
 * CLI Entry Point
 * Para ejecutar comandos como el seeder
 * 
 * Uso: npm run seed:run
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeederService } from './seeder/seeder.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const seederService = app.get(SeederService);

  try {
    console.log('🌱 Iniciando seeder de roles y permisos...');
    await seederService.seed();
    console.log('✅ Seeder completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al ejecutar seeder:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
