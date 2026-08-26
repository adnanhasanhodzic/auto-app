import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Car } from 'lucide-react';
import { VehicleObligation } from '../types';
import { getTodayFormatted, addYearsToDate } from '../utils/dateUtils';
import { DatePickerModal } from './DatePickerModal';

interface ObligationModalProps {
  isOpen: boolean;
  carId?: string;
  existingObligation?: VehicleObligation | null;
  onClose: () => void;
  onSave: (obligation: VehicleObligation) => void;
}

export const ObligationModal: React.FC<ObligationModalProps> = ({
  isOpen,
  carId = '',
  existingObligation,
  onClose,
  onSave,
}) => {
  const [date, setDate] = useState(existingObligation?.date || getTodayFormatted());
  const [expiryDate, setExpiryDate] = useState(
    existingObligation?.expiryDate || addYearsToDate(getTodayFormatted(), 1)
  );
  const [error, setError] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isExpiryDatePickerOpen, setIsExpiryDatePickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDate(existingObligation?.date || getTodayFormatted());
      setExpiryDate(
        existingObligation?.expiryDate || addYearsToDate(getTodayFormatted(), 1)
      );
      setError(null);
    }
  }, [isOpen, existingObligation]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expiryDate.trim()) {
      setError('Molimo unesite datum isteka registracije.');
      return;
    }

    onSave({
      id: existingObligation?.id || 'ob_reg_' + Date.now(),
      carId,
      type: 'registracija',
      title: 'Registracija vozila',
      date: date.trim() || getTodayFormatted(),
      expiryDate: expiryDate.trim(),
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1D68F2] flex items-center justify-center">
                <Car className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                {existingObligation ? 'Uredi registraciju' : 'Unos registracije'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
                {error}
              </div>
            )}

            {/* Datum unosa / važenja */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Datum unosa / važenja
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
                  onChange={(e) => setDate(e.target.value)}
                  onClick={() => setIsDatePickerOpen(true)}
                  placeholder="dd.mm.gggg."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D68F2] cursor-pointer"
                />
              </div>
            </div>

            {/* Datum isteka registracije */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Datum isteka registracije <span className="text-red-500">*</span>
              </label>
              <div
                className="relative cursor-pointer"
                onClick={() => setIsExpiryDatePickerOpen(true)}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpiryDatePickerOpen(true);
                  }}
                  className="w-8 h-8 absolute left-1 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-[#1D68F2] transition-colors cursor-pointer"
                  title="Otvori kalendar"
                >
                  <Calendar className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  onClick={() => setIsExpiryDatePickerOpen(true)}
                  placeholder="dd.mm.gggg."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D68F2] cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Format: dd.mm.gggg.
              </p>
            </div>

            {/* Dugmad */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                ODUSTANI
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 bg-[#1D68F2] hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                Sačuvaj zapis
              </button>
            </div>
          </form>
        </motion.div>

        {/* Date Pickers */}
        <DatePickerModal
          isOpen={isDatePickerOpen}
          value={date}
          title="Datum unosa / važenja"
          onClose={() => setIsDatePickerOpen(false)}
          onSelect={(newDate) => setDate(newDate)}
        />

        <DatePickerModal
          isOpen={isExpiryDatePickerOpen}
          value={expiryDate}
          title="Datum isteka registracije"
          onClose={() => setIsExpiryDatePickerOpen(false)}
          onSelect={(newDate) => setExpiryDate(newDate)}
        />
      </div>
    </AnimatePresence>
  );
};
