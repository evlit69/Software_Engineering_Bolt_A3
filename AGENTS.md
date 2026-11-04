# AGENTS.md
## Project
Smart Campus room availability checker. One room, fictional bookings, fixed current time. Availability decision only.
## Structure
- src/lib/availability.ts: checkAvailability (booking rules) and selectedRoom fixture
- src/lib/availability.test.ts: regression tests for AC1-AC6
- src/lib/time.ts: shared time parsing/formatting (to be created in this refactor)
- src/components/AvailabilityForm.tsx: input, parsing, result card
- src/components/Timeline.tsx: daily timeline bar
- src/App.tsx: page layout, blocked toggle
## Constraints
Preserve AC1-AC6:
- AC1: reject start >= end and past requests
- AC2: reject durations longer than 120 minutes
- AC3: reject a blocked room
- AC4: reject overlaps; touching only at endpoints is allowed
- AC5-AC6: do not mutate booking data; keep clear desktop/mobile feedback
No backend, login, database or booking creation.
## Engineering rules
- Prefer pure functions and minimal changes.
- Use at most 2 justified patterns; no Singleton, Factory or class hierarchies.
- Do not mutate booking fixtures or change their values.
- Do not change the visible UI, layout or texts.
- Do not delete or weaken existing test assertions.
- Do not edit files unrelated to the task.
## Commands
- Install: npm install
- Dev server: npm run dev
- Type check: npm run typecheck
- Lint: npm run lint
- Build: npm run build
- Tests: npx vitest run
## Verification
Run existing tests and add focused regression tests.
Report changed files, rationale and test evidence.
List any change you made that was not requested.
