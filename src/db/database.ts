import Dexie, { type Table } from 'dexie';
import type { PhotoBlobRecord, SessionProfile, TaskResponseRecord } from '../types/responses';
import type { CustomTripRecord } from './customTripsTypes';

/**
 * Offline-first úložiště: odpovědi + fotky + profil + vlastní výlety (editor).
 */
export class VyletnikDB extends Dexie {
  responses!: Table<TaskResponseRecord, string>;
  photos!: Table<PhotoBlobRecord, string>;
  profile!: Table<SessionProfile, string>;
  customTrips!: Table<CustomTripRecord, string>;

  constructor() {
    super('vyletnik_db');
    this.version(1).stores({
      responses: 'key, tripId, stationId, taskId, updatedAt',
      photos: 'id, taskKey, createdAt',
      profile: 'id, tripId',
    });
    this.version(2).stores({
      responses: 'key, tripId, stationId, taskId, updatedAt',
      photos: 'id, taskKey, createdAt',
      profile: 'id, tripId',
      customTrips: 'id, updatedAt',
    });
  }
}

export const db = new VyletnikDB();
