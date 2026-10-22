import { useState } from 'react';
import { Users, MapPin, Building2, Lock, CalendarDays, CheckCircle2, AlertTriangle } from 'lucide-react';
import { selectedRoom, minutesToLabel } from '@/lib/availability';
import AvailabilityForm from '@/components/AvailabilityForm';

export default function App() {
  const [room, setRoom] = useState(selectedRoom);

  const toggleBlocked = () => setRoom((r) => ({ ...r, blocked: !r.blocked }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Breadcrumb / Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            <span>Hartwell Library</span>
            <span>›</span>
            <span>Floor 2</span>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{room.name}</h1>
            {/* Always-visible status badge */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                room.blocked
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {room.blocked ? (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  Blocked
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Open
                </>
              )}
            </span>
          </div>
        </div>

        {/* Room photo card */}
        <div className="mb-6 overflow-hidden rounded-2xl shadow-sm">
          <img
            src="https://images.pexels.com/photos/6281132/pexels-photo-6281132.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
            alt="Study room interior"
            className="h-48 w-full object-cover sm:h-56"
          />
        </div>

        {/* Room meta */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <Building2 className="h-4 w-4 text-slate-400" />
            <p className="mt-1.5 text-xs text-slate-400">Building</p>
            <p className="text-sm font-semibold text-slate-700">{room.building}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <MapPin className="h-4 w-4 text-slate-400" />
            <p className="mt-1.5 text-xs text-slate-400">Floor</p>
            <p className="text-sm font-semibold text-slate-700">{room.floor}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <Users className="h-4 w-4 text-slate-400" />
            <p className="mt-1.5 text-xs text-slate-400">Capacity</p>
            <p className="text-sm font-semibold text-slate-700">{room.capacity} people</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <p className="mt-1.5 text-xs text-slate-400">Hours</p>
            <p className="text-sm font-semibold text-slate-700">
              {minutesToLabel(room.openTime).replace(':00', '')}–{minutesToLabel(room.closeTime).replace(':00', '')}
            </p>
          </div>
        </div>

        {/* Blocked banner */}
        {room.blocked && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
            <div>
              <p className="text-sm font-semibold text-rose-700">This room is blocked</p>
              <p className="mt-0.5 text-sm text-rose-600">
                All availability checks will be rejected until the room is unblocked.
              </p>
            </div>
          </div>
        )}

        {/* Blocked toggle — lets you simulate the blocked state */}
        <div className="mb-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-medium text-slate-700">Room status</p>
            <p className="text-xs text-slate-400">
              Toggle to simulate a blocked room (e.g. maintenance or a hold).
            </p>
          </div>
          <button
            onClick={toggleBlocked}
            role="switch"
            aria-checked={room.blocked}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors ${
              room.blocked ? 'bg-rose-500' : 'bg-emerald-500'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                room.blocked ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Availability checker */}
        <AvailabilityForm room={room} />

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
