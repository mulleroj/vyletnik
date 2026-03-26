import { Link } from 'react-router-dom';
import { useTripContext } from '../context/TripContext';
import { useTripResponses } from '../hooks/useTripResponses';
import { stationProgress, tripTaskCounts } from '../lib/progress';
import { ProgressBar } from '../components/ProgressBar';
import { TechTripHeader } from '../components/TechTripHeader';
import { TripBottomNav } from '../components/TripBottomNav';
import { IconChevronRight, IconStation } from '../components/Icons';

const statusLabel: Record<string, string> = {
  not_started: 'Nezahájeno',
  in_progress: 'Rozpracováno',
  done: 'Splněno',
};

const statusPill: Record<string, string> = {
  not_started: 'status-pill status-pill--idle',
  in_progress: 'status-pill status-pill--active',
  done: 'status-pill status-pill--done',
};

const panelMod: Record<string, string> = {
  not_started: 'station-panel--idle',
  in_progress: 'station-panel--active',
  done: 'station-panel--done',
};

/**
 * Hlavní menu – stanoviště jako technické moduly.
 */
export function MenuPage() {
  const { trip } = useTripContext();
  const { responseMap } = useTripResponses(trip.id);
  const totals = tripTaskCounts(trip, responseMap);

  return (
    <div className="page page--trip">
      <TechTripHeader
        kicker={trip.title}
        title="Stanoviště"
        description="Vyber modul a plň úkoly. Data zůstávají v zařízení."
        progress={{ done: totals.completed, total: totals.total }}
      />

      <ProgressBar completed={totals.completed} total={totals.total} label="Celkový postup" />

      {totals.total > 0 && totals.completed < totals.total && (
        <p className="hint menu-export-hint">
          Výstupy (e-mail, PDF, JSON…) odešleš až v <strong>Souhrnu</strong>, až budou vyplněné všechny úkoly.
        </p>
      )}

      <ul className="station-list">
        {trip.stations.map((st) => {
          const p = stationProgress(trip, st.id, responseMap);
          return (
            <li key={st.id}>
              <Link className={`station-panel ${panelMod[p.status] ?? ''}`} to={`/trip/${trip.id}/station/${st.id}`}>
                <div className="station-panel__icon" aria-hidden>
                  <IconStation size={26} />
                </div>
                <div className="station-panel__body">
                  <span className="station-panel__title">{st.title}</span>
                  {st.description && <span className="station-panel__sub">{st.description}</span>}
                  <div className="station-panel__bar" aria-hidden>
                    <span
                      className="station-panel__bar-fill"
                      style={{ width: `${p.total > 0 ? (p.done / p.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="station-panel__aside">
                  <span className={statusPill[p.status] ?? 'status-pill'}>{statusLabel[p.status] ?? p.status}</span>
                  <span className="station-panel__count">
                    {p.done}/{p.total} úkolů
                  </span>
                  <IconChevronRight className="station-panel__chev" size={20} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <TripBottomNav tripId={trip.id} />
    </div>
  );
}
