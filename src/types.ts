export type ServiceCategory =
  | 'mehanika'
  | 'elektrika'
  | 'limarija'
  | 'oprema'
  | 'gume_felge'
  | 'klima'
  | 'tekucine'
  | 'gorivo'
  | 'ostalo';

export interface CarData {
  id: string;
  make: string;
  model: string;
  year?: number | string;
  engine?: string;
  powerKw?: number | string;
  fuel?: string;
  mileage: number;
  initialMileage?: number;
  licensePlate?: string;
  vin?: string;
  image?: string; // base64 or photo URL
}

export interface WarrantyInfo {
  hasWarranty: boolean;
  durationMonths: number; // e.g. 12, 24, 36
  startDate: string; // dd.mm.gggg
  endDate: string; // dd.mm.gggg
}

export interface NextServiceInterval {
  trackMileage: boolean;
  intervalKm: number; // e.g. 10000, 15000
  targetKm: number;
  trackTime: boolean;
  intervalMonths: number; // e.g. 12
  targetDate: string; // dd.mm.gggg
}

export interface ServiceRecord {
  id: string;
  carId: string;
  category: ServiceCategory;
  categoryName: string;
  title: string; // Primary work title
  subGroup?: string; // e.g. "MOTOR", "MJENJAČ"
  date: string; // dd.mm.gggg
  mileage: number;
  items: string[]; // All checked work items
  cost: number;
  currency: string; // "KM"
  note?: string;
  receiptImage?: string; // base64 image if attached
  warranty?: WarrantyInfo;
  nextService?: NextServiceInterval;
  createdAt: number;
}

export interface VehicleObligation {
  id: string;
  carId: string;
  type: 'registracija' | 'osiguranje' | 'tehnicki';
  title: string;
  date: string; // dd.mm.gggg
  expiryDate: string; // dd.mm.gggg
}

export interface MaintenanceItem {
  id: string;
  title: string;
  dueText: string;
  iconType: 'oil' | 'tire' | 'brake' | 'battery' | 'wrench' | 'snowflake' | 'shield' | 'gift';
  status: 'normal' | 'soon' | 'warning';
}

export interface RegularServiceStatus {
  type: 'mali' | 'veliki';
  title: string; // 'Mali servis' | 'Veliki servis'
  lastServiceDate?: string;
  lastServiceMileage?: number;
  targetDate?: string;
  targetKm?: number;
  daysRemaining?: number;
  kmRemaining?: number;
  isConfigured: boolean;
  hasInterval?: boolean;
  isOverdue?: boolean;
  trackTime?: boolean;
  trackMileage?: boolean;
}

export interface NextService {
  title: string;
  date: string;
  mileage: number;
  daysRemaining?: number;
  kmRemaining?: number;
  note?: string;
}

export interface ObligationItem {
  id: string;
  title: string;
  expiryDate: string;
  daysRemaining: number;
  iconType: 'doc' | 'shield' | 'check';
}

export type NavTab = 'pocetna' | 'istorija' | 'odrzavanje' | 'troskovi';
