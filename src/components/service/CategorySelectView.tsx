import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, X, Fuel, ChevronRight } from 'lucide-react';
import { ServiceCategory } from '../../types';
import { CATEGORY_CARDS, CategoryCardDef } from '../../serviceCatalog';
import { CategoryIcon } from '../CategoryIcons';

interface CategorySelectViewProps {
  onSelectCategory: (cat: ServiceCategory) => void;
  onSelectFuel?: () => void;
  onBack: () => void;
}

export const CategorySelectView: React.FC<CategorySelectViewProps> = ({
  onSelectCategory,
  onSelectFuel,
  onBack,
}) => {
  return (
    <div
      id="category-select-screen"
      className="flex-1 flex flex-col justify-between w-full h-full bg-white px-5 py-4 select-none overflow-y-auto no-scrollbar"
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100/80">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            Dodaj rad / servis
          </h1>
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtitle */}
        <div className="pt-3 pb-2.5">
          <h2 className="text-[17px] font-extrabold text-slate-900 tracking-tight">
            Odaberite kategoriju
          </h2>
        </div>

        {/* 2x4 Category Grid */}
        <div className="grid grid-cols-2 gap-3 pt-0.5">
          {CATEGORY_CARDS.map((cat: CategoryCardDef) => (
            <motion.button
              key={cat.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectCategory(cat.id)}
              className="relative flex flex-col items-center text-center justify-center p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-[#1D68F2]/40 hover:bg-slate-50/50 hover:shadow-xs transition-all duration-150 cursor-pointer"
            >
              {/* Icon Container */}
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-2">
                <CategoryIcon type={cat.iconName} color={cat.iconColor} className="w-7 h-7" />
              </div>

              {/* Name */}
              <span className="text-[13px] font-bold text-slate-900 leading-tight">
                {cat.name}
              </span>

              {/* Subtitle description */}
              <span className="text-[10.5px] font-medium text-slate-500 mt-0.5 leading-snug">
                {cat.subtitle}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Distinct separated Gorivo option at the bottom */}
        <div className="mt-3.5 pt-3 border-t border-slate-100">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (onSelectFuel) onSelectFuel();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-amber-200/90 bg-amber-50/60 hover:bg-amber-50 hover:border-amber-300 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Fuel className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900 leading-tight flex items-center space-x-1">
                  <span>Gorivo</span>
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Evidencija točenja goriva
                </div>
              </div>
            </div>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center text-amber-700 bg-white/80 border border-amber-200/80 group-hover:bg-white group-hover:text-amber-800 transition-colors">
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
