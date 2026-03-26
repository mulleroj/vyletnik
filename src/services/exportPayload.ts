import { db } from '../db/database';
import { getProfile } from '../db/session';
import { taskKey } from '../db/responses';
import type { TripDefinition, TripTask } from '../types/trip';
import type { TaskResponseRecord } from '../types/responses';

/** Seskupená data pro export (JSON, PDF, mailto, budoucí webhook) */
export interface ExportPayload {
  exportedAt: string;
  studentName: string;
  groupName: string;
  tripId: string;
  tripTitle: string;
  stations: {
    stationId: string;
    stationTitle: string;
    tasks: {
      taskId: string;
      taskTitle: string;
      taskType: string;
      textValue?: string;
      choiceIndex?: number;
      choiceLabel?: string;
      checkboxValue?: boolean;
      /** Base64 data URL pro JSON – u velkých exportů zvažte jen metadata */
      photos: { id: string; dataUrl: string; mimeType: string }[];
      inProgress?: boolean;
      updatedAt?: number;
      completedAt?: number;
    }[];
  }[];
}

type TaskRow = ExportPayload['stations'][0]['tasks'][0];

async function buildTaskRow(
  taskDef: TripTask | undefined,
  r: TaskResponseRecord | undefined,
): Promise<TaskRow> {
  const photos: TaskRow['photos'] = [];
  if (r?.photoBlobIds?.length) {
    for (const pid of r.photoBlobIds) {
      const blobRow = await db.photos.get(pid);
      if (blobRow) {
        const dataUrl = await blobToDataUrl(blobRow.data);
        photos.push({ id: pid, dataUrl, mimeType: blobRow.mimeType });
      }
    }
  }
  const taskType = taskDef?.type ?? r?.taskType ?? 'text';
  let choiceLabel: string | undefined;
  if (taskType === 'choice' && r?.choiceIndex != null && taskDef?.options?.[r.choiceIndex]) {
    choiceLabel = taskDef.options[r.choiceIndex];
  } else if (taskType === 'choice' && r?.choiceIndex != null && !taskDef?.options?.length) {
    choiceLabel = `Možnost č. ${r.choiceIndex + 1}`;
  }
  return {
    taskId: taskDef?.id ?? r?.taskId ?? '',
    taskTitle: taskDef?.title ?? (r ? `Úkol (${r.taskId})` : ''),
    taskType,
    textValue: r?.textValue,
    choiceIndex: r?.choiceIndex,
    choiceLabel,
    checkboxValue: r?.checkboxValue,
    photos,
    inProgress: r?.inProgress,
    updatedAt: r?.updatedAt,
    completedAt: r?.completedAt,
  };
}

/**
 * Sestaví payload podle aktuální definice výletu a doplní všechny uložené odpovědi z DB.
 * Odpovědi, které v šabloně nejsou (starší cache JSON, doplněné úkoly), se přidají
 * pod příslušné stanoviště, aby v PDF nechyběly.
 */
export async function buildExportPayload(trip: TripDefinition): Promise<ExportPayload> {
  const profile = await getProfile();
  if (!profile) throw new Error('Chybí profil žáka.');

  const allResponses = await db.responses.where('tripId').equals(trip.id).toArray();
  const byKey = new Map(allResponses.map((r) => [r.key, r]));

  const stationMeta = new Map(trip.stations.map((s) => [s.id, s]));
  const taskMeta = new Map<string, TripTask>();
  for (const st of trip.stations) {
    for (const t of st.tasks) {
      taskMeta.set(`${st.id}::${t.id}`, t);
    }
  }

  const definedKeys = new Set<string>();
  for (const st of trip.stations) {
    for (const t of st.tasks) {
      definedKeys.add(taskKey(trip.id, st.id, t.id));
    }
  }

  type Acc = { stationId: string; stationTitle: string; tasks: TaskRow[] };
  const stationsAcc = new Map<string, Acc>();
  const stationOrder: string[] = [];

  for (const st of trip.stations) {
    stationsAcc.set(st.id, {
      stationId: st.id,
      stationTitle: st.title,
      tasks: [],
    });
    stationOrder.push(st.id);
  }

  for (const st of trip.stations) {
    const acc = stationsAcc.get(st.id)!;
    for (const t of st.tasks) {
      const k = taskKey(trip.id, st.id, t.id);
      const r = byKey.get(k);
      acc.tasks.push(await buildTaskRow(t, r));
    }
  }

  const orphanResponses = allResponses.filter((r) => !definedKeys.has(r.key));
  const byOrphanStation = new Map<string, TaskResponseRecord[]>();
  for (const r of orphanResponses) {
    const arr = byOrphanStation.get(r.stationId) ?? [];
    arr.push(r);
    byOrphanStation.set(r.stationId, arr);
  }

  const orphanStationIds = Array.from(byOrphanStation.keys()).sort();
  for (const sid of orphanStationIds) {
    const records = byOrphanStation.get(sid)!;
    records.sort((a, b) => a.taskId.localeCompare(b.taskId));

    let acc = stationsAcc.get(sid);
    if (!acc) {
      acc = {
        stationId: sid,
        stationTitle: stationMeta.get(sid)?.title ?? `Stanoviště (${sid})`,
        tasks: [],
      };
      stationsAcc.set(sid, acc);
      stationOrder.push(sid);
    }

    for (const r of records) {
      const tDef = taskMeta.get(`${sid}::${r.taskId}`);
      acc.tasks.push(await buildTaskRow(tDef, r));
    }
  }

  const stations = stationOrder.map((id) => stationsAcc.get(id)!);

  return {
    exportedAt: new Date().toISOString(),
    studentName: profile.studentName,
    groupName: profile.groupName,
    tripId: trip.id,
    tripTitle: trip.title,
    stations,
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
