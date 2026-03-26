import { db } from './database';
import type { TripDefinition } from '../types/trip';

/**
 * Uložení / úprava výletu vytvořeného v průvodci – dostupné jen v tomto prohlížeči.
 */
export async function saveCustomTrip(definition: TripDefinition): Promise<void> {
  await db.customTrips.put({
    id: definition.id,
    definition,
    updatedAt: Date.now(),
  });
}

export async function deleteCustomTrip(id: string): Promise<void> {
  await db.customTrips.delete(id);
}

export async function getCustomTrip(id: string): Promise<TripDefinition | undefined> {
  const row = await db.customTrips.get(id);
  return row?.definition;
}

export async function listCustomTripsMeta(): Promise<{ id: string; title: string; updatedAt: number }[]> {
  const rows = await db.customTrips.orderBy('updatedAt').reverse().toArray();
  return rows.map((r) => ({
    id: r.definition.id,
    title: r.definition.title,
    updatedAt: r.updatedAt,
  }));
}
