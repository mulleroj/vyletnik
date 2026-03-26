import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { TripTask } from '../types/trip';
import { addPhotoToTask, getResponse, removePhotoBlob, taskKey, upsertResponse } from '../db/responses';
import { db } from '../db/database';
import type { TaskResponseRecord } from '../types/responses';
import { IconCheck, IconPhoto, IconTask } from './Icons';

type Props = {
  tripId: string;
  stationId: string;
  task: TripTask;
  onSaved: () => void;
};

export function TaskField({ tripId, stationId, task, onSaved }: Props) {
  const key = taskKey(tripId, stationId, task.id);
  const [record, setRecord] = useState<TaskResponseRecord | undefined>();
  const [photoUrls, setPhotoUrls] = useState<{ id: string; url: string }[]>([]);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();

  const reloadRecordAndPhotos = useCallback(async () => {
    const r = await getResponse(tripId, stationId, task.id);
    setRecord(r);
    if (!r?.photoBlobIds?.length) {
      setPhotoUrls((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.url));
        return [];
      });
      return;
    }
    const urls: { id: string; url: string }[] = [];
    for (const pid of r.photoBlobIds) {
      const row = await db.photos.get(pid);
      if (row) urls.push({ id: pid, url: URL.createObjectURL(row.data) });
    }
    setPhotoUrls((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return urls;
    });
  }, [tripId, stationId, task.id]);

  useEffect(() => {
    void reloadRecordAndPhotos();
  }, [reloadRecordAndPhotos]);

  useEffect(
    () => () => {
      photoUrls.forEach((p) => URL.revokeObjectURL(p.url));
    },
    [photoUrls]
  );

  const persist = async (partial: Partial<Omit<TaskResponseRecord, 'key' | 'updatedAt'>>) => {
    const next = await upsertResponse({
      tripId,
      stationId,
      taskId: task.id,
      taskType: task.type,
      ...partial,
    });
    setRecord(next);
    onSaved();
  };

  const handleText = async (value: string) => {
    await persist({ textValue: value });
  };

  const handleChoice = async (index: number) => {
    await persist({ choiceIndex: index });
  };

  const handleCheckbox = async (v: boolean) => {
    await persist({ checkboxValue: v });
  };

  const handlePhotoFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      if (!file || !file.type.startsWith('image/')) continue;
      await addPhotoToTask(tripId, stationId, task.id, task.type, file);
      onSaved();
    }
    await reloadRecordAndPhotos();
  };

  const removePhoto = async (photoId: string) => {
    await removePhotoBlob(photoId, key);
    onSaved();
    await reloadRecordAndPhotos();
  };

  const toggleInProgress = async () => {
    await persist({ inProgress: !record?.inProgress });
  };

  const markComplete = async () => {
    await persist({ completedAt: Date.now(), inProgress: false });
  };

  const textAreaKey = `${key}-${record?.updatedAt ?? 'new'}`;

  return (
    <section className="task-card task-card--module" aria-labelledby={`${baseId}-title`}>
      <div className="task-card__head">
        <span className="task-card__glyph" aria-hidden>
          <IconTask size={22} />
        </span>
        <div className="task-card__head-text">
          <h3 id={`${baseId}-title`} className="task-card__title">
            {task.title}
          </h3>
          {task.points != null && (
            <span className="task-card__points" title="Body (příprava na gamifikaci)">
              +{task.points} b
            </span>
          )}
        </div>
      </div>
      {task.description && <p className="task-card__desc">{task.description}</p>}

      {task.type === 'text' && (
        <label className="field">
          <span className="field__label">Odpověď</span>
          <textarea
            key={textAreaKey}
            className="input input--area"
            rows={4}
            defaultValue={record?.textValue ?? ''}
            onBlur={(e) => void handleText(e.target.value)}
          />
        </label>
      )}

      {task.type === 'reflection' && (
        <label className="field">
          <span className="field__label">Reflexe / komentář</span>
          <textarea
            key={textAreaKey}
            className="input input--area"
            rows={5}
            placeholder="Co tě na tom zaujalo? Co bys sdělil spolužákům?"
            defaultValue={record?.textValue ?? ''}
            onBlur={(e) => void handleText(e.target.value)}
          />
        </label>
      )}

      {task.type === 'choice' && task.options && (
        <div className="field" role="radiogroup" aria-label={task.title}>
          <span className="field__label">Vyber možnost</span>
          <div className="choice-list">
            {task.options.map((opt, idx) => (
              <label key={idx} className="choice-item">
                <input
                  type="radio"
                  name={`${baseId}-choice`}
                  checked={record?.choiceIndex === idx}
                  onChange={() => void handleChoice(idx)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {task.type === 'checkbox' && (
        <div className="field">
          <span className="field__label">Splnění úkolu</span>
          <div className="btn-row">
            <button
              type="button"
              className={`btn btn--choice ${record?.checkboxValue === true ? 'is-active' : ''}`}
              onClick={() => void handleCheckbox(true)}
            >
              Splněno
            </button>
            <button
              type="button"
              className={`btn btn--choice ${record?.checkboxValue === false ? 'is-active' : ''}`}
              onClick={() => void handleCheckbox(false)}
            >
              Nesplněno
            </button>
          </div>
        </div>
      )}

      {task.type === 'photo' && (
        <div className="field">
          <span className="field__label">Fotografie k úkolu</span>
          <div className="btn-row">
            <button type="button" className="btn btn--secondary btn--icon" onClick={() => galleryInputRef.current?.click()}>
              <IconPhoto size={20} />
              Galerie
            </button>
            <button type="button" className="btn btn--accent btn--icon" onClick={() => cameraInputRef.current?.click()}>
              <IconPhoto size={20} />
              Fotoaparát
            </button>
          </div>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="visually-hidden"
            multiple
            onChange={(e) => void handlePhotoFiles(e.target.files)}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="visually-hidden"
            onChange={(e) => void handlePhotoFiles(e.target.files)}
          />
          <ul className="photo-preview-list">
            {photoUrls.map((p) => (
              <li key={p.id} className="photo-preview">
                <img src={p.url} alt="Náhled uložené fotografie" />
                <button type="button" className="btn btn--small btn--danger" onClick={() => void removePhoto(p.id)}>
                  Odstranit
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="task-card__footer">
        <label className="inline-check">
          <input type="checkbox" checked={Boolean(record?.inProgress)} onChange={() => void toggleInProgress()} />
          Označit jako rozpracováno
        </label>
        <button type="button" className="btn btn--ghost btn--icon" onClick={() => void markComplete()}>
          <IconCheck size={20} />
          Potvrdit splnění
        </button>
      </div>
    </section>
  );
}
