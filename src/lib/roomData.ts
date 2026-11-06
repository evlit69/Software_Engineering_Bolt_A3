
import type { Room } from './availability';

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
