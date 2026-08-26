import { CarData, ServiceRecord } from '../types';

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
