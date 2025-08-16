import { useEffect, useMemo, useState } from "react";
import ExerciseSets from "../components/ExerciseSets";
import Calendar from "../components/Calendar";
import Badges from "../components/Badges";

type Rutina = {
  id: number;
  nombre: string;
  tipo: string;
  ejercicios: string[];
  dias: string[];
};

type Progreso = {
  rutinaId: number;
  completado: boolean;
  fecha?: string;
};

const API = "http://34.75.5.236:4000";
const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function AlumnoDashboard() {
  const rawUsuario = localStorage.getItem("usuario");
  const usuario = rawUsuario ? JSON.parse(rawUsuario) : { id: 0, nombre: "Alumno" };

  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [progreso, setProgreso] = useState<Progreso[]>([]);
  const [diasVisibles, setDiasVisibles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // sesiones activas por rutina (rutinaId -> sesionId)
  const [sesiones, setSesiones] = useState<Record<number, number>>({});
  const [resumenAPI, setResumenAPI] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [rRes, pRes, sumRes] = await Promise.all([
          fetch(`${API}/rutinas/${usuario.id}`),
          fetch(`${API}/progreso/${usuario.id}`),
          fetch(`${API}/resumen/${usuario.id}`),
        ]);
        if (!rRes.ok || !pRes.ok) throw new Error("No se pudo cargar la información.");

        const [rutinasData, progresoData, resumenData] = await Promise.all([
          rRes.json(),
          pRes.json(),
          sumRes.ok ? sumRes.json() : Promise.resolve(null),
        ]);
        if (!mounted) return;

        setRutinas(rutinasData);
        setProgreso(progresoData);
        setResumenAPI(resumenData);

        // abrir primer día con algo pendiente
        const compSet = new Set(progresoData.filter((p: any) => p.completado).map((p: any) => p.rutinaId));
        const nextDay =
          DIAS_SEMANA.find((d) => rutinasData.some((r: Rutina) => r.dias.includes(d) && !compSet.has(r.id))) ||
          DIAS_SEMANA.find((d) => rutinasData.some((r: Rutina) => r.dias.includes(d))) ||
          null;
        if (nextDay) setDiasVisibles([nextDay]);
      } catch (e: any) {
        setErr(e.message || "Error inesperado");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [usuario.id]);

  const estaCompletada = (rutinaId: number) =>
    progreso.find((p) => p.rutinaId === rutinaId)?.completado || false;

  const marcarCompletada = async (rutinaId: number, completado: boolean) => {
    try {
      if (completado) {
        const res = await fetch(`${API}/progreso`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuarioId: usuario.id, rutinaId, completado: true }),
        });
        if (!res.ok) throw new Error("No se pudo marcar como completada");
        setProgreso((prev) => {
          const exists = prev.some((p) => p.rutinaId === rutinaId);
          return exists
            ? prev.map((p) => (p.rutinaId === rutinaId ? { ...p, completado: true } : p))
            : [...prev, { rutinaId, completado: true }];
        });
      } else {
        const res = await fetch(`${API}/progreso`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuarioId: usuario.id, rutinaId }),
        });
        if (!res.ok) throw new Error("No se pudo desmarcar la rutina");
        setProgreso((prev) => prev.filter((p) => p.rutinaId !== rutinaId));
      }
    } catch (e: any) {
      alert(e.message || "Error actualizando progreso");
    }
  };

  const obtenerEmbedYoutube = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const toggleDia = (dia: string) => {
    setDiasVisibles((prev) => (prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]));
  };

  const iniciarSesion = async (rutinaId: number) => {
    const res = await fetch(`${API}/sesiones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioId: usuario.id, rutinaId }),
    });
    if (!res.ok) return alert("No se pudo iniciar/continuar la sesión");
    const data = await res.json();
    setSesiones((prev) => ({ ...prev, [rutinaId]: data.id }));
  };

  const resumenQuick = useMemo(() => {
    const total = rutinas.length;
    const completadas = rutinas.filter((r) => progreso.some((p) => p.rutinaId === r.id && p.completado)).length;
    const pendientes = Math.max(0, total - completadas);
    const adherencia = total ? Math.round((completadas / total) * 100) : 0;
    return { total, completadas, pendientes, adherencia };
  }, [rutinas, progreso]);

  const resumen = resumenAPI
    ? {
        total: resumenAPI.totalRutinas,
        completadas: resumenAPI.completadas,
        pendientes: Math.max(0, (resumenAPI.totalRutinas || 0) - (resumenAPI.completadas || 0)),
        adherencia: resumenAPI.adherencia,
        seriesSemana: resumenAPI.seriesSemana,
        volumenSemana: Math.round(resumenAPI.volumenSemana || 0),
      }
    : { ...resumenQuick, seriesSemana: 0, volumenSemana: 0 };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="h-10 w-1/2 bg-gray-800 animate-pulse rounded" />
          <div className="h-24 w-full bg-gray-800 animate-pulse rounded" />
          <div className="h-48 w-full bg-gray-800 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-red-400">⚠️ {err}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Bienvenido, {usuario.nombre}</h2>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <StatCard label="Rutinas" value={resumen.total} />
          <StatCard label="Completadas" value={resumen.completadas} />
          <StatCard label="Pendientes" value={resumen.pendientes} />
          <StatCard label="Adherencia" value={`${resumen.adherencia}%`} />
          <StatCard label="Series (7d)" value={resumen.seriesSemana} />
          <StatCard label="Volumen (7d)" value={`${resumen.volumenSemana}`} />
        </div>

        {/* Acordeones superiores */}
        <details className="rounded-xl border border-gray-800 bg-[#101010] overflow-hidden">
          <summary className="list-none cursor-pointer select-none p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">📆 Calendario</div>
              <div className="text-xs text-gray-400 mt-0.5">
                Muestra por día lo programado (plan) y lo realizado (hecho).
              </div>
            </div>
            <span className="text-gray-400">▼</span>
          </summary>
          <div className="p-4 border-t border-gray-800">
            <Calendar usuarioId={usuario.id} />
          </div>
        </details>

        <details className="rounded-xl border border-gray-800 bg-[#101010] overflow-hidden">
          <summary className="list-none cursor-pointer select-none p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">🏅 Rachas e Insignias</div>
              <div className="text-xs text-gray-400 mt-0.5">
                Racha = días seguidos con sesión; insignias por constancia y rachas.
              </div>
            </div>
            <span className="text-gray-400">▼</span>
          </summary>
          <div className="p-4 border-t border-gray-800">
            <Badges usuarioId={usuario.id} />
          </div>
        </details>

        {/* Rutinas por día (acordeón abierto por defecto) */}
        <details className="rounded-xl border border-gray-800 bg-[#101010] overflow-hidden" open>
          <summary className="list-none cursor-pointer select-none p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">🏋️‍♂️ Tus Rutinas por Día</div>
              <div className="text-xs text-gray-400 mt-0.5">
                Abre el día, inicia sesión y registra tus sets (reps/peso/RPE). Marca la rutina al finalizar.
              </div>
            </div>
            <span className="text-gray-400">▼</span>
          </summary>

          <div className="p-4 border-t border-gray-800">
            {DIAS_SEMANA.map((dia) => {
              const rutinasDia = rutinas.filter((r) => r.dias.includes(dia));
              if (rutinasDia.length === 0) return null;
              const pendientesDia = rutinasDia.filter((r) => !estaCompletada(r.id)).length;

              return (
                <div key={dia} className="mb-6">
                  <h4
                    className="text-lg font-bold cursor-pointer text-blue-400 border-b border-gray-700 pb-1 mb-3 flex items-center justify-between"
                    onClick={() => toggleDia(dia)}
                    role="button"
                    aria-expanded={diasVisibles.includes(dia)}
                  >
                    <span>📅 {dia}</span>
                    <span className="text-sm text-gray-400">
                      {pendientesDia === 0 ? "Todo completo ✅" : `${pendientesDia} pendiente(s)`}
                    </span>
                  </h4>

                  {diasVisibles.includes(dia) && (
                    <div className="space-y-6">
                      {rutinasDia.map((rutina) => (
                        <div
                          key={rutina.id}
                          className="bg-[#121212] p-5 rounded-xl border border-gray-800 shadow-md"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                            <div>
                              <h5 className="text-lg font-bold">
                                {rutina.nombre}{" "}
                                <span className="text-sm text-gray-400">({rutina.tipo})</span>
                              </h5>
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => iniciarSesion(rutina.id)}
                                className="px-3 py-1 rounded bg-green-600 hover:bg-green-500"
                              >
                                {sesiones[rutina.id] ? "Continuar sesión" : "Iniciar sesión"}
                              </button>

                              <div className="flex items-center gap-2">
                                <label className="text-sm font-medium">✅ Completado</label>
                                <input
                                  type="checkbox"
                                  checked={estaCompletada(rutina.id)}
                                  onChange={(e) => marcarCompletada(rutina.id, e.target.checked)}
                                  className="h-5 w-5 accent-blue-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Vídeos + Sets */}
                          <div className="space-y-4 mt-4">
                            {rutina.ejercicios.map((e, i) => {
                              const embed = obtenerEmbedYoutube(e);
                              return (
                                <div key={i} className="space-y-2">
                                  {embed ? (
                                    // Contenedor 16:9. El CSS .embed-frame hace que el iframe ocupe TODO
                                    <div className="embed-frame">
                                      <iframe
                                        src={embed}
                                        title={`video-${rutina.id}-${i}`}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        loading="lazy"
                                      />
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-300 ml-2">• {e}</p>
                                  )}

                                  <a
                                    href={e}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-gray-400 underline"
                                  >
                                    Abrir en YouTube
                                  </a>

                                  {sesiones[rutina.id] && (
                                    <ExerciseSets
                                      sesionId={sesiones[rutina.id]}
                                      ejercicio={e}
                                      usuarioId={usuario.id}
                                      defaultSets={3}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {rutinas.length === 0 && (
              <p className="text-gray-400">No tienes rutinas asignadas.</p>
            )}
          </div>
        </details>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-[#101010] p-4">
      <div className="text-sm text-gray-400">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
