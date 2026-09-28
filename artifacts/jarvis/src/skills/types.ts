export type SkillName =
  | 'calculator'
  | 'datetime'
  | 'timer'
  | 'tasks'
  | 'notes'
  | 'conversation'
  | 'fallback';

export type JarvisTask = {
  id: string;
  text: string;
  due?: string;
  createdAt: string;
};

export type JarvisNote = {
  id: string;
  text: string;
  createdAt: string;
};

export type JarvisTimer = {
  id: string;
  durationMs: number;
  label?: string;
};

export type SkillState = {
  tasks: JarvisTask[];
  notes: JarvisNote[];
  now: Date;
};

export type SkillResult = {
  skill: SkillName;
  response: string;
  tasks?: JarvisTask[];
  notes?: JarvisNote[];
  timer?: JarvisTimer;
};