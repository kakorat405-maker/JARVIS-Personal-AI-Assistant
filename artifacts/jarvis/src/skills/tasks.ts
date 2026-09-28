import type { JarvisTask, SkillResult, SkillState } from './types';

function listTasks(tasks: JarvisTask[]): SkillResult {
  if (tasks.length === 0) {
    return { skill: 'tasks', response: 'You do not have any tasks yet.' };
  }

  const taskSummary = tasks
    .map((task, index) => `${index + 1}. ${task.text}${task.due ? ` (${task.due})` : ''}`)
    .join(' ');

  return { skill: 'tasks', response: `Here are your tasks: ${taskSummary}` };
}

export function tryTasks(command: string, state: SkillState): SkillResult | null {
  const normalized = command.toLowerCase();
  if (/\b(list|show|what are)\b.*\b(tasks?|reminders?)\b/.test(normalized)) {
    return listTasks(state.tasks);
  }

  const match = command.match(
    /^(?:remind me to|create (?:a )?task to|add (?:a )?task(?: to)?|task:?)\s+(.+?)(?:\s+(today|tomorrow|tonight|next week))?$/i,
  );
  if (!match) return null;

  const task: JarvisTask = {
    id: `task-${Date.now()}`,
    text: match[1].trim(),
    due: match[2]?.toLowerCase(),
    createdAt: new Date().toISOString(),
  };

  return {
    skill: 'tasks',
    tasks: [...state.tasks, task],
    response: `Task added: ${task.text}${task.due ? ` for ${task.due}` : ''}.`,
  };
}