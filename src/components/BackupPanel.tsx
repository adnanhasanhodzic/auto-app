import React, { useRef, useState } from 'react';
import { Download, Upload, Check, Share2 } from 'lucide-react';
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

function buildBackupString(): string {
  const dump: Record<string, string> = {};
  BACKUP_KEYS.forEach((k) => {
    const v = localStorage.getItem(k);
    if (v !== null) dump[k] = v;
  });
  return JSON.stringify(dump);
}

function todayStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}

export const BackupPanel: React.FC = () => {
  const [mode, setMode] = useState<'closed' | 'export' | 'import'>('closed');
  const [exportStatus, setExportStatus] = useState<'idle' | 'shared' | 'copied' | 'error'>('idle');
  const [importStatus, setImportStatus] = useState<'idle' | 'done' | 'error'>('idle');
  const [fileName, setFileName] = useState<string>('');
  const importTextRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExportStatus('idle');
    const text = buildBackupString();
    const name = `moj-auto-backup-${todayStamp()}.txt`;
    const blob = new Blob([text], { type: 'text/plain' });
    const file = new File([blob], name, { type: 'text/plain' });

    // Preferred: native share sheet (Save to Files, email, WhatsApp, Drive, itd.)
    const nav = navigator as Navigator & { canShare?: (data: any) => boolean; share?: (data: any) => Promise<void> };
    if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
      try {
        await nav.share({ files: [file], title: 'MOJ AUTO - backup podataka' });
        setExportStatus('shared');
        return;
      } catch {
        // korisnik je otkazao ili share nije uspio - probaj fallback ispod
      }
    }

    // Fallback: kopiraj u clipboard bez prikazivanja u textarei (izbjegava zamrzavanje UI-a)
    try {
      await navigator.clipboard.writeText(text);
      setExportStatus('copied');
    } catch {
      setExportStatus('error');
    }
  };

  const handleFileImport = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '').trim());
        BACKUP_KEYS.forEach((k) => {
          if (parsed[k] !== undefined) localStorage.setItem(k, parsed[k]);
        });
        setImportStatus('done');
        setTimeout(() => window.location.reload(), 800);
      } catch {
        setImportStatus('error');
      }
    };
    reader.onerror = () => setImportStatus('error');
    reader.readAsText(file);
  };

  const handlePastedImport = () => {
    const text = importTextRef.current?.value || '';
    try {
      const parsed = JSON.parse(text.trim());
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
            onClick={() => {
              setMode('export');
              setExportStatus('idle');
            }}
            className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-xs font-bold text-slate-700 active:scale-[0.98] transition-transform"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Izvezi podatke</span>
          </button>
          <button
            onClick={() => {
              setMode('import');
              setImportStatus('idle');
              setFileName('');
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
            Sačuvaj fajl (npr. u Files, Google Drive ili sebi na email) prije nego što instaliraš novu verziju aplikacije.
          </p>
          <button
            onClick={handleExport}
            className="w-full py-2.5 rounded-lg bg-[#1D68F2] text-white text-xs font-bold flex items-center justify-center space-x-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Sačuvaj / podijeli fajl</span>
          </button>
          {exportStatus === 'shared' && (
            <p className="text-[11px] text-green-600 font-semibold">Fajl je poslan na dijeljenje.</p>
          )}
          {exportStatus === 'copied' && (
            <p className="text-[11px] text-green-600 font-semibold flex items-center space-x-1">
              <Check className="w-3.5 h-3.5" />
              <span>Deljenje fajla nije podržano, podaci su kopirani u clipboard umjesto toga.</span>
            </p>
          )}
          {exportStatus === 'error' && (
            <p className="text-[11px] text-red-500 font-semibold">Izvoz nije uspio. Pokušaj ponovo.</p>
          )}
          <button onClick={() => setMode('closed')} className="w-full py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
            Zatvori
          </button>
        </div>
      )}

      {mode === 'import' && (
        <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Uvoz podataka</div>
          <p className="text-[11px] text-slate-500">Izaberi fajl koji si prethodno sačuvao pri izvozu.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.json,text/plain,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileImport(f);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 rounded-lg bg-[#1D68F2] text-white text-xs font-bold flex items-center justify-center space-x-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{fileName ? fileName : 'Izaberi fajl'}</span>
          </button>

          <details className="text-[11px] text-slate-500">
            <summary className="cursor-pointer select-none">Ili zalijepi ručno (samo za manje količine podataka)</summary>
            <textarea
              ref={importTextRef}
              placeholder="Zalijepi ovdje..."
              className="w-full h-20 mt-2 text-[10px] font-mono p-2 rounded-lg border border-slate-200 bg-slate-50"
            />
            <button onClick={handlePastedImport} className="w-full mt-2 py-2 rounded-lg bg-slate-700 text-white text-xs font-bold">
              Vrati iz zalijepljenog teksta
            </button>
          </details>

          {importStatus === 'error' && (
            <p className="text-[11px] text-red-500 font-semibold">Fajl/tekst nije prepoznat. Provjeri da je cijeli sadržaj tu.</p>
          )}
          {importStatus === 'done' && (
            <p className="text-[11px] text-green-600 font-semibold">Podaci vraćeni. Aplikacija se ponovo učitava...</p>
          )}

          <button onClick={() => setMode('closed')} className="w-full py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
            Zatvori
          </button>
        </div>
      )}
    </div>
  );
};
