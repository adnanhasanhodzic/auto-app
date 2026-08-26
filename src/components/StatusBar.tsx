import React, { useState, useEffect } from 'react';
import { Wifi, Battery } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const [time, setTime] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex items-center justify-between px-6 pt-3 pb-1 text-slate-800 select-none text-xs font-semibold tracking-tight z-20">
      <span>{time}</span>
      <div className="flex items-center space-x-2">
        {/* Cellular signal bars */}
        <div className="flex items-end space-x-0.5 h-3">
          <div className="w-0.5 h-1 bg-slate-800 rounded-xs" />
          <div className="w-0.5 h-1.5 bg-slate-800 rounded-xs" />
          <div className="w-0.5 h-2.5 bg-slate-800 rounded-xs" />
          <div className="w-0.5 h-3 bg-slate-800 rounded-xs" />
        </div>
        {/* Wifi */}
        <Wifi className="w-3.5 h-3.5 stroke-[2.5]" />
        {/* Battery */}
        <div className="flex items-center">
          <Battery className="w-4 h-4 stroke-[2.2]" />
        </div>
      </div>
    </div>
  );
};
