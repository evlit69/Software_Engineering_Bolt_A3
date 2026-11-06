
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

import App from './App';

import {
  checkAvailability,
  filterRooms,
  type Room,
} from '@/lib/availability';

// Adjust this import if step 1 placed roomCatalog in a different file.
import { roomCatalog } from '@/lib/roomData';

// --------------------------------------------------
// Test helpers
// --------------------------------------------------

function createRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 'test-room',
    name: 'Test Room',
    building: 'Test Building',
    floor: 1,
    capacity: 10,
    equipment: ['projector', 'whiteboard'],
    blocked: false,
    openTime: 0,
    closeTime: 1440,
    bookings: [],
    ...overrides,
  };
}

function check(
  room: Room,
  start: number,
  end: number,
  now = 600
) {
  return checkAvailability(room, start, end, now);
}

function enterTime(start: string, end: string) {
  fireEvent.change(screen.getByLabelText('Start time'), {
    target: { value: start },
  });

  fireEvent.change(screen.getByLabelText('End time'), {
    target: { value: end },
  });
}

function clickCheckAvailability() {
  fireEvent.click(
    screen.getByRole('button', { name: /check availability/i })
  );
}

// --------------------------------------------------
// T01–T09: Availability and filtering rules
// --------------------------------------------------

describe('Smart Campus Room Availability Checker', () => {

  // T01 AC1: Invalid intervals and current-time boundary.
  it('T01 AC1: rejects invalid intervals and accepts only times strictly after now', () => {
    const room = createRoom();
    const now = 600;

    const invalidIntervals = [
      [600, 600],
      [700, 650],
      [-1, 100],
      [1400, 1441],
      [600.5, 700],
      [600, 700.5],
    ];

    invalidIntervals.forEach(([start, end]) => {
      expect(check(room, start, end, now).available).toBe(false);
    });

    // Start exactly at NOW must be rejected.
    expect(check(room, now, 700, now).available).toBe(false);

    // One minute after NOW must be accepted.
    expect(check(room, now + 1, now + 61, now).available).toBe(true);
  });

  // T02 AC2: Maximum duration.
  it('T02 AC2: permits exactly 120 minutes and rejects 121 minutes', () => {
    const room = createRoom();

    const exactly120 = check(room, 601, 721, 600);
    const over120 = check(room, 601, 722, 600);

    expect(exactly120.available).toBe(true);
    expect(over120.available).toBe(false);
    expect(over120.reason).toBe('too_long');
  });

  // T03 AC3/F3: Blocked rooms.
  it('T03 AC3/F3: rejects an otherwise valid and free request when the room is blocked', () => {
    const room = createRoom({
      blocked: true,
      bookings: [],
    });

    const result = check(room, 601, 661, 600);

    expect(result.available).toBe(false);
    expect(result.reason).toBe('blocked');
  });

  // T04 AC4: Booking overlaps.
  it('T04 AC4: rejects partial, internal, and covering booking overlaps', () => {
    const room = createRoom({
      bookings: [
        {
          id: 'booking-1',
          title: 'Existing Meeting',
          start: 600,
          end: 660,
        },
      ],
    });

    const overlappingIntervals = [
      [590, 610], // Partial overlap on the left.
      [650, 670], // Partial overlap on the right.
      [610, 650], // Completely inside booking.
      [590, 670], // Completely covers booking.
    ];

    overlappingIntervals.forEach(([start, end]) => {
      const result = check(room, start, end, 500);

      expect(result.available).toBe(false);
      expect(result.reason).toBe('overlap');
    });
  });

  // T05 AC4: Endpoint touching.
  it('T05 AC4: allows intervals that touch existing booking endpoints', () => {
    const room = createRoom({
      bookings: [
        {
          id: 'booking-1',
          title: 'Existing Meeting',
          start: 600,
          end: 660,
        },
      ],
    });

    // Starts exactly when the existing booking ends.
    const afterBooking = check(room, 660, 720, 500);

    // Ends exactly when the existing booking starts.
    const beforeBooking = check(room, 540, 600, 500);

    expect(afterBooking.available).toBe(true);
    expect(beforeBooking.available).toBe(true);
  });

  // T06 AC5: Booking immutability.
  it('T06 AC5: never mutates existing bookings or frozen room data', () => {
    const room = createRoom({
      bookings: [
        {
          id: 'booking-1',
          title: 'Existing Meeting',
          start: 700,
          end: 760,
        },
      ],
    });

    const original = structuredClone(room);

    Object.freeze(room.bookings[0]);
    Object.freeze(room.bookings);
    Object.freeze(room.equipment);
    Object.freeze(room);

    expect(() => {
      check(room, 601, 650, 600);
      check(room, 710, 730, 600);
      check(room, 770, 800, 600);
    }).not.toThrow();

    expect(room).toEqual(original);
    expect(room.bookings).toEqual(original.bookings);
  });

  // T07: Cross-room booking isolation.
  it('T07: checks bookings belonging only to the selected room', () => {
    const roomA = createRoom({
      id: 'room-a',
      bookings: [
        {
          id: 'booking-a',
          title: 'Room A Meeting',
          start: 700,
          end: 760,
        },
      ],
    });

    const roomB = createRoom({
      id: 'room-b',
      bookings: [],
    });

    const resultA = check(roomA, 710, 740, 600);
    const resultB = check(roomB, 710, 740, 600);

    expect(resultA.available).toBe(false);
    expect(resultA.reason).toBe('overlap');

    expect(resultB.available).toBe(true);
  });

  // T08 F1: Room capacity.
  it('T08 F1: accepts capacity equal to attendees and rejects insufficient capacity', () => {
    const room = createRoom({ capacity: 5 });

    const exactCapacity = filterRooms([room], 5, []);
    const insufficientCapacity = filterRooms([room], 6, []);

    expect(exactCapacity).toHaveLength(1);
    expect(insufficientCapacity).toHaveLength(0);
  });

  // T09 F2/F4: Equipment and empty filtering results.
  it('T09 F2/F4: requires all selected equipment and returns empty results when nothing matches', () => {
    const room = createRoom({
      capacity: 10,
      equipment: ['projector', 'whiteboard', 'computers'],
    });

    // Missing one required item.
    const missingEquipment = filterRooms(
      [createRoom({
        equipment: ['projector'],
      })],
      5,
      ['projector', 'whiteboard']
    );

    expect(missingEquipment).toHaveLength(0);

    // Room containing a superset of required equipment.
    const superset = filterRooms(
      [room],
      5,
      ['projector', 'whiteboard']
    );

    expect(superset).toHaveLength(1);

    // No equipment selection should not filter by equipment.
    const noSelection = filterRooms(
      [room],
      5,
      []
    );

    expect(noSelection).toHaveLength(1);

    // Requirements matching no room.
    const noMatchingRooms = filterRooms(
      [room],
      5,
      ['microphone']
    );

    expect(noMatchingRooms).toHaveLength(0);
  });

  // --------------------------------------------------
  // T10–T12: Application integration and UI
  // --------------------------------------------------

  beforeEach(() => {
    // Keep tests independent of the actual current time.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 6, 8, 0, 0));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  // T10 AC5/AC6: Complete availability workflow.
  it('T10 AC5/AC6: displays understandable validation, Available, and Unavailable results', () => {
    render(<App />);

    // Select Study Room 204.
    fireEvent.change(screen.getByLabelText('Select room'), {
      target: { value: 'rm-204' },
    });

    // Invalid time input.
    enterTime('invalid', '11:30 AM');
    clickCheckAvailability();

    expect(
      screen.getByText(/times must be in the format/i)
    ).toBeTruthy();

    // Valid, unoccupied interval.
    enterTime('10:30 AM', '11:30 AM');
    clickCheckAvailability();

    expect(screen.getByText(/^Available$/)).toBeTruthy();

    // Occupied interval.
    enterTime('9:30 AM', '10:30 AM');
    clickCheckAvailability();

    expect(screen.getByText(/^Unavailable$/)).toBeTruthy();
    expect(screen.queryByText(/^Available$/)).toBeNull();
  });

  // T11 F4: Empty state.
  it('T11 F4: displays an understandable empty state when no rooms match', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Required attendees'), {
      target: { value: '30' },
    });

    fireEvent.click(screen.getByLabelText(/projector/i));
    fireEvent.click(screen.getByLabelText(/whiteboard/i));
    fireEvent.click(screen.getByLabelText(/computers/i));
    fireEvent.click(screen.getByLabelText(/microphone/i));

    expect(
      screen.getByText(/no matching rooms found/i)
    ).toBeTruthy();
  });

  // T12 F5: Room selection refreshes availability.
  it('T12 F5: refreshes the availability result when the selected room changes', () => {
    render(<App />);

    const roomSelect = screen.getByLabelText('Select room');

    // Room A: Innovation Lab.
    fireEvent.change(roomSelect, {
      target: { value: 'rm-105' },
    });

    // This interval overlaps an Innovation Lab booking.
    enterTime('10:30 AM', '11:30 AM');
    clickCheckAvailability();

    expect(screen.getByText(/^Unavailable$/)).toBeTruthy();

    // Room B: Study Room 204.
    fireEvent.change(roomSelect, {
      target: { value: 'rm-204' },
    });

    // The same interval is free in Study Room 204.
    expect(screen.getByText(/^Available$/)).toBeTruthy();
    expect(screen.queryByText(/^Unavailable$/)).toBeNull();
  });
});
