import { db } from './database';
import type { TaskResponseRecord } from '../types/responses';
import type { TaskType } from '../types/trip';

export function taskKey(tripId: string, stationId: string, taskId: string): string {
  return `${tripId}::${stationId}::${taskId}`;
}

/** Jedinečná ID výletů, ke kterým existuje alespoň jeden záznam odpovědi (IndexedDB). */
export async function listTripIdsWithResponses(): Promise<string[]> {
  const rows = await db.responses.toArray();
  const ids = new Set<string>();
  for (const r of rows) {
    ids.add(r.tripId);
  }
  return Array.from(ids).sort();
}

export async function getResponse(
  tripId: string,
  stationId: string,
  taskId: string
): Promise<TaskResponseRecord | undefined> {
  return db.responses.get(taskKey(tripId, stationId, taskId));
}

export async function upsertResponse(
  partial: Partial<Omit<TaskResponseRecord, 'key' | 'updatedAt'>> &
    Pick<TaskResponseRecord, 'tripId' | 'stationId' | 'taskId' | 'taskType'>
): Promise<TaskResponseRecord> {
  const key = taskKey(partial.tripId, partial.stationId, partial.taskId);
  const existing = await db.responses.get(key);
  const next: TaskResponseRecord = {
    key,
    tripId: partial.tripId,
    stationId: partial.stationId,
    taskId: partial.taskId,
    taskType: partial.taskType,
    textValue: partial.textValue ?? existing?.textValue,
    choiceIndex: partial.choiceIndex ?? existing?.choiceIndex,
    checkboxValue: partial.checkboxValue ?? existing?.checkboxValue,
    photoBlobIds: partial.photoBlobIds ?? existing?.photoBlobIds ?? [],
    inProgress: partial.inProgress ?? existing?.inProgress,
    completedAt: partial.completedAt ?? existing?.completedAt,
    updatedAt: Date.now(),
  };
  await db.responses.put(next);
  return next;
}

/** Smazání fotky z DB a z odkazů v odpovědi */
export async function removePhotoBlob(blobId: string, taskKeyStr: string): Promise<void> {
  await db.photos.delete(blobId);
  const r = await db.responses.get(taskKeyStr);
  if (r) {
    r.photoBlobIds = (r.photoBlobIds ?? []).filter((id) => id !== blobId);
    r.updatedAt = Date.now();
    await db.responses.put(r);
  }
}

export async function addPhotoToTask(
  tripId: string,
  stationId: string,
  taskId: string,
  taskType: TaskType,
  blob: Blob
): Promise<{ record: TaskResponseRecord; photoId: string }> {
  const key = taskKey(tripId, stationId, taskId);
  const photoId = crypto.randomUUID();
  await db.photos.add({
    id: photoId,
    taskKey: key,
    mimeType: blob.type || 'image/jpeg',
    data: blob,
    createdAt: Date.now(),
  });
  const existing = await getResponse(tripId, stationId, taskId);
  const photoBlobIds = [...(existing?.photoBlobIds ?? []), photoId];
  const record = await upsertResponse({
    tripId,
    stationId,
    taskId,
    taskType,
    textValue: existing?.textValue,
    choiceIndex: existing?.choiceIndex,
    checkboxValue: existing?.checkboxValue,
    inProgress: existing?.inProgress,
    completedAt: existing?.completedAt,
    photoBlobIds,
  });
  return { record, photoId };
}

export async function getPhotosForTask(taskKeyStr: string) {
  return db.photos.where('taskKey').equals(taskKeyStr).toArray();
}
