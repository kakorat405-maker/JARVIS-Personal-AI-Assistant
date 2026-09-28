import type { SkillResult } from './types';

function normalize(command: string): string {
  return command
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/['’]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tryConversation(command: string): SkillResult | null {
  const normalized = normalize(command);
  const withoutJarvis = normalized.replace(/\bjarvis\b/g, '').replace(/\s+/g, ' ').trim();

  if (/^(hi|hello|hey)$/.test(withoutJarvis)) {
    return {
      skill: 'conversation',
      response: "Hello. I'm online and ready.",
    };
  }

  if (/\b(who are you|what are you|what is your name|whats your name)\b/.test(normalized)) {
    return {
      skill: 'conversation',
      response: "I'm JARVIS, your personal digital assistant.",
    };
  }

  if (
    /\b(what can you do|what are your capabilities|what do you do|help|how can you help me)\b/.test(
      normalized,
    )
  ) {
    return {
      skill: 'conversation',
      response:
        "I can currently handle calculations, date and time, timers, notes, tasks, and basic voice commands. I'm still learning new skills.",
    };
  }

  if (/\b(i created you|i made you|you were created by me)\b/.test(normalized)) {
    return {
      skill: 'conversation',
      response: "Then you're my creator. I'm ready for the next command.",
    };
  }

  if (/\b(are you there|are you online|are you working)\b/.test(normalized)) {
    return {
      skill: 'conversation',
      response: 'Online and ready.',
    };
  }

  if (/\b(thank you|thanks)\b/.test(normalized)) {
    return {
      skill: 'conversation',
      response: "You're welcome.",
    };
  }

  if (/\bhow are you\b/.test(normalized)) {
    return {
      skill: 'conversation',
      response: "All systems are nominal. I'm ready to assist.",
    };
  }

  return null;
}