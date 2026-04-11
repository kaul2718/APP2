interface UserDisplayName {
  nombre: string;
  apellido?: string;
}

export function formatDate(dateString?: string): string {
  if (!dateString) {
    return 'No especificada';
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return 'Fecha invalida';
  }

  return date.toLocaleDateString('es-ES');
}

export function formatCurrency(value?: number, currency = 'COP'): string {
  if (typeof value !== 'number') {
    return 'No especificado';
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatUserName(user?: UserDisplayName): string {
  if (!user) {
    return 'No asignado';
  }

  return `${user.nombre} ${user.apellido ?? ''}`.trim();
}
