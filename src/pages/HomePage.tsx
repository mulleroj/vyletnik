import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { loadTripIndex, type TripIndexEntry } from '../services/tripIndex';
import { listCustomTripsMeta } from '../db/customTrips';
import { HomeNavLink } from '../components/HomeNavLink';
import { IconQr } from '../components/Icons';

/**
 * Úvodní výběr výletu – serverové + uložené v prohlížeči (průvodce).
 */
const QR_MODAL = 280;

export function HomePage() {
  const qrModalRef = useRef<HTMLCanvasElement>(null);
  const qrModalCloseRef = useRef<HTMLButtonElement>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [remoteTrips, setRemoteTrips] = useState<TripIndexEntry[]>([]);
  const [localTrips, setLocalTrips] = useState<{ id: string; title: string }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [homeQrUrl, setHomeQrUrl] = useState('');

  const loadAll = useCallback(async () => {
    setErr(null);
    try {
      const idx = await loadTripIndex();
      setRemoteTrips(idx.trips);
    } catch (e) {
      setRemoteTrips([]);
      setErr(e instanceof Error ? e.message : 'Index výletů se nepodařilo načíst.');
    }
    try {
      const meta = await listCustomTripsMeta();
      setLocalTrips(meta.map((m) => ({ id: m.id, title: m.title })));
    } catch {
      setLocalTrips([]);
    }
  }, []);

  useEffect(() => {
    void loadAll();
    const onCustom = () => void loadAll();
    window.addEventListener('vyletnik-custom-trips-changed', onCustom);
    return () => window.removeEventListener('vyletnik-custom-trips-changed', onCustom);
  }, [loadAll]);

  useEffect(() => {
    const path = `${window.location.origin}${window.location.pathname}`;
    setHomeQrUrl(`${path}#/`);
  }, []);

  useEffect(() => {
    if (!qrModalOpen || !homeQrUrl || !qrModalRef.current) return;
    void QRCode.toCanvas(qrModalRef.current, homeQrUrl, {
      width: QR_MODAL,
      margin: 2,
      color: { dark: '#0a0a0a', light: '#fffef5' },
    });
  }, [qrModalOpen, homeQrUrl]);

  useEffect(() => {
    if (!qrModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    queueMicrotask(() => qrModalCloseRef.current?.focus());
    return () => {
      document.body.style.overflow = prev;
    };
  }, [qrModalOpen]);

  useEffect(() => {
    if (!qrModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQrModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [qrModalOpen]);

  return (
    <div className="page page--home">
      <header className="hero hero--tech">
        <div className="hero__strip" aria-hidden>
          <span className="hero__strip-item">PWA</span>
          <span className="hero__strip-dot" />
          <span className="hero__strip-item">offline</span>
          <span className="hero__strip-dot" />
          <span className="hero__strip-item">IndexedDB</span>
        </div>
        <div className="hero__toolbar">
          <div className="hero__brand">
            <HomeNavLink className="hero__logo" iconSize={36} aria-current="page" />
            <div>
              <h1 className="hero__title">Výletník</h1>
              <p className="hero__tag">Terénní úkoly · technická kontrola výsledků</p>
            </div>
          </div>
          <button
            type="button"
            className="hero-qr-menu-btn"
            onClick={() => setQrModalOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={qrModalOpen}
            aria-controls="home-qr-dialog"
            aria-label="Zobrazit QR kód na úvod aplikace"
          >
            <IconQr size={24} />
          </button>
        </div>
        <p className="hero__lead">
          Vyber aktivní výlet nebo naskenuj QR od učitele. Odkaz na tuto stránku sdílíš ikonou QR vpravo nahoře. Aplikace běží v prohlížeči, data drží v mobilu.
        </p>
      </header>

      {qrModalOpen && (
        <div
          className="home-qr-modal-backdrop"
          role="presentation"
          onClick={() => setQrModalOpen(false)}
        >
          <div
            id="home-qr-dialog"
            className="home-qr-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-qr-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="home-qr-modal-title" className="home-qr-modal__title">
              QR na úvod aplikace
            </h3>
            <div className="home-qr-modal__canvas-wrap">
              <canvas ref={qrModalRef} aria-label="Zvětšený QR kód na úvodní stránku aplikace" />
            </div>
            {homeQrUrl && (
              <p className="qr-url home-qr-modal__url">
                <code>{homeQrUrl}</code>
              </p>
            )}
            <button
              ref={qrModalCloseRef}
              type="button"
              className="btn btn--accent btn--large home-qr-modal__close"
              onClick={() => setQrModalOpen(false)}
            >
              Zavřít
            </button>
          </div>
        </div>
      )}

      {err && <p className="text-error">{err}</p>}

      <section className="section">
        <h2 className="section__title section__title--tech">Výlety</h2>
        <ul className="trip-grid">
          {remoteTrips.map((t) => (
            <li key={t.id}>
              <Link className="trip-card trip-card--module" to={`/trip/${t.id}`}>
                <span className="trip-card__id">{t.id}</span>
                <span className="trip-card__title">{t.title}</span>
                <span className="trip-card__cta">Otevřít →</span>
              </Link>
            </li>
          ))}
        </ul>
        {remoteTrips.length === 0 && !err && <p className="hint">Žádné výlety v indexu – použij průvodce nebo přidej JSON do public/trips.</p>}
      </section>

      {localTrips.length > 0 && (
        <section className="section">
          <h2 className="section__title section__title--tech">Uložené v prohlížeči</h2>
          <p className="hint section__lead">Výlety z editoru (Průvodce) – jen v tomto zařízení.</p>
          <ul className="trip-grid">
            {localTrips.map((t) => (
              <li key={t.id}>
                <Link className="trip-card trip-card--module trip-card--local" to={`/trip/${t.id}`}>
                  <span className="trip-card__id">{t.id}</span>
                  <span className="trip-card__title">{t.title}</span>
                  <span className="trip-card__cta">Otevřít →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="section section--panel">
        <h2 className="section__title section__title--tech">Pro učitele</h2>
        <div className="btn-row btn-row--stack">
          <Link className="btn btn--accent btn--large" to="/admin">
            Editor výletů (průvodce + JSON)
          </Link>
          <span className="hint">Nejdřív sestav výlet v průvodci a ulož do prohlížeče nebo stáhni JSON pro nasazení.</span>
        </div>
      </section>
    </div>
  );
}
