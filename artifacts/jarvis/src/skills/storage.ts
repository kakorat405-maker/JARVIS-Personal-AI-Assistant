import type { JarvisNote, JarvisTask } from './types';

const TASKS_KEY = 'jarvis.tasks';
const NOTES_KEY = 'jarvis.notes';

function load<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(key);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, value: T[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export const loadTasks = () => load<JarvisTask>(TASKS_KEY);
export const loadNotes = () => load<JarvisNote>(NOTES_KEY);
export const saveTasks = (tasks: JarvisTask[]) => save(TASKS_KEY, tasks);
export const saveNotes = (notes: JarvisNote[]) => save(NOTES_KEY, notes);