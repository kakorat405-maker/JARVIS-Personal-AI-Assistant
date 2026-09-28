import type { SkillResult } from './types';

export function tryConversation(command: string): SkillResult | null {
  const normalized = command.trim().toLowerCase();

  if (/^(hi|hello|hey)(\s+jarvis)?[!.?]*$/.test(normalized)) {
    return {
      skill: 'conversation',
      response: 'Hello. I am JARVIS, online and ready to help.',
    };
  }

  if (/\b(what can you do|what do you do|your capabilities|help)\b/.test(normalized)) {
    return {
      skill: 'conversation',
      response:
        'I can calculate, tell you the date or time, set timers, manage tasks, and save or read notes.',
    };
  }

  return null;
}