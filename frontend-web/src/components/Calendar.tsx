import { useEffect, useMemo, useState } from "react";

const API = "http://34.75.5.236:4000";
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

type DayInfo = {
  date: string;        // YYYY-MM-DD
  weekday: string;     // "Lunes" etc
  plannedCount: number;
  sessionsCount: number;
  scheduled: boolean;
  done: boolean;
};

export default function Calendar({ usuarioId }: { usuarioId: number }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [days, setDays] = useState<DayInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const firstDay = useMemo(() => new Date(year, month - 1, 1), [year, month]);
  const lastDay  = useMemo(() => new Date(year, month, 0), [year, month]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const res = await fetch(`${API}/calendar/${usuarioId}?year=${year}&month=${month}`);
      const data = await res.json();
      if (!mounted) return;
      setDays(Array.isArray(data?.days) ? data.days : []);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [usuarioId, year, month]);

  const startOffset = useMemo(() => {
    // Semana empieza en Lunes
    const dow = (firstDay.getDay() + 6) % 7; // 0..6, Lunes=0
    return dow;
  }, [firstDay]);

  const weeksGrid = useMemo(() => {
    const cells: (DayInfo | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (const d of days) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [days, startOffset]);

  const prevMonth = () => {
    const m = month - 1;
    if (m < 1) { setMonth(12); setYear((y) => y - 1); } else setMonth(m);
  };
  const nextMonth = () => {
    const m = month + 1;
    if (m > 12) { setMonth(1); setYear((y) => y + 1); } else setMonth(m);
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-[#101010] p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-semibold">📆 Calendario</h4>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="px-2 py-1 rounded bg-gray-800">◀</button>
          <div className="text-sm text-gray-300">
            {firstDay.toLocaleString(undefined, { month: "long", year: "numeric" })}
          </div>
          <button onClick={nextMonth} className="px-2 py-1 rounded bg-gray-800">▶</button>
        </div>
      </div>

      {loading ? (
        <div className="h-40 bg-gray-900 animate-pulse rounded" />
      ) : (
        <>
          <div className="grid grid-cols-7 gap-2 text-xs text-gray-400 mb-2">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center">{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weeksGrid.map((row, ri) => (
              <div key={ri} className="contents">
                {row.map((cell, ci) => {
                  if (!cell) return <div key={ci} className="h-20 md:h-24 rounded border border-gray-900 bg-black" />;
                  const dayNum = Number(cell.date.slice(-2));
                  const status = cell.done ? "done" : (cell.scheduled ? "planned" : "empty");
                  const cls =
                    status === "done"
                      ? "bg-green-900/30 border-green-600"
                      : status === "planned"
                      ? "bg-blue-900/20 border-blue-600"
                      : "bg-black border-gray-900";
                  return (
                    <div key={ci} className={`h-20 md:h-24 rounded border ${cls} p-2`}>
                      <div className="text-right text-xs text-gray-300">{dayNum}</div>
                      <div className="text-[10px] text-gray-400">
                        {cell.scheduled ? `${cell.plannedCount} prog.` : ""}
                        {cell.done ? ` • ${cell.sessionsCount} ses.` : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400 mt-3">
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 inline-block rounded border border-blue-600 bg-blue-900/20" /> Programado
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 inline-block rounded border border-green-600 bg-green-900/30" /> Hecho
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 inline-block rounded border border-gray-900 bg-black" /> Vacío
            </span>
          </div>
        </>
      )}
    </div>
  );
}
