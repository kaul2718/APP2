-- =========================================================================
-- Hospital del Computador - Migración Inicial de Producción (PostgreSQL)
-- Archivo: 001_initial_schema.sql
-- Idempotente y reproducible para una base de datos PostgreSQL vacía
-- =========================================================================

BEGIN;

-- 1. TIPOS ENUMERADOS (ENUMS)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_type_enum') THEN
        CREATE TYPE order_type_enum AS ENUM ('EXPRESS', 'COMPLETA');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'casillero_situacion_enum') THEN
        CREATE TYPE casillero_situacion_enum AS ENUM ('Ocupado', 'Disponible');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'documentos_orden_tipodocumento_enum') THEN
        CREATE TYPE documentos_orden_tipodocumento_enum AS ENUM (
            'RECEPCION',
            'ENTREGA',
            'AUTORIZACION_PRESUPUESTO',
            'RECHAZO_PRESUPUESTO'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'documentos_orden_estadofirma_enum') THEN
        CREATE TYPE documentos_orden_estadofirma_enum AS ENUM (
            'PENDIENTE',
            'FIRMADO',
            'RECHAZADO_CLIENTE',
            'OMITIDO_AUTORIZADO'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'autorizaciones_presupuesto_decision_enum') THEN
        CREATE TYPE autorizaciones_presupuesto_decision_enum AS ENUM ('APROBADO', 'RECHAZADO');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'autorizaciones_presupuesto_modalidad_enum') THEN
        CREATE TYPE autorizaciones_presupuesto_modalidad_enum AS ENUM (
            'PRESENCIAL_FIRMA',
            'TOKEN_ODS_PRIVADO',
            'PORTAL_CLIENTE_AUTENTICADO'
        );
    END IF;
END $$;

