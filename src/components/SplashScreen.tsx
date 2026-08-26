import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CarIcon } from './CarIcon';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            if (onFinish) onFinish();
          }, 350);
          return 100;
        }
        return prev + 5;
      });
    }, 80);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div
      id="splash-screen"
      className="relative flex flex-col items-center justify-between w-full h-full min-h-[640px] bg-white px-6 py-12 select-none"
    >
      {/* Top spacing */}
      <div className="w-full h-6" />

      {/* Main Center Brand Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center text-center space-y-5"
      >
        {/* Car Icon */}
        <div className="flex items-center justify-center w-28 h-24 mb-1">
          <CarIcon variant="front" className="w-24 h-24 text-[#1D68F2]" />
        </div>

        {/* Brand Name: MOJ AUTO */}
        <h1 className="text-3xl font-extrabold tracking-tight">
          <span className="text-[#0F172A]">MOJ </span>
          <span className="text-[#1D68F2]">AUTO</span>
        </h1>

        {/* Slogan */}
        <p className="text-[15px] font-normal leading-relaxed text-[#475569] max-w-[220px]">
          Vaš automobil.<br />Njegova istorija.
        </p>

        {/* Discrete loading progress bar */}
        <div className="pt-8">
          <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#1D68F2] rounded-full transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* Bottom Version Tag */}
      <div className="text-xs font-normal text-slate-400">
        Verzija 1.0.0
      </div>
    </div>
  );
};
