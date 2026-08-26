import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Wrench,
  Cog,
  Clock,
  ChevronRight,
  Car,
  Droplet,
  Disc3,
  ShieldCheck,
  Battery,
} from 'lucide-react';
import { ServiceRecord, VehicleObligation, CarData, RegularServiceStatus } from '../types';
import { calculateDaysRemaining, getDateTimestamp, addMonthsToDate } from '../utils/dateUtils';

interface MaintenanceScreenProps {
  car: CarData;
  services: ServiceRecord[];
  obligations: VehicleObligation[];
  maliServis?: RegularServiceStatus | null;
  velikiServis?: RegularServiceStatus | null;
  onOpenAddService: () => void;
  onOpenRegularService?: (type: 'mali' | 'veliki') => void;
  onSaveObligation?: (ob: VehicleObligation) => void;
  onDeleteObligation?: (id: string) => void;
}

interface UpcomingReplacementItem {
  id: string;
  title: string;
  category?: string;
  targetDate: string;
  daysRemaining: number;
  isOverdue: boolean;
  serviceId?: string;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  car,
  services,
  obligations,
  maliServis,
  velikiServis,
  onOpenRegularService,
}) => {
  // 1. REGISTRACIJA (Only single vehicle registration - purely informative)
  const registration = useMemo(() => {
    const reg = obligations.find((o) => o.type === 'registracija' || o.title.toLowerCase().includes('registracij'));
    if (!reg) return null;
    const days = calculateDaysRemaining(reg.expiryDate);
    return {
      ...reg,
      daysRemaining: days,
      isOverdue: days < 0,
    };
  }, [obligations]);

  // 2. PRESTOJEĆE ZAMJENE (Items configured with next service interval from history)
  const upcomingReplacements: UpcomingReplacementItem[] = useMemo(() => {
    const list: UpcomingReplacementItem[] = [];

    services.forEach((srv) => {
      // Exclude Mali and Veliki servis as they are shown separately at top
      const titleLower = (srv.title || '').toLowerCase();
      const isRegularService =
        titleLower === 'mali servis' ||
        titleLower.includes('mali servis') ||
        titleLower === 'veliki servis' ||
        titleLower.includes('veliki servis') ||
        srv.subGroup?.toUpperCase() === 'MALI SERVIS' ||
        srv.subGroup?.toUpperCase() === 'VELIKI SERVIS';

      if (isRegularService) return;

      const ns = srv.nextService;
      if (ns && ns.trackTime && ns.targetDate) {
        const days = calculateDaysRemaining(ns.targetDate);
        list.push({
          id: srv.id,
          title: srv.title,
          category: srv.category,
          targetDate: ns.targetDate,
          daysRemaining: days,
          isOverdue: days < 0,
          serviceId: srv.id,
        });
      }
    });

    // Sort: Nearest expiry at top, furthest at bottom
    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [services]);

  const getUpcomingIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('ulje') || t.includes('filter')) return Droplet;
    if (t.includes('kočnic') || t.includes('kocnic') || t.includes('disk') || t.includes('pločic')) return Disc3;
    if (t.includes('baterij') || t.includes('akumulator') || t.includes('svjećic')) return Battery;
    if (t.includes('remen') || t.includes('zupčast') || t.includes('mjenjač')) return Cog;
    return Wrench;
  };

  // 3. GARANCIJE (Active warranties derived from service records)
  const activeWarranties = useMemo(() => {
    const list: {
      id: string;
      title: string;
      category?: string;
      date: string;
      endDate: string;
      daysRemaining: number;
    }[] = [];

    services.forEach((srv) => {
      const w = srv.warranty;
      const directMonths = (srv as any).warrantyMonths;
      const directEndDate = (srv as any).warrantyEndDate;

      if (w && (w.hasWarranty || w.endDate || (w.durationMonths && w.durationMonths > 0))) {
        const endDate = w.endDate || (w.durationMonths ? addMonthsToDate(w.startDate || srv.date, w.durationMonths) : '');
        if (endDate) {
          const days = calculateDaysRemaining(endDate);
          list.push({
            id: srv.id,
            title: srv.title,
            category: srv.category,
            date: w.startDate || srv.date,
            endDate,
            daysRemaining: days,
          });
        }
      } else if (directMonths && directMonths > 0) {
        const endDate = directEndDate || addMonthsToDate(srv.date, directMonths);
        const days = calculateDaysRemaining(endDate);
        list.push({
          id: srv.id,
          title: srv.title,
          category: srv.category,
          date: srv.date,
          endDate,
          daysRemaining: days,
        });
      } else if (directEndDate) {
        const days = calculateDaysRemaining(directEndDate);
        list.push({
          id: srv.id,
          title: srv.title,
          category: srv.category,
          date: srv.date,
          endDate: directEndDate,
          daysRemaining: days,
        });
      }
    });

    // Sort: Nearest expiry at top, furthest at bottom
    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [services]);

  const getWarrantyIcon = (title: string, category?: string) => {
    const t = (title + ' ' + (category || '')).toLowerCase();
    if (t.includes('akumulator') || t.includes('baterij') || t.includes('alternator') || t.includes('svjećic') || t.includes('svjecic')) {
      return Battery;
    }
    if (t.includes('ulje') || t.includes('motorno') || t.includes('filter')) {
      return Droplet;
    }
    if (t.includes('kočion') || t.includes('kocion') || t.includes('disk') || t.includes('pločic')) {
      return Disc3;
    }
    if (
      t.includes('zupčast') ||
      t.includes('remen') ||
      t.includes('mjenjač') ||
      t.includes('mjenjac') ||
      t.includes('haldex') ||
      t.includes('set kvacila') ||
      t.includes('set kvačila') ||
      t.includes('zamajac')
    ) {
      return Cog;
    }
    return Wrench;
  };

  return (
    <div id="maintenance-screen" className="h-full flex flex-col overflow-hidden bg-[#F8FAFC] select-none">
      {/* Top Header */}
      <div className="flex-shrink-0 z-20 bg-white px-5 pt-4 pb-3 border-b border-slate-100/90 shadow-2xs flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight uppercase">
            ODRŽAVANJE
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {car.make} {car.model} • Pregled stanja i rokova
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-5 pb-12">
        {/* ================================================== */}
        {/* 1. SERVISNA EVIDENCIJA (Mali i Veliki Servis)       */}
        {/* ================================================== */}
        <div className="space-y-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-[#1D68F2]" />
            <h3 className="text-xs font-extrabold tracking-wider uppercase text-slate-800">
              SERVISNA EVIDENCIJA
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mali servis */}
            <div
              onClick={() => onOpenRegularService && onOpenRegularService('mali')}
              className="bg-white border border-slate-200/80 hover:border-emerald-300 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex items-center cursor-pointer group transition-all"
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                  <Wrench className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight whitespace-nowrap">
                    Mali servis
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 whitespace-nowrap">
                    {maliServis?.lastServiceDate ? (
                      <span className="text-slate-700 font-semibold">
                        {maliServis.lastServiceDate}
                      </span>
                    ) : (
                      <span className="text-slate-400">Nije evidentiran</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Veliki servis */}
            <div
              onClick={() => onOpenRegularService && onOpenRegularService('veliki')}
              className="bg-white border border-slate-200/80 hover:border-purple-300 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex items-center cursor-pointer group transition-all"
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
                  <Cog className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight whitespace-nowrap">
                    Veliki servis
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 whitespace-nowrap">
                    {velikiServis?.lastServiceDate ? (
                      <span className="text-slate-700 font-semibold">
                        {velikiServis.lastServiceDate}
                      </span>
                    ) : (
                      <span className="text-slate-400">Nije evidentiran</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* 2. REGISTRACIJA (SAMO INFORMATIVNI PREGLED)        */}
        {/* ================================================== */}
        <div className="space-y-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-600" />
            <h3 className="text-xs font-extrabold tracking-wider uppercase text-slate-800">
              REGISTRACIJA
            </h3>
          </div>

          {registration ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
              <div className="flex items-center space-x-3.5 min-w-0 pr-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1D68F2] flex items-center justify-center flex-shrink-0 border border-blue-100">
                  <Car className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">
                    Registracija vozila
                  </h4>
                  <div className="text-xs text-slate-500 font-medium mt-1 flex items-center space-x-2">
                    <span>Ističe: <span className="font-bold text-slate-800">{registration.expiryDate}</span></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center flex-shrink-0">
                {/* Days remaining badge */}
                <span
                  className={`text-xs font-extrabold px-2.5 py-1 rounded-xl border ${
                    registration.isOverdue
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : registration.daysRemaining <= 30
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-blue-50 text-[#1D68F2] border-blue-200/70'
                  }`}
                >
                  {registration.isOverdue
                    ? 'DOSPJELO'
                    : `${registration.daysRemaining} dana`}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-2xs">
              <p className="text-xs text-slate-500 font-medium">
                Registracija nije evidentirana.
              </p>
            </div>
          )}
        </div>

        {/* ================================================== */}
        {/* 3. PRESTOJEĆE ZAMJENE                               */}
        {/* ================================================== */}
        <div className="space-y-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h3 className="text-xs font-extrabold tracking-wider uppercase text-slate-800">
              PRESTOJEĆE ZAMJENE
            </h3>
          </div>

          {upcomingReplacements.length > 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl divide-y divide-slate-100 shadow-2xs overflow-hidden">
              {upcomingReplacements.map((item) => {
                const ItemIcon = getUpcomingIcon(item.title);

                return (
                  <div
                    key={item.id}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          item.isOverdue
                            ? 'bg-red-50 text-red-600'
                            : item.daysRemaining <= 10
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-slate-50 text-[#1D68F2]'
                        }`}
                      >
                        <ItemIcon className="w-4.5 h-4.5 stroke-[2]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {item.title}
                        </h4>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Rok: {item.targetDate}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span
                        className={`text-xs font-extrabold px-2.5 py-1 rounded-xl border flex items-center space-x-1 ${
                          item.isOverdue
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : item.daysRemaining <= 10
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Clock className="w-3 h-3 stroke-[2.5]" />
                        <span>
                          {item.isOverdue ? 'DOSPIJELO' : `${item.daysRemaining} dana`}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 text-center shadow-2xs">
              <p className="text-xs text-slate-500 font-medium">
                Nema prestojećih zamjena.
              </p>
            </div>
          )}
        </div>

        {/* ================================================== */}
        {/* 4. GARANCIJE                                       */}
        {/* ================================================== */}
        <div className="space-y-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-purple-600" />
            <h3 className="text-xs font-extrabold tracking-wider uppercase text-slate-800">
              GARANCIJE
            </h3>
          </div>

          {activeWarranties.length > 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl divide-y divide-slate-100 shadow-2xs overflow-hidden">
              {activeWarranties.map((warr) => {
                const ItemIcon = getWarrantyIcon(warr.title, warr.category);
                const isExpired = warr.daysRemaining < 0;
                const isToday = warr.daysRemaining === 0;
                const isSoon = warr.daysRemaining > 0 && warr.daysRemaining <= 30;

                return (
                  <div
                    key={warr.id}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isExpired
                            ? 'bg-red-50 text-red-600 border border-red-100'
                            : isToday || isSoon
                            ? 'bg-amber-50 text-amber-600 border border-amber-100'
                            : 'bg-purple-50 text-purple-600 border border-purple-100'
                        }`}
                      >
                        <ItemIcon className="w-4.5 h-4.5 stroke-[2]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {warr.title}
                        </h4>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5 flex flex-wrap items-center gap-x-2">
                          <span>
                            Garancija do: <span className="font-bold text-slate-800">{warr.endDate}</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>Unos: {warr.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span
                        className={`text-xs font-extrabold px-2.5 py-1 rounded-xl border flex items-center space-x-1 ${
                          isExpired
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : isToday || isSoon
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200/70'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
                        <span>
                          {isExpired
                            ? 'Garancija istekla'
                            : isToday
                            ? 'Ističe danas'
                            : `${warr.daysRemaining} dana`}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 text-center shadow-2xs">
              <p className="text-xs text-slate-500 font-medium">
                Trenutno nema aktivnih garancija.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
