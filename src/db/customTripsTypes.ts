import type { TripDefinition } from '../types/trip';

/** Výlet uložený průvodcem v tomto prohlížeči (IndexedDB) */
export interface CustomTripRecord {
  id: string;
  definition: TripDefinition;
  updatedAt: number;
}
