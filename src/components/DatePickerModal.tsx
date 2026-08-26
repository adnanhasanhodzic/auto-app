import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Check } from 'lucide-react';
import { parseCustomDate, formatDateCustom } from '../utils/dateUtils';

const MONTH_NAMES = [
  'Januar',
  'Februar',
  'Mart',
  'April',
  'Maj',
  'Juni',
  'Juli',
  'Avgust',
  'Septembar',
  'Oktobar',
  'Novembar',
  'Decembar',
];

const DAY_NAMES = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];

interface DatePickerModalProps {
  isOpen: boolean;
  value?: string;
  title?: string;
  onClose: () => void;
  onSelect: (dateStr: string) => void;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  value,
  title = 'Odaberite datum',
  onClose,
  onSelect,
}) => {
  // Parse initial selected date or fallback to today
  const selectedDate = useMemo(() => {
    if (value) {
      const parsed = parseCustomDate(value);
      if (parsed) return parsed;
    }
    return new Date();
  }, [value]);

  const [viewYear, setViewYear] = useState<number>(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(selectedDate.getMonth());

  // Keep view in sync when opening or when value changes
  useEffect(() => {
    if (isOpen) {
      if (value) {
        const parsed = parseCustomDate(value);
        if (parsed) {
          setViewYear(parsed.getFullYear());
          setViewMonth(parsed.getMonth());
          return;
        }
      }
      const now = new Date();
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    }
  }, [isOpen, value]);

  // Year list for rapid dropdown selection
  const yearsList = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const list: number[] = [];
    for (let y = currentYear - 20; y <= currentYear + 15; y++) {
      list.push(y);
    }
    return list;
  }, []);

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number, monthOffset: number = 0) => {
    let targetMonth = viewMonth + monthOffset;
    let targetYear = viewYear;

    if (targetMonth < 0) {
      targetMonth = 11;
      targetYear -= 1;
    } else if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }

    const d = new Date(targetYear, targetMonth, day);
    const formatted = formatDateCustom(d);
    onSelect(formatted);
    onClose();
  };

  const handleSelectToday = () => {
    const today = new Date();
    const formatted = formatDateCustom(today);
    onSelect(formatted);
    onClose();
  };

  // Calendar matrix calculation
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();
  
  // Day of week for first day of current month (0=Sun, 1=Mon, ..., 6=Sat)
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  // Bosnian week starts on Monday: Monday=0, Tuesday=1 ... Sunday=6
  const startingDayOffset = (firstDayIndex + 6) % 7;

  const today = new Date();
  const isCurrentMonthToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth;
  const isCurrentMonthSelected =
    selectedDate.getFullYear() === viewYear && selectedDate.getMonth() === viewMonth;

  // Grid cells
  const calendarCells = [];

  // 1. Previous month trailing days
  for (let i = startingDayOffset - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    calendarCells.push({
      day: dayNum,
      isCurrentMonth: false,
      monthOffset: -1,
      isToday: false,
      isSelected: false,
    });
  }

  // 2. Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const isToday = isCurrentMonthToday && today.getDate() === d;
    const isSelected = isCurrentMonthSelected && selectedDate.getDate() === d;
    calendarCells.push({
      day: d,
      isCurrentMonth: true,
      monthOffset: 0,
      isToday,
      isSelected,
    });
  }

  // 3. Next month leading days to complete full rows (multiple of 7)
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let n = 1; n <= remainingCells; n++) {
    calendarCells.push({
      day: n,
      isCurrentMonth: false,
      monthOffset: 1,
      isToday: false,
      isSelected: false,
    });
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="w-full max-w-[340px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col"
        >
          {/* Header Bar */}
          <div className="px-4 pt-3.5 pb-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-[#1D68F2]/10 text-[#1D68F2] flex items-center justify-center">
                <CalendarIcon className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  {title}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {value ? value : 'Nije odabran datum'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Month & Year Controls */}
          <div className="p-3.5 space-y-3">
            <div className="flex items-center justify-between bg-slate-100/80 p-1.5 rounded-2xl">
              {/* Prev Month Button */}
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-200/80 text-slate-700 shadow-2xs flex items-center justify-center transition-colors cursor-pointer"
                title="Prethodni mjesec"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Month and Year Selectors */}
              <div className="flex items-center space-x-1.5">
                {/* Month Dropdown */}
                <div className="relative">
                  <select
                    value={viewMonth}
                    onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                    className="appearance-none pl-2.5 pr-6 py-1 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D68F2]/30 cursor-pointer shadow-2xs"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={name} value={idx} className="font-semibold text-slate-900">
                        {name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">
                    ▼
                  </div>
                </div>

                {/* Year Dropdown */}
                <div className="relative">
                  <select
                    value={viewYear}
                    onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                    className="appearance-none pl-2.5 pr-6 py-1 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D68F2]/30 cursor-pointer shadow-2xs"
                  >
                    {yearsList.map((y) => (
                      <option key={y} value={y} className="font-semibold text-slate-900">
                        {y}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">
                    ▼
                  </div>
                </div>
              </div>

              {/* Next Month Button */}
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-200/80 text-slate-700 shadow-2xs flex items-center justify-center transition-colors cursor-pointer"
                title="Sljedeći mjesec"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {DAY_NAMES.map((d, i) => (
                <div
                  key={d}
                  className={`text-[10.5px] font-bold py-1 ${
                    i >= 5 ? 'text-amber-600 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days Matrix */}
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((cell, idx) => {
                const { day, isCurrentMonth, monthOffset, isToday, isSelected } = cell;

                let cellClasses =
                  'relative h-9 rounded-xl flex items-center justify-center text-xs font-semibold transition-all cursor-pointer select-none ';

                if (isSelected) {
                  cellClasses +=
                    'bg-[#1D68F2] text-white font-extrabold shadow-sm scale-102 ring-2 ring-[#1D68F2]/30 z-10';
                } else if (isToday) {
                  cellClasses +=
                    'bg-blue-50 text-[#1D68F2] font-bold border border-[#1D68F2]/30 hover:bg-blue-100';
                } else if (!isCurrentMonth) {
                  cellClasses +=
                    'text-slate-300 hover:text-slate-500 hover:bg-slate-100/60 font-normal';
                } else {
                  cellClasses +=
                    'text-slate-800 hover:bg-slate-100 font-semibold active:scale-95';
                }

                return (
                  <button
                    key={`${monthOffset}-${day}-${idx}`}
                    type="button"
                    onClick={() => handleSelectDay(day, monthOffset)}
                    className={cellClasses}
                  >
                    <span>{day}</span>
                    {isToday && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#1D68F2]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom quick actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleSelectToday}
                className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-[11px] font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Danas
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Zatvori
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
