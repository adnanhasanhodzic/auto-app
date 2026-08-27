import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet,
  Calendar,
  ChevronRight,
  Fuel,
  Wrench,
  X,
  ArrowLeft,
  FileDown,
  Printer,
  Check,
  FileText,
} from 'lucide-react';
import { ServiceRecord, CarData } from '../types';
import { CATEGORY_CARDS } from '../serviceCatalog';
import { CategoryIcon, getCategoryStyle } from './CategoryIcons';
import { getDateTimestamp, parseCustomDate } from '../utils/dateUtils';

interface ExpensesScreenProps {
  car: CarData;
  services: ServiceRecord[];
}

// Master list of categories in standard order
const MASTER_CATEGORIES = [
  {
    id: 'mehanika',
    name: 'Mehanika',
    iconName: 'wrench' as const,
    iconColor: '#1D68F2',
  },
  {
    id: 'gorivo',
    name: 'Gorivo',
    iconName: 'fuel' as const,
    iconColor: '#D97706',
  },
  {
    id: 'elektrika',
    name: 'Elektrika',
    iconName: 'zap' as const,
    iconColor: '#EA580C',
  },
  {
    id: 'limarija',
    name: 'Limarija',
    iconName: 'car' as const,
    iconColor: '#EF4444',
  },
  {
    id: 'gume_felge',
    name: 'Gume i felge',
    iconName: 'tire' as const,
    iconColor: '#1E293B',
  },
  {
    id: 'klima',
    name: 'Klima uređaj',
    iconName: 'snowflake' as const,
    iconColor: '#0284C7',
  },
  {
    id: 'tekucine',
    name: 'Tekućine',
    iconName: 'bottle' as const,
    iconColor: '#2563EB',
  },
  {
    id: 'oprema',
    name: 'Oprema',
    iconName: 'gear' as const,
    iconColor: '#9333EA',
  },
  {
    id: 'ostalo',
    name: 'Ostalo',
    iconName: 'plus' as const,
    iconColor: '#475569',
  },
];

function normalizeCategory(cat?: string): string {
  const c = (cat || '').toLowerCase().trim();
  if (c === 'gorivo' || c === 'fuel') return 'gorivo';
  if (c === 'mehanika' || c === 'wrench') return 'mehanika';
  if (c === 'elektrika' || c === 'zap') return 'elektrika';
  if (c === 'limarija' || c === 'car') return 'limarija';
  if (c === 'gume_felge' || c === 'gume' || c === 'tire' || c.includes('gume')) return 'gume_felge';
  if (c === 'klima' || c === 'snowflake') return 'klima';
  if (c === 'tekucine' || c === 'tekućine' || c === 'bottle' || c === 'ulja') return 'tekucine';
  if (c === 'oprema' || c === 'gear') return 'oprema';
  return 'ostalo';
}

function getRecordYear(s: ServiceRecord): string {
  if (s.date) {
    const d = parseCustomDate(s.date);
    if (d) return d.getFullYear().toString();
  }
  if (s.createdAt) {
    return new Date(s.createdAt).getFullYear().toString();
  }
  return new Date().getFullYear().toString();
}

