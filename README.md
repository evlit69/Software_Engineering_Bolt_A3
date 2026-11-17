# Smart Campus Room Availability Checker

Check whether a fictional campus study room is free for a time slot.
Educational project: all rooms and bookings are fictional.

## Features
- Check availability by start/end time (e.g. `10:30 AM`)
- Rejects past/invalid times, slots over 2 hours, blocked rooms and overlaps
- Filter rooms by attendees and equipment
- Daily timeline, responsive on desktop and mobile

## Tech stack
React 18, TypeScript, Vite, Tailwind CSS, Vitest, ESLint, Prettier

## Getting started
Requirements: Node 20+
```bash
npm ci
npm run dev
```

## Scripts
| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm test` | Run unit/integration tests |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run format:check` | Prettier check |
| `npm run check` | All of the above |

## Project structure
See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Environment
No environment variables or secrets needed. See `.env.example`.

## Working with AI agents
Read [AGENTS.md](AGENTS.md) first. Agent changes need passing `npm run check`
and human review before merge.

## Known limitations
See the risk register: [docs/RISK_REGISTER.md](docs/RISK_REGISTER.md).