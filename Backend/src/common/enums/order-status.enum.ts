/**
 * Catálogo Canónico Oficial de los 5 Estados Principales de Órdenes de Servicio (ODS)
 * Hospital del Computador
 */
export enum EstadoOrdenEnum {
  RECEPCION = 'Recepción',
  DIAGNOSTICO = 'Diagnóstico',
  EN_SERVICIO = 'En Servicio',
  LISTO_PARA_ENTREGA = 'Listo para Entrega',
  ENTREGADO = 'Entregado',
}

/**
 * Claves canónicas normalizadas para identificación unívoca e independiente de IDs en base de datos.
 */
export type EstadoOrdenKey =
  | 'recepcion'
  | 'diagnostico'
  | 'en_servicio'
  | 'listo_para_entrega'
  | 'entregado';