export const ExpensesScreen: React.FC<ExpensesScreenProps> = ({
  car,
  services,
}) => {
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<string | null>(null);

  // Available years derived from vehicle services + current year
  const availableYears = useMemo(() => {
    const currentYearStr = new Date().getFullYear().toString();
    const set = new Set<string>();
    set.add(currentYearStr);
    services.forEach((s) => {
      set.add(getRecordYear(s));
    });
    return Array.from(set).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
  }, [services]);

  // Selected year state (defaults to current year or latest year)
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    const currentYearStr = new Date().getFullYear().toString();
    return currentYearStr;
  });

  // Keep selectedYear valid
  useEffect(() => {
    if (!availableYears.includes(selectedYear) && availableYears.length > 0) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // PDF Export state
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfYear, setPdfYear] = useState<string>(() => selectedYear);
  const [pdfScope, setPdfScope] = useState<string>('all');

  // Sync pdfYear when modal opens
  useEffect(() => {
    if (isPdfModalOpen) {
      setPdfYear(selectedYear);
      setPdfScope('all');
    }
  }, [isPdfModalOpen, selectedYear]);

  // Services filtered by active vehicle and selected year
  const yearServices = useMemo(() => {
    return services.filter((s) => getRecordYear(s) === selectedYear);
  }, [services, selectedYear]);

  // Total investment calculated for active car + selected year
  const totalCost = useMemo(() => {
    return yearServices.reduce((acc, curr) => acc + (curr.cost || 0), 0);
  }, [yearServices]);

  // Aggregate by category according to record's real category (ONLY categories with count > 0 for selectedYear)
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    MASTER_CATEGORIES.forEach((c) => {
      map[c.id] = { count: 0, total: 0 };
    });

    yearServices.forEach((s) => {
      const catKey = normalizeCategory(s.category);
      if (!map[catKey]) {
        map[catKey] = { count: 0, total: 0 };
      }
      map[catKey].count += 1;
      map[catKey].total += s.cost || 0;
    });

    // Prikazati SAMO kategorije koje imaju bar jedan evidentirani unos (count > 0) za odabranu godinu
    const activeCategories = MASTER_CATEGORIES.filter((cat) => (map[cat.id]?.count || 0) > 0);

    const list = activeCategories.map((cat) => {
      const data = map[cat.id] || { count: 0, total: 0 };
      const percentage = totalCost > 0 ? (data.total / totalCost) * 100 : 0;
      return {
        ...cat,
        count: data.count,
        total: data.total,
        percentage,
      };
    });

    // Sortiraj od najvećeg do najmanjeg iznosa
    return list.sort((a, b) => b.total - a.total);
  }, [yearServices, totalCost]);

  // All services sorted newest to oldest
  const sortedServices = useMemo(() => {
    return [...services].sort((a, b) => {
      const tA = getDateTimestamp(a.date, a.createdAt);
      const tB = getDateTimestamp(b.date, b.createdAt);
      return tB - tA;
    });
  }, [services]);

  // Category detail items for selected year
  const categoryDetailItems = useMemo(() => {
    if (!selectedCategoryDetail) return [];
    return sortedServices.filter(
      (s) => getRecordYear(s) === selectedYear && normalizeCategory(s.category) === selectedCategoryDetail
    );
  }, [sortedServices, selectedYear, selectedCategoryDetail]);

  const selectedCategoryObj = useMemo(() => {
    if (!selectedCategoryDetail) return null;
    return MASTER_CATEGORIES.find((c) => c.id === selectedCategoryDetail) || {
      id: selectedCategoryDetail,
      name: selectedCategoryDetail,
      iconName: 'wrench' as const,
      iconColor: '#1D68F2',
    };
  }, [selectedCategoryDetail]);

  const categoryDetailTotal = useMemo(() => {
    return categoryDetailItems.reduce((acc, curr) => acc + (curr.cost || 0), 0);
  }, [categoryDetailItems]);

  // PDF category options for the selected pdfYear
  const pdfCategoryOptions = useMemo(() => {
    const list = [{ id: 'all', label: 'Svi troškovi' }];
    const yearFiltered = services.filter((s) => getRecordYear(s) === pdfYear);
    const activeCats = new Set<string>();
    yearFiltered.forEach((s) => {
      activeCats.add(normalizeCategory(s.category));
    });

    MASTER_CATEGORIES.forEach((cat) => {
      if (activeCats.has(cat.id)) {
        list.push({ id: cat.id, label: cat.name });
      }
    });

    return list;
  }, [services, pdfYear]);

  // Generate and print PDF report
  const handlePrintPdf = () => {
    const selectedOption = pdfCategoryOptions.find((opt) => opt.id === pdfScope);
    const reportTitle = selectedOption ? selectedOption.label : 'Svi troškovi';
    
    const itemsToExport = sortedServices.filter((s) => {
      const matchYear = getRecordYear(s) === pdfYear;
      const matchScope = pdfScope === 'all' || normalizeCategory(s.category) === pdfScope;
      return matchYear && matchScope;
    });

    const exportTotal = itemsToExport.reduce((acc, curr) => acc + (curr.cost || 0), 0);
    const currentDate = new Date().toLocaleDateString('de-DE');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Molimo omogućite skočni prozor (pop-up) za štampanje / preuzimanje PDF izvještaja.');
      return;
    }

    const rowsHtml = itemsToExport
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px 8px; font-size: 12px; font-weight: 600; color: #0F172A;">
            ${item.title}
            ${item.items && item.items.length > 0 && normalizeCategory(item.category) !== 'gorivo' ? `<div style="font-size: 10px; color: #64748B; font-weight: normal; margin-top: 2px;">${item.items.join(', ')}</div>` : ''}
          </td>
          <td style="padding: 10px 8px; font-size: 12px; color: #475569;">${item.categoryName || (normalizeCategory(item.category) === 'gorivo' ? 'Gorivo' : 'Servis')}</td>
          <td style="padding: 10px 8px; font-size: 12px; color: #334155;">${item.date}</td>
          <td style="padding: 10px 8px; font-size: 12px; color: #334155;">${
            item.mileage ? item.mileage.toLocaleString('de-DE') + ' km' : '-'
          }</td>
          <td style="padding: 10px 8px; font-size: 12px; font-weight: bold; text-align: right; color: #0F172A; white-space: nowrap;">
            ${item.cost.toLocaleString('de-DE', { minimumFractionDigits: 2 })} KM
          </td>
        </tr>`
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Izvještaj troškova - ${car.make} ${car.model}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0F172A;
            background: #FFFFFF;
            margin: 0;
            padding: 10px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #1D68F2;
            padding-bottom: 14px;
            margin-bottom: 18px;
          }
          .brand-container {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .logo-badge {
            width: 38px;
            height: 38px;
            background: #1D68F2;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            font-weight: 900;
            font-size: 18px;
          }
          .brand {
            font-size: 22px;
            font-weight: 900;
            letter-spacing: -0.5px;
            line-height: 1.1;
          }
          .brand-moj { color: #0F172A; }
          .brand-auto { color: #1D68F2; }
          .sub-title {
            font-size: 12px;
            color: #64748B;
            font-weight: 500;
          }
          .meta {
            text-align: right;
            font-size: 11px;
            color: #64748B;
            line-height: 1.4;
          }
          .car-box {
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 10px;
            padding: 14px 16px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .car-title {
            font-size: 16px;
            font-weight: bold;
            color: #0F172A;
          }
          .car-details {
            font-size: 12px;
            color: #64748B;
            margin-top: 3px;
          }
          .total-box {
            text-align: right;
          }
          .total-label {
            font-size: 10px;
            font-weight: bold;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .total-amount {
            font-size: 20px;
            font-weight: 900;
            color: #1D68F2;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }
          th {
            background: #F1F5F9;
            text-align: left;
            padding: 9px 8px;
            font-size: 11px;
            font-weight: bold;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #CBD5E1;
          }
          .footer {
            margin-top: 28px;
            padding-top: 12px;
            border-top: 1px solid #E2E8F0;
            font-size: 11px;
            color: #94A3B8;
            display: flex;
            justify-content: space-between;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand-container">
            <div class="logo-badge">🚗</div>
            <div>
              <div class="brand"><span class="brand-moj">MOJ </span><span class="brand-auto">AUTO</span></div>
              <div class="sub-title">Izvještaj troškova vozila</div>
            </div>
          </div>
          <div class="meta">
            <div><strong>Vrsta izvještaja:</strong> ${reportTitle}</div>
            <div><strong>Izvještaj kreiran:</strong> ${currentDate}</div>
          </div>
        </div>

        <div class="car-box">
          <div>
            <div class="car-title">${car.make} ${car.model}</div>
            <div class="car-details">
              ${[car.engine, car.powerKw ? `${car.powerKw} kW` : null, car.year, car.fuel].filter(Boolean).join(' • ')} 
              ${car.mileage ? `| Trenutno: ${car.mileage.toLocaleString('de-DE')} km` : ''}
            </div>
          </div>
          <div class="total-box">
            <div class="total-label">Ukupan iznos izvještaja</div>
            <div class="total-amount">${exportTotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })} KM</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 38%;">Naziv rada / troška</th>
              <th style="width: 18%;">Kategorija</th>
              <th style="width: 14%;">Datum</th>
              <th style="width: 15%;">Kilometraža</th>
              <th style="width: 15%; text-align: right;">Iznos</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="5" style="text-align: center; padding: 24px; color: #94A3B8;">Nema evidentiranih stavki za odabrani kriterij.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <span>MOJ AUTO • Evidencija i upravljanje vozilom</span>
          <span>Izvještaj kreiran: ${currentDate}</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setIsPdfModalOpen(false);
  };

  return (
    <div id="expenses-screen" className="h-full flex flex-col overflow-hidden bg-[#F8FAFC] select-none">
      {/* Top Header */}
      <div className="flex-shrink-0 z-20 bg-white border-b border-slate-100/90 shadow-2xs">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight uppercase">
              Troškovi
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {car.make} {car.model} • Finansijski pregled
            </p>
          </div>

          {/* Godina Dropdown Selector */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D68F2]/30 cursor-pointer transition-colors"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="text-slate-900 font-bold">
                  {yr}
                </option>
              ))}
            </select>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none stroke-[2.5]" />
          </div>
        </div>

        {/* Fiksni blok: UKUPNO ULOŽENO · GODINA na vrhu taba Troškovi */}
        {!selectedCategoryDetail && (
          <div className="px-5 pb-4">
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 shadow-xl">
              <div className="absolute right-0 top-0 w-32 h-32 bg-[#1D68F2]/20 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    UKUPNO ULOŽENO · {selectedYear}
                  </span>
                </div>
                <div className="text-3xl font-black tracking-tight text-white">
                  {totalCost.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="text-xl font-bold text-[#1D68F2]">KM</span>
                </div>
                <p className="text-[11px] text-slate-400 pt-1">
                  Ukupno u {selectedYear}. godini ({yearServices.length} evidentiranih unosa)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area (SKROL ZONA: samo TROŠKOVI PO VRSTAMA se skrolaju) */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        <AnimatePresence mode="wait">
          {/* CATEGORY DETAIL VIEW */}
          {selectedCategoryDetail ? (
            <motion.div
              key="category-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4 pb-6"
            >
              {/* Back button & category header */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedCategoryDetail(null)}
                  className="flex items-center space-x-1.5 text-xs font-bold text-[#1D68F2] hover:text-blue-700 bg-blue-50/70 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                  <span>Nazad na sve troškove</span>
                </button>
              </div>

              {/* Category Summary Card */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs space-y-2">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                      getCategoryStyle(selectedCategoryDetail || undefined).bg
                    } border ${
                      getCategoryStyle(selectedCategoryDetail || undefined).border
                    } shadow-2xs`}
                  >
                    <CategoryIcon
                      type={selectedCategoryDetail || 'wrench'}
                      color={getCategoryStyle(selectedCategoryDetail || undefined).color}
                      className="w-6 h-6"
                    />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                      {selectedCategoryObj?.name || 'Kategorija'}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Godina {selectedYear} • {categoryDetailItems.length} {categoryDetailItems.length === 1 ? 'unos' : 'unosa'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Ukupno za kategoriju ({selectedYear}):
                  </span>
                  <div className="text-xl font-black text-slate-900">
                    {categoryDetailTotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })}{' '}
                    <span className="text-sm font-bold text-[#1D68F2]">KM</span>
                  </div>
                </div>
              </div>

              {/* Category itemized list */}
              <div className="space-y-2">
                <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Svi unosi ({categoryDetailItems.length})
                </div>

                {categoryDetailItems.length === 0 ? (
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 text-center text-xs text-slate-500">
                    Nema unosa u ovoj kategoriji za {selectedYear}. godinu.
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200/80 rounded-2xl divide-y divide-slate-100 shadow-2xs overflow-hidden">
                    {categoryDetailItems.map((srv) => {
                      const itemCatStyle = getCategoryStyle(srv.category);

                      return (
                        <div
                          key={srv.id}
                          className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors group"
                        >
                          <div className="flex items-center space-x-3 min-w-0 pr-2">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${itemCatStyle.bg}`}
                            >
                              <CategoryIcon
                                type={srv.category}
                                color={itemCatStyle.color}
                                className="w-4.5 h-4.5"
                              />
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {srv.title}
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium truncate">
                                {srv.date} {srv.mileage ? `• ${srv.mileage.toLocaleString('de-DE')} km` : ''}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <div className="text-xs font-extrabold text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                              {srv.cost.toLocaleString('de-DE')} KM
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* REGULAR OVERVIEW VIEW: FINANSIJSKI PREGLED */
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 pb-2"
            >
              {/* Breakdown by Category: TROŠKOVI PO VRSTAMA (Prikazuju se SAMO kategorije s evidentiranim troškovima u odabranoj godini) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Troškovi po vrstama
                  </div>
                  {categoryBreakdown.length > 0 && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      Kliknite na kategoriju za detalje
                    </span>
                  )}
                </div>

                {categoryBreakdown.length > 0 ? (
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs divide-y divide-slate-100">
                    {categoryBreakdown.map((cat) => (
                      <div
                        key={cat.id}
                        onClick={() => setSelectedCategoryDetail(cat.id)}
                        className="py-3 first:pt-0 last:pb-0 space-y-1.5 cursor-pointer hover:bg-slate-50/80 rounded-xl px-1.5 transition-colors group"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 shadow-2xs group-hover:scale-105 transition-transform">
                              <CategoryIcon type={cat.iconName} color={cat.iconColor} className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 group-hover:text-[#1D68F2] transition-colors">
                                {cat.name}
                              </span>
                              <span className="text-slate-400 text-[11px] ml-1.5">
                                ({cat.count})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <span className="font-extrabold text-slate-900">
                                {cat.total.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM
                              </span>
                              <span className="text-slate-500 font-semibold text-[11px] ml-1.5">
                                {cat.percentage.toFixed(0)}%
                              </span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${cat.percentage > 0 ? Math.max(cat.percentage, 3) : 0}%`,
                              backgroundColor: cat.iconColor || '#1D68F2',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 text-center shadow-2xs">
                    <p className="text-xs text-slate-500 font-medium">
                      Nema evidentiranih troškova za {selectedYear}. godinu.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FIKSNI DONJI BLOK: O APLIKACIJI (Uvijek fiksno na dnu, izvan skrola) */}
      {!selectedCategoryDetail && (
        <div className="flex-shrink-0 z-20 bg-[#F8FAFC] px-5 py-3 border-t border-slate-200/70">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {}}
            className="w-full p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#1D68F2]/60 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1D68F2] flex items-center justify-center flex-shrink-0 group-hover:bg-[#1D68F2] group-hover:text-white transition-colors">
                <FileText className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  O APLIKACIJI
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Evidencija vozila, servisa, radova, troškova, goriva i održavanja.
                </div>
                <div className="text-[11px] text-slate-700 font-semibold mt-1">
                  Autor: Adnan Hasanhodžić
                </div>
                <div className="text-[11px] text-slate-700 font-semibold mt-1">
                  Autor: Adnan Hasanhodžić
                </div>
              </div>
            </div>
          </motion.button>
        </div>
      )}

      {/* PDF Export Selection Modal */}
      <AnimatePresence>
        {isPdfModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1D68F2] flex items-center justify-center">
                    <FileText className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Izvoz u PDF
                  </h3>
                </div>
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 py-1">
                {/* 1. GODINA */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Godina
                  </label>
                  <div className="relative">
                    <select
                      value={pdfYear}
                      onChange={(e) => {
                        setPdfYear(e.target.value);
                        setPdfScope('all');
                      }}
                      className="w-full appearance-none pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D68F2]/20 focus:border-[#1D68F2] transition-all cursor-pointer"
                    >
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr} className="text-slate-900 font-semibold">
                          {yr}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>

                {/* 2. VRSTA TROŠKA */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Vrsta troška
                  </label>
                  <div className="relative">
                    <select
                      value={pdfScope}
                      onChange={(e) => setPdfScope(e.target.value)}
                      className="w-full appearance-none pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D68F2]/20 focus:border-[#1D68F2] transition-all cursor-pointer"
                    >
                      {pdfCategoryOptions.map((opt) => (
                        <option key={opt.id} value={opt.id} className="text-slate-900 font-semibold">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Odustani
                </button>
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#1D68F2] hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>IZVEZI PDF</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
