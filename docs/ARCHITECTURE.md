# Architecture

## Overview
Single-page React + TypeScript app (Vite). One page checks whether a fictional
study room is free for a requested time slot. No backend, no login, no database.
All data is fictional and lives in memory.

## Folder layout
```
src/
  components/
    AvailabilityForm.tsx   # form, inputs, result display
    Timeline.tsx           # daily timeline with bookings
  lib/
    availability.ts        # types + checkAvailability() (pure logic)
    roomData.ts            # fictional room catalog
    roomFilters.ts         # filterRooms() by capacity and equipment
    config.ts              # MAX_ATTENDEES, EQUIPMENT_OPTIONS
  test/setup.ts
```

## Data flow
User input -> parseTimeInput() -> checkAvailability(room, start, end, now)
-> AvailabilityResult -> rendered in AvailabilityForm.

## Key decisions
- checkAvailability is a pure function: it never mutates room data (AC5).
- "Now" is passed in as a parameter, so tests do not depend on the real clock.
- Times are minutes after midnight; start inclusive, end exclusive, so
  back-to-back bookings (10:00-11:00 then 11:00-12:00) do not overlap.

## Acceptance contract (AC1-AC6)
AC1 reject invalid/past times | AC2 max 120 min | AC3 blocked room rejected |
AC4 overlap rejected | AC5 data not mutated | AC6 clear feedback, desktop/mobile UI
(Replace with your exact wording from Practice #09.)

## Known limitations
- Blocked toggle is local UI state only (demo feature).
- Result is a snapshot at click time and is not refreshed as time passes.