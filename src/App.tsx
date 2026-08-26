import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Smartphone, Plus } from 'lucide-react';
import { SplashScreen } from './components/SplashScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { HomeScreen } from './components/HomeScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { ExpensesScreen } from './components/ExpensesScreen';
import { AddCarModal } from './components/AddCarModal';
import { EditCarModal } from './components/EditCarModal';
import { VehicleSelectorModal } from './components/VehicleSelectorModal';
import { DeleteVehicleModal } from './components/DeleteVehicleModal';
import { AddServiceFlowModal } from './components/service/AddServiceFlowModal';
import { RegularServiceModal } from './components/RegularServiceModal';
import { ObligationModal } from './components/ObligationModal';
import { BottomNavigation } from './components/BottomNavigation';
import { StatusBar } from './components/StatusBar';
import { calculateCarMileage } from './utils/carUtils';
import {
  STORAGE_KEY_CARS,
  STORAGE_KEY_ACTIVE_CAR_ID,
  STORAGE_KEY_CAR,
  STORAGE_KEY_RECORDS,
  STORAGE_KEY_OBLIGATIONS,
} from './data';
import {
  CarData,
  NavTab,
  ServiceRecord,
  VehicleObligation,
  RegularServiceStatus,
  ObligationItem,
} from './types';
import { calculateDaysRemaining, getDateTimestamp } from './utils/dateUtils';

