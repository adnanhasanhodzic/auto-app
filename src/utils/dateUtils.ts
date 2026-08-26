/**
 * Utility functions for Bosnian dd.mm.yyyy date calculations
 */

export function getTodayFormatted(): string {
  const d = new Date();
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}.`;
}

export function parseCustomDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Clean dots, spaces, slashes
  const clean = dateStr.replace(/\.$/, '').trim();
  const parts = clean.split(/[./-]/);
  if (parts.length < 3) return null;

  let day: number;
  let month: number;
  let year: number;

  if (parts[0].length === 4 || parseInt(parts[0], 10) > 1000) {
    // ISO format: YYYY-MM-DD
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  } else {
    // Bosnian / European format: DD.MM.YYYY
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    year = parseInt(parts[2], 10);
  }

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  const d = new Date(year, month, day);
  return isNaN(d.getTime()) ? null : d;
}

export function getDateTimestamp(dateStr?: string, fallbackCreatedAt?: number): number {
  if (dateStr) {
    const d = parseCustomDate(dateStr);
    if (d) return d.getTime();
  }
  return fallbackCreatedAt || 0;
}

export function formatDateCustom(d: Date): string {
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}.`;
}

export function formatDateToInput(dateStr: string): string {
  if (!dateStr) return '';
  const d = parseCustomDate(dateStr);
  if (!d) return dateStr;
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateToDisplay(isoStr: string): string {
  if (!isoStr) return '';
  if (isoStr.includes('.') && isoStr.split('.').length >= 3) {
    return isoStr.endsWith('.') ? isoStr : `${isoStr}.`;
  }
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}.`;
  }
  return isoStr;
}

export function addMonthsToDate(dateStr: string, months: number): string {
  const d = parseCustomDate(dateStr) || new Date();
  const target = new Date(d);
  target.setMonth(target.getMonth() + months);
  return formatDateCustom(target);
}

export function addYearsToDate(dateStr: string, years: number): string {
  const d = parseCustomDate(dateStr) || new Date();
  const target = new Date(d);
  target.setFullYear(target.getFullYear() + years);
  return formatDateCustom(target);
}

export function calculateDaysRemaining(targetDateStr: string): number {
  const target = parseCustomDate(targetDateStr);
  if (!target) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export interface WarrantyCalculation {
  endDate: string;
  daysRemaining: number;
  monthsRemaining: number;
  extraDaysRemaining: number;
  status: 'valid' | 'soon' | 'expired';
  statusLabel: string;
  detailText: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
}

export function calculateWarrantyStatus(
  startDateStr: string,
  durationMonths: number
): WarrantyCalculation {
  const start = parseCustomDate(startDateStr) || new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + durationMonths);
  const endDateStr = formatDateCustom(end);

  const daysRemaining = calculateDaysRemaining(endDateStr);

  if (daysRemaining < 0) {
    return {
      endDate: endDateStr,
      daysRemaining,
      monthsRemaining: 0,
      extraDaysRemaining: 0,
      status: 'expired',
      statusLabel: 'Garancija je istekla',
      detailText: `Istekla ${Math.abs(daysRemaining)} dana`,
      badgeBg: 'bg-red-50 text-red-700 border-red-200/70',
      badgeText: '🔴 Garancija je istekla',
      dotColor: 'bg-red-500',
    };
  }

  const monthsRemaining = Math.floor(daysRemaining / 30);
  const extraDaysRemaining = daysRemaining % 30;

  let detailText = '';
  if (monthsRemaining > 0) {
    detailText = `Preostalo: ${monthsRemaining} ${monthsRemaining === 1 ? 'mjesec' : 'mjeseci'}${
      extraDaysRemaining > 0 ? ` i ${extraDaysRemaining} ${extraDaysRemaining === 1 ? 'dan' : 'dana'}` : ''
    }`;
  } else {
    detailText = `Preostalo: ${daysRemaining} ${daysRemaining === 1 ? 'dan' : 'dana'}`;
  }

  if (daysRemaining <= 30) {
    return {
      endDate: endDateStr,
      daysRemaining,
      monthsRemaining,
      extraDaysRemaining,
      status: 'soon',
      statusLabel: 'Garancija uskoro ističe',
      detailText,
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200/70',
      badgeText: '🟡 Garancija uskoro ističe',
      dotColor: 'bg-amber-500',
    };
  }

  return {
    endDate: endDateStr,
    daysRemaining,
    monthsRemaining,
    extraDaysRemaining,
    status: 'valid',
    statusLabel: 'Garancija važi',
    detailText,
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
    badgeText: '🟢 Garancija važi',
    dotColor: 'bg-emerald-500',
  };
}
