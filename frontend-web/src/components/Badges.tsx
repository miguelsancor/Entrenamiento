import { useEffect, useState } from "react";
const API = "http://34.75.5.236:4000";

type Streaks = { currentStreak: number; longestStreak: number; activeDays: number };
type Badge = { code: string; label: string };

export default function Badges({ usuarioId }: { usuarioId: number }) {
  const [streaks, setStreaks] = useState<Streaks | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [weekSessions, setWeekSessions] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const res = await fetch(`${API}/badges/${usuarioId}`);
      const data = await res.json();
      if (data?.streaks) setStreaks(data.streaks);
      if (Array.isArray(data?.badges)) setBadges(data.badges);
      if (typeof data?.weekSessions === "number") setWeekSessions(data.weekSessions);
    })();
  }, [usuarioId]);

  return (
    <div className="rounded-xl border border-gray-800 bg-[#101010] p-4">
      <h4 className="text-lg font-semibold mb-2">🏅 Rachas e Insignias</h4>
      {streaks ? (
        <div className="text-sm text-gray-300 mb-3">
          <div>Racha actual: <span className="font-semibold">{streaks.currentStreak} día(s)</span></div>
          <div>Racha histórica: <span className="font-semibold">{streaks.longestStreak} día(s)</span></div>
          <div>Días activos (180d): <span className="font-semibold">{streaks.activeDays}</span></div>
          <div>Sesiones esta semana: <span className="font-semibold">{weekSessions}</span></div>
        </div>
      ) : (
        <div className="h-10 bg-gray-900 animate-pulse rounded mb-3" />
      )}

      <div className="flex flex-wrap gap-2">
        {badges.length === 0 ? (
          <span className="text-xs text-gray-400">Sin insignias aún. ¡A entrenar! 💪</span>
        ) : badges.map((b) => (
          <span key={b.code} className="px-2 py-1 rounded-full text-xs border border-blue-600 bg-blue-900/20">
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
