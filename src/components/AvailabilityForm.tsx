import {
  MAX_ATTENDEES,
  EQUIPMENT_OPTIONS,
} from '@/lib/config';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Clock, AlertCircle, CheckCircle2, CalendarClock } from 'lucide-react';
import type { Room, AvailabilityResult } from '@/lib/availability';
import {
  checkAvailability,
  getNowMinutes,
  minutesToLabel,
  durationLabel,
  MAX_DURATION,
  parseTimeInput,
} from '@/lib/availability';

import { filterRooms } from '@/lib/roomFilters';
import Timeline from './Timeline';

interface AvailabilityFormProps {
  room: Room;
  rooms: Room[];
  onRoomChange: (room: Room) => void;
}

export default function AvailabilityForm({
  room,
  rooms,
  onRoomChange,
}: AvailabilityFormProps) {
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [candidate, setCandidate] = useState<
    { start: number; end: number } | undefined
  >(undefined);
  const [nowMin, setNowMin] = useState(getNowMinutes());
  const [attendees, setAttendees] = useState(1);
  const [requiredEquipment, setRequiredEquipment] = useState<string[]>([]);

  const previousRoomId = useRef(room.id);

  const applyAvailabilityResult = (
  nextResult: AvailabilityResult,
  start: number,
  end: number
) => {
  setResult(nextResult);

   setCandidate(
      nextResult.available ||
      nextResult.reason === 'overlap' ||
      nextResult.reason === 'out_of_hours'
        ? { start, end }
        : undefined
    );
  };

  const matchingRooms = useMemo(
    () => filterRooms(rooms, attendees, requiredEquipment),
    [rooms, attendees, requiredEquipment]
  );

  // Clear availability when the selected room changes externally.
  useEffect(() => {
    if (previousRoomId.current !== room.id) {
      previousRoomId.current = room.id;
      setResult(null);
      setCandidate(undefined);
    }
  }, [room.id]);

  // Keep the selected room inside the filtered results.
  useEffect(() => {
    const currentRoomMatches = matchingRooms.some(
      (matchingRoom) => matchingRoom.id === room.id
    );

    if (!currentRoomMatches && matchingRooms.length > 0) {
      onRoomChange(matchingRooms[0]);
    } else if (matchingRooms.length === 0) {
      setResult(null);
      setCandidate(undefined);
    }
  }, [matchingRooms, room.id, onRoomChange]);

  const toggleEquipment = (equipment: string) => {
    setRequiredEquipment((current) =>
      current.includes(equipment)
        ? current.filter((item) => item !== equipment)
        : [...current, equipment]
    );

    setResult(null);
    setCandidate(undefined);
  };

  const handleRoomSelection = (roomId: string) => {
    const nextRoom = matchingRooms.find(
      (matchingRoom) => matchingRoom.id === roomId
    );

    if (!nextRoom) return;

    onRoomChange(nextRoom);

    // Clear old result immediately.
    setResult(null);
    setCandidate(undefined);

    // Recalculate if valid time inputs already exist.
    const start = parseTimeInput(startInput.trim());
    const end = parseTimeInput(endInput.trim());

    if (start === null || end === null) return;

    const currentNow = getNowMinutes();
    setNowMin(currentNow);

    const nextResult = checkAvailability(
      nextRoom,
      start,
      end,
      currentNow
    );

    setResult(nextResult);

    setCandidate(
      nextResult.available ||
      nextResult.reason === 'overlap' ||
      nextResult.reason === 'out_of_hours'
        ? { start, end }
        : undefined
    );
  };

  const handleCheck = useCallback(() => {
    if (matchingRooms.length === 0) {
      setResult(null);
      setCandidate(undefined);
      return;
    }

    if (
      !Number.isInteger(attendees) ||
      attendees < 1 ||
      attendees > 30
    ) {
      setResult({
        available: false,
        reason: 'invalid_range',
        message: 'Attendees must be a whole number between 1 and 30.',
      });
      setCandidate(undefined);
      return;
    }

    const currentNow = getNowMinutes();
    setNowMin(currentNow);

    if (!startInput.trim() || !endInput.trim()) {
      setResult({
        available: false,
        reason: 'invalid_range',
        message: 'Please enter both a start and end time.',
      });
      setCandidate(undefined);
      return;
    }

    const start = parseTimeInput(startInput.trim());
    const end = parseTimeInput(endInput.trim());

    if (start === null || end === null) {
      setResult({
        available: false,
        reason: 'invalid_range',
        message: 'Times must be in the format like 9:00 AM or 2:30 PM.',
      });
      setCandidate(undefined);
      return;
    }

    const res = checkAvailability(room, start, end, currentNow);

    setResult(res);

    applyAvailabilityResult(res, start, end);
  }, [
    startInput,
    endInput,
    room,
    matchingRooms.length,
    attendees,
  ]);

  const duration = (() => {
    const s = parseTimeInput(startInput.trim());
    const e = parseTimeInput(endInput.trim());

    if (s === null || e === null || e <= s) return null;

    return e - s;
  })();

  return (
    <div className="space-y-4">
      {matchingRooms.length > 0 ? (
        <Timeline
          room={room}
          candidateStart={candidate?.start}
          candidateEnd={candidate?.end}
          nowMinutes={nowMin}
        />
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-800">
            No matching rooms
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Change your attendee or equipment requirements to see available rooms.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-slate-600" />
          <h2 className="text-base font-semibold text-slate-800">
            Check Availability
          </h2>
        </div>

        {/* Attendees */}
        <div className="mb-4">
          <label
            htmlFor="attendees"
            className="mb-1.5 block text-sm font-medium text-slate-600"
          >
            Required attendees
          </label>

          <input
            id="attendees"
            type="number"
            min="1"
            max="30"
            step="1"
            value={attendees}
            onChange={(e) => {
              const value = e.target.value === ''
                ? 0
                : Number(e.target.value);

              setAttendees(value);
              setResult(null);
              setCandidate(undefined);
            }}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />

          {(attendees < 1 || attendees > 30 || !Number.isInteger(attendees)) && (
            <p className="mt-1 text-xs text-amber-600">
              Enter a whole number between 1 and 30.
            </p>
          )}
        </div>

        {/* Equipment */}
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-slate-600">
            Required equipment
          </p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              EQUIPMENT_OPTIONS.map((equipment) => (
              <label
                key={equipment}
                className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={requiredEquipment.includes(equipment)}
                  onChange={() => toggleEquipment(equipment)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className="capitalize">{equipment}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Matching rooms */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-700">
            Matching rooms
          </p>
        
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {matchingRooms.length} found
          </span>
        </div>

        

        {/* Room selection */}
        <div className="mb-4">
          <label
            htmlFor="selected-room"
            className="mb-1.5 block text-sm font-medium text-slate-600"
          >
            Select room
          </label>

          {matchingRooms.length > 0 ? (
            <select
              id="selected-room"
              value={room.id}
              onChange={(e) => handleRoomSelection(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              {matchingRooms.map((matchingRoom) => (
                <option key={matchingRoom.id} value={matchingRoom.id}>
                  {matchingRoom.name} — Capacity: {matchingRoom.capacity}
                  {matchingRoom.blocked ? ' (Blocked)' : ''}
                </option>
              ))}
            </select>
          ) : (
            <div
              role="status"
              className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center"
            >
              <div className="mb-2 flex justify-center">
                <AlertCircle className="h-8 w-8 text-amber-600" />
              </div>
            
              <h3 className="text-sm font-semibold text-amber-800">
                No matching rooms found
              </h3>
            
              <p className="mt-1 text-sm text-amber-700">
                No rooms currently meet your attendee and equipment requirements.
              </p>
            
              <p className="mt-2 text-xs text-amber-600">
                Try reducing the number of attendees or removing an equipment requirement.
              </p>
            </div>
          )}
        </div>

        {/* Time inputs */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="start-time"
              className="mb-1.5 block text-sm font-medium text-slate-600"
            >
              Start time
            </label>

            <input
              id="start-time"
              type="text"
              value={startInput}
              onChange={(e) => {
                setStartInput(e.target.value);
                setResult(null);
                setCandidate(undefined);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCheck();
              }}
              placeholder="e.g. 10:30 AM"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label
              htmlFor="end-time"
              className="mb-1.5 block text-sm font-medium text-slate-600"
            >
              End time
            </label>

            <input
              id="end-time"
              type="text"
              value={endInput}
              onChange={(e) => {
                setEndInput(e.target.value);
                setResult(null);
                setCandidate(undefined);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCheck();
              }}
              placeholder="e.g. 11:30 AM"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>

        {/* Room information */}
        {matchingRooms.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <span>
              Room hours: {minutesToLabel(room.openTime)}–
              {minutesToLabel(room.closeTime)}
            </span>
            <span>Max duration: {durationLabel(MAX_DURATION)}</span>

            {duration !== null && (
              <span className={duration > MAX_DURATION
                ? 'font-medium text-amber-600'
                : 'text-slate-500'}
              >
                Your duration: {durationLabel(duration)}
              </span>
            )}
          </div>
        )}

        <button
          onClick={handleCheck}
          disabled={
            matchingRooms.length === 0 ||
            attendees < 1 ||
            attendees > 30 ||
            !Number.isInteger(attendees)
          }
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          <Clock className="h-4 w-4" />
          Check Availability
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-2xl border p-4 shadow-sm transition sm:p-6 ${
            result.available
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-amber-200 bg-amber-50'
          }`}
        >
          <div className="flex items-start gap-3">
            {result.available ? (
              <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-600" />
            )}

            <div>
              <p
                className={`text-sm font-bold ${
                  result.available
                    ? 'text-emerald-800'
                    : 'text-amber-800'
                }`}
              >
                {result.available ? 'Available' : 'Unavailable'}
              </p>

              <p className="mt-0.5 text-sm text-slate-700">
                {result.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
