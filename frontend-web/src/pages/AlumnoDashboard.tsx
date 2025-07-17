import { useEffect, useState } from "react";

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
};

export default function AlumnoDashboard() {
  const usuario = JSON.parse(localStorage.getItem("usuario")!);
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [progreso, setProgreso] = useState<Progreso[]>([]);

  useEffect(() => {
    const cargarRutinas = async () => {
      const res = await fetch(`http://34.75.5.236:4000/rutinas/${usuario.id}`);
      const data = await res.json();
      setRutinas(data);
    };

    const cargarProgreso = async () => {
      const res = await fetch(`http://34.75.5.236:4000/progreso/${usuario.id}`);
      const data = await res.json();
      setProgreso(data);
    };

    cargarRutinas();
    cargarProgreso();
  }, [usuario.id]);

  const estaCompletada = (rutinaId: number) => {
    return progreso.find((p) => p.rutinaId === rutinaId)?.completado || false;
  };

  const marcarCompletada = async (rutinaId: number, completado: boolean) => {
    if (completado) {
      await fetch("http://34.75.5.236:4000/progreso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: usuario.id,
          rutinaId,
          completado,
        }),
      });

      setProgreso((prev) =>
        prev.map((p) =>
          p.rutinaId === rutinaId ? { ...p, completado } : p
        ).concat(
          progreso.find((p) => p.rutinaId === rutinaId)
            ? []
            : [{ rutinaId, completado }]
        )
      );
    } else {
      await fetch("http://34.75.5.236:4000/progreso", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: usuario.id,
          rutinaId,
        }),
      });

      setProgreso((prev) =>
        prev.filter((p) => p.rutinaId !== rutinaId)
      );
    }
  };

  const obtenerEmbedYoutube = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className="text-3xl font-bold text-white">
          Bienvenido, {usuario.nombre}
        </h2>
        <h3 className="text-xl font-semibold text-white">
          🏋️‍♂️ Tus Rutinas Asignadas
        </h3>

        {rutinas.map((rutina) => (
          <div
            key={rutina.id}
            className="bg-[#1a1a1a] p-5 rounded-xl border border-gray-700 shadow-md"
          >
            <div className="flex justify-between items-center mb-3">
              <div>
                <h4 className="text-lg font-bold text-white">
                  {rutina.nombre}{" "}
                  <span className="text-sm text-gray-400">
                    ({rutina.tipo})
                  </span>
                </h4>
                <p className="text-sm text-gray-300 mt-1">
                  <strong>Días:</strong> {rutina.dias.join(", ")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-white font-medium">✅ Completado</label>
                <input
                  type="checkbox"
                  checked={estaCompletada(rutina.id)}
                  onChange={(e) => marcarCompletada(rutina.id, e.target.checked)}
                  className="h-5 w-5 accent-blue-500"
                />
              </div>
            </div>

            <div className="space-y-4 mt-4">
              {rutina.ejercicios.map((e, i) => {
                const embed = obtenerEmbedYoutube(e);
                return embed ? (
                  <a
                    key={i}
                    href={e}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <iframe
                      src={embed}
                      className="iframe"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </a>
                ) : (
                  <p key={i} className="text-sm text-gray-300 ml-2">• {e}</p>
                );
              })}
            </div>
          </div>
        ))}

        {rutinas.length === 0 && (
          <p className="text-gray-400">No tienes rutinas asignadas.</p>
        )}
      </div>
    </div>
  );
}
