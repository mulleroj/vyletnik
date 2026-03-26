import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { loadTripIndex, type TripIndexEntry } from '../services/tripIndex';
import { listCustomTripsMeta } from '../db/customTrips';
import { HomeNavLink } from '../components/HomeNavLink';

/**
 * Úvodní výběr výletu – serverové + uložené v prohlížeči (průvodce).
 */
export function HomePage() {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
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
    const url = `${path}#/`;
    setHomeQrUrl(url);
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    void QRCode.toCanvas(canvas, url, {
      width: 220,
      margin: 2,
      color: { dark: '#0a0a0a', light: '#fffef5' },
    });
  }, []);

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
        <div className="hero__brand">
          <HomeNavLink className="hero__logo" iconSize={36} aria-current="page" />
          <div>
            <h1 className="hero__title">Výletník</h1>
            <p className="hero__tag">Terénní úkoly · technická kontrola výsledků</p>
          </div>
        </div>
        <p className="hero__lead">
          Vyber aktivní výlet nebo naskenuj QR od učitele. Aplikace běží v prohlížeči, data drží v mobilu.
        </p>
      </header>

      <section className="section section--home-qr" aria-labelledby="home-qr-heading">
        <h2 id="home-qr-heading" className="section__title section__title--tech">
          QR na úvod
        </h2>
        <p className="hint section__lead">Naskenuj – otevře se tato úvodní stránka na jiném mobilu (stejná adresa jako teď).</p>
        <div className="card card--panel card--qr home-entry-qr">
          <canvas ref={qrCanvasRef} aria-label="QR kód na úvodní stránku aplikace" />
          {homeQrUrl && (
            <p className="qr-url">
              <code>{homeQrUrl}</code>
            </p>
          )}
        </div>
      </section>

      {err && <p className="text-error">{err}</p>}

      <section className="section">
        <h2 className="section__title section__title--tech">Výlety (z webu)</h2>
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
