/**
 * Script administrativo controlado e idempotente para la carga inicial de
 * Plantillas de Checklists / Peritaje Técnico en Hospital del Computador.
 *
 * RESTRICCIONES Y BLINDAJES CUMPLIDOS:
 * 1. NO se ejecuta automáticamente en el arranque de la app ni en Docker.
 * 2. Compatible al 100% con Docker de producción: se compila a dist/scripts/seed-checklist-templates.js
 *    y se ejecuta con "node dist/scripts/seed-checklist-templates.js" sin ts-node ni devDependencies.
 * 3. Utiliza la conexión TypeORM oficial configurada en AppModule y cierra todas las conexiones al terminar.
 * 4. Resuelve los tipos de equipo dinámicamente por su nombre real en la base de datos (sin IDs hardcodeados).
 * 5. Separa explícitamente las preguntas de inspección física y funcional ({ fisica: string[], funcional: string[] }).
 * 6. Idempotencia total: si ya existe una plantilla registrada para un tipo de equipo, se conserva intacta
 *    sin sobrescribir ni revertir modificaciones administrativas realizadas por el usuario.
 * 7. Detecta conflictos y reporta el estado de cada tipo de equipo sin duplicar registros.
 *
 * Ejecución en contenedor Docker de producción:
 *   docker compose exec backend node dist/scripts/seed-checklist-templates.js
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChecklistTemplate } from '../checklist-template/entities/checklist-template.entity';
import { TipoEquipo } from '../tipo-equipo/entities/tipo-equipo.entity';

interface TemplateDefinition {
  nombre: string;
  matchPattern: RegExp;
  fisica: string[];
  funcional: string[];
}

const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    nombre: 'Laptop - Peritaje Técnico Completo',
    matchPattern: /laptop|port[aá]til|notebook/i,
    fisica: [
      'Carcasa exterior y tapas',
      'Pantalla / Cristal / Bisel',
      'Bisagras y mecanismo de apertura',
      'Teclado físico y teclas',
      'Puertos USB / HDMI / Conector DC',
      'Tornillería y sellos de chasis',
    ],
    funcional: [
      'Encendido / POST',
      'Imagen en pantalla / Display',
      'Teclado (respuesta teclas)',
      'Touchpad y botones',
      'Batería (retención de carga)',
      'Reconocimiento de cargador',
      'Audio y altavoces',
      'Conectividad WiFi / Red',
    ],
  },
  {
    nombre: 'PC de Escritorio - Peritaje Técnico Completo',
    matchPattern: /escritorio|torre|computadora|pc\b/i,
    fisica: [
      'Gabinete / Chasis exterior',
      'Panel frontal y botones de encendido',
      'Puertos frontales y traseros',
      'Tapas laterales y tornillos',
    ],
    funcional: [
      'Encendido / Fuente de poder',
      'Salida de video (POST)',
      'Puertos USB y periféricos',
      'Audio / Salida jack',
      'Conectividad Red / Ethernet',
      'Ventiladores y refrigeración',
    ],
  },
  {
    nombre: 'Todo en Uno (AIO) - Peritaje Técnico Completo',
    matchPattern: /aio|todo en uno/i,
    fisica: [
      'Chasis y soporte de inclinación',
      'Pantalla y cristal frontal',
      'Puertos traseros y conector de energía',
      'Botonera física y sellos',
    ],
    funcional: [
      'Encendido y secuencia POST',
      'Calidad de pantalla y brillo',
      'Cámara web y micrófono',
      'Altavoces / Audio interno',
      'Conectividad WiFi / Red',
    ],
  },
  {
    nombre: 'Servidor - Peritaje Técnico Completo',
    matchPattern: /servidor|server/i,
    fisica: [
      'Chasis / Bahías de discos Hot-Swap',
      'Fuente de poder redundante',
      'Panel de diagnóstico / LEDs frontales',
      'Ventiladores y rejillas de aire',
    ],
    funcional: [
      'Secuencia de arranque y RAID POST',
      'Detección de discos duros',
      'Puertos de gestión remota / Red',
      'Comportamiento de ventilación',
    ],
  },
  {
    nombre: 'Impresora - Peritaje Técnico Completo',
    matchPattern: /impresora|multifunci[oó]n/i,
    fisica: [
      'Carcasa exterior y cubiertas',
      'Bandejas de entrada y salida de papel',
      'Cristal de escáner y bisagras',
      'Tanques de tinta / Compartimiento tóner',
      'Conectores USB y corriente',
    ],
    funcional: [
      'Encendido / Luces LED indicadoras',
      'Mecanismo de arrastre de papel',
      'Impresión de página de prueba',
      'Movimiento de carro de cabezales',
      'Escáner y fotocopia',
    ],
  },
  {
    nombre: 'Monitor - Peritaje Técnico Completo',
    matchPattern: /monitor|pantalla/i,
    fisica: [
      'Carcasa exterior y bisel frontal',
      'Base y soporte de inclinación / VESA',
      'Panel de display (sin golpes ni rayones)',
      'Puertos de video HDMI / DP / VGA',
    ],
    funcional: [
      'Encendido y alimentación',
      'Detección de señal de video',
      'Ausencia de líneas o parpadeo',
      'Menú OSD y botones de control',
    ],
  },
];

async function main() {
  console.log('========================================================================');
  console.log(' HOSPITAL DEL COMPUTADOR - CARGA INICIAL DE PLANTILLAS DE PERITAJE');
  console.log('========================================================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const checklistRepo = app.get<Repository<ChecklistTemplate>>(
    getRepositoryToken(ChecklistTemplate),
  );
  const tipoEquipoRepo = app.get<Repository<TipoEquipo>>(
    getRepositoryToken(TipoEquipo),
  );

  let creadas = 0;
  let conservadas = 0;
  let omitidas = 0;

  try {
    // 1. Obtener todos los tipos de equipo registrados en base de datos
    console.log('--- 1. Consultando Tipos de Equipo Registrados ---');
    const tiposEquipoDb = await tipoEquipoRepo.find({
      where: { estado: true },
      order: { id: 'ASC' },
    });

    if (tiposEquipoDb.length === 0) {
      console.warn('⚠ No se encontraron tipos de equipo activos en la base de datos.');
      console.warn('  Asegúrese de que el seeder base de tipos de equipo haya sido ejecutado.');
      return;
    }

    console.log(`✓ Se encontraron ${tiposEquipoDb.length} tipos de equipo activos en PostgreSQL:\n`);
    tiposEquipoDb.forEach((te) => {
      console.log(`  - [ID: ${te.id}] ${te.nombre}`);
    });

    console.log('\n--- 2. Procesando Plantillas por Tipo de Equipo ---');

    for (const def of TEMPLATE_DEFINITIONS) {
      // Buscar el tipo de equipo correspondiente por coincidencia de nombre
      const matchingEquipo = tiposEquipoDb.find((te) =>
        def.matchPattern.test(te.nombre),
      );

      if (!matchingEquipo) {
        console.log(
          `ℹ Tipo de equipo no encontrado para "${def.nombre}" (patrón: ${def.matchPattern}). Se omite.`,
        );
        omitidas++;
        continue;
      }

      // Verificar si ya existe una plantilla asociada a este tipo de equipo (idempotencia)
      const existingTemplate = await checklistRepo.findOne({
        where: { tipoEquipoId: matchingEquipo.id },
        withDeleted: true,
      });

      if (existingTemplate) {
        console.log(
          `ℹ Plantilla existente para "${matchingEquipo.nombre}" (ID: ${existingTemplate.id}, Nombre: "${existingTemplate.nombre}"). Conservada intacta sin sobrescribir.`,
        );
        conservadas++;
      } else {
        // Crear la plantilla con estructura dual explícita
        const nuevaPlantilla = checklistRepo.create({
          nombre: def.nombre,
          tipoEquipoId: matchingEquipo.id,
          items: {
            fisica: def.fisica,
            funcional: def.funcional,
          },
          estado: true,
        });

        const guardada = await checklistRepo.save(nuevaPlantilla);
        console.log(
          `✓ Plantilla creada exitosamente: "${guardada.nombre}" para "${matchingEquipo.nombre}" (ID: ${guardada.id}, ${def.fisica.length} físicas, ${def.funcional.length} funcionales).`,
        );
        creadas++;
      }
    }

    // 3. Resumen final de la operación
    console.log('\n========================================================================');
    console.log(' RESUMEN DE LA CARGA DE PLANTILLAS');
    console.log('========================================================================');
    console.log(` Plantillas nuevas creadas : ${creadas}`);
    console.log(` Plantillas conservadas     : ${conservadas}`);
    console.log(` Definiciones omitidas      : ${omitidas}`);
    console.log(' Operación completada con éxito.');
    console.log('========================================================================\n');
  } catch (error) {
    console.error('❌ Error durante la ejecución del script de plantillas:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

// Ejecución controlada únicamente si se invoca como script principal
if (require.main === module) {
  main()
    .then(() => process.exit(process.exitCode || 0))
    .catch((err) => {
      console.error('Fallo crítico en seed-checklist-templates:', err);
      process.exit(1);
    });
}

