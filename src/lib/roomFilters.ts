
import type { Room } from './availability';

export function filterRooms(
  rooms: Room[],
  attendees: number,
  requiredEquipment: string[]
): Room[] {
  // Reject invalid attendee counts.
  if (!Number.isInteger(attendees) || attendees < 1) {
    return [];
  }

  return rooms.filter((room) => {
    // F1: Room must accommodate all attendees.
    const capacityMatches = room.capacity >= attendees;

    // F2: Room must contain ALL required equipment.
    const equipmentMatches = requiredEquipment.every((item) =>
      room.equipment.includes(item)
    );

    return capacityMatches && equipmentMatches;
  });
}
