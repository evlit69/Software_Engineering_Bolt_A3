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

export const roomCatalog: Room[] = [
  {
    id: 'rm-204',
    name: 'Study Room 204',
    building: 'Hartwell Library',
    floor: 2,
    capacity: 6,
    equipment: ['whiteboard'],
    blocked: false,
    openTime: 480,
    closeTime: 1320,
    bookings: [
      { id: 'b1', title: 'Group Project – CS 301', start: 540, end: 600 },
      { id: 'b2', title: 'Literature Seminar', start: 720, end: 780 },
      { id: 'b3', title: 'Thesis Writing', start: 900, end: 960 },
      { id: 'b4', title: 'Peer Tutoring', start: 1140, end: 1200 },
    ],
  },
  {
    id: 'rm-105',
    name: 'Innovation Lab',
    building: 'Hartwell Science Center',
    floor: 1,
    capacity: 12,
    equipment: ['projector', 'whiteboard', 'computers'],
    blocked: false,
    openTime: 480,
    closeTime: 1320,
    bookings: [
      { id: 'b5', title: 'Robotics Workshop', start: 600, end: 660 },
      { id: 'b6', title: 'Design Meeting', start: 840, end: 900 },
    ],
  },
  {
    id: 'rm-301',
    name: 'Lecture Room 301',
    building: 'Hartwell Academic Building',
    floor: 3,
    capacity: 30,
    equipment: ['projector', 'microphone', 'whiteboard'],
    blocked: true,
    openTime: 480,
    closeTime: 1320,
    bookings: [
      { id: 'b7', title: 'Department Seminar', start: 660, end: 720 },
    ],
  },
  {
    id: 'rm-210',
    name: 'Computer Lab 210',
    building: 'Hartwell Technology Center',
    floor: 2,
    capacity: 20,
    equipment: ['computers', 'projector'],
    blocked: false,
    openTime: 480,
    closeTime: 1320,
    bookings: [
      { id: 'b8', title: 'Programming Class', start: 780, end: 840 },
      { id: 'b9', title: 'Software Workshop', start: 960, end: 1020 },
    ],
  },
];

export function getRoomById(roomId: string): Room | undefined {
  return roomCatalog.find((room) => room.id === roomId);
}

// Backward compatibility with the existing App.tsx.
export const selectedRoom: Room = roomCatalog[0];