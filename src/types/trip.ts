/**
 * Typy úkolů – rozšiřitelné (např. bodování, odznaky).
 * Každý typ má v UI vlastní komponentu v TaskField.
 */
export type TaskType = 'text' | 'choice' | 'checkbox' | 'photo' | 'reflection';

/** Jeden úkol na stanovišti */
export interface TripTask {
  id: string;
  title: string;
  /** Volitelný delší popis nebo zadání */
  description?: string;
  type: TaskType;
  /** Pro typ `choice` – možnosti výběru */
  options?: string[];
  /** Volitelné body pro budoucí gamifikaci */
  points?: number;
}

/** Stanoviště / modul výletu */
export interface Station {
  id: string;
  title: string;
  description?: string;
  tasks: TripTask[];
}

/** Definice výletu načtená z JSON (admin bez kódu) */
export interface TripDefinition {
  id: string;
  title: string;
  /** Krátký úvod pro žáky */
  description?: string;
  /** Instrukce na úvodní obrazovce */
  instructions?: string;
  /** Volitelný e-mail učitele pro mailto export */
  teacherEmail?: string;
  stations: Station[];
  /** Verze schématu pro budoucí migrace */
  schemaVersion?: number;
}

/** Stav splnění stanoviště z pohledu žáka */
export type StationProgress = 'not_started' | 'in_progress' | 'done';
