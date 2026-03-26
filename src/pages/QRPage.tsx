import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HomeNavLink } from '../components/HomeNavLink';
import { PageHomeBar } from '../components/PageHomeBar';
import QRCode from 'qrcode';

/**
 * Sdílení – QR kód odkazuje na úvod výletu (stejná instance PWA).
 */
export function QRPage() {
  const { tripId } = useParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!tripId || !canvasRef.current) return;
    const path = `${window.location.origin}${window.location.pathname}`;
    const url = `${path}#/trip/${tripId}`;
    void QRCode.toCanvas(canvasRef.current, url, {
      width: 280,
      margin: 2,
      color: { dark: '#0a0a0a', light: '#fffef5' },
    });
  }, [tripId]);

  const path = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  const link = `${path}#/trip/${tripId}`;

  return (
    <div className="page page--center page--qr">
      <PageHomeBar />
      <header className="page-head page-head--spaced">
        <p className="eyebrow eyebrow--tech">Sdílení</p>
        <h1 className="page-head__title">QR pro přístup</h1>
        <p className="page-head__desc">Naskenuj kód – otevře se výlet na mobilu (stejná adresa jako tato aplikace).</p>
      </header>

      <div className="card card--panel card--qr">
        <canvas ref={canvasRef} aria-label="QR kód s odkazem na výlet" />
        <p className="qr-url">
          <code>{link}</code>
        </p>
      </div>

      <div className="btn-row btn-row--stack">
        <Link className="btn btn--accent btn--large" to={`/trip/${tripId}/menu`}>
          Zpět do výletu
        </Link>
        <HomeNavLink className="btn btn--secondary btn--large btn--icon" iconSize={22}>
          Úvodní stránka
        </HomeNavLink>
      </div>
    </div>
  );
}
