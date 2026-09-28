import type { JarvisNote, SkillResult, SkillState } from './types';

function listNotes(notes: JarvisNote[]): SkillResult {
  if (notes.length === 0) {
    return { skill: 'notes', response: 'You do not have any saved notes yet.' };
  }

  const noteSummary = notes.map((note, index) => `${index + 1}. ${note.text}`).join(' ');
  return { skill: 'notes', response: `Here are your notes: ${noteSummary}` };
}

export function tryNotes(command: string, state: SkillState): SkillResult | null {
  if (/^(?:list|show|read)(?: my)? notes?$/i.test(command.trim())) {
    return listNotes(state.notes);
  }

  const match = command.match(
    /^(?:save|take|write|remember)(?: a)? note\s*:?\s*(.+)$/i,
  );
  if (!match) return null;

  const note: JarvisNote = {
    id: `note-${Date.now()}`,
    text: match[1].trim(),
    createdAt: new Date().toISOString(),
  };

  return {
    skill: 'notes',
    notes: [...state.notes, note],
    response: `Note saved: ${note.text}`,
  };
}