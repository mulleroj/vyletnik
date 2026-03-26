import { NavLink, useLocation } from 'react-router-dom';
import { IconMenu, IconQr, IconSend } from './Icons';

type Props = {
  tripId: string;
};

/**
 * Pevná spodní navigace – palec, důraz na souhrn / odeslání.
 */
export function TripBottomNav({ tripId }: Props) {
  const loc = useLocation();
  const base = `/trip/${tripId}`;
  const onStations = loc.pathname === `${base}/menu` || loc.pathname.startsWith(`${base}/station/`);
  const onSummary = loc.pathname.includes(`${base}/summary`);
  const onQr = loc.pathname === `/qr/${tripId}`;

  return (
    <nav className="trip-bottom-nav" aria-label="Hlavní navigace výletu">
      <NavLink
        to={`${base}/menu`}
        className={() => `trip-bottom-nav__item ${onStations ? 'is-active' : ''}`}
      >
        <IconMenu size={22} />
        <span>Stanoviště</span>
      </NavLink>
      <NavLink
        to={`${base}/summary`}
        className={() => `trip-bottom-nav__fab ${onSummary ? 'is-active' : ''}`}
      >
        <IconSend size={24} />
        <span>Souhrn</span>
      </NavLink>
      <NavLink to={`/qr/${tripId}`} className={() => `trip-bottom-nav__item ${onQr ? 'is-active' : ''}`}>
        <IconQr size={22} />
        <span>QR</span>
      </NavLink>
    </nav>
  );
}
