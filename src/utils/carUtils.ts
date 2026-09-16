import { CarData, ServiceRecord } from '../types';
import { parseCustomDate } from './dateUtils';

/**
 * Calculates the current real-time mileage for a vehicle.
 * It considers the vehicle's initial base mileage and all services / fuel / repairs logged for this vehicle.
 * If services are edited or deleted, it dynamically reflects the highest recorded mileage or fallback base mileage.
 */
export const calculateCarMileage = (
  car: CarData,
  records: ServiceRecord[]
): number => {
  const base = car.initialMileage !== undefined ? car.initialMileage : (car.mileage || 0);
  const carRecordMileages = records
    .filter((s) => s.carId === car.id && typeof s.mileage === 'number' && s.mileage > 0)
    .map((s) => s.mileage);

  if (carRecordMileages.length === 0) {
    return base;
  }
  return Math.max(base, ...carRecordMileages);
};

export interface MileageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Ensures mileage entries stay chronological: a record dated today or later can't have
 * a lower mileage than one already recorded on or before that date (that would mean the
 * odometer went backwards). Entering a lower mileage IS allowed if the record's own date
 * is earlier than the date of the higher reading (backfilling older history).
 *
 * excludeRecordId should be passed when editing an existing record, so it doesn't get
 * compared against itself.
 */
export const validateMileageForDate = (
  car: CarData,
  records: ServiceRecord[],
  dateStr: string,
  mileage: number,
  excludeRecordId?: string
): MileageValidationResult => {
  const targetDate = parseCustomDate(dateStr);
  if (!targetDate) {
    // Can't validate without a parseable date; don't block the save on that basis.
    return { valid: true };
  }

  const base = car.initialMileage !== undefined ? car.initialMileage : (car.mileage || 0);

  const relevant = records.filter(
    (r) =>
      r.carId === car.id &&
      r.id !== excludeRecordId &&
      typeof r.mileage === 'number' &&
      r.mileage > 0
  );

  let maxBeforeOrOn = base;
  let minAfter: number | null = null;

  relevant.forEach((r) => {
    const rDate = parseCustomDate(r.date);
    if (!rDate) return;
    if (rDate.getTime() <= targetDate.getTime()) {
      if (r.mileage > maxBeforeOrOn) maxBeforeOrOn = r.mileage;
    } else if (minAfter === null || r.mileage < minAfter) {
      minAfter = r.mileage;
    }
  });

  if (mileage < maxBeforeOrOn) {
    return {
      valid: false,
      error: `Kilometraža ne može biti manja od ${maxBeforeOrOn.toLocaleString('bs-BA')} km — toliko je već upisano na ili prije ovog datuma. Manju kilometražu možeš unijeti samo za raniji datum.`,
    };
  }

  if (minAfter !== null && mileage > (minAfter as number)) {
    return {
      valid: false,
      error: `Kilometraža ne može biti veća od ${(minAfter as number).toLocaleString('bs-BA')} km — postoji kasniji unos sa manjom kilometražom.`,
    };
  }

  return { valid: true };
};
