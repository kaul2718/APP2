/**
 * Script administrativo controlado e idempotente para la carga inicial de
 * Marcas, Categorías, Productos Físicos y Servicios Técnicos en Hospital del Computador.
 *
 * RESTICCIONES Y BLINDAJES CUMPLIDOS:
 * 1. NO se ejecuta automáticamente en el arranque de la app ni en Docker.
 * 2. Compatible al 100% con Docker de producción: se compila a dist/scripts/seed-almacen-catalogo.js
 *    y se ejecuta con "node dist/scripts/seed-almacen-catalogo.js" sin ts-node ni devDependencies.
 * 3. Utiliza la conexión TypeORM oficial configurada en AppModule y cierra todas las conexiones al terminar.
 * 4. Stock inicial en 0 para todos los ítems (sin inventar existencias).
 * 5. Precios y costos en 0.00 con estado = false (inactivo) y permiteModificarPrecio = false
 *    para blindar contra presupuestación involuntaria a $0.00 hasta que la administración
 *    revise tarifas, costos e IVA y active el ítem formalmente.
 * 6. Marca: Únicamente "Genérica" para productos físicos; sin marca (null) para servicios técnicos.
 * 7. Idempotencia total (withDeleted: true). No duplica ni sobrescribe registros existentes.
 *
 * Ejecución en contenedor Docker de producción:
 *   docker compose exec backend node dist/scripts/seed-almacen-catalogo.js
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Marca } from '../marca/entities/marca.entity';
import { Categoria } from '../categoria/entities/categoria.entity';
import { Parte } from '../parte/entities/parte.entity';

async function main() {
  console.log('================================================================');
  console.log(' HOSPITAL DEL COMPUTADOR - CARGA INICIAL DE CATÁLOGO (CONTROLADA)');
  console.log('================================================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const marcaRepo = app.get<Repository<Marca>>(getRepositoryToken(Marca));
  const categoriaRepo = app.get<Repository<Categoria>>(getRepositoryToken(Categoria));
  const parteRepo = app.get<Repository<Parte>>(getRepositoryToken(Parte));

  try {
    // -------------------------------------------------------------------------
    // PASO 1: MARCA BASE (GENÉRICA)
    // -------------------------------------------------------------------------
    console.log('--- 1. Verificando Marca Base ---');
    let marcaGenerica = await marcaRepo.findOne({
      where: { nombre: 'Genérica' },
      withDeleted: true,
    });

    if (!marcaGenerica) {
      marcaGenerica = marcaRepo.create({
        nombre: 'Genérica',
        estado: true,
      });
      marcaGenerica = await marcaRepo.save(marcaGenerica);
      console.log(`✓ Marca creada: "Genérica" (ID: ${marcaGenerica.id})`);
    } else {
      console.log(`ℹ Marca existente: "Genérica" (ID: ${marcaGenerica.id}). Conservada sin modificar.`);
    }

    // -------------------------------------------------------------------------
    // PASO 2: LAS NUEVE CATEGORÍAS
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Verificando 9 Categorías Oficiales ---');
    const categoriasData = [
      {
        nombre: 'Memorias RAM',
        descripcion: 'Módulos de memoria RAM DDR3, DDR4 y DDR5 para laptops y computadoras',
      },
      {
        nombre: 'Almacenamiento',
        descripcion: 'Unidades de estado sólido SSD SATA, M.2 NVMe y discos duros mecánicos',
      },
      {
        nombre: 'Fuentes y cargadores',
        descripcion: 'Cargadores originales, fuentes de poder ATX y adaptadores de corriente',
      },
      {
        nombre: 'Baterías',
        descripcion: 'Baterías internas y externas para laptops de diversas marcas',
      },
      {
        nombre: 'Pantallas',
        descripcion: 'Paneles LCD, LED, IPS y repuestos de display para laptops y monitores',
      },
      {
        nombre: 'Teclados y periféricos',
        descripcion: 'Teclados de repuesto para laptop, mouses y periféricos de entrada',
      },
      {
        nombre: 'Componentes internos',
        descripcion: 'Placas madre, ventiladores, disipadores y módulos electrónicos',
      },
      {
        nombre: 'Consumibles',
        descripcion: 'Pastas térmicas, alcohol isopropílico, estaño y suministros de taller',
      },
      {
        nombre: 'Servicios Técnicos',
        descripcion: 'Mano de obra, diagnósticos, mantenimientos preventivos y correctivos',
      },
    ];

    const categoriasMap = new Map<string, Categoria>();

    for (const catData of categoriasData) {
      let cat = await categoriaRepo.findOne({
        where: { nombre: catData.nombre },
        withDeleted: true,
      });

      if (!cat) {
        cat = categoriaRepo.create({
          nombre: catData.nombre,
          descripcion: catData.descripcion,
          estado: true,
        });
        cat = await categoriaRepo.save(cat);
        console.log(`✓ Categoría creada: "${cat.nombre}" (ID: ${cat.id})`);
      } else {
        console.log(`ℹ Categoría existente: "${cat.nombre}" (ID: ${cat.id}). Conservada sin modificar.`);
      }
      categoriasMap.set(cat.nombre, cat);
    }

    // -------------------------------------------------------------------------
    // PASO 3: CINCO PRODUCTOS FÍSICOS DE CATÁLOGO (INACTIVOS, PRECIO/IVA PENDIENTES)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Verificando 5 Productos Físicos de Catálogo ---');
    const productosData = [
      {
        nombre: 'SSD SATA 240 GB',
        categoriaNombre: 'Almacenamiento',
        marcaId: marcaGenerica.id,
        unidadMedida: 'Unidad',
        stock: 0,
        stockMinimo: 0,
        costo: 0.0,
        precio1: 0.0,
        precio2: 0.0,
        precio3: 0.0,
        precio4: 0.0,
        ivaTarifa: 15.0, // Tarifa general referencial; revisar antes de activar
        permiteModificarPrecio: false, // Bloqueado contra modificaciones no autorizadas
        estado: false, // Inactivo: impide presupuestar o facturar a $0
        descripcion: 'Unidad de estado sólido SATA III 2.5 pulgadas. Pendiente de fijación de costo, PVP y tarifa de IVA antes de activación comercial.',
      },
      {
        nombre: 'SSD NVMe 500 GB',
        categoriaNombre: 'Almacenamiento',
        marcaId: marcaGenerica.id,
        unidadMedida: 'Unidad',
        stock: 0,
        stockMinimo: 0,
        costo: 0.0,
        precio1: 0.0,
        precio2: 0.0,
        precio3: 0.0,
        precio4: 0.0,
        ivaTarifa: 15.0,
        permiteModificarPrecio: false,
        estado: false,
        descripcion: 'Unidad de estado sólido M.2 PCIe NVMe. Pendiente de fijación de costo, PVP y tarifa de IVA antes de activación comercial.',
      },
      {
        nombre: 'Memoria RAM DDR4 8 GB',
        categoriaNombre: 'Memorias RAM',
        marcaId: marcaGenerica.id,
        unidadMedida: 'Unidad',
        stock: 0,
        stockMinimo: 0,
        costo: 0.0,
        precio1: 0.0,
        precio2: 0.0,
        precio3: 0.0,
        precio4: 0.0,
        ivaTarifa: 15.0,
        permiteModificarPrecio: false,
        estado: false,
        descripcion: 'Módulo de memoria RAM DDR4 8 GB para laptop/PC. Pendiente de fijación de costo, PVP y tarifa de IVA antes de activación comercial.',
      },
      {
        nombre: 'Pasta térmica 4 g',
        categoriaNombre: 'Consumibles',
        marcaId: marcaGenerica.id,
        unidadMedida: 'Unidad',
        stock: 0,
        stockMinimo: 0,
        costo: 0.0,
        precio1: 0.0,
        precio2: 0.0,
        precio3: 0.0,
        precio4: 0.0,
        ivaTarifa: 15.0,
        permiteModificarPrecio: false,
        estado: false,
        descripcion: 'Compuesto térmico de alto rendimiento en jeringa de 4 g. Pendiente de fijación de costo, PVP y tarifa de IVA antes de activación comercial.',
      },
      {
        nombre: 'Adaptador universal para laptop',
        categoriaNombre: 'Fuentes y cargadores',
        marcaId: marcaGenerica.id,
        unidadMedida: 'Unidad',
        stock: 0,
        stockMinimo: 0,
        costo: 0.0,
        precio1: 0.0,
        precio2: 0.0,
        precio3: 0.0,
        precio4: 0.0,
        ivaTarifa: 15.0,
        permiteModificarPrecio: false,
        estado: false,
        descripcion: 'Cargador / adaptador multivoltaje con puntas intercambiables para laptop. Pendiente de fijación de costo, PVP y tarifa de IVA antes de activación comercial.',
      },
    ];

    for (const prod of productosData) {
      const existe = await parteRepo.findOne({
        where: { nombre: prod.nombre },
        withDeleted: true,
      });

      if (!existe) {
        const cat = categoriasMap.get(prod.categoriaNombre);
        if (!cat) throw new Error(`Categoría ${prod.categoriaNombre} no encontrada en mapa.`);

        const nuevoProd = parteRepo.create({
          nombre: prod.nombre,
          categoria: cat,
          categoriaId: cat.id,
          marcaId: prod.marcaId,
          unidadMedida: prod.unidadMedida,
          stock: prod.stock,
          stockMinimo: prod.stockMinimo,
          costo: prod.costo,
          precio1: prod.precio1,
          precio2: prod.precio2,
          precio3: prod.precio3,
          precio4: prod.precio4,
          ivaTarifa: prod.ivaTarifa,
          permiteModificarPrecio: prod.permiteModificarPrecio,
          estado: prod.estado,
          descripcion: prod.descripcion,
        });

        const guardado = await parteRepo.save(nuevoProd);
        console.log(`✓ Producto creado: "${guardado.nombre}" (ID: ${guardado.id}, Estado: Inactivo - Pendiente Tarifar)`);
      } else {
        console.log(`ℹ Producto existente: "${existe.nombre}" (ID: ${existe.id}). Conservado sin modificar.`);
      }
    }

    // -------------------------------------------------------------------------
    // PASO 4: CINCO SERVICIOS TÉCNICOS (SIN MARCA, INACTIVOS, PRECIO/IVA PENDIENTES)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Verificando 5 Servicios Técnicos de Catálogo ---');
    const serviciosData = [
      {
        nombre: 'Diagnóstico técnico',
        categoriaNombre: 'Servicios Técnicos',
        marcaId: undefined, // Sin marca
        unidadMedida: 'Servicio',
        stock: 0,
        stockMinimo: 0,
        costo: 0.0,
        precio1: 0.0,
        precio2: 0.0,
        precio3: 0.0,
        precio4: 0.0,
        ivaTarifa: 15.0, // Tarifa general referencial; revisar si aplica exención o 0% antes de activar
        permiteModificarPrecio: false, // Bloqueado contra modificaciones no autorizadas
        estado: false, // Inactivo: impide presupuestar o prometer servicios a $0
        descripcion: 'Evaluación y peritaje técnico de fallas en hardware y software. Pendiente de asignación de tarifa comercial y régimen de IVA.',
      },
      {
        nombre: 'Mantenimiento preventivo',
        categoriaNombre: 'Servicios Técnicos',
        marcaId: undefined,
        unidadMedida: 'Servicio',
        stock: 0,
        stockMinimo: 0,
        costo: 0.0,
        precio1: 0.0,
        precio2: 0.0,
        precio3: 0.0,
        precio4: 0.0,
        ivaTarifa: 15.0,
        permiteModificarPrecio: false,
        estado: false,
        descripcion: 'Desarme, soplado, limpieza profunda, cambio de pasta térmica y pruebas térmicas. Pendiente de asignación de tarifa comercial y régimen de IVA.',
      },
      {
        nombre: 'Mantenimiento correctivo',
        categoriaNombre: 'Servicios Técnicos',
        marcaId: undefined,
        unidadMedida: 'Servicio',
        stock: 0,
        stockMinimo: 0,
        costo: 0.0,
        precio1: 0.0,
        precio2: 0.0,
        precio3: 0.0,
        precio4: 0.0,
        ivaTarifa: 15.0,
        permiteModificarPrecio: false,
        estado: false,
        descripcion: 'Reparación de circuitos, soldadura, cambio de componentes dañados o restauración funcional. Pendiente de asignación de tarifa comercial y régimen de IVA.',
      },
      {
        nombre: 'Limpieza interna',
        categoriaNombre: 'Servicios Técnicos',
        marcaId: undefined,
        unidadMedida: 'Servicio',
        stock: 0,
        stockMinimo: 0,
        costo: 0.0,
        precio1: 0.0,
        precio2: 0.0,
        precio3: 0.0,
        precio4: 0.0,
        ivaTarifa: 15.0,
        permiteModificarPrecio: false,
        estado: false,
        descripcion: 'Limpieza de ventiladores, disipador y chasis sin cambio de compuestos. Pendiente de asignación de tarifa comercial y régimen de IVA.',
      },
      {
        nombre: 'Instalación de sistema operativo',
        categoriaNombre: 'Servicios Técnicos',
        marcaId: undefined,
        unidadMedida: 'Servicio',
        stock: 0,
        stockMinimo: 0,
        costo: 0.0,
        precio1: 0.0,
        precio2: 0.0,
        precio3: 0.0,
        precio4: 0.0,
        ivaTarifa: 15.0,
        permiteModificarPrecio: false,
        estado: false,
        descripcion: 'Instalación limpia de sistema operativo, controladores oficiales y utilitarios básicos. Pendiente de asignación de tarifa comercial y régimen de IVA.',
      },
    ];

    for (const srv of serviciosData) {
      const existe = await parteRepo.findOne({
        where: { nombre: srv.nombre },
        withDeleted: true,
      });

      if (!existe) {
        const cat = categoriasMap.get(srv.categoriaNombre);
        if (!cat) throw new Error(`Categoría ${srv.categoriaNombre} no encontrada en mapa.`);

        const nuevoSrv = parteRepo.create({
          nombre: srv.nombre,
          categoria: cat,
          categoriaId: cat.id,
          marcaId: undefined,
          unidadMedida: srv.unidadMedida,
          stock: srv.stock,
          stockMinimo: srv.stockMinimo,
          costo: srv.costo,
          precio1: srv.precio1,
          precio2: srv.precio2,
          precio3: srv.precio3,
          precio4: srv.precio4,
          ivaTarifa: srv.ivaTarifa,
          permiteModificarPrecio: srv.permiteModificarPrecio,
          estado: srv.estado,
          descripcion: srv.descripcion,
        });

        const guardado = await parteRepo.save(nuevoSrv);
        console.log(`✓ Servicio creado: "${guardado.nombre}" (ID: ${guardado.id}, Estado: Inactivo - Pendiente Tarifar)`);
      } else {
        console.log(`ℹ Servicio existente: "${existe.nombre}" (ID: ${existe.id}). Conservado sin modificar.`);
      }
    }

    console.log('\n================================================================');
    console.log('✅ CARGA INICIAL FINALIZADA CON ÉXITO (MODO IDEMPOTENTE)');
    console.log('================================================================\n');
  } catch (error) {
    console.error('❌ Error durante la carga:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Ejecución directa si se invoca por CLI
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { main as seedCatalogoInicial };
