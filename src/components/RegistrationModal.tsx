import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Car } from 'lucide-react';
import { VehicleObligation } from '../types';
import { getTodayFormatted, addYearsToDate } from '../utils/dateUtils';
import { DatePickerModal } from './DatePickerModal';

interface RegistrationModalProps {
  isOpen: boolean;
  carId: string;
  existingObligation?: VehicleObligation | null;
  onClose: () => void;
  onSave: (obligation: VehicleObligation) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  carId,
  existingObligation,
  onClose,
  onSave,
}) => {
  const [entryDate, setEntryDate] = useState(
    existingObligation?.date || getTodayFormatted()
  );
  const [expiryDate, setExpiryDate] = useState(
    existingObligation?.expiryDate || addYearsToDate(existingObligation?.date || getTodayFormatted(), 1)
  );
  const [error, setError] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initialDate = existingObligation?.date || getTodayFormatted();
      setEntryDate(initialDate);
      setExpiryDate(addYearsToDate(initialDate, 1));
      setError(null);
      setIsDatePickerOpen(false);
    }
  }, [isOpen, existingObligation]);

  if (!isOpen) return null;

  const handleEntryDateSelect = (newDate: string) => {
    setEntryDate(newDate);
    // Registration is valid exactly one year from the entry date.
    setExpiryDate(addYearsToDate(newDate, 1));
    setIsDatePickerOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryDate.trim()) {
      setError('Molimo unesite datum unosa registracije.');
      return;
    }

    onSave({
      id: existingObligation?.id || 'ob_reg_' + Date.now(),
      carId,
      type: 'registracija',
      title: 'Registracija vozila',
      date: entryDate.trim(),
      expiryDate: addYearsToDate(entryDate.trim(), 1),
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

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                DATUM UNOSA / VAŽENJA
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
                  required
                  value={entryDate}
                  readOnly
                  onClick={() => setIsDatePickerOpen(true)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D68F2] cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                DATUM ISTEKA REGISTRACIJE <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="w-8 h-8 absolute left-1 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={expiryDate}
                  readOnly
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Registracija važi 1 godinu od datuma unosa.
              </p>
            </div>

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
                SAČUVAJ
              </button>
            </div>
          </form>
        </motion.div>

        <DatePickerModal
          isOpen={isDatePickerOpen}
          value={entryDate}
          title="Datum unosa / važenja"
          onClose={() => setIsDatePickerOpen(false)}
          onSelect={handleEntryDateSelect}
        />
      </div>
    </AnimatePresence>
  );
};
