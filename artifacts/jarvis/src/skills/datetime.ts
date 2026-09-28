import type { SkillResult } from './types';

export function tryDateTime(command: string, now: Date): SkillResult | null {
  const normalized = command.toLowerCase();
  if (!/\b(time|date|today|day)\b/.test(normalized)) return null;

  const wantsDate = /\b(date|today|day)\b/.test(normalized);
  const wantsTime = /\b(time|now)\b/.test(normalized);
  const date = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(now);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(now);

  return {
    skill: 'datetime',
    response:
      wantsDate && wantsTime
        ? `It's ${time}, ${date}.`
        : wantsDate
          ? `Today is ${date}.`
          : `It's ${time}.`,
  };
}
