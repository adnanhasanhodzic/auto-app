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

  const [serviceDate, setServiceDate] = useState<string>(getTodayFormatted());
  const [mileage, setMileage] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [newCustomItemText, setNewCustomItemText] = useState('');
  const [isAddingCustomItem, setIsAddingCustomItem] = useState(false);
  const [cost, setCost] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const [trackTime, setTrackTime] = useState<boolean>(true);
  const [intervalMonths, setIntervalMonths] = useState<number>(isMali ? 12 : 60);
  const [trackMileage, setTrackMileage] = useState<boolean>(true);
  const [intervalKm, setIntervalKm] = useState<number>(isMali ? 10000 : 60000);

  const [error, setError] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [fullImageView, setFullImageView] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setServiceDate(getTodayFormatted());
      setMileage(car.mileage && car.mileage > 0 ? car.mileage.toString() : '');
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
          {mode === 'view' ? (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${isMali ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'}`}>
                    {isMali ? <Wrench className="w-5 h-5 stroke-[2.2]" /> : <Cog className="w-5 h-5 stroke-[2.2]" />}
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight uppercase">
                      {isMali ? 'POSLJEDNJI MALI SERVIS' : 'POSLJEDNJI VELIKI SERVIS'}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">{car.make} {car.model}</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                {currentLastRecord ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
                        <div className="flex items-center space-x-1.5 text-slate-500"><Calendar className="w-3.5 h-3.5 text-[#1D68F2]" /><span className="text-[11px] font-bold uppercase tracking-wider">Datum servisa</span></div>
                        <div className="text-sm font-extrabold text-slate-900">{currentLastRecord.date}</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
                        <div className="flex items-center space-x-1.5 text-slate-500"><Gauge className="w-3.5 h-3.5 text-[#1D68F2]" /><span className="text-[11px] font-bold uppercase tracking-wider">Kilometraža</span></div>
                        <div className="text-sm font-extrabold text-slate-900">{currentLastRecord.mileage ? currentLastRecord.mileage.toLocaleString('de-DE') : '0'} km</div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between"><span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">ŠTA JE URAĐENO</span>{currentLastRecord.items && currentLastRecord.items.length > 0 && <span className="text-[11px] font-semibold text-slate-400">{currentLastRecord.items.length} stavki</span>}</div>
                      {currentLastRecord.items && currentLastRecord.items.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {currentLastRecord.items.map((item, idx) => (
                            <div key={idx} className="flex items-center space-x-2 py-2 px-3 bg-slate-50/80 border border-slate-200/70 rounded-xl">
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${isMali ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}`}><Check className="w-2.5 h-2.5 stroke-[3]" /></div>
                              <span className="text-xs font-bold text-slate-800 truncate">{item}</span>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-xs text-slate-500 italic">Nisu evidentirane pojedinačne stavke.</p>}
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between"><span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Trošak servisa</span><div className="text-base font-black text-slate-900">{currentLastRecord.cost ? `${currentLastRecord.cost} KM` : '0 KM'}</div></div>

                    {currentLastRecord.receiptImage && (
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 space-y-2 shadow-2xs">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5"><FileText className="w-3.5 h-3.5 text-[#1D68F2]" /><span>Priloženi račun / dokument</span></span>
                        <div onClick={() => setFullImageView(currentLastRecord.receiptImage!)} className="relative h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer group">
                          <img src={currentLastRecord.receiptImage} alt="Račun servisa" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">Kliknite za uvećanje</div>
                        </div>
                      </div>
                    )}

                    {currentLastRecord.note && <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1"><span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Napomena</span><p className="text-xs font-medium text-slate-800 whitespace-pre-wrap">{currentLastRecord.note}</p></div>}

                    {currentLastRecord.nextService && (currentLastRecord.nextService.trackTime || currentLastRecord.nextService.trackMileage) && (
                      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 space-y-1.5">
                        <div className="flex items-center space-x-1.5 text-blue-900"><Clock className="w-4 h-4 text-[#1D68F2]" /><span className="text-xs font-extrabold uppercase tracking-wider">{isMali ? 'NAREDNI MALI SERVIS' : 'NAREDNI VELIKI SERVIS'}</span></div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800"><span>Planirano:</span><span className="text-[#1D68F2]">{currentLastRecord.nextService.targetDate || ''}{' '}{currentLastRecord.nextService.targetKm ? `• ${currentLastRecord.nextService.targetKm.toLocaleString('de-DE')} km` : ''}</span></div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-8 text-center space-y-3">
                    <div className={`w-14 h-14 mx-auto rounded-3xl flex items-center justify-center ${isMali ? 'bg-emerald-50 text-emerald-500' : 'bg-purple-50 text-purple-500'}`}>{isMali ? <Wrench className="w-7 h-7" /> : <Cog className="w-7 h-7" />}</div>
                    <div><h3 className="text-sm font-bold text-slate-800">Nema evidentiranog {isMali ? 'malog' : 'velikog'} servisa</h3><p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Kliknite na dugme ispod da unesete prvi servis za ovo vozilo.</p></div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white border-t border-slate-100">
                <button type="button" onClick={() => setMode('create')} className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 text-white ${isMali ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800' : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'}`}>
                  <Plus className="w-4 h-4 stroke-[3]" /><span>NOVI SERVIS</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center space-x-3">
                  {currentLastRecord && <button type="button" onClick={() => setMode('view')} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"><ArrowLeft className="w-4 h-4 stroke-[2.5]" /></button>}
                  <div><h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight uppercase">{isMali ? 'NOVI MALI SERVIS' : 'NOVI VELIKI SERVIS'}</h2><p className="text-xs text-slate-500 font-medium">{car.make} {car.model}</p></div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSubmitNewService} className="p-5 overflow-y-auto space-y-4">
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">{error}</div>}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Datum servisa</label>
                    <div className="relative cursor-pointer" onClick={() => setIsDatePickerOpen(true)}>
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input type="text" value={formattedDisplayDate} readOnly placeholder="dd.mm.gggg." className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1D68F2]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kilometraža (km)</label>
                    <div className="relative"><Gauge className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" /><input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="npr. 195000" className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D68F2]" /></div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2"><span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">ŠTA JE URAĐENO?</span><span className="text-[11px] font-semibold text-slate-400">{selectedItems.length} odabrano</span></div>
                  <div className="space-y-1.5">
                    {defaultItems.map((item) => <button key={item} type="button" onClick={() => toggleItem(item)} className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-colors ${selectedItems.includes(item) ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}><div className="flex items-center space-x-2.5"><div className={`w-4 h-4 rounded-md flex items-center justify-center ${selectedItems.includes(item) ? 'bg-[#1D68F2] text-white' : 'border border-slate-300 bg-white'}`}>{selectedItems.includes(item) && <Check className="w-3 h-3 stroke-[3]" />}</div><span className="text-xs font-semibold text-slate-800">{item}</span></div></button>)}
                    {customItems.map((item) => <button key={item} type="button" onClick={() => toggleItem(item)} className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-colors ${selectedItems.includes(item) ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}><div className="flex items-center space-x-2.5"><div className={`w-4 h-4 rounded-md flex items-center justify-center ${selectedItems.includes(item) ? 'bg-[#1D68F2] text-white' : 'border border-slate-300 bg-white'}`}>{selectedItems.includes(item) && <Check className="w-3 h-3 stroke-[3]" />}</div><span className="text-xs font-semibold text-slate-800">{item}</span></div></button>)}
                  </div>
                  {isAddingCustomItem ? (
                    <div className="flex space-x-2 pt-1"><input type="text" value={newCustomItemText} onChange={(e) => setNewCustomItemText(e.target.value)} placeholder="Unesite stavku rada..." className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D68F2]" autoFocus /><button type="button" onClick={handleAddCustomItem} className="px-3 py-2 bg-[#1D68F2] text-white rounded-xl text-xs font-bold">DODAJ</button></div>
                  ) : (
                    <button type="button" onClick={() => setIsAddingCustomItem(true)} className="mt-1 text-xs font-bold text-[#1D68F2] hover:text-blue-700 flex items-center space-x-1 cursor-pointer py-1"><Plus className="w-3.5 h-3.5 stroke-[2.5]" /><span>Dodaj stavku</span></button>
                  )}
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Trošak (KM)</label><input type="text" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0,00" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D68F2]" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Napomena</label><input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opcionalno" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D68F2]" /></div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between"><span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">NAREDNI SERVIS</span><span className="text-[11px] text-slate-400">{isMali ? '12 mjeseci / 10.000 km' : '60 mjeseci / 60.000 km'}</span></div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={trackTime} onChange={(e) => setTrackTime(e.target.checked)} /> <span>Prati vrijeme</span></label>
                    <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={trackMileage} onChange={(e) => setTrackMileage(e.target.checked)} /> <span>Prati kilometražu</span></label>
                  </div>
                  {trackTime && <div className="text-xs text-slate-600">Naredni servis: <strong>{calculatedTargetDate}</strong> ({daysLeft ?? 0} dana)</div>}
                  {trackMileage && <div className="text-xs text-slate-600">Naredni servis: <strong>{calculatedTargetKm.toLocaleString('de-DE')} km</strong> ({kmLeft ?? 0} km)</div>}
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between"><span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">RAČUN / DOKUMENT</span><button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-[#1D68F2] flex items-center space-x-1"><Upload className="w-3.5 h-3.5" /><span>Dodaj</span></button></div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  {receiptImage ? <div className="relative h-28 rounded-xl overflow-hidden border border-slate-200"><img src={receiptImage} alt="Račun" className="w-full h-full object-cover" /><button type="button" onClick={() => setReceiptImage(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button></div> : <div className="py-5 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">Nema priloženog dokumenta</div>}
                </div>

                <div className="flex items-center space-x-3 pt-1"><button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">ODUSTANI</button><button type="submit" className="flex-1 py-3 rounded-xl bg-[#1D68F2] text-white font-bold text-xs">SAČUVAJ SERVIS</button></div>
              </form>
            </div>
          )}
        </motion.div>

        <DatePickerModal isOpen={isDatePickerOpen} value={serviceDate} title="Datum servisa" onClose={() => setIsDatePickerOpen(false)} onSelect={(newDate) => setServiceDate(newDate)} />

        {fullImageView && (
          <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={() => setFullImageView(null)}><img src={fullImageView} alt="Uvećani račun" className="max-w-full max-h-full object-contain" /></div>
        )}
      </div>
    </AnimatePresence>
  );
};
