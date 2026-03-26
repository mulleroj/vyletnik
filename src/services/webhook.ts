import type { ExportPayload } from './exportPayload';

/**
 * Příprava na budoucí backend: odešle JSON na konfigurovanou URL (CORS musí být povolený).
 * Volitelná env proměnná VITE_SUBMIT_WEBHOOK_URL – v Netlify / GitHub Actions lze nastavit build-time.
 */
export async function submitToWebhook(payload: ExportPayload): Promise<{ ok: boolean; error?: string }> {
  const url = import.meta.env.VITE_SUBMIT_WEBHOOK_URL as string | undefined;
  if (!url) {
    return { ok: false, error: 'Webhook URL není nastavená (VITE_SUBMIT_WEBHOOK_URL).' };
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Neznámá chyba' };
  }
}
