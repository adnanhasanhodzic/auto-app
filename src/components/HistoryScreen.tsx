import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Gauge,
  Tag,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  CheckCircle2,
  Gift,
  Clock,
  Trash2,
  Fuel,
  Pencil,
} from 'lucide-react';
import { ServiceRecord, CarData } from '../types';
import { CATEGORY_CARDS } from '../serviceCatalog';
import { CategoryIcon, getCategoryStyle } from './CategoryIcons';
import { getDateTimestamp } from '../utils/dateUtils';
import { AddFuelModal } from './AddFuelModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface HistoryScreenProps {
  car: CarData;
  services: ServiceRecord[];
  onOpenAddService: () => void;
  onEditService?: (record: ServiceRecord) => void;
  onDeleteService: (id: string) => void;
  onSaveFuelRecord?: (record: ServiceRecord) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  car,
  services,
  onOpenAddService,
  onEditService,
  onDeleteService,
  onSaveFuelRecord,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  
  const [editingFuelRecord, setEditingFuelRecord] = useState<ServiceRecord | null>(null);
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    recordId?: string;
    title?: string;
  }>({ isOpen: false });

  // Sorted services: strictly latest first based on real date and createdAt
  const sortedServices = useMemo(() => {
    return [...services].sort((a, b) => {
      const tA = getDateTimestamp(a.date, a.createdAt);
      const tB = getDateTimestamp(b.date, b.createdAt);
      return tB - tA;
    });
  }, [services]);

  // Filtered services
  const filteredServices = useMemo(() => {
    return sortedServices.filter((s) => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'gorivo') {
          if (s.category !== 'gorivo') return false;
        } else if (s.category !== selectedCategory) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesTitle = s.title.toLowerCase().includes(query);
        const matchesItems = s.items?.some((i) => i.toLowerCase().includes(query));
        const matchesNote = s.note?.toLowerCase().includes(query);
        const matchesCategory = s.categoryName?.toLowerCase().includes(query);

        if (!matchesTitle && !matchesItems && !matchesNote && !matchesCategory) {
          return false;
        }
      }

      return true;
    });
  }, [sortedServices, selectedCategory, searchQuery]);

  const formatKm = (km: number) => {
    return km.toLocaleString('de-DE');
  };

  const handleEdit = (record: ServiceRecord) => {
    if (record.category === 'gorivo') {
      setEditingFuelRecord(record);
      setIsFuelModalOpen(true);
    } else {
      if (onEditService) {
        onEditService(record);
      } else {
        onOpenAddService();
      }
    }
  };

  return (
    <div id="history-screen" className="h-full flex flex-col overflow-hidden bg-[#F8FAFC] select-none">
      {/* Top Header */}
      <div className="flex-shrink-0 z-20 bg-white px-5 pt-4 pb-3 border-b border-slate-100/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Istorija radova i troškova
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {car.make} {car.model} • Ukupno {services.length} zapisa
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pretraži radove, dijelove, napomene..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D68F2]/20 focus:border-[#1D68F2] transition-all"
          />
        </div>

        {/* Filter Categories Horizontal Pill Bar */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-[#1D68F2] text-white shadow-xs'
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Sve ({services.length})
          </button>

          {/* Gorivo filter */}
          <button
            onClick={() => setSelectedCategory('gorivo')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 flex items-center space-x-1.5 ${
              selectedCategory === 'gorivo'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Fuel className="w-3 h-3 stroke-[2.2]" />
            <span>Gorivo</span>
          </button>

          {CATEGORY_CARDS.map((cat) => {
            const count = services.filter((s) => s.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-[#1D68F2] text-white shadow-xs'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat.name}</span>
                {count > 0 && <span className="opacity-80 text-[10px]">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Services List Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-3 pb-12">
        {filteredServices.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center shadow-2xs space-y-3 my-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                {services.length === 0
                  ? 'Još nema unesenih servisa ili točenja'
                  : 'Nema rezultata za odabrani filter'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {services.length === 0
                  ? 'Evidentirajte servis, popravku ili točenje goriva kako biste pratili istoriju.'
                  : 'Pokušajte promijeniti kategoriju ili pojam za pretragu.'}
              </p>
            </div>
            {services.length === 0 && (
              <button
                onClick={onOpenAddService}
                className="mt-2 py-2.5 px-4 bg-[#1D68F2] text-white text-xs font-bold rounded-xl hover:bg-blue-600 cursor-pointer shadow-xs"
              >
                DODAJ RAD / SERVIS
              </button>
            )}
          </div>
        ) : (
          filteredServices.map((record) => {
            const isExpanded = expandedRecordId === record.id;
            const isFuel = record.category === 'gorivo';
            const catStyle = getCategoryStyle(record.category);

            return (
              <motion.div
                key={record.id}
                layout
                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs"
              >
                {/* Header Summary */}
                <div
                  onClick={() => setExpandedRecordId(isExpanded ? null : record.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${catStyle.bg} ${catStyle.border}`}
                    >
                      <CategoryIcon
                        type={record.category}
                        color={catStyle.color}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      {/* PRVI RED: Naziv rada */}
                      <h4 className="text-sm font-bold text-slate-900 leading-tight truncate">
                        {record.title}
                      </h4>
                      {/* DRUGI RED: Vrsta/kategorija rada */}
                      <div
                        className={`text-xs font-semibold leading-tight mt-0.5 ${
                          isFuel ? 'text-amber-600' : 'text-slate-600'
                        }`}
                      >
                        {record.categoryName || (isFuel ? 'Gorivo' : 'Servis')}
                      </div>
                      {/* TREĆI RED: Datum • kilometraža */}
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-medium mt-0.5">
                        <span>{record.date}</span>
                        {record.mileage ? (
                          <>
                            <span>•</span>
                            <span>{formatKm(record.mileage)} km</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 pl-2 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-slate-900">
                        {typeof record.cost === 'number'
                          ? record.cost.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                          : record.cost}{' '}
                        {record.currency}
                      </div>
                      {record.warranty?.hasWarranty && (
                        <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                          Garancija
                        </span>
                      )}
                    </div>

                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-3"
                    >
                      {/* Sub-items done */}
                      {!isFuel && record.items && record.items.length > 0 && (
                        <div>
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Urađene stavke:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {record.items.map((it, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                              >
                                ✓ {it}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Note */}
                      {record.note && (
                        <div>
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Napomena:
                          </div>
                          <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/80 leading-relaxed">
                            {record.note}
                          </p>
                        </div>
                      )}

                      {/* Warranty details if any */}
                      {record.warranty?.hasWarranty && (
                        <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 text-purple-900 font-bold">
                            <Gift className="w-4 h-4 text-purple-600" />
                            <span>Garancija ({record.warranty.durationMonths} mj)</span>
                          </div>
                          <span className="text-purple-700 font-medium">
                            Ističe: {record.warranty.endDate}
                          </span>
                        </div>
                      )}

                      {/* Next Service details if any */}
                      {record.nextService && (
                        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 text-blue-900 font-bold">
                            <Clock className="w-4 h-4 text-[#1D68F2]" />
                            <span>Naredni servis</span>
                          </div>
                          <span className="text-[#1D68F2] font-semibold">
                            {record.nextService.targetDate
                              ? `Cilj: ${record.nextService.targetDate}`
                              : ''}{' '}
                            {record.nextService.targetKm
                              ? `(${formatKm(record.nextService.targetKm)} km)`
                              : ''}
                          </span>
                        </div>
                      )}

                      {/* Receipt Image if uploaded */}
                      {record.receiptImage && (
                        <div>
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Račun / Dokument:
                          </div>
                          <img
                            src={record.receiptImage}
                            alt="Račun"
                            className="w-full max-h-48 object-cover rounded-xl border border-slate-200"
                          />
                        </div>
                      )}

                      {/* Action buttons: Edit ✎ & Delete 🗑 with modal confirmation */}
                      <div className="pt-2 flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(record);
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200/70 bg-white border border-slate-200 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-slate-500" />
                          <span>Uredi</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteModalState({
                              isOpen: true,
                              recordId: record.id,
                              title: `Obrisati unos "${record.title}"?`,
                            });
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 bg-white border border-red-200/60 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Obriši</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Edit Fuel Modal */}
      <AddFuelModal
        isOpen={isFuelModalOpen}
        existingRecord={editingFuelRecord}
        onClose={() => {
          setIsFuelModalOpen(false);
          setEditingFuelRecord(null);
        }}
        car={car}
        onSave={(fuelRec) => {
          if (onSaveFuelRecord) {
            onSaveFuelRecord(fuelRec);
          }
          setIsFuelModalOpen(false);
          setEditingFuelRecord(null);
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalState.isOpen}
        title={deleteModalState.title || 'Obrisati ovaj unos?'}
        message="Ovaj podatak će biti trajno uklonjen."
        onClose={() => setDeleteModalState({ isOpen: false })}
        onConfirm={() => {
          if (deleteModalState.recordId) {
            onDeleteService(deleteModalState.recordId);
          }
        }}
      />
    </div>
  );
};
