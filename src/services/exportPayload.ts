import { db } from '../db/database';
import { getProfile } from '../db/session';
import { taskKey } from '../db/responses';
import type { TripDefinition } from '../types/trip';
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

export async function buildExportPayload(trip: TripDefinition): Promise<ExportPayload> {
  const profile = await getProfile();
  if (!profile) throw new Error('Chybí profil žáka.');

  const allResponses = await db.responses.where('tripId').equals(trip.id).toArray();
  const byKey = new Map(allResponses.map((r) => [r.key, r]));

  const stations = await Promise.all(
    trip.stations.map(async (st) => {
      const tasks = await Promise.all(
        st.tasks.map(async (t) => {
          const key = taskKey(trip.id, st.id, t.id);
          const r: TaskResponseRecord | undefined = byKey.get(key);
          const photos: ExportPayload['stations'][0]['tasks'][0]['photos'] = [];
          if (r?.photoBlobIds?.length) {
            for (const pid of r.photoBlobIds) {
              const blobRow = await db.photos.get(pid);
              if (blobRow) {
                const dataUrl = await blobToDataUrl(blobRow.data);
                photos.push({ id: pid, dataUrl, mimeType: blobRow.mimeType });
              }
            }
          }
          let choiceLabel: string | undefined;
          if (t.type === 'choice' && r?.choiceIndex != null && t.options?.[r.choiceIndex]) {
            choiceLabel = t.options[r.choiceIndex];
          }
          return {
            taskId: t.id,
            taskTitle: t.title,
            taskType: t.type,
            textValue: r?.textValue,
            choiceIndex: r?.choiceIndex,
            choiceLabel,
            checkboxValue: r?.checkboxValue,
            photos,
            inProgress: r?.inProgress,
            updatedAt: r?.updatedAt,
            completedAt: r?.completedAt,
          };
        })
      );
      return {
        stationId: st.id,
        stationTitle: st.title,
        tasks,
      };
    })
  );

  return {
    exportedAt: new Date().toISOString(),
    studentName: profile.studentName,
    groupName: profile.groupName,
    tripId: trip.id,
    tripTitle: profile.tripTitle || trip.title,
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
