export interface EcuadorDateRange {
  from: Date;
  to: Date;
  label: string;
  preset: string;
}

/**
 * Normaliza rangos de fecha para reportes en la zona horaria de Ecuador (America/Guayaquil, UTC-5)
 * con límites de inicio inclusivo [from] y fin exclusivo [< to].
 */
export function getEcuadorDateRange(
  preset: string = 'month',
  startDate?: string,
  endDate?: string,
): EcuadorDateRange {
  // Hora actual en Ecuador (UTC-5 fijo, sin cambio de horario)
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const ecuadorNow = new Date(utcMs - 5 * 3600000);

  const y = ecuadorNow.getFullYear();
  const m = ecuadorNow.getMonth(); // 0-11
  const d = ecuadorNow.getDate();

  // Helper para construir un Date UTC que corresponde exactamente a las 00:00:00 hora Ecuador (05:00:00 UTC)
  const makeEcuadorMidnightUtc = (year: number, month: number, day: number): Date => {
    return new Date(Date.UTC(year, month, day, 5, 0, 0, 0));
  };

  // Si se envían fechas personalizadas válidas
  if (startDate && endDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);

    const from = makeEcuadorMidnightUtc(sy, sm - 1, sd);
    // Fin exclusivo: inicio del día siguiente a endDate
    const to = makeEcuadorMidnightUtc(ey, em - 1, ed + 1);

    return {
      from,
      to,
      label: `${startDate} al ${endDate}`,
      preset: 'custom',
    };
  }

  switch (preset) {
    case 'today': {
      const from = makeEcuadorMidnightUtc(y, m, d);
      const to = makeEcuadorMidnightUtc(y, m, d + 1);
      return { from, to, label: 'Hoy', preset: 'today' };
    }
    case 'yesterday': {
      const from = makeEcuadorMidnightUtc(y, m, d - 1);
      const to = makeEcuadorMidnightUtc(y, m, d);
      return { from, to, label: 'Ayer', preset: 'yesterday' };
    }
    case 'week': {
      // Semana actual iniciando el lunes
      const dayOfWeek = ecuadorNow.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const mondayDay = d - diffToMonday;
      const from = makeEcuadorMidnightUtc(y, m, mondayDay);
      const to = makeEcuadorMidnightUtc(y, m, mondayDay + 7);
      return { from, to, label: 'Esta Semana', preset: 'week' };
    }
    case 'last_month': {
      const from = makeEcuadorMidnightUtc(y, m - 1, 1);
      const to = makeEcuadorMidnightUtc(y, m, 1);
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
      ];
      const prevMonthName = monthNames[(m + 11) % 12];
      const prevYear = m === 0 ? y - 1 : y;
      return { from, to, label: `${prevMonthName} ${prevYear}`, preset: 'last_month' };
    }
    case 'year': {
      const from = makeEcuadorMidnightUtc(y, 0, 1);
      const to = makeEcuadorMidnightUtc(y + 1, 0, 1);
      return { from, to, label: `Año ${y}`, preset: 'year' };
    }
    case 'all': {
      return {
        from: new Date(0),
        to: new Date(Date.now() + 86400000 * 365),
        label: 'Histórico Completo',
        preset: 'all',
      };
    }
    case 'month':
    default: {
      const from = makeEcuadorMidnightUtc(y, m, 1);
      const to = makeEcuadorMidnightUtc(y, m + 1, 1);
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
      ];
      return { from, to, label: `${monthNames[m]} ${y}`, preset: 'month' };
    }
  }
}

/**
 * Formatea una fecha a la representación local legible de Ecuador (DD/MM/YYYY o DD/MM/YYYY HH:mm)
 */
export function formatEcuadorDate(date: Date | string | null | undefined, includeTime = false): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';

  // Desplazamiento a UTC-5
  const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
  const ecuadorDate = new Date(utcMs - 5 * 3600000);

  const day = String(ecuadorDate.getDate()).padStart(2, '0');
  const month = String(ecuadorDate.getMonth() + 1).padStart(2, '0');
  const year = ecuadorDate.getFullYear();

  if (!includeTime) {
    return `${day}/${month}/${year}`;
  }

  const hours = String(ecuadorDate.getHours()).padStart(2, '0');
  const minutes = String(ecuadorDate.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
