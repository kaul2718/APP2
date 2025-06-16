export enum TareaRealizar {
    // Se realiza una revisión del equipo para identificar posibles fallos o problemas.
    REVISION = 'Revisión',
  
    // El equipo está siendo reparado para solucionar una falla o daño identificado.
    REPARACION = 'Reparación',
  
    // Reparación de un equipo que está dentro del período de garantía del fabricante.
    GARANTIA = 'Reparación en Garantía',
  
    // Servicio preventivo para mantener el equipo en buenas condiciones (como limpieza interna o revisión general).
    MANTENIMIENTO = 'Mantenimiento',
  
    // Se realiza una actualización de software, ya sea del sistema operativo, drivers u otros programas.
    ACTUALIZACION_SOFTWARE = 'Actualización de Software',
  
    // Recuperación de datos de un equipo que presenta fallos en el almacenamiento o ha sufrido daños.
    RECUPERACION_DE_DATOS = 'Recuperación de Datos',
  
    // Reemplazo de piezas o partes específicas del equipo (como disco duro, RAM, etc.).
    SUSTITUCION_DE_PARTES = 'Sustitución de Partes',
  
    // Diagnóstico del problema del equipo sin proceder aún con una reparación o solución directa.
    DIAGNOSTICO = 'Diagnóstico',
  
    // Actualización de firmware o BIOS para mejorar la compatibilidad o corregir errores del hardware.
    ACTUALIZACION_FIRMWARE = 'Actualización de Firmware',
  
    // Instalación de software específico solicitado por el cliente, como antivirus o programas profesionales.
    INSTALACION_SOFTWARE = 'Instalación de Software',
  
    // Inspección para verificar vulnerabilidades de seguridad o problemas de configuración en el sistema.
    INSPECCION_DE_SEGURIDAD = 'Inspección de Seguridad',
  
    // Verificación del rendimiento general del equipo después de una reparación o para comprobar su funcionalidad.
    VERIFICACION_DE_RENDIMIENTO = 'Verificación de Rendimiento',
  
    // Servicio de limpieza física del equipo, como ventiladores, teclado, pantalla, etc.
    SERVICIO_DE_LIMPIEZA = 'Servicio de Limpieza'
  }
  