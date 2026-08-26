import React from 'react';
import { History, Wrench, Wallet, ArrowLeft } from 'lucide-react';
import { NavTab } from '../types';

interface PlaceholderTabProps {
  tab: NavTab;
  onBackToHome: () => void;
}

export const PlaceholderTab: React.FC<PlaceholderTabProps> = ({
  tab,
  onBackToHome,
}) => {
  const getTabDetails = () => {
    switch (tab) {
      case 'istorija':
        return {
          title: 'Istorija servisa',
          desc: 'Kompletna servisna knjižica i hronološki pregled svih urađenih servisa i popravki.',
          icon: <History className="w-12 h-12 text-[#1D68F2]" />,
        };
      case 'odrzavanje':
        return {
          title: 'Plan održavanja',
          desc: 'Detaljan raspored redovnog i vanrednog održavanja sa automatskim podsjetnicima.',
          icon: <Wrench className="w-12 h-12 text-[#1D68F2]" />,
        };
      case 'troskovi':
        return {
          title: 'Evidencija troškova',
          desc: 'Statistika i analiza troškova goriva, servisa, registracije i ostalih izdataka.',
          icon: <Wallet className="w-12 h-12 text-[#1D68F2]" />,
        };
      default:
        return {
          title: 'Ekran u pripremi',
          desc: 'Ovaj ekran će biti dostupan u sljedećoj fazi razvoja.',
          icon: <Wrench className="w-12 h-12 text-[#1D68F2]" />,
        };
    }
  };

  const details = getTabDetails();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center space-y-4 bg-[#F8FAFC]">
      <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-xs">
        {details.icon}
      </div>

      <div className="space-y-2 max-w-xs">
        <h2 className="text-lg font-bold text-slate-900">{details.title}</h2>
        <p className="text-xs text-slate-500 leading-relaxed">{details.desc}</p>
      </div>

      <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
        Faza 2 u pripremi
      </div>

      <button
        onClick={onBackToHome}
        className="mt-4 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs flex items-center space-x-1.5 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Nazad na Početnu</span>
      </button>
    </div>
  );
};
