import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTripContext } from '../context/TripContext';
import { useTripResponses } from '../hooks/useTripResponses';
import { stationProgress, tripTaskCounts, taskFilled } from '../lib/progress';
import { buildExportPayload } from '../services/exportPayload';
import { downloadJson, exportMailto, exportOutlookWebCompose, exportPdf } from '../services/exportFormats';
import { submitToWebhook } from '../services/webhook';
import { getProfile } from '../db/session';
import { taskKey } from '../db/responses';
import { ProgressBar } from '../components/ProgressBar';
import { TechTripHeader } from '../components/TechTripHeader';
import { TripBottomNav } from '../components/TripBottomNav';
import { IconSend } from '../components/Icons';

/**
 * Závěrečná obrazovka – kontrola a export.
 */
export function SummaryPage() {
  const { trip } = useTripContext();
  const { responseMap } = useTripResponses(trip.id);
  const [msg, setMsg] = useState<string | null>(null);
  const totals = tripTaskCounts(trip, responseMap);

  const stationsOverview = useMemo(
    () =>
      trip.stations.map((st) => {
        const p = stationProgress(trip, st.id, responseMap);
        return { ...st, progress: p };
      }),
    [trip, responseMap]
  );

  const exportBase = `${trip.id}-${Date.now()}`;

  const runExport = async () => {
    setMsg(null);
    const profile = await getProfile();
    if (!profile || profile.tripId !== trip.id) {
      setMsg('Nejprve vyplň jméno na úvodní obrazovce.');
      return;
    }
    try {
      const payload = await buildExportPayload(trip);
      return payload;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Export selhal');
      return null;
    }
  };

  const onJson = async () => {
    const payload = await runExport();
    if (!payload) return;
    downloadJson(payload, `vyletnik-${exportBase}.json`);
    setMsg('JSON byl stažen.');
  };

  const onPdf = async () => {
    const payload = await runExport();
    if (!payload) return;
    await exportPdf(payload, `vyletnik-${exportBase}.pdf`);
    setMsg('PDF bylo vygenerováno.');
  };

  const onOutlook = async () => {
    const payload = await runExport();
    if (!payload) return;
    exportOutlookWebCompose(payload, trip.teacherEmail);
    setMsg('Otevře se Outlook na webu – přihlas se školním Microsoft účtem a odešli.');
  };

  const onMail = async () => {
    const payload = await runExport();
    if (!payload) return;
    exportMailto(payload, trip.teacherEmail);
    setMsg('Otevře se výchozí e-mailový program (mailto).');
  };

  const onWebhook = async () => {
    const payload = await runExport();
    if (!payload) return;
    const r = await submitToWebhook(payload);
    setMsg(r.ok ? 'Odesláno na webhook.' : r.error ?? 'Webhook selhal');
  };

  return (
    <div className="page page--trip">
      <nav className="breadcrumb">
        <Link to={`/trip/${trip.id}/menu`}>← Přehled</Link>
      </nav>

      <TechTripHeader
        kicker="EXPORT"
        title="Souhrn výsledků"
        description="Zkontroluj odpovědi a odešli je učiteli. Plné fotky jsou v JSON."
        progress={{ done: totals.completed, total: totals.total }}
      />

      <ProgressBar completed={totals.completed} total={totals.total} label="Splněné úkoly celkem" />

      <section className="card card--panel">
        <h2 className="card__title card__title--row">
          <span className="card__title-mark" aria-hidden />
          Stav modulů
        </h2>
        <ul className="summary-stations">
          {stationsOverview.map((st) => (
            <li key={st.id} className="summary-stations__row">
              <span>{st.title}</span>
              <span
                className={
                  st.progress.status === 'done'
                    ? 'status-pill status-pill--done'
                    : st.progress.status === 'in_progress'
                      ? 'status-pill status-pill--active'
                      : 'status-pill status-pill--idle'
                }
              >
                {st.progress.done}/{st.progress.total}
                {st.progress.status === 'done' ? ' · OK' : st.progress.status === 'in_progress' ? ' · rozprac.' : ''}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card card--panel">
        <h2 className="card__title card__title--row">
          <span className="card__title-mark" aria-hidden />
          Náhled odpovědí
        </h2>
        <div className="summary-text-preview">
          {trip.stations.map((st) => (
            <div key={st.id} className="summary-block">
              <h3>{st.title}</h3>
              {st.tasks.map((t) => {
                const r = responseMap.get(taskKey(trip.id, st.id, t.id));
                const filled = taskFilled(r, t.type);
                const pending = Boolean(r?.inProgress) && !filled;
                return (
                  <div key={t.id} className="summary-task">
                    <strong>{t.title}</strong>
                    <span
                      className={`summary-task__state ${filled ? 'is-ok' : pending ? 'is-pending' : 'is-warn'}`}
                    >
                      {filled ? 'vyplněno' : pending ? 'rozpracováno' : 'chybí'}
                    </span>
                    {t.type !== 'photo' && r?.textValue && <p>{r.textValue}</p>}
                    {t.type === 'choice' && r?.choiceIndex != null && t.options && <p>{t.options[r.choiceIndex]}</p>}
                    {t.type === 'checkbox' && r?.checkboxValue != null && <p>{r.checkboxValue ? 'Splněno' : 'Nesplněno'}</p>}
                    {t.type === 'photo' && (r?.photoBlobIds?.length ?? 0) > 0 && <p>Fotek: {r?.photoBlobIds?.length}</p>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section className="card card--panel card--actions">
        <h2 className="card__title card__title--row">
          <IconSend size={20} />
          Odeslat výsledky
        </h2>
        <p className="hint">
          Outlook (web) = doporučeno pro školní Microsoft 365; ostatní program = mailto. PDF = přehled; JSON = včetně
          fotek (může být velký).
        </p>
        <div className="btn-row btn-row--stack">
          <button type="button" className="btn btn--accent btn--large btn--icon" onClick={() => void onOutlook()}>
            <IconSend size={22} />
            Odeslat v Outlooku (web)
          </button>
          <button type="button" className="btn btn--secondary btn--large" onClick={() => void onMail()}>
            Odeslat e-mailem (jiný program)
          </button>
          <button type="button" className="btn btn--secondary btn--large" onClick={() => void onPdf()}>
            Export PDF
          </button>
          <button type="button" className="btn btn--secondary btn--large" onClick={() => void onJson()}>
            Stáhnout JSON
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => void onWebhook()}>
            Webhook (volitelné)
          </button>
        </div>
        {msg && <p className="form-msg">{msg}</p>}
      </section>

      <TripBottomNav tripId={trip.id} />
    </div>
  );
}
