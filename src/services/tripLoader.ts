import type { TripDefinition } from '../types/trip';
import { getCustomTrip } from '../db/customTrips';

const CACHE_PREFIX = 'vyletnik_trip_cache:';

/**
 * Načte definici výletu z JSON (public/trips/*.json), případně z průvodce (IndexedDB v prohlížeči).
 * Výsledek se při úspěchu uloží do sessionStorage pro offline návrat.
 */
export async function loadTripById(tripId: string): Promise<TripDefinition> {
  const url = `${import.meta.env.BASE_URL}trips/${tripId}.json`.replace(/\/+/g, '/');
  let data: TripDefinition | undefined;
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = (await res.json()) as TripDefinition;
  } catch {
    const fromEditor = await getCustomTrip(tripId);
    if (fromEditor) {
      data = fromEditor;
    } else {
      const cached = sessionStorage.getItem(CACHE_PREFIX + tripId);
      if (cached) {
        data = JSON.parse(cached) as TripDefinition;
      }
    }
    if (!data) {
      throw new Error(`Výlet „${tripId}“ se nepodařilo načíst (ani ze serveru, ani z uložených v prohlížeči).`);
    }
  }
  sessionStorage.setItem(CACHE_PREFIX + tripId, JSON.stringify(data));
  return data;
}

export function listCachedTripIds(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const k = sessionStorage.key(i);
    if (k?.startsWith(CACHE_PREFIX)) keys.push(k.replace(CACHE_PREFIX, ''));
  }
  return keys;
}
