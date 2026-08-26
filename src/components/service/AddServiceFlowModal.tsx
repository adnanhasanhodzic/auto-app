import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ArrowRight, ArrowLeft, Fuel, Calendar, Gauge, X } from 'lucide-react';
import { ServiceCategory, ServiceRecord, CarData } from '../../types';
import { CATEGORY_CARDS } from '../../serviceCatalog';
import { CategorySelectView } from './CategorySelectView';
import { SubGroupSelectView } from './SubGroupSelectView';
import { ServiceEntryFormView } from './ServiceEntryFormView';
import { formatDateCustom } from '../../utils/dateUtils';
import { DatePickerModal } from '../DatePickerModal';

interface AddServiceFlowModalProps {
  isOpen: boolean;
  car: CarData;
  onClose: () => void;
  onSaveRecord: (record: ServiceRecord) => void;
}

type FlowStep = 'category' | 'subgroup' | 'entry' | 'fuel' | 'success';

export const AddServiceFlowModal: React.FC<AddServiceFlowModalProps> = ({
  isOpen,
  car,
  onClose,
  onSaveRecord,
}) => {
  const [step, setStep] = useState<FlowStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [primaryTitle, setPrimaryTitle] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [savedRecord, setSavedRecord] = useState<ServiceRecord | null>(null);

  // Fuel form state
  const [fuelDate, setFuelDate] = useState<string>(formatDateCustom(new Date()));
  const [fuelMileage, setFuelMileage] = useState<string>(car?.mileage ? car.mileage.toLocaleString('de-DE') : '');
  const [fuelCost, setFuelCost] = useState<string>('');
  const [fuelError, setFuelError] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Sync state whenever modal is opened or car changes
  React.useEffect(() => {
    if (isOpen) {
      setFuelDate(formatDateCustom(new Date()));
      setFuelMileage(car?.mileage ? car.mileage.toLocaleString('de-DE') : '');
      setFuelCost('');
      setFuelError(null);
    }
  }, [isOpen, car?.id, car?.mileage]);

  if (!isOpen) return null;

  const handleCategorySelect = (cat: ServiceCategory) => {
    setSelectedCategory(cat);
    setSelectedItems([]);
    setStep('subgroup');
  };

  const handleSelectFuel = () => {
    setFuelDate(formatDateCustom(new Date()));
    setFuelMileage(car?.mileage ? car.mileage.toLocaleString('de-DE') : '');
    setFuelCost('');
    setFuelError(null);
    setStep('fuel');
  };

  const handleToggleItem = (item: string) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter((i) => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleSingleItemAndProceed = (item: string, groupName: string) => {
    setSelectedItems([item]);
    setPrimaryTitle(item);
    setSelectedGroup(groupName);
    setStep('entry');
  };

  const handleProceedWithItems = (title: string, groupName: string) => {
    setPrimaryTitle(title);
    setSelectedGroup(groupName);
    setStep('entry');
  };

  const handleSaveRecord = (record: ServiceRecord) => {
    setSavedRecord(record);
    onSaveRecord(record);
    setStep('success');
  };

  const handleSaveFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFuelError(null);

    if (!fuelDate.trim()) {
      setFuelError('Molimo unesite datum točenja.');
      return;
    }

    const mileageNum = parseInt(fuelMileage.replace(/\D/g, ''), 10);
    if (isNaN(mileageNum) || mileageNum < 0) {
      setFuelError('Molimo unesite validnu kilometražu.');
      return;
    }

    const costNum = parseFloat(fuelCost.replace(',', '.'));
    if (isNaN(costNum) || costNum <= 0) {
      setFuelError('Molimo unesite validan iznos u KM.');
      return;
    }

    const fuelRecord: ServiceRecord = {
      id: 'fuel_' + Date.now().toString(),
      carId: car.id,
      category: 'gorivo',
      categoryName: 'Gorivo',
      title: 'Točenje goriva',
      date: fuelDate.trim(),
      mileage: mileageNum,
      cost: costNum,
      currency: 'KM',
      items: ['Točenje goriva'],
      createdAt: Date.now(),
    };

    handleSaveRecord(fuelRecord);
  };

  const handleFinish = () => {
    // Reset and close
    setStep('category');
    setSelectedCategory(null);
    setSelectedItems([]);
    setPrimaryTitle('');
    setSavedRecord(null);
    onClose();
  };

  const categoryDef = CATEGORY_CARDS.find((c) => c.id === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-[430px] h-full sm:h-[844px] bg-white sm:rounded-[36px] shadow-2xl flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {/* STEP 1: CATEGORY SELECTION */}
          {step === 'category' && (
            <motion.div
              key="category-step"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col h-full"
            >
              <CategorySelectView
                onSelectCategory={handleCategorySelect}
                onSelectFuel={handleSelectFuel}
                onBack={onClose}
              />
            </motion.div>
          )}

          {/* FUEL ENTRY FORM */}
          {step === 'fuel' && (
            <motion.div
              key="fuel-step"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col justify-between w-full h-full bg-white px-5 py-4 overflow-y-auto no-scrollbar"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100/80">
                  <button
                    onClick={() => setStep('category')}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
                  </button>
                  <h1 className="text-base font-bold text-slate-900 tracking-tight">
                    TOČENJE GORIVA
                  </h1>
                  <button
                    onClick={() => setStep('category')}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Subtitle with Vehicle Fuel Type */}
                <div className="pt-4 pb-3 flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Fuel className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Evidencija točenja
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      {car.make} {car.model} {car.fuel ? `• ${car.fuel}` : ''}
                    </p>
                  </div>
                </div>

                <form id="fuel-flow-form" onSubmit={handleSaveFuelSubmit} className="space-y-4 pt-1">
                  {fuelError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
                      {fuelError}
                    </div>
                  )}

                  {/* DATUM */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      DATUM
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
                        className="w-8 h-8 absolute left-1 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                        title="Otvori kalendar"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        value={fuelDate}
                        onChange={(e) => setFuelDate(e.target.value)}
                        onClick={() => setIsDatePickerOpen(true)}
                        placeholder="25.08.2026."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* KILOMETRAŽA */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      KILOMETRAŽA
                    </label>
                    <div className="relative">
                      <Gauge className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fuelMileage}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, '');
                          if (!digitsOnly) {
                            setFuelMileage('');
                            return;
                          }
                          const num = parseInt(digitsOnly, 10);
                          setFuelMileage(num.toLocaleString('de-DE'));
                        }}
                        placeholder="195.000"
                        className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        km
                      </span>
                    </div>
                  </div>

                  {/* IZNOS */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      IZNOS
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={fuelCost}
                        onChange={(e) => setFuelCost(e.target.value)}
                        placeholder="85"
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-amber-600">
                        KM
                      </span>
                    </div>
                  </div>
                </form>
              </div>

              {/* Bottom SAČUVAJ button */}
              <div className="pt-6 pb-2">
                <button
                  type="submit"
                  form="fuel-flow-form"
                  className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <span>SAČUVAJ</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: SUBGROUP / WORK ITEM SELECTION */}
          {step === 'subgroup' && selectedCategory && (
            <motion.div
              key="subgroup-step"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col h-full"
            >
              <SubGroupSelectView
                category={selectedCategory}
                selectedItems={selectedItems}
                onToggleItem={handleToggleItem}
                onSelectSingleItemAndProceed={handleSingleItemAndProceed}
                onProceedWithItems={handleProceedWithItems}
                onBack={() => setStep('category')}
              />
            </motion.div>
          )}

          {/* STEP 3: WORK ENTRY FORM */}
          {step === 'entry' && selectedCategory && (
            <motion.div
              key="entry-step"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col h-full"
            >
              <ServiceEntryFormView
                car={car}
                category={selectedCategory}
                categoryName={categoryDef?.name || 'Rad'}
                initialTitle={primaryTitle}
                initialGroup={selectedGroup}
                initialItems={selectedItems}
                onSave={handleSaveRecord}
                onBack={() => setStep('subgroup')}
              />
            </motion.div>
          )}

          {/* STEP 4: SUCCESS FEEDBACK */}
          {step === 'success' && savedRecord && (
            <motion.div
              key="success-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col justify-between p-6 text-center bg-white"
            >
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-12 h-12 stroke-[2.2]" />
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {savedRecord.category === 'gorivo'
                      ? 'Točenje goriva je uspješno dodano'
                      : 'Rad / servis je uspješno dodan'}
                  </h2>
                  <p className="text-xs text-slate-500 max-w-[260px] mx-auto">
                    Evidentiran je unos <strong>"{savedRecord.title}"</strong> sa iznosom od{' '}
                    <strong>{savedRecord.cost} KM</strong>.
                  </p>
                </div>

                {/* Summary Box */}
                <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2 mt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Kategorija:</span>
                    <span className="text-slate-900 font-bold">{savedRecord.categoryName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Datum:</span>
                    <span className="text-slate-900 font-bold">{savedRecord.date}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Kilometraža:</span>
                    <span className="text-slate-900 font-bold">
                      {savedRecord.mileage.toLocaleString('de-DE')} km
                    </span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
                    <span className="text-slate-500 font-medium">Ukupan iznos:</span>
                    <span className="text-slate-900 font-extrabold text-sm">
                      {savedRecord.cost} KM
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full py-3.5 px-4 bg-[#1D68F2] hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <span>VRATI SE NA POČETNU</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <DatePickerModal
          isOpen={isDatePickerOpen}
          value={fuelDate}
          title="Datum točenja goriva"
          onClose={() => setIsDatePickerOpen(false)}
          onSelect={(newDate) => setFuelDate(newDate)}
        />
      </div>
    </div>
  );
};
