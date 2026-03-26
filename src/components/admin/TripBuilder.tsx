import { useState, type ChangeEvent } from 'react';
import type { Station, TaskType, TripDefinition, TripTask } from '../../types/trip';
import { saveCustomTrip, deleteCustomTrip } from '../../db/customTrips';
import {
  newStation,
  newTask,
  newTripTemplate,
  validateTrip,
  tripToJsonFile,
} from './tripBuilderUtils';

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'text', label: 'Textová odpověď' },
  { value: 'choice', label: 'Výběr z možností' },
  { value: 'checkbox', label: 'Splněno / nesplněno' },
  { value: 'photo', label: 'Fotografie' },
  { value: 'reflection', label: 'Reflexe / komentář' },
];

function notifyTripsChanged() {
  window.dispatchEvent(new CustomEvent('vyletnik-custom-trips-changed'));
}

type Props = {
  onMessage: (msg: string | null) => void;
};

/**
 * Vizuální sestavení výletu bez ručního JSON – uložení do prohlížeče nebo export souboru.
 */
export function TripBuilder({ onMessage }: Props) {
  const [trip, setTrip] = useState<TripDefinition>(() => newTripTemplate());

  const updateTrip = (patch: Partial<TripDefinition>) => {
    setTrip((prev) => ({ ...prev, ...patch }));
  };

  const updateStation = (si: number, patch: Partial<Station>) => {
    setTrip((prev) => {
      const stations = [...prev.stations];
      const cur = stations[si];
      if (!cur) return prev;
      stations[si] = { ...cur, ...patch } as Station;
      return { ...prev, stations };
    });
  };

  const updateTask = (si: number, ti: number, patch: Partial<TripTask>) => {
    setTrip((prev) => {
      const stations = [...prev.stations];
      const st = stations[si];
      if (!st) return prev;
      const tasks = [...st.tasks];
      const cur = tasks[ti];
      if (!cur) return prev;
      let next: TripTask = { ...cur, ...patch };
      if (patch.type != null && patch.type !== 'choice') {
        next = { ...next, options: undefined };
      }
      if (patch.type === 'choice' && !next.options?.length) {
        next = { ...next, options: ['Možnost A', 'Možnost B'] };
      }
      tasks[ti] = next;
      stations[si] = { ...st, tasks };
      return { ...prev, stations };
    });
  };

  const addStation = () => {
    setTrip((prev) => ({
      ...prev,
      stations: [...prev.stations, newStation(prev.stations.length + 1)],
    }));
  };

  const removeStation = (si: number) => {
    setTrip((prev) => ({
      ...prev,
      stations: prev.stations.filter((_, i) => i !== si),
    }));
  };

  const addTask = (si: number) => {
    setTrip((prev) => {
      const stations = [...prev.stations];
      const st = stations[si];
      if (!st) return prev;
      const tasks = [...st.tasks, newTask('text')];
      stations[si] = { ...st, tasks };
      return { ...prev, stations };
    });
  };

  const removeTask = (si: number, ti: number) => {
    setTrip((prev) => {
      const stations = [...prev.stations];
      const st = stations[si];
      if (!st) return prev;
      const tasks = st.tasks.filter((_, i) => i !== ti);
      stations[si] = { ...st, tasks };
      return { ...prev, stations };
    });
  };

  const handleSaveLocal = async () => {
    onMessage(null);
    const err = validateTrip(trip);
    if (err) {
      onMessage(err);
      return;
    }
    await saveCustomTrip(trip);
    notifyTripsChanged();
    onMessage('Uloženo v tomto prohlížeči – výlet najdeš na úvodní stránce v sekci „Uložené v prohlížeči“.');
  };

  const handleDownload = () => {
    onMessage(null);
    const err = validateTrip(trip);
    if (err) {
      onMessage(err);
      return;
    }
    tripToJsonFile(trip);
    onMessage('Soubor stažen. Pro trvalé nasazení ho přidej do public/trips/ a index.json v projektu.');
  };

  const handleDeleteLocal = async () => {
    onMessage(null);
    if (!window.confirm(`Opravdu smazat výlet „${trip.id}“ z tohoto prohlížeče?`)) return;
    await deleteCustomTrip(trip.id);
    notifyTripsChanged();
    setTrip(newTripTemplate());
    onMessage('Výlet smazán z prohlížeče.');
  };

  const handleLoadExample = async () => {
    onMessage(null);
    try {
      const url = `${import.meta.env.BASE_URL}trips/revize-arealu-rs-bajtlich.json`.replace(/\/+/g, '/');
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as TripDefinition;
      setTrip(data);
      onMessage('Načten ukázkový výlet – uprav a ulož.');
    } catch {
      onMessage('Ukázku se nepodařilo načíst.');
    }
  };

  const handleImportFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as TripDefinition;
        if (!data.id || !data.stations) throw new Error('Neplatná struktura');
        setTrip(data);
        onMessage('JSON načten do průvodce.');
      } catch {
        onMessage('Soubor není platný výlet (JSON).');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="trip-builder">
      <section className="card card--panel">
        <h2 className="card__title">Údaje o výletu</h2>
        <div className="trip-builder__grid">
          <label className="field">
            <span className="field__label">ID výletu (v URL, bez mezer)</span>
            <input
              className="input"
              value={trip.id}
              onChange={(e) => updateTrip({ id: e.target.value.trim() })}
              spellCheck={false}
              autoComplete="off"
            />
          </label>
          <label className="field">
            <span className="field__label">Název</span>
            <input className="input" value={trip.title} onChange={(e) => updateTrip({ title: e.target.value })} />
          </label>
          <label className="field trip-builder__full">
            <span className="field__label">Krátký popis (volitelné)</span>
            <input className="input" value={trip.description ?? ''} onChange={(e) => updateTrip({ description: e.target.value })} />
          </label>
          <label className="field trip-builder__full">
            <span className="field__label">Instrukce pro žáky</span>
            <textarea
              className="input input--area"
              rows={3}
              value={trip.instructions ?? ''}
              onChange={(e) => updateTrip({ instructions: e.target.value })}
            />
          </label>
          <label className="field trip-builder__full">
            <span className="field__label">E-mail učitele (Outlook / mailto)</span>
            <input
              className="input"
              type="email"
              value={trip.teacherEmail ?? ''}
              onChange={(e) => updateTrip({ teacherEmail: e.target.value })}
            />
          </label>
        </div>
      </section>

      {trip.stations.map((st, si) => (
        <section key={st.id} className="card card--panel trip-builder__station">
          <div className="trip-builder__station-head">
            <h2 className="card__title">Stanoviště {si + 1}</h2>
            {trip.stations.length > 1 && (
              <button type="button" className="btn btn--danger btn--small" onClick={() => removeStation(si)}>
                Odstranit stanoviště
              </button>
            )}
          </div>
          <div className="trip-builder__grid">
            <label className="field">
              <span className="field__label">ID stanoviště</span>
              <input
                className="input"
                value={st.id}
                onChange={(e) => updateStation(si, { id: e.target.value.trim() })}
                spellCheck={false}
              />
            </label>
            <label className="field">
              <span className="field__label">Název</span>
              <input className="input" value={st.title} onChange={(e) => updateStation(si, { title: e.target.value })} />
            </label>
            <label className="field trip-builder__full">
              <span className="field__label">Popis místa (volitelné)</span>
              <input className="input" value={st.description ?? ''} onChange={(e) => updateStation(si, { description: e.target.value })} />
            </label>
          </div>

          <h3 className="trip-builder__h3">Úkoly</h3>
          {st.tasks.map((task, ti) => (
            <div key={task.id} className="trip-builder__task">
              <div className="trip-builder__task-head">
                <span className="trip-builder__task-num">Úkol {ti + 1}</span>
                {st.tasks.length > 1 && (
                  <button type="button" className="btn btn--ghost btn--small" onClick={() => removeTask(si, ti)}>
                    Odebrat úkol
                  </button>
                )}
              </div>
              <div className="trip-builder__grid">
                <label className="field">
                  <span className="field__label">ID úkolu (jedinečné v celém výletu)</span>
                  <input
                    className="input"
                    value={task.id}
                    onChange={(e) => updateTask(si, ti, { id: e.target.value.trim() })}
                    spellCheck={false}
                  />
                </label>
                <label className="field">
                  <span className="field__label">Typ úkolu</span>
                  <select
                    className="input"
                    value={task.type}
                    onChange={(e) => updateTask(si, ti, { type: e.target.value as TaskType })}
                  >
                    {TASK_TYPES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field trip-builder__full">
                  <span className="field__label">Zadání / otázka</span>
                  <input className="input" value={task.title} onChange={(e) => updateTask(si, ti, { title: e.target.value })} />
                </label>
                <label className="field trip-builder__full">
                  <span className="field__label">Doplňující text (volitelné)</span>
                  <input
                    className="input"
                    value={task.description ?? ''}
                    onChange={(e) => updateTask(si, ti, { description: e.target.value })}
                  />
                </label>
                {task.type === 'choice' && (
                  <label className="field trip-builder__full">
                    <span className="field__label">Možnosti výběru (každý řádek = jedna možnost)</span>
                    <textarea
                      className="input input--area"
                      rows={4}
                      value={(task.options ?? []).join('\n')}
                      onChange={(e) =>
                        updateTask(si, ti, {
                          options: e.target.value
                            .split('\n')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </label>
                )}
                <label className="field">
                  <span className="field__label">Body (volitelné, gamifikace)</span>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    value={task.points ?? ''}
                    onChange={(e) =>
                      updateTask(si, ti, {
                        points: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                  />
                </label>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn--secondary" onClick={() => addTask(si)}>
            + Přidat úkol
          </button>
        </section>
      ))}

      <button type="button" className="btn btn--secondary trip-builder__add-st" onClick={addStation}>
        + Přidat stanoviště
      </button>

      <div className="card card--panel trip-builder__actions">
        <h2 className="card__title">Uložení</h2>
        <p className="hint">
          <strong>Do prohlížeče</strong> – okamžitě zkusíš výlet na úvodní stránce (sekce „Uložené v prohlížeči“).{' '}
          <strong>Stáhnout JSON</strong> – soubor pro složku <code>public/trips/</code> při nasazení na web.
        </p>
        <div className="btn-row btn-row--stack">
          <button type="button" className="btn btn--accent btn--large" onClick={() => void handleSaveLocal()}>
            Uložit do aplikace (prohlížeč)
          </button>
          <button type="button" className="btn btn--primary btn--large" onClick={handleDownload}>
            Stáhnout JSON soubor
          </button>
          <button type="button" className="btn btn--danger" onClick={() => void handleDeleteLocal()}>
            Smazat tento výlet z prohlížeče
          </button>
        </div>
        <div className="trip-builder__secondary-actions">
          <button type="button" className="btn btn--ghost" onClick={() => void handleLoadExample()}>
            Načíst ukázkový výlet do průvodce
          </button>
          <label className="btn btn--ghost trip-builder__file">
            Načíst JSON ze souboru
            <input type="file" accept="application/json,.json" className="visually-hidden" onChange={handleImportFile} />
          </label>
        </div>
      </div>
    </div>
  );
}
