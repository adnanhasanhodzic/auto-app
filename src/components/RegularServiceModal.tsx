import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Wrench,
  Cog,
  Check,
  Calendar,
  Gauge,
  Camera,
  Trash2,
  Plus,
  Clock,
  AlertCircle,
  FileText,
  ArrowLeft,
  DollarSign,
  ChevronRight,
  Info,
} from 'lucide-react';
import { ServiceRecord, CarData } from '../types';
import { formatDateToInput, formatDateToDisplay, addMonthsToDate, calculateDaysRemaining, getTodayFormatted } from '../utils/dateUtils';
import { DatePickerModal } from './DatePickerModal';

interface RegularServiceModalProps {
  isOpen: boolean;
  type?: 'mali' | 'veliki';
  serviceType?: 'mali' | 'veliki';
  initialMode?: 'view' | 'create';
  car: CarData;
  lastRecord?: ServiceRecord | null;
  existingRecord?: ServiceRecord | null;
  onClose: () => void;
  onSave?: (record: ServiceRecord) => void;
  onSaveRecord?: (record: ServiceRecord) => void;
  onClearService?: (type: 'mali' | 'veliki') => void;
}

const DEFAULT_MALI_ITEMS = [
  'Motorno ulje',
  'Filter ulja',
  'Filter zraka',
  'Filter kabine',
  'Filter goriva',
  'AdBlue',
  'Ostalo',
];

const DEFAULT_VELIKI_ITEMS = [
  'Zupčasti remen',
  'Vodena pumpa',
  'Natezač zupčastog remena',
  'PK remen',
  'Natezač PK remena',
  'Termostat',
  'Ostalo',
];

