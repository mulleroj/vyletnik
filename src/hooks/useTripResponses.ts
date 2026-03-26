import { useEffect, useState } from 'react';
import { db } from '../db/database';
import type { TaskResponseRecord } from '../types/responses';

/** Live map odpovědí pro daný výlet (Dexie reaktivně přes polling + storage event jednoduše – refresh po změnách) */
export function useTripResponses(tripId: string | undefined) {
  const [map, setMap] = useState<Map<string, TaskResponseRecord>>(new Map());
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;
    const load = async () => {
      const rows = await db.responses.where('tripId').equals(tripId).toArray();
      if (cancelled) return;
      const m = new Map(rows.map((r) => [r.key, r]));
      setMap(m);
    };
    load();
    const id = window.setInterval(load, 800);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [tripId, version]);

  const refresh = () => setVersion((v) => v + 1);

  return { responseMap: map, refresh };
}
