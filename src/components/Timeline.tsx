import { useMemo } from 'react';
import type { Room, Booking } from '@/lib/availability';
import { minutesToLabel, MINUTES_IN_DAY } from '@/lib/availability';

interface TimelineProps {
  room: Room;
  candidateStart?: number;
  candidateEnd?: number;
  nowMinutes: number;
}

const START_HOUR = 8;
const END_HOUR = 22;
const SPAN_MIN = START_HOUR * 60;
const SPAN_MAX = END_HOUR * 60;
const SPAN = SPAN_MAX - SPAN_MIN;

// Each hour gets a generous pixel width so the timeline never crams.
const HOUR_PX = 56;
const TRACK_WIDTH = (END_HOUR - START_HOUR) * HOUR_PX;

function xPos(min: number): number {
  return ((min - SPAN_MIN) / 60) * HOUR_PX;
}

const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

export default function Timeline({ room, candidateStart, candidateEnd, nowMinutes }: TimelineProps) {
  const nowX = useMemo(() => {
    if (nowMinutes < SPAN_MIN || nowMinutes > SPAN_MAX) return null;
    return xPos(nowMinutes);
  }, [nowMinutes]);

  const candidateVisible =
    candidateStart !== undefined &&
    candidateEnd !== undefined &&
    candidateStart >= 0 && candidateEnd <= MINUTES_IN_DAY &&
    candidateStart < candidateEnd &&
    candidateStart >= SPAN_MIN && candidateEnd <= SPAN_MAX;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-700">Today's Schedule</h2>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-slate-300 ring-1 ring-slate-400" /> Booked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border-2 border-emerald-500 bg-emerald-200" /> Your request
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-0.5 bg-rose-500" />
            <span className="h-3 w-3 rounded-full bg-rose-500" /> Now
          </span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div style={{ minWidth: TRACK_WIDTH }}>
          {/* Gridlines layer */}
          <div className="relative" style={{ height: 0 }}>
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute top-0 w-px bg-slate-100"
                style={{ left: xPos(h * 60), height: 64 }}
              />
            ))}
          </div>

          {/* Track + bookings */}
          <div className="relative" style={{ height: 56 }}>
            {/* Base track */}
            <div className="absolute inset-x-0 top-3 h-10 rounded-xl bg-slate-50 ring-1 ring-slate-200" />

            {/* Hour gridlines on track */}
            {HOURS.map((h) => (
              <div
                key={`grid-${h}`}
                className="absolute top-3 w-px bg-slate-200"
                style={{ left: xPos(h * 60), height: 40 }}
              />
            ))}

            {/* Booking segments */}
            {room.bookings.map((b: Booking) => {
              const left = xPos(Math.max(b.start, SPAN_MIN));
              const right = xPos(Math.min(b.end, SPAN_MAX));
              const width = right - left;
              const canShowTitle = width > 48;
              return (
                <div
                  key={b.id}
                  className="absolute top-3 flex h-10 items-center overflow-hidden rounded-lg bg-slate-300 px-2 shadow-sm ring-1 ring-slate-400/50"
                  style={{ left, width }}
                  title={`${b.title} — ${minutesToLabel(b.start)} to ${minutesToLabel(b.end)}`}
                >
                  {canShowTitle && (
                    <span className="truncate text-[11px] font-semibold text-slate-700">{b.title}</span>
                  )}
                </div>
              );
            })}

            {/* Candidate interval */}
            {candidateVisible && candidateStart !== undefined && candidateEnd !== undefined && (
              <div
                className="absolute top-3 flex h-10 items-center justify-center overflow-hidden rounded-lg border-2 border-emerald-500 bg-emerald-200/70"
                style={{ left: xPos(candidateStart), width: xPos(candidateEnd) - xPos(candidateStart) }}
              >
                <span className="truncate text-[11px] font-semibold text-emerald-800">Requested</span>
              </div>
            )}

            {/* Now indicator */}
            {nowX !== null && (
              <div className="absolute top-0 z-20" style={{ left: nowX }}>
                <div className="flex flex-col items-center">
                  <div className="mb-0.5 rounded-md bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap text-white shadow-sm">
                    Now {minutesToLabel(nowMinutes)}
                  </div>
                  <div className="h-14 w-0.5 bg-rose-500" />
                  <div className="-mt-0.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                </div>
              </div>
            )}
          </div>

          {/* Hour labels */}
          <div className="relative mt-1" style={{ height: 18 }}>
            {HOURS.map((h) => {
              const isEven = h % 2 === 0;
              return (
                <div
                  key={`label-${h}`}
                  className="absolute -translate-x-1/2"
                  style={{ left: xPos(h * 60) }}
                >
                  <span className={isEven ? 'text-[10px] font-semibold text-slate-500' : 'text-[9px] text-slate-300'}>
                    {h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        {room.bookings.length} booking{room.bookings.length !== 1 ? 's' : ''} today
        {nowX === null && ' · current time is outside room hours'}
      </p>
    </div>
  );
}