type ScreenState = 'splash' | 'welcome' | 'main';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('splash');
  const [activeTab, setActiveTab] = useState<NavTab>('pocetna');

  // Multi-vehicle state
  const [cars, setCars] = useState<CarData[]>([]);
  const [activeCarId, setActiveCarId] = useState<string | null>(null);

  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [obligations, setObligations] = useState<VehicleObligation[]>([]);

  // Modals state
  const [isAddCarOpen, setIsAddCarOpen] = useState(false);
  const [isEditCarOpen, setIsEditCarOpen] = useState(false);
  const [carToEdit, setCarToEdit] = useState<CarData | null>(null);
  const [isVehicleSelectorOpen, setIsVehicleSelectorOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [regularServiceModal, setRegularServiceModal] = useState<{
    isOpen: boolean;
    type: 'mali' | 'veliki';
  }>({ isOpen: false, type: 'mali' });
  const [isDirectObligationOpen, setIsDirectObligationOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState<CarData | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Initialize and load saved state from localStorage (NO MOCK DATA)
  useEffect(() => {
    try {
      // 1. Multi-car Data (with legacy single car migration)
      let loadedCars: CarData[] = [];
      const storedCars = localStorage.getItem(STORAGE_KEY_CARS);
      if (storedCars) {
        const parsed = JSON.parse(storedCars);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedCars = parsed.map((c, i) => ({
            ...c,
            id: c.id || 'car_' + (i + 1),
          }));
        }
      } else {
        // Check legacy single car
        const legacyCar = localStorage.getItem(STORAGE_KEY_CAR);
        if (legacyCar) {
          const parsed = JSON.parse(legacyCar);
          if (parsed && parsed.make && parsed.model) {
            const singleCar: CarData = {
              ...parsed,
              id: parsed.id || 'car_1',
            };
            loadedCars = [singleCar];
            localStorage.setItem(STORAGE_KEY_CARS, JSON.stringify([singleCar]));
          }
        }
      }

      setCars(loadedCars);

      const storedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_CAR_ID);
      if (storedActiveId && loadedCars.some((c) => c.id === storedActiveId)) {
        setActiveCarId(storedActiveId);
      } else if (loadedCars.length > 0) {
        setActiveCarId(loadedCars[0].id);
      }

      // 2. Services Data (Sanitize legacy auto-generated nextService on generic repairs)
      const storedServices = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (storedServices) {
        const parsedSrv = JSON.parse(storedServices);
        if (Array.isArray(parsedSrv)) {
          const defaultCarId = loadedCars.length > 0 ? loadedCars[0].id : 'car_1';
          const normalized = parsedSrv.map((s: ServiceRecord) => {
            const titleLower = (s.title || '').toLowerCase();
            const isRegularService =
              titleLower.includes('mali servis') ||
              titleLower.includes('veliki servis') ||
              s.items?.some(
                (item) =>
                  item.toLowerCase().includes('mali servis') ||
                  item.toLowerCase().includes('veliki servis')
              );

            return {
              ...s,
              carId: s.carId || defaultCarId,
              // Only keep nextService if it's regular service or had explicitly configured next service interval
              nextService: isRegularService || s.nextService?.trackMileage || s.nextService?.trackTime
                ? s.nextService
                : undefined,
            };
          });
          setServices(normalized);
        }
      }

      // 3. Obligations Data
      const storedObligations = localStorage.getItem(STORAGE_KEY_OBLIGATIONS);
      if (storedObligations) {
        const parsedOb = JSON.parse(storedObligations);
        if (Array.isArray(parsedOb)) {
          const defaultCarId = loadedCars.length > 0 ? loadedCars[0].id : 'car_1';
          const normalized = parsedOb.map((o: VehicleObligation) => ({
            ...o,
            carId: o.carId || defaultCarId,
          }));
          setObligations(normalized);
        }
      }
    } catch (e) {
      console.error('Error loading data from localStorage:', e);
    }
  }, []);

  // Determine current active vehicle with dynamically computed real-time mileage
  const activeCar = useMemo(() => {
    if (!cars || cars.length === 0) return null;
    const foundCar = cars.find((c) => c.id === activeCarId) || cars[0];
    const computedMileage = calculateCarMileage(foundCar, services);
    return {
      ...foundCar,
      mileage: computedMileage,
    };
  }, [cars, activeCarId, services]);

  // Filter services and obligations strictly for active car
  const activeCarServices = useMemo(() => {
    if (!activeCar) return [];
    return services.filter((s) => s.carId === activeCar.id);
  }, [services, activeCar]);

  const activeCarObligations = useMemo(() => {
    if (!activeCar) return [];
    return obligations.filter((o) => o.carId === activeCar.id);
  }, [obligations, activeCar]);

  const handleSplashFinish = () => {
    if (cars.length > 0) {
      setScreen('main');
    } else {
      setScreen('welcome');
    }
  };

  const handleSaveCar = (newCar: CarData) => {
    const carWithId: CarData = {
      ...newCar,
      id: newCar.id || 'car_' + Date.now(),
    };

    const updatedCars = [...cars, carWithId];
    setCars(updatedCars);
    setActiveCarId(carWithId.id);

    try {
      localStorage.setItem(STORAGE_KEY_CARS, JSON.stringify(updatedCars));
      localStorage.setItem(STORAGE_KEY_ACTIVE_CAR_ID, carWithId.id);
    } catch (e) {
      console.error('Error saving car to storage:', e);
    }
    setScreen('main');
  };

  const handleSelectCar = (carId: string) => {
    setActiveCarId(carId);
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_CAR_ID, carId);
    } catch (e) {
      console.error('Error saving active car ID:', e);
    }
  };

  const handleUpdateCar = (updatedCar: CarData) => {
    const updatedCars = cars.map((c) =>
      c.id === updatedCar.id ? { ...updatedCar } : c
    );
    setCars(updatedCars);
    try {
      localStorage.setItem(STORAGE_KEY_CARS, JSON.stringify(updatedCars));
    } catch (e) {
      console.error('Error updating car in storage:', e);
    }
  };

  const handleUpdateMileage = (newMileage: number) => {
    if (!activeCar) return;
    const updatedCars = cars.map((c) =>
      c.id === activeCar.id ? { ...c, mileage: newMileage, initialMileage: newMileage } : c
    );
    setCars(updatedCars);
    try {
      localStorage.setItem(STORAGE_KEY_CARS, JSON.stringify(updatedCars));
    } catch (e) {
      console.error('Error updating mileage in storage:', e);
    }
  };

  const handleConfirmDeleteCar = () => {
    const idToDelete = carToDelete?.id || activeCar?.id;
    if (!idToDelete) return;

    const remainingCars = cars.filter((c) => c.id !== idToDelete);
    const remainingServices = services.filter((s) => s.carId !== idToDelete);
    const remainingObligations = obligations.filter((o) => o.carId !== idToDelete);

    setCars(remainingCars);
    setServices(remainingServices);
    setObligations(remainingObligations);

    try {
      localStorage.setItem(STORAGE_KEY_CARS, JSON.stringify(remainingCars));
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(remainingServices));
      localStorage.setItem(STORAGE_KEY_OBLIGATIONS, JSON.stringify(remainingObligations));
    } catch (e) {
      console.error('Error deleting car from storage:', e);
    }

    setCarToDelete(null);
    setIsDeleteModalOpen(false);

    if (remainingCars.length > 0) {
      const nextId = remainingCars[0].id;
      setActiveCarId(nextId);
      localStorage.setItem(STORAGE_KEY_ACTIVE_CAR_ID, nextId);
    } else {
      setActiveCarId(null);
      localStorage.removeItem(STORAGE_KEY_ACTIVE_CAR_ID);
      setActiveTab('pocetna');
      setScreen('welcome');
    }
  };

  // Add / Save Service Record (handles both new and edited records)
  const handleSaveServiceRecord = (newRecord: ServiceRecord) => {
    const recordWithCar: ServiceRecord = {
      ...newRecord,
      carId: activeCar?.id || newRecord.carId,
    };
    
    const existingIndex = services.findIndex((s) => s.id === recordWithCar.id);
    let updated: ServiceRecord[];
    if (existingIndex >= 0) {
      updated = services.map((s) => (s.id === recordWithCar.id ? recordWithCar : s));
    } else {
      updated = [recordWithCar, ...services];
    }
    
    setServices(updated);
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving service record:', e);
    }
  };

  const handleDeleteServiceRecord = (id: string) => {
    const updated = services.filter((s) => s.id !== id);
    setServices(updated);
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error deleting service record:', e);
    }
  };

  // Obligations (Registracija, Osiguranje, Tehnički pregled)
  const handleSaveObligation = (newOb: VehicleObligation) => {
    const obWithCar: VehicleObligation = {
      ...newOb,
      carId: activeCar?.id || newOb.carId,
    };
    const filtered = obligations.filter(
      (o) => !(o.carId === obWithCar.carId && o.type === obWithCar.type)
    );
    const updated = [...filtered, obWithCar];
    setObligations(updated);
    try {
      localStorage.setItem(STORAGE_KEY_OBLIGATIONS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving obligation:', e);
    }
  };

  const handleDeleteObligation = (id: string) => {
    const updated = obligations.filter((o) => o.id !== id);
    setObligations(updated);
    try {
      localStorage.setItem(STORAGE_KEY_OBLIGATIONS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error deleting obligation:', e);
    }
  };

  // Regular Services Handlers (Mali i Veliki Servis)
  const handleSaveRegularService = (newRecord: ServiceRecord) => {
    const recordWithCar = {
      ...newRecord,
      carId: activeCar?.id || newRecord.carId,
    };

    const updatedServices = [recordWithCar, ...services];
    setServices(updatedServices);
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updatedServices));
    } catch (e) {
      console.error('Error saving regular service record:', e);
    }

    if (activeCar && recordWithCar.mileage > activeCar.mileage) {
      handleUpdateMileage(recordWithCar.mileage);
    }
  };

  const handleClearRegularService = (type: 'mali' | 'veliki') => {
    if (!activeCar) return;
    const targetTitle = type === 'mali' ? 'mali servis' : 'veliki servis';
    const targetSubGroup = type === 'mali' ? 'MALI SERVIS' : 'VELIKI SERVIS';

    const updated = services.filter((s) => {
      if (s.carId !== activeCar.id) return true;
      const titleLower = (s.title || '').toLowerCase();
      if (titleLower.includes(targetTitle) || s.subGroup?.toUpperCase() === targetSubGroup) {
        return false;
      }
      return true;
    });

    setServices(updated);
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error clearing regular service:', e);
    }
  };

  // Find latest records for Mali and Veliki servis for the active car
  const lastMaliRecord = useMemo(() => {
    if (!activeCar) return null;
    const maliRecords = activeCarServices
      .filter((s) => {
        const titleLower = (s.title || '').toLowerCase();
        return (
          titleLower === 'mali servis' ||
          titleLower.includes('mali servis') ||
          s.subGroup?.toUpperCase() === 'MALI SERVIS'
        );
      })
      .sort((a, b) => getDateTimestamp(b.date, b.createdAt) - getDateTimestamp(a.date, a.createdAt));
    return maliRecords.length > 0 ? maliRecords[0] : null;
  }, [activeCarServices, activeCar]);

  const lastVelikiRecord = useMemo(() => {
    if (!activeCar) return null;
    const velikiRecords = activeCarServices
      .filter((s) => {
        const titleLower = (s.title || '').toLowerCase();
        return (
          titleLower === 'veliki servis' ||
          titleLower.includes('veliki servis') ||
          s.subGroup?.toUpperCase() === 'VELIKI SERVIS'
        );
      })
      .sort((a, b) => getDateTimestamp(b.date, b.createdAt) - getDateTimestamp(a.date, a.createdAt));
    return velikiRecords.length > 0 ? velikiRecords[0] : null;
  }, [activeCarServices, activeCar]);

  // Compute Regular Services status (Mali & Veliki servis ONLY)
  const maliServisStatus: RegularServiceStatus | null = useMemo(() => {
    if (!activeCar) return null;

    if (!lastMaliRecord) {
      return {
        type: 'mali',
        title: 'Mali servis',
        isConfigured: false,
        hasInterval: false,
      };
    }

    const ns = lastMaliRecord.nextService;
    const hasInterval = Boolean(ns && (ns.trackTime || ns.trackMileage));

    if (hasInterval && ns) {
      const daysRemaining = ns.trackTime && ns.targetDate
        ? calculateDaysRemaining(ns.targetDate)
        : undefined;
      const kmRemaining = ns.trackMileage && ns.targetKm
        ? Math.max(0, ns.targetKm - activeCar.mileage)
        : undefined;

      const isOverdue = Boolean(
        (ns.trackTime && daysRemaining !== undefined && daysRemaining <= 0) ||
        (ns.trackMileage && kmRemaining !== undefined && kmRemaining <= 0)
      );

      return {
        type: 'mali',
        title: 'Mali servis',
        lastServiceDate: lastMaliRecord.date,
        lastServiceMileage: lastMaliRecord.mileage,
        targetDate: ns.targetDate,
        targetKm: ns.targetKm,
        daysRemaining,
        kmRemaining,
        isConfigured: true,
        hasInterval: true,
        isOverdue,
        trackTime: ns.trackTime,
        trackMileage: ns.trackMileage,
      };
    }

    return {
      type: 'mali',
      title: 'Mali servis',
      lastServiceDate: lastMaliRecord.date,
      lastServiceMileage: lastMaliRecord.mileage,
      isConfigured: true,
      hasInterval: false,
    };
  }, [lastMaliRecord, activeCar]);

  const velikiServisStatus: RegularServiceStatus | null = useMemo(() => {
    if (!activeCar) return null;

    if (!lastVelikiRecord) {
      return {
        type: 'veliki',
        title: 'Veliki servis',
        isConfigured: false,
        hasInterval: false,
      };
    }

    const ns = lastVelikiRecord.nextService;
    const hasInterval = Boolean(ns && (ns.trackTime || ns.trackMileage));

    if (hasInterval && ns) {
      const daysRemaining = ns.trackTime && ns.targetDate
        ? calculateDaysRemaining(ns.targetDate)
        : undefined;
      const kmRemaining = ns.trackMileage && ns.targetKm
        ? Math.max(0, ns.targetKm - activeCar.mileage)
        : undefined;

      const isOverdue = Boolean(
        (ns.trackTime && daysRemaining !== undefined && daysRemaining <= 0) ||
        (ns.trackMileage && kmRemaining !== undefined && kmRemaining <= 0)
      );

      return {
        type: 'veliki',
        title: 'Veliki servis',
        lastServiceDate: lastVelikiRecord.date,
        lastServiceMileage: lastVelikiRecord.mileage,
        targetDate: ns.targetDate,
        targetKm: ns.targetKm,
        daysRemaining,
        kmRemaining,
        isConfigured: true,
        hasInterval: true,
        isOverdue,
        trackTime: ns.trackTime,
        trackMileage: ns.trackMileage,
      };
    }

    return {
      type: 'veliki',
      title: 'Veliki servis',
      lastServiceDate: lastVelikiRecord.date,
      lastServiceMileage: lastVelikiRecord.mileage,
      isConfigured: true,
      hasInterval: false,
    };
  }, [lastVelikiRecord, activeCar]);

  // Compute Registration Obligation for active vehicle
  const activeCarRegistration = useMemo(() => {
    if (!activeCar) return null;
    return (
      activeCarObligations.find(
        (o) => o.type === 'registracija' || o.title.toLowerCase().includes('registracij')
      ) || null
    );
  }, [activeCarObligations, activeCar]);

  // Compute Obligations for Home Screen preview
  const computedObligations: ObligationItem[] = useMemo(() => {
    return activeCarObligations.map((ob) => {
      const days = calculateDaysRemaining(ob.expiryDate);
      let iconType: ObligationItem['iconType'] = 'doc';
      if (ob.type === 'osiguranje') iconType = 'shield';
      else if (ob.type === 'tehnicki') iconType = 'check';

      return {
        id: ob.id,
        title: ob.title,
        expiryDate: ob.expiryDate,
        daysRemaining: days,
        iconType,
      };
    });
  }, [activeCarObligations]);

  const restartSplash = () => {
    setScreen('splash');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start sm:py-8 sm:px-4 select-none">
      {/* Desktop Quick Preview Bar */}
      <header className="w-full max-w-md hidden sm:flex items-center justify-between mb-3 px-2 text-xs text-slate-500 font-medium">
        <div className="flex items-center space-x-1.5 font-bold text-slate-700">
          <Smartphone className="w-4 h-4 text-[#1D68F2]" />
          <span>MOJ AUTO • Android</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={restartSplash}
            title="Pokreni Splash Screen ponovo"
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-[#1D68F2]" />
            <span>Splash</span>
          </button>
          {!activeCar && screen === 'welcome' && (
            <button
              onClick={() => setIsAddCarOpen(true)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[#1D68F2] font-semibold hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3 h-3 text-[#1D68F2]" />
              <span>Dodaj auto</span>
            </button>
          )}
          {activeCar && screen === 'main' && (
            <button
              onClick={() => setIsAddServiceOpen(true)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#1D68F2] text-white font-semibold hover:bg-blue-600 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Dodaj rad</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Mobile App Frame */}
      <main
        id="app-container"
        className="w-full max-w-[430px] h-screen sm:h-[844px] max-h-screen bg-white sm:rounded-[36px] shadow-2xl sm:border-[8px] sm:border-slate-800 flex flex-col overflow-hidden relative"
      >
        {/* Status Bar */}
        <StatusBar />

        {/* Screen Content Router */}
        <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {screen === 'splash' && (
              <motion.div
                key="splash"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col overflow-y-auto"
              >
                <SplashScreen onFinish={handleSplashFinish} />
              </motion.div>
            )}

            {screen === 'welcome' && !activeCar && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col overflow-y-auto"
              >
                <WelcomeScreen onContinue={() => setIsAddCarOpen(true)} />
              </motion.div>
            )}

            {screen === 'main' && activeCar && (
              <motion.div
                key="main"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35 }}
                className="flex-1 flex flex-col min-h-0 h-full overflow-hidden"
              >
                {/* Active Tab View (Scrollable area) */}
                <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 w-full flex flex-col">
                  {activeTab === 'pocetna' && (
                    <HomeScreen
                      car={activeCar}
                      maliServis={maliServisStatus}
                      velikiServis={velikiServisStatus}
                      recentServices={activeCarServices}
                      obligations={computedObligations}
                      onUpdateMileage={handleUpdateMileage}
                      onDeleteCar={() => {
                        setCarToDelete(activeCar);
                        setIsDeleteModalOpen(true);
                      }}
                      onOpenVehicleSelector={() => setIsVehicleSelectorOpen(true)}
                      onOpenAddService={() => setIsAddServiceOpen(true)}
                      onOpenRegularService={(type) => setRegularServiceModal({ isOpen: true, type })}
                      onOpenObligationModal={() => setIsDirectObligationOpen(true)}
                      onNavigateTab={(tab) => setActiveTab(tab)}
                    />
                  )}

                  {activeTab === 'istorija' && (
                    <HistoryScreen
                      car={activeCar}
                      services={activeCarServices}
                      onOpenAddService={() => setIsAddServiceOpen(true)}
                      onDeleteService={handleDeleteServiceRecord}
                      onSaveFuelRecord={handleSaveServiceRecord}
                    />
                  )}

                  {activeTab === 'odrzavanje' && (
                    <MaintenanceScreen
                      car={activeCar}
                      services={activeCarServices}
                      obligations={activeCarObligations}
                      maliServis={maliServisStatus}
                      velikiServis={velikiServisStatus}
                      onOpenAddService={() => setIsAddServiceOpen(true)}
                      onOpenRegularService={(type) => setRegularServiceModal({ isOpen: true, type })}
                      onSaveObligation={handleSaveObligation}
                      onDeleteObligation={handleDeleteObligation}
                    />
                  )}

                  {activeTab === 'troskovi' && (
                    <ExpensesScreen
                      car={activeCar}
                      services={activeCarServices}
                    />
                  )}
                </div>

                {/* Bottom Navigation Bar - Permanently Fixed at Bottom */}
                <div className="flex-shrink-0 z-30 bg-white border-t border-slate-100 shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
                  <BottomNavigation
                    activeTab={activeTab}
                    onTabChange={(tab) => setActiveTab(tab)}
                  />
                  {/* Home Indicator Bar (Android/iOS) */}
                  <div className="w-full py-1.5 flex justify-center bg-white">
                    <div className="w-32 h-1 bg-slate-300 rounded-full" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Add Car Modal */}
        <AddCarModal
          isOpen={isAddCarOpen}
          onClose={() => setIsAddCarOpen(false)}
          onSave={handleSaveCar}
        />

        {/* Multi-Vehicle Selector Modal */}
        <VehicleSelectorModal
          isOpen={isVehicleSelectorOpen}
          cars={cars}
          services={services}
          activeCarId={activeCar?.id || ''}
          onSelectCar={handleSelectCar}
          onEditCar={(car) => {
            setCarToEdit(car);
            setIsEditCarOpen(true);
          }}
          onAddNewCar={() => {
            setIsVehicleSelectorOpen(false);
            setIsAddCarOpen(true);
          }}
          onRequestDeleteCar={(car) => {
            setCarToDelete(car);
            setIsDeleteModalOpen(true);
          }}
          onClose={() => setIsVehicleSelectorOpen(false)}
        />

        {/* Edit Car Modal */}
        <EditCarModal
          isOpen={isEditCarOpen}
          car={carToEdit}
          onClose={() => {
            setIsEditCarOpen(false);
            setCarToEdit(null);
            setIsVehicleSelectorOpen(true);
          }}
          onSave={(updatedCar) => {
            handleUpdateCar(updatedCar);
            setIsEditCarOpen(false);
            setCarToEdit(null);
            setIsVehicleSelectorOpen(true);
          }}
          onRequestDelete={(car) => {
            setCarToDelete(car);
            setIsDeleteModalOpen(true);
          }}
        />

        {/* Delete Vehicle Confirmation Dialog Modal */}
        <DeleteVehicleModal
          isOpen={isDeleteModalOpen}
          car={carToDelete}
          onConfirm={handleConfirmDeleteCar}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setCarToDelete(null);
            setIsVehicleSelectorOpen(true);
          }}
        />

        {/* Add Service Flow Multi-Step Modal */}
        {activeCar && (
          <AddServiceFlowModal
            isOpen={isAddServiceOpen}
            car={activeCar}
            onClose={() => setIsAddServiceOpen(false)}
            onSaveRecord={handleSaveServiceRecord}
          />
        )}

        {/* Regular Service (Mali / Veliki Servis) Specific Flow Modal */}
        {activeCar && (
          <RegularServiceModal
            isOpen={regularServiceModal.isOpen}
            serviceType={regularServiceModal.type}
            car={activeCar}
            existingRecord={regularServiceModal.type === 'mali' ? lastMaliRecord : lastVelikiRecord}
            onClose={() => setRegularServiceModal({ isOpen: false, type: 'mali' })}
            onSaveRecord={handleSaveRegularService}
            onClearService={handleClearRegularService}
          />
        )}

        {/* Direct Registration Modal */}
        {activeCar && (
          <ObligationModal
            isOpen={isDirectObligationOpen}
            carId={activeCar.id}
            existingObligation={activeCarRegistration}
            onClose={() => setIsDirectObligationOpen(false)}
            onSave={handleSaveObligation}
          />
        )}
      </main>
    </div>
  );
}
