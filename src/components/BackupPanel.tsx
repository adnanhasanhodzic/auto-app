import React, { useState } from 'react';
import { Download, Upload, Check, Copy } from 'lucide-react';
import {
  STORAGE_KEY_CARS,
  STORAGE_KEY_ACTIVE_CAR_ID,
  STORAGE_KEY_CAR,
  STORAGE_KEY_RECORDS,
  STORAGE_KEY_OBLIGATIONS,
} from '../data';

const BACKUP_KEYS = [
  STORAGE_KEY_CARS,
  STORAGE_KEY_ACTIVE_CAR_ID,
  STORAGE_KEY_CAR,
  STORAGE_KEY_RECORDS,
  STORAGE_KEY_OBLIGATIONS,
];

export const BackupPanel: React.FC = () => {
  const [mode, setMode] = useState<'closed' | 'export' | 'import'>('closed');
  const [exportText, setExportText] = useState('');
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'done' | 'error'>('idle');

  const openExport = () => {
    const dump: Record<string, string> = {};
    BACKUP_KEYS.forEach((k) => {
      const v = localStorage.getItem(k);
      if (v !== null) dump[k] = v;
    });
    setExportText(JSON.stringify(dump));
    setMode('export');
    setCopied(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = exportText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
    }
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText.trim());
      BACKUP_KEYS.forEach((k) => {
        if (parsed[k] !== undefined) localStorage.setItem(k, parsed[k]);
      });
      setImportStatus('done');
      setTimeout(() => window.location.reload(), 800);
    } catch {
      setImportStatus('error');
    }
  };

  return (
    <div className="mt-2">
      {mode === 'closed' && (
        <div className="flex space-x-2">
          <button
            onClick={openExport}
            className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-xs font-bold text-slate-700 active:scale-[0.98] transition-transform"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Izvezi podatke</span>
          </button>
          <button
            onClick={() => {
              setMode('import');
              setImportStatus('idle');
              setImportText('');
            }}
            className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-xs font-bold text-slate-700 active:scale-[0.98] transition-transform"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Uvezi podatke</span>
          </button>
        </div>
      )}

      {mode === 'export' && (
        <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Izvoz podataka</div>
          <p className="text-[11px] text-slate-500">
            Kopiraj tekst ispod i sačuvaj ga (npr. u bilješke ili email) prije nego što instaliraš novu verziju aplikacije.
          </p>
          <textarea
            readOnly
            value={exportText}
            onFocus={(e) => e.target.select()}
            className="w-full h-24 text-[10px] font-mono p-2 rounded-lg border border-slate-200 bg-slate-50"
          />
          <div className="flex space-x-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-2 rounded-lg bg-[#1D68F2] text-white text-xs font-bold flex items-center justify-center space-x-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Kopirano' : 'Kopiraj'}</span>
            </button>
            <button onClick={() => setMode('closed')} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
              Zatvori
            </button>
          </div>
        </div>
      )}

      {mode === 'import' && (
        <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Uvoz podataka</div>
          <p className="text-[11px] text-slate-500">Zalijepi tekst koji si prethodno sačuvao pri izvozu.</p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Zalijepi ovdje..."
            className="w-full h-24 text-[10px] font-mono p-2 rounded-lg border border-slate-200 bg-slate-50"
          />
          {importStatus === 'error' && (
            <p className="text-[11px] text-red-500 font-semibold">Tekst nije prepoznat. Provjeri da si zalijepio cijeli sadržaj.</p>
          )}
          {importStatus === 'done' && (
            <p className="text-[11px] text-green-600 font-semibold">Podaci vraćeni. Aplikacija se ponovo učitava...</p>
          )}
          <div className="flex space-x-2">
            <button onClick={handleImport} className="flex-1 py-2 rounded-lg bg-[#1D68F2] text-white text-xs font-bold">
              Vrati podatke
            </button>
            <button onClick={() => setMode('closed')} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
              Zatvori
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
