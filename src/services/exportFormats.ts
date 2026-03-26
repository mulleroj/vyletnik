import { jsPDF } from 'jspdf';
import type { ExportPayload } from './exportPayload';
import { ensureRobotoFont } from './pdfFont';

/** Předmět a tělo stejné jako u mailto / Outlooku (bez base64 fotek v textu). */
export function buildExportEmailContent(payload: ExportPayload): { subject: string; body: string } {
  const subject = `Výletník – ${payload.tripTitle} – ${payload.studentName}`;
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
  return { subject, body: bodyLines.join('\n') };
}

/** Otevře výchozí e-mailový klient (mailto). */
export function exportMailto(payload: ExportPayload, teacherEmail?: string): void {
  const { subject, body } = buildExportEmailContent(payload);
  const to = teacherEmail ? encodeURIComponent(teacherEmail) : '';
  window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Otevře Outlook na webu (Microsoft 365) se stejným textem – po přihlášení školním účtem student odešle z učitelova pole.
 * Výchozí URL: outlook.office.com; škola může přepsat VITE_OUTLOOK_COMPOSE_BASE.
 */
export function exportOutlookWebCompose(payload: ExportPayload, teacherEmail?: string): void {
  const { subject, body } = buildExportEmailContent(payload);
  const base =
    import.meta.env.VITE_OUTLOOK_COMPOSE_BASE?.trim() || 'https://outlook.office.com/mail/deeplink/compose';
  const params = new URLSearchParams();
  const to = teacherEmail?.trim();
  if (to) params.set('to', to);
  params.set('subject', subject);
  params.set('body', body);
  const url = `${base}?${params.toString()}`;
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  if (!w) window.location.href = url;
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
 * Jeden PDF soubor: hlavička + všechna stanoviště a úkoly (text i výběry) + všechny fotky jako náhledy.
 */
export async function exportPdf(payload: ExportPayload, filename: string): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  await ensureRobotoFont(doc);

  const margin = 14;
  const pageBottom = 285;
  const textWidth = 182;
  let y = margin;

  const newPage = () => {
    doc.addPage();
    y = margin;
  };

  const line = (text: string, size = 10, gapAfter = 2) => {
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(10, 10, 10);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, textWidth);
    for (const ln of lines) {
      if (y > pageBottom - size * 0.5) newPage();
      doc.text(ln, margin, y);
      y += size * 0.45;
    }
    y += gapAfter;
  };

  line('Výletník – jeden souhrnný PDF', 16);
  line('Obsahuje výstupy ze všech stanoviští a úkolů včetně fotek.', 9, 3);
  line(`Žák: ${payload.studentName}`);
  line(`Skupina: ${payload.groupName}`);
  line(`Výlet: ${payload.tripTitle}`);
  line(`Čas exportu: ${payload.exportedAt}`, 10, 4);

  for (const st of payload.stations) {
    line(st.stationTitle, 13, 1);
    for (const t of st.tasks) {
      line(`• ${t.taskTitle} (${t.taskType})`, 10, 0.5);
      if (t.textValue) line(`  Odpověď: ${t.textValue}`);
      if (t.choiceLabel != null) line(`  Výběr: ${t.choiceLabel}`);
      if (t.checkboxValue != null) line(`  Zaškrtnuto: ${t.checkboxValue ? 'ano' : 'ne'}`);
      if (!t.textValue && t.choiceLabel == null && t.checkboxValue == null && !t.photos.length) {
        line('  (bez odpovědi)', 9, 1);
      }
      y += 1;
    }
    y += 2;
  }

  const hasAnyPhoto = payload.stations.some((st) => st.tasks.some((t) => t.photos.length > 0));
  if (hasAnyPhoto) {
    line('— Fotografie ke všem úkolům —', 12, 3);
  }

  const imgW = 75;
  const imgH = imgW * 0.75;
  const captionSize = 8;

  for (const st of payload.stations) {
    for (const t of st.tasks) {
      t.photos.forEach((ph, pi) => {
        const blockH = imgH + captionSize * 0.45 * 2 + 6;
        if (y + blockH > pageBottom) newPage();

        try {
          const fmt = ph.dataUrl.toLowerCase().includes('image/png') ? 'PNG' : 'JPEG';
          doc.addImage(ph.dataUrl, fmt, margin, y, imgW, imgH);
          y += imgH + 2;
          doc.setFontSize(captionSize);
          doc.setTextColor(70, 70, 70);
          doc.text(`${st.stationTitle} · ${t.taskTitle}${t.photos.length > 1 ? ` (${pi + 1}/${t.photos.length})` : ''}`, margin, y);
          y += captionSize * 0.45 + 4;
          doc.setTextColor(10, 10, 10);
        } catch {
          line(`(Fotku se nepodařilo vložit: ${ph.id})`, 9, 2);
        }
      });
    }
  }

  doc.save(filename);
}