export const RegularServiceModal: React.FC<RegularServiceModalProps> = ({
  isOpen,
  type,
  serviceType,
  initialMode = 'view',
  car,
  lastRecord,
  existingRecord,
  onClose,
  onSave,
  onSaveRecord,
}) => {
  const currentType = serviceType || type || 'mali';
  const isMali = currentType === 'mali';
  const defaultItems = isMali ? DEFAULT_MALI_ITEMS : DEFAULT_VELIKI_ITEMS;
  const currentLastRecord = existingRecord !== undefined ? existingRecord : lastRecord;
  const handleSaveCallback = onSaveRecord || onSave;

  const [mode, setMode] = useState<'view' | 'create'>(initialMode);

  // Form State for 'create' mode
  const [serviceDate, setServiceDate] = useState<string>(getTodayFormatted());
  const [mileage, setMileage] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [newCustomItemText, setNewCustomItemText] = useState('');
  const [isAddingCustomItem, setIsAddingCustomItem] = useState(false);
  const [cost, setCost] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  // Next service interval settings
  const [trackTime, setTrackTime] = useState<boolean>(true);
  const [intervalMonths, setIntervalMonths] = useState<number>(isMali ? 12 : 60); // 1 yr vs 5 yrs
  const [trackMileage, setTrackMileage] = useState<boolean>(true);
  const [intervalKm, setIntervalKm] = useState<number>(isMali ? 10000 : 60000); // 10.000 vs 60.000

  const [error, setError] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [fullImageView, setFullImageView] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset or initialize state when opening modal
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setServiceDate(getTodayFormatted());
      setMileage(car.mileage && car.mileage > 0 ? car.mileage.toString() : '');
      // By default for new mali/veliki service, nothing is pre-selected (0 odabrano)
      setSelectedItems([]);
      setCustomItems([]);
      setCost('');
      setNote('');
      setReceiptImage(null);
      setTrackTime(true);
      setIntervalMonths(isMali ? 12 : 60);
      setTrackMileage(true);
      setIntervalKm(isMali ? 10000 : 60000);
      setError(null);
      setIsAddingCustomItem(false);
      setNewCustomItemText('');
      setFullImageView(null);
    }
  }, [isOpen, currentType, initialMode, car.mileage, isMali]);

  if (!isOpen) return null;

  const toggleItem = (item: string) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter((i) => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleAddCustomItem = () => {
    const trimmed = newCustomItemText.trim();
    if (!trimmed) return;
    if (!customItems.includes(trimmed) && !defaultItems.includes(trimmed)) {
      setCustomItems([...customItems, trimmed]);
      setSelectedItems([...selectedItems, trimmed]);
    }
    setNewCustomItemText('');
    setIsAddingCustomItem(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Slika je prevelika. Maksimalna veličina je 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Compute calculated target values for create mode
  const numericMileage = parseInt(mileage.replace(/\D/g, ''), 10) || 0;
  const formattedDisplayDate = serviceDate ? formatDateToDisplay(serviceDate) : '';
  const calculatedTargetDate = serviceDate && trackTime ? addMonthsToDate(formattedDisplayDate, intervalMonths) : '';
  const calculatedTargetKm = trackMileage ? numericMileage + intervalKm : 0;
  const daysLeft = calculatedTargetDate ? calculateDaysRemaining(calculatedTargetDate) : null;
  const kmLeft = trackMileage ? Math.max(0, calculatedTargetKm - car.mileage) : null;

  const handleSubmitNewService = (e: React.FormEvent) => {
    e.preventDefault();

    if (!serviceDate) {
      setError('Molimo unesite datum servisa.');
      return;
    }

    if (isNaN(numericMileage) || numericMileage <= 0) {
      setError('Molimo unesite kilometražu na kojoj je servis urađen.');
      return;
    }

    const title = isMali ? 'Mali servis' : 'Veliki servis';
    const subGroup = isMali ? 'MALI SERVIS' : 'VELIKI SERVIS';

    let nextServiceConfig = undefined;
    if (trackTime || trackMileage) {
      nextServiceConfig = {
        trackTime,
        intervalMonths: trackTime ? intervalMonths : 0,
        targetDate: calculatedTargetDate,
        trackMileage,
        intervalKm: trackMileage ? intervalKm : 0,
        targetKm: calculatedTargetKm,
      };
    }

    const record: ServiceRecord = {
      id: `srv_reg_${Date.now()}`,
      carId: car.id,
      category: 'mehanika',
      categoryName: 'Mehanika i motor',
      title,
      subGroup,
      date: formattedDisplayDate,
      mileage: numericMileage,
      items: selectedItems.length > 0 ? selectedItems : [title],
      cost: parseFloat(cost.replace(',', '.')) || 0,
      currency: 'KM',
      note: note.trim() || undefined,
      receiptImage: receiptImage || undefined,
      nextService: nextServiceConfig,
      createdAt: Date.now(),
    };

    if (handleSaveCallback) {
      handleSaveCallback(record);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        >
          {/* ========================================================================= */}
          {/* SCREEN 1: READ-ONLY VIEW ("POSLJEDNJI MALI/VELIKI SERVIS")                */}
          {/* ========================================================================= */}
          {mode === 'view' ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
                      isMali ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'
                    }`}
                  >
                    {isMali ? <Wrench className="w-5 h-5 stroke-[2.2]" /> : <Cog className="w-5 h-5 stroke-[2.2]" />}
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight uppercase">
                      {isMali ? 'POSLJEDNJI MALI SERVIS' : 'POSLJEDNJI VELIKI SERVIS'}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      {car.make} {car.model}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto space-y-4">
                {currentLastRecord ? (
                  <>
                    {/* 1. Date & Mileage Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
                        <div className="flex items-center space-x-1.5 text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-[#1D68F2]" />
                          <span className="text-[11px] font-bold uppercase tracking-wider">Datum servisa</span>
                        </div>
                        <div className="text-sm font-extrabold text-slate-900">
                          {currentLastRecord.date}
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
                        <div className="flex items-center space-x-1.5 text-slate-500">
                          <Gauge className="w-3.5 h-3.5 text-[#1D68F2]" />
                          <span className="text-[11px] font-bold uppercase tracking-wider">Kilometraža</span>
                        </div>
                        <div className="text-sm font-extrabold text-slate-900">
                          {currentLastRecord.mileage ? currentLastRecord.mileage.toLocaleString('de-DE') : '0'} km
                        </div>
                      </div>
                    </div>

                    {/* 2. Šta je urađeno (Read-Only Checklist) */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                          ŠTA JE URAĐENO
                        </span>
                        {currentLastRecord.items && currentLastRecord.items.length > 0 && (
                          <span className="text-[11px] font-semibold text-slate-400">
                            {currentLastRecord.items.length} stavki
                          </span>
                        )}
                      </div>

                      {currentLastRecord.items && currentLastRecord.items.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {currentLastRecord.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-2 py-2 px-3 bg-slate-50/80 border border-slate-200/70 rounded-xl"
                            >
                              <div
                                className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  isMali ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                                }`}
                              >
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {item}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">Nisu evidentirane pojedinačne stavke.</p>
                      )}
                    </div>

                    {/* 3. Trošak */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Trošak servisa</span>
                      <div className="text-base font-black text-slate-900">
                        {currentLastRecord.cost ? `${currentLastRecord.cost} KM` : '0 KM'}
                      </div>
                    </div>

                    {/* 4. Račun / Dokument (if exists) */}
                    {currentLastRecord.receiptImage && (
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 space-y-2 shadow-2xs">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#1D68F2]" />
                          <span>Priloženi račun / dokument</span>
                        </span>
                        <div
                          onClick={() => setFullImageView(currentLastRecord.receiptImage!)}
                          className="relative h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer group"
                        >
                          <img
                            src={currentLastRecord.receiptImage}
                            alt="Račun servisa"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                            Kliknite za uvećanje
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. Napomena (if exists) */}
                    {currentLastRecord.note && (
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Napomena
                        </span>
                        <p className="text-xs font-medium text-slate-800 whitespace-pre-wrap">
                          {currentLastRecord.note}
                        </p>
                      </div>
                    )}

                    {/* 6. Naredni servis info */}
                    {currentLastRecord.nextService && (currentLastRecord.nextService.trackTime || currentLastRecord.nextService.trackMileage) && (
                      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 space-y-1.5">
                        <div className="flex items-center space-x-1.5 text-blue-900">
                          <Clock className="w-4 h-4 text-[#1D68F2]" />
                          <span className="text-xs font-extrabold uppercase tracking-wider">
                            {isMali ? 'NAREDNI MALI SERVIS' : 'NAREDNI VELIKI SERVIS'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                          <span>Planirano:</span>
                          <span className="text-[#1D68F2]">
                            {currentLastRecord.nextService.targetDate || ''}{' '}
                            {currentLastRecord.nextService.targetKm
                              ? `• ${currentLastRecord.nextService.targetKm.toLocaleString('de-DE')} km`
                              : ''}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-8 text-center space-y-3">
                    <div
                      className={`w-14 h-14 mx-auto rounded-3xl flex items-center justify-center ${
                        isMali ? 'bg-emerald-50 text-emerald-500' : 'bg-purple-50 text-purple-500'
                      }`}
                    >
                      {isMali ? <Wrench className="w-7 h-7" /> : <Cog className="w-7 h-7" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        Nema evidentiranog {isMali ? 'malog' : 'velikog'} servisa
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                        Kliknite na dugme ispod da unesete prvi servis za ovo vozilo.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Footer */}
              <div className="p-4 bg-white border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMode('create')}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 text-white ${
                    isMali
                      ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                      : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
                  }`}
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>NOVI SERVIS</span>
                </button>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* SCREEN 2: CREATE NEW SERVICE FORM ("NOVI MALI/VELIKI SERVIS")             */
            /* ========================================================================= */
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center space-x-3">
                  {currentLastRecord && (
                    <button
                      type="button"
                      onClick={() => setMode('view')}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight uppercase">
                      {isMali ? 'NOVI MALI SERVIS' : 'NOVI VELIKI SERVIS'}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      {car.make} {car.model}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitNewService} className="p-5 space-y-4 overflow-y-auto">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                {/* 1. BASIC FIELDS: DATE & MILEAGE */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-[#1D68F2]" />
                      <span>Datum servisa <span className="text-red-500">*</span></span>
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
                        <Calendar className="w-4 h-4 text-[#1D68F2]" />
                      </button>
                      <input
                        type="text"
                        required
                        value={serviceDate}
                        onChange={(e) => setServiceDate(e.target.value)}
                        onClick={() => setIsDatePickerOpen(true)}
                        placeholder="25.08.2026."
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:border-[#1D68F2] focus:bg-white cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                      <Gauge className="w-3.5 h-3.5 text-[#1D68F2]" />
                      <span>Kilometraža <span className="text-red-500">*</span></span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        placeholder="npr. 185800"
                        value={mileage}
                        onChange={(e) => setMileage(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:border-[#1D68F2] focus:bg-white pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        km
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. ODABERITE STAVKE KOJE SE RADE (CHECKBOX LIST) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      ODABERITE STAVKE KOJE SE RADE
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {selectedItems.length} odabrano
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {defaultItems.map((item) => {
                      const isChecked = selectedItems.includes(item);
                      return (
                        <button
                          type="button"
                          key={item}
                          onClick={() => toggleItem(item)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
                            isChecked
                              ? isMali
                                ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-bold shadow-2xs'
                                : 'border-purple-500 bg-purple-50/60 text-purple-950 font-bold shadow-2xs'
                              : 'border-slate-200/90 bg-slate-50/60 text-slate-700 hover:bg-slate-100/80'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                              isChecked
                                ? isMali
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'bg-purple-600 border-purple-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="truncate">{item}</span>
                        </button>
                      );
                    })}

                    {/* Custom items */}
                    {customItems.map((item) => {
                      const isChecked = selectedItems.includes(item);
                      return (
                        <button
                          type="button"
                          key={item}
                          onClick={() => toggleItem(item)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                            isChecked
                              ? 'border-[#1D68F2] bg-blue-50/60 text-blue-950 font-bold shadow-2xs'
                              : 'border-slate-200/90 bg-slate-50/60 text-slate-700 hover:bg-slate-100/80'
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <div
                              className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                                isChecked
                                  ? 'bg-[#1D68F2] border-[#1D68F2] text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="truncate">{item}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomItems(customItems.filter((i) => i !== item));
                              setSelectedItems(selectedItems.filter((i) => i !== item));
                            }}
                            className="text-slate-400 hover:text-red-500 p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Custom Item Input */}
                  {isAddingCustomItem ? (
                    <div className="pt-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Naziv stavke
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Unesite naziv stavke..."
                          value={newCustomItemText}
                          onChange={(e) => setNewCustomItemText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomItem();
                            }
                          }}
                          autoFocus
                          className="flex-1 px-3 py-2 bg-white border border-slate-300 focus:border-[#1D68F2] rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomItem}
                          className="px-3.5 py-2 bg-[#1D68F2] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Dodaj
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingCustomItem(false);
                            setNewCustomItemText('');
                          }}
                          className="px-2.5 py-2 text-slate-500 hover:text-slate-700 text-xs font-medium cursor-pointer"
                        >
                          Odustani
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomItem(true)}
                      className="mt-1 text-xs font-bold text-[#1D68F2] hover:text-blue-700 flex items-center space-x-1 cursor-pointer py-1"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>+ Dodaj stavku</span>
                    </button>
                  )}
                </div>

                {/* 3. COST & NOTE */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Trošak (KM)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="npr. 180"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:border-[#1D68F2] focus:bg-white pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        KM
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Račun / Dokument
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    {!receiptImage ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-[#1D68F2]" />
                        <span>Dodaj račun</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between p-1.5 bg-blue-50/60 border border-blue-200 rounded-xl">
                        <span className="text-[11px] font-bold text-blue-700 truncate pl-1 flex items-center space-x-1">
                          <FileText className="w-3.5 h-3.5 text-[#1D68F2]" />
                          <span>Račun priložen</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setReceiptImage(null)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Ukloni sliku"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Napomena (opcionalno)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="npr. Zamijenjeni svi filteri, sipano ulje 5W-30..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-xs focus:outline-none focus:border-[#1D68F2] focus:bg-white resize-none"
                  />
                </div>

                {/* 4. NAREDNI SERVIS (INTERVAL SETTINGS) */}
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                          isMali ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        {isMali ? 'NAREDNI MALI SERVIS' : 'NAREDNI VELIKI SERVIS'}
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Automatski proračun
                    </span>
                  </div>

                  {/* Time Switch & Interval */}
                  <div className="p-3 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-[#1D68F2]" />
                        <span className="text-xs font-bold text-slate-800">
                          Prati po vremenu
                        </span>
                      </div>
                      {/* Toggle switch */}
                      <button
                        type="button"
                        onClick={() => setTrackTime(!trackTime)}
                        className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                          trackTime ? 'bg-[#1D68F2]' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform shadow-xs absolute top-1 ${
                            trackTime ? 'left-5' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>

                    {trackTime && (
                      <div className="pt-1 flex items-center space-x-2">
                        <span className="text-xs text-slate-600 font-medium whitespace-nowrap">
                          Za:
                        </span>
                        <div className="grid grid-cols-3 gap-1.5 flex-1">
                          {(isMali ? [6, 12, 24] : [36, 48, 60]).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setIntervalMonths(m)}
                              className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                intervalMonths === m
                                  ? 'bg-[#1D68F2] text-white shadow-2xs'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {m >= 12 ? `${m / 12} ${m / 12 === 1 ? 'godina' : m / 12 < 5 ? 'godine' : 'godina'}` : `${m} mj.`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mileage Switch & Interval */}
                  <div className="p-3 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Gauge className="w-4 h-4 text-[#1D68F2]" />
                        <span className="text-xs font-bold text-slate-800">
                          Prati po kilometraži
                        </span>
                      </div>
                      {/* Toggle switch */}
                      <button
                        type="button"
                        onClick={() => setTrackMileage(!trackMileage)}
                        className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                          trackMileage ? 'bg-[#1D68F2]' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform shadow-xs absolute top-1 ${
                            trackMileage ? 'left-5' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>

                    {trackMileage && (
                      <div className="pt-1 flex items-center space-x-2">
                        <span className="text-xs text-slate-600 font-medium whitespace-nowrap">
                          Za:
                        </span>
                        <div className="grid grid-cols-3 gap-1.5 flex-1">
                          {(isMali ? [10000, 15000, 20000] : [50000, 60000, 80000]).map((km) => (
                            <button
                              key={km}
                              type="button"
                              onClick={() => setIntervalKm(km)}
                              className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                intervalKm === km
                                  ? 'bg-[#1D68F2] text-white shadow-2xs'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {km.toLocaleString('de-DE')} km
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Calculated Summary Preview */}
                  {(trackTime || trackMileage) && (
                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-1 text-xs">
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>Očekivani sljedeći servis:</span>
                        <span className="text-[#1D68F2]">
                          {trackTime ? calculatedTargetDate : ''}{' '}
                          {trackMileage ? `• ${calculatedTargetKm.toLocaleString('de-DE')} km` : ''}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Preostalo:{' '}
                        {daysLeft !== null && daysLeft >= 0 ? `${daysLeft} dana` : daysLeft !== null ? 'Dospjelo' : ''}
                        {daysLeft !== null && kmLeft !== null ? ' / ' : ''}
                        {kmLeft !== null ? `${kmLeft.toLocaleString('de-DE')} km` : ''}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Action Buttons */}
                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentLastRecord) {
                        setMode('view');
                      } else {
                        onClose();
                      }
                    }}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Odustani
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-sm shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      isMali ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>SAČUVAJ SERVIS</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>

        {/* Date Picker Modal */}
        <DatePickerModal
          isOpen={isDatePickerOpen}
          value={serviceDate}
          title={isMali ? 'Datum malog servisa' : 'Datum velikog servisa'}
          onClose={() => setIsDatePickerOpen(false)}
          onSelect={(newDate) => setServiceDate(newDate)}
        />

        {/* Full Image Preview Modal */}
        {fullImageView && (
          <div
            className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setFullImageView(null)}
          >
            <div className="relative max-w-lg max-h-[85vh]">
              <img
                src={fullImageView}
                alt="Račun uvećano"
                className="max-w-full max-h-[85vh] rounded-2xl object-contain"
              />
              <button
                onClick={() => setFullImageView(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
