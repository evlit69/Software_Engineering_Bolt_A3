# Project memory

## Product intent & audience

- Smart Campus room availability checker; users check whether a campus room can be booked given time/equipment constraints.
- Optional explanation feature lets users get a natural-language explanation of an availability verdict.
- Audience likely students/staff performing room bookings; no accounts involved.

## Brand personality & voice

- Pragmatic, engineering-focused tone in communication; values explicit change documentation and rationale.
- Explanations are plain-language, keyed off deterministic reason codes.

## Visual design & UX direction

- UI centered on an `AvailabilityForm` with a result card; optional "Explain this result" button and explanation/error blocks appear beneath results.
- Explanation UI has idle/loading/ok/error states.
- Tech: Vite + React + TypeScript + Tailwind CSS + lucide-react icons; `@/` path alias maps to `src/`.
- Prefer `useCallback` for stable handler identities to keep lint/exhaustive-deps clean.
- Aesthetic guidance from `.bolt/prompt` (beautiful, production-worthy, non-cookie-cutter) is respected, not restated here.

## Decisions, constraints & rationale

- Deterministic `checkAvailability` in `src/lib/availability.ts` is authoritative; explanation/mock adapter must never alter its verdict.
- No changes allowed to `checkAvailability` main logic; any change to `availability.ts` must be explicitly documented with where and why.
- Explanation adapter is a mock: pure local function, no network, no secrets, no login, no database, no real personal data. Uses `setTimeout(0)` to mimic async for future real-service swap.
- `explainAvailability` validates inputs (non-objects, missing rooms, malformed results, non-integer/out-of-range times) and returns typed `{ text, source }` or `{ message, code }` (e.g. `adapter_failure`) instead of throwing.
- Tests must be preserved: existing AC1–AC6 booking-rule tests remain intact; new tests are additive (19 existing + 10 new = 29 total).
- Prior approved fixes retained: test import from `roomData`; blocked-room exclusion in `filterRooms`.

## Open questions & assumptions

- Assumes availability domain types (`AvailabilityResult`, room/time/equipment models) live alongside `availability.ts` and `roomData`.
- Future real explanation service swap-point is implied but not yet specified.
- Exact AC1–AC6 rule definitions are not captured here; consult `availability.test.ts` for authoritative behavior.