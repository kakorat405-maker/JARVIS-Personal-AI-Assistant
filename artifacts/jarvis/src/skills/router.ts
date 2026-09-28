import { tryCalculator } from './calculator';
import { tryConversation } from './conversation';
import { tryDateTime } from './datetime';
import { tryNotes } from './notes';
import { tryTasks } from './tasks';
import { tryTimer } from './timer';
import type { SkillResult, SkillState } from './types';

export function routeCommand(command: string, state: SkillState): SkillResult {
  return (
    tryCalculator(command) ??
    tryDateTime(command, state.now) ??
    tryTimer(command) ??
    tryTasks(command, state) ??
    tryNotes(command, state) ??
    tryConversation(command) ?? {
      skill: 'fallback',
      response: "I don't have a skill for that yet, but I am ready to learn.",
    }
  );
}