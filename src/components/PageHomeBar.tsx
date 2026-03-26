import { HomeNavLink } from './HomeNavLink';

/**
 * Horní lišta s ikonou blesku na návrat domů – stránky bez TechTripHeader (QR, načítání, chyba).
 */
export function PageHomeBar({ className = '' }: { className?: string }) {
  return (
    <nav className={`page-home-bar ${className}`.trim()} aria-label="Úvodní stránka">
      <HomeNavLink className="page-home-bar__btn" iconSize={24} />
    </nav>
  );
}
