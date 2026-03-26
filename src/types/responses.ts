import type { TaskType } from './trip';

/** Uložená odpověď k jednomu úkolu (IndexedDB) */
export interface TaskResponseRecord {
  /** tripId_stationId_taskId */
  key: string;
  tripId: string;
  stationId: string;
  taskId: string;
  taskType: TaskType;
  /** Text, reflexe, nebo serializovaný výběr */
  textValue?: string;
  /** Index vybrané možnosti */
  choiceIndex?: number;
  checkboxValue?: boolean;
  /** ID blobů fotek v tabulce photoBlobs */
  photoBlobIds: string[];
  /** Označení rozpracováno (bonus) */
  inProgress?: boolean;
  /** Čas poslední úpravy */
  updatedAt: number;
  /** Čas označení jako hotové (volitelně) */
  completedAt?: number;
}

/** Jeden řádek v tabulce fotek */
export interface PhotoBlobRecord {
  id: string;
  /** Odkaz na task key */
  taskKey: string;
  mimeType: string;
  data: Blob;
  createdAt: number;
}

/** Profil sezení žáka (jméno, skupina, aktivní výlet) */
export interface SessionProfile {
  id: string;
  studentName: string;
  groupName: string;
  tripId: string;
  /** Snapshot názvu výletu pro export */
  tripTitle: string;
  createdAt: number;
}
