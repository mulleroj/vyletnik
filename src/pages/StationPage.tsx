import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTripContext } from '../context/TripContext';
import { TaskField } from '../components/TaskField';
import { SaveIndicator } from '../components/SaveIndicator';
import { useTripResponses } from '../hooks/useTripResponses';
import { stationProgress } from '../lib/progress';
import { ProgressBar } from '../components/ProgressBar';
import { TechTripHeader } from '../components/TechTripHeader';
import { TripBottomNav } from '../components/TripBottomNav';
import { PageHomeBar } from '../components/PageHomeBar';

/**
 * Detail stanoviště – úkoly s auto-save.
 */
export function StationPage() {
  const { stationId } = useParams();
  const { trip } = useTripContext();
  const { responseMap, refresh } = useTripResponses(trip.id);
  const [saveTick, setSaveTick] = useState(0);

  const station = trip.stations.find((s) => s.id === stationId);
  if (!station) {
    return (
      <div className="page page--trip page--with-home-bar">
        <PageHomeBar />
        <div className="page--with-home-bar__fill page--with-home-bar__fill--start">
          <p>Stanoviště nenalezeno.</p>
          <Link to={`/trip/${trip.id}/menu`}>Zpět do přehledu</Link>
        </div>
      </div>
    );
  }

  const counts = stationProgress(trip, station.id, responseMap);

  const onSaved = () => {
    setSaveTick((n) => n + 1);
    refresh();
  };

  return (
    <div className="page page--trip">
      <SaveIndicator tick={saveTick} />

      <nav className="breadcrumb">
        <Link to={`/trip/${trip.id}/menu`}>← Přehled stanovišť</Link>
      </nav>

      <TechTripHeader
        kicker="MODUL"
        title={station.title}
        description={station.description}
        progress={{ done: counts.done, total: counts.total }}
      />

      <ProgressBar completed={counts.done} total={counts.total} label="Postup v tomto modulu" />

      <div className="task-stack">
        {station.tasks.map((t) => (
          <TaskField key={t.id} tripId={trip.id} stationId={station.id} task={t} onSaved={onSaved} />
        ))}
      </div>

      <TripBottomNav tripId={trip.id} />
    </div>
  );
}
