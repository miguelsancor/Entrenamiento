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
      const res = await fetch(`http://localhost:4000/rutinas/${usuario.id}`);
      const data = await res.json();
      setRutinas(data);
    };

    const cargarProgreso = async () => {
      const res = await fetch(`http://localhost:4000/progreso/${usuario.id}`);
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
    await fetch("http://localhost:4000/progreso", {
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
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-white to-blue-50">
      <div className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold text-gray-800">
          Bienvenido, {usuario.nombre}
        </h2>
        <h3 className="text-xl text-gray-600 mb-4">🏋️‍♂️ Tus Rutinas Asignadas</h3>

        {rutinas.map((rutina) => (
          <div
            key={rutina.id}
            className="bg-white p-4 rounded-xl shadow-md border border-gray-200"
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">
                  {rutina.nombre} <span className="text-sm text-gray-500">({rutina.tipo})</span>
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  <strong>Días:</strong> {rutina.dias.join(", ")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Completado</label>
                <input
                  type="checkbox"
                  checked={estaCompletada(rutina.id)}
                  onChange={(e) =>
                    marcarCompletada(rutina.id, e.target.checked)
                  }
                  className="h-5 w-5"
                />
              </div>
            </div>

            <ul className="mt-3 list-disc ml-6 text-sm text-gray-700 space-y-1">
              {rutina.ejercicios.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        ))}

        {rutinas.length === 0 && (
          <p className="text-gray-500">No tienes rutinas asignadas.</p>
        )}
      </div>
    </div>
  );
}
