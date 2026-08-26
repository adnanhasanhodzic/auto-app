import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Pencil, Plus } from 'lucide-react';
import { CarData, ServiceRecord } from '../types';
import { CarIcon } from './CarIcon';
import { calculateCarMileage } from '../utils/carUtils';

interface VehicleSelectorModalProps {
  isOpen: boolean;
  cars: CarData[];
  activeCarId: string;
  services?: ServiceRecord[];
  onSelectCar: (carId: string) => void;
  onEditCar: (car: CarData) => void;
  onAddNewCar: () => void;
  onRequestDeleteCar?: (car: CarData) => void;
  onClose: () => void;
}

export const VehicleSelectorModal: React.FC<VehicleSelectorModalProps> = ({
  isOpen,
  cars,
  activeCarId,
  services = [],
  onSelectCar,
  onEditCar,
  onAddNewCar,
  onRequestDeleteCar,
  onClose,
}) => {
  if (!isOpen) return null;

  const isMultiple = cars.length > 1;

  const formatKm = (num?: number) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('de-DE');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {isMultiple ? 'Moja vozila' : 'Moje vozilo'}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {isMultiple
                  ? `${cars.length} registrovana vozila`
                  : 'Aktivni profil vozila'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body content */}
          <div className="p-4 space-y-3 overflow-y-auto">
            {cars.map((c) => {
              const isActive = c.id === activeCarId;
              const currentKm = calculateCarMileage(c, services);

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectCar(c.id);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    isActive
                      ? 'border-[#1D68F2] bg-blue-50/40 shadow-xs'
                      : 'border-slate-200/90 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      {c.image ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-100">
                          <img
                            src={c.image}
                            alt={`${c.make} ${c.model}`}
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isActive
                              ? 'bg-[#1D68F2] text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <CarIcon variant="side" className="w-7 h-7" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5 truncate">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {c.make} {c.model}
                          </h3>
                          {isActive && (
                            <span className="px-1.5 py-0.5 rounded-md bg-[#1D68F2] text-white text-[10px] font-bold flex-shrink-0">
                              Aktivno
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                          {[c.engine, c.powerKw ? `${c.powerKw} kW` : null, c.year].filter(Boolean).join(' • ') || `${formatKm(currentKm)} km`}
                        </div>

                        {c.licensePlate && (
                          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">
                            {c.licensePlate}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
                      {isActive && (
                        <div className="w-6 h-6 rounded-full bg-[#1D68F2] text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                      
                      {/* Discrete edit icon ✎ */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                          onEditCar(c);
                        }}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-[#1D68F2] hover:bg-blue-50 flex items-center justify-center border border-slate-200/60 transition-colors cursor-pointer"
                        title="Uredi vozilo"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Action Button */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/40">
            <button
              onClick={() => {
                onClose();
                onAddNewCar();
              }}
              className="w-full py-3 px-4 bg-[#1D68F2] hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>DODAJ VOZILO</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
