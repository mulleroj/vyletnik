import type { jsPDF } from 'jspdf';

/** Načte Roboto TTF z public/ a zaregistruje ho v dokumentu (UTF-8 / čeština). */
let robotoBase64: string | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[]);
  }
  return btoa(binary);
}

export async function ensureRobotoFont(doc: jsPDF): Promise<void> {
  if (!robotoBase64) {
    const url = `${import.meta.env.BASE_URL}fonts/Roboto-Regular.ttf`.replace(/\/+/g, '/');
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Font pro PDF se nepodařilo načíst (${res.status}). Zkontroluj připojení nebo obnov stránku.`);
    }
    robotoBase64 = arrayBufferToBase64(await res.arrayBuffer());
  }
  doc.addFileToVFS('Roboto-Regular.ttf', robotoBase64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.setFont('Roboto', 'normal');
}
