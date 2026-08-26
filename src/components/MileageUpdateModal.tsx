import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gauge, Check } from 'lucide-react';

interface MileageUpdateModalProps {
  isOpen: boolean;
  currentMileage: number;
  onClose: () => void;
  onSave: (newMileage: number) => void;
}

export const MileageUpdateModal: React.FC<MileageUpdateModalProps> = ({
  isOpen,
  currentMileage,
  onClose,
  onSave,
}) => {
  const [val, setVal] = useState(currentMileage.toString());

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(val.replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > 0) {
      onSave(num);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1D68F2] flex items-center justify-center">
                <Gauge className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Ažuriraj kilometražu
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Nova kilometraža (km)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  placeholder="npr. 186000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-lg focus:outline-none focus:border-[#1D68F2] focus:ring-2 focus:ring-[#1D68F2]/20"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  km
                </span>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Odustani
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#1D68F2] hover:bg-blue-600 text-white font-bold text-sm shadow-sm flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Sačuvaj</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
