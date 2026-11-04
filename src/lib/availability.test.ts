
import { describe, it, expect } from 'vitest';
import {
  checkAvailability,
  selectedRoom,
  type Room,
} from './availability'; // Adjust import path if necessary

describe('Availability regression tests – AC1 to AC6', () => {
  
  // AC1: Reject past requests
  it('TC01: rejects a booking starting at the current time', () => {
    const result = checkAvailability(selectedRoom, 600, 660, 600);

    expect(result.available).toBe(false);
    expect(result.reason).toBe('past_time');
    expect(result.message).toBeTruthy();
  });

  // AC1: Reject reversed intervals
  it('TC02: rejects a reversed time interval', () => {
    const result = checkAvailability(selectedRoom, 660, 600, 500);

    expect(result.available).toBe(false);
    expect(result.reason).toBe('invalid_range');
    expect(result.message).toBeTruthy();
  });

  // AC2: Maximum booking duration is 120 minutes
  it('TC03: rejects a booking lasting 121 minutes', () => {
    const result = checkAvailability(selectedRoom, 600, 721, 500);

    expect(result.available).toBe(false);
    expect(result.reason).toBe('too_long');
    expect(result.message).toContain('121 min');
    expect(result.message).toBeTruthy();
  });

  // AC3: Reject blocked rooms
  it('TC04: rejects a booking in a blocked room', () => {
    const blockedRoom: Room = {
      ...selectedRoom,
      blocked: true,
      bookings: [],
    };

    const result = checkAvailability(blockedRoom, 600, 660, 500);

    expect(result.available).toBe(false);
    expect(result.reason).toBe('blocked');
    expect(result.message).toBeTruthy();
  });

  // AC4: Reject overlapping bookings
  it('TC05: rejects a booking that overlaps an existing booking', () => {
    // Existing booking b1: 540–600
    const result = checkAvailability(selectedRoom, 570, 630, 500);

    expect(result.available).toBe(false);
    expect(result.reason).toBe('overlap');
    expect(result.conflictingBooking?.id).toBe('b1');
    expect(result.message).toBeTruthy();
  });

  // AC4: Allow bookings touching at endpoints
  it('TC06: allows a booking starting exactly when another booking ends', () => {
    // Existing booking b1 ends at 600.
    const result = checkAvailability(selectedRoom, 600, 660, 500);

    expect(result.available).toBe(true);
    expect(result.reason).toBe('available');
    expect(result.message).toBeTruthy();
    expect(result.conflictingBooking).toBeUndefined();
  });

  // AC5: Booking data must not be modified
  it('TC07: does not mutate the original room or its booking fixtures', () => {
    const originalRoom = JSON.parse(
      JSON.stringify(selectedRoom)
    );

    // Run several availability checks against the original fixture.
    checkAvailability(selectedRoom, 600, 660, 500);
    checkAvailability(selectedRoom, 570, 630, 500);
    checkAvailability(selectedRoom, 660, 600, 500);
    checkAvailability(selectedRoom, 600, 721, 500);

    expect(selectedRoom).toEqual(originalRoom);
    expect(selectedRoom.bookings).toHaveLength(4);
    expect(selectedRoom.bookings).toEqual(originalRoom.bookings);
  });

});
