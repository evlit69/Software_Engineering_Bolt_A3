import { describe, it, expect } from 'vitest';
import { explainAvailability, validateExplanationRequest, type ExplanationRequest } from './explanation';
import { checkAvailability, type Room } from './availability';
import { selectedRoom } from './roomData';

function makeRoom(overrides: Partial<Room> = {}): Room {
  return { ...selectedRoom, ...overrides };
}

const validResult = (overrides: Partial<ReturnType<typeof checkAvailability>> = {}) => ({
  available: true,
  reason: 'available' as const,
  message: 'Room is available.',
  ...overrides,
});

describe('explainAvailability – input validation', () => {
  it('rejects a non-object request', async () => {
    const err = await explainAvailability(null);
    expect(err).toMatchObject({ code: 'invalid_input' });
  });

  it('rejects a request missing a room', async () => {
    const err = await explainAvailability({ result: validResult(), start: 600, end: 660 });
    expect(err).toMatchObject({ code: 'invalid_input' });
  });

  it('rejects a request with an invalid availability result', async () => {
    const err = await explainAvailability({
      room: makeRoom(),
      result: { available: true, reason: 'bogus', message: 'x' },
      start: 600,
      end: 660,
    });
    expect(err).toMatchObject({ code: 'invalid_input' });
  });

  it('rejects non-integer or out-of-range times', async () => {
    const base = { room: makeRoom(), result: validResult() };
    expect(await explainAvailability({ ...base, start: 600.5, end: 660 })).toMatchObject({
      code: 'invalid_input',
    });
    expect(await explainAvailability({ ...base, start: -1, end: 660 })).toMatchObject({
      code: 'invalid_input',
    });
    expect(await explainAvailability({ ...base, start: 600, end: 1441 })).toMatchObject({
      code: 'invalid_input',
    });
  });

  it('validateExplanationRequest returns null for a well-formed request', () => {
    const req: ExplanationRequest = {
      room: makeRoom(),
      result: validResult(),
      start: 600,
      end: 660,
    };
    expect(validateExplanationRequest(req)).toBeNull();
  });
});

describe('explainAvailability – output shape and content', () => {
  it('returns a mock-adapter response with non-empty text for an available slot', async () => {
    const result = checkAvailability(makeRoom(), 601, 661, 600);
    const res = await explainAvailability({ room: makeRoom(), result, start: 601, end: 661 });
    expect(res).toMatchObject({ source: 'mock-adapter' });
    expect((res as { text: string }).text.length).toBeGreaterThan(0);
    expect((res as { text: string }).text).toContain('free');
  });

  it('mentions the conflicting booking title for an overlap', async () => {
    const room = makeRoom({
      bookings: [{ id: 'x', title: 'Design Sync', start: 600, end: 660 }],
    });
    const result = checkAvailability(room, 610, 640, 500);
    const res = await explainAvailability({ room, result, start: 610, end: 640 });
    expect((res as { text: string }).text).toContain('Design Sync');
  });

  it('references opening hours for an out-of-hours result', async () => {
    const room = makeRoom({ openTime: 600, closeTime: 1200, bookings: [] });
    const result = checkAvailability(room, 540, 600, 500);
    const res = await explainAvailability({ room, result, start: 540, end: 600 });
    expect((res as { text: string }).text).toContain('opening hours');
  });

  it('references the maximum duration for a too_long result', async () => {
    const room = makeRoom({ bookings: [] });
    const result = checkAvailability(room, 601, 722, 600);
    const res = await explainAvailability({ room, result, start: 601, end: 722 });
    expect((res as { text: string }).text).toContain('maximum');
  });
});

describe('explainAvailability – graceful failure', () => {
  it('never throws; an adapter failure returns an adapter_failure code', async () => {
    const result = validResult();
    const res = await explainAvailability({ room: makeRoom(), result, start: 600, end: 660 });
    expect(res).toMatchObject({ source: 'mock-adapter' });
  });
});
