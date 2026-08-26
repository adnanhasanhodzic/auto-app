import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Car, Check, ShieldCheck, Camera, RefreshCw, Trash2 } from 'lucide-react';
import { CarData } from '../types';
import { FUEL_OPTIONS } from '../data';

interface EditCarModalProps {
  isOpen: boolean;
  car: CarData | null;
  onClose: () => void;
  onSave: (updatedCar: CarData) => void;
  onRequestDelete?: (car: CarData) => void;
}

export const EditCarModal: React.FC<EditCarModalProps> = ({
  isOpen,
  car,
  onClose,
  onSave,
  onRequestDelete,
}) => {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [engine, setEngine] = useState('');
  const [powerKw, setPowerKw] = useState('');
  const [fuel, setFuel] = useState('Dizel');
  const [initialMileage, setInitialMileage] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (car) {
      setMake(car.make || '');
      setModel(car.model || '');
      setYear(car.year !== undefined ? car.year.toString() : '');
      setEngine(car.engine || '');
      setPowerKw(car.powerKw !== undefined && car.powerKw !== null && car.powerKw !== '' ? car.powerKw.toString() : '');
      setFuel(car.fuel || 'Dizel');
      const baseKm = car.initialMileage !== undefined ? car.initialMileage : car.mileage;
      setInitialMileage(baseKm !== undefined && baseKm !== null ? baseKm.toString() : '');
      setLicensePlate(car.licensePlate || '');
      setVin(car.vin || '');
      setImage(car.image || null);
      setError(null);
    }
  }, [car, isOpen]);

  if (!isOpen || !car) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Slika je prevelika. Maksimalna veličina je 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!make.trim()) {
      setError('Molimo unesite marku automobila.');
      return;
    }
    if (!model.trim()) {
      setError('Molimo unesite model automobila.');
      return;
    }

    const mileageNum = parseInt(initialMileage.replace(/\D/g, ''), 10);
    const parsedBaseMileage = isNaN(mileageNum) ? (car.initialMileage ?? car.mileage ?? 0) : mileageNum;
    const parsedPower = powerKw ? parseInt(powerKw.toString().replace(/\D/g, ''), 10) : undefined;

    const updatedCar: CarData = {
      ...car,
      make: make.trim(),
      model: model.trim(),
      year: year ? parseInt(year, 10) || year : '',
      engine: engine.trim(),
      powerKw: parsedPower && !isNaN(parsedPower) && parsedPower > 0 ? parsedPower : undefined,
      fuel: fuel.trim(),
      initialMileage: parsedBaseMileage,
      mileage: car.mileage, // App-level calculateCarMileage will ensure real-time accuracy
      licensePlate: licensePlate.trim(),
      vin: vin.trim(),
      image: image || undefined,
    };

    onSave(updatedCar);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1D68F2] flex items-center justify-center">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Uredi vozilo
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  {car.make} {car.model}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
                {error}
              </div>
            )}

            {/* 1. SLIKA VOZILA */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                FOTOGRAFIJA VOZILA
              </label>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              {!image ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-6 px-4 bg-slate-50 hover:bg-blue-50/40 border-2 border-dashed border-slate-200 hover:border-[#1D68F2]/60 rounded-2xl flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-[#1D68F2] group-hover:scale-105 transition-all">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-slate-700 group-hover:text-[#1D68F2]">
                      Dodaj fotografiju automobila
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Odaberite iz galerije ili slikajte kamerom
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group">
                  <img
                    src={image}
                    alt="Preview automobila"
                    className="w-full h-44 object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3 justify-between">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-900 rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 cursor-pointer backdrop-blur-xs transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#1D68F2]" />
                      <span>Promijeni fotografiju</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      className="p-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center cursor-pointer backdrop-blur-xs transition-colors"
                      title="Ukloni fotografiju"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. PODACI O VOZILU */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Marka <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="npr. Volkswagen"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:border-[#1D68F2] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="npr. Golf 7"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:border-[#1D68F2] focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Godište
                </label>
                <input
                  type="number"
                  placeholder="npr. 2016"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:border-[#1D68F2] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Motor
                </label>
                <input
                  type="text"
                  placeholder="npr. 1.6 TDI"
                  value={engine}
                  onChange={(e) => setEngine(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:border-[#1D68F2] focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Snaga (kW)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="npr. 105"
                    value={powerKw}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPowerKw(val);
                    }}
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:border-[#1D68F2] focus:bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    kW
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Vrsta goriva
                </label>
                <select
                  value={fuel}
                  onChange={(e) => setFuel(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:border-[#1D68F2] focus:bg-white"
                >
                  {FUEL_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Registarska oznaka
                </label>
                <input
                  type="text"
                  placeholder="npr. A12-E-345"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:border-[#1D68F2] focus:bg-white uppercase"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  VIN / Broj šasije
                </label>
                <input
                  type="text"
                  placeholder="Opcionalno"
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:border-[#1D68F2] focus:bg-white uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Početna km
                </label>
                <input
                  type="number"
                  placeholder="npr. 185800"
                  value={initialMileage}
                  onChange={(e) => setInitialMileage(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:border-[#1D68F2] focus:bg-white"
                />
              </div>
            </div>

            {/* Privacy note */}
            <div className="flex items-center space-x-2 pt-1 text-slate-500 text-xs">
              <ShieldCheck className="w-4 h-4 text-[#1D68F2] flex-shrink-0" />
              <span>Svi podaci se sigurno čuvaju lokalno na vašem telefonu.</span>
            </div>

            {/* 3. BRISANJE VOZILA OPTION */}
            {onRequestDelete && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequestDelete(car);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center justify-center space-x-2 border border-red-200/60 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Obriši vozilo</span>
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Odustani
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl bg-[#1D68F2] hover:bg-blue-600 active:bg-blue-700 text-white font-bold text-sm shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>SAČUVAJ IZMJENE</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
