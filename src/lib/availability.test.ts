import { describe, it, expect } from 'vitest';
import { checkAvailability, type Room, type Booking } from '@/lib/availability';

interface TestCase {
  id: string;
  description: string;
  start: number;
  end: number;
  now: number;
  blocked: boolean;
  existingBookings: [number, number][];
  expected: boolean;
}

const testCases: TestCase[] = [
  { id: 'TC01', description: 'valid booking, no conflicts', start: 600, end: 660, now: 540, blocked: false, existingBookings: [], expected: true },
  { id: 'TC02', description: 'start must be strictly after now (start equals now)', start: 540, end: 600, now: 540, blocked: false, existingBookings: [], expected: false },
  { id: 'TC03', description: 'start is in the past', start: 530, end: 600, now: 540, blocked: false, existingBookings: [], expected: false },
  { id: 'TC04', description: 'start equals end', start: 600, end: 600, now: 540, blocked: false, existingBookings: [], expected: false },
  { id: 'TC05', description: 'valid, ends exactly at midnight boundary (1440)', start: 1320, end: 1440, now: 1200, blocked: false, existingBookings: [], expected: true },
  { id: 'TC06', description: 'start beyond allowed range (1441)', start: 1441, end: 1442, now: 1200, blocked: false, existingBookings: [], expected: false },
  { id: 'TC07', description: 'duration exactly 120 minutes is permitted', start: 600, end: 720, now: 540, blocked: false, existingBookings: [], expected: true },
  { id: 'TC08', description: 'duration 121 minutes exceeds max by one', start: 600, end: 721, now: 540, blocked: false, existingBookings: [], expected: false },
  { id: 'TC09', description: 'room is blocked rejects everything', start: 600, end: 660, now: 540, blocked: true, existingBookings: [], expected: false },
  { id: 'TC10', description: 'overlaps an existing booking', start: 600, end: 660, now: 540, blocked: false, existingBookings: [[650, 700]], expected: false },
  { id: 'TC11', description: 'starts exactly when existing ends (touching allowed)', start: 660, end: 720, now: 540, blocked: false, existingBookings: [[600, 660]], expected: true },
  { id: 'TC12', description: 'ends exactly when existing starts (touching allowed)', start: 540, end: 600, now: 500, blocked: false, existingBookings: [[600, 660]], expected: true },
  { id: 'TC13', description: 'new booking fully contains an existing one', start: 600, end: 720, now: 540, blocked: false, existingBookings: [[630, 660]], expected: false },
  { id: 'TC14', description: 'one of several bookings conflicts', start: 600, end: 660, now: 540, blocked: false, existingBookings: [[500, 550], [640, 680]], expected: false },
  { id: 'TC15', description: 'non-integer time value must be rejected', start: 600.5, end: 660, now: 540, blocked: false, existingBookings: [], expected: false },
];

function buildRoom(blocked: boolean, existingBookings: [number, number][]): Room {
  const bookings: Booking[] = existingBookings.map(([s, e], i) => ({
    id: `bk-${i}`,
    title: `Booking ${i + 1}`,
    start: s,
    end: e,
  }));
  return {
    id: 'test-room',
    name: 'Test Room',
    building: 'Test Building',
    floor: 1,
    capacity: 4,
    blocked,
    openTime: 0,
    closeTime: 1440,
    bookings,
  };
}

describe('checkAvailability', () => {
  for (const tc of testCases) {
    it(`${tc.id}: ${tc.description} — (start=${tc.start}, end=${tc.end}, now=${tc.now}, blocked=${tc.blocked}, bookings=${JSON.stringify(tc.existingBookings)}) => expected available=${tc.expected}`, () => {
      const room = buildRoom(tc.blocked, tc.existingBookings);
      const result = checkAvailability(room, tc.start, tc.end, tc.now);
      expect(result.available).toBe(tc.expected);
    });
  }
   it('TC16: checkAvailability mutates the original bookings array', () => {
    const room = buildRoom(false, [
      [600, 660],
      [900, 960],
      [720, 780],
    ]);

    const originalBookings = [...room.bookings];

    checkAvailability(room, 1020, 1080, 540);

    expect(room.bookings).toEqual(originalBookings);
  });
});
