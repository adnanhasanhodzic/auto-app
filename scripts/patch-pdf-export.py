from pathlib import Path
import re

path = Path('src/components/ExpensesScreen.tsx')
text = path.read_text(encoding='utf-8')

# Add native/PDF imports once.
if "from '@capacitor/core'" not in text:
    text = text.replace(
        "import React, { useState, useMemo, useEffect } from 'react';",
        "import React, { useState, useMemo, useEffect } from 'react';\nimport { Capacitor } from '@capacitor/core';\nimport { Filesystem, Directory } from '@capacitor/filesystem';\nimport { FileOpener } from '@capacitor-community/file-opener';\nimport html2pdf from 'html2pdf.js';\nimport MA_LOGO from '../MA-LOGO.png';",
        1,
    )

start_marker = "  // Generate and print PDF report\n  const handlePrintPdf = () => {"
start = text.find(start_marker)
if start == -1:
    raise RuntimeError('Nije pronađena postojeća handlePrintPdf funkcija.')

end = text.find("\n\n  return (", start)
if end == -1:
    raise RuntimeError('Nije pronađen kraj handlePrintPdf funkcije.')

new_function = r'''  // Generate a real PDF file and open it with the Android system PDF app.
  const handlePrintPdf = async () => {
    const selectedOption = pdfCategoryOptions.find((opt) => opt.id === pdfScope);
    const reportTitle = selectedOption ? selectedOption.label : 'Svi troškovi';

    const itemsToExport = sortedServices.filter((s) => {
      const matchYear = getRecordYear(s) === pdfYear;
      const matchScope = pdfScope === 'all' || normalizeCategory(s.category) === pdfScope;
      return matchYear && matchScope;
    });

    const exportTotal = itemsToExport.reduce((acc, curr) => acc + (curr.cost || 0), 0);
    const currentDate = new Date().toLocaleDateString('de-DE');

    const rowsHtml = itemsToExport
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #E2E8F0; break-inside: avoid; page-break-inside: avoid;">
          <td style="padding: 10px 8px; font-size: 12px; font-weight: 600; color: #0F172A;">
            ${item.title}
            ${item.items && item.items.length > 0 && normalizeCategory(item.category) !== 'gorivo' ? `<div style="font-size: 10px; color: #64748B; font-weight: normal; margin-top: 2px;">${item.items.join(', ')}</div>` : ''}
          </td>
          <td style="padding: 10px 8px; font-size: 12px; color: #475569;">${item.categoryName || (normalizeCategory(item.category) === 'gorivo' ? 'Gorivo' : 'Servis')}</td>
          <td style="padding: 10px 8px; font-size: 12px; color: #334155;">${item.date}</td>
          <td style="padding: 10px 8px; font-size: 12px; color: #334155;">${item.mileage ? item.mileage.toLocaleString('de-DE') + ' km' : '-'}</td>
          <td style="padding: 10px 8px; font-size: 12px; font-weight: bold; text-align: right; color: #0F172A; white-space: nowrap;">
            ${item.cost.toLocaleString('de-DE', { minimumFractionDigits: 2 })} KM
          </td>
        </tr>`
      )
      .join('');

    const htmlContent = `
      <div id="moj-auto-pdf" style="width: 794px; background: #FFFFFF; color: #0F172A; padding: 28px; font-family: Arial, Helvetica, sans-serif;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #1D68F2; padding-bottom:14px; margin-bottom:18px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <img src="${MA_LOGO}" alt="MOJ AUTO" style="width:38px; height:38px; object-fit:contain; border-radius:10px;" />
            <div>
              <div style="font-size:22px; font-weight:900; line-height:1.1; letter-spacing:-0.5px;">
                <span style="color:#0F172A;">MOJ </span><span style="color:#1D68F2;">AUTO</span>
              </div>
              <div style="font-size:12px; color:#64748B; font-weight:500;">Izvještaj troškova vozila</div>
            </div>
          </div>
          <div style="text-align:right; font-size:11px; color:#64748B; line-height:1.4;">
            <div><strong>Vrsta izvještaja:</strong> ${reportTitle}</div>
            <div><strong>Izvještaj kreiran:</strong> ${currentDate}</div>
          </div>
        </div>

        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px 16px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:16px; font-weight:bold; color:#0F172A;">${car.make} ${car.model}</div>
            <div style="font-size:12px; color:#64748B; margin-top:3px;">
              ${[car.engine, car.powerKw ? `${car.powerKw} kW` : null, car.year, car.fuel].filter(Boolean).join(' • ')}
              ${car.mileage ? `| Trenutno: ${car.mileage.toLocaleString('de-DE')} km` : ''}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10px; font-weight:bold; color:#64748B; text-transform:uppercase; letter-spacing:0.5px;">Ukupan iznos izvještaja</div>
            <div style="font-size:20px; font-weight:900; color:#1D68F2;">${exportTotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })} KM</div>
          </div>
        </div>

        <table style="width:100%; border-collapse:collapse; margin-top:8px;">
          <thead>
            <tr>
              <th style="width:38%; background:#F1F5F9; text-align:left; padding:9px 8px; font-size:11px; color:#475569; text-transform:uppercase; border-bottom:1px solid #CBD5E1;">Naziv rada / troška</th>
              <th style="width:18%; background:#F1F5F9; text-align:left; padding:9px 8px; font-size:11px; color:#475569; text-transform:uppercase; border-bottom:1px solid #CBD5E1;">Kategorija</th>
              <th style="width:14%; background:#F1F5F9; text-align:left; padding:9px 8px; font-size:11px; color:#475569; text-transform:uppercase; border-bottom:1px solid #CBD5E1;">Datum</th>
              <th style="width:15%; background:#F1F5F9; text-align:left; padding:9px 8px; font-size:11px; color:#475569; text-transform:uppercase; border-bottom:1px solid #CBD5E1;">Kilometraža</th>
              <th style="width:15%; background:#F1F5F9; text-align:right; padding:9px 8px; font-size:11px; color:#475569; text-transform:uppercase; border-bottom:1px solid #CBD5E1;">Iznos</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="5" style="text-align:center; padding:24px; color:#94A3B8;">Nema evidentiranih stavki za odabrani kriterij.</td></tr>'}
          </tbody>
        </table>

        <div style="margin-top:28px; padding-top:12px; border-top:1px solid #E2E8F0; font-size:11px; color:#94A3B8; display:flex; justify-content:space-between;">
          <span>MOJ AUTO • Evidencija i upravljanje vozilom</span>
          <span>Izvještaj kreiran: ${currentDate}</span>
        </div>
      </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-100000px';
    wrapper.style.top = '0';
    wrapper.style.width = '850px';
    wrapper.style.background = '#FFFFFF';
    wrapper.innerHTML = htmlContent;
    document.body.appendChild(wrapper);

    try {
      const logo = wrapper.querySelector('img');
      if (logo && !logo.complete) {
        await new Promise<void>((resolve) => {
          logo.addEventListener('load', () => resolve(), { once: true });
          logo.addEventListener('error', () => resolve(), { once: true });
        });
      }

      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const pdfElement = wrapper.querySelector('#moj-auto-pdf') as HTMLElement;
      const pdfDataUri = await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `MOJ-AUTO-${car.make}-${car.model}-${pdfYear}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#FFFFFF' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(pdfElement)
        .outputPdf('datauristring');

      if (!pdfDataUri || typeof pdfDataUri !== 'string' || !pdfDataUri.includes(',')) {
        throw new Error('PDF nije uspješno generisan.');
      }

      const base64 = pdfDataUri.substring(pdfDataUri.indexOf(',') + 1);
      const safeMake = car.make.replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeModel = car.model.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `MOJ-AUTO-${safeMake}-${safeModel}-${pdfYear}.pdf`;

      if (Capacitor.isNativePlatform()) {
        const saved = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache,
          recursive: true,
        });

        const uriResult = await Filesystem.getUri({
          path: fileName,
          directory: Directory.Cache,
        });

        await FileOpener.open({
          filePath: uriResult.uri || saved.uri || '',
          contentType: 'application/pdf',
          openWithDefault: true,
        });
      } else {
        // Browser / AI Studio fallback: download the same real PDF instead of opening a WebView window.
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      }

      setIsPdfModalOpen(false);
    } catch (error) {
      console.error('Greška pri izvozu PDF-a:', error);
      alert('PDF nije moguće otvoriti. Provjerite da li je na telefonu instalirana aplikacija za PDF dokumente.');
    } finally {
      wrapper.remove();
    }
  };'''

text = text[:start] + new_function + text[end:]
path.write_text(text, encoding='utf-8')
print('PDF export patched successfully.')
