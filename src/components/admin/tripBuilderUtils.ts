import type { Station, TripDefinition, TripTask, TaskType } from '../../types/trip';

function shortId() {
  return crypto.randomUUID().slice(0, 8);
}

export function newTripTemplate(): TripDefinition {
  return {
    id: `vylet-${shortId()}`,
    schemaVersion: 1,
    title: 'Nový výlet',
    description: '',
    instructions: '',
    teacherEmail: '',
    stations: [newStation(1)],
  };
}

export function newStation(index: number): Station {
  return {
    id: `st-${shortId()}`,
    title: `Stanoviště ${index}`,
    description: '',
    tasks: [newTask('text')],
  };
}

export function newTask(type: TaskType): TripTask {
  const base: TripTask = {
    id: `t-${shortId()}`,
    title: 'Nový úkol',
    type,
    description: '',
  };
  if (type === 'choice') {
    return { ...base, options: ['Možnost A', 'Možnost B'] };
  }
  return base;
}

/** Kontrola před uložením */
export function validateTrip(def: TripDefinition): string | null {
  if (!def.id.trim()) return 'Vyplň identifikátor výletu (id).';
  if (!/^[a-z0-9_-]+$/i.test(def.id.trim())) return 'ID výletu: jen písmena, čísla, pomlčka a podtržítko (bez mezer).';
  if (!def.title.trim()) return 'Vyplň název výletu.';
  if (!def.stations.length) return 'Přidej alespoň jedno stanoviště.';
  const taskIds = new Set<string>();
  for (const st of def.stations) {
    if (!st.id.trim()) return 'Každé stanoviště musí mít ID.';
    if (!st.title.trim()) return 'Vyplň název u všech stanovišť.';
    if (!st.tasks.length) return `Stanoviště „${st.title}“: přidej alespoň jeden úkol.`;
    for (const t of st.tasks) {
      if (!t.id.trim()) return 'Každý úkol musí mít ID.';
      if (taskIds.has(t.id)) return `Duplicitní ID úkolu: ${t.id}`;
      taskIds.add(t.id);
      if (!t.title.trim()) return 'Vyplň text u všech úkolů.';
      if (t.type === 'choice' && (!t.options || t.options.filter(Boolean).length < 2)) {
        return `Úkol „${t.title}“: u typu výběr zadej alespoň 2 možnosti.`;
      }
    }
  }
  return null;
}

export function tripToJsonFile(def: TripDefinition): void {
  const blob = new Blob([JSON.stringify(def, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${def.id}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
