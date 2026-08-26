import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Lock, Plus } from 'lucide-react';
import { CarIcon } from './CarIcon';

interface WelcomeScreenProps {
  onContinue: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  const benefits = [
    'servisne istorije',
    'popravki',
    'troškova',
    'narednih servisa',
    'registracije i osiguranja',
  ];

  return (
    <div
      id="welcome-screen"
      className="relative flex flex-col items-center justify-between w-full h-full min-h-[640px] bg-white px-6 py-10 select-none"
    >
      {/* Top spacing */}
      <div className="w-full h-2" />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm flex flex-col items-center text-center space-y-6"
      >
        {/* Circle Car Badge */}
        <div className="w-28 h-28 rounded-full bg-slate-100/90 flex items-center justify-center shadow-inner">
          <CarIcon variant="side" className="w-20 h-14 text-[#1D68F2]" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <p className="text-base font-bold text-slate-900">Dobrodošli u</p>
          <h1 className="text-3xl font-extrabold text-[#1D68F2] tracking-tight">
            MOJ AUTO
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-[14px] text-slate-600 max-w-[260px] font-normal leading-relaxed">
          Vodite kompletnu evidenciju svog automobila:
        </p>

        {/* Checklist */}
        <div className="w-full max-w-[260px] flex flex-col space-y-3 text-left pt-1">
          {benefits.map((item, index) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.08, duration: 0.3 }}
              className="flex items-center space-x-3 text-slate-800 text-[14px] font-medium"
            >
              <CheckCircle2 className="w-5 h-5 text-[#1D68F2] fill-[#1D68F2]/15 flex-shrink-0" />
              <span>{item}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Bottom CTA and privacy note */}
      <div className="w-full max-w-sm space-y-6 pt-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onContinue}
          className="w-full py-3.5 px-4 bg-[#1D68F2] hover:bg-blue-600 active:bg-blue-700 text-white font-bold text-[15px] rounded-xl shadow-md flex items-center justify-center space-x-2 transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>DODAJ MOJ AUTO</span>
        </motion.button>

        <div className="flex items-center justify-center space-x-2 text-slate-500 text-[12px] leading-tight">
          <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>Podaci se čuvaju samo na vašem uređaju.</span>
        </div>
      </div>
    </div>
  );
};
