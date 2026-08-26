import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Wrench,
  ChevronRight,
  Calendar,
  Gauge,
  Clock,
  ChevronDown,
} from 'lucide-react';
import {
  CarData,
  RegularServiceStatus,
  ServiceRecord,
  ObligationItem,
  NavTab,
} from '../types';
import { calculateDaysRemaining, getDateTimestamp } from '../utils/dateUtils';
import { CategoryIcon, getCategoryStyle } from './CategoryIcons';

interface HomeScreenProps {
  car: CarData;
  maliServis?: RegularServiceStatus | null;
  velikiServis?: RegularServiceStatus | null;
  recentServices?: ServiceRecord[];
  obligations?: ObligationItem[];
  onUpdateMileage?: (newMileage: number) => void;
  onOpenVehicleSelector?: () => void;
  onOpenAddService: () => void;
  onOpenRegularService?: (type: 'mali' | 'veliki') => void;
  onOpenObligationModal?: () => void;
  onNavigateTab?: (tab: NavTab) => void;
  onDeleteCar?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  car,
  maliServis,
  velikiServis,
  recentServices = [],
  obligations = [],
  onOpenVehicleSelector,
  onOpenAddService,
  onOpenRegularService,
  onOpenObligationModal,
  onNavigateTab,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const formatKm = (num?: number) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('de-DE');
  };

  // Find registration obligation (if any)
  const registrationObligation = useMemo(() => {
    return obligations.find(
      (o) =>
        o.title.toLowerCase().includes('registracija') ||
        o.iconType === 'doc'
    );
  }, [obligations]);

  // Sort recent services by actual date value descending (newest first), maximum 5 items
  const sortedRecentServices = useMemo(() => {
    return [...recentServices]
      .sort((a, b) => {
        const timeA = getDateTimestamp(a.date, a.createdAt);
        const timeB = getDateTimestamp(b.date, b.createdAt);
        return timeB - timeA;
      })
      .slice(0, 5);
  }, [recentServices]);

  // Compute single closest upcoming service item under <= 30 days (excluding registration, mali servis, veliki servis)
  const closestUpcomingService = useMemo(() => {
    const candidateList: {
      id: string;
      title: string;
      targetDate: string;
      daysRemaining: number;
      category?: string;
    }[] = [];

    // 1. From services with nextService
    recentServices.forEach((s) => {
      const lowerTitle = (s.title || '').toLowerCase();
      const lowerCat = (s.category || '').toLowerCase();
      // Exclude registracija, mali servis, veliki servis (they have dedicated cards)
      if (
        lowerTitle.includes('registracij') ||
        lowerCat === 'registracija' ||
        lowerTitle.includes('mali servis') ||
        lowerTitle.includes('veliki servis')
      ) {
        return;
      }

      if (s.nextService && s.nextService.targetDate) {
        const days = calculateDaysRemaining(s.nextService.targetDate);
        if (days !== null && days <= 30) {
          candidateList.push({
            id: s.id,
            title: s.title,
            targetDate: s.nextService.targetDate,
            daysRemaining: days,
            category: s.category,
          });
        }
      }
    });

    // 2. From obligations (other than registration)
    obligations.forEach((o) => {
      const lowerTitle = (o.title || '').toLowerCase();
      if (
        lowerTitle.includes('registracij') ||
        o.iconType === 'doc'
      ) {
        return;
      }

      if (o.expiryDate) {
        const days = calculateDaysRemaining(o.expiryDate);
        if (days !== null && days <= 30) {
          candidateList.push({
            id: o.id,
            title: o.title,
            targetDate: o.expiryDate,
            daysRemaining: days,
            category: o.iconType === 'fuel' ? 'gorivo' : 'ostalo',
          });
        }
      }
    });

    if (candidateList.length === 0) return null;

    // Sort by days remaining (closest deadline first: overdue first, then lowest days)
    candidateList.sort((a, b) => a.daysRemaining - b.daysRemaining);
    return candidateList[0];
  }, [recentServices, obligations]);

  return (
    <div id="home-screen" className="h-full flex flex-col overflow-hidden bg-[#F8FAFC] select-none px-4 pt-3 pb-3 space-y-2.5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-full shadow-lg transition-all animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* 1. HEADER: APP TITLE & VEHICLE SELECTOR */}
      <div className="flex items-center justify-between">
        <div className="text-xl font-black tracking-tight">
          <span className="text-[#0F172A]">MOJ </span>
          <span className="text-[#1D68F2]">AUTO</span>
        </div>

        <button
          onClick={onOpenVehicleSelector}
          title="Odabir vozila"
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:border-[#1D68F2] hover:bg-blue-50/30 transition-all cursor-pointer"
        >
          <div className="text-[#1D68F2]">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
            </svg>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-700 stroke-[2.5]" />
        </button>
      </div>

      {/* 2. VEHICLE PHOTO + BASIC DATA + MILEAGE */}
      <div className="flex items-center space-x-3.5">
        {/* Vehicle Image or Neutral Illustration */}
        <div className="w-22 h-20 sm:w-26 sm:h-22 rounded-2xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden flex-shrink-0 flex items-center justify-center p-1 relative">
          {car.image ? (
            <img
              src={car.image}
              alt={`${car.make} ${car.model}`}
              className="w-full h-full object-cover object-center rounded-xl"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-slate-50 to-slate-100 rounded-xl flex flex-col items-center justify-center p-1 text-slate-400">
              <svg
                viewBox="0 0 120 70"
                className="w-full h-full text-slate-400 fill-none stroke-current"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  d="M12 44 L22 44 C24 35 34 35 36 44 L78 44 C80 35 90 35 92 44 L108 44 C112 44 115 41 114 36 L110 28 C108 24 103 22 98 22 L82 22 L68 12 C65 10 60 9 55 9 L32 9 C27 9 22 13 20 18 L10 32 C8 35 8 40 12 44 Z"
                  className="fill-slate-200/60 stroke-slate-400"
                />
                <path d="M36 22 L78 22" strokeWidth="2" strokeDasharray="3 3" />
                <path d="M48 12 L50 22" strokeWidth="2" />
                <circle cx="29" cy="44" r="9" className="fill-white stroke-slate-500" strokeWidth="4" />
                <circle cx="29" cy="44" r="3.5" className="fill-slate-400" />
                <circle cx="85" cy="44" r="9" className="fill-white stroke-slate-500" strokeWidth="4" />
                <circle cx="85" cy="44" r="3.5" className="fill-slate-400" />
              </svg>
            </div>
          )}
        </div>

        {/* Vehicle Text Details */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
            {car.make} {car.model}
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate">
            {[car.engine, car.powerKw ? `${car.powerKw} kW` : null, car.year].filter(Boolean).join(' • ') || (car.fuel || 'Vozilo')}
          </p>

          {/* Mileage */}
          <div className="mt-1 space-y-0.5">
            <div className="text-base font-extrabold text-[#1D68F2] tracking-tight leading-tight">
              {formatKm(car.mileage)} km
            </div>
            <div className="text-[11px] font-medium text-slate-400 leading-none">
              Trenutna kilometraža
            </div>
          </div>
        </div>
      </div>

      {/* 3. ACTION BUTTON: DODAJ RAD / SERVIS */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={onOpenAddService}
        className="w-full py-2.5 px-4 bg-[#1D68F2] hover:bg-blue-600 active:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer flex-shrink-0"
      >
        <Wrench className="w-4 h-4 stroke-[2.5]" />
        <span className="tracking-wide">DODAJ RAD / SERVIS</span>
      </motion.button>

      {/* 4. POSLJEDNJI RADOVI (Maksimalno 3, sortirano najnoviji -> najstariji) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs space-y-1.5 flex-shrink-0">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-900 tracking-wider uppercase">
            POSLJEDNJI RADOVI
          </span>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('istorija')}
              className="text-xs font-bold text-[#1D68F2] hover:text-blue-700 flex items-center space-x-0.5 cursor-pointer"
            >
              <span>Prikaži sve</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* List of Recent Services */}
        {sortedRecentServices.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {sortedRecentServices.map((record) => {
              const style = getCategoryStyle(record.category);

              return (
                <div
                  key={record.id}
                  onClick={() => onNavigateTab && onNavigateTab('istorija')}
                  className="py-1.5 first:pt-0.5 last:pb-0 flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    <div
                      className={`w-7.5 h-7.5 rounded-xl ${style.bg} flex items-center justify-center flex-shrink-0`}
                    >
                      <CategoryIcon
                        type={record.category}
                        color={style.color}
                        className="w-4 h-4"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {record.title}
                      </div>
                      <div className="text-[10px] font-medium text-slate-500 truncate">
                        {record.date} • {formatKm(record.mileage)} km
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    <span className="text-xs font-bold text-slate-800 bg-slate-100/90 px-2 py-0.5 rounded-lg">
                      {record.cost} {record.currency || 'KM'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-2 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Još nema evidentiranih radova.
            </p>
          </div>
        )}
      </div>

      {/* 5. PRESTOJEĆI SERVISI (UVIJEK VIDLJIVO - MAKSIMALNO 1 NAJBLIŽA STAVKA ILI PORUKA) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs space-y-1.5 flex-shrink-0">
        {/* Card Header (Informational, bez "Prikaži sve") */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-900 tracking-wider uppercase">
            PRESTOJEĆI SERVISI
          </span>
        </div>

        {/* Single Nearest Item or Clean Notice */}
        {closestUpcomingService ? (
          (() => {
            const catStyle = getCategoryStyle(closestUpcomingService.category);
            const isUrgent = closestUpcomingService.daysRemaining <= 10;
            const isOverdue = closestUpcomingService.daysRemaining < 0;

            return (
              <div
                className="py-1 flex items-center justify-between"
              >
                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                  <div
                    className={`w-7.5 h-7.5 rounded-xl ${catStyle.bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <CategoryIcon
                      type={closestUpcomingService.category}
                      color={catStyle.color}
                      className="w-4 h-4"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {closestUpcomingService.title}
                    </div>
                    <div className="text-[10px] font-medium text-slate-500 truncate">
                      Rok {closestUpcomingService.targetDate}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-lg border flex items-center space-x-1 ${
                      isOverdue
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : isUrgent
                        ? 'bg-amber-50 text-amber-600 border-amber-200/60'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
                    }`}
                  >
                    <Clock className="w-3 h-3 stroke-[2.5]" />
                    <span>
                      {isOverdue
                        ? 'Dospjelo'
                        : `${closestUpcomingService.daysRemaining} dana`}
                    </span>
                  </span>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="py-2 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Trenutno nema predstojećih servisa.
            </p>
          </div>
        )}
      </div>

      {/* 6. DONJE KARTICE: REGISTRACIJA, MALI SERVIS, VELIKI SERVIS */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 flex-shrink-0 mt-auto">
        {/* 1. REGISTRACIJA */}
        <div
          onClick={() => (onOpenObligationModal ? onOpenObligationModal() : onNavigateTab && onNavigateTab('odrzavanje'))}
          className="bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-2xs flex flex-col items-center justify-between text-center cursor-pointer hover:border-[#1D68F2]/50 hover:shadow-xs transition-all min-h-[98px]"
        >
          <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#1D68F2] flex items-center justify-center mb-0.5">
            <Calendar className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <div className="text-[11px] font-bold text-slate-800 leading-tight">
            Registracija
          </div>

          {registrationObligation ? (
            <div className="mt-0.5 space-y-0.5 w-full flex flex-col items-center">
              <div className="text-[11px] font-extrabold text-[#1D68F2] leading-tight">
                {registrationObligation.expiryDate}
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                  registrationObligation.daysRemaining < 0
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : registrationObligation.daysRemaining <= 30
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-blue-50 text-[#1D68F2] border-blue-100'
                }`}
              >
                {registrationObligation.daysRemaining < 0
                  ? 'Istekla'
                  : `${registrationObligation.daysRemaining} dana`}
              </span>
            </div>
          ) : (
            <div className="mt-1 text-[10px] font-medium text-slate-400">
              Nije uneseno
            </div>
          )}
        </div>

        {/* 2. MALI SERVIS */}
        <div
          onClick={() => (onOpenRegularService ? onOpenRegularService('mali') : onNavigateTab && onNavigateTab('odrzavanje'))}
          className="bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-2xs flex flex-col items-center justify-between text-center cursor-pointer hover:border-emerald-400/60 hover:shadow-xs transition-all min-h-[98px]"
        >
          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-0.5">
            <Wrench className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <div className="text-[11px] font-bold text-slate-800 leading-tight">
            Mali servis
          </div>

          {!maliServis?.lastServiceDate ? (
            <div className="mt-1 text-[10px] font-medium text-slate-400">
              Nije uneseno
            </div>
          ) : maliServis.hasInterval === false ? (
            <div className="mt-0.5 space-y-0.5 w-full">
              <div className="text-[10px] font-bold text-slate-700 leading-tight truncate">
                {maliServis.lastServiceDate}
              </div>
              <div className="text-[8px] font-medium text-slate-400">
                Bez intervala
              </div>
            </div>
          ) : maliServis.isOverdue ? (
            <div className="mt-0.5 space-y-0.5 w-full flex flex-col items-center">
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200 uppercase tracking-wide">
                DOSPIO
              </span>
              <div className="text-[9px] font-bold text-slate-600 truncate max-w-full">
                {maliServis.targetDate || (maliServis.targetKm ? `${formatKm(maliServis.targetKm)} km` : '')}
              </div>
            </div>
          ) : (
            <div className="mt-0.5 space-y-0.5 w-full">
              <div className="text-[11px] font-extrabold text-emerald-600 leading-tight truncate">
                {maliServis.targetDate || (maliServis.daysRemaining !== undefined ? `${maliServis.daysRemaining} dana` : 'Planirano')}
              </div>
              <div className="text-[9px] font-medium text-slate-500 truncate">
                {maliServis.daysRemaining !== undefined && maliServis.kmRemaining !== undefined
                  ? `${maliServis.daysRemaining} d / ${formatKm(maliServis.kmRemaining)} km`
                  : maliServis.daysRemaining !== undefined
                  ? `${maliServis.daysRemaining} dana`
                  : maliServis.kmRemaining !== undefined
                  ? `${formatKm(maliServis.kmRemaining)} km`
                  : maliServis.targetKm
                  ? `${formatKm(maliServis.targetKm)} km`
                  : ''}
              </div>
            </div>
          )}
        </div>

        {/* 3. VELIKI SERVIS */}
        <div
          onClick={() => (onOpenRegularService ? onOpenRegularService('veliki') : onNavigateTab && onNavigateTab('odrzavanje'))}
          className="bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-2xs flex flex-col items-center justify-between text-center cursor-pointer hover:border-purple-400/60 hover:shadow-xs transition-all min-h-[98px]"
        >
          <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-0.5">
            <Wrench className="w-3.5 h-3.5 stroke-[2.2] text-purple-600" />
          </div>
          <div className="text-[11px] font-bold text-slate-800 leading-tight">
            Veliki servis
          </div>

          {!velikiServis?.lastServiceDate ? (
            <div className="mt-1 text-[10px] font-medium text-slate-400">
              Nije uneseno
            </div>
          ) : velikiServis.hasInterval === false ? (
            <div className="mt-0.5 space-y-0.5 w-full">
              <div className="text-[10px] font-bold text-slate-700 leading-tight truncate">
                {velikiServis.lastServiceDate}
              </div>
              <div className="text-[8px] font-medium text-slate-400">
                Bez intervala
              </div>
            </div>
          ) : velikiServis.isOverdue ? (
            <div className="mt-0.5 space-y-0.5 w-full flex flex-col items-center">
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200 uppercase tracking-wide">
                DOSPIO
              </span>
              <div className="text-[9px] font-bold text-slate-600 truncate max-w-full">
                {velikiServis.targetDate || (velikiServis.targetKm ? `${formatKm(velikiServis.targetKm)} km` : '')}
              </div>
            </div>
          ) : (
            <div className="mt-0.5 space-y-0.5 w-full">
              <div className="text-[11px] font-extrabold text-purple-600 leading-tight truncate">
                {velikiServis.targetDate || (velikiServis.daysRemaining !== undefined ? `${velikiServis.daysRemaining} dana` : 'Planirano')}
              </div>
              <div className="text-[9px] font-medium text-slate-500 truncate">
                {velikiServis.daysRemaining !== undefined && velikiServis.kmRemaining !== undefined
                  ? `${velikiServis.daysRemaining} d / ${formatKm(velikiServis.kmRemaining)} km`
                  : velikiServis.daysRemaining !== undefined
                  ? `${velikiServis.daysRemaining} dana`
                  : velikiServis.kmRemaining !== undefined
                  ? `${formatKm(velikiServis.kmRemaining)} km`
                  : velikiServis.targetKm
                  ? `${formatKm(velikiServis.targetKm)} km`
                  : ''}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

