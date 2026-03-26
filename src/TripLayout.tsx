import { Outlet, useParams } from 'react-router-dom';
import { TripProvider } from './context/TripContext';

/** Načte JSON výletu a poskytne kontext pro vnořené stránky. */
export function TripLayout() {
  const { tripId } = useParams();
  if (!tripId) return null;
  return (
    <TripProvider tripId={tripId}>
      <Outlet />
    </TripProvider>
  );
}
