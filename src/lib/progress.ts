import type { TaskType } from '../types/trip';
import type { TripDefinition } from '../types/trip';
import type { TaskResponseRecord } from '../types/responses';
import type { StationProgress } from '../types/trip';
import { taskKey } from '../db/responses';

/** Má úkol vyplněnou odpověď (pro indikátor splnění)? */
export function taskFilled(r: TaskResponseRecord | undefined, type: TaskType): boolean {
  if (!r) return false;
  switch (type) {
    case 'text':
    case 'reflection':
      return Boolean(r.textValue?.trim());
    case 'choice':
      return r.choiceIndex != null && r.choiceIndex >= 0;
    case 'checkbox':
      return r.checkboxValue === true || r.checkboxValue === false;
    case 'photo':
      return (r.photoBlobIds?.length ?? 0) > 0;
    default:
      return false;
  }
}

export function stationProgress(
  trip: TripDefinition,
  stationId: string,
  responses: Map<string, TaskResponseRecord>
): { done: number; total: number; status: StationProgress } {
  const st = trip.stations.find((s) => s.id === stationId);
  if (!st) return { done: 0, total: 0, status: 'not_started' };
  const total = st.tasks.length;
  let done = 0;
  let anyTouch = false;
  for (const t of st.tasks) {
    const key = taskKey(trip.id, stationId, t.id);
    const r = responses.get(key);
    if (r?.inProgress || taskFilled(r, t.type)) anyTouch = true;
    if (taskFilled(r, t.type)) done++;
  }
  let status: StationProgress = 'not_started';
  if (done >= total && total > 0) status = 'done';
  else if (anyTouch || done > 0) status = 'in_progress';
  return { done, total, status };
}

/** Součet splněných úkolů napříč celým výletem (bonusový ukazatel) */
export function tripTaskCounts(
  trip: TripDefinition,
  responses: Map<string, TaskResponseRecord>
): { completed: number; total: number } {
  let completed = 0;
  let total = 0;
  for (const st of trip.stations) {
    for (const t of st.tasks) {
      total++;
      const r = responses.get(taskKey(trip.id, st.id, t.id));
      if (taskFilled(r, t.type)) completed++;
    }
  }
  return { completed, total };
}
