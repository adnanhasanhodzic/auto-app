import React from 'react';
import { Home, History, Wrench, PieChart } from 'lucide-react';
import { NavTab } from '../types';

interface BottomNavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs: { id: NavTab; label: string; icon: (isActive: boolean) => React.ReactNode }[] = [
    {
      id: 'pocetna',
      label: 'Početna',
      icon: (isActive) => (
        <Home className={`w-5 h-5 ${isActive ? 'fill-[#1D68F2] text-[#1D68F2]' : 'text-slate-400'}`} />
      ),
    },
    {
      id: 'istorija',
      label: 'Istorija',
      icon: (isActive) => (
        <History className={`w-5 h-5 ${isActive ? 'text-[#1D68F2] stroke-[2.4]' : 'text-slate-400 stroke-[1.9]'}`} />
      ),
    },
    {
      id: 'odrzavanje',
      label: 'Održavanje',
      icon: (isActive) => (
        <Wrench className={`w-5 h-5 ${isActive ? 'text-[#1D68F2] stroke-[2.4]' : 'text-slate-400 stroke-[1.9]'}`} />
      ),
    },
    {
      id: 'troskovi',
      label: 'Troškovi',
      icon: (isActive) => (
        <PieChart className={`w-5 h-5 ${isActive ? 'text-[#1D68F2] stroke-[2.4]' : 'text-slate-400 stroke-[1.9]'}`} />
      ),
    },
  ];

  return (
    <nav
      id="bottom-navigation"
      className="sticky bottom-0 z-30 w-full bg-white/95 backdrop-blur-md border-t border-slate-100 px-3 py-2.5 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.03)] select-none"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`nav-tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-150 cursor-pointer ${
              isActive
                ? 'text-[#1D68F2] font-bold'
                : 'text-slate-500 hover:text-slate-700 font-medium'
            }`}
          >
            <div className="relative">
              {tab.icon(isActive)}
            </div>
            <span className={`text-[11px] mt-1 tracking-tight ${isActive ? 'font-bold text-[#1D68F2]' : 'font-medium text-slate-500'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
