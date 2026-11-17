# AGENTS.md

## Project

Smart Campus room availability checker. A small catalog of fictional rooms with fictional bookings. Availability decision only: the app never creates, stores, or confirms a booking. There is no login and no database; all data is in-memory and fictional.

## Structure

- src/lib/availability.ts: types, time parsing/formatting, and checkAvailability (booking rules)
- src/lib/availability.test.ts: regression tests for AC1-AC6
- src/lib/roomData.ts: fictional room catalog and the selectedRoom fixture
- src/lib/roomFilters.ts: filterRooms by capacity and equipment
- src/lib/config.ts: MAX_ATTENDEES, EQUIPMENT_OPTIONS, timeline sizing
- src/components/AvailabilityForm.tsx: input, parsing, result card
- src/components/Timeline.tsx: daily timeline bar
- src/App.tsx: page layout, blocked toggle

## Constraints

Preserve AC1-AC6:

- AC1: reject start >= end and past requests
- AC2: reject durations longer than 120 minutes
- AC3: reject a blocked room
- AC4: reject overlaps; touching only at endpoints is allowed
- AC5: do not mutate booking fixtures or change their values
- AC6: keep clear, understandable feedback on both desktop and mobile

No backend, login, database, or booking creation.
No secrets, credentials, or environment variables with real values.
No external deployments, remote pushes, or calls to external services.

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
- Full verification: npm run check (format:check + lint + typecheck + test + build)

## Verification

Before proposing acceptance, run `npm run check` and ensure it passes, then add focused regression tests for any behavior you change.
Report changed files, rationale and test evidence.
List any change you made that was not requested.
