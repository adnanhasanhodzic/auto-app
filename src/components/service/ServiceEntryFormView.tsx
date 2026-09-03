import React, { useState, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  X,
  Calendar,
  Gauge,
  Plus,
  Trash2,
  Upload,
  Camera,
  Check,
  Clock,
  Shield,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { ServiceCategory, ServiceRecord, CarData } from '../../types';
import {
  getTodayFormatted,
  addMonthsToDate,
  addYearsToDate,
  calculateDaysRemaining,
  calculateWarrantyStatus,
} from '../../utils/dateUtils';
import { DatePickerModal } from '../DatePickerModal';

interface ServiceEntryFormViewProps {
  car: CarData;
  category: ServiceCategory;
  categoryName: string;
  initialTitle: string;
  initialGroup?: string;
  initialItems: string[];
  existingRecord?: ServiceRecord | null;
  onSave: (record: ServiceRecord) => void;
  onBack: () => void;
  onAddItems?: () => void;
}

export const ServiceEntryFormView: React.FC<ServiceEntryFormViewProps> = ({
  car,
  category,
  categoryName,
  initialTitle,
  initialGroup,
  initialItems,
  existingRecord,
  onSave,
  onBack,
  onAddItems,
}) => {
  const isMali =
    initialTitle?.trim().toLowerCase() === 'mali servis' ||
    (initialGroup === 'SERVISI' && initialTitle?.trim() === 'Mali servis');

  const isVeliki =
    initialTitle?.trim().toLowerCase() === 'veliki servis' ||
    (initialGroup === 'SERVISI' && initialTitle?.trim() === 'Veliki servis');

  const isMajorOrMinorService = isMali || isVeliki;

  // Form fields
  const [title, setTitle] = useState(existingRecord?.title || initialTitle || 'Redovni servis');
  const [date, setDate] = useState(existingRecord?.date || getTodayFormatted());
  const [mileage, setMileage] = useState<number>(
    existingRecord?.mileage !== undefined ? existingRecord.mileage : 0
  );

  const initialItemsList = useMemo(() => {
    if (existingRecord?.items && existingRecord.items.length > 0) {
      return existingRecord.items;
    }
    if (isMali) {
      return ['Motorno ulje', 'Filter ulja', 'Filter zraka', 'Filter kabine'];
    }
    if (isVeliki) {
      return ['Zupčasti remen', 'Vodena pumpa', 'Natezač zupčastog remena', 'PK remen'];
    }
    return initialItems.length > 0 ? initialItems : [initialTitle].filter(Boolean);
  }, [existingRecord, isMali, isVeliki, initialItems, initialTitle]);

  const [items, setItems] = useState<string[]>(initialItemsList);
  const [newItemText, setNewItemText] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  React.useEffect(() => {
    if (!existingRecord) {
      setItems(initialItems.length > 0 ? initialItems : [initialTitle].filter(Boolean));
    }
  }, [initialItems, initialTitle, existingRecord]);

  const [cost, setCost] = useState<string>(
    existingRecord?.cost !== undefined && existingRecord.cost !== null
      ? existingRecord.cost.toString()
      : ''
  );
  const [currency] = useState<string>('KM');
  const [note, setNote] = useState(existingRecord?.note || '');
  const [receiptImage, setReceiptImage] = useState<string | null>(existingRecord?.receiptImage || null);

  // Next service intervals - ONLY true by default for Mali/Veliki servis if not editing
  const [trackNextService, setTrackNextService] = useState(
    existingRecord
      ? Boolean(existingRecord.nextService)
      : isMajorOrMinorService
  );
  const [trackMileage, setTrackMileage] = useState(
    existingRecord?.nextService ? Boolean(existingRecord.nextService.trackMileage) : true
  );
  const [intervalKm, setIntervalKm] = useState<number>(
    existingRecord?.nextService?.intervalKm || (isVeliki ? 60000 : 10000)
  );
  const [trackTime, setTrackTime] = useState(
    existingRecord?.nextService ? Boolean(existingRecord.nextService.trackTime) : true
  );
  const [intervalMonths, setIntervalMonths] = useState<number>(
    existingRecord?.nextService?.intervalMonths || (isVeliki ? 60 : 12)
  );

  // Warranty: start date tracks date (service/purchase date) as source of truth
  const [hasWarranty, setHasWarranty] = useState(
    existingRecord
      ? Boolean(existingRecord.warranty?.hasWarranty)
      : (category === 'oprema')
  );
  const [warrantyMonths, setWarrantyMonths] = useState<number>(
    existingRecord?.warranty?.durationMonths || 24
  );
  const [customWarrantyStartDate, setCustomWarrantyStartDate] = useState<string | null>(
    existingRecord?.warranty?.startDate && existingRecord?.warranty?.startDate !== (existingRecord?.date || date)
      ? existingRecord.warranty.startDate
      : null
  );

  // Always derived from `date` as the single source of truth unless manually customized
  const warrantyStartDate = customWarrantyStartDate || date;

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    // If user hasn't explicitly set a custom different date, it continues tracking date
  };

  const handleWarrantyStartDateChange = (newWDate: string) => {
    if (newWDate === date) {
      setCustomWarrantyStartDate(null);
    } else {
      setCustomWarrantyStartDate(newWDate);
    }
  };

  const handleToggleWarranty = (checked: boolean) => {
    setHasWarranty(checked);
  };

  // Date picker modal states
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isWarrantyDatePickerOpen, setIsWarrantyDatePickerOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Computed calculations
  const targetKm = (mileage || car.mileage || 0) + intervalKm;
  const kmRemaining = Math.max(0, targetKm - (car.mileage || 0));
  const targetDateStr = addMonthsToDate(date, intervalMonths);
  const daysRemaining = calculateDaysRemaining(targetDateStr);

  const warrantyCalc = calculateWarrantyStatus(warrantyStartDate, warrantyMonths);

  const handleToggleItem = (itemToToggle: string) => {
    if (items.includes(itemToToggle)) {
      setItems(items.filter((i) => i !== itemToToggle));
    } else {
      setItems([...items, itemToToggle]);
    }
  };

  const handleAddNewItem = () => {
    if (newItemText.trim()) {
      if (!items.includes(newItemText.trim())) {
        setItems([...items, newItemText.trim()]);
      }
      setNewItemText('');
      setIsAddingItem(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numericCost = parseFloat(cost.replace(',', '.')) || 0;

    const savedRecord: ServiceRecord = {
      id: existingRecord?.id || ('srv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)),
      carId: car.id,
      category,
      categoryName,
      title: title.trim() || 'Rad na vozilu',
      subGroup: initialGroup || existingRecord?.subGroup,
      date: date.trim() || getTodayFormatted(),
      mileage: Number(mileage) || car.mileage || 0,
      items: items.length > 0 ? items : [title],
      cost: numericCost,
      currency: 'KM',
      note: note.trim() || undefined,
      receiptImage: receiptImage || undefined,
      warranty: hasWarranty
        ? {
            hasWarranty: true,
            durationMonths: warrantyMonths,
            startDate: warrantyStartDate,
            endDate: warrantyCalc.endDate,
          }
        : undefined,
      nextService: trackNextService
        ? {
            trackMileage,
            intervalKm: trackMileage ? intervalKm : 0,
            targetKm: trackMileage ? targetKm : 0,
            trackTime,
            intervalMonths: trackTime ? intervalMonths : 0,
            targetDate: trackTime ? targetDateStr : '',
          }
        : undefined,
      createdAt: existingRecord?.createdAt || Date.now(),
    };

    onSave(savedRecord);
  };

  return (
    <div
      id="service-entry-screen"
      className="flex-1 flex flex-col justify-between w-full h-full bg-[#F8FAFC] select-none"
    >
      {/* Top Header */}
      <div className="bg-white px-5 pt-4 pb-3 border-b border-slate-100/90 shadow-2xs">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div className="text-center">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              {existingRecord ? 'Uredi rad' : 'Novi rad'}
            </h1>
            <span className="text-[11px] font-semibold text-[#1D68F2]">
              {categoryName} {initialGroup ? `• ${initialGroup}` : ''}
            </span>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Form Scrollable Content */}
      <form id="service-entry-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* 1. BASIC DETAILS: Naziv, Datum, Kilometraža */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Naziv rada <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="npr. Mali servis, Zamjena guma, Disk pločice..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D68F2]/30 focus:border-[#1D68F2] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Datum */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Datum (dd.mm.gggg)
              </label>
              <div
                className="relative cursor-pointer"
                onClick={() => setIsDatePickerOpen(true)}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDatePickerOpen(true);
                  }}
                  className="w-8 h-8 absolute left-1 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-[#1D68F2] transition-colors cursor-pointer"
                  title="Otvori kalendar"
                >
                  <Calendar className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  onClick={() => setIsDatePickerOpen(true)}
                  placeholder="dd.mm.gggg"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D68F2] cursor-pointer"
                />
              </div>
            </div>

            {/* Kilometraža */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kilometraža (km) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Gauge className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  required
                  min="1"
                  value={mileage || ''}
                  onChange={(e) => setMileage(Number(e.target.value))}
                  placeholder="Unesite km"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D68F2]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. ŠTA JE URAĐENO? (Checkbox lista stavki) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              ŠTA JE URAĐENO?
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              {items.length} stavki
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-blue-50/40 border border-slate-100 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-4 h-4 rounded-md bg-[#1D68F2] text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800">
                    {item}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleItem(item)}
                  className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onAddItems || onBack}
            className="w-full py-2 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-[#1D68F2] hover:bg-blue-50/50 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <span>+ Dodaj stavku</span>
          </button>
        </div>

        {/* 3. TROŠAK & NAPOMENA */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3.5">
          {/* Trošak */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Trošak (KM)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
                className="w-full pl-3.5 pr-14 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D68F2]"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                KM
              </div>
            </div>
          </div>

          {/* Napomena */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Napomena (opcionalno)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Unesite dodatne napomene o dijelovima, majstoru, radionici..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D68F2] resize-none"
            />
          </div>

          {/* DOKUMENT: Dodaj račun / fotografiju */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Dokument / Račun
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {receiptImage ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
                <img
                  src={receiptImage}
                  alt="Račun"
                  className="w-full h-32 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setReceiptImage(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 border border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-600 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-slate-400" />
                <span>Dodaj račun / fotografiju</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. NAREDNA ZAMJENA (Opcionalni interval) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#1D68F2]" />
              <div>
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
                  Naredna zamjena
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  {trackNextService ? 'Podsjetnik aktivan' : 'Samo evidencija u istoriji'}
                </span>
              </div>
            </div>

            {/* Checkbox / Toggle for Naredna zamjena */}
            <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200/80 transition-colors">
              <input
                type="checkbox"
                checked={trackNextService}
                onChange={(e) => setTrackNextService(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#1D68F2] focus:ring-[#1D68F2] cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800">
                Postavi narednu zamjenu
              </span>
            </label>
          </div>

          {!trackNextService ? (
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              Rad se upisuje isključivo u <strong>istoriju</strong> bez automatskog podsjetnika.
            </div>
          ) : (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {/* Vrijeme interval */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trackTime}
                      onChange={(e) => setTrackTime(e.target.checked)}
                      className="rounded border-slate-300 text-[#1D68F2] focus:ring-[#1D68F2]"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Za koliko vremena?
                    </span>
                  </label>
                  {trackTime && (
                    <span className="text-xs font-extrabold text-[#1D68F2]">
                      Datum: {targetDateStr}
                    </span>
                  )}
                </div>

                {trackTime && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1.5">
                      {[
                        { label: '6 mjeseci', val: 6 },
                        { label: '1 godina', val: 12 },
                        { label: '2 godine', val: 24 },
                        { label: '4 godine', val: 48 },
                      ].map((t) => (
                        <button
                          key={t.val}
                          type="button"
                          onClick={() => setIntervalMonths(t.val)}
                          className={`flex-1 py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            intervalMonths === t.val
                              ? 'bg-[#1D68F2] text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2 pt-1 text-[11px] text-slate-600">
                      <span>Ili prilagodi (mjeseci):</span>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={intervalMonths}
                        onChange={(e) => setIntervalMonths(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-[#1D68F2]"
                      />
                      <span className="font-medium text-slate-400">
                        ({daysRemaining >= 0 ? `Preostalo ~${daysRemaining} dana` : 'Dospjelo'})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Kilometraža interval */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trackMileage}
                      onChange={(e) => setTrackMileage(e.target.checked)}
                      className="rounded border-slate-300 text-[#1D68F2] focus:ring-[#1D68F2]"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Nakon pređene kilometraže?
                    </span>
                  </label>
                  {trackMileage && (
                    <span className="text-xs font-extrabold text-[#1D68F2]">
                      Na: {targetKm.toLocaleString('de-DE')} km
                    </span>
                  )}
                </div>

                {trackMileage && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1.5">
                      {[10000, 15000, 20000, 30000, 60000].map((km) => (
                        <button
                          key={km}
                          type="button"
                          onClick={() => setIntervalKm(km)}
                          className={`flex-1 py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            intervalKm === km
                              ? 'bg-[#1D68F2] text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          +{km / 1000}k km
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2 pt-1 text-[11px] text-slate-600">
                      <span>Ili prilagodi (km):</span>
                      <input
                        type="number"
                        min="100"
                        step="1000"
                        value={intervalKm}
                        onChange={(e) => setIntervalKm(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-[#1D68F2]"
                      />
                      <span className="font-medium text-slate-400">
                        (za {kmRemaining.toLocaleString('de-DE')} km)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 5. GARANCIJA (Za opremu ili po želji korisnika) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <div>
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
                  Garancija
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  Ima garanciju?
                </span>
              </div>
            </div>

            {/* Toggle Warranty */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hasWarranty}
                onChange={(e) => handleToggleWarranty(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {hasWarranty && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {/* Duration buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trajanje garancije
                </label>
                <div className="flex items-center space-x-2">
                  {[6, 12, 24, 36, 48].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setWarrantyMonths(m)}
                      className={`flex-1 py-1.5 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        warrantyMonths === m
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {m} mj
                    </button>
                  ))}
                </div>
              </div>

              {/* Start and end dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Početak garancije
                  </label>
                  <div
                    className="relative cursor-pointer"
                    onClick={() => setIsWarrantyDatePickerOpen(true)}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsWarrantyDatePickerOpen(true);
                      }}
                      className="w-7 h-7 absolute left-1 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                      title="Otvori kalendar"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="text"
                      value={warrantyStartDate}
                      onChange={(e) => handleWarrantyStartDateChange(e.target.value)}
                      onClick={() => setIsWarrantyDatePickerOpen(true)}
                      placeholder="dd.mm.gggg"
                      className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Datum isteka
                  </label>
                  <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                    {warrantyCalc.endDate}
                  </div>
                </div>
              </div>

              {/* Live calculation banner */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${warrantyCalc.badgeBg}`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${warrantyCalc.dotColor}`} />
                  <span className="text-xs font-extrabold">
                    {warrantyCalc.statusLabel}
                  </span>
                </div>
                <span className="text-xs font-bold">
                  {warrantyCalc.detailText}
                </span>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Bottom Save Action Button */}
      <div className="bg-white px-5 py-3 border-t border-slate-100 shadow-lg">
        <motion.button
          type="submit"
          form="service-entry-form"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3.5 px-4 bg-[#1D68F2] hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>SAČUVAJ RAD / SERVIS</span>
        </motion.button>
      </div>

      {/* Visual Date Picker Modals */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        value={date}
        title="Datum rada / servisa"
        onClose={() => setIsDatePickerOpen(false)}
        onSelect={(newDate) => handleDateChange(newDate)}
      />

      <DatePickerModal
        isOpen={isWarrantyDatePickerOpen}
        value={warrantyStartDate}
        title="Početak garancije"
        onClose={() => setIsWarrantyDatePickerOpen(false)}
        onSelect={(newDate) => handleWarrantyStartDateChange(newDate)}
      />
    </div>
  );
};