-- 2. TABLAS DEL NÚCLEO DE AUTORIZACIÓN Y USUARIOS
CREATE TABLE IF NOT EXISTS "roles" (
    "id" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(255) UNIQUE NOT NULL,
    "slug" VARCHAR(255) UNIQUE NOT NULL,
    "descripcion" TEXT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS "permissions" (
    "id" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(255) UNIQUE NOT NULL,
    "slug" VARCHAR(255) UNIQUE NOT NULL,
    "descripcion" TEXT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "role_permissions" (
    "id" SERIAL PRIMARY KEY,
    "roleId" INTEGER NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
    "permissionId" INTEGER NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "uq_role_permission" UNIQUE ("roleId", "permissionId")
);

CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL PRIMARY KEY,
    "cedula" VARCHAR(20) UNIQUE NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "apellido" VARCHAR(255) NULL,
    "correo" VARCHAR(255) UNIQUE NULL,
    "telefono" VARCHAR(50) NOT NULL,
    "direccion" VARCHAR(255) NOT NULL,
    "ciudad" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NULL,
    "reset_password_token" VARCHAR(255) UNIQUE NULL,
    "estado" BOOLEAN NOT NULL DEFAULT TRUE,
    "fotoPerfilUrl" TEXT NULL,
    "storageKeyFoto" VARCHAR(255) NULL,
    "deletedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "user_roles" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "roleId" INTEGER NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "uq_user_role" UNIQUE ("userId", "roleId")
);

CREATE TABLE IF NOT EXISTS "activaciones_cuenta" (
    "id" SERIAL PRIMARY KEY,
    "usuario_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token_hash" VARCHAR(64) UNIQUE NOT NULL,
    "tipo" VARCHAR(30) NOT NULL DEFAULT 'ACTIVACION',
    "expires_at" TIMESTAMP NOT NULL,
    "used_at" TIMESTAMP NULL,
    "revoked_at" TIMESTAMP NULL,
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. CATÁLOGOS TÉCNICOS Y DISPOSITIVOS
CREATE TABLE IF NOT EXISTS "tipo_equipo" (
    "id" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(255) UNIQUE NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS "marca" (
    "id" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(255) NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS "modelo" (
    "id" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(255) NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT TRUE,
    "marcaId" INTEGER NULL REFERENCES "marca"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS "equipo" (
    "id" SERIAL PRIMARY KEY,
    "numeroSerie" VARCHAR(255) UNIQUE NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT TRUE,
    "isDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "tipoEquipoId" INTEGER NULL REFERENCES "tipo_equipo"("id") ON DELETE SET NULL,
    "marcaId" INTEGER NULL REFERENCES "marca"("id") ON DELETE SET NULL,
    "modeloId" INTEGER NULL REFERENCES "modelo"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS "estado_orden" (
    "id" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(255) UNIQUE NOT NULL,
    "descripcion" TEXT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS "casillero" (
    "id" SERIAL PRIMARY KEY,
    "codigo" VARCHAR(100) NOT NULL,
    "situacion" casillero_situacion_enum NOT NULL DEFAULT 'Disponible',
    "descripcion" VARCHAR(255) NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT TRUE,
    "orderId" INTEGER NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP NULL
);

-- 4. ÓRDENES DE SERVICIO
CREATE TABLE IF NOT EXISTS "orders" (
    "id" SERIAL PRIMARY KEY,
    "tipoOrden" order_type_enum NOT NULL DEFAULT 'EXPRESS',
    "checklistData" JSONB NULL,
    "workOrderNumber" VARCHAR(50) NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT TRUE,
    "clientId" INTEGER NULL REFERENCES "users"("id") ON DELETE SET NULL,
    "technicianId" INTEGER NULL REFERENCES "users"("id") ON DELETE SET NULL,
    "recepcionistaId" INTEGER NULL REFERENCES "users"("id") ON DELETE SET NULL,
    "equipoId" INTEGER NOT NULL REFERENCES "equipo"("id") ON DELETE RESTRICT,
    "problemaReportado" TEXT NOT NULL,
    "accesorios" TEXT NULL,
    "fechaPrometidaEntrega" TIMESTAMP NULL,
    "casilleroId" INTEGER NULL REFERENCES "casillero"("id") ON DELETE SET NULL,
    "estadoOrdenId" INTEGER NULL REFERENCES "estado_orden"("id") ON DELETE SET NULL,
    "esperaRepuesto" BOOLEAN NOT NULL DEFAULT FALSE,
    "tiempoEstimadoReparacion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "clientRequestId" VARCHAR(100) UNIQUE NULL,
    "tokenAccesoHash" VARCHAR(64) NULL,
    "tokenAccesoExpiracion" TIMESTAMP NULL,
    "tokenAccesoRevocado" BOOLEAN NOT NULL DEFAULT FALSE,
    "tokenAccesoIntentosFallidos" INTEGER NOT NULL DEFAULT 0,
    "tokenAccesoBloqueadoHasta" TIMESTAMP NULL,
    "tokenAccesoUltimoUso" TIMESTAMP NULL,
    "entregadoPorNombre" VARCHAR(150) NULL,
    "entregadoPorCedula" VARCHAR(20) NULL,
    "entregadoPorParentesco" VARCHAR(50) NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP NULL
);

-- Vincular casillero a orders con FK
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_casillero_order'
    ) THEN
        ALTER TABLE "casillero"
        ADD CONSTRAINT "fk_casillero_order"
        FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "historial_estado_orden" (
    "id" SERIAL PRIMARY KEY,
    "ordenId" INTEGER NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "estadoOrdenId" INTEGER NOT NULL REFERENCES "estado_orden"("id") ON DELETE RESTRICT,
    "usuarioId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
    "observaciones" TEXT NULL,
    "fechaCambio" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5. ACTIVIDADES TÉCNICAS Y EVIDENCIAS
CREATE TABLE IF NOT EXISTS "tipo_actividad_tecnica" (
    "id" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(100) UNIQUE NOT NULL,
    "descripcion" TEXT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS "actividad_tecnica" (
    "id" SERIAL PRIMARY KEY,
    "ordenId" INTEGER NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "tipoActividadId" INTEGER NOT NULL REFERENCES "tipo_actividad_tecnica"("id") ON DELETE RESTRICT,
    "fecha" TIMESTAMP NOT NULL DEFAULT NOW(),
    "diagnostico" TEXT NOT NULL,
    "trabajoRealizado" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS "evidencia_tecnica" (
    "id" SERIAL PRIMARY KEY,
    "ordenId" INTEGER NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "subidoPorId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
    "estadoOrdenId" INTEGER NULL REFERENCES "estado_orden"("id") ON DELETE SET NULL,
    "storageKey" VARCHAR(500) NULL,
    "nombreOriginal" VARCHAR(255) NULL,
    "mimeType" VARCHAR(100) NULL,
    "tamanoBytes" BIGINT NULL,
    "storageProvider" VARCHAR(30) NOT NULL DEFAULT 'r2',
    "archivoUrl" TEXT NULL,
    "tipoArchivo" VARCHAR(50) NOT NULL,
    "descripcion" TEXT NULL,
    "fechaSubida" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6. PRESUPUESTOS Y AUTORIZACIONES
CREATE TABLE IF NOT EXISTS "estado_presupuesto" (
    "id" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(255) UNIQUE NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS "presupuesto" (
    "id" SERIAL PRIMARY KEY,
    "ordenId" INTEGER NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "estadoId" INTEGER NOT NULL REFERENCES "estado_presupuesto"("id") ON DELETE RESTRICT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "descripcion" TEXT NULL,
    "fechaEmision" TIMESTAMP NOT NULL DEFAULT NOW(),
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP NULL
);

-- 7. INVENTARIO, CATEGORÍAS Y REPUESTOS
CREATE TABLE IF NOT EXISTS "categoria" (
    "id" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS "parte" (
    "id" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(255) NOT NULL,
    "modelo" VARCHAR(255) NULL,
    "descripcion" TEXT NULL,
    "codigoInterno" VARCHAR(80) UNIQUE NULL,
    "costo" NUMERIC(12, 2) NOT NULL DEFAULT 0,
    "precio1" NUMERIC(12, 2) NOT NULL DEFAULT 0,
    "precio2" NUMERIC(12, 2) NOT NULL DEFAULT 0,
    "precio3" NUMERIC(12, 2) NOT NULL DEFAULT 0,
    "precio4" NUMERIC(12, 2) NOT NULL DEFAULT 0,
    "ivaTarifa" NUMERIC(5, 2) NOT NULL DEFAULT 0,
    "stock" NUMERIC(12, 3) NOT NULL DEFAULT 0,
    "stockMinimo" NUMERIC(12, 3) NOT NULL DEFAULT 0,
    "ubicacion" VARCHAR(255) NULL,
    "unidadMedida" VARCHAR(50) NOT NULL DEFAULT 'Unidad',
    "permiteModificarPrecio" BOOLEAN NOT NULL DEFAULT FALSE,
    "permiteFraccionar" BOOLEAN NOT NULL DEFAULT FALSE,
    "estado" BOOLEAN NOT NULL DEFAULT TRUE,
    "categoriaId" INTEGER NOT NULL REFERENCES "categoria"("id") ON DELETE RESTRICT,
    "marcaId" INTEGER NULL REFERENCES "marca"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS "detalle_repuestos" (
    "id" SERIAL PRIMARY KEY,
    "presupuestoId" INTEGER NOT NULL REFERENCES "presupuesto"("id") ON DELETE CASCADE,
    "parteId" INTEGER NULL REFERENCES "parte"("id") ON DELETE SET NULL,
    "estadoOrdenId" INTEGER NULL REFERENCES "estado_orden"("id") ON DELETE SET NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precioUnitario" NUMERIC(10, 2) NOT NULL DEFAULT 0,
    "subtotal" NUMERIC(10, 2) NOT NULL DEFAULT 0,
    "estado" BOOLEAN NOT NULL DEFAULT TRUE,
    "comentario" TEXT NULL,
    "fechaUso" TIMESTAMP NOT NULL DEFAULT NOW(),
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP NULL
);

-- 8. ACTAS, DOCUMENTOS LEGALES Y FIRMAS
CREATE TABLE IF NOT EXISTS "documentos_orden" (
    "id" SERIAL PRIMARY KEY,
    "ordenId" INTEGER NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "tipoDocumento" documentos_orden_tipodocumento_enum NOT NULL,
    "storageKeyPdf" VARCHAR(500) NULL,
    "storageKeyFirma" VARCHAR(500) NULL,
    "pdfSha256" VARCHAR(64) NULL,
    "versionTerminos" VARCHAR(30) NOT NULL DEFAULT 'v1.0',
    "terminosAceptados" BOOLEAN NOT NULL DEFAULT TRUE,
    "firmanteNombre" VARCHAR(150) NOT NULL,
    "firmanteIdentificacion" VARCHAR(20) NOT NULL,
    "estadoFirma" documentos_orden_estadofirma_enum NOT NULL DEFAULT 'FIRMADO',
    "motivoSinFirma" TEXT NULL,
    "ipCliente" VARCHAR(60) NULL,
    "userAgent" TEXT NULL,
    "registradoPorId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
    "fechaFirma" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS "autorizaciones_presupuesto" (
    "id" SERIAL PRIMARY KEY,
    "presupuestoId" INTEGER NOT NULL REFERENCES "presupuesto"("id") ON DELETE CASCADE,
    "ordenId" INTEGER NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "versionPresupuesto" INTEGER NOT NULL DEFAULT 1,
    "decision" autorizaciones_presupuesto_decision_enum NOT NULL DEFAULT 'APROBADO',
    "modalidad" autorizaciones_presupuesto_modalidad_enum NOT NULL DEFAULT 'TOKEN_ODS_PRIVADO',
    "montoAprobado" NUMERIC(12, 2) NOT NULL DEFAULT 0,
    "alcanceResumen" JSONB NULL,
    "autorizanteNombre" VARCHAR(150) NOT NULL,
    "autorizanteIdentificacion" VARCHAR(20) NOT NULL,
    "autorizanteParentesco" VARCHAR(50) NOT NULL DEFAULT 'TITULAR',
    "documentoOrdenId" INTEGER NULL REFERENCES "documentos_orden"("id") ON DELETE SET NULL,
    "registradoPorId" INTEGER NULL REFERENCES "users"("id") ON DELETE SET NULL,
    "ipOrigen" VARCHAR(60) NULL,
    "userAgent" TEXT NULL,
    "hashIntegridad" VARCHAR(64) NOT NULL,
    "fechaAutorizacion" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 9. COMPRAS, PROVEEDORES Y AJUSTES DE STOCK
CREATE TABLE IF NOT EXISTS "proveedor" (
    "id" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(150) NOT NULL,
    "ruc_nit" VARCHAR(50) UNIQUE NOT NULL,
    "correo" VARCHAR(150) NULL,
    "telefono" VARCHAR(50) NULL,
    "direccion" TEXT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "compra" (
    "id" SERIAL PRIMARY KEY,
    "numeroFactura" VARCHAR(100) NOT NULL,
    "fecha" TIMESTAMP NOT NULL,
    "subtotal" NUMERIC(12, 2) NOT NULL DEFAULT 0,
    "ivaPorcentaje" NUMERIC(5, 2) NOT NULL DEFAULT 0,
    "ivaMonto" NUMERIC(12, 2) NOT NULL DEFAULT 0,
    "total" NUMERIC(12, 2) NOT NULL DEFAULT 0,
    "comentario" TEXT NULL,
    "estado" VARCHAR(30) NOT NULL DEFAULT 'Completado',
    "proveedorId" INTEGER NOT NULL REFERENCES "proveedor"("id") ON DELETE RESTRICT,
    "usuarioId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "compra_detalle" (
    "id" SERIAL PRIMARY KEY,
    "compraId" INTEGER NOT NULL REFERENCES "compra"("id") ON DELETE CASCADE,
    "parteId" INTEGER NOT NULL REFERENCES "parte"("id") ON DELETE RESTRICT,
    "cantidad" NUMERIC(10, 2) NOT NULL DEFAULT 0,
    "precioUnitario" NUMERIC(12, 2) NOT NULL DEFAULT 0,
    "subtotal" NUMERIC(12, 2) NOT NULL DEFAULT 0,
    "actualizarCosto" BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS "ajuste_inventario" (
    "id" SERIAL PRIMARY KEY,
    "fecha" TIMESTAMP NOT NULL DEFAULT NOW(),
    "motivo" TEXT NOT NULL,
    "comentario" TEXT NULL,
    "usuarioId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS "ajuste_inventario_detalle" (
    "id" SERIAL PRIMARY KEY,
    "ajusteId" INTEGER NOT NULL REFERENCES "ajuste_inventario"("id") ON DELETE CASCADE,
    "parteId" INTEGER NOT NULL REFERENCES "parte"("id") ON DELETE RESTRICT,
    "stockSistema" NUMERIC(10, 2) NOT NULL,
    "stockFisico" NUMERIC(10, 2) NOT NULL,
    "diferencia" NUMERIC(10, 2) NOT NULL
);

-- 10. NOTIFICACIONES, CHECKLISTS, FIRMA ELECTRÓNICA Y CONFIGURACIÓN
CREATE TABLE IF NOT EXISTS "tipo_notificacion" (
    "id" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(255) UNIQUE NOT NULL,
    "descripcion" TEXT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS "notificaciones" (
    "id" SERIAL PRIMARY KEY,
    "usuarioId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "ordenServicioId" INTEGER NULL REFERENCES "orders"("id") ON DELETE SET NULL,
    "tipoId" INTEGER NOT NULL REFERENCES "tipo_notificacion"("id") ON DELETE RESTRICT,
    "mensaje" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT FALSE,
    "isDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "fechaEnvio" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS "checklist_template" (
    "id" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(255) NOT NULL,
    "tipoEquipoId" INTEGER NOT NULL REFERENCES "tipo_equipo"("id") ON DELETE CASCADE,
    "items" JSONB NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS "configuracion_sistema" (
    "id" SERIAL PRIMARY KEY,
    "ordenPrefijo" VARCHAR(20) NOT NULL DEFAULT '',
    "ordenSiguienteNumero" INTEGER NOT NULL DEFAULT 1,
    "ordenDigitos" INTEGER NOT NULL DEFAULT 5,
    "ordenPermitirReinicio" BOOLEAN NOT NULL DEFAULT FALSE,
    "presupuestoPrefijo" VARCHAR(20) NOT NULL DEFAULT 'PRE-',
    "presupuestoSiguienteNumero" INTEGER NOT NULL DEFAULT 1,
    "presupuestoDigitos" INTEGER NOT NULL DEFAULT 5,
    "nombreEmpresa" VARCHAR(150) NOT NULL DEFAULT 'Hospital del Computador',
    "nombreComercial" VARCHAR(150) NOT NULL DEFAULT 'Hospital del Computador',
    "ruc" VARCHAR(13) NOT NULL DEFAULT '1792999999001',
    "telefono" VARCHAR(20) NOT NULL DEFAULT '022123456',
    "whatsapp" VARCHAR(25) NOT NULL DEFAULT '+593 96 962 0222',
    "correoContacto" VARCHAR(100) NOT NULL DEFAULT 'soporte@elhospitaldelcomputador.com',
    "direccion" TEXT NOT NULL DEFAULT 'Quito, Pichincha, Ecuador',
    "ciudad" VARCHAR(100) NOT NULL DEFAULT 'Quito',
    "slogan" VARCHAR(200) NOT NULL DEFAULT 'Servicio Técnico Especializado en Computación, Laptops y Servidores',
    "logoUrl" TEXT NULL,
    "storageKeyLogo" VARCHAR(255) NULL,
    "diasAbandono" INTEGER NOT NULL DEFAULT 60,
    "diasGarantiaDefault" INTEGER NOT NULL DEFAULT 90,
    "terminosRecepcion" TEXT NOT NULL DEFAULT '1. RESPALDO DE INFORMACIÓN: Hospital del Computador no se responsabiliza por la pérdida de datos o software en discos de almacenamiento.\n2. CLÁUSULA DE ABANDONO: Equipos no retirados tras el plazo reglamentario causarán costos de bodegaje y podrán ser considerados en abandono legal.\n3. DIAGNÓSTICO PRELIMINAR: La recepción inicial es presuntiva sujeta a confirmación en laboratorio.',
    "terminosEntrega" TEXT NOT NULL DEFAULT 'El cliente declara haber recibido el equipo a entera satisfacción y conformidad tras la realización del servicio técnico. Toda reparación cuenta con garantía limitada sobre mano de obra técnica contra defectos del servicio prestado. No cubre humedad, golpes, sobrevoltajes ni sellos de seguridad violentados.',
    "porcentajeIva" NUMERIC(5, 2) NOT NULL DEFAULT 15.0,
    "diasVigenciaPresupuesto" INTEGER NOT NULL DEFAULT 15,
    "tiempoLimiteDiagnosticoHoras" INTEGER NOT NULL DEFAULT 48,
    "diasAlertaControlRetiro" INTEGER NOT NULL DEFAULT 15,
    "stockMinimoAlertaGlobal" INTEGER NOT NULL DEFAULT 5,
    "plantillaWhatsappRecepcion" TEXT NOT NULL DEFAULT '¡Hola, {cliente}! Su equipo {equipo} fue ingresado a Hospital del Computador con la Orden #{orden}. Puede seguir el estado en vivo ingresando a: {enlace_consulta}',
    "plantillaWhatsappListoEntrega" TEXT NOT NULL DEFAULT 'Estimado/a {cliente}, le informamos que su equipo {equipo} (Orden #{orden}) ha finalizado su proceso técnico exitosamente y se encuentra listo para retiro en nuestro taller.',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "firma_electronica_config" (
    "id" SERIAL PRIMARY KEY,
    "archivoP12Nombre" VARCHAR(255) NOT NULL DEFAULT 'gerente.p12',
    "archivoP12Ruta" TEXT NOT NULL,
    "passwordEncriptado" TEXT NOT NULL,
    "titularNombre" VARCHAR(255) NULL,
    "titularCedulaRuc" VARCHAR(50) NULL,
    "entidadEmisora" VARCHAR(255) NULL,
    "organizacion" VARCHAR(255) NULL,
    "fechaEmision" TIMESTAMP NULL,
    "fechaExpiracion" TIMESTAMP NULL,
    "serialNumber" VARCHAR(255) NULL,
    "activo" BOOLEAN NOT NULL DEFAULT TRUE,
    "firmarRecepcion" BOOLEAN NOT NULL DEFAULT TRUE,
    "firmarEntrega" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 11. ÍNDICES DE RENDIMIENTO Y CONSTRAINTS ÚNICOS
CREATE UNIQUE INDEX IF NOT EXISTS "idx_orders_client_request_id" 
    ON "orders" ("clientRequestId") 
    WHERE "clientRequestId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_orders_client_id" ON "orders" ("clientId");
CREATE INDEX IF NOT EXISTS "idx_orders_equipo_id" ON "orders" ("equipoId");
CREATE INDEX IF NOT EXISTS "idx_orders_estado_orden_id" ON "orders" ("estadoOrdenId");
CREATE INDEX IF NOT EXISTS "idx_orders_token_hash" ON "orders" ("tokenAccesoHash") WHERE "tokenAccesoHash" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_aut_presupuesto_orden" ON "autorizaciones_presupuesto" ("ordenId");
CREATE INDEX IF NOT EXISTS "idx_aut_presupuesto_presupuesto" ON "autorizaciones_presupuesto" ("presupuestoId");
CREATE INDEX IF NOT EXISTS "idx_documentos_orden_orden_id" ON "documentos_orden" ("ordenId");
CREATE INDEX IF NOT EXISTS "idx_historial_estado_orden_orden_id" ON "historial_estado_orden" ("ordenId");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_parte_codigo_interno_unique" 
    ON "parte" ("codigoInterno") 
    WHERE "codigoInterno" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_activaciones_usuario_id" ON "activaciones_cuenta" ("usuario_id");
CREATE INDEX IF NOT EXISTS "idx_activaciones_token_hash" ON "activaciones_cuenta" ("token_hash");

COMMIT;

