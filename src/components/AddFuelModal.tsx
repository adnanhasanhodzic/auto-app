import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Fuel, Calendar, Gauge } from 'lucide-react';
import { ServiceRecord, CarData } from '../types';
import { formatDateCustom } from '../utils/dateUtils';
import { DatePickerModal } from './DatePickerModal';

interface AddFuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: CarData;
  existingRecord?: ServiceRecord | null;
  onSave: (record: ServiceRecord) => void;
}

export const AddFuelModal: React.FC<AddFuelModalProps> = ({
  isOpen,
  onClose,
  car,
  existingRecord,
  onSave,
}) => {
  const [date, setDate] = useState<string>(formatDateCustom(new Date()));
  const [mileage, setMileage] = useState<string>('');
  const [cost, setCost] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (existingRecord) {
        setDate(existingRecord.date || formatDateCustom(new Date()));
        setMileage(existingRecord.mileage ? existingRecord.mileage.toLocaleString('de-DE') : '');
        setCost(existingRecord.cost ? existingRecord.cost.toString() : '');
      } else {
        setDate(formatDateCustom(new Date()));
        setMileage('');
        setCost('');
      }
      setError(null);
    }
  }, [isOpen, existingRecord]);

  if (!isOpen) return null;

  const handleMileageChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '');
    if (!digitsOnly) {
      setMileage('');
      return;
    }
    const num = parseInt(digitsOnly, 10);
    setMileage(num.toLocaleString('de-DE'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date.trim()) {
      setError('Molimo unesite datum točenja.');
      return;
    }

    const mileageNum = parseInt(mileage.replace(/\D/g, ''), 10);
    if (isNaN(mileageNum) || mileageNum <= 0) {
      setError('Molimo unesite kilometražu na kojoj je gorivo natočeno.');
      return;
    }

    const costNum = parseFloat(cost.replace(',', '.'));
    if (isNaN(costNum) || costNum <= 0) {
      setError('Molimo unesite validan iznos u KM.');
      return;
    }

    const fuelRecord: ServiceRecord = {
      id: existingRecord?.id || 'fuel_' + Date.now().toString(),
      carId: car.id,
      category: 'gorivo',
      categoryName: 'Gorivo',
      title: 'Točenje goriva',
      date: date.trim(),
      mileage: mileageNum,
      cost: costNum,
      currency: 'KM',
      items: ['Točenje goriva'],
      createdAt: existingRecord?.createdAt || Date.now(),
    };

    onSave(fuelRecord);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/40">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100/90 text-amber-700 flex items-center justify-center flex-shrink-0">
                <Fuel className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  {existingRecord ? 'UREDI TOČENJE' : 'TOČENJE GORIVA'}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {car.make} {car.model} {car.fuel ? `• ${car.fuel}` : ''}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">{error}</div>}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">DATUM</label>
              <div className="relative cursor-pointer" onClick={() => setIsDatePickerOpen(true)}>
                <button type="button" onClick={(e) => { e.stopPropagation(); setIsDatePickerOpen(true); }} className="w-8 h-8 absolute left-1 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-amber-600 transition-colors cursor-pointer" title="Otvori kalendar">
                  <Calendar className="w-4 h-4" />
                </button>
                <input type="text" value={date} onChange={(e) => setDate(e.target.value)} onClick={() => setIsDatePickerOpen(true)} placeholder="25.08.2026." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">KILOMETRAŽA <span className="text-red-500">*</span></label>
              <div className="relative">
                <Gauge className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="text" required value={mileage} onChange={(e) => handleMileageChange(e.target.value)} placeholder="Unesite km" className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">km</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">IZNOS</label>
              <div className="relative">
                <input type="text" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="85" className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-amber-600">KM</span>
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-3">
              <button type="button" onClick={onClose} className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer">Odustani</button>
              <button type="submit" className="flex-1 py-3 px-4 rounded-xl text-xs font-extrabold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-xs cursor-pointer">SAČUVAJ TOČENJE</button>
            </div>
          </form>
        </motion.div>

        <DatePickerModal isOpen={isDatePickerOpen} value={date} title="Datum točenja goriva" onClose={() => setIsDatePickerOpen(false)} onSelect={(newDate) => setDate(newDate)} />
      </div>
    </AnimatePresence>
  );
};
