import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { TripDefinition } from '../types/trip';
import { loadTripById } from '../services/tripLoader';
import { HomeNavLink } from '../components/HomeNavLink';
import { PageHomeBar } from '../components/PageHomeBar';

type TripCtx = {
  trip: TripDefinition;
  reload: () => Promise<void>;
};

const Ctx = createContext<TripCtx | null>(null);

export function TripProvider({ tripId, children }: { tripId: string; children: ReactNode }) {
  const [trip, setTrip] = useState<TripDefinition | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const t = await loadTripById(tripId);
    setTrip(t);
  }, [tripId]);

  useEffect(() => {
    let cancel = false;
    setError(null);
    loadTripById(tripId)
      .then((t) => {
        if (!cancel) setTrip(t);
      })
      .catch((e: Error) => {
        if (!cancel) setError(e.message ?? 'Chyba načtení');
      });
    return () => {
      cancel = true;
    };
  }, [tripId]);

  const value = useMemo(() => (trip ? { trip, reload } : null), [trip, reload]);

  if (error) {
    return (
      <div className="page page--with-home-bar">
        <PageHomeBar />
        <div className="page--with-home-bar__fill">
          <div className="card card--error card--panel">
            <h1 className="card__title">Chyba načtení</h1>
            <p className="hint">{error}</p>
            <HomeNavLink className="btn btn--accent btn--large btn--icon" iconSize={22}>
              Zpět na úvod
            </HomeNavLink>
          </div>
        </div>
      </div>
    );
  }

  if (!trip || !value) {
    return (
      <div className="page page--with-home-bar">
        <PageHomeBar />
        <div className="page--with-home-bar__fill">
          <p className="loading-text">Načítám data výletu…</p>
        </div>
      </div>
    );
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTripContext(): TripCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTripContext mimo TripProvider');
  return v;
}
