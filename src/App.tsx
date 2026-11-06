import RoomPresentation from '@/components/RoomPresentation';
import { selectedRoom, roomCatalog, } from '@/lib/roomData';
import { filterRooms } from '@/lib/roomFilters';
import { minutesToLabel } from '@/lib/availability';

import { useCallback, useState } from 'react';
import AvailabilityForm from '@/components/AvailabilityForm';

export default function App() {
  const [room, setRoom] = useState(selectedRoom);
  
  const handleRoomChange = useCallback((nextRoom: typeof selectedRoom) => {
    setRoom(nextRoom);
  }, []);

  

  const toggleBlocked = () => setRoom((r) => ({ ...r, blocked: !r.blocked }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
       <RoomPresentation
          room={room}
          onToggleBlocked={toggleBlocked}
        />

        {/* Availability checker */}
        <AvailabilityForm
          room={room}
          rooms={roomCatalog}
          onRoomChange={handleRoomChange}
        />

        {/* Existing bookings list */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Existing Bookings Today</h2>
          <ul className="divide-y divide-slate-100">
            {room.bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-slate-700">{b.title}</span>
                <span className="text-sm font-medium text-slate-500">
                  {minutesToLabel(b.start)} – {minutesToLabel(b.end)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Availability checker only — no booking is created or confirmed.
        </p>
      </div>
    </div>
  );
}
