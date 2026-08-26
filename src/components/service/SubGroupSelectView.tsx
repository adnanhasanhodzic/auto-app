import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, X, Search, ChevronDown, ChevronRight, Check, Plus } from 'lucide-react';
import { ServiceCategory } from '../../types';
import { SERVICE_CATALOG, CATEGORY_CARDS, WorkGroup } from '../../serviceCatalog';
import { CategoryIcon } from '../CategoryIcons';

interface SubGroupSelectViewProps {
  category: ServiceCategory;
  selectedItems: string[];
  onToggleItem: (item: string) => void;
  onSelectSingleItemAndProceed: (item: string, groupName: string) => void;
  onProceedWithItems: (primaryTitle: string, groupName: string) => void;
  onBack: () => void;
}

export const SubGroupSelectView: React.FC<SubGroupSelectViewProps> = ({
  category,
  selectedItems,
  onToggleItem,
  onSelectSingleItemAndProceed,
  onProceedWithItems,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [customItemInput, setCustomItemInput] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  const categoryDef = CATEGORY_CARDS.find((c) => c.id === category) || CATEGORY_CARDS[0];
  const groups: WorkGroup[] = SERVICE_CATALOG[category] || [];

  // Toggle group expansion
  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // Filter items by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return groups;
    }
    const q = searchQuery.toLowerCase().trim();
    return groups
      .map((g) => ({
        name: g.name,
        items: g.items.filter(
          (item) => item.toLowerCase().includes(q) || g.name.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, searchQuery]);

  const handleCustomAdd = () => {
    if (customItemInput.trim()) {
      onToggleItem(customItemInput.trim());
      setCustomItemInput('');
      setIsAddingCustom(false);
    }
  };

  const handleProceed = () => {
    if (selectedItems.length > 0) {
      const primary = selectedItems[0];
      // Find group name
      let foundGroup = '';
      for (const g of groups) {
        if (g.items.includes(primary)) {
          foundGroup = g.name;
          break;
        }
      }
      onProceedWithItems(primary, foundGroup || categoryDef.name);
    }
  };

  return (
    <div
      id="subgroup-select-screen"
      className="flex-1 flex flex-col justify-between w-full h-full bg-[#F8FAFC] select-none"
    >
      {/* Top Header */}
      <div className="bg-white px-5 pt-4 pb-3 border-b border-slate-100/90 shadow-2xs">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div className="text-center">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Odaberite vrstu rada
            </h1>
            <div className="flex items-center justify-center space-x-1.5 mt-0.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Kategorija:
              </span>
              <span className="text-[11px] font-bold text-[#1D68F2]">
                {categoryDef.name}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mt-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Pretraži radove u kategoriji ${categoryDef.name}...`}
            className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D68F2]/30 focus:border-[#1D68F2] transition-all"
          />
        </div>
      </div>

      {/* Grouped Work Items List */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {/* Selected count banner if any items checked */}
        {selectedItems.length > 0 && (
          <div className="bg-blue-50/80 border border-blue-200/70 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full bg-[#1D68F2] text-white flex items-center justify-center text-[10px] font-extrabold">
                {selectedItems.length}
              </div>
              <span className="text-xs font-semibold text-blue-900">
                {selectedItems.length === 1
                  ? 'Odabrana 1 stavka'
                  : `Odabrano ${selectedItems.length} stavki`}
              </span>
            </div>
            <button
              onClick={handleProceed}
              className="px-3 py-1 bg-[#1D68F2] hover:bg-blue-600 active:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Nastavi →
            </button>
          </div>
        )}

        {/* Render Groups */}
        {filteredGroups.map((group) => {
          const isExpanded = searchQuery.trim().length > 0 || !!expandedGroups[group.name];
          const groupSelectedCount = group.items.filter((it) =>
            selectedItems.includes(it)
          ).length;

          return (
            <div
              key={group.name}
              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs"
            >
              {/* Group Header Bar */}
              <button
                type="button"
                onClick={() => toggleGroup(group.name)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-2 h-2 rounded-full bg-[#1D68F2]" />
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    {group.name}
                  </span>
                  {groupSelectedCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-[#1D68F2] text-[10px] font-bold">
                      {groupSelectedCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 text-slate-400">
                  <span className="text-[11px] font-medium text-slate-400">
                    {group.items.length}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
              </button>

              {/* Items in Group */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 divide-y divide-slate-100 border-t border-slate-100">
                  {group.items.map((item) => {
                    const isChecked = selectedItems.includes(item);

                    return (
                      <div
                        key={item}
                        className={`flex items-center justify-between py-2.5 px-2 rounded-xl transition-all ${
                          isChecked ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Checkbox + Item Name */}
                        <button
                          type="button"
                          onClick={() => onToggleItem(item)}
                          className="flex-1 flex items-center space-x-3 text-left cursor-pointer pr-2"
                        >
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                              isChecked
                                ? 'bg-[#1D68F2] border-[#1D68F2] text-white shadow-2xs'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span
                            className={`text-[13px] ${
                              isChecked
                                ? 'font-bold text-slate-900'
                                : 'font-medium text-slate-700'
                            }`}
                          >
                            {item}
                          </span>
                        </button>

                        {/* Quick single select and go arrow */}
                        <button
                          type="button"
                          title="Odaberi i nastavi odmah"
                          onClick={() => onSelectSingleItemAndProceed(item, group.name)}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-[#1D68F2] hover:bg-blue-50 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Custom Item Adder */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs">
          {isAddingCustom ? (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800">
                Dodaj prilagođeni rad:
              </span>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={customItemInput}
                  onChange={(e) => setCustomItemInput(e.target.value)}
                  placeholder="Unesite naziv rada..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D68F2]"
                  autoFocus
                />
                <button
                  onClick={handleCustomAdd}
                  className="px-3 py-2 bg-[#1D68F2] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Dodaj
                </button>
                <button
                  onClick={() => setIsAddingCustom(false)}
                  className="px-2.5 py-2 bg-slate-100 text-slate-600 text-xs font-medium rounded-xl cursor-pointer"
                >
                  Otkaži
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingCustom(true)}
              className="w-full flex items-center justify-center space-x-1.5 py-1 text-xs font-bold text-[#1D68F2] hover:text-blue-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dodaj rad koji nije na listi</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="bg-white px-5 py-3 border-t border-slate-100 shadow-lg">
        <motion.button
          whileHover={{ scale: selectedItems.length > 0 ? 1.01 : 1 }}
          whileTap={{ scale: selectedItems.length > 0 ? 0.98 : 1 }}
          disabled={selectedItems.length === 0}
          onClick={handleProceed}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 ${
            selectedItems.length > 0
              ? 'bg-[#1D68F2] hover:bg-blue-600 active:bg-blue-700 text-white'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <span>
            {selectedItems.length > 0
              ? `NASTAVI NA UNOS (${selectedItems.length})`
              : 'ODABERITE NAJMANJE JEDAN RAD'}
          </span>
        </motion.button>
      </div>
    </div>
  );
};
