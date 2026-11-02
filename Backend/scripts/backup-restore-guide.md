# Protocolo de Respaldo, Restauración y Reconciliación de Base de Datos y Cloudflare R2
**Hospital del Computador — Manual Operativo de Contingencia y Recuperación ante Desastres (DR)**

---

## 1. Arquitectura de Almacenamiento Híbrido

El sistema opera bajo un modelo desacoplado:
1. **PostgreSQL (`hdc`)**: Almacena el modelo relacional transaccional (clientes, usuarios, equipos, inventario, historial de estados, órdenes de servicio, llaves de almacenamiento `storageKey` y hashes criptográficos `pdfSha256`).
2. **Cloudflare R2 (`hospital-computador-dev`)**: Almacena los artefactos binarios inmutables (actas firmadas en PDF A4 canónico, capturas de firmas manuscritas en PNG, fotos de evidencias técnicas, logos corporativos y avatares).

> **Principio de Continuidad:**
> Un respaldo de la base de datos PostgreSQL por sí solo NO contiene los binarios (PDFs/firmas), sino sus punteros. Para garantizar la recuperación total sin pérdida de validez legal, se debe asegurar la reconciliación entre PostgreSQL y Cloudflare R2.

---

## 2. Estrategia de Respaldo (Backup)

### A. Respaldo Lógico de PostgreSQL
Ejecutar diariamente mediante tarea programada (cron / Windows Task Scheduler):

```bash
# Formato binario comprimido con metadatos y BLOBs (-Fc)
pg_dump -h localhost -p 5432 -U postgres -d hdc -Fc -f "backups/hdc_backup_$(date +%Y%m%d_%H%M%S).dump"
```

**Parámetros recomendados:**
- `-Fc` (Format Custom): Permite restauración granular, paralelismo y reordenamiento de tablas.
- `--no-owner --no-privileges`: Facilita la restauración en servidores o entornos diferentes.

### B. Respaldo de Almacenamiento en Cloudflare R2
Cloudflare R2 cuenta con redundancia geográfica distribuida (durabilidad 99.999999999% - 11 nueves). Sin embargo, para contingencia offline secundaria o cold-storage:

```bash
# Sincronización local o a bucket secundario con rclone o aws-cli
aws s3 sync s3://hospital-computador-dev ./cold_storage_r2/ --endpoint-url https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com
```

---

## 3. Protocolo de Restauración (Disaster Recovery)

Ante una corrupción de base de datos o caída del servidor:

### Paso 1: Recrear la base de datos limpia
```sql
DROP DATABASE IF EXISTS hdc;
CREATE DATABASE hdc WITH ENCODING 'UTF8';
```

### Paso 2: Restaurar el volcado
```bash
pg_restore -h localhost -p 5432 -U postgres -d hdc --clean --if-exists -v "backups/hdc_backup_TARGET.dump"
```

### Paso 3: Ejecución de la Verificación y Reconciliación
Una vez restaurada la base de datos, ejecutar inmediatamente el script de auditoría:

```bash
cd Backend
node test/reconciliar-r2-db.js
```

El script validará automáticamente:
1. **Existencia en R2:** Verifica que cada `storageKeyPdf`, `storageKeyFirma` y `storageKeyLogo` persista en Cloudflare R2.
2. **Integridad Criptográfica:** Recalcula el SHA-256 de cada PDF en R2 y lo compara contra el campo `pdfSha256` guardado en la tabla `documentos_orden`.
3. **Detección de Huérfanos:** Informa cualquier discrepancia entre registros y almacenamiento.

---

## 4. Matriz de Respuestas a los 4 Escenarios Críticos

| Escenario | Mecanismo Implementado | Garantía Operativa |
| :--- | :--- | :--- |
| **A — Dos trabajadores modifican la misma orden** | `@VersionColumn()`, verificación atómica en query y registro de usuario en `HistorialEstadoOrden` | Si el Técnico 1 guarda cambios, la versión incrementa. Si el Técnico 2 intenta guardar con versión desactualizada, recibe un `HTTP 409 Conflict`, evitando el *Lost Update*. Se recargan los datos y ambos trabajadores quedan identificados con nombre y fecha en el historial. |
| **B — Se pierde la conexión durante la recepción** | Autoguardado debounced en `localStorage` (`hdc_orden_draft_v1`) + Llave de idempotencia `clientRequestId` | Si se interrumpe la red, la recepcionista no pierde nada; al recargar o reconectar se le ofrece restaurar el borrador. Si reintenta presionar Guardar, el backend intercepta el `clientRequestId` y no duplica la orden. |
| **C — Fallo en base de datos** | Volcado `-Fc` + Punteros inmutables en R2 + Script `reconciliar-r2-db.js` | El respaldo relacional se restaura y el script certifica que el 100% de las actas y firmas siguen intactas y con hashes SHA-256 idénticos en Cloudflare R2. |
| **D — Modificación de orden post-firma** | Bloqueo en `orders.service.ts` ante existencia de Acta de Recepción `FIRMADO` + Bloqueo visual `readOnly` en frontend | Ni el cliente ni el equipo ni los accesorios ni el problema reportado pueden alterarse post-firma. El PDF canónico en R2 permanece inmutable y blindado con sello SHA-256. Nuevos diagnósticos deben ir como actividades técnicas o anexos. |
