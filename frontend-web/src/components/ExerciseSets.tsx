import { useEffect, useMemo, useState } from "react";

const API = "http://34.75.5.236:4000";

type Serie = {
  id?: number;
  sesionId: number;
  ejercicio: string;
  setNumber: number;
  reps?: number | null;
  peso?: number | null;
  rpe?: number | null;
  completado?: boolean;
};

export default function ExerciseSets({
  sesionId,
  ejercicio,
  usuarioId,
  defaultSets = 3,
}: {
  sesionId: number;
  ejercicio: string;
  usuarioId: number;
  defaultSets?: number;
}) {
  const [series, setSeries] = useState<Serie[]>([]);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState<number>(0); // segundos
  const [historial, setHistorial] = useState<any[]>([]);

  // cargar series ya existentes
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/series?sesionId=${sesionId}&ejercicio=${encodeURIComponent(ejercicio)}`);
        const data = await res.json();

        if (!mounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setSeries(data);
        } else {
          // sets vacíos por defecto
          const rows: Serie[] = Array.from({ length: defaultSets }).map((_, idx) => ({
            sesionId,
            ejercicio,
            setNumber: idx + 1,
          }));
          setSeries(rows);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [sesionId, ejercicio, defaultSets]);

  // historial rápido
  useEffect(() => {
    (async () => {
      const res = await fetch(`${API}/historial/${usuarioId}/${encodeURIComponent(ejercicio)}`);
      const data = await res.json();
      setHistorial(Array.isArray(data) ? data : []);
    })();
  }, [usuarioId, ejercicio]);

  // cronómetro simple
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const addSet = () => {
    const next = (series?.[series.length - 1]?.setNumber || 0) + 1;
    setSeries((prev) => [...prev, { sesionId, ejercicio, setNumber: next }]);
  };

  const removeSet = (setNumber: number) => {
    setSeries((prev) => prev.filter((s) => s.setNumber !== setNumber));
  };

  const saveSerie = async (s: Serie) => {
    await fetch(`${API}/series`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
  };

  const markDone = async (s: Serie) => {
    const updated = { ...s, completado: !s.completado };
    setSeries((prev) =>
      prev.map((x) => (x.setNumber === s.setNumber ? updated : x))
    );
    await saveSerie(updated);
    // iniciar descanso 90s cuando marcamos como hecho
    if (updated.completado) setTimer(90);
  };

  const onChange = async (setNumber: number, field: "reps" | "peso" | "rpe", value: string) => {
    const parsed =
      field === "reps" ? parseInt(value || "0") :
      field === "peso" ? parseFloat(value || "0") :
      parseFloat(value || "0");
    const updated = series.map((s) =>
      s.setNumber === setNumber ? { ...s, [field]: Number.isFinite(parsed) ? parsed : null } : s
    );
    setSeries(updated);
  };

  const volumenTotal = useMemo(() => {
    return series.reduce((acc, s) => {
      const v = (s.peso || 0) * (s.reps || 0);
      return acc + v;
    }, 0);
  }, [series]);

  if (loading) return <div className="text-sm text-gray-400">Cargando sets...</div>;

  return (
    <div className="border border-gray-800 rounded-lg p-3 bg-[#0e0e0e]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-300">
          Descanso: <span className="font-mono">{timer}s</span>
        </div>
        <div className="text-sm text-gray-300">
          Volumen: <span className="font-semibold">{Math.round(volumenTotal)} kg·reps</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400">
              <th className="text-left py-2">Set</th>
              <th className="text-left py-2">Reps</th>
              <th className="text-left py-2">Peso (kg)</th>
              <th className="text-left py-2">RPE</th>
              <th className="text-left py-2">Hecho</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {series.map((s) => (
              <tr key={s.setNumber} className="border-t border-gray-800">
                <td className="py-2">{s.setNumber}</td>
                <td className="py-2">
                  <input
                    type="number"
                    className="bg-black border border-gray-700 rounded px-2 py-1 w-20"
                    value={s.reps ?? ""}
                    onChange={(e) => onChange(s.setNumber, "reps", e.target.value)}
                    onBlur={() => saveSerie(series.find(x => x.setNumber === s.setNumber)!)}
                    min={0}
                  />
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    className="bg-black border border-gray-700 rounded px-2 py-1 w-24"
                    value={s.peso ?? ""}
                    onChange={(e) => onChange(s.setNumber, "peso", e.target.value)}
                    onBlur={() => saveSerie(series.find(x => x.setNumber === s.setNumber)!)}
                    step="0.5"
                    min={0}
                  />
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    className="bg-black border border-gray-700 rounded px-2 py-1 w-20"
                    value={s.rpe ?? ""}
                    onChange={(e) => onChange(s.setNumber, "rpe", e.target.value)}
                    onBlur={() => saveSerie(series.find(x => x.setNumber === s.setNumber)!)}
                    min={0}
                    max={10}
                    step="0.5"
                  />
                </td>
                <td className="py-2">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-blue-500"
                    checked={!!s.completado}
                    onChange={() => markDone(s)}
                  />
                </td>
                <td className="py-2">
                  <button
                    onClick={() => removeSet(s.setNumber)}
                    className="text-xs text-gray-400 hover:text-red-400"
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={addSet}
          className="mt-3 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500"
        >
          Agregar set
        </button>
      </div>

      {/* Historial simple */}
      {historial.length > 0 && (
        <div className="mt-4 text-xs text-gray-400">
          <div className="mb-1 font-semibold text-gray-300">Últimas sesiones:</div>
          <ul className="space-y-1">
            {historial.map((s, idx) => (
              <li key={idx}>
                {new Date(s.fecha).toLocaleDateString()}:{" "}
                {s.series
                  .map((x: any) => `${x.reps ?? "-"}x${x.peso ?? "-"}kg`)
                  .join(" · ")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
