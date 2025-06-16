export enum EstadoOrden {
    // La orden ha sido registrada, pero aún no se ha asignado a un técnico para su revisión.
    PENDIENTE = 'Pendiente',

    // El técnico ha comenzado a revisar o trabajar en el equipo.
    EN_REVISION = 'En Revisión',

    // El técnico está trabajando activamente en la reparación del equipo.
    EN_REPARACION = 'En Reparación',

    // Se necesita una acción del cliente, como aprobar un presupuesto o confirmar la autorización para proceder con la reparación.
    EN_ESPERA_CLIENTE = 'En Espera del Cliente',

    // El equipo no puede ser reparado, ya sea por un error en la evaluación, costo elevado de la reparación, o decisión del cliente.
    RECHAZADO = 'Rechazado',

    // El técnico no puede continuar con la reparación debido a la falta de repuestos o piezas necesarias.
    EN_ESPERA_PARTES = 'En Espera de Partes',

    // El cliente ha decidido cancelar la orden de trabajo en cualquier momento.
    CANCELADA = 'Cancelada',

    // Después de la reparación, el equipo está siendo probado antes de la entrega al cliente.
    EN_PRUEBA = 'En Prueba',

    // La reparación se ha completado y el equipo está listo para ser entregado al cliente.
    TERMINADO = 'Terminado',

    // El equipo está listo para ser entregado al cliente después de la reparación.
    LISTO = 'Listo'
}
