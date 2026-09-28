# JARVIS

A dark, futuristic voice-first personal assistant interface for sending spoken or typed commands through modular local skills.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/jarvis/src/App.tsx` — voice-first JARVIS command center, speech entry/output, optional chat drawer, and conversation state
- `artifacts/jarvis/src/skills/router.ts` — command router that dispatches to local skills
- `artifacts/jarvis/src/skills/` — calculator, date/time, timer, tasks, notes, conversation, and local persistence modules
- `artifacts/jarvis/src/index.css` — dark visual system, responsive layout, and microphone motion
- `artifacts/api-server` — shared API server scaffold, not used by the current frontend-only experience
- `lib/api-spec/openapi.yaml` — shared API contract, unchanged for this first UI build

## Architecture decisions

- The current version is frontend-only; commands are handled locally so no provider key or external AI service is required.
- All typed and recognized speech commands enter the same `processCommand` pipeline before routing.
- Skills are isolated behind `routeCommand`, so an AI skill can be added as another route without rewriting the interface.
- Voice responses are spoken with browser SpeechSynthesis while their text remains in the shared conversation log.
- Tasks and notes persist in browser local storage; timers run in the current session.

## Product

- Shows JARVIS online status and a command-center shell.
- Accepts typed commands via Send or Enter.
- Accepts browser speech-recognition transcripts through the same command pipeline.
- Opens an optional slide-in chat drawer for typed interaction; the default screen remains voice-first.
- Supports calculator, current date/time, timer, task creation/listing, and note creation/listing commands.
- Handles greetings and capability questions locally, then falls back gracefully for unknown commands.
- Appends user commands and local JARVIS responses to the live channel with listening, thinking, speaking, and online states.

## User preferences

- Keep the first version polished and intentionally simple; do not overcomplicate the frontend.

## Gotchas

- Browser speech-recognition support and microphone permission vary by browser; the chat drawer remains the fallback input.
- AI responses, calendar, web search, weather, and device utilities are intentionally not connected yet.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
