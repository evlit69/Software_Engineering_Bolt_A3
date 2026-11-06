export interface Booking {
  id: string;
  title: string;
  start: number; // minutes after midnight (inclusive)
  end: number;   // minutes after midnight (exclusive)
}

export interface Room {
  id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  equipment: string[];
  blocked: boolean;
  openTime: number;  // minutes after midnight
  closeTime: number; // minutes after midnight
  bookings: Booking[];
}

export type AvailabilityReason =
  | 'available'
  | 'blocked'
  | 'out_of_hours'
  | 'overlap'
  | 'too_long'
  | 'invalid_range'
  | 'past_time'
  | 'max_exceeded';

export interface AvailabilityResult {
  available: boolean;
  reason: AvailabilityReason;
  message: string;
  conflictingBooking?: Booking;
}

export const MAX_DURATION = 120;
export const MINUTES_IN_DAY = 1440;

export function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}


export function parseTimeInput(value: string): number | null {
  const m = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;

  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const period = m[3].toUpperCase();

  if (h < 1 || h > 12 || min < 0 || min > 59) return null;

  if (period === 'AM') h = h === 12 ? 0 : h;
  else h = h === 12 ? 12 : h + 12;

  return h * 60 + min;
}


export function durationLabel(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export function getNowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function checkAvailability(
  room: Room,
  start: number,
  end: number,
  nowMinutes: number
): AvailabilityResult {
  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    return { available: false, reason: 'invalid_range', message: 'Start and end times must be whole minutes.' };
  }
  if (start < 0 || end > MINUTES_IN_DAY) {
    return { available: false, reason: 'invalid_range', message: 'Times must be within the same day (0–1440 minutes).' };
  }
  if (start >= end) {
    return { available: false, reason: 'invalid_range', message: 'Start time must be before end time.' };
  }
  if (start <= nowMinutes) {
    return {
      available: false,
      reason: 'past_time',
      message: `Start time must be strictly after now (${minutesToLabel(nowMinutes)}).`,
    };
  }
  const duration = end - start;
  if (duration > MAX_DURATION) {
    return {
      available: false,
      reason: 'too_long',
      message: `Duration is ${durationLabel(duration)}. Maximum allowed is ${durationLabel(MAX_DURATION)}.`,
    };
  }
  if (room.blocked) {
    return {
      available: false,
      reason: 'blocked',
      message: 'This room is currently blocked and unavailable for booking.',
    };
  }
  if (start < room.openTime || end > room.closeTime) {
    return {
      available: false,
      reason: 'out_of_hours',
      message: `Requested time must be within room hours (${minutesToLabel(room.openTime)}–${minutesToLabel(room.closeTime)}).`,
    };
  }
  const conflict = room.bookings.find((b) => start < b.end && end > b.start);
  if (conflict) {
    return {
      available: false,
      reason: 'overlap',
      message: `Overlaps with "${conflict.title}" (${minutesToLabel(conflict.start)}–${minutesToLabel(conflict.end)}).`,
      conflictingBooking: conflict,
    };
  }
  return {
    available: true,
    reason: 'available',
    message: `Room is available ${minutesToLabel(start)}–${minutesToLabel(end)} (${durationLabel(duration)}).`,
  };
}