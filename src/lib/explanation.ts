import type { AvailabilityResult, Room } from './availability';
import { minutesToLabel, durationLabel } from './availability';

export interface ExplanationRequest {
  room: Room;
  result: AvailabilityResult;
  start: number;
  end: number;
}

export interface ExplanationResponse {
  text: string;
  source: 'mock-adapter';
}

export interface ExplanationError {
  message: string;
  code: 'invalid_input' | 'adapter_failure';
}

const VALID_REASONS: ReadonlyArray<AvailabilityResult['reason']> = [
  'available',
  'blocked',
  'out_of_hours',
  'overlap',
  'too_long',
  'invalid_range',
  'past_time',
  'max_exceeded',
];

function isAvailabilityResult(value: unknown): value is AvailabilityResult {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.available === 'boolean' &&
    typeof v.reason === 'string' &&
    VALID_REASONS.includes(v.reason as AvailabilityResult['reason']) &&
    typeof v.message === 'string'
  );
}

export function validateExplanationRequest(req: unknown): ExplanationError | null {
  if (typeof req !== 'object' || req === null) {
    return { message: 'Request must be an object.', code: 'invalid_input' };
  }
  const r = req as Record<string, unknown>;

  if (typeof r.room !== 'object' || r.room === null) {
    return { message: 'Request must include a room.', code: 'invalid_input' };
  }
  if (!isAvailabilityResult(r.result)) {
    return { message: 'Request must include a valid availability result.', code: 'invalid_input' };
  }
  if (!Number.isInteger(r.start) || !Number.isInteger(r.end)) {
    return { message: 'Start and end must be whole minutes.', code: 'invalid_input' };
  }
  const start = r.start as number;
  const end = r.end as number;
  if (start < 0 || end > 1440) {
    return { message: 'Times must be within a single day (0–1440).', code: 'invalid_input' };
  }
  return null;
}

function buildText(room: Room, result: AvailabilityResult, start: number, end: number): string {
  const slot = `${minutesToLabel(start)}–${minutesToLabel(end)}`;
  const duration = end - start;

  switch (result.reason) {
    case 'available':
      return `${room.name} is free for your ${durationLabel(duration)} request (${slot}). The room fits within opening hours and does not overlap any existing booking.`;
    case 'blocked':
      return `${room.name} is currently blocked, so it cannot be booked for ${slot} regardless of the time. Check back later or pick a different room.`;
    case 'out_of_hours':
      return `Your request (${slot}) falls outside ${room.name}'s opening hours (${minutesToLabel(room.openTime)}–${minutesToLabel(room.closeTime)}). Choose a slot inside those hours.`;
    case 'overlap':
      return `Your request (${slot}) overlaps an existing booking${
        result.conflictingBooking ? ` "${result.conflictingBooking.title}"` : ''
      }. Pick a time that starts after it ends or ends before it starts.`;
    case 'too_long':
      return `Your request lasts ${durationLabel(duration)}, which exceeds the ${durationLabel(120)} maximum. Shorten the slot.`;
    case 'past_time':
      return `The requested start time is at or before the current time. Choose a start time in the future.`;
    case 'invalid_range':
      return `The requested time range is invalid: ${result.message}`;
    case 'max_exceeded':
      return `The requested attendee count exceeds what this room supports. Reduce attendees or pick a larger room.`;
    default:
      return result.message;
  }
}

export type SimulatedFailure = 'none' | 'timeout' | 'error';

export async function explainAvailability(req: unknown,  simulate: SimulatedFailure = 'none',): Promise<ExplanationResponse | ExplanationError> {
  const validationError = validateExplanationRequest(req);
  if (validationError) return validationError;

  const { room, result, start, end } = req as ExplanationRequest;

  try {
    if (simulate === 'error') throw new Error('Simulated API failure');
    if (simulate === 'timeout') await new Promise((r) => setTimeout(r, 10000)); // "зависание"

    const text = buildText(room, result, start, end);
    await new Promise((resolve) => setTimeout(resolve, 0));
    return { text, source: 'mock-adapter' };
  } catch {
    return {
      message: 'The explanation service could not produce a response. The availability result above is still authoritative.',
      code: 'adapter_failure',
    };
  }
}
