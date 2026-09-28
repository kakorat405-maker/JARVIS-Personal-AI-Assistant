import type { JarvisTimer, SkillResult } from './types';

function parseDuration(command: string): { durationMs: number; label: string } | null {
  const match = command.match(
    /(?:timer|countdown)(?:\s+for)?\s+(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)/i,
  );
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multiplier = unit.startsWith('hour')
    ? 60 * 60 * 1000
    : unit.startsWith('min')
      ? 60 * 1000
      : 1000;

  return { durationMs: amount * multiplier, label: `${amount} ${match[2]}` };
}

export function tryTimer(command: string): SkillResult | null {
  if (!/\b(timer|countdown)\b/i.test(command)) return null;
  const duration = parseDuration(command);

  if (!duration) {
    return {
      skill: 'timer',
      response: 'Tell me how long to set the timer, such as “Set a timer for 5 minutes”.',
    };
  }

  const timer: JarvisTimer = {
    id: `timer-${Date.now()}`,
    ...duration,
  };

  return {
    skill: 'timer',
    response: `Timer set for ${duration.label}. I will let you know when it is complete.`,
    timer,
  };
}