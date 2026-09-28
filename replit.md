# JARVIS

A dark, futuristic personal assistant interface for sending typed commands and preparing for future voice and AI capabilities.

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

- `artifacts/jarvis/src/App.tsx` — single-page JARVIS command center and local interaction state
- `artifacts/jarvis/src/index.css` — dark visual system, responsive layout, and microphone motion
- `artifacts/api-server` — shared API server scaffold, not used by the current frontend-only experience
- `lib/api-spec/openapi.yaml` — shared API contract, unchanged for this first UI build

## Architecture decisions

- The first version is frontend-only; commands and placeholder responses stay local so the interface can be refined before adding services.
- Conversation entries use a small typed message model and local response function, leaving clear seams for voice recognition and an AI response layer.
- The microphone is an explicit listening-state placeholder rather than a browser speech API integration.

## Product

- Shows JARVIS online status and a command-center shell.
- Accepts typed commands via Send or Enter.
- Appends user commands and local JARVIS responses to the live channel.
- Provides a responsive microphone interaction placeholder with animated standby/listening states.

## User preferences

- Keep the first version polished and intentionally simple; do not overcomplicate the frontend.

## Gotchas

- Voice recognition, AI responses, reminders, calendar integration, and additional skills are intentionally not connected yet.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
