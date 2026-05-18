import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { Categoria } from './categoria/entities/categoria.entity';
import { Parte } from './parte/entities/parte.entity';
import { DetallePresupuestoItem } from './detalle-presupuesto-item/entities/detalle-presupuesto-item.entity';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const queryRunner = dataSource.createQueryRunner();

  console.log('🚀 Iniciando script de migración de Mano de Obra a Almacén...');

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // 1. Obtener o crear la categoría "Servicio"
    let categoriaServicio = await queryRunner.manager.findOne(Categoria, {
      where: { nombre: 'Servicio' },
    });

    if (!categoriaServicio) {
      console.log('📝 Creando categoría "Servicio" ya que no se encontró en la BD...');
      categoriaServicio = queryRunner.manager.create(Categoria, {
        nombre: 'Servicio',
        descripcion: 'Servicios y mano de obra del almacén',
        estado: true,
      });
      categoriaServicio = await queryRunner.manager.save(categoriaServicio);
    } else {
      console.log(`✓ Categoría "Servicio" encontrada (ID: ${categoriaServicio.id})`);
    }

    // 2. Obtener todos los tipos de mano de obra
    console.log('🔍 Cargando registros de tipo_mano_obra...');
    const tiposManoObra = await queryRunner.manager.query('SELECT * FROM tipo_mano_obra');
    console.log(`✓ Se encontraron ${tiposManoObra.length} tipos de mano de obra.`);

    const mapTipoAParte: Record<number, number> = {};

    for (const tipo of tiposManoObra) {
      const codigoInterno = `SRV-${tipo.codigo}`;
      
      // Buscar si ya existe la parte para no duplicar
      let parte = await queryRunner.manager.findOne(Parte, {
        where: { codigoInterno },
      });

      if (!parte) {
        console.log(`➕ Creando servicio "${tipo.nombre}" en catálogo de Almacén...`);
        parte = queryRunner.manager.create(Parte, {
          nombre: tipo.nombre,
          codigoInterno: codigoInterno,
          costo: Number(tipo.costo || 0),
          precio1: Number(tipo.costo || 0),
          precio2: Number(tipo.costo || 0),
          precio3: Number(tipo.costo || 0),
          precio4: Number(tipo.costo || 0),
          ivaTarifa: 0,
          stock: 9999, // Stock virtual
          stockMinimo: 0,
          unidadMedida: 'Servicio',
          permiteModificarPrecio: true,
          permiteFraccionar: false,
          estado: Boolean(tipo.estado),
          categoriaId: categoriaServicio.id,
          marcaId: null,
        });
        parte = await queryRunner.manager.save(parte);
      } else {
        console.log(`✓ Servicio "${tipo.nombre}" ya existe en catálogo (ID: ${parte.id})`);
      }

      mapTipoAParte[tipo.id] = parte.id;
    }

    // 3. Obtener todos los detalles de mano de obra
    console.log('🔍 Cargando registros de detalle_mano_obra...');
    const detallesManoObra = await queryRunner.manager.query('SELECT * FROM detalle_mano_obra');
    console.log(`✓ Se encontraron ${detallesManoObra.length} registros de detalles de mano de obra.`);

    let detallesMigradosCount = 0;

    for (const det of detallesManoObra) {
      const nuevaParteId = mapTipoAParte[det.tipoManoObraId];
      if (!nuevaParteId) {
        console.warn(`⚠️ No se encontró la correspondencia de Parte para tipoManoObraId ${det.tipoManoObraId}`);
        continue;
      }

      // Evitar migrar si ya existe un detalle de item equivalente en este presupuesto
      const existeDetalle = await queryRunner.manager.findOne(DetallePresupuestoItem, {
        where: {
          presupuestoId: det.presupuestoId,
          parteId: nuevaParteId,
          cantidad: det.cantidad,
          precioUnitario: Number(det.costoUnitario),
        },
      });

      if (!existeDetalle) {
        console.log(`📦 Copiando detalle a DetallePresupuestoItem (Presupuesto: ${det.presupuestoId}, Cantidad: ${det.cantidad})...`);
        
        const nuevoDetalle = queryRunner.manager.create(DetallePresupuestoItem, {
          cantidad: det.cantidad,
          precioUnitario: Number(det.costoUnitario),
          subtotal: Number(det.costoTotal),
          fechaUso: det.createdAt ? new Date(det.createdAt) : new Date(),
          presupuestoId: det.presupuestoId,
          parteId: nuevaParteId,
          estadoOrdenId: det.estadoOrdenId || null,
          estado: Boolean(det.estado),
          comentario: `Migrado de Mano de Obra original ID #${det.id}`,
          deletedAt: det.deletedAt ? new Date(det.deletedAt) : null,
          createdAt: det.createdAt ? new Date(det.createdAt) : new Date(),
          updatedAt: det.updatedAt ? new Date(det.updatedAt) : new Date(),
        });

        await queryRunner.manager.save(nuevoDetalle);
        detallesMigradosCount++;
      } else {
        console.log(`✓ Detalle de mano de obra ya migrado previamente (Presupuesto: ${det.presupuestoId})`);
      }
    }

    await queryRunner.commitTransaction();
    console.log(`\n🎉 MIGRACIÓN COMPLETADA CON ÉXITO 🎉`);
    console.log(`- Servicios creados/verificados: ${tiposManoObra.length}`);
    console.log(`- Detalles migrados exitosamente: ${detallesMigradosCount}`);
    
    process.exit(0);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error fatal durante la migración:', error);
    process.exit(1);
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

main();
