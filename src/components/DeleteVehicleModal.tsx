import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, X } from 'lucide-react';
import { CarData } from '../types';

interface DeleteVehicleModalProps {
  isOpen: boolean;
  car: CarData | null;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteVehicleModal: React.FC<DeleteVehicleModalProps> = ({
  isOpen,
  car,
  onConfirm,
  onClose,
}) => {
  if (!isOpen || !car) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-5 pb-3 flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 pb-4 space-y-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Obrisati vozilo?
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Brisanjem vozila brišu se i svi podaci vezani za ovo vozilo.
            </p>
          </div>

          {/* Action buttons */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 active:bg-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              ODUSTANI
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
            >
              OBRIŠI
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
