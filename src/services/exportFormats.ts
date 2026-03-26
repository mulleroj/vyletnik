import { jsPDF } from 'jspdf';
import type { ExportPayload } from './exportPayload';

/** Otevře mailto s textovým souhrnem (bez base64 fotek – příliš velké) */
export function exportMailto(payload: ExportPayload, teacherEmail?: string): void {
  const subject = encodeURIComponent(`Výletník – ${payload.tripTitle} – ${payload.studentName}`);
  const bodyLines: string[] = [
    `Žák: ${payload.studentName}`,
    `Skupina: ${payload.groupName}`,
    `Výlet: ${payload.tripTitle}`,
    `Export: ${payload.exportedAt}`,
    '',
  ];
  for (const st of payload.stations) {
    bodyLines.push(`--- ${st.stationTitle} ---`);
    for (const t of st.tasks) {
      bodyLines.push(`• ${t.taskTitle}`);
      if (t.textValue) bodyLines.push(`  Text: ${t.textValue}`);
      if (t.choiceLabel != null) bodyLines.push(`  Výběr: ${t.choiceLabel}`);
      if (t.checkboxValue != null) bodyLines.push(`  Ano/ne: ${t.checkboxValue ? 'ano' : 'ne'}`);
      if (t.photos.length) bodyLines.push(`  Fotky: ${t.photos.length} (viz JSON export)`);
      bodyLines.push('');
    }
  }
  const body = encodeURIComponent(bodyLines.join('\n'));
  const to = teacherEmail ? encodeURIComponent(teacherEmail) : '';
  window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
}

export function downloadJson(payload: ExportPayload, filename: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * PDF – textový souhrn; fotky jako malé náhledy pokud nejsou příliš mnoho.
 */
export async function exportPdf(payload: ExportPayload, filename: string): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 14;
  let y = margin;
  const line = (text: string, size = 10) => {
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, 180);
    for (const ln of lines) {
      if (y > 280) {
        doc.addPage();
        y = margin;
      }
      doc.text(ln, margin, y);
      y += size * 0.45;
    }
    y += 2;
  };

  line('Výletník – export výsledků', 16);
  line(`Žák: ${payload.studentName}`);
  line(`Skupina: ${payload.groupName}`);
  line(`Výlet: ${payload.tripTitle}`);
  line(`Čas exportu: ${payload.exportedAt}`);

  for (const st of payload.stations) {
    line(st.stationTitle, 12);
    for (const t of st.tasks) {
      line(`• ${t.taskTitle}`);
      if (t.textValue) line(`  Odpověď: ${t.textValue}`);
      if (t.choiceLabel != null) line(`  Výběr: ${t.choiceLabel}`);
      if (t.checkboxValue != null) line(`  Zaškrtnuto: ${t.checkboxValue ? 'ano' : 'ne'}`);
      if (t.photos.length) line(`  Počet fotek: ${t.photos.length} (plné zobrazení v JSON)`);
    }
  }

  let imgY = y;
  for (const st of payload.stations) {
    for (const t of st.tasks) {
      for (const ph of t.photos.slice(0, 2)) {
        try {
          if (imgY > 200) {
            doc.addPage();
            imgY = margin;
          }
          const fmt = ph.dataUrl.toLowerCase().includes('image/png') ? 'PNG' : 'JPEG';
          doc.addImage(ph.dataUrl, fmt, margin, imgY, 50, 50 * 0.75);
          imgY += 45;
        } catch {
          line(`(fotku se nepodařilo vložit do PDF: ${ph.id})`);
        }
      }
    }
  }

  doc.save(filename);
}
