import { useState, useCallback } from 'react';
import { Clock, AlertCircle, CheckCircle2, CalendarClock } from 'lucide-react';
import type { Room, AvailabilityResult } from '@/lib/availability';
import {
  checkAvailability,
  getNowMinutes,
  minutesToLabel,
  durationLabel,
  MAX_DURATION,
  MINUTES_IN_DAY,
} from '@/lib/availability';
import Timeline from './Timeline';

interface AvailabilityFormProps {
  room: Room;
}

function parseTimeInput(value: string): number | null {
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

function toTimeInput(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h < 12 ? 'AM' : 'PM';
  const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${dh}:${m.toString().padStart(2, '0')} ${period}`;
}

export default function AvailabilityForm({ room }: AvailabilityFormProps) {
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [candidate, setCandidate] = useState<{ start: number; end: number } | undefined>(undefined);
  const [nowMin, setNowMin] = useState(getNowMinutes());

  const handleCheck = useCallback(() => {
    const currentNow = getNowMinutes();
    setNowMin(currentNow);

    if (!startInput.trim() || !endInput.trim()) {
      setResult({ available: false, reason: 'invalid_range', message: 'Please enter both a start and end time.' });
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
    setCandidate(res.available || res.reason === 'overlap' || res.reason === 'out_of_hours'
      ? { start, end }
      : undefined);
  }, [startInput, endInput, room]);

  const duration = (() => {
    const s = parseTimeInput(startInput.trim());
    const e = parseTimeInput(endInput.trim());
    if (s === null || e === null || e <= s) return null;
    return e - s;
  })();

  return (
    <div className="space-y-4">
      <Timeline room={room} candidateStart={candidate?.start} candidateEnd={candidate?.end} nowMinutes={nowMin} />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-slate-600" />
          <h2 className="text-base font-semibold text-slate-800">Check Availability</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="start-time" className="mb-1.5 block text-sm font-medium text-slate-600">
              Start time
            </label>
            <input
              id="start-time"
              type="text"
              value={startInput}
              onChange={(e) => { setStartInput(e.target.value); setResult(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCheck(); }}
              placeholder="e.g. 10:30 AM"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div>
            <label htmlFor="end-time" className="mb-1.5 block text-sm font-medium text-slate-600">
              End time
            </label>
            <input
              id="end-time"
              type="text"
              value={endInput}
              onChange={(e) => { setEndInput(e.target.value); setResult(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCheck(); }}
              placeholder="e.g. 11:30 AM"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
          <span>Room hours: {minutesToLabel(room.openTime)}–{minutesToLabel(room.closeTime)}</span>
          <span>Max duration: {durationLabel(MAX_DURATION)}</span>
          {duration !== null && (
            <span className={duration > MAX_DURATION ? 'font-medium text-amber-600' : 'text-slate-500'}>
              Your duration: {durationLabel(duration)}
            </span>
          )}
        </div>

        <button
          onClick={handleCheck}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 active:scale-[0.99] sm:w-auto"
        >
          <Clock className="h-4 w-4" />
          Check Availability
        </button>
      </div>

      {result && (
        <div
          className={`rounded-2xl border p-5 shadow-sm transition sm:p-6 ${
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
                  result.available ? 'text-emerald-800' : 'text-amber-800'
                }`}
              >
                {result.available ? 'Available' : 'Unavailable'}
              </p>
              <p className="mt-0.5 text-sm text-slate-700">{result.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
